"use strict";
/* Türkçe 7 Oyunları · Engine: sound, narration, shop, home, game engine, overlays, briefing scenes, 3D, lesson player, drawings */
/* ================= sound (Web Audio, starts after a tap) ================= */
const SND={ctx:null,on:ST.get('t7-sound',true)};
function tone(f,dur,type='square',vol=.07,when=0,to=null){
  if(!SND.on)return;try{SND.ctx=SND.ctx||new (window.AudioContext||window.webkitAudioContext)();const c=SND.ctx,t=c.currentTime+when,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur+.02)}catch(e){}}
function sfx(k){
  if(k==='coin'){tone(988,.08,'square',.06);tone(1319,.28,'square',.06,.08)}
  if(k==='tick')tone(1760,.05,'square',.03);
  if(k==='wrong')tone(220,.35,'sawtooth',.06,0,110);
  if(k==='boing'){tone(180,.18,'sine',.25,0,700);tone(700,.3,'sine',.2,.18,240)}
  if(k==='whoosh')tone(900,.3,'triangle',.08,0,200);
  if(k==='hop')tone(520,.12,'square',.04,0,880);
  if(k==='combo')[523,659,784,1047].forEach((f,i)=>tone(f,.16,'square',.05,i*.08));
  if(k==='start')[392,523,659,784,1047].forEach((f,i)=>tone(f,.14,'triangle',.07,i*.07));
  if(k==='star')tone(1200,.2,'triangle',.07,0,1800);
  if(k==='flip')tone(300,.15,'triangle',.07,0,900);
  if(k==='zap'){tone(1400,.09,'sawtooth',.06,0,180);tone(900,.12,'square',.05,.06,120);tone(2200,.05,'square',.04,.14,600);tone(160,.25,'sawtooth',.05,.2,60)}
  if(k==='zapup'){tone(600,.12,'square',.05,0,1800);tone(1800,.18,'triangle',.05,.1,2600)}
}

/* ================= narration (Turkish voice if the device has one) ================= */
const VOICE={on:ST.get('t7-voice',true),v:null};
/* male narrator: prefer a male Turkish voice (Tolga on Windows, Ahmet in Edge), avoid known female ones; the choice is remembered */
const FEMALE=/emel|seda|yelda|filiz|zeynep|female|kad[ıi]n/i,MALE=/tolga|ahmet|male|erkek/i;
/* Some tablets (many Android ones) report their voices late or never list them at all, yet still speak Turkish with lang=tr-TR.
   DEV = "use the device's own default voice": only when the device lists no voices at all (a list without Turkish means Turkish is not installed). */
const DEV={name:'Cihaz sesi',dev:true,localService:true};
function pickVoice(){try{const all=speechSynthesis.getVoices(),vs=all.filter(v=>/^tr(-|_|$)/i.test(v.lang)||/turk|türk/i.test(v.name));VOICE.list=vs;VOICE.all=all.length;
  if(!vs.length){VOICE.v=('speechSynthesis' in window&&!all.length&&VOICE.tries>=6)?DEV:null;return}const saved=ST.get('t7-voicename',null);
  /* offline: online voices (Edge "Ahmet Online (Natural)") cannot speak, so only installed voices count; online: Ahmet first */
  const use=navigator.onLine===false?vs.filter(v=>v.localService!==false):vs,pool=use.length?use:vs;
  /* Ahmet wins whenever he can speak, unless another voice was picked by hand while Ahmet was on the list (m7-voiceok) */
  const ahmet=pool.find(v=>/ahmet/i.test(v.name)),hand=saved&&ST.get('t7-voiceok',false);
  VOICE.v=(ahmet&&!hand?ahmet:null)||pool.find(v=>v.name===saved)||ahmet||pool.find(v=>MALE.test(v.name))||pool.find(v=>!FEMALE.test(v.name))||pool[0]||null}catch(e){VOICE.v=null;VOICE.list=[]}}
