import { chromium } from 'playwright';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:1280,height:900}});
await p.goto('http://localhost:4300/esim/thailand',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1200);
console.log(await p.evaluate(()=>{
  const by={};
  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length) continue;
    const t=(el.textContent||'').trim(); if(!t) continue;
    const r=el.getBoundingClientRect(); if(!r.width||!r.height) continue;
    const px=Math.round(parseFloat(getComputedStyle(el).fontSize));
    (by[px] ??= new Set()).add(el.className||'(no class)');
  }
  return Object.fromEntries(Object.entries(by).sort((a,b)=>a[0]-b[0]).map(([k,v])=>[k,[...v].slice(0,4)]));
}));
await br.close();
