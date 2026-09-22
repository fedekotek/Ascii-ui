#!/usr/bin/env python3
"""Inline css/ and js/ into dist/ascii-ui.html, the single-file build that gets published.
Run: python3 build.py   (no dependencies)"""
import re,pathlib
root=pathlib.Path(__file__).parent
h=(root/'index.html').read_text()
def css(m): return '<style>\n'+(root/m.group(1)).read_text()+'</style>'
def js(m):  return '<script>\n'+(root/m.group(1)).read_text().replace('</script>','<\\/script>')+'</script>'
h=re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">',css,h)
h=re.sub(r'<script src="(js/[^"]+)"></script>',js,h)
h=re.sub(r'</style>\n<style>\n','',h)   # merge adjacent style blocks
(root/'dist').mkdir(exist_ok=True)
(root/'dist/ascii-ui.html').write_text(h)
print('dist/ascii-ui.html',len(h),'bytes')
