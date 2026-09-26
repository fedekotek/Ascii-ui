"""The kit works on its own: kit/starter.html, and the Code tab pasted into a blank page.

python3 qa/kit.py          check everything, print `kit: ok` or the failures (exit 1)
python3 qa/kit.py sync     copy kit/ascii-ui.css and kit/ascii-ui.js into the KIT()
                           block at the end of js/40, which the Code tab and the
                           downloads read. Run it after editing either kit file.

Checks:
1. the copy embedded in js/40 is byte for byte the kit files
2. kit/starter.html from file://: no errors, and every behavior works
   (tabs, dialog, sheet, dropdown by keyboard, tooltip Escape, toast, slider,
   progress, OTP, calendar, pagination, validation, counter, spinner, skeleton)
3. index.html: the Code tab html of every component, pasted TWICE into a blank
   page with only the two kit files: no ids and no demo class in the html, no
   errors, no duplicate ids, every label has its control, it has size, button
   labels sit on one row, the behaviors it names come alive in both copies, and
   the second copy works without touching the first (tabs, dialogs, progress,
   status lines, counters, errors, menus, tooltips)
The Google Fonts request fails in some sandboxes (proxy certificates); that one
is reported as a note, not a failure.
"""
import asyncio,json,os,re,sys,tempfile
from playwright.async_api import async_playwright

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
KIT=os.path.join(ROOT,'kit')
J40=os.path.join(ROOT,'js','40-themes-ramp-code.js')
START='/* ---- kit source:'
END='/* ---- end of kit source ---- */'

def enc(s):
    # a JS string literal that is safe inside an inline <script>
    return json.dumps(s).replace('</','<\\/')

def kit_block():
    css=open(os.path.join(KIT,'ascii-ui.css'),encoding='utf-8').read()
    js=open(os.path.join(KIT,'ascii-ui.js'),encoding='utf-8').read()
    return ('/* ---- kit source: written by `python3 qa/kit.py sync` from kit/, checked by `python3 qa/kit.py`. Do not edit by hand ---- */\n'
            'function KIT(){return {\ncss:'+enc(css)+',\njs:'+enc(js)+'\n}}\n'+END)

def embedded():
    s=open(J40,encoding='utf-8').read()
    i=s.index(START); j=s.index(END)+len(END)
    return s,i,j

def sync():
    s,i,j=embedded()
    s=s[:i]+kit_block()+s[j:]
    open(J40,'w',encoding='utf-8').write(s)
    print('js/40: kit source synced')

FONT=re.compile(r'fonts\.(googleapis|gstatic)\.com')

def watch(pg,errs,notes):
    def con(m):
        if m.type!='error':return
        url=(m.location or {}).get('url','')
        if 'ERR_CERT_AUTHORITY_INVALID' in m.text or FONT.search(url or ''): notes.add('font request blocked by the sandbox')
        else: errs.append('console: '+m.text)
    pg.on('console',con)
    pg.on('pageerror',lambda e:errs.append('pageerror: '+str(e)))
    def rf(r):
        if FONT.search(r.url): notes.add('font request blocked by the sandbox')
        else: errs.append('request failed: '+r.url)
    pg.on('requestfailed',rf)

DUPES="(()=>{const s=new Set(),d=[];document.querySelectorAll('[id]').forEach(e=>{if(s.has(e.id))d.push(e.id);s.add(e.id)});return d})()"
# every button label is one row: a .btn is three rows tall (frame, label, frame)
ONE_ROW="""()=>[...document.querySelectorAll('.btn')].filter(b=>b.offsetParent&&!b.closest('dialog:not([open]),[role=menu][hidden]')).map(b=>[b.textContent.trim(),Math.round(b.getBoundingClientRect().height/parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--r')))]).filter(x=>x[1]!==3)"""

