import { chromium } from 'playwright';
const B='http://localhost:5500';
const br=await chromium.launch();

async function audit(name, url, viewport) {
  const p = await br.newPage({ viewport });
  await p.goto(B+url,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1200);

  // Font sizes of visible text
  const sizes = await p.evaluate(() => {
    const out = {};
    for (const el of document.querySelectorAll('body *')) {
      if (el.children.length > 0) continue;
      const t = (el.textContent||'').trim();
      if (!t) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const px = Math.round(parseFloat(getComputedStyle(el).fontSize));
      out[px] = (out[px]||0) + t.length;
    }
    return out;
  });

  // Interactive elements above the fold
  const above = await p.evaluate(() => {
    const els=[...document.querySelectorAll('a,button,input,select,summary,[role=button],[role=option]')];
    return els.filter(e=>{const r=e.getBoundingClientRect();return r.top<window.innerHeight&&r.bottom>0&&r.width>0;}).length;
  });

  const text = await p.locator('body').innerText();
  const jargon = ['eSIM','GB','MB','Hotspot','5G','4G','SMS','Unlimited','FUP','QR','ILS','USD','EUR','kbps','APN'];
  const found = jargon.filter(j => text.includes(j)).map(j => `${j}×${(text.match(new RegExp(j,'g'))||[]).length}`);

  const latin = (text.match(/[A-Za-z]{2,}/g)||[]);
  console.log(`\n=== ${name} (${viewport.width}px) ===`);
  console.log('font sizes (px: chars):', Object.entries(sizes).sort((a,b)=>a[0]-b[0]).map(([k,v])=>`${k}:${v}`).join('  '));
  console.log('interactive above fold:', above);
  console.log('jargon:', found.join(' '));
  console.log('latin words:', latin.length, '| unique:', [...new Set(latin)].slice(0,25).join(', '));
  await p.close();
}

await audit('home','/',{width:1280,height:900});
await audit('home-mobile','/',{width:390,height:844});
await audit('results','/esim/thailand?days=10&usage=regular',{width:1280,height:900});
await audit('results-mobile','/esim/thailand?days=10&usage=regular',{width:390,height:844});
await br.close();
