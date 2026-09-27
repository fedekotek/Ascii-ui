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
4. edge pages: parts that are missing or far away, radios in two forms keep
   their names, validation on blur and submit with its words and events,
   data-aui-reset, a toast over a modal dialog, the OTP, calendar and
   pagination options, the calls (tabs, pagination, calendar, dropdown, otp),
   settings changed on a live element, frames 400 wide and 200 tall
5. lifecycle: 20 mounts and unmounts leave no listeners on document and
   window, a spinner and a skeleton put back move again, destroy and init,
   reduced motion followed while the page is open
6. the Code tab: nothing changes after the demos are scrambled and used,
   labels read as their data-text, classes the kit does not style are named
   (and only Picture and Command may print them among the components), the
   Skeleton behavior and the .ibtn css of Calendar and Pagination are there,
   the Table block prints the kit Table
7. Themes > Copy tokens: the Amber export pasted after the kit wins in a
   light and a dark system setting and with data-theme, and the ramp script
   runs after the kit
8. 1.2.0 polish: toasts (the mark is paint, errors are alerts, [x], longer
   words stay longer), the OTP says Digits only., the calendar says a new
   month, validation waits for the first blur, a select's frame takes the
   tap, spinners and kbd brackets are not read, the sheet closes on a drag
   down, motion tokens, scanlines only with .crt, the veil is characters,
   and print, forced colors and more contrast
9. README: the integrity hashes of the pinned files match the served bytes,
   and PIN in js/40 (what a Download page links) matches README
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

# PIN in js/40: the version and the integrity hashes a Code tab's Download
# page links. Written here from the released files, never by hand, and checked
# against kit/README.md
PIN_RE=re.compile(r"const PIN=\{v:'([^']*)',css:'([^']*)',js:'([^']*)'\};")
def pin_want():
    import base64,hashlib
    js=open(os.path.join(KIT,'ascii-ui.js'),encoding='utf-8').read()
    v=re.search(r"var VERSION='([^']+)'",js).group(1)
    h={}
    for f in ('css','js'):
        src=os.path.join(KIT,'releases',v,'ascii-ui.'+f)
        if not os.path.exists(src): src=os.path.join(KIT,'ascii-ui.'+f)
        h[f]='sha384-'+base64.b64encode(hashlib.sha384(open(src,'rb').read()).digest()).decode()
    return v,h['css'],h['js']

def pin_check(s):
    m=PIN_RE.search(s)
    if not m: return ['js/40: no const PIN={v:...,css:...,js:...}; for the Download page']
    fails=[];v,c,j=pin_want()
    if m.groups()!=(v,c,j): fails.append('js/40 PIN is %s, the released kit is %s: run python3 qa/kit.py sync'%(m.groups(),(v,c,j)))
    readme=open(os.path.join(KIT,'README.md'),encoding='utf-8').read()
    for f,h in (('ascii-ui.css',m.group(2)),('ascii-ui.js',m.group(3))):
        r=re.search(r'/kit/'+re.escape(m.group(1))+'/'+re.escape(f)+r'"[^>]*integrity="([^"]+)"',readme)
        if not r or r.group(1)!=h: fails.append('js/40 PIN for %s is not the integrity kit/README.md gives /kit/%s/%s'%(f,m.group(1),f))
    return fails

def sync():
    s,i,j=embedded()
    s=s[:i]+kit_block()+s[j:]
    v,c,js=pin_want()
    if PIN_RE.search(s): s=PIN_RE.sub(lambda m:"const PIN={v:'%s',css:'%s',js:'%s'};"%(v,c,js),s,1)
    open(J40,'w',encoding='utf-8').write(s)
    print('js/40: kit source and PIN synced')

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
    ok('links back to the site',await ev("!!document.querySelector('a[href=\"https://ascii.fedekotek.design/#components\"]')"))
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
    # popover: Enter opens with the focus inside, Escape closes and brings it back
    OPEN="(x=>x.matches('[popover]')?x.matches(':popover-open'):!x.hidden)"
    pane="%s(document.querySelector('#popover .pop .pane'))"%OPEN
    await pg.focus('#popover .pop [aria-haspopup]'); await pg.keyboard.press('Enter')
    ok('popover: Enter opens, focus on the checked radio',await ev("%s&&document.activeElement.matches('#popover input[type=radio]:checked')&&document.querySelector('#popover [aria-haspopup]').getAttribute('aria-expanded')==='true'"%pane))
    await pg.keyboard.press('Escape')
    ok('popover: Escape closes, focus back',await ev("!%s&&document.activeElement.matches('#popover .pop [aria-haspopup]')"%pane))
    # combobox: type, the best match is active, Enter picks, nothing matches says so
    await pg.focus('#combobox input'); await pg.keyboard.type('fra')
    ok('combobox: typing opens it on the best match',await ev("(()=>{const i=document.querySelector('#combobox input');return i.getAttribute('aria-expanded')==='true'&&document.getElementById(i.getAttribute('aria-activedescendant')).textContent.startsWith('fra-1')})()"))
    await pg.keyboard.press('Enter')
    ok('combobox: Enter picks',await ev("document.querySelector('#combobox input').value==='fra-1, Frankfurt'&&document.querySelector('#combobox [role=status]').textContent.includes('Frankfurt')"))
    await pg.keyboard.press('Control+A'); await pg.keyboard.type('zzz')
    ok('combobox: nothing matches says so',await ev("(()=>{const n=document.querySelector('#combobox .opts-none');return n&&!n.hidden&&n.textContent.length>3})()"))
    await pg.keyboard.press('Escape')
    ok('combobox: Escape puts the pick back',await ev("document.querySelector('#combobox input').value==='fra-1, Frankfurt'"))
    # alert dialog: the safe answer has the focus, a tap outside does not close it
    await pg.click('#alertdialog [data-aui-open]')
    ad="document.querySelector('#alertdialog dialog')"
    ok('alert dialog: opens on Keep it',await ev("%s.open&&document.activeElement.textContent.trim()==='Keep it'"%ad))
    await pg.mouse.click(5,5); await pg.wait_for_timeout(100)
    ok('alert dialog: a tap outside does not close it',await ev("%s.open"%ad))
    await pg.keyboard.press('Escape')
    ok('alert dialog: Escape closes, focus back',await ev("!%s.open&&document.activeElement.matches('#alertdialog [data-aui-open]')"%ad))
    await pg.click('#alertdialog > div > div:nth-child(2) [data-aui-open]')
    await pg.keyboard.type('static'); await pg.keyboard.press('Enter')
    ok('alert dialog: the wrong name says what to type',await ev("(()=>{const d=document.querySelectorAll('#alertdialog dialog')[1];return d.open&&d.querySelector('.btn-danger').disabled&&d.querySelector('.error').textContent.includes('static-prod')})()"))
    await pg.keyboard.type('-prod')
    ok('alert dialog: the right name turns Delete on',await ev("!document.querySelectorAll('#alertdialog dialog')[1].querySelector('.btn-danger').disabled"))
    await pg.keyboard.press('Escape')
    # context menu: Shift F10 on a row, arrows, Escape back to the row.
    # The kit closes the menu on any scroll, and focus() scrolls the row into
    # view with its scroll event a frame later: press only once that frame has
    # passed, and the next key only once the menu has the focus
    cm="%s(document.querySelector('#contextmenu [role=menu]'))"%OPEN
    settled="new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())))"
    inmenu="%s&&document.activeElement.getAttribute('role')==='menuitem'"%cm
    async def menu_up():
        try: await pg.wait_for_function(inmenu,timeout=2000)
        except Exception: pass
        await ev(settled)
    await pg.focus('#contextmenu tbody tr'); await ev(settled); await pg.keyboard.press('Shift+F10'); await menu_up()
    ok('context menu: Shift F10 opens on the row',await ev("%s&&document.activeElement.getAttribute('role')==='menuitem'&&document.querySelector('#contextmenu tbody tr').hasAttribute('data-ctx')"%cm))
    await pg.keyboard.press('ArrowDown')
    ok('context menu: arrows move',await ev("document.activeElement.textContent.startsWith('Copy ID')"))
    await pg.keyboard.press('Escape')
    ok('context menu: Escape closes, focus back',await ev("!%s&&document.activeElement===document.querySelector('#contextmenu tbody tr')"%cm))
    await ev(settled); await pg.keyboard.press('Shift+F10'); await menu_up()
    ok('context menu: Shift F10 opens again',await ev(inmenu))
    await pg.keyboard.press('c')
    ok('context menu: the kbd letter picks',await ev("!%s&&document.querySelector('#contextmenu [role=status]').textContent==='Copy ID: INC-481.'"%cm))
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
 'popover':"(()=>{const b=el.querySelector('[aria-haspopup]');return b.getAttribute('aria-expanded')==='false'&&document.getElementById(b.getAttribute('aria-controls'))===el.querySelector('.pane')})()",
 'combobox':"(()=>{const i=el.querySelector('input[role=combobox]');return i.getAttribute('aria-expanded')==='false'&&document.getElementById(i.getAttribute('aria-controls'))===el.querySelector('[role=listbox]')&&!!i.labels.length})()",
 'contextmenu':"(()=>{const m=el.querySelector('[role=menu]'),o=(x=>x.matches('[popover]')?x.matches(':popover-open'):!x.hidden);el.dispatchEvent(new KeyboardEvent('keydown',{key:'F10',shiftKey:true,bubbles:true}));const ok=o(m);ASCIIUI.contextmenu(el).close();return ok&&!o(m)})()",
 'confirm':"el.closest('dialog').querySelector('.btn-danger').disabled",
 'segment':"(()=>{const s=(el.closest('.stack')||document.body).querySelector('[role=status]'),c=el.querySelector('input:checked');return !c||(s&&s.textContent.includes(c.closest('label').textContent.trim()))})()",
}

