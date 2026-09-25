"""Navigation: the menu lands every section, addresses load, Back works.

python3 qa/nav.py [quick]
Phones are driven with real touch taps (touchscreen.tap at a point), because
locator.tap scrolls sticky things into view and hides the bugs a thumb finds.
Checks, one line each, exits non-zero if any fails:
  menu      every section of every view, picked from the [=] menu after
            picking its view in the menu row, lands its title in the first
            row under the bar (under Play's stage), and the address follows
  links     #view/section addresses load the right view and section, from
            file:// and from http
  history   Back and Forward walk the views you picked
  rapid     six quick view picks end on the last one
  keys      arrows move along the views without changing the page, Enter picks
  sidebar   entries land their section; the sidebar stops above the footer
With 'quick' the menu check samples three sections per view.
"""
import asyncio,os,sys,threading,http.server,functools,socketserver
from playwright.async_api import async_playwright

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
FILE='file://'+os.path.join(ROOT,'index.html')
PORT=8202
QUICK='quick' in sys.argv

# where the title of a section is against where a jump should put it: 0 is
# right. A section near the end of the page cannot scroll that far, so it is
# fine when the page is at its bottom
LANDED="""(sel=>{
  const sec=document.querySelector(sel);if(!sec)return {err:'no '+sel};
  const p=sec.closest('[role="tabpanel"]');
  const a=[...sec.children].find(c=>c.offsetParent!==null&&c.offsetHeight>1)||sec;   // the section's title when it is drawn
  let stick=0;
  for(const e of p.querySelectorAll(':scope > *,:scope > * > *'))
    if(e.offsetParent!==null&&getComputedStyle(e).position==='sticky'){stick=e.offsetHeight;break}
  const line=document.querySelector('.topbar').offsetHeight+stick;
  const off=Math.round(a.getBoundingClientRect().top-line);
  const bottom=window.scrollY>=document.documentElement.scrollHeight-window.innerHeight-2;
  return {off:off,bottom:bottom&&off>0,view:p.id,hidden:p.hidden,hash:location.hash,open:document.getElementById('menuDlg').open};
})"""

def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*a):pass
    h=functools.partial(Quiet,directory=ROOT)
    socketserver.TCPServer.allow_reuse_address=True
    s=socketserver.TCPServer(('127.0.0.1',PORT),h)
    threading.Thread(target=s.serve_forever,daemon=True).start()
    return s

async def center(pg,sel):
    b=await pg.locator(sel).first.bounding_box()
    return b['x']+b['width']/2,b['y']+b['height']/2

async def settle(pg,ms=700):
    await pg.wait_for_timeout(ms)

