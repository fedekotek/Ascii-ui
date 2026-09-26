"""Errors and overflow on every view.

python3 qa/qa.py W H dark|light TAG [x] [--dist|--site]
Loads the page, clicks through the five views, reports page errors, console
errors, horizontal overflow and elements wider than the viewport. Without x it
also screenshots every screen of every view as qa_TAG_VIEW_NN.png.
--dist tests dist/ascii-ui.html, --site tests site/index.html (both from
python3 build.py); the default is index.html.
Font failures (fonts.googleapis.com, fonts.gstatic.com) are not counted: the
font is the one outside request and an offline or proxied run cannot reach it.
Prints TAG [] when clean, exits non-zero otherwise.
"""
import asyncio,os,sys
from playwright.async_api import async_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
FONT=('fonts.googleapis.com','fonts.gstatic.com')
flags=[a for a in sys.argv[1:] if a.startswith('--')]
args=[a for a in sys.argv[1:] if not a.startswith('--')]
PAGE='dist/ascii-ui.html' if '--dist' in flags else ('site/index.html' if '--site' in flags else 'index.html')

def font(m):
    url=(m.location or {}).get('url','') if hasattr(m,'location') else ''
    return any(f in url for f in FONT) or any(f in m.text for f in FONT)

async def run(w,h,scheme,tag,shots=True):
    async with async_playwright() as p:
        b=await p.chromium.launch(); msgs=[]
        pg=await b.new_page(viewport={'width':w,'height':h},color_scheme=scheme)
        pg.on('pageerror',lambda e:msgs.append('ERR '+str(e)))
        pg.on('console',lambda m:msgs.append('CON '+m.text) if m.type=='error' and not font(m) else None)
        await pg.goto('file://'+os.path.join(ROOT,PAGE)); await pg.wait_for_timeout(2600)
        await pg.mouse.click(w//2,200)
        for name in ['home','kit','blocks','charts','themes']:
            await pg.evaluate(f"(()=>{{const t=document.getElementById('v-{name}');if(t.getAttribute('aria-selected')!=='true')t.click()}})()")
            await pg.wait_for_timeout(1500)
            ov=await pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
            if ov>1: msgs.append(f'OVERFLOW {name} {ov}px')
            bad=await pg.evaluate("""(()=>{const out=[];const vw=document.documentElement.clientWidth;document.querySelectorAll('main *').forEach(e=>{if(e.closest('[hidden]')||e.closest('.tablewrap,.code,.views,.chart,pre'))return;const r=e.getBoundingClientRect();if(r.width>0&&r.right>vw+2)out.push(e.tagName+'.'+e.className+' '+Math.round(r.right-vw))});return out.slice(0,8)})()""")
            if bad: msgs.append(f'WIDE {name}: '+'; '.join(bad))
            # a closed dialog is display:none, whatever the page styles say
            shut=await pg.evaluate("[...document.querySelectorAll('dialog:not([open])')].filter(d=>getComputedStyle(d).display!=='none').map(d=>d.id)")
            if shut: msgs.append(f'CLOSED DIALOG SHOWS {name}: '+', '.join(shut))
            if shots:
                total=await pg.evaluate("document.documentElement.scrollHeight"); y=await pg.evaluate("window.scrollY"); i=0
                while y<total and i<40:
                    await pg.evaluate(f"window.scrollTo(0,{y})"); await pg.wait_for_timeout(900)
                    await pg.screenshot(path=f'qa_{tag}_{name}_{i:02d}.png'); y+=h-140; i+=1
        print(tag, msgs); await b.close()
        return msgs

if len(args)<4: sys.exit(__doc__)
sys.exit(1 if asyncio.run(run(int(args[0]),int(args[1]),args[2],args[3],len(args)<5)) else 0)