async def starter(b):
    fails=[];notes=set();errs=[]
    pg=await b.new_page(viewport={'width':390,'height':844})
    watch(pg,errs,notes)
    await pg.goto('file://'+os.path.join(KIT,'starter.html'))
    await pg.wait_for_timeout(600)
    ev=pg.evaluate
    def ok(name,cond,detail=''):
        if not cond: fails.append('starter: '+name+(' ('+str(detail)+')' if detail else ''))
    ok('ASCIIUI is there',await ev("!!window.ASCIIUI"))
    bad=await ev(ONE_ROW); ok('button labels on one row',not bad,bad)
    # frames are drawn: the tone strings resolve
    h=await ev("getComputedStyle(document.querySelector('.btn'),'::before').content")
    ok('frames draw',h and '@' in h,h[:30] if h else h)
    # the page itself: a top bar with the theme, groups with anchors, the README one link away
    ok('top bar holds the theme',await ev("!!document.querySelector('header.top [role=radiogroup][aria-label=Theme]')"))
    ok('five groups with anchors',await ev("['form','overlay','display','feedback','navigation'].every(g=>document.querySelector('.toc a[href=\"#'+g+'\"]')&&document.getElementById(g))"))
    ok('README linked',await ev("!!document.querySelector('main a[href=\"README.md\"]')"))
    ok('links back to the site',await ev("!!document.querySelector('a[href=\"https://asciiui.vercel.app/#components\"]')"))
    ok('README is next to it',os.path.exists(os.path.join(KIT,'README.md')))
    # tabs
    tab=lambda n:'#tabs [role=tab]:nth-child(%d)'%n
    panel="document.querySelectorAll('#tabs [role=tabpanel]')"
    await pg.focus(tab(1)); await pg.keyboard.press('ArrowRight')
    ok('tabs: arrow moves',await ev("document.querySelector('%s').getAttribute('aria-selected')==='true'&&!%s[1].hidden&&%s[0].hidden"%(tab(2),panel,panel)))
    await pg.click(tab(3))
    ok('tabs: click picks',await ev("!%s[2].hidden"%panel))
    ok('tabs: aria-controls made',await ev("[...document.querySelectorAll('#tabs [role=tab]')].every((t,i)=>t.getAttribute('aria-controls')===%s[i].id)"%panel))
    # dialog
    await pg.click('#card [data-aui-open]')
    ok('dialog opens',await ev("document.querySelector('#card dialog').open"))
    ok('dialog: named by its title',await ev("(()=>{const d=document.querySelector('#card dialog');return document.getElementById(d.getAttribute('aria-labelledby')).textContent.includes('Publish')})()"))
    await pg.keyboard.press('Escape')
    ok('dialog: Escape closes',not await ev("document.querySelector('#card dialog').open"))
    await pg.click('#card [data-aui-open]'); await pg.click('#card dialog .btn-primary'); await pg.wait_for_timeout(120)
    ok('dialog: confirm closes and toasts',await ev("!document.querySelector('#card dialog').open&&document.querySelector('.toast.on span').textContent.includes('Published')"))
    ok('dialog: focus goes back',await ev("document.activeElement===document.querySelector('#card [data-aui-open]')"))
    # sheet, closes from the page above it
    await pg.click('#sheet [data-aui-open]')
    ok('sheet opens',await ev("document.querySelector('#sheet dialog').open"))
    await pg.mouse.click(195,20); await pg.wait_for_timeout(100)
    ok('sheet: page above closes it',not await ev("document.querySelector('#sheet dialog').open"))
    # dropdown by keyboard
    menu="document.querySelector('#dropdown [role=menu]')"
    await pg.focus('#dropdown [aria-haspopup]'); await pg.keyboard.press('ArrowDown')
    ok('dropdown: ArrowDown opens',await ev("!%s.hidden&&document.activeElement.getAttribute('role')==='menuitem'"%menu))
    await pg.keyboard.press('ArrowDown')
    ok('dropdown: arrows move',await ev("document.activeElement.textContent.startsWith('Copy link')"))
    await pg.keyboard.press('Escape')
    ok('dropdown: Escape closes, focus back',await ev("%s.hidden&&document.activeElement.matches('#dropdown [aria-haspopup]')"%menu))
    await pg.keyboard.press('Enter')
    ok('dropdown: Enter opens',await ev("!%s.hidden"%menu))
    await pg.keyboard.press('Enter'); await pg.wait_for_timeout(100)
    ok('dropdown: Enter picks and closes',await ev("%s.hidden&&document.querySelector('.toast.on span').textContent.includes('Duplicated')"%menu))
    # tooltip: tap shows, Escape hides
    tt="document.querySelector('#tooltip .pop')"
    await pg.click('#tooltip button')
    ok('tooltip: tap shows',await ev("%s.classList.contains('on')"%tt))
    await pg.keyboard.press('Escape')
    ok('tooltip: Escape hides',await ev("%s.classList.contains('off')"%tt))
    # toast
    await pg.click('#toast .btn-danger'); await pg.wait_for_timeout(100)
    ok('toast: error is yellow',await ev("document.querySelector('.toast').classList.contains('err')&&document.querySelector('.toast.on span').textContent.includes('broke')"))
    # slider
    b0=await ev("document.querySelector('.slider .bar').textContent")
    ok('slider: bar drawn',len(b0)==24,b0)
    ok('slider: label linked',await ev("document.querySelector('#slider label').control===document.querySelector('#slider input')"))
    await pg.focus('#slider input'); await pg.keyboard.press('End')
    ok('slider: updates',await ev("document.querySelector('.slider output').textContent==='100'&&document.querySelector('.slider .bar').textContent==='@'.repeat(24)"))
    # progress
    pb="document.querySelector('#progress [role=progressbar]')"
    await pg.click('#progress [data-aui-fill]'); await pg.wait_for_timeout(700)
    mid=await ev("+%s.getAttribute('aria-valuenow')"%pb)
    ok('progress: moves',0<mid<=100,mid)
    await pg.wait_for_timeout(4200)
    ok('progress: finishes',await ev("%s.getAttribute('aria-valuenow')==='100'&&document.querySelector('#progress [role=status]').textContent.includes('Exported')&&%s.querySelector('.pct').textContent.trim()==='100%%'"%(pb,pb)))
    # otp
    await pg.click('#otp input'); await pg.keyboard.type('12')
    ok('otp: advances',await ev("document.activeElement===document.querySelectorAll('#otp input')[2]"))
    await pg.keyboard.press('Backspace')
    ok('otp: Backspace goes back',await ev("document.activeElement===document.querySelectorAll('#otp input')[1]"))
    await pg.keyboard.type('23456')
    ok('otp: six digits accepted',await ev("document.querySelector('#otp .otp').classList.contains('good')&&document.querySelector('#otp [role=status]').textContent.includes('accepted')"))
    # calendar
    n=await ev("document.querySelectorAll('#calendar [data-day]').length")
    ok('calendar: a month of days',28<=n<=31,n)
    m0=await ev("document.querySelector('#calendar .cal-head span').textContent")
    await pg.click('#calendar [data-d=\"1\"]')
    ok('calendar: next month',await ev("document.querySelector('#calendar .cal-head span').textContent")!=m0)
    await pg.focus('#calendar [data-day][tabindex=\"0\"]'); await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('Enter')
    ok('calendar: pick says so',await ev("document.querySelector('#calendar [role=status]').textContent.length>8"))
    # pagination
    await pg.click('#pagination [aria-label=\"Next page\"]')
    ok('pagination: next',await ev("document.querySelector('#pagination [role=status]').textContent==='Page 4 of 9.'"))
    # validation
    slug="document.querySelector('#input [data-aui=validate]')"
    err="document.querySelector('#input .error')"
    ok('validate: bad value is invalid on load',await ev("%s.closest('.field').classList.contains('invalid')&&%s.textContent.length>0"%(slug,err)))
    ok('validate: describedby made',await ev("document.getElementById(%s.getAttribute('aria-describedby'))===%s"%(slug,err)))
    ok('validate: labels linked',await ev("[...document.querySelectorAll('#input label')].every(l=>l.control)"))
    await pg.fill('#input [data-aui=validate]','reporting-redesign')
    ok('validate: good value clears',await ev("!%s.closest('.field').classList.contains('invalid')&&%s.textContent===''"%(slug,err)))
    await pg.fill('#input [data-aui=validate]','')
    ok('validate: empty says required',await ev("%s.textContent.startsWith('Enter')"%err))
    # counter
    await pg.fill('#textarea textarea','hello')
    ok('counter',await ev("document.querySelector('#textarea .count').textContent==='5/280'"))
    # spinner and skeleton (they only move while on screen)
    await ev("document.querySelector('.spins').scrollIntoView()")
    s1=await ev("[...document.querySelectorAll('[data-aui=spinner]')].map(b=>b.textContent).join('~~')")
    await pg.wait_for_timeout(400)
    s2=await ev("[...document.querySelectorAll('[data-aui=spinner]')].map(b=>b.textContent).join('~~')")
    ok('spinner: moves',s1!=s2 and all(s1.split('~~')),[s1,s2])
    ok('skeleton: drawn',await ev("document.querySelector('.skel').textContent.trim().length>20"))
    ok('no duplicate ids',not await ev(DUPES),await ev(DUPES))
    # dark theme via data-theme
    await ev("document.documentElement.setAttribute('data-theme','dark')")
    ok('dark tokens',await ev("getComputedStyle(document.body).backgroundColor==='rgb(10, 6, 18)'"))
    # no overflow at 390
    ow=await ev("document.documentElement.scrollWidth-innerWidth")
    ok('no horizontal overflow',ow<=0,ow)
    fails+=['starter: '+e for e in errs]
    await pg.close()
    # reduced motion: spinners still, nothing throws
    pg=await b.new_page(viewport={'width':1280,'height':900},reduced_motion='reduce')
    errs=[];watch(pg,errs,notes)
    await pg.goto('file://'+os.path.join(KIT,'starter.html')); await pg.wait_for_timeout(300)
    s1=await ev_on(pg,"[...document.querySelectorAll('[data-aui=spinner]')].map(b=>b.textContent).join('~~')")
    await pg.wait_for_timeout(400)
    s2=await ev_on(pg,"[...document.querySelectorAll('[data-aui=spinner]')].map(b=>b.textContent).join('~~')")
    if s1!=s2 or not all(s1.split('~~')): fails.append('starter: reduced motion leaves spinners still (%s / %s)'%(s1,s2))
    fails+=['starter (reduced motion): '+e for e in errs]
    await pg.close()
    return fails,notes

