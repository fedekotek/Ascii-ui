#!/usr/bin/env python3
"""Build what ships. Standard library only.

  python3 build.py           write dist/ascii-ui.html and site/
  python3 build.py --check   build into a temporary folder and compare it with
                             dist/ and site/ on disk. Exits 1 and lists the files
                             that differ, so a stale deploy cannot be committed.

1. dist/ascii-ui.html  index.html with css/ and js/ inlined, the single file.
2. site/               the folder Vercel serves (vercel.json: outputDirectory).
                       It is committed, so the deploy needs no build step:
     index.html        the single file, with a Content-Security-Policy, and the
                       kit text for the Code tab fetched on first use (LAZY_KIT)
     ascii-ui.html     the single file with everything embedded, served as a download
     404.html          what a wrong address gets
     robots.txt, sitemap.xml
     favicon.ico       for search results and browsers that ask for it by name
     LICENSE.txt       the MIT license, also in kit/ and every kit/<version>/
     assets/           og.png (the share picture), icon-180.png (the home screen icon),
                       reel.webm, reel.mp4 and reel-poster.jpg (Home, How it was made; the video
                       loads only when someone presses play)
     llms.txt          a copy of llms.txt at the repo root, when it exists
     llms-full.txt     every component in full, written by qa/reference.py
     kit/              a copy of kit/, when that folder exists: the latest kit
     kit/<version>/    every released kit, from kit/releases/<version>/, at an
                       address that never changes (pin it, and it stays put)

Nothing else in the repo (docs, qa, CLAUDE.md, archive) is published.
The version is the aui-version meta in index.html; the footer must say the same.

Every build is the same bytes for the same source, so --check can compare:
no dates, no random ids. The switches below are what changes between copies.

The font: index.html links assets/fonts/geist-mono-site.woff2 (the characters
the site uses, 12 kB). Every built copy carries it as a data: URL, so the page
makes no request for it, from file:// too.

The kit has its own version, ASCIIUI.version in kit/ascii-ui.js, and both kit
files say it in their first line. The first build of a version freezes
ascii-ui.css and ascii-ui.js (and kit/fonts/) into kit/releases/<version>/.
After that the kit files must match the frozen copy: a change to the kit needs
a new version (ascii-ui.js, both headers, kit/CHANGELOG.md). Until a version
has shipped, delete its kit/releases/<version>/ folder and build again to
refreeze it.
"""
import re,pathlib,shutil,sys,tempfile,filecmp,hashlib,base64,json
root=pathlib.Path(__file__).resolve().parent
SITE_URL='https://ascii.fedekotek.design'
SITE_ASSETS=['og.png','icon-180.png','reel.webm','reel.mp4','reel-poster.jpg']
KIT_FILES=['ascii-ui.css','ascii-ui.js']
FONT='assets/fonts/geist-mono-site.woff2'

MINIFY=True      # strip comments and indentation from the inlined css and js, every copy
LAZY_KIT=True    # site/index.html only: the Code tab's kit text is fetched from kit/<version>/
                 # the first time Code or a kit download is asked for. dist/ and the
                 # download keep it embedded, so they work from file://
CSP=True         # site/index.html only: a Content-Security-Policy meta with the hash of
                 # every inline script. vercel.json adds the rules a meta cannot carry
ANALYTICS=False  # site/index.html only: Vercel Web Analytics, loaded only on
                 # https://ascii.fedekotek.design. Never in dist/ or the download.
                 # Turning it on: update the privacy words (ARCHITECTURE says no analytics)

