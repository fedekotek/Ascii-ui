"""Write the component reference from what the Code and Usage tabs print.

python3 qa/reference.py           write docs/COMPONENTS-REFERENCE.md, llms-full.txt,
                                  and the component list in llms.txt
python3 qa/reference.py --check   build all three in memory and compare them with
                                  the files on disk. Exits 1 and says which differ,
                                  so a stale reference cannot be committed.

It opens index.html from file:// (1440x900, dark, reduced motion, so nothing
random is on screen), goes to Components and, for every component section in
page order, opens its Code tab and reads:
  group      data-group, set by the docs builder from KIT_GROUPS (js/30)
  id         the section's aria-labelledby, and its address #components/NAME
  kit        whether kit/starter.html has it (section#NAME). Command and
             Picture are site only
  caption    the first p.muted of the section
  html       the Code tab html, exactly as printed
  behaviors  the data-aui names and data-aui-* attributes the js part lists
  css        the kit css block names the css part prints (the base blocks,
             tokens, tones, base and frame, are in every page and never printed)
  notes      the note above the html when the kit cannot run the demo as it is
             on the site, or it prints classes the kit does not style (js/40,
             SITEONLY and codeExtra)
  usage      the Usage tab's model, AUI.usageModel (js/90): the words from
             AUI_DOCS and what the kit says about itself. A row the kit filled
             in is marked "from the kit"
The same rows are written three ways: the reference in the repo, llms-full.txt
(published next to llms.txt, for agents on the web), and one line per
component between the markers in llms.txt (the rest of llms.txt is written by
hand and left alone). Get the kit (s-install), Rules (s-rules) and Foundations
(s-foundations) are not components and are left out.
"""
import os,re,sys
from playwright.sync_api import sync_playwright

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
OUT=os.path.join(ROOT,'docs','COMPONENTS-REFERENCE.md')
FULL=os.path.join(ROOT,'llms-full.txt')
LLMS=os.path.join(ROOT,'llms.txt')
STARTER=os.path.join(ROOT,'kit','starter.html')
SITE='https://ascii.fedekotek.design'
SKIP=('s-install','s-rules','s-foundations')
BEGIN='<!-- components: written by python3 qa/reference.py from js/90-usage.js and the kit. Do not edit by hand -->'
END='<!-- end of components -->'

READ="""()=>[...document.querySelectorAll('#view-kit > section[aria-labelledby]')].map(s=>{
  const id=s.getAttribute('aria-labelledby');
  const cap=s.querySelector(':scope > p.muted:not(.status)');
  const t=s.querySelectorAll('.doc-tabs .tab')[1];if(t)t.click();
  const part=n=>{const e=s.querySelector('[data-part='+n+']');return e?e.textContent:''};
  return {id:id,name:s.querySelector('h2').textContent.trim(),group:s.dataset.group||'',
    caption:cap?cap.textContent.replace(/\\s+/g,' ').trim():'',html:part('html'),css:part('css'),js:part('js'),note:part('note'),
    usage:s._kitHTML&&AUI.usageModel?AUI.usageModel(s):null};
})"""

def kit_parts():
    src=open(STARTER,encoding='utf-8').read()
    return set(re.findall(r'<section class="part" id="([a-z0-9-]+)"',src))

def harvest():
    errs=[]
    with sync_playwright() as p:
        b=p.chromium.launch()
        pg=b.new_page(viewport={'width':1440,'height':900},color_scheme='dark',reduced_motion='reduce')
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file://'+os.path.join(ROOT,'index.html'))
        pg.wait_for_timeout(1500)
        pg.evaluate("document.getElementById('v-kit').click()")
        pg.wait_for_timeout(800)
        rows=pg.evaluate(READ)
        b.close()
    if errs: sys.exit('reference: page errors: '+'; '.join(errs))
    return [r for r in rows if r['id'] not in SKIP]

def behaviors(js):
    names=re.findall(r'^// data-aui="([a-z-]+)"  (.*)$',js,re.M)
    attrs=re.findall(r'^// (data-aui-[a-z-]+)  (.*)$',js,re.M)
    return names,attrs

def notes(note):
    return [note.strip()] if note and note.strip() else []

def md(t):
    # prose goes into markdown as text: an <img> in a note is a word, not a tag
    return t.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

def link(r_id,name,web):
    return '[%s](%s)'%(name,SITE+'/#components/'+r_id[2:] if web else '#'+r_id)

NAMES={}
def prose(t,web,table=False):
    """the words of the Usage tab in markdown: `code` stays code, the rest is
    text, and {s-id} is a link to that component"""
    out=[]
    for part in re.split(r'(`[^`]+`)',t):
        if len(part)>1 and part[0]=='`' and part[-1]=='`': out.append(part)
        else: out.append(re.sub(r'\{(s-[a-z0-9-]+)\}',lambda m:link(m.group(1),NAMES.get(m.group(1),m.group(1)),web),md(part)))
    s=''.join(out)
    return s.replace('|','\\|') if table else s

