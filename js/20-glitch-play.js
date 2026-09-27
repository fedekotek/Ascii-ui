(function(){
'use strict';
const A=window.AUI,$=A.$,G=A.G,rnd=A.rnd,rep=A.rep,RAMP=A.RAMP,reduce=A.reduce,every=A.every,times=A.times;
const root=document.documentElement,main=$('main');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const NB='\u00a0';

/* ================= sound: thin wrappers over the kit's own synth ================= */
function blip(f,d,type,v,slide){if(!A.live())return;A.tone(type||'square',f||440,slide?Math.max(30,(f||440)*slide):0,d||0.06,Math.min(0.9,(v||0.12)*4))}
function noise(d,v){if(!A.live())return;A.noise(d||0.18,Math.min(0.9,(v||0.15)*4),700,3200)}
function tick(){A.sfx.tick()}
function arp(fs,gap){if(!A.live())return;fs.forEach(function(f,i){A.tone('square',f,0,0.08,0.42,i*(gap||60)/1000)})}

/* ================= fx helpers ================= */
const fx=$('fx');
/* the band only turns hues backwards a little: magenta goes violet, violet
   goes cyan, paper goes pink. Quarter and half turns made oranges and browns
   that are not in the palette. */
function tear(n){
  if(A.glitch()<=0||reduce)return;
  n=n||2;const vh=window.innerHeight;
  while(n--){
    const d=document.createElement('div'),h=8+rnd(44),deg=[-45,-60,-75][rnd(3)];
    d.style.cssText='left:0;right:0;top:'+rnd(vh-h)+'px;height:'+h+'px;-webkit-backdrop-filter:hue-rotate('+deg+'deg) saturate(1.6) contrast(1.2);backdrop-filter:hue-rotate('+deg+'deg) saturate(1.6) contrast(1.2);transform:translateX('+(rnd(17)-8)+'px)';
    fx.appendChild(d);setTimeout(()=>d.remove(),80+rnd(140));
  }
}
A.tear=tear;

/* ================= frames draw themselves ================= */
function frameDraw(el){
  const fr=[];if(el.matches('.frame'))fr.push(el);el.querySelectorAll('.frame').forEach(f=>fr.push(f));
  fr.forEach(f=>{
    if(f._fd||f.matches('.btn'))return;
    const H=getComputedStyle(f).getPropertyValue('--h').trim().replace(/^"|"$/g,'');
    if(!H)return;
    const cols=Math.ceil(f.getBoundingClientRect().width/A.CH());let s=0;
    f._fd=every(40,()=>{
      s++;const k=Math.round(cols*s/8);
      if(s>=8){f._fd.stop();f._fd=null;f.style.removeProperty('--h');f.style.removeProperty('--hb');return}
      f.style.setProperty('--h','"'+H.slice(0,k)+'"');
      f.style.setProperty('--hb','"'+rep(NB,cols-k)+H.slice(0,k)+'"');
    });
  });
}
function rearm(el){
  if(el.hasAttribute&&el.hasAttribute('data-rv')&&A.reveal){el.classList.remove('in','done');void el.offsetWidth;A.reveal(el,0)}
  else{A.decode(el);el.querySelectorAll&&el.querySelectorAll('.btn').forEach(function(x){A.scramble(x)})}
  frameDraw(el);
}

/* ================= datamosh transition ================= */
/* it holds the engine's one transition lock (A.hold/A.free), so it never runs
   beside the curtain, and it takes the taps while it covers the page */
function mosh(cb){
  if(reduce||A.glitch()<=0){cb();return}
  const P=A.pal(),keys=['hot','pink','cy','warn','deep','violet','ok'];
  const wrap=document.createElement('div');wrap.setAttribute('aria-hidden','true');A.hold(wrap);
  wrap.style.cssText='position:fixed;inset:0;z-index:90;overflow:hidden;pointer-events:auto;touch-action:none';
  const R=A.ROW,rows=Math.ceil(window.innerHeight/R),els=[];
  for(let y=0;y<rows;y++){
    const d=document.createElement('div'),solid=Math.random()<0.24,side=Math.random()<0.5?-1:1;
    d.style.cssText='position:absolute;left:0;right:0;top:'+(y*R)+'px;height:'+R+'px;line-height:'+R+'px;font-weight:700;white-space:nowrap;overflow:hidden;background:'+(solid?P[keys[rnd(7)]]:P.bg)+';color:'+P[keys[rnd(7)]]+';transform:translateX('+(side*101)+'%);transition:transform '+(55+rnd(105))+'ms steps(5)';
    d.textContent=Math.random()<0.6?A.TR(rep(RAMP[2+rnd(7)],260)):'';d._s=side;wrap.appendChild(d);els.push(d);
  }
  document.body.appendChild(wrap);noise(0.3,0.12);
  requestAnimationFrame(()=>requestAnimationFrame(()=>els.forEach(d=>d.style.transform='translateX(0)')));
  setTimeout(()=>{cb();els.forEach(d=>d.style.transform='translateX('+(-d._s*101)+'%)');
    setTimeout(()=>{wrap.remove();A.kick();A.free()},170)},175);
}
A.mosh=mosh;
function show(name){const t=$('v-'+name);if(t){t.click();return true}return false}

/* ================= boot ================= */
/* index.html paints #boot before anything else and drops it for a return visit or
   reduced motion; this fills it, or builds it again for the palette's `boot`.
   Keep BOOTSKEL in step with the markup in index.html. About 0.6s, then out. */
/* the strip is glyphs, not slabs, and it has no cyan (cyan is focus) */
const BOOTSKEL='<div class="bin"><div class="bt"></div><div class="bs">'+
  ['pink','warn','violet','deep','ink','hot','violet'].map(k=>'<b style="color:var(--'+k+')">'+rep('@',24)+'</b>').join('')+
  '</div><div class="log">ASCII/UI BIOS v0.9  (c) 2026 FEDE KOTEK\n</div><div class="pb"></div><div class="skip">Tap or press any key to skip.</div></div>';
let booting=false;
function boot(force,done){
  if(booting)return;
  const fin=()=>{root.classList.remove('aui-booting');if(A.heroWake)A.heroWake();if(done)done()};
  let el=$('boot'),seen=false;
  try{seen=!!sessionStorage.getItem('aui-boot')}catch(e){}
  if(reduce||(!force&&seen)){if(el)el.remove();fin();return}
  try{sessionStorage.setItem('aui-boot','1')}catch(e){}
  booting=true;
  if(!el){el=document.createElement('div');el.id='boot';el.setAttribute('aria-hidden','true');document.body.appendChild(el)}
  el.innerHTML=BOOTSKEL;
  const bin=el.querySelector('.bin'),title=el.querySelector('.bt'),log=el.querySelector('.log'),pb=el.querySelector('.pb');
  const L=[['ramp ........ '+A.TR('@%#*+=:.'),'ok'],['charts ......','ok'],['invaders ....','armed'],['signal ......','BAD'],['booting .....','ok']];
  const bar=k=>{pb.innerHTML=A.colorize(A.barRow(Math.round(k/L.length*24),true,24))+' '+String(Math.round(k/L.length*100)).padStart(3)+'%'};
  bar(0);
  /* the section posters' title, fitted to the column like fitTitles(): two characters
     a pixel, one if even the smallest font will not fit. Twice the poster cap, it is the only thing on screen */
  const W=bin.clientWidth,cap=2*(parseFloat(getComputedStyle(root).getPropertyValue('--ptitle'))||6);
  const tt=A.fit(96,W,cap),scale=tt.cw*94>W?1:2,lh=Math.max(4,Math.round(tt.cw*1.3)),bm=A.bitmap('ASCII/UI',scale);
  title.style.fontSize=tt.fs+'px';title.style.lineHeight=lh+'px';title.style.height=(Math.ceil(bm.length*lh/A.ROW)*A.ROW)+'px';
  title._b=bm;title._n=bm.map(r=>r.map(()=>rnd(6)));title._scale=scale;title._bars=[];
  A.titleFrame(title,0);
  let i=0,over=false,titled=false,logged=false;
  /* a streak is a row of = on the grid, not a 2px line */
  const streak=()=>{if(Math.random()>=0.35)return;const st=document.createElement('div'),cols=Math.floor(window.innerWidth/A.CH()),n=Math.max(4,Math.round(cols*(0.2+Math.random()*0.6)));
    st.className='strk';st.style.cssText='top:'+(rnd(Math.max(1,Math.floor(window.innerHeight/A.ROW)))*A.ROW)+'px;left:'+(rnd(Math.max(1,Math.floor(cols*0.4)))*A.CH())+'px;right:auto;height:'+A.ROW+'px;line-height:'+A.ROW+'px;background:none;color:var(--hot);white-space:pre';
    st.textContent=A.TR(rep('=',n));el.appendChild(st);setTimeout(()=>st.remove(),90+rnd(160))};
  /* the title develops (14 frames) while the log types (5 lines); the bar hits 100% and it leaves */
  const tiv=times(30,14,f=>{A.titleFrame(title,f);streak()},()=>{A.titleFrame(title,99);titled=true;if(logged)end()});
  const iv=times(60,L.length,()=>{
    const l=L[i++],c=l[1]==='BAD'?'hot':(l[1]==='armed'?'warn':'ok');
    log.insertAdjacentHTML('beforeend',esc(l[0])+'  <span class="'+c+'">'+l[1]+'</span>\n');
    bar(i);blip(l[1]==='BAD'?120:700+i*40,0.04,'square',0.06);
  },()=>{logged=true;if(titled)end()});
  function end(){
    if(over)return;over=true;tiv.stop();iv.stop();document.removeEventListener('keydown',end,true);
    bar(L.length);el.classList.add('out');noise(0.2,0.1);A.kick();
    /* js/10 holds the page's entrances while aui-booting is set, so the header decodes once, now */
    setTimeout(()=>{el.remove();booting=false;fin()},150);
  }
  el.addEventListener('pointerdown',end);document.addEventListener('keydown',end,true);
}
A.boot=boot;

/* ================= scroll is signal, idle is rot ================= */
let ly=window.scrollY,lt=performance.now(),lastTear=0,idleAt=Date.now(),rotten=[];
window.addEventListener('scroll',()=>{
  const n=performance.now(),dy=Math.abs(window.scrollY-ly),dt=Math.max(16,n-lt);ly=window.scrollY;lt=n;
  const v=dy/dt*1000,was=G.scroll;G.scroll=Math.min(1,Math.max(G.scroll,v/2600));
  if(!was&&G.scroll&&decay)decay.wake(100);
  if(v>1300&&n-lastTear>90){lastTear=n;tear(1+rnd(2))}
  touch(true);
},{passive:true});
/* the decay sleeps while there is nothing to decay; a scroll wakes it */
const decay=reduce?null:every(100,()=>{G.scroll*=0.72;if(G.scroll<0.02)G.scroll=0},{gate:()=>G.scroll>0});
/* the repair only sounds when you touched something; a scroll repairs quietly */
function touch(quiet){
  idleAt=Date.now();
  if(rotten.length){
    rotten.forEach(f=>{f.style.removeProperty('--h');f.style.removeProperty('--hb');f._rot=0});
    const r=rotten;rotten=[];r.slice(0,8).forEach(f=>frameDraw(f));
    A.titles.forEach(p=>{if(p._rot){p._rot=0;A.develop(p,quiet===true)}});
    if(quiet!==true)arp([220,440,880],40);
  }
}
['pointerdown','keydown'].forEach(ev=>document.addEventListener(ev,()=>touch(),{passive:true}));
function inView(el){const r=el.getBoundingClientRect();return r.bottom>0&&r.top<window.innerHeight&&r.width>0}
if(!reduce)every(1100,()=>{
  if(A.glitch()<=0||Date.now()-idleAt<14000)return;
  const fr=[...document.querySelectorAll('main .frame')].filter(f=>inView(f)&&!f._fd);
  for(let n=0;n<4&&fr.length;n++){
    const f=fr[rnd(fr.length)];
    let H=(f.style.getPropertyValue('--h')||getComputedStyle(f).getPropertyValue('--h')).trim().replace(/^"|"$/g,'').slice(0,90);
    if(!H)continue;
    /* two ramp steps at a time: one step read as nothing happening */
    H=H.replace(/[^ ]/g,c=>{if(Math.random()>0.22)return c;const i=RAMP.indexOf(c);return i>2?RAMP[i-2]:'.'});
    f.style.setProperty('--h','"'+H+'"');f.style.setProperty('--hb','"'+H.split('').reverse().join('')+'"');
    if(!f._rot){f._rot=1;rotten.push(f)}
  }
  const ts=A.titles.filter(p=>inView(p)&&!p._iv);
  if(ts.length){const p=ts[rnd(ts.length)];p._rot=(p._rot||0)+1;A.titleFrame(p,Math.max(2,9-p._rot))}
});

window.AUI2={blip,noise,arp,tick,rearm,show,boot,tear,mosh,frameDraw,esc,clamp,inView};
})();

