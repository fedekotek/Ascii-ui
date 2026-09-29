/*! ascii/ui kit 1.3.1 | MIT | (c) 2026 Fede Kotek */
/* ascii-ui.js
   The behaviors for the components that need a script, wired by data
   attributes. No dependencies. Link it after ascii-ui.css:

     <script src="ascii-ui.js" defer></script>

   Then any element with data-aui="NAME" gets that behavior, including
   elements added later. The names: tabs, slider, progress, dropdown, tooltip,
   popover, combobox, contextmenu, confirm, otp, calendar, chart, pagination,
   datatable, validate, counter, segment, spinner, skeleton, and for the Blocks
   checklist, pick and stepper.
   Signal, the bad signal, is opt in and rides on any element:
     data-aui-signal="glitch"   glitches when a state inside it changes
     data-aui-signal="scramble" decodes its words into place once, on screen
     data-aui-signal="band"     a band rolls through it now and then
     data-aui-signal="rot"      its frames decay after data-rot seconds idle
     data-aui-signal=""         off
   --aui-signal (calm, normal, loud, off) or data-aui-signal-level says how loud.
   Buttons take these instead:
     data-aui-open              opens the nearest <dialog> (a card or a .sheet)
     data-aui-close             closes the dialog or the popover it sits in;
                                data-aui-close="delete" also sets the dialog's
                                returnValue, so its close event knows the answer
     data-aui-toast="Saved."    shows a toast (data-aui-toast-err for a yellow one,
                                read out at once). It has an [x], stays longer for
                                longer words and holds while it is pointed at
     data-aui-reset             puts the fields of its form or dialog back to how the html has them
     data-aui-fill              runs the nearest progress bar from 0 to 100, for demos
     data-aui-toggle            flips the button's aria-pressed and fires aui:change;
                                data-aui-toggle="Muted.|Back on." says the words
                                for on and for off in its status line
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

   Everything that moves draws on requestAnimationFrame (a timer only waits
   out the time between two steps) and stops when the element leaves the
   page; a spinner or a skeleton off screen asks for no frames at all. prefers-reduced-motion leaves every frame still,
   and a change to that setting is followed while the page is open. The
   times and steps of the css animations are the --aui-* tokens in
   ascii-ui.css. A .sheet can be dragged down to close on a touch screen.

   window.ASCIIUI: version, init(root), destroy(root), get(el), validate(form),
   toast(msg, err), progress(el, pct), tabs(el), pagination(el), calendar(el),
   chart(el), datatable(el), dropdown(el), popover(el), combobox(el), contextmenu(el), otp(el),
   bar(k, n), colorize(str), tones(map), glitch(el), scramble(el), band(el),
   rot(el), repair(el), signal(level), reduce, behaviors. The README has
   the events and the calls for each component.

   MIT license. Copyright (c) 2026 Fede Kotek. The full text is in LICENSE.txt
   next to this file, and in README.md. */