def flat(t):
    """the same words as plain text, for one line of llms.txt"""
    t=re.sub(r'`([^`]+)`',r'\1',t)
    return md(re.sub(r'\{(s-[a-z0-9-]+)\}',lambda m:NAMES.get(m.group(1),m.group(1)),t))

KITMARK=' (from the kit)'

def usage(u,web):
    """the Usage tab as markdown: the same model, the same order"""
    if not u: return []
    o=[]
    if u['site']: o+=['- Site only: '+prose(u['site'],web)]
    elif not u['written']: o+=['- Usage: not written yet. The rows below are read from the kit.']
    if u['use']:
        o.append('- Use it for:')
        o+=['  - '+prose(x,web) for x in u['use']]
    if u['avoid']:
        o.append('- Not for:')
        o+=['  - '+prose(x,web) for x in u['avoid']]
    o.append('')
    a=u['anatomy']
    if a:
        o+=['Anatomy:','','```text']+[x.rstrip() for x in a['draw']]+['```','']
        o+=['%d. **%s** `%s`: %s'%(i+1,p[1],p[0],prose(p[2],web)) for i,p in enumerate(a['parts'])]+['']
    if u['states']:
        o+=['| State | Looks like | What it means |','|---|---|---|']
        o+=['| %s | `%s` | %s |'%(md(s[0]),s[1].rstrip() or ' ',prose(s[2],web,True)+(KITMARK if s[3] else '')) for s in u['states']]+['']
    if u['keys']:
        o+=['| Keys | Does |','|---|---|']
        o+=['| %s | %s |'%(', '.join('`'+k+'`' for k in r[0]),prose(r[1],web,True)+(KITMARK if r[2] else '')) for r in u['keys']]+['']
    if u['a11y']:
        o.append('Accessibility:')
        o+=['- **%s**: %s'%(r[0],prose(r[1],web)+(KITMARK if r[2] else '')) for r in u['a11y']]
        o.append('')
    if u.get('dos'):
        o+=['| Do | Don\'t |','|---|---|']
        o+=['| %s | %s |'%(prose(p[0],web,True),prose(p[1],web,True)) for p in u['dos']]+['']
    if u['api']:
        o+=['| Kind | Name | Does |','|---|---|---|']
        o+=['| %s | `%s` | %s |'%(r[0],r[1].replace('|','\\|'),prose(r[2],web,True)+(KITMARK if r[3] else '')) for r in u['api']]+['']
    if u['madeOf']:
        o+=['Made of: '+', '.join(link(i,NAMES.get(i,i),web) for i in u['madeOf']),'']
    if u['see']:
        o+=['See also: '+', '.join(link(i,NAMES.get(i,i),web) for i in u['see'])+(KITMARK if u['seeAuto'] else ''),'']
    if u['limits']:
        o.append('Limits:')
        o+=['- '+prose(x,web) for x in u['limits']]
        o.append('')
    return o

def entries(rows,web):
    kit=kit_parts();o=[];group=None
    for r in rows:
        if r['group']!=group:
            group=r['group'];o+=['## '+group,'']
        n,a=behaviors(r['js'])
        blocks=re.findall(r'^/\* ==== ([a-z-]+): (.+?) ==== \*/$',r['css'],re.M)
        o+=['<a id="%s"></a>'%r['id'],'### '+r['name'],'',
            '- Id: `%s`, address `%s#components/%s`'%(r['id'],SITE if web else '',r['id'][2:]),
            '- Group: '+r['group'],
            '- In the kit: '+('yes, `kit/starter.html#%s`'%r['id'][2:] if r['id'][2:] in kit else 'no, site only'),
            '- Caption: '+md(r['caption'])]
        for t in notes(r['note']): o.append('- Note: '+md(t))
        if n or a:
            o.append('- Behaviors:')
            for x in n: o.append('  - `data-aui="%s"`: %s'%(x[0],md(x[1])))
            for x in a: o.append('  - `%s`: %s'%(x[0],md(x[1])))
        else: o.append('- Behaviors: none, HTML and CSS only')
        if blocks:
            o.append('- CSS blocks:')
            for b in blocks: o.append('  - `%s`: `%s`'%b)
        else: o.append('- CSS blocks: none beyond the base')
        o+=usage(r.get('usage'),web)
        o+=['```html',r['html'].rstrip('\n'),'```','']
    return o

