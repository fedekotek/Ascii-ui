(function(){
'use strict';
const A=window.AUI,B=window.AUI2,$=A.$,rnd=A.rnd,rep=A.rep,RAMP=A.RAMP,reduce=A.reduce,sfx=A.sfx,every=A.every,times=A.times;
const {esc,clamp,inView}=B;
const root=document.documentElement;
const live=()=>A.live();
const ping=(f,d)=>{if(live())A.tone('square',f,0,d||0.05,0.4)};
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href="#"]');if(a){e.preventDefault();ping(520)}});

/* single-character inputs replace instead of refusing */
document.addEventListener('beforeinput',e=>{
  const el=e.target;if(!el.matches||!el.matches('input[maxlength="1"]')||!e.data)return;
  e.preventDefault();el.value=e.data.slice(-1);el.dispatchEvent(new Event('input',{bubbles:true}));
});
document.addEventListener('focusin',e=>{if(e.target.matches&&e.target.matches('input[maxlength="1"]'))e.target.select()});

/* ================= LCD pictures: cells of three subpixels, panels of sectors ================= */
const SCN=document.createElement('canvas'),sc=SCN.getContext('2d',{willReadFrequently:true});
function mul(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function grad(x,w,h,stops,vert){const g=vert===false?x.createLinearGradient(0,0,w,0):x.createLinearGradient(0,0,0,h);stops.forEach(s=>g.addColorStop(s[0],s[1]));x.fillStyle=g;x.fillRect(0,0,w,h)}
const SCENES={
  ba(x,w,h,t){
    grad(x,w,h,[[0,'#120a3a'],[0.45,'#7a1f8a'],[0.7,'#ff3d7a'],[0.86,'#ffb347'],[1,'#ffe08a']]);
    const r=mul(7);x.fillStyle='#fff';for(let i=0;i<26;i++){const sx=r()*w,sy=r()*h*0.4;if((i+Math.floor(t*2))%5)x.fillRect(sx,sy,1,1)}
    x.fillStyle='#fff2b0';x.beginPath();x.arc(w*0.72,h*0.74,h*0.13+Math.sin(t)*0.4,0,7);x.fill();
    const b=mul(21);x.fillStyle='#0b0620';let bx=0;
    while(bx<w){const bw=2+Math.floor(b()*5),bh=h*(0.12+b()*0.3);x.fillRect(bx,h-bh,bw,bh);
      x.fillStyle='#ffd23f';for(let k=0;k<bw*bh/9;k++){if(b()<0.5+0.3*Math.sin(t+k))x.fillRect(bx+Math.floor(b()*bw),h-bh+1+Math.floor(b()*(bh-2)),1,1)}
      x.fillStyle='#0b0620';bx+=bw+(b()<0.3?1:0)}
    const cx=w*0.36;x.fillStyle='#160a2e';x.beginPath();x.moveTo(cx-2.2,h);x.lineTo(cx-1.3,h*0.3);x.lineTo(cx,h*0.2);x.lineTo(cx+1.3,h*0.3);x.lineTo(cx+2.2,h);x.fill();
    x.fillStyle='#ff9ad0';x.fillRect(cx-0.5,h*0.34,1,1);
  },
  desk(x,w,h,t){
    grad(x,w,h,[[0,'#140a2c'],[1,'#2a0f3f']]);
    x.fillStyle='#3a2a1a';x.fillRect(0,h*0.8,w,h*0.2);
    const mx=w*0.18,my=h*0.14,mw=w*0.6,mh=h*0.52;
    x.fillStyle='#05030a';x.fillRect(mx-1,my-1,mw+2,mh+2);x.fillStyle='#0f1030';x.fillRect(mx,my,mw,mh);
    x.fillStyle='#ff3d9a';x.fillRect(mx+1,my+1,mw*0.2,mh-2);
    ['#35e6f0','#c8f02c','#ffd23f'].forEach((c,i)=>{x.fillStyle=c;x.fillRect(mx+mw*0.26+i*mw*0.24,my+2,mw*0.2,mh*0.2)});
    x.strokeStyle='#fff';x.lineWidth=1;x.beginPath();
    for(let i=0;i<=12;i++){const px=mx+mw*0.26+i*(mw*0.7/12),py=my+mh*0.7-Math.sin(i*0.8+t*2)*mh*0.12-i*0.3;i?x.lineTo(px,py):x.moveTo(px,py)}x.stroke();
    x.fillStyle='#05030a';x.fillRect(mx+mw*0.45,my+mh,mw*0.1,h*0.1);x.fillRect(mx+mw*0.3,h*0.78,mw*0.4,2);
    x.fillStyle='#e8e4f0';x.fillRect(w*0.84,h*0.66,w*0.08,h*0.14);
    x.fillStyle='#2f9e44';[[0.08,0.6,3],[0.12,0.52,3.5],[0.05,0.5,2.5]].forEach(p=>{x.beginPath();x.arc(w*p[0],h*p[1]+Math.sin(t+p[2])*0.3,p[2],0,7);x.fill()});
    x.fillStyle='#b5651d';x.fillRect(w*0.05,h*0.66,w*0.08,h*0.14);
  },
  mate(x,w,h,t){
    grad(x,w,h,[[0,'#ffb347'],[0.6,'#ff5e7a'],[1,'#5a1a6a']]);
    x.fillStyle='#2a1230';x.fillRect(0,h*0.78,w,h*0.22);
    x.fillStyle='#6b3a1a';x.beginPath();x.ellipse(w*0.45,h*0.62,w*0.17,h*0.2,0,0,7);x.fill();
    x.fillStyle='#c9c9d6';x.fillRect(w*0.3,h*0.42,w*0.3,h*0.05);
    x.fillStyle='#4a7a2a';x.fillRect(w*0.32,h*0.4,w*0.26,h*0.03);
    x.strokeStyle='#e8e8f4';x.lineWidth=1.4;x.beginPath();x.moveTo(w*0.5,h*0.5);x.lineTo(w*0.68,h*0.14);x.stroke();
    x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=1;for(let i=0;i<3;i++){x.beginPath();for(let k=0;k<8;k++){const py=h*0.38-k*h*0.035,px=w*(0.36+i*0.07)+Math.sin(k*0.9+t*2+i)*1.4;k?x.lineTo(px,py):x.moveTo(px,py)}x.stroke()}
    x.fillStyle='#1a5a8a';x.fillRect(w*0.74,h*0.3,w*0.14,h*0.5);x.fillStyle='#c9c9d6';x.fillRect(w*0.76,h*0.24,w*0.1,h*0.07);
  },
  test(x,w,h,t){
    const c=['#fff','#ffd23f','#35e6f0','#c8f02c','#ff3d9a','#ff5a3d','#4a3dff'];c.forEach((k,i)=>{x.fillStyle=k;x.fillRect(i*w/7,0,w/7+1,h*0.68)});
    grad(x,w,h,[[0,'#000'],[1,'#fff']],false);x.clearRect(0,0,0,0);
    c.forEach((k,i)=>{x.fillStyle=k;x.fillRect(i*w/7,0,w/7+1,h*0.68)});
    x.fillStyle='#05030a';x.fillRect(0,h*0.68,w,h*0.08);
    x.strokeStyle='#05030a';x.lineWidth=1.5;x.beginPath();x.arc(w/2,h*0.36,h*0.26,0,7);x.stroke();
    x.fillStyle='#05030a';x.fillRect(w/2-0.5,h*0.1,1,h*0.52);x.fillRect(w/2-h*0.26,h*0.36-0.5,h*0.52,1);
    x.fillStyle='#ff3d9a';x.fillRect((t*6)%w,h*0.7,3,h*0.04);
  },
  portrait(x,w,h,t){
    grad(x,w,h,[[0,'#35e6f0'],[0.5,'#7a3dff'],[1,'#ff3d9a']]);
    x.fillStyle='#160a2e';x.beginPath();x.ellipse(w/2,h*1.02,w*0.46,h*0.32,0,0,7);x.fill();
    x.fillStyle='#e8b48a';x.fillRect(w*0.43,h*0.58,w*0.14,h*0.14);
    x.beginPath();x.ellipse(w/2,h*0.42,w*0.2,h*0.23,0,0,7);x.fill();
    x.fillStyle='#1c1020';x.beginPath();x.ellipse(w/2,h*0.27,w*0.21,h*0.12,0,0,7);x.fill();x.fillRect(w*0.29,h*0.27,w*0.05,h*0.14);x.fillRect(w*0.66,h*0.27,w*0.05,h*0.14);
    x.fillStyle='#1c1020';x.fillRect(w*0.36,h*0.4,w*0.11,h*0.05);x.fillRect(w*0.53,h*0.4,w*0.11,h*0.05);x.fillRect(w*0.47,h*0.415,w*0.06,1);
    x.fillStyle='#3a2030';x.beginPath();x.ellipse(w/2,h*0.56,w*0.13,h*0.07,0,0,3.2);x.fill();
    x.fillStyle='rgba(53,230,240,.5)';x.fillRect(w*0.3,h*0.3,1.2,h*0.3);
  },
  ui(x,w,h,t,kind){
    grad(x,w,h,[[0,'#0f0a26'],[1,'#1b0f3a']]);x.fillStyle='#ff3d9a';x.fillRect(0,0,w,2);
    if(kind===1){[0.5,0.8,0.35,0.95,0.6,0.7].forEach((v,i)=>{x.fillStyle=i===3?'#35e6f0':'#ff3d9a';const bh=h*0.6*v*(0.9+0.1*Math.sin(t*2+i));x.fillRect(3+i*(w-6)/6,h-2-bh,(w-6)/6-1,bh)});x.fillStyle='#c8f02c';x.fillRect(3,4,w*0.3,3)}
    else if(kind===2){x.fillStyle='#fff';x.fillRect(3,4,w-6,3);x.fillStyle='#ff3d9a';x.fillRect(4+((t*8)%(w*0.5)),4.5,1,2);for(let i=0;i<5;i++){x.fillStyle=i===1?'#35e6f0':'#6a5a9a';x.fillRect(3,10+i*2.4,(w-6)*(0.9-i*0.12),1.4)}}
    else if(kind===3){const n=[[0.15,0.3],[0.5,0.3],[0.85,0.3],[0.5,0.75]];x.strokeStyle='#9b7bea';x.lineWidth=1;x.beginPath();x.moveTo(w*0.15,h*0.3);x.lineTo(w*0.85,h*0.3);x.moveTo(w*0.5,h*0.3);x.lineTo(w*0.5,h*0.75);x.stroke();n.forEach((p,i)=>{x.fillStyle=['#ffd23f','#ff3d9a','#35e6f0','#c8f02c'][i];const s=(Math.floor(t*2)%4===i)?3.2:2.4;x.fillRect(w*p[0]-s,h*p[1]-s*0.8,s*2,s*1.6)})}
    else{[[0,0.55,'#6a5a9a'],[1,0.4,'#ff3d9a'],[0,0.7,'#6a5a9a'],[1,0.3+0.2*Math.abs(Math.sin(t*2)),'#35e6f0']].forEach((b,i)=>{x.fillStyle=b[2];const bw=(w-8)*b[1];x.fillRect(b[0]?w-4-bw:4,5+i*4.2,bw,3)})}
  }
};
['ui1','ui2','ui3','ui4'].forEach((k,i)=>{SCENES[k]=(x,w,h,t)=>SCENES.ui(x,w,h,t,i+1)});
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const LCDS=[];
function LCD(cv){
  this.cv=cv;this.x=cv.getContext('2d');this.cols=+cv.dataset.cols||48;this.rows=+cv.dataset.rows||36;
  this.scene=cv.dataset.scene||'test';this.mode=cv.dataset.mode||'rgb';this.img=null;this.vis=false;this.t=Math.random()*9;
  this.sx=this.cols>=36?4:2;this.sy=this.rows>=30?3:2;this.sect=[];
  for(let i=0;i<this.sx*this.sy;i++)this.sect.push({mode:null,shift:0,swap:0,scan:Math.random()});
  if(this.cols>=60){this.sect[rnd(this.sect.length)].mode='ascii';this.sect[rnd(this.sect.length)].mode='mono'}
  if('IntersectionObserver' in window)new IntersectionObserver(en=>{this.vis=en[0].isIntersecting}).observe(cv);else this.vis=true;
  cv.addEventListener('pointerdown',e=>{
    const r=cv.getBoundingClientRect();this.tap(Math.floor((e.clientX-r.left)/r.width*this.sx)+Math.floor((e.clientY-r.top)/r.height*this.sy)*this.sx);
  });
  /* a picture on its own is a control too: arrows walk the sectors, Enter or
     Space does what a tap does. Thumbnails inside a card leave it to the card */
  this.key=-1;
  if(cv.closest('figure.pic')&&!cv.closest('[role="button"]')){
    cv.tabIndex=0;
    cv.addEventListener('focus',()=>{if(this.key<0)this.key=0;this.draw()});
    cv.addEventListener('blur',()=>this.draw());
    cv.addEventListener('keydown',e=>{
      const k=this.key,x=k%this.sx,y=Math.floor(k/this.sx);let n=k;
      if(e.key==='ArrowRight')n=y*this.sx+Math.min(this.sx-1,x+1);
      else if(e.key==='ArrowLeft')n=y*this.sx+Math.max(0,x-1);
      else if(e.key==='ArrowDown')n=Math.min(this.sy-1,y+1)*this.sx+x;
      else if(e.key==='ArrowUp')n=Math.max(0,y-1)*this.sx+x;
      else if(e.key==='Enter'||e.key===' '){e.preventDefault();this.tap(k);return}
      else return;
      e.preventDefault();this.key=n;this.draw();
    });
  }
  LCDS.push(this);this.size();
}
LCD.prototype.tap=function(i){
  const s=this.sect[i];if(!s)return;
  const order=['rgb','mono','ascii'],cur=s.mode||this.mode;s.mode=order[(order.indexOf(cur)+1)%3];s.shift=rnd(7)-3;s.swap=4;ping(300+i*60,0.06);this.draw();
};
LCD.prototype.size=function(){
  const w=this.cv.clientWidth||this.cv.parentNode.clientWidth;if(!w)return;
  this.dpr=Math.min(window.devicePixelRatio||1,2);this.cw=w/this.cols;this.chh=this.cw;
  const h=this.chh*this.rows;this.cv.style.height=h+'px';this.cv.width=Math.round(w*this.dpr);this.cv.height=Math.round(h*this.dpr);this.draw();
};
LCD.prototype.sample=function(){
  const w=this.cols,h=this.rows;SCN.width=w;SCN.height=h;
  if(this.img){const iw=this.img.naturalWidth,ih=this.img.naturalHeight,ta=w/h,sa=iw/ih;let cw=iw,ch=ih,cx=0,cy=0;if(sa>ta){cw=ih*ta;cx=(iw-cw)/2}else{ch=iw/ta;cy=(ih-ch)*0.3}sc.drawImage(this.img,cx,cy,cw,ch,0,0,w,h)}
  else (SCENES[this.scene]||SCENES.test)(sc,w,h,this.t);
  return sc.getImageData(0,0,w,h).data;
};
LCD.prototype.draw=function(){
  const d=this.sample(),x=this.x,cw=this.cw,ch=this.chh,cols=this.cols,rows=this.rows,pal=A.pal()||{};
  x.setTransform(this.dpr,0,0,this.dpr,0,0);x.fillStyle='#05030a';x.fillRect(0,0,cols*cw,rows*ch);
  const gap=Math.max(0.4,cw*0.09),G6=v=>Math.round(255*Math.pow(Math.min(255,v)/255,0.55)),sw=(cw-gap)/3,secW=cols/this.sx,secH=rows/this.sy,burst=A.G.burst>0&&A.glitch()>0;
  x.textBaseline='top';x.font='700 '+(ch*1.05)+'px "Geist Mono",ui-monospace,Menlo,monospace';
  for(let Y=0;Y<rows;Y++){
    for(let X=0;X<cols;X++){
      const s=this.sect[Math.min(this.sx-1,Math.floor(X/secW))+Math.min(this.sy-1,Math.floor(Y/secH))*this.sx];
      let srcX=X+(s.shift&&(Y%3===0||s.swap>0)?s.shift:0);srcX=((srcX%cols)+cols)%cols;
      const i=(Y*cols+srcX)*4;let r=d[i],g=d[i+1],b=d[i+2];
      if(s.swap>0){const tmp=r;r=b;b=g;g=tmp}
      const scan=Math.abs(((Y/rows)+s.scan+this.t*0.12)%1-0.5)<0.03?1.25:1,px=X*cw,py=Y*ch,m=s.mode||this.mode;
      if(m==='rgb'){
        x.globalAlpha=0.5;x.fillStyle='rgb('+r+','+g+','+b+')';x.fillRect(px,py,cw-gap,ch-gap);x.globalAlpha=1;
        x.fillStyle='rgb('+G6(r*scan)+',0,0)';x.fillRect(px,py,sw,ch-gap);
        x.fillStyle='rgb(0,'+G6(g*scan)+',0)';x.fillRect(px+sw,py,sw,ch-gap);
        x.fillStyle='rgb(0,0,'+G6(b*scan*1.2)+')';x.fillRect(px+sw*2,py,sw,ch-gap);
      }else if(m==='mono'){
        const l=(r*0.299+g*0.587+b*0.114)/255,lv=Math.floor(l*4+(BAYER[(Y%4)*4+(X%4)]/16-0.5));
        x.fillStyle='#9bbc0f';x.fillRect(px,py,cw,ch);
        if(lv<3){x.fillStyle=lv<=0?'#0f380f':(lv===1?'#306230':'#6f9a1f');x.fillRect(px,py,cw-gap,ch-gap)}
      }else{
        const l=(r*0.299+g*0.587+b*0.114)/255;x.fillStyle='rgb('+r+','+g+','+b+')';
        x.fillText(RAMP[clamp(Math.round(l*7)+1,1,8)],px,py-ch*0.12);
      }
    }
  }
  x.fillStyle='#05030a';
  for(let i=1;i<this.sx;i++)x.fillRect(Math.round(i*secW)*cw-gap,0,gap*1.6,rows*ch);
  for(let j=1;j<this.sy;j++)x.fillRect(0,Math.round(j*secH)*ch-gap,cols*cw,gap*1.6);
  if(this.key>=0&&document.activeElement===this.cv){
    const kx=this.key%this.sx,ky=Math.floor(this.key/this.sx),x0=Math.round(kx*secW)*cw,y0=Math.round(ky*secH)*ch;
    x.strokeStyle=pal.cy||'#35e6f0';x.lineWidth=2;x.strokeRect(x0+1,y0+1,Math.round((kx+1)*secW)*cw-x0-2,Math.round((ky+1)*secH)*ch-y0-2);
  }
  this.sect.forEach(s=>{if(s.swap>0)s.swap--;else if(s.shift&&Math.random()<0.3)s.shift=0;if(burst&&Math.random()<0.25){s.shift=rnd(9)-4;s.swap=2}});
};
LCD.prototype.setImage=function(file,cb){const img=new Image();img.onload=()=>{this.img=img;this.draw();cb&&cb(true)};img.onerror=()=>cb&&cb(false);img.src=URL.createObjectURL(file)};
document.querySelectorAll('canvas.lcd').forEach(c=>new LCD(c));
const lcdOf=el=>LCDS.find(l=>l.cv===el);A.lcdOf=lcdOf;
if(!reduce)every(125,()=>{LCDS.forEach(l=>{if(l.vis&&l.cv.clientWidth){l.t+=0.12;if(!l.cw)l.size();else l.draw()}})});
window.addEventListener('resize',()=>LCDS.forEach(l=>l.size()));
const bigPic=lcdOf(document.querySelector('figure.pic canvas[data-scene="ba"]'));
const CAP={ba:'<b>Buenos Aires, 19:42.</b> Procedural, 64 by 48 cells.',desk:'<b>The desk.</b> One monitor, one plant, one chart that never stops.',mate:'<b>Mate.</b> Steam included.',test:'<b>Test card.</b> If this looks wrong, everything is fine.'};
document.addEventListener('change',e=>{
  const el=e.target;if(!el.name)return;
  if(el.name==='picMode'){bigPic.mode=el.value;bigPic.sect.forEach(s=>s.mode=null);bigPic.draw();A.kick()}
  else if(el.name==='picScene'){bigPic.img=null;bigPic.scene=el.value;bigPic.sect.forEach(s=>{s.swap=3;s.shift=rnd(7)-3});bigPic.draw();$('picCap').innerHTML=CAP[el.value];A.kick()}
  else if(el.name==='viewmode'){$('tgStatus').textContent=el.nextElementSibling.textContent+' view.'}
  if(el.closest('.tgroup'))ping(440+rnd(3)*110);
});
function wireLoad(btnId,fileId,lcd,after){
  $(btnId).addEventListener('click',()=>$(fileId).click());
  $(fileId).addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(f)lcd.setImage(f,ok=>{if(ok){A.flash(lcd.cv);after&&after()}else A.say('That file did not decode as an image.',true)})});
}
wireLoad('picLoad','picFile',bigPic,()=>{$('picCap').innerHTML='<b>Your photo.</b> It never leaves this page.'});
wireLoad('portLoad','portFile',lcdOf(document.querySelector('.profile canvas.lcd')));

