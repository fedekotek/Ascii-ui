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
  e.preventDefault();el.value=Array.from(e.data).pop();el.dispatchEvent(new Event('input',{bubbles:true}));
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
  A.onTap(cv,e=>{
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
  this.w=w;this.dpr=Math.min(window.devicePixelRatio||1,2);this.cw=w/this.cols;this.chh=this.cw;
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
LCD.prototype.setImage=function(file,cb){const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);this.img=img;this.draw();cb&&cb(true)};img.onerror=()=>{URL.revokeObjectURL(url);cb&&cb(false)};img.src=url};
document.querySelectorAll('canvas.lcd').forEach(c=>new LCD(c));
const lcdOf=el=>LCDS.find(l=>l.cv===el);A.lcdOf=lcdOf;
/* a picture resized while it was hidden (a Code tab open, another view)
   kept its old width: the loop sizes it again once it shows at a new one */
/* the pictures move on their own, so they stop with Glitch off (WCAG 2.2.2); a resize still lands */
if(!reduce)every(125,()=>{LCDS.forEach(l=>{if(l.vis&&l.cv.clientWidth){if(l.cv.clientWidth!==l.w)l.size();else if(A.G.on){l.t+=0.12;l.draw()}}})},{gate:()=>LCDS.some(l=>l.vis&&l.cv.clientWidth&&(A.G.on||l.cv.clientWidth!==l.w))});
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
  /* the input is cleared each time, so the same file picked twice still loads */
  $(fileId).addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(f)lcd.setImage(f,ok=>{if(ok){A.flash(lcd.cv);after&&after()}else A.say('That file did not decode as an image.',true)})});
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
  /* the arrows open it from the button too: down lands on the first item, up on the last */
  btn.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(menu.hidden)open(true);(e.key==='ArrowUp'?items[items.length-1]:items[0]).focus()}
  });
  menu.addEventListener('keydown',e=>{
    const i=items.indexOf(document.activeElement);
    if(e.key==='ArrowDown'){e.preventDefault();items[(i+1)%items.length].focus()}
    else if(e.key==='ArrowUp'){e.preventDefault();items[(i-1+items.length)%items.length].focus()}
    else if(e.key==='Home'){e.preventDefault();items[0].focus()}
    else if(e.key==='End'){e.preventDefault();items[items.length-1].focus()}
    else if(e.key==='Escape'){open(false);btn.focus()}
    /* the keys the menu shows next to an item pick it */
    else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
      const it=items.find(x=>{const k=x.querySelector('kbd');return k&&k.textContent.trim().toLowerCase()===e.key.toLowerCase()});
      if(it){e.preventDefault();e.stopPropagation();it.click()}
    }
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
  draw();if(!reduce)A.every(110,draw,{el:$('spins'),gate:()=>A.G.on});
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
$('ttBtn').addEventListener('click',()=>{const p=$('tt');clearTimeout(p._t);p.classList.remove('off');p.classList.add('on');p._t=setTimeout(()=>p.classList.remove('on'),1800)});
/* Escape puts it away while the button keeps the focus (WCAG 1.4.13); it
   comes back the next time you point at it or focus it */
$('tt').addEventListener('keydown',e=>{if(e.key==='Escape'){const p=$('tt');if(!p.classList.contains('off')){e.preventDefault();e.stopPropagation()}clearTimeout(p._t);p.classList.remove('on');p.classList.add('off')}});
['focusout','pointerenter'].forEach(t=>$('tt').addEventListener(t,()=>$('tt').classList.remove('off')));

/* ================= blocks ================= */
/* Say hi goes where the person is: the portfolio, in a new tab */
$('sayHi').addEventListener('click',()=>{
  const a=document.createElement('a');a.href='https://fedekotek.design';a.target='_blank';a.rel='noopener';
  document.body.appendChild(a);a.click();a.remove();A.say('Opening fedekotek.design in a new tab.');
});
(function(){
  /* each card's one line is its data-say, which the kit's pick reads too */
  const st=$('caseStatus');
  document.querySelectorAll('#cases [data-case]').forEach(c=>{
    c.setAttribute('aria-pressed','false');
    /* the status line is a screen away on a phone, so the card shows it was
       picked and the toast says what it is */
    const go=()=>{st.textContent=c.dataset.say;document.querySelectorAll('#cases [data-case]').forEach(x=>x.setAttribute('aria-pressed',x===c?'true':'false'));A.say(c.dataset.say);A.kick();ping(520);const l=lcdOf(c.querySelector('canvas'));if(l){l.sect.forEach(s=>{s.swap=4;s.shift=rnd(9)-4});l.draw()}};
    c.addEventListener('click',go);c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
  });
})();
(function(){const r=$('nowRead'),v=+r.dataset.value,m=+r.dataset.max;r.innerHTML=A.colorize(A.barRow(Math.round(v/m*14),false,14))+' <span class="muted">'+v+'/'+m+'</span>'})();
if(!reduce)every(140,()=>{$('nowPull').textContent='|/-\\'[Date.now()/140&3]+' loading'},{gate:()=>A.G.on&&$('nowPull')&&inView($('nowPull'))});else $('nowPull').textContent='loading';
(function(){
  const ING=[['Tira de asado',400,'g'],['Vacío',220,'g'],['Chorizo',1,'u'],['Provoleta',0.34,'u'],['Coarse salt',12,'g'],['Charcoal',700,'g'],['Malbec',0.25,'l']];let n=6;
  const fmt=(q,u)=>u==='g'?(q>=1000?(q/1000).toFixed(1).replace(/\.0$/,'')+' kg':Math.round(q/10)*10+' g'):(u==='l'?(Math.round(q*10)/10)+' l':Math.max(1,Math.ceil(q))+'');
  function draw(){$('srvN').textContent=n;$('ing').innerHTML=ING.map(i=>'<li><span>'+i[0]+'</span><span class="qty">'+fmt(i[1]*n,i[2])+'</span></li>').join('');$('srvDown').disabled=n<=1;$('srvUp').disabled=n>=20}
  $('srvDown').addEventListener('click',()=>{n=Math.max(1,n-1);draw();ping(330)});
  $('srvUp').addEventListener('click',()=>{n=Math.min(20,n+1);draw();ping(520)});draw();
  /* the Code tab (js/40) prints the list for the kit's stepper, as it is at 6 */
  A.recipe={ing:ING,serves:n,fmt:fmt};
})();
(function(){
  const S=[['Life',2840,4000,0],['Shield',1120,4000,0],['Evasion',61,100,1],['Crit',38,100,1],['DPS',412,900,2]];
  /* the Code tab (js/40) prints the stats as they are before any reroll */
  A.build=S.map(s=>s.slice());
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
if(!reduce)every(260,()=>{const p=$('lostTitle');if(!p._iv&&p._b)A.titleFrame(p,6+rnd(6))},{gate:()=>A.glitch()>0&&$('lostTitle')&&inView($('lostTitle'))});

/* ================= shadcn-style docs: index, preview and code tabs, filters ================= */
/* a button the engine has touched keeps its real label in data-text and got
   an aria-label to match while the label scrambles: the label goes back to
   the words and the extra aria-label goes (js/40 runs this on its dialogs) */
function cleanLabels(c){
  c.querySelectorAll('.btn[data-text]').forEach(b=>{
    const t=b.getAttribute('data-text'),l=b.querySelector('.label');
    if(l&&l.textContent!==t)l.textContent=t;   /* caught mid-scramble; a clean label keeps its markup */
    if(b.getAttribute('aria-label')===t)b.removeAttribute('aria-label');
  });
  return c;
}
A.cleanLabels=cleanLabels;
function cleanHTML(node,sec){
  const c=cleanLabels(node.cloneNode(true));
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
    /* a row of a table body is one line, as a row of data reads: 24 rows are 24 lines, not 200 */
    const row=n.tagName==='TR'&&n.parentElement&&n.parentElement.tagName==='TBODY';
    const breakIt=!row&&BLOCKTAG.test(n.tagName)&&n.children.length&&!hasText(n)&&(hasBlock(n)||n.outerHTML.length>100);
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
  /* components get a third tab, Usage (js/90). It goes last so Code keeps its
     place: the order people learned, and the scripts that open the second tab */
  const use=!!sec.closest('#view-kit');
  wrap.innerHTML='<div class="tablist doc-tabs" role="tablist" aria-label="'+esc(sec.querySelector('h2').textContent)+' views">'+
    '<button class="tab" role="tab" type="button" id="'+id+'t1" aria-controls="'+id+'p1" aria-selected="true">Preview</button>'+
    '<button class="tab" role="tab" type="button" id="'+id+'t2" aria-controls="'+id+'p2" aria-selected="false" tabindex="-1">Code</button>'+
    (use?'<button class="tab" role="tab" type="button" id="'+id+'t3" aria-controls="'+id+'p3" aria-selected="false" tabindex="-1">Usage</button>':'')+'</div>'+
    '<div class="doc-panel" role="tabpanel" id="'+id+'p1" aria-labelledby="'+id+'t1"></div>'+
    '<div class="doc-panel" role="tabpanel" id="'+id+'p2" aria-labelledby="'+id+'t2" hidden><pre class="code" tabindex="0" aria-label="Source code"></pre><div class="row copyrow"></div><p class="muted status page-out" role="status"></p></div>'+
    (use?'<div class="doc-panel" role="tabpanel" id="'+id+'p3" aria-labelledby="'+id+'t3" hidden></div>':'');
  /* the demo as the html has it, before any glitch, scramble or click: the
     Code tab is built from this copy, never from the live preview, so a
     label caught mid-scramble or a slider you moved does not get printed */
  const snap=document.createElement('div');demo.forEach(n=>snap.appendChild(n.cloneNode(true)));
  sec.insertBefore(wrap,demo[0]);const p1=wrap.children[1],p2=wrap.children[2],p3=wrap.children[3]||null;demo.forEach(n=>p1.appendChild(n));
  /* the kit html of this component, for the Usage tab and qa/reference.py */
  sec._kitHTML=()=>pretty(cleanHTML(snap,sec));
  /* only the doc's own two tabs: the Tabs demo, now inside p1, has its own */
  const tabs=[...wrap.firstChild.querySelectorAll('[role="tab"]')];let last=null;
  /* The Code tab prints what works next to the two kit files: the html with
     the kit's data attributes, then the css blocks it uses and the behavior
     that runs it, both from the kit (js/40). Each part is its own span, so
     Copy can select it when the clipboard is blocked. */
  function build(){
    const html=pretty(cleanHTML(snap,sec)),ex=A.codeExtra?A.codeExtra(sec,html):{css:'',js:''},pre=p2.querySelector('pre');
    /* built every time Code opens, from the snapshot; the same text is not redrawn */
    const key=(ex.note||'')+'\u0000'+html+'\u0000'+ex.css+'\u0000'+ex.js;if(key===last)return;last=key;
    p2.querySelector('.copyrow').textContent='';
    /* the whole page: this html between the two pinned kit links, ready to open (js/40).
       When there is none, the note says why, at its end: site only is said once */
    const pg=A.pageOf?A.pageOf(sec,html,ex):null,why=pg&&!pg.text?pg.why:'';
    const words=[ex.note||'',why].filter(Boolean).join(' ');
    /* what the kit does not cover goes first, above the html */
    let note=p2.querySelector('[data-part="note"]');
    if(words&&!note){note=document.createElement('p');note.className='muted';note.setAttribute('data-part','note');p2.insertBefore(note,pre)}
    if(note){note.textContent=words;note.hidden=!words}
    pre.innerHTML='<b class="h4">html</b><span data-part="html">'+hl(html)+'</span>'+
      (ex.css?'\n<b class="h4">css</b><span data-part="css">'+esc(ex.css)+'</span>\n':'')+
      '\n<b class="h4">js</b><span data-part="js">'+esc(ex.js)+'</span>\n';
    /* Copy HTML is the one most people want, so it is the heavy button, as
       Copy tokens is in Themes. Open page is the quiet text button at the end */
    const row=p2.querySelector('.copyrow'),out=p2.querySelector('.page-out'),btn=(label,fn,attr,cls)=>{
      const b=document.createElement('button');b.type='button';
      if(cls==='link'){b.className='linkbtn';b.textContent=label}
      else{b.className='btn frame '+(cls||'tone-light');b.innerHTML='<span class="mid"><span class="label">'+label+'</span></span>'}
      if(attr)b.setAttribute(attr,'');b.addEventListener('click',fn);row.appendChild(b);
    },mk=(label,txt,part,cls)=>btn(label,()=>{if(A.copy)A.copy(txt,'the '+part.toUpperCase(),pre.querySelector('[data-part="'+part+'"]'),out)},null,cls);
    mk('Copy HTML',html,'html','btn-primary tone-heavy');if(ex.css)mk('Copy CSS',ex.css,'css');
    /* the status line says nothing until a button is pressed */
    out.textContent='';out.classList.remove('err');
    if(pg&&pg.text){btn('Download page',()=>A.savePage(pg,out,false),'data-page');btn('Open page',()=>A.savePage(pg,out,true),'data-open','link')}
  }
  const panels=[p1,p2,p3].filter(Boolean);
  function pick(t,focus){
    tabs.forEach(x=>{const on=x===t;x.setAttribute('aria-selected',on?'true':'false');x.tabIndex=on?0:-1});
    const k=tabs.indexOf(t);panels.forEach((p,i)=>{p.hidden=i!==k});
    /* The section keeps its column when Code or Usage opens. Widening it to
       the whole row reshuffled the gallery under your cursor; long lines
       scroll sideways inside the code box instead. */
    if(k===1)build();
    if(k===2&&A.usage)A.usage(sec,p3);
    if(k>0&&A.glitch()>0&&!reduce)B.tear(1);
    if(live())sfx.tab();if(focus)t.focus();
  }
  /* the arrows walk the tabs and wrap, Home and End go to the ends, as the Tabs component does */
  tabs.forEach((t,i)=>{t.addEventListener('click',()=>pick(t));t.addEventListener('keydown',e=>{
    const n=tabs.length,to=e.key==='ArrowRight'?tabs[(i+1)%n]:e.key==='ArrowLeft'?tabs[(i+n-1)%n]:e.key==='Home'?tabs[0]:e.key==='End'?tabs[n-1]:null;
    if(to){e.preventDefault();pick(to,true)}
  })});
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
/* skip: sections that stay out of the index and open the view (Rules,
   Foundations; Get the kit goes ahead of them from js/40). They get no
   Preview and Code tabs. The header links to them, and the sidebar lists
   them first as Getting started, in the same order as the page.
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
  /* the skipped ones (Rules, Foundations) open the view, ahead of the index:
     the sidebar lists them first, so the page does too */
  secs.forEach(s=>panel.appendChild(s));tail.forEach(s=>panel.insertBefore(s,secs[0]||null));
  /* Tabs too: its demo is a tablist of its own, and docify only wires the doc's */
  secs.forEach(docify);
  /* a grouped view says where each group starts, on the page as in the sidebar */
  if(group)secs.forEach((s,i)=>{
    if(i&&secs[i-1].dataset.group===s.dataset.group)return;
    const h=document.createElement('p');h.className='grouph';h.setAttribute('aria-hidden','true');h.dataset.g=s.dataset.group;
    h.textContent=s.dataset.group;
    panel.insertBefore(h,s);
  });
  const toc=document.createElement('section');toc.setAttribute('aria-label',label+' index');
  /* under 1024px the [=] menu is the index now, so this starts closed; from
     1024px the sidebar is, and css hides it */
  toc.innerHTML='<details class="acc toc"><summary>'+label+', '+secs.length+'</summary><div class="chips"></div></details>';
  const chips=toc.querySelector('.chips');
  secs.forEach(s=>{const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.sec=id(s);b.textContent=name(s);b.addEventListener('click',()=>{if(A.jump)A.jump(s);else s.scrollIntoView({block:'start'});ping(440)});s._chip=b;chips.appendChild(b)});
  /* after the intro and anything else that is not a section of its own (the
     Blocks filters), right before the first card */
  /* before the first group label, so a label always sits on its own group */
  panel.insertBefore(toc,panel.querySelector(':scope > .grouph')||panel.querySelector(':scope > section[aria-labelledby]'));
  return secs;
}
spanSections($('view-charts'));
/* the charts get Preview and Code too: Code prints the kit's chart, which
   reads a table (js/40, KITIFY). No index and no groups, five is few */
$('view-charts').querySelectorAll(':scope > section[aria-labelledby]').forEach(docify);
/* the thirty-six on the page, by what they do, the way a docs site groups them.
   34 of them are in the kit; Command and Picture are site only */
const KIT_GROUPS=[
  ['Form',['s-button','s-calendar','s-input','s-otp','s-select','s-slider','s-textarea','s-toggles','s-togglegroup']],
  ['Overlay',['s-alertdialog','s-combobox','s-command','s-contextmenu','s-dropdown','s-popover','s-sheet','s-tooltip']],
  ['Display',['s-avatar','s-badge','s-card','s-datatable','s-details','s-icon','s-kbd','s-picture','s-separator','s-timeline']],
  ['Feedback',['s-alert','s-empty','s-progress','s-skeleton','s-spinner','s-toast']],
  ['Navigation',['s-breadcrumb','s-pagination','s-tabs']]];
buildView($('view-kit'),'Components',['s-rules','s-foundations'],[],id=>{
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
/* Preview shown again after Code: the pictures in it size themselves to the
   width they have now. Watched rather than timed, so it works with reduced
   motion too, where no loop runs */
if('MutationObserver' in window){
  const shown=new MutationObserver(ms=>ms.forEach(m=>{
    if(m.target.hidden)return;
    LCDS.forEach(l=>{if(m.target.contains(l.cv)&&l.cv.clientWidth&&l.cv.clientWidth!==l.w)l.size()});
  }));
  document.querySelectorAll('.doc-panel').forEach(p=>shown.observe(p,{attributes:true,attributeFilter:['hidden']}));
}
markWide();window.AUI_WIDE=markWide;
window.addEventListener('resize',markWide);
setTimeout(markWide,1200);

/* ================= data table =================
   The site's own wiring, with the page's sounds and its own pager. The kit
   does the same job for people's pages (kit/ascii-ui.js, datatable); this
   copy runs after the docs builder, so the Code tab's snapshot is the html
   as written: no checkboxes, no order, no skeleton. The Rows, Loading and
   Empty picker above it is this demo's, and the Code tab leaves it out. */
(function(){
  const el=$('dt');if(!el)return;
  const table=el.querySelector('table'),body=table.tBodies[0],head=table.tHead.rows[0],wrap=table.parentElement;
  const count=el.querySelector('.dt-count'),input=$('dtFilter'),pg=$('dtPager'),pst=$('dtPagerStatus');
  const NUM=/^[-+]?[$€£¥]?\s?\d[\d,]*(\.\d+)?\s?([a-z]{1,3}|%)?$/i,DATE=/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$/;
  const SIZE=+el.getAttribute('data-page-size')||8;
  /* the table glitches in as one piece. A badge on page 3 gets no entrance of
     its own: replayed on a view switch while its row is hidden, the entrance
     never ends and the badge stays invisible */
  body.querySelectorAll('[data-rv]').forEach(e=>{e.removeAttribute('data-rv');e.classList.remove('in','done')});
  let rows=[],shown=[],col=-1,dir='none',q='',page=1,anchor=null,shift=false,blank=null,skels=[],wave=null,wf=0,parked=null;
  const busy=()=>el.getAttribute('aria-busy')==='true';
  const words=c=>c?(c.hasAttribute('data-value')?c.getAttribute('data-value'):c.textContent).replace(/\s+/g,' ').trim():'';
  const data=r=>[...r.cells].filter(c=>!c.classList.contains('dt-pick'));
  function box(label){
    const l=document.createElement('label');l.className='check';
    l.innerHTML='<input type="checkbox"><span class="glyph" aria-hidden="true"></span>';
    l.firstChild.setAttribute('aria-label',label);return l;
  }
  const th=document.createElement('th');th.scope='col';th.className='dt-pick';th.appendChild(box('Select all rows'));
  const all=th.querySelector('input');head.insertBefore(th,head.firstChild);
  const cols=[...head.cells].filter(c=>c.querySelector('.dt-sort')).map(c=>({th:c,btn:c.querySelector('.dt-sort')}));
  function read(){
    rows=[...body.rows].filter(r=>r!==blank&&!skels.includes(r));
    rows.forEach((r,i)=>{
      if(r.__dtI==null)r.__dtI=i;
      if(!r.__dtBox){const td=document.createElement('td');td.className='dt-pick';td.appendChild(box('Select '+words(data(r)[0])));r.insertBefore(td,r.firstChild);r.__dtBox=td.querySelector('input')}
      r.__dtText=data(r).map(c=>c.textContent).join(' ').replace(/\s+/g,' ').toLowerCase();
    });
  }
  function kind(i){
    const c=cols.find(x=>x.th.cellIndex===i),k=c&&c.th.getAttribute('data-sort');
    if(k==='num'||k==='date'||k==='text')return k;
    const vs=rows.map(r=>words(r.cells[i])).filter(Boolean);
    if(!vs.length)return 'text';
    return vs.every(v=>NUM.test(v))?'num':vs.every(v=>DATE.test(v))?'date':'text';
  }
  function key(v,k){
    if(v==='')return null;
    if(k==='num'){const n=parseFloat(v.replace(/[^\d.\-]/g,''));return isNaN(n)?null:n}
    if(k==='date'){const d=Date.parse(v.replace(' ','T'));return isNaN(d)?null:d}
    return v;
  }
  function order(){
    const k=col<0?'':kind(col),list=rows.map(r=>({r,v:col<0?null:key(words(r.cells[col]),k)}));
    list.sort((a,b)=>{
      if(col>=0){
        if(a.v===null&&b.v!==null)return 1;
        if(b.v===null&&a.v!==null)return -1;
        if(a.v!==null){const c=k==='text'?String(a.v).localeCompare(String(b.v),undefined,{numeric:true,sensitivity:'base'}):a.v-b.v;if(c)return dir==='descending'?-c:c}
      }
      return a.r.__dtI-b.r.__dtI;
    });
    rows=list.map(x=>x.r);rows.forEach(r=>body.appendChild(r));
  }
  const hit=r=>q.toLowerCase().split(/\s+/).filter(Boolean).every(x=>r.__dtText.includes(x));
  const picked=()=>rows.filter(r=>r.__dtBox.checked);
  function row(cls){const r=document.createElement('tr'),td=document.createElement('td');r.className=cls;td.colSpan=head.cells.length;r.appendChild(td);return r}
  function drawSkel(){
    const n=Math.max(8,Math.floor(table.clientWidth/(A.CH()||9.6))-2),W='.:=+*#',L=[0.9,0.6,0.8,0.5,0.7];wf++;
    skels.forEach((r,i)=>{let s='';const len=Math.round(n*L[i%L.length]);for(let x=0;x<len;x++)s+=W.charAt(Math.floor((Math.sin((x-wf+i*3)*0.35)+1)*2.99));r.firstChild.textContent=A.TR(s)});
  }
  function loading(on){
    if(on&&!skels.length){
      for(let i=0;i<SIZE;i++){const r=row('dt-skel');r.setAttribute('aria-hidden','true');skels.push(r);body.appendChild(r)}
      drawSkel();if(!reduce)wave=every(120,drawSkel,{el:table});
    }
    if(!on&&skels.length){skels.forEach(r=>r.remove());skels=[];if(wave){wave.stop();wave=null}}
  }
  function tell(){const s=picked().length;count.textContent=busy()?'Loading rows.':shown.length+' of '+rows.length+' row'+(rows.length===1?'':'s')+(s?', '+s+' selected':'')+'.'}
  function heads(){
    const n=shown.filter(r=>r.__dtBox.checked).length;
    all.checked=!!n&&n===shown.length;all.indeterminate=!!n&&n<shown.length;const mx=all.closest('.check');if(mx)mx.classList.toggle('dt-mixed',all.indeterminate);
    rows.forEach(r=>r.classList.toggle('dt-on',r.__dtBox.checked));
  }
  /* the Pagination component's pager, drawn here for this table */
  function drawPager(pages){
    const side=pg.clientWidth&&pg.clientWidth<374?0:1,ps=[1];
    for(let p=page-side;p<=page+side;p++)if(p>1&&p<pages)ps.push(p);
    if(pages>1)ps.push(pages);
    const item=(p,t,l,off,now)=>'<button class="ibtn" type="button" data-p="'+p+'"'+(off?' disabled':'')+(now?' aria-current="page"':'')+' aria-label="'+l+'">'+t+'</button>';
    let h=item(page-1,'&lt;','Previous page',page===1),last=0;
    ps.forEach(p=>{if(p-last>1)h+='<span class="muted" aria-hidden="true">..</span>';h+=item(p,p,'Page '+p,false,p===page);last=p});
    pg.innerHTML=h+item(page+1,'&gt;','Next page',page===pages);
    pst.textContent=busy()||!rows.length?'':'Page '+page+' of '+pages+'.';
  }
  function show(){
    const b=busy();shown=rows.filter(hit);
    const pages=Math.max(1,Math.ceil(shown.length/SIZE));page=clamp(page,1,pages);
    const from=(page-1)*SIZE,to=from+SIZE;
    rows.forEach(r=>{r.hidden=true});shown.forEach((r,i)=>{r.hidden=b||i<from||i>=to});
    loading(b);
    const msg=b?'':!rows.length?'No incidents yet. Quiet week.':!shown.length?'No rows match.':'';
    if(msg){if(!blank)blank=row('dt-empty');blank.firstChild.colSpan=head.cells.length;blank.firstChild.textContent=msg;body.appendChild(blank)}
    else if(blank)blank.remove();
    pg.hidden=b||!rows.length;drawPager(pages);
    heads();tell();
    wrap.toggleAttribute('data-wide',wrap.scrollWidth>wrap.clientWidth+2);
  }
  function sortBy(i,d){
    col=d==='ascending'||d==='descending'?i:-1;dir=col<0?'none':d;
    cols.forEach(c=>c.th.setAttribute('aria-sort',c.th.cellIndex===col?dir:'none'));
    order();show();
  }
  cols.forEach(c=>c.btn.addEventListener('click',()=>{
    const i=c.th.cellIndex,d=col!==i?'ascending':dir==='ascending'?'descending':'none';
    sortBy(i,d);ping(d==='ascending'?660:d==='descending'?440:330);if(A.glitch()>0&&!reduce)B.tear(1);
  }));
  input.addEventListener('input',()=>{q=input.value;page=1;show()});
  pg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;page=+b.dataset.p;show();ping(300+page*60);const c=pg.querySelector('[aria-current]');if(c)c.focus()});
  table.addEventListener('pointerdown',e=>{shift=e.shiftKey});
  table.addEventListener('keydown',e=>{if(e.key===' ')shift=e.shiftKey});
  table.addEventListener('click',e=>{
    const i=e.target;if(i.type!=='checkbox'||!i.closest('.dt-pick'))return;
    const sh=e.shiftKey||shift;shift=false;
    if(i===all){shown.forEach(r=>{r.__dtBox.checked=all.checked});anchor=null}
    else{
      const r=i.closest('tr'),a=shown.indexOf(anchor),b=shown.indexOf(r);
      if(sh&&a>=0&&b>=0)for(let k=Math.min(a,b);k<=Math.max(a,b);k++)shown[k].__dtBox.checked=i.checked;
      anchor=r;
    }
    heads();tell();ping(i.checked?520:390);
  });
  /* the demo's own picker: the rows, the wait, or nothing at all */
  document.querySelectorAll('input[name="dtstate"]').forEach(r=>r.addEventListener('change',()=>{
    if(!r.checked)return;
    if(parked&&r.value!=='none'){parked.forEach(x=>body.appendChild(x));parked=null}
    if(r.value==='none'&&!parked){parked=[...rows];parked.forEach(x=>x.remove())}
    if(r.value==='loading')el.setAttribute('aria-busy','true');else el.removeAttribute('aria-busy');
    read();order();show();A.kick();
  }));
  read();cols.forEach(c=>c.th.setAttribute('aria-sort','none'));show();
  window.addEventListener('resize',()=>{if(!pg.hidden)drawPager(Math.max(1,Math.ceil(shown.length/SIZE)))});
})();

/* ================= overlays: popover, combobox, context menu, alert dialog =================
   The site's own wiring for the four, with the page's sounds. The kit does
   the same job for people's pages (kit/ascii-ui.js: popover, combobox,
   contextmenu, confirm and the alert dialog in openDialog); this copy runs
   after the docs builder, so the Code tab's snapshot is the html as written. */
(function(){
  const TOP=!!(window.HTMLElement&&HTMLElement.prototype.hasOwnProperty('popover'));
  let seq=0;const uid=(el,p)=>el.id||(el.id='ov-'+p+'-'+(++seq));
  const settle=box=>box.querySelectorAll('[data-rv]').forEach(e=>e.classList.add('in','done'));
  const TABBABLE='a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  /* where Tab lands first: [autofocus], the first control, the checked radio of a group */
  function firstStop(box){
    const a=box.querySelector('[autofocus]');if(a&&a.getClientRects().length)return a;
    let e=[...box.querySelectorAll(TABBABLE)].find(x=>x.getClientRects().length);
    if(e&&e.type==='radio'&&e.name){const c=[...box.querySelectorAll('input[type="radio"]')].find(x=>x.name===e.name&&x.checked);if(c)e=c}
    if(!e){box.tabIndex=-1;e=box}
    return e;
  }
  /* a panel next to what opened it: in the top layer where there is one, on
     the grid, below its anchor or above when there is no room, and moved in
     whole characters to stay inside the window */
  function float(panel){
    let side='down';
    if(TOP){panel.hidden=false;panel.setAttribute('popover','manual')}
    const F={
      get isOpen(){return TOP?panel.matches(':popover-open'):!panel.hidden},
      show(){if(F.isOpen)return;if(TOP)panel.showPopover();else panel.hidden=false;panel.classList.add('open');settle(panel);side='down'},
      hide(){if(!F.isOpen)return;panel.classList.remove('open','up');if(TOP)panel.hidePopover();else panel.hidden=true},
      place(a,point,keep){
        const cw=A.CH()||9.6,de=document.documentElement,vw=de.clientWidth,vh=de.clientHeight;
        panel.style.left='0px';panel.style.top='0px';
        const o=panel.getBoundingClientRect(),w=o.width,h=o.height;let x=a.left,y=a.bottom;
        const below=vh-a.bottom,above=a.top,s=keep&&side==='up'&&above>=h?'up':(below>=h||below>=above)?'down':'up';
        if(s==='up')y=a.top-h;
        if(x+w>vw-cw){if(point&&a.left-w>=cw)x=a.left-w;else x-=Math.ceil((x+w-(vw-cw))/cw)*cw}
        if(x<cw)x+=Math.ceil((cw-x)/cw)*cw;
        side=s;panel.classList.toggle('up',s==='up');
        panel.style.left=Math.round(x-o.left)+'px';panel.style.top=Math.round(y-o.top)+'px';
      }
    };
    return F;
  }
  const err=(field,inp,out,msg)=>{field.classList.toggle('invalid',!!msg);inp.setAttribute('aria-invalid',msg?'true':'false');out.textContent=msg||''};

  /* ---- popover: a button and a small panel, not modal ---- */
  function popover(pop,onClose){
    const btn=pop.querySelector(':scope > [aria-haspopup]'),pane=pop.querySelector(':scope > .pane'),f=float(pane),t=pane.querySelector('.bar-title');
    btn.setAttribute('aria-controls',uid(pane,'pane'));pane.setAttribute('role','dialog');if(t)pane.setAttribute('aria-labelledby',uid(t,'title'));
    /* under 480px the pane hangs from the column's left edge, not the
       button's: pushed in from the right, it left the section beside it
       peeking out on its left, like a broken column */
    const at=()=>{
      const r=btn.getBoundingClientRect();
      if(window.innerWidth>=480){pane.style.width='';return r}
      /* and as wide as the column, so nothing of the page shows beside it */
      const c=(pop.closest('section')||pop.parentNode).getBoundingClientRect(),cw=A.CH()||9.6;
      pane.style.width=Math.floor(c.width/cw)*cw+'px';
      return {left:c.left,right:c.left,top:r.top,bottom:r.bottom};
    };
    function set(on,o){
      o=o||{};if(on===f.isOpen)return;
      if(on){f.show();f.place(at());if(o.focus)firstStop(pane).focus();if(live())sfx.open()}
      else{f.hide();if(o.back)btn.focus()}
      btn.setAttribute('aria-expanded',on?'true':'false');
    }
    btn.addEventListener('click',()=>set(!f.isOpen,{focus:true}));
    pop.addEventListener('keydown',e=>{if(e.key==='Escape'&&f.isOpen&&!e.defaultPrevented){e.preventDefault();set(false,{back:true})}});
    document.addEventListener('pointerdown',e=>{if(f.isOpen&&!pop.contains(e.target))set(false)});
    pop.addEventListener('focusout',e=>{if(f.isOpen&&e.relatedTarget&&!pop.contains(e.relatedTarget))set(false)});
    pane.addEventListener('click',e=>{const c=e.target.closest('[data-close]');if(!c||c.disabled)return;set(false,{back:true});if(onClose)onClose(c.getAttribute('data-close'))});
    pane.addEventListener('submit',e=>{e.preventDefault();set(false,{back:true});if(onClose)onClose('submit')});
    const where=()=>{if(f.isOpen)f.place(at(),false,true)};
    window.addEventListener('resize',where);document.addEventListener('scroll',e=>{if(!(e.target.nodeType===1&&pane.contains(e.target)))where()},true);
  }
  popover($('popSnooze'),v=>{if(v!=='snooze')return;const r=$('popSnooze').querySelector('input:checked');A.say('Snoozed for '+r.parentNode.textContent.trim().toLowerCase()+'. It will be back.');ping(660)});
  const rn=$('renameIn'),rnField=rn.closest('.field'),rnOut=$('renameErr');
  rn.addEventListener('invalid',e=>{e.preventDefault();err(rnField,rn,rnOut,'Enter a name for the probe.');rn.focus();A.jolt();if(live())sfx.err()});
  rn.addEventListener('input',()=>{if(rn.value.trim())err(rnField,rn,rnOut,'')});
  popover($('popRename'),v=>{if(v!=='submit')return;A.say('Renamed to '+rn.value.trim()+'.');if(live())sfx.ok()});

  /* ---- combobox: type and the list narrows ---- */
  (function(){
    const box=$('combo'),inp=$('comboIn'),field=inp.closest('.field'),pane=box.querySelector(':scope > .pane'),list=pane.querySelector('[role="listbox"]'),out=$('comboErr'),st=$('comboStatus'),f=float(pane);
    const opts=()=>[...list.querySelectorAll('[role="option"]')],off=o=>o.getAttribute('aria-disabled')==='true';
    const text=o=>o.textContent.replace(/\s+/g,' ').trim(),fold=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''),WORD=/[^\p{L}\p{N}]+/u;
    let act=null,sel=null,typed=false,tellT=0;
    const none=document.createElement('p');none.className='opts-none';none.hidden=true;list.after(none);
    const tell=document.createElement('span');tell.className='vh';tell.setAttribute('aria-live','polite');box.appendChild(tell);
    inp.setAttribute('aria-controls',uid(list,'list'));list.setAttribute('aria-labelledby',uid(document.querySelector('label[for="comboIn"]'),'label'));
    opts().forEach((o,i)=>{uid(o,'opt');o._i=i});
    /* -1 no match; else the word the first typed word starts, so fra puts Frankfurt before San Francisco */
    function rank(o,q){
      const ws=fold(text(o)).split(WORD).filter(Boolean),ts=fold(q).split(WORD).filter(Boolean);
      if(!ts.length)return 0;
      if(!ts.every(t=>ws.some(w=>w.startsWith(t))))return -1;
      const i=ws.findIndex(w=>w.startsWith(ts[0]));return i<0?ws.length:i;
    }
    function draw(q){
      const os=opts(),rs=new Map();let n=0;
      os.forEach(o=>{const r=rank(o,q);rs.set(o,r);o.hidden=r<0;if(r>=0)n++});
      const want=os.slice().sort((a,b)=>{let x=rs.get(a),y=rs.get(b);x=x<0?1e9:x;y=y<0?1e9:y;return x-y||a._i-b._i});
      if(want.some((o,i)=>o!==os[i]))want.forEach(o=>list.appendChild(o));
      none.textContent=box.dataset.empty;none.hidden=n>0;
      return {n,first:want.find(o=>!o.hidden&&!off(o))||null};
    }
    function into(o){const t=o.offsetTop,h=o.offsetHeight,s=list.scrollTop,c=list.clientHeight;if(t<s)list.scrollTop=t;else if(t+h>s+c)list.scrollTop=t+h-c}
    function mark(o,scroll){
      if(act)act.removeAttribute('data-active');act=o||null;
      if(act){act.setAttribute('data-active','');inp.setAttribute('aria-activedescendant',act.id);if(scroll!==false)into(act)}
      else inp.removeAttribute('aria-activedescendant');
    }
    /* the list hangs from the field; opened above, it clears the label too */
    function anchor(){
      const r=field.getBoundingClientRect(),a={left:r.left,right:r.right,top:r.top,bottom:r.bottom},l=document.querySelector('label[for="comboIn"]').getBoundingClientRect();
      if(l.height&&l.bottom<=r.top+1&&r.top-l.bottom<A.ROW)a.top=l.top;
      return a;
    }
    function show(q){
      const fresh=!f.isOpen,r=draw(q);
      if(fresh){f.show();inp.setAttribute('aria-expanded','true');if(live())sfx.open()}
      pane.style.width=Math.round(field.getBoundingClientRect().width+2*(A.CH()||9.6))+'px';
      f.place(anchor(),false,!fresh);
      return r;
    }
    function hide(){if(!f.isOpen)return;f.hide();inp.setAttribute('aria-expanded','false');mark(null)}
    function pick(o){
      sel=o||null;typed=false;
      opts().forEach(x=>{if(x===sel)x.setAttribute('aria-selected','true');else x.removeAttribute('aria-selected')});
      inp.value=sel?text(sel):'';err(field,inp,out,'');
      st.textContent=sel?'Picked '+text(sel)+'.':'Nothing picked.';
      if(sel)ping(660);
    }
    /* leaving the field: the words are an option, or nothing, or it says so */
    function commit(){
      const t=inp.value.replace(/\s+/g,' ').trim();
      if(sel&&t===text(sel)){typed=false;return}
      if(!t){if(sel)pick(null);typed=false;return}
      const ex=opts().find(o=>!off(o)&&fold(text(o))===fold(t));
      if(ex){pick(ex);return}
      if(sel){inp.value=text(sel);typed=false;return}
      err(field,inp,out,box.dataset.errorList);if(live())sfx.err();
    }
    const vis=()=>opts().filter(o=>!o.hidden&&!off(o));
    inp.addEventListener('input',()=>{
      typed=true;err(field,inp,out,'');
      const q=inp.value.trim(),r=show(q);mark(q?r.first:null);
      clearTimeout(tellT);tellT=setTimeout(()=>{tell.textContent=r.n?(r.n===1?'1 match.':r.n+' matches.'):none.textContent},500);
    });
    inp.addEventListener('keydown',e=>{
      if(e.isComposing)return;
      const k=e.key;let v=vis();const i=v.indexOf(act);
      if(k==='ArrowDown'||k==='ArrowUp'){
        e.preventDefault();
        if(!f.isOpen){show(typed?inp.value.trim():'');v=vis();const at=sel&&!sel.hidden&&!off(sel)?sel:null;mark(e.altKey?at:(at||(k==='ArrowDown'?v[0]:v[v.length-1])));return}
        if(v.length){mark(k==='ArrowDown'?v[(i+1)%v.length]:v[i<0?v.length-1:(i-1+v.length)%v.length]);if(live())sfx.tick()}
      }
      else if((k==='PageDown'||k==='PageUp')&&f.isOpen&&v.length){e.preventDefault();mark(v[clamp((i<0?0:i)+(k==='PageDown'?5:-5),0,v.length-1)])}
      else if(k==='Enter'){if(f.isOpen){e.preventDefault();const a=act;hide();if(a)pick(a);else commit()}else commit()}
      else if(k==='Escape'&&f.isOpen){e.preventDefault();e.stopPropagation();hide();if(sel){inp.value=text(sel);typed=false;err(field,inp,out,'')}}
      else if(k==='Tab')hide();
    });
    /* the whole frame opens the list, the v closes it again */
    field.addEventListener('mousedown',e=>{if(e.target!==inp)e.preventDefault()});
    field.addEventListener('click',e=>{
      if(f.isOpen&&e.target.closest('.prompt')){hide();return}
      if(!f.isOpen){show(typed?inp.value.trim():'');mark(sel&&!sel.hidden?sel:null)}
      if(document.activeElement!==inp)inp.focus();
    });
    pane.addEventListener('mousedown',e=>e.preventDefault());
    list.addEventListener('pointermove',e=>{const o=e.target.closest('[role="option"]');if(o&&o!==act&&!off(o))mark(o,false)});
    list.addEventListener('click',e=>{const o=e.target.closest('[role="option"]');if(!o||off(o))return;hide();pick(o);if(document.activeElement!==inp)inp.focus()});
    inp.addEventListener('blur',()=>{hide();commit()});
    window.addEventListener('resize',()=>{if(f.isOpen)f.place(anchor(),false,true)});
    document.addEventListener('scroll',e=>{if(f.isOpen&&!(e.target.nodeType===1&&pane.contains(e.target)))f.place(anchor(),false,true)},true);
  })();

  /* ---- context menu: right-click, a long press or Shift F10 on a row ---- */
  (function(){
    const box=$('ctx'),menu=box.querySelector(':scope > [role="menu"]'),st=$('ctxStatus'),f=float(menu);
    let target=null,from=null,quiet=0,eat=0,lp=null;
    const items=()=>[...menu.querySelectorAll('[role="menuitem"]')].filter(x=>!x.disabled&&x.getAttribute('aria-disabled')!=='true');
    const words=it=>{const c=it.cloneNode(true);c.querySelectorAll('kbd').forEach(k=>k.remove());return c.textContent.replace(/\s+/g,' ').trim()};
    menu.querySelectorAll('[role="menuitem"]').forEach(it=>{const k=it.querySelector('kbd');if(!k)return;k.setAttribute('aria-hidden','true');it.setAttribute('aria-keyshortcuts',k.textContent.trim())});
    const on=el=>{const t=el&&el.closest?el.closest('tr,li,[tabindex],a,button'):null;return t&&t!==box&&box.contains(t)&&!menu.contains(t)?t:box};
    const name=t=>{if(!t||t===box)return '';const c=t.cells&&t.cells[0];return (c?c.textContent:t.textContent).replace(/\s+/g,' ').trim()};
    function openAt(x,y,t){
      if(!f.isOpen)from=document.activeElement;
      if(target&&target!==t)target.removeAttribute('data-ctx');
      target=t;if(t!==box)t.setAttribute('data-ctx','');
      f.show();
      const cw=A.CH()||9.6,rh=A.ROW,o=box.getBoundingClientRect(),snap=(v,o0,u,up)=>o0+(up?Math.ceil:Math.floor)((v-o0)/u)*u;
      if(x===null){const r=t.getBoundingClientRect(),kx=snap(r.left+2*cw,o.left,cw);f.place({left:kx,right:kx,top:r.top,bottom:r.bottom},false)}
      else{const px=snap(x,o.left,cw);f.place({left:px,right:px,top:snap(y,o.top,rh),bottom:snap(y,o.top,rh,true)},true)}
      items()[0].focus();if(live())sfx.open();
    }
    function close(back){
      if(!f.isOpen)return;f.hide();
      if(target)target.removeAttribute('data-ctx');
      if(back){const b=from&&from!==document.body&&from.isConnected&&!menu.contains(from)?from:(target&&target!==box&&target.matches(TABBABLE)?target:null);if(b)b.focus()}
      from=null;
    }
    /* a finger opens it under its row, like the keyboard does: where the
       finger was, the menu would cover the row it belongs to */
    let touch=false;
    box.addEventListener('contextmenu',e=>{
      if(menu.contains(e.target)||Date.now()<quiet){e.preventDefault();return}
      if(e.shiftKey||e.target.closest('input,textarea,select,a[href]'))return;
      e.preventDefault();const t=on(e.target),kb=(!e.clientX&&!e.clientY)||((touch||e.pointerType==='touch')&&t!==box);openAt(kb?null:e.clientX,kb?null:e.clientY,t);
    });
    box.addEventListener('keydown',e=>{
      if(menu.contains(e.target))return;
      if(e.key==='ContextMenu'||(e.key==='F10'&&e.shiftKey)){e.preventDefault();quiet=Date.now()+400;openAt(null,null,on(e.target))}
    });
    /* touch: press and hold half a second, without moving */
    box.addEventListener('pointerdown',e=>{
      touch=e.pointerType==='touch';
      if(!touch||!e.isPrimary||menu.contains(e.target))return;
      if(lp)clearTimeout(lp.id);
      const x=e.clientX,y=e.clientY,t=on(e.target),row=t!==box;
      lp={x,y,id:setTimeout(()=>{lp=null;openAt(row?null:x,row?null:y,t);quiet=eat=Date.now()+800},500)};
    });
    const drop=e=>{if(!lp)return;if(e.type==='pointermove'&&Math.abs(e.clientX-lp.x)<10&&Math.abs(e.clientY-lp.y)<10)return;clearTimeout(lp.id);lp=null};
    ['pointerup','pointercancel','pointermove'].forEach(t=>box.addEventListener(t,drop));
    /* the finger that held it lifts: that click is not a pick */
    document.addEventListener('pointerdown',e=>{eat=0;if(e.pointerType!=='touch')quiet=0;if(f.isOpen&&!menu.contains(e.target))close(false)},true);
    box.addEventListener('click',e=>{if(Date.now()<eat){e.preventDefault();e.stopPropagation();eat=0}},true);
    /* and the mouse events a browser makes up after it would move the focus out of the menu */
    box.addEventListener('touchend',e=>{if(Date.now()<eat&&e.cancelable)e.preventDefault()},{passive:false});
    menu.addEventListener('keydown',e=>{
      const it=items(),i=it.indexOf(document.activeElement),k=e.key;let n=null;
      if(k==='ArrowDown')n=it[(i+1)%it.length];
      else if(k==='ArrowUp')n=it[(i-1+it.length)%it.length];
      else if(k==='Home')n=it[0];
      else if(k==='End')n=it[it.length-1];
      else if(k==='Escape'||k==='Tab'){e.preventDefault();close(true);return}
      else if(k.length===1&&k!==' '&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
        const l=k.toLowerCase(),hit=it.find(x=>{const b=x.querySelector('kbd');return b&&b.textContent.trim().toLowerCase()===l});
        if(hit){e.preventDefault();hit.click();return}
        for(let j=1;j<=it.length&&!n;j++){const c=it[(i+j+it.length)%it.length];if(words(c).toLowerCase().startsWith(l))n=c}
      }
      if(n){e.preventDefault();n.focus();if(live())sfx.tick()}
    });
    menu.addEventListener('click',e=>{
      const it=e.target.closest('[role="menuitem"]');if(!it||it.disabled)return;
      const w=words(it),nm=name(target);close(true);target=null;
      st.textContent=w+(nm?': '+nm:'')+'.';
      if(it.classList.contains('danger')){A.say(nm+' deleted. It is gone.',true);A.jolt();if(live())sfx.err()}else ping(520);
    });
    menu.addEventListener('focusout',e=>{if(f.isOpen&&e.relatedTarget&&!menu.contains(e.relatedTarget))close(false)});
    document.addEventListener('scroll',e=>{drop(e);if(f.isOpen&&!(e.target.nodeType===1&&menu.contains(e.target)))close(false)},true);
    window.addEventListener('resize',()=>close(false));
  })();

  /* ---- alert dialog: asks before something you cannot undo ---- */
  function alertDialog(btn,d,done){
    let down=false;
    btn.addEventListener('click',()=>{if(d.open||!d.showModal)return;d.returnValue='';d.showModal();settle(d);if(live())sfx.open()});
    d.addEventListener('pointerdown',e=>{down=e.target===d});
    /* a tap around it is not an answer: it nudges, and the focus goes back to the safe choice */
    d.addEventListener('click',e=>{
      if(down&&e.target===d){
        const safe=d.querySelector('[autofocus]')||d.querySelector('[data-close]:not(.btn-danger)');if(safe&&!safe.disabled)safe.focus();
        if(live())sfx.err();
        if(!reduce){clearTimeout(d._nudge);d.classList.remove('nudge');void d.offsetWidth;d.classList.add('nudge');d._nudge=setTimeout(()=>d.classList.remove('nudge'),320)}
      }
      down=false;
      const c=e.target.closest('[data-close]');if(c&&!c.disabled)d.close(c.getAttribute('data-close')||'');
    });
    d.addEventListener('close',()=>{if(btn.isConnected)btn.focus();if(d.returnValue)done()});
  }
  const gone=(msg)=>()=>{A.say(msg,true);A.jolt();if(live())sfx.err()};
  alertDialog($('adOpen'),$('adDlg'),gone('Deleted. It is gone.'));
  alertDialog($('adOpen2'),$('adDlg2'),gone('Workspace deleted. Nothing to watch now.'));
  /* the typed kind: Delete stays off until the name is exactly right */
  const ai=$('adIn'),aiField=ai.closest('.field'),aiOut=$('adErr'),want=ai.dataset.match,aiDel=$('adDlg2').querySelector('.btn-danger');
  const aiCheck=()=>{const ok=ai.value.trim()===want;aiDel.disabled=!ok;return ok};
  /* wrong words get said: on Enter, on a pause once they cannot become the
     name any more (static-prd, not static-pr), and on leaving the field */
  let aiT=null;
  const aiWrong=all=>{const v=ai.value.trim();return !!v&&v!==want&&(all||want.indexOf(v)!==0)};
  const aiSay=()=>err(aiField,ai,aiOut,'Type '+want+' exactly.');
  ai.addEventListener('input',()=>{err(aiField,ai,aiOut,'');aiCheck();clearTimeout(aiT);aiT=setTimeout(()=>{if(aiWrong(false))aiSay()},900)});
  /* not when the way out is a button in the dialog: the line would push Cancel down mid-press */
  let aiBtn=false;
  $('adDlg2').addEventListener('pointerdown',e=>{aiBtn=!!e.target.closest('button')},true);
  ai.addEventListener('blur',e=>{clearTimeout(aiT);const b=aiBtn||!!(e.relatedTarget&&e.relatedTarget.closest&&e.relatedTarget.closest('#adDlg2 button'));aiBtn=false;if(!b&&$('adDlg2').open&&aiWrong(true))aiSay()});
  ai.addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();clearTimeout(aiT);if(aiCheck())aiDel.click();else{aiSay();A.jolt();if(live())sfx.err()}});
  $('adOpen2').addEventListener('click',()=>{clearTimeout(aiT);ai.value='';err(aiField,ai,aiOut,'');aiCheck()},true);
})();

