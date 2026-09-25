import asyncio,json
from playwright.async_api import async_playwright
JS="""(()=>{/* a target is small if it is under 40px tall or under 40px wide */const out={small:[],tiny:[],cover:0};
document.querySelectorAll('button,a,input,select,textarea,summary,[role=button],[tabindex="0"]').forEach(e=>{
 if(e.closest('[hidden]')||e.hidden||e.type==='hidden')return;const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
 const cs=getComputedStyle(e);const pad=parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom);
 if((r.height<40||r.width<40)&&e.tagName!=='INPUT')out.small.push((e.id||e.className||e.tagName)+' '+Math.round(r.width)+'x'+Math.round(r.height)+' "'+(e.textContent||'').trim().slice(0,14)+'"');});
document.querySelectorAll('main *').forEach(e=>{if(e.closest('[hidden]')||e.closest('pre,canvas,.hud'))return;const fs=parseFloat(getComputedStyle(e).fontSize);if(e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim())&&fs<12)out.tiny.push(e.tagName+'.'+e.className+' '+fs)});
out.small=[...new Set(out.small)];return out})()"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':390,'height':844},color_scheme='dark')
        await pg.goto('file://'+__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','index.html'))+''); await pg.wait_for_timeout(2600); await pg.mouse.click(200,300)
        for v in ['home','kit','blocks','charts','themes']:
            await pg.evaluate(f"(()=>{{const t=document.getElementById('v-{v}');if(t.getAttribute('aria-selected')!=='true')t.click()}})()"); await pg.wait_for_timeout(1400)
            r=await pg.evaluate(JS); print(v,'small:',len(r['small']),r['small'][:12],'tiny:',r['tiny'][:5])
        await b.close()
asyncio.run(main())
