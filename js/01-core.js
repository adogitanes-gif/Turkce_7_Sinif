"use strict";
/* Türkçe 7 Oyunları · Helpers, content registry, misconception catalogue */
/* ================= helpers ================= */
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1};
const neg=n=>n<0?'−'+Math.abs(n):''+n;
const par=n=>n<0?'('+neg(n)+')':''+n;
const num=x=>{const r=Math.round(x*1000)/1000;return (r<0?'−':'')+String(Math.abs(r)).replace('.',',')};
const X='<i>x</i>';
/* pause-aware wait: time does not run while the briefing is paused */
const FAST=typeof location!=='undefined'&&/[?&]fast=1/.test(location.search);
const wait=ms=>FAST?Promise.resolve():new Promise(r=>{let left=ms,last=performance.now();const tick=()=>{const now=performance.now();if(!B.paused)left-=now-last;last=now;if(left<=0)r();else setTimeout(tick,Math.min(60,left))};setTimeout(tick,Math.min(60,Math.max(0,ms)))});
const RM=FAST||typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function frRaw(t,b){return `<span class="fr"><span class="fr-b"><span>${t}</span><span>${b}</span></span></span>`}
function fr(n,d,simplify=true){
  if(d<0){n=-n;d=-d}
  if(simplify){const g=gcd(n,d);n/=g;d/=g}
  if(d===1)return neg(n);
  return `<span class="fr">${n<0?'−':''}<span class="fr-b"><span>${Math.abs(n)}</span><span>${d}</span></span></span>`;
}
function lin(a,b){let s='';if(a!==0)s=(a===1?'':a===-1?'−':neg(a))+X;if(b!==0){s+=s?(b<0?' − ':' + ')+Math.abs(b):neg(b)}return s||'0'}
function terms(list){let s='';list.forEach(([c,v],i)=>{const body=(v&&Math.abs(c)===1?'':Math.abs(c))+(v?X:'');s+=i===0?(c<0?'−':'')+body:(c<0?' − ':' + ')+body});return s}
function choice(correct,wrongs){const seen=new Set([correct]);const w=[];for(const x0 of wrongs){const x=typeof x0==='string'?{h:x0,mis:null}:x0;if(!seen.has(x.h)){seen.add(x.h);w.push(x)}if(w.length===3)break}
  return shuffle([{html:correct,ok:true},...w.map(x=>({html:x.h,ok:false,mis:x.mis}))])}
const P=p=>p.map(v=>v.toFixed(1)).join(',');
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]], add2=(a,b)=>[a[0]+b[0],a[1]+b[1]], mul=(a,k)=>[a[0]*k,a[1]*k];
const len=a=>Math.hypot(a[0],a[1]), unit=a=>mul(a,1/len(a)), dot=(a,b)=>a[0]*b[0]+a[1]*b[1], cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const ST={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* ================= content registry: every js/units/u<N>.js file fills this ================= */
/* M is the misconception catalogue; each unit adds its own entries (keys u<N>_…). "other" catches the rest. */
const M={other:{m:'Dikkat Canavarı',c:'#a9acdf',t:'Dikkat hatası veya henüz sınıflanmamış hata',s:`Acele etme. Soruyu bir kez daha oku, her seçeneği düşün.`,d:`Bu hata belirli bir kavram yanılgısına uymuyor. Aynı konuda tekrar ederse dersin Öğren anlatımını yeniden izlemek ve kitaptaki sayfalara bakmak iyi olur.`,p:null}};
const FEN={units:{},lessons:[],unit(n,o){this.units[n]=o},mis(o){for(const k in o)M[k]={p:null,...o[k]}},lesson(o){if(o.script)o.script=fitScenes(o.script).map(([n,sp,ops])=>[n,sp,layerOps(ops||[])]);this.lessons.push(o)}};
/* one big drawing per board: a scene that holds two big drawings is split in two (its narration divided by sentences),
   and a lesson title that shares the board with a drawing becomes a caption line at the bottom */
const BIGOPS=new Set(['cards','chain','table','source','compare','cycle','timeline','map','pic','ekler']),MEDOPS=new Set(['lines','rules','eq']);
const splitSpeech=sp=>{const S=(sp.match(/[^.!?…]+[.!?…]+["”’]?\s*/g)||[sp]).map(x=>x.trim()).filter(Boolean),h=Math.ceil(S.length/2);return [S.slice(0,h).join(' '),S.slice(h).join(' ')]};
function fitScenes(script){const out=[];
  for(const sc of script){let [n,sp,ops]=sc;ops=(ops||[]).slice();
    const ti=ops.findIndex(o=>o[0]==='title');
    if(ti>=0&&ops.some(o=>!['title','txt','trap','tip','wait'].includes(o[0])))ops[ti]=['txt',ops[ti][1],425,' st-gold'];
    /* a TUZAK/İPUCU stamp gets its own board when the board already holds a drawing or a list */
    const stamps=ops.filter(o=>o[0]==='trap'||o[0]==='tip');let tail=null;
    if(stamps.length&&ops.some(o=>BIGOPS.has(o[0])||MEDOPS.has(o[0]))){ops=ops.filter(o=>!stamps.includes(o));tail=stamps}
    let rest=ops,speech=sp;const parts=[];
    for(;;){const blocks=rest.map((o,i)=>BIGOPS.has(o[0])||MEDOPS.has(o[0])?i:-1).filter(i=>i>=0);
      const hasBig=blocks.some(i=>BIGOPS.has(rest[i][0]));
      if(blocks.length<2||!hasBig){parts.push(rest);break}
      parts.push(rest.slice(0,blocks[1]));rest=rest.slice(blocks[1])}
    if(tail)parts.unshift(tail);
    /* narration shared out by sentences, in order */
    let left=speech;parts.forEach((p,k)=>{let say;if(k===parts.length-1)say=left;else{const [a,b]=splitSpeech(left);say=a;left=b}out.push([n,say||'Bir de buna bakalım.',p])})}
  return out}
/* draw order inside a scene: drawings and boxes first, then caption lines, then the TUZAK/İPUCU stamp,
   so captions and stamps always see what is on the board and can move to a free spot (order within a group kept) */
function layerOps(ops){const r=op=>op[0]==='trap'||op[0]==='tip'?2:op[0]==='txt'?1:0;return ops.map((op,i)=>[op,i]).sort((a,b)=>r(a[0])-r(b[0])||a[1]-b[1]).map(x=>x[0])}
const SK1={};
