(function(){
  var root=document.documentElement, main=document.getElementById('main');
  /* one row of the grid, in px. css/01-tokens.css owns it (--r), everything here counts in it */
  var ROW=parseFloat(getComputedStyle(root).getPropertyValue('--r'))||21;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RAMP=' .:=+*#%@';
  function $(id){return document.getElementById(id)}
  function rep(c,n){return n>0?new Array(n+1).join(c):''}
  function TR(s){var M=window.AUI_MAP;if(!M)return s;var o='',i,c;for(i=0;i<s.length;i++){c=s.charAt(i);o+=M[c]||c}return o}
  /* rawFill is the untouched fillText, for text that is already in the active
     ramp (the shattered pieces are harvested off the page) */
  var rawFill=null;
  (function(){
    var P=window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype;if(!P)return;var ft=P.fillText;rawFill=ft;
    P.fillText=function(t,x,y,w){if(window.AUI_MAP)t=TR(String(t));return w===undefined?ft.call(this,t,x,y):ft.call(this,t,x,y,w)};
  })();
  var CANON='.:=+*#%@',rampNow=CANON;
  function setRamp(str){
    /* by code point, so an emoji is one character and not two halves */
    var C=Array.from(str),M={},i,same=true;for(i=0;i<8;i++){M[CANON.charAt(i)]=C[i];if(C[i]!==CANON.charAt(i))same=false}
    window.AUI_MAP=same?null:M;rampNow=C.slice(0,8).join('');window.AUI_TONES();
  }

  /* ---- clock: one requestAnimationFrame loop drives every repeating animation ----
     every(ms,fn,opt) repeats until you stop it, times(ms,n,fn) runs n frames and stops
     itself. Both return a handle with .stop(). A task is skipped while the tab is
     hidden, while the clock is paused, or while its gate returns false. Missed frames
     are dropped, never queued, so nothing stampedes after a pause. Options:
       gate:fn    run only when this returns true
       el:node    run only while the node is on screen (combines with gate)
       times:n    stop after n runs
       end:fn     called when the count runs out (not when you stop it)
       delay:ms   wait this long instead of one cadence before the first run
       sleep:ms   how long a gated-off task waits before it asks again (1000).
                  Infinity when whatever opens the gate calls wake(): then
                  it costs nothing at all until then
     The loop sleeps until the next task is due, and a task whose gate says no
     looks again in a second. handle.wake() runs it at the next frame.  */
  var CK={tasks:[],raf:0,timer:0,due:0,paused:false};
  /* on screen: laid out (a hidden view measures zero) and inside the viewport */
  function onScreen(el){
    if(!el)return false;
    var r=el.getBoundingClientRect();
    return r.width>0&&r.bottom>0&&r.top<(window.innerHeight||document.documentElement.clientHeight);
  }
  function clockFrame(now){
    CK.raf=0;
    var list=CK.tasks,off=CK.paused||document.hidden,swept=false,i,t;
    try{
      for(i=0;i<list.length;i++){
        t=list[i];
        if(t.dead){swept=true;continue}
        if(off){t.at=now+t.ms;continue}
        if(now<t.at)continue;
        t.at=now+t.ms;
        /* gated off: look again in a second, not every cadence */
        /* snapped to a half second, so the sleepers wake together, once, not each on its own frame */
        if(t.gate&&!t.gate()){t.at=t.sleep===Infinity?Infinity:Math.ceil((now+Math.max(t.ms,t.sleep))/500)*500;continue}
        t.n++;
        /* a task that throws loses its place, not the whole loop; the error is
           rethrown out of band so it still reaches the console and QA */
        try{t.fn(t.n)}catch(e){t.dead=true;swept=true;setTimeout(function(){throw e},0);continue}
        if(t.left&&--t.left<=0){t.dead=true;swept=true;if(t.end)t.end()}
      }
    }finally{
      if(swept)CK.tasks=CK.tasks.filter(function(x){return !x.dead});
      if(CK.tasks.length&&!CK.paused)clockStart();
    }
  }
  /* sleep until the next task is due, then ask for one frame: a page whose
     fastest task runs every 125ms wakes 8 times a second, not 60 */
  function clockStart(){
    if(CK.raf||CK.paused||!CK.tasks.length)return;
    var now=window.performance?performance.now():Date.now(),next=Infinity,i,t;
    for(i=0;i<CK.tasks.length;i++){t=CK.tasks[i];if(!t.dead&&t.at<next)next=t.at}
    if(next===Infinity)return;   /* everything asleep until a wake() */
    if(CK.timer){if(next>=CK.due)return;clearTimeout(CK.timer);CK.timer=0}
    var wait=next-now-8;
    if(wait>12){CK.due=next;CK.timer=setTimeout(function(){CK.timer=0;CK.raf=requestAnimationFrame(clockFrame)},wait)}
    else CK.raf=requestAnimationFrame(clockFrame);
  }
  function every(ms,fn,opt){
    opt=opt||{};
    var gate=opt.gate||null,el=opt.el||null;
    var t={ms:Math.max(8,ms),fn:fn,n:0,left:opt.times||0,end:opt.end||null,dead:false,sleep:opt.sleep||1000,
      gate:el?function(){return onScreen(el)&&(!gate||gate())}:gate};
    t.at=(window.performance?performance.now():Date.now())+(opt.delay===undefined?t.ms:opt.delay);
    t.stop=function(){t.dead=true};
    t.running=function(){return !t.dead};
    /* run at the next frame (or in ms), for a gate that just opened: it would otherwise wait up to a second */
    t.wake=function(ms){if(!t.dead){t.at=(window.performance?performance.now():Date.now())+(ms||0);clockStart()}};
    CK.tasks.push(t);clockStart();
    return t;
  }
  function times(ms,n,fn,end){return every(ms,fn,{times:n,end:end})}
  var clock={
    every:every,times:times,onScreen:onScreen,
    pause:function(){CK.paused=true},
    resume:function(){CK.paused=false;clockStart()},
    paused:function(){return CK.paused},
    count:function(){return CK.tasks.length},
    /* what is armed and how often each ran, for QA and for looking */
    list:function(){return CK.tasks.map(function(t){return {ms:t.ms,runs:t.n,gated:!!t.gate}})}
  };
  document.addEventListener('visibilitychange',function(){if(!document.hidden)clockStart()});

  /* ---- sound: square waves and crushed noise, unlocked by the first touch ---- */
  /* reduced motion is quiet too: this is the one gate every sound passes, so
     nothing needs its own check, and the switch starts off */
  var AC=null,master=null,nbuf=null,SND={on:!reduce,last:0};
  function audio(){
    if(!SND.on||reduce)return null;
    if(!AC){
      var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
      AC=new C();master=AC.createGain();master.gain.value=0.07;master.connect(AC.destination);
      nbuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);
      var d=nbuf.getChannelData(0),i,h=0;
      for(i=0;i<d.length;i++){if(i%7===0)h=Math.random()*2-1;d[i]=h}
    }
    if(AC.state==='suspended'||SND.nap)AC.resume();
    SND.nap=false;napLater();
    return AC;
  }
  /* a running context costs CPU even when it is silent, so it naps 5s after
     the last sound (and when the tab is hidden). A nap still counts as live:
     the next sound wakes it. The switch turning it off is not a nap. */
  var napT=0;
  function nap(){napT=0;if(AC&&AC.state==='running'){SND.nap=true;AC.suspend()}}
  function napLater(){clearTimeout(napT);napT=setTimeout(nap,5000)}
  document.addEventListener('visibilitychange',function(){if(document.hidden){clearTimeout(napT);nap()}});
  function sndLive(){return SND.on&&AC&&(AC.state==='running'||SND.nap)}
  /* every sound is a little different, and a sound that repeats gets quieter and duller until it rests */
  var FAT={};
  function human(key,dur,vol){
    var n=Date.now(),f=FAT[key]||{c:0,t:0};
    if(n-f.t>2200)f.c=0;f.c++;f.t=n;FAT[key]=f;
    var k=Math.max(0.22,1-(f.c-1)*0.16);
    return {dur:dur*(0.85+Math.random()*0.35)*(f.c>3?0.7:1),vol:vol*k*(0.8+Math.random()*0.4),det:(Math.random()-0.5)*0.12+(f.c-1)*0.02,skip:f.c>5&&Math.random()<0.5};
  }
  function tone(type,f0,f1,dur,vol,when){
    var a=audio();if(!a)return;
    var h=human(type+Math.round(f0/40),dur,vol);if(h.skip)return;dur=h.dur;vol=h.vol;f0=f0*(1+h.det);if(f1)f1=f1*(1+h.det);
    var o=a.createOscillator(),g=a.createGain(),t0=a.currentTime+(when||0);
    o.type=type;o.frequency.setValueAtTime(f0,t0);
    if(f1)o.frequency.exponentialRampToValueAtTime(f1,t0+dur);
    g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    o.connect(g);g.connect(master);o.start(t0);o.stop(t0+dur+0.02);
  }
  function noise(dur,vol,f0,f1){
    var a=audio();if(!a)return;
    var h=human('n'+Math.round(f0/200),dur,vol);if(h.skip)return;dur=h.dur;vol=h.vol;f0=f0*(1+h.det*2);f1=f1*(1-h.det);
    var src=a.createBufferSource(),bp=a.createBiquadFilter(),g=a.createGain(),t0=a.currentTime;
    src.buffer=nbuf;src.loop=true;bp.type='bandpass';bp.Q.value=1.2;
    bp.frequency.setValueAtTime(f0,t0);bp.frequency.exponentialRampToValueAtTime(f1,t0+dur);
    g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    bp.Q.value=0.8+Math.random()*1.2;src.connect(bp);bp.connect(g);g.connect(master);src.start(t0,Math.random()*0.9);src.stop(t0+dur+0.02);
  }
  var sfx={
    tick:function(){var n=Date.now();if(!sndLive()||n-SND.last<34)return;SND.last=n;tone('square',1500+Math.random()*900,0,0.016,0.22)},
    blip:function(){tone('square',660,990,0.07,0.5)},
    tab:function(){tone('square',440,660,0.05,0.45)},
    on:function(){tone('square',520,0,0.05,0.45);tone('square',780,0,0.06,0.45,0.06)},
    off:function(){tone('square',780,0,0.05,0.45);tone('square',520,0,0.06,0.45,0.06)},
    ok:function(){[523,659,784,1047].forEach(function(f,i){tone('square',f,0,0.09,0.45,i*0.07)})},
    err:function(){tone('sawtooth',140,88,0.2,0.55)},
    burst:function(){var v=Math.floor(Math.random()*3);if(v===0){noise(0.24,0.9,700,3200);tone('sawtooth',92,40,0.22,0.4)}else if(v===1){noise(0.16,0.8,2600,500);tone('square',70,120,0.14,0.35)}else{noise(0.3,0.7,400,1800);tone('sawtooth',110,55,0.3,0.3,0.04)}},
    open:function(){noise(0.16,0.6,1200,400);tone('square',220,440,0.12,0.4)},
    wipe:function(){noise(0.75,0.6,260,5200)},
    dev:function(){noise(0.3,0.35,2400,900)},
    val:function(v){tone('square',260+v*9,0,0.03,0.3)}
  };
  function unlock(){audio()}
  /* iOS only lets a context start inside a gesture it trusts, and a
     pointerdown is not always one: the end of the touch and the click are */
  ['pointerdown','pointerup','touchend','click'].forEach(function(t){document.addEventListener(t,unlock,true)});
  var HAS_AUDIO=!!(window.AudioContext||window.webkitAudioContext);
  /* Some Android keyboards pop up for a focused range input, and a slider
     never needs one. Focus used to be dropped only on a pointerup on the
     slider itself, which missed two ways in: a drag ends in pointercancel
     rather than pointerup, and a tap on the slider's label focuses it with
     the finger on the label. So any slider that takes focus from a touch
     lets go of it as soon as the touch is over. A keyboard keeps its focus. */
  var touchAt=0,touchOn=null;
  document.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'){touchAt=Date.now();touchOn=e.target}},true);
  /* a key after the touch means a keyboard is driving now: it keeps its focus */
  document.addEventListener('keydown',function(){touchAt=0},true);
  function isRange(el){return el&&el.matches&&el.matches('input[type="range"]')}
  function letGo(){var el=document.activeElement;if(isRange(el)&&Date.now()-touchAt<5000)setTimeout(function(){el.blur()},0)}
  ['pointerup','pointercancel','touchend','touchcancel'].forEach(function(t){document.addEventListener(t,letGo,true)});
  document.addEventListener('change',function(e){if(isRange(e.target)&&Date.now()-touchAt<5000)letGo()},true);
  /* a vertical swipe that starts on a slider is a scroll: the browser moves
     the value, cancels the pointer, then commits it anyway. The value from
     touch-down comes back on the cancel, and the late commit gets it too */
  document.addEventListener('pointerdown',function(e){var el=e.target;if(e.pointerType!=='mouse'&&isRange(el)){el._v0=el.value;el._undo=0}},true);
  document.addEventListener('pointerup',function(e){if(isRange(e.target))e.target._v0=null},true);
  document.addEventListener('pointercancel',function(e){
    var el=e.target;if(!isRange(el)||el._v0==null)return;
    el._undo=Date.now();if(el.value!==el._v0){el.value=el._v0;el.dispatchEvent(new Event('change',{bubbles:true}))}
  },true);
  document.addEventListener('change',function(e){var el=e.target;if(isRange(el)&&el._undo&&Date.now()-el._undo<1000&&el.value!==el._v0)el.value=el._v0},true);
  document.addEventListener('focusin',function(e){
    /* focused from a label or anything that is not the slider: nothing to drag, let go now */
    if(isRange(e.target)&&Date.now()-touchAt<1000&&touchOn!==e.target)setTimeout(function(){e.target.blur()},0);
  },true);
  document.addEventListener('keydown',unlock,true);

  /* A tap, not a touch-down. A finger that starts a scroll on a chart or a
     picture used to change it on the way past. A mouse still acts on press;
     a finger or a pen acts when it lifts, if it moved under 10px and the
     browser did not take the gesture for a scroll (pointercancel). */
  function onTap(el,fn){
    var d=null;
    el.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'){d=null;if(!e.button)fn(e);return}
      d={x:e.clientX,y:e.clientY,id:e.pointerId};
    });
    el.addEventListener('pointermove',function(e){if(d&&e.pointerId===d.id&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>=10)d=null});
    el.addEventListener('pointercancel',function(){d=null});
    el.addEventListener('pointerup',function(e){
      if(!d||e.pointerId!==d.id)return;
      var ok=Math.hypot(e.clientX-d.x,e.clientY-d.y)<10;d=null;if(ok)fn(e);
    });
  }

  /* ---- 5x7 bitmap face, squared off ---- */
  var F={
    A:'#####|#...#|#...#|#####|#...#|#...#|#...#',
    B:'####.|#...#|#...#|####.|#...#|#...#|####.',
    C:'#####|#....|#....|#....|#....|#....|#####',
    D:'####.|#...#|#...#|#...#|#...#|#...#|####.',
    E:'#####|#....|#....|####.|#....|#....|#####',
    F:'#####|#....|#....|####.|#....|#....|#....',
    G:'#####|#....|#....|#.###|#...#|#...#|#####',
    H:'#...#|#...#|#...#|#####|#...#|#...#|#...#',
    I:'#####|..#..|..#..|..#..|..#..|..#..|#####',
    J:'..###|....#|....#|....#|....#|#...#|#####',
    K:'#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
    L:'#....|#....|#....|#....|#....|#....|#####',
    M:'#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
    N:'#...#|##..#|##..#|#.#.#|#..##|#..##|#...#',
    O:'#####|#...#|#...#|#...#|#...#|#...#|#####',
    P:'#####|#...#|#...#|#####|#....|#....|#....',
    Q:'#####|#...#|#...#|#...#|#.#.#|#..#.|###.#',
    R:'#####|#...#|#...#|####.|#.#..|#..#.|#...#',
    S:'#####|#....|#....|#####|....#|....#|#####',
    T:'#####|..#..|..#..|..#..|..#..|..#..|..#..',
    U:'#...#|#...#|#...#|#...#|#...#|#...#|#####',
    V:'#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
    W:'#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#',
    X:'#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
    Y:'#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
    Z:'#####|....#|...#.|..#..|.#...|#....|#####',
    '0':'#####|#...#|#..##|#.#.#|##..#|#...#|#####',
    '1':'..#..|.##..|..#..|..#..|..#..|..#..|#####',
    '2':'#####|....#|....#|#####|#....|#....|#####',
    '3':'#####|....#|....#|.####|....#|....#|#####',
    '4':'#...#|#...#|#...#|#####|....#|....#|....#',
    '5':'#####|#....|#....|#####|....#|....#|#####',
    '6':'#####|#....|#....|#####|#...#|#...#|#####',
    '7':'#####|....#|...#.|..#..|..#..|..#..|..#..',
    '8':'#####|#...#|#...#|#####|#...#|#...#|#####',
    '9':'#####|#...#|#...#|#####|....#|....#|#####',
    ' ':'.....|.....|.....|.....|.....|.....|.....',
    '!':'..#..|..#..|..#..|..#..|..#..|.....|..#..',
    '?':'#####|....#|...#.|..#..|..#..|.....|..#..',
    '.':'.....|.....|.....|.....|.....|.....|..#..',
    '-':'.....|.....|.....|#####|.....|.....|.....',
    '/':'....#|....#|...#.|..#..|.#...|#....|#....'
  };
  for(var g in F)F[g]=F[g].split('|');
  function bitmap(text,scale){         /* rows of 0/1 */
    var rows=[],y,x,i,sx,sy;
    for(y=0;y<7;y++){
      var line=[];
      for(i=0;i<text.length;i++){
        var gl=F[text.charAt(i)]||F[' '];
        for(x=0;x<5;x++)for(sx=0;sx<scale;sx++)line.push(gl[y].charAt(x)==='#'?1:0);
        if(i<text.length-1)for(sx=0;sx<scale;sx++)line.push(0);
      }
      for(sy=0;sy<scale;sy++)rows.push(line);
    }
    return rows;
  }

  /* ---- section titles: 2x2 characters per pixel, developed like a print ---- */
  var TIDX=[8,8,7,7,6,6,5];
  var titles=[].slice.call(document.querySelectorAll('.ptitle'));
  function titleFrame(pre,f){
    var b=pre._b,n=pre._n,html='',y,x,done=f>=99;
    for(y=0;y<b.length;y++){
      var row='';
      for(x=0;x<b[y].length;x++){
        if(!b[y][x]){row+=' ';continue}
        var lv=f-n[y][x];
        row+=TR(lv<=0?'.':RAMP.charAt(Math.min(TIDX[pre._scale===1?y:(y>>1)],1+lv)));
      }
      var dx=(!done&&Math.random()<0.4)?Math.round((Math.random()-0.5)*14):0;
      html+='<span class="tr c'+Math.min(3,pre._scale===1?(y>>1):(y>>2))+'" style="transform:translateX('+dx+'ch)">'+row+(pre._bars[y]||'')+'</span>';
    }
    pre.innerHTML=html;pre._painted=1;
  }
  function makeBars(cols){
    /* tbar is ink in dark and magenta on paper, see css/01. The bars are
       decoration, so no lime (confirms), no yellow (warns), no cyan (focus) */
    var rows=[],y,k,cs=['pink','violet','hot','deep','tbar'].sort(function(){return Math.random()-0.5});
    var seg=[];for(k=0;k<5;k++)seg.push([Math.floor(Math.random()*6),8+Math.floor(Math.random()*6)]);
    for(y=0;y<14;y++){
      var r='';
      if(cols+3+20<=94){
        r='   ';
        for(k=0;k<5;k++)r+=(y>=seg[k][0]&&y<=seg[k][1])?
          '<b style="background:var(--'+cs[k]+');color:var(--'+cs[k]+')">@@@@</b>':'    ';
      }
      rows.push(r);
    }
    return rows;
  }
  function develop(pre,quiet){
    if(reduce){titleFrame(pre,99);return}
    if(!quiet&&sndLive())sfx.dev();
    if(pre._iv)pre._iv.stop();
    pre._iv=times(45,15,function(f){titleFrame(pre,f)},function(){pre._iv=null;titleFrame(pre,99)});
  }
  function initTitle(pre,text,scale,nobars){
    scale=scale||2;var b=bitmap(text||' ',scale),n=[],y,x;
    for(y=0;y<b.length;y++){n.push([]);for(x=0;x<b[y].length;x++)n[y].push(Math.floor(Math.random()*6))}
    pre._b=b;pre._n=n;pre._scale=scale;pre._bars=makeBars((pre.hasAttribute('data-nobars')||nobars)?999:b[0].length);
    if(scale===1)pre._bars=pre._bars.map(function(){return ''});
  }
  /* a title is painted when it comes near the screen, not all of them at load:
     most sit in views that are not open, or are hidden by the docs layout */
  var nio='IntersectionObserver' in window?new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting)return;
      nio.unobserve(en.target);if(!en.target._painted)titleFrame(en.target,reduce?99:0);
    });
  },{rootMargin:'50% 0px'}):null;
  titles.forEach(function(pre){
    initTitle(pre,pre.getAttribute('data-text'));
    if(nio)nio.observe(pre);else titleFrame(pre,reduce?99:0);
    pre.addEventListener('click',function(){develop(pre)});
  });
  if(!reduce&&'IntersectionObserver' in window){
    var tio=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting)return;
        tio.unobserve(en.target);develop(en.target);
      });
    },{threshold:0.7});
    titles.forEach(function(pre){tio.observe(pre)});
  every(1500,fitTitles);
  }else if(!nio)titles.forEach(function(pre){titleFrame(pre,99)});

  /* ---- layout: snap the page to a whole number of columns ---- */
  var probe=$('probe'),hero=$('hero'),ctx=hero.getContext('2d');
  var FADEPX=0,HC=60,HR=58,mask=null,wbox=[],t=0,CH=9.6,CW=6,LH=7,FS=10,DPR=1,A=1.1,B=0.4,spinX=0,spinY=0,PAL=null;
  var G={on:!reduce,amt:0.5,burst:0,next:0,scroll:0};
  var HP={t1:'COPY IT',t2:'OWN IT',speed:1,rad:1,split:1,tear:1,streaks:12,blocks:3,map:0};
  var MAPS=[null,['deep','deep','violet','violet','pink','pink','ink'],['deep','violet','violet','hot','hot','pink','ink'],['muted','muted','muted','ink','ink','ink','ink']];
  function glitch(){return (G.on&&G.amt>0)?Math.min(1,G.amt+G.scroll*0.6):0}
  function currentTheme(){
    return root.getAttribute('data-theme')||
      (window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  }
  function readPalette(){
    var cs=getComputedStyle(root);PAL={};
    ['bg','ink','muted','hot','pink','cy','ok','warn','deep','violet'].forEach(function(k){
      PAL[k]=cs.getPropertyValue('--'+k).trim();
    });
  }
  function buildMask(){
    /* The two words used to sit at rows 2 and 42 of 58. The hero is not always
       58 rows now, so they sit at the same fractions of whatever it is, and
       they drop to one character per pixel when there are too few rows to hold
       two words at two. */
    /* The words start where the side fade (css/16-grid.css, --fade) ends, so
       the first letter is never half gone. A line that would not fit between
       the two fades at double size drops to single. */
    var fade=(parseFloat(getComputedStyle(hero).getPropertyValue('--fade'))||6)*CH;
    FADEPX=fade;
    var x0=Math.ceil(fade/CW)+1;
    /* from 1600px the hero is taller and the words go to double size as soon
       as two lines of it fit (35 rows), not at 44 */
    var half=HR<(wideHero()?36:44),sc=function(t){t=t||' ';return t.length>5||half||x0*2+t.length*12-2>HC?1:2};
    var m=[],y,x,l1=bitmap(HP.t1||' ',sc(HP.t1)),l2=bitmap(HP.t2||' ',sc(HP.t2));
    for(y=0;y<HR;y++){m.push([]);for(x=0;x<HC;x++)m[y].push(0)}
    wbox=[];
    function put(b,y0){for(var y=0;y<b.length;y++)for(var x=0;x<b[y].length;x++)
      if(b[y][x]&&m[y0+y]&&x0+x<HC)m[y0+y][x0+x]=1;
      /* the box around the word, one cell of air on every side: the torus and
         the colour bars stay out of it, so the letters read as letters */
      if(b.length)wbox.push([x0-1,y0-1,x0+b[0].length,y0+b.length])}
    /* the two lines read as one headline: the second follows the first. Only
       a narrow screen, where the ring sits between them, keeps them apart */
    var y1=Math.round(HR*0.034);
    put(l1,y1);
    put(l2,HC<70?Math.min(HR-l2.length,Math.round(HR*0.724)):Math.min(HR-l2.length,y1+l1.length+Math.ceil(l1.length*0.4)));
    mask=m;
  }
  function wideHero(){return window.innerWidth>=1600}
  function inWord(x,y){
    for(var i=0;i<wbox.length;i++){var w=wbox[i];if(x>=w[0]&&x<=w[2]&&y>=w[1]&&y<=w[3])return true}
    return false;
  }
  /* measured once per size: fitTitles asks every 1.5s, and each measure was
     four changes to the page. A resize or a font arriving measures again */
  var CWC={};
  function charWidth(fs){
    if(CWC[fs])return CWC[fs];
    probe.style.fontSize=fs+'px';probe.style.fontWeight='700';
    var w=probe.getBoundingClientRect().width/50;
    probe.style.fontSize='';probe.style.fontWeight='';
    if(w>0)CWC[fs]=w;
    return w;
  }
  window.addEventListener('resize',function(){CWC={}});
  if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',function(){CWC={}});
  function fit(cols,W,maxFs){
    var fs=Math.min(maxFs,W/(cols*0.55)),cw=charWidth(fs),n=0;
    while(cw*cols>W&&fs>3&&n++<80){fs-=0.2;cw=charWidth(fs)}
    return {fs:fs,cw:cw};
  }
  var FONT='"Geist Mono",ui-monospace,Menlo,Consolas,monospace';
  /* a title measures itself after painting and shrinks until it fits its own box, whatever the phone does to font sizes */
  function fitTitles(){
    if(!titles.length)return;
    var fs=parseFloat(titles[0].style.fontSize)||7,cw=charWidth(fs);if(!cw)return;
    titles.forEach(function(pre){
      if(!pre.isConnected||pre.closest('[hidden]'))return;
      var box=pre.clientWidth;if(!box)return;
      var cols=Math.floor(box/cw),text=pre.getAttribute('data-text')||' ',need2=text.length*12-2,nobars=pre.hasAttribute('data-nobars');
      var scale=2,bars=!nobars;
      if(need2+23>cols)bars=false;
      if(need2>cols)scale=1;
      if(pre._scale!==scale||(pre._bars&&pre._bars[0]!=='')!==(bars&&scale===2)){
        initTitle(pre,text,scale,!bars);
        if(pre._iv){pre._iv.stop();pre._iv=null}
        titleFrame(pre,pre.classList.contains('u')&&!pre.classList.contains('in')?0:99);
      }
      /* the box is as tall as the rows the title has: at single scale that is
         half, and a box sized for double left three empty rows under it */
      var lh=parseFloat(pre.style.lineHeight);
      if(lh&&pre._b)pre.style.height=(Math.ceil(pre._b.length*lh/ROW)*ROW)+'px';
    });
  }
  function layout(){
    var ch=probe.getBoundingClientRect().width/50;
    if(!ch)return;
    CH=ch;
    /* start from the full hero every time: a short window takes rows away
       below, and a taller one has to be able to give them back */
    HR=58;
    /* css/16-grid.css owns the cap, in characters, per breakpoint */
    var rcs=getComputedStyle(root),maxc=parseInt(rcs.getPropertyValue('--maxcols'),10)||80;
    /* a phone on its side has a notch on one edge and rounded corners on both:
       the column is centred, so it keeps the wider inset clear on each side
       (css/17 exposes them as --sal and --sar) */
    var ins=Math.max(parseFloat(rcs.getPropertyValue('--sal'))||0,parseFloat(rcs.getPropertyValue('--sar'))||0);
    var cols=Math.min(maxc,Math.floor((root.clientWidth-2*ins)/ch));
    main.style.width=(cols*ch)+'px';
    var bar=document.querySelector('.topbar-in');
    if(bar){
      bar.style.width=(cols*ch)+'px';
      /* big text (200%) made the bar wider than the screen: the words beside
         the glyphs go first, and if it still does not fit it wraps */
      var tb=bar.parentNode,vb=bar.querySelector('.viewsbar'),bc=vb&&vb.querySelector('.barctl');
      /* the settings sit flush right; past the bar's edge means it does not fit
         (the glyphs' bleed is inside the settings' box, so it does not count) */
      /* or it has already wrapped under the views (long words): that counts too,
         so the wrapped rows can give up the pixel of bleed they would share */
      var over=function(){var a=bc.getBoundingClientRect(),v=vb.getBoundingClientRect();return a.right>v.right+1||a.top>v.top+1};
      if(bc){
        tb.classList.remove('tight','wrap');
        if(over()){tb.classList.add('tight');if(over())tb.classList.add('wrap')}
      }
    }
    var inner=cols-4;
    root.style.setProperty('--dcols',Math.min(48,cols-2));
    var W=inner*ch;
    /* the hero costs HC*58 cells a frame, so it stops getting denser past 140 */
    HC=W<520?60:Math.min(140,Math.round(W/9));
    DPR=Math.min(window.devicePixelRatio||1,2);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.font='700 100px '+FONT;
    var r=ctx.measureText('M').width/100||0.6;
    CW=W/HC;FS=CW/r;LH=Math.round(CW*1.25);
    /* The hero used to be 58 rows whatever they measured, which came out at
       1296px, taller than any window: you could not tell there was a page under
       it. The canvas now takes what is left once the copy under it has had its
       share, so the hero ends four rows short of the fold and the first
       components show. It drops rows to fit rather than squashing them, and it
       never goes under ten rows however short the window is. */
    var Hpx=Math.ceil(HR*LH/ROW)*ROW,vh=window.innerHeight;
    var hd=document.querySelector('main > header');
    if(hd){
      var copy=hd.getBoundingClientRect().height-hero.getBoundingClientRect().height;
      var floor=Math.min(ROW*10,Math.round(vh*0.3/ROW)*ROW);
      /* and never more than 45% of the window, so the page under it shows
         whatever the copy costs */
      /* and a hard cap in rows: sixteen on a screen, twelve on a phone. The ring
         is the proof, not the page (Home, 2026) */
      var cap=ROW*(window.innerWidth<720?12:(wideHero()?22:16));
      var lid=Math.min(cap,Math.max(floor,Math.min(Math.round(vh*0.45/ROW)*ROW,Math.round((vh-ROW*8-copy)/ROW)*ROW)));
      if(Hpx>lid){Hpx=lid;HR=Math.max(20,Math.floor(Hpx/LH))}
    }
    hero.style.height=Hpx+'px';
    /* from 1600px the canvas reaches into the margin by its fade, so the
       headline starts on the paragraph's left edge instead of 7ch in */
    hero.style.marginLeft=wideHero()?(-(parseFloat(getComputedStyle(hero).getPropertyValue('--fade'))||6)*ch)+'px':'';
    hero.width=Math.round(W*DPR);hero.height=Math.round(Hpx*DPR);
    /* --ptitle caps how big a bitmap pixel in a poster title may get. It is a
       token so the size is a design decision, not a number buried in here. */
    var cap=parseFloat(getComputedStyle(root).getPropertyValue('--ptitle'))||7;
    var tt=fit(94,W,cap),tlh=Math.max(4,Math.round(tt.cw*1.3));
    titles.forEach(function(pre){
      pre.style.fontSize=tt.fs+'px';pre.style.lineHeight=tlh+'px';
      pre.style.height=(Math.ceil(14*tlh/ROW)*ROW)+'px';
    });
    fitTitles();
    /* the glow behind the hero is painted on body so it can reach the window
       edges, which means body has to be told how tall the header is */
    var hd=document.querySelector('main > header');
    if(hd)root.style.setProperty('--heroh',Math.round(hd.getBoundingClientRect().height)+'px');
    buildMask();seedScene();readPalette();drawHero();
    if(window.AUI&&AUI.onLayout)AUI.onLayout(W);
  }

  /* ---- hero: a torus on a bad signal. streaks, colour bars, RGB split, tearing ---- */
  var streaks=[],blocks=[],zb=null,lu=null;
  /* no cyan (focus), no lime (confirms), no yellow (warns): decoration stays in magenta, pink, violet, deep and ink */
  var BAR=['pink','violet','deep','ink','hot','violet'];
  /* the ring shades through violet and magenta, never blue: blue is focus */
  var TOR_D=['violet','violet','hot','hot','pink','pink','ink'];
  var TOR_L=['ink','ink','violet','violet','hot','hot','pink'];   /* one step more ink than dark: pale on paper otherwise */
  function rnd(n){return Math.floor(Math.random()*n)}
  function mkBlock(){
    var bars=Math.random()<0.4;
    return {x:Math.random()*HC,y:rnd(HR-4),w:bars?2*(4+rnd(4)):2+rnd(5),h:bars?3+rnd(3):1+rnd(3),
            v:(Math.random()-0.5)*0.5,bars:bars,c:['ink','deep','hot','violet','pink'][rnd(5)]};
  }
  function seedScene(){
    var i;streaks=[];blocks=[];
    for(i=0;i<HP.streaks;i++)streaks.push({y:rnd(HR),x:Math.random()*HC,len:2+rnd(14),
      v:(Math.random()<0.5?-1:1)*(0.15+Math.random()*0.9),
      c:Math.random()<0.72?'hot':(Math.random()<0.5?'pink':'violet'),
      a:0.25+Math.random()*0.75,ch:Math.random()<0.6?'-':'='});
    for(i=0;i<HP.blocks;i++)blocks.push(mkBlock());
  }
  function drawHero(){
    if(!mask||!PAL)return;
    var g=glitch(),burst=G.burst,n=HC*HR,i,x,y,k;
    var Wpx=HC*CW;
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,Wpx+2,HR*LH+48);
    ctx.font='700 '+FS+'px '+FONT;ctx.textBaseline='top';

    var shift=[];for(y=0;y<HR;y++)shift.push(0);
    if(burst>0){
      var bands=2+rnd(4);
      for(i=0;i<bands;i++){
        var y0=rnd(HR),hh=1+rnd(5),dx=Math.round((Math.random()-0.5)*18*burst*HP.tear);
        for(y=y0;y<Math.min(HR,y0+hh);y++)shift[y]=dx;
      }
    }

    /* streaks */
    for(i=0;i<streaks.length;i++){
      var s=streaks[i];
      s.x+=s.v*(1+burst*5);
      if(s.x>HC+2)s.x=-s.len;if(s.x<-s.len-2)s.x=HC;
      ctx.globalAlpha=s.a;ctx.fillStyle=PAL[s.c];
      for(k=0;k<s.len;k++){
        var sx=Math.floor(s.x)+k;
        if(sx>=0&&sx<HC)ctx.fillText(s.ch,(sx+shift[s.y])*CW,s.y*LH);
      }
    }
    /* The torus is sized by both dimensions and centred by fraction, so a
       shorter hero shows a smaller torus instead of half of one. It is measured
       here, before the blocks, because the blocks keep out of it. */
    var ext=(window.AUI&&AUI.src)?AUI.src(HC,HR):null;
    /* on a narrow screen the words fill the width, so the ring gets smaller and
       sits in the gap between the two lines instead of on top of them */
    var narrow=HC<70;
    var rr=narrow?Math.min(HC*0.2,HR*0.26):Math.min(HC*0.36,HR*0.47,27),rad=rr*HP.rad,cx=HC-rr-2,cy=Math.round(HR*(narrow?0.5:0.64));
    /* From 1600px the ring left 600px of nothing between itself and the words.
       It grows and moves in next to them, four cells after the last letter */
    if(!narrow&&wideHero()){
      var wr=0;for(i=0;i<wbox.length;i++)wr=Math.max(wr,wbox[i][2]);
      rr=Math.min(HC*0.36,HR*0.5,34);rad=rr*HP.rad;cx=Math.min(HC-rr-2,Math.round(wr+4+rad*1.05));cy=Math.round(HR*0.55);
    }
    /* A colour bar laid over the ring or through a letter read as a smudge on a
       phone, where everything is close. Bars now run up to the words and the
       ring and stop, a row at a time. With a photo there is no ring to avoid. */
    var rx2=Math.max(1,rad*0.95),ry2=rx2/1.25;
    function open(x,y){
      if(inWord(x,y))return false;
      if(ext)return true;
      var dx=(x-cx)/rx2,dy=(y-cy)/ry2;return dx*dx+dy*dy>1;
    }
    /* blocks and bars are runs of characters, not slabs: @@ for a bar, %% for a block */
    function runs(x0,y0,w,h,x1,chr){
      for(var yy=y0;yy<y0+h&&yy<HR;yy++){
        if(yy<0)continue;
        for(var xx=x0;xx<x0+w;xx++)if(xx>=0&&xx<HC&&open(xx,yy))ctx.fillText(chr,(xx+x1)*CW,yy*LH);
      }
    }
    /* blocks and colour bars */
    ctx.globalAlpha=0.92;
    for(i=0;i<blocks.length;i++){
      var b=blocks[i];
      b.x+=b.v;if(b.x>HC+2)b.x=-b.w;if(b.x<-b.w-2)b.x=HC;
      var bx=Math.floor(b.x);
      if(b.bars){
        for(k=0;k<b.w/2;k++){
          ctx.fillStyle=PAL[BAR[k%BAR.length]];
          runs(bx+k*2,b.y,2,b.h,shift[b.y],'@');
        }
      }else{
        ctx.fillStyle=PAL[b.c];
        runs(bx,b.y,b.w,b.h,shift[b.y],'%');
      }
    }
    ctx.globalAlpha=1;

    if(ext){
      var dk=currentTheme()==='dark',TRm=MAPS[HP.map]||(dk?TOR_D:TOR_L);
      for(y=0;y<HR;y++){
        var o2=shift[y]*CW;
        for(x=0;x<HC;x++){
          if(mask[y][x]||inWord(x,y))continue;
          var q2=Math.round(ext[y*HC+x]*6);if(dk?q2===0:q2===6)continue;
          ctx.fillStyle=PAL.bg;ctx.fillRect(x*CW+o2,y*LH,CW+0.5,LH);
          ctx.fillStyle=PAL[TRm[q2]];ctx.fillText(RAMP.charAt(dk?2+q2:8-q2),x*CW+o2,y*LH);
        }
      }
    }else{
    /* torus */
    if(!zb||zb.length!==n){zb=new Float32Array(n);lu=new Float32Array(n)}
    for(i=0;i<n;i++){zb[i]=0;lu[i]=-9}
    var K2=8,K1=rad*K2/3*0.86;
    var cA=Math.cos(A),sA=Math.sin(A),cB=Math.cos(B),sB=Math.sin(B),th,ph;
    for(th=0;th<6.283;th+=0.08){
      var ct=Math.cos(th),st=Math.sin(th);
      for(ph=0;ph<6.283;ph+=0.022){
        var cp=Math.cos(ph),sp=Math.sin(ph),ox=2+ct,oy=st;
        var X=ox*(cB*cp+sA*sB*sp)-oy*cA*sB;
        var Y=ox*(sB*cp-sA*cB*sp)+oy*cA*cB;
        var ooz=1/(K2+cA*ox*sp+oy*sA);
        var xp=Math.round(cx+K1*ooz*X),yp=Math.round(cy-K1/1.25*ooz*Y);
        if(xp<0||xp>=HC||yp<0||yp>=HR)continue;
        i=yp*HC+xp;
        if(ooz>zb[i]){zb[i]=ooz;lu[i]=cp*ct*sB-cA*ct*sp-sA*st+cB*(cA*st-ct*sA*sp)}
      }
    }
    var dark=currentTheme()==='dark',TOR=MAPS[HP.map]||(dark?TOR_D:TOR_L);
    for(y=0;y<HR;y++){
      var oxp=shift[y]*CW;
      for(x=0;x<HC;x++){
        var L=lu[y*HC+x];
        if(L<=-9||mask[y][x]||inWord(x,y))continue;
        var ln=Math.max(0,Math.min(1,(L+0.95)/2.3)),q=Math.round(Math.pow(ln,1.25)*6);
        ctx.fillStyle=PAL.bg;ctx.fillRect(x*CW+oxp,y*LH,CW+0.5,LH);
        ctx.fillStyle=PAL[TOR[q]];
        ctx.fillText(RAMP.charAt(dark?2+q:8-q),x*CW+oxp,y*LH);
      }
    }
    /* the glow is characters too: a speckled halo of : and . just outside the
       ring, thinning out as it leaves, and it shimmers a little with the ring */
    var rxo=rad*0.9,ryo=rxo/1.25,hx0=Math.max(0,Math.floor(cx-rxo*1.5)),hx1=Math.min(HC-1,Math.ceil(cx+rxo*1.5)),
        hy0=Math.max(0,Math.floor(cy-ryo*1.5)),hy1=Math.min(HR-1,Math.ceil(cy+ryo*1.5)),tk=Math.floor(t*3);
    ctx.fillStyle=PAL.hot;ctx.globalAlpha=0.55;
    for(y=hy0;y<=hy1;y++)for(x=hx0;x<=hx1;x++){
      if(lu[y*HC+x]>-9||mask[y][x]||inWord(x,y))continue;
      var hdx=(x-cx)/rxo,hdy=(y-cy)/ryo,hq=Math.sqrt(hdx*hdx+hdy*hdy);if(hq<1.02||hq>1.45)continue;
      var hh=(((x*73856093)^(y*19349663)^(tk*83492791))>>>0)%100;
      if(hh<(1.45-hq)/0.43*30)ctx.fillText(hq<1.2?':':'.',(x+shift[y])*CW,y*LH);
    }
    ctx.globalAlpha=1;
    }

    /* the name: backed, then violet and magenta ghosts, then ink */
    var split=((g>0?1+g*2.5:0)+burst*12)*HP.split;
    for(y=0;y<HR;y++)for(x=0;x<HC;x++)if(mask[y][x]){
      ctx.fillStyle=PAL.bg;ctx.fillRect((x+shift[y])*CW-0.5,y*LH,CW+1,LH);
    }
    var pass=[[-split,'violet'],[split,'hot'],[0,'ink']];
    for(k=0;k<3;k++){
      if(k<2&&split<=0)continue;
      ctx.fillStyle=PAL[pass[k][1]];
      for(y=0;y<HR;y++)for(x=0;x<HC;x++)if(mask[y][x]){
        ctx.fillText(((x*7+y*13)%11===0)?'%':'@',(x+shift[y])*CW+pass[k][0],y*LH);
      }
    }

    /* corruption during a burst */
    if(burst>0){
      for(i=0;i<Math.ceil(3*burst);i++){
        var rw=4+rnd(14),rh=1+rnd(3),rx=rnd(HC-rw),ry=rnd(HR-rh);
        /* a patch of heavy characters in one bar colour, over paper, not a slab */
        ctx.globalAlpha=1;
        for(y=ry;y<ry+rh;y++)for(x=rx;x<rx+rw;x++){ctx.fillStyle=PAL.bg;ctx.fillRect(x*CW,y*LH,CW+0.5,LH)}
        ctx.fillStyle=PAL[BAR[rnd(BAR.length)]];
        for(y=ry;y<ry+rh;y++)for(x=rx;x<rx+rw;x++)ctx.fillText(RAMP.charAt(5+rnd(4)),x*CW,y*LH);
      }
      G.burst=Math.max(0,burst-0.3);
    }
    fadeEdges();
  }
  /* The edges dissolve in characters: in the side fade (--fade, css/16) and
     the two rows top and bottom, a cell is dropped the more often the nearer
     it is to the edge, so streaks and bars thin out and leave instead of
     stopping mid character. It used to be a gradient mask on the canvas. The
     pattern is fixed per cell, so it does not crawl. The name keeps every
     cell: the words start inside the fade already */
  function fadeEdges(){
    var fx=FADEPX/CW,fy=2*ROW/LH,x,y,j,ey,f,xs;
    if(!(fx>0)||!(fy>0))return;
    var a=Math.ceil(fx),b=Math.floor(HC-fx);
    for(y=0;y<HR;y++){
      ey=Math.min(y+0.5,HR-y-0.5)/fy;
      for(j=0;j<HC;j++){
        if(ey>=1&&j===a&&b>a){j=b-1;continue}
        x=j;if(mask[y][x])continue;f=Math.min(ey,Math.min(x+0.5,HC-x-0.5)/fx);if(f>=1)continue;
        if(((((x*73856093)^(y*19349663))>>>0)%100)/100>=f)ctx.clearRect(x*CW-0.5,y*LH,CW+1,LH);
      }
    }
  }
  function kick(){if(glitch()>0)G.burst=1}
  function point(e){
    var b=hero.getBoundingClientRect();
    spinX=(e.clientX-b.left)/b.width-0.5;spinY=(e.clientY-b.top)/b.height-0.5;
    if(reduce||!G.on){A+=spinY*0.4;B+=spinX*0.4;drawHero()}
  }
  hero.addEventListener('pointermove',point);
  hero.addEventListener('pointerdown',function(e){point(e);kick();if(glitch()>0)sfx.burst()});
  hero.addEventListener('pointerleave',function(){spinX=spinY=0});
  var visible=true;
  if('IntersectionObserver' in window)
    new IntersectionObserver(function(en){visible=en[0].isIntersecting;if(visible&&heroTask)heroTask.wake()}).observe(hero);
  /* the ring turns on its own, so Glitch off stops it too (it is the page's
     pause switch); a pointer can still turn it by hand */
  /* it waits for the boot screen to leave (js/20 wakes it then) */
  var heroTask=reduce?null:every(85,function(){
    var g=glitch(),now=Date.now();
    if(G.scroll>0.3)G.burst=Math.max(G.burst,G.scroll);
    if(g>0&&now>G.next){G.burst=1;G.next=now+(1400+Math.random()*4200)/(0.35+g)}
    t+=0.12;A+=0.05*HP.speed+spinY*0.35;B+=0.028*HP.speed+spinX*0.35;drawHero();
  },{gate:function(){return visible&&G.on&&!root.classList.contains('aui-booting')}});
  function heroWake(){if(heroTask)heroTask.wake()}

  /* ---- fx layer: ambient streaks, shards where you touch, page jolts ---- */
  var fx=$('fx');
  /* sparks are characters on the grid that fade down the ramp, 40ms a step,
     never boxes. Cyan is focus, so a spark asked for in cyan comes out violet */
  var FADE='@%#*+=:.';
  function fadeRun(x,y,n,c,op,life){
    var d=document.createElement('div'),steps=Math.max(2,Math.min(FADE.length,Math.round(life/40)));
    d.setAttribute('aria-hidden','true');
    d.style.cssText='left:'+(Math.round(x/CH)*CH)+'px;top:'+(Math.round(y/ROW)*ROW)+'px;line-height:'+ROW+'px;font-weight:700;white-space:pre;opacity:'+op+';color:var(--'+(c==='cy'?'violet':c)+')';
    d.textContent=TR(rep(FADE.charAt(0),n));fx.appendChild(d);
    times(40,steps,function(f){if(f<steps)d.textContent=TR(rep(FADE.charAt(Math.round(f*(FADE.length-1)/(steps-1))),n))},function(){d.remove()});
  }
  function spark(x,y,w,h,c,op,life){fadeRun(x,y,Math.max(1,Math.round(w/CH)),c,op,life)}
  /* a tap answers with a burst drawn in characters, four frames, 40ms each */
  var TAPF=[['  @  '],[' %#% ','%#@#%',' %#% '],['+ * +','*   *','+ * +'],['.   .','     ','.   .']];
  function tapBurst(x,y,c){
    var d=document.createElement('div'),cx=Math.round(x/CH)*CH-2*CH,cy=Math.round(y/ROW)*ROW-ROW;
    d.setAttribute('aria-hidden','true');
    d.style.cssText='left:'+cx+'px;top:'+cy+'px;line-height:'+ROW+'px;font-weight:700;white-space:pre;color:var(--'+c+')';
    var paint=function(f){var r=TAPF[f];d.textContent=TR(r.length===1?'\n'+r[0]+'\n':r.join('\n'))};
    paint(0);fx.appendChild(d);
    times(40,TAPF.length,function(f){if(f<TAPF.length)paint(f)},function(){d.remove()});
  }
  /* ambient sparks are runs of = on the character grid, and they only land
     where there is no text: the gutters either side of the column and the
     hero. As 2px lines over body copy they read as broken underlines. */
  function run(x,y,n,c,op,life){
    var d=document.createElement('div');
    d.textContent=TR(rep('=',n));
    d.style.cssText='left:'+x+'px;top:'+y+'px;line-height:24px;font-weight:700;white-space:pre;opacity:'+op+';color:var(--'+c+')';
    fx.appendChild(d);setTimeout(function(){d.remove()},life);
  }
  function sparkSpots(){
    var vw=window.innerWidth,vh=window.innerHeight,m=main.getBoundingClientRect(),pad=CH*2,out=[],h;
    var lg=Math.floor((m.left+pad)/CH),rg=Math.floor((vw-m.right+pad)/CH);
    /* a gutter narrower than six characters turns a streak into a stub on the bezel */
    if(lg>=6)out.push([0,lg,0,vh]);
    if(rg>=6)out.push([vw-rg*CH,rg,0,vh]);
    h=hero.getBoundingClientRect();
    if(h.height&&h.bottom>ROW&&h.top<vh-ROW)out.push([Math.max(0,h.left),Math.floor(h.width/CH),Math.max(0,h.top),Math.min(vh,h.bottom)]);
    return out;
  }
  if(!reduce)every(650,function(){
    var g=glitch();if(Math.random()>g*1.3)return;
    var spots=sparkSpots();if(!spots.length)return;
    var n=1+rnd(Math.ceil(3*g));
    while(n--){
      var s=spots[rnd(spots.length)],len=Math.max(1,Math.min(s[1],2+rnd(18)));
      var x=s[0]+rnd(s[1]-len+1)*CH,y=s[2]+rnd(Math.max(1,Math.floor((s[3]-s[2])/ROW)))*ROW;
      run(x,y,len,Math.random()<0.7?'hot':'pink',0.25+Math.random()*0.6,80+Math.random()*220);
    }
  },{gate:function(){return glitch()>0}});
  /* taps and the trail are magenta and pink only: the other colours mean something */
  var SH=['hot','pink'];
  document.addEventListener('pointerdown',function(e){
    var g=glitch();if(g<=0||reduce)return;
    tapBurst(e.clientX,e.clientY,SH[rnd(2)]);
    var n=Math.round(g*3);
    while(n--)fadeRun(e.clientX+(Math.random()-0.5)*150,e.clientY+(Math.random()-0.5)*60,1+rnd(4),SH[rnd(2)],0.8,160+Math.random()*160);
  });
  function jolt(){
    if(reduce||glitch()<=0)return;
    main.classList.remove('jolt');void main.offsetWidth;main.classList.add('jolt');kick();sfx.burst();
  }
  main.addEventListener('animationend',function(e){if(e.animationName==='jolt')main.classList.remove('jolt')});
  /* jolt is for errors. Good news gets one lime frame on the thing that worked
     and a hero burst, then the frame goes back to its own colour */
  function flash(el){
    kick();
    if(reduce||!el)return;
    var f=el.closest('.lift')||el.closest('.frame,.progress')||el;
    if(f._ok)f._ok.stop();
    f.classList.add('okflash');
    f._ok=times(120,1,function(){},function(){f.classList.remove('okflash');f._ok=null});
  }
  document.addEventListener('keydown',function(e){
    if(e.key==='g'&&!/INPUT|TEXTAREA/.test(e.target.tagName))jolt();
  });
  $('glitchToggle').checked=G.on;
  $('soundToggle').checked=SND.on;
  /* reduced motion keeps the page silent, so the switch says so rather than
     turning on and playing nothing */
  if(reduce)['soundToggle'].forEach(function(id){var s=$(id);if(s){s.checked=false;s.disabled=true;s.closest('label').title='Off while reduced motion is on'}});
  /* a browser with no Web Audio has nothing to switch on, so the switch says so */
  else if(!HAS_AUDIO){SND.on=false;var st=$('soundToggle');st.checked=false;st.disabled=true;st.closest('label').title='No sound in this browser'}
  $('glitchToggle').addEventListener('change',function(e){G.on=e.target.checked;if(G.on)jolt();else drawHero();glitchGlyph()});
  $('soundToggle').addEventListener('change',function(e){
    SND.on=e.target.checked;
    if(SND.on)sfx.ok();else if(AC){SND.nap=false;clearTimeout(napT);AC.suspend()}
    soundGlyph();
  });
  /* the bar's settings are glyphs: a speaker, a zigzag, a sun or a moon. The
     glyph says the state, the label says what a press does */
  var glBar=$('glitchBar');
  function glitchGlyph(){
    var on=$('glitchToggle').checked;
    glBar.setAttribute('aria-pressed',on?'true':'false');
    glBar.querySelector('.gl').textContent=on?'/\\/':'___';
    glBar.title=on?'Glitch on':'Glitch off';
  }
  function soundGlyph(){
    var t=$('soundToggle'),on=t.checked;
    $('soundBar').querySelector('.lbl').textContent=on?'<)))':'<) x';
    if(!t.disabled)$('soundBar').title=on?'Sound on':'Sound off';
  }
  glBar.addEventListener('click',function(){$('glitchToggle').click()});
  if(/Mac|iP/.test(navigator.platform||''))$('sfKey').textContent='Cmd K';
  glitchGlyph();soundGlyph();

  /* ---- cursor trail and scroll aberration ---- */
  var trailAt=0;
  document.addEventListener('pointermove',function(e){
    if(e.pointerType!=='mouse'||reduce)return;
    var g=glitch(),n=Date.now();if(g<=0||n-trailAt<42)return;trailAt=n;
    /* each cell the pointer passes goes @ % # * + = : . and is gone */
    fadeRun(e.clientX+CH,e.clientY+ROW*0.6,1,SH[rnd(2)],0.85,320);
  });
  var lastY=window.scrollY,svNow=0,svTimer=null;
  function setSv(v){
    if(v===svNow)return;svNow=v;
    main.classList.toggle('sv',v>0);main.style.setProperty('--sv',v);
  }
  window.addEventListener('scroll',function(){
    var y=window.scrollY,dy=Math.abs(y-lastY);lastY=y;
    if(reduce)return;
    setSv(Math.min(4,Math.round(dy/16*glitch()*2)));
    clearTimeout(svTimer);svTimer=setTimeout(function(){setSv(0)},90);
  },{passive:true});

  layout();
  window.addEventListener('resize',layout);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(layout);

  /* ---- button labels: set and scramble ---- */
  function setLabel(btn,text){
    if(btn._s){btn._s.stop();btn._s=null}
    btn.querySelector('.label').textContent=text;
    btn.setAttribute('data-text',text);btn.setAttribute('aria-label',text);
  }
  function scramble(btn){
    if(reduce||btn.disabled||btn._s)return;
    var l=btn.querySelector('.label');if(!l)return;
    var txt=btn.getAttribute('data-text')||l.textContent,i=0;
    btn.setAttribute('data-text',txt);btn.setAttribute('aria-label',txt);
    btn._s=every(32,function(){
      i++;var out='';
      for(var k=0;k<txt.length;k++)
        out+=(k<i||txt.charAt(k)===' ')?txt.charAt(k):TR(RAMP.charAt(3+Math.floor(Math.random()*6)));
      l.textContent=out;
      if(i>=txt.length){btn._s.stop();btn._s=null;l.textContent=txt}
    });
  }
  var canHover=window.matchMedia('(hover:hover)').matches;
  [].forEach.call(document.querySelectorAll('.btn'),function(b){
    /* a label that just resolved does not scramble again for 2s, so running
       the pointer back and forth over a row of buttons is not a slot machine */
    if(canHover)b.addEventListener('pointerenter',function(){
      var n=Date.now();if(b._sAt&&n-b._sAt<2000)return;b._sAt=n;scramble(b);
    });
  });
  /* data-still: a button whose label is what you check after pressing it
     (Download tokens.css) keeps it readable on the press; hover still scrambles */
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.btn');if(b&&!b.hasAttribute('data-still'))scramble(b);
  });

  /* ---- button rims: march on hover, burst on press ---- */
  var PAT={primary:'@@%%##%%',plain:'==++**##**++',danger:'///:'};
  var BURST={primary:'%#*+*#%',plain:'+*#%@%#*',danger:':/:/:/'};
  function kind(b){return b.classList.contains('btn-danger')?'danger':b.classList.contains('btn-primary')?'primary':'plain'}
  function q(x){return '"'+x+'"'}
  function rimSet(b,top,bot,l,r){
    b.style.setProperty('--h',q(top));b.style.setProperty('--hb',q(bot));
    b.style.setProperty('--s',q(l));b.style.setProperty('--sr',q(r));
  }
  /* the rim runs through the acting and decoration colours only */
  var RIMC=['hot','pink','violet','deep','pink','violet'];
  function rimClear(b){['--h','--hb','--s','--sr','--frame-color'].forEach(function(p){b.style.removeProperty(p)})}
  function march(b){
    if(reduce||b.disabled||b._m)return;
    var P=PAT[kind(b)],n=P.length,f=0;
    b._m=every(70,function(){
      if(b.disabled){unmarch(b);return}
      f++;var top='',bot='',i;
      for(i=0;i<56;i++){top+=P.charAt(((i-f)%n+n)%n);bot+=P.charAt((i+f)%n)}
      var l=P.charAt(((-f-1)%n+n)%n),r=P.charAt((f+2)%n);
      rimSet(b,top,bot,l+l,r+r);
      b.style.setProperty('--frame-color','var(--'+RIMC[(f>>1)%RIMC.length]+')');
    });
  }
  function unmarch(b){if(b._m){b._m.stop();b._m=null;rimClear(b)}}
  function burst(b){
    if(b.disabled)return;sfx.blip();
    if(reduce||b._m||b._b)return;
    var S=BURST[kind(b)],f=0;
    b._b=every(38,function(){
      if(f>=S.length){b._b.stop();b._b=null;rimClear(b);return}
      var c=S.charAt(f++);rimSet(b,rep(c,56),rep(c,56),c+c,c+c);
      b.style.setProperty('--frame-color','var(--'+RIMC[f%RIMC.length]+')');
    });
  }
  [].forEach.call(document.querySelectorAll('.btn'),function(b){
    if(canHover){
      b.addEventListener('pointerenter',function(){march(b)});
      b.addEventListener('pointerleave',function(){unmarch(b)});
    }
    b.addEventListener('pointerdown',function(){burst(b)});
    b.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' ')burst(b)});
  });

  /* ---- checkbox and radio: the mark develops through the ramp ---- */
  var UP=['.',':','+','#','@'];
  document.addEventListener('change',function(e){
    var el=e.target;
    if(el.matches&&el.matches('.check input')&&el.id!=='soundToggle'){if(el.checked)sfx.on();else sfx.off()}
    if(reduce||!el.matches||!el.matches('.check input:not([role])'))return;
    var g=el.nextElementSibling,radio=el.type==='radio',on=el.checked,f=0;
    if(g._a)g._a.stop();
    g._a=every(34,function(){
      if(f>=UP.length){g._a.stop();g.removeAttribute('data-f');return}
      var c=UP[on?f:UP.length-1-f];f++;
      g.setAttribute('data-f',radio?'('+c+')':'['+c+']');
    });
  });

  /* ---- one transition at a time ----
     The curtain and the datamosh used to keep a lock each, so a view picked
     during a theme change ran both at once and the later pick could land
     first. Now there is one lock: a transition asked for while another is
     running waits its turn, and the overlay swallows taps while it covers.
     The curtain is for the theme and the presets, the datamosh for views. */
  /* Asked for faster than they can play (a preset held on an arrow key, ten
     taps on the theme), they used to queue and flash for seconds. Now what
     waited lands at once, only the latest one plays, and two never start
     closer than 400ms apart (WCAG 2.3.1). */
  var busy=false,waiting=[],lastEnd=-1e9,GAP=400;
  function nowMs(){return window.performance?performance.now():Date.now()}
  /* the overlay eats taps, except one on a view link under it: that one
     becomes the new target, so rapid picks still end where you stopped */
  function hold(wrap){
    busy=true;if(!wrap)return;
    wrap.addEventListener('click',function(e){
      wrap.style.pointerEvents='none';
      var el=document.elementFromPoint(e.clientX,e.clientY);
      wrap.style.pointerEvents='auto';
      var t=el&&el.closest&&el.closest('#views [role="tab"]');
      if(t)t.click();
    });
  }
  function free(){busy=false;lastEnd=nowMs();drain()}
  function drain(){
    if(busy||!waiting.length)return;
    var q=waiting,i;waiting=[];
    for(i=0;i<q.length-1;i++)q[i].cb();
    transition(q[q.length-1].kind,q[q.length-1].cb);
  }
  function transition(kind,cb){
    if(reduce){cb();return}
    if(busy){waiting.push({kind:kind,cb:cb});return}
    var wait=lastEnd+GAP-nowMs();
    if(wait>0){busy=true;setTimeout(function(){busy=false;waiting.unshift({kind:kind,cb:cb});drain()},wait);return}
    if(kind==='mosh'&&window.AUI&&AUI.mosh)AUI.mosh(cb);else curtain(cb);
  }

  /* ---- theme: a halftone curtain sweeps the page ---- */
  var EDGE='.:=+*#%@';
  function curtain(cb){
    if(reduce){cb();return}
    sfx.wipe();
    var cs=getComputedStyle(document.body),ink=cs.color;
    var cols=Math.ceil(window.innerWidth/CH)+1,rows=Math.ceil(window.innerHeight/ROW)+1,skew=Math.ceil(rows*0.5);
    var wrap=document.createElement('div'),solid=document.createElement('div'),pre=document.createElement('pre');
    wrap.setAttribute('aria-hidden','true');hold(wrap);
    wrap.style.cssText='position:fixed;inset:0;z-index:100;overflow:hidden;pointer-events:auto;touch-action:none';
    /* the bands are rows of @ in the band colours, three rows each, on the
       page's own row; the paper behind them only hides the swap */
    var bc=['pink','hot','violet','deep','ink','hot','violet'];
    solid.style.cssText='position:absolute;top:0;bottom:0;left:0;width:0;background:'+PAL.bg;
    pre.style.cssText='position:absolute;inset:0;margin:0;font:inherit;font-weight:700;line-height:'+ROW+'px;white-space:pre;color:'+ink;
    wrap.appendChild(solid);wrap.appendChild(pre);document.body.appendChild(wrap);
    var p=0,end=cols+8+skew,out=false,step=Math.max(8,Math.round(end/6.5));
    function frame(){
      var html='',x,y;
      for(y=0;y<rows;y++){
        var front=p-Math.floor(y*0.5),row='';
        for(x=0;x<cols;x++){
          var d=out?x-front+8:front-x;
          row+=d<0?' ':TR(EDGE.charAt(Math.min(7,d)));
        }
        html+='<span style="color:'+PAL[bc[Math.floor(y/3)%bc.length]]+'">'+row.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</span>\n';
      }
      pre.innerHTML=html;
      if(!out){solid.style.left='0';solid.style.right='auto';solid.style.width=Math.max(0,(p-skew-7)*CH)+'px'}
      else{solid.style.left=Math.max(0,(p+1)*CH)+'px';solid.style.right='0';solid.style.width='auto'}
    }
    var iv=every(26,function(){
      p+=step;frame();
      if(p>=end){
        if(!out){out=true;p=-8;cb();}
        else{iv.stop();wrap.remove();readPalette();kick();free()}
      }
    });
  }


  /* ---- a sheet closes when you tap the page above it: on click, so the tap
     does not land on the page once the sheet is gone, and only when the press
     started there too, so a drag out of the sheet does not close it ---- */
  function backdropClose(d){
    var down=false;
    d.addEventListener('pointerdown',function(e){down=e.target===d});
    d.addEventListener('click',function(e){if(down&&e.target===d)d.close();down=false});
  }

  /* ---- grid overlay and theme ---- */
  $('gridToggle').addEventListener('change',function(e){main.classList.toggle('show-grid',e.target.checked)});
  var themeBtn=$('themeToggle');
  /* the page only changes once the curtain lands, so a second tap before then
     reads the theme it is heading to, and two quick taps cancel out. A tap
     after the landing queues one more curtain rather than running two. */
  var themeWant=null,themeQueued=false;
  themeBtn.addEventListener('click',function(){
    themeWant=(themeWant||currentTheme())==='dark'?'light':'dark';
    themeLabel();
    if(themeQueued)return;themeQueued=true;
    transition('wipe',function(){
      themeQueued=false;
      if(themeWant&&themeWant!==currentTheme())root.setAttribute('data-theme',themeWant);
      themeWant=null;themeLabel();
    });
  });
  /* the button names where it takes you, not where you are */
  function themeLabel(){
    var now=themeWant||currentTheme(),to=now==='dark'?'light':'dark';
    themeBtn.querySelector('.label').textContent=now==='dark'?'(C':'-O-';
    $('themeWord').textContent=now==='dark'?'Dark':'Light';
    /* the name says what you see (the word on screen), the title what a press does */
    themeBtn.setAttribute('aria-label','Theme: '+(now==='dark'?'Dark':'Light'));
    themeBtn.title='Switch to '+to+' theme';
  }
  new MutationObserver(function(){themeLabel();readPalette();drawHero()})
    .observe(root,{attributes:true,attributeFilter:['data-theme','data-preset']});
  themeLabel();

  /* ---- input validation ---- */
  var slug=$('slug'),slugField=$('slugField'),slugError=$('slugError');
  function ripple(field,input){
    SND.last=0;sfx.tick();
    if(reduce)return;
    var cols=Math.round(field.getBoundingClientRect().width/CH);
    var c=Math.min(cols-3,5+(input.selectionStart==null?input.value.length:input.selectionStart)),f=0;
    if(field._r)field._r.stop();
    field._r=every(30,function(){
      f++;
      if(f>12){field._r.stop();field.style.removeProperty('--h');field.style.removeProperty('--hb');return}
      var base=field.classList.contains('invalid')?'!':'@',s1='',i;
      for(i=0;i<cols;i++){
        var d=Math.abs(Math.abs(i-c)-f*2);
        s1+=d<1?'.':d<2?'+':d<3?'#':base;
      }
      field.style.setProperty('--h','"'+s1+'"');field.style.setProperty('--hb','"'+s1+'"');
    });
  }
  [].forEach.call(document.querySelectorAll('.field input'),function(inp){
    inp.addEventListener('input',function(){ripple(inp.closest('.field'),inp)});
  });
  /* the frame is 72px tall and reads as the target, but only the 24px line
     inside it used to take the tap */
  document.addEventListener('pointerdown',function(e){
    /* with a mouse on touch-down, as before. A finger waits for the click,
       which never comes if the touch turns into a scroll: focusing on
       touch-down opened the keyboard whenever a scroll started on a frame */
    if(e.pointerType!=='mouse')return;
    var f=e.target.closest&&e.target.closest('.field');
    if(!f||e.target.matches('input,select,textarea,button,a'))return;
    var inp=f.querySelector('input,select,textarea');
    if(inp&&!inp.disabled){e.preventDefault();inp.focus()}
  });
  document.addEventListener('click',function(e){
    var f=e.target.closest&&e.target.closest('.field');
    if(!f||e.target.matches('input,select,textarea,button,a')||f.contains(document.activeElement))return;
    var inp=f.querySelector('input,textarea');
    if(inp&&!inp.disabled)inp.focus();
  });
  /* focus alone does not open a dropdown, so the tap would still feel dead. On
     click, not touch-down, so a scroll that starts on the frame stays a scroll */
  document.addEventListener('click',function(e){
    var f=e.target.closest&&e.target.closest('.field');
    if(!f||e.target.matches('input,select,textarea,button,a'))return;
    var sel=f.querySelector('select');
    if(sel&&!sel.disabled&&sel.showPicker)try{sel.showPicker()}catch(err){}
  });
  slug.addEventListener('input',function(){
    var v=slug.value,msg='';
    if(!v)msg='Enter a link for this project.';
    else if(!/^[a-z0-9-]+$/.test(v))msg='Use lowercase letters, numbers and hyphens.';
    if(msg&&!slugField.classList.contains('invalid'))sfx.err();
    slugError.textContent=msg;
    slugField.classList.toggle('invalid',!!msg);
    slug.setAttribute('aria-invalid',msg?'true':'false');
  });

  /* ---- halftone bar, shared by slider and progress ---- */
  var CELLS=24,TAIL='%#*+=:';
  var RD='@%#*+=:.';
  function barRow(k,jit,n){
    n=n||CELLS;
    if(k<=0)return rep('.',n);
    if(k>=n)return rep('@',n);
    var tail=TAIL,i;
    if(jit){
      tail='';
      for(i=0;i<TAIL.length;i++){
        var at=RD.indexOf(TAIL.charAt(i))+Math.floor(Math.random()*3)-1;
        tail+=RD.charAt(Math.max(1,Math.min(6,at)));
      }
    }
    return (rep('@',n)+tail).slice(-k)+rep('.',n-k);
  }
  /* one row, like every other halftone bar in the kit (tape, tasks,
     regions). It was two rows here, so the kit had bars in two heights. */
  function barText(k,jit){return barRow(k,jit)}
  /* density in colour: magenta, pink, violet, ink, then gray. Yellow and lime
     stay for warnings and confirmations */
  var BC={'@':'hot','%':'hot','#':'pink','*':'pink','+':'violet','=':'violet',':':'ink','.':'muted'};
  function colorize(txt){
    var out='',cur='',run='',i,c,k;
    function flush(){if(run)out+='<span style="color:var(--'+cur+')">'+run.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span>';run=''}
    for(i=0;i<txt.length;i++){
      c=txt.charAt(i);
      if(c==='\n'){flush();out+='\n';continue}
      k=BC[c]||'ink';if(k!==cur){flush();cur=k}
      run+=TR(c);
    }
    flush();return out;
  }
  function bindSlider(input,onChange){
    var barEl=input.parentNode.querySelector('.bar'),out=document.querySelector('output[for="'+input.id+'"]');
    function draw(jit){
      var min=+input.min,max=+input.max,v=+input.value,fr=(v-min)/(max-min);
      barEl.innerHTML=colorize(barText(Math.round(fr*CELLS),jit===true&&!reduce));
      if(out)out.textContent=v;
      if(jit===true)sfx.val(v);
      onChange(fr,v);
    }
    input.addEventListener('input',function(){draw(true)});
    input.addEventListener('change',function(){draw(false)});
    draw(false);
  }
  bindSlider($('speed'),function(fr){G.amt=fr});

  /* ---- views: the seven are links (#components, #blocks ...) and
     js/70-nav.js owns the address, the clicks and the keyboard. This owns the
     swap: one datamosh at a time, and a pick made while one is running
     replaces where it goes rather than starting another. `then` lands
     somewhere once the new view shows; without it the view's first block
     lands one row under the bar. `instant` skips the transition (a deep link
     on load). ---- */
  var viewTabs=[].slice.call(document.querySelectorAll('#views [role="tab"]')),
      viewWant=null,viewThen=null,viewQueued=false;
  function applyView(tab){
    viewTabs.forEach(function(x){
      var on=x===tab;
      x.setAttribute('aria-selected',on?'true':'false');x.tabIndex=on?0:-1;
      $(x.getAttribute('aria-controls')).hidden=!on;
    });
    /* Home's tab is not drawn (the name is the way there), so on Home the
       keyboard enters the row at the first tab that is */
    if(getComputedStyle(tab).display==='none'){
      var f=viewTabs.filter(function(x){return getComputedStyle(x).display!=='none'})[0];if(f)f.tabIndex=0;
    }
  }
  function showView(tab,then,instant){
    if(!viewQueued&&tab.getAttribute('aria-selected')==='true'){if(then)then();return}
    viewWant=tab;viewThen=then||null;
    if(viewQueued)return;viewQueued=true;
    function swap(){
      viewQueued=false;
      var t=viewWant,fn=viewThen;viewWant=viewThen=null;
      if(t.getAttribute('aria-selected')!=='true'){
        applyView(t);
        /* a view can move things around as it opens (onView), so that
           happens before the landing is measured, not on a timer after it */
        if(window.AUI&&AUI.onView)AUI.onView(t);
        if(window._labs)window._labs();
        if(!fn){
          var p=$(t.getAttribute('aria-controls')),tb=document.querySelector('.topbar');
          var first=[].filter.call(p.children,function(c){return c.offsetParent!==null})[0]||p;
          window.scrollTo(0,Math.max(0,first.getBoundingClientRect().top+window.scrollY-(tb?tb.offsetHeight:0)-ROW));
        }
        document.dispatchEvent(new CustomEvent('aui:view',{detail:t}));
      }
      if(fn)fn();
    }
    if(instant)swap();else transition('mosh',swap);
  }

  /* ---- tabs: one group per tablist, the views excepted (above) ---- */
  [].forEach.call(document.querySelectorAll('[role="tablist"]'),function(list){
    if(list.id==='views')return;
    var tabs=[].slice.call(list.querySelectorAll('[role="tab"]'));
    function apply(tab){
      tabs.forEach(function(x){
        var on=x===tab;
        x.setAttribute('aria-selected',on?'true':'false');x.tabIndex=on?0:-1;
        $(x.getAttribute('aria-controls')).hidden=!on;
      });
    }
    function select(tab,focus){
      if(tab.getAttribute('aria-selected')==='true')return;
      if(focus)tab.focus();
      sfx.tab();apply(tab);
      if(window._revealTree)window._revealTree($(tab.getAttribute('aria-controls')));
    }
    tabs.forEach(function(tab,idx){
      tab.addEventListener('click',function(){select(tab,false)});
      tab.addEventListener('keydown',function(e){
        var n=null;
        if(e.key==='ArrowRight')n=tabs[(idx+1)%tabs.length];
        else if(e.key==='ArrowLeft')n=tabs[(idx-1+tabs.length)%tabs.length];
        else if(e.key==='Home')n=tabs[0];
        else if(e.key==='End')n=tabs[tabs.length-1];
        if(n){e.preventDefault();select(n,true)}
      });
    });
  });

  /* ---- toast ---- */
  var toast=$('toast'),toastText=$('toastText'),toastTimer;
  /* Two quiet regions for screen readers: news is polite, a failure is an
     alert and interrupts. The toast only shows it; it does not also speak, or
     an error would be read twice. */
  function vhNode(id,role){
    var n=document.createElement('div');n.id=id;n.className='vh';n.setAttribute('role',role);
    if(role==='status')n.setAttribute('aria-live','polite');
    document.body.appendChild(n);return n;
  }
  var sayOk=vhNode('sayStatus','status'),sayErr=vhNode('sayAlert','alert');
  toast.removeAttribute('role');toast.removeAttribute('aria-live');toast.setAttribute('aria-hidden','true');
  function announce(msg,err){
    var n=err?sayErr:sayOk;n.textContent='';clearTimeout(n._t);
    /* emptied first and filled a beat later, so the same words twice are read twice */
    n._t=setTimeout(function(){n.textContent=msg},40);
  }
  /* say(msg) is good news in lime, say(msg,true) is a failure in yellow.
     say(msg,err,true) keeps it on the bottom row on a phone too: for news
     nobody tapped for (a stale link), where the top would hide the title */
  function say(msg,err,low){
    announce(msg,err);
    clearTimeout(toastTimer);toastText.textContent=(err?'!! ':'@@ ')+msg;
    toast.classList.toggle('err',!!err);toast.classList.toggle('low',!!low);
    toast.classList.add('on');
    toastTimer=setTimeout(function(){toast.classList.remove('on')},3600);
  }

  /* ---- card and dialog ---- */
  var dlg=$('publishDialog'),publishBtn=$('publishBtn'),status=$('cardStatus'),live=false;
  publishBtn.addEventListener('click',function(){
    if(live){
      live=false;status.textContent='draft';
      publishBtn.className='btn btn-primary frame tone-heavy';setLabel(publishBtn,'Publish');
      say('Unpublished Reporting redesign.');flash(publishBtn);
    }else if(dlg.showModal){dlg.showModal();sfx.open()}
  });
  $('dlgCancel').addEventListener('click',function(){dlg.close()});
  $('dlgConfirm').addEventListener('click',function(){
    dlg.close();live=true;status.textContent='live';
    publishBtn.className='btn frame tone-light';setLabel(publishBtn,'Unpublish');
    say('Published Reporting redesign.');flash(publishBtn);sfx.ok();
  });

  /* ---- progress ---- */
  var bar=$('bar'),barGlyph=bar.querySelector('.bar'),pct=bar.querySelector('.pct'),
      exportBtn=$('exportBtn'),exportStatus=$('exportStatus'),FRAMES='|/-\\';
  function drawBar(p){
    var txt=barText(Math.round(p/100*CELLS),p>0&&p<100&&!reduce);
    if(p>0&&p<100&&!reduce)txt=txt.replace(/@/g,function(){return Math.random()<0.12?'%':'@'});
    barGlyph.innerHTML=colorize(txt);
    var s=p+'%';pct.textContent=rep(' ',4-s.length)+s;
    bar.setAttribute('aria-valuenow',p);
  }
  drawBar(0);
  exportBtn.addEventListener('click',function(){
    var p=0,f=0;
    exportStatus.textContent='';
    setLabel(exportBtn,(reduce?'*':'|')+' Exporting');exportBtn.disabled=true;
    exportBtn.setAttribute('aria-label','Exporting');
    var spin=every(100,function(){
      exportBtn.querySelector('.label').textContent=(reduce?'*':FRAMES.charAt(++f%4))+' Exporting';
    });
    var run=every(130,function(){
      p=Math.min(100,p+3+Math.floor(Math.random()*7));drawBar(p);sfx.val(p);
      if(p>=100){
        run.stop();spin.stop();
        exportBtn.disabled=false;setLabel(exportBtn,'Export report');
        exportStatus.textContent='Exported report.';flash(bar);sfx.ok();
      }
    });
  });

  /* ---- labs (Themes), details ---- */
  var rampLab=$('rampLab'),RLX=0.5,RLY=0.5,RLE=0.6;
  function drawRamp(){
    var cols=Math.max(16,Math.min(72,Math.floor(rampLab.clientWidth/CH)||30)),rows=9,o='',x,y;
    for(y=0;y<rows;y++){
      for(x=0;x<cols;x++){
        var dx=(x/cols-RLX)*2.4,dy=(y/rows-RLY)*1.5,v=RLE*1.7*Math.exp(-(dx*dx+dy*dy)*3);
        o+=RAMP.charAt(Math.max(0,Math.min(8,Math.floor(v*9))));
      }
      o+='\n';
    }
    rampLab.innerHTML=colorize(o);
  }
  function rampPoint(e){
    var b=rampLab.getBoundingClientRect();
    RLX=(e.clientX-b.left)/b.width;RLY=(e.clientY-b.top)/b.height;drawRamp();
  }
  rampLab.addEventListener('pointermove',rampPoint);
  rampLab.addEventListener('pointerdown',rampPoint);
  bindSlider($('expo'),function(fr){RLE=fr;drawRamp()});
  window._labs=drawRamp;
  window.addEventListener('resize',drawRamp);

  var frameCh=$('frameCh'),frameDemo=$('frameDemo');
  function drawFrameLab(){
    var c=frameCh.value||' ',e=(c==='"'||c==='\\')?'\\'+c:c,h='',i;
    for(i=0;i<60;i++)h+=e;
    frameDemo.style.setProperty('--h','"'+h+'"');
    frameDemo.style.setProperty('--s','"'+e+e+'"');
    $('frameDemoLabel').textContent='Made of '+(c===' '?'nothing':c);
  }
  frameCh.addEventListener('input',drawFrameLab);drawFrameLab();

  var typeIn=$('typeIn'),typeOut=$('typeOut'),typeTimer;
  typeIn.addEventListener('input',function(){
    clearTimeout(typeTimer);
    typeTimer=setTimeout(function(){
      /* fitTitles() rebuilds a title from data-text, so the new word goes there too */
      var w=Array.from(typeIn.value.toUpperCase()).slice(0,8).join('')||' ';
      typeOut.setAttribute('data-text',w);initTitle(typeOut,w);fitTitles();develop(typeOut);
    },160);
  });

  $('gTear').addEventListener('click',jolt);
  $('gSplit').addEventListener('click',function(){
    if(reduce)return;
    main.classList.remove('split');void main.offsetWidth;main.classList.add('split');sfx.dev();
  });
  main.addEventListener('animationend',function(e){if(e.animationName==='split')main.classList.remove('split')});
  $('gShards').addEventListener('click',function(e){
    if(reduce)return;
    var b=e.currentTarget.getBoundingClientRect(),n=28;
    while(n--){
      var w=CH*(1+rnd(6)),h=6*(1+rnd(4));
      spark(b.left+b.width/2+(Math.random()-0.5)*300-w/2,Math.round((b.top+(Math.random()-0.5)*160)/6)*6,
            w,h,SH[rnd(SH.length)],0.95,120+Math.random()*420);
    }
    sfx.burst();
  });
  $('gCurtain').addEventListener('click',function(){transition('wipe',function(){})});
  $('sTick').addEventListener('click',function(){
    times(55,10,function(){SND.last=0;sfx.tick()});
  });
  $('sNoise').addEventListener('click',function(){sfx.burst()});
  $('sChord').addEventListener('click',function(){sfx.ok()});
  $('sBuzz').addEventListener('click',function(){sfx.err()});

  [].forEach.call(document.querySelectorAll('.acc'),function(d){
    d.addEventListener('toggle',function(){
      if(d.open){sfx.on();var a=d.querySelector('p');if(a)decode(a)}else sfx.off();
    });
  });

  /* ---- everything arrives broken: glitch-in on enter, text decodes left to right ---- */
  var NOISE='@%#*+=:./\\|-_<>';
  function textNodes(el){
    var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null),a=[],n;
    while((n=w.nextNode())){
      if(!n.nodeValue.trim())continue;
      var pa=n.parentNode;
      /* labels and legends are accessible names: scrambled, a screen reader
         would read the noise */
      if(pa.closest('.glyph,.bar,pre,.label,.check,label,legend,[aria-hidden="true"],[role="status"],output,#cardStatus,.btn,input'))continue;
      a.push(n);
    }
    return a;
  }
  function decode(el){
    if(reduce||el._dec)return;
    var nodes=textNodes(el);if(!nodes.length)return;
    var orig=nodes.map(function(n){return n.nodeValue}),total=0,f=0,frames=11;
    orig.forEach(function(o){total+=o.length});
    el._dec=every(38,function(){
      f++;var shown=total*f/frames,seen=0;
      nodes.forEach(function(n,k){
        var o=orig[k],out='',j;
        for(j=0;j<o.length;j++,seen++){
          var c=o.charAt(j);
          out+=(seen<shown||c===' '||c==='\n')?c:NOISE.charAt(Math.floor(Math.random()*NOISE.length));
        }
        n.nodeValue=out;
      });
      if(f>=frames){el._dec.stop();el._dec=null;nodes.forEach(function(n,k){n.nodeValue=orig[k]})}
    });
  }
  var RV='header .lede,header .row > *,section > p,section .demo .btn,.field-label,.field,.stack > .check,legend,'+
         '.slider > label,.slider-track,.slider output,.tablist:not(.views),.tabpanel,section .lift,.progress,.rules li,'+
         '.stat,.acc,pre.lab,.lab-h,.frame-demo,.badge,.alert,.tablewrap,.chart,.skel,.kpi,.hint,#inv,#sigText,.or,.avatar,.crumbs,.cal,.otp,.pager,.sepd,.sepl,.spins > span,.tgroup,.timeline > li,figure.pic,.wo > li,.side > li,.kbds > span,.kv,.steps,.ing,.stepper,.statbars,.tags,.profile > div > p,.count,.sw,.rampcells,.knobs > *,#rampSpec,#tokensOut,.phone';
  function reveal(el,i){
    /* Glitch off is the page's pause switch: things arrive, they do not glitch in */
    if(glitch()<=0){el.classList.add('in','done');if(el._anim)el._anim();return}
    el.style.setProperty('--d',(i*24)+'ms');
    el.classList.remove('done');el.classList.add('in');
    setTimeout(function(){
      /* one tick for the batch, not one per element */
      if(!i)sfx.tick();
      if(el._anim)el._anim();
      if(window.AUI2&&AUI2.frameDraw)AUI2.frameDraw(el);
      if(/^(P|LI|H3)$/.test(el.tagName))decode(el);
      else if(el.classList.contains('btn'))scramble(el);
    },i*48);
  }
  if(!reduce&&'IntersectionObserver' in window){
    var rvEls=[].slice.call(document.querySelectorAll(RV));
    rvEls.forEach(function(el){el.setAttribute('data-rv','')});
    root.classList.add('js-rv');
    document.addEventListener('animationend',function(e){
      if(e.animationName==='rvin')e.target.classList.add('done');
    });
    /* an entrance happens once. It used to re-arm when the element left the
       screen, so scrolling back up replayed thirty of them, with a tick each */
    var rio=new IntersectionObserver(function(entries){
      var k=0;
      /* the loader covers the page: boot()'s exit reveals what is on screen, once */
      if(root.classList.contains('aui-booting'))return;
      entries.forEach(function(en){
        var el=en.target;
        if(en.isIntersecting&&en.intersectionRatio>=0.12){
          rio.unobserve(el);if(el.classList.contains('in'))return;
          /* a jump scrolls past a whole view in one batch: what is already off
             screen again just settles, and the stagger for what you landed on
             is capped, so it does not wait behind everything it passed */
          var r=el.getBoundingClientRect();
          if(r.bottom<=0||r.top>=window.innerHeight){el.classList.add('in','done');if(el._anim)el._anim();if(window.AUI2&&AUI2.frameDraw)AUI2.frameDraw(el)}
          else reveal(el,Math.min(k++,8));
        }
      });
    },{threshold:[0,0.12],rootMargin:'0px 0px -5% 0px'});
    rvEls.forEach(function(el){rio.observe(el)});
    window._revealTree=function(panel){
      var k=0;
      if(panel.hasAttribute('data-rv')){panel.classList.remove('in','done');void panel.offsetWidth;reveal(panel,k++)}
      [].forEach.call(panel.querySelectorAll('[data-rv]'),function(el){
        el.classList.remove('in','done');void el.offsetWidth;reveal(el,k++);
      });
    };
  }

  window.AUI={onTap:onTap,heroWake:heroWake,ROW:ROW,backdropClose:backdropClose,$:$,G:G,rnd:rnd,rep:rep,RAMP:RAMP,reduce:reduce,glitch:glitch,jolt:jolt,kick:kick,spark:spark,bitmap:bitmap,
    scramble:scramble,setLabel:setLabel,announce:announce,rawFill:rawFill,develop:develop,titleFrame:titleFrame,titles:titles,say:say,wipe:function(cb){transition('wipe',cb)},hold:hold,free:free,showView:showView,
    currentTheme:currentTheme,layout:layout,colorize:colorize,barRow:barRow,pal:function(){return PAL},CH:function(){return CH},
    charWidth:charWidth,fit:fit,drawHero:drawHero,spin:function(x,y){spinX=x;spinY=y},tone:tone,noise:noise,sfx:sfx,SND:SND,
    decode:decode,reveal:reveal,flash:flash,fitTitles:fitTitles,live:sndLive,src:null,onLayout:null,HP:HP,TR:TR,setRamp:setRamp,rampString:function(){return rampNow},
    bindSlider:bindSlider,every:every,times:times,clock:clock,onScreen:onScreen,reseed:function(){seedScene();drawHero()},refresh:function(){readPalette();drawHero()}};
})();
