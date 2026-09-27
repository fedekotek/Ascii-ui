"""Themes > Download tokens.json, and site/kit/tokens.json: the tokens for design tools.

python3 qa/tokens.py       print `tokens: ok` or the failures (exit 1)

Checks:
1. site/kit/tokens.json is there (python3 build.py writes it), parses, and is
   what build.py makes from the source now
2. DTCG shape: the sets global, light and dark plus $themes and $metadata;
   every leaf has $value and $type, a known type, and a value of that type;
   every group holds something; nothing else sits next to a $value
3. every color, in both sets, is the computed CSS variable on the page with
   that theme on the root
4. the button, pressed with the keyboard and with a click, from index.html,
   dist/ascii-ui.html (file://) and site/index.html (over http, the kit text
   fetched on first use), in a light and a dark system setting: the same
   bytes as site/kit/tokens.json, the status says Downloading tokens.json.,
   the root keeps its attributes and there are no console errors
5. Amber CRT: dark is Amber's computed colors, light is the default light,
   and it says so. A color of your own lands in its mode and says so
"""
import asyncio,functools,http.server,json,os,re,sys,threading
from playwright.async_api import async_playwright

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
sys.path.insert(0,ROOT)
import build

STATIC=os.path.join(ROOT,'site','kit','tokens.json')
TYPES={'color':lambda v:isinstance(v,str) and re.fullmatch(r'#[0-9a-f]{6}',v),
       'dimension':lambda v:isinstance(v,str) and re.fullmatch(r'\d+(\.\d+)?px',v),
       'duration':lambda v:isinstance(v,str) and re.fullmatch(r'\d+ms',v),
       'fontFamily':lambda v:isinstance(v,str) and v.strip()!='',
       'fontWeight':lambda v:isinstance(v,int) and 1<=v<=1000,
       'string':lambda v:isinstance(v,str) and v!=''}

def shape(d):
    bad=[]
    if not isinstance(d,dict): return ['the file is not an object']
    if sorted(d)!=sorted(['global','light','dark','$themes','$metadata']):
        bad.append('top level is %s, not global, light, dark, $themes, $metadata'%sorted(d))
    if d.get('$metadata',{}).get('tokenSetOrder')!=['global','light','dark']: bad.append('$metadata.tokenSetOrder is not global, light, dark')
    for t in d.get('$themes',[]):
        if set(t.get('selectedTokenSets',{}))!={'global','light','dark'}: bad.append('$themes %s does not name the three sets'%t.get('id'))
    def walk(n,path):
        if not isinstance(n,dict): bad.append(path+': not an object'); return
        if '$value' in n:
            t=n.get('$type')
            if t not in TYPES: bad.append(path+': $type %r'%t)
            elif not TYPES[t](n['$value']): bad.append(path+': %r is not a %s'%(n['$value'],t))
            extra=[k for k in n if not k.startswith('$')]
            if extra: bad.append(path+': a token with children %s'%extra)
            if '$description' in n and not isinstance(n['$description'],str): bad.append(path+': $description is not text')
            return
        kids=[k for k in n if not k.startswith('$')]
        if not kids: bad.append(path+': an empty group')
        for k in n:
            if k.startswith('$') and k!='$description': bad.append(path+': %s on a group'%k)
        for k in kids: walk(n[k],path+'.'+k)
    for s in ('global','light','dark'):
        if s in d: walk(d[s],s)
    for s in ('light','dark'):
        if s in d and not str(d[s].get('color',{}).get('$description','')).strip(): bad.append(s+': the mode says nothing about itself')
    return bad


HEX='''k=>{const c=getComputedStyle(document.documentElement).getPropertyValue('--'+k).trim();
  if(c[0]==='#')return (c.length===4?'#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]:c.slice(0,7)).toLowerCase();
  const m=c.match(/\\d+(\\.\\d+)?/g);return m?'#'+m.slice(0,3).map(n=>('0'+Math.round(+n).toString(16)).slice(-2)).join(''):c}'''
ATTRS="['data-theme','data-preset','style'].map(n=>document.documentElement.getAttribute(n))"

def watch(pg,errs):
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror',lambda e:errs.append(str(e)))

async def themes(pg):
    await pg.evaluate("document.getElementById('v-themes').click()"); await pg.wait_for_timeout(900)

async def press(pg,how):
    """the button, by keyboard or by click; the file's text and the status line"""
    await pg.evaluate("document.getElementById('tokensJson').scrollIntoView({block:'center'})")
    async with pg.expect_download(timeout=15000) as dl:
        if how=='key':
            await pg.focus('#tokensJson'); await pg.keyboard.press('Enter')
        else: await pg.click('#tokensJson')
    d=await dl.value
    txt=open(await d.path(),encoding='utf-8').read()
    await pg.wait_for_timeout(200)
    st=await pg.evaluate("document.getElementById('tokensStatus').textContent")
    return d.suggested_filename,txt,st

def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*a): pass
    h=functools.partial(Quiet,directory=os.path.join(ROOT,'site'))
    s=http.server.ThreadingHTTPServer(('127.0.0.1',0),h)
    threading.Thread(target=s.serve_forever,daemon=True).start()
    return s

