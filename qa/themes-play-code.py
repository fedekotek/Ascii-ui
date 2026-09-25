import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); msgs=[]
        pg=await b.new_page(viewport={'width':390,'height':844},color_scheme='dark')
        pg.on('pageerror',lambda e:msgs.append('ERR '+str(e)))
        pg.on('console',lambda m:msgs.append('CON '+m.text) if m.type=='error' else None)
        await pg.goto('file://'+__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','index.html'))+''); await pg.wait_for_timeout(2600)
        await pg.mouse.click(200,200)
        # themes
        await pg.evaluate("document.getElementById('v-themes').click()"); await pg.wait_for_timeout(1500)
        await pg.evaluate("document.querySelector('input[name=preset][value=amber]').click()"); await pg.wait_for_timeout(1600)
        await pg.screenshot(path='t_amber.png')
        await pg.evaluate("document.querySelector('[data-r=\"3\"]').click()"); await pg.wait_for_timeout(600)
        await pg.evaluate("document.getElementById('s-ramp').scrollIntoView()"); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='t_ramp.png')
        await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='t_hero_letters.png')
        await pg.evaluate("document.querySelector('input[name=preset][value=gameboy]').click()"); await pg.wait_for_timeout(1600)
        # code tab on kit
        await pg.evaluate("document.getElementById('v-kit').click()"); await pg.wait_for_timeout(1700)
        await pg.evaluate("(()=>{const s=document.querySelector('section[aria-labelledby=s-calendar]');s.scrollIntoView();s.querySelectorAll('.doc-tabs .tab')[1].click()})()"); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='t_code.png')
        n=await pg.evaluate("document.querySelector('section[aria-labelledby=s-calendar] pre.code').textContent.length")
        await pg.evaluate("document.getElementById('s-install').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='t_install.png')
        print(msgs, n); await b.close()
asyncio.run(main())