(function(){
'use strict';
const A=window.AUI,B=window.AUI2,$=A.$,G=A.G,rnd=A.rnd,rep=A.rep,RAMP=A.RAMP,reduce=A.reduce,every=A.every,times=A.times;
const {blip,noise,arp,tick,esc,clamp,inView}=B;
const root=document.documentElement;
const FONT='"Geist Mono",ui-monospace,Menlo,Consolas,monospace';

/* ================= destructible UI: long-press, it shatters, the characters pile up ================= */
const sand=$('sand'),sx=sand.getContext('2d');
const CW=9.6,CHh=12;let P=[],pile=[],heights=[],simOn=false,dead=[],sw=0,sh=0,sdpr=1;
function sandSize(){
  sdpr=Math.min(window.devicePixelRatio||1,2);sw=window.innerWidth;sh=window.innerHeight;
  sand.width=sw*sdpr;sand.height=sh*sdpr;const n=Math.ceil(sw/CW);
  if(heights.length!==n){heights=new Array(n).fill(0);pile=[]}
  drawSand();
}
function drawSand(){
  sx.setTransform(sdpr,0,0,sdpr,0,0);sx.clearRect(0,0,sw,sh);
  if(!P.length&&!pile.length)return;
  const pal=A.pal();sx.font='700 14px '+FONT;sx.textBaseline='top';
  /* the pieces are characters harvested off the page, already in the active
     ramp, so they skip the canvas translation or they would be translated twice */
  const fill=A.rawFill||sx.fillText;
  for(const s of pile){sx.fillStyle=s.col||pal[s.k];fill.call(sx,s.c,s.col2*CW,sh-(s.row+1)*CHh)}
  for(const p of P){sx.fillStyle=p.col||pal[p.k];fill.call(sx,p.c,p.x,p.y)}
}
/* the fall runs on the page clock like every other animation, a frame at a
   time, and stops itself when the last piece lands */
let simTask=null;
function sim(){
  const cap=Math.floor(sh*0.34/CHh);
  for(let i=P.length-1;i>=0;i--){
    const p=P[i];p.vy+=0.7;p.x+=p.vx;p.y+=p.vy;p.vx*=0.99;
    if(p.x<0){p.x=0;p.vx*=-0.5}if(p.x>sw-CW){p.x=sw-CW;p.vx*=-0.5}
    let col=clamp(Math.round(p.x/CW),0,heights.length-1);
    if(p.y>=sh-(heights[col]+1)*CHh){
      for(let k=0;k<4;k++){
        const l=col>0?heights[col-1]:99,r=col<heights.length-1?heights[col+1]:99;
        if(l<heights[col]-1&&l<=r)col--;else if(r<heights[col]-1)col++;else break;
      }
      if(heights[col]<cap){pile.push({col2:col,row:heights[col],c:p.c,k:p.k,col:p.col});heights[col]++}
      P.splice(i,1);if(P.length%6===0)tick();
    }
  }
  drawSand();
  if(!P.length){simOn=false;if(simTask){simTask.stop();simTask=null}}
}
const KEYS=['ink','ink','hot','pink','cy','warn','violet','ok'];
/* the pieces are the component's own characters: its text, its frames, its glyphs, its pixels */
function transparent(c){return !c||c==='transparent'||/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\)/.test(c)}
function harvest(el,cw){
  const out=[],vw=window.innerWidth,vh=window.innerHeight;
  const push=(c,x,y,col)=>{if(c&&c!==' '&&c!=='\u00a0'&&y>-40&&y<vh+40&&x>-40&&x<vw+40)out.push({c,x,y,col})};
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode(n){
    if(n.nodeType===1){const cs=getComputedStyle(n);return (cs.display==='none'||cs.visibility==='hidden')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}
    return n.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
  }});
  const rng=document.createRange();
  const colorOf=n=>{const cs=getComputedStyle(n);return transparent(cs.backgroundColor)?cs.color:cs.backgroundColor};
  let node;
  while((node=walker.nextNode())){
    if(node.nodeType===3){
      const t=node.nodeValue,col=colorOf(node.parentElement),step=t.length>400?3:1;
      for(let k=0;k<t.length;k+=step){
        if(t[k]===' '||t[k]==='\n')continue;
        rng.setStart(node,k);rng.setEnd(node,k+1);const r=rng.getBoundingClientRect();if(!r.width)continue;
        push(t[k],r.left,r.top,col);
      }
      continue;
    }
    const e=node;
    if(e.tagName==='CANVAS'&&e.width){
      try{
        const r=e.getBoundingClientRect(),lcd=A.lcdOf&&A.lcdOf(e);
        if(lcd){
          const d=lcd.sample(),W=lcd.cols,H=lcd.rows,sx2=W>32?2:1,sy2=H>24?2:1;
          for(let yy=0;yy<H;yy+=sy2)for(let xx=0;xx<W;xx+=sx2){
            const i=(yy*W+xx)*4,l=(d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114)/255;if(l<0.08)continue;
            push(A.TR(RAMP[clamp(Math.round(l*7)+1,1,8)]),r.left+xx/W*r.width,r.top+yy/H*r.height,'rgb('+d[i]+','+d[i+1]+','+d[i+2]+')');
          }
          continue;
        }
        const x=e.getContext('2d'),cols=Math.max(4,Math.floor(r.width/cw)),rows=Math.max(3,Math.floor(r.height/14));
        const d=x.getImageData(0,0,e.width,e.height).data;
        for(let yy=0;yy<rows;yy++)for(let xx=0;xx<cols;xx++){
          const px=Math.floor((xx+0.5)/cols*e.width),py=Math.floor((yy+0.5)/rows*e.height),i=(py*e.width+px)*4;
          if(d[i]+d[i+1]+d[i+2]<90&&d[i+3]<200)continue;
          push(A.TR(RAMP[3+rnd(6)]),r.left+xx*cw,r.top+yy*14,'rgb('+d[i]+','+d[i+1]+','+d[i+2]+')');
        }
      }catch(err){}
      continue;
    }
    ['::before','::after'].forEach(ps=>{
      const cs=getComputedStyle(e,ps);let c=cs.content;
      if(!c||c==='none'||c==='normal'||c.length<3)return;
      c=c.replace(/^"|"$/g,'').replace(/"\s+"/g,'').replace(/\\A ?/g,'\n').replace(/\\/g,'');
      if(cs.display==='none'||cs.visibility==='hidden')return;
      const r=e.getBoundingClientRect(),col=transparent(cs.backgroundColor)?cs.color:cs.backgroundColor;
      if(c.indexOf('\n')>=0){
        const lines=c.split('\n').filter(Boolean),n=Math.min(lines.length,Math.floor(r.height/14)+1),left=ps==='::before'?r.left:r.right-cw*(lines[0]||'').length;
        for(let yy=0;yy<n;yy++)for(let k=0;k<lines[yy].length;k++)push(lines[yy][k],left+k*cw,r.top+yy*14,col);
      }else{
        const n=Math.min(c.length,Math.floor(r.width/cw)+1);
        const top=(e.matches('.frame')&&ps==='::after')?r.bottom-A.ROW:r.top;
        for(let k=0;k<n;k++)push(c[k],r.left+k*cw,top+5,col);
      }
    });
  }
  return out;
}
function shatter(el){
  if(reduce||!el||el._dead||!el.isConnected||el.closest('dialog,#rebuild,#boot'))return;
  const r=el.getBoundingClientRect();if(!r.width)return;
  el._dead=1;dead.push(el);
  let bits=harvest(el,CW);
  if(bits.length>900){const k=bits.length/900;bits=bits.filter((b,i)=>Math.floor(i*1/k)!==Math.floor((i-1)*1/k))}
  if(!bits.length)bits=[{c:'@',x:r.left+r.width/2,y:r.top+r.height/2,col:null}];
  const cx=r.left+r.width/2;
  bits.forEach(b=>{P.push({x:b.x,y:b.y,vx:(b.x-cx)/Math.max(60,r.width)*6+(Math.random()-0.5)*3,vy:-Math.random()*6-0.5,c:b.c,k:KEYS[rnd(KEYS.length)],col:b.col})});
  el.style.visibility='hidden';
  A.jolt();noise(0.35,0.22);B.tear(3);
  $('rebuild').hidden=false;
  if(!simOn){simOn=true;simTask=every(16,sim)}
}
function rebuild(){
  dead.forEach(el=>{el.style.visibility='';el._dead=0;B.rearm(el)});
  dead=[];P=[];pile=[];heights.fill(0);drawSand();$('rebuild').hidden=true;arp([220,330,440,660,880],45);
}
A.shatter=shatter;A.rebuild=rebuild;
$('rebuildBtn').addEventListener('click',rebuild);
window.addEventListener('resize',sandSize);sandSize();
const DEST='.btn,.lift,.chart,.ptitle,.stat,.kpi,.badge,.tablewrap,.acc,.skel';
/* A finger holds things to read them, select them or scroll: a long press on a
   button, a card, a badge or a stat shattered it and ate the text selection.
   On touch only the titles break. A mouse still gets the whole set. The hold
   is 900ms and it warns you: a row of characters under the target fills up
   the ramp, and letting go before it is full cancels. */
