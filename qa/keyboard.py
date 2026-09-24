# The Android keyboard must never open by accident: a slider tapped on its
# label, tapped, or dragged keeps no focus, and a scroll that starts on a text
# field frame does not focus the field. A real tap on the frame still does.
# usage: python3 qa/keyboard.py [url]   (defaults to index.html)
import sys
from playwright.sync_api import sync_playwright
import os
url=sys.argv[1] if len(sys.argv)>1 else "file://"+os.path.abspath(os.path.join(os.path.dirname(__file__),"..","index.html"))
AE="()=>{const a=document.activeElement;return a?(a.tagName+'#'+a.id+':'+(a.type||'')):'none'}"
bad=lambda s:('INPUT' in s and (':range' in s or ':text' in s or ':search' in s or ':email' in s or ':password' in s)) or 'TEXTAREA' in s
with sync_playwright() as p:
    b=p.chromium.launch();fails=[];n=0
    for view in ['components','play','themes']:
        pg=b.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
        pg.goto(url+'#'+view);pg.wait_for_timeout(2500)
        cdp=pg.context.new_cdp_session(pg)
        ids=pg.evaluate("v=>[...document.querySelectorAll('#view-'+({components:'kit',onepager:'page'}[v]||v)+' input[type=range]')].map(i=>i.id)",view)
        for i in ids:
            for mode in ['label','tap','drag']:
                pg.evaluate("id=>{document.activeElement&&document.activeElement.blur();const e=document.getElementById(id);e.closest('.slider,div').scrollIntoView({block:'center'})}",i);pg.wait_for_timeout(250)
                if mode=='label':
                    r=pg.evaluate("id=>{const l=document.querySelector('label[for='+id+']');if(!l)return null;const b=l.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]}",i)
                    if not r: continue
                    pg.touchscreen.tap(*r)
                else:
                    r=pg.evaluate("id=>{const b=document.getElementById(id).getBoundingClientRect();return [b.x,b.y+b.height/2,b.width]}",i)
                    if mode=='tap': pg.touchscreen.tap(r[0]+r[2]*0.3,r[1])
                    else:
                        x,y=r[0]+r[2]*0.2,r[1]
                        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
                        for k in range(1,8):
                            cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+k*25,'y':y}]});pg.wait_for_timeout(30)
                        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
                pg.wait_for_timeout(300);a=pg.evaluate(AE);n+=1
                if bad(a): fails.append(f'{view} {i} {mode} -> {a}')
        # scroll that starts on a text field frame
        fr=pg.evaluate("v=>[...document.querySelectorAll('#view-'+({components:'kit'}[v]||v)+' .field')].filter(f=>f.querySelector('input[type=text],input:not([type]),textarea')).slice(0,4).map(f=>f.querySelector('input,textarea').id)",view)
        for fid in fr:
            pg.evaluate("id=>{document.activeElement&&document.activeElement.blur();document.getElementById(id).closest('.field').scrollIntoView({block:'center'})}",fid);pg.wait_for_timeout(250)
            r=pg.evaluate("id=>{const b=document.getElementById(id).closest('.field').getBoundingClientRect();return [b.x+6,b.y+4]}",fid)
            x,y=r
            cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
            for k in range(1,8):
                cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y-k*30}]});pg.wait_for_timeout(20)
            cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});pg.wait_for_timeout(300)
            a=pg.evaluate(AE);n+=1
            if bad(a): fails.append(f'{view} scroll-from-frame {fid} -> {a}')
            # a real tap on the frame still focuses (intended)
            pg.evaluate("id=>{document.activeElement&&document.activeElement.blur();document.getElementById(id).closest('.field').scrollIntoView({block:'center'})}",fid);pg.wait_for_timeout(250)
            x,y=pg.evaluate("id=>{const b=document.getElementById(id).closest('.field').getBoundingClientRect();return [b.x+6,b.y+4]}",fid)
            pg.touchscreen.tap(x,y);pg.wait_for_timeout(300);t=pg.evaluate(AE)
            if fid not in t: fails.append(f'{view} tap-frame {fid} did not focus ({t})')
        pg.close()
    print('checks',n,'fails',fails);b.close()