/* ================= icons: the browser in the Icon section =================
   The drawings are css (css/25, the same table as the kit's icon block). This
   is the list: name, the label a copy gets, and the other words people type.
   qa/kit.py fails when it and the css disagree. Type to narrow, a tap or
   Enter copies the markup; where the clipboard says no (file://) the markup
   line is selected and the status line says so (A.copy, js/40). */
(function(){
  const grid=$('iconGrid');if(!grid)return;
  const ICONS=[
  ['search','Search','find magnifier look'],
  ['close','Close','x dismiss cancel'],
  ['menu','Menu','hamburger nav list'],
  ['plus','Add','new create add'],
  ['minus','Remove','subtract collapse less'],
  ['check','Done','ok tick yes success confirm'],
  ['warning','Warning','alert caution hazard'],
  ['error','Error','fail problem stop'],
  ['info','Information','about details note'],
  ['help','Help','question support faq'],
  ['arrow-up','Up','top raise'],
  ['arrow-down','Down','bottom lower'],
  ['arrow-left','Back','previous left'],
  ['arrow-right','Next','forward right go'],
  ['chevron-up','Collapse','caret up'],
  ['chevron-down','Expand','caret down open'],
  ['chevron-left','Previous','caret left'],
  ['chevron-right','Next','caret right'],
  ['external','Opens in a new tab','link out new window'],
  ['copy','Copy','duplicate clipboard'],
  ['download','Download','save export get'],
  ['upload','Upload','import send attach'],
  ['edit','Edit','pencil write change rename'],
  ['delete','Delete','trash bin remove'],
  ['settings','Settings','gear cog preferences options'],
  ['user','Account','person profile avatar people'],
  ['home','Home','house start'],
  ['bell','Notifications','alert notify ring'],
  ['lock','Locked','private secure closed password'],
  ['unlock','Unlocked','open public'],
  ['eye','Show','view visible see password'],
  ['eye-off','Hide','hidden invisible password'],
  ['calendar','Date','day month schedule'],
  ['clock','Time','hour history recent'],
  ['filter','Filter','funnel narrow'],
  ['sort','Sort','order asc desc'],
  ['refresh','Refresh','reload sync again retry'],
  ['more','More','ellipsis overflow dots actions'],
  ['star','Favorite','favourite rate bookmark']];
  A.ICONS=ICONS;
  const q=$('iconQ'),count=$('iconCount'),none=$('iconNone'),out=$('iconOut'),st=$('iconStatus');
  const markup=(n,l)=>'<span class="icon" data-icon="'+n+'" role="img" aria-label="'+l+'"></span>';
  let picked=null;
  const tiles=ICONS.map(([n,l,w])=>{
    const li=document.createElement('div');li.setAttribute('role','listitem');
    const b=document.createElement('button');b.type='button';b.className='icon-tile';b.dataset.icon=n;
    b.setAttribute('aria-label','Copy '+n);
    b.innerHTML='<span class="icon icon-lg" data-icon="'+n+'" aria-hidden="true"></span><span class="ln"><span class="icon" data-icon="'+n+'" aria-hidden="true"></span> <span class="nm">'+n+'</span></span>';
    b.addEventListener('click',()=>take(b,n,l));
    li.appendChild(b);grid.appendChild(li);
    return {li,b,n,l,hay:(n+' '+n.replace('-',' ')+' '+l+' '+w).toLowerCase()};
  });
  function take(b,n,l){
    const m=markup(n,l);out.textContent=m;
    if(picked)picked.classList.remove('picked');picked=b;b.classList.add('picked');
    if(A.copy)A.copy(m,'the '+n+' icon',out,st);
    ping(660);
  }
  function narrow(){
    const v=q.value.trim().toLowerCase(),words=v.split(/\s+/).filter(Boolean);
    let n=0;
    tiles.forEach(t=>{const on=words.every(x=>t.hay.includes(x));t.li.hidden=!on;if(on)n++});
    count.textContent=!v?ICONS.length+' icons.':n===1?'1 icon matches.':n+' icons match.';
    none.hidden=n>0;
    if(!n)none.textContent='No icon called "'+q.value.trim()+'". Try arrow, lock or eye.';
    return tiles.filter(t=>!t.li.hidden);
  }
  q.addEventListener('input',narrow);
  /* Enter copies the first one that matches, so type, Enter, paste */
  q.addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();const f=narrow()[0];if(f)take(f.b,f.n,f.l);else if(live())sfx.err()});
  narrow();
})();
})();
