(function(){
'use strict';
const A=window.AUI,B=window.AUI2,$=A.$,rnd=A.rnd,rep=A.rep,reduce=A.reduce,sfx=A.sfx;
const {esc,clamp}=B;
const root=document.documentElement;
const live=()=>A.live();
const ping=(f,d)=>{if(live())A.tone('square',f,0,d||0.05,0.4)};
function copy(txt,what){
  const done=ok=>A.say(ok?'Copied '+what+'.':'Copy is blocked here. Select the text instead.');
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(()=>done(true),()=>done(false));else done(false);
}
A.copy=copy;

/* ================= themes: presets ================= */
const VARS=['bg','ink','muted','hot','pink','cy','ok','warn','deep','violet'],PICK=['bg','ink','hot','cy','ok','warn'];
function toHex(c){
  const m=c.match(/\d+(\.\d+)?/g);if(c[0]==='#')return c.length===4?'#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]:c.slice(0,7);
  if(!m)return '#000000';return '#'+m.slice(0,3).map(n=>('0'+Math.round(+n).toString(16)).slice(-2)).join('');
}
function readVar(k){return toHex(getComputedStyle(root).getPropertyValue('--'+k).trim())}
function syncPickers(){
  PICK.forEach(k=>{const v=readVar(k);$('c-'+k).value=v;$('h-'+k).textContent=v});
  let o=':root {\n';VARS.forEach(k=>{o+='  --'+k+': '+readVar(k)+';\n'});
  o+='  --ramp: "'+A.rampString().replace(/"/g,'')+'";\n}';$('tokensOut').textContent=o;
}
function applyPreset(p){
  PICK.concat(VARS).forEach(k=>root.style.removeProperty('--'+k));
  if(p==='signal'||p==='paper'){root.removeAttribute('data-preset');root.setAttribute('data-theme',p==='paper'?'light':'dark')}
  else{root.setAttribute('data-theme','dark');root.setAttribute('data-preset',p)}
  setTimeout(()=>{A.refresh();syncPickers()},30);
}
document.addEventListener('change',e=>{
  const el=e.target;if(el.name!=='preset')return;
  if(reduce||A.glitch()<=0)applyPreset(el.value);else A.wipe(()=>applyPreset(el.value));
});
PICK.forEach(k=>$('c-'+k).addEventListener('input',e=>{
  root.style.setProperty('--'+k,e.target.value);
  if(k==='hot')root.style.setProperty('--t2',e.target.value);
  if(k==='ink')root.style.setProperty('--t0',e.target.value);
  $('h-'+k).textContent=e.target.value;A.refresh();syncPickers();
}));
$('colReset').addEventListener('click',()=>{PICK.concat(['t0','t2']).forEach(k=>root.style.removeProperty('--'+k));A.refresh();syncPickers();A.kick()});
$('tokensCopy').addEventListener('click',()=>copy($('tokensOut').textContent,'the tokens'));
new MutationObserver(()=>setTimeout(syncPickers,40)).observe(root,{attributes:true,attributeFilter:['data-theme','data-preset']});

/* ================= the ramp editor ================= */
const CANON='.:=+*#%@';
const RAMPS=[['Classic','.:=+*#%@'],['Dots',".,:;!|I#"],['Math','.-~+=x%#'],['Letters','.:ilfKWM'],['Binary','.,:;01OB'],['Slash',".'-/|(XH"],['Money',".,:;c$S&"]];
const cellsEl=$('rampCells'),LBL=['1','2','3','4','5','6','7','8'];
cellsEl.innerHTML=LBL.map((l,i)=>'<label>'+l+'<span><input maxlength="1" value="'+esc(CANON[i])+'" data-i="'+i+'" aria-label="Ramp character '+l+' of 8" autocomplete="off" autocapitalize="off" spellcheck="false"></span></label>').join('');
const rampIns=[...cellsEl.querySelectorAll('input')];
$('rampPresets').innerHTML=RAMPS.map((r,i)=>'<button class="chip" type="button" data-r="'+i+'" aria-pressed="'+(i===0?'true':'false')+'">'+r[0]+'</button>').join('');
function setRamp(str,label){
  const bad=/[\s"\\<>&]/;let chars=str.split('').slice(0,8);
  if(chars.length<8||chars.some(c=>bad.test(c))||new Set(chars).size<8){$('rampStatus').textContent='Needs 8 different characters. No spaces, quotes, backslashes or angle brackets.';if(live())sfx.err();return false}
  A.setRamp(chars.join(''));
  rampIns.forEach((inp,i)=>{inp.value=chars[i]});
  $('rampSpec').innerHTML=A.colorize(A.barRow(12,false,12)+'  '+CANON.split('').reverse().join(' '))+'\n'+A.colorize(A.barRow(8,false,12));
  $('rampStatus').textContent=(label||'Custom')+' ramp: '+chars.join(' ');
  $('speed').dispatchEvent(new Event('change',{bubbles:true}));
  A.titles.forEach(p=>{if(p._b)A.titleFrame(p,99)});A.layout();syncPickers();A.kick();if(live())sfx.dev();
  return true;
}
$('rampPresets').addEventListener('click',e=>{
  const b=e.target.closest('.chip');if(!b)return;const r=RAMPS[+b.dataset.r];
  if(setRamp(r[1],r[0]))$('rampPresets').querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed',c===b?'true':'false'));
});
rampIns.forEach(inp=>inp.addEventListener('input',()=>{
  const s=rampIns.map(i=>i.value).join('');if(s.length<8)return;
  if(setRamp(s))$('rampPresets').querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed','false'));
}));
$('rampSpec').innerHTML=A.colorize(A.barRow(12,false,12)+'  '+CANON.split('').reverse().join(' '))+'\n'+A.colorize(A.barRow(8,false,12));

/* ================= play: the hero with the hood open ================= */
const hero=$('hero'),HP=A.HP,stage=$('playStage'),home=$('heroSrc');
function placeHero(){
  const on=$('v-play').getAttribute('aria-selected')==='true';
  if(on&&hero.parentNode!==stage)stage.appendChild(hero);
  else if(!on&&hero.parentNode===stage)home.parentNode.insertBefore(hero,home);
  A.layout();
}
document.querySelectorAll('[role="tablist"].views [role="tab"]').forEach(t=>t.addEventListener('click',()=>setTimeout(placeHero,430)));
const clean=s=>s.toUpperCase().replace(/[^A-Z0-9 \/\-\.!\?]/g,'').slice(0,8);
['pl1','pl2'].forEach((id,i)=>$(id).addEventListener('input',e=>{const v=clean(e.target.value);if(v!==e.target.value)e.target.value=v;HP[i?'t2':'t1']=v;A.layout();A.kick()}));
const KN={kSpeed:['speed',100],kSize:['rad',100],kSplit:['split',100],kTear:['tear',100],kStreaks:['streaks',1],kBlocks:['blocks',1]};
Object.keys(KN).forEach(id=>A.bindSlider($(id),(fr,v)=>{
  const k=KN[id];HP[k[0]]=v/k[1];if(k[0]==='streaks'||k[0]==='blocks')A.reseed();
}));
document.addEventListener('change',e=>{if(e.target.name==='kMap'){HP.map=+e.target.value;A.drawHero();ping(440)}});
$('kBurst').addEventListener('click',()=>{A.G.burst=1;A.jolt()});
$('kPhoto').addEventListener('click',()=>$('photoFile').click());
$('kSnap').addEventListener('click',()=>{
  try{const pal=A.pal(),c=document.createElement('canvas');c.width=hero.width;c.height=hero.height;const x=c.getContext('2d');x.fillStyle=pal.bg;x.fillRect(0,0,c.width,c.height);x.drawImage(hero,0,0);
    $('posterImg').src=c.toDataURL('image/png');const d=$('posterDlg');if(!d.open)d.showModal();if(live())sfx.ok()}
  catch(err){A.say('Snapshot is blocked for this picture.')}
});
$('kReset').addEventListener('click',()=>{
  const D={kSpeed:100,kSize:100,kSplit:100,kTear:100,kStreaks:38,kBlocks:9};
  Object.keys(D).forEach(id=>{$(id).value=D[id];$(id).dispatchEvent(new Event('change',{bubbles:true}))});
  $('pl1').value=HP.t1='ASCII';$('pl2').value=HP.t2='/UI';HP.map=0;document.querySelector('input[name="kMap"][value="0"]').checked=true;A.layout();A.jolt();
});

/* ================= code tab, complete: html + css + js, and the base install ================= */
const BASE=new Set(['frame','mid','demo','row','stack','vh','muted','status','in','done','u','doc','doc-panel','group','label','full','poster','ptitle']);
function allRules(){
  const out=[];
  [...document.styleSheets].forEach(sh=>{let rules;try{rules=sh.cssRules}catch(e){return}
    [...rules].forEach(r=>{if(r.type===1)out.push(r);else if(r.cssRules&&r.conditionText&&!/prefers-/.test(r.conditionText))[...r.cssRules].forEach(q=>{if(q.type===1)out.push({selectorText:q.selectorText,cssText:'@media '+r.conditionText+' { '+q.cssText+' }'})})})});
  return out;
}
let RULES=null;
function cssFor(panel,baseOnly){
  if(!RULES)RULES=allRules();
  const cls=new Set();
  if(baseOnly)['frame','mid'].forEach(c=>cls.add(c));
  else panel.querySelectorAll('[class]').forEach(e=>e.classList.forEach(c=>{if(!BASE.has(c)&&!/^tone-/.test(c))cls.add(c)}));
  if(!cls.size)return '';
  const res=[...cls].map(c=>new RegExp('\\.'+c.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&')+'(?![\\w-])'));
  const seen=new Set(),out=[];
  RULES.forEach(r=>{if(!r.selectorText||/^(main|body|html|:root|#nav|\.views|\.viewsbar|dialog)/.test(r.selectorText))return;
    if(res.some(re=>re.test(r.selectorText))&&!seen.has(r.cssText)){seen.add(r.cssText);out.push(r.cssText.replace(/\{\s*/,'{\n  ').replace(/;\s*(?!\s*})/g,';\n  ').replace(/\s*}$/,'\n}'))}});
  return out.join('\n');
}
const JSMAP={'s-calendar':'calendar','s-dropdown':'dropdown','s-otp':'otp','s-pagination':'pagination','s-spinner':'spinners'};
A.codeExtra=function(sec,p1){
  let h='';const css=cssFor(p1);
  if(css)h+='\n<h4>css</h4>'+esc(css)+'\n';
  const key=JSMAP[sec.getAttribute('aria-labelledby')],fn=key&&window.AUI_JS&&window.AUI_JS[key];
  if(fn)h+='\n<h4>js</h4><span class="dep">// uses the base helpers: $, ping, live, sfx, clamp</span>\n'+esc('('+fn.toString()+')();')+'\n';
  else h+='\n<h4>js</h4><span class="dep">// none. this one is html and css.</span>\n';
  return {html:h,text:(css?'/* css */\n'+css+'\n':'')+(fn?'/* js */\n('+fn.toString()+')();\n':'')};
};
(function install(){
  const kit=$('view-kit'),toc=kit.querySelector('.toc');if(!toc)return;
  const sec=document.createElement('section');sec.setAttribute('aria-labelledby','s-install');
  sec.setAttribute('data-span','full');   /* it opens the view, it is not a card */
  const tokens=()=>$('tokensOut').textContent;
  sec.innerHTML='<h2 id="s-install" class="vh">Installation</h2><p><b>Installation.</b> <span class="muted">There is no package. Paste the base once, then copy components one at a time and own the code.</span></p>'+
    '<ol class="demo timeline"><li><b>Tokens</b><span>Ten colors and the ramp. Tune them in Themes first.</span><div class="row demo"><button class="btn frame tone-light" type="button" data-cp="tokens"><span class="mid"><span class="label">Copy tokens</span></span></button></div></li>'+
    '<li class="past"><b>Frame engine</b><span>The css that turns a string into a border, and the script that builds the strings.</span><div class="row demo"><button class="btn frame tone-light" type="button" data-cp="frame"><span class="mid"><span class="label">Copy frame engine</span></span></button></div></li>'+
    '<li class="past"><b>Components</b><span>Open any Code tab below. It has the html, the css and the js.</span></li></ol>';
  toc.closest('section').after(sec);
  sec.addEventListener('click',e=>{
    const b=e.target.closest('[data-cp]');if(!b)return;
    if(b.dataset.cp==='tokens')copy(tokens(),'the tokens');
    else copy('/* frame engine */\n'+cssFor(null,true)+'\n\n<script>\n('+window.AUI_TONES.toString()+')();\n</script>','the frame engine');
  });
})();
syncPickers();
})();