async def harvest(b):
    pg=await b.new_page(viewport={'width':1440,'height':900},color_scheme='dark')
    errs=[];notes=set();watch(pg,errs,notes)
    await pg.goto('file://'+os.path.join(ROOT,'index.html'))
    await pg.wait_for_timeout(2600)
    await pg.evaluate("document.getElementById('v-kit').click()"); await pg.wait_for_timeout(1500)
    out=await pg.evaluate(READ_CODE,'kit')
    # the Code tab is built from the demo as the html has it: scramble every
    # button label, move the demos, then open Code again. Nothing may change,
    # and every label reads as its data-text
    await pg.evaluate(STIR)
    again=await pg.evaluate(READ_CODE,'kit')
    # the buttons the stir scrambled (the Code tab's own copy buttons and a
    # button busy with its own job are not demo labels), against every
    # .btn label the Code tab prints
    lost=await pg.evaluate("""()=>{const code=new Set();
      document.querySelectorAll('#view-kit [data-part=html]').forEach(p=>{const t=document.createElement('template');t.innerHTML=p.textContent;
        t.content.querySelectorAll('.btn .label').forEach(l=>code.add(l.textContent.replace(/\\s+/g,' ').trim()))});
      return [...new Set([...document.querySelectorAll('#view-kit .doc-panel .btn[data-text]')].filter(b=>!b.closest('.copyrow')&&!b.disabled).map(b=>b.getAttribute('data-text')))].filter(t=>!code.has(t))}""")
    await pg.evaluate("document.getElementById('v-blocks').click()"); await pg.wait_for_timeout(1200)
    blocks=await pg.evaluate(READ_CODE,'blocks')
    await pg.close()
    stirred=[]
    first={r[0]:r for r in out}
    for r in again:
        if first.get(r[0])!=r: stirred.append(r[0])
    return out,blocks,stirred,lost,errs,notes

READ_CODE="""(v)=>[...document.querySelectorAll('#view-'+v+' > section[aria-labelledby]')].map(s=>{
    const t=s.querySelectorAll('.doc-tabs .tab')[1];if(!t)return [s.getAttribute('aria-labelledby'),null,null,null,null];t.click();
    const g=p=>{const e=s.querySelector('[data-part='+p+']');return e?e.textContent:null};
    const n=s.querySelector('[data-part=note]');
    /* the note sits above the html, so it is read before the code */
    const above=n&&!n.hidden&&(n.compareDocumentPosition(s.querySelector('[data-part=html]'))&4)?n.textContent:(n&&!n.hidden?'NOT ABOVE THE HTML':null);
    return [s.getAttribute('aria-labelledby'),g('html'),g('js'),g('css'),above]})"""
STIR="""(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),V=document.getElementById('view-kit');
  V.querySelectorAll('.doc-tabs').forEach(t=>t.querySelectorAll('.tab')[0].click());await w(50);
  const fire=(el,t)=>el&&el.dispatchEvent(new Event(t,{bubbles:true}));
  const tabs=V.querySelector('[aria-labelledby=s-tabs] .doc-panel [role=tab]:nth-child(2)');if(tabs)tabs.click();
  const r=V.querySelector('[aria-labelledby=s-slider] input[type=range]');if(r){r.value=5;fire(r,'input')}
  const o=V.querySelector('[aria-labelledby=s-otp] input');if(o){o.value='7';fire(o,'input')}
  V.querySelectorAll('[aria-labelledby=s-details] details').forEach(d=>d.open=!d.open);
  const x=document.getElementById('exportBtn');if(x)x.click();
  await w(200);
  V.querySelectorAll('.doc-panel .btn').forEach(b=>{if(window.AUI&&AUI.scramble)AUI.scramble(b)});
  await w(40)})()"""

# the classes the kit css styles
def kit_classes():
    css=open(os.path.join(KIT,'ascii-ui.css'),encoding='utf-8').read()
    css=re.sub(r'/\*.*?\*/','',css,flags=re.S); css=re.sub(r'"(?:[^"\\]|\\.)*"','""',css)
    return set(re.findall(r'\.(-?[_a-zA-Z][\w-]*)',css))
def classes_in(html):
    return {c for v in re.findall(r'class="([^"]*)"',html or '') for c in v.split()}
# components whose Code tab says it is site only, and prints the classes the kit does not have
SITE_ONLY=('s-picture','s-command')

# Themes > Copy tokens: the Amber preset pasted after the kit wins in a dark
# system setting, a light one, and with data-theme either way. A ramp of your
# own is its own snippet, a script that runs after the kit
async def tokens(b):
    fails=[];notes=set()
    pg=await b.new_page(viewport={'width':1440,'height':900},color_scheme='dark')
    errs=[];watch(pg,errs,notes)
    await pg.goto('file://'+os.path.join(ROOT,'index.html')); await pg.wait_for_timeout(2400)
    await pg.evaluate("document.getElementById('v-themes').click()"); await pg.wait_for_timeout(900)
    await pg.evaluate("(()=>{const r=document.querySelector('input[name=preset][value=amber]');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}))})()")
    await pg.wait_for_timeout(1200)
    css=await pg.evaluate("document.getElementById('tokensOut').textContent")
    hidden=await pg.evaluate("document.getElementById('tonesOut').closest('div').hidden")
    await pg.evaluate("document.querySelector('#rampPresets .chip[data-r=\"1\"]').click()"); await pg.wait_for_timeout(300)
    script=await pg.evaluate("document.getElementById('tonesOut').textContent")
    css2=await pg.evaluate("document.getElementById('tokensOut').textContent")
    fails+=['tokens: '+e for e in errs]
    await pg.close()
    if '<script' in css or '<script' in css2: fails.append('tokens: the css export holds a script')
    if 'color-scheme: dark' not in css: fails.append('tokens: no color-scheme in the export')
    if not hidden: fails.append('tokens: the ramp script shows for the default ramp')
    if 'DOMContentLoaded' not in script or 'ASCIIUI.tones(' not in script: fails.append('tokens: the ramp script is not its own snippet that waits for the kit: %r'%script[:80])
    m=re.search(r'--bg:\s*(#[0-9a-f]{6})',css)
    if not m or m.group(1)!='#0d0700': fails.append('tokens: the Amber export has --bg %s'%(m and m.group(1)))
    for scheme,theme in (('dark',None),('light',None),('dark','light'),('light','dark')):
        path=blank_page('<p>x</p>',head='<style>'+css+'</style>'+script)
        pg=await b.new_page(color_scheme=scheme)
        e2=[];watch(pg,e2,notes)
        try:
            await pg.goto('file://'+path); await pg.wait_for_timeout(250)
            if theme: await pg.evaluate("document.documentElement.setAttribute('data-theme','%s')"%theme)
            got=await pg.evaluate("[getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),getComputedStyle(document.body).backgroundColor,getComputedStyle(document.documentElement).getPropertyValue('--h-heavy').trim().slice(0,4)]")
            if got[0].lower()!='#0d0700' or got[1]!='rgb(13, 7, 0)': fails.append('tokens: pasted after the kit, %s system%s: --bg is %s'%(scheme,', data-theme='+theme if theme else '',got[0]))
            if got[2]!='"###': fails.append('tokens: the ramp script did not re-skin the frames (%s)'%got[2])
            fails+=['tokens: '+x for x in e2]
        finally:
            await pg.close();os.remove(path)
    return fails,notes

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
    validate:()=>{b.value='';fire(b,'input');fire(b,'blur');const ea=document.getElementById(a.getAttribute('aria-describedby')),eb=document.getElementById(b.getAttribute('aria-describedby'));
      return eb&&ea&&eb!==ea&&eb.textContent.startsWith('Enter')&&!ea.textContent.startsWith('Enter')&&own(1,'.error')===eb},
    counter:()=>{b.value='hi';fire(b,'input');return own(1,'.count').textContent==='2/280'&&own(0,'.count').textContent==='0/280'},
    dropdown:()=>{const mb=b.querySelector('[role=menu]'),bt=b.querySelector('[aria-haspopup]');
      bt.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
      const ok=!mb.hidden&&a.querySelector('[role=menu]').hidden&&document.getElementById(bt.getAttribute('aria-controls'))===mb;
      mb.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return ok},
    tooltip:()=>{const t=b.querySelector('button');return document.getElementById(t.getAttribute('aria-describedby'))===b.querySelector('.tip')},
    popover:()=>{const o=(x=>x.matches('[popover]')?x.matches(':popover-open'):!x.hidden),bt=b.querySelector('[aria-haspopup]'),pb=b.querySelector('.pane'),pa=a.querySelector('.pane');bt.click();
      const ok=o(pb)&&!o(pa)&&document.getElementById(bt.getAttribute('aria-controls'))===pb&&bt.getAttribute('aria-controls')!==a.querySelector('[aria-haspopup]').getAttribute('aria-controls');
      ASCIIUI.popover(b).close();return ok&&!o(pb)},
    combobox:()=>{const ca=ASCIIUI.combobox(a),cb=ASCIIUI.combobox(b),v=b.querySelector('[role=option]:not([aria-disabled=true])').getAttribute('data-value');cb.set(v);
      return cb.value===v&&ca.value===''&&st(1)!==st(0)&&a.querySelector('input').getAttribute('aria-controls')!==b.querySelector('input').getAttribute('aria-controls')},
    contextmenu:()=>{const o=(x=>x.matches('[popover]')?x.matches(':popover-open'):!x.hidden),mb=b.querySelector('[role=menu]'),ma=a.querySelector('[role=menu]'),r=b.querySelector('tbody tr')||b;
      r.focus();r.dispatchEvent(new KeyboardEvent('keydown',{key:'F10',shiftKey:true,bubbles:true}));
      const ok=o(mb)&&!o(ma)&&mb.contains(document.activeElement);const s0=st(0);document.activeElement.click();return ok&&!o(mb)&&st(0)===s0&&st(1)!==s0},
    segment:()=>{const L=x=>x.closest('label').textContent.trim(),r=[...b.querySelectorAll('input[type=radio]')].filter(x=>!x.checked&&!st(0).includes(L(x)))[0];r.click();
      const w=r.closest('label').textContent.trim();return st(1).includes(w)&&!st(0).includes(w)},
    confirm:()=>{const w=b.getAttribute('data-match');b.value=w;fire(b,'input');
      return !b.closest('dialog').querySelector('.btn-danger').disabled&&a.closest('dialog').querySelector('.btn-danger').disabled}
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

