#!/usr/bin/env python3
"""The numbers the page prints are true. Run it after python3 build.py.

  python3 qa/facts.py

How it was made (the end of Home) prints facts about the system: counts,
weights, the release bar. Each number is marked data-fact="name" in index.html,
and each bar of characters under one is marked data-bar="name". This recounts
every fact from the repo and from site/ (what ships), then fails when:

  facts    a data-fact on the page differs from its recount, or a fact
           this script knows is missing from the page
  bars     a bar's length is not its number (one # is one thing, or
           data-per things a #, as long as data-of allows)
  counts   the meta description, share card text, JSON-LD, noscript,
           llms.txt, README.md and the kit lede disagree on the counts
           (components, in the kit, blocks, charts) or on the versions
  rules    each data-rule names a script that is a step of qa/release.sh
           and holds the check the page says it does. Two rules are checked
           here: no em dash in any text file or commit message, and cyan
           (--cy, --accent) painted only by a rule with a focus state
  runtime  site/index.html over http, 1440 wide: no request to anyone else,
           no idle animation frame with reduced motion, and every control
           in the accessibility tree has a name, on every view

One line per group, exits 1 on any failure. Weights allow a few kB of drift,
so an unrelated copy edit does not fail the release; past that, fix the page.
"""
import gzip,json,pathlib,re,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parent.parent
SITE=ROOT/'site'
KB=1024
bad={}
def fail(group,msg): bad.setdefault(group,[]).append(msg)
def read(p): return (ROOT/p).read_text(encoding='utf-8')

html=read('index.html')
js30=read('js/30-lcd-components-docs.js')
js40=read('js/40-themes-ramp-code.js')
release=read('qa/release.sh')
STEPS=re.findall(r'^step (.+)$',release,re.M)

# ---------------------------------------------------------------- recount
F={}
groups=re.search(r'const KIT_GROUPS=\[([\s\S]*?)\]\];',js30).group(1)
comps=re.findall(r"'(s-[a-z]+)'",groups)
F['components']=len(comps)
siteonly=re.search(r'const SITEONLY=\{([\s\S]*?)\n\};',js40).group(1)
F['siteonly']=len(re.findall(r"'s-[a-z]+':'Site only",siteonly))
F['kit']=F['components']-F['siteonly']
F['blocks']=len(re.findall(r'<section data-cat="[a-z]+" aria-labelledby=',html))
charts=html[html.index('<div id="view-charts"'):html.index('<div id="view-themes"')]
F['charts']=len(re.findall(r'<section aria-labelledby="s-',charts))
rels=sorted(p.name for p in (ROOT/'kit'/'releases').iterdir() if p.is_dir())
F['kit-versions']=len(rels)
for v in rels:   # pinned means served under its own path
    for f in ('ascii-ui.css','ascii-ui.js'):
        if not (SITE/'kit'/v/f).exists(): fail('facts','kit %s is not pinned in site/kit/%s/ (python3 build.py)'%(v,v))
F['release-steps']=len(STEPS)
F['qa-scripts']=len(list((ROOT/'qa').glob('*.py')))
sizes=re.search(r'SIZES=\[(.*?)\]\n',read('qa/breakpoints.py')).group(1)
ws=[int(w) for w in re.findall(r'\((\d+),\d+,\d+\)',sizes)]
F['widths'],F['widths-min'],F['widths-max']=len(ws),min(ws),max(ws)
def gz(p): return len(gzip.compress(p.read_bytes(),9))/KB
F['weight-kb']=gz(SITE/'index.html')
F['weight-cap']=int(re.search(r"'index\.html':\s*(\d+)\*KB",read('qa/budget.py')).group(1))
F['kit-files']=2
F['kit-kb']=gz(SITE/'kit'/'ascii-ui.css')+gz(SITE/'kit'/'ascii-ui.js')
F['version']=re.search(r'<meta name="aui-version" content="([\d.]+)">',html).group(1)
F['kit-version']=re.search(r"var VERSION='(\d+\.\d+\.\d+)'",read('kit/ascii-ui.js')).group(1)
DRIFT={'weight-kb':3,'kit-kb':2}   # kB either way
HELPERS={'siteonly'}                # drawn as a bar, not printed

