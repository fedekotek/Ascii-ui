(function(){
'use strict';
const A=window.AUI,B=window.AUI2,$=A.$,rnd=A.rnd,rep=A.rep,reduce=A.reduce,sfx=A.sfx;
const {esc,clamp}=B;
const root=document.documentElement;
const live=()=>A.live();
const ping=(f,d)=>{if(live())A.tone('square',f,0,d||0.05,0.4)};
function copy(txt,what){
  const done=ok=>ok?A.say('Copied '+what+'.'):A.say('Copy is blocked here. Select it and copy by hand.',true);
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

/* ================= home: the hero and the game ================= */
const header=document.querySelector('main > header');
/* The header is Home's and nobody else's: every other view starts with its own
   content right under the bar, and ends with one line instead of the game. */
function placeHero(){
  const home=$('v-home').getAttribute('aria-selected')==='true';
  header.hidden=!home;$('footGame').hidden=!home;$('footLine').hidden=home;
  A.layout();
}
A.onView=placeHero;
/* go to a view and land on something in it */
function goTo(view,el,block,then){
  /* a section goes through the router (js/70), so it lands under the bar and
     gets an address; anything else is scrolled to once the view shows */
  const N=window.AUI_NAV;
  if(N&&el.matches('section[aria-labelledby]')){N.go(view,el,{push:true,after:then});return}
  if(N){N.go(view,null,{push:true,el:el,block:block,after:then});return}
  el.scrollIntoView({block:block||'start'});if(then)then();
}
A.goTo=goTo;
$('heroSee').addEventListener('click',()=>{const N=window.AUI_NAV;if(N)N.go('kit',null,{push:true,top0:true});else $('v-kit').click();A.kick()});
$('heroKit').addEventListener('click',()=>{const h=$('s-install');if(h)goTo('kit',h.parentNode);if(A.live())sfx.ok()});
/* the tiles are links, so they work without js; with it they go through the router */
document.querySelector('#view-home .tiles').addEventListener('click',e=>{
  const a=e.target.closest('a.tile');if(!a||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  e.preventDefault();const N=window.AUI_NAV;if(N)N.go(a.dataset.v,null,{push:true,top0:true});else $('v-'+a.dataset.v).click();
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
  RULES.forEach(r=>{if(!r.selectorText||/^(main|body|html|:root|#nav|#views|#sidenav|#menuDlg|#soundBar|\.menu-|\.views|\.viewsbar|\.barctl|\.topbar|dialog|#boot)/.test(r.selectorText))return;
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
  /* Get the kit is where you end up once you have seen the components, so it
     closes the view, just before the rules. The id stays s-install. */
  const kit=$('view-kit'),rules=$('s-rules');if(!rules)return;
  const sec=document.createElement('section');sec.setAttribute('aria-labelledby','s-install');
  sec.setAttribute('data-span','full');   /* a set of steps, not a card */
  const tokens=()=>$('tokensOut').textContent;
  sec.innerHTML='<h2 id="s-install" class="vh">Get the kit</h2><p><span class="muted">There is no package. Paste the base once, then copy components one at a time and own the code.</span></p>'+
    '<ol class="demo timeline"><li><b>Tokens</b><span>Six color roles, four support shades and the ramp. The defaults are fine, Themes is where you change them.</span><div class="row demo"><button class="btn frame tone-light" type="button" data-cp="tokens"><span class="mid"><span class="label">Copy tokens</span></span></button></div></li>'+
    '<li class="past"><b>Frame engine</b><span>The css that turns a string into a border, and the script that builds the strings.</span><div class="row demo"><button class="btn frame tone-light" type="button" data-cp="frame"><span class="mid"><span class="label">Copy frame engine</span></span></button></div></li>'+
    '<li class="past"><b>Components</b><span>Open any Code tab below. It has the html, the css and the js.</span></li></ol>';
  kit.insertBefore(sec,rules.parentNode);
  sec.addEventListener('click',e=>{
    const b=e.target.closest('[data-cp]');if(!b)return;
    if(b.dataset.cp==='tokens')copy(tokens(),'the tokens');
    else copy('/* frame engine */\n'+cssFor(null,true)+'\n\n<script>\n('+window.AUI_TONES.toString()+')();\n</script>','the frame engine');
  });
})();
syncPickers();
})();