# ---------------- minify: standard library, keeps every line break ----------------
# JS: drops comments (keeps /*! ... */), leading and trailing whitespace, blank
# lines, runs of spaces. Every line break stays, so automatic semicolon insertion
# reads the code as before. Strings, template literals and regex literals pass
# through untouched. CSS: drops comments (keeps /*!), collapses whitespace, trims
# it around { } ; , and drops the ; before }. Strings pass through untouched.
KW_BEFORE_REGEX={'return','typeof','case','do','else','in','of','new','delete','void','throw','yield','await','instanceof'}
def min_js(src):
    out=[];i=0;n=len(src);stack=[]   # brace depths for template ${ }
    last='';lastword=''              # the last character and word that were not space or comment
    def emit(s):
        nonlocal last,lastword
        out.append(s)
        t=s.rstrip(' \t\n')
        if t:
            last=t[-1]
            m=re.search(r'[A-Za-z_$][\w$]*$',t);lastword=m.group(0) if m else ''
    while i<n:
        c=src[i]
        if c in '"\'':
            j=i+1
            while j<n and src[j]!=c:
                if src[j]=='\\':j+=1
                j+=1
            emit(src[i:j+1]);i=j+1;continue
        if c=='`' or (c=='}' and stack and stack[-1]==0):
            if c=='}':stack.pop()
            j=i+1
            while j<n:
                if src[j]=='\\':j+=2;continue
                if src[j]=='`':j+=1;break
                if src[j]=='$' and j+1<n and src[j+1]=='{':stack.append(0);j+=2;break
                j+=1
            emit(src[i:j]);i=j;continue
        if c=='{' and stack:stack[-1]+=1
        if c=='}' and stack and stack[-1]>0:stack[-1]-=1
        if c=='/' and i+1<n and src[i+1]=='/':
            j=src.find('\n',i);j=n if j<0 else j;i=j;continue
        if c=='/' and i+1<n and src[i+1]=='*':
            j=src.find('*/',i+2);j=n if j<0 else j+2
            body=src[i:j]
            if body.startswith('/*!'):emit(body)
            else:out.append('\n' if '\n' in body else ' ')
            i=j;continue
        if c=='/':
            regex=(last=='' or last in '(,=:[!&|?{};+-*%<>~^' or lastword in KW_BEFORE_REGEX) and last not in ')]'
            if last and (last.isalnum() or last in '_$)]') and lastword not in KW_BEFORE_REGEX:regex=False
            if regex:
                j=i+1;cls=False
                while j<n:
                    ch=src[j]
                    if ch=='\\':j+=2;continue
                    if ch=='[':cls=True
                    elif ch==']':cls=False
                    elif ch=='/' and not cls:break
                    elif ch=='\n':break
                    j+=1
                j+=1
                while j<n and src[j].isalpha():j+=1
                emit(src[i:j]);i=j;continue
        if c in ' \t':
            j=i
            while j<n and src[j] in ' \t':j+=1
            out.append(' ');i=j;continue
        emit(c);i+=1
    lines=[l.strip() for l in ''.join(out).split('\n')]
    return '\n'.join(l for l in lines if l)+'\n'

def min_css(src):
    out=[];i=0;n=len(src)
    while i<n:
        c=src[i]
        if c in '"\'':
            j=i+1
            while j<n and src[j]!=c:
                if src[j]=='\\':j+=1
                j+=1
            out.append(src[i:j+1]);i=j+1;continue
        if src.startswith('/*',i):
            j=src.find('*/',i+2);j=n if j<0 else j+2
            if src.startswith('/*!',i):out.append(src[i:j])
            i=j;continue
        if c in ' \t\r\n':
            j=i
            while j<n and src[j] in ' \t\r\n':j+=1
            out.append(' ');i=j;continue
        out.append(c);i+=1
    res=[];parts=re.split(r'("(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\')',''.join(out))
    for k,p in enumerate(parts):
        if k%2:res.append(p);continue
        p=re.sub(r'\s*([{};,])\s*',r'\1',p).replace(';}','}')
        res.append(p)
    return ''.join(res).strip()+'\n'

# ---------------- the kit ----------------
def kit_version(kit):
    """ASCIIUI.version, read from kit/ascii-ui.js; both kit files must say it"""
    js=(kit/'ascii-ui.js').read_text(encoding='utf-8')
    m=re.search(r"var VERSION='(\d+\.\d+\.\d+)'",js) or re.search(r"version:'(\d+\.\d+\.\d+)'",js)
    if not m: sys.exit('build: kit/ascii-ui.js has no version')
    v=m.group(1)
    for f in KIT_FILES:
        head=(kit/f).read_text(encoding='utf-8').split('\n',1)[0]
        if 'ascii/ui kit '+v not in head: sys.exit('build: the first line of kit/'+f+' does not say ascii/ui kit '+v)
    return v