async def main():
    fails=[]
    if not os.path.exists(STATIC):
        print('tokens: site/kit/tokens.json is missing, run python3 build.py'); sys.exit(1)
    static=open(STATIC,encoding='utf-8').read()
    try: data=json.loads(static)
    except ValueError as e: print('tokens: site/kit/tokens.json is not JSON: %s'%e); sys.exit(1)
    if static!=build.tokens_json(): fails.append('site/kit/tokens.json is not what build.py makes now: run python3 build.py')
    fails+=['shape: '+b for b in shape(data)]
    if chr(0x2014) in static: fails.append('site/kit/tokens.json: an em dash')
    srv=serve()
    pages=[('index.html','file://'+os.path.join(ROOT,'index.html')),
           ('dist','file://'+os.path.join(ROOT,'dist','ascii-ui.html')),
           ('site','http://127.0.0.1:%d/index.html'%srv.server_address[1])]
    async with async_playwright() as p:
        b=await p.chromium.launch()
        # 3. the colors are the page's, per theme
        pg=await b.new_page(viewport={'width':1440,'height':900})
        errs=[];watch(pg,errs)
        await pg.goto(pages[0][1]); await pg.wait_for_timeout(1500)
        for mode in ('light','dark'):
            await pg.evaluate("t=>{const r=document.documentElement;r.setAttribute('data-theme',t);r.removeAttribute('data-preset')}",mode)
            for k,n in data[mode]['color'].items():
                if k.startswith('$'): continue
                v=await pg.evaluate(HEX,k)
                if v!=n['$value']: fails.append('%s.color.%s is %s, the page says %s'%(mode,k,n['$value'],v))
        row=await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--r').trim()")
        if data['global']['grid']['row']['$value']!=row: fails.append('grid.row is %s, the page says %s'%(data['global']['grid']['row']['$value'],row))
        fails+=['colors: '+e for e in errs]
        await pg.close()
        # 4. the button makes the same file, everywhere, both system settings
        for name,url in pages:
            for scheme,how in (('dark','key'),('light','click')):
                if not os.path.exists(url[7:]) and url.startswith('file://'):
                    fails.append(name+': missing, run python3 build.py'); break
                ctx=await b.new_context(viewport={'width':390,'height':844},color_scheme=scheme,accept_downloads=True)
                pg=await ctx.new_page();errs=[];watch(pg,errs)
                await pg.goto(url); await pg.wait_for_timeout(1500)
                await themes(pg)
                before=await pg.evaluate(ATTRS)
                try: fn,txt,st=await press(pg,how)
                except Exception as e:
                    fails.append('%s %s %s: no download (%s)'%(name,scheme,how,str(e)[:80])); await ctx.close(); continue
                after=await pg.evaluate(ATTRS)
                tag='%s %s %s'%(name,scheme,how)
                if fn!='tokens.json': fails.append(tag+': the file is called %s'%fn)
                if txt!=static: fails.append(tag+': the download is not site/kit/tokens.json')
                if st!='Downloading tokens.json.': fails.append(tag+': the status says %r'%st)
                if before!=after: fails.append(tag+': the root changed, %s then %s'%(before,after))
                fails+=[tag+': '+e for e in errs]
                await ctx.close()
        # 5. a preset, and a color of your own
        ctx=await b.new_context(viewport={'width':1440,'height':900},color_scheme='light',accept_downloads=True)
        pg=await ctx.new_page();errs=[];watch(pg,errs)
        await pg.goto(pages[0][1]); await pg.wait_for_timeout(1500)
        await themes(pg)
        await pg.evaluate("(()=>{const r=document.querySelector('input[name=preset][value=amber]');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}))})()")
        await pg.wait_for_timeout(1500)
        amber={}
        for k in data['dark']['color']:
            if not k.startswith('$'): amber[k]=await pg.evaluate(HEX,k)
        _,txt,_=await press(pg,'click')
        a=json.loads(txt)
        for k,v in amber.items():
            if a['dark']['color'][k]['$value']!=v: fails.append('amber: dark.color.%s is %s, the page says %s'%(k,a['dark']['color'][k]['$value'],v))
        if {k:n['$value'] for k,n in a['light']['color'].items() if not k.startswith('$')}!={k:n['$value'] for k,n in data['light']['color'].items() if not k.startswith('$')}:
            fails.append('amber: light is not the default light')
        if 'Amber CRT' not in a['dark']['color']['$description'] or 'Amber CRT' not in a['light']['color']['$description']:
            fails.append('amber: the modes do not say Amber CRT')
        fails+=['amber: '+b for b in shape(a)]
        await pg.evaluate("(()=>{const i=document.getElementById('c-hot');i.value='#123456';i.dispatchEvent(new Event('input',{bubbles:true}))})()")
        await pg.wait_for_timeout(300)
        _,txt,_=await press(pg,'click')
        a=json.loads(txt)
        if a['dark']['color']['hot']['$value']!='#123456': fails.append('your color: dark.color.hot is %s'%a['dark']['color']['hot']['$value'])
        if 'With your colors' not in a['dark']['color']['$description']: fails.append('your color: the dark mode does not say so')
        if a['light']['color']['hot']['$value']!=data['light']['color']['hot']['$value']: fails.append('your color: it leaked into light')
        fails+=['amber: '+e for e in errs]
        await ctx.close()
        await b.close()
    srv.shutdown()
    if fails:
        for f in fails: print('tokens: '+f)
        sys.exit(1)
    print('tokens: ok')

asyncio.run(main())
