#!/usr/bin/env python3
"""The reel on Home, on what ships (run python3 build.py first). Headless
Chromium has no H.264, so this is also the check that the WebM source works.

  python3 qa/reel.py

On site/ served over http, at 390 with touch and at 1440 with a mouse:
  - nothing asks for assets/reel.webm or reel.mp4 before Play the reel is
    pressed (the poster is fine)
  - after the press it plays: currentTime past 1 s, readyState 3 or more,
    no error event, and the player fits the screen
  - with reduced motion it does not start by itself, it says so, and it
    plays when asked
  - when both files 404, or the file that arrives will not decode, the dead
    player goes, the poster comes back with focus, and the status line says
    so with a link
And dist/ascii-ui.html from file:// plays the same files next to it.
Exits 1 on any failure."""
import functools,http.server,pathlib,re,sys,threading
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parent.parent
SITE=ROOT/'site'
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Q,directory=str(SITE)))
threading.Thread(target=srv.serve_forever,daemon=True).start()
URL='http://127.0.0.1:%d/'%srv.server_port
VID=re.compile(r'reel\.(webm|mp4)(\?|$)')
bad=[]

STATE="""()=>{const v=document.querySelector('#reel video');if(!v)return null;
  const r=v.getBoundingClientRect();
  return {t:v.currentTime,rs:v.readyState,paused:v.paused,err:v.error&&v.error.code,
    src:v.currentSrc,fits:r.left>=0&&r.right<=innerWidth+.5,st:document.getElementById('reelStatus').textContent}}"""

def ctx_for(b,size,reduce=False):
    w,h,touch=size
    o=dict(viewport={'width':w,'height':h},reduced_motion='reduce' if reduce else 'no-preference')
    if touch: o.update(has_touch=True,is_mobile=True)
    c=b.new_context(**o)
    c.add_init_script("try{sessionStorage.setItem('aui-boot','1')}catch(e){}")
    return c

def press(pg,touch):
    btn=pg.locator('#reelPlay')
    btn.scroll_into_view_if_needed()
    btn.tap() if touch else btn.click()

def wait_play(pg,label,need=1.0,ms=10000):
    s=None
    for _ in range(ms//250):
        pg.wait_for_timeout(250)
        s=pg.evaluate(STATE)
        if s and s['t']>need and s['rs']>=3: return s
    bad.append('%s: did not play (%s)'%(label,s))
    return s

def open_home(b,size,reduce=False,base=None):
    c=ctx_for(b,size,reduce);pg=c.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    reqs=[];pg.on('request',lambda r:reqs.append(r.url) if VID.search(r.url) else None)
    pg.goto((base or URL)+'#home',wait_until='load');pg.wait_for_timeout(1200)
    pg.evaluate("()=>{window.__reelErr=0;document.addEventListener('error',e=>{if(e.target.closest&&e.target.closest('#reel'))window.__reelErr++},true)}")
    return c,pg,errs,reqs

def plays(b,size,label,base=None):
    c,pg,errs,reqs=open_home(b,size,base=base)
    pg.locator('#reelPlay').scroll_into_view_if_needed();pg.wait_for_timeout(600)
    if reqs: bad.append('%s: fetched before the press: %s'%(label,reqs[0]))
    press(pg,size[2])
    s=wait_play(pg,label)
    if s:
        if s['err']: bad.append('%s: media error %s'%(label,s['err']))
        if not s['fits']: bad.append('%s: the player is wider than the screen'%label)
        if not s['src'].endswith('reel.webm'): bad.append('%s: played %s, not the WebM'%(label,s['src']))
    if pg.evaluate('window.__reelErr'): bad.append('%s: an error event on the reel'%label)
    if errs: bad.append('%s: %s'%(label,errs[0]))
    print('reel: %-16s plays %s'%(label,'at %.1f s, readyState %d, %s'%(s['t'],s['rs'],s['src'].rsplit('/',1)[-1]) if s else 'no'))
    c.close()

def reduced(b,size,label):
    c,pg,errs,reqs=open_home(b,size,reduce=True)
    press(pg,size[2]);pg.wait_for_timeout(2000)
    s=pg.evaluate(STATE)
    if not s: bad.append(label+': no player after the press')
    else:
        if not s['paused'] or s['t']>0: bad.append('%s: started by itself (%s)'%(label,s))
        if 'Press play' not in s['st']: bad.append('%s: no word that it waits (%r)'%(label,s['st']))
        pg.evaluate("()=>document.querySelector('#reel video').play()")
        wait_play(pg,label+' asked')
    if errs: bad.append('%s: %s'%(label,errs[0]))
    print('reel: %-16s waits for play, then plays'%label)
    c.close()

def missing(b,size,label,junk=False):
    c,pg,errs,reqs=open_home(b,size)
    if junk: pg.route(VID,lambda r:r.fulfill(status=200,content_type='video/webm',body=b'\x1aE\xdf\xa3'+b'junk'*4000))
    else: pg.route(VID,lambda r:r.fulfill(status=404,body='not here'))
    press(pg,size[2]);pg.wait_for_timeout(2500)
    r=pg.evaluate("""()=>{const st=document.getElementById('reelStatus'),a=st.querySelector('a');
      return {video:!!document.querySelector('#reel video'),btn:!!document.getElementById('reelPlay'),
        focus:document.activeElement&&document.activeElement.id,err:st.classList.contains('err'),
        text:st.textContent,link:a&&a.href}}""")
    if r['video']: bad.append(label+': a dead player stays on screen')
    if not r['btn']: bad.append(label+': the poster did not come back')
    if r['focus']!='reelPlay': bad.append('%s: focus is on %r, not the poster'%(label,r['focus']))
    if not r['err'] or 'did not load' not in r['text']: bad.append('%s: no error line (%r)'%(label,r['text']))
    if not r['link'] or not r['link'].endswith('assets/reel.mp4'): bad.append('%s: no link to the file (%r)'%(label,r['link']))
    if errs: bad.append('%s: %s'%(label,errs[0]))
    print('reel: %-16s poster back, %r'%(label,r['text']))
    c.close()

if not (SITE/'assets/reel.webm').exists(): sys.exit('reel: site/assets/reel.webm missing (python3 build.py)')
with sync_playwright() as p:
    b=p.chromium.launch()
    for size,name in (((390,844,True),'390 touch'),((1440,900,False),'1440')):
        plays(b,size,name)
        reduced(b,size,name+' reduced')
        missing(b,size,name+' 404')
    missing(b,(1440,900,False),'1440 bad file',junk=True)
    d=ROOT/'dist'/'ascii-ui.html'
    if d.exists(): plays(b,(1440,900,False),'dist file://',base=d.as_uri())
    b.close()
for x in bad: print('reel:',x)
print('reel: ok' if not bad else 'reel: FAIL')
sys.exit(1 if bad else 0)