/* the internet comes and goes: re-pick the voice so the game returns to Ahmet as soon as it can (Edge reloads its online voices a moment later) */
['online','offline'].forEach(ev=>window.addEventListener(ev,()=>{pickVoice();[1500,5000,12000].forEach(t=>setTimeout(pickVoice,t))}));
const vName=()=>VOICE.v?VOICE.v.name.replace(/^Microsoft\s+/,'').replace(/\s*[-–(].*$/,'').trim():'Türkçe ses yok';
const vMale=()=>!!VOICE.v&&!FEMALE.test(VOICE.v.name);
VOICE.tries=0;
try{pickVoice();speechSynthesis.onvoiceschanged=()=>{pickVoice();window.dispatchEvent(new Event('m7voice'))};speechSynthesis.addEventListener?.('voiceschanged',pickVoice)}catch(e){}
/* keep asking for a few seconds: some browsers fill the voice list late and never send "voiceschanged" */
[300,800,1500,2500,4000,6500].forEach(t=>setTimeout(()=>{VOICE.tries++;if(!VOICE.v||VOICE.v.dev)pickVoice();window.dispatchEvent(new Event('m7voice'))},t));
/* speaking time estimate (timeline and no-voice mode): the Turkish voice at the calm rate says about 13 letters a second */
const est=t=>(700+t.length*78)/(B.rate||1);
/* Turkish maths pronunciation: fractions as "dörtte üç", decimals as "virgül", units in full words */
const LOC={2:'ikide',3:'üçte',4:'dörtte',5:'beşte',6:'altıda',7:'yedide',8:'sekizde',9:'dokuzda',10:'onda',11:'on birde',12:'on ikide',20:'yirmide',25:'yirmi beşte',30:'otuzda',100:'yüzde',360:'üç yüz altmışta'};
const fracWords=(a,b)=>LOC[b]?`${LOC[b]} ${a}`:`${a} bölü ${b}`;
const UNITS=[['cm³','santimetreküp'],['dm³','desimetreküp'],['m³','metreküp'],['cm²','santimetrekare'],['m²','metrekare'],['mL','mililitre'],['km','kilometre'],['kg','kilogram'],['cm','santimetre'],['TL','lira']];
function speechText(s){
  s=s.replace(/\(sav\)/g,' sallallahu aleyhi ve sellem ').replace(/\(cc\)/g,'').replace(/\(ra\)/g,'').replace(/\(as\)/g,' aleyhisselam ').replace(/\bHz\.\s*/g,'Hazreti ')
  s=s.replace(/\|([^|]+)\|/g,' mutlak değer $1 ')
   .replace(/(\d+)\s*([¼½¾])/g,(m,w,f)=>f==='½'?`${w} buçuk`:`${w} tam ${f==='¼'?'dörtte 1':'dörtte 3'}`)
   .replace(/¼/g,' dörtte 1 ').replace(/¾/g,' dörtte 3 ').replace(/½/g,' yarım ')
   .replace(/(\d+)\s*\/\s*(\d+)/g,(m,a,b)=>' '+fracWords(a,+b)+' ')
   .replace(/(\d)̅/g,'$1 devirli ')
   .replace(/(\d),(\d)/g,'$1 virgül $2')
   .replace(/%\s?(\d+)/g,' yüzde $1 ').replace(/°/g,' derece');
  for(const [u,w] of UNITS)s=s.replace(new RegExp('(^|[\\s\\d(])'+u+'(?=$|[\\s.,;:!?)\'’/])','g'),'$1 '+w);
  return s.replace(/(\d)\s*L(?=$|[\s.,;:!?)'’])/g,'$1 litre').replace(/²/g,' kare').replace(/³/g,' küp').replace(/e⁻/g,'elektron')
   .replace(/(\d)x\b/g,'$1 iks').replace(/(^|\s)x(?=\s|$|[.,;:!?)'’])/g,'$1iks')
   .replace(/−/g,' eksi ').replace(/·/g,' çarpı ').replace(/ : /g,' bölü ').replace(/\//g,' bölü ')
   .replace(/≥/g,' büyük eşittir ').replace(/≤/g,' küçük eşittir ').replace(/≠/g,' eşit değildir ').replace(/>/g,' büyüktür ').replace(/</g,' küçüktür ').replace(/=/g,' eşittir ')
   .replace(/×/g,' çarpı ').replace(/≈/g,' yaklaşık ').replace(/[₀-₉]/g,d=>' '+'0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(d)]+' ')
   .replace(/\+/g,' artı ').replace(/[()|✗✕]/g,' ').replace(/→/g,', ').replace(/\s+/g,' ').trim()}
/* Smooth narration. Whole sentences are grouped into pieces of up to ~200 letters (very long utterances can be cut off; very short
   ones make the Windows voice stop and restart), and all pieces are queued at once so the voice plays them back to back with its own
   natural sentence pauses. Natural pitch (changing pitch degrades this voice), calm rate. The step waits for the last piece to end;
   the safety timer only covers a lost "end" event and never runs while paused. */
function speechChunks(text){const sents=speechText(text).split(/(?<=[^\d\s][.!?…])\s+/).map(s=>s.trim()).filter(Boolean),out=[];let cur='';
  for(const s of sents){if(cur&&(cur.length+s.length+1)>200){out.push(cur);cur=s}else cur=cur?cur+' '+s:s}if(cur)out.push(cur);return out}
function say(text,force=false){ try{if(navigator.onLine&&!(VOICE.v&&/ahmet/i.test(VOICE.v.name)))pickVoice()}catch(e){}
  if((!VOICE.on&&!force)||!VOICE.v||!('speechSynthesis' in window))return wait(est(text));
  return new Promise(res=>{const parts=speechChunks(text);let left=parts.length,done=false;const fin=()=>{if(!done){done=true;res()}};if(!left){fin();return}
    try{for(const p of parts){const u=new SpeechSynthesisUtterance(p);u.lang='tr-TR';if(!VOICE.v.dev)u.voice=VOICE.v;u.rate=.9*(B.rate||1);u.pitch=1;u.volume=1;
        u.onend=u.onerror=()=>{if(--left<=0)fin()};speechSynthesis.speak(u)}
      wait(2*est(text)+8000).then(fin)}catch(e){wait(est(text)).then(fin)}})
}
function hush(){try{speechSynthesis.cancel();speechSynthesis.resume()}catch(e){}}
function toggleFull(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{})}catch(e){}}
const IC={
 play:'<path d="M8 5v14l11-7z"/>',pause:'<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>',
 prev:'<path d="M6 5h2v14H6zM20 5v14L9 12z"/>',next:'<path d="M16 5h2v14h-2zM4 5v14l11-7z"/>',
 first:'<path d="M4 5h2v14H4zM13 5v14L7 12zM21 5v14l-7-7z"/>',
 replay:'<path d="M12 5V1.5L7 6l5 4.5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/>',
 full:'<path d="M4 4h6v2H6v4H4zM14 4h6v6h-2V6h-4zM4 14h2v4h4v2H4zM18 14h2v6h-6v-2h4z"/>',
 voice:'<path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 sound:'<path d="M9 17V5l10-2v12" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="7" cy="17" r="3"/><circle cx="17" cy="15" r="3"/>',
 book:'<path d="M3 5h7a3 3 0 0 1 2 1v14a3 3 0 0 0-2-1H3zM21 5h-7a3 3 0 0 0-2 1v14a3 3 0 0 1 2-1h7z"/>',
 home:'<path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/>',
 auto:'<path d="M4 12a8 8 0 0 1 14-5.3V4h2v6h-6V8h2.9A6 6 0 0 0 6 12zm16 0a8 8 0 0 1-14 5.3V20H4v-6h6v2H7.1A6 6 0 0 0 18 12z"/>'};
const ic=k=>`<svg class="ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${IC[k]}</svg>`;

/* ================= wallet, shop, log ================= */
const HEROC={'c-tr':['Türk Kırmızısı','#e30a17',0],'c-cyan':['Neon Mavi','#22e4ff',0],'c-pink':['Neon Pembe','#ff4fd8',60],'c-green':['Zümrüt','#3dffa2',80],'c-gold':['Altın Robot','#ffc83d',200]};
const HATS={'h-fes':['Ay-Yıldızlı Fes',0],'h-none':['Şapkasız',0],'h-cap':['Kep',50],'h-helmet':['Uzay Kaskı',120],'h-crown':['Taç',150]};
const SLIPS={'s-blue':['Mavi Terlik','#4f8bff',0],'s-gold':['Altın Terlik','#ffc83d',100],'s-silver':['Gümüş Terlik','#c9d3e0',180]};
const shop=()=>{const d={owned:['c-tr','c-cyan','h-fes','h-none','s-blue'],hero:'c-tr',hat:'h-fes',slip:'s-blue'};let s=ST.get('t7-shop',d);const LEGACY_SLIP='s-rain'+'bow';if(s.owned.includes(LEGACY_SLIP)||s.slip===LEGACY_SLIP){s.owned=[...new Set(s.owned.map(x=>x===LEGACY_SLIP?'s-silver':x))];if(s.slip===LEGACY_SLIP)s.slip='s-silver';ST.set('t7-shop',s)}
  if(!ST.get('t7-tr',false)){/* one-time: give the Türkiye look to an existing player too (still changeable in the shop) */
    s.owned=[...new Set([...s.owned,'c-tr','h-fes'])];s.hero='c-tr';s.hat='h-fes';ST.set('t7-shop',s);ST.set('t7-tr',true)}
  if(!HEROC[s.hero])s.hero='c-tr';if(!HATS[s.hat])s.hat='h-none';return s};
const wallet=()=>ST.get('t7-coins',0);
function addCoins(n){ST.set('t7-coins',wallet()+n);if(n>0)ST.set('t7-earned',ST.get('t7-earned',0)+n)}
function logAnswer(e){const L=ST.get('t7-log',[]);L.push(e);ST.set('t7-log',L.slice(-3000))}
function heroSVG(o){o=o||shop();const c=HEROC[o.hero][1];let hat='';
  if(o.hat==='h-fes')hat=`<path d="M-23 -87 L-17 -116 Q0 -120 17 -116 L23 -87 Q0 -83 -23 -87 Z" fill="#e30a17" stroke="#0a0920" stroke-width="3" stroke-linejoin="round"/>
   <path d="M-17 -116 Q0 -120 17 -116" fill="none" stroke="#8a0010" stroke-width="2"/>
   <circle cx="-3" cy="-101" r="7.2" fill="#fff"/><circle cx="-1.2" cy="-101" r="5.8" fill="#e30a17"/>
   <path d="M7.6 -104.2 L8.5 -101.5 L11.3 -101.5 L9 -99.8 L9.9 -97.1 L7.6 -98.8 L5.3 -97.1 L6.2 -99.8 L3.9 -101.5 L6.7 -101.5 Z" fill="#fff" transform="rotate(-18 7.6 -100.6)"/>
   <path d="M0 -118 Q18 -118 25 -104" fill="none" stroke="#0a0920" stroke-width="2.5" stroke-linecap="round"/><path d="M22 -106 L28 -94 L23 -95 L20 -93 Z" fill="#0a0920"/>`;
  if(o.hat==='h-cap')hat=`<path d="M-27 -88 Q-24 -112 0 -112 Q24 -112 27 -88 Z" fill="#ff4fd8" stroke="#0a0920" stroke-width="3"/><path d="M14 -90 L44 -88 L27 -96 Z" fill="#ff4fd8" stroke="#0a0920" stroke-width="3"/>`;
  if(o.hat==='h-crown')hat=`<path d="M-24 -88 L-26 -114 L-12 -100 L0 -118 L12 -100 L26 -114 L24 -88 Z" fill="#ffc83d" stroke="#0a0920" stroke-width="3"/><circle cx="0" cy="-104" r="3" fill="#ff4fd8"/>`;
  if(o.hat==='h-helmet')hat=`<circle cx="0" cy="-68" r="38" fill="rgba(180,240,255,.16)" stroke="#bff6ff" stroke-width="3"/><path d="M-22 -92 Q-10 -100 4 -98" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`;
  return `<g class="hero"><line x1="0" y1="-88" x2="0" y2="-102" stroke="#cbd2ff" stroke-width="3"/><circle cx="0" cy="-105" r="5" fill="#ffc83d"/>
  <path d="M-20 -40 L-34 -22" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M20 -40 L34 -22" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
  <rect x="-16" y="-14" width="11" height="14" rx="3" fill="#cbd2ff"/><rect x="5" y="-14" width="11" height="14" rx="3" fill="#cbd2ff"/>
  <rect x="-21" y="-48" width="42" height="36" rx="9" fill="${c}" stroke="#0a0920" stroke-width="3"/><text x="0" y="-23" text-anchor="middle" style="font-family:var(--f-brand);font-size:16px;fill:#0a0920">7</text>
  <rect x="-27" y="-90" width="54" height="42" rx="13" fill="${c}" stroke="#0a0920" stroke-width="3"/><rect x="-19" y="-80" width="38" height="21" rx="8" fill="#0a0920"/>
  <circle class="eye" cx="-8" cy="-69" r="4.5" fill="#7df9ff"/><circle class="eye" cx="8" cy="-69" r="4.5" fill="#7df9ff"/>${hat}</g>`}
function heroBox(o,vb='-60 -125 120 135'){return `<svg viewBox="${vb}" aria-hidden="true">${heroSVG(o)}</svg>`}
function slipperSVG(fill){return `<g><path d="M-30 -9 Q-34 0 -28 9 Q0 15 26 10 Q36 0 26 -10 Q0 -16 -30 -9 Z" fill="${fill}" stroke="#0a0920" stroke-width="3"/><path d="M-6 -12 Q4 -26 14 -12" fill="none" stroke="#0a0920" stroke-width="6"/><path d="M-6 -12 Q4 -26 14 -12" fill="none" stroke="#fff" stroke-width="2.5"/></g>`}
const SHOPDEFS='';

/* ================= animated background: maths symbols (Karanlık/Aydınlık) or a circuit board with electrons (Elektron) ================= */
const BGFX=(function(){
  const cv=document.getElementById('bgfx'),cx=cv.getContext('2d');let W=0,H=0,dpr=1,mode='dark',ps=[],traces=[],chips=[],els=[],raf=0;
  const G0=['✦','✧','☾','★','◇','❖','✺','⬡','🌴','🐪','⭐','🌙','⛰️','🏜️'];
  const COL={dark:['#22e4ff','#ff4fd8','#ffc83d','#9b7bff','#3dffa2'],light:['#0b86d1','#cf2f97','#d98a00','#6447ff','#0f9156']};
  function glyphs(){ps=[];for(let i=0;i<26;i++)ps.push({x:Math.random(),y:Math.random(),s:14+Math.random()*26,v:.00012+Math.random()*.00035,r:Math.random()*6,vr:(Math.random()-.5)*.004,g:pick(G0),c:pick(COL[mode]||COL.dark),a:.12+Math.random()*.22})}
  function pcb(){traces=[];chips=[];els=[];const st=34*dpr,cols=Math.ceil(W/st),rows=Math.ceil(H/st),D=[[1,0],[0,1],[-1,0],[0,-1]];
    const n=Math.min(170,Math.round(cols*rows/12));
    for(let t=0;t<n;t++){let x=ri(0,cols),y=ri(0,rows),d=pick(D);const pts=[[x*st,y*st]];const L=ri(3,10);
      for(let k=0;k<L;k++){if(Math.random()<.28){x+=d[0]||pick([-1,1]);y+=d[1]||pick([-1,1])}else{x+=d[0];y+=d[1]}pts.push([x*st,y*st]);if(Math.random()<.22)d=pick(D)}
      const segs=[];let tot=0;for(let k=1;k<pts.length;k++){const l=Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]);segs.push(l);tot+=l}
      const tr={pts,segs,tot};traces.push(tr);if(Math.random()<.55)els.push({tr,f:Math.random(),v:.0015+Math.random()*.004})}
    const nc=Math.max(2,Math.round(W*H/(dpr*dpr*300000)));for(let i=0;i<nc;i++)chips.push({x:Math.random()*W,y:Math.random()*H,w:(70+Math.random()*90)*dpr,h:(44+Math.random()*50)*dpr})}
  function at(tr,f){let d=f*tr.tot;for(let k=0;k<tr.segs.length;k++){if(d<=tr.segs[k]||k===tr.segs.length-1){const a=tr.pts[k],b=tr.pts[k+1],u=tr.segs[k]?Math.min(1,d/tr.segs[k]):0;return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u]}d-=tr.segs[k]}return tr.pts[0]}
  function drawPCB(){cx.clearRect(0,0,W,H);cx.lineCap='round';cx.lineJoin='round';
    const rr=(x,y,w,h,r)=>{cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()};
    cx.strokeStyle='rgba(18,130,110,.16)';cx.lineWidth=2*dpr;
    traces.forEach(t=>{cx.beginPath();cx.moveTo(t.pts[0][0],t.pts[0][1]);for(let k=1;k<t.pts.length;k++)cx.lineTo(t.pts[k][0],t.pts[k][1]);cx.stroke()});
    traces.forEach(t=>{for(const p of [t.pts[0],t.pts[t.pts.length-1]]){cx.beginPath();cx.arc(p[0],p[1],3.6*dpr,0,7);cx.fillStyle='#ffffff';cx.fill();cx.strokeStyle='rgba(201,138,60,.55)';cx.lineWidth=1.6*dpr;cx.stroke()}});
    chips.forEach(c=>{cx.fillStyle='rgba(185,200,196,.7)';for(let p=c.x+10*dpr;p<c.x+c.w-8*dpr;p+=13*dpr){cx.fillRect(p,c.y-6*dpr,4*dpr,6*dpr);cx.fillRect(p,c.y+c.h,4*dpr,6*dpr)}
      cx.shadowColor='rgba(16,48,43,.12)';cx.shadowBlur=14*dpr;cx.shadowOffsetY=4*dpr;rr(c.x,c.y,c.w,c.h,8*dpr);cx.fillStyle='#ffffff';cx.fill();
      cx.shadowBlur=0;cx.shadowOffsetY=0;cx.strokeStyle='rgba(18,130,110,.22)';cx.lineWidth=1.2*dpr;cx.stroke();
      cx.beginPath();cx.arc(c.x+10*dpr,c.y+10*dpr,2.4*dpr,0,7);cx.fillStyle='rgba(18,130,110,.35)';cx.fill()});
    cx.shadowColor='rgba(10,155,224,.9)';cx.shadowBlur=10*dpr;cx.fillStyle='#0a9be0';
    els.forEach(e=>{const p=at(e.tr,e.f);cx.beginPath();cx.arc(p[0],p[1],2.6*dpr,0,7);cx.fill()});cx.shadowBlur=0}
  function drawG(){cx.clearRect(0,0,W,H);ps.forEach(p=>{cx.save();cx.translate(p.x*W,p.y*H);cx.rotate(p.r);cx.globalAlpha=p.a;cx.fillStyle=p.c;cx.font=`700 ${p.s*dpr}px "JetBrains Mono", monospace`;cx.fillText(p.g,0,0);cx.restore()})}
  const draw=()=>(mode==='elektron'?drawPCB:drawG)();
  function frame(){if(mode==='elektron')els.forEach(e=>{e.f+=e.v;if(e.f>1)e.f=0});else ps.forEach(p=>{p.y-=p.v*16;p.r+=p.vr;if(p.y<-.05){p.y=1.05;p.x=Math.random()}});draw();raf=requestAnimationFrame(frame)}
  function resize(){dpr=devicePixelRatio||1;W=cv.width=innerWidth*dpr;H=cv.height=innerHeight*dpr;if(mode==='elektron')pcb();if(RM)draw()}
  addEventListener('resize',resize);
  return {set(m){mode=m;if(m!=='elektron')glyphs();resize();if(RM)draw();else if(!raf)raf=requestAnimationFrame(frame)}};
})();
const SKINS={dark:'Karanlık',light:'Aydınlık'};
const skin=()=>document.documentElement.getAttribute('data-skin')||'dark';
function applySkin(s){if(!SKINS[s])s='dark';document.documentElement.setAttribute('data-skin',s);ST.set('t7-skin',s);BGFX.set(s)}
applySkin(SKINS[ST.get('t7-skin','dark')]?ST.get('t7-skin','dark'):'dark');

/* ================= hub ================= */
const app=document.getElementById('app');
const starsOf=s=>s>=9?3:s>=7?2:s>=5?1:0;
const starStr=n=>'★'.repeat(n)+'☆'.repeat(3-n);
function goalBar(){const g=ST.get('t7-goal',{target:500,reward:'Aile ödülü',base:0});const got=Math.max(0,ST.get('t7-earned',0)-g.base);const pc=Math.min(100,Math.round(got/g.target*100));
  return `<div class="goal"><span>Aile ödülü: <b style="color:var(--ink)">${g.reward}</b> · ${Math.min(got,g.target)} / ${g.target} altın</span><div class="gbar"><i style="width:${pc}%"></i></div></div>`}
/* ================= Bugünün görevi: daily mission with spaced review, planned from his own answers ================= */
/* Each lesson's memory state comes from the answer log: accuracy of its last 10 answers and days since it was last practised.
   Review interval (expanding, Leitner-style): 1 day if accuracy < 70 %, 3 days if 70–89 %, 7 days if 90 % or more. */
const dayKey=(t=Date.now())=>new Date(t).toLocaleDateString('sv');
function srsState(){const now=Date.now(),st={};for(const e of ST.get('t7-log',[])){if(!e.ls)continue;const s=st[e.ls]||(st[e.ls]={n:0,last:0,recent:[]});s.n++;s.last=Math.max(s.last,e.d||0);s.recent.push(e.ok?1:0);if(s.recent.length>10)s.recent.shift()}
  for(const id in st){const s=st[id];s.acc=s.recent.reduce((a,b)=>a+b,0)/s.recent.length;s.days=(now-s.last)/864e5;s.interval=s.acc>=.9?7:s.acc>=.7?3:1;
    s.weak=s.recent.length>=3&&s.acc<.7;s.due=s.days>=s.interval;s.next=Math.max(0,s.interval-s.days)}return st}
function makePlan(){const S0=srsState(),play=LESSONS.filter(l=>l.gen),ids=[],why={},add=(l,w,n)=>{for(let i=0;i<n;i++)ids.push(l.id);if(!why[l.id])why[l.id]=w};
  play.filter(l=>S0[l.id]&&S0[l.id].weak).sort((a,b)=>S0[a.id].acc-S0[b.id].acc).slice(0,2).forEach(l=>add(l,'zayıf konu',2));
  play.filter(l=>S0[l.id]&&!S0[l.id].weak&&S0[l.id].due).sort((a,b)=>S0[b.id].days-S0[a.id].days).slice(0,3).forEach(l=>add(l,`tekrar zamanı · ${Math.max(1,Math.round(S0[l.id].days))} gün önce`,1));
  const fresh=play.find(l=>!S0[l.id]||(S0[l.id].recent.length<3&&S0[l.id].acc<.7));if(fresh)add(fresh,'sıradaki yeni ders',2);
  const seen=play.filter(l=>S0[l.id]),pool=seen.length?seen:play.slice(0,6);while(ids.length<10)add(pick(pool),'karışık tekrar',1);
  const plan={date:dayKey(),ids:shuffle(ids.slice(0,10)),why};ST.set('t7-dplan',plan);return plan}
function getPlan(){const p=ST.get('t7-dplan',null);return p&&p.date===dayKey()&&p.ids&&p.ids.length===10?p:makePlan()}
const planLessons=p=>p.ids.map(id=>LESSONS.find(l=>l.id===id)).filter(Boolean);
function dailyInfo(){const d=ST.get('t7-daily',{last:null,streak:0,days:[]}),today=dayKey(),y=dayKey(Date.now()-864e5);return {...d,doneToday:d.last===today,alive:d.last===today||d.last===y}}
function startDaily(){const p=getPlan(),items=planLessons(p);if(items.length<10){makePlan();return startDaily()}start(GU(items[0].th),{daily:{items,why:p.why}})}
function finishDaily(){const d=dailyInfo(),today=dayKey();let bonus=0;ST.set('t7-dplan',null);
  if(!d.doneToday){const streak=d.alive?d.streak+1:1;bonus=20+Math.min(streak,7)*5;addCoins(bonus);ST.set('t7-daily',{last:today,streak,days:[...new Set([...(d.days||[]),today])].slice(-30),best:Math.max(streak,d.best||0)})}
  return {bonus,...dailyInfo()}}
function weekDots(){const set=new Set(dailyInfo().days||[]);let s='';for(let i=6;i>=0;i--){const t=Date.now()-i*864e5,k=dayKey(t);s+=`<span class="wd${set.has(k)?' on':''}${i===0?' today':''}" title="${k}"><i></i>${new Date(t).toLocaleDateString('tr',{weekday:'short'})}</span>`}return s}
function dailyCard(){const d=dailyInfo(),p=getPlan(),topics=[...new Set(p.ids)].map(id=>LESSONS.find(l=>l.id===id)).filter(Boolean);
  return `<section class="daily${d.doneToday?' done':''}"><div class="dh"><span class="dt">${ic('auto')} BUGÜNÜN GÖREVİ</span><span class="streak${d.alive&&d.streak>=2?' hot':''}">${d.alive?d.streak:0} gün seri</span></div>
   <p class="dp">${d.doneToday?'Bugünkü görev tamam, aferin! İstersen yeni bir karışık set daha çözebilirsin; bonus yarın yeniden.':'10 karışık soru: zayıf konuların, tekrar zamanı gelen derslerin ve sıradaki yeni ders. Bitirince bonus altın, her gün üst üste oynayınca daha çok bonus!'}</p>
   <div class="chips" style="justify-content:flex-start">${topics.slice(0,7).map(l=>`<span class="chip">${l.no} ${l.t} · ${p.why[l.id]||''}</span>`).join('')}</div>
   <div class="wrow"><div class="wk" aria-label="Son 7 gün">${weekDots()}</div><a class="btn ${d.doneToday?'':'gold'}" id="daily" href="#gorev">${ic('play')} ${d.doneToday?'Yeni karışık set':'Göreve başla'}</a></div></section>`}
function hub(){
  const best=ST.get('t7-best',{}),total=G.reduce((a,g)=>a+starsOf(best[g.id]??0),0);
  const lb=ST.get('t7-lbest',{}),last=ST.get('t7-last',null),lstars=LESSONS.reduce((a,l)=>a+starsOf(lb[l.id]??0),0),done=LESSONS.filter(l=>(lb[l.id]??0)>=7).length;
  /* Kitap Ağacı: book ▸ theme ▸ lesson ▸ branches (the parts of its Öğren lesson, its game, its book pages); open state is remembered */
  const OPEN=ST.get('t7-open',{b1:true,b2:true});const lastId=last&&(last.hash.match(/(\d-\d)/)||[])[1];if(lastId&&OPEN['th'+lastId[0]]===undefined)OPEN['th'+lastId[0]]=true;
  const op=k=>OPEN[k]?' open':'';
  const branches=l=>{let it=[];
    if(l.script||l.learn!=null){it=scenesFor(l).map((s,k)=>`<li><a class="br${s.check?' chk':''}" href="#ogren-${l.id}-${k}">${ic(s.check?'book':'play')}<span>${k+1}. ${s.name}</span></a></li>`);
      if(l.learn!=null)it.push(`<li><a class="br" href="#tema-1">${ic('book')}<span>Tüm görev brifingi</span></a></li>`)}
    it.push(`<li>${l.gen?`<a class="br play" href="#ders-${l.id}">${ic('play')}<span>Oyna: 10 soru</span></a>`:`<span class="br soon">Oyun · yakında</span>`}</li>`);
    if(l.write)it.push(`<li><a class="br" href="#yaz-${l.id}">📝 <span>Yazma Köşesi: ${l.write.title}${(ST.get('t7-writes',{})[l.id])?' ✅':''}</span></a></li>`);
    it.push(`<li><span class="br info">${ic('book')}<span>Kitapta: s. ${l.p}</span></span></li>`);
    return `<ul class="brs">${it.join('')}</ul>`};
  const row=l=>{const b=lb[l.id]??0,g=GU(l.th),q=fold(`${l.no} ${l.t} ${l.kw} ${g.tema} ${g.name} ${g.topics}`);
    return `<li class="ls" data-q="${q}"><details data-k="${l.id}"${op(l.id)}><summary><span class="tw" aria-hidden="true"></span><span class="lno">${l.no}</span><span class="lmain"><b>${l.t}</b><span class="lpg">s. ${l.p}</span></span>
     <span class="lprog" title="En iyi: ${b} / 10"><i style="width:${b*10}%"></i></span><span class="stars" aria-label="${starsOf(b)} yıldız">${starStr(starsOf(b))}</span></summary>${branches(l)}</details>
     <div class="qb">${(l.learn!=null||l.script)?`<a class="btn sm" href="#ogren-${l.id}">${ic('book')} Öğren</a>`:''}${l.gen?`<a class="btn sm prime" href="#ders-${l.id}">${ic('play')} Oyna</a>`:''}${l.write?`<a class="btn sm" href="#yaz-${l.id}">📝 Yaz</a>`:''}</div></li>`};
  const theme=g=>{const ls=LESSONS.filter(l=>l.th===g.id),dn=ls.filter(l=>(lb[l.id]??0)>=7).length,b=best[g.id];
    return `<li class="thm" style="--hue:${g.hue}"><details data-k="th${g.id}"${op('th'+g.id)}><summary class="thh"><span class="tw" aria-hidden="true"></span><span class="tno">${String(g.id).padStart(2,'0')}</span>
      <span class="thn"><span class="tema">${g.id}. Tema · ${g.pages} · ${ls.length} ders</span><b>${g.tema}</b></span><span class="badge">${dn} / ${ls.length}</span></summary>
      <div class="thx"><a class="btn sm gold" href="#tema-${g.id}">${g.brief?'Brifing + ':''}Tema görevi: ${g.name}</a><span class="hint">Temanın derslerinden karışık 10 soru${b!=null?` · en iyi ${b} / 10`:''}</span>${(()=>{const t=ST.get('t7-test',{})[g.id];return `<a class="btn sm" href="#test-${g.id}">${ic('auto')} Seviye testi</a><span class="hint">${t?`son test ${t.s} / ${t.n} · ${t.known.length} ders biliyor`:'Bildiğin dersleri bul, eksiklerini gör'}</span>`})()}</div>
      <ol class="lsl">${ls.map(row).join('')}</ol></details></li>`};
  const book=bk=>{const th=G.filter(g=>g.book===bk),n=LESSONS.filter(l=>l.book===bk).length;if(!th.length)return '';
    return `<section class="book"><details data-k="b${bk}"${op('b'+bk)}><summary class="bks"><span class="tw" aria-hidden="true"></span><h2>${bk}. Kitap</h2><span class="hint">${th.length} tema · ${n} ders · ${th[0].id}.–${th[th.length-1].id}. tema</span></summary><ol class="thl">${th.map(theme).join('')}</ol></details></section>`};
  app.innerHTML=`<header class="top"><h1 class="logo">TÜRKÇE 7<small>DERS HARİTASI · 2 KİTAP · ${G.length} TEMA · ${LESSONS.length} DERS · ${lstars + total} YILDIZ</small></h1></header>
   <section class="profile"><div class="av">${heroBox()}</div><div class="pinfo"><span class="nm">Kaşif</span><span class="coins"><i class="coin"></i>${wallet()} altın</span>${goalBar()}</div>
   <div class="pbtns"><a class="btn gold" href="#magaza">Mağaza</a><a class="btn" href="#rapor">Ebeveyn Raporu</a><button class="btn" id="snd" type="button">${ic('sound')} ${SND.on?'Ses: açık':'Ses: kapalı'}</button><button class="btn" id="fullh" type="button">${ic('full')} Tam ekran</button><span id="instslot"></span>
     <div class="skins" role="group" aria-label="Görünüm">${Object.entries(SKINS).map(([k,n])=>`<button class="sk" type="button" data-skin="${k}" aria-pressed="${skin()===k}"><i class="sw sw-${k}"></i>${n}</button>`).join('')}</div></div></section>
   ${dailyCard()}
   <section class="homebar">${last?`<a class="btn prime" id="cont" href="${last.hash}">${ic('play')} Devam et: ${last.label}</a>`:`<a class="btn prime" id="cont" href="#ogren-${LESSONS[0].id}">${ic('play')} Başla: ${LESSONS[0].no} ${LESSONS[0].t}</a>`}
     <label class="srch"><span class="sr-only">Konu ara</span><input id="q" type="search" placeholder="Konu ara: deyim, kip, ana fikir, yazım…" autocomplete="off" enterkeyhint="search"></label>
     <span class="tbtns"><button class="btn sm" id="exall" type="button">＋ Tümünü aç</button><button class="btn sm" id="coall" type="button">－ Tümünü kapat</button></span>
     <span class="hint">${done} / ${LESSONS.length} ders tamamlandı (en az 7 doğru)</span></section>
   <p class="empty" id="noq" hidden>Bu aramayla eşleşen ders yok. Başka bir kelime dene: "deyim", "paragraf", "noktalama"…</p>
   <nav class="tree" aria-label="Kitap ağacı">${book(1)}${book(2)}</nav>
   <p class="foot">Kitap ağacında ＋ işaretine basarak temalari ve dersleri aç; dersin altındaki dallar Öğren anlatımının bölümleridir, istediğine doğrudan atlayabilirsin. Her ders kitaptaki bir konudur ve sayfa numarası yanında yazar. Her oyun 10 sorudur; sorular her seferinde karışık sırayla gelir. Doğru cevap 10 altın, 3'lü seri ×2, 5'li seri ×3. Altınlar ve rapor yalnızca bu cihazda saklanır. Bilgisayara bir oyun kumandası (örneğin PS5 DualSense) bağlıysa yön tuşlarıyla gez, ✕ ile seç, ○ ile geri dön.</p>`;
  document.getElementById('snd').onclick=()=>{SND.on=!SND.on;ST.set('t7-sound',SND.on);hub()};
  document.getElementById('fullh').onclick=toggleFull;
  delete app.dataset.searching;const saveOpen=()=>ST.set('t7-open',OPEN);
  app.querySelectorAll('details[data-k]').forEach(d=>d.addEventListener('toggle',()=>{if(app.dataset.searching)return;OPEN[d.dataset.k]=d.open;saveOpen();if(d.open)sfx('tick')}));
  const setAll=v=>{app.querySelectorAll('details[data-k]').forEach(d=>{d.open=v;OPEN[d.dataset.k]=v});if(!v){OPEN.b1=OPEN.b2=true;app.querySelectorAll('.book>details').forEach(d=>d.open=true)}saveOpen()};
  document.getElementById('exall').onclick=()=>setAll(true);document.getElementById('coall').onclick=()=>setAll(false);
  const qi=document.getElementById('q');qi.oninput=()=>{const s=fold(qi.value.trim());let any=false;app.dataset.searching=s?'1':'';
    app.querySelectorAll('.thm').forEach(t=>{let vis=0;t.querySelectorAll('.ls').forEach(r=>{const ok=!s||s.split(/\s+/).every(w=>r.dataset.q.includes(w));r.hidden=!ok;if(ok)vis++});t.hidden=!vis;if(vis)any=true;
      const d=t.querySelector(':scope>details');d.open=s?vis>0:!!OPEN[d.dataset.k]});
    app.querySelectorAll('.book').forEach(b=>{const vis=[...b.querySelectorAll('.thm')].some(t=>!t.hidden);b.hidden=!vis;const d=b.querySelector(':scope>details');d.open=s?vis:!!OPEN[d.dataset.k]});
    document.getElementById('noq').hidden=any;if(!s)delete app.dataset.searching};
  app.querySelectorAll('.sk').forEach(b=>b.onclick=()=>{applySkin(b.dataset.skin);sfx(b.dataset.skin==='elektron'?'zapup':'tick');hub();const f=app.querySelector(`.sk[data-skin="${b.dataset.skin}"]`);if(f&&PAD.on)f.focus({preventScroll:true})});
  document.title='Türkçe 7 Oyunları';
}

/* ================= game engine ================= */
let S=null;
function start(g,opt={}){S={g,skill:opt.skill||null,lesson:opt.lesson||null,daily:opt.daily||null,test:opt.test?testPlan(g):null,n:10,i:0,score:0,streak:0,coins:0,marks:[],seen:new Set(),misCount:{},monsters:[]};if(S.test)S.n=S.test.seq.length;sfx('start');next()}
function next(){
  if(S.i>=S.n)return S.test?testResult():result();
  if(S.daily){S.lesson=S.daily.items[S.i];S.g=GU(S.lesson.th)}
  if(S.test)S.cur=S.test.seq[S.i];
  let q;for(let t=0;t<20;t++){q=S.test?testQ(S.cur):S.lesson?S.lesson.gen():S.g.gen(S.skill);if(!S.seen.has(q.prompt+(q.visual||'').length))break}
  S.seen.add(q.prompt+(q.visual||'').length);S.q=q;S.done=false;render();
}
function hud(){
  const g=S.g,marks=Array.from({length:S.n},(_,i)=>`<i class="${S.marks[i]===true?'ok':S.marks[i]===false?'bad':i===S.i?'now':''}"></i>`).join('');
  return `<div class="hud" style="--hue:${g.hue}"><button class="iconbtn" id="back" type="button">${ic('home')} Harita</button>
    <div class="meta"><span class="tema">${S.test?(S.i>=S.n?'Seviye testi tamamlandı':`Seviye testi · bu soru: ${S.cur.no} ${S.cur.t}`):S.daily?`Bugünün görevi · bu soru: ${S.lesson.no} ${S.lesson.t} · ${S.daily.why[S.lesson.id]||''}`:S.lesson?`Ders ${S.lesson.no} · s. ${S.lesson.p}`:S.skill?'Pratik · '+SK1[S.skill]:g.id+'. Tema · '+g.tema}</span><h2>${S.test?`Seviye Testi · ${g.id}. Tema`:S.daily?'Bugünün Görevi':S.lesson?S.lesson.t:g.name}</h2></div>
    <span class="streak${S.streak>=3?' hot':''}" id="streak">SERİ ${S.streak}</span><span class="coins" id="wallet"><i class="coin"></i><span id="wv">${wallet()}</span></span>
    <div class="hbtns" role="toolbar" aria-label="Oyun kontrolleri"><button class="iconbtn" id="rd" type="button" title="Soruyu ve seçenekleri sesli oku">${ic('voice')} Sesli oku</button>
      ${S.lesson&&(S.lesson.script||S.lesson.learn!=null)?`<button class="iconbtn" id="rb" type="button" title="Bu dersin anlatımını izle">${ic('book')} Öğren</button>`:g.brief&&!S.lesson?`<button class="iconbtn" id="rb" type="button" title="Görev brifingini yeniden izle">${ic('book')} Brifing</button>`:''}
      <button class="iconbtn${SND.on?' on':''}" id="snd2" type="button" aria-pressed="${SND.on}" title="Efekt sesleri">${ic('sound')} ${SND.on?'Ses açık':'Ses kapalı'}</button>
      <button class="iconbtn" id="full" type="button" title="Tam ekran (F)">${ic('full')} Tam ekran</button></div>
    <div class="marks" aria-label="Doğru sayısı ${S.score}">${marks}</div></div>`;
}
function bindHud(){
  const $=id=>document.getElementById(id);
  $('back').onclick=()=>{hush();location.hash=''};
  $('full').onclick=toggleFull;
  $('snd2').onclick=()=>{SND.on=!SND.on;ST.set('t7-sound',SND.on);$('snd2').innerHTML=`${ic('sound')} ${SND.on?'Ses açık':'Ses kapalı'}`;$('snd2').classList.toggle('on',SND.on)};
  if($('rb'))$('rb').onclick=()=>{const g=S.g,l=S.lesson;S=null;hush();if(l&&(l.script||l.learn!=null))briefing(g,0,l,scenesFor(l));else briefing(g)};
  $('rd').onclick=()=>{if(!VOICE.v){pickVoice()}if(!VOICE.v){$('rd').innerHTML=`${ic('voice')} Türkçe ses yok`;voiceHelp();return}hush();say(promptSpeech(),true)};
}
function promptSpeech(){
  const flat=el=>{const c=el.cloneNode(true);c.querySelectorAll('.fr-b').forEach(f=>{const s=f.children;f.replaceWith(` ${s[0].textContent} bölü ${s[1].textContent} `)});c.querySelectorAll('.box').forEach(b=>b.replaceWith(' kaç '));c.querySelectorAll('.k').forEach(k=>k.remove());return c.textContent};
  const p=document.querySelector('.prompt');let t=p?flat(p):'';
  const opts=[...document.querySelectorAll('.opt')].map((o,i)=>`${i+1}. ${flat(o)}`);if(opts.length)t+='. Seçenekler: '+opts.join('. ');
  const its=[...document.querySelectorAll('.oitem .ot,.sitem .ot')].map(o=>o.textContent);if(its.length)t+='. '+its.join('. ');
  const bins=S&&S.q&&S.q.kind==='sort'?S.q.bins:null;if(bins)t+='. Gruplar: '+bins.join(', ');
  return t;
}
function render(){
  const q=S.q;let ans='';
  if(q.kind==='choice')ans=`<div class="opts">${q.options.map((o,i)=>`<button class="opt" type="button" data-i="${i}"><span class="k">${i+1}</span><span>${o.html}</span></button>`).join('')}</div>`;
  if(q.kind==='number')ans=`<form class="row" id="nf" novalidate><input class="numin" id="numin" inputmode="decimal" autocomplete="off" aria-label="Cevabın" placeholder="Cevap">${q.unit?`<span class="unit">${q.unit}</span>`:''}<button class="go" type="submit" id="chk">Kontrol et</button></form><div class="keypad" role="group" aria-label="Sayı tuşları">${['7','8','9','4','5','6','1','2','3','−','0',','].map(k=>`<button type="button" data-key="${k}">${k}</button>`).join('')}<button type="button" data-key="del">Sil</button></div><p class="hint">Yaz ya da tuşlara bas. Negatif sayı için −, ondalık için virgül (örnek: −3 veya 2,5).</p><p class="err" id="err" hidden></p>`;
  if(q.kind==='line')ans=`<div class="row"><button class="go" id="chk" type="button" disabled>Kontrol et</button><span class="hint" id="pickv">Doğrunun üzerine dokun; ok tuşlarıyla da kaydırabilirsin.</span></div>`;
  if(q.kind==='grid')ans=`<div class="row"><button class="go" id="chk" type="button">Kontrol et</button><button class="go alt" id="clr" type="button">Temizle</button></div>`;
  if(q.kind==='build')ans=`<div class="bctl" id="bctl"></div>`;
  if(q.kind==='order')ans=orderHTML(q);
  if(q.kind==='sort')ans=sortHTML(q);
  if(window.EXTRA_KINDS&&EXTRA_KINDS[q.kind])ans=EXTRA_KINDS[q.kind].html(q);
  const vis=(q.kind==='line'||q.kind==='grid'||q.kind==='build')?`<div class="vis" id="vis"></div>`:q.v3d&&can3D()?`<div class="vis" style="display:block"><div class="v3q" id="v3q" aria-label="Döndürülebilir 3B model"></div><p class="hint v3hint">Döndürmek için sürükle · kumandada ◀ ▶</p></div>`:q.visual?`<div class="vis">${q.visual}</div>`:'';
  app.innerHTML=`<div class="game" style="--hue:${S.g.hue}">${hud()}<section class="qcard"><span class="qnum">SORU ${S.i+1} / ${S.n}</span><div class="prompt">${q.prompt}</div>${vis}<div class="answers" id="answers">${ans}</div><div id="fb" aria-live="polite"></div></section></div>`;
  bindHud();
  if(q.v3d&&can3D())try{mount3D(document.getElementById('v3q'),c=>BUILD3[q.v3d.kind](c,q.v3d))}catch(e){console.warn('3D',e)}
  if(q.kind==='choice')app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>chooseOpt(+b.dataset.i,b));
  if(q.kind==='number'){if(!PAD.on)document.getElementById('numin').focus({preventScroll:true});document.getElementById('nf').onsubmit=e=>{e.preventDefault();submitNum()};
    app.querySelectorAll('.keypad button').forEach(b=>b.onclick=()=>{const inp=document.getElementById('numin');if(inp.disabled)return;const k=b.dataset.key;let v=inp.value;
      if(k==='del')v=v.slice(0,-1);else if(k==='−')v=/^[−-]/.test(v)?v.slice(1):'−'+v;else if(k===','){if(!v.includes(','))v+=(v===''||v==='−')?'0,':','}else v+=k;
      inp.value=v;document.getElementById('err').hidden=true;sfx('tick')})}
  if(q.kind==='line')setupLine();
  if(q.kind==='grid')setupGrid();
  if(q.kind==='build')setupBuild();
  if(q.kind==='order')setupOrder();
  if(q.kind==='sort')setupSort();
  if(window.EXTRA_KINDS&&EXTRA_KINDS[q.kind])EXTRA_KINDS[q.kind].setup();
}
function chooseOpt(i,btn){
  if(S.done)return;const q=S.q,o=q.options[i];
  app.querySelectorAll('.opt').forEach((b,j)=>{b.disabled=true;if(q.options[j].ok)b.classList.add('right');else if(j===i)b.classList.add('wrong')});
  finish(o.ok,q.options.find(x=>x.ok).html,o.ok?null:(o.mis||'other'),btn||app.querySelectorAll('.opt')[i]);
}
function parseNum(s){s=s.trim().replace(/[−–]/g,'-').replace(/\s/g,'').replace(',','.');if(!/^-?\d+(\.\d+)?$/.test(s))return null;return parseFloat(s)}
function submitNum(){
  if(S.done)return;const v=parseNum(document.getElementById('numin').value),err=document.getElementById('err');
  if(v===null){err.textContent='Bir sayı yaz (örnek: −3 veya 2,5).';err.hidden=false;return}
  err.hidden=true;document.getElementById('numin').disabled=true;document.getElementById('chk').disabled=true;app.querySelectorAll('.keypad button').forEach(b=>b.disabled=true);
  const ok=Math.abs(v-S.q.answer)<1e-9;finish(ok,num(S.q.answer)+(S.q.unit?' '+S.q.unit:''),ok?null:(S.q.classify?S.q.classify(v):'other'),document.getElementById('chk'));
}
async function finish(ok,correctHtml,mis,src){
  S.done=true;S.marks[S.i]=ok;logAnswer({d:Date.now(),th:S.g.id,ls:S.test?S.cur.id:S.lesson?S.lesson.id:S.q.from?S.q.from.id:null,sk:S.q.sk||null,ok,mis:ok?null:mis});
  const mk=app.querySelectorAll('.marks i');if(mk[S.i])mk[S.i].className=ok?'ok':'bad';
  let tip='';
  if(ok){rumble('good');S.score++;S.streak++;const mult=S.streak>=5?3:S.streak>=3?2:1,earned=10*mult;S.coins+=earned;addCoins(earned);sfx(skin()==='elektron'?'zapup':'coin');flyCoins(src,Math.min(3+mult*2,9));
    if(S.streak===3||S.streak===5||S.streak===8){banner(`KOMBO ×${mult}!`);sfx('combo')}}
  else{S.streak=0;sfx('wrong');S.misCount[mis]=(S.misCount[mis]||0)+1;S.monsters.push(mis);
    if(!S.test)await mumAttack(mis,S.misCount[mis]);const m=M[mis]||M.other;tip=`<p class="tip"><b>${m.m}</b> yakalandı! ${m.s}</p>`}
  const st=document.getElementById('streak');if(st){st.textContent='SERİ '+S.streak;st.className='streak'+(S.streak>=3?' hot':'')}
  const last=S.i===S.n-1;
  document.getElementById('fb').innerHTML=`<div class="fb ${ok?'ok':'bad'}"><h3>${ok?pick(['SÜPER!','HARİKA!','MÜKEMMEL!','TAM İSABET!'])+(S.streak>=3?' · SERİ '+S.streak:''):'Doğru cevap: '+correctHtml}</h3>
    <p class="why">${S.q.explain}</p>${tip}<div class="row"><button class="go" id="nx" type="button">${last?'Sonucu gör':'Sonraki soru →'}</button></div></div>`;
  const nx=document.getElementById('nx');nx.onclick=()=>{S.i++;next()};nx.focus({preventScroll:true});nx.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function flyCoins(src,n){
  const w=document.getElementById('wallet'),wv=document.getElementById('wv');if(!w||!src){if(wv)wv.textContent=wallet();return}
  const a=src.getBoundingClientRect(),b=w.getBoundingClientRect(),ax=a.left+a.width/2,ay=a.top+a.height/2,dx=b.left+14-ax,dy=b.top+b.height/2-ay;let landed=0;const ELC=skin()==='elektron';if(ELC)bolt(ax,ay,b.left+14,b.top+b.height/2);
  for(let i=0;i<n;i++){const c=document.createElement('div');c.className='coin-fly'+(ELC?' elec':'');c.style.left=(ax-13)+'px';c.style.top=(ay-13)+'px';document.body.appendChild(c);
    const sx=(Math.random()-.5)*180,sy=-70-Math.random()*90;
    const an=c.animate([{transform:'translate(0,0) scale(.3)'},{transform:`translate(${sx}px,${sy}px) scale(1.25)`,offset:.35},{transform:`translate(${dx}px,${dy}px) scale(.55)`}],{duration:RM?10:900,delay:RM?0:i*70,easing:'cubic-bezier(.5,0,.4,1)',fill:'both'});
    an.finished.then(()=>{c.remove();sfx('tick');if(++landed===n){wv.textContent=wallet();w.classList.remove('bump');void w.offsetWidth;w.classList.add('bump')}})}
}
function bolt(x1,y1,x2,y2){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('class','bolt');s.setAttribute('aria-hidden','true');
  const n=9,dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,pts=[];
  for(let i=0;i<=n;i++){const t=i/n,o=(i===0||i===n)?0:(Math.random()-.5)*Math.min(70,L*.14);pts.push(`${(x1+dx*t+nx*o).toFixed(1)},${(y1+dy*t+ny*o).toFixed(1)}`)}
  s.innerHTML=`<polyline points="${pts.join(' ')}"/>`;document.body.appendChild(s);try{s.animate([{opacity:1},{opacity:.2},{opacity:1},{opacity:0}],{duration:RM?1:420,fill:'forwards'})}catch(e){}setTimeout(()=>s.remove(),450)}
function banner(t){const b=document.createElement('div');b.className='banner';b.textContent=t;document.body.appendChild(b);
  b.animate([{transform:'translate(-50%,-50%) scale(.2) rotate(-12deg)',opacity:0},{transform:'translate(-50%,-50%) scale(1.15) rotate(3deg)',opacity:1,offset:.25},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.75},{transform:'translate(-50%,-80%) scale(1)',opacity:0}],{duration:1400,easing:'ease-out',fill:'both'}).finished.then(()=>b.remove())}

/* ---- Mum vs the Mistake Monster ---- */
function monsterSVG(col){return `<path d="M-62 42 Q-74 -52 0 -62 Q74 -52 62 42 Q42 62 21 46 Q0 66 -21 46 Q-42 62 -62 42Z" fill="${col}" stroke="#0a0920" stroke-width="5"/>
 <path d="M-36 -50 L-54 -92 L-16 -58Z" fill="#fff3c4" stroke="#0a0920" stroke-width="4"/><path d="M36 -50 L54 -92 L16 -58Z" fill="#fff3c4" stroke="#0a0920" stroke-width="4"/>
 <circle cx="0" cy="-14" r="25" fill="#fff" stroke="#0a0920" stroke-width="4"/><circle cx="7" cy="-11" r="11" fill="#0a0920"/><circle cx="11" cy="-15" r="4" fill="#fff"/>
 <path d="M-30 20 Q0 42 30 20" fill="#0a0920"/><path d="M-20 24 L-14 33 L-8 27 M8 27 L14 33 L20 24" fill="#fff"/>
 <path d="M-62 10 Q-84 0 -86 -16" stroke="${col}" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M62 10 Q84 0 86 -16" stroke="${col}" stroke-width="10" stroke-linecap="round" fill="none"/>`}
function mumSVG(){return `<path d="M-46 170 L-58 62 Q0 40 58 62 L46 170 Z" fill="#e0457b" stroke="#0a0920" stroke-width="4"/><path d="M-26 74 L26 74 L22 150 L-22 150 Z" fill="#fff" opacity=".9" stroke="#0a0920" stroke-width="3"/>
 <path d="M-28 108 Q0 118 28 108" stroke="#e0457b" stroke-width="3" fill="none"/>
 <path d="M-44 78 Q-74 104 -40 120" stroke="#f2c19a" stroke-width="14" stroke-linecap="round" fill="none"/>
 <circle cx="0" cy="18" r="38" fill="#f2c19a" stroke="#0a0920" stroke-width="4"/>
 <circle cx="0" cy="-28" r="18" fill="#3b2418" stroke="#0a0920" stroke-width="3"/><path d="M-38 16 Q-40 -20 0 -18 Q40 -20 38 16 Q32 -4 0 -4 Q-32 -4 -38 16Z" fill="#3b2418"/>
 <path d="M-22 4 L-7 11" stroke="#3b2418" stroke-width="5" stroke-linecap="round"/><path d="M22 4 L7 11" stroke="#3b2418" stroke-width="5" stroke-linecap="round"/>
 <circle cx="-13" cy="19" r="4.5" fill="#0a0920"/><circle cx="13" cy="19" r="4.5" fill="#0a0920"/><ellipse cx="0" cy="38" rx="9" ry="7" fill="#7a1f2e"/>
 <circle cx="-24" cy="30" r="6" fill="#ff8fa3" opacity=".6"/><circle cx="24" cy="30" r="6" fill="#ff8fa3" opacity=".6"/>
 <g class="arm"><path d="M42 76 Q66 44 72 0" stroke="#f2c19a" stroke-width="14" stroke-linecap="round" fill="none"/></g>`}
function mumAttack(mis,times){if(FAST)return Promise.resolve();
  return new Promise(res=>{
    const m=M[mis]||M.other,slip=SLIPS[shop().slip][1];
    const line=times>=2?`Yine mi sen, ${m.m}?!`:pick([`Al sana, ${m.m}!`,`Defol, ${m.m}!`,`Benim kaşifime dokunma!`]);
    const ov=document.createElement('div');ov.className='ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-label',`${m.m} yakalandı`);
    ov.innerHTML=`<svg viewBox="0 0 800 440">${SHOPDEFS}
      <g transform="translate(600,250)"><g class="mon">${monsterSVG(m.c)}</g></g>
      <g transform="translate(600,350)"><g class="mlab"><rect x="-130" y="-22" width="260" height="40" rx="20" fill="#0a0920" stroke="${m.c}" stroke-width="3"/><text x="0" y="6" text-anchor="middle" style="font-family:var(--f-display);font-weight:800;font-size:18px;fill:${m.c}">${m.m}</text></g></g>
      <g transform="translate(170,230)"><g class="mum">${mumSVG()}</g></g>
      <g transform="translate(242,232)"><g class="sl-o"><g class="sl-i">${slipperSVG(slip)}</g></g></g>
      <g transform="translate(560,190)"><g class="boing" opacity="0"><polygon points="0,-70 18,-30 62,-44 36,-8 74,16 28,22 34,66 0,38 -34,66 -28,22 -74,16 -36,-8 -62,-44 -18,-30" fill="#ffc83d" stroke="#0a0920" stroke-width="4"/><text x="0" y="12" text-anchor="middle" style="font-family:var(--f-display);font-weight:800;font-size:30px;fill:#0a0920">${skin()==='elektron'?'ZZZT!':'BOİNG!'}</text></g></g>
      <g transform="translate(600,250)"><g class="sparks" opacity="0">${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<line x1="${(Math.cos(a)*62).toFixed(1)}" y1="${(Math.sin(a)*62).toFixed(1)}" x2="${(Math.cos(a)*98).toFixed(1)}" y2="${(Math.sin(a)*98).toFixed(1)}" stroke="#4df3ff" stroke-width="5" stroke-linecap="round"/>`}).join('')}</g></g>
      <g transform="translate(250,80)"><g class="bub" opacity="0"><rect x="-200" y="-34" width="400" height="60" rx="22" fill="#fff" stroke="#0a0920" stroke-width="4"/><path d="M-60 24 L-90 64 L-20 24Z" fill="#fff" stroke="#0a0920" stroke-width="4"/><rect x="-80" y="18" width="70" height="10" fill="#fff"/>
        <text x="0" y="6" text-anchor="middle" style="font-family:var(--f-body);font-weight:900;font-size:22px;fill:#0a0920">${line}</text></g></g>
    </svg><p class="skip">Geçmek için dokun</p>`;
    document.body.appendChild(ov);
    const q=s=>ov.querySelector(s);['.mon','.mum','.sl-i','.boing','.bub','.mlab','.sparks'].forEach(s=>{const e=q(s);e.style.transformBox='fill-box';e.style.transformOrigin='center'});
    let closed=false;const close=()=>{if(closed)return;closed=true;try{ov.animate([{opacity:1},{opacity:0}],{duration:200,fill:'forwards'})}catch(e){}setTimeout(()=>{ov.remove();res()},210)};
    ov.onclick=close;
    if(RM){q('.boing').setAttribute('opacity',1);q('.bub').setAttribute('opacity',1);setTimeout(close,1600);return}
    q('.mon').animate([{transform:'scale(0) rotate(-30deg)'},{transform:'scale(1.15)',offset:.7},{transform:'scale(1)'}],{duration:450,easing:'ease-out'});
    q('.mon').animate([{transform:'translateY(0) rotate(-4deg)'},{transform:'translateY(-10px) rotate(4deg)'}],{duration:260,delay:450,iterations:3,direction:'alternate'});
    q('.mlab').animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:300,delay:250,fill:'backwards'});
    q('.mum').animate([{transform:'translateX(-420px)'},{transform:'translateX(14px)',offset:.8},{transform:'translateX(0)'}],{duration:520,delay:150,easing:'ease-out',fill:'backwards'});
    q('.sl-o').animate([{transform:'translateX(-420px)'},{transform:'translateX(0)'}],{duration:420,delay:150,easing:'ease-out',fill:'backwards'});
    q('.bub').animate([{opacity:0,transform:'scale(.3)'},{opacity:1,transform:'scale(1.08)',offset:.7},{opacity:1,transform:'scale(1)'}],{duration:380,delay:550,fill:'forwards'});
    setTimeout(()=>{if(!closed)sfx('whoosh')},850);
    q('.sl-o').animate([{transform:'translate(0,0)'},{transform:'translate(180px,-170px)',offset:.5},{transform:'translate(350px,-10px)'}],{duration:520,delay:850,easing:'ease-in',fill:'forwards'});
    q('.sl-i').animate([{transform:'rotate(0deg)'},{transform:'rotate(900deg)'}],{duration:520,delay:850,fill:'forwards'});
    setTimeout(()=>{if(closed)return;sfx(skin()==='elektron'?'zap':'boing');rumble('bad');if(VOICE.on&&VOICE.v)say(line);
      q('.boing').animate([{opacity:0,transform:'scale(.2) rotate(-20deg)'},{opacity:1,transform:'scale(1.2) rotate(6deg)',offset:.4},{opacity:1,transform:'scale(1)',offset:.8},{opacity:0,transform:'scale(1.3)'}],{duration:900,fill:'forwards'});
      if(skin()==='elektron'){
        q('.mon').animate([{opacity:1,filter:'none',transform:'scale(1)'},{opacity:.15,filter:'brightness(3) hue-rotate(90deg)',offset:.15},{opacity:1,filter:'none',offset:.3},{opacity:.1,offset:.45},{opacity:.9,transform:'scale(.92)',offset:.6},{opacity:0,transform:'scale(.15) rotate(25deg)'}],{duration:950,fill:'forwards'});
        q('.sparks').animate([{opacity:1,transform:'scale(.4)'},{opacity:0,transform:'scale(1.7)'}],{duration:500,iterations:2,fill:'forwards'})}
      else q('.mon').animate([{transform:'translate(0,0) rotate(0) scale(1)'},{transform:'translate(60px,-30px) rotate(40deg) scale(.95)',offset:.2},{transform:'translate(520px,-320px) rotate(620deg) scale(.4)',opacity:0}],{duration:850,easing:'ease-in',fill:'forwards'});
      q('.mlab').animate([{opacity:1},{opacity:0}],{duration:400,fill:'forwards'});
      q('.sl-o').animate([{transform:'translate(350px,-10px)'},{transform:'translate(330px,140px)'}],{duration:500,easing:'ease-in',fill:'forwards'});
    },1370);
    setTimeout(close,2700);
  });
}
function result(){
  const s=S.score,st=starsOf(s),g=S.g;const best=ST.get('t7-best',{});
  const D=S.daily?finishDaily():null;
  if(D){}else if(S.lesson){const lb=ST.get('t7-lbest',{});if(!(lb[S.lesson.id]>=s)){lb[S.lesson.id]=s;ST.set('t7-lbest',lb)}}
  else if(!S.skill&&!(best[g.id]>=s)){best[g.id]=s;ST.set('t7-best',best)}
  const nl=S.lesson&&!D?nextLesson(S.lesson):null;
  const dailyHTML=D?`<p class="coins" style="justify-content:center">${D.bonus?`<i class="coin"></i>+${D.bonus} görev bonusu · `:''}${D.streak} gün seri</p><div class="wk" style="justify-content:center">${weekDots()}</div>`:'';
  const msg=st===3?'Harika! Bu görevi ustaca bitirdin.':st===2?'Çok iyi! Biraz daha pratikle tam olacak.':st===1?'İyi bir başlangıç. Çözümleri okuyup tekrar dene.':`${S.lesson?`Kitabın ${S.lesson.p}`:`Kitabın ${g.pages.replace(/^s. /,"")}`} sayfalarına göz atıp tekrar dene.`;
  const cnt={};S.monsters.forEach(m=>cnt[m]=(cnt[m]||0)+1);
  const chips=Object.keys(cnt).map(k=>`<span class="chip" style="border-color:${(M[k]||M.other).c}">${(M[k]||M.other).m} ×${cnt[k]}</span>`).join('');
  const nextG=G.find(x=>x.id===g.id+1);
  app.innerHTML=`<div class="game" style="--hue:${g.hue}">${hud()}<section class="qcard result"><h2>${D?'BUGÜNÜN GÖREVİ TAMAM':S.lesson?'DERS TAMAMLANDI':'GÖREV TAMAMLANDI'}</h2><div class="score">${s} / 10</div>
    <div class="rstars">${[0,1,2].map(i=>`<span class="${i<st?'on':''}" style="animation-delay:${.3+i*.35}s">★</span>`).join('')}</div>
    <p class="coins" style="justify-content:center"><i class="coin"></i>+${S.coins} altın kazandın</p>${dailyHTML}<p>${msg}</p>
    ${chips?`<p class="hint">Bu turda annenin terliğiyle kovaladığı canavarlar:</p><div class="chips">${chips}</div>`:'<p class="hint">Bu turda hiç canavar çıkmadı!</p>'}
    <div class="row" style="justify-content:center"><button class="go" id="again" type="button">Tekrar oyna</button><a class="btn" href="#rapor">Ebeveyn Raporu</a>${D?`<a class="btn prime" href="#">Ders haritası</a>`:S.lesson?(nl?`<a class="btn prime" href="#ders-${nl.id}">Sonraki ders: ${nl.no} ${nl.t} →</a>`:''):nextG&&!S.skill?`<a class="btn" href="#tema-${nextG.id}">${nextG.id}. Tema →</a>`:''}</div></section></div>`;
  for(let i=0;i<st;i++)setTimeout(()=>sfx('star'),300+i*350);
  bindHud();document.getElementById('again').onclick=()=>D?startDaily():start(g,{skill:S.skill,lesson:S.lesson});if(D)document.getElementById('again').textContent='Yeni karışık set';
}
document.addEventListener('keydown',e=>{if(!S||!S.q||S.done||!/^#(tema|pratik|test|ders)-/.test(location.hash))return;if(S.q.kind==='choice'&&/^[1-4]$/.test(e.key)&&S.q.options[+e.key-1])chooseOpt(+e.key-1)});

/* ---- number line ---- */
function setupLine(){
  const q=S.q,W=640,PAD=28,Y=52,steps=(q.max-q.min)*q.den,xv=v=>PAD+(v-q.min)/(q.max-q.min)*(W-2*PAD);
  let pickV=null;const vis=document.getElementById('vis');
  const draw=(reveal)=>{
    let s=(q.min<0?`<g class="ereg"><rect x="${xv(q.min)}" y="${Y-20}" width="${xv(Math.min(0,q.max))-xv(q.min)}" height="40" rx="8" style="fill:rgba(77,243,255,.08);stroke:rgba(77,243,255,.4);stroke-dasharray:4 4"/><text x="${xv(q.min)+6}" y="${Y-26}" text-anchor="start" style="fill:var(--cyan);font-size:15px">e⁻ bölgesi · negatif sayılar</text></g>`:'')+
      `<line class="s-line" x1="6" y1="${Y}" x2="${W-6}" y2="${Y}" style="stroke:var(--axis);stroke-width:3"/><line class="flow" x1="6" y1="${Y}" x2="${W-6}" y2="${Y}"/><polyline class="s-line" points="14,${Y-7} 6,${Y} 14,${Y+7}"/><polyline class="s-line" points="${W-14},${Y-7} ${W-6},${Y} ${W-14},${Y+7}"/>`;
    for(let k=0;k<=steps;k++){const v=q.min+k/q.den,x=xv(v),major=Math.abs(v-Math.round(v))<1e-9;
      s+=`<line class="${major?'s-line':'s-thin'}" x1="${x}" y1="${Y-(major?11:6)}" x2="${x}" y2="${Y+(major?11:6)}"/>`;
      if(major&&Math.round(v)%q.labelEvery===0)s+=`<text x="${x}" y="${Y+34}" text-anchor="middle" style="font-size:16px${Math.round(v)===0?';font-weight:700;fill:var(--gold)':''}">${neg(Math.round(v))}</text>`}
    if(reveal&&Math.abs(pickV-q.target)>1e-9){const x=xv(q.target);s+=`<circle cx="${x}" cy="${Y}" r="11" style="fill:none;stroke:var(--green);stroke-width:4"/><text x="${x}" y="${Y-20}" text-anchor="middle" style="fill:var(--green);font-weight:700">doğru yer</text>`}
    if(pickV!==null){const x=xv(pickV);s+=`<line class="s-line" x1="${x}" y1="${Y-30}" x2="${x}" y2="${Y}"/><circle class="f-hl" cx="${x}" cy="${Y-30}" r="9"/><circle class="f-ink" cx="${x}" cy="${Y}" r="4"/>`}
    vis.innerHTML=`<svg class="nl" id="nl" viewBox="0 0 ${W} 100" tabindex="0" role="slider" aria-label="Sayı doğrusu" aria-valuemin="${q.min}" aria-valuemax="${q.max}" aria-valuenow="${pickV??''}" aria-valuetext="${pickV===null?'Seçilmedi':num(pickV)}">${s}</svg>`;
    const svg=document.getElementById('nl');if(!S.done){svg.addEventListener('pointerdown',onDown);svg.addEventListener('keydown',onKey)}return svg;
  };
  const setV=v=>{pickV=Math.max(q.min,Math.min(q.max,Math.round(v*q.den)/q.den));const svg=draw();svg.focus({preventScroll:true});document.getElementById('chk').disabled=false;document.getElementById('pickv').textContent='Seçtiğin yer: '+num(pickV)};
  function onDown(e){const svg=e.currentTarget,pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(svg.getScreenCTM().inverse());setV(q.min+(p.x-PAD)/(W-2*PAD)*(q.max-q.min))}
  function onKey(e){if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();setV((pickV??0)+(e.key==='ArrowRight'?1:-1)/q.den)}if(e.key==='Enter'&&pickV!==null){e.preventDefault();check()}}
  function check(){if(S.done||pickV===null)return;S.done=true;draw(true);S.done=false;const btn=document.getElementById('chk');btn.disabled=true;const ok=Math.abs(pickV-q.target)<1e-9;
    finish(ok,q.answerText,ok?null:(q.classify?q.classify(pickV):'other'),btn)}
  draw();document.getElementById('chk').onclick=check;
}
/* ---- reflection grid ---- */
function setupGrid(){
  const q=S.q,c=32,Mg=6,mine=new Set(),vis=document.getElementById('vis');
  const draw=(reveal)=>{let s='';
    for(let r=0;r<q.rows;r++)for(let k=0;k<q.cols;k++){const key=r+','+k;let cl='cell';if(q.shape.has(key))cl+=' shape';else if(mine.has(key))cl+=' mine';
      if(reveal){if(q.target.has(key)&&!mine.has(key))cl+=' miss';if(mine.has(key)&&!q.target.has(key))cl+=' extra'}
      const tab=!q.shape.has(key)&&!S.done&&!reveal?` tabindex="0" role="button" aria-pressed="${mine.has(key)}" aria-label="${r+1}. satır, ${k+1}. sütun"`:'';
      s+=`<rect class="${cl}" data-k="${key}" x="${Mg+k*c}" y="${Mg+r*c}" width="${c}" height="${c}"${tab}/>`}
    const ax=q.vert?`<line x1="${Mg+q.k*c}" y1="0" x2="${Mg+q.k*c}" y2="${2*Mg+q.rows*c}"`:`<line x1="0" y1="${Mg+q.k*c}" x2="${2*Mg+q.cols*c}" y2="${Mg+q.k*c}"`;
    s+=ax+` style="stroke:var(--pink);stroke-width:4;stroke-dasharray:10 6"/>`;
    vis.innerHTML=`<svg viewBox="0 0 ${2*Mg+q.cols*c} ${2*Mg+q.rows*c}" role="img" aria-label="Kareli ızgara ve simetri doğrusu">${s}</svg>`;
    const toggle=k=>{mine.has(k)?mine.delete(k):mine.add(k);sfx('tick');draw();const f=vis.querySelector(`[data-k="${k}"]`);if(f&&(PAD.on||document.activeElement===document.body))try{f.focus({preventScroll:true})}catch(e){}};
    if(!S.done)vis.querySelectorAll('.cell:not(.shape)').forEach(el=>{el.addEventListener('click',()=>toggle(el.dataset.k));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(el.dataset.k)}})});
  };
  draw();
  document.getElementById('clr').onclick=()=>{if(!S.done){mine.clear();draw()}};
  document.getElementById('chk').onclick=()=>{if(S.done)return;const ok=mine.size===q.target.size&&[...mine].every(k=>q.target.has(k));S.done=true;draw(true);
    const b=document.getElementById('chk');b.disabled=true;document.getElementById('clr').disabled=true;S.done=false;finish(ok,'yeşil çerçeveli kareler',ok?null:'other',b);
    /* show the answer as a fold: the shape turns over the line of symmetry and lands on its image */
    if(can3D())try{vis.insertAdjacentHTML('afterend','<div class="v3q v3s" id="flip3" aria-label="Şeklin simetri doğrusu boyunca katlanması"></div><p class="hint v3hint">Katla ve gör: şekil simetri doğrusu boyunca dönüp görüntüsünün üstüne düşer.</p>');
      mount3D(document.getElementById('flip3'),c=>BUILD3.flip(c,{cols:q.cols,rows:q.rows,vert:q.vert,k:q.k,cells:[...q.shape].map(s=>s.split(',').map(Number))}))}catch(e){console.warn('3D',e)}};
}

/* ================= mission briefing (Tema 1) ================= */
const NS='http://www.w3.org/2000/svg';
function add(st,html){const g=document.createElementNS(NS,'g');st.appendChild(g);g.innerHTML=html;g.style.transformBox='fill-box';g.style.transformOrigin='center';return g}
function T(x,y,s,cls,anchor='middle'){return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${s}</text>`}
function pop(el,delay=0,dur=520){el.style.opacity=1;return el.animate([{transform:'scale(0)',opacity:0},{transform:'scale(1.18)',opacity:1,offset:.6},{transform:'scale(1)',opacity:1}],{duration:RM?1:dur,delay:RM?0:delay,easing:'ease-out',fill:'backwards'}).finished.catch(()=>{})}
function fadeOut(el,dur=300){return el.animate([{opacity:1},{opacity:0}],{duration:dur,fill:'forwards'}).finished.catch(()=>{})}
function pulse(el){if(!RM)el.animate([{transform:'scale(1)'},{transform:'scale(1.1)'},{transform:'scale(1)'}],{duration:900,iterations:Infinity})}
function floaty(el){if(!RM)el.animate([{transform:'translateY(0)'},{transform:'translateY(-12px)'},{transform:'translateY(0)'}],{duration:1800+Math.random()*900,iterations:Infinity})}
function shakeEl(el){return el.animate([{transform:'translateX(0)'},{transform:'translateX(-10px)'},{transform:'translateX(10px)'},{transform:'translateX(0)'}],{duration:350,iterations:2}).finished.catch(()=>{})}
function drawStroke(el,dur=700,delay=0){el.setAttribute('pathLength','1');el.style.strokeDasharray='1';return el.animate([{strokeDashoffset:1},{strokeDashoffset:0}],{duration:RM?1:dur,delay,fill:'both'}).finished.catch(()=>{})}
function stamp(st,x,y,text,col='var(--red)'){const g=add(st,`<g transform="translate(${x},${y}) rotate(-8)"><rect x="${-text.length*10-18}" y="-30" width="${text.length*20+36}" height="56" rx="10" fill="none" stroke="${col}" stroke-width="5"/>
  <text x="0" y="10" text-anchor="middle" style="font-family:var(--f-display);font-weight:800;font-size:28px;fill:${col}">${text}</text></g>`);
  el0(g);sfx('combo');return g.animate([{transform:'scale(3)',opacity:0},{transform:'scale(.92)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}],{duration:RM?1:500,easing:'ease-in',fill:'backwards'}).finished.catch(()=>{})}
function el0(g){g.style.transformBox='fill-box';g.style.transformOrigin='center'}
function stageLine(st,min,max,o={}){
  const y=o.y??300,x0=o.x0??80,x1=o.x1??720,den=o.den??1,Xv=v=>x0+(v-min)/(max-min)*(x1-x0);
  const base=add(st,`<line class="sl" x1="${x0-34}" y1="${y}" x2="${x1+34}" y2="${y}"/>`);base.style.transformBox='';
  const arrows=add(st,`<polyline class="sl" points="${x1+20},${y-10} ${x1+34},${y} ${x1+20},${y+10}"/><polyline class="sl" points="${x0-20},${y-10} ${x0-34},${y} ${x0-20},${y+10}"/>`);
  drawStroke(base.firstChild,600);pop(arrows,500,300);
  add(st,`<line class="flow" x1="${x0-34}" y1="${y}" x2="${x1+34}" y2="${y}"/>`);
  if(min<0){const z=Xv(Math.min(0,max));add(st,`<g class="ereg"><rect x="${Xv(min)}" y="${y-24}" width="${z-Xv(min)}" height="48" rx="10" style="fill:rgba(77,243,255,.08);stroke:rgba(77,243,255,.4);stroke-dasharray:6 5"/><text x="${(Xv(min)+z)/2}" y="${y+78}" text-anchor="middle" class="st-lbl" style="fill:var(--cyan);font-size:18px">e⁻ bölgesi · negatif sayılar</text></g>`)}
  const labels={},minors=[];
  for(let k=0;k<=(max-min)*den;k++){const v=min+k/den,maj=k%den===0;
    const t=add(st,`<line class="${maj?'stk':'stk-m'}" x1="${Xv(v)}" y1="${y-(maj?14:8)}" x2="${Xv(v)}" y2="${y+(maj?14:8)}"/>`);
    if(!maj&&o.minorLater){t.style.opacity=0;minors.push(t)}else pop(t,300+k*18,260);
    if(maj){const iv=Math.round(v);const lb=add(st,T(Xv(v),y+48,neg(iv),'st-lbl'+(iv===0?' st-gold':'')));labels[iv]=lb;if(o.hideLabels)lb.style.opacity=0;else pop(lb,400+k*22,320)}}
  return {X:Xv,y,labels,show(v,d=0){const l=labels[v];return l?pop(l,d,380):Promise.resolve()},showMinors(){minors.forEach((m,i)=>pop(m,i*60,260));return wait(minors.length*60+300)}};
}
function heroAt(st,x,y){const g=document.createElementNS(NS,'g');g.innerHTML=heroSVG();st.appendChild(g);g.style.transform=`translate(${x}px,${y}px)`;return {g,x,y}}
function dropIn(h,delay=0){sfx('hop');return h.g.animate([{transform:`translate(${h.x}px,${h.y-320}px)`},{transform:`translate(${h.x}px,${h.y}px)`,offset:.65},{transform:`translate(${h.x}px,${h.y-34}px)`,offset:.82},{transform:`translate(${h.x}px,${h.y}px)`}],{duration:RM?1:800,delay,easing:'ease-in',fill:'backwards'}).finished.catch(()=>{})}
function hop(h,xs,each=430,onLand){
  if(!xs.length)return Promise.resolve();const kf=[{transform:`translate(${h.x}px,${h.y}px)`,offset:0}];let cur=h.x;const n=xs.length;
  xs.forEach((x,i)=>{kf.push({transform:`translate(${(cur+x)/2}px,${h.y-56}px)`,offset:(i+.5)/n});kf.push({transform:`translate(${x}px,${h.y}px)`,offset:(i+1)/n});cur=x;
    setTimeout(()=>{sfx('hop');onLand&&onLand(i)},RM?0:each*(i+1)-40)});
  const a=h.g.animate(kf,{duration:RM?1:each*n,easing:'linear',fill:'forwards'});h.x=cur;return a.finished.then(()=>{h.g.style.transform=`translate(${cur}px,${h.y}px)`}).catch(()=>{})}
function jump(h){return h.g.animate([{transform:`translate(${h.x}px,${h.y}px)`},{transform:`translate(${h.x}px,${h.y-40}px)`},{transform:`translate(${h.x}px,${h.y}px)`}],{duration:420,iterations:2}).finished.catch(()=>{})}

const BRIEF1=[
 {name:'Görev',steps:[
  {say:'Merhaba kaşif! Ben Rakam. Bu görevde sayı doğrusunun ustası olacağız.',act:async st=>{pop(add(st,T(400,110,'GÖREV 1','st-big')));pop(add(st,T(400,160,'SAYI DOĞRUSU AVI','st-sub')),350);const h=heroAt(st,400,400);await dropIn(h,500)}},
  {say:'Tam sayılar, rasyonel sayılar ve mutlak değer bizi bekliyor. Bir de tuzaklar var: doğru görünen ama yanlış olan illüzyonlar!',act:async st=>{
    const P0=[[140,250,'−3','st-cyan'],[660,250,'¾','st-gold'],[110,370,'|−5|','st-pink'],[690,370,'0,3̅','st-ok'],[250,300,'−1¼','st-gold'],[560,300,'(−2)·(−4)','st-pink']];
    for(const [x,y,s,c] of P0){const g=add(st,T(x,y,s,'st-chip '+c));pop(g).then(()=>floaty(g));sfx('tick');await wait(220)}}},
  {say:'Hazır mısın? Haydi başlayalım!',act:async st=>{const h=st.querySelector('.hero');if(h)h.parentNode.animate([{transform:'translate(400px,400px)'},{transform:'translate(400px,360px)'},{transform:'translate(400px,400px)'}],{duration:400,iterations:2})}}
 ]},
 {name:'Sayı doğrusu',steps:[
  {say:'Bu bir sayı doğrusu. Tam ortasında sıfır oturuyor.',act:async st=>{pop(add(st,T(400,80,'SAYI DOĞRUSU','st-sub')));st._L=stageLine(st,-6,6,{hideLabels:true,y:260});await wait(700);await st._L.show(0)}},
  {say:'Sağa gittikçe sayılar büyür: bir, iki, üç...',act:async st=>{for(let v=1;v<=6;v++){st._L.show(v);sfx('tick');await wait(170)}pop(add(st,T(620,180,'BÜYÜR →','st-mid st-ok')))}},
  {say:'Sola gittikçe sayılar küçülür. Sıfırın solunda negatif sayılar yaşar.',act:async st=>{for(let v=-1;v>=-6;v--){st._L.show(v);sfx('tick');await wait(170)}pop(add(st,T(180,180,'← KÜÇÜLÜR','st-mid st-pink')))}}
 ]},
 {name:'İllüzyon 1',steps:[
  {say:'Bir bilmece: eksi sekiz mi büyük, eksi üç mü?',act:async st=>{
    st._a=add(st,`<g transform="translate(240,130)"><rect x="-90" y="-58" width="180" height="116" rx="18" class="card-r"/>${T(0,18,'−8','st-eq')}</g>`);
    st._b=add(st,`<g transform="translate(560,130)"><rect x="-90" y="-58" width="180" height="116" rx="18" class="card-r"/>${T(0,18,'−3','st-eq')}</g>`);
    pop(st._a);await wait(200);pop(st._b);pop(add(st,T(400,148,'?','st-big')),400)}},
  {say:'Sekiz daha büyük bir rakam. Bu yüzden eksi sekiz büyük görünüyor. İşte illüzyon bu!',act:async st=>{
    st._a.animate([{transform:'scale(1)'},{transform:'scale(1.35)'}],{duration:500,fill:'forwards'});pop(add(st,T(240,240,'büyük görünüyor...','st-lbl st-pink')),300)}},
  {say:'Sayı doğrusuna soralım.',act:async st=>{const L=stageLine(st,-10,2,{y:330,x0:70,x1:730});st._L=L;await wait(800);
    for(const v of [-8,-3]){const d=add(st,`<circle cx="${L.X(v)}" cy="${L.y}" r="13" fill="${v===-8?'var(--pink)':'var(--green)'}" stroke="#fff" stroke-width="3"/>`);
      d.animate([{transform:'translateY(-200px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:600,easing:'cubic-bezier(.3,1.5,.6,1)',fill:'backwards'});sfx('hop');await wait(350)}}},
  {say:'Eksi üç daha sağda. Sağdaki sayı her zaman büyüktür. Yani eksi üç, eksi sekizden büyüktür!',act:async st=>{
    st._a.animate([{transform:'scale(1.35)'},{transform:'scale(.85)'}],{duration:400,fill:'forwards'});st._b.animate([{transform:'scale(1)'},{transform:'scale(1.3)'}],{duration:400,fill:'forwards'});
    pop(add(st,T(400,250,'−3 &gt; −8','st-eq st-ok')),300);await wait(900);await stamp(st,400,200,'İLLÜZYON YAKALANDI!')}}
 ]},
 {name:'Toplama',steps:[
  {say:'Toplama bir yolculuktur. Eksi üçten başlayalım.',act:async st=>{st._eq=add(st,T(400,90,'(−3) + 5 = ?','st-eq'));pop(st._eq);const L=stageLine(st,-6,6,{y:330});st._L=L;await wait(600);st._h=heroAt(st,L.X(-3),L.y-18);await dropIn(st._h)}},
  {say:'Artı beş, sağa beş adım demektir. Bir, iki, üç, dört, beş!',act:async st=>{const L=st._L;
    await hop(st._h,[-2,-1,0,1,2].map(L.X),520,i=>pop(add(st,T(L.X(-2+i),L.y-150,String(i+1),'st-mid st-gold')),0,300))}},
  {say:'Vardığımız yer iki. Yani eksi üç artı beş, iki eder. Artı sağa, eksi sola götürür.',act:async st=>{fadeOut(st._eq,200);pop(add(st,T(400,90,'(−3) + 5 = 2','st-eq st-ok')),200);pop(add(st,T(400,140,'artı → sağa · eksi → sola','st-lbl st-cyan')),600)}}
 ]},
 {name:'Çifte eksi',steps:[
  {say:'Şimdi bir tuzak sorusu: iki eksi, eksi dört.',act:async st=>{st._p1=add(st,T(250,100,'2','st-eq'));st._p2=add(st,T(400,100,'− (−4)','st-eq st-pink'));st._p3=add(st,T(560,100,'= ?','st-eq'));
    pop(st._p1);pop(st._p2,150);pop(st._p3,300);st._L=stageLine(st,-2,8,{y:330})}},
  {say:'Sihirli kural: çıkarma, tersini toplamaktır. Eksi dördün tersi, artı dört.',act:async st=>{const t=st._p2;sfx('flip');
    await t.animate([{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration:300,fill:'forwards'}).finished;t.querySelector('text').textContent='+ 4';t.querySelector('text').setAttribute('class','st-eq st-ok');
    await t.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:300,fill:'forwards'}).finished;pop(add(st,T(400,160,'çıkarma = tersini topla','st-lbl st-cyan')))}},
  {say:'İkiden sağa dört adım: altı! Yani iki eksi eksi dört, altı eder.',act:async st=>{const L=st._L;st._h=heroAt(st,L.X(2),L.y-18);await dropIn(st._h);await hop(st._h,[3,4,5,6].map(L.X),450);
    fadeOut(st._p3,150);pop(add(st,T(560,100,'= 6','st-eq st-ok')),150)}},
  {say:'Tuzağa düşüp eksi iki diyenler çok olur. Sen düşme!',act:async st=>{const L=st._L;const w=add(st,T(L.X(-2),L.y-60,'−2 ✗','st-mid st-bad'));await pop(w);shakeEl(w)}}
 ]},
 {name:'İşaret kuralı',steps:[
  {say:'Herkes eksi eksi artı yapar der. Ama bu her yerde doğru değil!',act:async st=>{const g=add(st,T(400,240,'− − = + ?','st-big'));await pop(g);pulse(g);st._q=g}},
  {say:'Kural yalnızca çarpma ve bölmede geçerli. Eksi üç çarpı eksi iki, artı altıdır.',act:async st=>{fadeOut(st._q,250);await wait(250);
    pop(add(st,`<rect x="40" y="70" width="340" height="300" rx="20" class="panel-r"/>${T(210,112,'ÇARPMA · BÖLME','st-lbl st-cyan')}`));
    const m1=add(st,`<rect x="110" y="200" width="46" height="12" rx="6" fill="var(--pink)"/>`),m2=add(st,`<rect x="264" y="200" width="46" height="12" rx="6" fill="var(--pink)"/>`);
    m1.animate([{transform:'translateX(0)'},{transform:'translateX(54px)'}],{duration:500,delay:300,fill:'forwards'});await m2.animate([{transform:'translateX(0)'},{transform:'translateX(-54px)'}],{duration:500,delay:300,fill:'forwards'}).finished.catch(()=>{});
    sfx('boing');m1.querySelector('rect').setAttribute('fill','var(--green)');m2.querySelector('rect').setAttribute('fill','var(--green)');
    m2.animate([{transform:'translateX(-54px) rotate(0deg)'},{transform:'translateX(-100px) rotate(90deg)'}],{duration:400,fill:'forwards'});m1.animate([{transform:'translateX(54px)'},{transform:'translateX(54px)'}],{duration:400,fill:'forwards'});
    pop(add(st,T(210,310,'(−3)·(−2) = +6','st-mid st-ok')),400)}},
  {say:'Toplama ve çıkarmada ise yolculuk yaparız: eksi üçten iki adım sola, eksi beş.',act:async st=>{
    pop(add(st,`<rect x="420" y="70" width="340" height="300" rx="20" class="panel-r"/>${T(590,112,'TOPLAMA · ÇIKARMA','st-lbl st-cyan')}`));
    const L=stageLine(st,-6,0,{y:220,x0:460,x1:720});await wait(600);const d=add(st,`<circle cx="${L.X(-3)}" cy="${L.y}" r="11" fill="var(--gold)"/>`);pop(d);await wait(300);
    d.animate([{transform:'translateX(0)'},{transform:`translateX(${L.X(-5)-L.X(-3)}px)`}],{duration:700,fill:'forwards'});sfx('hop');pop(add(st,T(590,310,'−3 − 2 = −5','st-mid st-pink')),500)}},
  {say:'Kısacası: çarpma ve bölmede aynı işaretler dost, sonuç artı. Farklı işaretler küs, sonuç eksi.',act:async st=>{
    const R=[['+ · + = +','st-ok'],['− · − = +','st-ok'],['+ · − = −','st-pink'],['− · + = −','st-pink']];
    for(let i=0;i<4;i++){pop(add(st,T(120+i*186,420,R[i][0],'st-mid '+R[i][1])));sfx('tick');await wait(250)}}}
 ]},
 {name:'Mutlak değer',steps:[
  {say:'Mutlak değer, bir sayının sıfıra olan uzaklığıdır.',act:async st=>{pop(add(st,T(400,80,'|a| = sıfıra uzaklık','st-sub')));st._L=stageLine(st,-6,6,{y:320})}},
  {say:'Eksi beş de beş de sıfırdan beş adım uzakta. Bu yüzden ikisinin de mutlak değeri beştir.',act:async st=>{const L=st._L;
    for(const v of [-5,5]){pop(add(st,`<circle cx="${L.X(v)}" cy="${L.y}" r="12" fill="${v<0?'var(--pink)':'var(--green)'}" stroke="#fff" stroke-width="3"/>`));
      const p=add(st,`<path d="M${L.X(v)} ${L.y-16} Q${(L.X(v)+L.X(0))/2} ${L.y-150} ${L.X(0)} ${L.y-16}" fill="none" stroke="var(--gold)" stroke-width="4" stroke-dasharray="1"/>`);p.style.transformBox='';
      await drawStroke(p.firstChild,700);pop(add(st,T((L.X(v)+L.X(0))/2,L.y-96,'5 birim','st-lbl st-gold')))}
    pop(add(st,T(400,150,'|−5| = 5    |5| = 5','st-mid')))}},
  {say:'Uzaklık hiçbir zaman negatif olmaz.',act:async st=>{await stamp(st,400,410,'ASLA NEGATİF DEĞİL!','var(--green)')}},
  {say:'Ama dikkat: mutlak değerin dışındaki eksi kalır. Eksi, mutlak eksi dört, eksi dört eder.',act:async st=>{
    [...st.children].forEach(c=>fadeOut(c,250));await wait(300);const a=add(st,T(330,220,'−','st-big st-pink'));pop(a);pulse(a);
    pop(add(st,T(460,220,'|−4| = −4','st-big')),200);pop(add(st,T(400,300,'dışarıdaki eksi kalır!','st-sub')),500)}}
 ]},
 {name:'Kesirler',steps:[
  {say:'Rasyonel sayılar tam sayıların arasında yaşar. Her birimi dört eş parçaya bölelim.',act:async st=>{st._L=stageLine(st,-2,2,{y:320,den:4,minorLater:true});await wait(900);await st._L.showMinors()}},
  {say:'Eksi bir tam dörtte bir nerede? Önce eksi bire git.',act:async st=>{st._eq=add(st,T(400,90,'−1¼ = ?','st-eq'));pop(st._eq);const L=st._L;st._h=heroAt(st,L.X(-1),L.y-18);await dropIn(st._h)}},
  {say:'Sonra bir çeyrek daha sola git! Sağa değil, çünkü sayı daha da küçülüyor.',act:async st=>{const L=st._L;
    const gh=add(st,`<g opacity=".9">${T(L.X(-.75),L.y-130,'✗ −¾','st-mid st-bad')}<line x1="${L.X(-.75)}" y1="${L.y-110}" x2="${L.X(-.75)}" y2="${L.y-20}" stroke="var(--red)" stroke-width="3" stroke-dasharray="6 5"/></g>`);
    await pop(gh);shakeEl(gh);await wait(400);await hop(st._h,[L.X(-1.25)],600);fadeOut(st._eq,200);pop(add(st,T(400,90,'−1¼ = −5/4 = −1,25','st-eq st-ok')),200)}}
 ]},
 {name:'Devirli',steps:[
  {say:'Bir bölü üç yapalım.',act:async st=>{pop(add(st,T(120,220,'1 : 3 =','st-eq','start')));st._z=add(st,T(330,220,'0,','st-eq','start'));pop(st._z,300)}},
  {say:'Üç, üç, üç... Bu üçler sonsuza kadar gelir!',act:async st=>{const w=st._z.querySelector('text').getComputedTextLength(),cw=w/2;st._cw=cw;st._x3=330+w;st._digits=[];
    for(let i=0;i<7;i++){const d=add(st,T(330+w+i*cw,220,'3','st-eq st-gold','start'));st._digits.push(d);pop(d,0,300);sfx('tick');await wait(260)}pop(add(st,T(330+w+7*cw+6,220,'...','st-eq','start')))}},
  {say:'Tekrar eden kısmın üstüne bir çizgi çekeriz. Buna devirli ondalık gösterim denir.',act:async st=>{
    st._digits.slice(1).forEach(d=>fadeOut(d,300));[...st.children].slice(-1).forEach(c=>fadeOut(c,300));await wait(350);
    const l=add(st,`<line x1="${st._x3}" y1="176" x2="${st._x3+st._cw}" y2="176" stroke="var(--gold)" stroke-width="5"/>`);l.style.transformBox='';await drawStroke(l.firstChild,500);
    pop(add(st,T(400,320,'1/3 = 0,3̅ (devirli)','st-sub')))}},
  {say:'Tuzak: sıfır virgül üç, onda üç demektir. Üçte bir değildir!',act:async st=>{const g=add(st,T(400,400,'0,3 = 3/10  ≠  1/3','st-mid st-pink'));await pop(g);shakeEl(g)}}
 ]},
 {name:'Kurallar',steps:[
  {say:'Görev kurallarını toplayalım.',act:async st=>{pop(add(st,T(400,70,'GÖREV KURALLARI','st-sub')))}},
  ...[['1. Sağdaki sayı büyüktür.','Bir: Sağdaki sayı büyüktür.'],['2. Çıkarma = tersini topla.','İki: Çıkarma, tersini toplamaktır.'],['3. − · − = + (yalnızca çarpma/bölme)','Üç: Eksi çarpı eksi artıdır, ama yalnızca çarpma ve bölmede.'],['4. Mutlak değer = uzaklık, asla negatif değil','Dört: Mutlak değer uzaklıktır, asla negatif olmaz.']].map(([t,s],i)=>({say:s,act:async st=>{
    pop(add(st,`<rect x="70" y="${104+i*66}" width="660" height="52" rx="14" class="card-r"/>${T(96,138+i*66,t,'st-txt','start')}`));sfx('tick')}})),
  {say:'Hata yaparsan annem terliğiyle hata canavarını kovalayacak. Her doğru cevap sana altın kazandırır. Haydi, göreve!',act:async st=>{const h=heroAt(st,740,440);await dropIn(h);jump(h)}}
 ]}
];
/* ================= 3D (Three.js r128): rotatable solids, folding nets, volume filling, views ================= */
let _has3d=null;
function can3D(){if(_has3d===null){try{const c=document.createElement('canvas');_has3d=typeof THREE!=='undefined'&&!!(c.getContext('webgl')||c.getContext('experimental-webgl'))}catch(e){_has3d=false}}return _has3d}
const cssVar=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#888888';
function mat3(col,op=.92){return new THREE.MeshLambertMaterial({color:new THREE.Color(col),side:THREE.DoubleSide,transparent:op<1,opacity:op,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1})}
function edges3(geo,col){return new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:new THREE.Color(col)}))}
function mount3D(el,build){
  const W=el.clientWidth||400,H=el.clientHeight||300,renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.setSize(W,H);el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,W/H,.1,200);cam.position.set(0,0,13);
  scene.add(new THREE.AmbientLight(0xffffff,.62));const dl=new THREE.DirectionalLight(0xffffff,.65);dl.position.set(4,9,8);scene.add(dl);
  const root=new THREE.Group();scene.add(root);
  const c={scene,cam,root,el,rotX:.5,rotY:-.7,auto:true,tick:null,target:null,label:null,
    say(t){if(!c.label){c.label=document.createElement('span');c.label.className='v3l';el.appendChild(c.label)}c.label.textContent=t}};
  build(c);
  el.classList.add('v3d');el.tabIndex=0;el.setAttribute('role','img');
  let drag=false,lx=0,ly=0;
  el.addEventListener('pointerdown',e=>{drag=true;c.auto=false;c.target=null;lx=e.clientX;ly=e.clientY;try{el.setPointerCapture(e.pointerId)}catch(_){}e.stopPropagation()});
  el.addEventListener('pointermove',e=>{if(!drag)return;c.rotY+=(e.clientX-lx)*.012;c.rotX=Math.max(-1.5,Math.min(1.5,c.rotX+(e.clientY-ly)*.012));lx=e.clientX;ly=e.clientY});
  el.addEventListener('pointerup',()=>{drag=false});el.addEventListener('pointercancel',()=>{drag=false});
  el.addEventListener('keydown',e=>{const k={ArrowLeft:[0,-.25],ArrowRight:[0,.25],ArrowUp:[-.2,0],ArrowDown:[.2,0]}[e.key];if(!k)return;e.preventDefault();e.stopPropagation();c.auto=false;c.target=null;c.rotX=Math.max(-1.5,Math.min(1.5,c.rotX+k[0]));c.rotY+=k[1]});
  const ro=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;if(w&&h){renderer.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix()}});ro.observe(el);
  let last=performance.now();
  const loop=now=>{
    if(!document.contains(el)){ro.disconnect();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())});renderer.dispose();return}
    const dt=Math.min(.05,(now-last)/1000);last=now;const paused=B.paused&&el.closest('.stagebox');
    if(!paused){if(c.target){c.rotX+=(c.target[0]-c.rotX)*Math.min(1,dt*4);c.rotY+=(c.target[1]-c.rotY)*Math.min(1,dt*4)}else if(c.auto&&!RM)c.rotY+=dt*.35;if(c.tick)c.tick(dt)}
    root.rotation.set(c.rotX,c.rotY,0);renderer.render(scene,cam);requestAnimationFrame(loop)};
  requestAnimationFrame(loop);return c;
}
const FACE3=()=>({fb:cssVar('--cyan'),tb:cssVar('--violet'),lr:cssVar('--pink'),ink:cssVar('--ink')});
const BUILD3={
  /* rotatable box a (en) × b (boy, depth) × c (yükseklik), with unit grid lines and a caption */
  prism(c,p){const k=FACE3(),s=4.2/Math.max(p.a,p.b,p.c),geo=new THREE.BoxGeometry(p.a*s,p.c*s,p.b*s);
    const m=[mat3(k.lr,.8),mat3(k.lr,.8),mat3(k.tb,.8),mat3(k.tb,.8),mat3(k.fb,.8),mat3(k.fb,.8)],box=new THREE.Mesh(geo,m);c.root.add(box,edges3(geo,k.ink));
    if(p.grid!==false&&p.a<=10&&p.b<=10&&p.c<=10){const pts=[],A=p.a*s/2,Bz=p.b*s/2,C=p.c*s/2,e=.002;
      for(let i=1;i<p.a;i++){const x=-A+i*s;pts.push(x,-C,Bz+e,x,C,Bz+e, x,C+e,-Bz,x,C+e,Bz)}
      for(let j=1;j<p.c;j++){const y=-C+j*s;pts.push(-A,y,Bz+e,A,y,Bz+e, A+e,y,-Bz,A+e,y,Bz)}
      for(let i=1;i<p.b;i++){const z=-Bz+i*s;pts.push(-A,C+e,z,A,C+e,z, A+e,-C,z,A+e,C,z)}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));c.root.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:new THREE.Color(k.ink),transparent:true,opacity:.35})))}
    if(p.label)c.say(p.label)},
  /* net that folds into the box and unfolds again, on hinges */
  net(c,p){const k=FACE3(),s=8/Math.max(p.a+2*p.c,2*p.b+2*p.c),a=p.a*s,b=p.b*s,h=p.c*s,g=new THREE.Group();c.root.add(g);g.position.set(0,-h/2,b/4);c.cam.position.z=11.5;
    const face=(w,d,col)=>{const geo=new THREE.PlaneGeometry(w,d);geo.rotateX(-Math.PI/2);const m=new THREE.Mesh(geo,mat3(col,.9)),grp=new THREE.Group();grp.add(m,edges3(geo,k.ink));return grp};
    const bottom=face(a,b,k.tb);g.add(bottom);
    const hinge=(parent,px,pz,axis)=>{const o=new THREE.Group();o.position.set(px,0,pz);parent.add(o);o.userData.axis=axis;return o};
    const hF=hinge(g,0,b/2,'x'),fF=face(a,h,k.fb);fF.position.z=h/2;hF.add(fF);
    const hB=hinge(g,0,-b/2,'x'),fB=face(a,h,k.fb);fB.position.z=-h/2;hB.add(fB);
    const hL=hinge(g,-a/2,0,'z'),fL=face(h,b,k.lr);fL.position.x=-h/2;hL.add(fL);
    const hR=hinge(g,a/2,0,'z'),fR=face(h,b,k.lr);fR.position.x=h/2;hR.add(fR);
    const hT=hinge(hB,0,-h,'x'),fT=face(a,b,k.tb);fT.position.z=-b/2;hT.add(fT);
    c.rotX=.75;let t=0;const set=f=>{const q=f*Math.PI/2;hF.rotation.x=-q;hB.rotation.x=q;hL.rotation.z=-q;hR.rotation.z=q;hT.rotation.x=q};
    c.tick=dt=>{t=(t+dt/7)%1;const ph=t<.35?t/.35:t<.5?1:t<.85?1-(t-.5)/.35:0,f=ph<.5?2*ph*ph:1-Math.pow(-2*ph+2,2)/2;set(f);
      c.say(t<.35?'Kapanıyor: açınım → prizma':t<.5?'Dikdörtgenler prizması':t<.85?'Açılıyor: prizma → açınım':'Açınım: 6 dikdörtgen')};set(0)},
  /* unit cubes fill the box layer by layer, with a counter */
  fill(c,p){const k=FACE3(),s=4/Math.max(p.a,p.b,p.c),A=p.a,Bd=p.b,C=p.c,n=A*Bd*C;
    const shell=new THREE.BoxGeometry(A*s,C*s,Bd*s);c.root.add(edges3(shell,k.ink));
    const geo=new THREE.BoxGeometry(s*.94,s*.94,s*.94),cubes=[];
    for(let z=0;z<C;z++)for(let y=0;y<Bd;y++)for(let x=0;x<A;x++){const m=new THREE.Mesh(geo,[mat3(k.lr),mat3(k.lr),mat3(k.tb),mat3(k.tb),mat3(k.fb),mat3(k.fb)]);
      m.position.set((x+.5)*s-A*s/2,(z+.5)*s-C*s/2,(y+.5)*s-Bd*s/2);m.scale.setScalar(.001);c.root.add(m);cubes.push(m)}
    let t=0;const per=.16,total=n*per+2.5;
    c.tick=dt=>{t=(t+dt)%total;const shown=Math.min(n,Math.floor(t/per));cubes.forEach((m,i)=>{const g=i<shown?1:i===shown?Math.min(1,(t-i*per)/per):0;m.scale.setScalar(Math.max(.001,g))});
      const layer=Math.min(C,Math.floor(shown/(A*Bd))+(shown%(A*Bd)?1:0));c.say(`${shown} / ${n} birim küp · ${layer}. kat · ${A} · ${Bd} · ${C} = ${n}`)}},
  /* a structure of unit cubes ([x, depth, up]); with views:true it turns to front, top and right views in turn */
  /* reflection as a fold: a flat shape on a grid turns 180° about the line of symmetry and lands on its mirror image */
  flip(c,p){const k=FACE3(),mat3=(col,op=1)=>new THREE.MeshBasicMaterial({color:new THREE.Color(col),side:THREE.DoubleSide,transparent:op<1,opacity:op}),C=p.cols,R=p.rows,u=Math.min(8.4/C,6/R),X=col=>(col+.5-C/2)*u,Y=row=>-(row+.5-R/2)*u;
    const grid=[];for(let i=0;i<=C;i++)grid.push((i-C/2)*u,-R/2*u,0,(i-C/2)*u,R/2*u,0);for(let j=0;j<=R;j++)grid.push(-C/2*u,(j-R/2)*u,0,C/2*u,(j-R/2)*u,0);
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(grid,3));c.root.add(new THREE.LineSegments(gg,new THREE.LineBasicMaterial({color:new THREE.Color(k.ink),transparent:true,opacity:.25})));
    const ax=p.vert?(p.k-C/2)*u:-(p.k-R/2)*u,aGeo=new THREE.BoxGeometry(p.vert?.08:C*u+.4,p.vert?R*u+.4:.08,.06),axis=new THREE.Mesh(aGeo,mat3(k.lr,1));if(p.vert)axis.position.x=ax;else axis.position.y=ax;c.root.add(axis);
    const pivot=new THREE.Group();if(p.vert)pivot.position.x=ax;else pivot.position.y=ax;c.root.add(pivot);
    const cg=new THREE.BoxGeometry(u*.96,u*.96,.12);
    for(const [r,col] of p.cells){const m=new THREE.Mesh(cg,mat3(k.fb,.95));m.position.set(X(col)-(p.vert?ax:0),Y(r)-(p.vert?0:ax),.07);pivot.add(m);const e=edges3(cg,k.ink);e.position.copy(m.position);pivot.add(e);
      const gh=new THREE.Mesh(new THREE.PlaneGeometry(u*.96,u*.96),mat3(k.tb,.35)),mx=p.vert?2*ax-X(col):X(col),my=p.vert?Y(r):2*ax-Y(r);gh.position.set(mx,my,.01);c.root.add(gh)}
    c.auto=false;c.rotX=-.35;c.rotY=p.vert?.25:-.25;let t=0;
    c.tick=dt=>{t=(t+dt/4.2)%1;const ph=t<.15?0:t<.55?(t-.15)/.4:t<.85?1:1-(t-.85)/.15,f=ph<.5?2*ph*ph:1-Math.pow(-2*ph+2,2)/2;
      if(p.vert)pivot.rotation.y=f*Math.PI;else pivot.rotation.x=f*Math.PI;c.say(t<.15?'Şekil':t<.55?'Katlanıyor…':t<.85?'Görüntü: aynı uzaklık, ters yön':'Yeniden')}},
  stack(c,p){const k=FACE3(),L=p.cubes||CUBES,s=1.55,mx=Math.max(...L.map(q=>q[0]))+1,my=Math.max(...L.map(q=>q[1]))+1,mz=Math.max(...L.map(q=>q[2]))+1,geo=new THREE.BoxGeometry(s*.98,s*.98,s*.98);
    for(const [x,y,z] of L){const m=new THREE.Mesh(geo,[mat3(k.lr,1),mat3(k.lr,1),mat3(k.tb,1),mat3(k.tb,1),mat3(k.fb,1),mat3(k.fb,1)]);m.position.set((x+.5-mx/2)*s,(z+.5-mz/2)*s,-(y+.5-my/2)*s);c.root.add(m);const e=edges3(geo,k.ink);e.position.copy(m.position);c.root.add(e)}
    if(p.label)c.say(p.label);
    if(p.views){const V=[['Serbest bakış',null],['Önden görünüm',[0,0]],['Üstten görünüm',[Math.PI/2,0]],['Sağdan görünüm',[0,-Math.PI/2]]];let t=0,cur=-1;
      c.tick=dt=>{if(!c.auto&&!c.target)return;t+=dt;const i=Math.floor(t/2.6)%V.length;if(i!==cur){cur=i;c.target=V[i][1];c.say(V[i][0]);if(!V[i][1]){c.target=[.5,-.7]}}}}}
};
/* put a 3D view over the briefing stage at a box given in stage (800×450) coordinates */
function place3D(d,st,box){const sb=st.closest('.stagebox');if(!sb)return;const r=st.getBoundingClientRect(),q=sb.getBoundingClientRect(),k=Math.min(r.width/800,r.height/450),ox=r.left-q.left+(r.width-800*k)/2,oy=r.top-q.top+(r.height-450*k)/2;
  Object.assign(d.style,{left:ox+box[0]*k+'px',top:oy+box[1]*k+'px',width:box[2]*k+'px',height:box[3]*k+'px'})}