/* ================= components ================= */
/* calendar */
window.AUI_JS=window.AUI_JS||{};window.AUI_JS.calendar=function(){
  const el=$('cal'),today=new Date();let view=new Date(today.getFullYear(),today.getMonth(),1),sel=new Date(today.getFullYear(),today.getMonth(),today.getDate()),foc=sel;
  const same=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
  /* one Tab stop for the whole month: only the focused day is in the tab order,
     arrows move it (roving tabindex) */
  function draw(){
    const y=view.getFullYear(),m=view.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate();
    if(foc.getFullYear()!==y||foc.getMonth()!==m)foc=(sel.getFullYear()===y&&sel.getMonth()===m)?sel:new Date(y,m,Math.min(foc.getDate(),n));
    let h='<div class="cal-head"><button class="ibtn" type="button" data-d="-1" aria-label="Previous month">&lt;</button><span>'+view.toLocaleString('en-US',{month:'long'})+' '+y+'</span><button class="ibtn" type="button" data-d="1" aria-label="Next month">&gt;</button></div><div class="cal-grid">';
    'MTWTFSS'.split('').forEach(d=>h+='<span aria-hidden="true">'+d+'</span>');
    for(let i=0;i<first;i++)h+='<span></span>';
    for(let d=1;d<=n;d++){const dt=new Date(y,m,d);h+='<button type="button" data-day="'+d+'" tabindex="'+(same(dt,foc)?0:-1)+'" class="'+(same(dt,today)?'today':'')+'" aria-pressed="'+(same(dt,sel)?'true':'false')+'" aria-label="'+dt.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'})+'">'+d+'</button>'}
    el.innerHTML=h+'</div>';
    $('calStatus').textContent=sel.toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  }
  el.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.d){view=new Date(view.getFullYear(),view.getMonth()+(+b.dataset.d),1);draw();ping(330);el.querySelector('[data-d="'+b.dataset.d+'"]').focus()}
    else{sel=foc=new Date(view.getFullYear(),view.getMonth(),+b.dataset.day);draw();ping(660);el.querySelector('[data-day="'+b.dataset.day+'"]').focus()}
  });
  /* arrows by day and week, Home and End to the ends of the week, Page Up and
     Page Down by month. Crossing a month edge turns the page */
  el.addEventListener('keydown',e=>{
    if(!e.target.closest('[data-day]'))return;
    const K={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7},wd=(foc.getDay()+6)%7;let d;
    if(e.key in K)d=new Date(foc.getFullYear(),foc.getMonth(),foc.getDate()+K[e.key]);
    else if(e.key==='Home')d=new Date(foc.getFullYear(),foc.getMonth(),foc.getDate()-wd);
    else if(e.key==='End')d=new Date(foc.getFullYear(),foc.getMonth(),foc.getDate()+6-wd);
    else if(e.key==='PageUp'||e.key==='PageDown'){const t=foc.getMonth()+(e.key==='PageUp'?-1:1);d=new Date(foc.getFullYear(),t,Math.min(foc.getDate(),new Date(foc.getFullYear(),t+1,0).getDate()))}
    else return;
    e.preventDefault();foc=d;view=new Date(d.getFullYear(),d.getMonth(),1);draw();
    el.querySelector('[data-day="'+d.getDate()+'"]').focus();
  });
  draw();
};window.AUI_JS.calendar();
/* command */
$('cmdOpen2').addEventListener('click',()=>$('cmdBtn').click());
/* dropdown */
window.AUI_JS=window.AUI_JS||{};window.AUI_JS.dropdown=function(){
  const btn=$('ddBtn'),menu=$('ddMenu'),items=[...menu.querySelectorAll('[role="menuitem"]')];
  function open(on){menu.hidden=!on;menu.classList.toggle('open',on);btn.setAttribute('aria-expanded',on?'true':'false');if(on){items[0].focus();if(live())sfx.open()}}
  btn.addEventListener('click',()=>open(menu.hidden));
  menu.addEventListener('keydown',e=>{
    const i=items.indexOf(document.activeElement);
    if(e.key==='ArrowDown'){e.preventDefault();items[(i+1)%items.length].focus()}
    else if(e.key==='ArrowUp'){e.preventDefault();items[(i-1+items.length)%items.length].focus()}
    else if(e.key==='Escape'){open(false);btn.focus()}
  });
  items.forEach(it=>it.addEventListener('click',()=>{open(false);btn.focus();const t=it.firstChild.textContent.trim();if(it.classList.contains('danger')){toast(t+'. It is gone.',true);A.jolt()}else A.say(t+'.')}));
  document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!e.target.closest('#dd'))open(false)});
  /* Tab out of the menu closes it. Focus going nowhere (a click on the page)
     is left to the pointerdown above */
  $('dd').addEventListener('focusout',e=>{if(!menu.hidden&&e.relatedTarget&&!$('dd').contains(e.relatedTarget))open(false)});
};window.AUI_JS.dropdown();
/* empty */
$('emptyBtn').addEventListener('click',()=>A.say('Work order created. So much for nothing.'));
/* otp */
window.AUI_JS=window.AUI_JS||{};window.AUI_JS.otp=function(){
  const box=$('otp'),ins=[...box.querySelectorAll('input')];
  function check(){const v=ins.map(i=>i.value).join('');box.classList.toggle('good',/^\d{6}$/.test(v));if(/^\d{6}$/.test(v)){$('otpStatus').textContent='Code '+v+' accepted.';if(live())sfx.ok();A.kick()}else $('otpStatus').textContent=v.length+' of 6.'}
  ins.forEach((inp,i)=>{
    inp.addEventListener('input',()=>{inp.value=inp.value.replace(/\D/g,'').slice(-1);if(inp.value&&ins[i+1])ins[i+1].focus();check()});
    inp.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!inp.value&&ins[i-1]){ins[i-1].focus();ins[i-1].value='';check()}else if(e.key==='ArrowLeft'&&ins[i-1])ins[i-1].focus();else if(e.key==='ArrowRight'&&ins[i+1])ins[i+1].focus()});
    inp.addEventListener('paste',e=>{e.preventDefault();const t=(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6);t.split('').forEach((c,k)=>{if(ins[k])ins[k].value=c});(ins[Math.min(5,t.length)]||ins[5]).focus();check()});
  });
};window.AUI_JS.otp();
/* pagination */
window.AUI_JS=window.AUI_JS||{};window.AUI_JS.pagination=function(){
  const el=$('pager'),N=9;let cur=3;
  function draw(){
    /* every page is a 48px target; nine of them with two gaps need 374px, so a
       narrower box drops the neighbours rather than wrapping to a second row */
    const near=el.clientWidth&&el.clientWidth<374?0:1;
    const pages=[1];for(let p=cur-near;p<=cur+near;p++)if(p>1&&p<N)pages.push(p);pages.push(N);
    let h='<button class="ibtn" type="button" data-p="'+(cur-1)+'"'+(cur===1?' disabled':'')+' aria-label="Previous page">&lt;</button>',last=0;
    pages.forEach(p=>{if(p-last>1)h+='<span class="muted" aria-hidden="true">..</span>';h+='<button class="ibtn" type="button" data-p="'+p+'"'+(p===cur?' aria-current="page"':'')+' aria-label="Page '+p+'">'+p+'</button>';last=p});
    el.innerHTML=h+'<button class="ibtn" type="button" data-p="'+(cur+1)+'"'+(cur===N?' disabled':'')+' aria-label="Next page">&gt;</button>';
    $('pagerStatus').textContent='Page '+cur+' of '+N+'.';
  }
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;cur=clamp(+b.dataset.p,1,N);draw();ping(300+cur*60);const c=el.querySelector('[aria-current]');c&&c.focus()});
  draw();
};window.AUI_JS.pagination();
/* sheet */
$('sheetBtn').addEventListener('click',()=>{const d=$('sheetDlg');if(d.showModal){d.showModal();if(live())sfx.open()}});
/* a phone has no Esc key: the [x] and the strip of page above the sheet close
   it, on click so the same tap does not land on the page underneath */
