"""Reduced motion, with scripts on and with scripts off.

python3 qa/reduced.py [--dist|--site]
For each of: scripts on, scripts off (390 phone and 1440 desktop):
  boot    the loader (#boot) does not cover the page after 1s
  anim    no css animation is running (after the page settles and after a view switch)
  audio   no AudioContext is ever created, even after a tap and a key
  errors  zero page errors
One line per case, exits non-zero if any fails.
"""
import asyncio,os,sys
from playwright.async_api import async_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
PAGE='dist/ascii-ui.html' if '--dist' in sys.argv else ('site/index.html' if '--site' in sys.argv else 'index.html')
URL='file://'+os.path.join(ROOT,PAGE)

# counts every AudioContext made, however it is spelled
SPY="""(()=>{window.__ac=0;for(const k of ['AudioContext','webkitAudioContext']){const C=window[k];if(!C)continue;
  window[k]=new Proxy(C,{construct(t,a){window.__ac++;return Reflect.construct(t,a)}})}})()"""
# is the loader in the way: there, drawn, and on top of the middle of the screen
BOOT="""(()=>{const b=document.getElementById('boot');if(!b)return false;const cs=getComputedStyle(b);
  if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false;
  const e=document.elementFromPoint(innerWidth/2,innerHeight/2);return !!(e&&b.contains(e))})()"""
ANIM="""(()=>document.getAnimations?document.getAnimations().filter(a=>a.playState==='running'&&a.effect&&a.effect.getComputedTiming().duration>0)
  .map(a=>(a.animationName||a.transitionProperty||'anim')+' on '+((a.effect.target&&(a.effect.target.id||a.effect.target.className))||'?')).slice(0,6):[])()"""

async def case(b,js,w,h):
    ctx=await b.new_context(viewport={'width':w,'height':h},color_scheme='dark',reduced_motion='reduce',java_script_enabled=js)
    await ctx.add_init_script(SPY)
    pg=await ctx.new_page();errs=[];fails=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL);await pg.wait_for_timeout(1000)
    # with scripts off evaluate still works: it is the page's own scripts that are off
    if await pg.evaluate(BOOT): fails.append('boot covers the page after 1s')
    await pg.wait_for_timeout(1500)
    a=await pg.evaluate(ANIM)
    if a: fails.append('running: '+', '.join(a))
    if js:
        await pg.mouse.click(w//2,h//2);await pg.keyboard.press('ArrowDown')
        await pg.evaluate("(()=>{const t=document.getElementById('v-kit');if(t)t.click()})()");await pg.wait_for_timeout(1200)
        a=await pg.evaluate(ANIM)
        if a: fails.append('running after a view switch: '+', '.join(a))
        n=await pg.evaluate("window.__ac")
        if n: fails.append(f'{n} AudioContext made')
    if errs: fails.append('errors: '+'; '.join(errs[:3]))
    await ctx.close()
    return fails

async def main():
    bad=0
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for js in (True,False):
            for w,h in [(390,844),(1440,900)]:
                f=await case(b,js,w,h)
                print(f"reduced {'js' if js else 'no-js'} {w}x{h}:",'ok' if not f else f)
                bad+=bool(f)
        await b.close()
    print('reduced:','ok' if not bad else f'{bad} failing')
    return bad
sys.exit(1 if asyncio.run(main()) else 0)