function fallback3D(kind,p){if(kind==='flip')return miniReflectSVG();if(kind==='stack')return cubeStackSVG(p.cubes||CUBES,!p.noCount);if(kind==='net')return netSVG(p.a,p.b,p.c);return prismSVG(p.a,p.b,p.c,{a:'',b:'',c:''})}

/* ================= Öğren lesson player: each lesson is a short declarative script ================= */
/* script = [[sceneName, narration, [[op, ...args], ...]], ...]; ops draw onto the 800×450 briefing stage */
const fitFs=(t,max,k)=>Math.max(16,Math.min(max,k/Math.max(1,String(t).replace(/<[^>]+>|&[a-z]+;/g,'x').length)));
/* the first text line (below the TUZAK/İPUCU stamp) that no other text on the board already uses */
function freeY(st){const used=[...st.querySelectorAll('text')].map(t=>+t.getAttribute('y')).filter(v=>v);return [300,388,350,130,90].find(y=>used.every(u=>Math.abs(u-y)>36))||388}
/* what is already drawn: vertical bands [top,bottom] in board units (whole-board backgrounds ignored) */
function bands(st){try{const R=st.getBoundingClientRect();if(!R.width)return null;const k=800/R.width;
  return [...st.children].map(c=>{const r=c.getBoundingClientRect();return r.height?[(r.top-R.top)*k,(r.bottom-R.top)*k]:null}).filter(b=>b&&b[1]-b[0]<380)}catch(e){return null}}