const DEST_TOUCH='.ptitle',HOLD=900,FILL='.:=+*#%@';
let lp=null,swallow=false,lastType='mouse';
function warnRow(t){
  const r=t.getBoundingClientRect(),d=document.createElement('div'),cols=Math.max(1,Math.floor(r.width/A.CH()));
  d.setAttribute('aria-hidden','true');
  d.style.cssText='left:'+r.left+'px;top:'+Math.max(0,Math.min(window.innerHeight-A.ROW,r.bottom))+'px;line-height:'+A.ROW+'px;height:'+A.ROW+'px;font-weight:700;white-space:pre;color:var(--hot)';
  fx.appendChild(d);d._cols=cols;return d;
}
function endLp(){if(!lp)return;if(lp.run)lp.run.stop();if(lp.row)lp.row.remove();lp=null}
document.addEventListener('pointerdown',e=>{
  lastType=e.pointerType||'mouse';
  if(reduce||e.button)return;
  const t=e.target.closest&&e.target.closest(e.pointerType==='mouse'?DEST:DEST_TOUCH);
  if(!t||t.closest('dialog,#rebuild,.copyrow,.code')||e.target.closest('input,select,textarea'))return;
  endLp();
  const row=warnRow(t),n=FILL.length;
  lp={t,x:e.clientX,y:e.clientY,row};
  lp.run=times(Math.round(HOLD/n),n,f=>{row.textContent=A.TR(rep(FILL[f-1],row._cols))},()=>{
    if(!lp||lp.t!==t)return;lp.run=null;endLp();swallow=true;shatter(t);setTimeout(()=>{swallow=false},700);
  });
});
const cancelLp=e=>{if(!lp)return;if(e.type==='pointermove'&&Math.hypot(e.clientX-lp.x,e.clientY-lp.y)<10)return;endLp()};
['pointerup','pointercancel','pointermove','scroll'].forEach(ev=>window.addEventListener(ev,cancelLp,{passive:true,capture:true}));
document.addEventListener('click',e=>{if(swallow){e.preventDefault();e.stopPropagation();swallow=false}},true);
/* the menu a long press opens is blocked only for a finger on a title; a
   mouse keeps its right click everywhere */
document.addEventListener('contextmenu',e=>{
  const touch=(e.pointerType||lastType)==='touch'||(e.sourceCapabilities&&e.sourceCapabilities.firesTouchEvents);
  if(touch&&e.target.closest&&e.target.closest(DEST_TOUCH)&&!e.target.closest('input,#posterDlg,dialog'))e.preventDefault();
});

/* ================= photo / camera hero ================= */
const off=document.createElement('canvas'),octx=off.getContext('2d',{willReadFrequently:true});
let srcImg=null,srcVid=null,srcKey='',srcLum=null;
function sample(w,h){
  const el=srcVid||srcImg,sw0=el.videoWidth||el.naturalWidth,sh0=el.videoHeight||el.naturalHeight;if(!sw0)return;
  off.width=w;off.height=h;const ta=w/(h*1.25),sa=sw0/sh0;let cw=sw0,ch=sh0,cx=0,cy=0;
  if(sa>ta){cw=sh0*ta;cx=(sw0-cw)/2}else{ch=sw0/ta;cy=(sh0-ch)*0.3}
  octx.save();if(srcVid){octx.translate(w,0);octx.scale(-1,1)}octx.drawImage(el,cx,cy,cw,ch,0,0,w,h);octx.restore();
  const d=octx.getImageData(0,0,w,h).data,n=w*h;if(!srcLum||srcLum.length!==n)srcLum=new Float32Array(n);
  let lo=1,hi=0;for(let i=0;i<n;i++){const v=(d[i*4]*0.299+d[i*4+1]*0.587+d[i*4+2]*0.114)/255;srcLum[i]=v;if(v<lo)lo=v;if(v>hi)hi=v}
  const k=hi-lo>0.05?1/(hi-lo):1;for(let i=0;i<n;i++)srcLum[i]=(srcLum[i]-lo)*k;
}
A.src=(w,h)=>{
  if(!srcImg&&!srcVid)return null;const key=w+'x'+h;
  if(srcVid||key!==srcKey||!srcLum){sample(w,h);srcKey=key}
  return srcLum;
};
function heroMsg(m){$('heroStatus').textContent=m}
const stopStream=st=>{try{st&&st.getTracks().forEach(t=>t.stop())}catch(e){}};
function stopCam(){if(srcVid){stopStream(srcVid.srcObject);srcVid.srcObject=null;srcVid=null}}
function toTorus(){stopCam();srcImg=null;srcLum=null;$('torusBtn').hidden=true;$('camBtn').hidden=true;heroMsg('');A.kick();A.drawHero()}
const onHome=()=>$('v-home').getAttribute('aria-selected')==='true';
$('photoBtn').addEventListener('click',()=>$('photoFile').click());
$('photoFile').addEventListener('change',e=>{
  const inp=e.target,f=inp.files&&inp.files[0];
  /* cleared, so picking the same file again still counts as a change */
  inp.value='';if(!f)return;
  const img=new Image(),url=URL.createObjectURL(f);
  /* once decoded the picture keeps drawing, so the blob can go */
  img.onload=()=>{URL.revokeObjectURL(url);stopCam();srcImg=img;srcKey='';$('torusBtn').hidden=false;$('camBtn').hidden=false;heroMsg('You are now the hero. Tap it.');A.flash($('photoBtn'));A.drawHero()};
  img.onerror=()=>{URL.revokeObjectURL(url);heroMsg('That file did not decode as an image.')};img.src=url;
});
$('camBtn').addEventListener('click',async()=>{
  const md=navigator.mediaDevices;
  if(!md||!md.getUserMedia){heroMsg('No camera here. Open the page over https to use one.');return}
  let st=null;
  try{
    st=await md.getUserMedia({video:{facingMode:'user',width:320,height:400}});
    const v=document.createElement('video');v.muted=true;v.playsInline=true;v.srcObject=st;await v.play();
    /* left Home while the browser asked: nothing is watching, so it stops */
    if(!onHome()){stopStream(st);return}
    /* one stream at a time: a second tap replaces the first, it does not stack */
    stopCam();srcImg=null;srcVid=v;$('torusBtn').hidden=false;heroMsg('Live. Nothing leaves this page.');A.flash($('camBtn'));
  }catch(err){stopStream(st);heroMsg('The camera is blocked here. Feed the ring a photo instead.')}
});
$('torusBtn').addEventListener('click',toTorus);
/* the camera is Home's: leaving Home turns it off, and the photo stays */
document.addEventListener('aui:view',()=>{
  if(onHome()||!srcVid)return;
  stopCam();srcLum=null;
  if(!srcImg)$('torusBtn').hidden=true;
  heroMsg(srcImg?'Camera off. The photo stays.':'Camera off.');A.drawHero();
});

