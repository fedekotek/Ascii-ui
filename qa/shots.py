"""Makes the two pictures the site shares: assets/og.png and assets/icon-180.png.

python3 qa/shots.py
og.png        1200x630, the Home hero in the dark theme with reduced motion,
              so it is the same picture every time. What a link preview shows.
icon-180.png  the favicon (a magenta / on dark) at 180x180, for a phone's home screen.
Run it when the hero or the favicon changes, then python3 build.py.
"""
import os,re,sys
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
IDX=os.path.join(ROOT,'index.html')
fav=re.search(r'<link rel="icon" type="image/svg\+xml" href="([^"]+)">',open(IDX).read())
if not fav: sys.exit('shots: no svg favicon in index.html')
with sync_playwright() as p:
    b=p.chromium.launch()
    # the font comes through a proxy here, so its certificate is not checked: this is a picture, not a test
    ctx=b.new_context(viewport={'width':1200,'height':630},device_scale_factor=1,color_scheme='dark',
                      reduced_motion='reduce',ignore_https_errors=True)
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+IDX)
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(2500)
    pg.screenshot(path=os.path.join(ROOT,'assets','og.png'))
    ic=ctx.new_page()
    ic.set_viewport_size({'width':180,'height':180})
    ic.set_content('<html><body style="margin:0"><img src="'+fav.group(1).replace('"','&quot;')+'" width="180" height="180" style="display:block"></body></html>')
    ic.wait_for_timeout(200)
    ic.screenshot(path=os.path.join(ROOT,'assets','icon-180.png'))
    b.close()
print('shots: assets/og.png, assets/icon-180.png', errs if errs else 'ok')
sys.exit(1 if errs else 0)