def RADIO(name,value,checked=0):
    return '<label class="check"><input type="radio" name="%s" value="%s"%s><span class="glyph" aria-hidden="true"></span>%s</label>'%(name,value,' checked' if checked else '',value)
def FIELD(id,attrs):
    return ('<div class="group"><label class="field-label">'+id+'</label><div class="field frame tone-light"><div class="mid">'
            '<input id="'+id+'" data-aui="validate" '+attrs+'></div></div><p class="error"></p></div>')

# layouts people will write that the Code tab does not print: parts that are
# missing, parts in a shared box, a button and its dialog loose in <body>.
# A fourth item is a word the one console warning must hold.
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
  "(()=>{document.getElementById('o').click();document.getElementById('o').click();return true})()",'data-aui-open'),
 # 1.1.0
 ('radios keep their names across forms, and split within one',
  '<form id="f1"><fieldset>'+RADIO('plan','a',1)+RADIO('plan','b')+'</fieldset></form>'
  '<form id="f2"><fieldset>'+RADIO('plan','a')+RADIO('plan','b',1)+'</fieldset></form>'
  '<div><fieldset id="l1">'+RADIO('vis','a',1)+RADIO('vis','b')+'</fieldset></div><div><fieldset id="l2">'+RADIO('vis','a',1)+RADIO('vis','b')+'</fieldset></div>'
  '<form id="f3"><fieldset id="s1">'+RADIO('size','s',1)+RADIO('size','m')+'</fieldset><fieldset id="s2">'+RADIO('size','s')+RADIO('size','m',1)+'</fieldset></form>',
  """(()=>{const $=id=>document.getElementById(id),names=s=>[...document.querySelectorAll(s+' input')].map(x=>x.name);
    if(names('#f1').concat(names('#f2')).some(n=>n!=='plan'))return 'a radio in a form was renamed: '+names('#f1')+' '+names('#f2');
    if(new FormData($('f1')).get('plan')!=='a'||new FormData($('f2')).get('plan')!=='b')return 'a form lost its pick';
    if(names('#l1')[0]!=='vis'||names('#l2')[0]==='vis')return 'copies outside a form were not split: '+names('#l2');
    if(names('#s1')[0]!=='size'||names('#s2')[0]==='size')return 'copies in one form were not split';
    if(!document.querySelector('#s1 input').checked||!document.querySelectorAll('#s2 input')[1].checked)return 'a copy lost its checked radio';
    return true})()"""),
 ('validation: blur, type words, submit, validate(), events',
  '<form id="f" action="javascript:void 0">'+FIELD('e','type="email" required data-error-type="Needs an @."')+'<button id="s">Send</button></form>'
  '<form id="g" novalidate action="javascript:void 0">'+FIELD('n','required')+'</form>',
  """(async()=>{const $=id=>document.getElementById(id),w=ms=>new Promise(r=>setTimeout(r,ms)),ev=[];
    document.addEventListener('aui:invalid',e=>ev.push('invalid:'+e.target.id));document.addEventListener('aui:valid',e=>ev.push('valid:'+e.target.id));
    const e=$('e'),err=()=>document.getElementById(e.getAttribute('aria-describedby')).textContent;
    e.focus();e.blur();
    if(err()!=='This one is required.'||e.getAttribute('aria-invalid')!=='true')return 'blur did not check: '+err();
    if(ev.join()!=='invalid:e')return 'aui:invalid did not fire once: '+ev;
    e.value='x';e.dispatchEvent(new Event('input',{bubbles:true}));
    if(err()!=='Needs an @.')return 'data-error-type not used: '+err();
    if(ASCIIUI.validate($('f'))!==false)return 'validate(form) did not say false';
    e.value='a@b.co';e.dispatchEvent(new Event('input',{bubbles:true}));
    if(err()!==''||ev[ev.length-1]!=='valid:e')return 'a good value did not clear or fire aui:valid';
    if(ASCIIUI.validate($('f'))!==true)return 'validate(form) did not say true';
    e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));$('n').focus();
    let prevented=null,sent=0;e.addEventListener('invalid',x=>{prevented=x.defaultPrevented});$('f').addEventListener('submit',x=>{sent++;x.preventDefault()});
    $('s').click();await w(30);
    if(prevented!==true)return 'the invalid event kept the browser bubble';
    if(sent)return 'an empty required field was sent';
    if(document.activeElement!==e)return 'a failed submit did not focus the field';
    let stopped=null;$('g').addEventListener('submit',x=>{stopped=x.defaultPrevented;x.preventDefault()});$('g').requestSubmit();await w(30);
    const n=$('n');if(stopped!==true||n.getAttribute('aria-invalid')!=='true')return 'a novalidate form was sent with an empty required field';
    return true})()"""),
 ('reset puts fields back and redraws, leaves hidden inputs, warns outside a form',
  '<form id="f"><div class="slider" data-aui="slider"><label>Volume</label><div class="slider-track"><span class="bar"></span><input type="range" id="rg" value="30"></div><output></output></div>'
  '<div><div class="otp" data-aui="otp" data-name="code"><span><input maxlength="1"></span><span><input maxlength="1"></span></div><p role="status" id="os"></p></div>'
  '<input id="t" value="hello"><input type="checkbox" id="c" checked><input type="hidden" id="h" name="h" value="keep">'
  '<div><textarea id="ta" maxlength="10" data-aui="counter">ab</textarea><p class="count" id="cn"></p></div>'
  '<select id="sel"><option>a</option><option selected>b</option></select>'
  '<button id="r" data-aui-reset>Reset</button></form><div><input id="out" value="x"><button id="lost" data-aui-reset>Lost</button></div>',
  """(async()=>{const $=id=>document.getElementById(id),fire=(el,t)=>el.dispatchEvent(new Event(t,{bubbles:true})),w=ms=>new Promise(r=>setTimeout(r,ms));
    $('rg').value=80;fire($('rg'),'input');const ins=document.querySelectorAll('.otp input:not([type=hidden])');ins[0].value='1';fire(ins[0],'input');ins[1].value='2';fire(ins[1],'input');$('t').focus();
    $('t').value='zzz';$('c').checked=false;$('ta').value='abcdef';fire($('ta'),'input');$('sel').value='a';
    if(document.querySelector('output').textContent!=='80'||new FormData($('f')).get('code')!=='12')return 'the setup did not take';
    $('r').click();await w(20);
    const bad=[];
    if($('rg').value!=='30'||document.querySelector('output').textContent!=='30')bad.push('slider '+$('rg').value+'/'+document.querySelector('output').textContent);
    if(!document.querySelector('.slider .bar').textContent)bad.push('bar not drawn');
    if($('t').value!=='hello')bad.push('text '+$('t').value);
    if(!$('c').checked)bad.push('checkbox default lost');
    if($('h').value!=='keep')bad.push('hidden cleared');
    if(new FormData($('f')).get('code')!==''||$('os').textContent!=='0 of 2.')bad.push('otp '+new FormData($('f')).get('code')+' '+$('os').textContent);
    if($('cn').textContent!=='2/10')bad.push('count '+$('cn').textContent);
    if($('sel').value!=='b')bad.push('select '+$('sel').value);
    if(document.activeElement===ins[1])bad.push('the reset moved the focus into the code');
    $('out').value='y';$('lost').click();if($('out').value!=='y')bad.push('a reset outside any form changed a field');
    return bad.length?bad.join(', '):true})()""",'data-aui-reset'),
 ('a toast shown over a modal dialog goes inside it',
  '<div><button id="o" data-aui-open>Open</button><dialog><div class="body"><p>Hi</p><button id="t" data-aui-toast="Saved.">Save</button><button id="x" data-aui-close>Close</button></div></dialog></div>',
  """(async()=>{const $=id=>document.getElementById(id),w=ms=>new Promise(r=>setTimeout(r,ms));
    $('o').click();$('t').click();await w(60);const t=document.querySelector('.toast');
    if(!t||t.parentNode!==document.querySelector('dialog'))return 'the toast is not in the open dialog';
    if(!t.classList.contains('on')||!t.textContent.includes('Saved'))return 'the toast did not show';
    $('x').click();ASCIIUI.toast('After.');await w(60);
    return t.parentNode===document.body?true:'with no dialog open the toast did not go back to the page'})()"""),
 ('otp, calendar and pagination options',
  '<form id="f"><div class="otp" data-aui="otp" data-name="code"><span><input maxlength="1" autocomplete="off"></span><span><input maxlength="1" autocomplete="off"></span><span><input maxlength="1" autocomplete="off"></span></div>'
  '<div><div class="cal" data-aui="calendar" data-name="when" data-value="2026-03-10" data-min="2026-03-05" data-max="2026-04-20" data-week-start="0" data-locale="de"></div><p role="status" id="cs"></p></div></form>'
  '<nav id="pg" data-aui="pagination" data-pages="12" data-page="4" data-href="?page={n}"></nav>',
  """(()=>{const $=id=>document.getElementById(id),fire=(el,t)=>el.dispatchEvent(new Event(t,{bubbles:true})),bad=[];
    const ins=[...document.querySelectorAll('.otp input:not([type=hidden])')];
    if(ins[0].getAttribute('autocomplete')!=='one-time-code')bad.push('first digit autocomplete '+ins[0].getAttribute('autocomplete'));
    if(ins[1].getAttribute('autocomplete')!=='off')bad.push('the other digits changed autocomplete');
    ins.forEach((x,i)=>{x.value=String(i+1);fire(x,'input')});
    const fd=()=>new FormData($('f'));
    if(fd().get('code')!=='123')bad.push('otp hidden '+fd().get('code'));
    if(fd().get('when')!=='2026-03-10')bad.push('calendar hidden '+fd().get('when'));
    const head=document.querySelector('.cal-head span').textContent;if(!/März/.test(head))bad.push('locale month '+head);
    const wd=document.querySelector('.cal-grid span').textContent;if(wd!=='S')bad.push('week start '+wd);
    if(!document.querySelector('[data-day="4"]').disabled||document.querySelector('[data-day="5"]').disabled)bad.push('data-min');
    if(!document.querySelector('[data-d="-1"]').disabled)bad.push('the month before data-min is open');
    let got=null;document.addEventListener('aui:change',e=>{got=e.detail.value},{once:true});
    document.querySelector('[data-day="12"]').click();
    if(got!=='2026-03-12'||fd().get('when')!=='2026-03-12')bad.push('pick '+got+' '+fd().get('when'));
    if(!/2026/.test($('cs').textContent))bad.push('status '+$('cs').textContent);
    const a=$('pg').querySelector('a.ibtn[href="?page=5"]'),cur=$('pg').querySelector('[aria-current=page]');
    if(!a||$('pg').querySelector('button'))bad.push('data-href did not draw links');
    if(!cur||cur.localName!=='a'||cur.textContent!=='4')bad.push('current page link');
    return bad.length?bad.join(', '):true})()"""),
 ('the calls, the events, and settings changed on a live element',
  '<script>window.__ev=[];document.addEventListener("aui:change",e=>__ev.push(e.target.getAttribute("data-aui")))</script>'
  '<div><div role="tablist" class="tablist" data-aui="tabs" id="tl"><button role="tab" class="tab">A</button><button role="tab" class="tab">B</button></div><div role="tabpanel">a</div><div role="tabpanel">b</div></div>'
  '<nav id="p" data-aui="pagination" data-pages="9" data-page="3"></nav><div class="cal" id="c" data-aui="calendar"></div>'
  '<div class="pop" id="d" data-aui="dropdown"><button aria-haspopup="menu">M</button><div role="menu" class="menu" hidden><button role="menuitem">X</button></div></div>'
  '<div class="otp" id="o" data-aui="otp"><span><input maxlength="1"></span><span><input maxlength="1"></span></div><span id="sp"></span>',
  """(async()=>{const $=id=>document.getElementById(id),w=ms=>new Promise(r=>setTimeout(r,ms)),bad=[];
    if(ASCIIUI.version!=='1.2.0')bad.push('version '+ASCIIUI.version);
    if(__ev.length)bad.push('aui:change fired on load: '+__ev);
    const t=ASCIIUI.tabs($('tl'));t.select(1);const P=document.querySelectorAll('[role=tabpanel]');
    if(P[1].hidden||!P[0].hidden||t.index!==1)bad.push('tabs select');
    if(__ev.length)bad.push('select() fired aui:change');
    $('tl').querySelector('[role=tab]').click();if(__ev.join()!=='tabs')bad.push('a click did not fire aui:change: '+__ev);
    ASCIIUI.pagination($('p')).set(5);if($('p').querySelector('[aria-current]').textContent!=='5')bad.push('pagination set');
    $('p').setAttribute('data-page','7');await w(0);if($('p').querySelector('[aria-current]').textContent!=='7')bad.push('data-page change not followed');
    $('p').setAttribute('data-pages','20');await w(0);if(!$('p').querySelector('[aria-label="Page 20"]'))bad.push('data-pages change not followed');
    const c=ASCIIUI.calendar($('c'));c.set('2026-01-15');if(c.value!=='2026-01-15'||!/January/.test($('c').textContent))bad.push('calendar set '+c.value);
    $('c').setAttribute('data-value','2026-02-02');await w(0);if(c.value!=='2026-02-02')bad.push('data-value change not followed');
    const d=ASCIIUI.dropdown($('d'));d.open();const m=$('d').querySelector('[role=menu]');if(m.hidden)bad.push('dropdown open');d.close();if(!m.hidden)bad.push('dropdown close');
    const o=ASCIIUI.otp($('o'));o.value='42';if(o.value!=='42'||$('o').querySelector('input').value!=='4')bad.push('otp value');
    if(ASCIIUI.tabs($('p'))!==null)bad.push('tabs() on a pagination is not null');
    $('sp').setAttribute('data-aui','spinner');await w(0);if(!$('sp').textContent)bad.push('a data-aui added later did not wire');
    $('sp').setAttribute('data-aui','');await w(0);const s1=$('sp').textContent;await w(300);if($('sp').textContent!==s1)bad.push('a data-aui removed kept running');
    if(__ev.filter(x=>x!=='tabs').length)bad.push('a call fired aui:change: '+__ev);
    return bad.length?bad.join(', '):true})()"""),
 ('frames reach 400 characters and walls 200 rows, before and after tones()',
  '<div class="field frame tone-light"><div class="mid"><input></div></div>',
  """(()=>{const g=k=>getComputedStyle(document.documentElement).getPropertyValue(k).trim(),bad=[];
    const h=()=>g('--h-heavy').replace(/"/g,'').length,v=()=>(g('--v-heavy').match(/\\\\A/gi)||[]).length;
    if(h()<400||v()<200)bad.push('css ships '+h()+' by '+v());
    ASCIIUI.tones({'@':'#'});if(h()<400||v()<200||!g('--h-heavy').startsWith('"###'))bad.push('tones() gives '+h()+' by '+v());
    return bad.length?bad.join(', '):true})()"""),
 # 1.1.1
 ('pagination keeps the page a script asked for until the pages reach it',
  '<div><nav id="p" data-aui="pagination" data-pages="9" data-page="3"></nav><p role="status" id="ps"></p></div>'
  '<div><nav id="q" data-aui="pagination" data-pages="9" data-page="3"></nav><p role="status"></p></div>'
  '<div><nav id="r" data-aui="pagination" data-pages="9" data-page="3"></nav><p role="status"></p></div>',
  """(async()=>{const $=id=>document.getElementById(id),w=ms=>new Promise(r=>setTimeout(r,ms)),bad=[],cur=id=>($(id).querySelector('[aria-current]')||{}).textContent;
    $('p').setAttribute('data-page','12');$('p').setAttribute('data-pages','20');await w(0);
    if(cur('p')!=='12'||$('ps').textContent!=='Page 12 of 20.')bad.push('page 12 then 20 pages, in one go, ends '+cur('p')+': '+$('ps').textContent);
    $('q').setAttribute('data-page','12');await w(0);
    if(cur('q')!=='9')bad.push('page 12 of 9 draws '+cur('q'));
    $('q').setAttribute('data-pages','20');await w(0);
    if(cur('q')!=='12')bad.push('page 12, a beat later 20 pages, ends '+cur('q'));
    ASCIIUI.pagination($('r')).set(15);await w(0);$('r').setAttribute('data-pages','20');await w(0);
    if(cur('r')!=='15')bad.push('set(15) of 9, then 20 pages, ends '+cur('r'));
    $('q').querySelector('[aria-label="Page 20"]').click();$('q').setAttribute('data-pages','5');await w(0);$('q').setAttribute('data-pages','30');await w(0);
    if(cur('q')!=='20')bad.push('a click on 20, then 5 pages, then 30, ends '+cur('q'));
    return bad.length?bad.join(', '):true})()"""),
 ('events fire for what a person does, not on load and not for a script',
  '<script>window.__ev=[];["invalid","valid","complete","change"].forEach(n=>document.addEventListener("aui:"+n,e=>__ev.push(n+":"+e.target.id)))</script>'
  '<form id="f" action="javascript:void 0">'+FIELD('e','required pattern="[a-z]+" value="BAD"')+FIELD('g','required value="good"')+'</form>'
  '<div><div class="otp" id="o" data-aui="otp"><span><input maxlength="1" value="1"></span><span><input maxlength="1" value="2"></span></div><p role="status"></p></div>'
  '<div><div class="otp" id="o2" data-aui="otp"><span><input maxlength="1"></span><span><input maxlength="1"></span></div><p role="status"></p></div>',
  """(async()=>{const $=id=>document.getElementById(id),w=ms=>new Promise(r=>setTimeout(r,ms)),fire=(el,t)=>el.dispatchEvent(new Event(t,{bubbles:true})),bad=[];
    if(__ev.length)bad.push('fired on load: '+__ev);
    if($('e').getAttribute('aria-invalid')!=='true')bad.push('a bad value on load is not shown invalid');
    if(!$('o').classList.contains('good'))bad.push('a full code on load is not accepted');
    __ev.length=0;ASCIIUI.otp($('o2')).value='34';ASCIIUI.otp($('o')).clear();ASCIIUI.otp($('o')).value='56';
    if(__ev.length)bad.push('otp value from a script fired: '+__ev);
    __ev.length=0;ASCIIUI.validate($('f'));$('g').value='';ASCIIUI.validate($('f'));
    if(__ev.length)bad.push('validate(form) fired: '+__ev);
    __ev.length=0;$('e').value='fine';fire($('e'),'input');
    if(__ev.join()!=='valid:e')bad.push('typing a good value fired '+__ev);
    __ev.length=0;const i=$('o2').querySelectorAll('input');i[1].value='';fire(i[1],'input');i[1].value='9';fire(i[1],'input');
    if(__ev.join()!=='complete:o2')bad.push('typing the last digit fired '+__ev);
    return bad.length?bad.join(', '):true})()"""),
 ('calendar: a date outside the range is not picked, no value means nothing picked',
  '<form id="f"><div><div class="cal" id="a" data-aui="calendar" data-name="a" data-value="2026-01-01" data-min="2026-03-05" data-max="2026-04-20"></div><p role="status" id="as"></p></div>'
  '<div><div class="cal" id="b" data-aui="calendar" data-name="b"></div><p role="status" id="bs"></p></div></form>'
  '<div><div class="cal" id="c" data-aui="calendar" data-value="2026-03-10" data-max="2026-04-20"></div><p role="status"></p></div>',
  """(async()=>{const $=id=>document.getElementById(id),w=ms=>new Promise(r=>setTimeout(r,ms)),bad=[],fd=()=>new FormData($('f'));
    const picked=id=>$(id).querySelectorAll('[aria-pressed=true]').length;
    if(picked('a')||fd().get('a')!==''||ASCIIUI.calendar($('a')).value!=='')bad.push('a data-value before data-min is picked: '+fd().get('a'));
    if(!/März|March/.test($('a').querySelector('.cal-head span').textContent))bad.push('out of range, the month shown is not the first allowed one');
    if(picked('b')||fd().get('b')!==''||$('bs').textContent!=='No date picked.')bad.push('no data-value picks today: '+fd().get('b')+' '+$('bs').textContent);
    const t=$('b').querySelector('[data-day][tabindex="0"]');
    if(!t||!t.classList.contains('today'))bad.push('no data-value, today is not the focusable day');
    $('b').querySelector('[data-day="3"]').click();
    if(!/-03$/.test(fd().get('b')))bad.push('a pick did not fill the hidden input: '+fd().get('b'));
    $('f').reset();await w(20);
    if(picked('b')||fd().get('b')!==''||$('bs').textContent!=='No date picked.')bad.push('a reset did not go back to nothing picked: '+fd().get('b'));
    $('c').setAttribute('data-value','2026-06-01');await w(0);
    if(picked('c')||ASCIIUI.calendar($('c')).value!=='')bad.push('a data-value set past data-max is picked: '+ASCIIUI.calendar($('c')).value);
    $('c').setAttribute('data-value','2026-04-02');await w(0);
    if(ASCIIUI.calendar($('c')).value!=='2026-04-02')bad.push('a data-value in range is not picked');
    return bad.length?bad.join(', '):true})()"""),
 ('1000 radio groups inserted in one go are named in linear time',
  '<main id="host"></main>',
  """(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),host=document.getElementById('host'),bad=[];
    const R=(n,v,c)=>'<label class="check"><input type="radio" name="'+n+'" value="'+v+'"'+(c?' checked':'')+'><span class="glyph" aria-hidden="true"></span>'+v+'</label>';
    const time=async html=>{const box=document.createElement('div');box.innerHTML=html;let t1=0;
      const mo=new MutationObserver(()=>{t1=performance.now()});mo.observe(host,{childList:true});
      const t0=performance.now();host.appendChild(box);await w(0);mo.disconnect();return [t1-t0,box]};
    let h='';for(let i=0;i<1000;i++)h+='<fieldset>'+R('plan','a',i%2)+R('plan','b',!(i%2))+R('plan','c')+'</fieldset>';
    const [t,box]=await time(h);
    const names=[...box.querySelectorAll('fieldset')].map(f=>f.querySelector('input').name);
    if(new Set(names).size!==1000)bad.push('1000 copies got '+new Set(names).size+' names');
    if([...box.querySelectorAll('fieldset')].some((f,i)=>!f.querySelectorAll('input')[i%2?0:1].checked))bad.push('a copy lost its checked radio');
    if(t>100)bad.push('1000 copies of one group took '+Math.round(t)+'ms');
    h='';for(let i=0;i<1000;i++)h+='<fieldset>'+R('g'+i,'a',1)+R('g'+i,'b')+R('g'+i,'c')+'</fieldset>';
    const [t2,box2]=await time(h);
    if([...box2.querySelectorAll('input')].some(x=>!/^g\\d+$/.test(x.name)))bad.push('1000 different groups were renamed');
    if(t2>100)bad.push('1000 different groups took '+Math.round(t2)+'ms');
    return bad.length?bad.join(', '):true})()"""),
 # 1.2.0
 ('an alert dialog waits for an answer; returnValue starts empty',
  '<div><button id="o" data-aui-open>Open</button><dialog role="alertdialog"><div class="alert lift"><div class="card frame tone-danger"><h2 class="bar-title">Delete?</h2><div class="body"><p>Gone for good.</p><div class="row"><button id="k" data-aui-close autofocus>Keep it</button><button id="x" class="btn-danger" data-aui-close="delete">Delete</button></div></div></div></div></dialog></div>',
  """(async()=>{const $=id=>document.getElementById(id),d=document.querySelector('dialog'),w=ms=>new Promise(r=>setTimeout(r,ms)),bad=[];
    $('o').click();if(!d.open||document.activeElement!==$('k'))bad.push('open, focus on '+document.activeElement.id);
    $('x').focus();d.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));d.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    if(!d.open)bad.push('a tap outside closed it');if(document.activeElement!==$('k'))bad.push('a tap outside left the focus on '+document.activeElement.id);
    $('x').click();if(d.open||d.returnValue!=='delete')bad.push('delete gave '+d.returnValue);
    $('o').click();if(d.returnValue!=='')bad.push('returnValue kept '+d.returnValue);
    d.dispatchEvent(new Event('cancel'));d.close();if(d.returnValue!=='')bad.push('Escape answered '+d.returnValue);
    if(document.getElementById(d.getAttribute('aria-labelledby')).textContent!=='Delete?')bad.push('not named by its title');
    return bad.length?bad.join(', '):true})()"""),
 ('a popover in a dialog: data-aui-close and Escape close the popover first',
  '<div><button id="o" data-aui-open>Open</button><dialog><div class="body"><div class="pop" id="p" data-aui="popover"><button id="pb" aria-haspopup="dialog">P</button><div class="pane" hidden><div class="body"><button id="in">In</button><button id="c" data-aui-close>Close</button></div></div></div></div></dialog></div>',
  """(async()=>{const $=id=>document.getElementById(id),d=document.querySelector('dialog'),bad=[],pane=$('p').querySelector('.pane'),o=x=>x.matches('[popover]')?x.matches(':popover-open'):!x.hidden;
    $('o').click();$('pb').click();if(!o(pane)||document.activeElement!==$('in'))bad.push('popover did not open with the focus in');
    $('c').click();if(o(pane)||!d.open)bad.push('data-aui-close closed '+(d.open?'':'the dialog'));
    if(document.activeElement!==$('pb'))bad.push('focus not back on the popover button');
    $('pb').click();$('in').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
    if(o(pane))bad.push('Escape left the popover open');
    return bad.length?bad.join(', '):true})()"""),
 ('combobox: filter, empty, pick, error, free text',
  '<form id="f"><div class="group"><label class="field-label">Region</label><div class="combo" id="c" data-aui="combobox" data-name="region" data-empty="None." data-error-list="Pick one."><div class="field frame tone-light"><div class="mid"><input id="i" role="combobox"></div></div><div class="pane" hidden><div class="opts" role="listbox"><div role="option" data-value="sfo">sfo-1, San Francisco</div><div role="option" data-value="fra">fra-1, Frankfurt</div><div role="option" data-value="gru">gru-1, S\u00e3o Paulo</div><div role="option" data-value="x" aria-disabled="true">x-1, Nowhere</div></div></div></div><p class="error"></p></div></form><button id="away">away</button>',
  """(async()=>{const $=id=>document.getElementById(id),i=$('i'),bad=[],type=v=>{i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}))},key=(k,o)=>i.dispatchEvent(new KeyboardEvent('keydown',Object.assign({key:k,bubbles:true,cancelable:true},o||{}))),act=()=>{const a=i.getAttribute('aria-activedescendant');return a?document.getElementById(a).textContent:null},shown=()=>[...document.querySelectorAll('[role=option]')].filter(o=>!o.hidden).map(o=>o.dataset.value).join();
    i.focus();type('fra');if(act()!=='fra-1, Frankfurt'||shown()!=='fra,sfo')bad.push('fra: '+act()+' / '+shown());
    type('sao');if(shown()!=='gru')bad.push('accents: '+shown());
    type('zzz');const none=document.querySelector('.opts-none');if(!none||none.hidden||none.textContent!=='None.')bad.push('no empty state');
    type('fra');key('Enter');if(new FormData($('f')).get('region')!=='fra'||i.value!=='fra-1, Frankfurt'||i.getAttribute('aria-expanded')!=='false')bad.push('Enter pick '+new FormData($('f')).get('region'));
    key('ArrowDown');const all=shown();if(all!=='sfo,fra,gru,x')bad.push('reopened list is not whole: '+all);key('Escape');
    ASCIIUI.combobox($('c')).set(null);type('atlantis');i.blur();$('away').focus();
    if(document.querySelector('.error').textContent!=='Pick one.'||i.getAttribute('aria-invalid')!=='true')bad.push('no error for words that are not an option');
    if(!i.labels.length||i.getAttribute('role')!=='combobox')bad.push('label or role');
    return bad.length?bad.join(', '):true})()"""),
]

