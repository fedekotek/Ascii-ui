"""Makes the two pictures the site shares: assets/og.png and assets/icon-180.png.

python3 qa/shots.py
og.png        1200x630, the share card a link preview shows. Drawn only in
              characters, on the kit's grid: 100 columns by 30 rows of 12x21px
              cells, Geist Mono from kit/fonts/. The wordmark is the site's own
              5x7 title face, shaded like the section titles, over a row of
              components as the kit draws them. The counts come from the page
              itself (Code tabs in Components and Blocks, charts in Charts), so
              they cannot go stale. No version: apps keep a picture for days.
icon-180.png  the favicon (a magenta / on dark) at 180x180, for a phone's home screen.
Run it when the counts, the colors or the favicon change, then python3 build.py
(which gives og.png a new ?v= so apps fetch it again).
"""
import os,re,sys,html
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
IDX=os.path.join(ROOT,'index.html')
FONT=os.path.join(ROOT,'kit','fonts','geist-mono-latin.woff2')
fav=re.search(r'<link rel="icon" type="image/svg\+xml" href="([^"]+)">',open(IDX).read())
if not fav: sys.exit('shots: no svg favicon in index.html')
COLS,ROWS=100,30

# the site's 5x7 bitmap face (js/10-engine.js, F), the letters the wordmark needs
F={'A':'#####|#...#|#...#|#####|#...#|#...#|#...#','S':'#####|#....|#....|#####|....#|....#|#####',
   'C':'#####|#....|#....|#....|#....|#....|#####','I':'#####|..#..|..#..|..#..|..#..|..#..|#####',
   'U':'#...#|#...#|#...#|#...#|#...#|#...#|#####','/':'....#|....#|...#.|..#..|.#...|#....|#....'}
F={k:v.split('|') for k,v in F.items()}
RAMP=' .:=+*#%@'
TIDX=[8,8,7,7,6,6,5]                            # the title ramp, top row loudest (js/10 titleFrame)
BAND=['t0','t0','t1','t1','t2','t2','t3']       # the four title bands, two rows each
# the dark theme's tokens (css/01-tokens.css)
P=dict(bg='#0a0612',ink='#f3eef7',muted='#a79db5',hot='#ff3d9a',pink='#ffb3d9',ok='#c8f02c',
       warn='#ffd23f',t0='#f3eef7',t1='#ffb3d9',t2='#ff3d9a',t3='#9b7bea',onhot='#0a0612')

class Grid:
    def __init__(s): s.c=[[(' ',None)]*COLS for _ in range(ROWS)]
    def put(s,r,c,text,cls=None):
        for i,ch in enumerate(text):
            if 0<=c+i<COLS and 0<=r<ROWS: s.c[r][c+i]=(ch,cls)
    def html(s):
        out=[]
        for row in s.c:
            line,cur,buf=[],None,''
            for ch,cls in row+[(None,'__end')]:
                if cls!=cur:
                    if buf: line.append('<span class="%s">%s</span>'%(cur,html.escape(buf)) if cur else html.escape(buf))
                    buf,cur='',cls
                if ch is not None: buf+=ch
            out.append(''.join(line))
        return '\n'.join(out)

def wordmark(g,top,text='ASCII/UI'):
    # 2 characters per bitmap pixel across, 1 row per pixel down: square pixels on a 12x21 cell
    w=len(text)*6-1;left=(COLS-w*2)//2
    for y in range(7):
        x=0
        for ch in text:
            for px in F[ch][y]:
                if px=='#': g.put(top+y,left+x*2,RAMP[TIDX[y]]*2,('b px '+BAND[y]) if ch!='/' else 'b px hot')
                x+=1
            x+=1