async def phone(b,w,h,bad):
    ctx=await b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,color_scheme='dark')
    pg=await ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(FILE);await pg.wait_for_timeout(2600)
    views=await pg.evaluate("[...document.querySelectorAll('#views [role=tab]')].map(t=>t.id.slice(2))")
    n=0;fails=[]
    for v in views:
        secs=await pg.evaluate("(v=>AUI_NAV.model(v).groups.flatMap(g=>g.items).map(s=>s.getAttribute('aria-labelledby')))('"+v+"')")
        if QUICK and len(secs)>3: secs=[secs[0],secs[len(secs)//2],secs[-1]]
        for s in secs:
            # open from [=], pick the view in the row, pick the section at once
            x,y=await center(pg,'#menuBtn');await pg.touchscreen.tap(x,y);await pg.wait_for_timeout(260)
            await pg.evaluate("(v=>{const t=document.getElementById('mv-'+v),r=t.parentNode;r.scrollLeft=t.offsetLeft-20})('"+v+"')")
            x,y=await center(pg,'#mv-'+v);await pg.touchscreen.tap(x,y)
            slug=s.split('-',1)[1]
            sel='#menuSecs a[href$="/'+slug+'"]'
            await pg.evaluate("(sel=>{const a=document.querySelector(sel),b=a.closest('.menu-body');b.scrollTop=a.offsetTop-b.clientHeight/2})('"+sel+"')")
            x,y=await center(pg,sel);await pg.touchscreen.tap(x,y)
            await settle(pg,900)
            r=await pg.evaluate(LANDED+"('section[aria-labelledby=\""+s+"\"]')")
            n+=1
            ok=r.get('view')=='view-'+v and not r['hidden'] and not r['open'] and (abs(r['off'])<=2 or r['bottom']) and r['hash'].endswith('/'+slug)
            if not ok: fails.append(f"{v}/{slug} {r}")
    print(f'menu {w}x{h}: {n} sections', 'ok' if not fails and not errs else fails[:6]+errs[:2])
    if fails or errs: bad.append('menu '+str(w))
    await ctx.close()

async def links(b,base,label,bad):
    fails=[]
    for w,h in [(390,844),(1440,900)]:
        for addr,sec in [('#blocks/login','s-login'),('#themes/labs','s-labs'),('#themes/tokens','s-tokens'),('#components/tooltip','s-tooltip'),('#charts/heat','s-heat')]:
            ctx=await b.new_context(viewport={'width':w,'height':h},color_scheme='dark')
            pg=await ctx.new_page();errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto(base+addr);await pg.wait_for_timeout(2600)
            r=await pg.evaluate(LANDED+"('section[aria-labelledby=\""+sec+"\"]')")
            if r['hidden'] or not (abs(r['off'])<=2 or r['bottom']) or errs: fails.append(f'{w} {addr} {r} {errs[:1]}')
            await ctx.close()
    # the removed views: an old link lands on Home, and the address says so
    # (#onepager/faq finds the questions, which live on Home now)
    for addr,want,top in [('#play','#home',True),('#apps/','#home',True),('#onepager/faq','#home/faq',False)]:
        ctx=await b.new_context(viewport={'width':1440,'height':900})
        pg=await ctx.new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(base+addr);await pg.wait_for_timeout(2600)
        r=await pg.evaluate("[location.hash,!document.getElementById('view-home').hidden,window.scrollY]")
        if r[0]!=want or not r[1] or (top and r[2]>2) or errs: fails.append(f'old {addr} {r} {errs[:1]}')
        await ctx.close()
    print('links',label,'ok' if not fails else fails)
    if fails: bad.append('links '+label)

async def desktop(b,bad):
    ctx=await b.new_context(viewport={'width':1440,'height':900},color_scheme='light')
    pg=await ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(FILE);await pg.wait_for_timeout(2600)
    await pg.mouse.click(700,300)
    fails=[]
    # history
    for v in ['blocks','charts','themes']:
        await pg.click('#v-'+v);await pg.wait_for_timeout(700)
    seq=[]
    for step in ['back','back','forward']:
        await (pg.go_back() if step=='back' else pg.go_forward());await pg.wait_for_timeout(800)
        seq.append(await pg.evaluate("document.querySelector('#views [aria-selected=true]').id+' '+location.hash"))
    want=['v-charts #charts','v-blocks #blocks','v-charts #charts']
    print('history', 'ok' if seq==want else seq)
    if seq!=want: bad.append('history')
    # rapid
    import random
    wrong=0
    for i in range(6):
        picks=random.sample(['kit','blocks','charts','themes'],4)
        # real clicks, so the ones that land on a transition's overlay count too
        for v in picks:
            x,y=await center(pg,'#v-'+v);await pg.mouse.click(x,y);await pg.wait_for_timeout(60)
        await pg.wait_for_timeout(1500)
        got=await pg.evaluate("document.querySelector('#views [aria-selected=true]').id")
        vis=await pg.evaluate("[...document.querySelectorAll('main > [role=tabpanel]')].filter(p=>!p.hidden).map(p=>p.id)")
        if got!='v-'+picks[-1] or vis!=['view-'+picks[-1]]: wrong+=1
    print('rapid', 'ok' if not wrong else f'{wrong} of 6 ended on the wrong view')
    if wrong: bad.append('rapid')
    # keys
    await pg.evaluate("document.getElementById('v-kit').click()");await pg.wait_for_timeout(900)
    await pg.focus('#v-kit');await pg.keyboard.press('ArrowRight');await pg.wait_for_timeout(500)
    k1=await pg.evaluate("[document.activeElement.id,document.querySelector('#views [aria-selected=true]').id]")
    await pg.keyboard.press('Enter');await pg.wait_for_timeout(900)
    k2=await pg.evaluate("document.querySelector('#views [aria-selected=true]').id")
    await pg.keyboard.press('ArrowRight');await pg.keyboard.press(' ');await pg.wait_for_timeout(900)
    k3=await pg.evaluate("document.querySelector('#views [aria-selected=true]').id")
    ok=k1==['v-blocks','v-kit'] and k2=='v-blocks' and k3=='v-charts'
    print('keys','ok' if ok else [k1,k2,k3])
    if not ok: bad.append('keys')
    # sidebar: every entry of kit and blocks lands, and the list stops above the footer
    for v in ['kit','blocks']:
        await pg.evaluate("document.getElementById('v-"+v+"').click()");await pg.wait_for_timeout(900)
        secs=await pg.evaluate("[...document.querySelectorAll('#sidenav a.navlink')].map(a=>a.getAttribute('href'))")
        for href in secs:
            await pg.click('#sidenav a[href="'+href+'"]');await pg.wait_for_timeout(1300)
            slug=href.split('/')[1]
            r=await pg.evaluate(LANDED+"('section[aria-labelledby=\"s-"+slug+"\"],section[aria-labelledby=\"o-"+slug+"\"]')")
            cur=await pg.evaluate("(document.querySelector('#sidenav [aria-current]')||{}).textContent")
            if not (abs(r['off'])<=2 or r['bottom']) or r['hash']!=href: fails.append(f'{href} {r} marked {cur}')
        await pg.evaluate("window.scrollTo(0,document.documentElement.scrollHeight)");await pg.wait_for_timeout(600)
        gap=await pg.evaluate("Math.round(document.querySelector('#foot').getBoundingClientRect().top-document.querySelector('#sidenav .side-in').getBoundingClientRect().bottom)")
        if gap<0: fails.append(f'{v}: the sidebar runs {-gap}px into the footer')
    print('sidebar','ok' if not fails and not errs else fails[:6]+errs[:2])
    if fails or errs: bad.append('sidebar')
    await ctx.close()

async def run():
    bad=[]
    srv=serve()
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for w,h in [(320,640),(390,844)] if not QUICK else [(390,844)]:
            await phone(b,w,h,bad)
        await links(b,FILE,'file',bad)
        await links(b,f'http://127.0.0.1:{PORT}/index.html','http',bad)
        await desktop(b,bad)
        await b.close()
    srv.shutdown()
    print('nav:','ok' if not bad else 'failing: '+', '.join(bad))
    return bad

sys.exit(1 if asyncio.run(run()) else 0)
