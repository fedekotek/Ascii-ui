/* ---- the sidebar ----------------------------------------------------------
   From 1024px the page carries a list of the sections in the view you are in,
   the way a documentation site does. It is built from the sections themselves,
   so it cannot drift from the page: same order, same names, and it follows the
   Blocks filter. The entry you are reading is marked, from an
   IntersectionObserver rather than from scroll maths.
   Below 1024px the css hides it and the chip index inside each view does the
   job, so this file keeps working and simply is not seen. */
(function(){
  const A=window.AUI,$=A.$,nav=$('sidenav');
  if(!nav)return;
  const VIEWS=['kit','blocks','charts','themes','play','apps','page'];
  const LABEL={kit:'Components',blocks:'Blocks',charts:'Charts',themes:'Themes',
               play:'Play',apps:'Apps',page:'One pager'};
  let links=[],current=null,pinned=0;

  function panel(){
    for(const v of VIEWS){const p=$('view-'+v);if(p&&!p.hidden)return {p:p,v:v}}
    return {p:$('view-kit'),v:'kit'};
  }
  function name(sec){
    const h=sec.querySelector('h2,h3');
    return h?h.textContent.trim():(sec.getAttribute('aria-label')||'').trim();
  }
  function sections(p){
    /* where the view has a chip index, list what it lists, so the two
       never count differently */
    const indexed=!!p.querySelector('.toc .chip');
    return [].slice.call(p.querySelectorAll(':scope > section[aria-labelledby]'))
             .filter(s=>!s.hidden&&name(s)&&(!indexed||s._chip));
  }

  function build(){
    const cur=panel(),secs=sections(cur.p);
    nav.innerHTML='';nav.hidden=!secs.length;
    if(!secs.length){links=[];current=null;return}
    const g=document.createElement('div');g.className='navgroup';
    const h=document.createElement('h2');
    h.innerHTML=LABEL[cur.v]+' <span class="navcount">'+secs.length+'</span>';
    const ul=document.createElement('ul');
    links=secs.map(sec=>{
      const li=document.createElement('li'),b=document.createElement('button');
      b.type='button';b.className='navlink';b.textContent=name(sec);
      b.addEventListener('click',function(){
        sec.scrollIntoView({block:'start',behavior:A.reduce?'auto':'smooth'});
        /* hold the mark on what you picked until the scroll has arrived,
           otherwise the sections passing by would steal it on the way */
        mark(b);pinned=Date.now()+1200;
        if(A.live())A.sfx.tab();
      });
      li.appendChild(b);ul.appendChild(li);
      return {b:b,sec:sec};
    });
    g.appendChild(h);g.appendChild(ul);nav.appendChild(g);
    spy();
  }

  function mark(b){
    if(current===b)return;
    if(current)current.removeAttribute('aria-current');
    current=b;
    if(b){
      b.setAttribute('aria-current','true');
      /* keep the marked entry inside the sidebar's own scroll */
      const nb=nav.getBoundingClientRect(),bb=b.getBoundingClientRect();
      if(bb.top<nb.top||bb.bottom>nb.bottom)nav.scrollTop+=bb.top-nb.top-nb.height/3;
    }
  }

  /* You are reading the last section that has passed under the bar. In a
     gallery a whole row shares one top, and the first of that row is the one
     the eye lands on, so ties go to document order. */
  const BAR=24*5;
  function spy(){
    if(!links.length||Date.now()<pinned)return;
    let top=-Infinity,row=[];
    for(let i=0;i<links.length;i++){
      const t=links[i].sec.getBoundingClientRect().top;
      if(t>BAR)continue;
      if(t>top+2){top=t;row=[links[i].b]}
      else if(t>top-2)row.push(links[i].b);
    }
    if(!row.length)row=[links[0].b];
    /* a gallery row shares one top: if you picked one of them from the list,
       that one stays marked, otherwise the row's first entry speaks for it */
    mark(row.indexOf(current)>=0?current:row[0]);
  }
  let ticking=false;
  function spySoon(){
    if(ticking)return;ticking=true;
    requestAnimationFrame(function(){ticking=false;spy()});
  }
  window.addEventListener('scroll',spySoon,{passive:true});
  window.addEventListener('resize',spySoon);

  $('brand').addEventListener('click',function(){
    window.scrollTo({top:0,behavior:A.reduce?'auto':'smooth'});
    if(A.live())A.sfx.tab();
  });

  /* Views are swapped by toggling hidden, and the swap does not happen on the
     click: the theme curtain and the docs builder take their time. So watch the
     attribute rather than guess a delay. The same observer catches the Blocks
     filter, which hides sections the same way. */
  let queued=false;
  function rebuild(){
    if(queued)return;queued=true;
    requestAnimationFrame(function(){queued=false;build()});
  }
  new MutationObserver(rebuild).observe($('main'),{
    attributes:true,attributeFilter:['hidden'],subtree:true
  });
  build();
  window.AUI_NAV={build:build};
})();
