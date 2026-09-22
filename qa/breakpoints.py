"""Breakpoints: column counts, no overflow, no overlap, nothing sticking out.

python3 qa/breakpoints.py
One line per width. Exits non-zero if any check fails.
"""
import asyncio,os,sys
from playwright.async_api import async_playwright

URL='file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','index.html'))
# width, height, expected gallery columns
SIZES=[(360,780,1),(390,844,1),(820,1180,1),(1024,768,2),(1280,800,2),(1440,900,2),(1600,1000,3),(1920,1080,3)]
GALLERIES=['kit','blocks']   # charts is not a gallery, every chart draws to the page width
VIEWS=GALLERIES+['charts']

OVERLAP="""(p=>{
  const k=[...document.querySelectorAll(p+' > *')].filter(e=>!e.hidden)
    .map(e=>({n:e.getAttribute('aria-labelledby')||e.tagName,r:e.getBoundingClientRect()}));
  const bad=[];
  for(let i=0;i<k.length;i++)for(let j=i+1;j<k.length;j++){
    const a=k[i].r,b=k[j].r;
    if(a.left<b.right-2&&b.left<a.right-2&&a.top<b.bottom-2&&b.top<a.bottom-2)bad.push(k[i].n+' x '+k[j].n);
  }
  return bad.slice(0,4);
})"""
OUTSIDE="""(p=>{
  const out=[];
  document.querySelectorAll(p+' > section').forEach(s=>{
    const r=s.getBoundingClientRect();
    s.querySelectorAll('*').forEach(e=>{
      /* mid-entrance elements are translated by up to 12px on purpose */
      if(e.closest('.tablewrap,.code,pre,.tip,dialog,.menu'))return;
      if(e.closest('[data-rv].in:not(.done)'))return;
      const b=e.getBoundingClientRect();
      if(b.width&&b.right>r.right+3)out.push((s.getAttribute('aria-labelledby')||'?')+' '+e.className);
    });
  });
  return out.slice(0,4);
})"""

async def run():
    bad=0
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for w,h,want in SIZES:
            pg=await b.new_page(viewport={'width':w,'height':h},color_scheme='dark')
            errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2600)
            await pg.mouse.click(w//2,200); await pg.wait_for_timeout(700)
            msgs=[]
            mw=await pg.evaluate("Math.round(document.getElementById('main').getBoundingClientRect().width)")
            for v in VIEWS:
                await pg.evaluate(f"document.getElementById('v-{v}').click()"); await pg.wait_for_timeout(1300)
                ov=await pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
                if ov>1: msgs.append(f'{v} overflow {ov}px')
                # count where sections actually sit, not how many tracks the
                # template declares: a gallery that collapsed would still declare three
                n=await pg.evaluate("(p=>new Set([...document.querySelectorAll(p+' > section[aria-labelledby]')].filter(s=>!s.hidden&&s.getAttribute('data-span')!=='full').map(s=>Math.round(s.getBoundingClientRect().left))).size)('#view-"+v+"')")
                w_want=want if v in GALLERIES else 1
                if n!=w_want: msgs.append(f'{v} sections sit in {n} columns, wanted {w_want}')
                if v in GALLERIES:
                    snap=await pg.evaluate("(p=>{const m=document.getElementById('main').getBoundingClientRect(),ch=document.getElementById('probe').getBoundingClientRect().width/50;return [...new Set([...document.querySelectorAll(p+' > section[aria-labelledby]')].filter(s=>!s.hidden&&s.getAttribute('data-span')!=='full').map(s=>s.getBoundingClientRect().left))].map(l=>Math.round(((l-m.left)/ch)*100)/100)})('#view-"+v+"')")
                    off=[x for x in snap if abs(x-round(x))>0.08]
                    if off: msgs.append(f'{v} columns off the character grid: {off}')
                lap=await pg.evaluate(OVERLAP+"('#view-"+v+"')")
                if lap: msgs.append(f'{v} overlap: '+'; '.join(lap))
                esc=await pg.evaluate(OUTSIDE+"('#view-"+v+"')")
                if esc: msgs.append(f'{v} outside its section: '+'; '.join(esc))
            if errs: msgs.append('errors: '+'; '.join(errs[:2]))
            print(f'{w}x{h} main {mw}px', msgs if msgs else 'ok')
            if msgs: bad+=1
            await pg.close()
        await b.close()
    print('breakpoints:', 'ok' if not bad else f'{bad} failing')
    return bad

sys.exit(1 if asyncio.run(run()) else 0)