def kit_release(kit,v,freeze):
    """kit/releases/<v>/ holds what v shipped as. Missing: frozen now (build)
    or reported (check). Present: the kit files must be the same"""
    rel=kit/'releases'/v
    if not rel.is_dir():
        if not freeze: return ['kit/releases/'+v+'  missing, run python3 build.py']
        rel.mkdir(parents=True)
        for f in KIT_FILES: shutil.copy2(kit/f,rel/f)
        # the css asks for fonts/ next to itself, so the pinned copy carries its own
        if (kit/'fonts').is_dir(): shutil.copytree(kit/'fonts',rel/'fonts',ignore=shutil.ignore_patterns('.DS_Store'))
        print('kit '+v+' frozen into kit/releases/'+v+'/')
        return []
    bad=[]
    for f in KIT_FILES:
        if not (rel/f).exists() or not filecmp.cmp(kit/f,rel/f,shallow=False):
            bad.append('kit/'+f+'  differs from the released '+v+' in kit/releases/'+v+'/: give the kit a new version')
    return bad

# The site's own copy of KIT() (js/40), with the text fetched instead of embedded.
# KIT() keeps its shape: css and js are read when they are needed. Until the
# text is here, they are a stand-in of the right size that says the version,
# which is all Get the kit reads when the page starts. The Code tab and the two
# downloads wait for the real text: their click (or the arrow key that opens
# Code) is held, the text is fetched, then the same click goes through.
LAZY='''/* ---- kit source: fetched on first use, not embedded (build.py, LAZY_KIT) ---- */
/* functions only, no const: install() calls KIT() before this line runs */
function kitS(){return kitS.s||(kitS.s={v:'@KV@',b:{css:@CSSB@,js:@JSB@},t:null,p:null})}
function kitStub(k){const S=kitS();return (k==='js'?"var VERSION='"+S.v+"';":'').padEnd(S.b[k],' ')}
function KIT(){const S=kitS();return {get css(){return S.t?S.t.css:kitStub('css')},get js(){return S.t?S.t.js:kitStub('js')}}}
function kitLoad(){
  const S=kitS();
  if(!S.p)S.p=Promise.all(['css','js'].map(k=>fetch('kit/'+S.v+'/ascii-ui.'+k).then(r=>{if(!r.ok)throw new Error('kit '+r.status);return r.text()})))
    .then(t=>{S.t={css:t[0],js:t[1]}},e=>{S.p=null;throw e});
  return S.p;
}
/* a doc's Code and Usage tabs (both read the kit), the keys that leave Preview for them, and the two downloads */
function kitAt(e){return e.target&&e.target.closest?e.target.closest('.doc-tabs [role="tab"],[data-dl]'):null}
function kitWant(e){
  const t=kitAt(e);if(!t)return null;
  if(t.hasAttribute('data-dl'))return e.type==='click'?t:null;
  const kit=t.parentNode.firstElementChild!==t;
  if(e.type==='click')return kit?t:null;
  return ['ArrowRight','ArrowLeft','End'].includes(e.key)?t:null;   /* Home lands on Preview, which needs no kit */
}
function kitGate(e){
  if(kitS().t)return;
  const t=kitWant(e);if(!t)return;
  e.preventDefault();e.stopImmediatePropagation();
  const key=e.type==='keydown'?e.key:null;
  kitLoad().then(()=>{if(key)t.dispatchEvent(new KeyboardEvent('keydown',{key:key,bubbles:true,cancelable:true}));else t.click()},
    ()=>A.say('The kit did not load, so there is no code to show yet. Check the connection and try again.',true));
}
/* on the way to one of them, start early: the text is usually here before the click */
function kitSoon(e){const S=kitS();if(!S.t&&!S.p&&kitAt(e))kitLoad().catch(()=>{})}
window.addEventListener('click',kitGate,true);window.addEventListener('keydown',kitGate,true);
['pointerover','focusin','touchstart'].forEach(n=>window.addEventListener(n,kitSoon,{capture:true,passive:true}));
'''
KIT_START='/* ---- kit source:'
KIT_END='/* ---- end of kit source ---- */'