# the accessibility modes: each needs its evidence in the source
css=''.join(p.read_text(encoding='utf-8') for p in sorted((ROOT/'css').glob('*.css')))
kcss=read('kit/ascii-ui.css')
def both(s): return s in css and s in kcss
MODES={
  'keyboard':            both(':focus-visible') and any('nav.py' in s for s in STEPS),
  'screen reader names': None,   # checked at runtime, below
  'reduced motion':      both('(prefers-reduced-motion:reduce)') and any('reduced.py' in s for s in STEPS),
  'forced colors':       both('@media (forced-colors:active)'),
  'more contrast':       both('@media (prefers-contrast:more)'),
  'print':               (ROOT/'css'/'29-print.css').exists() and both('@media print'),
  'touch':               both('(pointer:coarse)'),
}
F['a11y-modes']=len(MODES)
F['a11y-list']=', '.join(MODES)
F['requests']=None       # runtime
F['idle-frames']=None    # runtime

# ---------------------------------------------------------------- the page
shown=re.findall(r'<span\b[^>]*\bdata-fact="([a-z0-9-]+)"[^>]*>([^<]*)</span>',html)
seen=set()
for name,text in shown:
    seen.add(name)
    if name not in F: fail('facts','data-fact="%s" is not a fact this script knows'%name);continue
    want=F[name]
    if want is None: F[name]=text;continue   # runtime facts: the page's claim, checked below
    if name in DRIFT:
        if abs(float(text)-want)>DRIFT[name]: fail('facts','%s: the page says %s, it is %.1f'%(name,text,want))
    elif str(want)!=text.strip():
        fail('facts','%s: the page says %r, it is %r'%(name,text,str(want)))
for name in F:
    if name not in seen and name not in HELPERS: fail('facts','%s is not on the page (data-fact="%s")'%(name,name))
for name,ok in MODES.items():
    if ok is False: fail('facts','accessibility mode %r has no evidence in the source'%name)

# bars: one character is one thing, or data-per things
for attrs,text in re.findall(r'<span\b([^>]*\bdata-bar="[a-z0-9-]+"[^>]*)>([^<]*)</span>',html):
    name=re.search(r'data-bar="([a-z0-9-]+)"',attrs).group(1)
    per=re.search(r'data-per="(\d+)"',attrs);per=int(per.group(1)) if per else 1
    val=F.get(name)
    if val is None: fail('bars','data-bar="%s" has no fact'%name);continue
    num=next((t for n,t in shown if n==name),val)
    want=round(float(num)/per)
    if len(text)!=want: fail('bars','%s: %d characters, %s/%d is %d'%(name,len(text),num,per,want))
    of=re.search(r'data-of="([a-z0-9-]+)"',attrs)
    if of:
        m=re.search(r'data-bar="%s"[^>]*>[^<]*</span><span[^>]*>([^<]*)</span>'%name,html)
        total=len(text)+(len(m.group(1)) if m else 0)
        if total!=round(F[of.group(1)]/per): fail('bars','%s: the row is %d long, %s/%d is %d'%(name,total,of.group(1),per,round(F[of.group(1)]/per)))

# ---------------------------------------------------------------- counts elsewhere
N={'thirty-two':32,'thirty-four':34}
def num(s): return int(s) if s.isdigit() else N.get(s.lower(),-1)
def counts(where,text):
    hits=0
    for m in re.finditer(r'\b(\d+|[Tt]hirty-[a-z]+) (?:UI )?components\b(.{0,40})',text):
        n=num(m.group(1));hits+=1
        if n==F['components']: continue
        if n==F['kit'] and re.search(r'kit|two files',m.group(2)): continue
        fail('counts','%s: "%s components"'%(where,m.group(1)))
    for m in re.finditer(r'\b(\d+) (?:of them )?(?:are )?in the kit\b',text):
        hits+=1
        if int(m.group(1))!=F['kit']: fail('counts','%s: "%s in the kit"'%(where,m.group(1)))
    for m in re.finditer(r'\b(\d+) of the (\d+)\b',text):
        hits+=1
        if (int(m.group(1)),int(m.group(2)))!=(F['kit'],F['components']): fail('counts','%s: "%s of the %s"'%(where,m.group(1),m.group(2)))
    for pat,key in ((r'\bBlocks \((\d+)\)','blocks'),(r'\b(\d+) page-sized','blocks'),(r'\b(\d+) blocks\b','blocks'),
                    (r'\bCharts \((\d+)\)','charts'),(r'\b(\d+) character-grid charts','charts'),(r'\b(\d+) charts\b','charts')):
        for m in re.finditer(pat,text):
            hits+=1
            if int(m.group(1))!=F[key]: fail('counts','%s: %r says %s, it is %d'%(where,m.group(0),m.group(1),F[key]))
    return hits
def meta(attr,val):
    m=re.search(r'<meta %s="%s" content="([^"]*)"'%(attr,re.escape(val)),html)
    if not m: fail('counts','no <meta %s="%s">'%(attr,val));return ''
    return m.group(1)