async def ev_on(pg,js): return await pg.evaluate(js)

# after pasting: what each behavior should have done by itself
ALIVE={
 'tabs':"el.querySelectorAll('[role=tab][aria-selected=true]').length===1",
 'slider':"el.querySelector('.bar').textContent.length===24",
 'progress':"el.querySelector('.bar').textContent.length===24",
 'dropdown':"(()=>{el.querySelector('[aria-haspopup]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));const ok=!el.querySelector('[role=menu]').hidden;return ok})()",
 'tooltip':"(()=>{el.querySelector('button').click();return el.classList.contains('on')})()",
 'otp':"el.querySelectorAll('input').length===6",
 'calendar':"el.querySelectorAll('[data-day]').length>=28",
 'pagination':"el.querySelectorAll('button').length>=5",
 'validate':"el.getAttribute('aria-invalid')!==null",
 'counter':"el.closest('.group').querySelector('.count').textContent.includes('/')",
 'spinner':"el.textContent.length>0",
 'skeleton':"el.textContent.trim().length>20",
}

async def harvest(b):
    pg=await b.new_page(viewport={'width':1440,'height':900},color_scheme='dark')
    errs=[];notes=set();watch(pg,errs,notes)
    await pg.goto('file://'+os.path.join(ROOT,'index.html'))
    await pg.wait_for_timeout(2600)
    await pg.evaluate("document.getElementById('v-kit').click()"); await pg.wait_for_timeout(1500)
    out=await pg.evaluate("""()=>[...document.querySelectorAll('#view-kit > section[aria-labelledby]')].map(s=>{
        const t=s.querySelectorAll('.doc-tabs .tab')[1];if(!t)return [s.getAttribute('aria-labelledby'),null,null];t.click();
        const h=s.querySelector('[data-part=html]'),j=s.querySelector('[data-part=js]');
        return [s.getAttribute('aria-labelledby'),h&&h.textContent,j&&j.textContent]})""")
    embedded_ok=await pg.evaluate("(()=>{try{return typeof KIT}catch(e){return 'x'}})()")
    await pg.close()
    return out,errs,notes