const isFree=(B,a,b)=>B.every(([t,m])=>m<a||t>b);
/* a text line asked for at y moves to the nearest free line if something already sits there */
function freeLine(st,y){const B=bands(st);if(!B||isFree(B,y-30,y+10))return y;
  const c=[410,388,360,330,300,270,240,210,180,150,120,90].sort((p,q)=>Math.abs(p-y)-Math.abs(q-y)).find(v=>isFree(B,v-30,v+10));return c==null?y:c}
/* TUZAK/İPUCU: stamp plus its line where both fit; if the board is full, on a calm panel over it */
async function stampSlot(st,word,col,t,cls){const B=bands(st);let s=null;
  if(B)s=[[212,300],[140,226],[330,404],[352,416],[96,178],[262,346],[120,192]].find(([sy,ty])=>isFree(B,sy-42,sy+36)&&(!t||isFree(B,ty-30,ty+12)));
  else{const y=freeY(st);s=[212,y]}
  if(!s){s=[200,290];add(st,`<rect x="90" y="150" width="620" height="170" rx="22" class="card-r" style="opacity:.97"/>`)}
  await stamp(st,400,s[0],word,col);if(t)await txt0(st,t,s[1],cls)}
const txt0=async(st,t,y=300,cls='',x=400,max=28)=>{await pop(add(st,`<text x="${x}" y="${y}" text-anchor="middle" class="st-txt${cls}" style="font-size:${fitFs(t,max,x===400?1500:760)}px">${t}</text>`));await wait(200)};
const OPS={
 title:async(st,t,sub)=>{pop(add(st,`<text x="400" y="140" text-anchor="middle" class="st-big" style="font-size:${fitFs(t,64,1080)}px">${t}</text>`));if(sub)pop(add(st,T(400,192,sub,'st-lbl')),300);await dropIn(heroAt(st,400,410),400)},
 eq:async(st,t,y=120,cls='')=>{await pop(add(st,`<text x="400" y="${y}" text-anchor="middle" class="st-eq${cls}" style="font-size:${fitFs(t,46,1120)}px">${t}</text>`));await wait(250)},
 txt:async(st,t,y=300,cls='',x=400,max=28)=>txt0(st,t,x===400?freeLine(st,y):y,cls,x,max),
 lines:async(st,arr,y0=120,cls='')=>{for(let i=0;i<arr.length;i++){sfx('tick');await txt0(st,arr[i],y0+i*58,cls)}},
 rules:async(st,arr,y0=96)=>{const h=Math.min(66,(430-y0)/arr.length);for(let i=0;i<arr.length;i++){const y=y0+i*h;
   pop(add(st,`<rect x="70" y="${y}" width="660" height="${h-12}" rx="14" class="card-r"/><text x="96" y="${y+(h-12)/2+9}" class="st-txt" style="font-size:${fitFs(arr[i],26,1080)}px">${arr[i]}</text>`));sfx('tick');await wait(380)}},
 trap:async(st,t)=>stampSlot(st,'TUZAK!','var(--red)',t,' st-bad'),
 tip:async(st,t)=>stampSlot(st,'İPUCU','var(--green)',t,' st-ok'),
 svg:async(st,s,x=200,y=80,w=400,h=290)=>{await pop(add(st,s.replace('<svg ',`<svg x="${x}" y="${y}" width="${w}" height="${h}" `)),0,600);await wait(300)},
 table:async(st,rows,y0=110)=>{const cols=rows[0].length,cw=Math.min(210,700/cols),x0=400-cw*cols/2,rh=Math.max(40,Math.min(54,(438-y0)/rows.length)),ty=Math.round(rh*.65);
   for(let r=0;r<rows.length;r++){let s='';for(let c=0;c<cols;c++)s+=`<rect x="${x0+c*cw}" y="${y0+r*rh}" width="${cw}" height="${rh}" class="panel-r"/><text x="${x0+c*cw+cw/2}" y="${y0+r*rh+ty}" text-anchor="middle" class="st-txt${r===0?' st-cyan':''}" style="font-size:${Math.min(22,Math.floor((cw-10)*1.85/Math.max(1,String(rows[r][c]).length)))}px">${rows[r][c]}</text>`;
     pop(add(st,s));sfx('tick');await wait(320)}},
 line:async(st,min,max,o={})=>{const L=stageLine(st,min,max,{y:o.y??300,den:o.den??1});st._L=L;await wait(800);
   for(const [v,lab,col] of o.marks||[]){pop(add(st,`<circle cx="${L.X(v)}" cy="${L.y}" r="11" fill="${col||'var(--gold)'}" stroke="#fff" stroke-width="3"/>${lab?T(L.X(v),L.y-26,lab,'st-lbl st-gold'):''}`));await wait(260)}
   if(o.ray){const [v,dir,open]=o.ray,x=L.X(v),end=dir>0?L.X(max)+22:L.X(min)-22,y=L.y-34;
     const g=add(st,`<line x1="${x}" y1="${y}" x2="${end}" y2="${y}" stroke="var(--green)" stroke-width="6" stroke-linecap="round"/><polyline points="${end-14*dir},${y-11} ${end},${y} ${end-14*dir},${y+11}" fill="none" stroke="var(--green)" stroke-width="6"/><circle cx="${x}" cy="${y}" r="11" fill="${open?'var(--stage1)':'var(--green)'}" stroke="var(--green)" stroke-width="4"/>`);await pop(g)}
   if(o.hero!=null){st._h=heroAt(st,L.X(o.hero),L.y-18);await dropIn(st._h)}
   if(o.hops&&st._h)await hop(st._h,o.hops.map(L.X),480)},
 wait:(st,ms)=>wait(ms),
 /* 9.1 why π·r²: 12 slices of a circle line up, alternately up and down, into a near-rectangle π·r long and r high */
 circleStrip:async st=>{const n=12,R=92,cx=200,cy=215,al=2*Math.PI/n,ch=2*R*Math.sin(al/2),hh=R*Math.cos(al/2),x0=395,yb=310,sx=(R*Math.sin(al/2)).toFixed(1),sy=(-hh).toFixed(1);
   const d=`M0,0 L${-sx},${sy} A${R} ${R} 0 0 1 ${sx},${sy} Z`,G=[];
   for(let i=0;i<n;i++){const g=document.createElementNS(NS,'g');g.innerHTML=`<path d="${d}" class="${i%2?'f1':'f2'}" style="stroke:var(--ink);stroke-width:1.5"/>`;
     Object.assign(g.style,{transformBox:'view-box',transformOrigin:'0 0',transform:`translate(${cx}px,${cy}px) rotate(${i*360/n}deg)`});st.appendChild(g);G.push(g)}
   pop(add(st,T(cx,cy+R+40,'12 eş dilim','st-lbl')));await wait(1300);
   G.forEach((g,i)=>{const j=Math.floor(i/2),to=i%2===0?`translate(${x0+j*ch}px,${yb}px) rotate(0deg)`:`translate(${x0+j*ch+ch/2}px,${yb-hh}px) rotate(180deg)`;
     g.animate([{transform:g.style.transform},{transform:to}],{duration:RM?1:1500,delay:RM?0:i*110,easing:'cubic-bezier(.6,0,.3,1)',fill:'forwards'})});
   await wait(1500+n*110+300);sfx('combo');
   pop(add(st,T(x0+3*ch,yb+36,'π · r  (çevrenin yarısı)','st-lbl st-gold')));pop(add(st,T(x0-30,yb-hh/2+8,'r','st-mid st-cyan')),200);
   await wait(500);await OPS.eq(st,'Alan ≈ π·r · r = π·r²',95,' st-ok')},
 /* 9.2 a sector opens from 0° to α while its share of the circle is shown */
 sweep:async(st,r=6,alpha=60)=>{const cx=400,cy=225,R=125;add(st,`<circle cx="${cx}" cy="${cy}" r="${R}" class="s-dash"/><circle cx="${cx}" cy="${cy}" r="4" class="f-ink"/>`);
   const g=add(st,`<path class="f1 s-line"/><text x="${cx}" y="${cy+R+40}" text-anchor="middle" class="st-mid st-gold"></text>`),path=g.querySelector('path'),tx=g.querySelector('text');g.style.transformBox='';
   for(let k=0;k<=48;k++){const a=alpha*k/48,ar=a*Math.PI/180,ex=cx+R*Math.cos(ar),ey=cy-R*Math.sin(ar);
     path.setAttribute('d',a<=0?'':`M${cx},${cy} L${cx+R},${cy} A${R} ${R} 0 ${a>180?1:0} 0 ${ex.toFixed(1)},${ey.toFixed(1)} Z`);tx.textContent=`${Math.round(a)}° / 360°`;await wait(RM?0:35)}
   const gd=gcd(alpha,360);sfx('tick');await OPS.eq(st,`${alpha}/360 = ${alpha/gd}/${360/gd}`,70)},
 /* 9.3 why e·f/2: the four triangles of the rhombus turn over into the four empty corners of its rectangle */
 rhombusFold:async st=>{const C=[400,235],hx=170,hy=110,L=[C[0]-hx,C[1]],Tt=[C[0],C[1]-hy],Rr=[C[0]+hx,C[1]],Bb=[C[0],C[1]+hy],pt=a=>a.join(',');
   add(st,`<rect x="${L[0]}" y="${Tt[1]}" width="${2*hx}" height="${2*hy}" fill="none" style="stroke:var(--ink-soft);stroke-width:2;stroke-dasharray:6 5"/>`);
   const tris=[[Tt,L],[Tt,Rr],[Bb,Rr],[Bb,L]];
   for(const [p,q] of tris)add(st,`<polygon points="${pt(C)} ${pt(p)} ${pt(q)}" class="f1 s-line"/>`);
   pop(add(st,T(C[0],Bb[1]+40,'e · f dikdörtgeni içinde eşkenar dörtgen','st-lbl')));await wait(1200);
   for(const [p,q] of tris){const m=[(p[0]+q[0])/2,(p[1]+q[1])/2],g=add(st,`<polygon points="${pt(C)} ${pt(p)} ${pt(q)}" class="f2 s-line" style="opacity:.9"/>`);
     Object.assign(g.style,{transformBox:'view-box',transformOrigin:`${m[0]}px ${m[1]}px`});sfx('flip');
     await g.animate([{transform:'rotate(0deg)'},{transform:'rotate(180deg)'}],{duration:RM?1:900,easing:'ease-in-out',fill:'forwards'}).finished.catch(()=>{});await wait(150)}
   sfx('combo');await OPS.eq(st,'Eşkenar dörtgen = dikdörtgenin yarısı = e · f : 2',75,' st-ok')},
 /* 9.4 why (a+c)·h/2: a copy of the trapezoid turns 180° about the middle of its leg and the two make a parallelogram */
 trapDouble:async st=>{const s=22,a=12,c=6,h=5,x0=110,y0=330,off=(a-c)*s*.3,P=[[x0,y0],[x0+a*s,y0],[x0+off+c*s,y0-h*s],[x0+off,y0-h*s]],pt=q=>q.map(v=>v.toFixed(1)).join(','),pts=P.map(pt).join(' ');
   add(st,`<polygon points="${pts}" class="f1 s-line"/><line x1="${x0+off}" y1="${y0-h*s}" x2="${x0+off}" y2="${y0}" class="s-dash"/>`+T(x0+a*s/2,y0+28,'a = 12','st-lbl')+T(x0+off+c*s/2,y0-h*s-12,'c = 6','st-lbl')+T(x0+off-24,y0-h*s/2+6,'h','st-lbl st-cyan'));
   await wait(1200);const M=[(P[1][0]+P[2][0])/2,(P[1][1]+P[2][1])/2],g=add(st,`<polygon points="${pts}" class="f2 s-line" style="opacity:.92"/>`);
   Object.assign(g.style,{transformBox:'view-box',transformOrigin:`${M[0]}px ${M[1]}px`});sfx('flip');
   await g.animate([{transform:'rotate(0deg)'},{transform:'rotate(180deg)'}],{duration:RM?1:1600,easing:'ease-in-out',fill:'forwards'}).finished.catch(()=>{});
   sfx('combo');pop(add(st,T(x0+(a+c)*s/2,y0+58,'taban = a + c = 18','st-lbl st-gold')));await wait(300);await OPS.eq(st,'Paralelkenar: (a + c) · h → yamuk: (a + c) · h : 2',80,' st-ok')},
 three:async(st,kind,p={},box=[200,70,400,300])=>{if(!can3D())return OPS.svg(st,fallback3D(kind,p),...box);const sb=st.closest('.stagebox');if(!sb)return;
   const d=document.createElement('div');d.className='ov3d';d.setAttribute('aria-label','Döndürülebilir 3B model');sb.appendChild(d);place3D(d,st,box);
   const ro=new ResizeObserver(()=>{if(!document.contains(d)){ro.disconnect();return}place3D(d,st,box)});ro.observe(sb);
   d.animate([{opacity:0,transform:'scale(.92)'},{opacity:1,transform:'none'}],{duration:RM?1:500});mount3D(d,c=>BUILD3[kind](c,p));await wait(600)}
};
async function runShow(st,ops){for(const op of ops){try{await OPS[op[0]](st,...op.slice(1))}catch(e){console.warn('lesson op',op[0],e)}}}
function lessonScenes(l){return l.script.map(([name,say,show])=>({name,steps:[{say,act:st=>runShow(st,show||[])}]}))}

