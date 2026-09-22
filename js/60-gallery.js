/* ---- gallery: pack the component columns ----------------------------------
   The galleries in Components, Blocks and Charts are one css grid each. On a
   wide screen the sections sit side by side, and since they have very different
   heights a plain grid leaves a hole under every short one. Rows are 24px, the
   same as the text baseline, so a section can simply say how many rows it
   occupies and the next one starts right under it. That is all this file does:
   measure, round up to whole rows, write the span. It runs on layout, on tab
   switches and whenever a section changes height (opening Code, filtering
   blocks). With one column it clears everything and gets out of the way. */
(function(){
  const A=window.AUI,$=A.$;
  const PANELS=['view-kit','view-blocks','view-charts'].map($).filter(Boolean);
  const ROW=24;
  let ro=null;

  function cols(panel){
    const t=getComputedStyle(panel).gridTemplateColumns;
    return t&&t!=='none'?t.split(' ').filter(Boolean).length:1;
  }
  function sections(panel){
    return [].slice.call(panel.querySelectorAll(':scope > section[aria-labelledby]'));
  }
  function kids(panel){
    return [].slice.call(panel.children).filter(el=>!el.hidden);
  }
  /* every child needs a span, not only the tagged ones: with 24px rows an
     unmeasured child gets a single row and the next one lands on top of it */
  function pack(panel){
    const items=kids(panel);
    if(cols(panel)<2){
      panel.style.removeProperty('grid-auto-rows');
      items.forEach(s=>s.style.removeProperty('grid-row-end'));
      return;
    }
    if(panel.style.gridAutoRows!==ROW+'px'){
      items.forEach(s=>s.style.setProperty('grid-row-end','span 400'));
      panel.style.gridAutoRows=ROW+'px';
    }
    /* measure everything first, write after, so one section's new span cannot
       shift the next one's measurement */
    const spans=items.map(s=>{
      const m=parseFloat(getComputedStyle(s).marginTop)||0;
      return Math.max(1,Math.ceil((s.getBoundingClientRect().height+m)/ROW));
    });
    items.forEach((s,i)=>{
      const v='span '+spans[i];
      if(s.style.gridRowEnd!==v)s.style.gridRowEnd=v;
    });
  }
  function packAll(){PANELS.forEach(pack)}

  /* a section changes height when its Code tab opens, when a demo animates in,
     or when the blocks filter hides its neighbours */
  if(window.ResizeObserver){
    let queued=false;
    ro=new ResizeObserver(function(){
      if(queued)return;queued=true;
      requestAnimationFrame(function(){queued=false;packAll()});
    });
    PANELS.forEach(p=>kids(p).forEach(s=>ro.observe(s)));
  }
  window.addEventListener('resize',packAll);
  document.addEventListener('click',function(e){
    if(e.target.closest&&e.target.closest('.tab,.chip,.views [role="tab"]'))setTimeout(packAll,60);
  });
  const prev=A.onLayout;
  A.onLayout=function(W){if(prev)prev(W);packAll()};
  packAll();
  window.AUI_GALLERY={pack:packAll};
})();