places={
  'meta description':    meta('name','description'),
  'og:description':      meta('property','og:description'),
  'twitter:description': meta('name','twitter:description'),
  'JSON-LD':             re.search(r'<script type="application/ld\+json">([\s\S]*?)</script>',html).group(1),
  'noscript':            re.search(r'<noscript><section[\s\S]*?</noscript>',html).group(0),
  'Components lede':     re.search(r'<div id="view-kit"[\s\S]*?</p></div>',html).group(0),
  'llms.txt':            read('llms.txt'),
  'README.md':           read('README.md'),
}
for where,text in places.items():
    if not counts(where,text): fail('counts','%s: no count found to check'%where)
counts('index.html',html)
# the noscript list names every component
ns=places['noscript']
m=re.search(r'<p>\d+ components\. (.*?)</p>',ns)
if m:
    names=[x.strip() for part in re.split(r'\b(?:Form|Overlay|Display|Feedback|Navigation): ',m.group(1)) for x in part.rstrip('. ').split(',') if x.strip()]
    if len(names)!=F['components']: fail('counts','noscript lists %d components, there are %d'%(len(names),F['components']))
else: fail('counts','noscript: no component list')
# versions
ld=json.loads(places['JSON-LD'])
kv=[g.get('version') for g in ld['@graph'] if g.get('version')]
if kv!=[F['kit-version']]: fail('counts','JSON-LD kit version %s, the kit is %s'%(kv,F['kit-version']))
if F['kit-version'] not in rels: fail('counts','kit %s is not in kit/releases/'%F['kit-version'])
for where in ('README.md','llms.txt'):
    pins=set(re.findall(r'/kit/(\d+\.\d+\.\d+)/ascii-ui\.(?:css|js)',read(where)))
    if pins!={F['kit-version']}: fail('counts','%s pins the kit at %s, it is %s'%(where,sorted(pins),F['kit-version']))
foot=re.search(r'ascii/ui v([\d.]+)\.',html)
if not foot or foot.group(1)!=F['version']: fail('counts','the footer says v%s, the page is %s'%(foot and foot.group(1),F['version']))
for m in re.finditer(r'It runs (\d+) steps|(\d+) of \d+ steps',html):
    if int(m.group(1) or m.group(2))!=F['release-steps']: fail('counts','index.html: %r, the bar has %d'%(m.group(0),F['release-steps']))

# ---------------------------------------------------------------- rules
# each rule on the page names a script in the release bar that holds its check
HOLDS={
  'facts.py':       'chr(0x2014)',                     # this file: em dashes and cyan
  'breakpoints.py': 'off the character grid',
  'reduced.py':     'AudioContext',
  'clock.py':       'setInterval',
  'budget.py':      'loads from elsewhere',
  'audit.py':       'r.height<40',
}
for s in sorted(set(re.findall(r'data-rule="([a-z.]+)"',html))):
    if not any(st.split()[1]=='qa/'+s for st in STEPS): fail('rules','%s is on the page but not a step of qa/release.sh'%s)
    if s not in HOLDS or HOLDS[s] not in read('qa/'+s): fail('rules','%s does not hold the check the page pairs it with'%s)

# no em dash: every text file in the repo and what ships, and the commit log
DASH=chr(0x2014)   # spelled as a number, so this file holds none
TEXT={'.html','.css','.js','.md','.txt','.py','.sh','.json','.svg','.xml'}
# what git tracks, plus what the build writes: never a virtual env or a stray download
try: tracked=subprocess.run(['git','-C',str(ROOT),'ls-files'],capture_output=True,text=True,timeout=30).stdout.split('\n')
except (OSError,subprocess.SubprocessError): tracked=[]
files={ROOT/f for f in tracked if f}|{p for d in ('site','dist') for p in (ROOT/d).rglob('*')}
for p in sorted(files):
    if not p.is_file() or p.suffix not in TEXT or 'archive' in p.relative_to(ROOT).parts: continue
    t=p.read_text(encoding='utf-8',errors='ignore')
    if p.name=='usage.py': t=t.replace("'%s' in w"%DASH,'')   # its own dash check
    if DASH in t:
        ln=t[:t.index(DASH)].count('\n')+1
        fail('rules','an em dash in %s:%d'%(p.relative_to(ROOT),ln))