# pasted twice: the second copy does its own thing and leaves the first alone.
# a is the first copy's element, b the second's; own(i,sel) finds sel in copy i
TWICE_JS="""(name)=>{
  const R=window.__R,h=R.length/2;if(R.length%2)return 'the page does not split in two';
  const I=[R.slice(0,h),R.slice(h)],which=el=>I[0].some(r=>r===el||r.contains(el))?0:1;
  const own=(i,sel)=>{for(const r of I[i]){if(r.matches(sel))return r;const x=r.querySelector(sel);if(x)return x}return null};
  const els=[...document.querySelectorAll('[data-aui="'+name+'"]')],a=els.find(e=>which(e)===0),b=els.find(e=>which(e)===1);
  if(!a||!b)return 'not in both copies';
  const fire=(el,t)=>el.dispatchEvent(new Event(t,{bubbles:true}));
  const st=i=>(own(i,'[role=status]')||{}).textContent;
  const T={
    tabs:()=>{const tb=b.querySelectorAll('[role=tab]')[1];tb.click();
      const P=l=>[...l.parentElement.children].filter(x=>x.getAttribute('role')==='tabpanel'),pa=P(a),pb=P(b);
      return !pb[1].hidden&&pb[0].hidden&&!pa[0].hidden&&pa[1].hidden&&document.getElementById(tb.getAttribute('aria-controls'))===pb[1]},
    slider:()=>{const i=b.querySelector('input');i.value=100;fire(i,'input');return b.querySelector('output').textContent==='100'&&a.querySelector('output').textContent!=='100'&&b.querySelector('label').control===i&&a.querySelector('label').control===a.querySelector('input')},
    otp:()=>{const i=b.querySelector('input');i.value='5';fire(i,'input');return /^1 of/.test(st(1))&&!/^1 of/.test(st(0))},
    calendar:()=>{const d=new Date().getDate()===15?16:15;b.querySelector('[data-day="'+d+'"]').click();return st(1)!==st(0)&&st(1).includes(String(d))},
    pagination:()=>{b.querySelector('[aria-label="Next page"]').click();return st(1)==='Page 4 of 9.'&&st(0)==='Page 3 of 9.'},
    validate:()=>{b.value='';fire(b,'input');const ea=document.getElementById(a.getAttribute('aria-describedby')),eb=document.getElementById(b.getAttribute('aria-describedby'));
      return eb&&ea&&eb!==ea&&eb.textContent.startsWith('Enter')&&!ea.textContent.startsWith('Enter')&&own(1,'.error')===eb},
    counter:()=>{b.value='hi';fire(b,'input');return own(1,'.count').textContent==='2/280'&&own(0,'.count').textContent==='0/280'},
    dropdown:()=>{const mb=b.querySelector('[role=menu]'),bt=b.querySelector('[aria-haspopup]');
      bt.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
      const ok=!mb.hidden&&a.querySelector('[role=menu]').hidden&&document.getElementById(bt.getAttribute('aria-controls'))===mb;
      mb.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return ok},
    tooltip:()=>{const t=b.querySelector('button');return document.getElementById(t.getAttribute('aria-describedby'))===b.querySelector('.tip')}
  };
  return T[name]?(T[name]()?true:'the second copy did not work on its own'):true;
}"""