$('sheetX').addEventListener('click',()=>$('sheetDlg').close());
A.backdropClose($('sheetDlg'));
$('sheetReset').addEventListener('click',()=>{$('sheetDlg').querySelectorAll('input').forEach(i=>{i.checked=false})});
$('sheetApply').addEventListener('click',()=>{const n=$('sheetDlg').querySelectorAll('input:checked').length;$('sheetDlg').close();A.say(n+' filter'+(n===1?'':'s')+' applied.')});
/* spinners */
window.AUI_JS=window.AUI_JS||{};window.AUI_JS.spinners=function(){
  const bs=[...$('spins').querySelectorAll('b')],R='.:=+*#%@%#*+=:';let f=0;
  function draw(){
    f++;const b=f%10,pos=b<5?b:10-b;
    bs[0].textContent='|/-\\'[f%4];
    bs[1].textContent=A.TR(R[f%R.length]+R[(f+1)%R.length]+R[(f+2)%R.length]);
    bs[2].textContent='['+rep(' ',pos)+'='+rep(' ',5-pos)+']';
    bs[3].textContent=rep('.',1+(f>>1)%3);
    bs[4].textContent=A.TR(A.barRow((f*0.7)%9|0,false,8));
  }
  draw();if(!reduce)A.every(110,draw,{el:$('spins')});
};window.AUI_JS.spinners();
/* textarea counters */
/* at the limit the counter warns: the next key does nothing, so say so */
function counter(ta,out){if(!ta||!out)return;const up=()=>{out.textContent=ta.value.length+'/'+ta.maxLength;out.classList.toggle('full',ta.value.length>=ta.maxLength)};ta.addEventListener('input',up);up()}
counter($('ta'),$('taCount'));
/* toast */
function toast(msg,err){A.say(msg,err);if(err&&live())sfx.err()}
$('toastOk').addEventListener('click',()=>{A.say('Changes saved.');if(live())sfx.ok()});
$('toastErr').addEventListener('click',()=>{toast('Something broke. It was you.',true);A.jolt()});
/* tooltip on touch */
$('ttBtn').addEventListener('click',()=>{const p=$('tt');clearTimeout(p._t);p.classList.add('on');p._t=setTimeout(()=>p.classList.remove('on'),1800)});

