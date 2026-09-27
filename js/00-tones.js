/* character tones: every frame, rule and shadow is one of these strings */
window.AUI_TONES=function(){
  var M=window.AUI_MAP||{},m=function(c){return M[c]||c};
  var T={heavy:[m('@'),m('@')+m('@')],dense:[m('%'),m('%')+m('%')],mid:[m('#'),m('#')+m('#')],light:[m('='),m(':')+m(':')],
         shade:[m(':'),m(':')+m(':')],faint:['- ',': '],danger:['/','//'],error:['!','!!']};
  var css=':root{--k8:"'+m('@')+'";--k6:"'+m('#')+'";--k1:"'+m('.')+'";',k,i,H,V;
  for(k in T){
    H='';V='';
    /* 480 characters: a rule across a 3840px window at 8px a character */
    while(H.length<480)H+=T[k][0];
    for(i=0;i<90;i++)V+=T[k][1]+'\\A ';
    css+='--h-'+k+':"'+H+'";--s-'+k+':"'+T[k][1]+'";--v-'+k+':"'+V+'";';
  }
  css+='}';
  for(k in T)css+='.tone-'+k+'{--h:var(--h-'+k+');--s:var(--s-'+k+');--v:var(--v-'+k+')}';
  var st=document.getElementById('aui-tones');
  if(!st){st=document.createElement('style');st.id='aui-tones';document.head.appendChild(st)}
  st.textContent=css;
};
window.AUI_TONES();