(function(){
'use strict';
if(window.ASCIIUI)return;   /* linked twice: keep the first */
var VERSION='1.3.1';
var doc=document;

/* ---- reduced motion, followed live ---- */
var mq=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):null;
var reduce=!!(mq&&mq.matches);
function onReduce(){
  reduce=!!mq.matches;
  onMedia();
  if(!reduce&&tasks.length)tickPlan();
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

/* ---- panels that float next to what opened them: the popover, the
   combobox list and the context menu. Where the browser has the Popover API
   the panel goes to the top layer (popover="manual"): no box that scrolls or
   clips holds it back and nothing is drawn over it. Without it the panel
   stays where it is in the page, over its neighbours. Either way it is
   placed on the grid, whole characters and rows from what opened it: under
   it, or above it when there is no room below, and inside the window ---- */
var TOP=!!(window.HTMLElement&&HTMLElement.prototype.hasOwnProperty('popover'));
var CW=0;
/* one character, in px, measured in the panel's own font */
function chw(box){
  var p=doc.createElement('span');p.textContent='MMMMMMMMMM';
  p.style.cssText='position:absolute;left:0;top:0;visibility:hidden;white-space:pre';
  (box||doc.body).appendChild(p);var w=p.getBoundingClientRect().width/10;p.remove();
  return w||CW||8.4;
}
function rowh(){return parseFloat(getComputedStyle(doc.documentElement).getPropertyValue('--r'))||21}
/* a child of box that matches sel, or else the first one inside it */
function kid(box,sel){
  for(var i=0;i<box.children.length;i++)if(box.children[i].matches(sel))return box.children[i];
  return box.querySelector(sel);
}
/* where Tab lands first inside box: [autofocus], else the first control, and
   for a radio group the radio that is checked */
var TABBABLE='a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function firstStop(box){
  var a=box.querySelector('[autofocus]');if(a&&a.getClientRects().length)return a;
  var e=all(TABBABLE,box).filter(function(x){return x.getClientRects().length})[0];
  if(e&&e.type==='radio'&&e.name){var c=all('input[type="radio"]',box).filter(function(x){return x.name===e.name&&x.checked})[0];if(c)e=c}
  if(!e){if(!box.hasAttribute('tabindex'))box.tabIndex=-1;e=box}
  return e;
}
function float(panel,cx){
  var side='down';
  if(TOP){panel.hidden=false;panel.setAttribute('popover','manual')}
  /* torn down: closed, and the html back to how it came */
  cx.later(function(){
    if(TOP){try{panel.hidePopover()}catch(e){}panel.removeAttribute('popover')}
    panel.hidden=true;panel.classList.remove('open','up');panel.style.left='';panel.style.top='';
  });
  var F={
    get isOpen(){return TOP?panel.matches(':popover-open'):!panel.hidden},
    show:function(){if(F.isOpen)return;if(TOP)panel.showPopover();else panel.hidden=false;panel.classList.add('open');CW=chw(panel);side='down'},
    hide:function(){if(!F.isOpen)return;panel.classList.remove('open','up');if(TOP)panel.hidePopover();else panel.hidden=true},
    /* a is the box it hangs from. point: a context menu, which opens at the
       pointer (a is the character cell under it) and goes to its left when
       there is no room on the right.
       keep: stay on the side it took when it opened, while there is room */
    place:function(a,point,keep){
      var cw=CW||chw(panel),de=doc.documentElement,vw=de.clientWidth,vh=de.clientHeight;
      panel.style.left='0px';panel.style.top='0px';
      var o=panel.getBoundingClientRect(),w=o.width,h=o.height,x=a.left,y=a.bottom;
      var below=vh-a.bottom,above=a.top;
      var s=keep&&side==='up'&&above>=h?'up':(below>=h||below>=above)?'down':'up';
      if(s==='up')y=a.top-h;
      if(x+w>vw-cw){
        if(point&&a.left-w>=cw)x=a.left-w;
        else x-=Math.ceil((x+w-(vw-cw))/cw)*cw;
      }
      if(x<cw)x+=Math.ceil((cw-x)/cw)*cw;
      side=s;panel.classList.toggle('up',s==='up');
      panel.style.left=Math.round(x-o.left)+'px';panel.style.top=Math.round(y-o.top)+'px';
    }
  };
  return F;
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
   component is torn down. Under reduced motion it draws once and stays.
   It sleeps when it can: a frame is asked for only when a task on screen is
   due, a timer waits out the time between, and with every task off screen
   (or the tab hidden) it waits on nothing until one comes back ---- */
var tasks=[],raf=0,tickTm=0;
var tickIO=window.IntersectionObserver?new IntersectionObserver(function(es){
  es.forEach(function(e){e.target.__auiSeen=e.isIntersecting});tickPlan();
}):null;
function every(ms,fn,cx){
  fn();
  var t={ms:ms,fn:fn,cx:cx,el:cx.el,at:0};
  tasks.push(t);
  if(tickIO){if(t.el.__auiSeen===undefined)t.el.__auiSeen=false;tickIO.observe(t.el)}
  /* let go on teardown, not on the next frame: under reduced motion there is
     no next frame, and the element would be held for good */
  cx.later(function(){var i=tasks.indexOf(t);if(i>=0)tasks.splice(i,1);tickLet(t.el)});
  tickPlan();
}
function tickLet(el){if(tickIO&&!tasks.some(function(x){return x.el===el}))tickIO.unobserve(el)}
function seen(t){return !tickIO||t.el.__auiSeen}
function tickPlan(){
  if(tickTm){clearTimeout(tickTm);tickTm=0}
  if(raf||reduce||doc.hidden)return;
  var now=snow(),next=Infinity;
  tasks.forEach(function(t){if(!t.cx.dead&&seen(t))next=Math.min(next,t.at+t.ms)});
  if(next===Infinity)return;
  var d=next-now;
  if(d<=20)raf=requestAnimationFrame(tick);
  else tickTm=setTimeout(function(){tickTm=0;if(!raf&&!doc.hidden&&!reduce)raf=requestAnimationFrame(tick)},d-16);
}
function tick(now){
  raf=0;now=snow();
  tasks=tasks.filter(function(t){var ok=!t.cx.dead&&t.el.isConnected;if(!ok)tickLet(t.el);return ok});
  if(!tasks.length||reduce)return;
  if(!doc.hidden)tasks.forEach(function(t){
    if(!seen(t)||now-t.at<t.ms-8)return;t.at=now;
    var r=t.el.getBoundingClientRect();
    if(r.bottom>0&&r.top<innerHeight&&r.width)try{t.fn()}catch(e){t.el.isConnected&&console.error(e)}
  });
  tickPlan();
}
doc.addEventListener('visibilitychange',function(){if(doc.hidden){if(raf){cancelAnimationFrame(raf);raf=0}if(tickTm){clearTimeout(tickTm);tickTm=0}}else tickPlan()});

/* ---- toast. While a modal dialog is open the page behind it is inert, so
   the toast goes inside that dialog: on top, and read out ---- */
/* a time token from the css, in ms: --aui-toast:3.6s is 3600 */
function cssTime(name,def){
  var v=getComputedStyle(doc.documentElement).getPropertyValue(name).trim(),n=parseFloat(v);
  return isNaN(n)?def:/ms$/.test(v)?n:n*1000;
}
/* The line is a slab: the mark (@@ or !!, paint, so a screen reader skips
   it), the words, and [x] to put it away. The words go into one of two live
   regions: role="status" for good news, read when the reader is free, and
   role="alert" for what went wrong, read at once. It stays longer for longer
   words (--aui-toast at least, then 60ms a character), and holds while the
   pointer or the focus is on it */
var toastEl=null,toastTimer=0,toastSay=null,toastFrom=null,toastHold=0,toastIn=0;
function modal(){
  var open=all('dialog[open]').filter(function(d){try{return d.matches(':modal')}catch(e){return true}});
  return open[open.length-1]||null;
}
function toastOff(){clearTimeout(toastTimer);if(toastEl)toastEl.classList.remove('on')}
function toastLater(ms){clearTimeout(toastTimer);toastTimer=setTimeout(function(){if(!toastIn)toastOff()},ms)}
function toast(msg,err){
  msg=String(msg==null?'':msg);
  if(!toastEl){
    toastEl=doc.createElement('div');toastEl.className='toast';
    toastEl.innerHTML='<span><b aria-hidden="true"></b><span role="status" aria-live="polite" aria-atomic="true"></span><span role="alert" aria-atomic="true"></span><button class="toast-x" type="button" aria-label="Dismiss">[x]</button></span>';
    var line=toastEl.firstChild,x=line.lastChild;
    toastSay={mark:line.firstChild,ok:line.children[1],err:line.children[2]};
    x.addEventListener('click',function(){
      toastIn=0;toastOff();
      /* the focus was on [x], which is going: back to where it came from */
      if(toastFrom&&toastFrom.isConnected&&toastFrom!==doc.body)toastFrom.focus();
    });
    line.addEventListener('pointerenter',function(){toastIn|=1;clearTimeout(toastTimer)});
    line.addEventListener('pointerleave',function(){toastIn&=~1;if(!toastIn)toastLater(toastHold/2)});
    toastEl.addEventListener('focusin',function(){toastIn|=2;clearTimeout(toastTimer)});
    toastEl.addEventListener('focusout',function(){toastIn&=~2;if(!toastIn)toastLater(toastHold/2)});
  }
  var host=modal()||doc.body;
  if(toastEl.parentNode!==host)host.appendChild(toastEl);
  var a=doc.activeElement;if(a&&!toastEl.contains(a))toastFrom=a;
  clearTimeout(toastTimer);
  toastEl.classList.toggle('err',!!err);
  toastSay.ok.textContent='';toastSay.err.textContent='';
  /* a beat after the region exists and is empty, so a screen reader hears the change */
  setTimeout(function(){
    toastSay.mark.textContent=err?'!! ':'@@ ';
    (err?toastSay.err:toastSay.ok).textContent=msg+' ';
    toastEl.classList.add('on');
  },20);
  toastHold=Math.min(15000,Math.max(cssTime('--aui-toast',3600),1200+60*msg.length));
  toastIn=toastEl.contains(doc.activeElement)?2:0;
  toastLater(toastHold);
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

/* ---- charts: a grid of cells, each a character, a color and the point it
   belongs to, so a click finds its point. Each series and slice has its own
   glyph as well as its own color, so it reads in grey too ---- */
var RAMP=' .:=+*#%@',GL='@#%+=:',COL=['hot','deep','pink','violet','ink','muted'];
function Cells(w,h){this.w=w;this.h=h;this.c=[];this.k=[];this.p=[];for(var i=0;i<w*h;i++){this.c.push(' ');this.k.push('');this.p.push(-1)}}
Cells.prototype.set=function(x,y,ch,k,p,raw){
  if(x<0||y<0||x>=this.w||y>=this.h)return;
  var i=y*this.w+x;this.c[i]=raw?ch:tr(ch);this.k[i]=k||'';if(p!=null)this.p[i]=p;
};
Cells.prototype.text=function(x,y,s,k,p){for(var i=0;i<s.length;i++)this.set(x+i,y,s.charAt(i),k,p,1)};
Cells.prototype.hit=function(x0,y0,w,h,p){for(var y=y0;y<y0+h;y++)for(var x=x0;x<x0+w;x++)this.set(x,y,this.c[y*this.w+x],this.k[y*this.w+x],p,1)};
Cells.prototype.html=function(){
  var rows=[],y,x,i,cur,run,o;
  function fl(){if(run)o+=cur?'<span style="color:var(--'+cur+')">'+esc(run)+'</span>':esc(run);run=''}
  for(y=0;y<this.h;y++){o=cur=run='';for(x=0;x<this.w;x++){i=y*this.w+x;if(this.k[i]!==cur){fl();cur=this.k[i]}run+=this.c[i]}fl();rows.push(o.replace(/\s+$/,''))}
  return rows.join('\n');
};
function txt(c){return c.textContent.replace(/\s+/g,' ').trim()}
/* a cell's number: data-value, else its text less commas, units and % */
function num(c){var v=c.getAttribute('data-value');v=parseFloat(v!==null?v:c.textContent.replace(/[^\d.eE+-]/g,''));return isFinite(v)?v:0}
function short(v){var a=Math.abs(v);return (a>=1e6?(v/1e6).toFixed(1)+'M':a>=1e3?(v/1e3).toFixed(1)+'k':String(Math.round(v*10)/10)).replace('.0','')}
/* the top of the axis: the largest value rounded up to a fifth of its power of ten */
function nice(m){if(m<=0)return 1;var p=Math.pow(10,Math.floor(Math.log(m)/Math.LN10));return Math.round(Math.ceil(m/p*5-1e-9)/5*p*1e6)/1e6}
function attrNum(el,a){var v=el.getAttribute(a);return v===null||v===''||isNaN(+v)?null:+v}
/* data-type="spark": a word-sized trend, one ramp character a value, from
   data-values (or its own text). An image named by its numbers, unless the
   page hides it or names it */
function spark(el,cx){
  var was=el.textContent,set=[];
  function draw(){
    var v=(el.getAttribute('data-values')||was).split(/[\s,;]+/).map(parseFloat).filter(isFinite);if(!v.length)return;
    var lo=Math.min.apply(0,v),hi=Math.max.apply(0,v),mn=attrNum(el,'data-min'),mx=attrNum(el,'data-max');
    if(mn===null)mn=lo;if(mx===null)mx=hi;
    el.textContent=tr(v.map(function(x){return RAMP.charAt(1+Math.round(clamp(mx>mn?(x-mn)/(mx-mn):1,0,1)*7))}).join(''));
    if(el.getAttribute('aria-hidden')==='true'||el.hasAttribute('aria-labelledby')||(el.hasAttribute('aria-label')&&!set.length))return;
    if(!el.hasAttribute('role')){el.setAttribute('role','img');set.push('role')}
    set.push('aria-label');
    el.setAttribute('aria-label',(el.getAttribute('data-label')||'Trend')+', '+v.length+' values, from '+v[0]+' to '+v[v.length-1]+', low '+lo+', high '+hi);
  }
  cx.later(function(){el.textContent=was;set.forEach(function(a){el.removeAttribute(a)})});
  draw();
  return {draw:draw};
}

/* set while a reset puts fields back, so the fields do not call the empty
   ones errors and the code boxes do not move the focus */
var resetting=false;
/* the first field a failed submit found, focused once the browser is done */
var toFocus=null;
function focusLater(el){if(toFocus)return;toFocus=el;setTimeout(function(){var f=toFocus;toFocus=null;if(f&&f.isConnected)f.focus()},0)}

/* ---- Signal: the bad signal, opt in. data-aui-signal="glitch", "scramble",
   "band" or "rot" (several, with spaces) on any element, or the calls
   ASCIIUI.glitch(el), scramble(el), band(el), rot(el), repair(el). Nothing
   runs until asked. It is paint: strips on one fixed layer that takes no
   clicks and is aria-hidden, a translate, a frame's string. No box on the
   page moves. It holds still under reduced motion, forced colors and print,
   while the tab is hidden and while a field has the focus. How loud is
   --aui-signal on :root (calm, normal, loud, or off), or
   data-aui-signal-level on the root or on any element around the effect.
   It keeps its own loop: a frame is asked for only while an effect is
   drawing, between effects it waits on one timer, and with nothing to do it
   waits on nothing. At most three glitches a second on the page, so it
   never flashes more than three times a second (WCAG 2.3.1) ---- */
var fmq=window.matchMedia?matchMedia('(forced-colors: active)'):null;
var pmq=window.matchMedia?matchMedia('print'):null;
var printing=false;
var SIGLV={off:0,calm:1,normal:2,loud:3};
function sigLevel(el){
  el=el&&el.nodeType===1?el:doc.documentElement;
  var h=el.closest('[data-aui-signal-level]'),v=h?h.getAttribute('data-aui-signal-level'):'';
  if(!v)v=getComputedStyle(el).getPropertyValue('--aui-signal');
  v=String(v||'').replace(/["'\s]/g,'').toLowerCase();
  return Object.prototype.hasOwnProperty.call(SIGLV,v)?SIGLV[v]:2;
}
/* a field that takes typing has the focus: the page holds still for it */
var NOTYPE=/^(checkbox|radio|button|submit|reset|range|color|file|image|hidden)$/;
function typing(){
  var a=doc.activeElement;if(!a||a===doc.body)return false;
  return !!(a.isContentEditable||a.localName==='textarea'||(a.localName==='input'&&!NOTYPE.test(a.type)));
}
/* held: nothing moves and the loop asks for nothing, not even a timer */
function sigHeld(){return reduce||!!(fmq&&fmq.matches)||printing||!!(pmq&&pmq.matches)}
function sigStill(el){return sigHeld()||doc.hidden||typing()||sigLevel(el)===0}
function sigEl(el){if(typeof el==='string')el=doc.querySelector(el);return el&&el.nodeType===1?el:null}

/* the loop: jobs are {at, fn}; fn returns the ms to its next turn, or 0 */
var sq=[],sraf=0,stm=0;
function snow(){return window.performance?performance.now():Date.now()}
function sigAt(ms,fn){var j={at:snow()+ms,fn:fn,dead:false};sq.push(j);sigPlan();return j}
function sigDrop(j){if(!j)return;j.dead=true;var i=sq.indexOf(j);if(i>=0)sq.splice(i,1)}
function sigPlan(){
  if(stm){clearTimeout(stm);stm=0}
  if(sraf||!sq.length||doc.hidden||sigHeld())return;
  var next=Infinity;sq.forEach(function(j){if(j.at<next)next=j.at});
  var d=next-snow();
  if(d<=20)sraf=requestAnimationFrame(sigTick);
  else stm=setTimeout(function(){stm=0;if(!sraf&&!doc.hidden&&!sigHeld())sraf=requestAnimationFrame(sigTick)},d-16);
}
function sigTick(){
  sraf=0;
  var t=snow(),due=sq.filter(function(j){return j.at<=t+8});
  sq=sq.filter(function(j){return due.indexOf(j)<0});
  due.forEach(function(j){
    if(j.dead)return;
    var r=0;try{r=j.fn()}catch(e){console.error(e)}
    if(r>0&&!j.dead){j.at=t+r;sq.push(j)}
  });
  sigPlan();
}
/* the effects drawing right now, by the function that ends each one */
var sigLive=[];
function sigCalm(){
  sigLive.slice().forEach(function(f){try{f()}catch(e){}});sigLive=[];
  rotten.slice().forEach(repair);
}
function sigOn(f,on){var i=sigLive.indexOf(f);if(on&&i<0)sigLive.push(f);if(!on&&i>=0)sigLive.splice(i,1)}
doc.addEventListener('visibilitychange',function(){
  if(doc.hidden){if(sraf){cancelAnimationFrame(sraf);sraf=0}if(stm){clearTimeout(stm);stm=0}sigCalm()}
  else sigPlan();
});
function onMedia(){
  if(sigHeld()){if(sraf){cancelAnimationFrame(sraf);sraf=0}if(stm){clearTimeout(stm);stm=0}sigCalm()}
  else sigPlan();
}
[fmq,pmq].forEach(function(q){if(q){if(q.addEventListener)q.addEventListener('change',onMedia);else if(q.addListener)q.addListener(onMedia)}});
window.addEventListener('beforeprint',function(){printing=true;onMedia()});
window.addEventListener('afterprint',function(){printing=false;onMedia()});

/* the layer: one per page, and one inside an open modal dialog, which is
   drawn above the page */
function layer(host){
  var L=host.__auiSigL;
  if(!L||!L.isConnected){L=doc.createElement('div');L.className='aui-sig';L.setAttribute('aria-hidden','true');host.appendChild(L);host.__auiSigL=L}
  return L;
}
function hostOf(el){return (el.closest&&el.closest('dialog[open]'))||doc.body}
function inView(r){return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}
/* noise in place of a letter: these four never add or take away a place
   where a line can wrap, so the text keeps its lines */
var SIGN='=*#@';
function noiseCh(){return tr(SIGN.charAt(Math.floor(Math.random()*SIGN.length)))}
function noiseRow(n,d){var s='';for(var i=0;i<n;i++)s+=Math.random()<d?tr(RAMP.charAt(1+Math.floor(Math.random()*4))):' ';return s}

/* glitch: two frames (calm one, loud three), 50ms each. The element goes a
   character sideways and back, and a strip or two of light characters,
   knocked a character off, crosses it. Each strip lasts one frame. Then
   everything is where it was */
var gHist=[];
function glitch(el){
  el=sigEl(el);if(!el||sigStill(el))return false;
  var t=snow();
  if(el.__auiG&&t-el.__auiG<400)return false;
  gHist=gHist.filter(function(x){return t-x<1000});
  if(gHist.length>=3||!inView(el.getBoundingClientRect()))return false;
  gHist.push(t);el.__auiG=t;
  var lv=sigLevel(el),frames=lv===1?1:lv===3?3:2,n=lv===1?1:lv===3?3:2,f=0,job=null,
      L=layer(hostOf(el)),cw=chw(L),R=rowh(),strips=[];
  function clear(){strips.forEach(function(s){s.remove()});strips=[]}
  function stop(){clear();el.classList.remove('aui-sig-g');el.style.removeProperty('--aui-sig-x');sigOn(stop,false);sigDrop(job)}
  function frame(){
    clear();
    if(f>=frames||!el.isConnected||sigStill(el)){stop();return 0}
    var b=el.getBoundingClientRect(),rows=Math.max(1,Math.round(b.height/R)),cols=Math.max(1,Math.ceil(b.width/cw)),i,s;
    el.style.setProperty('--aui-sig-x',(f%2?-1:1)+'ch');el.classList.add('aui-sig-g');
    for(i=0;i<n;i++){
      s=doc.createElement('span');if(Math.random()<0.5)s.className='aui-sig-pk';
      s.style.cssText='width:'+Math.round(b.width)+'px;height:'+R+'px;transform:translate('+Math.round(b.left+(Math.random()<0.5?-cw:cw))+'px,'+Math.round(b.top+Math.floor(Math.random()*rows)*R)+'px)';
      s.textContent=noiseRow(cols,0.5);L.appendChild(s);strips.push(s);
    }
    f++;return 50;
  }
  sigOn(stop,true);
  if(frame())job=sigAt(50,frame);
  return true;
}

/* scramble: the words decode into place from the left, in 10 frames of
   40ms (calm 6, loud 14). Each piece of text becomes two: the noise, which
   is aria-hidden, and the final words, visually hidden, so a screen reader
   reads the words at once and never the noise. Only letters and digits are
   scrambled; spaces and punctuation stay put, so every line keeps its
   width and its breaks. Live regions are left alone. The noise is css
   content (aui-noise::before, from its data-n), not text, so a script that
   reads the words mid-decode (a chart, a sort, a button label) gets the
   words, once */
var SKIP='input,textarea,select,script,style,noscript,svg,canvas,[aria-hidden="true"],.vh,aui-sr,.aui-sig';
var WORD=/[A-Za-z0-9À-ɏ]/;
function scramble(el){
  el=sigEl(el);if(!el||el.__auiS||sigStill(el)||el.closest('[aria-live],[role="status"],[role="alert"],[aria-hidden="true"]'))return false;
  var w=doc.createTreeWalker(el,NodeFilter.SHOW_TEXT,null),n,nodes=[],total=0;
  while((n=w.nextNode())&&total<800){
    if(!WORD.test(n.nodeValue)||n.parentNode.closest(SKIP)||n.parentNode.closest('[aria-live],[role="status"],[role="alert"]'))continue;
    nodes.push(n);total+=n.nodeValue.length;
  }
  if(!nodes.length)return false;
  var lv=sigLevel(el),frames=lv===1?6:lv===3?14:10,f=0,job=null;
  var parts=nodes.map(function(n){
    var h=doc.createElement('aui-noise'),v=doc.createElement('aui-sr');
    h.setAttribute('aria-hidden','true');v.textContent=n.nodeValue;
    n.parentNode.insertBefore(v,n);n.parentNode.replaceChild(h,n);
    return {n:n,h:h,v:v,t:n.nodeValue};
  });
  function draw(){
    var shown=total*f/frames,seen=0;
    parts.forEach(function(p){
      var o='',j,c;
      for(j=0;j<p.t.length;j++,seen++){c=p.t.charAt(j);o+=(seen<shown||!WORD.test(c))?c:noiseCh()}
      p.h.setAttribute('data-n',o);
    });
  }
  function stop(){
    if(el.__auiS!==stop)return;el.__auiS=null;sigOn(stop,false);sigDrop(job);
    parts.forEach(function(p){if(p.h.parentNode)p.h.parentNode.replaceChild(p.n,p.h);if(p.v.parentNode)p.v.parentNode.removeChild(p.v)});
  }
  el.__auiS=stop;sigOn(stop,true);draw();
  job=sigAt(40,function(){f++;if(f>=frames||!el.isConnected){stop();return 0}draw();return 40});
  return true;
}

/* band: three rows of - = - roll down through the box once, a row a step,
   65ms a step (calm 90, loud 50), pink and see-through: the words under it
   stay readable. Moved by a css animation, transform only. On the root (or
   body) it rolls down the window */
function band(el){
  el=sigEl(el)||doc.documentElement;
  var whole=el===doc.documentElement||el===doc.body;
  if(el.__auiB||sigStill(el))return false;
  function rect(){return whole?{left:0,top:0,width:innerWidth,height:innerHeight,right:innerWidth,bottom:innerHeight}:el.getBoundingClientRect()}
  var r=rect();if(!inView(r))return false;
  var L=layer(whole?doc.body:hostOf(el)),cw=chw(L),R=rowh(),lv=sigLevel(el),
      cols=Math.ceil(r.width/cw)+1,rows=Math.ceil(r.height/R)+3,step=lv===1?90:lv===3?50:65,
      box=doc.createElement('span'),row=doc.createElement('span'),dash=rep('- ',cols).slice(0,cols),ac=new AbortController(),tm=0;
  box.className='aui-sig-band';
  function place(){var b=rect();box.style.cssText='width:'+Math.round(b.width)+'px;height:'+Math.round(b.height)+'px;transform:translate('+Math.round(b.left)+'px,'+Math.round(b.top)+'px)'}
  place();
  row.textContent=tr(dash+'\n'+rep('= ',cols).slice(0,cols)+'\n'+dash);
  row.style.cssText='--aui-sig-rows:'+rows+';--aui-sig-t:'+(rows*step)+'ms;--aui-sig-o:'+(lv===1?0.2:lv===3?0.45:0.32);
  box.appendChild(row);L.appendChild(box);
  if(!whole){window.addEventListener('scroll',place,{capture:true,passive:true,signal:ac.signal});window.addEventListener('resize',place,{signal:ac.signal})}
  function stop(){if(el.__auiB!==stop)return;el.__auiB=null;sigOn(stop,false);ac.abort();clearTimeout(tm);box.remove()}
  row.addEventListener('animationend',stop);
  /* a pass that never says it ended (the tab went away) still goes */
  tm=setTimeout(stop,rows*step+400);
  el.__auiB=stop;sigOn(stop,true);
  return true;
}

/* rot: after data-rot seconds (14) with no pointer, key, wheel or scroll,
   the frames in it lose characters, two ramp steps lighter, a step every
   1.1s, three steps (calm two, loud five). Any input repairs them at once.
   The frames are paint, so a screen reader hears nothing of it */
var rotten=[],rotW=[],idleAt=snow();
function framesIn(el){var l=all('.frame',el);if(el.classList.contains('frame'))l.unshift(el);return l}
function rotStep(el){
  var lv=sigLevel(el),p=lv===1?0.12:lv===3?0.32:0.22,inv={},k,n=0,cw=0;
  for(k in MAP)inv[MAP[k]]=k;
  framesIn(el).forEach(function(f){
    if(n>=8)return;
    /* a frame with the focus in it keeps its focus rim */
    if(f.matches(':focus-within'))return;
    var b=f.getBoundingClientRect();if(!inView(b))return;
    var H=(f.style.getPropertyValue('--h')||getComputedStyle(f).getPropertyValue('--h')).trim().replace(/^"|"$/g,'');
    if(!H||/[\\"]/.test(H))return;
    if(!cw)cw=chw(doc.body);
    H=H.slice(0,Math.min(400,Math.ceil(b.width/cw)+1));
    if(!f.__auiRot)f.__auiRot={h:f.style.getPropertyValue('--h'),hb:f.style.getPropertyValue('--hb')};
    H=H.replace(/\S/g,function(c){
      if(Math.random()>p)return c;
      var i=RAMP.indexOf(inv[c]||c),o=tr(i>2?RAMP.charAt(i-2):'.');
      return /[\\"]/.test(o)?c:o;
    });
    f.style.setProperty('--h','"'+H+'"');f.style.setProperty('--hb','"'+H.split('').reverse().join('')+'"');
    n++;
  });
  if(n&&rotten.indexOf(el)<0)rotten.push(el);
  return n>0;
}
function rot(el){
  el=sigEl(el);if(!el||sigStill(el))return false;
  var ok=rotStep(el);if(ok)el.__auiRotN=(el.__auiRotN||0)+1;
  return ok;
}
function repair(el){
  if(el===undefined){rotten.slice().forEach(repair);return true}
  el=sigEl(el);if(!el)return false;
  framesIn(el).forEach(function(f){
    var o=f.__auiRot;if(!o)return;f.__auiRot=null;
    if(o.h)f.style.setProperty('--h',o.h);else f.style.removeProperty('--h');
    if(o.hb)f.style.setProperty('--hb',o.hb);else f.style.removeProperty('--hb');
  });
  el.__auiRotN=0;
  var i=rotten.indexOf(el);if(i>=0)rotten.splice(i,1);
  return true;
}
function rotWatch(el){
  var secs=Math.max(2,parseFloat(el.getAttribute('data-rot'))||14)*1000,job=null,
  w={el:el,arm:function(){if(!job)job=sigAt(secs,check)},end:function(){sigDrop(job);job=null;var i=rotW.indexOf(w);if(i>=0)rotW.splice(i,1);repair(el)}};
  function check(){
    var idle=snow()-idleAt;
    if(idle<secs)return secs-idle;
    if(sigStill(el)||(el.__auiRotN||0)>=[0,2,3,5][sigLevel(el)]){job=null;return 0}
    if(!rot(el)){job=null;return 0}
    return 1100;
  }
  rotW.push(w);w.arm();
  return w;
}
function sigTouch(){
  idleAt=snow();
  if(rotten.length)repair();
  rotW.forEach(function(w){w.arm()});
}
['pointerdown','pointermove','keydown','wheel','touchstart','scroll'].forEach(function(t){doc.addEventListener(t,sigTouch,{capture:true,passive:true})});
/* ASCIIUI.signal('loud') sets the level on the root, signal(null) takes it
   off, signal() says it */
function signalLevel(v){
  var r=doc.documentElement;
  if(v===null)r.removeAttribute('data-aui-signal-level');
  else if(v!==undefined&&Object.prototype.hasOwnProperty.call(SIGLV,String(v)))r.setAttribute('data-aui-signal-level',String(v));
  var l=sigLevel(r),k;for(k in SIGLV)if(SIGLV[k]===l)return k;
  return 'normal';
}

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

  /* a box around a plain <table class="tbl"> in a .tablewrap. A <th> with a
     <button> in it sorts its column: numbers, dates (yyyy-mm-dd) and words
     each sort as what they are, data-sort="num|date|text" on the th says so
     outright, data-value on a td sorts by that instead of its words.
     aria-sort="ascending" on a th in the html sorts on load. An input with
     data-aui-filter narrows the rows to the ones holding every word typed.
     data-select adds a column of checkboxes and a select-all; Shift picks a
     range. data-page-size="8" shows a page at a time and drives the
     [data-aui="pagination"] inside the box (or right after it).
     aria-busy="true" on the box draws skeleton rows until it goes. The
     .dt-count says how many rows show. Fires aui:sort and aui:select */
  datatable:function(el,cx){
    var table=el.querySelector('table');if(!table||!table.tHead||!table.tHead.rows.length)return;
    var body=table.tBodies[0]||table.appendChild(doc.createElement('tbody'));
    var head=table.tHead.rows[0],wrap=table.parentElement!==el&&table.parentElement.classList.contains('tablewrap')?table.parentElement:null;
    var count=el.querySelector('.dt-count'),input=el.querySelector('[data-aui-filter]'),pager=el.querySelector('[data-aui="pagination"]');
    if(!pager&&el.nextElementSibling&&el.nextElementSibling.matches('[data-aui="pagination"]'))pager=el.nextElementSibling;
    var pick=el.hasAttribute('data-select'),rows=[],shown=[],col=-1,dir='none',q='',page=1,anchor=null,shift=false,seq=0,made=[],all=null,wave=null,blank=null,skels=[];
    var NUM=/^[-+]?[$€£¥]?\s?\d[\d,]*(\.\d+)?\s?([a-z]{1,3}|%)?$/i,DATE=/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$/;
    function busy(){return el.getAttribute('aria-busy')==='true'}
    function words(c){return c?(c.hasAttribute('data-value')?c.getAttribute('data-value'):c.textContent).replace(/\s+/g,' ').trim():''}
    function data(r){return Array.prototype.filter.call(r.cells,function(c){return !c.classList.contains('dt-pick')})}
    function box(label){
      var l=doc.createElement('label');l.className='check';
      l.innerHTML='<input type="checkbox"><span class="glyph" aria-hidden="true"></span>';
      l.firstChild.setAttribute('aria-label',label);return l;
    }
    if(pick){
      var th=doc.createElement('th');th.scope='col';th.className='dt-pick';th.appendChild(box('Select all rows'));
      all=th.querySelector('input');head.insertBefore(th,head.firstChild);made.push(th);
    }
    /* the sortable columns: a th with a button, or a th with data-sort, which gets one */
    var cols=[];
    Array.prototype.forEach.call(head.cells,function(th){
      if(th.classList.contains('dt-pick')||th.getAttribute('data-sort')==='none')return;
      var b=th.querySelector('button');
      if(!b&&th.hasAttribute('data-sort')){
        b=doc.createElement('button');b.type='button';b.className='dt-sort';
        while(th.firstChild)b.appendChild(th.firstChild);th.appendChild(b);
        cx.later(function(){while(b.firstChild)th.appendChild(b.firstChild);b.remove()});
      }
      if(b)cols.push({th:th,btn:b});
    });
    function at(c){return c.th.cellIndex}
    /* the rows, in the order they came, each with its checkbox and its words */
    function read(){
      rows=Array.prototype.filter.call(body.rows,function(r){return r!==blank&&skels.indexOf(r)<0});
      rows.forEach(function(r){
        if(r.__dtI==null)r.__dtI=seq++;
        if(pick&&!r.__dtBox){
          var td=doc.createElement('td');td.className='dt-pick';
          var c=data(r)[0];td.appendChild(box('Select '+(c?words(c):'row')));
          r.insertBefore(td,r.firstChild);r.__dtBox=td.querySelector('input');
        }
        r.__dtText=data(r).map(function(c){return c.textContent}).join(' ').replace(/\s+/g,' ').toLowerCase();
      });
    }
    function kind(i){
      var c=cols.filter(function(x){return at(x)===i})[0],k=c&&c.th.getAttribute('data-sort');
      if(k==='num'||k==='date'||k==='text')return k;
      var vs=rows.map(function(r){return words(r.cells[i])}).filter(Boolean);
      if(!vs.length)return 'text';
      if(vs.every(function(v){return NUM.test(v)}))return 'num';
      if(vs.every(function(v){return DATE.test(v)}))return 'date';
      return 'text';
    }
    function key(v,k){
      if(v==='')return null;
      if(k==='num'){var n=parseFloat(v.replace(/[^\d.\-]/g,''));return isNaN(n)?null:n}
      if(k==='date'){var d=Date.parse(v.replace(' ','T'));return isNaN(d)?null:d}
      return v;
    }
    /* sorted by the column, the ones it cannot read last, ties in the order they came */
    function order(){
      var k=col<0?'':kind(col);
      var list=rows.map(function(r){return {r:r,v:col<0?null:key(words(r.cells[col]),k)}});
      list.sort(function(a,b){
        if(col>=0){
          if(a.v===null&&b.v!==null)return 1;
          if(b.v===null&&a.v!==null)return -1;
          if(a.v!==null){var c=k==='text'?String(a.v).localeCompare(String(b.v),undefined,{numeric:true,sensitivity:'base'}):a.v-b.v;if(c)return dir==='descending'?-c:c}
        }
        return a.r.__dtI-b.r.__dtI;
      });
      rows=list.map(function(x){return x.r});
      rows.forEach(function(r){body.appendChild(r)});
    }
    function hit(r){
      var w=q.toLowerCase().split(/\s+/).filter(Boolean);
      return w.every(function(x){return r.__dtText.indexOf(x)>=0});
    }
    function picked(){return rows.filter(function(r){return r.__dtBox&&r.__dtBox.checked})}
    function row(cls){var r=doc.createElement('tr'),td=doc.createElement('td');r.className=cls;td.colSpan=head.cells.length;r.appendChild(td);return r}
    /* The columns keep one width through rows, loading, empty, a filter and
       every page: each th gets the width, in characters, of its widest cell
       across all the rows. Measured when the rows change, never from the
       ones that happen to show. With no rows yet the head decides */
    var widths=[],was=Array.prototype.map.call(head.cells,function(th){return th.style.width}),tlw=[table.style.tableLayout,table.style.width];
    function fit(){
      if(!rows.length||!table.getClientRects().length)return;
      var cw=chw(el),hid=rows.filter(function(r){return r.hidden}),extra=skels.concat(blank?[blank]:[]);
      Array.prototype.forEach.call(head.cells,function(th,i){if(!th.classList.contains('dt-pick'))th.style.width=was[i]||''});
      rows.forEach(function(r){r.hidden=false});extra.forEach(function(r){r.hidden=true});
      table.style.tableLayout='';table.style.width='max-content';table.style.minWidth='0';
      widths=Array.prototype.map.call(head.cells,function(th){
        var w=th.getBoundingClientRect().width,cs=getComputedStyle(th);
        return w?Math.ceil((w-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight))/cw-0.05):0;
      });
      table.style.minWidth='';
      hid.forEach(function(r){r.hidden=true});extra.forEach(function(r){r.hidden=false});
      Array.prototype.forEach.call(head.cells,function(th,i){if(widths[i]&&!was[i]&&!th.classList.contains('dt-pick'))th.style.width=widths[i]+'ch'});
      /* fixed: the head's widths hold whatever rows show. The box's width at
         least; wider than that, it scrolls inside .tablewrap */
      table.style.tableLayout='fixed';table.style.width='100%';
      wide();
    }
    /* a column of numbers is marked, so it lines up on the right */
    var numd=[];
    function nums(){
      numd.forEach(function(c){c.classList.remove('dt-num')});numd=[];
      if(!rows.length)return;
      cols.forEach(function(c){
        var i=at(c);if(kind(i)!=='num')return;
        [c.th].concat(rows.map(function(r){return r.cells[i]})).forEach(function(x){if(x&&!x.classList.contains('dt-num')){x.classList.add('dt-num');numd.push(x)}});
      });
    }
    /* loading: rows of ramp with a wave through them, as many as a page, a
       strip in every column, each as long as the column is wide or shorter */
    function drawSkel(){
      var W='.:=+*#',f=wave?wave.f++:0,L=[0.9,0.6,0.8,0.5,0.7];
      skels.forEach(function(r,i){
        Array.prototype.forEach.call(r.cells,function(td,j){
          if(td.classList.contains('dt-pick'))return;
          var th=head.cells[j],n=widths[j]||(th?words(th).length+2:6),len=Math.max(1,Math.round(n*L[(i+j)%L.length])),s='',x;
          for(x=0;x<len;x++)s+=W.charAt(Math.floor((Math.sin((x-f+i*3+j*5)*0.35)+1)*2.99));
          td.textContent=tr(s);
        });
      });
    }
    function skelRow(){
      var r=doc.createElement('tr');r.className='dt-skel';r.setAttribute('aria-hidden','true');
      Array.prototype.forEach.call(head.cells,function(th){var td=doc.createElement('td');if(th.classList.contains('dt-pick'))td.className='dt-pick';r.appendChild(td)});
      return r;
    }
    function loading(on){
      if(on&&!skels.length){
        var n=clamp(+el.getAttribute('data-page-size')||5,3,10),i,r;
        for(i=0;i<n;i++){r=skelRow();skels.push(r);body.appendChild(r)}
        wave=new Ctx(el,'wave');wave.f=0;every(120,drawSkel,wave);
      }
      if(!on&&skels.length){skels.forEach(function(r){r.remove()});skels=[];if(wave){wave.end();wave=null}}
    }
    /* no rows match: the words, and a way back to all of them */
    function clearBtn(){
      var b=doc.createElement('button');b.type='button';b.className='dt-clear';b.textContent='Clear the filter';
      b.addEventListener('click',function(){q='';page=1;if(input){input.value='';input.focus()}show()});
      return b;
    }
    function tell(){
      if(!count)return;
      var s=picked().length;
      count.textContent=busy()?'Loading rows.':shown.length+' of '+rows.length+' row'+(rows.length===1?'':'s')+(s?', '+s+' selected':'')+'.';
    }
    function heads(){
      if(!all)return;
      var n=shown.filter(function(r){return r.__dtBox.checked}).length;
      all.checked=!!n&&n===shown.length;all.indeterminate=!!n&&n<shown.length;var mx=all.closest('.check');if(mx)mx.classList.toggle('dt-mixed',all.indeterminate);
      rows.forEach(function(r){r.classList.toggle('dt-on',r.__dtBox.checked)});
    }
    function wide(){if(wrap)wrap.toggleAttribute('data-wide',wrap.scrollWidth>wrap.clientWidth+2)}
    function show(){
      var b=busy(),size=pager?Math.max(0,Math.floor(+el.getAttribute('data-page-size')||0)):0;
      shown=rows.filter(hit);
      var pages=size?Math.max(1,Math.ceil(shown.length/size)):1;page=clamp(page,1,pages);
      var from=size?(page-1)*size:0,to=size?from+size:shown.length;
      rows.forEach(function(r){r.hidden=true});
      shown.forEach(function(r,i){r.hidden=b||i<from||i>=to});
      loading(b);
      var msg=b?'':!rows.length?(el.getAttribute('data-empty')||'No rows yet.'):!shown.length?(el.getAttribute('data-no-match')||'No rows match.'):'';
      if(msg){
        if(!blank)blank=row('dt-empty');
        var cell=blank.firstChild;cell.colSpan=head.cells.length;cell.textContent=msg;
        if(rows.length&&q&&!b)cell.appendChild(clearBtn());
        body.appendChild(blank);
      }
      else if(blank)blank.remove();
      if(pager&&size){
        if(pager.getAttribute('data-pages')!==String(pages))pager.setAttribute('data-pages',pages);
        if(pager.getAttribute('data-page')!==String(page))pager.setAttribute('data-page',page);
      }
      /* nothing to page through: no pager */
      if(pager&&size)pager.hidden=b||!shown.length;
      heads();tell();wide();
      mo.takeRecords();
    }
    function sortBy(i,d){
      col=d==='ascending'||d==='descending'?i:-1;dir=col<0?'none':d;
      cols.forEach(function(c){c.th.setAttribute('aria-sort',at(c)===col?dir:'none')});
      order();show();
    }
    /* the rows the page's own script adds or takes away are read again */
    var mo=new MutationObserver(function(){read();nums();order();show();fit()});
    var ma=new MutationObserver(function(){show()});
    cols.forEach(function(c){
      cx.on(c.btn,'click',function(){
        var i=at(c),d=col!==i?'ascending':dir==='ascending'?'descending':'none';
        sortBy(i,d);emit(el,'sort',{column:cols.indexOf(c),dir:dir,th:c.th});
      });
    });
    if(input)cx.on(input,'input',function(){q=input.value;page=1;show()});
    if(pager)cx.on(pager,'aui:change',function(e){if(e.target===pager){page=e.detail.page;show()}});
    /* Shift with a click or with Space picks every row between this one and the last one picked */
    cx.on(table,'pointerdown',function(e){shift=e.shiftKey});
    cx.on(table,'keydown',function(e){if(e.key===' ')shift=e.shiftKey});
    cx.on(table,'click',function(e){
      var i=e.target;if(!pick||i.type!=='checkbox'||!i.closest('.dt-pick'))return;
      var sh=e.shiftKey||shift;shift=false;
      if(i===all){shown.forEach(function(r){r.__dtBox.checked=all.checked});anchor=null}
      else{
        var r=i.closest('tr'),a=shown.indexOf(anchor),b=shown.indexOf(r),k;
        if(sh&&a>=0&&b>=0)for(k=Math.min(a,b);k<=Math.max(a,b);k++)shown[k].__dtBox.checked=i.checked;
        anchor=r;
      }
      heads();tell();
      var p=picked();emit(el,'select',{rows:p,count:p.length});
    });
    var ro=window.ResizeObserver&&wrap?new ResizeObserver(wide):null;
    if(ro)ro.observe(wrap);else cx.on(window,'resize',wide);
    cx.later(function(){
      mo.disconnect();ma.disconnect();if(ro)ro.disconnect();loading(false);if(blank)blank.remove();
      rows.forEach(function(r){r.hidden=false;r.classList.remove('dt-on');if(r.__dtBox){r.__dtBox.closest('td').remove();r.__dtBox=null}});
      numd.forEach(function(c){c.classList.remove('dt-num')});
      Array.prototype.forEach.call(head.cells,function(th,i){if(th.classList.contains('dt-pick'))return;th.style.width=was[i]||'';if(!th.getAttribute('style'))th.removeAttribute('style')});
      table.style.tableLayout=tlw[0];table.style.width=tlw[1];if(!table.getAttribute('style'))table.removeAttribute('style');
      made.forEach(function(m){m.remove()});if(wrap)wrap.removeAttribute('data-wide');if(pager)pager.hidden=false;
    });
    read();nums();
    var first=cols.filter(function(c){var s=c.th.getAttribute('aria-sort');return s==='ascending'||s==='descending'})[0];
    if(first)sortBy(at(first),first.th.getAttribute('aria-sort'));
    else{cols.forEach(function(c){c.th.setAttribute('aria-sort','none')});show()}
    mo.observe(body,{childList:true});
    ma.observe(el,{attributes:true,attributeFilter:['aria-busy','data-page-size']});
    fit();
    if(doc.fonts)doc.fonts.ready.then(function(){if(!cx.dead)fit()});
    /* hidden when it was wired (a closed tab, a dialog): measured when it shows */
    if(!widths.length&&window.IntersectionObserver){var fio=new IntersectionObserver(function(es){if(es[es.length-1].isIntersecting&&!widths.length)fit();if(widths.length)fio.disconnect()});fio.observe(table);cx.later(function(){fio.disconnect()})}
    function set(fn){read();fn();nums();order();show();fit()}
    return {
      sort:function(i,d){var c=cols[i];if(c)sortBy(at(c),d||'ascending')},
      filter:function(t){q=String(t==null?'':t);if(input)input.value=q;page=1;show()},
      select:function(which){set(function(){rows.forEach(function(r){if(r.__dtBox)r.__dtBox.checked=which==='all'||Array.isArray(which)&&which.indexOf(r)>=0})})},
      refresh:function(){set(function(){})},
      get rows(){return shown.slice()},
      get selected(){return picked()},
      get page(){return page}
    };
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

  /* .pop holding a button and a .pane: the button opens the pane next to
     it, a panel for a few controls. Not modal, the page stays live. The
     focus goes in; Escape and a data-aui-close inside put it away and bring
     the focus back; a click outside or Tab past the end just put it away. A
     form with method="dialog" inside closes it once it is sent, so a bad
     field keeps it open. Fires aui:toggle with { open } */
  popover:function(pop,cx){
    var btn=kid(pop,'[aria-haspopup]'),pane=kid(pop,'.pane');
    if(!btn||!pane)return;
    var f=float(pane,cx);
    btn.setAttribute('aria-controls',uid(pane,'pane'));btn.setAttribute('aria-expanded','false');
    if(!pane.hasAttribute('role'))pane.setAttribute('role','dialog');
    var t=pane.querySelector('.bar-title');
    if(t&&!pane.hasAttribute('aria-label')&&!pane.hasAttribute('aria-labelledby'))pane.setAttribute('aria-labelledby',uid(t,'title'));
    function where(){f.place(btn.getBoundingClientRect(),false,true)}
    /* o.user: a person did it, so it fires. o.focus: the focus goes in.
       o.back: the focus comes back to the button */
    function set(on,o){
      o=o||{};if(on===f.isOpen)return;
      if(on){f.show();f.place(btn.getBoundingClientRect());if(o.focus)firstStop(pane).focus()}
      else{f.hide();if(o.back)btn.focus()}
      btn.setAttribute('aria-expanded',on?'true':'false');
      if(o.user)emit(pop,'toggle',{open:on});
    }
    cx.on(btn,'click',function(){set(!f.isOpen,{user:true,focus:true})});
    /* a list or a menu inside that took the Escape keeps the pane open */
    cx.on(pop,'keydown',function(e){if(e.key==='Escape'&&f.isOpen&&!e.defaultPrevented){e.preventDefault();set(false,{user:true,back:true})}});
    cx.on(doc,'pointerdown',function(e){if(f.isOpen&&!pop.contains(e.target))set(false,{user:true})});
    cx.on(pop,'focusout',function(e){if(f.isOpen&&e.relatedTarget&&!pop.contains(e.relatedTarget))set(false,{user:true})});
    cx.on(pane,'click',function(e){var c=e.target.closest('[data-aui-close]');if(c&&!c.disabled&&c.closest('.pane')===pane)set(false,{user:true,back:true})});
    cx.on(pane,'submit',function(e){if((e.target.getAttribute('method')||'').toLowerCase()==='dialog'&&e.target.closest('.pane')===pane){e.preventDefault();set(false,{user:true,back:true})}});
    cx.on(window,'resize',function(){if(f.isOpen)where()});
    cx.on(doc,'scroll',function(e){if(f.isOpen&&!(e.target.nodeType===1&&pane.contains(e.target)))where()},true);
    return {open:function(){set(true)},close:function(){set(false)},toggle:function(){set(!f.isOpen)},get isOpen(){return f.isOpen}};
  },

  /* .combo holding a .field with an input[role=combobox], and a .pane with a
     [role=listbox] of [role=option]. Typing narrows the list (every word you
     type starts a word of the option, accents and case aside), arrows move,
     Enter or a click picks. It takes what is on the list: leave it with
     words that match nothing and nothing picked, and it says so (data-free
     takes any text). A pick is aria-selected="true" or data-value on the
     .combo; data-name="x" adds a hidden input with the pick's data-value.
     data-empty is what it says when nothing matches. Fires aui:change with
     { value, label, option } */
  combobox:function(box,cx){
    var inp=box.querySelector('input[role="combobox"]'),pane=kid(box,'.pane'),list=pane&&pane.querySelector('[role="listbox"]');
    if(!inp||!list)return;
    var field=inp.closest('.field')||inp,f=float(pane,cx),hid=hiddenIn(box,box.getAttribute('data-name'));
    var act=null,sel=null,typed=false,none=null,tellT=0,mine=false;
    var out=byId((inp.getAttribute('aria-describedby')||'').split(' ')[0])||near(inp,null,'.error');
    if(out&&!inp.hasAttribute('aria-describedby'))inp.setAttribute('aria-describedby',uid(out,'error'));
    /* the count, read out once typing stops; the list itself shows it */
    var live=doc.createElement('span');live.className='vh';live.setAttribute('aria-live','polite');box.appendChild(live);
    cx.later(function(){clearTimeout(tellT);live.remove();if(none)none.remove()});
    var opts=function(){return all('[role="option"]',list)};
    var off=function(o){return o.getAttribute('aria-disabled')==='true'};
    var text=function(o){return (o.getAttribute('data-label')||o.textContent).replace(/\s+/g,' ').trim()};
    var val=function(o){return o.hasAttribute('data-value')?o.getAttribute('data-value'):text(o)};
    var fold=function(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')};
    var WORD=/[^\p{L}\p{N}]+/u;
    /* how well o answers q: -1 not at all, else the word the first typed word
       starts, so fra puts fra-1, Frankfurt before sfo-1, San Francisco */
    function rank(o,q){
      var ws=fold(text(o)).split(WORD).filter(Boolean),ts=fold(q).split(WORD).filter(Boolean),i;
      if(!ts.length)return 0;
      if(!ts.every(function(t){return ws.some(function(w){return w.indexOf(t)===0})}))return -1;
      for(i=0;i<ws.length;i++)if(ws[i].indexOf(ts[0])===0)return i;
      return ws.length;
    }
    var seq=0;function at(o){if(o.__auiI===undefined)o.__auiI=seq++;return o.__auiI}
    inp.setAttribute('aria-controls',uid(list,'list'));inp.setAttribute('aria-autocomplete','list');inp.setAttribute('aria-expanded','false');
    if(!inp.hasAttribute('autocomplete'))inp.setAttribute('autocomplete','off');
    var lab=inp.labels&&inp.labels[0];
    if(lab&&!list.hasAttribute('aria-label')&&!list.hasAttribute('aria-labelledby'))list.setAttribute('aria-labelledby',uid(lab,'label'));
    opts().forEach(function(o){uid(o,'opt');at(o)});
    /* the matches, best first, then the rest hidden; the html order when q is empty */
    function draw(q){
      var n=0,first=null,os=opts(),rs=new Map();
      os.forEach(function(o){uid(o,'opt');at(o);var r=rank(o,q);rs.set(o,r);o.hidden=r<0;if(r>=0)n++});
      var want=os.slice().sort(function(a,b){var x=rs.get(a),y=rs.get(b);x=x<0?1e9:x;y=y<0?1e9:y;return x-y||at(a)-at(b)});
      if(want.some(function(o,i){return o!==os[i]}))want.forEach(function(o){list.appendChild(o)});
      want.forEach(function(o){if(!first&&!o.hidden&&!off(o))first=o});
      if(!none){none=doc.createElement('p');none.className='opts-none';list.parentNode.insertBefore(none,list.nextSibling)}
      none.textContent=box.getAttribute('data-empty')||'Nothing matches.';none.hidden=n>0;
      return {n:n,first:first};
    }
    function into(o){var t=o.offsetTop,h=o.offsetHeight,s=list.scrollTop,c=list.clientHeight;if(t<s)list.scrollTop=t;else if(t+h>s+c)list.scrollTop=t+h-c}
    /* the option the arrows are on: the focus, though the caret stays in the field */
    function mark(o,scroll){
      if(act)act.removeAttribute('data-active');act=o||null;
      if(act){act.setAttribute('data-active','');inp.setAttribute('aria-activedescendant',act.id);if(scroll!==false)into(act)}
      else inp.removeAttribute('aria-activedescendant');
    }
    function err(msg){mine=!!msg;field.classList.toggle('invalid',!!msg);inp.setAttribute('aria-invalid',msg?'true':'false');if(out)out.textContent=msg||''}
    /* the list hangs from the field; above it, it clears the label too, so the name stays in view */
    function anchor(){
      var r=field.getBoundingClientRect(),a={left:r.left,right:r.right,top:r.top,bottom:r.bottom};
      if(lab){var l=lab.getBoundingClientRect();if(l.height&&l.bottom<=r.top+1&&r.top-l.bottom<rowh())a.top=l.top}
      return a;
    }
    function show(q){
      var fresh=!f.isOpen,r=draw(q);
      if(fresh){f.show();inp.setAttribute('aria-expanded','true')}
      pane.style.width=Math.round(field.getBoundingClientRect().width+2*CW)+'px';
      f.place(anchor(),false,!fresh);
      return r;
    }
    function hide(){if(!f.isOpen)return;f.hide();inp.setAttribute('aria-expanded','false');mark(null)}
    function tell(n){clearTimeout(tellT);tellT=setTimeout(function(){live.textContent=n?(n===1?'1 match.':n+' matches.'):none.textContent},500)}
    function pick(o,user){
      sel=o||null;typed=false;
      opts().forEach(function(x){if(x===sel)x.setAttribute('aria-selected','true');else x.removeAttribute('aria-selected')});
      inp.value=sel?text(sel):'';inp.setCustomValidity('');if(mine)err('');
      if(hid)hid.value=sel?val(sel):'';
      say(box,sel?'Picked '+text(sel)+'.':'Nothing picked.');
      if(user){inp.dispatchEvent(new Event('change',{bubbles:true}));emit(box,'change',{value:sel?val(sel):'',label:sel?text(sel):'',option:sel})}
    }
    /* leaving the field: the words must be an option, or nothing */
    function commit(){
      var t=inp.value.replace(/\s+/g,' ').trim();
      if(sel&&t===text(sel)){typed=false;return}
      if(!t){if(sel)pick(null,true);typed=false;return}
      var ex=opts().filter(function(o){return !off(o)&&fold(text(o))===fold(t)})[0];
      if(ex){pick(ex,true);return}
      if(box.hasAttribute('data-free')){sel=null;opts().forEach(function(x){x.removeAttribute('aria-selected')});if(hid)hid.value=t;typed=false;emit(box,'change',{value:t,label:t,option:null});return}
      if(sel){inp.value=text(sel);typed=false;return}   /* typed over a pick: the pick stays */
      var m=box.getAttribute('data-error-list')||'Pick one from the list.';inp.setCustomValidity(m);err(m);
    }
    var vis=function(){return opts().filter(function(o){return !o.hidden&&!off(o)})};
    cx.on(inp,'input',function(){
      if(resetting)return;
      typed=true;inp.setCustomValidity('');if(mine)err('');
      var q=inp.value.trim(),r=show(q);mark(q?r.first:null);tell(r.n);
    });
    cx.on(inp,'keydown',function(e){
      if(e.isComposing)return;
      var k=e.key,v=vis(),i=v.indexOf(act);
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){
        e.preventDefault();
        if(!f.isOpen){
          show(typed?inp.value.trim():'');v=vis();
          var at=sel&&!sel.hidden&&!off(sel)?sel:null;
          mark(e.altKey?at:(at||(e.key==='ArrowDown'?v[0]:v[v.length-1])));
          return;
        }
        if(v.length)mark(e.key==='ArrowDown'?v[(i+1)%v.length]:v[i<0?v.length-1:(i-1+v.length)%v.length]);
      }
      else if((e.key==='PageDown'||e.key==='PageUp')&&f.isOpen&&v.length){e.preventDefault();mark(v[clamp((i<0?0:i)+(e.key==='PageDown'?5:-5),0,v.length-1)])}
      else if(e.key==='Enter'){
        if(f.isOpen){e.preventDefault();var a=act;hide();if(a)pick(a,true);else commit()}
        else commit();   /* closed: settle the words first, so a form sends what the field says, or stops */
      }
      else if(e.key==='Escape'&&f.isOpen){e.preventDefault();hide();if(sel){inp.value=text(sel);typed=false;if(mine)err('')}}
      else if(e.key==='Tab')hide();
    });
    /* the whole frame opens the list; the v in it closes it again */
    cx.on(field,'mousedown',function(e){if(e.target!==inp&&!inp.disabled)e.preventDefault()});
    cx.on(field,'click',function(e){
      if(inp.disabled)return;
      if(f.isOpen&&e.target.closest('.prompt')){hide();return}
      if(!f.isOpen){show(typed?inp.value.trim():'');mark(sel&&!sel.hidden?sel:null)}
      if(doc.activeElement!==inp)inp.focus();
    });
    cx.on(pane,'mousedown',function(e){e.preventDefault()});   /* the caret stays in the field */
    cx.on(list,'pointermove',function(e){var o=e.target.closest('[role="option"]');if(o&&o!==act&&!off(o))mark(o,false)});
    cx.on(list,'click',function(e){var o=e.target.closest('[role="option"]');if(!o||off(o))return;hide();pick(o,true);if(doc.activeElement!==inp)inp.focus()});
    cx.on(inp,'blur',function(){hide();if(!resetting)commit()});
    cx.on(window,'resize',function(){if(f.isOpen)f.place(anchor(),false,true)});
    cx.on(doc,'scroll',function(e){if(f.isOpen&&!(e.target.nodeType===1&&pane.contains(e.target)))f.place(anchor(),false,true)},true);
    /* what the html picks: data-value on the .combo, an option with
       aria-selected="true", or words in the field that are an option */
    function asked(){
      var v=box.getAttribute('data-value'),o=null;
      if(v!==null)o=opts().filter(function(x){return val(x)===v})[0]||null;
      if(!o)o=opts().filter(function(x){return x.getAttribute('aria-selected')==='true'})[0]||null;
      if(!o&&inp.defaultValue)o=opts().filter(function(x){return fold(text(x))===fold(inp.defaultValue.trim())})[0]||null;
      return o;
    }
    function back(){setTimeout(function(){if(box.isConnected){hide();pick(asked(),false);err('')}},0)}
    cx.on(doc,'reset',function(e){if(e.target.contains&&e.target.contains(box))back()});
    cx.on(doc,'aui:reset',function(e){if(e.target.contains(box))back()});
    cx.attr=function(name){
      if(name==='data-name'){hid=hiddenIn(box,box.getAttribute('data-name'));if(hid)hid.value=sel?val(sel):''}
      else if(name==='data-value')pick(asked(),false);
    };
    var start=asked();
    if(start||!inp.value)pick(start,false);
    return {
      open:function(){show(typed?inp.value.trim():'');mark(sel&&!sel.hidden?sel:null)},
      close:hide,
      set:function(v){
        if(v===null||v===undefined||v===''){pick(null,false);return true}
        var o=opts().filter(function(x){return val(x)===String(v)})[0];if(!o)return false;pick(o,false);return true;
      },
      get value(){return sel?val(sel):(box.hasAttribute('data-free')?inp.value.trim():'')},
      get label(){return sel?text(sel):''},
      get option(){return sel},
      get isOpen(){return f.isOpen}
    };
  },

  /* .ctx holding anything and a [role=menu] (a .menu .pane). A right-click
     inside it, a long press on a touch screen, or Shift F10 or the Menu key
     on something focused in it open the menu there. Arrows, Home, End and a
     first letter move; the letter in an item's <kbd> picks it; Escape and Tab
     close it and bring the focus back. Shift and right-click still gets the
     browser's own menu, and so do links and text fields. The row it acts on
     wears data-ctx while it is open. The nearest role="status" says what was
     picked, on what. Fires aui:select with { item, text, target }, target
     being the row, list item or focusable element it opened on */
  contextmenu:function(box,cx){
    var menu=kid(box,'[role="menu"]');if(!menu)return;
    var f=float(menu,cx),target=null,from=null,quiet=0,eat=0,lp=null,touch=false;
    var items=function(){return all('[role="menuitem"]',menu).filter(function(x){return !x.disabled&&x.getAttribute('aria-disabled')!=='true'&&!x.hidden})};
    var words=function(it){var c=it.cloneNode(true);all('kbd',c).forEach(function(k){k.remove()});return c.textContent.replace(/\s+/g,' ').trim()};
    /* the letter in a <kbd> is a shortcut, not part of the name: "Open", shortcut O, not "Open [o]" */
    all('[role="menuitem"]',menu).forEach(function(it){var k=it.querySelector('kbd');if(!k)return;k.setAttribute('aria-hidden','true');if(!it.hasAttribute('aria-keyshortcuts'))it.setAttribute('aria-keyshortcuts',k.textContent.trim())});
    function on(el){var t=el&&el.closest?el.closest('tr,li,[tabindex],a,button'):null;return t&&t!==box&&box.contains(t)&&!menu.contains(t)?t:box}
    function name(t){if(!t||t===box)return '';var c=t.cells&&t.cells[0];return (t.getAttribute('aria-label')||(c?c.textContent:t.textContent)).replace(/\s+/g,' ').trim().slice(0,40)}
    /* x, y: where, in the window. Without them it opens under t, two characters in */
    function openAt(x,y,t){
      if(!items().length)return false;   /* nothing to offer: the browser's own menu */
      if(!f.isOpen)from=doc.activeElement;
      if(target&&target!==t)target.removeAttribute('data-ctx');
      target=t;if(t!==box)t.setAttribute('data-ctx','');
      f.show();
      var cw=CW,rh=rowh(),o=box.getBoundingClientRect(),snap=function(v,o0,u,up){return o0+(up?Math.ceil:Math.floor)((v-o0)/u)*u};
      if(x===null){var r=t.getBoundingClientRect(),kx=snap(r.left+2*cw,o.left,cw);f.place({left:kx,right:kx,top:r.top,bottom:r.bottom},false)}
      else{var px=snap(x,o.left,cw);f.place({left:px,right:px,top:snap(y,o.top,rh),bottom:snap(y,o.top,rh,true)},true)}
      items()[0].focus();
      return true;
    }
    function close(back){
      if(!f.isOpen)return;
      /* closed by a scroll or a click away with the focus still inside: it goes back too, never stays in a hidden menu */
      if(menu.contains(doc.activeElement))back=true;
      f.hide();
      if(target)target.removeAttribute('data-ctx');
      if(back){var b=from&&from!==doc.body&&from.isConnected&&!menu.contains(from)?from:(target&&target!==box&&target.matches(TABBABLE)?target:null);if(b)b.focus()}
      from=null;
    }
    cx.on(box,'contextmenu',function(e){
      if(menu.contains(e.target)||Date.now()<quiet){e.preventDefault();return}   /* the keyboard or a long press opened it a moment ago */
      if(e.shiftKey||e.target.closest('input,textarea,select,[contenteditable],a[href]'))return;
      /* a menu key on a browser that sends one, or a finger on a row: then it
         opens under the row, where it does not cover what it acts on */
      var t=on(e.target),kb=(!e.clientX&&!e.clientY)||((touch||e.pointerType==='touch')&&t!==box);
      if(openAt(kb?null:e.clientX,kb?null:e.clientY,t))e.preventDefault();
    });
    cx.on(box,'keydown',function(e){
      if(menu.contains(e.target))return;
      if(e.key==='ContextMenu'||(e.key==='F10'&&e.shiftKey)){if(openAt(null,null,on(e.target))){e.preventDefault();quiet=Date.now()+400}}
    });
    /* touch: press and hold half a second, without moving */
    cx.on(box,'pointerdown',function(e){
      touch=e.pointerType==='touch';
      if(!touch||!e.isPrimary||menu.contains(e.target)||e.target.closest('input,textarea,select,a[href]'))return;
      if(lp)clearTimeout(lp.id);
      var x=e.clientX,y=e.clientY,t=on(e.target),row=t!==box;
      lp={x:x,y:y,id:setTimeout(function(){lp=null;if(openAt(row?null:x,row?null:y,t)){quiet=Date.now()+800;eat=Date.now()+800}},500)};
    });
    function drop(e){if(!lp)return;if(e.type==='pointermove'&&Math.abs(e.clientX-lp.x)<10&&Math.abs(e.clientY-lp.y)<10)return;clearTimeout(lp.id);lp=null}
    ['pointerup','pointercancel','pointermove'].forEach(function(t){cx.on(box,t,drop)});
    cx.later(function(){if(lp)clearTimeout(lp.id)});
    /* the finger that held it lifts: that click is not a pick */
    cx.on(doc,'pointerdown',function(e){eat=0;if(e.pointerType!=='touch')quiet=0;if(f.isOpen&&!menu.contains(e.target))close(false)},true);
    cx.on(box,'click',function(e){if(Date.now()<eat){e.preventDefault();e.stopPropagation();eat=0}},true);
    /* and the mouse events a browser makes up after it would move the focus out of the menu */
    cx.on(box,'touchend',function(e){if(Date.now()<eat&&e.cancelable)e.preventDefault()});
    cx.on(menu,'keydown',function(e){
      var it=items(),i=it.indexOf(doc.activeElement),n=null,k=e.key;
      if(e.key==='ArrowDown')n=it[(i+1)%it.length];
      else if(e.key==='ArrowUp')n=it[(i-1+it.length)%it.length];
      else if(e.key==='Home')n=it[0];
      else if(e.key==='End')n=it[it.length-1];
      else if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();close(true);return}
      else if(k.length===1&&k!==' '&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
        var l=k.toLowerCase(),hit=it.filter(function(x){var b=x.querySelector('kbd');return b&&b.textContent.trim().toLowerCase()===l})[0];
        if(hit){e.preventDefault();hit.click();return}
        for(var j=1;j<=it.length&&!n;j++){var c=it[(i+j+it.length)%it.length];if(words(c).toLowerCase().indexOf(l)===0)n=c}
      }
      if(n){e.preventDefault();n.focus()}
    });
    cx.on(menu,'click',function(e){
      var it=e.target.closest('[role="menuitem"]');if(!it||it.disabled||it.getAttribute('aria-disabled')==='true')return;
      var t=target,w=words(it),nm=name(t);close(true);target=null;
      say(box,w+(nm?': '+nm:'')+'.');
      emit(box,'select',{item:it,text:w,target:t});
    });
    cx.on(menu,'focusout',function(e){if(f.isOpen&&e.relatedTarget&&!menu.contains(e.relatedTarget))close(false)});
    cx.on(doc,'scroll',function(e){drop(e);if(f.isOpen&&!(e.target.nodeType===1&&menu.contains(e.target)))close(false)},true);
    cx.on(window,'resize',function(){if(f.isOpen)close(false)});
    return {
      open:function(at){if(at&&at.nodeType===1)openAt(null,null,on(at));else if(at)openAt(at.x,at.y,box);else openAt(null,null,box)},
      close:function(){close(false)},
      get isOpen(){return f.isOpen},
      get target(){return f.isOpen?target:null}
    };
  },

  /* an input in an alert dialog, data-match="the words to type": the
     dialog's danger buttons stay disabled until the input holds exactly
     those words. Enter with them wrong says what to type, and so does a
     pause (once the words cannot become the name) or leaving the field.
     Every time the dialog opens it starts empty */
  confirm:function(inp,cx){
    var want=(inp.getAttribute('data-match')||'').trim(),box=inp.closest('dialog')||inp.form||inp.parentElement;
    var field=inp.closest('.field'),out=byId((inp.getAttribute('aria-describedby')||'').split(' ')[0])||near(inp,null,'.error');
    if(out&&!inp.hasAttribute('aria-describedby'))inp.setAttribute('aria-describedby',uid(out,'error'));
    var btns=function(){return all('.btn-danger',box)};
    function mark(msg){if(field)field.classList.toggle('invalid',!!msg);inp.setAttribute('aria-invalid',msg?'true':'false');if(out)out.textContent=msg||''}
    function check(){var ok=!!want&&inp.value.trim()===want;btns().forEach(function(b){b.disabled=!ok});return ok}
    var said=function(){return inp.getAttribute('data-error')||'Type '+want+' exactly.'},pause=null;
    /* wrong and typed: a pause says so once the words stop being the start
       of the name, leaving the field says so always */
    var wrong=function(all){var v=inp.value.trim();return !!v&&v!==want&&(all||want.indexOf(v)!==0)};
    cx.on(inp,'input',function(){mark('');check();clearTimeout(pause);pause=setTimeout(function(){if(inp.isConnected&&wrong(false))mark(said())},900)});
    /* not when the way out is a button next to it: the line would push Cancel down mid-press */
    var toBtn=false;
    cx.on(box,'pointerdown',function(e){toBtn=!!(e.target.closest&&e.target.closest('button'))});
    cx.on(inp,'blur',function(e){clearTimeout(pause);var r=e.relatedTarget,b=toBtn||!!(r&&r.tagName==='BUTTON'&&box.contains(r));toBtn=false;if(!b&&wrong(true))mark(said())});
    cx.later(function(){clearTimeout(pause)});
    cx.on(inp,'keydown',function(e){
      if(e.key!=='Enter')return;e.preventDefault();clearTimeout(pause);
      if(check()){var b=btns()[0];if(b)b.click()}
      else mark(said());
    });
    if(box.localName==='dialog'){
      var mo=new MutationObserver(function(){clearTimeout(pause);if(box.open){inp.value='';mark('');check()}});
      mo.observe(box,{attributes:true,attributeFilter:['open']});cx.later(function(){mo.disconnect()});
    }
    check();
    return {check:check,get ok(){return !!want&&inp.value.trim()===want}};
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
    /* user: a person typed or pasted it. On load and from value= it stays quiet */
    function check(user){
      var v=val(),ok=new RegExp('^\\d{'+n+'}$').test(v);
      if(hid)hid.value=v;
      right();
      box.classList.toggle('good',ok);
      say(box,ok?'Code '+v+' accepted.':v.length+' of '+n+'.');
      if(ok&&user&&!resetting)emit(box,'complete',{value:v});
    }
    /* a letter typed or pasted: the brackets turn to !, the box is invalid
       and the status line says so (data-error for other words). The next
       digit, or Backspace, puts it right */
    function wrong(inp){
      box.classList.remove('good');box.classList.add('invalid');inp.setAttribute('aria-invalid','true');
      say(box,box.getAttribute('data-error')||'Digits only.');
    }
    function right(){
      if(!box.classList.contains('invalid'))return;
      box.classList.remove('invalid');ins.forEach(function(i){i.removeAttribute('aria-invalid')});
    }
    cx.later(right);
    function fill(t,from){
      if(!/\d/.test(t)){if(t.trim())wrong(ins[from]);return}
      t=t.replace(/\D/g,'').slice(0,n-from);
      t.split('').forEach(function(c,k){ins[from+k].value=c});
      (ins[Math.min(n-1,from+t.length)]).focus();check(true);
    }
    ins.forEach(function(inp,i){
      /* a full box takes the new digit instead of refusing it */
      cx.on(inp,'beforeinput',function(e){
        if(!e.data)return;e.preventDefault();
        var d=e.data.replace(/\D/g,'');if(d.length>1){fill(d,i);return}
        if(!d){if(e.data.trim())wrong(inp);return}
        inp.value=d;inp.dispatchEvent(new Event('input',{bubbles:true}));
      });
      cx.on(inp,'focus',function(){inp.select()});
      cx.on(inp,'input',function(){
        if(resetting){check();return}
        var raw=inp.value,d=raw.replace(/\D/g,'');
        if(d.length>1){fill(d,i);return}   /* the whole code, autofilled into one box */
        inp.value=d;
        if(!d&&raw.trim()){wrong(inp);return}   /* a keyboard that sends no beforeinput */
        if(inp.value&&ins[i+1])ins[i+1].focus();check(true);
      });
      cx.on(inp,'keydown',function(e){
        if(e.key==='Backspace'&&!inp.value&&ins[i-1]){e.preventDefault();ins[i-1].value='';ins[i-1].focus();check(true)}
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
    var today=day(new Date());
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
    /* the day data-value picks, when it is a date inside data-min and
       data-max. Without one nothing is picked: today is shown and focused,
       and the hidden input stays empty until a person picks */
    function asked(){var d=parseDate(el.getAttribute('data-value'));return d&&ok(d)?d:null}
    /* the day shown when none is picked: today, or the allowed day nearest
       to a data-value outside the range */
    function home(){return fit(parseDate(el.getAttribute('data-value'))||today)}
    var start=asked(),sel=start,
        view=(function(d){return new Date(d.getFullYear(),d.getMonth(),1)})(sel||home()),foc=sel||home();
    var same=function(a,b){return !!a&&!!b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()};
    /* a new month is said out loud: the arrows' buttons keep the focus, so
       nothing else would tell a screen reader where it is now. The region
       stays put while the month is redrawn around it */
    var live=doc.createElement('span');live.className='vh';live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');
    cx.later(function(){live.remove()});
    function month(){return view.toLocaleDateString(c.loc,{month:'long',year:'numeric'})}
    function moved(was){if(was!==view.getFullYear()*12+view.getMonth())live.textContent=month()+'.'}
    function at(){return view.getFullYear()*12+view.getMonth()}
    /* one Tab stop for the month: only the focused day is in the tab order */
    function draw(){
      c=conf();
      var y=view.getFullYear(),m=view.getMonth(),lead=(new Date(y,m,1).getDay()-c.ws+7)%7,n=new Date(y,m+1,0).getDate(),d,dt,k;
      if(foc.getFullYear()!==y||foc.getMonth()!==m)foc=(sel&&sel.getFullYear()===y&&sel.getMonth()===m)?sel:new Date(y,m,Math.min(foc.getDate(),n));
      if(!ok(foc))foc=fit(foc);
      var prevOff=c.min&&new Date(y,m,0)<c.min,nextOff=c.max&&new Date(y,m+1,1)>c.max;
      var h='<div class="cal-head"><button class="ibtn" type="button" data-d="-1" aria-label="Previous month"'+(prevOff?' disabled':'')+'>&lt;</button><span>'+
        esc(month())+'</span><button class="ibtn" type="button" data-d="1" aria-label="Next month"'+(nextOff?' disabled':'')+'>&gt;</button></div><div class="cal-grid">';
      for(k=0;k<7;k++)h+='<span aria-hidden="true">'+esc(new Date(2023,0,1+(c.ws+k)%7).toLocaleDateString(c.loc,{weekday:'narrow'}))+'</span>';
      for(d=0;d<lead;d++)h+='<span></span>';
      for(d=1;d<=n;d++){
        dt=new Date(y,m,d);
        h+='<button type="button" data-day="'+d+'" tabindex="'+(same(dt,foc)?0:-1)+'" class="'+(same(dt,today)?'today':'')+'" aria-pressed="'+(same(dt,sel)?'true':'false')+'"'+
          (ok(dt)?'':' disabled')+' aria-label="'+esc(dt.toLocaleDateString(c.loc,{weekday:'long',day:'numeric',month:'long'}))+'">'+d+'</button>';
      }
      Array.prototype.slice.call(el.childNodes).forEach(function(x){if(x!==live)el.removeChild(x)});
      el.insertAdjacentHTML('afterbegin',h+'</div>');
      if(live.parentNode!==el)el.appendChild(live);
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
        var was=at();view=new Date(view.getFullYear(),view.getMonth()+(+b.dataset.d),1);draw();moved(was);
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
      e.preventDefault();var was=at();show(fit(d),true);moved(was);
    });
    /* a reset of its form, or of the dialog it sits in, puts back data-value,
       or nothing picked when there is none */
    function back(){c=conf();sel=start=asked();show(sel||home())}
    cx.on(doc,'reset',function(e){if(e.target.contains&&e.target.contains(el))back()});
    cx.on(doc,'aui:reset',function(e){if(e.target.contains(el))back()});
    cx.attr=function(name){
      if(name==='data-value'){back();return}
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

  /* around a <table>: the first column names the points, every other column
     is a series, named by the header row. data-type="bars" (the default),
     "line", "hbars", "heatmap" (every cell a point) or "donut" (the first
     series); "spark" is spark() above. data-max and data-min set the scale,
     data-rows the height, data-pick the first pick. The table stays for
     screen readers and for a page without the script; the characters above
     it are paint. Focused, the arrows, Home and End move the pick and Escape
     lets go, said in the nearest role="status". Fires aui:pick on a click or key */
  chart:function(el,cx){
    var type=el.getAttribute('data-type')||'bars',heat=type==='heatmap';
    if(type==='spark')return spark(el,cx);
    var tb=el.querySelector('table');if(!tb)return;
    var plot=doc.createElement('pre'),out=status(el),live=null,set=[],obs=[],D=null,G=null,pick=-1,p=1,cw=0,lastW=-1,vis0=0;
    plot.className='plot';plot.setAttribute('aria-hidden','true');el.insertBefore(plot,el.firstChild);el.classList.add('drawn');
    function own(a,v){if(!el.hasAttribute(a)){el.setAttribute(a,v);set.push(a)}}
    own('tabindex','0');own('role','group');own('aria-roledescription','chart');
    if(tb.caption&&!el.hasAttribute('aria-label'))own('aria-labelledby',uid(tb.caption,'cap'));
    if(!out){out=live=doc.createElement('span');live.className='vh';live.setAttribute('role','status');el.appendChild(live)}
    cx.later(function(){plot.remove();if(live)live.remove();el.classList.remove('drawn');set.forEach(function(a){el.removeAttribute(a)});obs.forEach(function(o){o.disconnect()})});
    function read(){
      var head=tb.tHead&&tb.tHead.rows[0],rows=all('tr',tb).filter(function(r){return r.parentNode.localName!=='tfoot'});
      if(!head&&rows[0]&&!rows[0].querySelector('td'))head=rows[0];
      var R=rows.filter(function(r){return r!==head&&r.parentNode.localName!=='thead'&&r.cells.length>1}).map(function(r){
        var c=[].slice.call(r.cells,1);return {l:txt(r.cells[0]),v:c.map(num),t:c.map(txt)}});
      var v=[].concat.apply([0],R.map(function(r){return r.v})),mn=attrNum(el,'data-min'),mx=attrNum(el,'data-max');
      if(v.length>1)v.shift();
      D={rows:R,ns:Math.max.apply(0,R.map(function(r){return r.v.length}).concat(0)),names:head?[].slice.call(head.cells,1).map(txt):[],
         lo:mn===null?Math.min.apply(0,v):mn,hi:mx===null?Math.max.apply(0,v):mx};
      D.max=mx===null?nice(D.hi):mx||1;
      D.tot=R.reduce(function(a,r){return a+Math.max(0,r.v[0]||0)},0)||1;
    }
    function cols(){
      if(!cw){var q=doc.createElement('span');q.textContent='MMMMMMMMMM';q.style.cssText='position:absolute;visibility:hidden';plot.appendChild(q);cw=q.getBoundingClientRect().width/10||8.4;q.remove()}
      return Math.max(16,Math.floor(plot.clientWidth/cw));
    }
    var rows=function(){return clamp(attrNum(el,'data-rows')||8,3,40)};
    /* the value axis for bars and line: 0, half and the top, dotted across */
    function axis(w,h){
      var l=Math.max(short(D.max).length,short(D.max/2).length)+1,g=new Cells(w,h+1+(D.ns>1));
      [0,.5,1].forEach(function(f){
        var y=h-1-Math.round(f*(h-1)),s=short(D.max*f);g.text(l-1-s.length,y,s,'muted');
        for(var x=l;x<w;x+=2)g.set(x,y,'.','muted');
      });
      /* two series or more: a key under it */
      var x=0;if(D.ns>1)D.names.slice(0,D.ns).forEach(function(n,s){g.text(x,h+1,GL.charAt(s%6)+GL.charAt(s%6),COL[s%6]);g.text(x+3,h+1,n);x+=n.length+5});
      g.l=l;return g;
    }
    /* the pick is said in text too, [Thu], not only by color */
    function tag(g,x,y,s,on,i){if(on)g.text(x-1,y,'['+s+']','ink',i);else g.text(x,y,s,'muted',i)}
    function bars(w){
      var R=D.rows,ns=D.ns,h=rows(),g=axis(w,h),l=g.l,gw=Math.max(2,Math.floor((w-l)/(R.length||1))),bw=Math.max(1,Math.floor((gw-1)/ns));
      R.forEach(function(r,i){
        var x0=l+i*gw,on=i===pick,s,y,x,k,t,lb=r.l.slice(0,bw*ns);
        g.hit(x0,0,gw,h+1,i);
        for(s=0;s<ns;s++){
          k=Math.round(clamp((r.v[s]||0)/D.max,0,1)*h*p);
          /* one series grows through the ramp and caps out lighter */
          for(y=0;y<k;y++){t=k-1-y;for(x=0;x<bw;x++)g.set(x0+s*bw+x,h-1-y,ns>1?GL.charAt(s%6):'*#%@'.charAt(Math.min(t,3)),on?'violet':ns>1?COL[s%6]:t<2?'pink':'hot',i)}
        }
        tag(g,x0+Math.max(0,(bw*ns-lb.length)>>1),h,lb,on,i);
      });
      return g;
    }
    function line(w){
      var R=D.rows,n=R.length,ns=D.ns,h=rows(),g=axis(w,h),l=g.l,pw=w-l,x,y,s;
      if(!n)return g;
      function at(x){return n>1?x*(n-1)/(pw-1):0}
      function row(v){return h-1-Math.round(clamp(v/D.max,0,1)*(h-1))}
      var px=l+(n>1?Math.round(pick*(pw-1)/(n-1)):0);
      for(x=0;x<pw;x++)g.hit(l+x,0,1,h+1,Math.round(at(x)));
      if(pick>=0)for(y=0;y<h;y++)g.set(px,y,':','muted');
      for(s=0;s<ns;s++)for(x=0;x<Math.round(pw*p);x++){
        var t=at(x),i=Math.floor(t),a=R[i].v[s]||0,b=R[Math.min(n-1,i+1)].v[s]||0,yy=row(a+(b-a)*(t-i));
        /* one series is filled under the line */
        if(ns<2)for(y=yy+1;y<h;y++)g.set(l+x,y,y-yy<2?':':'.',y-yy<2?'violet':'deep');
        g.set(l+x,yy,ns>1?GL.charAt(s%6):'*',ns>1?COL[s%6]:'hot');
      }
      if(pick>=0&&p>=1){
        for(s=0;s<ns;s++)g.set(px,row(R[pick].v[s]||0),ns>1?GL.charAt(s%6):'@','violet');
        tag(g,clamp(px-(R[pick].l.length>>1),1,w-R[pick].l.length-1),h,R[pick].l,1,pick);
      }else{g.text(l,h,R[0].l,'muted');if(n>1)g.text(Math.max(l+R[0].l.length+1,w-R[n-1].l.length),h,R[n-1].l,'muted')}
      return g;
    }
    function hbars(w){
      var R=D.rows,lw=0,vw=0;R.forEach(function(r){lw=Math.max(lw,r.l.length);vw=Math.max(vw,(r.t[0]||'').length)});
      lw=Math.min(lw,16);var n=Math.max(4,w-lw-vw-4),g=new Cells(w,Math.max(1,R.length*2-1));
      R.forEach(function(r,i){
        var y=i*2,on=i===pick,s=bar((r.v[0]||0)/D.max*n*p,n),j,c,v=r.t[0]||'';
        g.hit(0,y,w,1,i);tag(g,1,y,r.l.slice(0,lw),on,i);
        for(j=0;j<n;j++){c=s.charAt(j);g.set(lw+3+j,y,c,on&&c!=='.'?'violet':HUE[c],i)}
        g.text(w-v.length,y,v,'ink',i);
      });
      return g;
    }
    function heatmap(w){
      var R=D.rows,nc=D.ns,lw=Math.min(12,Math.max.apply(0,R.map(function(r){return r.l.length}).concat(0)))+1,
          fit=Math.max(1,Math.min(nc,(w-lw)>>1)),c0=vis0=nc-fit,g=new Cells(w,R.length+1),span=D.hi-D.lo;
      R.forEach(function(r,y){
        g.text(0,y,r.l.slice(0,lw-1),'muted');
        for(var c=c0;c<c0+Math.round(fit*p);c++){
          var f=span>0?clamp(((r.v[c]||0)-D.lo)/span,0,1):1,ch=RAMP.charAt(1+Math.round(f*7)),k=f>2/3?'hot':f>1/3?'pink':'muted',i=y*nc+c,x=lw+(c-c0)*2,on=i===pick;
          g.set(x,y,on?'[':ch,on?'ink':k,i,on);g.set(x+1,y,on?']':ch,on?'ink':k,i,on);
        }
      });
      /* the first and the last column's names, or only the newest when both do not fit */
      var a=D.names[c0]||'',b=D.names[nc-1]||'',room=fit*2;
      if(fit>1&&a.length+b.length+1>room)a='';
      g.text(lw,R.length,a,'muted');if(fit>1)g.text(Math.max(lw,lw+room-b.length),R.length,b,'muted');
      return g;
    }
    function donut(w){
      /* a circle on the grid: a row is taller than a character is wide */
      var R=D.rows,n=R.length,ay=rowh()/cw,Ro=Math.min(10,(w-1)>>1),Rb=Ro-0.6,hh=Math.floor(Rb/ay),h=hh*2+1,
          lw=Math.max.apply(0,R.map(function(r){return r.l.length}).concat(0))+11,side=w>=2*Ro+4+lw,
          g=new Cells(w,side?Math.max(h,n*2-1):h+1+n),cum=[],acc=0,x,y,i;
      R.forEach(function(r){acc+=Math.max(0,r.v[0]||0)/D.tot;cum.push(acc)});
      for(y=0;y<h;y++)for(x=0;x<=2*Ro;x++){
        var dx=x-Ro,dy=(y-hh)*ay,d=Math.sqrt(dx*dx+dy*dy),a=(Math.atan2(dy,dx)/Math.PI/2+1.25)%1;
        if(d<Ro/2||d>Rb||a>p)continue;
        for(i=0;i<n-1&&a>=cum[i];i++);
        var on=pick<0||pick===i;g.set(x,y,on?GL.charAt(i%6):d>Ro*0.75?':':'.',on?COL[i%6]:'muted',i);
      }
      R.forEach(function(r,i){
        var on=pick<0||pick===i,k=on?COL[i%6]:'muted',lx=side?2*Ro+4:0,ly=side?Math.max(0,hh-n+1)+i*(h>=n*2-1?2:1):h+1+i,pc=Math.round(Math.max(0,r.v[0]||0)/D.tot*100)+'%';
        g.hit(lx,ly,lw,1,i);g.text(lx,ly,GL.charAt(i%6)+GL.charAt(i%6),k,i);
        tag(g,lx+4,ly,r.l,i===pick,i);g.text(lx+lw-pc.length,ly,pc,on?'ink':'muted',i);
      });
      return g;
    }
    var DRAW={bars:bars,line:line,hbars:hbars,heatmap:heatmap,donut:donut};
    function draw(){if(!D)read();G=(DRAW[type]||bars)(cols());plot.innerHTML=G.html()}
    function count(){return heat?D.rows.length*D.ns:D.rows.length}
    function info(i){
      var c=heat?i%D.ns:0,r=D.rows[heat?(i-c)/D.ns:i];
      return heat?{index:i,row:(i-c)/D.ns,col:c,label:r.l,column:D.names[c]||'',value:r.v[c],text:r.t[c]}:{index:i,label:r.l,values:r.v.slice(),texts:r.t.slice()};
    }
    function words(i){
      var o=info(i);
      if(heat)return o.label+', '+(o.column||'column '+(o.col+1))+': '+o.text;
      if(type==='donut')return o.label+': '+o.texts[0]+', '+Math.round(Math.max(0,o.values[0])/D.tot*100)+' percent of the total';
      return o.label+': '+o.texts.map(function(t,s){return (D.names[s]?D.names[s]+' ':'')+t}).join(', ');
    }
    function choose(i,user,quiet){
      if(!D)read();pick=i>=0&&i<count()?i:-1;draw();
      if(!quiet)out.textContent=pick<0?'':words(pick);
      if(user&&pick>=0)emit(el,'pick',info(pick));
    }
    read();var dp=attrNum(el,'data-pick');if(dp!==null&&dp<count())pick=dp;
    cx.on(el,'keydown',function(e){
      if(e.target!==el)return;
      var n=count(),nc=heat?D.ns:1,k=e.key,c=pick%nc,r=Math.max(0,pick-c),st={ArrowLeft:-1,ArrowRight:1,ArrowUp:-nc,ArrowDown:nc}[k],i;
      if(!n)return;
      /* a heatmap starts on the newest column, where the eye starts */
      /* in a heatmap Up and Down keep the column, and stop at the top and the bottom row */
      if(st)i=pick<0?(heat?nc-1:st>0?0:n-1):nc>1&&st*st===1?r+clamp(c+st,vis0,nc-1):nc>1?clamp(r+(st>0?nc:-nc),0,n-nc)+Math.max(c,vis0):clamp(pick+st,0,n-1);
      else if(k==='Home')i=nc>1?r+vis0:0;
      else if(k==='End')i=nc>1?r+nc-1:n-1;
      else if(k==='Escape'&&pick>=0)i=-1;
      else return;
      e.preventDefault();choose(i,1);
    });
    cx.on(plot,'click',function(e){
      var b=plot.getBoundingClientRect(),x=Math.floor((e.clientX-b.left)/cw),y=Math.floor((e.clientY-b.top)/rowh()),
          i=G&&x>=0&&y>=0&&x<G.w&&y<G.h?G.p[y*G.w+x]:-1;
      if(i>=0)choose(i===pick?-1:i,1);
    });
    /* a new width redraws it, and so does a change to the table */
    function watch(o,t,opt){obs.push(o);o.observe(t,opt);return o}
    if(window.ResizeObserver)watch(new ResizeObserver(function(){var w=plot.clientWidth;if(w!==lastW){lastW=w;cw=0;draw()}}),plot);
    watch(new MutationObserver(function(){D=null;choose(pick,0,1)}),tb,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-value']});
    if(doc.fonts)doc.fonts.ready.then(function(){if(!cx.dead){cw=0;draw()}});
    /* printed before it came on screen: drawn whole, not as empty axes */
    cx.on(window,'beforeprint',function(){if(p<1){p=1;draw()}});
    /* it grows in once, when it first comes on screen; under reduced motion it is drawn whole */
    if(!reduce&&window.IntersectionObserver){
      p=0;var io=watch(new IntersectionObserver(function(en){
        if(!en[en.length-1].isIntersecting)return;io.disconnect();
        /* ten steps, 40ms apart, each drawn on a frame */
        var s=0,t0=0;requestAnimationFrame(function step(t){
          if(cx.dead||p>=1)return;if(!t0)t0=t;
          var k=reduce?10:Math.min(10,1+Math.floor((t-t0)/40));
          if(k!==s){s=k;p=s/10;draw()}
          if(p<1)requestAnimationFrame(step);
        });
      }),el);
    }
    draw();
    return {
      draw:function(){p=1;D=null;draw()},
      pick:function(i){choose(i==null?-1:i)},
      get index(){return pick},
      get data(){return D}
    };
  },
  /* a list of checkboxes (.checklist). The share ticked goes into the
     nearest role="progressbar", before or after it, as a percent (or the
     one data-progress="id" names). Fires aui:change with { done, total }
     when a person ticks one; data-done="All done." is a toast when the last
     one is ticked */
  checklist:function(el,cx){
    var bar=near(el,'data-progress','[role="progressbar"]',true);
    function count(){
      var b=all('input[type="checkbox"]',el),d=b.filter(function(x){return x.checked}).length;
      return {done:d,total:b.length};
    }
    function draw(){var c=count();if(bar)setProgress(bar,c.total?c.done/c.total*100:0);return c}
    cx.on(el,'change',function(e){
      if(e.target.type!=='checkbox')return;
      var c=draw();if(resetting)return;
      emit(el,'change',c);
      var w=el.getAttribute('data-done');if(w&&e.target.checked&&c.done===c.total)toast(w);
    });
    draw();
    return {draw:draw,get done(){return count().done},get total(){return count().total}};
  },

  /* a <nav>: data-pages="9" data-page="3". data-href="?page={n}" draws links
     instead of buttons. Fires aui:change on a pick (buttons only; a link goes) */
  pagination:function(el,cx){
    /* want is the page asked for, cur the one drawn. A page past the end is
       drawn as the last one and kept, so data-page="12" and then
       data-pages="20" lands on 12, in either order */
    var N,href,want,cur;
    /* a link that runs script is not a page: javascript:, data: and vbscript:
       draw buttons instead, however the scheme is spaced out */
    function safe(h){return h&&/^(?:javascript|data|vbscript):/i.test(h.replace(/[\u0000-\u0020\u007f]/g,''))?null:h}
    function read(){N=Math.max(1,+el.getAttribute('data-pages')||9);href=safe(el.getAttribute('data-href'))}
    function ask(p){want=Math.max(1,Math.round(+p)||1);cur=clamp(want,1,N)}
    read();ask(el.getAttribute('data-page'));
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
      /* a gap of one page is that page: .. would take its place for nothing */
      pages=pages.reduce(function(o,q){if(o.length&&q-o[o.length-1]===2)o.push(q-1);o.push(q);return o},[]);
      var h=item(cur-1,'&lt;','Previous page',cur===1);
      pages.forEach(function(q){if(q-last>1)h+='<span class="muted" aria-hidden="true">..</span>';h+=item(q,q,'Page '+q,false,q===cur);last=q});
      el.innerHTML=h+item(cur+1,'&gt;','Next page',cur===N);
      /* the attribute says the page asked for, so reading it back changes nothing */
      if(el.getAttribute('data-page')!==String(want))el.setAttribute('data-page',want);
      say(el,'Page '+cur+' of '+N+'.');
    }
    cx.on(el,'click',function(e){
      var b=e.target.closest('button');if(!b||b.disabled||href)return;
      ask(clamp(+b.dataset.p,1,N));draw();emit(el,'change',{page:cur});
      var c=el.querySelector('[aria-current]');if(c)c.focus();
    });
    var w=0;cx.on(window,'resize',function(){if(el.isConnected&&el.clientWidth!==w){w=el.clientWidth;draw()}});
    cx.attr=function(name){
      if(name==='data-page'){var was=want;ask(el.getAttribute('data-page'));if(want!==was)draw();return}
      read();ask(want);draw();
    };
    draw();
    return {
      set:function(n){ask(n);draw()},
      get page(){return cur},
      get pages(){return N}
    };
  },

  /* a group where one is the pick: its buttons, links and role="button"
     cards. A click, or Enter or Space on a role="button", picks one. When
     one of them has aria-current in the html (the pages of an app) the pick
     takes that; otherwise each has aria-pressed, "true" on the pick. The
     nearest role="status" says the pick's data-say. Fires aui:change with
     { item, index } */
  pick:function(el,cx){
    function items(){
      var xs=all('button,a[href],[role="button"]',el);
      return xs.filter(function(x){return !xs.some(function(o){return o!==x&&o.contains(x)})});
    }
    var first=items().filter(function(x){return x.hasAttribute('aria-current')})[0];
    var cur=first?(first.getAttribute('aria-current')==='false'?'page':first.getAttribute('aria-current')):'',set=[];
    if(!cur)items().forEach(function(x){if(!x.hasAttribute('aria-pressed')){x.setAttribute('aria-pressed','false');set.push(x)}});
    cx.later(function(){set.forEach(function(x){x.removeAttribute('aria-pressed')})});
    function choose(x,quiet){
      items().forEach(function(o){
        if(cur){if(o===x)o.setAttribute('aria-current',cur);else o.removeAttribute('aria-current')}
        else o.setAttribute('aria-pressed',o===x?'true':'false');
      });
      if(quiet)return;
      var w=x.getAttribute('data-say');if(w)say(el,w);
      emit(el,'change',{item:x,index:items().indexOf(x)});
    }
    function hit(t){var x=t.closest&&t.closest('button,a[href],[role="button"]');return x&&items().indexOf(x)>=0?x:null}
    cx.on(el,'click',function(e){var x=hit(e.target);if(x&&!x.disabled&&x.getAttribute('aria-disabled')!=='true')choose(x)});
    cx.on(el,'keydown',function(e){
      if(e.key!=='Enter'&&e.key!==' ')return;
      var x=hit(e.target);if(!x||x!==e.target||x.localName==='button'||x.localName==='a')return;
      e.preventDefault();choose(x);
    });
    return {
      select:function(i){var x=items()[i];if(x)choose(x,true)},
      get index(){return items().findIndex(function(x){return cur?x.hasAttribute('aria-current'):x.getAttribute('aria-pressed')==='true'})},
      get item(){var i=this.index;return i<0?null:items()[i]}
    };
  },

  /* an input with the native required/pattern/type rules. It checks when you
     leave the field and when the form is sent; once it has, also as you
     type, so a fix clears the message at once. A value that is wrong on
     load shows its message from the start. The message
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
    /* user: a person typed, left the field or sent the form. On load and
       from check() or validate(form) the verdict is kept, and nothing fires */
    function show(msg,user){
      if(field)field.classList.toggle('invalid',!!msg);
      inp.setAttribute('aria-invalid',msg?'true':'false');
      if(out)out.textContent=msg;
      var now=msg?'invalid':'valid';
      if(now!==last){last=now;if(user)emit(inp,now,{message:msg,validity:inp.validity})}
    }
    /* touched: the field has been left once, a submit has been tried, or it
       shows a message already. Until then typing says nothing: nobody is
       told a word is wrong before they have finished it. After that it
       checks on every keystroke, so a fix clears the message at once */
    var touched=false;
    function check(user){var m=message();if(m)touched=true;show(m,user===true);return !m}
    function heard(){touched=true;return check(true)}
    function typed(){if(touched)check(true);else if(!message()&&last==='invalid')check(true)}
    function clear(){if(field)field.classList.remove('invalid');inp.setAttribute('aria-invalid','false');if(out)out.textContent='';last=null;touched=false}
    cx.on(inp,'input',function(){if(resetting)clear();else typed()});
    /* change: a checkbox or a select is done the moment it changes; a text field when it is left */
    cx.on(inp,'change',function(){if(resetting)clear();else heard()});
    cx.on(inp,'blur',function(){if(!resetting)heard()});
    /* a submit the browser stopped: our words instead of its bubble, and the
       first field that failed gets the focus */
    cx.on(inp,'invalid',function(e){e.preventDefault();heard();focusLater(inp)});
    /* a form with novalidate sends anyway: stop it here when this one fails */
    var form=inp.form;
    if(form)cx.on(form,'submit',function(e){if(form.noValidate&&!heard()){e.preventDefault();focusLater(inp)}});
    if(inp.value)check();
    return {check:function(){return check()},clear:clear,get message(){return message()}};
  },

  /* a .tgroup of radios (role="radiogroup"). The nearest role="status" says
     the pick: the words of its label, or data-say with {label} in it
     (data-say="{label} view."). Fires aui:change with { value, label, input }
     when a person picks */
  segment:function(g,cx){
    var rs=function(){return all('input[type="radio"]',g)};
    function label(r){var l=r.closest('label');return (l?l.textContent:r.value).replace(/\s+/g,' ').trim()}
    function tell(r){var t=g.getAttribute('data-say')||'{label}.';say(g,r?t.replace(/\{label\}/g,label(r)):'Nothing picked.')}
    cx.on(g,'change',function(e){
      var r=e.target;if(r.type!=='radio'||!r.checked||resetting)return;
      tell(r);emit(g,'change',{value:r.value,label:label(r),input:r});
    });
    /* a reset puts the html's pick back, and the line with it */
    cx.on(doc,'aui:reset',function(e){if(e.target.contains(g))tell(rs().filter(function(r){return r.checked})[0])});
    cx.on(doc,'reset',function(e){if(e.target.contains&&e.target.contains(g))setTimeout(function(){if(g.isConnected)tell(rs().filter(function(r){return r.checked})[0])},0)});
    var c=rs().filter(function(r){return r.checked})[0];if(c)tell(c);
    return {get value(){var r=rs().filter(function(x){return x.checked})[0];return r?r.value:''}};
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
    /* the frames are paint: a screen reader would read "slash", "dash". With
       an aria-label the spinner is an image of that name ("Loading"); with
       none it is hidden, and the words next to it say the wait */
    var named=el.hasAttribute('aria-label')||el.hasAttribute('aria-labelledby'),set=null;
    if(named){if(!el.hasAttribute('role')){el.setAttribute('role','img');set='role'}}
    else if(!el.hasAttribute('aria-hidden')){el.setAttribute('aria-hidden','true');set='aria-hidden'}
    cx.later(function(){if(set)el.removeAttribute(set)});
    every(110,function(){f++;el.textContent=fn()},cx);
  },

  /* .stepper: a button, the number (an <output> or a <b>) and a button. The
     first takes one off, the last adds one, from data-min (1) to data-max
     (99); a button at the end of the range turns off and the focus moves to
     the other. Every [data-each] in the same .card (or the stepper's
     parent) shows data-each times the number, in data-unit: g turns into
     kg from 1000 and ml into l, g and ml round to 10, kg and l to one
     decimal, and no unit rounds up to a whole count. Fires aui:change
     with { value } */
  stepper:function(el,cx){
    var bs=all('button',el),dn=bs[0],up=bs[bs.length-1],out=el.querySelector('output,b');
    if(!dn||dn===up||!out)return;
    var v=parseInt(out.textContent,10);
    function lim(){return [+(el.getAttribute('data-min')||1),+(el.getAttribute('data-max')||99)]}
    function amount(q,u){
      if(u==='g'||u==='ml')return q>=1000?(Math.round(q/100)/10)+' '+(u==='g'?'kg':'l'):(Math.round(q/10)*10)+' '+u;
      if(u)return (Math.round(q*10)/10)+' '+u;
      return String(Math.max(1,Math.ceil(q)));
    }
    function draw(){
      var l=lim();v=clamp(isNaN(v)?l[0]:v,l[0],l[1]);
      out.textContent=v;dn.disabled=v<=l[0];up.disabled=v>=l[1];
      all('[data-each]',el.closest('.card')||el.parentElement).forEach(function(q){q.textContent=amount(+q.getAttribute('data-each')*v,q.getAttribute('data-unit')||'')});
    }
    cx.on(el,'click',function(e){
      var b=e.target.closest('button');if(!b||b.disabled||(b!==dn&&b!==up))return;
      v+=b===up?1:-1;draw();
      if(b.disabled)(b===up?dn:up).focus();
      emit(el,'change',{value:v});
    });
    cx.attr=function(){draw()};
    draw();
    return {draw:draw,set:function(n){v=Math.round(+n);draw()},get value(){return v}};
  },

  /* data-aui-signal on any element (it needs no data-aui of its own):
     glitch     when a state inside it changes (aria-selected, aria-pressed,
                aria-expanded, aria-checked, aria-current, open, a checkbox,
                radio or select), the part that changed glitches
     scramble   the words decode into place once, when it comes on screen
     band       a band rolls through it now and then (on <html>: the window)
     rot        data-rot seconds idle (14) and its frames decay; input repairs
     Several at once: data-aui-signal="glitch rot". All of it opt in, and
     still under reduced motion, forced colors and print */
  signal:function(el,cx){
    /* the names in data-aui-signal; empty is off. data-aui="signal" with no
       data-aui-signal at all is glitch */
    var raw=el.getAttribute('data-aui-signal');if(raw===null)raw='glitch';
    var fx=raw.toLowerCase().split(/[\s,]+/).filter(Boolean);
    function has(n){return fx.indexOf(n)>=0}
    if(has('glitch')){
      /* what the page does to itself while it loads is not a change */
      var born=snow(),mo=new MutationObserver(function(ms){
        if(snow()-born<250)return;
        var hit=null,any=null;
        ms.forEach(function(m){
          var t=m.target,a=m.attributeName,v=t.getAttribute(a);if(v===m.oldValue)return;
          any=any||t;if(!hit&&(a==='open'?v!==null:(v&&v!=='false')))hit=t;
        });
        var t=hit||any;if(t)glitch(t.getClientRects().length?t:el);
      });
      mo.observe(el,{attributes:true,subtree:true,attributeOldValue:true,attributeFilter:['aria-selected','aria-pressed','aria-expanded','aria-checked','aria-current','open']});
      cx.later(function(){mo.disconnect()});
      cx.on(el,'change',function(e){
        var t=e.target;if(!t.matches||!t.matches('input[type="checkbox"],input[type="radio"],select'))return;
        var l=t.closest('label');glitch(l&&el.contains(l)?l:(t.getClientRects().length?t:el));
      });
    }
    if(has('scramble')){
      if(window.IntersectionObserver){
        var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.disconnect();scramble(el)}})});
        io.observe(el);cx.later(function(){io.disconnect()});
      }
      cx.later(function(){if(el.__auiS)el.__auiS()});
    }
    if(has('band')){
      var gap=function(){var lv=sigLevel(el);return (lv===1?18000:lv===3?5000:9000)*(0.7+Math.random()*0.6)};
      var bj=sigAt(gap(),function(){if(cx.dead)return 0;band(el);return gap()});
      cx.later(function(){sigDrop(bj);if(el.__auiB)el.__auiB()});
    }
    if(has('rot')){var w=rotWatch(el);cx.later(w.end)}
    return {glitch:function(){return glitch(el)},scramble:function(){return scramble(el)},band:function(){return band(el)},
      rot:function(){return rot(el)},repair:function(){return repair(el)},get effects(){return fx.slice()}};
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
    /* the page around it closes it, on click, and only when the press started
       there too. An alert dialog waits for an answer: it nudges instead */
    var down=false;
    d.addEventListener('pointerdown',function(e){down=e.target===d});
    d.addEventListener('click',function(e){if(down&&e.target===d){if(d.getAttribute('role')==='alertdialog')nudge(d);else close(d)}down=false});
    d.addEventListener('close',function(){if(d.__auiFrom&&d.__auiFrom.isConnected)d.__auiFrom.focus()});
    if(d.classList.contains('sheet'))swipe(d);
  }
  d.__auiFrom=from;
  /* the answer starts empty every time: Escape and a plain data-aui-close leave it so */
  if(!d.open)d.returnValue='';
  if(d.showModal){if(!d.open)d.showModal()}else d.setAttribute('open','');
}
/* A sheet goes down the way it came up, on a touch screen: a finger that
   drags it down by its title, or from the top of what it holds when that is
   scrolled to the top, moves it a whole row at a time. Let go past a quarter
   of its height, or with a flick, and it closes; short of that it goes back.
   Sideways, or up, is a scroll, and a slider or a field keeps its finger */
function swipe(d){
  var st=null;
  function part(){return d.querySelector(':scope > .lift')||d.firstElementChild}
  function back(){var l=part();if(l)l.style.translate='';st=null}
  d.addEventListener('touchstart',function(e){
    st=null;
    if(e.touches.length!==1||!d.open||!part())return;
    var t=e.target;if(t.closest&&t.closest('input,textarea,select,[contenteditable],.slider'))return;
    var p=e.touches[0];
    st={x:p.clientX,y:p.clientY,dy:0,on:false,box:t.closest?t.closest('.body'):null,ly:p.clientY,lt:e.timeStamp,v:0};
  },{passive:true});
  d.addEventListener('touchmove',function(e){
    if(!st)return;
    var p=e.touches[0],dx=p.clientX-st.x,dy=p.clientY-st.y;
    if(!st.on){
      if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)){st=null;return}   /* sideways: not ours */
      if(dy<10){if(dy<-10)st=null;return}                              /* up: a scroll */
      if(st.box&&st.box.scrollTop>0){st=null;return}                  /* the list scrolls back first */
      st.on=true;
    }
    if(e.cancelable)e.preventDefault();
    var r=rowh(),dt=e.timeStamp-st.lt;
    if(dt>0){st.v=(p.clientY-st.ly)/dt;st.ly=p.clientY;st.lt=e.timeStamp}
    st.dy=Math.max(0,dy);
    part().style.translate='0 '+Math.floor(st.dy/r)*r+'px';
  },{passive:false});
  d.addEventListener('touchend',function(){
    if(!st||!st.on){st=null;return}
    var h=part().getBoundingClientRect().height,go=st.dy>h/4||(st.v>0.5&&st.dy>rowh());
    back();if(go)close(d);
  });
  d.addEventListener('touchcancel',back);
  d.addEventListener('close',back);
}
/* a tap beside an alert dialog: one character each way, and the focus back on the safe answer */
function nudge(d){
  var safe=d.querySelector('[autofocus]')||d.querySelector('[data-aui-close]:not(.btn-danger)');
  if(safe&&!safe.disabled)safe.focus();
  if(reduce)return;
  clearTimeout(d.__auiNudge);d.classList.remove('nudge');void d.offsetWidth;d.classList.add('nudge');
  d.__auiNudge=setTimeout(function(){d.classList.remove('nudge')},cssTime('--aui-base',240)+80);
}
function close(d,v){if(!d)return;if(d.close){if(v)d.close(String(v));else d.close()}else d.removeAttribute('open')}
function runFill(target,btn){
  if(!target||btn.disabled)return;
  var label=btn.querySelector('.label')||btn,text=label.textContent,p=0,f=0;
  btn.disabled=true;setProgress(target,0);say(btn,'');
  (function step(){
    p=Math.min(100,p+3+Math.floor(Math.random()*7));f++;
    setProgress(target,p);
    label.textContent=(reduce?'* ':'|/-\\'.charAt(f%4)+' ')+text;
    if(p<100){setTimeout(function(){requestAnimationFrame(step)},130);return}
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
  var t=e.target.closest&&e.target.closest('[data-aui-open],[data-aui-close],[data-aui-toast],[data-aui-toast-err],[data-aui-reset],[data-aui-fill],[data-aui-toggle]');
  if(!t||t.disabled)return;
  /* a toggle button: aria-pressed flips, and the words for on|off go to its status line */
  if(t.hasAttribute('data-aui-toggle')){
    var on=t.getAttribute('aria-pressed')!=='true',w=(t.getAttribute('data-aui-toggle')||'').split('|');
    t.setAttribute('aria-pressed',on?'true':'false');
    if(w[0])say(t,on?w[0]:(w[1]||''));
    emit(t,'change',{pressed:on});
  }
  if(t.hasAttribute('data-aui-reset')){if(t.form)e.preventDefault();resetBox(t)}
  /* the nearest of a dialog and a popover pane: in a pane inside a dialog,
     only the pane goes (the popover closes its own) */
  if(t.hasAttribute('data-aui-close')){var bx=t.closest('dialog,.pane');if(bx&&bx.localName==='dialog')close(bx,t.getAttribute('data-aui-close'))}
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
  var i=f.querySelector('input:not([type="hidden"]),textarea,select');if(!i||i.disabled)return;
  i.focus();
  /* a select opens its list, as a tap on the select itself does */
  if(i.localName==='select'&&i.showPicker)try{i.showPicker()}catch(x){}
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
  /* One pass over the page's radios, grouped by form, then name, then box,
     in Maps, so a thousand groups pasted at once take linear time */
  var mineR=mine('input[type="radio"][name]');
  if(mineR.length){
    var keys=new Map(),groups=new Map(),used=null;
    mineR.forEach(function(r){var m=keys.get(r.form);if(!m)keys.set(r.form,m=new Set());m.add(r.name)});
    all('input[type="radio"][name]').forEach(function(x){
      var f=x.form,ks=keys.get(f);if(!ks||!ks.has(x.name))return;
      var b=x.closest('[role="radiogroup"],fieldset');if(!b||(f&&!f.contains(b)))b=f||doc.body;
      var byName=groups.get(f);if(!byName)groups.set(f,byName=new Map());
      var boxes=byName.get(x.name);if(!boxes)byName.set(x.name,boxes=new Map());
      var own=boxes.get(b);if(!own)boxes.set(b,own=[]);own.push(x);
    });
    groups.forEach(function(byName){byName.forEach(function(boxes,n){
      if(boxes.size<2)return;
      if(!used){used=new Set();all('input[name]').forEach(function(x){used.add(x.name)})}
      var k=0;
      boxes.forEach(function(own){
        var nn;
        if(k++){do{nn=n+'-'+(++nameN)}while(used.has(nn));used.add(nn);own.forEach(function(x){x.name=nn})}
        if(!own.some(function(x){return x.checked}))own.forEach(function(x){if(x.defaultChecked)x.checked=true});
      });
    })});
  }
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
function list(root,attr){
  attr=attr||'data-aui';
  var els=all('['+attr+']',root);
  if(root.nodeType===1&&root.hasAttribute(attr))els.unshift(root);
  return els;
}
/* data-aui-signal rides on any element, next to its own data-aui: it has a
   context of its own, el.__auiSig. data-aui="signal" works too */
function mountSig(el){
  if(el.__auiSig||el.getAttribute('data-aui')==='signal')return;
  var cx=new Ctx(el,'signal');el.__auiSig=cx;
  try{var api=behaviors.signal(el,cx);if(api)cx.api=api}catch(e){console.error('ascii-ui: signal failed',e)}
}
function unmountSig(el){var cx=el.__auiSig;if(!cx)return;el.__auiSig=null;cx.end()}
function init(root){
  root=root||doc;
  link(root);
  list(root).forEach(mount);
  list(root,'data-aui-signal').forEach(mountSig);
  return root;
}
function destroy(root){
  root=root||doc;
  list(root).forEach(unmount);
  list(root,'data-aui-signal').forEach(unmountSig);
  return root;
}
function get(el){return el&&el.__aui?el.__aui.api:el&&el.__auiSig?el.__auiSig.api:null}
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
var WATCH=['data-aui','data-page','data-pages','data-href','data-value','data-min','data-max','data-week-start','data-locale','data-name','data-kind','data-cells','data-type','data-values','data-rows','data-pick','data-aui-signal','data-rot'];
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
    if(a==='data-aui-signal'||a==='data-rot'){
      if(el.getAttribute('data-aui')==='signal'){unmount(el);mount(el)}
      else{unmountSig(el);if(el.hasAttribute('data-aui-signal'))mountSig(el)}
      return;
    }
    var cx=el.__aui;if(!cx)return;
    if(cx.attr)cx.attr(a);else{unmount(el);mount(el)}
  })}).observe(doc.documentElement,{childList:true,subtree:true,attributes:true,attributeOldValue:true,attributeFilter:WATCH});
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start);else start();

window.ASCIIUI={
  version:VERSION,init:init,destroy:destroy,get:get,validate:validate,
  toast:toast,progress:setProgress,bar:bar,colorize:colorize,tones:tones,behaviors:behaviors,
  tabs:typed('tabs'),pagination:typed('pagination'),calendar:typed('calendar'),chart:typed('chart'),dropdown:typed('dropdown'),otp:typed('otp'),
  popover:typed('popover'),combobox:typed('combobox'),contextmenu:typed('contextmenu'),datatable:typed('datatable'),
  glitch:glitch,scramble:scramble,band:band,rot:rot,repair:repair,signal:signalLevel,
  get reduce(){return reduce}
};
})();
