(function(){
'use strict';
const A=window.AUI,B=window.AUI2,$=A.$,rnd=A.rnd,rep=A.rep,RAMP=A.RAMP,reduce=A.reduce,sfx=A.sfx,every=A.every,times=A.times;
const {esc,clamp,inView}=B;
const live=()=>A.live();
const ping=(f,d)=>{if(live())A.tone('square',f,0,d||0.05,0.4)};

/* the [=] menu lives in js/70-nav.js with the rest of the navigation */

/* ================= chirp ================= */
function bump(span,delta){
  const to=+span.textContent.replace(/,/g,'')+delta;let f=0;
  times(40,5,()=>{span.textContent=RAMP[3+rnd(6)]+RAMP[3+rnd(6)]},()=>{span.textContent=to.toLocaleString('en-US')});
}
$('chirpFeed').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.classList.contains('like')||b.classList.contains('rt')){
    const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on?'true':'false');bump(b.querySelector('span'),on?1:-1);
    if(on){if(live())sfx.on();A.kick()}else ping(330);
  }else A.say('Replies are not wired. It is a prototype.');
});
function post(){
  const inp=$('chirpIn'),t=inp.value.trim();if(!t){A.jolt();if(live())sfx.err();inp.focus();return}
  const art=document.createElement('article');art.className='post';
  art.innerHTML='<div class="who"><span class="avatar sm hot" aria-hidden="true">FK</span><b>fede</b><span>@fede · now</span></div><p></p><div class="acts"><button type="button" class="like" aria-pressed="false" aria-label="Like">@ <span>0</span></button><button type="button" class="rt" aria-pressed="false" aria-label="Repost">&lt;&gt; <span>0</span></button><button type="button" aria-label="Reply">:: 0</button></div>';
  art.querySelector('p').textContent=t;$('chirpFeed').prepend(art);inp.value='';A.decode(art);A.kick();if(live())sfx.ok();
}
$('chirpPost').addEventListener('click',post);
$('chirpIn').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();post()}});
$('chirpBell').addEventListener('click',()=>A.say('3 new likes, 1 repost, 0 sleep.'));
document.querySelector('#view-apps .tabbar').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.currentTarget.querySelectorAll('button').forEach(x=>x===b?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current'));ping(520);if(b.textContent!=='Home')A.say(b.textContent+' is a tab in a prototype.')});

/* ================= tape ================= */
(function(){
  const T=[['Bad Signal',222],['Halftone Heart',245],['Tearing Up',178],['Datamosh Waltz',311],['Boot Sequence',107]];
  const SCALE=[0,3,5,7,10,12,15,17],ROOT=[110,98,123,87,131];
  let i=0,pos=0,playing=false,beat=0,vis=false;
  const playBtn=$('tapePlay'),bar=$('tapeBar'),vu=$('tapeVu');
  const fmt=s=>Math.floor(s/60)+':'+('0'+Math.floor(s%60)).slice(-2);
  function load(k){i=(k+T.length)%T.length;pos=0;$('tapeTitle').textContent=T[i][0];$('tapeList').querySelectorAll('button').forEach((b,j)=>j===i?b.setAttribute('aria-current','true'):b.removeAttribute('aria-current'));draw();A.kick()}
  function draw(){
    const p=pos/T[i][1];bar.querySelector('.bar').innerHTML=A.colorize(A.barRow(Math.round(p*24),playing&&!reduce,24));bar.querySelector('.pct').textContent=' '+fmt(T[i][1]);
    bar.setAttribute('aria-valuenow',Math.round(p*100));$('tapeTime').textContent=fmt(pos);
    let v='';for(let r=0;r<2;r++){for(let c=0;c<24;c++){const lv=playing?Math.sin(beat*0.9+c*0.6+r)*0.5+0.5+Math.random()*0.3:0;v+=RAMP[clamp(Math.round(lv*7),0,8)]}v+='\n'}vu.textContent=A.TR(v);
  }
  function step(){
    if(!playing)return;pos+=0.25;beat++;
    if(live()&&beat%2===0){const n=SCALE[(beat/2+Math.floor(beat/16))%8],f=ROOT[i]*Math.pow(2,n/12)*(beat%8===0?0.5:1);A.tone(beat%4===0?'square':'triangle',f,0,0.12,0.35)}
    if(live()&&beat%4===0)A.noise(0.05,0.25,3000,6000);
    if(pos>=T[i][1]){load(i+1)}draw();
  }
  function toggle(on){playing=on;playBtn.textContent=on?'||':'>';playBtn.setAttribute('aria-label',on?'Pause':'Play');playBtn.setAttribute('aria-pressed',on?'true':'false');if(on&&live())sfx.on();draw()}
  playBtn.addEventListener('click',()=>toggle(!playing));
  $('tapePrev').addEventListener('click',()=>load(pos>5?i:i-1));
  $('tapeNext').addEventListener('click',()=>load(i+1));
  $('tapeList').addEventListener('click',e=>{const b=e.target.closest('button');if(b){load(+b.dataset.i);toggle(true)}});
  bar.addEventListener('pointerdown',e=>{const r=bar.getBoundingClientRect();pos=T[i][1]*clamp((e.clientX-r.left)/(r.width*0.8),0,1);draw()});
  if('IntersectionObserver' in window)new IntersectionObserver(en=>{vis=en[0].isIntersecting}).observe(bar);else vis=true;
  every(250,step);
  draw();
})();

/* ================= chat ================= */
(function(){
  const th=$('thread'),inp=$('chatIn'),tp=$('typing');
  const R=['Try turning the glitch down to zero and back up. It resets the signal.','That one is on us. INC-482 opened, you will hear back before your coffee.','Can you send a screenshot? Any sector will do.','Everything is @ because it is Monday. It gets to # by Wednesday.','I have escalated this to a human. The human is also a bot.','Have you tried scrolling faster? It tears, but it also clears.'];
  const now=()=>{const d=new Date();return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)};
  function add(txt,me){const li=document.createElement('li');if(me)li.className='me';li.innerHTML='<div class="bubble"></div>';const b=li.firstChild;b.textContent=txt+' ';const m=document.createElement('span');m.className='meta';m.textContent=(me?'':'Static · ')+now();b.appendChild(m);th.appendChild(li);if(!me)A.decode(b);li.scrollIntoView({block:'nearest'})}
  let typ=null;
  function send(){
    const t=inp.value.trim();if(!t){A.jolt();if(live())sfx.err();return}add(t,true);inp.value='';ping(660);
    let f=0;if(typ)typ.stop();typ=every(120,()=>{tp.textContent='Static is typing '+RAMP[2+(f++%6)]+RAMP[2+((f+2)%6)]+RAMP[2+((f+4)%6)];if(live()&&f%3===0)sfx.tick()});
    setTimeout(()=>{typ.stop();tp.textContent='';add(R[rnd(R.length)],false);A.kick();if(live())sfx.blip()},900+rnd(900));
  }
  $('chatSend').addEventListener('click',send);inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send()}});
})();
})();