/* ================= VHS layer ================= */
const hud=$('hud'),t0=Date.now();
if(!reduce){
  /* it only runs while it shows (it is hidden under 480px and with Glitch
     off), and the box is rewritten only when the text changed */
  let hudWas='';
  every(120,()=>{
    const ms=Date.now()-t0,p=n=>String(n).padStart(2,'0');
    const tc=p(Math.floor(ms/3600000))+':'+p(Math.floor(ms/60000)%60)+':'+p(Math.floor(ms/1000)%60)+':'+p(Math.floor(ms/40)%25);
    const h=(Math.floor(ms/600)%2?'<b>REC *</b> ':'REC   ')+tc+'\nSIG '+String(Math.round((1-A.glitch())*100)).padStart(3,' ')+'%  '+(A.SND.on?'SND':'   ');
    if(h!==hudWas){hudWas=h;hud.innerHTML=h}
  },{gate:()=>A.glitch()>0&&hud.getClientRects().length>0});
  /* the tracking band is three rows of characters that step down the screen
     a row per frame. It moves by transform, so nothing is laid out again as
     it passes (it used to animate top, a layout shift every frame, and it
     filtered what was under it) */
  const trk=$('track');let trkRun=null;
  trk.style.cssText='top:0;height:auto;-webkit-backdrop-filter:none;backdrop-filter:none;background:none;animation:none;opacity:.2;color:var(--ink);font-weight:700;white-space:pre;overflow:hidden;line-height:'+A.ROW+'px;visibility:hidden';
  every(9000,()=>{
    if(trkRun)return;
    const cols=Math.ceil(window.innerWidth/A.CH())+1,rows=Math.ceil(window.innerHeight/A.ROW)+3,dash=rep('- ',cols).slice(0,cols);
    trk.textContent=A.TR(dash+'\n'+rep('= ',cols).slice(0,cols)+'\n'+dash);
    const at=f=>{trk.style.transform='translateY('+((f-3)*A.ROW)+'px)'};
    at(0);trk.style.visibility='visible';
    trkRun=times(Math.max(40,Math.round(2600/rows)),rows,at,()=>{trk.style.visibility='hidden';trkRun=null});
  },{gate:()=>A.glitch()>0});
}

/* ================= tilt ================= */
function onTilt(e){if(e.gamma==null)return;A.spin(clamp(e.gamma/40,-1,1)*0.5,clamp((e.beta-45)/40,-1,1)*0.5)}
/* only Home has the ring, so the sensor is only listened to there */
let tiltOn=false;
function tiltSync(){
  const want=!reduce&&$('v-home').getAttribute('aria-selected')==='true';
  if(want===tiltOn)return;tiltOn=want;
  if(want)window.addEventListener('deviceorientation',onTilt);else{window.removeEventListener('deviceorientation',onTilt);A.spin(0,0)}
}
tiltSync();document.addEventListener('aui:view',tiltSync);
async function askTilt(){
  const D=window.DeviceOrientationEvent;
  if(D&&D.requestPermission){try{return (await D.requestPermission())==='granted'?'tilt on':'tilt denied'}catch(e){return 'tilt blocked here'}}
  return D?'tilt is listening, move the phone':'no motion sensors here';
}

