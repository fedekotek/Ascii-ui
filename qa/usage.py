"""The Usage tab: complete, true to the kit, and working.

python3 qa/usage.py    check every component's Usage tab, print `usage: ok` or
                       the failures (exit 1)

It opens index.html from file:// with reduced motion and checks three things.

The words (1440x900). It builds every component's model the way the Usage tab
does (AUI.usageModel: the words from AUI_DOCS in js/90, and what the kit says
about itself, read from KIT() in js/40), and checks:
  1. coverage: every component has an entry with all of use, avoid, anatomy,
     states, keys, a11y, dos (do and don't) and see. A component with no entry
     at all fails when it is one of the thirty below (COMPONENTS), and is a
     note when it is new: its tab says "not written yet" and shows what the
     kit says about it, so nothing is broken while its words are written
  2. every entry belongs to a component on the page, and every {s-id} it names
     is one
  3. anatomy: every part's selector matches the Code tab html (or, for a part
     the kit draws, the kit css), a paint row is no longer than its drawing
     row, the drawing shows callouts 1 to n, and no drawing is wider than
     32 characters (a 360px phone has 38)
  4. keys: every key the behavior handles is in the table, and every key in the
     table is handled by the behavior or is the browser's own for something the
     markup has (a button: Enter, Space; radios: the arrows; a range: the
     arrows, Page Up and Down, Home, End; a dialog: Escape; Tab and Shift Tab
     anywhere). Command and Picture are site only: their keys are the site's
  5. api: every event, setting and call the behavior has is written down; a
     written data- attribute, aui: event, ASCIIUI call, class or custom
     property exists in the kit
  6. states: every state the component's own css draws is written down
  7. voice: no em or en dashes, no emoji, no hedging words, no imperial units

The tabs, by keyboard (1440x900). On every component: Right from Preview goes
to Code, Right again to Usage, Right again wraps to Preview; End goes to Usage
and Home back to Preview; only the picked panel shows and the picked tab is
the one Tab stop. The Usage panel draws with every section, and the Code tab
prints the same html before and after Usage and Preview were opened (it comes
from a clean snapshot, never the live preview).

The layout (390x844 and 1440x900, dark). Every component's Usage tab open,
with every section open: the page does not scroll sideways and nothing in a
Usage panel sticks out of its section (a drawing scrolls inside its own box).
"""
import os,re,sys
from playwright.sync_api import sync_playwright

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
SKIP=('s-install','s-rules','s-foundations')
# the thirty components with words. A new component starts as a note, not a failure
COMPONENTS=('s-button','s-input','s-toggles','s-slider','s-tabs','s-card','s-progress','s-details','s-badge','s-alert',
            's-select','s-skeleton','s-avatar','s-breadcrumb','s-calendar','s-command','s-dropdown','s-empty','s-otp',
            's-kbd','s-pagination','s-picture','s-separator','s-sheet','s-spinner','s-textarea','s-timeline','s-toast',
            's-togglegroup','s-tooltip')
REQUIRED=('use','avoid','anatomy','states','keys','a11y','dos','see')
SITE_ONLY=('s-command','s-picture')

READ="""()=>{
  const out=[],kit=AUI.KIT();
  document.querySelectorAll('#view-kit > section[aria-labelledby]').forEach(s=>{
    const id=s.getAttribute('aria-labelledby');if(!s._kitHTML)return;
    const h=s._kitHTML(),t=document.createElement('template');t.innerHTML=h;
    const m=AUI.usageModel(s),parts=[];
    if(m.raw&&m.raw.anatomy)m.raw.anatomy.parts.forEach(p=>{let ok=false;try{ok=!!t.content.querySelector(p[0])}catch(e){}
      parts.push([p[0],ok||kit.css.includes(p[0].split(/[\\s\\[:]/)[0])])});
    const has=sel=>{try{return !!t.content.querySelector(sel)}catch(e){return false}};
    /* a behavior that draws buttons into an empty element (calendar, pagination) has buttons too */
    const draws=m.kit.names.some(n=>(AUI.kitSource(n)||'').includes('<button'));
    m.markup={button:has('button,[role=menuitem]')||draws,range:has('input[type=range]'),dialog:has('dialog'),
      text:has('input:not([type=range]):not([type=checkbox]):not([type=radio]),textarea'),
      radio:has('input[type=radio]'),checkbox:has('input[type=checkbox]'),select:has('select'),summary:has('summary'),link:has('a[href]')};
    m.parts=parts;out.push(m);
  });
  return {rows:out,ids:Object.keys(window.AUI_DOCS||{}),kitjs:kit.js,kitcss:kit.css};
}"""

