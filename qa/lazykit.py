#!/usr/bin/env python3
"""The published site fetches the kit text on first use (build.py, LAZY). This
opens Code and Usage on site/index.html while that fetch is slow, by click, by
tap and by the End key, and checks that what gets printed is the real kit,
not the blank that stands in for it until it arrives.
While the press is held, the tab (or button) is aria-busy="true" and a status
line says "Getting the kit.": under the doc's tab strip, in Get the kit's own
status line for Download CSS, and in the Tokens status line for tokens.json.
Both are gone once the kit is here, and when it fails to come.
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

async def slower(route):
    await asyncio.sleep(1.6)
    await route.continue_()

WAIT="""([sel,out])=>{const t=document.querySelector(sel),o=out?document.querySelector(out):null;
  return {busy:t&&t.getAttribute('aria-busy'),said:o?o.textContent.trim():null}}"""
TAB='section[aria-labelledby="s-button"] .doc-tabs [role="tab"]:nth-child(2)'
WAITLINE='section[aria-labelledby="s-button"] .doc-tabs + .kit-wait'

async def held(b,label,go,sel,out,after,fail=False):
    """press sel while the kit is slow (or never comes): busy and the words, then neither"""
    c=await b.new_context(viewport={'width':1440,'height':900},accept_downloads=True);pg=await c.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    if fail: await pg.route('**/kit/*/ascii-ui.*',lambda r:r.abort())
    else: await pg.route('**/kit/*/ascii-ui.*',slower)
    await pg.add_init_script("sessionStorage.setItem('aui-boot','1')")
    await pg.goto(URL+go);await pg.wait_for_timeout(1500)
    await pg.evaluate("s=>document.querySelector(s).scrollIntoView({block:'center'})",sel);await pg.wait_for_timeout(300)
    await pg.evaluate("s=>document.querySelector(s).click()",sel)
    await pg.wait_for_timeout(300)
    w=await pg.evaluate(WAIT,[sel,out])
    if not fail:
        if w['busy']!='true': bad.append('%s: not aria-busy while the kit is held (%r)'%(label,w['busy']))
        if w['said']!='Getting the kit.': bad.append('%s: the status says %r while the kit is held'%(label,w['said']))
    await pg.wait_for_timeout(2600)
    w=await pg.evaluate(WAIT,[sel,out])
    if w['busy']: bad.append('%s: still aria-busy after %s'%(label,'the failure' if fail else 'the kit came'))
    if w['said']=='Getting the kit.': bad.append('%s: still says Getting the kit. after %s'%(label,'the failure' if fail else 'the kit came'))
    if after: await after(pg,label)
    if errs: bad.append('%s: %s'%(label,errs[0]))
    await c.close()

async def code_open(pg,label):
    t=await pg.evaluate(CODE,'s-button')
    if 'in ascii-ui.css already' not in t: bad.append(label+': no kit css printed after the wait')
    if await pg.evaluate("s=>!!document.querySelector(s)",WAITLINE): bad.append(label+': the waiting line stays under the tabs')
async def tok_saved(pg,label):
    st=await pg.evaluate("document.getElementById('tokensStatus').textContent")
    if st!='Saved as tokens.json.': bad.append('%s: after the wait the status says %r'%(label,st))

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
        await held(b,'waiting Code tab','#components/button',TAB,WAITLINE,code_open)
        await held(b,'waiting Download CSS','#components/install','[data-dl="css"]','li:has([data-dl="css"]) .kit-out',None)
        await held(b,'waiting tokens.json','#themes/tokens','#tokensJson','#tokensStatus',tok_saved)
        await held(b,'failed Code tab','#components/button',TAB,WAITLINE,None,fail=True)
        await b.close()
    for x in bad: print('lazykit:',x)
    print('lazykit: ok' if not bad else 'lazykit: FAIL')
    sys.exit(1 if bad else 0)

asyncio.run(main())
