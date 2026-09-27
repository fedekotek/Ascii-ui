#!/usr/bin/env python3
"""The published site fetches the kit text on first use (build.py, LAZY). This
opens Code and Usage on site/index.html while that fetch is slow, by click, by
tap and by the End key, and checks that what gets printed is the real kit,
not the blank that stands in for it until it arrives.
  python3 qa/lazykit.py"""
import asyncio,functools,http.server,pathlib,sys,threading
from playwright.async_api import async_playwright

SITE=pathlib.Path(__file__).resolve().parent.parent/'site'
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
h=functools.partial(Q,directory=str(SITE))
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),h);threading.Thread(target=srv.serve_forever,daemon=True).start()
URL='http://127.0.0.1:%d/'%srv.server_port
bad=[]

async def slow(route):
    await asyncio.sleep(0.8)
    await route.continue_()

CODE="""id=>{const s=document.querySelector('section[aria-labelledby="'+id+'"]');const p=s&&s.querySelector('.doc-panel:not([hidden]) pre.code');return p?p.textContent:''}"""

async def check(pg,id,how,label):
    sec='section[aria-labelledby="%s"]'%id
    await pg.locator(sec).scroll_into_view_if_needed()
    tabs=pg.locator(sec+' .doc-tabs [role="tab"]')
    if how=='click': await tabs.nth(1).click()
    elif how=='tap': await tabs.nth(1).tap()
    else:
        await tabs.nth(0).focus(); await pg.keyboard.press('End'); await pg.keyboard.press('Home')
        await tabs.nth(0).focus(); await pg.keyboard.press('ArrowRight')
    await pg.wait_for_timeout(1600)
    t=await pg.evaluate(CODE,id)
    if 'in ascii-ui.css already' not in t: bad.append('%s %s %s: no kit css printed'%(label,id,how))
    if 'site-only: btn' in t or 'site-only: btn,' in t: bad.append('%s %s %s: kit classes called site-only'%(label,id,how))

async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for label,opts in (('desktop',dict(viewport={'width':1440,'height':900})),('phone',dict(viewport={'width':390,'height':844},has_touch=True,is_mobile=True))):
            for how in (('click','key') if label=='desktop' else ('tap',)):
                c=await b.new_context(**opts);pg=await c.new_page()
                errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
                await pg.route('**/kit/*/ascii-ui.*',slow)
                await pg.add_init_script("sessionStorage.setItem('aui-boot','1')")
                await pg.goto(URL+'#components/button');await pg.wait_for_timeout(1500)
                await check(pg,'s-button',how,label)
                await check(pg,'s-dropdown',how,label)
                if errs: bad.append('%s %s: %s'%(label,how,errs[0]))
                await c.close()
        await b.close()
    for x in bad: print('lazykit:',x)
    print('lazykit: ok' if not bad else 'lazykit: FAIL')
    sys.exit(1 if bad else 0)

asyncio.run(main())