NATIVE={'any':{'Tab','Shift+Tab'},'button':{'Enter',' '},'range':{'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home','End'},
        'dialog':{'Escape'},'text':{'Enter'},'radio':{'ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '},'checkbox':{' '},
        'select':{' ','Enter','ArrowUp','ArrowDown','Home','End'},'summary':{'Enter',' '},'link':{'Enter'}}
# a written state covers a state the css draws when its name holds one of these words
SYN={'hover':('hover','item focus'),'focus':('focus',),'pressed':('pressed','active','picked'),'selected':('picked','selected'),
     'disabled':('disabled',),'invalid':('invalid',),'checked':('checked','on'),'current':('current',),'open':('open',),
     'danger':('danger',),'done':('done','accepted'),'full':('full',),'on':('on','show'),'off':('off','hide'),'error':('error','invalid')}
HEDGE=re.compile(r'\b(should|might|maybe|perhaps|probably|possibly|just|simply|basically|obviously|hopefully|kind of|sort of)\b',re.I)
IMPERIAL=re.compile(r'\b(\d+\s*(lbs?|oz|inch(es)?|in\.|feet|ft|miles?|mph|gallons?|fahrenheit)|°F)\b',re.I)
EMOJI=re.compile('[\U0001F300-\U0001FAFF☀-➿️]')

def words(raw):
    """every string a person wrote in one entry"""
    out=[]
    def walk(x):
        if isinstance(x,str): out.append(x)
        elif isinstance(x,list): [walk(y) for y in x]
        elif isinstance(x,dict): [walk(v) for k,v in x.items() if k not in ('draw','paint')]
    walk(raw);return out

def check(data):
    fails=[];notes=[];rows=data['rows'];ids={r['id'] for r in rows}
    kitjs,kitcss=data['kitjs'],data['kitcss']
    # aui: events, fired by name or through a variable set from quoted names
    emitted={'aui:'+m for m in re.findall(r"emit\(\w+,'([a-z]+)'",kitjs)}
    for v in set(re.findall(r"emit\(\w+,([a-z]\w*),",kitjs)):
        for d in re.findall(r'\b'+v+r'=([^;,]*)',kitjs): emitted|={'aui:'+x for x in re.findall(r"'([a-z]+)'",d)}
    body=re.search(r'window\.ASCIIUI=\{([\s\S]*?)\n\};',kitjs).group(1)
    api_names=set(re.findall(r'(\w+):',body))|set(re.findall(r'get (\w+)\(',body))
    classes=set(re.findall(r'\.(-?[_a-zA-Z][\w-]*)',re.sub(r'"(?:[^"\\]|\\.)*"','""',re.sub(r'/\*[\s\S]*?\*/','',kitcss))))
    for i in data['ids']:
        if i not in ids: fails.append('%s: an entry for a component that is not on the page'%i)
    for c in COMPONENTS:
        if c not in ids: fails.append('%s: one of the thirty is not on the page'%c)
    for r in rows:
        raw=r.get('raw');i=r['id']
        # 1 coverage
        if not raw:
            if i in COMPONENTS: fails.append('%s: no Usage entry in js/90'%i)
            else: notes.append('%s: new, no Usage entry yet. Its tab says so and shows what the kit says'%i)
            continue
        for f in REQUIRED:
            v=raw.get(f)
            if not v or (f=='anatomy' and not (v.get('draw') and v.get('parts'))):
                fails.append('%s: the entry has no %s'%(i,f))
        for n,p in enumerate(raw.get('dos',[])):
            if len(p)!=2 or not all(p): fails.append("%s: do and don't pair %d is not a pair"%(i,n+1))
        # 2 links
        for w in words(raw):
            for l in re.findall(r'\{(s-[a-z0-9-]+)\}',w):
                if l not in ids: fails.append('%s: links {%s}, which is not a component'%(i,l))
        for l in raw.get('see',[]):
            if l not in ids: fails.append('%s: see also %s, which is not a component'%(i,l))
        # 3 anatomy
        a=raw.get('anatomy')
        if a:
            for sel,ok in r['parts']:
                if not ok: fails.append('%s: anatomy part %s is not in the Code tab html or the kit css'%(i,sel))
            for n,row in enumerate(a['draw']):
                if len(row)>32: fails.append('%s: drawing row %d is %d characters, more than 32'%(i,n+1,len(row)))
                p=(a.get('paint') or [])
                if n<len(p) and len(p[n])>len(row): fails.append('%s: paint row %d is longer than its drawing row'%(i,n+1))
            text='\n'.join(a['draw'])
            for n in range(1,len(a['parts'])+1):
                if str(n) not in re.sub(r'[A-Za-z]','',text): fails.append('%s: the drawing has no callout %d'%(i,n))
        # 4 keys
        wrote=set(k for ks in (x[0] for x in raw.get('keys',[])) for k in ks)
        handled=set(r['kit']['keys'])
        for k in sorted(handled-wrote): fails.append('%s: the kit handles %r and the keys table does not say so'%(i,k))
        if i not in SITE_ONLY:
            allowed=set(handled)|NATIVE['any']
            for kind,on in r['markup'].items():
                if on: allowed|=NATIVE[kind]
            for k in sorted(wrote-allowed): fails.append('%s: the keys table has %r, which neither the kit nor the browser handles here'%(i,k))
        # 5 api
        for row in r['api']:
            if row[3]: fails.append('%s: api %s is only read from the kit, write it down'%(i,row[1]))
        for kind,name,_ in raw.get('api',[]):
            for tok in name.split():
                t=tok.split('=')[0]
                if t.startswith('data-') and t not in kitjs and t not in kitcss: fails.append('%s: api %s is not in the kit'%(i,t))
                if t.startswith('aui:') and t not in emitted: fails.append('%s: api %s is never fired by the kit'%(i,t))
                if t.startswith('ASCIIUI.') and t.split('.')[1].split('(')[0] not in api_names: fails.append('%s: api %s is not in window.ASCIIUI'%(i,t))
                if t.startswith('--') and t not in kitcss: fails.append('%s: api %s is not a kit custom property'%(i,t))
                if kind=='class' and t.startswith('.'):
                    for c in re.findall(r'\.([\w-]+)',t):
                        if c.endswith('-') or c=='tone-*': continue
                        if c.rstrip('*').rstrip('-') not in classes and not any(x.startswith(c.rstrip('*')) for x in classes):
                            fails.append('%s: api class .%s is not styled by the kit'%(i,c))
        # 6 states
        names=' '.join(s[0] for s in raw.get('states',[]))
        for st in r['kit']['states']:
            if not any(w in names for w in SYN.get(st['name'],(st['name'],))):
                fails.append('%s: the kit css draws %s (%s) and the states do not say so'%(i,st['name'],st['sel']))
        # 7 voice
        for w in words(raw):
            if '—' in w or '–' in w: fails.append('%s: a dash in %r'%(i,w[:40]))
            if EMOJI.search(w): fails.append('%s: an emoji in %r'%(i,w[:40]))
            h=HEDGE.search(w)
            if h: fails.append('%s: hedging (%s) in %r'%(i,h.group(1),w[:50]))
            u=IMPERIAL.search(w)
            if u: fails.append('%s: not metric (%s) in %r'%(i,u.group(0),w[:50]))
    written=sum(1 for r in rows if r.get('raw'))
    return fails,notes,written,len(rows)