def lazy_kit(js,kv):
    """js/40 with KIT() swapped for the fetching one above"""
    if KIT_START not in js or KIT_END not in js: sys.exit('build: js/40 has no kit source markers (qa/kit.py sync)')
    a=js.index(KIT_START);z=js.index(KIT_END)
    kit=root/'kit'
    size=lambda f:len((kit/f).read_bytes())
    return js[:a]+LAZY.replace('@KV@',kv).replace('@CSSB@',str(size('ascii-ui.css'))).replace('@JSB@',str(size('ascii-ui.js')))+js[z:]

# ---------------- the page ----------------
def inline(src,kv=None):
    """index.html with css/ and js/ inlined. kv: the kit version, when the
    Code tab's kit text is fetched from kit/<kv>/ instead of embedded"""
    def css(m):
        t=(root/m.group(1)).read_text()
        return '<style>\n'+(min_css(t) if MINIFY else t)+'</style>'
    def js(m):
        t=(root/m.group(1)).read_text()
        if kv and m.group(1).startswith('js/40'): t=lazy_kit(t,kv)
        if MINIFY: t=min_js(t)
        return '<script>\n'+t.replace('</script>','<\\/script>')+'</script>'
    h=re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">',css,src)
    h=re.sub(r'<script src="(js/[^"]+)"></script>',js,h)
    h=re.sub(r'</style>\n<style>\n','',h)   # merge adjacent style blocks
    left=re.findall(r'(?:href|src)="((?:css|js)/[^"]+)"',h)
    if left: sys.exit('build: not inlined: '+', '.join(left))
    # the font, as a data: URL, so no copy of the page asks anyone for it
    f=root/FONT
    if 'url('+FONT+')' not in h: sys.exit('build: index.html does not load '+FONT)
    if not f.exists(): sys.exit('build: missing '+FONT)
    h=h.replace('url('+FONT+')','url(data:font/woff2;base64,'+base64.b64encode(f.read_bytes()).decode()+')')
    return h

def links(h,dl,kit,icon,fav,og):
    """point the footer's Download and starter page links, the icons and the
    share picture at where they live next to this copy. kit=None drops the kit clause"""
    h=re.sub(r'(id="footDl" href=")[^"]*(")',lambda m:m.group(1)+dl+m.group(2),h)
    if kit is None:
        # no kit: the footer keeps only the download, as its own sentence
        h=re.sub(r'<span id="footKitPart">.*?</span>(<a [^>]*id="footDl"[^>]*>)d',r'\1D',h,flags=re.S)
    else:
        h=re.sub(r'(id="footKit" href=")[^"]*(")',lambda m:m.group(1)+kit+m.group(2),h)
    h=h.replace('<link rel="apple-touch-icon" href="assets/icon-180.png">','<link rel="apple-touch-icon" href="'+icon+'">')
    h=h.replace('<link rel="icon" href="assets/favicon.ico"','<link rel="icon" href="'+fav+'"')
    # the reel's poster and video sit in the same folder as the icon
    h=h.replace('="assets/reel','="'+icon[:-len('icon-180.png')]+'reel')
    return og_version(h,og)

def og_version(h,og):
    """apps keep a share picture by its address: a new picture gets a new one"""
    return h.replace(SITE_URL+'/assets/og.png"',SITE_URL+'/assets/og.png?v='+og+'"') if og else h

def sha(s): return "'sha256-"+base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode()+"'"

