"""
Live regression: runs ~940 real searches against a running site and checks
every card on every page.

    python3 scripts/live-regression.py [BASE_URL]      (default: the live site)

Searches: every country in the list for 7 days of regular use; 25 common
destinations x 6 usages x 4 trip lengths; 30 multi-country trips x 3 usages.

Checks, per page:
- the list is in price order, cheapest first (the default), in each section;
- every card has a link, and no link appears twice on a page;
- aloSIM links carry a plan id, our affiliate and offer ids, a source id and
  the page's current Hebrew address (/he/destinations/…);
- Yesim links have the plan-page shape, match the card's days and data, exist
  in Yesim's Prices API, and the shekel price matches the API's euro price at
  one exchange rate for the whole run (catches a wrong price or a wrong plan);
- the multi-country "combination" card links to each plan, not to nothing.

Then, once per aloSIM page linked (about 200): the link opens that page with
no redirect — aloSIM's redirect from the old addresses drops the plan and our
affiliate id in Hebrew (found 28 September 2026). On a sample of 25 pages,
the page is loaded and the plan in the link must be the one it opens on
(aria-pressed on that plan). Yesim's pages cannot be checked this way; they
answer automated clients with an empty page, so Yesim is checked by hand.
ZenSim cards: the link has our affiliate id and the card's data and days; on a
sample of 25 of their pages, the list price is read again and every card from
that page must show it, at one exchange rate for the run.
Exchange rates: the rates on /api/status (those prices are converted at, and
those the "before you go" facts quote) are fresh and within 2% of the Bank of
Israel's representative rates, and the rates implied by Yesim's and ZenSim's
cards are within 5% of them.
Exit status 1 when anything is found. Written 28 September 2026 after the
owner asked for "a full regression, so we don't fall into this again".
"""
import concurrent.futures as cf, json, re, html, subprocess, sys, itertools, statistics, collections as C, urllib.parse as U
import os, datetime, time
BASE=(sys.argv[1] if len(sys.argv)>1 else 'https://www.yeshklita.com').rstrip('/')
OUT=os.environ.get('REGRESSION_OUT','/tmp/live-regression.json')
YESIM=json.loads(subprocess.run(['curl','-sS','-m','90','https://api.yesim.app/api_v0.1/api/prices?partner=5581'],capture_output=True,text=True).stdout)
_countries=open(os.path.join(os.path.dirname(__file__),'..','src','data','countries.generated.ts')).read()
codes=sorted(set(re.findall(r"code: '([A-Z]{2})'",_countries)))
usages=['navigation','light','regular','heavy','hotspot','unlimited']
matrix_c=['JP','TH','US','GB','FR','IT','GR','TR','AE','CY','ES','DE','EG','IN','GE','PT','NL','MX','BR','AU','CN','VN','KR','CA','MA']
combos=[('FR','IT'),('FR','ES'),('IT','GR'),('DE','AT','CH'),('TH','VN'),('TH','KH'),('JP','KR'),('US','CA'),('US','MX'),('GB','FR'),('ES','PT'),('GR','CY'),('TR','GR'),('AE','OM'),('EG','JO'),('IN','NP'),('SG','MY','TH'),('AU','NZ'),('BR','AR'),('NL','BE','LU'),('CZ','AT','HU'),('HR','SI'),('PL','CZ'),('SE','NO','DK'),('IS','GB'),('CN','HK'),('JP','TH'),('US','GB'),('IL','CY'),('GE','AM')]
jobs=[]
for c in codes: jobs.append(([(c,7)],'regular'))
for c,u,d in itertools.product(matrix_c,usages,[3,7,14,30]): jobs.append(([(c,d)],u))
for cb in combos:
    for u in ['light','regular','hotspot']: jobs.append(([(x,5) for x in cb],u))
yes_by_key={}
rates_med=None; zmed_all=None
for p in YESIM:
    base=p['directLink'].rstrip('/').replace('https://yesim.app','')
    cap=p['capacity']; mb=int(cap) if cap!='-1' else -1
    allow='unlimited' if mb==-1 else (f"{mb//1024}gb" if mb%1024==0 else f"{mb}mb")
    yes_by_key[(base,int(p['period']),allow)]=float(p['price'])