# every component in turn: the doc tabs by keyboard, and the Code tab before and after
TABS="""async()=>{
  const out=[],key=(el,k)=>el.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));
  const secs=[...document.querySelectorAll('#view-kit > section[aria-labelledby]')].filter(s=>s._kitHTML&&!%s.includes(s.getAttribute('aria-labelledby')));
  for(const s of secs){
    const id=s.getAttribute('aria-labelledby'),tabs=[...s.querySelectorAll(':scope > .doc > .doc-tabs [role=tab]')];
    const panels=tabs.map(t=>document.getElementById(t.getAttribute('aria-controls')));
    const bad=m=>out.push(id+': '+m);
    if(tabs.length!==3||tabs.map(t=>t.textContent.trim()).join()!=='Preview,Code,Usage'){bad('tabs are '+tabs.map(t=>t.textContent.trim()).join());continue}
    const on=()=>tabs.findIndex(t=>t.getAttribute('aria-selected')==='true');
    const sane=w=>{const k=on();
      if(k!==w)bad('expected tab '+w+', got '+k);
      if(document.activeElement!==tabs[w])bad('the focus is not on tab '+w);
      panels.forEach((p,i)=>{if(p.hidden!==(i!==w))bad('panel '+i+(p.hidden?' hidden':' shown')+' with tab '+w+' picked')});
      tabs.forEach((t,i)=>{if(t.tabIndex!==(i===w?0:-1))bad('tab '+i+' has tabindex '+t.tabIndex)});
    };
    const demo=panels[0].firstElementChild;
    tabs[0].click();tabs[0].focus();
    key(tabs[0],'ArrowRight');sane(1);
    const code1=panels[1].querySelector('pre.code').textContent;
    key(tabs[1],'ArrowRight');sane(2);
    const u=panels[2];
    if(!u.querySelector('.use'))bad('the Usage panel is empty');
    const secsIn=[...u.querySelectorAll('details.u-sec')].map(d=>d.dataset.use).join();
    for(const k of ['anatomy','states','keys','a11y','dos'])if(!secsIn.split(',').includes(k))bad('the Usage panel has no '+k+' section');
    if(!u.querySelector('.u-yes li'))bad('the Usage panel has no Use it for');
    if(!u.querySelector('.u-no li'))bad('the Usage panel has no Not for');
    if(/could not be drawn/.test(u.textContent))bad('the Usage panel failed to draw');
    key(tabs[2],'ArrowRight');sane(0);
    key(tabs[0],'ArrowLeft');sane(2);
    key(tabs[2],'Home');sane(0);
    key(tabs[0],'End');sane(2);
    key(tabs[2],'ArrowLeft');sane(1);
    const code2=panels[1].querySelector('pre.code').textContent;
    if(code1!==code2)bad('the Code tab printed something else after Usage opened');
    key(tabs[1],'ArrowLeft');sane(0);
    if(panels[0].firstElementChild!==demo||!panels[0].children.length)bad('the Preview lost its demo');
  }
  return out;
}"""