/* ================= "Şimdi sen": a retrieval check at the end of every Öğren lesson ================= */
/* The lesson waits for one answer to a question from the lesson's own question maker, gives feedback, then continues. */
const PROOF_Q=()=>({kind:'choice',options:shuffle([{html:'Tek bir karşıt örnek',ok:true},{html:'Üç tane doğru örnek',ok:false},{html:'Önermeyi yeniden yazmak',ok:false},{html:'Bir çizim yapmak',ok:false}]),
  prompt:'<p>Bir önermenin <b>yanlış</b> olduğunu göstermek için ne yeter?</p>',explain:'Tek bir karşıt örnek, önermenin her durumda doğru olmadığını gösterir. Doğruluğu göstermek içinse genel bir ispat gerekir.'});
function checkQ(l){if(!l.gen)return null;
  for(let i=0;i<40;i++){const q=l.gen();if(q.kind==='choice'||q.kind==='number')return q}
  /* number-line lessons: the same question as a choice, wrong answers built from the typical slips (sign, one step) */
  const q=l.gen();if(q.kind!=='line')return null;const t=q.target,st=1/q.den,cand=[-t,t+st,t-st,t+1,-t-st].filter(v=>Math.abs(v-t)>1e-9);
  return {kind:'choice',sk:q.sk,explain:q.explain,prompt:q.prompt.replace(/<p>[^<]*işaretle[^<]*<\/p>/,q.den>1?'<p>Bu sayı hangisine eşittir?</p>':'<p>İşlemin sonucu kaçtır?</p>'),
    options:choice(num(t),cand.map(v=>({h:num(v),mis:q.classify?q.classify(v):'other'})))}}
