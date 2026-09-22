import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); msgs=[]
        for w in [320,360,390]:
            pg=await b.new_page(viewport={'width':w,'height':780},device_scale_factor=2,color_scheme='dark')
            pg.on('pageerror',lambda e:msgs.append('ERR '+str(e)))
            await pg.goto('file://'+__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','index.html'))+''); await pg.wait_for_timeout(2600)
            await pg.mouse.click(100,300)
            await pg.evaluate("document.querySelectorAll('.ptitle').forEach(p=>AUI.titleFrame(p,99))"); await pg.wait_for_timeout(300)
            ov=await pg.evaluate("[...document.querySelectorAll('.ptitle')].filter(p=>p.clientWidth&&!p.closest('[hidden]')&&p.scrollWidth>p.clientWidth+1).map(p=>p.dataset.text+':'+p._scale+':'+p.scrollWidth+'/'+p.clientWidth)")
            await pg.evaluate("document.querySelector('section[aria-labelledby=s-progress]').scrollIntoView()"); await pg.wait_for_timeout(2500)
            await pg.screenshot(path=f'fit_{w}.png')
            print(w,'overflow:',ov)
        print(msgs); await b.close()
asyncio.run(main())