def parse(s):
    rows=[]
    for m in re.finditer(r'<article.*?</article>',s,re.S):
        a=m.group(0)
        if '🧩' in a:
            # The combination card: one link per leg, no plan headline.
            legs=len(re.findall(r'<li',a)); links=len(re.findall(r'href="https://(?:yesim\.app|alosim\.com|zensim\.com)',a))
            rows.append({'combo':True,'legs':legs,'links':links,'ok':True}); continue
        face=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',a.split('עוד פרטים')[0])))
        h=re.search(r'(ללא הגבלה|([\d.]+)(GB|MB))\s*·\s*,?\s*(\d+)\s*(ימים|יום)',face)
        pr=re.search(r'בערך\s*₪\s?([\d,]+(?:\.\d+)?)',face) or re.search(r'₪\s?([\d,]+(?:\.\d+)?)',face)
        link=re.search(r'href="(https://(?:yesim\.app|alosim\.com|zensim\.com)[^"]*)"',a)
        rows.append({'unl':bool(h) and h.group(1)=='ללא הגבלה','mb':(float(h.group(2))*(1024 if h.group(3)=='GB' else 1)) if h and h.group(2) else None,
            'days':int(h.group(4)) if h else None,'ils':float(pr.group(1).replace(',','')) if pr else None,
            'status':'fits' if 'מספיק לכל הטיול' in face else 'short','link':html.unescape(link.group(1)) if link else None,
            'prov':(None if not link else 'yesim' if 'yesim.app' in link.group(1) else 'zensim' if 'zensim.com' in link.group(1) else 'alosim'),'ok':bool(h and pr)})
    return rows
def get(job):
    legs,u=job
    q=','.join(f'{c}:{d}' for c,d in legs)
    url=f'{BASE}/search?to={q}&usage={u}'
    s=''
    for _ in range(2):
        s=subprocess.run(['curl','-sS','-m','90',url],capture_output=True,text=True).stdout
        if s: break
    return {'q':q,'u':u,'rows':parse(s),'len':len(s)}
res=[]
with cf.ThreadPoolExecutor(6) as ex:
    for r in ex.map(get,jobs): res.append(r)
