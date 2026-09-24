/* ---- navigation ------------------------------------------------------------
   Everything that moves you around the page: the address, the view links in
   the bar, the sidebar, the [=] menu, the crumb, the name, the skip link.

   The address. Every view and every section has one: #components,
   #components/button, #onepager/faq (a section's id minus its s- or o-).
   Picking a view or a section pushes an entry, so Back works; the scroll spy
   only replaces the current one as you read. Loading an address, Back and
   Forward all go through route(). It is all hashes, so it works from file://.

   The landing. A jump puts the section's title (its first visible child) in
   the first row under the bar, and under Play's sticky stage when there is
   one. It is measured from the title, not from css margins, and it is redone
   while the page settles (fonts, charts sizing themselves) until you touch
   anything.

   The list. The sidebar (from 1024px) and the menu (below) print the same
   thing: the view and its count, then Start, the counted sections, About.
   It is built from the sections themselves, so it cannot drift from the
   page, and it follows the Blocks filter. */
(function(){
  const A=window.AUI,$=A.$,nav=$('sidenav'),bar=document.querySelector('.topbar');
  const VIEWS=['kit','blocks','charts','themes','play','apps','page'];
  const LABEL={kit:'Components',blocks:'Blocks',charts:'Charts',themes:'Themes',
               play:'Play',apps:'Apps',page:'One pager'};
  const SLUG={kit:'components',blocks:'blocks',charts:'charts',themes:'themes',
              play:'play',apps:'apps',page:'onepager'};
  /* the address names, plus the old palette names */
  const FROM={components:'kit',kit:'kit',blocks:'blocks',charts:'charts',themes:'themes',
              play:'play',apps:'apps',onepager:'page',page:'page'};
  const tabs=VIEWS.map(v=>$('v-'+v));
  const mod=e=>e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey;
  const tick=()=>{if(A.live())A.sfx.tab()};

  function current(){
    for(const v of VIEWS)if($('v-'+v).getAttribute('aria-selected')==='true')return v;
    return 'kit';
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
  function findSec(v,slug){
    if(!/^[a-z0-9-]+$/.test(slug))return null;
    return $('view-'+v).querySelector(':scope > section[aria-labelledby="s-'+slug+'"],:scope > section[aria-labelledby="o-'+slug+'"]');
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
    const all=sections($('view-'+v)),counted=all.filter(s=>s._chip);
    let title=LABEL[v];
    if(v==='blocks'){const f=filterName();if(f)title+=', '+f}
    if(!counted.length)return {title:title,count:all.length,groups:all.length?[{items:all}]:[]};
    const i0=all.indexOf(counted[0]);
    return {title:title,count:counted.length,groups:[
      {label:'Start',items:all.filter((s,i)=>!s._chip&&i<i0)},
      {items:counted},
      {label:'About',items:all.filter((s,i)=>!s._chip&&i>i0)}
    ].filter(g=>g.items.length)};
  }
  function heading(el,m){
    el.textContent=m.title+' ';
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
    for(const c of sec.children)if(c.offsetParent!==null&&!c.classList.contains('vh'))return c;
    return sec.offsetParent!==null?sec:null;
  }
  /* Play keeps its stage stuck under the bar on a phone, so a section there
     lands under the stage. Found by looking, not by name: anything sticky in
     the view's first two levels */
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
    return Math.max(0,Math.round(first.getBoundingClientRect().top+window.scrollY-(bar?bar.offsetHeight:0)-24));
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
    window.addEventListener(t,()=>{settle=null},{passive:true,capture:true}));
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
  /* go to a view, and to a section in it or to its top. opt.push: true adds
     an entry, false replaces it, missing leaves the address alone. opt.after
     runs once it has landed (the menu closes then) */
  function go(v,sec,opt){
    opt=opt||{};
    const tab=$('v-'+v);if(!tab)return;
    if(opt.push!==undefined)setHash(hashFor(v,sec),opt.push);
    busy=true;
    A.showView(tab,function(){
      busy=false;
      /* a filtered-out block comes back when you ask for it by name */
      let stale=!links.length||links[0].v!==v;
      if(sec&&sec.hidden&&v==='blocks'){const all=document.querySelector('#blockFilters [data-f="all"]');if(all){all.click();stale=true}}
      /* the list is rebuilt now rather than on the next frame, so the pick can
         be marked; not when it is current, or a keyboard would lose its place */
      if(stale)build();
      if(sec){
        const l=links.find(x=>x.sec===sec);
        land(()=>yOf(sec,v),opt.smooth);
        if(l){mark(l);if(opt.smooth)pinned=Date.now()+1200}
      }else if(opt.top0)land(()=>0,opt.smooth);
      else land(()=>yTop(v),opt.smooth);
      if(opt.after)opt.after();
    },opt.instant);
  }
  function parse(h){
    h=(h||'').replace(/^#\/?/,'');
    const parts=h.toLowerCase().split('/'),v=FROM[parts[0]];
    if(!v)return null;
    return {v:v,sec:parts[1]?findSec(v,parts[1]):null};
  }
  /* returns false for an address that is not ours (#main, a demo's #) */
  function route(h,push,instant){
    if(!h||h==='#'){if(push===undefined){go('kit',null,{top0:true,instant:instant});return true}return false}
    const r=parse(h);if(!r)return false;
    go(r.v,r.sec,{push:push?true:undefined,instant:instant});
    return true;
  }
  function onNav(){
    if(location.hash===routed)return;
    routed=location.hash;route(location.hash);
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
      let n=null;
      if(e.key==='ArrowRight')n=tabs[(i+1)%tabs.length];
      else if(e.key==='ArrowLeft')n=tabs[(i-1+tabs.length)%tabs.length];
      else if(e.key==='Home')n=tabs[0];
      else if(e.key==='End')n=tabs[tabs.length-1];
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
    if(nav)nav.hidden=!m.groups.length;
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
       bottom of the page the last one whose title is on screen is the one */
    if(window.scrollY>=document.documentElement.scrollHeight-window.innerHeight-2){
      for(let i=links.length-1;i>=0;i--){
        const a=anchor(links[i].sec);if(!a)continue;
        const t=a.getBoundingClientRect().top;
        if(t>L&&t<window.innerHeight-48){row=[links[i]];break}
        if(t<=L)break;
      }
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

  /* ---- the name, the crumb, the skip link ---- */
  $('brand').addEventListener('click',function(){
    settle=null;
    window.scrollTo({top:0,behavior:A.reduce?'auto':'smooth'});
    tick();
  });
  function crumb(){
    const v=current();
    $('crumbName').textContent=LABEL[v];
    $('crumb').setAttribute('aria-label',LABEL[v]+', open the menu');
  }
  document.addEventListener('aui:view',crumb);
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
    $('mSnd').checked=$('soundToggle').checked;
    $('mGrid').checked=$('gridToggle').checked;
    $('mGl').checked=$('glitchToggle').checked;
    const to=A.currentTheme()==='dark'?'light':'dark',b=$('mTheme');
    b.querySelector('.label').textContent=to==='light'?'Light':'Dark';
    b.setAttribute('aria-label','Switch to '+to+' theme');
  }
  function openMenu(from){
    if(md.open)return;
    syncControls();fill(current());
    opener=from;focusTo=null;
    md.classList.remove('out');md.showModal();
    [$('menuBtn'),$('crumb')].forEach(b=>b.setAttribute('aria-expanded','true'));
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
  $('crumb').addEventListener('click',()=>openMenu($('crumb')));
  $('menuX').addEventListener('click',closeMenu);
  md.addEventListener('cancel',e=>{e.preventDefault();closeMenu()});
  /* whatever closed it, focus goes where you went, or back where you were */
  md.addEventListener('close',()=>{
    md.classList.remove('out');
    [$('menuBtn'),$('crumb')].forEach(b=>b.setAttribute('aria-expanded','false'));
    if(focusTo){focusTo.tabIndex=-1;focusTo.focus({preventScroll:true});focusTo=null}
    else if(opener&&opener.offsetParent!==null)opener.focus();
  });
  mv.addEventListener('click',e=>{
    const t=e.target.closest('[role="tab"]');if(!t)return;
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
    if(n){e.preventDefault();n.focus();n.click()}
  });
  ms.addEventListener('click',e=>{
    const a=e.target.closest('a.navlink');if(!a||mod(e))return;
    const l=mlinks.find(x=>x.a===a);if(!l)return;
    e.preventDefault();
    if(A.live())A.tone('square',440,0,0.05,0.4);
    go(l.v,l.sec,{push:true,after:()=>{focusTo=l.sec;closeMenu()}});
  });
  $('mSnd').addEventListener('change',()=>{if($('soundToggle').checked!==$('mSnd').checked)$('soundToggle').click()});
  $('mGrid').addEventListener('change',()=>{if($('gridToggle').checked!==$('mGrid').checked)$('gridToggle').click()});
  $('mGl').addEventListener('change',()=>{if($('glitchToggle').checked!==$('mGl').checked)$('glitchToggle').click()});
  /* the curtain has to be seen, so the menu steps out of its way */
  $('mTheme').addEventListener('click',()=>{closeMenu();$('themeToggle').click()});

  /* ---- start ---- */
  try{history.scrollRestoration='manual'}catch(e){}
  build();crumb();
  if(location.hash)route(location.hash,undefined,true);

  /* A.jump: the chip index and anything else that sends you to a section */
  A.jump=function(sec){
    const p=sec.closest('[role="tabpanel"]');if(!p)return;
    go(p.id.replace(/^view-/,''),sec,{push:true});
  };
  window.AUI_NAV={build:build,route:route,go:go,model:model};
})();