/* ================= signature + poster ================= */
let SEED=(Math.random()*4294967296)>>>0;
const hex=n=>('00000000'+n.toString(16).toUpperCase()).slice(-8);
const sig=()=>hex(SEED).slice(0,4)+'-'+hex(SEED).slice(4);
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function fnv(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function showSig(){$('sigText').textContent='CODE '+sig()}
function makePoster(){
  const pal=A.pal(),W=1080,H=1350,c=document.createElement('canvas'),x=c.getContext('2d'),r=mulberry(SEED);
  c.width=W;c.height=H;x.fillStyle=pal.bg;x.fillRect(0,0,W,H);
  const ac=['hot','pink','cy','warn','deep','violet','ok','ink'];
  for(let i=0;i<170;i++){x.globalAlpha=0.2+r()*0.7;x.fillStyle=pal[r()<0.7?'hot':'pink'];x.fillRect(r()*W-80,Math.floor(r()*H/10)*10,20+r()*320,3)}
  x.globalAlpha=1;
  for(let i=0;i<24;i++){x.fillStyle=pal[ac[Math.floor(r()*8)]];const s=24+r()*90;x.fillRect(r()*W,r()*H,s*(0.6+r()*1.4),s)}
  for(let i=0;i<7;i++){const bx=r()*(W-260),by=r()*(H-200),n=4+Math.floor(r()*5),bh=50+r()*110;
    for(let k=0;k<n;k++){x.fillStyle=pal[ac[(k+i)%7]];x.fillRect(bx+k*30,by+(r()<0.3?20:0),30,bh)}}
  x.font='700 23px '+FONT;x.textBaseline='top';
  const lines=[['ASCII',150],['/UI',480]],cw=17.2,lh=21;
  lines.forEach(([t,y0])=>{
    const b=A.bitmap(t,2);
    for(let y=0;y<b.length;y++)for(let X=0;X<b[y].length;X++)if(b[y][X]){x.fillStyle=pal.bg;x.fillRect(40+X*cw-2,y0+y*lh,cw+4,lh)}
    [[-7,'cy'],[7,'hot'],[0,'ink']].forEach(([dx,k])=>{
      x.fillStyle=pal[k];
      for(let y=0;y<b.length;y++){const sh2=r()<0.12?Math.round((r()-0.5)*90):0;
        for(let X=0;X<b[y].length;X++)if(b[y][X])x.fillText((X*7+y*13)%11===0?'%':'@',40+X*cw+dx+(k==='ink'?0:sh2*0.2),y0+y*lh)}
    });
  });
  x.font='700 34px '+FONT;x.fillStyle=pal.bg;x.fillRect(40,H-150,620,100);
  x.fillStyle=pal.ink;x.fillText('SIGNAL '+sig(),56,H-140);x.fillStyle=pal.muted;x.font='700 24px '+FONT;x.fillText('ascii/ui  bad signal on purpose',56,H-92);
  x.fillStyle='rgba(0,0,0,.22)';for(let y=0;y<H;y+=4)x.fillRect(0,y+3,W,1);
  return c.toDataURL('image/png');
}
/* One dialog, two pictures. A poster can be rerolled. A snapshot is what the
   hero showed, so it says so and has nothing to reroll; nothing asks for one
   now, the kind stays for A.picDialog callers. */
const PIC={
  poster:['Your signal','Generated from your signal code. Long-press or right-click the image to save it.','Generated glitch poster with your signal code'],
  snap:['Snapshot','The hero, as a PNG. Long-press or right-click to save it.','Snapshot of the hero']};
function picDialog(src,kind){
  const k=PIC[kind]||PIC.poster,d=$('posterDlg');
  $('posterTitle').textContent=k[0];$('posterCap').textContent=k[1];$('posterImg').alt=k[2];
  $('posterReroll').hidden=kind==='snap';$('posterImg').src=src;if(!d.open)d.showModal();
}
A.picDialog=picDialog;
function openPoster(){picDialog(makePoster(),'poster')}
$('posterClose').addEventListener('click',()=>$('posterDlg').close());
/* on a short screen Close can be a scroll away, so a tap on the page around it closes it too */
A.backdropClose($('posterDlg'));
$('posterReroll').addEventListener('click',()=>{SEED=(Math.random()*4294967296)>>>0;showSig();openPoster();A.kick()});
showSig();

/* ================= command palette ================= */
/* run() is the verb layer under Search (js/80): it takes a typed line and
   answers on the one status line under the input */
const cmdDlg=$('cmdDlg');
function out(s){const o=$('cmdOut');if(o)o.innerHTML=s}
/* js/80 replaces this with the palette's own open */
function openCmd(){if(window.AUI3&&AUI3.openCmd!==openCmd)AUI3.openCmd();else if(!cmdDlg.open)cmdDlg.showModal()}
const RM={button:'.btn',card:'.lift',chart:'.chart',title:'.ptitle',badge:'.badge',table:'.tablewrap',stat:'.stat'};
async function run(line){
  line=line.trim();if(!line)return;out('');
  const a=line.split(/\s+/),c=a[0].toLowerCase();
  if(c==='help')out('glitch 0-100 · theme · sound on|off · goto home|components|blocks|charts|themes · rm -rf button|card|chart|title|all · rebuild · tear · jolt · boot · poster · sign NAME · invaders · photo · ring · tilt');
  else if(c==='glitch'){const v=clamp(parseInt(a[1],10)||0,0,100);const s=$('speed');s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));out('glitch = '+v)}
  else if(c==='theme'){cmdDlg.close();$('themeToggle').click()}
  else if(c==='sound'){const on=a[1]?a[1]==='on':!A.SND.on;if(on!==A.SND.on)$('soundToggle').click();out('sound '+(on?'on':'off'))}
  else if(c==='goto'||c==='cd'){
    /* the names the address bar uses, plus the old kit and page */
    const n=(a[1]||'components').replace(/^[#\/]+/,'').toLowerCase(),V={components:'kit'},v=n.split('/')[0];
    if(window.AUI_NAV&&AUI_NAV.route('#'+n,true)){cmdDlg.close()}
    else if($('v-'+(V[v]||v))){cmdDlg.close();B.show(V[v]||v)}
    else out('no such view: '+esc(n))}
  else if(c==='rm'){
    const what=a[a.length-1].toLowerCase();
    if(a.length<2||a[1]!=='-rf'){out('usage: rm -rf button|card|chart|title|all')}
    else if(reduce)out('reduced motion is on. nothing shatters.');
    else{
      const sel=what==='all'?Object.values(RM).join(','):RM[what];
      if(!sel)out('rm: cannot remove '+esc(what));
      else{
        /* never what is on top of the page: Search itself, a dialog, the Rebuild button */
        const els=[...document.querySelectorAll(sel)].filter(e=>inView(e)&&!e._dead&&!e.closest('dialog,#rebuild')&&!(what==='all'&&e.closest('.lift')&&!e.matches('.lift')));
        const pick=what==='all'?els:els.slice(0,1);
        if(!pick.length)out('nothing to remove on screen');
        else{cmdDlg.close();pick.forEach((e,i)=>setTimeout(()=>A.shatter(e),i*90))}
      }
    }
  }
  else if(c==='rebuild'){A.rebuild();out('rebuilt')}
  else if(c==='tear'){cmdDlg.close();B.tear(5)}
  else if(c==='jolt'){cmdDlg.close();A.jolt()}
  else if(c==='boot'){cmdDlg.close();B.boot(true)}
  else if(c==='poster'){cmdDlg.close();openPoster()}
  else if(c==='sign'){const n=a.slice(1).join(' ');if(!n)out('usage: sign NAME');else{SEED=fnv(n.toLowerCase());showSig();out('code for '+esc(n)+': '+sig())}}
  else if(c==='invaders'){cmdDlg.close();A.goTo('home',$('inv'),'center',()=>setTimeout(()=>INV.start(),400))}
  /* the photo lands on the Home hero, where the ring takes it */
  else if(c==='photo'){cmdDlg.close();$('photoFile').click();A.goTo('home',$('hero'),'start')}
  else if(c==='ring'||c==='torus'){toTorus();out('ring restored')}
  else if(c==='tilt')out(await askTilt());
  else if(c==='sudo')out('nice try.');
  else out('command not found: '+esc(c));
}

/* ================= space invaders, in characters ================= */
const INV=(function(){
  const cv=$('inv'),x=cv.getContext('2d'),COLS=64,ROWS=46;
  const SPR=[
    [['...##...','..####..','.######.','##.##.##','..#..#..','.#.##.#.'],['...##...','..####..','.######.','##.##.##','.#....#.','..#..#..']],
    [['..#..#..','.######.','##.##.##','########','#.#..#.#','..#..#..'],['..#..#..','.######.','##.##.##','########','.#....#.','#......#']],
    [['..####..','########','##.##.##','########','.##..##.','##....##'],['..####..','########','##.##.##','########','..#..#..','.#.##.#.']]];
  const SHIP=['...##...','..####..','########','########'],KC=['pink','warn','violet'];
  let cw=5,lh=7,fs=8,dpr=1,state='idle',inv=[],bul=[],bom=[],bunk=[],px=28,dir=1,t=0,score=0,hi=0,lives=3,wave=1,down=false,kl=false,kr=false,kf=false,cool=0,vis=false,flash=0;
  try{hi=parseInt(localStorage.getItem('aui-hi'),10)||0}catch(e){}
  function size(W){
    W=Math.min(W,440);cv.style.width=W+'px';
    dpr=Math.min(window.devicePixelRatio||1,2.5);cw=W/COLS;lh=Math.round(cw*1.25);
    x.font='700 100px '+FONT;const r=x.measureText('M').width/100||0.6;fs=cw/r;
    const H=Math.ceil(ROWS*lh/A.ROW)*A.ROW;cv.style.height=H+'px';cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);draw();
  }
  function fleet(){inv=[];for(let r=0;r<3;r++)for(let c=0;c<5;c++)inv.push({x:3+c*11,y:4+r*8,ty:r,a:1});dir=1}
  function bunkers(){bunk=[];[7,28,49].forEach(b=>{for(let yy=0;yy<4;yy++)for(let xx=0;xx<8;xx++)if(!(yy===3&&xx>2&&xx<5))bunk.push({x:b+xx,y:33+yy})})}
  /* the canvas is a picture to a screen reader, so the game says what matters
     in words: that it started, each wave, and how it ended */
  const said=$('invStatus');
  function tell(m){if(said)said.textContent=m}
  function start(){score=0;lives=3;wave=1;bul=[];bom=[];fleet();bunkers();state='play';arp([440,660,880],50);tell('Game on. Wave 1, 3 lives.')}
  function over(){state='over';const best=score>hi;if(best){hi=score;try{localStorage.setItem('aui-hi',String(hi))}catch(e){}}A.jolt();blip(200,0.5,'sawtooth',0.16,0.25);tell('Game over. Score '+score+(best?', a new high score.':'. High score '+hi+'.')+' Tap or press space to play again.')}
  function hitBox(o,bx,by){return bx>=o.x&&bx<o.x+8&&by>=o.y&&by<o.y+6}
  function boom(o){
    const r=cv.getBoundingClientRect(),X=r.left+(o.x+4)*cw,Y=r.top+(o.y+3)*lh;
    for(let i=0;i<7;i++)A.spark(X+(Math.random()-0.5)*60,Math.round((Y+(Math.random()-0.5)*30)/6)*6,6+rnd(24),6,KC[o.ty],0.95,100+rnd(200));
    blip(160+o.ty*60,0.1,'square',0.12,0.4);noise(0.08,0.08);
  }
  function step(){
    t++;
    if(state!=='play'){if(t%12===0)draw();return}
    if(kl)px-=1.4;if(kr)px+=1.4;px=clamp(px,0,COLS-8);
    if(cool>0)cool--;
    if((down||kf)&&cool<=0&&bul.length<3){bul.push({x:Math.round(px)+3.5,y:ROWS-7});cool=7;blip(880,0.05,'square',0.07,0.5)}
    const alive=inv.filter(i=>i.a),every=Math.max(2,Math.round(3+alive.length*0.7-wave));
    if(t%every===0){
      let edge=false;alive.forEach(i=>{if((dir>0&&i.x+8>=COLS-1)||(dir<0&&i.x<=1))edge=true});
      if(edge){dir=-dir;alive.forEach(i=>i.y+=2)}else alive.forEach(i=>i.x+=dir);
      blip(70+((t/every)%4)*12,0.04,'square',0.06);
    }
    if(t%Math.max(10,26-wave*3)===0&&alive.length){const s=alive[rnd(alive.length)];bom.push({x:s.x+4,y:s.y+6})}
    bul.forEach(b=>{b.y-=2});bom.forEach(b=>{b.y+=1});
    bul=bul.filter(b=>{
      if(b.y<1)return false;
      for(const i of alive)if(i.a&&(hitBox(i,b.x,b.y)||hitBox(i,b.x,b.y+1))){i.a=0;score+=(3-i.ty)*10;boom(i);return false}
      const k=bunk.findIndex(c=>c.x===Math.floor(b.x)&&(c.y===Math.floor(b.y)||c.y===Math.floor(b.y)+1));
      if(k>=0){bunk.splice(k,1);return false}
      return true;
    });
    bom=bom.filter(b=>{
      if(b.y>=ROWS-1)return false;
      const k=bunk.findIndex(c=>c.x===Math.floor(b.x)&&c.y===Math.floor(b.y));
      if(k>=0){bunk.splice(k,1);return false}
      if(b.y>=ROWS-6&&b.y<ROWS-2&&b.x>=px&&b.x<px+8){lives--;flash=6;A.jolt();if(lives<=0)over();else tell('Hit. '+lives+(lives===1?' life':' lives')+' left.');return false}
      return true;
    });
    if(alive.some(i=>i.y+6>=33))over();
    if(state==='play'&&!inv.some(i=>i.a)){wave++;fleet();bom=[];arp([523,659,784,1047],55);A.kick();tell('Wave '+wave+'. Score '+score+'.')}
    draw();
  }
  function text(s,cx,cy,k,pal){x.fillStyle=pal[k];for(let i=0;i<s.length;i++)x.fillText(s[i],(cx+i)*cw,cy*lh)}
  function sprite(rows,ox,oy,k,pal,jx){
    x.fillStyle=pal[k];
    for(let yy=0;yy<rows.length;yy++)for(let xx=0;xx<8;xx++)if(rows[yy][xx]==='#')x.fillText(yy<2?'@':(yy<4?'#':'*'),(ox+xx)*cw+(jx||0),(oy+yy)*lh);
  }
  function draw(){
    const pal=A.pal();if(!pal)return;
    x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,COLS*cw+2,ROWS*lh+40);
    x.font='700 '+fs+'px '+FONT;x.textBaseline='top';
    const g=A.glitch(),fr=Math.floor(t/10)%2;
    text('SCORE '+String(score).padStart(4,'0'),1,0,'ink',pal);text('HI '+String(hi).padStart(4,'0'),24,0,'muted',pal);
    text('WAVE '+wave,40,0,'muted',pal);text(rep('@',Math.max(0,lives)),COLS-5,0,'ok',pal);
    for(let i=0;i<COLS;i++){x.fillStyle=pal.violet;x.fillText('=',i*cw,1.4*lh)}
    inv.forEach(i=>{if(!i.a)return;const j=(g>0&&Math.random()<0.04*g)?(rnd(9)-4)*cw*0.5:0;
      if(j){sprite(SPR[i.ty][fr],i.x,i.y,'cy',pal,j-2);sprite(SPR[i.ty][fr],i.x,i.y,'hot',pal,j+2)}
      sprite(SPR[i.ty][fr],i.x,i.y,KC[i.ty],pal,j)});
    x.fillStyle=pal.violet;bunk.forEach(c=>x.fillText('#',c.x*cw,c.y*lh));
    if(state!=='over'&&(flash<=0||flash%2)){sprite(SHIP,Math.round(px),ROWS-6,'ok',pal)}
    if(flash>0)flash--;
    x.fillStyle=pal.ink;bul.forEach(b=>x.fillText('|',Math.floor(b.x)*cw,b.y*lh));
    x.fillStyle=pal.hot;bom.forEach(b=>x.fillText('!',b.x*cw,b.y*lh));
    for(let i=0;i<COLS;i++){x.fillStyle=pal.muted;x.fillText('-',i*cw,(ROWS-1.6)*lh)}
    /* the prompt blinks, except with reduced motion, where it just stays */
    if(state!=='play'&&(reduce||Math.floor(t/12)%2===0)){
      const m=state==='idle'?'TAP TO PLAY':'GAME OVER  TAP TO RETRY',mx=Math.floor((COLS-m.length)/2);
      x.fillStyle=pal.bg;x.fillRect(mx*cw-cw,27.6*lh,(m.length+2)*cw,lh*1.8);text(m,mx,28,state==='idle'?'ink':'hot',pal);
    }
  }
  function ptr(e){const r=cv.getBoundingClientRect();px=clamp((e.clientX-r.left)/cw-4,0,COLS-8)}
  /* a game starts on a tap (a finger may only be scrolling past); once it
     runs, a finger steers and fires from the moment it lands */
  cv.addEventListener('pointerdown',e=>{if(state!=='play')return;down=true;ptr(e)});
  A.onTap(cv,e=>{if(state!=='play'){start();ptr(e)}});
  cv.addEventListener('pointermove',e=>{if(state==='play')ptr(e)});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>cv.addEventListener(ev,()=>{down=false}));
  document.addEventListener('keydown',e=>{
    if(!vis||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||document.querySelector('dialog[open]'))return;
    if(e.key==='ArrowLeft'){kl=true;if(state==='play')e.preventDefault()}
    else if(e.key==='ArrowRight'){kr=true;if(state==='play')e.preventDefault()}
    else if(e.key===' '){if(document.activeElement===cv||state==='play'){e.preventDefault();if(state!=='play')start();else kf=true}}
  });
  document.addEventListener('keyup',e=>{if(e.key==='ArrowLeft')kl=false;else if(e.key==='ArrowRight')kr=false;else if(e.key===' ')kf=false});
  let loop=null;
  if('IntersectionObserver' in window)new IntersectionObserver(en=>{vis=en[0].isIntersecting;if(vis&&loop)loop.wake()}).observe(cv);else vis=true;
  fleet();bunkers();
  /* with reduced motion the loop only runs while you play: nothing on the
     idle screen moves by itself */
  /* the attract screen also stops with Glitch off (the page's pause switch,
     WCAG 2.2.2); a game you started keeps running */
  loop=every(50,step,{gate:()=>vis&&(state==='play'||(!reduce&&G.on))});
  const start0=start;start=function(){start0();loop.wake()};
  return {size,start,draw};
})();
window.AUI3={INV,makePoster,openCmd,run};
})();