json.dump(res,open(OUT,'w'),ensure_ascii=False)
issues=C.defaultdict(list); rates=[]; alosim_links={}; zensim_cards=[]
for p in res:
    key=f"{p['q']} {p['u']}"
    if not p['len']: issues['fetch-failed'].append(key); continue
    combos=[r for r in p['rows'] if r.get('combo')]
    for c in combos:
        if c['links']<c['legs']: issues['combination-leg-without-link'].append(f"{key}: {c['links']} links for {c['legs']} legs")
    rows=[r for r in p['rows'] if not r.get('combo')]
    if any(not r['ok'] for r in rows): issues['unparsable-card'].append(key)
    fits=[r for r in rows if r['status']=='fits' and r['ok']]
    short=[r for r in rows if r['status']!='fits' and r['ok']]
    for lst,name in ((fits,'fits'),(short,'short')):
        for a,b in zip(lst,lst[1:]):
            if b['ils']<a['ils']-0.01: issues[f'order-not-by-price ({name})'].append(f"{key}: ₪{a['ils']} before ₪{b['ils']}"); break
    links=[r['link'] for r in rows if r['link']]
    if len(links)!=len(set(links)): issues['same-link-twice'].append(key)
    for r in rows:
        if not r['link']: issues['card-without-link'].append(key); continue
        u=U.urlparse(r['link']); qs=U.parse_qs(u.query)
        if r['prov']=='alosim':
            if not re.fullmatch(r'[0-9a-f]{24}',(qs.get('plan_id') or [''])[0]) or qs.get('affid')!=['1810'] or qs.get('oid')!=['9'] or not qs.get('source_id'):
                issues['alosim-link-params'].append(f"{key}: {r['link']}")
            if not u.path.startswith('/he/'): issues['alosim-not-hebrew-on-he-page'].append(f"{key}: {r['link']}")
            # The old addresses (/he/japan-esim) redirect, and in Hebrew the
            # redirect drops plan_id and affid (28 September 2026).
            elif not u.path.startswith('/he/destinations/'): issues['alosim-old-address'].append(f"{key}: {r['link']}")
            alosim_links.setdefault(u.path,r['link'])
        elif r['prov']=='zensim':
            # ZenSim: the country page on the plan's duration (the owner's
            # exception, 29 September 2026), with our affiliate id.
            pid=(qs.get('id') or [''])[0]
            m=re.fullmatch(r'USD-([A-Z]{2})-(UNLIMITED|\d+(?:\.\d+)?(?:GB|MB))-(\d+)-days?',pid)
            if not re.fullmatch(r'/travel-esims/[a-z0-9-]+/',u.path) or not m or qs.get('via')!=['yeshklita'] or qs.get('duration')!=[m.group(3) if m else '']:
                issues['zensim-link-shape'].append(f"{key}: {r['link']}"); continue
            allow=m.group(2)
            card_allow='UNLIMITED' if r['unl'] else (f"{int(r['mb'])//1024}GB" if r['mb'] and r['mb']>=1024 else f"{int(r['mb'] or 0)}MB")
            if int(m.group(3))!=r['days'] or allow!=card_allow: issues['zensim-link≠card'].append(f"{key}: card {card_allow}/{r['days']}d link {allow}/{m.group(3)}d")
            zensim_cards.append((u.path,pid,r['ils'],key,r['link']))
        else:
            m=re.fullmatch(r'(/(?:country|regions|global)/[a-z0-9-]+)/(\d+)days-([0-9a-z]+)-esim-data-plan/',u.path)
            if not m or qs.get('partner_id')!=['5581']: issues['yesim-link-shape'].append(f"{key}: {r['link']}"); continue
            base,days,allow=m.group(1),int(m.group(2)),m.group(3)
            card_allow='unlimited' if r['unl'] else (f"{int(r['mb'])//1024}gb" if r['mb'] and r['mb']>=1024 else f"{int(r['mb'] or 0)}mb")
            if days!=r['days'] or allow!=card_allow: issues['yesim-link≠card'].append(f"{key}: card {card_allow}/{r['days']}d link {allow}/{days}d")
            eur=yes_by_key.get((base,days,allow))
            if eur is None: issues['yesim-link-not-in-api'].append(f"{key}: {r['link']}")
            else: rates.append((r['ils']/eur,key,r['link'],eur,r['ils']))
# aloSIM's pages, one link per page: the link must open the page itself (a
# redirect is where plan_id got lost), and on a sample of pages the plan must
# be the one the page opens on. Only our own links are requested.
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
# One request at a time: in parallel, aloSIM's server leaves some unanswered
# (33 of 200 on 28 September 2026, all fine when asked again one by one).
# A provider's server error (502/503/504, 429) or no answer is retried, and a
# link that still fails is tried once more after every other link: the night
# of 2 October 2026 eight aloSIM links answered 502 or nothing, and all eight
# opened on a second try minutes later. A failure that survives both passes is
# reported; one that recovers is noted, so a provider whose site keeps
# stumbling still shows up in the report.
TRANSIENT=('000','429','500','502','503','504')
def alosim_status(link):
    out=''
    for attempt in range(3):
        if attempt: time.sleep(5*attempt)
        out=subprocess.run(['curl','-sS','-o','/dev/null','-I','-m','30','-A',UA,'-w','%{http_code} %{redirect_url}',link],capture_output=True,text=True).stdout or '000'
        if not out.startswith(TRANSIENT): return out
    return out
failed={}
for path,link in alosim_links.items():
    out=alosim_status(link)
    if not out.startswith('200'): failed[link]=out
if failed:
    time.sleep(60)
    recovered=[]
    for link,first in failed.items():
        out=alosim_status(link); code=out.split(' ')[0]
        if code=='200': recovered.append(f"HTTP {first.split(' ')[0]} then 200 ← {link}")
        elif code=='000': issues['alosim-no-answer (two passes)'].append(link)
        else: issues['alosim-link-does-not-open-page'].append(f"HTTP {out.strip()} ← {link}")
    if recovered: print(f'alosim: {len(recovered)} links failed at first and opened on the second pass (provider hiccup, not counted):\n  '+'\n  '.join(recovered[:10]))