# radios pasted twice: each copy keeps its checked radio, has its own names,
# and a pick in the second copy leaves the first alone
RADIOS_JS="""(()=>{
  const R=window.__R,h=R.length/2,I=[R.slice(0,h),R.slice(h)];
  const rs=i=>I[i].flatMap(r=>[...r.querySelectorAll('input[type=radio]')]);
  const a=rs(0),b=rs(1);if(!a.length)return true;
  if(a.length!==b.length)return 'the copies differ';
  const na=new Set(a.map(x=>x.name));if(b.some(x=>na.has(x.name)))return 'the second copy shares a name with the first';
  for(const x of [...a,...b])if(x.checked!==x.defaultChecked)return 'a copy lost its checked radio ('+x.name+')';
  const pick=b.find(x=>!x.checked);if(!pick)return true;pick.click();
  return a.every(x=>x.checked===x.defaultChecked)?true:'a pick in the second copy changed the first';
})()"""

# layouts people will write that the Code tab does not print: parts that are
# missing, parts in a shared box, a button and its dialog loose in <body>
EDGES=[
 ('pagination does not borrow the OTP status',
  '<main><div class="otp" data-aui="otp"><span><input maxlength="1"></span><span><input maxlength="1"></span></div><p role="status">Type.</p><nav data-aui="pagination" data-pages="9" data-page="3"></nav></main>',
  "(()=>{const s=document.querySelector('[role=status]');if(s.textContent!=='Type.')return 'pagination wrote '+s.textContent;const i=document.querySelector('.otp input');i.value='4';i.dispatchEvent(new Event('input',{bubbles:true}));return s.textContent==='1 of 2.'?true:'otp lost its own status: '+s.textContent})()"),
 ('a field without an error does not point at the next one',
  '<div><div class="group"><label class="field-label">Title</label><div class="field frame tone-light"><div class="mid"><input id="a" data-aui="validate" required value="x"></div></div></div><div class="group"><label class="field-label">Link</label><div class="field frame tone-light"><div class="mid"><input id="b" data-aui="validate" required pattern="[a-z]+" value="X"></div></div><p class="error"></p></div></div>',
  "(()=>{const a=document.getElementById('a'),b=document.getElementById('b'),e=document.querySelector('.error');if(a.hasAttribute('aria-describedby'))return 'Title points at '+a.getAttribute('aria-describedby');if(document.getElementById(b.getAttribute('aria-describedby'))!==e)return 'Link lost its error';const before=e.textContent;a.value='';a.dispatchEvent(new Event('input',{bubbles:true}));return e.textContent===before&&before.length>0?true:'Title wrote into Link error: '+e.textContent})()"),
 ('a counter without a count does not borrow one',
  '<div><textarea id="a" maxlength="10" data-aui="counter"></textarea><textarea id="b" maxlength="20" data-aui="counter"></textarea><p class="count">x</p></div>',
  "(()=>{const c=document.querySelector('.count');const a=document.getElementById('a');a.value='abc';a.dispatchEvent(new Event('input',{bubbles:true}));return c.textContent==='0/20'?true:'count says '+c.textContent})()"),
 ('a fill button without a bar does not run the neighbour',
  '<div><div class="progress" role="progressbar" data-aui="progress" aria-valuenow="0"><span class="bar"></span></div><button id="own" data-aui-fill>Own</button><button id="lost" data-aui-fill>Lost</button></div>',
  "(async()=>{document.getElementById('lost').click();await new Promise(r=>setTimeout(r,300));const v=document.querySelector('[role=progressbar]').getAttribute('aria-valuenow');if(v!=='0')return 'the lost button ran the bar';document.getElementById('own').click();await new Promise(r=>setTimeout(r,300));return +document.querySelector('[role=progressbar]').getAttribute('aria-valuenow')>0?true:'the own button did not run its bar'})()"),
 ('a button and a dialog loose in body',
  '<button id="o" data-aui-open>Open</button><dialog><div class="body"><p>Hi</p><button data-aui-close>Close</button></div></dialog>',
  "(()=>{document.getElementById('o').click();return document.querySelector('dialog').open?true:'did not open'})()"),
 ('a dialog named with data-aui-dialog',
  '<div><button id="o" data-aui-open="pub">Open</button></div><p>between</p><div><dialog data-aui-dialog="pub"><p>Hi</p></dialog></div><div><button data-aui-open>Other</button><dialog id="other"></dialog></div>',
  "(()=>{document.getElementById('o').click();const d=document.querySelector('[data-aui-dialog=pub]');return d.open&&!document.getElementById('other').open?true:'the named dialog did not open'})()"),
 ('no dialog at all: one warning, no error',
  '<button id="o" data-aui-open="nope">Open</button>',
  "(()=>{document.getElementById('o').click();document.getElementById('o').click();return true})()"),
]