# reduced motion: a spinner or skeleton taken off the page is let go, though
# the animation loop never runs to drop it. The garbage collector says so
REDUCED_RELEASE="""(()=>{const h=document.getElementById('host');
  h.innerHTML='<div><b data-aui="spinner"></b><pre class="skel" data-aui="skeleton"></pre></div>';
  window.__wr=[new WeakRef(h.querySelector('b')),new WeakRef(h.querySelector('pre'))]})()"""
async def reduced_release(b):
    fails=[];notes=set()
    path=blank_page('<main id="host"></main>')
    pg=await b.new_page(viewport={'width':1280,'height':900},reduced_motion='reduce')
    errs=[];watch(pg,errs,notes)
    try:
        await pg.goto('file://'+path); await pg.wait_for_timeout(200)
        await pg.evaluate(REDUCED_RELEASE); await pg.wait_for_timeout(100)
        if not await pg.evaluate("ASCIIUI.reduce&&!!document.querySelector('#host b').__aui"): fails.append('reduced release: the spinner was not wired under reduced motion')
        await pg.evaluate("document.getElementById('host').textContent=''"); await pg.wait_for_timeout(100)
        cdp=await pg.context.new_cdp_session(pg)
        for _ in range(3):
            await cdp.send('HeapProfiler.collectGarbage'); await pg.wait_for_timeout(50)
        left=await pg.evaluate("__wr.filter(r=>r.deref()).length")
        if left: fails.append('reduced motion: %d torn down spinner or skeleton still held by the clock'%left)
        fails+=['reduced release: '+e for e in errs]
    finally:
        await pg.close();os.remove(path)
    return fails,notes