sample=sorted(alosim_links.items())[datetime.date.today().toordinal()%7::max(1,len(alosim_links)//25)][:25]
for path,link in sample:
    page=subprocess.run(['curl','-sS','-L','-m','60','-A',UA,link],capture_output=True,text=True).stdout
    pid=U.parse_qs(U.urlparse(link).query).get('plan_id',[''])[0]
    m=re.search(r'<[^>]*data-package-id="'+re.escape(pid)+r'"[^>]*>',page)
    if not page: issues['alosim-page-fetch-failed'].append(link)
    elif not m: issues['alosim-plan-not-on-page'].append(link)
    elif 'aria-pressed="true"' not in m.group(0): issues['alosim-page-opens-another-plan'].append(link)
print(f'alosim: {len(alosim_links)} pages checked, {len(sample)} opened')

# ZenSim: their prices are read from their pages (the owner's exception). On a
# sample of 25 of their pages, read the same schema.org data again and check
# every card from that page shows that list price, at one USD rate for the run.
if zensim_cards:
    zpaths=sorted({c[0] for c in zensim_cards})
    zsample=zpaths[datetime.date.today().toordinal()%5::max(1,len(zpaths)//25)][:25]
    zprice={}
    for path in zsample:
        page=subprocess.run(['curl','-sS','-m','60','-r','0-307200','-A',UA,'https://zensim.com'+path],capture_output=True,text=True).stdout
        def walk(o):
            if isinstance(o,list): [walk(x) for x in o]
            elif isinstance(o,dict):
                if o.get('@type')=='Offer' and isinstance(o.get('url'),str):
                    pid=U.parse_qs(U.urlparse(o['url']).query).get('id',[''])[0]
                    if pid: zprice[pid]=float(o.get('price') or 0)
                [walk(x) for x in o.values()]
        for blk in re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>',page,re.S):
            try: walk(json.loads(blk))
            except ValueError: pass
    zrates=[]
    for path,pid,ils,key,link in zensim_cards:
        if path not in zsample: continue
        if pid not in zprice: issues['zensim-plan-not-on-page'].append(f"{key}: {link}"); continue
        zrates.append((ils/zprice[pid],key,link,zprice[pid],ils))
    if zrates:
        zmed=statistics.median(x[0] for x in zrates)
        for rate,key,link,usd,ils in zrates:
            if abs(rate/zmed-1)>0.02: issues['zensim-price≠page'].append(f"{key}: ${usd} shown as ₪{ils} (rate {rate:.3f} vs {zmed:.3f}) {link}")
        print(f'zensim ILS/USD median {zmed:.4f} over {len(zrates)} cards from {len(zsample)} pages')
        zmed_all=zmed
if rates:
    med=statistics.median(x[0] for x in rates)
    for rate,key,link,eur,ils in rates:
        if abs(rate/med-1)>0.02: issues['yesim-price≠api'].append(f"{key}: €{eur} shown as ₪{ils} (rate {rate:.3f} vs {med:.3f}) {link}")
    print(f'yesim ILS/EUR median {med:.4f} over {len(rates)} cards')
    rates_med=med
# Exchange rates (the owner, 2 October 2026: "always check the exchange
# rates"). The rates the site converts prices at, and the ones its "before you
# go" facts quote, are held against the Bank of Israel's representative rates:
# fresh (the ECB publishes every business day), and within 2% — the two are
# set at different hours, never more than a fraction of a percent apart on a
# normal day. The rates actually applied to Yesim's and ZenSim's prices above
# are held against the same figures.
def check_rates():
    try:
        status=json.loads(subprocess.run(['curl','-sS','-m','60',BASE+'/api/status'],capture_output=True,text=True).stdout)
        boi=json.loads(subprocess.run(['curl','-sS','-m','60','https://www.boi.org.il/PublicApi/GetExchangeRates'],capture_output=True,text=True).stdout)
    except ValueError as e:
        issues['rates-unreadable'].append(str(e)[:120]); return
    official={r['key']:float(r['currentExchangeRate'])/float(r.get('unit') or 1) for r in boi.get('exchangeRates',[])}
    if not official: issues['rates-unreadable'].append('Bank of Israel returned no rates'); return
    rates=status.get('rates') or {}
    ecb=next((x for x in status.get('sources',[]) if x.get('id')=='ecb'),None)
    if not ecb or not ecb.get('ok'): issues['rates-ecb-not-loaded'].append(json.dumps(ecb)[:200])
    today=datetime.date.today()
    seen=0
    for name,table in (('prices',{k:v['ilsPer'] for k,v in (rates.get('prices') or {}).items()}),('local',(rates.get('local') or {}).get('ilsPer') or {})):
        for code,ils in table.items():
            if code not in official: continue
            seen+=1
            off=ils/official[code]-1
            if abs(off)>0.02: issues['rate≠bank-of-israel'].append(f"{name} {code}: ₪{ils:.4f} vs Bank of Israel ₪{official[code]:.4f} ({off:+.1%})")
    for k,v in (rates.get('prices') or {}).items():
        if v.get('source')!='api': issues['rates-not-live'].append(f"{k} from {v.get('source')}")
        age=(today-datetime.date.fromisoformat(v['asOf'])).days
        if age>5: issues['rates-stale'].append(f"{k}: ECB rate of {v['asOf']} ({age} days)")
    local=rates.get('local')
    if not local: issues['rates-local-missing'].append('no local-currency rates on /api/status')
    elif (today-datetime.date.fromisoformat(local['asOf'])).days>5: issues['rates-stale'].append(f"local rates of {local['asOf']}")
    applied=[]
    if rates_med is not None and 'EUR' in official: applied.append(('Yesim (EUR)',rates_med,official['EUR']))
    if zmed_all is not None and 'USD' in official: applied.append(('ZenSim (USD)',zmed_all,official['USD']))
    for label,used,ref in applied:
        # Prices may carry a provider's own discount or rounding, so the band is wider.
        if abs(used/ref-1)>0.05: issues['applied-rate≠bank-of-israel'].append(f"{label}: prices imply ₪{used:.4f}, Bank of Israel ₪{ref:.4f}")
    print(f"rates: {seen} checked against the Bank of Israel; applied: "+', '.join(f"{l} {u:.4f}/{r:.4f}" for l,u,r in applied))
# Every provider the site is configured with must be on it. A provider can go
# missing without a single card looking wrong — the cards checked above are
# simply the others' — and on 5 October 2026 ZenSim was off the live site
# after each deployment until a visitor happened to trigger its read. A source
# still loading is given two minutes; one that never arrives is reported.
def check_sources():
    status=None
    for attempt in range(7):
        try:
            status=json.loads(subprocess.run(['curl','-sS','-m','60',f"{BASE}/api/status?n={attempt}"],capture_output=True,text=True).stdout)
        except ValueError as e:
            issues['status-unreadable'].append(str(e)[:120]); return
        loading=[x['id'] for x in status.get('sources',[]) if not x.get('ok') and 'still loading' in (x.get('error') or '')]
        if not loading: break
        print(f"sources still loading: {', '.join(loading)}; waiting"); time.sleep(20)
    listed=status.get('listedPlansByProvider') or {}
    for pid in status.get('configured',[]):
        src=next((x for x in status.get('sources',[]) if x.get('id')==pid),None)
        if not src or not src.get('ok') or not src.get('planCount'):
            issues['provider-not-loaded'].append(f"{pid}: {json.dumps(src)[:200]}")
        elif not listed.get(pid):
            issues['provider-not-listed'].append(f"{pid}: {src.get('planCount')} plans loaded, none listed")
    print('providers on the site: '+', '.join(f"{k} {v}" for k,v in listed.items()))
check_sources()
check_rates()
print(len(res),'pages,',sum(len(p['rows']) for p in res),'cards')
for k in sorted(issues):
    v=issues[k]; print(f'\n## {k}: {len(v)}')
    for x in v[:8]: print('  ',x)
sys.exit(1 if issues else 0)
