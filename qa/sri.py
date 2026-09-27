#!/usr/bin/env python3
"""Write the sha384 integrity of kit/ascii-ui.css and .js into every pinned
link in kit/README.md and README.md, for the version the kit says it is.
Run it after a kit version bump, before python3 build.py. qa/kit.py checks it.
  python3 qa/sri.py"""
import base64,hashlib,pathlib,re
ROOT=pathlib.Path(__file__).resolve().parent.parent
def h(f): return 'sha384-'+base64.b64encode(hashlib.sha384((ROOT/'kit'/f).read_bytes()).digest()).decode()
v=re.search(r"var VERSION='([\d.]+)'",(ROOT/'kit/ascii-ui.js').read_text()).group(1)
css,js=h('ascii-ui.css'),h('ascii-ui.js')
for p in ('kit/README.md','README.md'):
    f=ROOT/p;s=f.read_text(encoding='utf-8')
    s=re.sub(r'(/kit/%s/ascii-ui\.css" integrity=")[^"]+'%re.escape(v),lambda m:m.group(1)+css,s)
    s=re.sub(r'(/kit/%s/ascii-ui\.js" integrity=")[^"]+'%re.escape(v),lambda m:m.group(1)+js,s)
    f.write_text(s,encoding='utf-8')
print('sri: kit',v,css,js)