async def edges(b):
    fails=[];notes=set()
    for e in EDGES:
        name,html,js=e[:3];warn=e[3] if len(e)>3 else None
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
            if warn:
                w=[x for x in warns if warn in x]
                if len(w)!=1: fails.append('edge: %s: expected one warning, got %d'%(name,len(w)))
            fails+=['edge: %s: %s'%(name,e) for e in errs]
        finally:
            await pg.close();os.remove(path)
    return fails,notes

def blank_page(body,head=''):
    page=('<!doctype html><html lang="en"><head><meta charset="utf-8">'
          '<link rel="stylesheet" href="file://'+os.path.join(KIT,'ascii-ui.css')+'">'
          '<script src="file://'+os.path.join(KIT,'ascii-ui.js')+'" defer></script>'+head+'</head><body>'+body+'</body></html>')
    fd,path=tempfile.mkstemp(suffix='.html',prefix='kit-page-');os.write(fd,page.encode('utf-8'));os.close(fd)
    return path

# the listeners on document and window that are still live: an add counts
# until its remove or its signal's abort
COUNT_LISTENERS="""(()=>{const L=[];
  for(const t of [document,window]){const add=t.addEventListener,rem=t.removeEventListener;
    const cap=o=>typeof o==='object'&&o?!!o.capture:!!o;
    t.addEventListener=function(type,fn,o){
      if(!L.some(e=>e.on&&e.t===t&&e.type===type&&e.fn===fn&&e.cap===cap(o))){
        const e={t,type,fn,cap:cap(o),on:true};L.push(e);
        if(o&&o.signal){if(o.signal.aborted)e.on=false;else o.signal.addEventListener('abort',()=>{e.on=false})}}
      return add.call(this,type,fn,o)};
    t.removeEventListener=function(type,fn,o){L.forEach(e=>{if(e.t===t&&e.type===type&&e.fn===fn&&e.cap===cap(o))e.on=false});return rem.call(this,type,fn,o)};
  }
  window.__live=()=>L.filter(e=>e.on).length;
})()"""
LIFE_HTML=('<div><div role="tablist" class="tablist" data-aui="tabs"><button role="tab" class="tab">A</button><button role="tab" class="tab">B</button></div><div role="tabpanel">a</div><div role="tabpanel">b</div></div>'
  '<div class="pop" data-aui="dropdown"><button aria-haspopup="menu">M</button><div role="menu" class="menu" hidden><button role="menuitem">X</button></div></div>'
  '<div class="pop" data-aui="tooltip"><button>T</button><span class="tip">tip</span></div>'
  '<div><nav data-aui="pagination" data-pages="9" data-page="3"></nav><p role="status"></p></div>'
  '<div><div class="cal" data-aui="calendar"></div><p role="status"></p></div>'
  '<form>'+FIELD('v','required')+'</form>'
  '<div class="otp" data-aui="otp"><span><input maxlength="1"></span></div>'
  '<div class="progress" role="progressbar" data-aui="progress"><span class="bar"></span></div>'
  '<b data-aui="spinner"></b><pre class="skel" data-aui="skeleton"></pre>').replace(' id="v"','')
