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
3. index.html: the Code tab html of every component, pasted into a blank page
   with only the two kit files: no errors, it has size, button labels sit on one
   row, and the behaviors it names come alive
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
    # tabs
    await pg.focus('#t-one'); await pg.keyboard.press('ArrowRight')
    ok('tabs: arrow moves',await ev("document.getElementById('t-two').getAttribute('aria-selected')==='true'&&!document.getElementById('p-two').hidden&&document.getElementById('p-one').hidden"))
    await pg.click('#t-three')
    ok('tabs: click picks',await ev("!document.getElementById('p-three').hidden"))
    # dialog
    await pg.click('#publishBtn')
    ok('dialog opens',await ev("document.getElementById('publishDialog').open"))
    await pg.keyboard.press('Escape')
    ok('dialog: Escape closes',not await ev("document.getElementById('publishDialog').open"))
    await pg.click('#publishBtn'); await pg.click('#dlgConfirm'); await pg.wait_for_timeout(120)
    ok('dialog: confirm closes and toasts',await ev("!document.getElementById('publishDialog').open&&document.querySelector('.toast.on span').textContent.includes('Published')"))
    ok('dialog: focus goes back',await ev("document.activeElement&&document.activeElement.id==='publishBtn'"))
    # sheet, closes from the page above it
    await pg.click('#sheetBtn')
    ok('sheet opens',await ev("document.getElementById('sheetDlg').open"))
    await pg.mouse.click(195,20); await pg.wait_for_timeout(100)
    ok('sheet: page above closes it',not await ev("document.getElementById('sheetDlg').open"))
    # dropdown by keyboard
    await pg.focus('#ddBtn'); await pg.keyboard.press('ArrowDown')
    ok('dropdown: ArrowDown opens',await ev("!document.getElementById('ddMenu').hidden&&document.activeElement.getAttribute('role')==='menuitem'"))
    await pg.keyboard.press('ArrowDown')
    ok('dropdown: arrows move',await ev("document.activeElement.textContent.startsWith('Copy link')"))
    await pg.keyboard.press('Escape')
    ok('dropdown: Escape closes, focus back',await ev("document.getElementById('ddMenu').hidden&&document.activeElement.id==='ddBtn'"))
    await pg.keyboard.press('Enter')
    ok('dropdown: Enter opens',await ev("!document.getElementById('ddMenu').hidden"))
    await pg.keyboard.press('Enter'); await pg.wait_for_timeout(100)
    ok('dropdown: Enter picks and closes',await ev("document.getElementById('ddMenu').hidden&&document.querySelector('.toast.on span').textContent.includes('Duplicated')"))
    # tooltip: tap shows, Escape hides
    await pg.click('#tt button')
    ok('tooltip: tap shows',await ev("document.getElementById('tt').classList.contains('on')"))
    await pg.keyboard.press('Escape')
    ok('tooltip: Escape hides',await ev("document.getElementById('tt').classList.contains('off')"))
    # toast
    await pg.click('#toastErr'); await pg.wait_for_timeout(100)
    ok('toast: error is yellow',await ev("document.querySelector('.toast').classList.contains('err')&&document.querySelector('.toast.on span').textContent.includes('broke')"))
    # slider
    b0=await ev("document.querySelector('.slider .bar').textContent")
    ok('slider: bar drawn',len(b0)==24,b0)
    await pg.focus('#vol'); await pg.keyboard.press('End')
    ok('slider: updates',await ev("document.querySelector('.slider output').textContent==='100'&&document.querySelector('.slider .bar').textContent==='@'.repeat(24)"))
    # progress
    await pg.click('#exportBtn'); await pg.wait_for_timeout(700)
    mid=await ev("+document.getElementById('bar').getAttribute('aria-valuenow')")
    ok('progress: moves',0<mid<=100,mid)
    await pg.wait_for_timeout(4200)
    ok('progress: finishes',await ev("document.getElementById('bar').getAttribute('aria-valuenow')==='100'&&document.getElementById('exportStatus').textContent.includes('Exported')&&document.querySelector('#bar .pct').textContent.trim()==='100%'"))
    # otp
    await pg.click('#otp input'); await pg.keyboard.type('12')
    ok('otp: advances',await ev("document.activeElement===document.querySelectorAll('#otp input')[2]"))
    await pg.keyboard.press('Backspace')
    ok('otp: Backspace goes back',await ev("document.activeElement===document.querySelectorAll('#otp input')[1]"))
    await pg.keyboard.type('23456')
    ok('otp: six digits accepted',await ev("document.getElementById('otp').classList.contains('good')&&document.getElementById('otpStatus').textContent.includes('accepted')"))
    # calendar
    n=await ev("document.querySelectorAll('#cal [data-day]').length")
    ok('calendar: a month of days',28<=n<=31,n)
    m0=await ev("document.querySelector('#cal .cal-head span').textContent")
    await pg.click('#cal [data-d=\"1\"]')
    ok('calendar: next month',await ev("document.querySelector('#cal .cal-head span').textContent")!=m0)
    await pg.focus('#cal [data-day][tabindex=\"0\"]'); await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('Enter')
    ok('calendar: pick says so',await ev("document.getElementById('calStatus').textContent.length>8"))
    # pagination
    await pg.click('#pager [aria-label=\"Next page\"]')
    ok('pagination: next',await ev("document.getElementById('pagerStatus').textContent==='Page 4 of 9.'"))
    # validation
    ok('validate: bad value is invalid on load',await ev("document.getElementById('slug').closest('.field').classList.contains('invalid')&&document.getElementById('slugError').textContent.length>0"))
    await pg.fill('#slug','reporting-redesign')
    ok('validate: good value clears',await ev("!document.getElementById('slug').closest('.field').classList.contains('invalid')&&document.getElementById('slugError').textContent===''"))
    await pg.fill('#slug','')
    ok('validate: empty says required',await ev("document.getElementById('slugError').textContent.startsWith('Enter')"))
    # counter
    await pg.fill('#ta','hello')
    ok('counter',await ev("document.getElementById('taCount').textContent==='5/280'"))
    # spinner and skeleton (they only move while on screen)
    await ev("document.querySelector('.spins').scrollIntoView()")
    s1=await ev("[...document.querySelectorAll('[data-aui=spinner]')].map(b=>b.textContent).join('|')")
    await pg.wait_for_timeout(400)
    s2=await ev("[...document.querySelectorAll('[data-aui=spinner]')].map(b=>b.textContent).join('|')")
    ok('spinner: moves',s1!=s2 and all(s1.split('|')),[s1,s2])
    ok('skeleton: drawn',await ev("document.querySelector('.skel').textContent.trim().length>20"))
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
    s1=await ev_on(pg,"[...document.querySelectorAll('[data-aui=spinner]')].map(b=>b.textContent).join('|')")
    await pg.wait_for_timeout(400)
    s2=await ev_on(pg,"[...document.querySelectorAll('[data-aui=spinner]')].map(b=>b.textContent).join('|')")
    if s1!=s2 or not all(s1.split('|')): fails.append('starter: reduced motion leaves spinners still (%s / %s)'%(s1,s2))
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
 'counter':"document.getElementById(el.dataset.status).textContent.includes('/')",
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

