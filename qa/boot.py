import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); msgs=[]
        pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,color_scheme='dark')
        pg.on('pageerror',lambda e:msgs.append('ERR '+str(e)))
        await pg.goto('file://'+__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','index.html'))+''); await pg.wait_for_timeout(350); await pg.screenshot(path='b1.png')
        await pg.wait_for_timeout(700); await pg.screenshot(path='b2.png'); await pg.wait_for_timeout(2500)
        ok=await pg.evaluate("!document.getElementById('boot')")
        print(msgs,ok); await b.close()
asyncio.run(main())