LIFE_JS="""(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),host=document.getElementById('host'),bad=[];
  const base=__live();let one=null;
  for(let i=0;i<20;i++){const box=document.createElement('div');box.innerHTML=__HTML__;host.appendChild(box);await w(0);
    if(i===0){one=__live();ASCIIUI.init(box);ASCIIUI.init(box);if(__live()!==one)bad.push('init twice added listeners')}
    box.remove();await w(0)}
  if(!(one>base))bad.push('the test saw no listeners to count ('+base+' then '+one+')');
  if(__live()!==base)bad.push('20 mounts and unmounts left '+(__live()-base)+' listeners on document and window');
  /* taken off and put back: torn down, then wired again and moving */
  const box=document.createElement('div');box.innerHTML='<b data-aui="spinner"></b><pre class="skel" data-aui="skeleton"></pre>';
  host.appendChild(box);await w(50);box.remove();await w(50);
  const b=box.querySelector('b'),p=box.querySelector('pre');if(b.__aui||p.__aui)bad.push('a removed spinner was not torn down');
  host.appendChild(box);await w(50);
  const s1=b.textContent+'|'+p.textContent;await w(450);const s2=b.textContent+'|'+p.textContent;
  if(s1===s2)bad.push('a spinner and a skeleton put back did not move again');
  /* destroy by hand, then init again */
  ASCIIUI.destroy(box);const d1=b.textContent;await w(300);if(b.textContent!==d1)bad.push('destroy(el) left the spinner running');
  ASCIIUI.init(box);const d2=b.textContent;await w(300);if(b.textContent===d2)bad.push('init after destroy did not wire it again');
  return bad.length?bad.join(', '):true})()"""

async def lifecycle(b):
    fails=[];notes=set()
    path=blank_page('<main id="host"></main>')
    pg=await b.new_page(viewport={'width':1280,'height':900})
    errs=[];watch(pg,errs,notes)
    try:
        await pg.add_init_script(COUNT_LISTENERS)
        await pg.goto('file://'+path); await pg.wait_for_timeout(200)
        r=await pg.evaluate(LIFE_JS.replace('__HTML__',json.dumps(LIFE_HTML)))
        if r is not True: fails.append('lifecycle: '+r)
        # reduced motion followed live: on, the spinners stop; off, they move again
        await pg.evaluate("document.getElementById('host').innerHTML='<b data-aui=\"spinner\" data-kind=\"bounce\"></b>'"); await pg.wait_for_timeout(100)
        async def frames():
            seen=set()
            for _ in range(5):
                seen.add(await pg.evaluate("document.querySelector('#host b').textContent")); await pg.wait_for_timeout(130)
            return seen
        await pg.emulate_media(reduced_motion='reduce'); await pg.wait_for_timeout(150)
        r1=await pg.evaluate("ASCIIUI.reduce"); f1=await frames()
        if not r1 or len(f1)!=1: fails.append('reduced motion turned on while open: reduce=%s, spinner %s'%(r1,sorted(f1)))
        await pg.emulate_media(reduced_motion='no-preference'); await pg.wait_for_timeout(100)
        r2=await pg.evaluate("ASCIIUI.reduce"); f2=await frames()
        if r2 or len(f2)<2: fails.append('reduced motion turned off while open: reduce=%s, the spinner did not move again'%r2)
        fails+=['lifecycle: '+e for e in errs]
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
            r=await pg.evaluate("(()=>{const o=[...document.querySelectorAll('[data-aui-open]')],d=[...document.querySelectorAll('dialog')];if(o.length!==d.length||o.length%2)return 'expected a dialog for each button, in two copies';for(let i=o.length-1;i>=0;i--){o[i].click();const ok=d.every((x,j)=>x.open===(j===i));d[i].close();if(!ok)return 'button '+i+' did not open its own dialog'}return true})()")
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