async def edges(b):
    fails=[];notes=set()
    for name,html,js in EDGES:
        page=('<!doctype html><html lang="en"><head><meta charset="utf-8">'
              '<link rel="stylesheet" href="file://'+os.path.join(KIT,'ascii-ui.css')+'">'
              '<script src="file://'+os.path.join(KIT,'ascii-ui.js')+'" defer></script></head><body>'+html+'</body></html>')
        fd,path=tempfile.mkstemp(suffix='.html',prefix='kit-edge-');os.write(fd,page.encode('utf-8'));os.close(fd)
        pg=await b.new_page(viewport={'width':390,'height':844})
        errs=[];warns=[];watch(pg,errs,notes)
        pg.on('console',lambda m:warns.append(m.text) if m.type=='warning' else None)
        try:
            await pg.goto('file://'+path); await pg.wait_for_timeout(250)
            r=await pg.evaluate(js)
            if r is not True: fails.append('edge: %s: %s'%(name,r))
            if name.startswith('no dialog'):
                w=[x for x in warns if 'data-aui-open' in x]
                if len(w)!=1: fails.append('edge: %s: expected one warning, got %d'%(name,len(w)))
            fails+=['edge: %s: %s'%(name,e) for e in errs]
        finally:
            await pg.close();os.remove(path)
    return fails,notes

