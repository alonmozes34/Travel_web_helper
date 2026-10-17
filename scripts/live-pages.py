"""
Live pages: every page of the live site opens, in its language, and the links
that leave it for Booking.com arrive there.

    python3 scripts/live-pages.py [BASE_URL]      (default: the live site)

The owner, 17 October 2026: a full regression every night "that checks
everything". The searches and the providers' links and prices are checked by
live-regression.py; this checks the rest of the site:

- every address in /sitemap.xml, both languages, and the pages it leaves out
  (contact, a search across three continents, the page across continents
  carrying countries): it answers 200, is not the error page, has
  a heading, and is in the language of its address (he/rtl or en/ltr);
- /api/status: every configured source was read, and every provider has
  plans listed. A provider that drops to none leaves the site without a word;
- Booking.com: on a sample of country pages, every Booking link (through CJ)
  ends on booking.com. Whether CJ's label carries the site's name is reported,
  never the name it carries, and does not fail the run: it waits on CJ
  (Case 01916859).

Plain HTTP and no browser, so no page script runs and nothing is counted in
the site's statistics. Exit status 1 when anything is found.
"""
import concurrent.futures as cf, json, re, subprocess, sys, urllib.parse as U

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'https://www.yeshklita.com').rstrip('/')
# Car rental is off on the live site (`rentalComparisonEnabled`), so it answers 404 there.
EXTRA = ['/contact', '/en/contact', '/search?to=JP:7,FR:7,US:7&usage=regular', '/esim/region/world?to=JP,FR']
BOOKING_SAMPLE = ['/esim/japan', '/esim/greece', '/en/esim/thailand', '/esim/united-states', '/esim/italy']
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'

problems = []


def fetch(url, timeout=60):
    """(status, body). One retry: a cold page on the host can time out once."""
    for _ in range(2):
        r = subprocess.run(['curl', '-sS', '-m', str(timeout), '-A', UA, '-w', '\n%{http_code}', url], capture_output=True, text=True)
        body, _, code = r.stdout.rpartition('\n')
        if code.isdigit() and code != '000':
            return int(code), body
    return 0, r.stderr.strip()


def check_page(path):
    status, body = fetch(BASE + path)
    english = path == '/en' or path.startswith('/en/') or path.startswith('/en?')
    lang = re.search(r'<html[^>]*\blang="([a-z]+)"[^>]*\bdir="(rtl|ltr)"', body)
    if status != 200:
        return f'{path}: answered {status or "nothing"}'
    if '__next_error__' in body:
        return f'{path}: the error page'
    if not re.search(r'<h1[\s>]', body):
        return f'{path}: no heading'
    if not lang or lang.groups() != (('en', 'ltr') if english else ('he', 'rtl')):
        return f'{path}: language {lang.groups() if lang else "missing"}'
    return None


# ── pages ────────────────────────────────────────────────────────────────
status, sitemap = fetch(BASE + '/sitemap.xml')
paths = [U.urlsplit(loc).path or '/' for loc in re.findall(r'<loc>([^<]+)</loc>', sitemap)]
if status != 200 or len(paths) < 100:
    problems.append(f'sitemap: answered {status} with {len(paths)} addresses')
paths = sorted(set(paths)) + EXTRA
with cf.ThreadPoolExecutor(8) as pool:
    failed = [r for r in pool.map(check_page, paths) if r]
problems += failed
print(f'pages: {len(paths)} opened, {len(failed)} with a problem')

# ── providers ────────────────────────────────────────────────────────────
status, raw = fetch(BASE + '/api/status')
try:
    st = json.loads(raw)
    for source in st['sources']:
        if not source['ok']:
            problems.append(f"status: {source['id']} not read ({source['error']})")
    listed = st['listedPlansByProvider']
    for provider in st['configured']:
        if not listed.get(provider):
            problems.append(f'status: {provider} has no plans on the site')
    print('providers: ' + ', '.join(f'{p} {listed.get(p, 0)}' for p in st['configured']) + f" · version {st['version']} ({st['commit']})")
except (ValueError, KeyError) as e:
    problems.append(f'status: unreadable ({status}, {e})')

# ── Booking.com ──────────────────────────────────────────────────────────
links = set()
for path in BOOKING_SAMPLE:
    _, body = fetch(BASE + path)
    links |= set(re.findall(r'https://www\.(?:tkqlhce|dpbolvw|jdoqocy|anrdoezrs|kqzyfj)\.com/links/[^"\\\s<]+', body))
if not links:
    problems.append('booking: no Booking link on the sample pages')


def follow(link):
    r = subprocess.run(['curl', '-sS', '-L', '-o', '/dev/null', '-m', '60', '-A', UA, '-w', '%{url_effective}', link], capture_output=True, text=True)
    return link, r.stdout


labels = set()
with cf.ThreadPoolExecutor(4) as pool:
    for link, landed in pool.map(follow, sorted(links)):
        if U.urlsplit(landed).hostname != 'www.booking.com':
            problems.append(f'booking: {link} ended on {U.urlsplit(landed).hostname or "nothing"}')
            continue
        label = U.unquote_plus(dict(U.parse_qsl(U.urlsplit(landed).query)).get('label', ''))
        if 'pname-' in label:
            labels.add('site name' if re.search(r'pname-yesh.?klita', label, re.I) else 'not the site name')
print(f"booking: {len(links)} links followed · CJ's label: {', '.join(sorted(labels)) or 'none'}")

for p in problems:
    print('PROBLEM ' + p)
sys.exit(1 if problems else 0)