def render(rows):
    kit=kit_parts()
    o=['# Components reference','',
       'Generated by `python3 qa/reference.py` from what the Code and Usage tabs print. Do not edit by hand: change the component or its words in `js/90-usage.js`, then run it again. `python3 qa/reference.py --check` fails when this file is stale, and `qa/release.sh` runs that check.','',
       'One entry per component, in page order (group, then name). "Kit" means the component is in `kit/starter.html` and works with the two kit files as printed. "Site only" means it needs this site\'s engine. The html is exactly what the Code tab prints: no ids, the kit\'s `data-aui` attributes, safe to paste twice. CSS blocks are the `/* ==== name: selectors ==== */` blocks of `kit/ascii-ui.css` that the Code tab prints for it; `tokens`, `tones`, `base` and `frame` are in every page and never listed. Behaviors are the `behaviors.NAME` functions of `kit/ascii-ui.js` and the button attributes it handles. The usage rows are the Usage tab: the words in `AUI_DOCS` (`js/90-usage.js`), and rows marked "from the kit" that the kit says about itself where nobody has written them yet. How to add a component: `docs/COMPONENTS.md`.','']
    ins=sum(1 for r in rows if r['id'][2:] in kit)
    wrote=sum(1 for r in rows if r.get('usage') and r['usage']['written'])
    o+=['%d components: %d in the kit, %d site only. %d have their usage written.'%(len(rows),ins,len(rows)-ins,wrote),'',
        '| Component | Group | Id | Kit | Usage | Behaviors | CSS blocks |','|---|---|---|---|---|---|---|']
    for r in rows:
        n,a=behaviors(r['js'])
        blocks=re.findall(r'^/\* ==== ([a-z-]+): ',r['css'],re.M)
        beh=', '.join(['`'+x[0]+'`' for x in n]+['`'+x[0]+'`' for x in a]) or 'none'
        u=r.get('usage')
        o.append('| [%s](#%s) | %s | `%s` | %s | %s | %s | %s |'%(r['name'],r['id'],r['group'],r['id'],
                 'yes' if r['id'][2:] in kit else 'site only','written' if u and u['written'] else 'from the kit',beh,', '.join('`'+x+'`' for x in blocks) or 'none'))
    o.append('')
    o+=entries(rows,False)
    return '\n'.join(o).rstrip('\n')+'\n'

def render_full(rows):
    """llms-full.txt: the whole reference for an agent on the web, with the
    site's own addresses instead of anchors in a repo it cannot see"""
    o=['# ascii/ui components, in full','',
       '> Every component of ascii/ui: when to use it and when not, its anatomy, states, keys, accessibility, API and the HTML to paste. Written by qa/reference.py from the site itself, so it says what the Code and Usage tabs say. The one-page map is '+SITE+'/llms.txt.','',
       'Install: link the two kit files, then paste the html of a component. It has no ids; the kit makes the ones accessibility needs, so the same html pasted twice is two working copies.','',
       '```html','<link rel="stylesheet" href="'+SITE+'/kit/ascii-ui.css">','<script defer src="'+SITE+'/kit/ascii-ui.js"></script>','```','']
    o+=entries(rows,True)
    return '\n'.join(o).rstrip('\n')+'\n'

def line(r):
    """one component in llms.txt: what it is for, what it is not for, what runs it"""
    u=r.get('usage') or {}
    kit='site only' if (u.get('site') or r['id'] in ('s-command','s-picture')) else 'kit'
    what=(u.get('use') or [r['caption']])[0]
    s='- [%s](%s/#components/%s) (%s, %s): %s'%(r['name'],SITE,r['id'][2:],r['group'],kit,flat(what))
    if u.get('avoid'): s+=' Not for: '+flat(u['avoid'][0][0].lower()+u['avoid'][0][1:])
    n,a=behaviors(r['js'])
    run=['`data-aui="%s"`'%x[0] for x in n]+['`%s`'%x[0] for x in a]
    ev=[e['name'] for e in (u.get('kit') or {}).get('events',[])]
    if run: s+=' Runs on '+', '.join(run)+(' and fires '+', '.join('`'+e+'`' for e in ev) if ev else '')+'.'
    return s

def render_llms(rows,have):
    """the part of llms.txt between the markers; the rest stays as written"""
    block=[BEGIN,'## Components','',
           'One line each: what it is for, what it is not for, what runs it. The whole of each one, with its HTML, is in [llms-full.txt]('+SITE+'/llms-full.txt).']
    group=None
    for r in rows:
        if r['group']!=group:
            group=r['group'];block+=['',group+':','']
        block.append(line(r))
    block+=['',END]
    text='\n'.join(block)
    if BEGIN in have and END in have:
        i=have.index(BEGIN);j=have.index(END)+len(END)
        return have[:i]+text+have[j:]
    # the first time: after the section on the five views
    at=have.index('## Kit files')
    return have[:at]+text+'\n\n'+have[at:]

def main():
    check='--check' in sys.argv[1:]
    rows=harvest()
    NAMES.update({r['id']:r['name'] for r in rows})
    llms_have=open(LLMS,encoding='utf-8').read() if os.path.exists(LLMS) else ''
    want={OUT:render(rows),FULL:render_full(rows),LLMS:render_llms(rows,llms_have)}
    if check:
        stale=[p for p,t in want.items() if (open(p,encoding='utf-8').read() if os.path.exists(p) else '')!=t]
        if stale:
            print('reference --check: stale, run python3 qa/reference.py and commit: '+', '.join(os.path.relpath(p,ROOT) for p in stale))
            sys.exit(1)
        print('reference --check: ok')
        return
    for p,t in want.items():
        open(p,'w',encoding='utf-8').write(t)
        print('%s: %d lines'%(os.path.relpath(p,ROOT),t.count('\n')))

if __name__=='__main__':
    main()