async def paste(b,sid,html,notes):
    # the Code tab html pasted twice, one after the other, the way a person would
    page=('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
          '<link rel="stylesheet" href="file://'+os.path.join(KIT,'ascii-ui.css')+'">'
          '<script src="file://'+os.path.join(KIT,'ascii-ui.js')+'" defer></script></head><body>\n'+html+'\n'+html+'\n</body></html>')
    fd,path=tempfile.mkstemp(suffix='.html',prefix='kit-'+sid+'-');os.write(fd,page.encode('utf-8'));os.close(fd)
    pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[];watch(pg,errs,notes)
    try:
        await pg.goto('file://'+path); await pg.wait_for_timeout(350)
        await pg.evaluate("window.__R=[...document.body.children]")
        why=list(errs)
        size=await pg.evaluate("(()=>{let w=0,h=0;[...document.body.children].forEach(e=>{const r=e.getBoundingClientRect();w=Math.max(w,r.width);h+=r.height});return [w,h]})()")
        if not(size[0]>0 and size[1]>0): why.append('renders at %dx%d'%tuple(size))
        if re.search(r'\sid="',html): why.append('the Code tab html has ids')
        if re.search(r'class="[^"]*\bdemo\b',html): why.append('the Code tab html has the demo class')
        d=await pg.evaluate(DUPES)
        if d: why.append('pasted twice, duplicate ids: %s'%d)
        nl=await pg.evaluate("[...document.querySelectorAll('label')].filter(l=>!l.control).map(l=>l.textContent.trim())")
        if nl: why.append('labels without a control: %s'%nl)
        bad=await pg.evaluate(ONE_ROW)
        if bad: why.append('button labels over more than one row: %s'%bad)
        r=await pg.evaluate(RADIOS_JS)
        if r is not True: why.append('radios: '+r)
        names=await pg.evaluate("[...new Set([...document.querySelectorAll('[data-aui]')].map(e=>e.dataset.aui))]")
        attrs=await pg.evaluate("['open','close','toast','toast-err','reset','fill'].filter(a=>document.querySelector('[data-aui-'+a+']')).map(a=>'aui-'+a)")
        for n in names:
            if n not in ALIVE: why.append('unknown behavior '+n);continue
            alive=await pg.evaluate("[...document.querySelectorAll('[data-aui=\"%s\"]')].every(el=>%s)"%(n,ALIVE[n]))
            if not alive: why.append(n+' did not come alive')
            t=await pg.evaluate(TWICE_JS,n)
            if t is not True: why.append(n+': '+t)
        if await pg.evaluate("!!document.querySelector('[data-aui-open]')"):
            # the second copy's button opens the second copy's dialog
            r=await pg.evaluate("(()=>{const o=document.querySelectorAll('[data-aui-open]'),d=document.querySelectorAll('dialog');if(o.length!==2||d.length!==2)return 'expected two of each';o[1].click();const ok=d[1].open&&!d[0].open;d[1].close();o[0].click();const ok0=d[0].open&&!d[1].open;d[0].close();return ok&&ok0?true:'each button did not open its own dialog'})()")
            if r is not True: why.append('dialog: '+r)
        if await pg.evaluate("!!document.querySelector('[data-aui-fill]')"):
            await pg.evaluate("document.querySelectorAll('[data-aui-fill]')[1].click()"); await pg.wait_for_timeout(400)
            v=await pg.evaluate("[...document.querySelectorAll('[role=progressbar]')].map(p=>+p.getAttribute('aria-valuenow'))")
            if not(len(v)==2 and v[0]==0 and v[1]>0): why.append('fill: the second button did not run only its own bar %s'%v)
        t=await pg.evaluate("(()=>{const b=document.querySelector('[data-aui-toast],[data-aui-toast-err]');if(!b)return null;b.closest('[role=menu]')||b.click();return true})()")
        if t:
            await pg.wait_for_timeout(80)
            if not await pg.evaluate("!!document.querySelector('.toast.on')") and not await pg.evaluate("!!document.querySelector('[role=menu] [data-aui-toast],[role=menu] [data-aui-toast-err]')"): why.append('toast did not show')
        why+=[e for e in errs if e not in why]
        return names+attrs,why
    finally:
        await pg.close();os.remove(path)

