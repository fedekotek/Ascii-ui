/* ---- search ------------------------------------------------------------------
   The palette behind [/] in the bar, / and Ctrl K (Cmd K). An input on top, a
   list under it, never blank:
     VIEWS         Home, Components, Blocks, Charts, Themes
     ON THIS PAGE  the sections of the view you are in (Home: Getting started)
     SETTINGS      Theme, Sound, Glitch, Show grid, with their live values
     TRICKS        the verbs that do something to the page
     ABOUT         Credits (whoami) and the kit's changelog: not tricks
   Typing searches every section of every view as well. A word that starts
   with what you typed ranks first, then anything that contains it or has it
   as one of its other names (ALIAS), then captions and partial other names,
   then one typo away. Empty, it also
   offers five COMMON components before the tricks. A typed
   command line (glitch 80, sign ada, rm -rf all) gets a Run row on top that
   hands it to run() in js/20, which answers on the status line.

   The list is a listbox the input drives (aria-activedescendant): the arrows,
   Home and End move the active row, Enter picks it, Esc clears and then
   closes. It is built from AUI_NAV.index() each time it opens, so it cannot
   drift from the page. */
(function(){
  'use strict';
  const A=window.AUI,$=A.$,N=window.AUI_NAV,C=window.AUI3;
  const dlg=$('cmdDlg'),inp=$('cmdIn'),list=$('cmdList'),stat=$('cmdOut'),count=$('cmdCount');
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const MAX=50,HERE=8;

  /* ---- what can be found ---- */
  const say=s=>{stat.textContent=s};
  const flip=id=>()=>{$(id).click()};
  const SETS=[
    /* the value is the theme you see, as the button's name says it
       ("Theme: Dark"). It changes on the tap, before the curtain lands */
    {name:'Theme',kw:'dark light mode colour color',
     val:()=>/dark/i.test($('themeToggle').getAttribute('aria-label')||'')?'dark':'light',
     flip:flip('themeToggle')},
    {name:'Sound',kw:'audio mute noise',val:()=>$('soundToggle').checked?'on':'off',
     flip:()=>{const s=$('soundToggle');if(s.disabled){say('Sound stays off while reduced motion is on.');return false}s.click()}},
    {name:'Glitch',kw:'noise calm motion',val:()=>$('glitchToggle').checked?'on':'off',flip:flip('glitchToggle')},
    {name:'Show grid',kw:'grid debug rows columns',val:()=>$('gridToggle').checked?'on':'off',flip:flip('gridToggle')},
    /* crt: the scanlines, off by default (css/02), kept for the next visit */
    {name:'CRT scanlines',kw:'crt scanlines lines tv monitor retro',val:()=>root.classList.contains('crt')?'on':'off',flip:()=>crt(!root.classList.contains('crt'))}
  ].map(s=>Object.assign({kind:'set'},s));
  const root=document.documentElement;
  function crt(on){
    root.classList.toggle('crt',on);
    try{if(on)localStorage.setItem('aui-crt','1');else localStorage.removeItem('aui-crt')}catch(e){}
  }
  try{if(localStorage.getItem('aui-crt')==='1')root.classList.add('crt')}catch(e){}
  /* things to do that are not tricks on the page: who made it, the kit's
     changelog. They answer in the dialog's own status line or open a page */
  const kitDoc=f=>{const k=$('footKit');return k?k.getAttribute('href').replace(/starter\.html$/,f):'https://ascii.fedekotek.design/kit/'+f};
  function openTab(url){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove()}
  const DOS=[
    {name:'Credits',meta:'whoami',kw:'whoami contact author credits credit who made about fede kotek hire email portfolio designer',
     run:()=>{stat.innerHTML='Designed by <a class="inl" href="https://fedekotek.design" target="_blank" rel="noopener author">Fede Kotek</a>. Built with Claude Code.';return false}},
    {name:'Kit changelog',meta:'kit',kw:'changelog changes versions release releases notes history whats new',
     run:()=>{openTab(kitDoc('CHANGELOG.md'))}}
  ].map(d=>Object.assign({kind:'do',al:words(d.kw)},d));
  const TRICKS=[['Tear','tear'],['Jolt','jolt'],['Boot','boot'],['Poster','poster'],
    ['Invaders','invaders'],['Feed the ring a photo','photo'],['Rebuild','rebuild']]
    .map(t=>({kind:'trick',name:t[0],verb:t[1],meta:t[1],kw:t[1]}));
  /* verbs run() knows. A bare one only gets a Run row when nothing else
     answers to it: "tear" is already a trick, "theme" a setting */
  const VERBS=/^(help|glitch|theme|sound|goto|cd|rm|rebuild|tear|jolt|boot|poster|sign|invaders|photo|ring|torus|tilt|sudo)$/;
  const BARE=/^(help|sudo|ring|torus|tilt|rm)$/;

  /* the other names people type, by section id. They join the keywords, so
     they rank under a match on the name itself */
  const ALIAS={
    's-button':'btn cta submit','s-card':'modal dialog popup panel','s-details':'accordion collapsible faq disclosure',
    's-sheet':'drawer bottom panel','s-dropdown':'menu dropdown-menu actions','s-togglegroup':'toggle segmented',
    's-toggles':'toggle checkbox radio switch','s-command':'palette cmdk search','s-select':'dropdown picker',
    's-separator':'divider rule hr','s-pagination':'pager pages','s-breadcrumb':'crumbs path','s-otp':'otp pin code',
    's-textarea':'multiline','s-calendar':'date datepicker date-picker day month','s-tooltip':'hint','s-toast':'notification snackbar sonner','s-popover':'popup flyout popover',
    's-combobox':'autocomplete typeahead select search combo','s-alertdialog':'confirm are you sure alert-dialog','s-contextmenu':'right click right-click context menu','s-progress':'loading bar',
    's-skeleton':'loading placeholder','s-datatable':'table grid datagrid data-grid sortable sort filter rows columns','s-spinner':'loading loader','s-kbd':'keyboard key shortcut',
    's-install':'install copy code kit download export starter css js cdn license mit version single one file offline html',
    's-table':'table data rows columns grid','s-tokens':'foundations tokens grid type typography spacing colors export download variables',
    's-foundations':'tokens color colors grid ramp tone tones states foundations a11y accessibility accessible',
    's-rules':'principles a11y accessibility accessible','s-presets':'amber gameboy blueprint hotdog paper signal preset presets',
    's-faq':'faq help questions','s-made':'case study process story agents reel video credits about'};
  const COMMON=['s-button','s-input','s-card','s-select','s-toast'];

  let views=[],secGroups=[],bySec=new Map(),byId=new Map(),total=0;
  function build(){
    const ix=N.index();
    bySec=new Map();byId=new Map();
    views=ix.map(x=>({kind:'view',v:x.v,name:x.label,meta:'view',kw:x.v}));
    secGroups=ix.filter(x=>x.sections.length).map(x=>({label:x.label,items:x.sections.map(s=>{
      const id=s.sec.getAttribute('aria-labelledby');
      const it={kind:'sec',v:x.v,sec:s.sec,name:s.name,meta:x.label,kw:s.kw+(ALIAS[id]?' '+ALIAS[id]:''),al:ALIAS[id]?words(ALIAS[id]):[]};
      byId.set(id,it);
      bySec.set(s.sec,it);return it;
    })}));
    total=views.length+bySec.size+SETS.length+TRICKS.length+DOS.length;
  }
  /* the view you are in, as its own list prints it. Home has no list, so it
     offers where to start */
  function here(){
    const v=N.current();
    let label='On this page',secs=[];
    if(v==='home'){
      const g=N.model('kit').groups.filter(g=>g.label==='Getting started')[0];
      label='Getting started';secs=g?g.items:[];
    }else N.model(v).groups.forEach(g=>{secs=secs.concat(g.items)});
    const items=secs.map(s=>bySec.get(s)).filter(Boolean);
    return {label:label,items:items.slice(0,HERE),more:Math.max(0,items.length-HERE)};
  }
  const common=()=>COMMON.map(id=>byId.get(id)).filter(Boolean);

  /* ---- ranking: 0 the name starts with it, 1 a word in the name does,
     2 the name contains it or it is one of the other names (ALIAS) exactly,
     so "type" finds Tokens before every caption that says type,
     3 a keyword starts with it, 4 contains it,
     5 a word in the name is one typo away (a letter wrong, missing, extra or
     swapped), 6 a keyword is ---- */
  function words(s){return s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)}
  function near(a,b){
    if(a===b)return true;
    const la=a.length,lb=b.length;
    if(Math.abs(la-lb)>1)return false;
    let i=0;while(i<la&&i<lb&&a[i]===b[i])i++;
    if(la===lb)return a.slice(i+1)===b.slice(i+1)||
      (a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2));
    return la>lb?a.slice(i+1)===b.slice(i):a.slice(i)===b.slice(i+1);
  }
  /* four letters or more, so "tab" does not turn into "tea" */
  const typo=(t,ws)=>t.length>=4&&ws.some(w=>near(t,w)||(t.length>=5&&w.length>t.length&&near(t,w.slice(0,t.length))));
  function rank(it,toks){
    const n=it.name.toLowerCase(),nw=words(n),k=(it.kw||'').toLowerCase(),kw=words(k);
    let worst=0;
    for(const t of toks){
      let r=9;
      if(n.startsWith(t))r=0;
      else if(nw.some(w=>w.startsWith(t)))r=1;
      else if(n.includes(t)||(it.al&&it.al.indexOf(t)>=0))r=2;
      else if(kw.some(w=>w.startsWith(t)))r=3;
      else if(k.includes(t))r=4;
      else if(typo(t,nw))r=5;
      else if(typo(t,kw))r=6;
      if(r>worst)worst=r;
      if(worst===9)break;
    }
    return worst;
  }
  function runRow(q){
    const a=q.split(/\s+/),c=a[0].toLowerCase();
    if(!VERBS.test(c)||(a.length<2&&!BARE.test(c)))return null;
    return {kind:'run',name:'Run: '+q,line:q,meta:'command'};
  }

  /* ---- drawing ---- */
  let rows=[],act=-1;
  const meta=it=>it.kind==='set'?'['+it.val()+']':it.meta;
  function rowHTML(it,n){
    return '<div role="option" id="so-'+n+'" class="s-row k-'+it.kind+'" aria-selected="false" data-n="'+n+'">'+
      '<span class="s-mk" aria-hidden="true"></span><span class="s-name">'+esc(it.name)+'</span>'+
      '<span class="s-dots" aria-hidden="true"></span><span class="vh">, </span>'+
      '<span class="s-meta">'+esc(meta(it))+'</span><span class="s-end" aria-hidden="true"></span></div>';
  }
  function groups(q){
    if(!q){
      /* COMMON leaves out what the view you are in already lists, and goes
         when nothing is left, so no row shows twice */
      const h=here(),seen=new Set(h.items),com=common().filter(it=>!seen.has(it));
      return [{label:'Views',items:views},{label:h.label,items:h.items,more:h.more},
              {label:'Settings',items:SETS},{label:'Components',items:com},{label:'Tricks',items:TRICKS},{label:'About',items:DOS}]
             .filter(g=>g.items.length);
    }
    const toks=q.toLowerCase().split(/\s+/).filter(Boolean);
    const cand=[{label:'Views',items:views}].concat(secGroups,[{label:'Settings',items:SETS},{label:'Tricks',items:TRICKS},{label:'About',items:DOS}]);
    let left=MAX;
    const out=cand.map((g,gi)=>{
      const m=g.items.map((it,i)=>({it:it,r:rank(it,toks),i:i})).filter(x=>x.r<9)
                     .sort((a,b)=>a.r-b.r||a.i-b.i);
      return {label:g.label,items:m.map(x=>x.it),best:m.length?m[0].r:9,gi:gi};
    }).filter(g=>g.items.length).sort((a,b)=>a.best-b.best||a.gi-b.gi);
    out.forEach(g=>{g.items=g.items.slice(0,Math.max(0,left));left-=g.items.length});
    return out.filter(g=>g.items.length);
  }
  function render(){
    const q=inp.value.trim(),run=q?runRow(q):null;
    let gs=groups(q),html='',n=0,none=false;
    rows=[];
    if(q&&!gs.length&&!run){none=true;gs=[{label:'Try a view',items:views}]}
    if(run)gs.unshift({label:null,items:[run]});
    if(none)html+='<p class="s-none" id="sg-none">Nothing called "'+esc(q)+'".</p>';
    gs.forEach((g,gi)=>{
      const hid='sg-'+gi;
      html+='<div role="group" class="s-grp"'+(g.label?' aria-labelledby="'+hid+(none?' sg-none':'')+'"':' aria-label="Command"')+'>';
      if(g.label)html+='<p class="s-head" id="'+hid+'">'+esc(g.label)+'</p>';
      g.items.forEach(it=>{html+=rowHTML(it,n);rows.push({it:it,g:gi});n++});
      if(g.more)html+='<p class="s-more">and '+g.more+' more. Type to find them.</p>';
      html+='</div>';
    });
    list.innerHTML=html;
    list.scrollTop=0;
    count.textContent='';
    /* a failed search selects nothing, so Enter does not go somewhere you did not ask for */
    setActive(rows.length&&!none?0:-1);
    tell(q,none?0:rows.filter(r=>r.it.kind!=='run').length);
  }
  /* the count is read out once typing stops, into the dialog's own status
     line (the toast sits outside the modal, so it is not heard from here).
     Hidden, because the list already shows it */
  let told=null,telling=false;
  function tell(q,n){
    if(told){told.stop();told=null}
    if(telling){stat.textContent='';telling=false}
    if(!q)return;
    told=A.times(600,1,function(){},function(){
      told=null;if(!dlg.open||inp.value.trim()!==q)return;
      stat.innerHTML='<span class="vh">'+esc(n?n+(n===1?' result':' results'):'Nothing called "'+q+'"')+'.</span>';
      telling=true;
    });
  }
  function rowEl(i){return $('so-'+i)}
  function setActive(i,keep){
    const old=rowEl(act);if(old)old.setAttribute('aria-selected','false');
    act=i;
    const el=rowEl(i);
    if(!el){inp.removeAttribute('aria-activedescendant');return}
    el.setAttribute('aria-selected','true');
    inp.setAttribute('aria-activedescendant',el.id);
    if(keep)return;
    /* keep it inside the list's own scroll, the page stays put */
    const lt=list.scrollTop,lh=list.clientHeight,top=el.offsetTop,h=el.offsetHeight;
    const head=el.parentNode.firstElementChild;
    const t0=(head&&head!==el&&el===head.nextElementSibling)?head.offsetTop:top;
    if(t0<lt)list.scrollTop=t0;
    else if(top+h>lt+lh)list.scrollTop=top+h-lh;
  }
  function refreshVals(){
    rows.forEach((r,i)=>{if(r.it.kind==='set'){const m=rowEl(i).querySelector('.s-meta');m.textContent=meta(r.it)}});
  }

  /* ---- doing ---- */
  function land(it){
    close();
    if(A.live())A.sfx.tab();
    N.go(it.v,it.sec||null,{push:true,after:it.sec?function(){
      /* the section takes the focus quietly, so Tab carries on from there */
      it.sec.tabIndex=-1;it.sec.focus({preventScroll:true});
    }:null});
  }
  function pick(i){
    const r=rows[i];if(!r)return;
    const it=r.it;
    if(it.kind==='view'||it.kind==='sec')land(it);
    else if(it.kind==='set'){
      if(it.flip()===false)return;
      stat.textContent='';
      refreshVals();
      /* the new value confirms itself in lime, once */
      const m=rowEl(i)&&rowEl(i).querySelector('.s-meta');
      if(m&&!A.reduce){
        m.classList.add('s-flash');
        {if(m._f)m._f.stop();m._f=A.times(700,1,function(){},function(){m.classList.remove('s-flash');m._f=null})}
      }
    }
    else if(it.kind==='trick')C.run(it.verb);
    else if(it.kind==='do'){if(it.run()!==false)close()}
    else if(it.kind==='run'){
      Promise.resolve(C.run(it.line)).then(function(){if(dlg.open){inp.value='';render()}});
    }
  }

  /* ---- open and close ---- */
  function open(){
    if(dlg.open){inp.focus();return}
    build();inp.value='';stat.textContent='';
    render();
    dlg.showModal();
    inp.focus();
    if(A.live())A.sfx.open();
  }
  function close(){if(dlg.open)dlg.close()}
  dlg.addEventListener('close',()=>{inp.removeAttribute('aria-activedescendant')});
  /* Esc empties the field first, then closes */
  dlg.addEventListener('cancel',e=>{if(inp.value){e.preventDefault();inp.value='';render();inp.focus()}});
  $('cmdX').addEventListener('click',close);
  A.backdropClose(dlg);
  $('cmdBtn').addEventListener('click',open);
  /* the settings change from elsewhere too (the bar, the menu, a curtain landing) */
  new MutationObserver(()=>{if(dlg.open)refreshVals()})
    .observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  ['soundToggle','glitchToggle','gridToggle'].forEach(id=>$(id).addEventListener('change',()=>{if(dlg.open)refreshVals()}));

  inp.addEventListener('input',render);
  inp.addEventListener('keydown',e=>{
    if(e.isComposing)return;
    const n=rows.length;
    let to=null;
    if(e.key==='ArrowDown')to=n?(act+1)%n:null;
    else if(e.key==='ArrowUp')to=n?(act-1+n)%n:null;
    else if(e.key==='Home'&&n)to=0;
    else if(e.key==='End'&&n)to=n-1;
    else if((e.key==='PageDown'||e.key==='PageUp')&&n){
      /* a group at a time */
      const g=rows[Math.max(0,act)].g,dn=e.key==='PageDown';
      to=dn?rows.findIndex(r=>r.g>g):(function(){let f=-1;for(let i=0;i<n;i++)if(rows[i].g===g-1&&f<0)f=i;return f})();
      if(to<0)to=dn?n-1:0;
    }
    else if(e.key==='Enter'){e.preventDefault();pick(act);return}
    else if(e.key==='Escape'){
      e.preventDefault();
      if(inp.value){inp.value='';render()}else close();
      return;
    }
    if(to!==null){e.preventDefault();setActive(to)}
  });
  /* the pointer and the arrows move the same row. Pressing a row keeps the
     focus in the field, so the keyboard carries on where the pointer left it */
  list.addEventListener('pointermove',e=>{
    const o=e.target.closest('[role="option"]');if(!o)return;
    const i=+o.dataset.n;if(i!==act)setActive(i,true);
  });
  list.addEventListener('mousedown',e=>{if(e.target.closest('[role="option"]'))e.preventDefault()});
  list.addEventListener('click',e=>{
    const o=e.target.closest('[role="option"]');if(!o)return;
    const i=+o.dataset.n;setActive(i,true);pick(i);
  });

  /* / and Ctrl K (Cmd K) open it from anywhere but a text field */
  const TEXT=/^(text|search|email|url|tel|password|number)$/;
  function typing(t){
    if(!t||!t.tagName)return false;
    if(t.isContentEditable||/TEXTAREA|SELECT/.test(t.tagName))return true;
    return t.tagName==='INPUT'&&TEXT.test(t.type||'text');
  }
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented||e.isComposing)return;
    const ck=(e.key==='k'||e.key==='K')&&(e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey;
    const sl=e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey;
    if(!ck&&!sl)return;
    if(dlg.open){if(ck){e.preventDefault();close()}return}
    if(typing(e.target)||document.querySelector('dialog[open]'))return;
    e.preventDefault();open();
  });

  C.openCmd=open;
  window.AUI_SEARCH={open:open,close:close};
})();