def csp(h,kv):
    """a Content-Security-Policy meta, first thing in the head, that allows the
    inline scripts this copy has and nothing else. Hashed here, from the final
    text, so a changed script needs a build and nothing else"""
    tags=re.sub(r'(<script[^>]*>)[\s\S]*?</script>',r'\1</script>',h)   # the markup, without script bodies
    heads=re.findall(r'<script([^>]*)>',tags)
    odd=[a for a in heads if a.strip() and a.strip()!='type="application/ld+json"']
    if odd: sys.exit('build: a <script> with attributes would need its own CSP rule: '+', '.join(odd))
    hand=sorted(set(re.findall(r'<[a-z][^>]*\s(on[a-z]+)=',tags)))
    if hand: sys.exit('build: inline event handlers are refused by the CSP ('+', '.join(hand)+'): use addEventListener')
    hashes=[sha(m.group(1)) for m in re.finditer(r'<script>([\s\S]*?)</script>',h)]
    # PAGE: a page a Code tab opens in a new tab is a blob: document, and it
    # takes this policy with it. It links the pinned kit and nothing else, so
    # the kit folder is allowed for scripts, styles and the font. This page
    # itself never asks for them.
    if not kv: sys.exit('build: the CSP needs the kit version for the pinned kit')
    PAGE='https://ascii.fedekotek.design/kit/'+kv+'/'   # the pinned version only, its two files and its font
    pol=["default-src 'none'",
         "script-src "+' '.join(hashes)+(" 'self'" if ANALYTICS else '')+' '+PAGE,
         "style-src 'unsafe-inline' "+PAGE,      # the engine writes style="" on titles, charts and colored text
         "font-src data: "+PAGE,"img-src 'self' data: blob:","connect-src 'self'",
         "media-src 'self'",                 # the reel on Home, fetched on play
         "worker-src 'none'","frame-src 'none'","manifest-src 'none'",
         "object-src 'none'","base-uri 'none'","form-action 'none'"]
    meta='<meta http-equiv="Content-Security-Policy" content="'+'; '.join(pol)+'">'
    if '<meta charset="utf-8">' not in h: sys.exit('build: no <meta charset="utf-8"> to put the CSP after')
    return h.replace('<meta charset="utf-8">','<meta charset="utf-8">\n'+meta,1)

# Vercel Web Analytics. Only on the real address: no request from file://,
# localhost, a preview deploy or a saved copy, and none with Do Not Track or GPC.
VA='''<script>
/* visits are counted on https://ascii.fedekotek.design only (build.py, ANALYTICS) */
(function(){
  if(location.protocol!=='https:'||location.hostname!=='ascii.fedekotek.design')return;
  if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl)return;
  window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
  var s=document.createElement('script');s.defer=true;s.src='/_vercel/insights/script.js';
  document.head.appendChild(s);
})();
</script>
'''

PAGE404="""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Not found, ascii/ui</title>
<meta name="robots" content="noindex">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/svg+xml" href="FAVICON">
<style>
:root{--bg:#ecebe4;--ink:#111110;--muted:#5c5b55;--hot:#c91468;--cy:#0a7287;--r:21px;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#0a0612;--ink:#f3eef7;--muted:#a79db5;--hot:#ff3d9a;--cy:#35e6f0;color-scheme:dark}}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--ink)}
body{font:300 14px/var(--r) "Geist Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:var(--r) 16px}
main{width:min(60ch,100%)}
pre{margin:0 0 var(--r);font:inherit;font-weight:700;color:var(--hot);white-space:pre;overflow:hidden}
h1{font-size:inherit;font-weight:700;text-transform:uppercase;margin:0 0 var(--r)}
p{margin:0 0 var(--r);color:var(--muted)}
a{color:var(--ink);font-weight:700;text-underline-offset:3px;display:inline-block;padding:12px 0;margin:-12px 0;outline:0}
a:hover{color:var(--hot)}
a:focus-visible{background:var(--cy);color:var(--bg);text-decoration:none}
</style>
</head>
<body>
<main>
<pre aria-hidden="true">@   @  @@@  @   @
@   @ @   @ @   @
@@@@@ @ @ @ @@@@@
    @ @   @     @
    @  @@@      @</pre>
<h1>Not found</h1>
<p>Nothing lives at this address. The signal was bad, or the link was.</p>
<p><a href="/">Back to ascii/ui</a></p>
</main>
</body>
</html>
"""

