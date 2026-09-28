#!/usr/bin/env python3
"""The size budget of what ships, site/ (run python3 build.py first).

  python3 qa/budget.py          weight: every file under its cap, and no request
                                to anyone else in the page. The release bar runs this
  python3 qa/budget.py --idle   also idle work per view, with Playwright: DOM
                                changes, style recalcs and animation frames per
                                second while nobody touches the page

Weight is gzip -9 from the standard library. Vercel serves brotli at quality 3,
which lands within a few percent of it. Idle work is counted, not timed, so a
busy machine gives the same answer. Exits 1 on any breach.

The caps are where things are now plus a little room. Lower them when a file
gets smaller. Raising one is a decision: say why in the commit.
"""
import gzip,pathlib,sys,re
ROOT=pathlib.Path(__file__).resolve().parent.parent
SITE=ROOT/'site'
KB=1024
WEIGHT={                             # gzip -9 bytes
    'index.html':        200*KB,     # 183 KB at 11.4 with the kit charts, the Blocks, the icons and the data table
    'ascii-ui.html':     250*KB,     # charts, the Blocks, the icons and the data table on the kit: the download, everything embedded (each measured apart at 211 to 215)
    'kit/ascii-ui.css':   22*KB,     # 14.4 KB with the Blocks pieces, plus the charts, the 39 icons and the data table
    'kit/ascii-ui.js':    46*KB,     # 31.1 KB with charts, plus checklist, pick, stepper, about 4 KB of data table and about 6 KB of Signal
    'kit/starter.html':   14*KB,     # Charts, Blocks, icons and a 24 row data table, measured apart at 7 to 8 each
    'kit/fonts/geist-mono-latin.woff2': 20*KB,   # 19 KB, woff2 does not compress further
    'assets/og.png':     100*KB,     # 65 KB, only link previews fetch it
    'favicon.ico':         4*KB,
    'assets/reel.webm': 3400*KB,     # 3.2 MB, VP9 and Opus, what Chrome, Firefox and Edge play; only on press
    'assets/reel.mp4':  3900*KB,     # 3.7 MB, 15 s at 720p, H.264 for Safari; a visitor fetches one of the two
    'assets/reel-poster.jpg': 60*KB, # 45 KB, lazy, only near the bottom of Home
}
TOTAL=9900*KB                        # every file in site/, raw: 2 MB of site and kit, 3.7 MB MP4 and 3.2 MB WebM of reel, and a frozen copy of every kit version

bad=[]
for f,cap in WEIGHT.items():
    p=SITE/f
    if not p.exists(): bad.append(f+': missing (python3 build.py)');continue
    n=len(gzip.compress(p.read_bytes(),9))
    print('weight %-36s %6.1f KB gzip (cap %d)'%(f,n/KB,cap//KB))
    if n>cap: bad.append('%s: %.1f KB gzip, over its %d KB'%(f,n/KB,cap//KB))
tot=sum(p.stat().st_size for p in SITE.rglob('*') if p.is_file())
print('weight %-36s %6.1f KB raw  (cap %d)'%('site/, every file',tot/KB,TOTAL//KB))
if tot>TOTAL: bad.append('site/: %.0f KB, over its %d KB'%(tot/KB,TOTAL//KB))

# what the page loads, not where it links: nothing from anyone else
for f in ('index.html','ascii-ui.html'):
    p=SITE/f
    if not p.exists(): continue
    h=p.read_text()
    tags=re.sub(r'(<script[^>]*>)[\s\S]*?</script>',r'\1</script>',h)   # the markup, without script bodies
    tags=re.sub(r'<link rel="canonical"[^>]*>','',tags)                  # an address, not a load
    out=re.findall(r'<(?:link|script|img|iframe|source|video|audio)\b[^>]*\s(?:href|src)="((?:https?:)?//[^"]*)"',tags)
    out+=re.findall(r'@import\s+url\(\s*["\']?((?:https?:)?//[^"\')]+)',h)
    out+=re.findall(r'url\(\s*["\']?((?:https?:)?//[^"\')]+)',tags)
    if out: bad.append(f+': loads from elsewhere: '+', '.join(sorted(set(out))[:5]))
print('requests to anyone else:','none' if not any('loads from elsewhere' in b for b in bad) else 'some')

if '--idle' in sys.argv:
    import http.server,threading,functools
    from playwright.sync_api import sync_playwright
    IDLE={'mutations':20,'styles':35,'raf':61}   # per second, 5 s after 5 s to settle
    REDUCED={'mutations':1,'raf':1}              # reduced motion: nothing moves, so nothing runs
    h=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(SITE));h.log_message=lambda *a:None
    srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),h);threading.Thread(target=srv.serve_forever,daemon=True).start()
    url='http://127.0.0.1:%d/'%srv.server_port
    COUNT="""secs=>new Promise(res=>{let m=0,r=0;const mo=new MutationObserver(l=>m+=l.length);
      mo.observe(document.documentElement,{subtree:true,attributes:true,childList:true,characterData:true});
      const o=window.requestAnimationFrame;window.requestAnimationFrame=cb=>o(t=>{r++;cb(t)});
      setTimeout(()=>{mo.disconnect();window.requestAnimationFrame=o;res([m/secs,r/secs])},secs*1000)})"""
    with sync_playwright() as p:
        b=p.chromium.launch()
        for reduce in (False,True):
            ctx=b.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce' if reduce else 'no-preference')
            ctx.add_init_script("try{sessionStorage.setItem('aui-boot','1')}catch(e){}")
            for v in ['home','components','blocks','charts','themes']:
                pg=ctx.new_page();cdp=ctx.new_cdp_session(pg);cdp.send('Performance.enable')
                pg.goto(url+'#'+v,wait_until='load');pg.wait_for_timeout(5000)
                s0={x['name']:x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
                mut,raf=pg.evaluate(COUNT,5)
                s1={x['name']:x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
                sty=(s1['RecalcStyleCount']-s0['RecalcStyleCount'])/(s1['Timestamp']-s0['Timestamp'])
                tag='reduced' if reduce else 'motion'
                print('idle  %-7s %-10s mutations %6.1f/s  styles %5.1f/s  frames %5.1f/s'%(tag,v,mut,sty,raf))
                cap=REDUCED if reduce else IDLE
                if mut>cap['mutations']: bad.append('%s %s: %.0f DOM changes/s idle, cap %d'%(tag,v,mut,cap['mutations']))
                if raf>cap['raf']: bad.append('%s %s: %.0f frames/s idle, cap %d'%(tag,v,raf,cap['raf']))
                if not reduce and sty>IDLE['styles']: bad.append('%s %s: %.0f style recalcs/s idle, cap %d'%(tag,v,sty,IDLE['styles']))
                pg.close()
            ctx.close()
        b.close()
    srv.shutdown()

print('budget: ok' if not bad else 'budget: FAIL\n  '+'\n  '.join(bad))
sys.exit(1 if bad else 0)