(function(){
'use strict';
const A=window.AUI,B=window.AUI2,C=window.AUI3,$=A.$,G=A.G,rnd=A.rnd,rep=A.rep,RAMP=A.RAMP,reduce=A.reduce,every=A.every,times=A.times;
const {blip,noise,arp,esc,clamp,inView}=B;
const root=document.documentElement;
let CC=48,CCW=7.2,W=345;

/* ================= a character grid with colour runs ================= */
function Grid(w,h){this.w=w;this.h=h;this.c=new Array(w*h).fill(' ');this.k=new Array(w*h).fill('')}
Grid.prototype.set=function(x,y,ch,k,raw){if(x<0||y<0||x>=this.w||y>=this.h)return;const i=y*this.w+x;this.c[i]=raw?ch:A.TR(ch);this.k[i]=k||''};
Grid.prototype.text=function(x,y,s,k){for(let i=0;i<s.length;i++)this.set(x+i,y,s[i],k,true)};
Grid.prototype.html=function(){
  let o='';
  for(let y=0;y<this.h;y++){
    let cur=null,run='';const fl=()=>{if(run)o+=cur?'<span style="color:var(--'+cur+')">'+run+'</span>':run;run=''};
    for(let x=0;x<this.w;x++){const i=y*this.w+x;if(this.k[i]!==cur){fl();cur=this.k[i]}run+=esc(this.c[i])}
    fl();o+='\n';
  }
  return o;
};
/* Each chart is as wide as its own box, in 12px characters. It used to be the
   page's width, which from 1024px ignored the sidebar and the gallery column
   and cut the right side off. A chart in a hidden view measures nothing, so it
   keeps the page's width until it shows, and a ResizeObserver redraws it then. */
function colsOf(el){const w=el&&el.clientWidth;return w?Math.max(20,Math.floor(w/CCW)):CC}
function grow(draw){return function(){if(reduce||A.glitch()<=0){draw(1);return}times(42,10,s=>draw(Math.min(1,s/10)))}}
function cellAt(el,e){const r=el.getBoundingClientRect();return {x:Math.floor((e.clientX-r.left)/CCW),y:Math.floor((e.clientY-r.top)/14)}}
/* every chart you can tap you can also drive: it takes a Tab stop, the arrows
   move the pick and Enter or Space does what a tap does. fn(key) returns true
   when it used the key */
function keys(el,fn){el.tabIndex=0;el.addEventListener('keydown',e=>{if(fn(e.key))e.preventDefault()})}

/* bars */
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],REQ=[1204,1482,1390,1710,1655,820,640];let selBar=3,barP=1;
function drawBars(p){
  if(p!=null)barP=p;const el=$('ch-bars'),CC=colsOf(el),H=12,lab=5,bw=Math.max(3,Math.floor((CC-lab)/7)-1),mx=1800,g=new Grid(CC,H+1);
  [0,600,1200,1800].forEach(v=>{const row=H-1-Math.round(v/mx*(H-1));g.text(0,row,(v>=1000?(v/1000).toFixed(1)+'k':String(v)).padStart(4,' '),'muted');for(let x=lab;x<CC;x+=2)g.set(x,row,'.','muted')});
  REQ.forEach((v,i)=>{
    const h=Math.round(v/mx*H*barP),x0=lab+i*(bw+1);
    for(let yy=0;yy<h;yy++){const top=h-1-yy,ch=top===0?'*':(top===1?'#':(top===2?'%':'@'));
      for(let xx=0;xx<bw;xx++)g.set(x0+xx,H-1-yy,ch,i===selBar?'violet':(top<2?'pink':'hot'))}
    g.text(x0+Math.max(0,Math.floor((bw-3)/2)),H,DAYS[i].slice(0,bw),i===selBar?'ink':'muted');
  });
  el.innerHTML=g.html();
  $('st-bars').textContent=DAYS[selBar]+'  '+REQ[selBar].toLocaleString('en-US')+' requests';
}
function pickBar(i){selBar=clamp(i,0,6);drawBars();blip(300+REQ[selBar]/3,0.06,'square',0.09)}
A.onTap($('ch-bars'),e=>{
  const c=cellAt($('ch-bars'),e),bw=Math.max(3,Math.floor((colsOf($('ch-bars'))-5)/7)-1);pickBar(Math.floor((c.x-5)/(bw+1)));
});
keys($('ch-bars'),k=>{
  const n={ArrowLeft:selBar-1,ArrowRight:selBar+1,Home:0,End:6,Enter:selBar,' ':selBar}[k];
  if(n===undefined)return false;pickBar(n);return true;
});
$('ch-bars')._anim=grow(drawBars);

/* live line, two instances */
function Line(id){
  const el=$('ch-'+id),st=$('st-'+id);let d=[],v=180,spike=0,vis=false,p=1;
  const next=()=>{v+= (Math.random()-0.5)*60;v=clamp(v,110,330);let o=v;if(spike>0){o=400+Math.random()*80;spike--}else if(Math.random()<0.03)o=390+Math.random()*80;return Math.round(o)};
  for(let i=0;i<140;i++)d.push(next());
  function draw(pp){
    if(pp!=null)p=pp;const CC=colsOf(el),H=10,lab=5,w=CC-lab,g=new Grid(CC,H+1),mx=480,s=d.slice(-w);
    [0,240,480].forEach(t=>{const row=H-1-Math.round(t/mx*(H-1));g.text(0,row,String(t).padStart(4,' '),'muted');for(let x=lab;x<CC;x+=2)g.set(x,row,'.','muted')});
    for(let x=0;x<Math.round(w*p);x++){
      const val=s[x],row=H-1-Math.round(Math.min(1,val/mx)*(H-1)),hot=val>380;
      g.set(lab+x,row,hot?'!':'*',hot?'warn':'hot');
      for(let r=row+1;r<H;r++){const dep=r-row;g.set(lab+x,r,dep<2?':':'.',hot?'warn':(dep<2?'violet':'deep'))}
    }
    g.text(lab,H,'-'+Math.round(w*0.7/60*10)/10+'m','muted');g.text(CC-3,H,'now','muted');
    el.innerHTML=g.html();const last=s[s.length-1];
    st.textContent='p95 '+last+' ms'+(last>380?'   SPIKE':'');
  }
  /* the line redraws every 0.7s, so its status line is not a live region (it
     announced fourteen times in ten seconds). A tap or a key says it once */
  st.removeAttribute('role');st.removeAttribute('aria-live');
  const hit=()=>{spike=4;A.kick();B.tear(2);blip(140,0.2,'sawtooth',0.14,0.5);
    d.push(next());if(d.length>300)d.shift();draw();A.announce('Spike sent. p95 '+d[d.length-1]+' ms.')};
  A.onTap(el,hit);
  keys(el,k=>{if(k!=='Enter'&&k!==' ')return false;hit();return true});
  if('IntersectionObserver' in window)new IntersectionObserver(en=>{vis=en[0].isIntersecting}).observe(el);
  /* it moves on its own, so it stops with reduced motion and with Glitch off
     (the page's pause switch, WCAG 2.2.2) */
  if(!reduce)every(700,()=>{d.push(next());if(d.length>300)d.shift();const last=d[d.length-1];if(last>380)blip(1200,0.03,'square',0.05);draw()},{gate:()=>vis&&G.on});
  el._anim=grow(draw);this.draw=draw;
}
const line1=new Line('line');

/* regions */
const REG=[['iad',92],['fra',81],['gru',64],['sin',58],['syd',33]];let regP=1;
function drawRegions(p){
  if(p!=null)regP=p;const cells=colsOf($('ch-regions'))-10;let h='';
  REG.forEach(r=>{const k=Math.round(r[1]/100*cells*regP);h+='<span style="color:var(--muted)">'+r[0]+'  </span>'+A.colorize(A.barRow(k,false,cells))+'<span style="color:var(--ink)"> '+String(r[1]).padStart(3,' ')+'%</span>\n\n'});
  $('ch-regions').innerHTML=h;
}
$('ch-regions')._anim=grow(drawRegions);

/* heatmap */
let heat=[],selH=null,heatP=1;
function seedHeat(){heat=[];for(let i=0;i<7*26;i++){const r=Math.random();heat.push(r<0.03?0.6+Math.random()*0.15:(r<0.12?0.78+Math.random()*0.12:0.93+Math.random()*0.07))}}
seedHeat();
function drawHeat(p){
  if(p!=null)heatP=p;const CC=colsOf($('ch-heat')),weeks=Math.min(26,Math.floor((CC-5)/2)),g=new Grid(CC,7),D='MTWTFSS';
  for(let y=0;y<7;y++){
    g.text(0,y,D[y]+'   ','muted');
    for(let w=0;w<Math.round(weeks*heatP);w++){
      const v=heat[y*26+w],ch=v>0.97?'@':(v>0.93?'#':(v>0.78?'+':'!')),k=v>0.93?'ok':(v>0.78?'warn':'hot');
      const s=selH&&selH.y===y&&selH.w===w;
      g.set(5+w*2,y,s?'[':ch,s?'ink':k);g.set(6+w*2,y,s?']':ch,s?'ink':k);
    }
  }
  $('ch-heat').innerHTML=g.html();
}
const heatWeeks=()=>Math.min(26,Math.floor((colsOf($('ch-heat'))-5)/2));
function pickHeat(y,w){
  const weeks=heatWeeks();if(w<0||w>=weeks||y<0||y>6)return;selH={y,w};drawHeat();
  const v=heat[y*26+w],names=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  $('st-heat').textContent=names[y]+', '+(weeks-w)+' weeks ago: '+(v*100).toFixed(2)+'%'+(v<0.78?'  outage':(v<0.93?'  degraded':''));
  blip(v>0.93?880:(v>0.78?440:160),0.06,'square',0.09);if(v<0.78)A.kick();
}
A.onTap($('ch-heat'),e=>{const c=cellAt($('ch-heat'),e);pickHeat(c.y,Math.floor((c.x-5)/2))});
keys($('ch-heat'),k=>{
  const d={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0],Enter:[0,0],' ':[0,0]}[k];if(!d)return false;
  /* the first key lands on the newest week, where the eye starts */
  const s=selH||{y:0,w:heatWeeks()-1};pickHeat(clamp(s.y+(selH?d[0]:0),0,6),clamp(s.w+(selH?d[1]:0),0,heatWeeks()-1));return true;
});
$('ch-heat')._anim=grow(drawHeat);

