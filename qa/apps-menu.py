import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); msgs=[]
        pg=await b.new_page(viewport={'width':390,'height':844},color_scheme='dark',is_mobile=True,has_touch=True)
        pg.on('pageerror',lambda e:msgs.append('ERR '+str(e)))
        await pg.goto('file://'+__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','index.html'))+''); await pg.wait_for_timeout(2600)
        await pg.mouse.click(200,300)
        await pg.evaluate("document.getElementById('v-apps').click()"); await pg.wait_for_timeout(1700)
        shots=[]
        for i in range(7):
            await pg.evaluate(f"window.scrollTo(0,{i*700})"); await pg.wait_for_timeout(1100)
            await pg.screenshot(path=f'ap_{i}.png'); shots.append(f'ap_{i}.png')
        await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(500)
        await pg.click('#menuBtn'); await pg.wait_for_timeout(700)
        await pg.screenshot(path='ap_menu.png'); shots.append('ap_menu.png')
        print(msgs); await b.close()
        from PIL import Image
        c=Image.new('RGB',(len(shots)*394,844),'white')
        for i,f in enumerate(shots): c.paste(Image.open(f),(i*394,0))
        c.resize((len(shots)*230,493)).save('ap_sheet.png')
asyncio.run(main())