ROBOTS="""User-agent: *
Allow: /

Sitemap: """+SITE_URL+"""/sitemap.xml
"""

# no lastmod: it would change every day, and --check with it. The hash routes
# (#components) are one page to a crawler, so they are not listed
SITEMAP="""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>"""+SITE_URL+"""/</loc></url>
  <url><loc>"""+SITE_URL+"""/kit/starter.html</loc></url>
</urlset>
"""

# ---------------- kit/tokens.json ----------------
# The tokens for design tools (DTCG), the default preset: the same file the
# Download tokens.json button in Themes makes on a page with nothing changed.
# The words and the shape are TOKDOC in js/40; the values come from the token
# sources: css/01 (colors, the row), css/02 (type), js/10 (the ramp),
# kit/ascii-ui.css (frame tones, motion) and index.html (the preset names).
# qa/tokens.py checks the two are the same bytes and match the page.
def tokens_json():
    rd=lambda p:(root/p).read_text(encoding='utf-8')
    j40=rd('js/40-themes-ramp-code.js')
    m=re.search(r'/\* tokens\.json words start \*/\s*const TOKDOC=(.*?);\s*/\* tokens\.json words end \*/',j40,re.S)
    if not m: sys.exit('build: js/40 has no TOKDOC block (tokens.json words start/end)')
    doc=json.loads(m.group(1))
    tok=rd('css/01-tokens.css')
    def block(sel):
        b=re.search(re.escape(sel)+r'\{(.*?)\n\}',tok,re.S)
        if not b: sys.exit('build: css/01 has no '+sel+' block')
        return b.group(1)
    def hexes(b):
        o={}
        for k,v in re.findall(r'--([a-z0-9]+):\s*(#[0-9a-fA-F]{3,8})\b',b):
            v=v.lower()
            o[k]='#'+''.join(c*2 for c in v[1:4]) if len(v)==4 else v[:7]
        return o
    cols=['bg','ink','muted','hot','pink','cy','ok','warn','deep','violet','t0','t1','t2','t3']
    L=hexes(block('\n:root')); D=hexes(block(':root[data-theme="dark"]'))
    miss=[k for k in cols if k not in L or k not in D]
    if miss: sys.exit('build: css/01 has no light or dark value for '+', '.join(miss))
    V={}
    V['row']=re.search(r'--r:\s*([0-9.]+px)',tok).group(1)
    body=re.search(r'\nbody\{(.*?)\}',rd('css/02-base-grid.css'),re.S).group(1)
    V['family']=re.search(r'font-family:\s*([^;,]+)',body).group(1).strip().strip('"\'')
    V['size']=re.search(r'font-size:\s*([^;]+)',body).group(1).strip()
    lh=re.search(r'line-height:\s*([^;]+)',body).group(1).strip()
    V['lineHeight']=V['row'] if lh=='var(--r)' else lh
    V['weight']=int(re.search(r'font-weight:\s*(\d+)',body).group(1))
    V['ramp']=re.search(r"var RAMP='([^']+)'",rd('js/10-engine.js')).group(1)
    for i,c in enumerate(V['ramp']): V['k'+str(i)]=c
    kcss=rd('kit/ascii-ui.css')
    def unit(s):
        for p in range(1,len(s)):
            if all(s[i]==s[i%p] for i in range(len(s))): return s[:p]
        return s
    for k in ('heavy','dense','mid','light','shade','faint','danger','error'):
        V[k+'.rule']=unit(re.search(r'--h-'+k+r':"([^"]*)"',kcss).group(1))
        V[k+'.side']=re.search(r'--s-'+k+r':"([^"]*)"',kcss).group(1)
    for k,v in re.findall(r'--(aui-[a-z-]+):\s*([^;]+);',kcss):
        if k in V: continue
        v=v.strip()
        if k.startswith('aui-ease'): V[k]=v
        else: V[k]=str(round(float(v[:-2]) if v.endswith('ms') else float(v[:-1])*1000))+'ms'
    page=rd('index.html')
    name=lambda v:re.search(r'name="preset" value="'+v+r'"[^>]*><span>([^<]+)</span>',page).group(1).strip()
    def fill(t,vals):
        if isinstance(t,list): return [fill(x,vals) for x in t]
        if isinstance(t,dict): return {k:fill(x,vals) for k,x in t.items()}
        if isinstance(t,str) and t.startswith('@'):
            if t[1:] not in vals: sys.exit('build: tokens.json has no value for '+t[1:])
            return vals[t[1:]]
        return t
    W=doc['words']
    out=fill(doc['file'],V)
    out['light']=fill(doc['color'],dict({'mode':W['light'].replace('%s',name('paper'),1)},**{k:L[k] for k in cols}))
    out['dark']=fill(doc['color'],dict({'mode':W['dark'].replace('%s',name('signal'),1)},**{k:D[k] for k in cols}))
    return json.dumps(out,indent=2,ensure_ascii=False)+'\n'