/* donut */
const SEG=[['direct',0.38,'hot'],['search',0.27,'deep'],['social',0.20,'warn'],['email',0.15,'violet']];let selD=-1,donP=1;
function segAt(a){let acc=0;for(let i=0;i<SEG.length;i++){acc+=SEG[i][1];if(a<acc)return i}return SEG.length-1}
function drawDonut(p){
  if(p!=null)donP=p;const H=13,g=new Grid(Math.min(colsOf($('ch-donut')),48),H),cx=13,cy=6,ay=14/CCW;
  for(let y=0;y<H;y++)for(let x=0;x<27;x++){
    const dx=x-cx,dy=(y-cy)*ay,r=Math.hypot(dx,dy);if(r<5.6||r>12.6)continue;
    let a=(Math.atan2(dy,dx)+Math.PI/2)/(Math.PI*2);if(a<0)a+=1;if(a>donP)continue;
    const i=segAt(a),on=selD<0||selD===i;
    g.set(x,y,on?(r>10.4?'@':(r>8?'#':'*')):(r>10.4?':':'.'),on?SEG[i][2]:'muted');
  }
  SEG.forEach((s,i)=>{const on=selD<0||selD===i;g.set(29,3+i*2,'@',on?s[2]:'muted');g.set(30,3+i*2,'@',on?s[2]:'muted');g.text(32,3+i*2,s[0].padEnd(7,' ')+Math.round(s[1]*100)+'%',on?'ink':'muted')});
  $('ch-donut').innerHTML=g.html();
}
A.onTap($('ch-donut'),e=>{
  const c=cellAt($('ch-donut'),e);let i=-1;
  if(c.x>=29){i=Math.floor((c.y-3)/2);if(i<0||i>=SEG.length||(c.y-3)%2)i=-1}
  else{const dx=c.x-13,dy=(c.y-6)*(14/CCW),r=Math.hypot(dx,dy);if(r>=5&&r<=13.2){let a=(Math.atan2(dy,dx)+Math.PI/2)/(Math.PI*2);if(a<0)a+=1;i=segAt(a)}}
  pickDonut(i===selD?-1:i);
});
function pickDonut(i){
  selD=i;drawDonut();
  $('st-donut').textContent=selD<0?'Tap a slice.':SEG[selD][0]+': '+Math.round(SEG[selD][1]*100)+'% of traffic';
  blip(400+i*120,0.06,'square',0.09);
}
keys($('ch-donut'),k=>{
  const n=SEG.length;
  if(k==='ArrowRight'||k==='ArrowDown')pickDonut((selD+1)%n);
  else if(k==='ArrowLeft'||k==='ArrowUp')pickDonut(selD<0?n-1:(selD-1+n)%n);
  else if(k==='Enter'||k===' ')pickDonut(selD<0?0:-1);
  else return false;
  return true;
});
$('ch-donut')._anim=grow(drawDonut);
const DRAW={'ch-bars':()=>drawBars(),'ch-line':()=>line1.draw(),'ch-regions':()=>drawRegions(),'ch-heat':()=>drawHeat(),'ch-donut':()=>drawDonut()};
/* a chart draws when it comes near the screen, not all five at load and on
   every layout: until then it is marked as owed one, and it draws on arrival */
