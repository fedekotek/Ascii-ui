#!/usr/bin/env python3
"""Download page: every Code tab that offers one makes a page that works on its own.

  python3 build.py && python3 qa/pages.py

For every component, block and chart on index.html it opens the Code tab and takes
what Download page saves. Command and Picture, and blocks with classes the kit
does not style, instead end the note above the code with "so there is no page
to download.", once, and leave the status line empty. Every other component
must offer the page, with Copy HTML first and heavy. Each page must start with
a doctype, have a charset, a viewport, the title "<Name>: ascii/ui kit
<version>", the two pinned kit links with the integrity kit/README.md gives
and crossorigin, the comment that says where it came from, a heading styled
by the page itself (the kit resets h1), and an intro line that links back to
the component on the site, to Get the kit and to both pinned files. Then each page is opened from
file:// in Chromium, with https://ascii.fedekotek.design/kit/<version>/ served
from site/kit/<version>/ (so build first): no console errors, no page errors,
ASCIIUI is there, the kit css is applied, and the component is on screen with
a size. Nothing else may be asked for.

Open page: from http:// it opens a new tab that runs the kit, on index.html
and on site/index.html (whose Content-Security-Policy the new tab inherits),
and from file:// it downloads the page instead, without an error.
"""
import asyncio,functools,http.server,os,pathlib,re,sys,tempfile,threading
from playwright.async_api import async_playwright

ROOT=pathlib.Path(__file__).resolve().parent.parent
J40=(ROOT/'js'/'40-themes-ramp-code.js').read_text(encoding='utf-8')
m=re.search(r"const PIN=\{v:'([^']*)',css:'([^']*)',js:'([^']*)'\};",J40)
if not m: sys.exit('pages: no PIN in js/40')
V,SRI_CSS,SRI_JS=m.groups()
README=(ROOT/'kit'/'README.md').read_text(encoding='utf-8')
KITURL='https://ascii.fedekotek.design/kit/'+V+'/'
KITDIR=ROOT/'site'/'kit'/V
if not (KITDIR/'ascii-ui.js').exists(): sys.exit('pages: no site/kit/%s/, run python3 build.py first'%V)
NO_PAGE='so there is no page to download.'
MUST_SAY=('s-command','s-picture')
NOT_COMPONENTS=('s-install','s-rules','s-foundations')

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
def serve(d):
    s=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Q,directory=str(d)))
    threading.Thread(target=s.serve_forever,daemon=True).start()
    return 'http://127.0.0.1:%d/'%s.server_port

TYPES={'.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.txt':'text/plain'}
async def kit_route(route):
    rel=route.request.url[len(KITURL):].split('?')[0]
    f=(KITDIR/rel).resolve()
    if not str(f).startswith(str(KITDIR.resolve())) or not f.is_file():
        await route.fulfill(status=404,body='');return
    await route.fulfill(status=200,body=f.read_bytes(),headers={'content-type':TYPES.get(f.suffix,'application/octet-stream'),'access-control-allow-origin':'*'})

SECTIONS="""()=>[...document.querySelectorAll('#view-kit > section[aria-labelledby], #view-blocks > section[aria-labelledby], #view-charts > section[aria-labelledby]')]
  .filter(s=>s.querySelector('.doc-tabs')).map(s=>[s.getAttribute('aria-labelledby'),!!s.closest('#view-blocks')])"""
OPEN_CODE="""id=>{const s=document.querySelector('section[aria-labelledby="'+id+'"]');s.querySelectorAll('.doc-tabs [role="tab"]')[1].click();
  const p=s.querySelector('.doc-panel:not([hidden])');const out=p.querySelector('.page-out');
  const n=p.querySelector('[data-part="note"]'),c=p.querySelector('.copyrow button');
  return {dl:!!p.querySelector('[data-page]'),open:!!p.querySelector('[data-open]'),say:out?out.textContent.trim():'',
    note:n&&!n.hidden?n.textContent.trim():'',first:c?c.className:'',
    labels:[...p.querySelectorAll('.copyrow button')].map(b=>b.textContent.trim())}}"""
CLICK="""([id,what])=>document.querySelector('section[aria-labelledby="'+id+'"] .doc-panel:not([hidden]) ['+what+']').click()"""
OUT="""id=>document.querySelector('section[aria-labelledby="'+id+'"] .doc-panel:not([hidden]) .page-out').textContent"""

