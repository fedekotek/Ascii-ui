/* ascii/ui kit 1.1.0, ascii-ui.js
   The behaviors for the components that need a script, wired by data
   attributes. No dependencies. Link it after ascii-ui.css:

     <script src="ascii-ui.js" defer></script>

   Then any element with data-aui="NAME" gets that behavior, including
   elements added later. The names: tabs, slider, progress, dropdown, tooltip,
   otp, calendar, pagination, validate, counter, spinner, skeleton.
   Buttons take these instead:
     data-aui-open              opens the nearest <dialog> (a card or a .sheet)
     data-aui-close             closes the dialog it sits in
     data-aui-toast="Saved."    shows a toast (data-aui-toast-err for a yellow one)
     data-aui-reset             puts the fields of its form or dialog back to how the html has them
     data-aui-fill              runs the nearest progress bar from 0 to 100, for demos
   The nearest role="status" says what happened (the code, the page, the date).

   No ids needed. Each component finds its parts inside the element around it,
   so the same component pasted twice keeps two separate copies. The ids that
   aria needs (a label's for, a tab's aria-controls) are made here, unique.
   A part belongs to a component when no other component stands between them;
   a component without its own part finds nothing and borrows nothing.
   To point at something far away instead, give it an id and name it:
   data-aui-open="id", data-aui-fill="id", data-status="id". A dialog can
   also be named with data-aui-dialog="name" and opened by data-aui-open="name".
   Radios pasted twice outside a form, or twice in one form, get a name per
   copy, so each copy stays its own group. Radios in different forms are
   already separate groups and keep their names.

   Lifecycle: a component is wired once (init is safe to call again), and its
   listeners go with it. Take it off the page and it is torn down; put it back
   and it is wired again. Change data-aui, data-page, data-value and the other
   settings on a live element and it follows. ASCIIUI.destroy(el) tears one
   down by hand, with everything inside it.

   Everything that moves runs on requestAnimationFrame and stops when the
   element leaves the page. prefers-reduced-motion leaves every frame still,
   and a change to that setting is followed while the page is open.

   window.ASCIIUI: version, init(root), destroy(root), get(el), validate(form),
   toast(msg, err), progress(el, pct), tabs(el), pagination(el), calendar(el),
   dropdown(el), otp(el), bar(k, n), colorize(str), tones(map), reduce,
   behaviors. The README has the events and the calls for each component.

   MIT license. Copyright (c) 2026 Fede Kotek. The full text is in README.md. */