/* ================= blocks ================= */
$('sayHi').addEventListener('click',()=>A.say('Hi. No inbox is wired in this prototype.'));
(function(){
  const st=$('caseStatus'),D={Reporting:'Reporting: led at MaintainX. Dashboards for plant managers, built mobile first.',Search:'Search: global search across work orders, assets and parts.',Automations:'Automations: triggers and actions for maintenance teams, no code.',Chat:'Chat: messaging for frontline teams, tied to the work order.'};
  document.querySelectorAll('#cases [data-case]').forEach(c=>{
    c.setAttribute('aria-pressed','false');
    /* the status line is a screen away on a phone, so the card shows it was
       picked and the toast says what it is */
    const go=()=>{st.textContent=D[c.dataset.case];document.querySelectorAll('#cases [data-case]').forEach(x=>x.setAttribute('aria-pressed',x===c?'true':'false'));A.say(D[c.dataset.case]);A.kick();ping(520);const l=lcdOf(c.querySelector('canvas'));if(l){l.sect.forEach(s=>{s.swap=4;s.shift=rnd(9)-4});l.draw()}};
    c.addEventListener('click',go);c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
  });
})();
$('nowRead').innerHTML=A.colorize(A.barRow(Math.round(163/179*14),false,14))+' <span class="muted">163/179</span>';
if(!reduce)every(140,()=>{const e=$('nowPull');if(e&&inView(e))e.textContent='|/-\\'[Date.now()/140&3]+' loading'});else $('nowPull').textContent='loading';
(function(){
  const ING=[['Tira de asado',400,'g'],['Vacío',220,'g'],['Chorizo',1,'u'],['Provoleta',0.34,'u'],['Coarse salt',12,'g'],['Charcoal',700,'g'],['Malbec',0.25,'l']];let n=6;
  const fmt=(q,u)=>u==='g'?(q>=1000?(q/1000).toFixed(1).replace(/\.0$/,'')+' kg':Math.round(q/10)*10+' g'):(u==='l'?(Math.round(q*10)/10)+' l':Math.max(1,Math.ceil(q))+'');
  function draw(){$('srvN').textContent=n;$('ing').innerHTML=ING.map(i=>'<li><span>'+i[0]+'</span><span class="qty">'+fmt(i[1]*n,i[2])+'</span></li>').join('');$('srvDown').disabled=n<=1;$('srvUp').disabled=n>=20}
  $('srvDown').addEventListener('click',()=>{n=Math.max(1,n-1);draw();ping(330)});
  $('srvUp').addEventListener('click',()=>{n=Math.min(20,n+1);draw();ping(520)});draw();
})();
(function(){
  const S=[['Life',2840,4000,0],['Shield',1120,4000,0],['Evasion',61,100,1],['Crit',38,100,1],['DPS',412,900,2]];
  function draw(){
    let h='',t='';
    S.forEach(s=>{const v=s[3]===1?s[1]+'%':(s[3]===2?s[1]+'k':s[1].toLocaleString('en-US'));h+='<span style="color:var(--muted)">'+s[0].padEnd(8,' ')+'</span>'+A.colorize(A.barRow(Math.round(s[1]/s[2]*10),false,10))+' '+v+'\n';t+=s[0]+' '+v+'. '});
    $('buildBars').innerHTML=h;$('buildText').textContent=t;
  }
  $('buildRoll').addEventListener('click',()=>{S.forEach(s=>{s[1]=Math.round(s[2]*(0.2+Math.random()*0.75))});draw();A.flash($('buildRoll'))});draw();
})();
(function(){
  const list=$('wo'),bar=$('woBar');
  function draw(){
    const all=list.querySelectorAll('input').length,done=list.querySelectorAll('input:checked').length;
    bar.querySelector('.bar').innerHTML=A.colorize(A.barRow(Math.round(done/all*24),false,24));bar.querySelector('.pct').textContent=' '+done+' of '+all;
    bar.setAttribute('aria-valuenow',done);if(done===all){A.say('All work orders closed. Go home.');A.flash(bar)}
  }
  list.addEventListener('change',draw);draw();
})();
$('side').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$('side').querySelectorAll('button').forEach(x=>x===b?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current'));ping(440)});
(function(){
  const snd=$('setSnd'),gl=$('setGl'),S=$('soundToggle'),Gt=$('glitchToggle');
  const sync=()=>{snd.checked=S.checked;gl.checked=Gt.checked};sync();
  snd.addEventListener('change',()=>{if(S.checked!==snd.checked)S.click()});
  gl.addEventListener('change',()=>{if(Gt.checked!==gl.checked)Gt.click()});
  S.addEventListener('change',sync);Gt.addEventListener('change',sync);
  $('setSave').addEventListener('click',()=>{A.say('Preferences saved.');if(live())sfx.ok()});
})();
$('critSend').addEventListener('click',()=>{
  const ta=$('critTa'),f=ta.closest('.field'),v=document.querySelector('input[name="verdict"]:checked').nextElementSibling.textContent;
  if(ta.value.trim().length<8){$('critErr').textContent='Say at least one specific thing.';f.classList.add('invalid');ta.setAttribute('aria-invalid','true');ta.focus();A.jolt();if(live())sfx.err();return}
  $('critErr').textContent='';f.classList.remove('invalid');ta.removeAttribute('aria-invalid');A.say('Crit sent. Verdict: '+v.toLowerCase()+'.');if(live())sfx.ok();
});
$('lostHome').addEventListener('click',()=>{const t=$('v-kit');window.scrollTo(0,0);if(t.getAttribute('aria-selected')!=='true')t.click()});
if(!reduce)every(260,()=>{const p=$('lostTitle');if(p&&inView(p)&&!p._iv&&A.glitch()>0&&p._b)A.titleFrame(p,6+rnd(6))});

/* ================= shadcn-style docs: index, preview and code tabs, filters ================= */
function cleanHTML(node,sec){
  const c=node.cloneNode(true);
  c.querySelectorAll('[data-rv]').forEach(e=>e.removeAttribute('data-rv'));
  c.querySelectorAll('[style]').forEach(e=>e.removeAttribute('style'));
  c.querySelectorAll('.in,.done').forEach(e=>e.classList.remove('in','done'));
  /* the engine's own marks on buttons: the label it scrambles from */
  c.querySelectorAll('[data-text]:not(pre)').forEach(e=>e.removeAttribute('data-text'));
  c.querySelectorAll('pre.ptitle,pre.chart,canvas,.bar,.skel,.statbars,#cal,#pager,#ing,.spins b,.pct').forEach(e=>{e.textContent=''});
  /* the kit's data attributes and the dialogs that live outside the section (js/40) */
  if(sec&&A.kitify)A.kitify(sec,c);
  c.querySelectorAll('[class]').forEach(e=>{const v=e.getAttribute('class').trim().replace(/\s+/g,' ');if(v)e.setAttribute('class',v);else e.removeAttribute('class')});
  return c.innerHTML;
}
/* One element per line where that is safe, text on the line of its tag. A
   button is white-space:pre, so a label on its own indented line drew as three
   rows; anything that holds only inline content stays on one line, and only
   block containers without text of their own break into lines. */
const BLOCKTAG=/^(DIV|SECTION|ARTICLE|NAV|OL|UL|DL|FIELDSET|DETAILS|DIALOG|FIGURE|FORM|TABLE|THEAD|TBODY|TR|HEADER|FOOTER|ASIDE|MENU)$/;
function pretty(html){
  const tpl=document.createElement('template');tpl.innerHTML=html;
  const open=el=>{const s=el.cloneNode(false).outerHTML,end='</'+el.localName+'>';return s.endsWith(end)?s.slice(0,-end.length):s};
  const hasText=el=>[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
  const hasBlock=el=>[...el.querySelectorAll('*')].some(x=>BLOCKTAG.test(x.tagName));
  let o='';
  function out(n,d){
    const pad=rep('  ',d);
    if(n.nodeType===3){const t=n.textContent.trim();if(t)o+=pad+esc(t)+'\n';return}
    if(n.nodeType!==1)return;
    const breakIt=BLOCKTAG.test(n.tagName)&&n.children.length&&!hasText(n)&&(hasBlock(n)||n.outerHTML.length>100);
    if(!breakIt){o+=pad+n.outerHTML+'\n';return}
    o+=pad+open(n)+'\n';[...n.childNodes].forEach(k=>out(k,d+1));o+=pad+'</'+n.localName+'>\n';
  }
  [...tpl.content.childNodes].forEach(n=>out(n,0));
  /* boolean attributes as they are written by hand: disabled, not disabled="" */
  return o.replace(/ ([a-z][a-z-]*)=""/g,' $1');
}
function hl(code){
  let h=esc(code);
  h=h.replace(/ ([a-z-]+)="([^"]*)"/gi,' \u0001$1\u0002=\u0003"$2"\u0002');
  h=h.replace(/(&lt;\/?)([a-z0-9]+)/gi,'$1\u0004$2\u0002');
  return h.replace(/\u0001/g,'<span class="a">').replace(/\u0003/g,'<span class="s">').replace(/\u0004/g,'<span class="t">').replace(/\u0002/g,'</span>');
}
let docN=0;
function docify(sec){
  const kids=[...sec.children],di=kids.findIndex(k=>k.matches('p.muted:not(.status)'));if(di<0)return;
  const demo=kids.slice(di+1);if(!demo.length)return;
  const id='doc'+(++docN),wrap=document.createElement('div');wrap.className='doc';
  wrap.innerHTML='<div class="tablist doc-tabs" role="tablist" aria-label="'+esc(sec.querySelector('h2').textContent)+' views">'+
    '<button class="tab" role="tab" type="button" id="'+id+'t1" aria-controls="'+id+'p1" aria-selected="true">Preview</button>'+
    '<button class="tab" role="tab" type="button" id="'+id+'t2" aria-controls="'+id+'p2" aria-selected="false" tabindex="-1">Code</button></div>'+
    '<div class="doc-panel" role="tabpanel" id="'+id+'p1" aria-labelledby="'+id+'t1"></div>'+
    '<div class="doc-panel" role="tabpanel" id="'+id+'p2" aria-labelledby="'+id+'t2" hidden><pre class="code" tabindex="0" aria-label="Source code"></pre><div class="row copyrow"></div></div>';
  sec.insertBefore(wrap,demo[0]);const p1=wrap.children[1],p2=wrap.children[2];demo.forEach(n=>p1.appendChild(n));
  /* only the doc's own two tabs: the Tabs demo, now inside p1, has its own */
  const tabs=[...wrap.firstChild.querySelectorAll('[role="tab"]')];let built=false;
  /* The Code tab prints what works next to the two kit files: the html with
     the kit's data attributes, then the css blocks it uses and the behavior
     that runs it, both from the kit (js/40). Each part is its own span, so
     Copy can select it when the clipboard is blocked. */
  function build(){
    const html=pretty(cleanHTML(p1,sec)),ex=A.codeExtra?A.codeExtra(sec,html):{css:'',js:''},pre=p2.querySelector('pre');
    pre.innerHTML='<b class="h4">html</b><span data-part="html">'+hl(html)+'</span>'+
      (ex.css?'\n<b class="h4">css</b><span data-part="css">'+esc(ex.css)+'</span>\n':'')+
      '\n<b class="h4">js</b><span data-part="js">'+esc(ex.js)+'</span>\n';
    const row=p2.querySelector('.copyrow'),mk=(label,txt,part)=>{
      const b=document.createElement('button');b.type='button';b.className='btn frame tone-light';b.innerHTML='<span class="mid"><span class="label">'+label+'</span></span>';
      b.addEventListener('click',()=>{if(A.copy)A.copy(txt,'the '+part,pre.querySelector('[data-part="'+part+'"]'))});row.appendChild(b);
    };
    mk('Copy html',html,'html');if(ex.css)mk('Copy css',ex.css,'css');
  }
  function pick(t,focus){
    tabs.forEach(x=>{const on=x===t;x.setAttribute('aria-selected',on?'true':'false');x.tabIndex=on?0:-1});
    const code=t===tabs[1];p1.hidden=code;p2.hidden=!code;
    /* The section keeps its column when Code opens. Widening it to the whole
       row reshuffled the gallery under your cursor; long lines scroll sideways
       inside the code box instead. */
    if(code&&!built){built=true;build()}
    if(code&&A.glitch()>0&&!reduce)B.tear(1);
    if(live())sfx.tab();if(focus)t.focus();
  }
  tabs.forEach((t,i)=>{t.addEventListener('click',()=>pick(t));t.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();pick(tabs[1-i],true)}})});
}
/* which sections cannot live in a narrow gallery column: anything with a table,
   a chart, a canvas, a phone frame or its own tab strip. Set data-span in the
   html to override, either way. See docs/COMPONENTS.md. */