const hasCheck=l=>!!l.gen;
const checkScene=l=>({name:'Şimdi sen',check:true,steps:[{say:'Şimdi sen dene! Soruyu oku ve cevapla.',act:st=>askCheck(st,l)}]});
/* the scenes of a lesson's Öğren: its own script (or its part of the Theme 1 briefing plus the rules), then the check */
function scenesFor(l){const base=l.script?lessonScenes(l):l.learn!=null?[BRIEF1[l.learn],BRIEF1[BRIEF1.length-1]]:[];return hasCheck(l)?[...base,checkScene(l)]:base}
function keyInput(inp,k){let v=inp.value;if(k==='del')v=v.slice(0,-1);else if(k==='−')v=/^[−-]/.test(v)?v.slice(1):'−'+v;else if(k===','){if(!v.includes(','))v+=(v===''||v==='−')?'0,':','}else v+=k;inp.value=v;sfx('tick')}
function askCheck(st,l){return new Promise(res=>{
  const q=checkQ(l),sb=st.closest('.stagebox');if(!q||!sb){res();return}
  const d=document.createElement('div');d.className='ssen';d.setAttribute('role','dialog');d.setAttribute('aria-label','Şimdi sen: kontrol sorusu');
  d.innerHTML=`<div class="ssh">ŞİMDİ SEN · ${l.no} ${l.t}</div><div class="ssq">${q.prompt}</div>${q.visual?`<div class="ssv">${q.visual}</div>`:''}<div class="ssa"></div><div class="ssf" aria-live="polite"></div>`;
  sb.appendChild(d);if(!RM)d.animate([{opacity:0,transform:'translateY(14px) scale(.98)'},{opacity:1,transform:'none'}],{duration:350,easing:'ease-out'});
  const A=d.querySelector('.ssa'),F=d.querySelector('.ssf'),tok=B.tok;let done=false;
  const close=()=>{clearInterval(iv);d.remove();res()};
  const end=(ok,correctHtml,mis)=>{if(done)return;done=true;logAnswer({d:Date.now(),th:l.th,ls:l.id,sk:q.sk||null,ok,mis:ok?null:mis,src:'ogren'});
    if(ok){addCoins(5);sfx(skin()==='elektron'?'zapup':'coin');rumble('good');F.innerHTML=`<b class="ok">DOĞRU! +5 altın</b><span>${q.explain}</span>`}
    else{sfx('wrong');const m=M[mis]||M.other;F.innerHTML=`<b class="bad">Doğru cevap: ${correctHtml}</b><span>${q.explain}</span><span class="tip"><b>${m.m}:</b> ${m.s}</span>`}
    F.insertAdjacentHTML('beforeend',`<div class="row"><button class="cb main" type="button" id="ssgo">Devam ${ic('next')}</button></div>`);
    const go=d.querySelector('#ssgo');go.onclick=close;try{go.focus({preventScroll:true})}catch(e){}go.scrollIntoView({block:'nearest'});
    say(ok?'Doğru, harika!':'Doğru cevabı ve açıklamayı oku. Sonra devam et.')};
  if(q.kind==='choice'){A.innerHTML=`<div class="opts">${q.options.map((o,i)=>`<button class="opt" type="button" data-i="${i}"><span class="k">${i+1}</span><span>${o.html}</span></button>`).join('')}</div>`;
    A.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const o=q.options[+b.dataset.i];A.querySelectorAll('.opt').forEach((x,j)=>{x.disabled=true;if(q.options[j].ok)x.classList.add('right');else if(x===b)x.classList.add('wrong')});
      end(o.ok,q.options.find(x=>x.ok).html,o.ok?null:(o.mis||'other'))})}
  else{A.innerHTML=`<form class="row" novalidate><input class="numin" inputmode="decimal" autocomplete="off" aria-label="Cevabın" placeholder="Cevap">${q.unit?`<span class="unit">${q.unit}</span>`:''}<button class="go" type="submit">Kontrol et</button></form>
      <div class="keypad">${['7','8','9','4','5','6','1','2','3','−','0',','].map(k=>`<button type="button" data-key="${k}">${k}</button>`).join('')}<button type="button" data-key="del">Sil</button></div><p class="err" hidden></p>`;
    const inp=A.querySelector('input'),err=A.querySelector('.err');A.querySelectorAll('.keypad button').forEach(b=>b.onclick=()=>{if(!inp.disabled){keyInput(inp,b.dataset.key);err.hidden=true}});
    A.querySelector('form').onsubmit=e=>{e.preventDefault();const v=parseNum(inp.value);if(v===null){err.textContent='Bir sayı yaz (örnek: −3 veya 2,5).';err.hidden=false;return}
      A.querySelectorAll('input,button').forEach(x=>x.disabled=true);const ok=Math.abs(v-q.answer)<1e-9;end(ok,num(q.answer)+(q.unit?' '+q.unit:''),ok?null:(q.classify?q.classify(v):'other'))}}
  const first=A.querySelector('.opt,input');if(first&&PAD.on)try{first.focus({preventScroll:true})}catch(e){}
  const iv=setInterval(()=>{if(B.tok!==tok||!document.contains(d)){clearInterval(iv);d.remove();res()}},300);
})}