def check_text(sid,name,t,bad):
    slug=re.sub(r'^[so]-','',sid)
    if name!='ascii-ui-%s.html'%slug: bad.append('%s: saved as %s, not ascii-ui-%s.html'%(sid,name,slug))
    if not t.startswith('<!doctype html>\n'): bad.append(sid+': the page does not start with the doctype')
    for need in ('<meta charset="utf-8">','<meta name="viewport" content="width=device-width, initial-scale=1">',
                 '<link rel="stylesheet" href="%sascii-ui.css" integrity="%s" crossorigin="anonymous">'%(KITURL,SRI_CSS),
                 '<script defer src="%sascii-ui.js" integrity="%s" crossorigin="anonymous"></script>'%(KITURL,SRI_JS)):
        if need not in t: bad.append('%s: the page is missing %s'%(sid,need))
    for f,h in (('ascii-ui.css',SRI_CSS),('ascii-ui.js',SRI_JS)):
        r=re.search(r'/kit/'+re.escape(V)+'/'+re.escape(f)+r'"[^>]*integrity="([^"]+)"',README)
        if not r or r.group(1)!=h: bad.append('%s: the integrity of %s is not the one kit/README.md gives'%(sid,f))
    if not re.search(r'<title>[^<]+: ascii/ui kit '+re.escape(V)+'</title>',t): bad.append(sid+': the title is not "<Name>: ascii/ui kit %s"'%V)
    if not re.search(r'<style>\nh1\{[^}]*font-weight:700',t): bad.append(sid+': the page does not style its h1 (the kit resets it)')
    intro=re.search(r'<p class="muted">From ascii/ui kit '+re.escape(V)+r', MIT\. (.*)</p>\n',t)
    if not intro: bad.append(sid+': no intro line "From ascii/ui kit %s, MIT."'%V)
    else:
        links=re.findall(r'<a href="([^"]+)">',intro.group(1))
        for need in ('#components/install',KITURL+'ascii-ui.css',KITURL+'ascii-ui.js'):
            if not any(l.endswith(need) for l in links): bad.append('%s: the intro does not link %s'%(sid,need))
        if not any(re.search(r'/#(components|blocks|charts)/'+re.escape(slug)+'$',l) for l in links): bad.append(sid+': the intro does not link back to the component')
    if not re.search(r'<!-- .+from the Code tab of https://ascii\.fedekotek\.design/#(components|blocks|charts)/'+re.escape(slug)+r'\..* -->\n',t):
        bad.append(sid+': no comment saying where the page came from')
    if '\u2014' in t: bad.append(sid+': an em dash in the page')

async def run_page(ctx,sid,path,bad):
    pg=await ctx.new_page();errs=[];asked=[]
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror',lambda e:errs.append('pageerror: '+str(e)))
    pg.on('request',lambda r:asked.append(r.url))
    await pg.goto(pathlib.Path(path).as_uri());await pg.wait_for_timeout(250)
    r=await pg.evaluate("""()=>{const root=document.querySelector('main > p.muted + *'),b=root&&root.getBoundingClientRect(),h=document.querySelector('h1');
      return {kit:!!window.ASCIIUI,ver:window.ASCIIUI&&ASCIIUI.version,hw:h?getComputedStyle(h).fontWeight:'',
        css:getComputedStyle(document.documentElement).getPropertyValue('--r').trim(),
        root:root?root.localName+'.'+root.className:null,w:b?b.width:0,h:b?b.height:0,
        vis:root?root.checkVisibility({visibilityProperty:true,opacityProperty:true}):false}}""")
    if errs: bad.append('%s: %s'%(sid,errs[0]))
    if not r['kit']: bad.append(sid+': ASCIIUI is not defined, the kit did not run')
    elif r['ver']!=V: bad.append('%s: ASCIIUI.version is %s, not %s'%(sid,r['ver'],V))
    if not r['css']: bad.append(sid+': the kit css is not applied (no --r)')
    if r['hw']!='700': bad.append('%s: the h1 is weight %s, not a heading'%(sid,r['hw']))
    if not r['root']: bad.append(sid+': no component after the intro line')
    elif not (r['w']>0 and r['h']>0 and r['vis']): bad.append('%s: the component (%s) is not on screen: %sx%s'%(sid,r['root'],r['w'],r['h']))
    other=[u for u in asked if not u.startswith('file:') and not u.startswith(KITURL)]
    if other: bad.append('%s: asks for %s'%(sid,other[0]))
    await pg.close()

async def open_tab(b,url,label,bad):
    """Open page from http: a new tab that runs the kit"""
    ctx=await b.new_context(viewport={'width':1440,'height':900})
    await ctx.route(KITURL+'**',kit_route)
    await ctx.add_init_script("try{sessionStorage.setItem('aui-boot','1')}catch(e){}")
    pg=await ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(url+'#components/button');await pg.wait_for_timeout(1200)
    await pg.evaluate(OPEN_CODE,'s-button')
    for _ in range(30):
        if (await pg.evaluate(OPEN_CODE,'s-button'))['open']: break
        await pg.wait_for_timeout(100)
    else:
        bad.append(label+': no Open page button on Button');await ctx.close();return
    async with ctx.expect_page() as info:
        await pg.evaluate(CLICK,['s-button','data-open'])
    tab=await info.value;terr=[]
    tab.on('pageerror',lambda e:terr.append(str(e)))
    tab.on('console',lambda m:terr.append(m.text) if m.type=='error' else None)
    await tab.wait_for_load_state();await tab.wait_for_timeout(600)
    r=await tab.evaluate("()=>({kit:!!window.ASCIIUI,title:document.title,css:getComputedStyle(document.documentElement).getPropertyValue('--r').trim()})")
    if not tab.url.startswith('blob:'): bad.append('%s: Open page opened %s, not a blob: page'%(label,tab.url))
    if not r['kit'] or not r['css']: bad.append('%s: the opened page did not run the kit (%s)%s'%(label,r,' '+terr[0] if terr else ''))
    elif terr: bad.append('%s: the opened page: %s'%(label,terr[0]))
    if r['title']!='Button: ascii/ui kit '+V: bad.append('%s: the opened page is titled %s'%(label,r['title']))
    said=await pg.evaluate(OUT,'s-button')
    if 'new tab' not in said: bad.append('%s: after Open page the status says %r'%(label,said))
    if errs: bad.append('%s: %s'%(label,errs[0]))
    await ctx.close()