const WIDE='.tablewrap,.phone,.timeline,.statbars,figure.pic,.kpi,.steps,.rampcells';
function spanSections(panel){
  panel.querySelectorAll(':scope > section[aria-labelledby]').forEach(s=>{
    if(!s.hasAttribute('data-span')&&s.querySelector(WIDE))s.setAttribute('data-span','full');
  });
}
/* skip: sections that stay out of the index and close the view (Rules; Get
   the kit joins it from js/40). The header links to them, the sidebar lists
   them first as Getting started, and the page opens on a component.
   pin: sections that open the index, in that order, ahead of the alphabet: a
   404 page is a strange first block. */
function buildView(panel,label,skip,pin,group){
  spanSections(panel);pin=pin||[];
  const id=s=>s.getAttribute('aria-labelledby'),all=[...panel.querySelectorAll(':scope > section[aria-labelledby]')];
  const secs=all.filter(s=>!skip.includes(id(s))),tail=all.filter(s=>skip.includes(id(s)));
  const name=s=>s.querySelector('h2').textContent.trim(),rank=s=>{const i=pin.indexOf(id(s));return i<0?pin.length:i};
  /* grouped views sort by group first; the group rides on the section for the sidebar */
  const G=group?s=>{const g=group(id(s));s.dataset.group=g[1];return g[0]}:()=>0;
  secs.sort((a,b)=>G(a)-G(b)||rank(a)-rank(b)||name(a).localeCompare(name(b)));
  secs.forEach(s=>panel.appendChild(s));tail.forEach(s=>panel.appendChild(s));
  /* Tabs too: its demo is a tablist of its own, and docify only wires the doc's */
  secs.forEach(docify);
  /* a grouped view says where each group starts, on the page as in the sidebar */
  if(group)secs.forEach((s,i)=>{
    if(i&&secs[i-1].dataset.group===s.dataset.group)return;
    const h=document.createElement('p');h.className='grouph';h.setAttribute('aria-hidden','true');h.dataset.g=s.dataset.group;
    h.innerHTML=s.dataset.group+' <span class="navcount">'+secs.filter(x=>x.dataset.group===s.dataset.group).length+'</span>';
    panel.insertBefore(h,s);
  });
  const toc=document.createElement('section');toc.setAttribute('aria-label',label+' index');
  /* under 1024px the [=] menu is the index now, so this starts closed; from
     1024px the sidebar is, and css hides it */
  toc.innerHTML='<details class="acc toc"><summary>'+label+', '+secs.length+'</summary><div class="chips"></div></details>';
  const chips=toc.querySelector('.chips');
  secs.forEach(s=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=name(s);b.addEventListener('click',()=>{if(A.jump)A.jump(s);else s.scrollIntoView({block:'start'});ping(440)});s._chip=b;chips.appendChild(b)});
  /* after the intro and anything else that is not a section of its own (the
     Blocks filters), right before the first card */
  /* before the first group label, so a label always sits on its own group */
  panel.insertBefore(toc,panel.querySelector(':scope > .grouph')||panel.querySelector(':scope > section[aria-labelledby]'));
  return secs;
}
spanSections($('view-charts'));
/* the thirty, by what they do, the way a docs site groups them */
const KIT_GROUPS=[
  ['Form',['s-button','s-calendar','s-input','s-otp','s-select','s-slider','s-textarea','s-toggles','s-togglegroup']],
  ['Overlay',['s-command','s-dropdown','s-sheet','s-tooltip']],
  ['Display',['s-avatar','s-badge','s-card','s-details','s-kbd','s-picture','s-separator','s-timeline']],
  ['Feedback',['s-alert','s-empty','s-progress','s-skeleton','s-spinner','s-toast']],
  ['Navigation',['s-breadcrumb','s-pagination','s-tabs']]];