/* ================= Seviye testi: a short test per theme, two questions per lesson ================= */
/* Lessons answered right every time are marked "biliyor" (known): they count as done on the map and the daily
   mission skips them for a week. Lessons with a mistake are suggested first, with their Öğren lesson. */
function testPlan(g){const ls=LESSONS.filter(l=>l.th===g.id&&l.gen),per=ls.length>=6?2:ls.length>=4?2:ls.length>=3?3:4,seq=[];
  for(let r=0;r<per;r++)seq.push(...shuffle(ls));return {ls,seq:seq.slice(0,16)}}
function testQ(l){return l.gen()}
function testResult(){const g=S.g,log=ST.get('t7-log',[]).slice(-S.n),per={};
  S.test.seq.forEach((l,i)=>{const r=per[l.id]||(per[l.id]={l,ok:0,n:0});r.n++;if(S.marks[i])r.ok++});
  const rows=Object.values(per),known=rows.filter(r=>r.ok===r.n).map(r=>r.l.id),lb=ST.get('t7-lbest',{});
  known.forEach(id=>{if(!(lb[id]>=7))lb[id]=7});ST.set('t7-lbest',lb);
  const T=ST.get('t7-test',{});T[g.id]={d:Date.now(),s:S.score,n:S.n,known};ST.set('t7-test',T);
  const first=rows.filter(r=>r.ok<r.n).sort((a,b)=>a.ok/a.n-b.ok/b.n||LESSONS.indexOf(a.l)-LESSONS.indexOf(b.l))[0];
  const tag=r=>r.ok===r.n?['Biliyor','var(--green)']:r.ok>0?['Tekrar et','var(--gold)']:['Öğren','var(--red)'];
  const lrow=r=>{const [t,c]=tag(r),l=r.l,learn=l.script||l.learn!=null;return `<div class="trow"><span class="tname">${l.no} ${l.t}</span><span class="chip" style="border-color:${c};color:${c}">${t} · ${r.ok}/${r.n}</span>
    <span class="ta">${learn?`<a class="btn sm${r.ok<r.n?' gold':''}" href="#ogren-${l.id}">${ic('book')} Öğren</a>`:''}<a class="btn sm" href="#ders-${l.id}">${ic('play')} Oyna</a></span></div>`};
  const pct=Math.round(S.score/S.n*100),msg=pct>=90?'Bu temayı çok iyi biliyorsun! Sıradaki temaya geçebilirsin.':pct>=60?'Temelin sağlam. Sarı ve kırmızı dersleri çalışınca tamam.':'Bu temaya derslerin anlatımıyla başlamak en iyisi. Önerilen dersten başla.';
  app.innerHTML=`<div class="game" style="--hue:${g.hue}">${hud()}<section class="qcard result"><h2>SEVİYE TESTİ SONUCU</h2><div class="score">${S.score} / ${S.n}</div>
    <p class="coins" style="justify-content:center"><i class="coin"></i>+${S.coins} altın</p><p>${msg}</p>
    ${first?`<p><a class="btn prime" href="#ogren-${first.l.id}">Buradan başla: ${first.l.no} ${first.l.t} →</a></p>`:''}
    <div class="tres">${rows.map(lrow).join('')}</div>
    <p class="hint">"Biliyor" olan dersler haritada tamamlandı sayılır ve günlük görev onları bir hafta boyunca karıştırmaz. Hatalı dersler günlük göreve daha sık gelir.</p>
    <div class="row" style="justify-content:center"><button class="go" id="again" type="button">Testi yeniden çöz</button><a class="btn" href="#">Ders haritası</a><a class="btn" href="#rapor">Ebeveyn Raporu</a></div></section></div>`;
  bindHud();document.getElementById('again').onclick=()=>start(g,{test:true});sfx('star')}

