/* ---- navigation ------------------------------------------------------------
   Everything that moves you around the page: the address, the view links in
   the bar, the sidebar, the [=] menu, the name, the skip link.

   The address. Every view and every section has one: #components,
   #components/button, #onepager/faq (a section's id minus its s- or o-).
   Picking a view or a section pushes an entry, so Back works; the scroll spy
   only replaces the current one as you read. Loading an address, Back and
   Forward all go through route(). It is all hashes, so it works from file://.

   The landing. A jump puts the section's title (its first visible child) in
   the first row under the bar, and under anything the view keeps stuck
   there, when it has one. It is measured from the title, not from css margins, and it is redone
   while the page settles (fonts, charts sizing themselves) until you touch
   anything.

   The list. The sidebar (from 1024px) and the menu (below) print the same
   thing: the view and its count (none for Themes), then Getting started and the groups.
   It is built from the sections themselves, so it cannot drift from the
   page, and it follows the Blocks filter. */
(function(){
  const A=window.AUI,$=A.$,nav=$('sidenav'),bar=document.querySelector('.topbar');
  const VIEWS=['home','kit','blocks','charts','themes'];
  const LABEL={home:'Home',kit:'Components',blocks:'Blocks',charts:'Charts',themes:'Themes'};
  const SLUG={home:'home',kit:'components',blocks:'blocks',charts:'charts',themes:'themes'};
  /* the address names, plus the old palette names. Play, Apps and One pager
     are gone; old links to them land on Home */
  const FROM={home:'home',components:'kit',kit:'kit',blocks:'blocks',charts:'charts',themes:'themes',
              play:'home',apps:'home',onepager:'home',page:'home'};
  const tabs=VIEWS.map(v=>$('v-'+v));
  const mod=e=>e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey;
  const tick=()=>{if(A.live())A.sfx.tab()};

  function current(){
    for(const v of VIEWS)if($('v-'+v).getAttribute('aria-selected')==='true')return v;
    return 'home';
  }
  function name(sec){
    const h=sec.querySelector('h2,h3');
    return h?h.textContent.trim():(sec.getAttribute('aria-label')||'').trim();
  }
  const slugOf=sec=>(sec.getAttribute('aria-labelledby')||'').replace(/^[so]-/,'');
  const hashFor=(v,sec)=>'#'+SLUG[v]+(sec?'/'+slugOf(sec):'');
  function sections(p){
    return [].slice.call(p.querySelectorAll(':scope > section[aria-labelledby]'))
             .filter(s=>!s.hidden&&name(s));
  }
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  function findSec(v,slug){
    const p=$('view-'+v);
    if(!p||!/^[a-z0-9-]+$/.test(slug||''))return null;
    return p.querySelector(':scope > section[aria-labelledby="s-'+slug+'"],:scope > section[aria-labelledby="o-'+slug+'"]');
  }

  /* ---- the list ---- */
  function filterName(){
    const b=document.querySelector('#blockFilters .chip[aria-pressed="true"]');
    return b&&b.dataset.f!=='all'?b.textContent.trim():'';
  }
  /* Where a view has a chip index, the count is what the index counts. The
     sections it leaves out (Installation, Rules) are not components: they get
     a small group of their own, Start before and About after, so the heading
     comes first and its number matches the list under it. */
  function model(v){
    /* Home is a landing, not a list: no sidebar */
    if(v==='home')return {title:LABEL[v],count:0,groups:[]};
    if(v==='themes'){const all=sections($('view-themes'));return {title:LABEL[v],count:null,groups:all.length?[{items:all}]:[]}}
    const all=sections($('view-'+v)),counted=all.filter(s=>s._chip);
    let title=LABEL[v];
    if(v==='blocks'){const f=filterName();if(f)title+=', '+f}
    if(!counted.length)return {title:title,count:all.length,groups:all.length?[{items:all}]:[]};
    const i0=all.indexOf(counted[0]);
    /* a grouped view (Components) lists its parts under their groups */
    const mid=[];
    counted.forEach(s=>{const g=s.dataset.group,last=mid[mid.length-1];
      if(last&&last.label===g)last.items.push(s);else mid.push({label:g,items:[s]})});
    /* the sections outside the index are the way in, so they are listed first
       wherever they sit on the page */
    return {title:title,count:counted.length,groups:[
      {label:'Getting started',items:all.filter(s=>!s._chip)}
    ].concat(mid).filter(g=>g.items.length)};
  }
  function heading(el,m){
    el.textContent=m.title+' ';
    /* Themes is a set of tools, not a catalog: a number there reads as the presets */
    if(m.count==null)return;
    const c=document.createElement('span');c.className='navcount';c.textContent=m.count;
    el.appendChild(c);
  }
  function render(box,m,v,htag){
    box.innerHTML='';
    if(htag){const h=document.createElement(htag);h.className='navh';heading(h,m);box.appendChild(h)}
    const out=[];
    m.groups.forEach(g=>{
      const wrap=document.createElement('div'),ul=document.createElement('ul');
      wrap.className='navgroup';
      if(g.label){
        const l=document.createElement('p');l.className='navlabel';l.textContent=g.label;
        l.setAttribute('aria-hidden','true');ul.setAttribute('aria-label',g.label);
        wrap.appendChild(l);
      }
      g.items.forEach(sec=>{
        const li=document.createElement('li'),a=document.createElement('a');
        a.className='navlink';a.href=hashFor(v,sec);a.textContent=name(sec);
        li.appendChild(a);ul.appendChild(li);
        out.push({a:a,sec:sec,v:v});
      });
      wrap.appendChild(ul);box.appendChild(wrap);
    });
    return out;
  }

  /* ---- the landing ---- */
  /* the title, or whatever the section shows first */
  function anchor(sec){
    /* a visually hidden title is 1px tall; the docs views draw theirs, so it counts when it shows */
    for(const c of sec.children)if(c.offsetParent!==null&&c.offsetHeight>1)return c;
    return sec.offsetParent!==null?sec:null;
  }
  /* A view that keeps something stuck under the bar (Play's stage did, on a
     phone) lands its sections under it. Found by looking, not by name:
     anything sticky in the view's first two levels */
  function sticky(p){
    const els=[].slice.call(p.querySelectorAll(':scope > *,:scope > * > *'));
    for(const e of els)if(e.offsetParent!==null&&getComputedStyle(e).position==='sticky')return e;
    return null;
  }
  let stick=null,stickOf=null;
  function line(v){
    if(stickOf!==v){stickOf=v;stick=sticky($('view-'+v))}
    return (bar?bar.offsetHeight:0)+(stick?stick.offsetHeight:0);
  }
  function yOf(sec,v){
    const a=anchor(sec);if(!a)return null;
    return Math.max(0,Math.round(a.getBoundingClientRect().top+window.scrollY-line(v)));
  }
  /* the view's first block one row under the bar, as the engine does it */
  function yTop(v){
    const p=$('view-'+v),first=[].filter.call(p.children,c=>c.offsetParent!==null)[0]||p;
    return Math.max(0,Math.round(first.getBoundingClientRect().top+window.scrollY-(bar?bar.offsetHeight:0)-A.ROW));
  }
  /* The page keeps moving for a moment after a jump: the font arrives,
     charts and pictures size themselves, titles refit. Until then the landing
     is redone whenever main changes size, unless you have touched anything. */
  let settle=null;
  function land(where,smooth){
    const y=where();if(y==null)return;
    window.scrollTo({top:y,behavior:smooth&&!A.reduce?'smooth':'auto'});
    settle={where:where,until:Date.now()+(smooth?1600:2500)};
  }
  function resettle(){
    if(!settle)return;
    if(Date.now()>settle.until){settle=null;return}
    const y=settle.where();
    if(y!=null&&Math.abs(y-window.scrollY)>2)window.scrollTo(0,y);
  }
  ['wheel','touchstart','keydown','pointerdown'].forEach(t=>
    window.addEventListener(t,()=>{settle=null;pinned=0},{passive:true,capture:true}));
  if('ResizeObserver' in window)new ResizeObserver(()=>resettle()).observe($('main'));
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(resettle);
  window.addEventListener('load',resettle);

  /* ---- the address ---- */
  let routed=location.hash,busy=false;
  function setHash(h,push){
    if(h===location.hash)return;
    try{history[push?'pushState':'replaceState'](null,'',h)}
    catch(e){if(push)location.hash=h}
    routed=location.hash;
  }
  /* the tab's name follows the address: Section, View, ascii/ui. Home keeps
     the <title> in index.html, which is what search shows for the page */
  const HOME=document.title;
  function title(v,sec){
    const t=[];
    if(sec&&name(sec))t.push(name(sec));
    if(v&&v!=='home')t.push(LABEL[v]);
    document.title=t.length?t.concat('ascii/ui').join(', '):HOME;
  }
  /* go to a view, and to a section in it or to its top. opt.push: true adds
     an entry, false replaces it, missing leaves the address alone. opt.after
     runs once it has landed (the menu closes then) */
  function go(v,sec,opt){
    opt=opt||{};
    const tab=$('v-'+v);if(!tab)return;
    if(!opt.nosig)noSignal(null);
    if(opt.push!==undefined)setHash(hashFor(v,sec),opt.push);
    busy=true;
    A.showView(tab,function(){
      busy=false;
      if(opt.nosig)document.title='No signal, ascii/ui';else title(v,sec);
      /* a filtered-out block comes back when you ask for it by name */
      let stale=!links.length||links[0].v!==v;
      if(sec&&sec.hidden&&v==='blocks'){const all=document.querySelector('#blockFilters [data-f="all"]');if(all){all.click();stale=true}}
      /* the list is rebuilt now rather than on the next frame, so the pick can
         be marked; not when it is current, or a keyboard would lose its place */
      if(stale)build();
      if(sec){
        const l=links.find(x=>x.sec===sec);
        land(()=>yOf(sec,v),opt.smooth);
        /* every landing is pinned while it settles, so the spy cannot hand
           the address to a neighbour before the page stops moving */
        if(l){mark(l);pinned=Date.now()+(opt.smooth?1200:2600)}
      }else if(opt.el){
        /* something that is not a section (the footer game): land on it and
           keep it there while the view settles, like a section */
        const el=opt.el,mid=opt.block==='center';
        land(()=>{const r=el.getBoundingClientRect(),tb=document.querySelector('.topbar');
          return Math.max(0,window.scrollY+r.top-(mid?(window.innerHeight-r.height)/2:(tb?tb.offsetHeight:0)))},opt.smooth);
      }else if(opt.top0)land(()=>0,opt.smooth);
      else if(v==='home')land(()=>0,opt.smooth);
      else land(()=>yTop(v),opt.smooth);
      if(opt.after)opt.after();
    },opt.instant);
  }
  function parse(h){
    h=(h||'').replace(/^#\/?/,'');
    const parts=h.toLowerCase().split('/'),v=own(FROM,parts[0])?FROM[parts[0]]:null;
    if(!v)return null;
    const sec=parts[1]?findSec(v,parts[1]):null;
    return {v:v,sec:sec,lost:!!parts[1]&&!sec};
  }
  /* an address that is neither ours nor something on the page (#bogus/x)
     lands on Home and leaves the address bare */
  function stray(h){
    let el=null;
    try{el=document.getElementById(decodeURIComponent(h.slice(1)))}catch(e){}
    if(el)return false;
    try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
    routed=location.hash;
    const box=noSignal(h);
    go('home',null,box?{el:box,instant:true,nosig:true,after:()=>{const t=$('noSigH');if(t)t.focus({preventScroll:true})}}:{top0:true,instant:true});
    return true;
  }
  /* No signal: what an address that is neither a view nor anything on the
     page gets. It is a block at the top of Home, drawn in characters, with
     the way back; the address bar goes bare. noSignal(null) puts it away */
  /* the snow under the title is the dead channel: it moves, a frame every
     160ms, while it is on screen and the glitch is on. Reduced motion or
     Glitch off leaves the still frame in the html */
  let snowT=null;
  const SNOW=' .:=+-*#@';
  function snow(box){
    const pre=box.querySelector('.nosig-snow');if(!pre||A.reduce||snowT)return;
    const cols=Math.max(8,Math.floor(pre.clientWidth/(A.CH()||9.6)));
    snowT=A.every(160,()=>{
      let o='';
      for(let y=0;y<3;y++){for(let x=0;x<cols;x++)o+=SNOW.charAt(Math.random()<0.35?0:Math.floor(Math.random()*SNOW.length));if(y<2)o+='\n'}
      pre.textContent=A.TR(o);
    },{el:pre,gate:()=>A.G.on&&A.G.amt>0});
  }
  function noSignal(h){
    const box=$('noSig');if(!box)return null;
    if(h==null){if(snowT){snowT.stop();snowT=null}if(!box.hidden)box.hidden=true;document.body.classList.remove('nosig-on');return null}
    let at=h;try{at=decodeURIComponent(h)}catch(e){}
    $('noSigAt').textContent=at.replace(/[\u0000-\u001f]/g,'').slice(0,48);
    box.hidden=false;
    /* the hero is not drawn under No signal, so its photo button goes too */
    document.body.classList.add('nosig-on');
    if(A.layout)A.layout();
    snow(box);
    return box;
  }
  if($('noSigHome'))$('noSigHome').addEventListener('click',()=>{go('home',null,{push:false,top0:true});tick()});
  if($('noSigFind'))$('noSigFind').addEventListener('click',()=>{if(window.AUI_SEARCH)window.AUI_SEARCH.open()});
  const GONE={play:'Play is gone. Its toys live in Themes, Labs.',
              onepager:'One pager is gone. Its toys live in Themes, Labs.',
              page:'One pager is gone. Its toys live in Themes, Labs.',
              apps:'Apps is gone. This is Home.'};
  const said=msg=>{if(A.toast)A.toast(msg);else if(A.say)A.say(msg)};
  /* returns false for an address that is not ours (#main, a demo's #) */
  function route(h,push,instant){
    if(!h||h==='#'){if(push===undefined){go('home',null,{top0:true,instant:instant});return true}return false}
    const r=parse(h);if(!r)return false;
    /* an old address (Play, Apps, One pager) lands on Home and says so. A
       section that is not there lands on its view, and the address loses it */
    const old=!/^#\/?(home|components|kit|blocks|charts|themes)(\/|$)/i.test(h);
    if(old&&!r.sec)said(GONE[h.replace(/^#\/?/,'').split('/')[0].toLowerCase()]||GONE.play);
    /* a stale link (#components/datepicker) used to land on the view without a
       word. It still lands there, and says what it did not find, in yellow */
    else if(r.lost){
      let name=h.replace(/^#\/?/,'').split('/')[1]||'';try{name=decodeURIComponent(name)}catch(e){}
      name=name.replace(/[^\w .-]/g,'').slice(0,32);
      /* the / key is only named where there is a keyboard to press it on */
      const keys=!(window.matchMedia&&matchMedia('(hover:none) and (pointer:coarse)').matches);
      const msg=(name?'No section called '+name:'No such section')+' in '+LABEL[r.v]+'. Search '+(keys?'(/) ':'')+'has the list.';
      if(A.say)A.say(msg,true,true);
    }
    go(r.v,r.sec,{push:old||r.lost?false:(push?true:undefined),instant:instant});
    return true;
  }
  function onNav(){
    if(location.hash===routed)return;
    routed=location.hash;
    if(!route(location.hash)&&location.hash)stray(location.hash);
  }
  window.addEventListener('popstate',onNav);
  window.addEventListener('hashchange',onNav);

  /* ---- the views in the bar ----
     Links, so they can be copied or opened in a new tab. Arrows move along
     them and Enter or Space picks, so reading the list does not change the
     page under you. */
  tabs.forEach((t,i)=>{
    t.addEventListener('click',e=>{
      if(mod(e))return;
      e.preventDefault();
      const v=VIEWS[i],here=t.getAttribute('aria-selected')==='true';
      if(here)tick();
      go(v,null,{push:true,smooth:here});
    });
    t.addEventListener('keydown',e=>{
      /* the arrows walk the tabs that are drawn: Home's is not */
      const vt=tabs.filter(x=>x.offsetParent!==null),k=vt.indexOf(t);
      let n=null;
      if(e.key==='ArrowRight')n=vt[(k+1)%vt.length];
      else if(e.key==='ArrowLeft')n=vt[(k-1+vt.length)%vt.length];
      else if(e.key==='Home')n=vt[0];
      else if(e.key==='End')n=vt[vt.length-1];
      else if(e.key===' '){e.preventDefault();t.click();return}
      if(n){e.preventDefault();tabs.forEach(x=>x.tabIndex=x===n?0:-1);n.focus()}
    });
  });
  /* leaving the list, Tab comes back to the view you are in */
  $('views').addEventListener('focusout',e=>{
    if($('views').contains(e.relatedTarget))return;
    tabs.forEach(x=>x.tabIndex=x.getAttribute('aria-selected')==='true'?0:-1);
  });

  /* ---- the sidebar ---- */
  const inner=document.createElement('div');inner.className='side-in';
  if(nav)nav.appendChild(inner);
  let links=[],reading=null,pinned=0;

  function build(){
    const v=current(),m=model(v);
    if(nav&&nav.hidden!==!m.groups.length)nav.hidden=!m.groups.length;
    /* what you were reading stays marked across a rebuild */
    const was=reading&&reading.sec;
    links=render(inner,m,v,'h2');
    reading=links.find(l=>l.sec===was)||null;
    if(reading)reading.a.setAttribute('aria-current','location');
    stickOf=null;
    spy();
    if(md.open&&shown===v)fill(v);
  }
  inner.addEventListener('click',e=>{
    const a=e.target.closest('a.navlink');if(!a||mod(e))return;
    const l=links.find(x=>x.a===a);if(!l)return;
    e.preventDefault();
    go(l.v,l.sec,{push:true,smooth:true});
    tick();
  });

  function mark(l){
    if(reading===l)return;
    if(reading)reading.a.removeAttribute('aria-current');
    reading=l;
    if(l){
      l.a.setAttribute('aria-current','location');
      /* keep the marked entry inside the sidebar's own scroll */
      const nb=inner.getBoundingClientRect(),bb=l.a.getBoundingClientRect();
      if(nb.height&&(bb.top<nb.top+48||bb.bottom>nb.bottom))inner.scrollTop+=bb.top-nb.top-nb.height/3;
    }
    /* the address follows what you read, without adding to Back */
    if(!busy&&!(l===null&&!location.hash))setHash(hashFor(current(),l&&l.sec),false);
    if(!busy)title(current(),l&&l.sec);
  }

  /* You are reading the last section whose title has reached the line a jump
     lands on. In a gallery a whole row shares one top: if you picked one of
     them, that one stays marked, otherwise the row's first speaks for it.
     Above the first section (the hero, an intro) nothing is being read. */
  function spy(){
    if(!links.length||busy||Date.now()<pinned)return;
    const v=current();if(links[0].v!==v)return;
    const L=line(v)+4;
    let top=-Infinity,row=[];
    for(const l of links){
      const a=anchor(l.sec);if(!a)continue;
      const t=a.getBoundingClientRect().top;
      if(t>L)continue;
      if(t>top+2){top=t;row=[l]}
      else if(t>top-2)row.push(l);
    }
    /* the last sections of a short view can never reach the line: at the
       bottom of the page the one you landed on stays marked while its title
       is on screen, otherwise the last title on screen, in page order */
    if(window.scrollY>=document.documentElement.scrollHeight-window.innerHeight-2){
      let keep=false,last=null,lt=-Infinity;
      for(const l of links){
        const a=anchor(l.sec);if(!a)continue;
        const t=a.getBoundingClientRect().top;
        if(t<L-8||t>=window.innerHeight-48)continue;
        if(l===reading)keep=true;
        if(t>L&&t>lt){lt=t;last=l}
      }
      if(keep)row=[reading];else if(last)row=[last];
    }
    mark(row.length?(row.indexOf(reading)>=0?reading:row[0]):null);
  }
  let ticking=false;
  function spySoon(){
    if(ticking)return;ticking=true;
    requestAnimationFrame(function(){ticking=false;spy()});
  }
  window.addEventListener('scroll',spySoon,{passive:true});
  window.addEventListener('resize',()=>{stickOf=null;spySoon()});

  /* Views are swapped by toggling hidden, and so is the Blocks filter, which
     the docs builder does in its own time. So watch the attribute rather than
     guess a delay. */
  let queued=false;
  function rebuild(){
    if(queued)return;queued=true;
    requestAnimationFrame(function(){queued=false;build()});
  }
  new MutationObserver(rebuild).observe($('main'),{
    attributes:true,attributeFilter:['hidden'],subtree:true
  });

  /* ---- the name, the skip link ---- */
  /* the name is Home, and on Home it is the way back to the top */
  $('brand').addEventListener('click',function(){
    settle=null;noSignal(null);
    if(current()==='home')window.scrollTo({top:0,behavior:A.reduce?'auto':'smooth'});
    else go('home',null,{push:true,top0:true});
    tick();
  });
  $('skip').addEventListener('click',e=>{
    e.preventDefault();
    const m=$('main');m.tabIndex=-1;m.focus();
  });

  /* ---- the [=] menu ----
     The whole screen, below 1024px. The row of views only chooses whose
     sections are listed; the page changes when you pick a section, and then
     it lands before the menu steps out, so what you see next is the title. */
  const md=$('menuDlg'),mv=$('menuViews'),ms=$('menuSecs'),mp=$('menuPanel');
  let shown=null,mlinks=[],opener=null,focusTo=null;
  mv.setAttribute('role','tablist');mp.setAttribute('role','tabpanel');
  mv.innerHTML=VIEWS.map(v=>'<button class="tab" type="button" role="tab" id="mv-'+v+'" data-v="'+v+
    '" aria-controls="menuPanel" aria-selected="false" tabindex="-1">'+LABEL[v]+'</button>').join('');
  const mtabs=[].slice.call(mv.querySelectorAll('[role="tab"]'));

  function fill(v){
    shown=v;
    mtabs.forEach(t=>{const on=t.dataset.v===v;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1});
    mp.setAttribute('aria-labelledby','mv-'+v);
    const m=model(v);
    heading($('menuH'),m);
    mlinks=render(ms,m,v,null);
    mlinks.forEach(l=>{if(reading&&l.sec===reading.sec)l.a.setAttribute('aria-current','location')});
  }
  function syncControls(){
    $('mGrid').checked=$('gridToggle').checked;
    $('mGl').checked=$('glitchToggle').checked;
  }
  function openMenu(from){
    if(md.open)return;
    syncControls();fill(current());
    opener=from;focusTo=null;
    md.classList.remove('out');md.showModal();
    $('menuBtn').setAttribute('aria-expanded','true');
    /* start where you are: the section you are reading, in the middle of the
       list, or else the view */
    const body=md.querySelector('.menu-body'),cur=ms.querySelector('[aria-current]'),t=mtabs.find(x=>x.dataset.v===shown);
    mv.scrollLeft=t.offsetLeft-mv.clientWidth/2+t.offsetWidth/2;
    if(cur){body.scrollTop=cur.offsetTop-body.clientHeight/2;cur.focus({preventScroll:true})}
    else{body.scrollTop=0;t.focus({preventScroll:true})}
    if(A.live())A.sfx.open();
  }
  function closeMenu(){
    if(!md.open||md.classList.contains('out'))return;
    const done=()=>{md.classList.remove('out');md.close()};
    if(A.reduce){done();return}
    md.classList.add('out');
    /* the same four steps as it came in, unless the css has none to give */
    if(getComputedStyle(md).animationName.indexOf('menuout')<0){done();return}
    md.addEventListener('animationend',function f(e){
      if(e.animationName!=='menuout')return;
      md.removeEventListener('animationend',f);done();
    });
  }
  $('menuBtn').addEventListener('click',()=>openMenu($('menuBtn')));
  $('menuX').addEventListener('click',closeMenu);
  md.addEventListener('cancel',e=>{e.preventDefault();closeMenu()});
  /* whatever closed it, focus goes where you went, or back where you were */
  md.addEventListener('close',()=>{
    md.classList.remove('out');
    $('menuBtn').setAttribute('aria-expanded','false');
    if(focusTo){focusTo.tabIndex=-1;focusTo.focus({preventScroll:true});focusTo=null}
    else if(opener&&opener.offsetParent!==null)opener.focus();
    /* the [=] button is gone when the screen widened past 1024px: the view
       you are in takes the focus, or the name when that is Home */
    else if(md.contains(document.activeElement)||document.activeElement===document.body){
      const t=$('v-'+current()),to=t&&t.offsetParent!==null?t:$('brand');
      if(to)to.focus({preventScroll:true});
    }
  });
  mv.addEventListener('click',e=>{
    const t=e.target.closest('[role="tab"]');if(!t)return;
    /* Home has no sections to pick, so its tab goes there */
    if(t.dataset.v==='home'){tick();go('home',null,{push:true,top0:true,after:closeMenu});return}
    if(t.dataset.v!==shown){fill(t.dataset.v);md.querySelector('.menu-body').scrollTop=0;tick()}
  });
  /* the row only refills the list, so the arrows can pick as they go */
  mv.addEventListener('keydown',e=>{
    const i=mtabs.indexOf(document.activeElement);if(i<0)return;
    let n=null;
    if(e.key==='ArrowRight')n=mtabs[(i+1)%mtabs.length];
    else if(e.key==='ArrowLeft')n=mtabs[(i-1+mtabs.length)%mtabs.length];
    else if(e.key==='Home')n=mtabs[0];
    else if(e.key==='End')n=mtabs[mtabs.length-1];
    /* Home's tab goes somewhere when picked, so the arrows only reach it;
       Enter or Space takes you there */
    if(n){
      e.preventDefault();
      mtabs.forEach(x=>x.tabIndex=x===n?0:-1);n.focus();
      if(n.dataset.v!=='home')n.click();
    }
  });
  ms.addEventListener('click',e=>{
    const a=e.target.closest('a.navlink');if(!a||mod(e))return;
    const l=mlinks.find(x=>x.a===a);if(!l)return;
    e.preventDefault();
    if(A.live())A.tone('square',440,0,0.05,0.4);
    go(l.v,l.sec,{push:true,after:()=>{focusTo=l.sec;closeMenu()}});
  });
  /* the menu is for narrow screens: widen past 1024px and it steps out */
  const wide=matchMedia('(min-width:1024px)'),onWide=e=>{if(e.matches&&md.open)closeMenu()};
  if(wide.addEventListener)wide.addEventListener('change',onWide);else if(wide.addListener)wide.addListener(onWide);
  $('mGrid').addEventListener('change',()=>{if($('gridToggle').checked!==$('mGrid').checked)$('gridToggle').click()});
  $('mGl').addEventListener('change',()=>{if($('glitchToggle').checked!==$('mGl').checked)$('glitchToggle').click()});

  /* ---- tab strips inside a section ----
     The Preview and Code tabs (and any other strip in a section) take Home
     and End to their first and last tab. A strip that handles them itself
     says so by preventing the default, and is left alone. */
  $('main').addEventListener('keydown',e=>{
    if(e.defaultPrevented||(e.key!=='Home'&&e.key!=='End')||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;
    const t=e.target.closest&&e.target.closest('[role="tab"]'),tl=t&&t.closest('[role="tablist"]');
    if(!tl||!tl.closest('section'))return;
    const all=[].slice.call(tl.querySelectorAll('[role="tab"]')).filter(x=>x.closest('[role="tablist"]')===tl&&!x.disabled&&x.offsetParent!==null);
    const n=e.key==='Home'?all[0]:all[all.length-1];if(!n)return;
    e.preventDefault();
    if(n!==t)n.click();
    n.focus();
  });

  /* ---- [#]: copy a section's address ----
     After every section's title, in every view. It copies the public
     address (https://ascii.fedekotek.design/#components/button), so a copy
     made from file:// or a preview still works for whoever gets it, and the
     address bar says the same. Where the browser will not copy (file://, an
     old browser) it says the address instead, never an error */
  const SITE='https://ascii.fedekotek.design/';
  function copyLink(sec,b){
    const v=VIEWS.find(x=>$('view-'+x).contains(sec));if(!v)return;
    const hs=hashFor(v,sec),url=SITE+hs;
    if(current()===v)setHash(hs,false);
    const ok=()=>{
      A.say('Copied the link to '+name(sec)+'.');
      if(!A.reduce){b.classList.add('ok');if(b._t)b._t.stop();b._t=A.times(900,1,function(){},function(){b.classList.remove('ok');b._t=null})}
    };
    const no=()=>A.say('Copy is blocked here. The link is '+url,true);
    try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(ok,no);return}}catch(e){}
    no();
  }
  VIEWS.forEach(v=>{
    [].forEach.call($('view-'+v).querySelectorAll(':scope > section[aria-labelledby]'),sec=>{
      const h=$(sec.getAttribute('aria-labelledby'));
      if(!h||h.parentNode!==sec||!/^H[23]$/.test(h.tagName)||sec.querySelector(':scope > .hlink'))return;
      const b=document.createElement('button');
      b.type='button';b.className='hlink';b.textContent='[#]';
      b.setAttribute('aria-label','Copy the link to '+h.textContent.trim());b.title='Copy the link';
      b.addEventListener('click',e=>{e.stopPropagation();copyLink(sec,b);tick()});
      h.classList.add('hl-h');h.after(b);
    });
  });

  /* ---- the reel, at the top of How it was made ----
     Only a poster until you press play: then the video is made, muted, with
     controls, and played because you asked. Under reduced motion it waits
     for you to press play in its own controls. Two sources: WebM (VP9, Opus)
     first, MP4 (H.264, AAC) for Safari, only the ones this browser says it
     can play. It tries the files next to the page, then the ones on the site
     (the single file has no assets folder) */
  const reelBtn=$('reelPlay');
  if(reelBtn){
    const poster=$('reelPoster'),rs=$('reelStatus'),rsrc=$('reelSrc')||{dataset:{}};
    const REL=[rsrc.dataset.webm||'assets/reel.webm',rsrc.dataset.src||'assets/reel.mp4'],ABS=[SITE+'assets/reel.webm',SITE+'assets/reel.mp4'];
    const TYPE=['video/webm; codecs="vp9, opus"','video/mp4; codecs="avc1.640029, mp4a.40.2"'];
    const noPoster=()=>reelBtn.classList.add('noposter');
    poster.addEventListener('error',noPoster);
    if(poster.complete&&!poster.naturalWidth)noPoster();
    reelBtn.addEventListener('click',()=>{
      const v=document.createElement('video');
      v.controls=true;v.muted=true;v.defaultMuted=true;v.playsInline=true;v.preload='auto';
      v.setAttribute('playsinline','');v.setAttribute('aria-label','The ascii/ui reel, 15 seconds');
      if(poster.naturalWidth)v.poster=poster.currentSrc||poster.src;
      let tried=0;
      /* the sources of a list this browser can play; the last one's error
         means none of them loaded (a type it cannot play is skipped silently,
         so it is never added) */
      let noWebm=0;
      const load=list=>{
        const ok=list.map((u,i)=>[u,TYPE[i]]).filter((x,i)=>!(i===0&&noWebm)&&v.canPlayType(x[1]));
        v.replaceChildren(...ok.map((x,i)=>{
          const s=document.createElement('source');s.src=x[0];s.type=x[1];
          if(i===ok.length-1)s.addEventListener('error',fail);
          return s;
        }));
        if(ok.length)v.load();
        return ok.length;
      };
      /* neither copy loads: the dead player goes, the poster comes back, and
         the status line links to the file instead of printing its address */
      const fail=()=>{
        if(!tried){tried=1;if(load(ABS)){if(!A.reduce)v.play().catch(()=>{});return}}
        if(tried>1||!v.isConnected)return;tried=2;
        const had=document.activeElement===v;
        v.replaceChildren();v.load();v.replaceWith(reelBtn);if(had)reelBtn.focus({preventScroll:true});
        rs.textContent='';rs.classList.add('err');
        setTimeout(()=>{
          rs.textContent='The reel did not load here. ';
          const a=document.createElement('a');a.className='inl';a.href=ABS[1];a.target='_blank';a.rel='noopener';a.textContent='Open it on the site';
          rs.append(a,'.');
        },40);
      };
      /* a file that arrives but will not decode. A WebM a browser said it
         could play and then could not gets one more go, as the MP4 */
      v.addEventListener('error',()=>{
        if(!noWebm&&/\.webm$/.test(v.currentSrc)){noWebm=1;if(load(tried?ABS:REL)){if(!A.reduce)v.play().catch(()=>{});return}}
        fail();
      });
      rs.classList.remove('err');rs.textContent='';
      reelBtn.replaceWith(v);
      v.focus({preventScroll:true});
      if(!load(REL)){fail();return}
      if(A.reduce)rs.textContent='Reduced motion is on, so it waits for you. Press play.';
      else{const pr=v.play();if(pr&&pr.catch)pr.catch(()=>{})}
      tick();
    });
  }

  /* ---- print: the questions open, for browsers without ::details-content
     (css/29 does it where there is). They close again after ---- */
  let printed=[];
  window.addEventListener('beforeprint',()=>{printed=[].filter.call(document.querySelectorAll('details.acc:not([open])'),d=>{d.open=true;return true})});
  window.addEventListener('afterprint',()=>{printed.forEach(d=>{d.open=false});printed=[]});

  /* ---- start ---- */
  try{history.scrollRestoration='manual'}catch(e){}
  build();
  if(location.hash){if(!route(location.hash,undefined,true))stray(location.hash)}
  else title('home',null);

  /* A.jump: the chip index and anything else that sends you to a section */
  A.jump=function(sec){
    const p=sec.closest('[role="tabpanel"]');if(!p)return;
    go(p.id.replace(/^view-/,''),sec,{push:true});
  };
  /* Search (js/80) reads the same sections: every view, every named section,
     Home's landing (Where to start) left out; its Questions and How it was
     made are in, with the questions as keywords. Blocks the filter hides are listed too, go()
     brings them back by name. Keywords are the poster title and the caption. */
  const HOME_OUT=/^(go|nojs)$/;
  function index(){
    return VIEWS.map(v=>({v:v,label:LABEL[v],sections:
      [].slice.call($('view-'+v).querySelectorAll(':scope > section[aria-labelledby]')).filter(s=>name(s)&&!(v==='home'&&HOME_OUT.test(slugOf(s)))).map(s=>{
        const t=s.querySelector('pre.ptitle[data-text]'),c=s.querySelector('p.muted'),
              q=v==='home'?[].map.call(s.querySelectorAll('summary,h3'),x=>x.textContent).join(' '):'';
        return {sec:s,name:name(s),kw:((t?t.dataset.text:'')+' '+(c?c.textContent.trim().slice(0,80):'')+' '+q).toLowerCase()};
      })}));
  }
  window.AUI_NAV={build:build,route:route,go:go,model:model,index:index,current:current};
})();
