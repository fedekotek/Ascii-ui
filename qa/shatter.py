import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); msgs=[]
        pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,color_scheme='dark')
        pg.on('pageerror',lambda e:msgs.append('ERR '+str(e)))
        await pg.goto('file://'+__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','index.html'))+''); await pg.wait_for_timeout(2600)
        await pg.mouse.click(100,300)
        await pg.evaluate("document.querySelector('section[aria-labelledby=s-card]').scrollIntoView()"); await pg.wait_for_timeout(2500)
        await pg.evaluate("AUI.shatter(document.querySelector('section[aria-labelledby=s-card] .lift'))")
        await pg.wait_for_timeout(90); await pg.screenshot(path='sh3.png')
        await pg.evaluate("AUI.rebuild()"); await pg.wait_for_timeout(600)
        await pg.evaluate("AUI.shatter(document.querySelector('section[aria-labelledby=s-button] .btn-primary'))")
        await pg.wait_for_timeout(90); await pg.screenshot(path='sh4.png')
        print(msgs); await b.close()
asyncio.run(main())