(function(){
'use strict';
if(window.ASCIIUI)return;   /* linked twice: keep the first */
var VERSION='1.1.0';
var doc=document;

/* ---- reduced motion, followed live ---- */
var mq=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):null;
var reduce=!!(mq&&mq.matches);
function onReduce(){
  reduce=!!mq.matches;
  if(!reduce&&tasks.length&&!raf)raf=requestAnimationFrame(tick);
}
if(mq){if(mq.addEventListener)mq.addEventListener('change',onReduce);else if(mq.addListener)mq.addListener(onReduce)}

/* ---- helpers ---- */
function all(sel,root){return Array.prototype.slice.call((root||doc).querySelectorAll(sel))}
function rep(c,n){var s='';while(n-->0)s+=c;return s}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function byId(id){return id?doc.getElementById(String(id).replace(/^#/,'')):null}
/* What el talks to: the id its attr names, or else its own part, sel, in the
   smallest box around el that holds one. A part is el's own when no other
   component stands between them in the page: a status line, a count, an
   error or a dialog comes after its component (both: a progress bar may also
   come before its button). So a component without a part of its own finds
   nothing, it never borrows the next one's. */
var HOST='[data-aui],[data-aui-open],[data-aui-fill]';
function after(a,b){return !!(a.compareDocumentPosition(b)&4)}   /* b comes after a */
function near(el,attr,sel,both){
  var id=attr&&el.getAttribute(attr),p,hs,fol,pre;
  if(id&&byId(id))return byId(id);
  for(p=el.parentElement;p&&p!==doc.documentElement;p=p.parentElement){
    hs=all(HOST,p).filter(function(h){return h!==el&&!h.contains(el)&&!el.contains(h)});
    fol=[];pre=[];
    all(sel,p).forEach(function(x){
      if(x===el||el.contains(x)||x.contains(el))return;
      var next=after(el,x);if(!next&&!both)return;
      var lo=next?el:x,hi=next?x:el;
      if(hs.some(function(h){return h!==x&&!x.contains(h)&&after(lo,h)&&after(h,hi)}))return;
      (next?fol:pre).push(x);
    });
    if(fol.length)return fol[0];
    if(pre.length)return pre[pre.length-1];
  }
  return null;
}
/* an id for aria, when the element has none: aui-tab-1, aui-tab-2 ... */
var uidN=0;
function uid(el,pre){
  if(!el.id){var id;do{id='aui-'+pre+'-'+(++uidN)}while(byId(id));el.id=id}
  return el.id;
}
function status(el){return near(el,'data-status','[role="status"]')}
/* the dialog a data-aui-open button opens: the one its value names, by id or
   by data-aui-dialog, else its own. Nothing found is said once, not thrown */
function dialogOf(t){
  var v=t.getAttribute('data-aui-open'),d=null;
  if(v)d=byId(v)||all('dialog[data-aui-dialog]').filter(function(x){return x.getAttribute('data-aui-dialog')===v})[0]||null;
  if(!d)d=near(t,null,'dialog');
  if(!d&&!t.__auiWarned){t.__auiWarned=true;console.warn('ascii-ui: data-aui-open'+(v?'="'+v+'"':'')+' found no dialog. Put the button and its <dialog> in one element, or name it: data-aui-open="name" with id="name" or data-aui-dialog="name" on the dialog.')}
  return d;
}
function say(el,text){var s=status(el);if(s)s.textContent=text}
function emit(el,name,detail){el.dispatchEvent(new CustomEvent('aui:'+name,{bubbles:true,detail:detail}))}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
/* a hidden input that carries a component's value into its form */
function hiddenIn(box,name){
  var h=null;
  Array.prototype.forEach.call(box.children,function(c){if(!h&&c.localName==='input'&&c.type==='hidden')h=c});
  if(!name)return h;
  if(!h){h=doc.createElement('input');h.type='hidden';box.appendChild(h)}
  h.name=name;return h;
}

/* ---- one instance per wired element. Its listeners share one
   AbortController, so tearing it down takes them all ---- */
function Ctx(el,name){this.el=el;this.name=name;this.ac=new AbortController();this.offs=[];this.api={};this.dead=false}
Ctx.prototype.on=function(t,type,fn,capture){t.addEventListener(type,fn,{capture:!!capture,signal:this.ac.signal})};
Ctx.prototype.later=function(fn){this.offs.push(fn)};
Ctx.prototype.end=function(){
  this.dead=true;this.ac.abort();
  this.offs.forEach(function(f){try{f()}catch(e){}});this.offs=[];
};

/* ---- the ramp: every fill is an index into it, lightest to heaviest ---- */
var MAP={};
function tr(str){var o='',i,c;for(i=0;i<str.length;i++){c=str.charAt(i);o+=MAP[c]||c}return o}

/* ---- tones: the border strings. ascii-ui.css ships them for the default
   characters; this rebuilds them for others, e.g. ASCIIUI.tones({"@":"#"}),
   and bars and spinners follow the same map. A frame is 400 characters wide
   and a wall 200 rows tall, the same as the css ships. ---- */
var COLS=400,ROWS=200;
function tones(map){
  MAP=map||{};
  var m=function(c){return MAP[c]||c};
  var T={heavy:[m('@'),m('@')+m('@')],dense:[m('%'),m('%')+m('%')],mid:[m('#'),m('#')+m('#')],light:[m('='),m(':')+m(':')],
         shade:[m(':'),m(':')+m(':')],faint:['- ',': '],danger:['/','//'],error:['!','!!']};
  var q=function(s){return s.replace(/\\/g,'\\\\').replace(/"/g,'\\"')};
  var css=':root{--k8:"'+q(m('@'))+'";--k6:"'+q(m('#'))+'";--k1:"'+q(m('.'))+'";',k,i,H,V;
  for(k in T){
    H='';V='';
    while(H.length<COLS)H+=T[k][0];
    for(i=0;i<ROWS;i++)V+=q(T[k][1])+'\\A ';
    css+='--h-'+k+':"'+q(H)+'";--s-'+k+':"'+q(T[k][1])+'";--v-'+k+':"'+V+'";';
  }
  css+='}';
  var st=byId('ascii-ui-tones');
  if(!st){st=doc.createElement('style');st.id='ascii-ui-tones';doc.head.appendChild(st)}
  st.textContent=css;
  all('[data-aui]').forEach(function(el){var a=el.__aui&&el.__aui.api;if(a&&a.draw)a.draw()});
}

/* ---- the halftone bar: n cells, k of them full, a soft edge between ---- */
var TAIL='%#*+=:';
function bar(k,n){
  n=n||24;k=clamp(Math.round(k),0,n);
  if(k<=0)return rep('.',n);
  if(k>=n)return rep('@',n);
  return (rep('@',n)+TAIL).slice(-k)+rep('.',n-k);
}
var HUE={'@':'hot','%':'hot','#':'pink','*':'pink','+':'warn','=':'warn',':':'ink','.':'muted'};
function colorize(txt){
  var out='',cur='',run='',i,c,k;
  function flush(){if(run)out+='<span style="color:var(--'+cur+')">'+esc(run)+'</span>';run=''}
  for(i=0;i<txt.length;i++){
    c=txt.charAt(i);k=HUE[c]||'ink';
    if(k!==cur){flush();cur=k}
    run+=tr(c);
  }
  flush();return out;
}

/* ---- one clock for everything that moves. A task runs every ms while its
   element is on the page; it is dropped when the element goes or its
   component is torn down. Under reduced motion it draws once and stays. ---- */
var tasks=[],raf=0;
function every(ms,fn,cx){
  fn();
  tasks.push({ms:ms,fn:fn,cx:cx,el:cx.el,at:0});
  if(!raf&&!reduce)raf=requestAnimationFrame(tick);
}
function tick(now){
  raf=0;
  tasks=tasks.filter(function(t){return !t.cx.dead&&t.el.isConnected});
  if(!tasks.length||reduce)return;
  if(!doc.hidden)tasks.forEach(function(t){
    if(now-t.at<t.ms)return;t.at=now;
    var r=t.el.getBoundingClientRect();
    if(r.bottom>0&&r.top<innerHeight&&r.width)try{t.fn()}catch(e){t.el.isConnected&&console.error(e)}
  });
  raf=requestAnimationFrame(tick);
}

/* ---- toast. While a modal dialog is open the page behind it is inert, so
   the toast goes inside that dialog: on top, and read out ---- */
var toastEl=null,toastTimer=0;
function modal(){
  var open=all('dialog[open]').filter(function(d){try{return d.matches(':modal')}catch(e){return true}});
  return open[open.length-1]||null;
}
function toast(msg,err){
  if(!toastEl){
    toastEl=doc.createElement('div');toastEl.className='toast';
    toastEl.setAttribute('role','status');toastEl.setAttribute('aria-live','polite');
    toastEl.innerHTML='<span></span>';
  }
  var host=modal()||doc.body;
  if(toastEl.parentNode!==host)host.appendChild(toastEl);
  clearTimeout(toastTimer);
  var span=toastEl.firstChild;
  toastEl.classList.toggle('err',!!err);
  /* a beat after the region exists, so a screen reader hears the change */
  setTimeout(function(){span.textContent=(err?'!! ':'@@ ')+msg;toastEl.classList.add('on')},20);
  toastTimer=setTimeout(function(){toastEl.classList.remove('on')},3600);
}

/* ---- progress: draws from aria-valuenow, so setting the attribute is enough ---- */
function setProgress(el,p){el.setAttribute('aria-valuenow',clamp(Math.round(p),0,100))}

/* ---- dates for the calendar: ISO yyyy-mm-dd, local time ---- */
function iso(d){return d?d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2):''}
function day(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function parseDate(v){
  if(!v)return null;
  if(v instanceof Date)return isNaN(v)?null:day(v);
  var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v).trim());
  if(!m)return null;
  var d=new Date(+m[1],+m[2]-1,+m[3]);
  return d.getMonth()===+m[2]-1?d:null;
}

/* set while a reset puts fields back, so the fields do not call the empty
   ones errors and the code boxes do not move the focus */
var resetting=false;
/* the first field a failed submit found, focused once the browser is done */
var toFocus=null;
function focusLater(el){if(toFocus)return;toFocus=el;setTimeout(function(){var f=toFocus;toFocus=null;if(f&&f.isConnected)f.focus()},0)}

var behaviors={
  /* role="tablist" with role="tab" buttons, and the role="tabpanel" elements
     next to it, in the same order. aria-controls, when set, wins.
     Fires aui:change on a pick by click or key, not on load or select() */
  tabs:function(list,cx){
    var tabs=all('[role="tab"]',list);if(!tabs.length)return;
    var box=list.parentElement,panels=box?Array.prototype.filter.call(box.children,function(c){return c.getAttribute('role')==='tabpanel'}):[],cur=null;
    tabs.forEach(function(t,i){
      var p=byId(t.getAttribute('aria-controls'))||panels[i];if(!p)return;
      t.setAttribute('aria-controls',uid(p,'panel'));
      if(!p.hasAttribute('aria-labelledby'))p.setAttribute('aria-labelledby',uid(t,'tab'));
    });
    function apply(tab,focus,user){
      var was=cur;cur=tab;
      tabs.forEach(function(x){
        var on=x===tab,p=byId(x.getAttribute('aria-controls'));
        x.setAttribute('aria-selected',on?'true':'false');x.tabIndex=on?0:-1;
        if(p)p.hidden=!on;
      });
      if(focus)tab.focus();
      if(user&&was!==tab)emit(list,'change',{tab:tab,index:tabs.indexOf(tab)});
    }
    apply(tabs.filter(function(t){return t.getAttribute('aria-selected')==='true'})[0]||tabs[0]);
    tabs.forEach(function(tab,i){
      cx.on(tab,'click',function(){apply(tab,false,true)});
      cx.on(tab,'keydown',function(e){
        var n=e.key==='ArrowRight'?tabs[(i+1)%tabs.length]:e.key==='ArrowLeft'?tabs[(i-1+tabs.length)%tabs.length]:
              e.key==='Home'?tabs[0]:e.key==='End'?tabs[tabs.length-1]:null;
        if(n){e.preventDefault();apply(n,true,true)}
      });
    });
    return {
      select:function(i){var t=typeof i==='number'?tabs[i]:i;if(t&&tabs.indexOf(t)>=0)apply(t)},
      get index(){return tabs.indexOf(cur)},
      get tab(){return cur}
    };
  },

  /* .slider holding a .slider-track (.bar + input[type=range]) and an optional <output> */
  slider:function(el,cx){
    var input=el.querySelector('input[type="range"]'),b=el.querySelector('.bar'),out=el.querySelector('output');
    if(!input||!b)return;
    var n=+el.getAttribute('data-cells')||24;
    if(out&&!out.hasAttribute('for'))out.setAttribute('for',uid(input,'range'));
    function draw(){
      var min=+input.min||0,max=input.max===''?100:+input.max,fr=(input.value-min)/((max-min)||1);
      b.innerHTML=colorize(bar(fr*n,n));
      if(out)out.textContent=input.value;
    }
    cx.on(input,'input',draw);cx.on(input,'change',draw);draw();
    return {draw:draw};
  },

  /* role="progressbar" with a .bar and an optional .pct */
  progress:function(el,cx){
    var b=el.querySelector('.bar'),pct=el.querySelector('.pct'),n=+el.getAttribute('data-cells')||24;
    if(!b)return;
    if(!el.hasAttribute('aria-valuenow'))el.setAttribute('aria-valuenow','0');
    function draw(){
      var p=clamp(+el.getAttribute('aria-valuenow')||0,0,100),s=p+'%';
      b.innerHTML=colorize(bar(p/100*n,n));
      if(pct)pct.textContent=rep(' ',4-s.length)+s;
    }
    var mo=new MutationObserver(draw);
    mo.observe(el,{attributes:true,attributeFilter:['aria-valuenow']});
    cx.later(function(){mo.disconnect()});
    draw();
    return {draw:draw,set:function(p){setProgress(el,p)},get value(){return +el.getAttribute('aria-valuenow')||0}};
  },

  /* .pop holding a button[aria-haspopup] and a [role=menu] of [role=menuitem].
     Fires aui:select with the item picked */
  dropdown:function(pop,cx){
    var btn=pop.querySelector('[aria-haspopup]'),menu=pop.querySelector('[role="menu"]');
    if(!btn||!menu)return;
    btn.setAttribute('aria-controls',uid(menu,'menu'));
    var items=function(){return all('[role="menuitem"]:not([disabled])',menu)};
    function open(on,at){
      menu.hidden=!on;menu.classList.toggle('open',on);btn.setAttribute('aria-expanded',on?'true':'false');
      if(on&&at){var it=items();if(it.length)it[at==='last'?it.length-1:0].focus()}
    }
    if(!btn.hasAttribute('aria-expanded'))btn.setAttribute('aria-expanded',menu.hidden?'false':'true');
    cx.on(btn,'click',function(){open(menu.hidden,'first')});
    cx.on(btn,'keydown',function(e){
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();open(true,e.key==='ArrowUp'?'last':'first')}
    });
    cx.on(menu,'keydown',function(e){
      var it=items(),i=it.indexOf(doc.activeElement),n=null;
      if(e.key==='ArrowDown')n=it[(i+1)%it.length];
      else if(e.key==='ArrowUp')n=it[(i-1+it.length)%it.length];
      else if(e.key==='Home')n=it[0];
      else if(e.key==='End')n=it[it.length-1];
      else if(e.key==='Escape'){e.preventDefault();open(false);btn.focus();return}
      else if(e.key==='Tab'){open(false);return}
      if(n){e.preventDefault();n.focus()}
    });
    cx.on(menu,'click',function(e){
      var it=e.target.closest('[role="menuitem"]');if(!it)return;
      open(false);btn.focus();emit(pop,'select',{item:it,text:it.textContent.trim()});
    });
    cx.on(doc,'pointerdown',function(e){if(!menu.hidden&&!pop.contains(e.target))open(false)});
    cx.on(pop,'focusout',function(e){if(!menu.hidden&&e.relatedTarget&&!pop.contains(e.relatedTarget))open(false)});
    return {open:function(){open(true)},close:function(){open(false)},toggle:function(){open(menu.hidden)},get isOpen(){return !menu.hidden}};
  },

  /* .pop holding a trigger and a .tip. Hover and focus are css; this adds the
     tap and lets Escape put it away without moving focus */
  tooltip:function(pop,cx){
    var tip=pop.querySelector('.tip'),t=0;if(!tip)return;
    var trig=pop.querySelector('button,a,input,[tabindex]');
    if(trig&&!trig.hasAttribute('aria-describedby'))trig.setAttribute('aria-describedby',uid(tip,'tip'));
    cx.later(function(){clearTimeout(t)});
    function show(){pop.classList.remove('off');pop.classList.add('on');clearTimeout(t);t=setTimeout(function(){pop.classList.remove('on')},1800)}
    function hide(){pop.classList.add('off');pop.classList.remove('on')}
    cx.on(pop,'click',show);
    cx.on(doc,'keydown',function(e){if(e.key==='Escape')hide()});
    cx.on(pop,'pointerenter',function(){pop.classList.remove('off')});
    cx.on(pop,'focusin',function(){pop.classList.remove('off')});
    return {show:show,hide:hide};
  },

  /* .otp holding one <input maxlength="1"> per digit. data-name="code" adds a
     hidden input with the whole code, for the form. Fires aui:complete */
  otp:function(box,cx){
    var ins=all('input:not([type="hidden"])',box),n=ins.length;if(!n)return;
    var hid=hiddenIn(box,box.getAttribute('data-name'));
    /* the phone offers the code from the message on the first box */
    var ac=ins[0].getAttribute('autocomplete');
    if(!ac||ac==='off')ins[0].setAttribute('autocomplete','one-time-code');
    ins.forEach(function(i){if(!i.hasAttribute('inputmode'))i.setAttribute('inputmode','numeric')});
    function val(){return ins.map(function(i){return i.value}).join('')}
    function check(){
      var v=val(),ok=new RegExp('^\\d{'+n+'}$').test(v);
      if(hid)hid.value=v;
      box.classList.toggle('good',ok);
      say(box,ok?'Code '+v+' accepted.':v.length+' of '+n+'.');
      if(ok&&!resetting)emit(box,'complete',{value:v});
    }
    function fill(t,from){
      t=t.replace(/\D/g,'').slice(0,n-from);
      t.split('').forEach(function(c,k){ins[from+k].value=c});
      (ins[Math.min(n-1,from+t.length)]).focus();check();
    }
    ins.forEach(function(inp,i){
      /* a full box takes the new digit instead of refusing it */
      cx.on(inp,'beforeinput',function(e){
        if(!e.data)return;e.preventDefault();
        var d=e.data.replace(/\D/g,'');if(d.length>1){fill(d,i);return}
        if(d)inp.value=d;inp.dispatchEvent(new Event('input',{bubbles:true}));
      });
      cx.on(inp,'focus',function(){inp.select()});
      cx.on(inp,'input',function(){
        if(resetting){check();return}
        var d=inp.value.replace(/\D/g,'');
        if(d.length>1){fill(d,i);return}   /* the whole code, autofilled into one box */
        inp.value=d;if(inp.value&&ins[i+1])ins[i+1].focus();check();
      });
      cx.on(inp,'keydown',function(e){
        if(e.key==='Backspace'&&!inp.value&&ins[i-1]){e.preventDefault();ins[i-1].value='';ins[i-1].focus();check()}
        else if(e.key==='ArrowLeft'&&ins[i-1]){e.preventDefault();ins[i-1].focus()}
        else if(e.key==='ArrowRight'&&ins[i+1]){e.preventDefault();ins[i+1].focus()}
      });
      cx.on(inp,'paste',function(e){e.preventDefault();fill((e.clipboardData||window.clipboardData).getData('text')||'',i)});
    });
    if(val())check();else if(hid)hid.value='';
    return {
      get value(){return val()},
      set value(v){v=String(v||'').replace(/\D/g,'').slice(0,n);ins.forEach(function(i,k){i.value=v.charAt(k)});check()},
      clear:function(){this.value=''}
    };
  },

  /* an empty element: a month of buttons. The nearest role="status" says the pick.
     data-value="2026-09-26" picks a day, data-min and data-max bound it,
     data-week-start="0" starts on Sunday (1, Monday, is the default),
     data-locale="de" names the months, data-name adds a hidden input with
     the ISO date. Fires aui:change on a pick */
  calendar:function(el,cx){
    var today=day(new Date()),first0=parseDate(el.getAttribute('data-value'));
    var hid=hiddenIn(el,el.getAttribute('data-name'));
    function conf(){
      var loc=el.getAttribute('data-locale')||doc.documentElement.lang||'en-US',w=el.getAttribute('data-week-start');
      try{new Intl.DateTimeFormat(loc)}catch(e){loc='en-US'}
      return {loc:loc,min:parseDate(el.getAttribute('data-min')),max:parseDate(el.getAttribute('data-max')),
              ws:w===null||w===''||isNaN(+w)?1:((+w%7)+7)%7};
    }
    var c=conf();
    function ok(d){return (!c.min||d>=c.min)&&(!c.max||d<=c.max)}
    function fit(d){return c.min&&d<c.min?c.min:c.max&&d>c.max?c.max:d}
    var start=first0||(ok(today)?today:null),sel=start,
        view=(function(d){return new Date(d.getFullYear(),d.getMonth(),1)})(sel||fit(today)),foc=sel||fit(today);
    var same=function(a,b){return !!a&&!!b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()};
    /* one Tab stop for the month: only the focused day is in the tab order */
    function draw(){
      c=conf();
      var y=view.getFullYear(),m=view.getMonth(),lead=(new Date(y,m,1).getDay()-c.ws+7)%7,n=new Date(y,m+1,0).getDate(),d,dt,k;
      if(foc.getFullYear()!==y||foc.getMonth()!==m)foc=(sel&&sel.getFullYear()===y&&sel.getMonth()===m)?sel:new Date(y,m,Math.min(foc.getDate(),n));
      if(!ok(foc))foc=fit(foc);
      var prevOff=c.min&&new Date(y,m,0)<c.min,nextOff=c.max&&new Date(y,m+1,1)>c.max;
      var h='<div class="cal-head"><button class="ibtn" type="button" data-d="-1" aria-label="Previous month"'+(prevOff?' disabled':'')+'>&lt;</button><span>'+
        esc(view.toLocaleDateString(c.loc,{month:'long',year:'numeric'}))+'</span><button class="ibtn" type="button" data-d="1" aria-label="Next month"'+(nextOff?' disabled':'')+'>&gt;</button></div><div class="cal-grid">';
      for(k=0;k<7;k++)h+='<span aria-hidden="true">'+esc(new Date(2023,0,1+(c.ws+k)%7).toLocaleDateString(c.loc,{weekday:'narrow'}))+'</span>';
      for(d=0;d<lead;d++)h+='<span></span>';
      for(d=1;d<=n;d++){
        dt=new Date(y,m,d);
        h+='<button type="button" data-day="'+d+'" tabindex="'+(same(dt,foc)?0:-1)+'" class="'+(same(dt,today)?'today':'')+'" aria-pressed="'+(same(dt,sel)?'true':'false')+'"'+
          (ok(dt)?'':' disabled')+' aria-label="'+esc(dt.toLocaleDateString(c.loc,{weekday:'long',day:'numeric',month:'long'}))+'">'+d+'</button>';
      }
      el.innerHTML=h+'</div>';
      if(hid){hid.value=iso(sel);el.appendChild(hid)}
      say(el,sel?sel.toLocaleDateString(c.loc,{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'No date picked.');
    }
    function show(d,focus){
      foc=d;view=new Date(d.getFullYear(),d.getMonth(),1);draw();
      if(focus){var b=el.querySelector('[data-day="'+d.getDate()+'"]');if(b)b.focus()}
    }
    cx.on(el,'click',function(e){
      var b=e.target.closest('button');if(!b||b.disabled)return;
      if(b.dataset.d){
        view=new Date(view.getFullYear(),view.getMonth()+(+b.dataset.d),1);draw();
        var nb=el.querySelector('[data-d="'+b.dataset.d+'"]');(nb&&!nb.disabled?nb:el.querySelector('[data-day][tabindex="0"]')||nb).focus();
      }else{
        sel=new Date(view.getFullYear(),view.getMonth(),+b.dataset.day);show(sel,true);
        emit(el,'change',{date:sel,value:iso(sel)});
      }
    });
    /* arrows by day and week, Home and End to the ends of the week, Page Up and Down by month */
    cx.on(el,'keydown',function(e){
      if(!e.target.closest('[data-day]'))return;
      var K={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7},wd=(foc.getDay()-c.ws+7)%7,d,t;
      if(e.key in K)d=new Date(foc.getFullYear(),foc.getMonth(),foc.getDate()+K[e.key]);
      else if(e.key==='Home')d=new Date(foc.getFullYear(),foc.getMonth(),foc.getDate()-wd);
      else if(e.key==='End')d=new Date(foc.getFullYear(),foc.getMonth(),foc.getDate()+6-wd);
      else if(e.key==='PageUp'||e.key==='PageDown'){t=foc.getMonth()+(e.key==='PageUp'?-1:1);d=new Date(foc.getFullYear(),t,Math.min(foc.getDate(),new Date(foc.getFullYear(),t+1,0).getDate()))}
      else return;
      e.preventDefault();show(fit(d),true);
    });
    /* a reset of its form, or of the dialog it sits in, puts back data-value */
    cx.on(doc,'reset',function(e){if(e.target.contains&&e.target.contains(el)){sel=start;show(sel||fit(today))}});
    cx.on(doc,'aui:reset',function(e){if(e.target.contains(el)){sel=start;show(sel||fit(today))}});
    cx.attr=function(name){
      if(name==='data-value'){var d=parseDate(el.getAttribute('data-value'));start=d;if(d){sel=d;show(d)}return}
      if(name==='data-name'){hid=hiddenIn(el,el.getAttribute('data-name'))}
      c=conf();if(sel&&!ok(sel))sel=null;draw();
    };
    draw();
    return {
      set:function(v){var d=parseDate(v);if(v&&!d)return false;sel=d&&ok(d)?d:null;show(sel||fit(today));return !!sel||!v},
      get date(){return sel?new Date(sel):null},
      get value(){return iso(sel)}
    };
  },

  /* a <nav>: data-pages="9" data-page="3". data-href="?page={n}" draws links
     instead of buttons. Fires aui:change on a pick (buttons only; a link goes) */
  pagination:function(el,cx){
    var N,href,cur;
    function read(){N=Math.max(1,+el.getAttribute('data-pages')||9);href=el.getAttribute('data-href')}
    read();cur=clamp(+el.getAttribute('data-page')||1,1,N);
    function item(p,text,label,off,now){
      var a=' aria-label="'+esc(label)+'"'+(now?' aria-current="page"':'');
      if(href){
        if(off)return '<a class="ibtn" role="link" aria-disabled="true"'+a+'>'+text+'</a>';
        return '<a class="ibtn" href="'+esc(href.replace(/\{n\}/g,p))+'" data-p="'+p+'"'+a+'>'+text+'</a>';
      }
      return '<button class="ibtn" type="button" data-p="'+p+'"'+(off?' disabled':'')+a+'>'+text+'</button>';
    }
    function draw(){
      /* every page is a 5ch target; a narrow box drops the neighbours instead of wrapping */
      var side=el.clientWidth&&el.clientWidth<374?0:1,pages=[1],p,last=0;
      for(p=cur-side;p<=cur+side;p++)if(p>1&&p<N)pages.push(p);
      if(N>1)pages.push(N);
      var h=item(cur-1,'&lt;','Previous page',cur===1);
      pages.forEach(function(q){if(q-last>1)h+='<span class="muted" aria-hidden="true">..</span>';h+=item(q,q,'Page '+q,false,q===cur);last=q});
      el.innerHTML=h+item(cur+1,'&gt;','Next page',cur===N);
      el.setAttribute('data-page',cur);
      say(el,'Page '+cur+' of '+N+'.');
    }
    cx.on(el,'click',function(e){
      var b=e.target.closest('button');if(!b||b.disabled||href)return;
      cur=clamp(+b.dataset.p,1,N);draw();emit(el,'change',{page:cur});
      var c=el.querySelector('[aria-current]');if(c)c.focus();
    });
    var w=0;cx.on(window,'resize',function(){if(el.isConnected&&el.clientWidth!==w){w=el.clientWidth;draw()}});
    cx.attr=function(name){
      if(name==='data-page'){var p=clamp(+el.getAttribute('data-page')||1,1,N);if(p!==cur){cur=p;draw()}return}
      read();cur=clamp(cur,1,N);draw();
    };
    draw();
    return {
      set:function(n){cur=clamp(Math.round(+n)||1,1,N);draw()},
      get page(){return cur},
      get pages(){return N}
    };
  },

  /* an input with the native required/pattern/type rules. It checks as you
     type, when you leave the field and when the form is sent. The message
     goes to the element its aria-describedby names, or the nearest .error.
     Words: data-error-required, data-error-type, data-error-pattern,
     data-error-length, data-error-range, and data-error for anything else.
     Fires aui:invalid and aui:valid when the verdict changes */
  validate:function(inp,cx){
    var field=inp.closest('.field'),out=byId((inp.getAttribute('aria-describedby')||'').split(' ')[0])||near(inp,null,'.error'),last=null;
    if(out&&!inp.hasAttribute('aria-describedby'))inp.setAttribute('aria-describedby',uid(out,'error'));
    var w=function(a){return inp.getAttribute(a)};
    function message(){
      var v=inp.validity,t=inp.type;
      if(v.valid)return '';
      if(v.valueMissing)return w('data-error-required')||'This one is required.';
      if(v.typeMismatch||v.badInput)return w('data-error-type')||(t==='email'?'That is not an email address.':t==='url'?'That is not a web address.':'That is not a '+t+'.');
      if(v.patternMismatch)return w('data-error-pattern')||inp.title||'That does not match the format.';
      if(v.tooShort)return w('data-error-length')||'At least '+inp.minLength+' characters.';
      if(v.tooLong)return w('data-error-length')||'At most '+inp.maxLength+' characters.';
      if(v.rangeUnderflow)return w('data-error-range')||'The lowest is '+inp.min+'.';
      if(v.rangeOverflow)return w('data-error-range')||'The highest is '+inp.max+'.';
      return w('data-error')||inp.validationMessage||'That is not valid.';
    }
    function show(msg){
      if(field)field.classList.toggle('invalid',!!msg);
      inp.setAttribute('aria-invalid',msg?'true':'false');
      if(out)out.textContent=msg;
      var now=msg?'invalid':'valid';
      if(now!==last){last=now;emit(inp,now,{message:msg,validity:inp.validity})}
    }
    function check(){var m=message();show(m);return !m}
    function clear(){if(field)field.classList.remove('invalid');inp.setAttribute('aria-invalid','false');if(out)out.textContent='';last=null}
    cx.on(inp,'input',function(){if(resetting)clear();else check()});
    cx.on(inp,'change',function(){if(resetting)clear();else check()});
    cx.on(inp,'blur',check);
    /* a submit the browser stopped: our words instead of its bubble, and the
       first field that failed gets the focus */
    cx.on(inp,'invalid',function(e){e.preventDefault();check();focusLater(inp)});
    /* a form with novalidate sends anyway: stop it here when this one fails */
    var form=inp.form;
    if(form)cx.on(form,'submit',function(e){if(form.noValidate&&!check()){e.preventDefault();focusLater(inp)}});
    if(inp.value)check();
    return {check:check,clear:clear,get message(){return message()}};
  },

  /* a textarea with maxlength; the nearest .count shows it */
  counter:function(ta,cx){
    var out=near(ta,'data-status','.count');if(!out)return;
    function up(){var max=ta.maxLength>0?ta.maxLength:0;out.textContent=ta.value.length+(max?'/'+max:'');out.classList.toggle('full',!!max&&ta.value.length>=max)}
    cx.on(ta,'input',up);up();
    return {draw:up};
  },

  /* data-kind="classic|ramp|bounce|dots|fill" */
  spinner:function(el,cx){
    var kind=el.getAttribute('data-kind')||'classic',f=0,R='.:=+*#%@%#*+=:';
    var K={
      classic:function(){return '|/-\\'.charAt(f%4)},
      ramp:function(){return tr(R.charAt(f%R.length)+R.charAt((f+1)%R.length)+R.charAt((f+2)%R.length))},
      bounce:function(){var b=f%10,p=b<5?b:10-b;return '['+rep(' ',p)+'='+rep(' ',5-p)+']'},
      dots:function(){return rep('.',1+(f>>1)%3)},
      fill:function(){return tr(bar((f*0.7)%9|0,8))}
    };
    var fn=K[kind]||K.classic;
    every(110,function(){f++;el.textContent=fn()},cx);
  },

  /* a <pre>: a card silhouette with a wave through the ramp */
  skeleton:function(el,cx){
    var W='.:=+*#',t=0,cw=0;
    function cols(){
      if(!cw){var p=doc.createElement('span');p.textContent='MMMMMMMMMM';p.style.cssText='position:absolute;visibility:hidden;white-space:pre';el.appendChild(p);cw=p.getBoundingClientRect().width/10;p.remove()}
      return clamp(Math.floor(el.clientWidth/(cw||8.4)),12,60);
    }
    function line(n,len){var s='',x;for(x=0;x<n;x++)s+=x<len?W.charAt(Math.floor((Math.sin((x-t)*0.35)+1)*2.99)):' ';return tr(s)}
    function draw(){
      var n=cols(),edge=rep('- ',n).slice(0,n);t+=1;
      el.innerHTML='<span class="f">'+edge+'</span>\n'+line(n,Math.round(n*0.4))+'\n'+line(n,n)+'\n'+line(n,Math.round(n*0.7))+'\n\n<span class="f">'+edge+'</span>';
    }
    every(120,draw,cx);
    return {draw:draw};
  }
};

/* ---- buttons that do one thing, by attribute, anywhere on the page ---- */
function openDialog(d,from){
  if(!d)return;
  if(!d.__auiDlg){
    d.__auiDlg=true;
    /* the page around it closes it, on click, and only when the press started there too */
    var down=false;
    d.addEventListener('pointerdown',function(e){down=e.target===d});
    d.addEventListener('click',function(e){if(down&&e.target===d)close(d);down=false});
    d.addEventListener('close',function(){if(d.__auiFrom&&d.__auiFrom.isConnected)d.__auiFrom.focus()});
  }
  d.__auiFrom=from;
  if(d.showModal){if(!d.open)d.showModal()}else d.setAttribute('open','');
}
function close(d){if(!d)return;if(d.close)d.close();else d.removeAttribute('open')}
function runFill(target,btn){
  if(!target||btn.disabled)return;
  var label=btn.querySelector('.label')||btn,text=label.textContent,p=0,f=0;
  btn.disabled=true;setProgress(target,0);say(btn,'');
  (function step(){
    p=Math.min(100,p+3+Math.floor(Math.random()*7));f++;
    setProgress(target,p);
    label.textContent=(reduce?'* ':'|/-\\'.charAt(f%4)+' ')+text;
    if(p<100){setTimeout(step,130);return}
    btn.disabled=false;label.textContent=text;
    var done=btn.getAttribute('data-aui-done')||'Done.',s=status(btn);
    if(s)s.textContent=done;else toast(done);
  })();
}
/* put every field back to what its html says. A form resets the native way;
   a dialog without one is walked by hand. Hidden inputs are left alone (a
   component that owns one sets it again). Then every field hears input and
   change, so bars, outputs, counts and code boxes redraw */
var FIELDS='input,textarea,select';
function restore(f){
  var t=f.type;
  if(t==='hidden'||t==='button'||t==='submit'||t==='reset'||t==='image')return;
  if(t==='checkbox'||t==='radio')f.checked=f.defaultChecked;
  else if(f.localName==='select'){
    var any=false;Array.prototype.forEach.call(f.options,function(o){o.selected=o.defaultSelected;any=any||o.defaultSelected});
    if(!any&&!f.multiple&&f.options.length)f.selectedIndex=0;
  }
  else if(t==='file')f.value='';
  else f.value=f.defaultValue;
}
function resync(box){
  resetting=true;
  try{
    all(FIELDS,box).forEach(function(f){
      if(f.type==='hidden')return;
      f.dispatchEvent(new Event('input',{bubbles:true}));
      f.dispatchEvent(new Event('change',{bubbles:true}));
    });
  }finally{resetting=false}
}
function resetBox(t){
  var box=t.closest('form')||t.closest('dialog');
  if(!box){console.warn('ascii-ui: data-aui-reset sits in no <form> and no <dialog>, so it has nothing to reset.');return}
  resetting=true;
  try{
    if(box.localName==='form')box.reset();
    else{
      all('form',box).forEach(function(f){f.reset()});
      all(FIELDS,box).forEach(function(f){if(!f.form||!box.contains(f.form))restore(f)});
    }
  }finally{resetting=false}
  resync(box);
  emit(box,'reset',{});
}
doc.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('[data-aui-open],[data-aui-close],[data-aui-toast],[data-aui-toast-err],[data-aui-reset],[data-aui-fill]');
  if(!t||t.disabled)return;
  if(t.hasAttribute('data-aui-reset')){if(t.form)e.preventDefault();resetBox(t)}
  if(t.hasAttribute('data-aui-close'))close(t.closest('dialog'));
  if(t.hasAttribute('data-aui-open'))openDialog(dialogOf(t),t);
  if(t.hasAttribute('data-aui-fill'))runFill(near(t,'data-aui-fill','[role="progressbar"]',true),t);
  if(t.hasAttribute('data-aui-toast-err'))toast(t.getAttribute('data-aui-toast-err'),true);
  else if(t.hasAttribute('data-aui-toast'))toast(t.getAttribute('data-aui-toast'));
});
/* a native reset (a type="reset" button, form.reset()) redraws the bars too,
   once the browser has put the values back */
doc.addEventListener('reset',function(e){
  if(resetting)return;var f=e.target;
  setTimeout(function(){if(f.isConnected)resync(f)},0);
});
/* the whole frame of a field takes the tap, not only the one line inside it */
doc.addEventListener('click',function(e){
  var f=e.target.closest&&e.target.closest('.field');
  if(!f||e.target.closest('input,select,textarea,button,a,label')||f.contains(doc.activeElement))return;
  var i=f.querySelector('input,textarea');if(i&&!i.disabled)i.focus();
});

/* ---- the ids aria needs, made for markup that has none ---- */
var CONTROL='input:not([type="hidden"]),select,textarea',nameN=0;
function link(root){
  /* root itself counts, for a label or a dialog added on its own */
  var mine=function(sel){var l=all(sel,root);if(root.nodeType===1&&root.matches(sel))l.unshift(root);return l};
  /* a label next to its control, not around it: the first control after it */
  mine('label:not([for])').forEach(function(l){
    if(l.querySelector(CONTROL))return;
    for(var n=l.nextElementSibling;n;n=n.nextElementSibling){
      var c=n.matches(CONTROL)?n:n.querySelector(CONTROL);
      if(c){l.setAttribute('for',uid(c,'field'));return}
    }
  });
  /* radios pasted twice share a name, and the browser makes them one group,
     so the second copy's checked radio unchecks the first's. A group is a
     name within one form (or within no form): radios in two forms are two
     groups already and keep their names, since the name is what the form
     sends. Within one form, or outside any, each radiogroup or fieldset
     after the first gets a name of its own, and a group left with nothing
     checked gets back the one its html checks */
  var seen=[];
  mine('input[type="radio"][name]').forEach(function(r){
    var n=r.name,f=r.form;
    if(seen.some(function(s){return s[0]===n&&s[1]===f}))return;seen.push([n,f]);
    var box=function(x){var b=x.closest('[role="radiogroup"],fieldset');return b&&(!f||f.contains(b))?b:(f||doc.body)};
    var rs=all('input[type="radio"]').filter(function(x){return x.name===n&&x.form===f}),boxes=[];
    rs.forEach(function(x){if(boxes.indexOf(box(x))<0)boxes.push(box(x))});
    if(boxes.length<2)return;
    boxes.forEach(function(b,k){
      var own=rs.filter(function(x){return box(x)===b}),nn;
      if(k){do{nn=n+'-'+(++nameN)}while(all('input').some(function(x){return x.name===nn}));own.forEach(function(x){x.name=nn})}
      if(!own.some(function(x){return x.checked}))own.forEach(function(x){if(x.defaultChecked)x.checked=true});
    });
  });
  /* a dialog is named by its .bar-title and described by its first paragraph */
  mine('dialog').forEach(function(d){
    var t=d.querySelector('.bar-title'),p=d.querySelector('.body > p');
    if(t&&!d.hasAttribute('aria-labelledby'))d.setAttribute('aria-labelledby',uid(t,'title'));
    if(p&&!d.hasAttribute('aria-describedby'))d.setAttribute('aria-describedby',uid(p,'desc'));
  });
}

/* ---- wiring: mount, unmount, and the observer that calls them ---- */
function mount(el){
  if(el.__aui)return el.__aui.api;   /* wired already: once is enough */
  var name=el.getAttribute('data-aui'),fn=behaviors[name];
  if(!fn||!Object.prototype.hasOwnProperty.call(behaviors,name))return null;
  var cx=new Ctx(el,name);el.__aui=cx;
  try{var api=fn(el,cx);if(api)cx.api=api}catch(e){console.error('ascii-ui: '+name+' failed',e)}
  return cx.api;
}
function unmount(el){var cx=el.__aui;if(!cx)return;el.__aui=null;cx.end()}
function list(root){
  var els=all('[data-aui]',root);
  if(root.nodeType===1&&root.hasAttribute('data-aui'))els.unshift(root);
  return els;
}
function init(root){
  root=root||doc;
  link(root);
  list(root).forEach(mount);
  return root;
}
function destroy(root){
  root=root||doc;
  list(root).forEach(unmount);
  return root;
}
function get(el){return el&&el.__aui?el.__aui.api:null}
/* ASCIIUI.tabs(el) and the like: the calls for that one component, wiring
   it first if the page has not yet */
function typed(name){
  return function(el){
    if(typeof el==='string')el=doc.querySelector(el);
    if(!el)return null;
    if(!el.__aui&&el.getAttribute('data-aui')===name)mount(el);
    return el.__aui&&el.__aui.name===name?el.__aui.api:null;
  };
}
/* validate(form): checks every field in it, writes the messages, and says
   whether the lot is good. It does not move the focus */
function validate(root){
  if(typeof root==='string')root=doc.querySelector(root);
  root=root||doc;
  var good=true,els=all(FIELDS,root);
  if(root.nodeType===1&&root.matches(FIELDS))els.unshift(root);
  els.forEach(function(f){
    var a=f.__aui&&f.__aui.name==='validate'?f.__aui.api:null;
    if(a){if(!a.check())good=false}
    else if(f.willValidate&&!f.validity.valid)good=false;
  });
  return good;
}
var WATCH=['data-aui','data-page','data-pages','data-href','data-value','data-min','data-max','data-week-start','data-locale','data-name','data-kind','data-cells'];
function start(){
  init(doc);
  new MutationObserver(function(ms){ms.forEach(function(m){
    if(m.type==='childList'){
      /* gone from the page: torn down. Moved (gone and back in one go): kept */
      m.removedNodes.forEach(function(n){if(n.nodeType===1&&!n.isConnected)destroy(n)});
      /* anything added later gets wired too, and so does anything put back */
      m.addedNodes.forEach(function(n){if(n.nodeType===1&&n.isConnected)init(n)});
      return;
    }
    var el=m.target,a=m.attributeName;
    if(!el.isConnected||el.getAttribute(a)===m.oldValue)return;
    if(a==='data-aui'){unmount(el);mount(el);return}
    var cx=el.__aui;if(!cx)return;
    if(cx.attr)cx.attr(a);else{unmount(el);mount(el)}
  })}).observe(doc.documentElement,{childList:true,subtree:true,attributes:true,attributeOldValue:true,attributeFilter:WATCH});
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start);else start();

window.ASCIIUI={
  version:VERSION,init:init,destroy:destroy,get:get,validate:validate,
  toast:toast,progress:setProgress,bar:bar,colorize:colorize,tones:tones,behaviors:behaviors,
  tabs:typed('tabs'),pagination:typed('pagination'),calendar:typed('calendar'),dropdown:typed('dropdown'),otp:typed('otp'),
  get reduce(){return reduce}
};
})();