/* ================= Pergel atölyesi: step-by-step compass and ruler constructions ================= */
function setupBuild(){
  const q=S.q,vis=document.getElementById('vis'),ctl=document.getElementById('bctl'),W=640,H=410;
  const V=(a,b)=>[b[0]-a[0],b[1]-a[1]],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),at=(c,r,t)=>[c[0]+r*Math.cos(t),c[1]+r*Math.sin(t)],ang=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]);
  const arc=(c,r,t0,t1,cls)=>{const p0=at(c,r,t0),p1=at(c,r,t1);return `<path class="${cls}" d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 ${t1-t0>Math.PI?1:0} 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}"/>`};
  /* the two crossing points of equal circles around P1 and P2 (none if r is not more than half the distance) */
  const meet=(P1,P2,r)=>{const d=dist(P1,P2);if(r<=d/2+.5)return null;const m=[(P1[0]+P2[0])/2,(P1[1]+P2[1])/2],k=Math.sqrt(r*r-d*d/4),n=[-(P2[1]-P1[1])/d,(P2[0]-P1[0])/d];return [[m[0]+k*n[0],m[1]+k*n[1]],[m[0]-k*n[0],m[1]-k*n[1]]]};
  const arcsAround=(c,o,r,X)=>{/* two short arcs where the crossings are (or would be) */const base=ang(c,o),d=dist(c,o),w=X?Math.acos(Math.min(1,d/2/r)):Math.PI/2.6;
    return arc(c,r,base+w-.42,base+w+.42,'b-arc')+arc(c,r,base-w-.42,base-w+.42,'b-arc')};
  /* the widest opening whose crossing points (all, or only the far one) still fall inside the drawing, so they can be tapped */
  const inside=p=>p[0]>=26&&p[0]<=W-26&&p[1]>=26&&p[1]<=H-26;
  const fitR=(P1,P2,hi,keep)=>{let lo=dist(P1,P2)/2+2;if(!(meet(P1,P2,hi)||[]).filter(keep).every(inside)){let a=lo,b=hi;for(let i=0;i<30;i++){const m=(a+b)/2;((meet(P1,P2,m)||[]).filter(keep).every(inside))?a=m:b=m}hi=a}return hi};
  const st={step:0,r:0,mist:0,arcs:'',marks:'',found:[],center:null,done:false};
  let steps;
  const pt=(p,l,cls='b-pt')=>`<circle class="${cls}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="6"/><text class="b-lbl" x="${(p[0]+10).toFixed(1)}" y="${(p[1]-12).toFixed(1)}">${l}</text>`;
  if(q.task==='dikme'){const A=q.A,B=q.B,AB=dist(A,B);let X=null;
    const base=()=>`<line class="b-seg" x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}"/>${pt(A,'A')}${pt(B,'B')}`;
    steps=[
     {say:'Pergelin sivri ucunu <b>A</b> noktasına koy. A\'ya dokun.',hits:[['A',A]],on:()=>{st.center=A;st.r=AB*.42;next()}},
     {say:'Pergeli aç: açıklık <b>AB\'nin yarısından fazla</b> olmalı. Kaydırıcıyla ayarla, sonra <b>Yay çiz</b>.',slider:[AB*.25,fitR(A,B,AB*.95,()=>true)],btn:['Yay çiz',()=>{st.arcs+=arcsAround(A,B,st.r,meet(A,B,st.r));sfx('tick');next()}]},
     {say:'Açıklığı <b>değiştirmeden</b> sivri ucu <b>B</b> noktasına taşı. B\'ye dokun.',hits:[['B',B]],on:()=>{st.center=B;X=meet(A,B,st.r);st.arcs+=arcsAround(B,A,st.r,X);sfx('tick');
       if(!X){fail('Yaylar kesişmedi! Pergel AB\'nin yarısından <b>fazla</b> açılmalıydı.',()=>{st.arcs='';st.center=A;go(1)});return}next()}},
     {say:'Yaylar iki noktada kesişti. <b>Kesişme noktalarının ikisine de</b> dokun.',hits:()=>X.map((p,i)=>['P'+i,p]),multi:2,on:id=>{const p=X[+id.slice(1)];st.marks+=pt(p,st.found.length>1?'D':'C','b-pt hit2');sfx('coin')}},
     {say:'Cetveli C ve D noktalarına daya ve <b>birleştir</b>.',btn:['Cetvelle birleştir',()=>{const [P,Q]=X,u=V(P,Q),k=900/Math.hypot(...u),M=[(A[0]+B[0])/2,(A[1]+B[1])/2];
       st.marks+=`<line class="b-res" x1="${P[0]-u[0]*k}" y1="${P[1]-u[1]*k}" x2="${Q[0]+u[0]*k}" y2="${Q[1]+u[1]*k}"/>`+rightMark(M,ang(A,B))+tick(A,M)+tick(M,B)+pt(M,'M','b-pt hit2');
       done('Orta dikme hazır! <b>M</b> noktası AB\'nin orta noktası ve doğru AB\'ye <b>dik</b>: AM = MB.')}]}];
    draw0=base}
  else{const O=q.O,R1=at(O,q.L,q.r1),R2=at(O,q.L,q.r2);let Dp=null,Ep=null,X=null,r1=0;
    const base=()=>`<line class="b-seg" x1="${O[0]}" y1="${O[1]}" x2="${R1[0]}" y2="${R1[1]}"/><line class="b-seg" x1="${O[0]}" y1="${O[1]}" x2="${R2[0]}" y2="${R2[1]}"/>${pt(O,'O')}${pt(at(O,q.L*.92,q.r1),'A')}${pt(at(O,q.L*.92,q.r2),'B')}`;
    steps=[
     {say:'Pergelin sivri ucunu açının köşesi <b>O</b>\'ya koy. O\'ya dokun.',hits:[['O',O]],on:()=>{st.center=O;st.r=q.L*.45;next()}},
     {say:'Bir açıklık seç ve <b>Yay çiz</b>: yay iki kolu da kessin.',slider:[q.L*.22,q.L*.8],btn:['Yay çiz',()=>{r1=st.r;Dp=at(O,r1,q.r1);Ep=at(O,r1,q.r2);st.arcs+=arc(O,r1,q.r1-.2,q.r2+.2,'b-arc');st.marks+=pt(Dp,'D')+pt(Ep,'E');sfx('tick');st.r=dist(Dp,Ep)*.4;next()}]},
     {say:'Şimdi pergeli <b>DE\'nin yarısından fazla</b> aç ve sivri ucu <b>D</b>\'ye koy. Önce açıklığı ayarla, sonra D\'ye dokun.',slider:()=>[dist(Dp,Ep)*.25,fitR(Dp,Ep,dist(Dp,Ep)*1.2,p=>dist(p,O)>dist(Dp,O)*.6)],hits:()=>[['D',Dp]],on:()=>{st.center=Dp;X=meet(Dp,Ep,st.r);st.arcs2=arcsAround(Dp,Ep,st.r,X);st.arcs+=st.arcs2;sfx('tick');next()}},
     {say:'Açıklığı <b>değiştirmeden</b> sivri ucu <b>E</b>\'ye taşı. E\'ye dokun.',hits:()=>[['E',Ep]],on:()=>{st.center=Ep;st.arcs+=arcsAround(Ep,Dp,st.r,X);sfx('tick');
       if(!X){fail('Yaylar kesişmedi! Pergel DE\'nin yarısından <b>fazla</b> açılmalıydı.',()=>{st.arcs=st.arcs.split(st.arcs2)[0];st.center=Dp;go(2)});return}next()}},
     {say:'Açının <b>içindeki</b> kesişme noktasına dokun.',hits:()=>X.filter(p=>dist(p,O)>dist(Dp,O)*.6).map((p,i)=>['F'+i,p]),on:id=>{X.F=X.filter(p=>dist(p,O)>dist(Dp,O)*.6)[+id.slice(1)];st.marks+=pt(X.F,'F','b-pt hit2');sfx('coin');next()}},
     {say:'Cetveli O ve F\'ye daya ve <b>birleştir</b>.',btn:['Cetvelle birleştir',()=>{const F=X.F,u=V(O,F),k=Math.max(q.L,Math.hypot(...u)+50)/Math.hypot(...u);
       st.marks+=`<line class="b-res" x1="${O[0]}" y1="${O[1]}" x2="${O[0]+u[0]*k}" y2="${O[1]+u[1]*k}"/>`+arc(O,46,q.r1,(q.r1+q.r2)/2-.04,'b-eq')+arc(O,52,(q.r1+q.r2)/2+.04,q.r2,'b-eq');
       done('Açıortay hazır! OF ışını açıyı <b>iki eş açıya</b> böldü.')}]}];
    draw0=base}
  var draw0;
  function rightMark(M,t){const a=at(M,14,t),c=at(a,14,t-Math.PI/2),b=at(M,14,t-Math.PI/2);return `<polyline class="b-eq" points="${a[0]},${a[1]} ${c[0]},${c[1]} ${b[0]},${b[1]}"/>`}
  function tick(P,Q){const m=[(P[0]+Q[0])/2,(P[1]+Q[1])/2],t=ang(P,Q)+Math.PI/2,a=at(m,8,t),b=at(m,-8,t);return `<line class="b-eq" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`}
  const cur=()=>steps[st.step],val=f=>typeof f==='function'?f():f;
  function compass(){if(!st.center||st.done)return '';const c=st.center,t=-Math.PI/2.8,p=at(c,st.r,t),h=at([(c[0]+p[0])/2,(c[1]+p[1])/2],Math.min(70,st.r*.45),t-Math.PI/2);
    return `<circle class="b-prev" cx="${c[0]}" cy="${c[1]}" r="${st.r.toFixed(1)}"/><g class="b-cmp"><line x1="${c[0]}" y1="${c[1]}" x2="${h[0]}" y2="${h[1]}"/><line x1="${p[0]}" y1="${p[1]}" x2="${h[0]}" y2="${h[1]}"/><circle cx="${h[0]}" cy="${h[1]}" r="6"/><circle class="b-pen" cx="${p[0]}" cy="${p[1]}" r="4"/></g>`}
  function draw(){const hs=cur()&&cur().hits&&!st.done&&!st.hold?val(cur().hits).filter(h=>!st.found.includes(h[0])):[];
    vis.innerHTML=`<svg class="bsv" id="bsv" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pergel ve cetvel çizim alanı">${draw0()}${st.arcs}${st.marks}${compass()}
      ${hs.map(([id,p])=>`<circle class="b-hit" data-id="${id}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="24" tabindex="0" role="button" aria-label="${/^[A-Z]$/.test(id)?id+' noktası':'kesişme noktası'}"/>`).join('')}</svg>`;
    const svg=document.getElementById('bsv');
    svg.querySelectorAll('.b-hit').forEach(h=>{const go1=e=>{e.stopPropagation();hit(h.dataset.id)};h.addEventListener('click',go1);h.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go1(e)}})});
    svg.addEventListener('click',()=>{if(cur()&&cur().hits&&!st.done&&!st.hold)msg('Biraz yanına dokundun. Parlayan noktayı ara: '+val(cur().say).replace(/<[^>]+>/g,''),'hint')})}
  function hit(id){const s0=cur();if(s0.multi){st.found.push(id);s0.on(id);if(st.found.length>=s0.multi){st.found=[];next()}else{draw();msg('Güzel! Şimdi öbür kesişme noktası.','ok')}return}s0.on(id)}
  function msg(t,k){const m=document.getElementById('bmsg');if(m){m.innerHTML=t;m.className='bmsg '+k}}
  function controls(){const s0=cur();if(!s0||st.done)return;const sl=val(s0.slider);
    ctl.innerHTML=`<p class="bstep"><span class="bn">Adım ${st.step+1} / ${steps.length}</span> ${s0.say}</p>
      ${sl?`<label class="bsl">Pergel açıklığı<input type="range" id="brad" min="${sl[0].toFixed(0)}" max="${sl[1].toFixed(0)}" step="1" value="${Math.max(sl[0],Math.min(sl[1],st.r)).toFixed(0)}"></label>`:''}
      ${s0.btn?`<button class="go" id="bbtn" type="button">${s0.btn[0]}</button>`:''}<p class="bmsg" id="bmsg" aria-live="polite"></p>`;
    if(sl){st.r=+document.getElementById('brad').value;document.getElementById('brad').oninput=e=>{st.r=+e.target.value;draw()}}
    if(s0.btn)document.getElementById('bbtn').onclick=()=>s0.btn[1]()}
  function go(i){st.step=i;st.found=[];st.hold=false;draw();controls()}
  /* a construction mistake: show the arcs that do not meet, count it once, then let the child try again */
  function fail(t,back){st.mist++;st.hold=true;S.bmis='compassHalf';sfx('wrong');const c0=st.center;st.center=null;draw();st.center=c0;
    ctl.innerHTML=`<p class="bmsg bad">${t} Yarıçapların toplamı (r + r) iki nokta arasındaki uzaklıktan büyük olmalı.</p><button class="go" id="bre" type="button">Yeniden dene</button>`;
    document.getElementById('bre').onclick=back;document.getElementById('bre').focus({preventScroll:true})}
  function next(){go(st.step+1)}
  function done(t){st.done=true;sfx('star');draw();ctl.innerHTML=`<p class="bstep ok">${t}</p>`;
    const ok=st.mist===0;finish(ok,ok?'':'pergel yarıdan fazla açılmalı',ok?null:(S.bmis||'compassHalf'),ctl)}
  S.bmis=null;go(0);
}