async def main():
    fails=[];notes=set()
    s,i,j=embedded()
    if s[i:j]!=kit_block(): fails.append('js/40 KIT() is not the kit files: run python3 qa/kit.py sync')
    async with async_playwright() as p:
        b=await p.chromium.launch()
        f,n=await starter(b);fails+=f;notes|=n
        f,n=await edges(b);fails+=f;notes|=n
        comps,errs,n=await harvest(b);notes|=n
        fails+=['index.html: '+e for e in errs]
        rows=[]
        for sid,html,js in comps:
            if sid in ('s-install','s-rules'): continue   # not components
            if html is None: rows.append((sid,'no Code tab','',''));fails.append(sid+': no Code tab');continue
            names,why=await paste(b,sid,html,notes)
            if 'site\'s' in (js or '') or 'this site' in (js or ''): kind='partly (site only part left out)'
            else: kind=''
            rows.append((sid,'yes' if not why else 'NO',', '.join(names) or '-',kind))
            fails+=[sid+': '+w for w in why]
        await b.close()
    works=sum(1 for r in rows if r[1]=='yes')
    print('%-16s %-4s %-28s %s'%('component','ok','behaviors',''))
    for r in rows: print('%-16s %-4s %-28s %s'%r)
    print('%d of %d components work pasted twice into a blank page with the two kit files'%(works,len(rows)))
    if works<12: fails.append('fewer than 12 components pasted clean')
    for n in sorted(notes): print('note: '+n)
    if fails:
        for f in fails: print('FAIL '+f)
        sys.exit(1)
    print('kit: ok')

if __name__=='__main__':
    if len(sys.argv)>1 and sys.argv[1]=='sync': sync()
    else: asyncio.run(main())
