#!/usr/bin/env python3
"""Build what ships. Standard library only.

  python3 build.py           write dist/ascii-ui.html and site/
  python3 build.py --check   build into a temporary folder and compare it with
                             dist/ and site/ on disk. Exits 1 and lists the files
                             that differ, so a stale deploy cannot be committed.

1. dist/ascii-ui.html  index.html with css/ and js/ inlined, the single file.
2. site/               the folder Vercel serves (vercel.json: outputDirectory).
                       It is committed, so the deploy needs no build step:
     index.html        the single file
     ascii-ui.html     the same file, served as a download
     404.html          what a wrong address gets
     robots.txt
     assets/           og.png (the share picture), icon-180.png (the home screen icon)
     llms.txt          a copy of llms.txt at the repo root, when it exists
     kit/              a copy of kit/, when that folder exists: the latest kit
     kit/<version>/    every released kit, from kit/releases/<version>/, at an
                       address that never changes (pin it, and it stays put)

Nothing else in the repo (docs, qa, CLAUDE.md, archive) is published.
The version is the aui-version meta in index.html; the footer must say the same.

The kit has its own version, ASCIIUI.version in kit/ascii-ui.js, and both kit
files say it in their first line. The first build of a version freezes
ascii-ui.css and ascii-ui.js into kit/releases/<version>/. After that the kit
files must match the frozen copy: a change to the kit needs a new version
(ascii-ui.js, both headers, kit/CHANGELOG.md). Until a version has shipped,
delete its kit/releases/<version>/ folder and build again to refreeze it.
"""
import re,pathlib,shutil,sys,tempfile,filecmp
root=pathlib.Path(__file__).resolve().parent
SITE_ASSETS=['og.png','icon-180.png']
KIT_FILES=['ascii-ui.css','ascii-ui.js']

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
        print('kit '+v+' frozen into kit/releases/'+v+'/')
        return []
    bad=[]
    for f in KIT_FILES:
        if not (rel/f).exists() or not filecmp.cmp(kit/f,rel/f,shallow=False):
            bad.append('kit/'+f+'  differs from the released '+v+' in kit/releases/'+v+'/: give the kit a new version')
    return bad

def inline(src):
    def css(m): return '<style>\n'+(root/m.group(1)).read_text()+'</style>'
    def js(m):  return '<script>\n'+(root/m.group(1)).read_text().replace('</script>','<\\/script>')+'</script>'
    h=re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">',css,src)
    h=re.sub(r'<script src="(js/[^"]+)"></script>',js,h)
    h=re.sub(r'</style>\n<style>\n','',h)   # merge adjacent style blocks
    left=re.findall(r'(?:href|src)="((?:css|js)/[^"]+)"',h)
    if left: sys.exit('build: not inlined: '+', '.join(left))
    return h

def links(h,dl,kit,icon):
    """point the footer's Download and starter page links, and the touch icon,
    at where they live next to this copy. kit=None drops the kit clause"""
    h=re.sub(r'(id="footDl" href=")[^"]*(")',lambda m:m.group(1)+dl+m.group(2),h)
    if kit is None:
        # no kit: the footer keeps only the download, as its own sentence
        h=re.sub(r'<span id="footKitPart">.*?</span>(<a [^>]*id="footDl"[^>]*>)d',r'\1D',h,flags=re.S)
    else:
        h=re.sub(r'(id="footKit" href=")[^"]*(")',lambda m:m.group(1)+kit+m.group(2),h)
    h=h.replace('<link rel="apple-touch-icon" href="assets/icon-180.png">','<link rel="apple-touch-icon" href="'+icon+'">')
    return h

PAGE404="""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Not found, ascii/ui</title>
<meta name="robots" content="noindex">
<meta name="color-scheme" content="light dark">
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
"""

def build(out,quiet=False):
    """write dist/ascii-ui.html and site/ under out (the repo, or a temp folder)"""
    src=(root/'index.html').read_text()
    m=re.search(r'<meta name="aui-version" content="([^"]+)">',src)
    if not m: sys.exit('build: index.html has no aui-version meta')
    ver=m.group(1)
    foot=re.search(r'<p class="foot" id="footLine">(.*?)</p>',src,re.S)
    if not foot or 'v'+ver not in foot.group(1): sys.exit('build: the footer does not say v'+ver)
    fav=re.search(r'<link rel="icon" type="image/svg\+xml" href="([^"]+)">',src)
    one=inline(src)
    kit=root/'kit'
    has_kit=kit.is_dir() and any(kit.iterdir())
    say=(lambda *a:None) if quiet else print

    # 1. dist/: the single file, next to the repo (Download is itself)
    (out/'dist').mkdir(exist_ok=True)
    d=links(one,'ascii-ui.html','../kit/starter.html' if has_kit else None,'../assets/icon-180.png')
    (out/'dist/ascii-ui.html').write_text(d)
    say('dist/ascii-ui.html',len(d),'bytes')

    # 2. site/: rebuilt from nothing, so nothing stale is published
    site=out/'site'
    if site.exists(): shutil.rmtree(site)
    (site/'assets').mkdir(parents=True)
    s=links(one,'ascii-ui.html','kit/starter.html' if has_kit and (kit/'starter.html').exists() else None,'assets/icon-180.png')
    (site/'index.html').write_text(s)
    (site/'ascii-ui.html').write_text(s)
    (site/'404.html').write_text(PAGE404.replace('FAVICON',fav.group(1) if fav else ''))
    (site/'robots.txt').write_text(ROBOTS)
    for a in SITE_ASSETS:
        p=root/'assets'/a
        if p.exists(): shutil.copy2(p,site/'assets'/a)
        else: say('build: missing assets/'+a+' (run qa/shots.py)')
    llms=root/'llms.txt'
    if llms.exists(): shutil.copy2(llms,site/'llms.txt')
    kv=None
    if has_kit:
        # the latest kit, then every released one at its own address
        shutil.copytree(kit,site/'kit',ignore=shutil.ignore_patterns('.DS_Store','__pycache__','releases'))
        kv=kit_version(kit)
        rels=kit/'releases'
        for r in sorted(rels.iterdir()) if rels.is_dir() else []:
            if r.is_dir() and re.fullmatch(r'\d+\.\d+\.\d+',r.name):
                shutil.copytree(r,site/'kit'/r.name,ignore=shutil.ignore_patterns('.DS_Store'))
    n=sum(1 for p in site.rglob('*') if p.is_file())
    say('site/ v'+ver,n,'files','(with kit/ '+kv+')' if has_kit else '(no kit/ yet)')

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