buildView($('view-kit'),'Components',['s-rules'],[],id=>{
  const i=KIT_GROUPS.findIndex(g=>g[1].includes(id));
  return i<0?[KIT_GROUPS.length,'Other']:[i,KIT_GROUPS[i][0]];
});
/* Blocks group by the same categories as their filter chips */
const BLOCK_GROUPS=[['auth','Auth'],['dashboard','Dashboard'],['app','App'],['marketing','Marketing'],['personal','Personal']];
const blockSecs=buildView($('view-blocks'),'Blocks',[],['s-login','s-stats'],id=>{
  const s=$('view-blocks').querySelector(':scope > section[aria-labelledby="'+id+'"]'),i=BLOCK_GROUPS.findIndex(g=>g[0]===(s&&s.dataset.cat));
  return i<0?[BLOCK_GROUPS.length,'Other']:[i,BLOCK_GROUPS[i][1]];
});
$('blockFilters').addEventListener('click',e=>{
  const b=e.target.closest('.chip');if(!b)return;const f=b.dataset.f;
  $('blockFilters').querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed',c===b?'true':'false'));
  blockSecs.forEach(s=>{s.hidden=f!=='all'&&s.dataset.cat!==f;if(s._chip)s._chip.hidden=s.hidden});
  /* a group label goes when the filter leaves nothing under it */
  $('view-blocks').querySelectorAll(':scope > .grouph').forEach(h=>{h.hidden=!blockSecs.some(s=>!s.hidden&&s.dataset.group===h.dataset.g)});
  const sum=$('view-blocks').querySelector('.toc summary');if(sum)sum.textContent='Blocks, '+blockSecs.filter(s=>!s.hidden).length;
  LCDS.forEach(l=>l.size());if(A.glitch()>0)B.tear(2);ping(520);
});
document.addEventListener('aui:view',()=>setTimeout(()=>{LCDS.forEach(l=>l.size());A.fitTitles();if(window.AUI_WIDE)AUI_WIDE()},900));
setTimeout(()=>LCDS.forEach(l=>l.size()),300);

/* say it when a table is wider than its box: on touch there is no scrollbar
   and the last column just is not there */
function markWide(){
  document.querySelectorAll('.tablewrap').forEach(w=>{
    if(w.scrollWidth>w.clientWidth+2)w.setAttribute('data-wide','');
    else w.removeAttribute('data-wide');
  });
}
markWide();window.AUI_WIDE=markWide;
window.addEventListener('resize',markWide);
setTimeout(markWide,1200);
})();