def build(out,quiet=False):
    """write dist/ascii-ui.html and site/ under out (the repo, or a temp folder)"""
    src=(root/'index.html').read_text()
    m=re.search(r'<meta name="aui-version" content="([^"]+)">',src)
    if not m: sys.exit('build: index.html has no aui-version meta')
    ver=m.group(1)
    foot=re.search(r'<p class="foot" id="footLine">(.*?)</p>',src,re.S)
    if not foot or 'v'+ver not in foot.group(1): sys.exit('build: the footer does not say v'+ver)
    fav=re.search(r'<link rel="icon" type="image/svg\+xml" href="([^"]+)">',src)
    kit=root/'kit'
    has_kit=kit.is_dir() and any(kit.iterdir())
    kv=kit_version(kit) if has_kit and (kit/'ascii-ui.js').exists() else None
    ld=re.search(r'<script type="application/ld\+json">([\s\S]*?)</script>',src)
    if ld:
        try: data=json.loads(ld.group(1))
        except ValueError as e: sys.exit('build: the JSON-LD in index.html is not valid JSON: '+str(e))
        said=[g.get('version') for g in data.get('@graph',[]) if g.get('@type')=='SoftwareSourceCode']
        if kv and said and said[0]!=kv: sys.exit('build: the JSON-LD in index.html says kit '+str(said[0])+', the kit is '+kv)
    ogp=root/'assets'/'og.png'
    og=hashlib.sha1(ogp.read_bytes()).hexdigest()[:8] if ogp.exists() else None
    one=inline(src)
    say=(lambda *a:None) if quiet else print
    starter='kit/starter.html' if has_kit and (kit/'starter.html').exists() else None

    # 1. dist/: the single file, next to the repo (Download is itself)
    (out/'dist').mkdir(exist_ok=True)
    d=links(one,'ascii-ui.html','../kit/starter.html' if has_kit else None,'../assets/icon-180.png','../assets/favicon.ico',og)
    (out/'dist/ascii-ui.html').write_text(d)
    say('dist/ascii-ui.html',len(d.encode()),'bytes')

    # 2. site/: rebuilt from nothing, so nothing stale is published
    site=out/'site'
    if site.exists(): shutil.rmtree(site)
    (site/'assets').mkdir(parents=True)
    # the download: everything embedded, it is meant to be opened from a disk
    s=links(one,'ascii-ui.html',starter,'assets/icon-180.png','favicon.ico',og)
    (site/'ascii-ui.html').write_text(s)
    # the page: kit text on demand, analytics when on, then the CSP over all of it
    i=links(inline(src,kv) if LAZY_KIT and kv else one,'ascii-ui.html',starter,'assets/icon-180.png','favicon.ico',og)
    if ANALYTICS: i=i.replace('</head>',VA+'</head>',1)
    if CSP: i=csp(i,kv)
    (site/'index.html').write_text(i)
    say('site/index.html',len(i.encode()),'bytes')
    (site/'404.html').write_text(PAGE404.replace('FAVICON',fav.group(1) if fav else ''))
    (site/'robots.txt').write_text(ROBOTS)
    (site/'sitemap.xml').write_text(SITEMAP)
    for a in SITE_ASSETS:
        p=root/'assets'/a
        if p.exists(): shutil.copy2(p,site/'assets'/a)
        else: say('build: missing assets/'+a+' (run qa/shots.py)')
    if (root/'assets/favicon.ico').exists(): shutil.copy2(root/'assets/favicon.ico',site/'favicon.ico')
    else: say('build: missing assets/favicon.ico')
    lic=root/'LICENSE'
    if lic.exists(): shutil.copy2(lic,site/'LICENSE.txt')
    for f in ('llms.txt','llms-full.txt'):
        if (root/f).exists(): shutil.copy2(root/f,site/f)
    if has_kit:
        # the latest kit, then every released one at its own address
        shutil.copytree(kit,site/'kit',ignore=shutil.ignore_patterns('.DS_Store','__pycache__','releases'))
        st=site/'kit'/'starter.html'
        if st.exists(): st.write_text(og_version(st.read_text(),og))
        # the tokens for design tools, next to the kit (not in any frozen release)
        (site/'kit'/'tokens.json').write_text(tokens_json(),encoding='utf-8')
        rels=kit/'releases'
        for r in sorted(rels.iterdir()) if rels.is_dir() else []:
            if r.is_dir() and re.fullmatch(r'\d+\.\d+\.\d+',r.name):
                shutil.copytree(r,site/'kit'/r.name,ignore=shutil.ignore_patterns('.DS_Store'))
        if lic.exists():
            for dd in [site/'kit']+[p for p in (site/'kit').iterdir() if p.is_dir() and re.fullmatch(r'\d+\.\d+\.\d+',p.name)]:
                shutil.copy2(lic,dd/'LICENSE.txt')
    n=sum(1 for p in site.rglob('*') if p.is_file())
    say('site/ v'+ver,n,'files','(with kit/ '+kv+')' if kv else '(no kit/ yet)')

