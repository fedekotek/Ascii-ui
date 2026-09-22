"""One clock: no setInterval survives, tasks run, pause freezes them.

python3 qa/clock.py [width] [height]
Prints a line per check and exits non-zero if any of them fails.
"""
import asyncio,os,sys
from playwright.async_api import async_playwright

URL='file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','index.html'))
GUARD="window.__ivs=[];const si=window.setInterval;window.setInterval=function(f,ms){window.__ivs.push(ms||0);return si.apply(window,arguments)};"

async def run(w,h):
    out,bad=[],0
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':w,'height':h},color_scheme='dark')
        errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(GUARD)
        await pg.goto(URL)
        await pg.wait_for_timeout(2600)
        await pg.mouse.click(w//2,200)
        await pg.wait_for_timeout(600)

        ivs=await pg.evaluate("window.__ivs")
        out.append(('setInterval calls',len(ivs),ivs[:6]))
        if ivs: bad+=1

        n=await pg.evaluate("AUI.clock.count()")
        out.append(('clock tasks',n,''))
        if n<8: bad+=1

        # the ticker is a clock task: it must move, freeze on pause, move again on resume
        async def ticker():
            return await pg.evaluate("document.getElementById('ticker').textContent.slice(0,12)")
        await pg.evaluate("document.getElementById('v-page').click()")
        await pg.wait_for_timeout(900)
        await pg.evaluate("document.getElementById('ticker').scrollIntoView({block:'center'})")
        await pg.wait_for_timeout(600)
        a=await ticker(); await pg.wait_for_timeout(700); c=await ticker()
        out.append(('ticker runs',a!=c,a+' -> '+c))
        if a==c: bad+=1
        await pg.evaluate("AUI.clock.pause()")
        await pg.wait_for_timeout(500)
        d=await ticker(); await pg.wait_for_timeout(700); e=await ticker()
        out.append(('pause freezes',d==e,d+' -> '+e))
        if d!=e: bad+=1
        await pg.evaluate("AUI.clock.resume()")
        await pg.wait_for_timeout(800)
        f=await ticker()
        out.append(('resume restarts',f!=e,e+' -> '+f))
        if f==e: bad+=1

        # finite tasks run their count, call end once, then leave the list
        got=await pg.evaluate("""(async()=>{
          const n0=AUI.clock.count();let runs=0,ends=0;
          for(let i=0;i<20;i++)AUI.times(20,3,()=>runs++,()=>ends++);
          const peak=AUI.clock.count()-n0;
          await new Promise(r=>setTimeout(r,500));
          return {peak:peak,runs:runs,ends:ends,left:AUI.clock.count()-n0};
        })()""")
        ok=got['peak']==20 and got['runs']==60 and got['ends']==20 and got['left']<=0
        out.append(('finite tasks reaped',ok,got))
        if not ok: bad+=1

        out.append(('page errors',len(errs),errs[:3]))
        if errs: bad+=1
        await b.close()
    for k,v,x in out: print(k,'=',v,x)
    print('clock:', 'ok' if not bad else str(bad)+' failing')
    return bad

sys.exit(1 if asyncio.run(run(int(sys.argv[1]) if len(sys.argv)>1 else 390,int(sys.argv[2]) if len(sys.argv)>2 else 844)) else 0)
