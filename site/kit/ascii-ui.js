/* ascii/ui kit, ascii-ui.js
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
     data-aui-reset             clears the checkboxes and fields in its dialog or form
     data-aui-fill              runs the nearest progress bar from 0 to 100, for demos
   The nearest role="status" says what happened (the code, the page, the date).

   No ids needed. Each component finds its parts inside the element around it,
   so the same component pasted twice keeps two separate copies. The ids that
   aria needs (a label's for, a tab's aria-controls) are made here, unique.
   To point at something far away instead, give it an id and name it:
   data-aui-open="id", data-aui-fill="id", data-status="id".

   Everything that moves runs on requestAnimationFrame and stops when the
   element leaves the page. prefers-reduced-motion leaves every frame still.

   window.ASCIIUI: init(root), toast(msg, err), progress(el, pct), bar(k, n),
   colorize(str), tones(map), behaviors.

   MIT license. Copyright (c) 2026 Fede Kotek. The full text is in README.md. */
(function(){
'use strict';
if(window.ASCIIUI)return;   /* linked twice: keep the first */
var doc=document;
var reduce=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---- helpers ---- */
function all(sel,root){return Array.prototype.slice.call((root||doc).querySelectorAll(sel))}
function rep(c,n){var s='';while(n-->0)s+=c;return s}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function byId(id){return id?doc.getElementById(String(id).replace(/^#/,'')):null}
/* what el talks to: the id its attr names, or else the first sel in the
   smallest box around el that has one. The page itself is not a box, so a
   component without a part of its own does not borrow another's */
function near(el,attr,sel){
  var id=attr&&el.getAttribute(attr),p,m;
  if(id&&byId(id))return byId(id);
  for(p=el.parentElement;p&&p!==doc.body&&p!==doc.documentElement;p=p.parentElement){
    m=all(sel,p).filter(function(x){return x!==el&&!el.contains(x)});
    if(m.length)return m[0];
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
function say(el,text){var s=status(el);if(s)s.textContent=text}
function emit(el,name,detail){el.dispatchEvent(new CustomEvent('aui:'+name,{bubbles:true,detail:detail}))}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

/* ---- the ramp: every fill is an index into it, lightest to heaviest ---- */
var RAMP='.:=+*#%@',MAP={};
function tr(str){var o='',i,c;for(i=0;i<str.length;i++){c=str.charAt(i);o+=MAP[c]||c}return o}

/* ---- tones: the border strings. ascii-ui.css ships them for the default
   characters; this rebuilds them for others, e.g. ASCIIUI.tones({"@":"#"}),
   and bars and spinners follow the same map. ---- */
function tones(map){
  MAP=map||{};
  var m=function(c){return MAP[c]||c};
  var T={heavy:[m('@'),m('@')+m('@')],dense:[m('%'),m('%')+m('%')],mid:[m('#'),m('#')+m('#')],light:[m('='),m(':')+m(':')],
         shade:[m(':'),m(':')+m(':')],faint:['- ',': '],danger:['/','//'],error:['!','!!']};
  var q=function(s){return s.replace(/\\/g,'\\\\').replace(/"/g,'\\"')};
  var css=':root{--k8:"'+q(m('@'))+'";--k6:"'+q(m('#'))+'";--k1:"'+q(m('.'))+'";',k,i,H,V;
  for(k in T){
    H='';V='';
    while(H.length<180)H+=T[k][0];
    for(i=0;i<90;i++)V+=q(T[k][1])+'\\A ';
    css+='--h-'+k+':"'+q(H)+'";--s-'+k+':"'+q(T[k][1])+'";--v-'+k+':"'+V+'";';
  }
  css+='}';
  var st=byId('ascii-ui-tones');
  if(!st){st=doc.createElement('style');st.id='ascii-ui-tones';doc.head.appendChild(st)}
  st.textContent=css;
  all('[data-aui]').forEach(function(el){if(el.__auiDraw)el.__auiDraw()});
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
   element is on the page; it is dropped when the element goes. ---- */
var tasks=[],raf=0;
function every(ms,fn,el){
  fn();
  if(reduce)return;
  tasks.push({ms:ms,fn:fn,el:el,at:0});
  if(!raf)raf=requestAnimationFrame(tick);
}
function tick(now){
  raf=0;
  tasks=tasks.filter(function(t){return t.el.isConnected});
  if(!tasks.length)return;
  if(!doc.hidden)tasks.forEach(function(t){
    if(now-t.at<t.ms)return;t.at=now;
    var r=t.el.getBoundingClientRect();
    if(r.bottom>0&&r.top<innerHeight&&r.width)try{t.fn()}catch(e){t.el.isConnected&&console.error(e)}
  });
  raf=requestAnimationFrame(tick);
}

/* ---- toast ---- */
var toastEl=null,toastTimer=0;
function toast(msg,err){
  if(!toastEl){
    toastEl=doc.createElement('div');toastEl.className='toast';
    toastEl.setAttribute('role','status');toastEl.setAttribute('aria-live','polite');
    toastEl.innerHTML='<span></span>';doc.body.appendChild(toastEl);
  }
  clearTimeout(toastTimer);
  var span=toastEl.firstChild;
  toastEl.classList.toggle('err',!!err);
  /* a beat after the region exists, so a screen reader hears the change */
  setTimeout(function(){span.textContent=(err?'!! ':'@@ ')+msg;toastEl.classList.add('on')},20);
  toastTimer=setTimeout(function(){toastEl.classList.remove('on')},3600);
}

/* ---- progress: draws from aria-valuenow, so setting the attribute is enough ---- */
function setProgress(el,p){el.setAttribute('aria-valuenow',clamp(Math.round(p),0,100))}

var behaviors={
  /* role="tablist" with role="tab" buttons, and the role="tabpanel" elements
     next to it, in the same order. aria-controls, when set, wins */
  tabs:function(list){
    var tabs=all('[role="tab"]',list);if(!tabs.length)return;
    var box=list.parentElement,panels=box?Array.prototype.filter.call(box.children,function(c){return c.getAttribute('role')==='tabpanel'}):[];
    tabs.forEach(function(t,i){
      var p=byId(t.getAttribute('aria-controls'))||panels[i];if(!p)return;
      t.setAttribute('aria-controls',uid(p,'panel'));
      if(!p.hasAttribute('aria-labelledby'))p.setAttribute('aria-labelledby',uid(t,'tab'));
    });
    function apply(tab,focus){
      tabs.forEach(function(x){
        var on=x===tab,p=byId(x.getAttribute('aria-controls'));
        x.setAttribute('aria-selected',on?'true':'false');x.tabIndex=on?0:-1;
        if(p)p.hidden=!on;
      });
      if(focus)tab.focus();
      emit(list,'change',{tab:tab});
    }
    apply(tabs.filter(function(t){return t.getAttribute('aria-selected')==='true'})[0]||tabs[0]);
    tabs.forEach(function(tab,i){
      tab.addEventListener('click',function(){apply(tab)});
      tab.addEventListener('keydown',function(e){
        var n=e.key==='ArrowRight'?tabs[(i+1)%tabs.length]:e.key==='ArrowLeft'?tabs[(i-1+tabs.length)%tabs.length]:
              e.key==='Home'?tabs[0]:e.key==='End'?tabs[tabs.length-1]:null;
        if(n){e.preventDefault();apply(n,true)}
      });
    });
  },

  /* .slider holding a .slider-track (.bar + input[type=range]) and an optional <output> */
  slider:function(el){
    var input=el.querySelector('input[type="range"]'),b=el.querySelector('.bar'),out=el.querySelector('output');
    if(!input||!b)return;
    var n=+el.getAttribute('data-cells')||24;
    if(out&&!out.hasAttribute('for'))out.setAttribute('for',uid(input,'range'));
    function draw(){
      var min=+input.min||0,max=input.max===''?100:+input.max,fr=(input.value-min)/((max-min)||1);
      b.innerHTML=colorize(bar(fr*n,n));
      if(out)out.textContent=input.value;
    }
    el.__auiDraw=draw;
    input.addEventListener('input',draw);input.addEventListener('change',draw);draw();
  },

  /* role="progressbar" with a .bar and an optional .pct */
  progress:function(el){
    var b=el.querySelector('.bar'),pct=el.querySelector('.pct'),n=+el.getAttribute('data-cells')||24;
    if(!b)return;
    if(!el.hasAttribute('aria-valuenow'))el.setAttribute('aria-valuenow','0');
    function draw(){
      var p=clamp(+el.getAttribute('aria-valuenow')||0,0,100),s=p+'%';
      b.innerHTML=colorize(bar(p/100*n,n));
      if(pct)pct.textContent=rep(' ',4-s.length)+s;
    }
    el.__auiDraw=draw;
    new MutationObserver(draw).observe(el,{attributes:true,attributeFilter:['aria-valuenow']});
    draw();
  },

  /* .pop holding a button[aria-haspopup] and a [role=menu] of [role=menuitem] */
  dropdown:function(pop){
    var btn=pop.querySelector('[aria-haspopup]'),menu=pop.querySelector('[role="menu"]');
    if(!btn||!menu)return;
    btn.setAttribute('aria-controls',uid(menu,'menu'));
    var items=function(){return all('[role="menuitem"]:not([disabled])',menu)};
    function open(on,at){
      menu.hidden=!on;menu.classList.toggle('open',on);btn.setAttribute('aria-expanded',on?'true':'false');
      if(on){var it=items();if(it.length)it[at==='last'?it.length-1:0].focus()}
    }
    btn.addEventListener('click',function(){open(menu.hidden)});
    btn.addEventListener('keydown',function(e){
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();open(true,e.key==='ArrowUp'?'last':'first')}
    });
    menu.addEventListener('keydown',function(e){
      var it=items(),i=it.indexOf(doc.activeElement),n=null;
      if(e.key==='ArrowDown')n=it[(i+1)%it.length];
      else if(e.key==='ArrowUp')n=it[(i-1+it.length)%it.length];
      else if(e.key==='Home')n=it[0];
      else if(e.key==='End')n=it[it.length-1];
      else if(e.key==='Escape'){e.preventDefault();open(false);btn.focus();return}
      else if(e.key==='Tab'){open(false);return}
      if(n){e.preventDefault();n.focus()}
    });
    menu.addEventListener('click',function(e){
      var it=e.target.closest('[role="menuitem"]');if(!it)return;
      open(false);btn.focus();emit(pop,'select',{item:it,text:it.textContent.trim()});
    });
    doc.addEventListener('pointerdown',function(e){if(!menu.hidden&&!pop.contains(e.target))open(false)});
    pop.addEventListener('focusout',function(e){if(!menu.hidden&&e.relatedTarget&&!pop.contains(e.relatedTarget))open(false)});
  },

  /* .pop holding a trigger and a .tip. Hover and focus are css; this adds the
     tap and lets Escape put it away without moving focus */
  tooltip:function(pop){
    var tip=pop.querySelector('.tip'),t=0;if(!tip)return;
    var trig=pop.querySelector('button,a,input,[tabindex]');
    if(trig&&!trig.hasAttribute('aria-describedby'))trig.setAttribute('aria-describedby',uid(tip,'tip'));
    pop.addEventListener('click',function(){pop.classList.remove('off');pop.classList.add('on');clearTimeout(t);t=setTimeout(function(){pop.classList.remove('on')},1800)});
    doc.addEventListener('keydown',function(e){if(e.key==='Escape'){pop.classList.add('off');pop.classList.remove('on')}});
    pop.addEventListener('pointerenter',function(){pop.classList.remove('off')});
    pop.addEventListener('focusin',function(){pop.classList.remove('off')});
  },

  /* .otp holding one <input maxlength="1"> per digit */
  otp:function(box){
    var ins=all('input',box),n=ins.length;
    function check(){
      var v=ins.map(function(i){return i.value}).join(''),ok=new RegExp('^\\d{'+n+'}$').test(v);
      box.classList.toggle('good',ok);
      say(box,ok?'Code '+v+' accepted.':v.length+' of '+n+'.');
      if(ok)emit(box,'complete',{value:v});
    }
    ins.forEach(function(inp,i){
      /* a full box takes the new digit instead of refusing it */
      inp.addEventListener('beforeinput',function(e){
        if(!e.data)return;e.preventDefault();
        var d=e.data.replace(/\D/g,'');if(d.length>1){fill(d,i);return}
        if(d)inp.value=d;inp.dispatchEvent(new Event('input',{bubbles:true}));
      });
      inp.addEventListener('focus',function(){inp.select()});
      inp.addEventListener('input',function(){inp.value=inp.value.replace(/\D/g,'').slice(-1);if(inp.value&&ins[i+1])ins[i+1].focus();check()});
      inp.addEventListener('keydown',function(e){
        if(e.key==='Backspace'&&!inp.value&&ins[i-1]){e.preventDefault();ins[i-1].value='';ins[i-1].focus();check()}
        else if(e.key==='ArrowLeft'&&ins[i-1]){e.preventDefault();ins[i-1].focus()}
        else if(e.key==='ArrowRight'&&ins[i+1]){e.preventDefault();ins[i+1].focus()}
      });
      inp.addEventListener('paste',function(e){e.preventDefault();fill((e.clipboardData||window.clipboardData).getData('text')||'',i)});
    });
    function fill(t,from){
      t=t.replace(/\D/g,'').slice(0,n-from);
      t.split('').forEach(function(c,k){ins[from+k].value=c});
      (ins[Math.min(n-1,from+t.length)]).focus();check();
    }
  },

  /* an empty element: a month of buttons. The nearest role="status" says the pick */
  calendar:function(el){
    var today=new Date(),sel=new Date(today.getFullYear(),today.getMonth(),today.getDate()),
        view=new Date(sel.getFullYear(),sel.getMonth(),1),foc=sel;
    var same=function(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()};
    var long={weekday:'long',day:'numeric',month:'long'};
    /* one Tab stop for the month: only the focused day is in the tab order */
    function draw(){
      var y=view.getFullYear(),m=view.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate(),d,dt;
      if(foc.getFullYear()!==y||foc.getMonth()!==m)foc=(sel.getFullYear()===y&&sel.getMonth()===m)?sel:new Date(y,m,Math.min(foc.getDate(),n));
      var h='<div class="cal-head"><button class="ibtn" type="button" data-d="-1" aria-label="Previous month">&lt;</button><span>'+
        view.toLocaleString('en-US',{month:'long'})+' '+y+'</span><button class="ibtn" type="button" data-d="1" aria-label="Next month">&gt;</button></div><div class="cal-grid">';
      'MTWTFSS'.split('').forEach(function(c){h+='<span aria-hidden="true">'+c+'</span>'});
      for(d=0;d<first;d++)h+='<span></span>';
      for(d=1;d<=n;d++){dt=new Date(y,m,d);h+='<button type="button" data-day="'+d+'" tabindex="'+(same(dt,foc)?0:-1)+'" class="'+(same(dt,today)?'today':'')+'" aria-pressed="'+(same(dt,sel)?'true':'false')+'" aria-label="'+dt.toLocaleDateString('en-US',long)+'">'+d+'</button>'}
      el.innerHTML=h+'</div>';
      say(el,sel.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
    }
    el.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      if(b.dataset.d){view=new Date(view.getFullYear(),view.getMonth()+(+b.dataset.d),1);draw();el.querySelector('[data-d="'+b.dataset.d+'"]').focus()}
      else{sel=foc=new Date(view.getFullYear(),view.getMonth(),+b.dataset.day);draw();el.querySelector('[data-day="'+b.dataset.day+'"]').focus();emit(el,'change',{date:sel})}
    });
    /* arrows by day and week, Home and End to the ends of the week, Page Up and Down by month */
    el.addEventListener('keydown',function(e){
      if(!e.target.closest('[data-day]'))return;
      var K={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7},wd=(foc.getDay()+6)%7,d,t;
      if(e.key in K)d=new Date(foc.getFullYear(),foc.getMonth(),foc.getDate()+K[e.key]);
      else if(e.key==='Home')d=new Date(foc.getFullYear(),foc.getMonth(),foc.getDate()-wd);
      else if(e.key==='End')d=new Date(foc.getFullYear(),foc.getMonth(),foc.getDate()+6-wd);
      else if(e.key==='PageUp'||e.key==='PageDown'){t=foc.getMonth()+(e.key==='PageUp'?-1:1);d=new Date(foc.getFullYear(),t,Math.min(foc.getDate(),new Date(foc.getFullYear(),t+1,0).getDate()))}
      else return;
      e.preventDefault();foc=d;view=new Date(d.getFullYear(),d.getMonth(),1);draw();
      el.querySelector('[data-day="'+d.getDate()+'"]').focus();
    });
    draw();
  },

  /* a <nav>: data-pages="9" data-page="3" */
  pagination:function(el){
    var N=Math.max(1,+el.getAttribute('data-pages')||9),cur=clamp(+el.getAttribute('data-page')||1,1,N);
    function draw(){
      /* every page is a 5ch target; a narrow box drops the neighbours instead of wrapping */
      var near=el.clientWidth&&el.clientWidth<374?0:1,pages=[1],p,last=0;
      for(p=cur-near;p<=cur+near;p++)if(p>1&&p<N)pages.push(p);
      if(N>1)pages.push(N);
      var h='<button class="ibtn" type="button" data-p="'+(cur-1)+'"'+(cur===1?' disabled':'')+' aria-label="Previous page">&lt;</button>';
      pages.forEach(function(q){if(q-last>1)h+='<span class="muted" aria-hidden="true">..</span>';h+='<button class="ibtn" type="button" data-p="'+q+'"'+(q===cur?' aria-current="page"':'')+' aria-label="Page '+q+'">'+q+'</button>';last=q});
      el.innerHTML=h+'<button class="ibtn" type="button" data-p="'+(cur+1)+'"'+(cur===N?' disabled':'')+' aria-label="Next page">&gt;</button>';
      el.setAttribute('data-page',cur);
      say(el,'Page '+cur+' of '+N+'.');
    }
    el.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b||b.disabled)return;
      cur=clamp(+b.dataset.p,1,N);draw();emit(el,'change',{page:cur});
      var c=el.querySelector('[aria-current]');if(c)c.focus();
    });
    var w=0;window.addEventListener('resize',function(){if(el.isConnected&&el.clientWidth!==w){w=el.clientWidth;draw()}});
    draw();
  },

  /* an input with the native required/pattern/type rules. The message goes to
     the element its aria-describedby names, or the nearest .error;
     data-error-required and data-error-pattern set the words */
  validate:function(inp){
    var field=inp.closest('.field'),out=byId((inp.getAttribute('aria-describedby')||'').split(' ')[0])||near(inp,null,'.error');
    if(out&&!inp.hasAttribute('aria-describedby'))inp.setAttribute('aria-describedby',uid(out,'error'));
    function check(){
      var v=inp.validity,msg='';
      if(v.valueMissing)msg=inp.getAttribute('data-error-required')||'This one is required.';
      else if(v.patternMismatch)msg=inp.getAttribute('data-error-pattern')||inp.title||'That does not match the format.';
      else if(!v.valid)msg=inp.validationMessage;
      if(field)field.classList.toggle('invalid',!!msg);
      inp.setAttribute('aria-invalid',msg?'true':'false');
      if(out)out.textContent=msg;
    }
    inp.addEventListener('input',check);
    if(inp.value)check();
  },

  /* a textarea with maxlength; the nearest .count shows it */
  counter:function(ta){
    var out=near(ta,'data-status','.count');if(!out)return;
    function up(){var max=ta.maxLength>0?ta.maxLength:0;out.textContent=ta.value.length+(max?'/'+max:'');out.classList.toggle('full',!!max&&ta.value.length>=max)}
    ta.addEventListener('input',up);up();
  },

  /* data-kind="classic|ramp|bounce|dots|fill" */
  spinner:function(el){
    var kind=el.getAttribute('data-kind')||'classic',f=0,R='.:=+*#%@%#*+=:';
    var K={
      classic:function(){return '|/-\\'.charAt(f%4)},
      ramp:function(){return tr(R.charAt(f%R.length)+R.charAt((f+1)%R.length)+R.charAt((f+2)%R.length))},
      bounce:function(){var b=f%10,p=b<5?b:10-b;return '['+rep(' ',p)+'='+rep(' ',5-p)+']'},
      dots:function(){return rep('.',1+(f>>1)%3)},
      fill:function(){return tr(bar((f*0.7)%9|0,8))}
    };
    var fn=K[kind]||K.classic;
    every(110,function(){f++;el.textContent=fn()},el);
  },

  /* a <pre>: a card silhouette with a wave through the ramp */
  skeleton:function(el){
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
    el.__auiDraw=draw;
    every(120,draw,el);
  }
};

/* ---- buttons that do one thing, by attribute, anywhere on the page ---- */
var opener=null;
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
doc.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('[data-aui-open],[data-aui-close],[data-aui-toast],[data-aui-toast-err],[data-aui-reset],[data-aui-fill]');
  if(!t||t.disabled)return;
  if(t.hasAttribute('data-aui-reset')){
    all('input,textarea,select',t.closest('dialog,form')||doc).forEach(function(i){
      if(i.type==='checkbox'||i.type==='radio')i.checked=false;else if(i.type!=='button'&&i.type!=='submit')i.value='';
    });
  }
  if(t.hasAttribute('data-aui-close'))close(t.closest('dialog'));
  if(t.hasAttribute('data-aui-open'))openDialog(near(t,'data-aui-open','dialog'),t);
  if(t.hasAttribute('data-aui-fill'))runFill(near(t,'data-aui-fill','[role="progressbar"]'),t);
  if(t.hasAttribute('data-aui-toast-err'))toast(t.getAttribute('data-aui-toast-err'),true);
  else if(t.hasAttribute('data-aui-toast'))toast(t.getAttribute('data-aui-toast'));
});
/* the whole frame of a field takes the tap, not only the one line inside it */
doc.addEventListener('click',function(e){
  var f=e.target.closest&&e.target.closest('.field');
  if(!f||e.target.closest('input,select,textarea,button,a,label')||f.contains(doc.activeElement))return;
  var i=f.querySelector('input,textarea');if(i&&!i.disabled)i.focus();
});

/* ---- the ids aria needs, made for markup that has none ---- */
var CONTROL='input:not([type="hidden"]),select,textarea';
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
  /* a dialog is named by its .bar-title and described by its first paragraph */
  mine('dialog').forEach(function(d){
    var t=d.querySelector('.bar-title'),p=d.querySelector('.body > p');
    if(t&&!d.hasAttribute('aria-labelledby'))d.setAttribute('aria-labelledby',uid(t,'title'));
    if(p&&!d.hasAttribute('aria-describedby'))d.setAttribute('aria-describedby',uid(p,'desc'));
  });
}

/* ---- wiring ---- */
function init(root){
  root=root||doc;
  link(root);
  var els=all('[data-aui]',root);
  if(root.nodeType===1&&root.hasAttribute('data-aui'))els.unshift(root);
  els.forEach(function(el){
    if(el.__aui)return;
    var fn=behaviors[el.getAttribute('data-aui')];if(!fn)return;
    el.__aui=true;
    try{fn(el)}catch(e){console.error('ascii-ui: '+el.getAttribute('data-aui')+' failed',e)}
  });
}
function start(){
  init(doc);
  /* anything added later gets wired too */
  new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)init(n)})})})
    .observe(doc.documentElement,{childList:true,subtree:true});
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start);else start();

window.ASCIIUI={version:'1.0.0',init:init,toast:toast,progress:setProgress,bar:bar,colorize:colorize,tones:tones,behaviors:behaviors,reduce:reduce};
})();