async def paste(b,sid,html,notes):
    page=('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
          '<link rel="stylesheet" href="file://'+os.path.join(KIT,'ascii-ui.css')+'">'
          '<script src="file://'+os.path.join(KIT,'ascii-ui.js')+'" defer></script></head><body>\n'+html+'\n</body></html>')
    fd,path=tempfile.mkstemp(suffix='.html',prefix='kit-'+sid+'-');os.write(fd,page.encode('utf-8'));os.close(fd)
    pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[];watch(pg,errs,notes)
    try:
        await pg.goto('file://'+path); await pg.wait_for_timeout(350)
        why=list(errs)
        size=await pg.evaluate("(()=>{let w=0,h=0;[...document.body.children].forEach(e=>{const r=e.getBoundingClientRect();w=Math.max(w,r.width);h+=r.height});return [w,h]})()")
        if not(size[0]>0 and size[1]>0): why.append('renders at %dx%d'%tuple(size))
        bad=await pg.evaluate(ONE_ROW)
        if bad: why.append('button labels over more than one row: %s'%bad)
        names=await pg.evaluate("[...new Set([...document.querySelectorAll('[data-aui]')].map(e=>e.dataset.aui))]")
        attrs=await pg.evaluate("['open','close','toast','toast-err','reset','fill'].filter(a=>document.querySelector('[data-aui-'+a+']')).map(a=>'aui-'+a)")
        for n in names:
            if n not in ALIVE: why.append('unknown behavior '+n);continue
            alive=await pg.evaluate("[...document.querySelectorAll('[data-aui=\"%s\"]')].every(el=>%s)"%(n,ALIVE[n]))
            if not alive: why.append(n+' did not come alive')
        if await pg.evaluate("!!document.querySelector('[data-aui-open]')"):
            await pg.evaluate("document.querySelector('[data-aui-open]').click()")
            if not await pg.evaluate("!!document.querySelector('dialog[open]')"): why.append('dialog did not open')
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
    print('%d of %d components work pasted into a blank page with the two kit files'%(works,len(rows)))
    if works<12: fails.append('fewer than 12 components pasted clean')
    for n in sorted(notes): print('note: '+n)
    if fails:
        for f in fails: print('FAIL '+f)
        sys.exit(1)
    print('kit: ok')

if __name__=='__main__':
    if len(sys.argv)>1 and sys.argv[1]=='sync': sync()
    else: asyncio.run(main())