# 1.2.0 polish: toasts, the OTP's wrong character, the calendar's month, the
# timing of validation, the select's frame, spinners and kbd for screen
# readers, the sheet's swipe, motion tokens, scanlines, the veil, and the
# page in print, forced colors and more contrast
POLISH_HTML=('<div><div class="otp" id="o" data-aui="otp"><span><input maxlength="1"></span><span><input maxlength="1"></span></div><p role="status" id="os"></p></div>'
  '<div><div class="cal" id="c" data-aui="calendar" data-value="2026-03-10"></div><p role="status"></p></div>'
  '<form id="f" action="javascript:void 0">'+FIELD('v','required pattern="[a-z]+" data-error-pattern="Lowercase only."')+'</form>'
  '<div class="group"><label class="field-label">Region</label><div class="field frame tone-light" id="sf"><div class="mid"><span class="prompt" aria-hidden="true">v</span><select id="sel"><option>a</option><option>b</option></select></div></div></div>'
  '<p><b id="sp1" data-aui="spinner"></b><b id="sp2" data-aui="spinner" aria-label="Loading"></b> <kbd id="k">/</kbd></p>'
  '<div class="tablist" role="tablist" data-aui="tabs"><button class="tab" role="tab" aria-selected="true">A</button><button class="tab" role="tab" aria-selected="false">B</button></div><div class="tabpanel" role="tabpanel">a</div><div class="tabpanel" role="tabpanel">b</div>'
  '<button class="btn btn-primary frame tone-heavy" id="pb" type="button"><span class="mid"><span class="label">Go</span></span></button>'
  '<div class="pop" data-aui="tooltip"><button type="button">Tip</button><span class="tip" role="tooltip">Hi</span></div>'
  '<div><button id="so" type="button" data-aui-open>Sheet</button><dialog class="sheet" id="sh"><div class="lift"><div class="card frame tone-heavy"><h2 class="bar-title">Filters</h2><button class="sheet-x" type="button" data-aui-close>[x]</button><div class="body" id="shb"><p>One</p><p>Two</p></div></div></div></dialog></div>')
POLISH_JS="""(async()=>{const $=id=>document.getElementById(id),w=ms=>new Promise(r=>setTimeout(r,ms)),bad=[],cs=(e,p)=>getComputedStyle(e,p);
  /* toast: the mark is paint, good news is a status and bad news an alert, [x] puts it away */
  ASCIIUI.toast('Saved.');await w(60);let t=document.querySelector('.toast');
  const mark=t&&t.querySelector('[aria-hidden=true]'),st=t&&t.querySelector('[role=status]'),al=t&&t.querySelector('[role=alert]'),x=t&&t.querySelector('.toast-x');
  if(!t||!t.classList.contains('on'))bad.push('toast did not show');
  else{
    if(!mark||mark.textContent.trim()!=='@@')bad.push('toast mark is not aria-hidden @@');
    if(!st||st.textContent.trim()!=='Saved.'||al.textContent)bad.push('good news is not in the status region: '+(st&&st.textContent));
    if(!x||x.getAttribute('aria-label')!=='Dismiss')bad.push('toast has no Dismiss button');
    if(t.getAttribute('role')||t.hasAttribute('aria-live'))bad.push('the toast line is a live region as a whole: the mark and [x] would be read');
    ASCIIUI.toast('It broke.',true);await w(60);
    if(al.textContent.trim()!=='It broke.'||st.textContent||mark.textContent.trim()!=='!!'||!t.classList.contains('err'))bad.push('an error is not an alert with !!: '+al.textContent);
    x.click();if(t.classList.contains('on'))bad.push('[x] did not put the toast away');
    if(cs(x).visibility!=='hidden')bad.push('[x] can still be tabbed to while the toast is away');
  }
  /* otp: a letter says Digits only. and marks the box, the next digit puts it right */
  const oi=$('o').querySelectorAll('input');oi[0].focus();
  oi[0].dispatchEvent(new InputEvent('beforeinput',{data:'a',inputType:'insertText',bubbles:true,cancelable:true}));
  if(!$('o').classList.contains('invalid')||$('os').textContent!=='Digits only.'||oi[0].getAttribute('aria-invalid')!=='true')bad.push('otp: a letter did not say Digits only.: '+$('os').textContent);
  if(!cs(oi[0].parentNode,'::before').content.includes('!'))bad.push('otp: the brackets of a wrong box are not !');
  oi[0].dispatchEvent(new InputEvent('beforeinput',{data:'4',inputType:'insertText',bubbles:true,cancelable:true}));
  if($('o').classList.contains('invalid')||oi[0].hasAttribute('aria-invalid')||$('os').textContent!=='1 of 2.')bad.push('otp: a digit did not put it right: '+$('os').textContent);
  /* calendar: a new month is said in a region that stays put */
  const lv=$('c').querySelector('[aria-live]');
  $('c').querySelector('[data-d="1"]').click();
  const lv2=$('c').querySelector('[aria-live]');
  if(!lv||lv!==lv2||!/April 2026/.test(lv2.textContent))bad.push('calendar: the month change was not said: '+(lv2&&lv2.textContent));
  $('c').querySelector('[data-day][tabindex="0"]').focus();
  $('c').querySelector('[data-day][tabindex="0"]').dispatchEvent(new KeyboardEvent('keydown',{key:'PageUp',bubbles:true,cancelable:true}));
  if(!/March 2026/.test(lv2.textContent)||!lv2.isConnected)bad.push('calendar: Page Up did not say the month: '+lv2.textContent);
  /* validation: typing says nothing before the field is left, then every key counts */
  const v=$('v'),ve=()=>document.getElementById(v.getAttribute('aria-describedby')).textContent,type=s=>{v.value=s;v.dispatchEvent(new Event('input',{bubbles:true}))};
  v.focus();type('X');
  if(ve()!==''||v.getAttribute('aria-invalid')==='true')bad.push('validate: an error before the field was left: '+ve());
  v.blur();
  if(ve()!=='Lowercase only.')bad.push('validate: leaving the field did not check: '+ve());
  v.focus();type('x');
  if(ve()!=='')bad.push('validate: a fix did not clear at once');
  type('xY');
  if(ve()!=='Lowercase only.')bad.push('validate: after the first blur a wrong key did not say so');
  /* select: a tap on the frame focuses it */
  const r=$('sf').getBoundingClientRect();
  $('sf').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+30,clientY:r.top+4}));
  if(document.activeElement!==$('sel'))bad.push('select: a tap on the frame did not focus it');
  /* spinner and kbd: paint is not read */
  if($('sp1').getAttribute('aria-hidden')!=='true')bad.push('spinner without a label is not aria-hidden');
  if($('sp2').getAttribute('role')!=='img'||$('sp2').hasAttribute('aria-hidden'))bad.push('spinner with a label is not an image of it');
  if(!/\\/\\s*""/.test(cs($('k'),'::before').content))bad.push('kbd brackets have alt text: '+cs($('k'),'::before').content);
  /* motion tokens drive the animations; slabs have no edge; scanlines only with .crt */
  const root=cs(document.documentElement);
  if(root.getPropertyValue('--aui-quick').trim()!=='.16s'||root.getPropertyValue('--aui-slow').trim()!=='.28s')bad.push('motion tokens missing');
  if(cs(document.querySelector('.tip')).transitionDuration!=='0.16s')bad.push('tooltip does not use --aui-quick: '+cs(document.querySelector('.tip')).transitionDuration);
  document.documentElement.style.setProperty('--aui-quick','0s');
  if(cs(document.querySelector('.tip')).transitionDuration!=='0s')bad.push('--aui-quick:0s does not switch the tooltip motion off');
  document.documentElement.style.removeProperty('--aui-quick');
  if(cs($('pb').querySelector('.label')).boxShadow!=='none')bad.push('the primary slab still has an edge');
  if(cs(document.querySelector('.tab[aria-selected=true]')).boxShadow!=='none')bad.push('the picked tab still has an edge');
  if(cs(document.body,'::before').content!=='none')bad.push('scanlines are on without .crt');
  document.documentElement.classList.add('crt');
  if(!cs(document.body,'::before').backgroundImage.includes('gradient'))bad.push('.crt does not bring the scanlines');
  document.documentElement.classList.remove('crt');
  /* the veil behind a dialog is periods on the grid */
  $('so').click();await w(30);
  if(!$('sh').open)bad.push('sheet did not open');
  else if(!cs($('sh'),'::before').content.includes('. . .'))bad.push('the veil is not characters');
  return bad.length?bad.join(', '):true})()"""