def files(d):
    return {p.relative_to(d).as_posix() for p in d.rglob('*') if p.is_file()} if d.is_dir() else set()

def check():
    """build into a temp folder; every file that is missing, extra or different
    on disk is listed, and the exit code says whether any was"""
    with tempfile.TemporaryDirectory(prefix='aui-build-') as t:
        t=pathlib.Path(t);build(t,quiet=True)
        kit=root/'kit'
        bad=kit_release(kit,kit_version(kit),False) if (kit/'ascii-ui.js').exists() else []
        for top in ('site',):
            want,have=files(t/top),files(root/top)
            bad+=[top+'/'+f+'  missing' for f in sorted(want-have)]
            bad+=[top+'/'+f+'  not built by build.py' for f in sorted(have-want)]
            bad+=[top+'/'+f+'  differs' for f in sorted(want&have) if not filecmp.cmp(t/top/f,root/top/f,shallow=False)]
        f='dist/ascii-ui.html'
        if not (root/f).exists(): bad.append(f+'  missing')
        elif not filecmp.cmp(t/f,root/f,shallow=False): bad.append(f+'  differs')
    if bad:
        if any('give the kit a new version' in x for x in bad):
            # a rebuild does not fix this one: the released kit never changes
            print('build --check: the kit changed but its version did not. Bump ASCIIUI.version in kit/ascii-ui.js and the first line of both kit files, add a kit/CHANGELOG.md entry, then run python3 build.py and commit site/ and dist/')
        else:
            print('build --check: out of date, run python3 build.py and commit site/ and dist/')
        for b in bad: print('  '+b)
        sys.exit(1)
    print('build --check: ok, site/ and dist/ match the source')

def main():
    args=sys.argv[1:]
    if args==['--check']: check()
    elif not args:
        kit=root/'kit'
        if (kit/'ascii-ui.js').exists():
            bad=kit_release(kit,kit_version(kit),True)
            if bad: sys.exit('build: '+'\n  '.join(bad))
        build(root)
    else: sys.exit('usage: python3 build.py [--check]')

if __name__=='__main__':
    main()