try:
    # only commits main does not have yet: those can still be reworded, published ones cannot
    base=subprocess.run(['git','-C',str(ROOT),'rev-parse','--verify','-q','origin/main'],capture_output=True,text=True,timeout=30).stdout.strip()
    log=subprocess.run(['git','-C',str(ROOT),'log','--format=%h %B',base+'..HEAD'],capture_output=True,text=True,timeout=30).stdout if base else ''
    for c in re.split(r'\n(?=[0-9a-f]{7,} )',log):
        if DASH in c: fail('rules','an em dash in commit %s'%c.split()[0])
except (OSError,subprocess.SubprocessError): pass

# cyan means focus: a rule that paints with --cy or --accent needs a focus state.
# The three below are focus states by other means, and say so.
FOCUS=r':focus|aria-selected|:root|\[data-preset'
BY_OTHER_MEANS={
  '.sw::before,.sw::after',               # the brackets are hidden until the input has :focus-visible
  '.skip',                                # off screen until :focus
  '.opts [role="option"][data-active]',   # the active descendant: where the keyboard is in a listbox
}
for name,text in [(p.name,p.read_text(encoding='utf-8')) for p in sorted((ROOT/'css').glob('*.css'))]+[('kit/ascii-ui.css',kcss)]:
    t=re.sub(r'/\*[\s\S]*?\*/','',text)
    for sel,body in re.findall(r'([^{}]+)\{([^{}]*)\}',t):
        sel=' '.join(sel.split())
        if re.search(r'var\(--(?:cy|accent)\)',body) and not re.search(FOCUS,sel) and sel not in BY_OTHER_MEANS:
            fail('rules','%s: %s paints cyan without a focus state'%(name,sel[:80]))

# ---------------------------------------------------------------- runtime
def runtime():
    import functools,http.server,threading
    from playwright.sync_api import sync_playwright
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*a): pass
    h=functools.partial(Quiet,directory=str(SITE))
    srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),h);threading.Thread(target=srv.serve_forever,daemon=True).start()
    url='http://127.0.0.1:%d/'%srv.server_port
    ROLES={'button','link','textbox','checkbox','radio','slider','combobox','switch','tab','menuitem','spinbutton',
           'searchbox','listbox','menuitemcheckbox','menuitemradio','radiogroup','tablist','dialog','alertdialog','img','application'}
    FRAMES="""s=>new Promise(res=>{let r=0;const o=window.requestAnimationFrame;
      window.requestAnimationFrame=cb=>o(t=>{r++;cb(t)});setTimeout(()=>{window.requestAnimationFrame=o;res(r)},s*1000)})"""
    outside,frames,unnamed,controls=set(),0,[],0
    with sync_playwright() as p:
        b=p.chromium.launch()
        ctx=b.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce')
        ctx.add_init_script("try{sessionStorage.setItem('aui-boot','1')}catch(e){}")
        ctx.on('request',lambda r:outside.add(r.url) if not re.match(r'(https?://127\.0\.0\.1:\d+/|data:|blob:|about:)',r.url) else None)
        for v in ['home','components','blocks','charts','themes']:
            pg=ctx.new_page();pg.goto(url+'#'+v,wait_until='load');pg.wait_for_timeout(2500)
            frames+=pg.evaluate(FRAMES,2)
            cdp=ctx.new_cdp_session(pg)
            for x in cdp.send('Accessibility.getFullAXTree')['nodes']:
                role=x.get('role',{}).get('value')
                if x.get('ignored') or role not in ROLES: continue
                controls+=1
                if not (x.get('name') or {}).get('value','').strip(): unnamed.append('%s: a %s'%(v,role))
            pg.close()
        ctx.close();b.close()
    srv.shutdown()
    if str(len(outside))!=str(F['requests']).strip(): fail('runtime','requests to anyone else: the page says %s, there were %d %s'%(F['requests'],len(outside),sorted(outside)[:3]))
    if str(frames)!=str(F['idle-frames']).strip(): fail('runtime','idle frames with reduced motion: the page says %s, there were %d'%(F['idle-frames'],frames))
    if unnamed: fail('runtime','%d controls without a name: %s'%(len(unnamed),unnamed[:5]))
    return controls,frames,len(outside)

if not (SITE/'index.html').exists(): fail('runtime','site/index.html is missing (python3 build.py)')
else:
    c,fr,rq=runtime()
    print('runtime  %d named controls, %d idle frames, %d outside requests'%(c,fr,rq))
print('facts    %d facts, %d marks on the page'%(len(F),len(shown)))
for g in ('facts','bars','counts','rules','runtime'):
    print('%-8s %s'%(g,'ok' if g not in bad else 'FAIL\n  '+'\n  '.join(bad[g])))
print('facts: ok' if not bad else 'facts: FAIL')
sys.exit(1 if bad else 0)