# every Usage tab open, every section in it open, then: sideways scroll, and anything wider than its section
LAYOUT="""()=>{
  document.querySelectorAll('#view-kit > section[aria-labelledby] > .doc > .doc-tabs [role=tab]:nth-child(3)').forEach(t=>t.click());
  document.querySelectorAll('.use details.u-sec').forEach(d=>d.open=true);
  return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const out=[],de=document.documentElement,ov=de.scrollWidth-de.clientWidth;
    if(ov>1)out.push('the page scrolls sideways by '+ov+'px');
    document.querySelectorAll('.use').forEach(u=>{
      const sec=u.closest('section'),sr=sec.getBoundingClientRect(),id=sec.getAttribute('aria-labelledby');
      if(u.scrollWidth>u.clientWidth+1)out.push(id+': the Usage panel is '+(u.scrollWidth-u.clientWidth)+'px wider than its box');
      u.querySelectorAll('*').forEach(e=>{
        if(e.closest('.u-draw')&&!e.matches('.u-draw'))return;
        const r=e.getBoundingClientRect();
        if(r.width&&r.right>sr.right+2)out.push(id+': '+e.tagName.toLowerCase()+'.'+e.className+' sticks out '+Math.round(r.right-sr.right)+'px');
      });
    });
    r(out.slice(0,20));
  })));
}"""

def main():
    errs=[];tabfails=[];layout=[]
    with sync_playwright() as p:
        b=p.chromium.launch()
        pg=b.new_page(viewport={'width':1440,'height':900},color_scheme='dark',reduced_motion='reduce')
        pg.on('pageerror',lambda e:errs.append('pageerror: '+str(e)))
        # the font is the one outside request, and an offline or proxied run cannot reach it
        font=lambda m:any(f in ((m.location or {}).get('url','')+m.text) for f in ('fonts.googleapis.com','fonts.gstatic.com'))
        pg.on('console',lambda m:errs.append('console: '+m.text) if m.type=='error' and not font(m) else None)
        pg.goto('file://'+os.path.join(ROOT,'index.html'))
        pg.wait_for_timeout(1500)
        data=pg.evaluate(READ)
        pg.evaluate("document.getElementById('v-kit').click()")
        pg.wait_for_timeout(600)
        tabfails=pg.evaluate(TABS%repr(list(SKIP)))
        for w,h in ((390,844),(1440,900)):
            q=b.new_page(viewport={'width':w,'height':h},color_scheme='dark',reduced_motion='reduce')
            q.on('pageerror',lambda e:errs.append('pageerror: '+str(e)))
            q.goto('file://'+os.path.join(ROOT,'index.html'))
            q.wait_for_timeout(1500)
            q.evaluate("document.getElementById('v-kit').click()")
            q.wait_for_timeout(600)
            layout+=['%d: %s'%(w,x) for x in q.evaluate(LAYOUT)]
            q.close()
        b.close()
    data['rows']=[r for r in data['rows'] if r['id'] not in SKIP]
    fails,notes,written,total=check(data)
    fails=errs+fails+['tabs: '+x for x in tabfails]+['layout '+x for x in layout]
    for n in notes: print('usage: note: '+n)
    for f in fails: print('usage: '+f)
    print('usage: %d of %d components have their words'%(written,total))
    print('usage: ok' if not fails else 'usage: %d problems'%len(fails))
    sys.exit(1 if fails else 0)

if __name__=='__main__':
    main()