const near=new Set(),owed=new Set();
const nio='IntersectionObserver' in window?new IntersectionObserver(en=>en.forEach(e=>{
  const id=e.target.id;if(e.isIntersecting){near.add(id);if(owed.has(id)){owed.delete(id);DRAW[id]()}}else near.delete(id);
}),{rootMargin:'50% 0px'}):null;
if(nio)Object.keys(DRAW).forEach(id=>{owed.add(id);nio.observe($(id))});
function drawCharts(){Object.keys(DRAW).forEach(id=>{if(!nio||near.has(id))DRAW[id]();else owed.add(id)})}
/* a chart redraws when its own box changes: a view shows, the sidebar
   appears, the gallery reflows, the text size changes */
if('ResizeObserver' in window){
  const seen=new WeakMap();
  const ro=new ResizeObserver(en=>en.forEach(e=>{const el=e.target,w=el.clientWidth;if(!w||seen.get(el)===w)return;seen.set(el,w);if(!nio||near.has(el.id))DRAW[el.id]();else owed.add(el.id)}));
  Object.keys(DRAW).forEach(id=>ro.observe($(id)));
}else document.addEventListener('aui:view',drawCharts);

/* ================= sparklines, skeleton ================= */
function drawSparks(){document.querySelectorAll('.spark').forEach(s=>{s.textContent=A.TR(s.getAttribute('data-spark').split(',').map(n=>RAMP[clamp(+n+1,1,8)]).join(''))})}
drawSparks();
let skT=0;
/* a card's silhouette: a faint frame, a slab-wide title line and two text
   lines, with the wave running through the lines. It is sized to its own
   column, so in a gallery card it does not run out of the box. */
function drawSkel(){
  const el=$('skel');if(!el)return;
  const box=el.parentNode.clientWidth||W,cols=clamp(Math.floor(box/A.CH()),16,48),inner=cols-4;
  const wave=(n,r)=>{let s='';for(let x=0;x<n;x++)s+=RAMP[1+Math.round(1.6+1.6*Math.sin(x*0.45-skT+r*0.8))];return esc(A.TR(s))};
  const edge='<span class="f">'+'- '.repeat(cols).slice(0,cols)+'</span>',side='<span class="f">:</span>';
  const line=(n,r)=>side+' '+(n?wave(n,r):'')+' '.repeat(inner-n+1)+side;
  el.innerHTML=[edge,line(Math.min(12,inner),0),line(0,0),line(Math.floor(inner*0.9),1),line(Math.floor(inner*0.6),2),edge].join('\n');
}
/* the wave moves on its own, so it stops with Glitch off (the page's pause switch) */
if(!reduce&&$('skel'))every(110,()=>{skT+=0.5;drawSkel()},{el:$('skel'),gate:()=>G.on});

/* ================= blocks wiring ================= */
function setErr(id,msg){
  const inp=$(id),f=inp.closest('.field');$(id+'Err').textContent=msg;
  f.classList.toggle('invalid',!!msg);inp.setAttribute('aria-invalid',msg?'true':'false');
}
/* the fields sit in a form, so Enter in either one submits like the button */
$('lgForm').addEventListener('submit',e=>{
  e.preventDefault();
  const em=$('lgEmail').value.trim(),pw=$('lgPass').value;let bad=false;
  if(!em){setErr('lgEmail','Enter your email.');bad=true}else if(!/^\S+@\S+\.\S+$/.test(em)){setErr('lgEmail','That is not an email address.');bad=true}else setErr('lgEmail','');
  if(pw.length<8){setErr('lgPass',pw?'Use 8 characters or more.':'Enter your password.');bad=true}else setErr('lgPass','');
  if(bad){A.jolt();blip(120,0.25,'sawtooth',0.14,0.6);(($('lgEmail').getAttribute('aria-invalid')==='true')?$('lgEmail'):$('lgPass')).focus()}
  else{A.say('Signed in as '+em+'.');A.flash($('lgBtn'));arp([523,659,784],60)}
});
['lgEmail','lgPass'].forEach(id=>$(id).addEventListener('input',()=>{if($(id).getAttribute('aria-invalid')==='true')setErr(id,'')}));
$('ssoBtn').addEventListener('click',()=>A.say('SSO is not wired in this prototype.'));
const rows=[...document.querySelectorAll('#incTable tbody tr')];
function pickRow(tr){
  rows.forEach(r=>r.setAttribute('aria-selected',r===tr?'true':'false'));
  const c=tr.children;$('incStatus').textContent=c[0].textContent+': '+c[1].textContent+', '+c[2].querySelector('.badge').textContent.toLowerCase()+' for '+c[3].textContent+'.';
  if(/down/i.test(c[2].textContent))A.kick();
}
rows.forEach(tr=>{tr.addEventListener('click',()=>pickRow(tr));tr.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pickRow(tr)}})});
document.querySelectorAll('.pricing .btn').forEach(b=>b.addEventListener('click',()=>A.say(b.closest('.card').querySelector('.bar-title').textContent+' plan selected.')));

/* ================= headings, focus after a view swap, the menu on Home ================= */
/* Home has the page's h1 in its header; the header is hidden on the other
   views, so each docs view gets its own, named after the view, in its .dochead */
document.querySelectorAll('main > [role="tabpanel"] > .dochead').forEach(d=>{
  if(d.querySelector('h1'))return;
  const p=d.parentNode,t=$(p.getAttribute('aria-labelledby')),h=document.createElement('h1');
  h.className='vh';h.id='h1-'+p.id.replace(/^view-/,'');h.textContent=t?t.textContent.trim():'';d.insertBefore(h,d.firstChild);
});
/* A swap hides whatever had the focus (a Home tile, a link in a view), and
   the browser drops it on body, so Tab started over from the top. The new
   view's heading takes it quietly instead, the way a Search pick does. */
document.addEventListener('aui:view',e=>{
  const ae=document.activeElement;
  if(ae&&ae!==document.body&&!ae.closest('[hidden]')&&ae.offsetParent!==null)return;
  if(document.querySelector('dialog[open]'))return;
  const p=$(e.detail.getAttribute('aria-controls'));if(!p)return;
  const h=p.querySelector('.dochead h1')||p.querySelector('h2')||p;
  h.tabIndex=-1;h.focus({preventScroll:true});
});
/* The [=] menu on Home listed nothing under "Home 0": Home has no sections,
   but it has the ways in, so those are listed (js/70 fills the other views) */
(function(){
  const md=$('menuDlg'),panel=$('menuPanel');if(!md||!panel)return;
  const box=document.createElement('div');box.id='menuHome';box.className='navgroup';
  const items=[...document.querySelectorAll('#view-home .tiles a.tile')].map(a=>({label:a.querySelector('b').textContent,href:a.getAttribute('href'),v:a.dataset.v,sec:null}));
  /* js/40 builds Get the kit after this runs, so its section is found on the
     tap. It lives in Components, so the label says where it goes */
  items.push({label:'Components, Get the kit',href:'#components/install',v:'kit',sec:()=>{const k=$('s-install');return k&&k.parentNode}});
  box.innerHTML='<ul>'+items.map((it,i)=>'<li><a class="navlink" href="'+esc(it.href)+'" data-i="'+i+'">'+esc(it.label)+'</a></li>').join('')+'</ul>';
  panel.appendChild(box);
  /* the page changes once the menu is gone, then the focus lands where you went */
  function after(fn){md.addEventListener('close',function f(){md.removeEventListener('close',f);setTimeout(fn,0)});$('menuX').click()}
  box.addEventListener('click',e=>{
    const a=e.target.closest('a.navlink');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    e.preventDefault();const it=items[+a.dataset.i],N=window.AUI_NAV;if(!N)return;
    const sec=it.sec?it.sec():null;
    if(A.live())A.tone('square',440,0,0.05,0.4);
    after(()=>N.go(it.v,sec,{push:true,top0:!sec,after:()=>{
      const t=sec||$('view-'+it.v).querySelector('.dochead h1');if(t){t.tabIndex=-1;t.focus({preventScroll:true})}}}));
  });
  /* Search and the theme are in the bar, but the menu covers the bar */
  const ms=$('mSearch'),mt=$('mTheme'),tb=$('themeToggle');
  if(ms)ms.addEventListener('click',()=>after(()=>{if(window.AUI_SEARCH)AUI_SEARCH.open();else $('cmdBtn').click()}));
  if(mt){
    const sync=()=>{mt.textContent=(tb.getAttribute('aria-label')||'Theme');mt.title=tb.title};
    mt.addEventListener('click',()=>tb.click());
    new MutationObserver(sync).observe(tb,{attributes:true,attributeFilter:['aria-label','title']});sync();
  }
})();

/* ================= layout hook, glitch switch, start ================= */
A.onLayout=function(w){
  W=w;CCW=A.charWidth(12);CC=Math.max(30,Math.floor(w/CCW));
  drawCharts();drawSkel();drawSparks();C.INV.size(w);
};
$('glitchToggle').addEventListener('change',e=>{root.classList.toggle('calm',!e.target.checked)});
if(reduce)root.classList.add('calm');
A.layout();
B.boot(false,function(){
  if(window._revealTree){window._revealTree(document.querySelector('header'));const p=document.querySelector('main > [role="tabpanel"]:not([hidden])');if(p)window._revealTree(p)}
});
})();