async def open_file(b,bad):
    """Open page from file://: a download instead, and the status says why"""
    ctx=await b.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
    await ctx.add_init_script("try{sessionStorage.setItem('aui-boot','1')}catch(e){}")
    pg=await ctx.new_page();errs=[];pops=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    ctx.on('page',lambda p:pops.append(p))
    await pg.goto((ROOT/'index.html').as_uri()+'#components/button');await pg.wait_for_timeout(1200)
    await pg.evaluate(OPEN_CODE,'s-button')
    try:
        async with pg.expect_download(timeout=5000) as info:
            await pg.evaluate(CLICK,['s-button','data-open'])
        d=await info.value
        if d.suggested_filename!='ascii-ui-button.html': bad.append('file://: Open page saved '+d.suggested_filename)
    except Exception as e:
        bad.append('file://: Open page did not fall back to a download (%s)'%e)
    await pg.wait_for_timeout(200)
    said=await pg.evaluate(OUT,'s-button')
    if 'instead' not in said: bad.append('file://: after Open page the status says %r'%said)
    if len(pops)>1: bad.append('file://: Open page opened a tab')
    if errs: bad.append('file://: '+errs[0])
    await ctx.close()

async def main():
    bad=[];rows=[]
    src=serve(ROOT);site=serve(ROOT/'site')
    tmp=tempfile.mkdtemp(prefix='aui-pages-')
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
        await ctx.add_init_script("try{sessionStorage.setItem('aui-boot','1')}catch(e){}")
        pg=await ctx.new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(src+'#components');await pg.wait_for_timeout(1500)
        pages=[]
        for sid,block in await pg.evaluate(SECTIONS):
            if sid in NOT_COMPONENTS: continue
            r=await pg.evaluate(OPEN_CODE,sid)
            if r['dl']!=r['open']: bad.append(sid+': Download page and Open page do not come together')
            if r['labels'][:1]!=['Copy HTML'] or 'btn-primary' not in r['first']: bad.append('%s: Copy HTML is not the first, heavy button (%s, %r)'%(sid,r['labels'],r['first']))
            if r['say']: bad.append('%s: the status line says %r before any button is pressed'%(sid,r['say']))
            if not r['dl']:
                if not r['note'].endswith(NO_PAGE): bad.append('%s: no Download page, and the note does not end %r (it says %r)'%(sid,NO_PAGE,r['note']))
                if r['note'].lower().count('site only')>1: bad.append('%s: the note says site only more than once (%r)'%(sid,r['note']))
                if not block and sid not in MUST_SAY: bad.append(sid+': a kit component with no Download page')
                rows.append((sid,'block' if block else 'component','site only'));continue
            if sid in MUST_SAY: bad.append(sid+': site only, and it offers a Download page')
            if 'Download page' not in r['labels'] or NO_PAGE in r['note']: bad.append('%s: the buttons are %s, the note %r'%(sid,r['labels'],r['note']))
            await pg.wait_for_timeout(120)
            async with pg.expect_download() as info:
                await pg.evaluate(CLICK,[sid,'data-page'])
            d=await info.value;path=os.path.join(tmp,d.suggested_filename);await d.save_as(path)
            check_text(sid,d.suggested_filename,open(path,encoding='utf-8').read(),bad)
            pages.append((sid,path));rows.append((sid,'block' if block else 'component','page'))
        if errs: bad.append('index.html: '+errs[0])
        await ctx.close()
        run=await b.new_context(viewport={'width':1024,'height':800})
        await run.route(KITURL+'**',kit_route)
        for sid,path in pages: await run_page(run,sid,path,bad)
        await run.close()
        await open_tab(b,src,'index.html',bad)
        await open_tab(b,site,'site/index.html',bad)
        await open_file(b,bad)
        await b.close()
    n=sum(1 for r in rows if r[2]=='page')
    print('pages: %d of %d Code tabs make a page (%d components, %d blocks); site only: %s'%(
        n,len(rows),sum(1 for r in rows if r[2]=='page' and r[1]=='component'),sum(1 for r in rows if r[2]=='page' and r[1]=='block'),
        ', '.join(r[0] for r in rows if r[2]!='page') or 'none'))
    for x in bad: print('pages: FAIL '+x)
    print('pages: ok' if not bad else 'pages: FAIL')
    sys.exit(1 if bad else 0)

asyncio.run(main())