def card(counts):
    g=Grid()
    g.put(1,3,'ascii','ink b');g.put(1,8,'/','hot b');g.put(1,9,'ui','ink b')
    tail='MIT / 0 dependencies / no build step'
    g.put(1,COLS-3-len(tail),tail,'muted')
    wordmark(g,4)
    r=19
    c=3    # primary button: the @ rim, magenta
    g.put(r,c,'@'*20,'hot b');g.put(r+1,c,'@@','hot b');g.put(r+1,c+2,' SEE COMPONENTS ','slab b');g.put(r+1,c+18,'@@','hot b');g.put(r+2,c,'@'*20,'hot b')
    c=26   # secondary: the = rim
    g.put(r,c,'='*17,'ink');g.put(r+1,c,'::','ink');g.put(r+1,c+2,' GET THE KIT ','ink b');g.put(r+1,c+15,'::','ink');g.put(r+2,c,'='*17,'ink')
    c=46   # a field with a prompt
    g.put(r,c,'='*24,'ink');g.put(r+1,c,':','ink');g.put(r+1,c+2,'>','hot b');g.put(r+1,c+4,'reporting-redesign','ink');g.put(r+1,c+23,':','ink');g.put(r+2,c,'='*24,'ink')
    c=73   # toggles: lime confirms
    g.put(r,c,'[','ink');g.put(r,c+1,'@','ok b');g.put(r,c+2,'] Glitch','ink')
    g.put(r+1,c,'[ ] Sound','ink')
    g.put(r+2,c,'[','ink');g.put(r+2,c+1,'@','ok b');g.put(r+2,c+2,'] Dark','ink')
    r=23   # a halftone progress bar and the status badges
    bar='@@@@@@@@@@@@@@@%%%##**++==::..'
    g.put(r,3,'Uptime','muted');g.put(r,11,bar,'hot b');g.put(r,11+len(bar)+1,'62%','ink')
    c=50
    g.put(r,c,'[ LIVE ]','ok b');g.put(r,c+10,'[ DEGRADED ]','warn b');g.put(r,c+24,'[ DOWN ]','hot b')
    g.put(26,3,'.'*(COLS-6),'muted')
    g.put(28,3,'ascii.fedekotek.design','ink b')
    cnt='%d components / %d blocks / %d charts / 2 files'%counts
    g.put(28,COLS-3-len(cnt),cnt,'muted')
    css=f"""
@font-face{{font-family:G;src:url(file://{FONT}) format('woff2');font-weight:100 900}}
*{{margin:0;box-sizing:border-box}}
html,body{{width:1200px;height:630px;overflow:hidden;background:{P['bg']}}}
body{{position:relative;font:400 20px/21px G,monospace;color:{P['ink']};font-kerning:none;font-variant-ligatures:none}}
.scan{{position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0 20px,color-mix(in srgb,{P['ink']} 5%,transparent) 20px 21px)}}
pre{{position:absolute;left:0;top:0;width:1200px;font:inherit;white-space:pre}}
.big{{position:absolute;left:0;right:0;top:{12*21}px;text-align:center;font-size:40px;line-height:42px}}
.big .l1{{font-weight:700;color:{P['ink']}}}
.big .l2{{font-weight:400;color:{P['muted']}}}
.b{{font-weight:700}}
.t0{{color:{P['t0']}}}.t1{{color:{P['t1']}}}.t2{{color:{P['t2']}}}.t3{{color:{P['t3']}}}
.ink{{color:{P['ink']}}}.muted{{color:{P['muted']}}}.hot{{color:{P['hot']}}}.ok{{color:{P['ok']}}}.warn{{color:{P['warn']}}}
.slab{{background:{P['hot']};color:{P['onhot']}}}
.px.t0{{background:color-mix(in srgb,{P['t0']} 26%,{P['bg']})}}.px.t1{{background:color-mix(in srgb,{P['t1']} 26%,{P['bg']})}}
.px.t2{{background:color-mix(in srgb,{P['t2']} 26%,{P['bg']})}}.px.t3{{background:color-mix(in srgb,{P['t3']} 26%,{P['bg']})}}
.px.hot{{background:color-mix(in srgb,{P['hot']} 30%,{P['bg']})}}
"""
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>
<div class="scan"></div><pre>{g.html()}</pre>
<div class="big"><div class="l1">A design system drawn in ASCII.</div><div class="l2">Plain HTML and CSS. Copy it, own it.</div></div>
</body></html>"""

COUNT="""[document.querySelectorAll('#view-kit section[aria-labelledby] .doc-tabs').length,
  document.querySelectorAll('#view-blocks section[aria-labelledby] .doc-tabs').length,
  document.querySelectorAll('#view-charts section[aria-labelledby]').length]"""
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':1200,'height':630},device_scale_factor=1,color_scheme='dark',reduced_motion='reduce')
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+IDX);pg.wait_for_timeout(1500)
    counts=tuple(pg.evaluate(COUNT))
    if not all(counts): errs.append('no counts from the page: '+str(counts))
    og=os.path.join(ROOT,'assets','og.html')
    open(og,'w').write(card(counts))
    pg.goto('file://'+og);pg.evaluate('document.fonts.ready');pg.wait_for_timeout(300)
    if not pg.evaluate("document.fonts.check('20px G')"): errs.append('the card did not get Geist Mono')
    pg.screenshot(path=os.path.join(ROOT,'assets','og.png'))
    os.remove(og)
    ic=ctx.new_page()
    ic.set_viewport_size({'width':180,'height':180})
    ic.set_content('<html><body style="margin:0"><img src="'+fav.group(1).replace('"','&quot;')+'" width="180" height="180" style="display:block"></body></html>')
    ic.wait_for_timeout(200)
    ic.screenshot(path=os.path.join(ROOT,'assets','icon-180.png'))
    b.close()
print('shots: assets/og.png %s, assets/icon-180.png'%(counts,), errs if errs else 'ok')
sys.exit(1 if errs else 0)