# the sheet goes down with a finger: a long drag closes it, a short one does not
SWIPE_JS="""(async()=>{const $=id=>document.getElementById(id),w=ms=>new Promise(r=>setTimeout(r,ms)),bad=[];
  const d=$('sh'),title=d.querySelector('.bar-title'),lift=d.querySelector('.lift');
  const touch=(type,el,x,y)=>{const t=new Touch({identifier:1,target:el,clientX:x,clientY:y});
    el.dispatchEvent(new TouchEvent(type,{touches:type==='touchend'?[]:[t],targetTouches:type==='touchend'?[]:[t],changedTouches:[t],bubbles:true,cancelable:true}))};
  const drag=async(dy)=>{const r=title.getBoundingClientRect(),x=r.left+4,y=r.top+4;touch('touchstart',title,x,y);
    for(let i=1;i<=6;i++){touch('touchmove',title,x,y+dy*i/6);await w(40)}
    const mid=lift.style.translate;touch('touchend',title,x,y+dy);return mid};
  $('so').click();await w(30);
  const m=await drag(30);
  if(!d.open)bad.push('a short drag closed the sheet');
  if(lift.style.translate)bad.push('a short drag left the sheet moved');
  const row=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--r'));
  if(m&&parseFloat(m.split(' ')[1])%row)bad.push('the sheet did not move in whole rows: '+m);
  const m2=await drag(Math.round(lift.getBoundingClientRect().height*0.6));
  if(!m2||!parseFloat(m2.split(' ')[1]))bad.push('the sheet did not follow the finger');
  await w(30);if(d.open)bad.push('a long drag did not close the sheet');
  if(lift.style.translate)bad.push('the sheet stayed moved after it closed');
  return bad.length?bad.join(', '):true})()"""
# print, forced colors and more contrast
MEDIA_JS="""(()=>{const bad=[],cs=(e,p)=>getComputedStyle(e,p),tab=document.querySelector('.tab[aria-selected=true]');
  const m=matchMedia('print').matches,f=matchMedia('(forced-colors: active)').matches,c=matchMedia('(prefers-contrast: more)').matches;
  if(m){if(cs(document.body).backgroundColor!=='rgb(255, 255, 255)')bad.push('print: the paper is not white');
    ASCIIUI.toast('x');if(cs(document.querySelector('.toast')).display!=='none')bad.push('print: the toast prints')}
  if(f){if(cs(tab).backgroundColor==='rgba(0, 0, 0, 0)')bad.push('forced colors: the picked tab lost its slab');
    if(cs(document.querySelector('.btn')).outlineStyle!=='none'&&cs(document.querySelector('.btn')).outlineWidth!=='0px')bad.push('forced colors: a box round every button')}
  if(c){if(cs(document.documentElement).getPropertyValue('--muted').trim()!=='#2b2b28')bad.push('more contrast: grey did not darken')}
  return bad.length?bad.join(', '):true})()"""

async def polish(b):
    fails=[];notes=set()
    path=blank_page(POLISH_HTML)
    try:
        pg=await b.new_page(viewport={'width':390,'height':844},color_scheme='light')
        errs=[];watch(pg,errs,notes)
        await pg.goto('file://'+path); await pg.wait_for_timeout(300)
        r=await pg.evaluate(POLISH_JS)
        if r is not True: fails.append('polish: '+r)
        # a toast of a few words goes after --aui-toast; a long one stays longer
        await pg.evaluate("ASCIIUI.toast('Saved.')"); await pg.wait_for_timeout(3800)
        if await pg.evaluate("document.querySelector('.toast').classList.contains('on')"): fails.append('polish: a short toast outstayed 3.6s')
        await pg.evaluate("ASCIIUI.toast('Report sent to 14 people. Three of them will open it, and one of them will reply by Friday.')"); await pg.wait_for_timeout(4200)
        if not await pg.evaluate("document.querySelector('.toast').classList.contains('on')"): fails.append('polish: a long toast went as fast as a short one')
        fails+=['polish: '+e for e in errs]
        await pg.close()
        pg=await b.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
        errs=[];watch(pg,errs,notes)
        await pg.goto('file://'+path); await pg.wait_for_timeout(300)
        r=await pg.evaluate(SWIPE_JS)
        if r is not True: fails.append('sheet swipe: '+r)
        fails+=['sheet swipe: '+e for e in errs]
        await pg.close()
        for name,opt in (('print',{'media':'print'}),('forced colors',{'forced_colors':'active'}),('more contrast',{'contrast':'more'})):
            pg=await b.new_page(viewport={'width':390,'height':844},color_scheme='light')
            errs=[];watch(pg,errs,notes)
            await pg.emulate_media(**opt)
            await pg.goto('file://'+path); await pg.wait_for_timeout(250)
            r=await pg.evaluate(MEDIA_JS)
            if r is not True: fails.append(name+': '+r)
            fails+=[name+': '+e for e in errs]
            await pg.close()
    finally:
        os.remove(path)
    return fails,notes

# README: the integrity attributes for the pinned files are the sha384 of
# the bytes /kit/VERSION/ serves: build.py copies kit/ as it is, and
# kit/releases/VERSION/ is what that version shipped as
def sri():
    import base64,hashlib
    fails=[]
    js=open(os.path.join(KIT,'ascii-ui.js'),encoding='utf-8').read()
    v=re.search(r"var VERSION='([^']+)'",js).group(1)
    readme=open(os.path.join(KIT,'README.md'),encoding='utf-8').read()
    for f in ('ascii-ui.css','ascii-ui.js'):
        src=os.path.join(KIT,'releases',v,f)
        if not os.path.exists(src): src=os.path.join(KIT,f)
        want='sha384-'+base64.b64encode(hashlib.sha384(open(src,'rb').read()).digest()).decode()
        m=re.search(r'/kit/'+re.escape(v)+'/'+re.escape(f)+r'"[^>]*integrity="([^"]+)"',readme)
        if not m: fails.append('README: no integrity attribute for /kit/%s/%s'%(v,f))
        elif m.group(1)!=want: fails.append('README: the integrity of /kit/%s/%s is %s, the file is %s'%(v,f,m.group(1),want))
        elif 'crossorigin="anonymous"' not in readme: fails.append('README: integrity without crossorigin="anonymous" fails on another site')
    return fails

async def main():
    fails=[];notes=set()
    s,i,j=embedded()
    if s[i:j]!=kit_block(): fails.append('js/40 KIT() is not the kit files: run python3 qa/kit.py sync')
    fails+=sri()
    fails+=pin_check(s)
    async with async_playwright() as p:
        b=await p.chromium.launch()
        f,n=await starter(b);fails+=f;notes|=n
        f,n=await edges(b);fails+=f;notes|=n
        f,n=await lifecycle(b);fails+=f;notes|=n
        f,n=await reduced_release(b);fails+=f;notes|=n
        f,n=await tokens(b);fails+=f;notes|=n
        f,n=await polish(b);fails+=f;notes|=n
        comps,blocks,stirred,lost,errs,n=await harvest(b);notes|=n
        fails+=['index.html: '+e for e in errs]
        fails+=['Code tab: %s changed after the demo was hovered and clicked'%s for s in stirred]
        if lost: fails.append('Code tab: labels that do not read as their data-text: %s'%lost)
        # what the kit does not style is named, and only where it is allowed
        K=kit_classes()
        for sid,html,js,css,note in comps+blocks:
            if html is None or sid in ('s-install','s-rules'): continue
            if note=='NOT ABOVE THE HTML': fails.append('%s: the Code tab note is not above the html'%sid)
            extra=sorted(classes_in(html)-K)
            is_comp=any(sid==c[0] for c in comps)
            if extra and is_comp and sid not in SITE_ONLY:
                fails.append('%s: the Code tab prints classes the kit does not style: %s'%(sid,', '.join(extra)))
            if extra and 'site-only: '+', '.join(extra)+'.' not in (note or ''):
                fails.append('%s: the Code tab does not name its site-only classes (%s)'%(sid,', '.join(extra)))
            if not extra and 'site-only' in (note or '')+(css or ''):
                fails.append('%s: the Code tab calls a kit class site-only'%sid)
            if sid in SITE_ONLY and not (note or '').startswith('Site only, not in the kit'):
                fails.append('%s: the Code tab does not say site only, not in the kit'%sid)
        C={c[0]:c for c in comps}
        if 'skeleton:function' not in (C.get('s-skeleton',[None,None,'',None,None])[2] or ''): fails.append('s-skeleton: the Code tab leaves out the behavior')
        for sid in ('s-calendar','s-pagination'):
            if '.ibtn{' not in (C.get(sid,[None]*5)[3] or ''): fails.append('%s: the Code tab leaves out the .ibtn css it draws'%sid)
        B={c[0]:c for c in blocks}
        if '.tbl' not in (B.get('s-table',[None]*5)[3] or ''): fails.append('s-table: the Code tab does not print the kit Table css')
        rows=[]
        for sid,html,js,css,note in comps:
            if sid in ('s-install','s-rules','s-foundations'): continue   # not components
            if html is None: rows.append((sid,'no Code tab','',''));fails.append(sid+': no Code tab');continue
            names,why=await paste(b,sid,html,notes)
            if 'site\'s' in (note or '') or 'this site' in (note or ''): kind='partly (site only part left out)'
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
