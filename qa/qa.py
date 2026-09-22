import asyncio,sys
from playwright.async_api import async_playwright
async def run(w,h,scheme,tag,shots=True):
    async with async_playwright() as p:
        b=await p.chromium.launch(); msgs=[]
        pg=await b.new_page(viewport={'width':w,'height':h},color_scheme=scheme)
        pg.on('pageerror',lambda e:msgs.append('ERR '+str(e)))
        pg.on('console',lambda m:msgs.append('CON '+m.text) if m.type=='error' else None)
        await pg.goto('file://'+__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','index.html'))+''); await pg.wait_for_timeout(2600)
        await pg.mouse.click(w//2,200)
        for name in ['kit','blocks','charts','themes','play','apps','page']:
            await pg.evaluate(f"(()=>{{const t=document.getElementById('v-{name}');if(t.getAttribute('aria-selected')!=='true')t.click()}})()")
            await pg.wait_for_timeout(1500)
            ov=await pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
            if ov>1: msgs.append(f'OVERFLOW {name} {ov}px')
            bad=await pg.evaluate("""(()=>{const out=[];const vw=document.documentElement.clientWidth;document.querySelectorAll('main *').forEach(e=>{if(e.closest('[hidden]')||e.closest('.tablewrap,.code,.views,.chart,pre'))return;const r=e.getBoundingClientRect();if(r.width>0&&r.right>vw+2)out.push(e.tagName+'.'+e.className+' '+Math.round(r.right-vw))});return out.slice(0,8)})()""")
            if bad: msgs.append(f'WIDE {name}: '+'; '.join(bad))
            if shots:
                total=await pg.evaluate("document.documentElement.scrollHeight"); y=await pg.evaluate("window.scrollY"); i=0
                while y<total and i<40:
                    await pg.evaluate(f"window.scrollTo(0,{y})"); await pg.wait_for_timeout(900)
                    await pg.screenshot(path=f'qa_{tag}_{name}_{i:02d}.png'); y+=h-140; i+=1
        print(tag, msgs); await b.close()
asyncio.run(run(int(sys.argv[1]),int(sys.argv[2]),sys.argv[3],sys.argv[4],len(sys.argv)<6))
