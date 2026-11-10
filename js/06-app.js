"use strict";
/* Türkçe 7 Oyunları · Briefing player, shop, parent report, controller, routing */
const B={tok:0,i:0,paused:false,held:[],rate:ST.get('t7-rate',1),auto:ST.get('t7-auto',true),started:false,g:null};
function briefing(g,startAt=0,lesson=null,scenes=BRIEF1){
  hush();B.paused=false;B.held=[];B.started=false;B.g=g;B.tok++;B.startAt=startAt;B.lesson=lesson;B.scenes=scenes;const seen=ST.get('t7-brief',{});
  const onoff=v=>v?'açık':'kapalı';B.cap=ST.get('t7-cap',true);B.el=0;B.i=startAt;tlDurs();document.body.classList.add('calm');
  const segs=B.scenes.map((s,i)=>`<span data-s="${i}" style="width:${(B.durs[i]/B.total*100).toFixed(2)}%">${s.name}</span>`).join('');
  app.innerHTML=`<div class="brief">
   <div class="hud" style="--hue:${g.hue}"><button class="iconbtn" id="back" type="button">${ic('home')} Harita</button><div class="meta"><span class="tema">${lesson?`ÖĞREN · Ders ${lesson.no} · s. ${lesson.p}`:`GÖREV BRİFİNGİ · ${g.id}. Tema`}</span><h2>${lesson?lesson.t:g.name}</h2></div>
     <button class="iconbtn" id="full" type="button" title="Tam ekran (F)">${ic('full')} Tam ekran</button><button class="btn prime" id="go" type="button">${lesson?(lesson.gen?'DERSİ OYNA':'HARİTAYA DÖN'):'GÖREVE BAŞLA'}</button></div>
   <div class="stagebox"><span class="scn" id="scn">SAHNE 1 / ${B.scenes.length}</span><svg id="st" viewBox="0 0 800 450" role="img" aria-label="Görev brifingi animasyonu"></svg>
     <div id="gate" style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(10,9,32,.6)"><div style="display:grid;gap:14px;justify-items:center;text-align:center;padding:16px">
       <button class="cb main" id="play" type="button" style="font-size:clamp(1.3rem,2.6vw,2.6rem);padding:18px 36px">${ic('play')} ${lesson?'DERSİ BAŞLAT':'BRİFİNGİ BAŞLAT'}</button>${seen[g.id]?'<button class="cb" id="skip0" type="button">Brifingi geç, göreve başla</button>':''}</div></div></div>
   <div class="tl" id="tl" role="slider" aria-label="Zaman çizelgesi" aria-valuemin="0" aria-valuemax="${Math.round(B.total/1000)}" title="Bir bölüme atlamak için tıkla"><div class="tlf" id="tlf"></div><div class="tlb" id="tlb">${segs}</div><div class="tlh" id="tlh"></div></div>
   <div class="tlt"><span id="tlc">0:00</span><span id="tld">${fmtT(B.total)}</span></div>
   <div class="cap${B.cap?'':' off'}" id="cap" aria-live="polite"><span class="sp">REHBER:</span><span id="capt">Görevden önce kısa bir brifing var. Sesi aç ve başlat!</span></div>
   ${VOICE.v?'':`<p class="vnote">${noVoiceMsg()}</p>`}
   <div class="cbar" role="toolbar" aria-label="Brifing kontrolleri">
     <button class="cb" id="first" type="button" title="Baştan başlat">${ic('first')} Baştan</button>
     <button class="cb" id="prev" type="button" title="Önceki sahne (←)">${ic('prev')} Önceki</button>
     <button class="cb main" id="pp" type="button" title="Oynat / Duraklat (Boşluk)"></button>
     <button class="cb" id="nxt" type="button" title="Sonraki sahne (→)">Sonraki ${ic('next')}</button>
     <button class="cb" id="rep" type="button" title="Bu sahneyi tekrarla (R)">${ic('replay')} Tekrarla</button></div>
   <div class="cbar" role="toolbar" aria-label="Brifing ayarları">
     <button class="cb" id="spd" type="button" title="Anlatım hızı">Hız: ${num(B.rate)}×</button>
     <button class="cb${VOICE.on?' on':''}" id="vc" type="button" aria-pressed="${VOICE.on}">${ic('voice')} Anlatım: ${onoff(VOICE.on)}</button>
     <button class="cb${SND.on?' on':''}" id="snd" type="button" aria-pressed="${SND.on}">${ic('sound')} Efektler: ${onoff(SND.on)}</button>
     <button class="cb${B.auto?' on':''}" id="auto" type="button" aria-pressed="${B.auto}">${ic('auto')} Otomatik geçiş: ${onoff(B.auto)}</button>
     <button class="cb" id="vsel" type="button" title="Anlatıcı sesini değiştir">${ic('voice')} Anlatıcı: ${vName()}</button>
     <button class="cb" id="skn" type="button" title="Görünümü değiştir">Görünüm: ${SKINS[skin()]}</button>
     <button class="cb${B.cap?' on':''}" id="capb" type="button" aria-pressed="${B.cap}">Altyazı: ${onoff(B.cap)}</button></div>
   <div class="dots" id="dots">${B.scenes.map((s,i)=>`<button type="button" data-s="${i}" title="${i+1}. ${s.name}" aria-label="Sahne ${i+1}: ${s.name}"></button>`).join('')}</div>
   <p class="kbd">Klavye: Boşluk = oynat / duraklat · ← → = sahne değiştir · R = tekrarla · F = tam ekran</p></div>`;
  const $=id=>document.getElementById(id);
  const begin=i=>{$('gate')?.remove();B.started=true;playScene(i)};
  $('back').onclick=()=>{location.hash=''};
  $('full').onclick=toggleFull;
  $('go').onclick=()=>beginMission(g);
  $('play').onclick=()=>{sfx('start');begin(B.startAt)};
  if($('skip0'))$('skip0').onclick=()=>beginMission(g);
  $('first').onclick=()=>begin(0);
  $('prev').onclick=()=>begin(Math.max(0,B.i-1));
  $('nxt').onclick=()=>{if(B.i<B.scenes.length-1)begin(B.i+1);else beginMission(g)};
  $('rep').onclick=()=>begin(B.i);
  $('pp').onclick=()=>{if(!B.started){sfx('start');begin(B.startAt)}else setPaused(!B.paused)};
  $('spd').onclick=()=>{const R=[.8,1,1.25];B.rate=R[(R.indexOf(B.rate)+1)%R.length]||1;ST.set('t7-rate',B.rate);$('spd').textContent=`Hız: ${num(B.rate)}×`;tlDurs();
    document.querySelectorAll('#tlb span').forEach((s,i)=>s.style.width=(B.durs[i]/B.total*100).toFixed(2)+'%');$('tld').textContent=fmtT(B.total);tlDraw()};
  $('capb').onclick=()=>{B.cap=!B.cap;ST.set('t7-cap',B.cap);$('cap').classList.toggle('off',!B.cap);$('capb').className='cb'+(B.cap?' on':'');$('capb').setAttribute('aria-pressed',B.cap);$('capb').textContent='Altyazı: '+onoff(B.cap)};
  $('tl').onclick=e=>{const r=$('tl').getBoundingClientRect(),t=(e.clientX-r.left)/r.width*B.total;let acc=0,k=0;for(;k<B.durs.length-1;k++){if(t<acc+B.durs[k])break;acc+=B.durs[k]}sfx('tick');begin(k)};
  clearInterval(B.tlTimer);B.tlTimer=setInterval(()=>{if(!document.getElementById('tl')){clearInterval(B.tlTimer);return}if(B.started&&!B.paused)B.el+=200;tlDraw()},200);tlDraw();
  const tog=(id,get,set,label,icon)=>{$(id).onclick=()=>{set(!get());const v=get();$(id).className='cb'+(v?' on':'');$(id).setAttribute('aria-pressed',v);$(id).innerHTML=`${ic(icon)} ${label}: ${onoff(v)}`}};
  tog('vc',()=>VOICE.on,v=>{VOICE.on=v;ST.set('t7-voice',v);if(!v)hush()},'Anlatım','voice');
  tog('snd',()=>SND.on,v=>{SND.on=v;ST.set('t7-sound',v)},'Efektler','sound');
  tog('auto',()=>B.auto,v=>{B.auto=v;ST.set('t7-auto',v)},'Otomatik geçiş','auto');
  document.querySelectorAll('#dots button').forEach(b=>b.onclick=()=>begin(+b.dataset.s));
  $('skn').onclick=()=>{const k=Object.keys(SKINS);applySkin(k[(k.indexOf(skin())+1)%k.length]);$('skn').textContent='Görünüm: '+SKINS[skin()]};
  $('vsel').onclick=()=>{pickVoice();const L=VOICE.list||[];if(!L.length){$('vsel').innerHTML=`${ic('voice')} Anlatıcı: ${vName()}`;if(!VOICE.v)voiceHelp();else{hush();say('Merhaba kaşif, ben Rehber. Sesim böyle.',true)}return}
    const i=L.indexOf(VOICE.v);VOICE.v=L[(i+1)%L.length];ST.set('t7-voicename',VOICE.v.name);ST.set('t7-voiceok',L.some(v=>/ahmet/i.test(v.name)));$('vsel').innerHTML=`${ic('voice')} Anlatıcı: ${vName()}`;
    if(B.started&&!B.paused)setPaused(true);hush();say('Merhaba kaşif, ben Rehber. Sesim böyle.',true)};
  ppLabel();
}
/* timeline: each scene's length is estimated from its narration; time only runs while playing */
function tlDurs(){B.durs=B.scenes.map(sc=>sc.steps.reduce((a,s)=>a+est(s.say)+350,0)+600);B.total=B.durs.reduce((a,b)=>a+b,0)}
const fmtT=ms=>{const s=Math.max(0,Math.round(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function tlDraw(){const f=document.getElementById('tlf');if(!f||!B.durs)return;const i=Math.min(B.i||0,B.durs.length-1),pre=B.durs.slice(0,i).reduce((a,b)=>a+b,0),cur=pre+Math.min(B.el,B.durs[i]*(B.sceneDone?1:.98)),pc=(cur/B.total*100).toFixed(2)+'%';
  f.style.width=pc;document.getElementById('tlh').style.left=pc;document.getElementById('tlc').textContent=fmtT(cur);document.getElementById('tl').setAttribute('aria-valuenow',Math.round(cur/1000));
  document.querySelectorAll('#tlb span').forEach((s,j)=>s.classList.toggle('on',j===i))}
function ppLabel(){const b=document.getElementById('pp');if(!b)return;const playing=B.started&&!B.paused;
  b.innerHTML=playing?`${ic('pause')} Duraklat`:`${ic('play')} ${B.started?'Devam et':'Oynat'}`;b.setAttribute('aria-label',playing?'Duraklat':'Oynat')}
function setPaused(p){
  if(p===B.paused)return;B.paused=p;const st=document.getElementById('st');
  if(p){B.held=st?st.getAnimations({subtree:true}).filter(a=>a.playState==='running'):[];B.held.forEach(a=>a.pause());try{speechSynthesis.pause()}catch(e){}}
  else{B.held.forEach(a=>{try{a.play()}catch(e){}});B.held=[];try{speechSynthesis.resume()}catch(e){}}
  document.querySelector('.stagebox')?.classList.toggle('paused',p);ppLabel();
}
function beginMission(g){B.tok++;B.paused=false;hush();const s=ST.get('t7-brief',{});s[g.id]=1;ST.set('t7-brief',s);
  if(B.lesson){const l=B.lesson;B.lesson=null;location.hash=l.gen?'#ders-'+l.id:'';return}start(g)}
async function playScene(i){
  B.i=i;const tok=++B.tok;hush();B.paused=false;B.held=[];B.el=0;B.sceneDone=false;document.querySelector('.stagebox')?.classList.remove('paused');ppLabel();const sc=B.scenes[i];
  document.querySelectorAll('.stagebox .ov3d,.stagebox .ssen').forEach(e=>e.remove());tlDraw();
  const old=document.getElementById('st');if(!old)return;const st=old.cloneNode(false);old.replaceWith(st);
  document.getElementById('scn').textContent=`SAHNE ${i+1} / ${B.scenes.length} · ${sc.name.toLocaleUpperCase('tr')}`;
  document.querySelectorAll('#dots button').forEach((d,j)=>{d.className=j<i?'done':j===i?'on':'';d.setAttribute('aria-current',j===i?'step':'false')});
  for(const step of sc.steps){
    if(tok!==B.tok)return;typeCap(step.say,tok);
    await Promise.all([Promise.resolve().then(()=>step.act(st)).catch(e=>console.warn(e)),say(step.say)]);
    if(tok!==B.tok)return;await wait(350);
  }
  if(tok===B.tok){B.sceneDone=true;B.el=B.durs?B.durs[i]:0;tlDraw()}
  if(tok!==B.tok)return;
  if(i<B.scenes.length-1){if(B.auto){await wait(600);if(tok===B.tok)playScene(i+1)}else{document.getElementById('capt').textContent+='  (Devam etmek için "Sonraki"ye bas.)'}}
  else{const go=document.getElementById('go'),cap=document.getElementById('capt');
    if(cap)cap.textContent=B.lesson?(B.lesson.gen?'Ders bitti, aferin! Şimdi “DERSİ OYNA” ile 10 soruluk oyuna geç.':'Ders bitti, aferin! Bu dersin oyunu yakında; haritaya dönebilirsin.'):'Brifing bitti! “GÖREVE BAŞLA” ile oyuna geç.';
    if(go&&!RM)go.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:800,iterations:Infinity})}
}
function typeCap(text,tok){const el=document.getElementById('capt');if(!el)return;if(RM){el.textContent=text;return}let n=0;el.textContent='';
  const iv=setInterval(()=>{if(tok!==B.tok||!document.body.contains(el)){clearInterval(iv);return}if(B.paused)return;n+=2;el.textContent=text.slice(0,n);if(n>=text.length)clearInterval(iv)},28)}
document.addEventListener('keydown',e=>{
  if(e.target.closest&&e.target.closest('input,textarea'))return;
  if(e.key==='f'||e.key==='F'){toggleFull();return}
  if(!document.getElementById('st'))return;const c=id=>document.getElementById(id)?.click();
  if(e.key===' '){e.preventDefault();c('pp')}else if(e.key==='ArrowRight'){e.preventDefault();c('nxt')}else if(e.key==='ArrowLeft'){e.preventDefault();c('prev')}else if(e.key==='r'||e.key==='R')c('rep');
});

/* ================= shop ================= */
function shopPage(){
  const s=shop(),w=wallet();
  const item=(cat,id,name,price,preview)=>{const own=s.owned.includes(id),eq=s[cat]===id;
    return `<div class="item${eq?' eq':''}">${preview}<b>${name}</b>${eq?'<span class="hint">Kuşanıldı</span>':own?`<button class="btn" data-eq="${cat}:${id}" type="button">Kuşan</button>`:`<button class="btn gold" data-buy="${cat}:${id}:${price}" type="button" ${w<price?'disabled':''}><i class="coin"></i>${price}</button>`}</div>`};
  app.innerHTML=`<div class="page"><div class="row" style="justify-content:space-between"><a class="btn" href="#">← Harita</a><span class="coins" id="wallet"><i class="coin"></i>${w} altın</span></div>
   <h1>Mağaza</h1><div class="pnl"><div class="pv">${heroBox(s)}<svg viewBox="-60 -40 120 80" style="width:150px;height:100px">${SHOPDEFS}${slipperSVG(SLIPS[s.slip][1])}</svg></div><p class="hint" style="text-align:center">Doğru cevaplarla kazandığın altınlarla robotunu ve annenin terliğini süsle.</p></div>
   <div class="pnl"><h2>Robot rengi</h2><div class="shopgrid">${Object.entries(HEROC).map(([id,[n,,p]])=>item('hero',id,n,p,heroBox({...s,hero:id,hat:'h-none'}))).join('')}</div></div>
   <div class="pnl"><h2>Şapka</h2><div class="shopgrid">${Object.entries(HATS).map(([id,[n,p]])=>item('hat',id,n,p,heroBox({...s,hat:id}))).join('')}</div></div>
   <div class="pnl"><h2>Annenin terliği</h2><div class="shopgrid">${Object.entries(SLIPS).map(([id,[n,f,p]])=>item('slip',id,n,p,`<svg viewBox="-45 -45 90 90">${SHOPDEFS}${slipperSVG(f)}</svg>`)).join('')}</div></div></div>`;
  app.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const [cat,id,p]=b.dataset.buy.split(':');const price=+p;if(wallet()<price)return;const s2=shop();ST.set('t7-coins',wallet()-price);s2.owned.push(id);s2[cat]=id;ST.set('t7-shop',s2);sfx('combo');shopPage()});
  app.querySelectorAll('[data-eq]').forEach(b=>b.onclick=()=>{const [cat,id]=b.dataset.eq.split(':');const s2=shop();s2[cat]=id;ST.set('t7-shop',s2);sfx('tick');shopPage()});
  document.title='Mağaza · Türkçe 7';
}

/* ================= parent report ================= */
const pctCol=p=>p>=80?'var(--green)':p>=60?'var(--gold)':'var(--red)';
function reportPage(){
  const L=ST.get('t7-log',[]),goal=ST.get('t7-goal',{target:500,reward:'Aile ödülü',base:0});
  const n=L.length,ok=L.filter(e=>e.ok).length,acc=n?Math.round(ok/n*100):0;
  const bar=(label,a,t,weak)=>`<div class="bar"><span${weak?' class="weak"':''}>${label}${weak?' · zayıf':''}</span><span class="tr"><i style="width:${t?Math.round(a/t*100):0}%;background:${pctCol(t?a/t*100:0)}"></i></span><span class="v">${t?'%'+Math.round(a/t*100):'—'} · ${a}/${t}</span></div>`;
  const byTh=G.map(g=>{const e=L.filter(x=>x.th===g.id);return bar(`${g.id}. ${g.name}`,e.filter(x=>x.ok).length,e.length,e.length>=5&&e.filter(x=>x.ok).length/e.length<.7)}).join('');
  const sk=Object.keys(SK1).map(k=>{const e=L.filter(x=>x.th===1&&x.sk===k),a=e.filter(x=>x.ok).length;return {k,a,t:e.length,weak:e.length>=3&&a/e.length<.7}});
  const misC={};L.filter(e=>!e.ok&&e.mis).forEach(e=>{const key=e.mis==='other'?'other@'+e.th:e.mis;misC[key]=(misC[key]||0)+1});
  const misList=Object.entries(misC).sort((a,b)=>b[1]-a[1]);
  const weakSk=sk.filter(s=>s.weak);
  const misHTML=misList.map(([key,c])=>{const [id,th0]=key.split('@'),th=th0||(id.match(/^u(\d+)_/)||[])[1];const m=M[id]||M.other;const act=m.p?`<a class="btn prime" href="#pratik-${m.p}">Pratik başlat: ${SK1[m.p]}</a>`:`<a class="btn" href="#tema-${th||1}">${th||1}. temanın görevini oyna</a>`;
    return `<div class="mis" style="border-left-color:${m.c}"><div class="row" style="justify-content:space-between"><h3>${m.t}${th?` (${th}. tema)`:''}</h3><span class="cnt">${m.m} · ${c} kez</span></div>
      <dl><dt>Basit açıklama</dt><dd>${m.s}</dd><dt>Derin açıklama</dt><dd>${m.d}</dd><dt>Önerilen çalışma</dt><dd>${act}</dd></dl></div>`}).join('');
  const recent=L.slice(-10).reverse().map(e=>`<span class="chip" style="border-color:${e.ok?'var(--green)':'var(--red)'}">${e.th}. tema · ${(LESSONS.find(x=>x.id===e.ls)||{t:'genel'}).t} · ${e.ok?'doğru':(M[e.mis]||M.other).m}</span>`).join('');
  app.innerHTML=`<div class="page"><div class="row" style="justify-content:space-between"><a class="btn" href="#">← Harita</a><span class="coins"><i class="coin"></i>${wallet()} altın</span></div>
   <h1>Ebeveyn Raporu</h1>
   ${n?'':'<div class="pnl"><p class="empty">Henüz cevap yok. Çocuğunuz bir görev oynadığında burada güçlü ve zayıf konular, tekrarlayan hatalar ve önerilen çalışmalar görünecek.</p></div>'}
   <div class="pnl"><div class="stat"><div><b>${n}</b><span>cevaplanan soru</span></div><div><b>%${acc}</b><span>doğruluk</span></div><div><b>${ST.get('t7-earned',0)}</b><span>toplam kazanılan altın</span></div><div><b>${misList.reduce((a,x)=>a+x[1],0)}</b><span>yakalanan canavar</span></div></div></div>
   <div class="pnl"><h2>Öncelikli öneriler</h2>${weakSk.length||misList.length?`<ul style="margin:0;padding-left:1.2em;display:grid;gap:6px">${weakSk.map(s=>`<li><b>${SK1[s.k]}</b> konusu zayıf (%${Math.round(s.a/s.t*100)}). <a href="#pratik-${s.k}">Bu konuda 10 soruluk pratik başlat</a>.</li>`).join('')}${misList.slice(0,3).map(([key,c])=>{const m=M[key.split('@')[0]]||M.other;return `<li><b>${m.m}</b> ${c} kez çıktı: ${m.s}</li>`}).join('')}</ul>`:'<p class="empty">Yeterli veri olunca burada en önemli 3–5 öneri görünecek (bir konuda en az 3 cevap gerekir).</p>'}</div>
   ${(()=>{const S0=srsState(),d=dailyInfo(),rows=LESSONS.filter(l=>S0[l.id]).sort((a,b)=>(S0[b.id].weak-S0[a.id].weak)||(S0[b.id].due-S0[a.id].due)||(S0[a.id].next-S0[b.id].next)).map(l=>{const s=S0[l.id],t=s.weak?['zayıf','var(--red)']:s.recent.length<3?['yeni · az cevap','var(--ink-soft)']:s.due?['tekrar zamanı','var(--gold)']:['sağlam','var(--green)'];
     return `<div class="bar"><span>${l.no} ${l.t}</span><span><span class="chip" style="border-color:${t[1]}">${t[0]} · %${Math.round(s.acc*100)} · ${s.recent.length} cevap</span></span><span class="v">${s.due||s.weak?'bugün':Math.ceil(s.next)+' gün sonra'}</span></div>`}).join('');
     return `<div class="pnl"><h2>Tekrar planı ve Bugünün görevi</h2><div class="stat"><div><b>${d.alive?d.streak:0}</b><span>gün üst üste görev</span></div><div><b>${d.best||0}</b><span>en uzun seri</span></div><div><b>${(d.days||[]).length}</b><span>görev yapılan gün</span></div></div>
       ${rows?`<div class="bars">${rows}</div>`:'<p class="empty">Ders oynandıkça burada her dersin bir sonraki tekrar günü görünecek.</p>'}
       <p class="hint">Her dersin son 10 cevabına göre: %70'in altı her gün, %70–89 üç günde bir, %90 ve üstü haftada bir tekrar edilir. Bugünün görevi zayıf dersleri, tekrar zamanı gelenleri ve sıradaki yeni dersi karıştırarak seçer.</p></div>`})()}
   <div class="pnl"><h2>Tekrarlayan hatalar ve çözüm yolları</h2>${misHTML||'<p class="empty">Henüz hata yok.</p>'}</div>
   <div class="pnl"><h2>Temalere göre doğruluk</h2><div class="bars">${byTh}</div><p class="hint">Her yanlış cevap, o temanın bilinen kavram yanılgılarından birine bağlanır; eşleşmeyenler "Dikkat Canavarı" olarak toplanır.</p></div>
   ${recent?`<div class="pnl"><h2>Son 10 cevap</h2><div class="chips" style="justify-content:flex-start">${recent}</div></div>`:''}
   <div class="pnl"><h2>Aile ödülü</h2>${goalBar()}<div class="row"><label class="field">Hedef (altın)<input id="gt" type="number" min="50" step="50" value="${goal.target}"></label><label class="field" style="flex:1">Ödül<input id="gr" type="text" value="${goal.reward.replace(/"/g,'&quot;')}" placeholder="Örnek: Pizza gecesi"></label></div>
     <div class="row"><button class="btn gold" id="gs" type="button">Hedefi kaydet</button><button class="btn" id="gd" type="button">Ödül verildi, sayacı sıfırla</button><span class="hint" id="gmsg"></span></div></div>
   <div class="pnl"><h2>Yedekleme: ilerlemeyi başka cihaza taşı</h2><p class="hint">Altınlar, yıldızlar, mağaza ve rapor yalnızca bu tarayıcıda saklanır. Başka bir tarayıcıya, bilgisayara ya da uygulamaya geçerken önce burada yedek kodunu alın, sonra orada "Yedeği yükle" ile yapıştırın.</p>
     <div class="row"><button class="btn gold" id="bk" type="button">Yedek kodunu al ve kopyala</button><button class="btn" id="bkf" type="button">Yedeği dosya olarak indir</button></div>
     <label class="field" style="margin-top:10px">Yedek kodu<textarea id="bkt" rows="3" spellcheck="false" style="background:var(--paper);border:2px solid var(--line);border-radius:10px;padding:8px 10px;color:var(--ink);font:500 .85rem var(--f-mono);width:100%;resize:vertical" placeholder="Yedek kodunu buraya yapıştırın"></textarea></label>
     <div class="row"><button class="btn" id="bkl" type="button">Yedeği yükle</button><span class="hint" id="bkm"></span></div></div>
   <div class="pnl"><h2>Verileri sil</h2><p class="hint">Rapor, altınlar ve mağaza bu cihazın tarayıcısında saklanır.</p><div class="row"><button class="btn" id="clr" type="button">Rapor verilerini sil</button><span id="clrc"></span></div></div></div>`;
  const $=id=>document.getElementById(id);
  $('gs').onclick=()=>{const g=ST.get('t7-goal',{target:500,reward:'Aile ödülü',base:0});g.target=Math.max(50,+$('gt').value||500);g.reward=$('gr').value.trim()||'Aile ödülü';ST.set('t7-goal',g);reportPage();document.getElementById('gmsg').textContent='Kaydedildi.'};
  $('gd').onclick=()=>{const g=ST.get('t7-goal',{target:500,reward:'Aile ödülü',base:0});g.base=ST.get('t7-earned',0);ST.set('t7-goal',g);reportPage();document.getElementById('gmsg').textContent='Sayaç sıfırlandı.'};
  $('clr').onclick=()=>{$('clrc').innerHTML='<span class="hint">Emin misiniz? Cevap kayıtları silinir (altınlar kalır).</span> <button class="btn" id="clr2" type="button">Evet, sil</button>';$('clr2').onclick=()=>{ST.set('t7-log',[]);reportPage()}};
  $('bk').onclick=()=>{const c=backupCode();$('bkt').value=c;$('bkt').select();try{navigator.clipboard.writeText(c).then(()=>$('bkm').textContent='Kopyalandı. Şimdi diğer cihazda yapıştırın.',()=>$('bkm').textContent='Kod aşağıda; seçip kopyalayın.')}catch(e){$('bkm').textContent='Kod aşağıda; seçip kopyalayın.'}};
  $('bkf').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([backupCode()],{type:'text/plain'}));a.download='fen7-yedek-'+new Date().toISOString().slice(0,10)+'.txt';document.body.appendChild(a);a.click();a.remove();$('bkm').textContent='Dosya indirildi. Diğer cihazda dosyayı açıp içindeki kodu yapıştırın.'};
  $('bkl').onclick=()=>{const r=restoreBackup($('bkt').value);if(!r.ok){$('bkm').textContent=r.msg;return}
    $('bkm').innerHTML=`<span>Bu cihazdaki ilerleme, yedektekiyle değiştirilecek (${r.coins} altın, ${r.answers} cevap).</span> <button class="btn gold" id="bky" type="button">Evet, yükle</button>`;
    $('bky').onclick=()=>{r.apply();location.hash='';location.reload()}};
  document.title='Ebeveyn Raporu · Türkçe 7';
}
/* progress backup: every m7-* key as one copyable code */
function backupCode(){const d={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('t7-')&&!/^t7-voice(name|ok)$/.test(k))d[k]=localStorage.getItem(k)}
  return 'T7Y1:'+btoa(unescape(encodeURIComponent(JSON.stringify({v:1,at:Date.now(),d}))))}
function restoreBackup(txt){try{const t=(txt||'').trim().replace(/\s+/g,'');if(!t.startsWith('T7Y1:'))return {ok:false,msg:'Bu bir Türkçe 7 yedek kodu değil.'};
    const o=JSON.parse(decodeURIComponent(escape(atob(t.slice(5)))));if(!o||typeof o.d!=='object')return {ok:false,msg:'Yedek kodu bozuk.'};
    const keys=Object.keys(o.d).filter(k=>k.startsWith('t7-'));if(!keys.length)return {ok:false,msg:'Yedek boş.'};
    const g=k=>{try{return JSON.parse(o.d[k])}catch(e){return null}};
    return {ok:true,coins:g('t7-coins')||0,answers:(g('t7-log')||[]).length,apply(){const old=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('t7-'))old.push(k)}
      old.forEach(k=>localStorage.removeItem(k));keys.forEach(k=>localStorage.setItem(k,o.d[k]))}}}
  catch(e){return {ok:false,msg:'Yedek kodu okunamadı; tamamını kopyaladığınızdan emin olun.'}}}

/* ================= game controller (DualSense or any standard gamepad, Chrome Gamepad API) ================= */
/* Standard mapping: 0 ✕, 1 ○, 2 □, 3 △, 4 L1, 5 R1, 9 OPTIONS, 12-15 D-pad, axes 0/1 left stick */
const PAD={on:false,prev:[],rep:{},barT:0};
function getPad(){try{return [...(navigator.getGamepads?navigator.getGamepads():[])].find(g=>g&&g.connected)||null}catch(e){return null}}
function rumble(kind){try{const gp=getPad(),va=gp&&gp.vibrationActuator;if(!va||!va.playEffect)return;
  const p=va.playEffect('dual-rumble',kind==='good'?{duration:140,strongMagnitude:.15,weakMagnitude:.9}:{duration:420,strongMagnitude:1,weakMagnitude:.6});if(p&&p.catch)p.catch(()=>{})}catch(e){}}
const visible=el=>{if(!el||!document.contains(el))return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden'};
function focusables(){const root=document.querySelector('.ov')||document;return [...root.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),summary,[tabindex="0"]')].filter(visible)}
function focusEl(el){if(!el)return;try{el.focus({preventScroll:true})}catch(e){}if(el.scrollIntoView)el.scrollIntoView({block:'nearest',inline:'nearest',behavior:RM?'auto':'smooth'});sfx('tick')}
function padAutoFocus(){if(document.querySelector('.ov'))return;
  for(const s of ['#play','#nx','.opt:not(:disabled)','#nl','.cell[tabindex="0"]','.keypad button:not(:disabled)','#pp','#daily','#cont','.tile','#again','.cb','.btn','button','a[href]']){
    const el=[...document.querySelectorAll(s)].find(visible);if(el){try{el.focus({preventScroll:true})}catch(e){}return}}}
function navTo(dir){
  const cur=document.activeElement,els=focusables();if(!els.length)return;
  if(!cur||cur===document.body||!els.includes(cur)){focusEl(els[0]);return}
  const a=cur.getBoundingClientRect(),ax=a.left+a.width/2,ay=a.top+a.height/2;let best=null,bs=Infinity;
  for(const e of els){if(e===cur)continue;const b=e.getBoundingClientRect(),dx=b.left+b.width/2-ax,dy=b.top+b.height/2-ay;
    const p=dir==='left'?-dx:dir==='right'?dx:dir==='up'?-dy:dy,s=dir==='left'||dir==='right'?Math.abs(dy):Math.abs(dx);
    if(p<=4)continue;const score=p+s*2.2;if(score<bs){bs=score;best=e}}
  if(best)focusEl(best);
}
function pressEl(el){
  if(el.id==='nl'){el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));return}
  if(el.tagName==='INPUT'){if(el.form&&el.form.requestSubmit)el.form.requestSubmit();return}
  if(el instanceof HTMLElement)el.click();else el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
}
function padAct(i){
  const ov=document.querySelector('.ov'),cl=id=>{const e=document.getElementById(id);if(e&&!e.disabled&&visible(e)){e.click();return true}return false};
  if(ov&&(i===0||i===1)){ov.click();return}
  if(i===0){const a=document.activeElement;if(!a||a===document.body)padAutoFocus();else pressEl(a);return}
  if(i===1){if(!cl('back')&&location.hash&&location.hash!=='#'){hush();location.hash=''}return}
  if(i===3){cl('rd')||cl('rep');return}
  if(i===2){cl('rb')||cl('first');return}
  if(i===4){cl('prev');return}
  if(i===5){cl('nxt');return}
  if(i===9){cl('pp')||cl('play');return}
}
function padMove(dir){const a=document.activeElement;
  if(a&&a.classList&&a.classList.contains('v3d')&&(dir==='left'||dir==='right')){a.dispatchEvent(new KeyboardEvent('keydown',{key:dir==='left'?'ArrowLeft':'ArrowRight',bubbles:true}));return}
  if(a&&a.id==='nl'&&(dir==='left'||dir==='right')){a.dispatchEvent(new KeyboardEvent('keydown',{key:dir==='left'?'ArrowLeft':'ArrowRight',bubbles:true}));return}
  navTo(dir)}
function padBar(){
  let bar=document.getElementById('padbar');if(!bar){bar=document.createElement('div');bar.id='padbar';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar)}
  const g=(c,s)=>`<span class="pg pg-${c}">${s}</span>`,brief=!!document.getElementById('st'),game=!!document.querySelector('.qcard'),back=!!document.getElementById('back')||!!(location.hash&&location.hash!=='#');
  const it=[['<span class="pg">✛</span>','Gez'],[g('x','✕'),'Seç']];if(back)it.push([g('o','○'),'Geri']);
  if(brief)it.push([g('t','△'),'Tekrarla'],[g('s','□'),'Baştan'],['<span class="pg">L1</span><span class="pg">R1</span>','Sahne'],['<span class="pg">OPTIONS</span>','Oynat / Duraklat']);
  else if(game){it.push([g('t','△'),'Sesli oku']);if(document.getElementById('rb'))it.push([g('s','□'),'Brifing'])}
  if(navigator.userActivation&&!navigator.userActivation.hasBeenActive)it.push(['<span class="pg">!</span>','Sesler için ekrana bir kez tıkla']);
  const html=it.map(([a,t])=>`<span class="pi">${a}<span>${t}</span></span>`).join('');if(bar._h!==html){bar.innerHTML=html;bar._h=html}
}
function padToast(){const t=document.createElement('div');t.className='padtoast';t.setAttribute('role','status');
  t.innerHTML=`<b>Kumanda bağlandı!</b> ${navigator.userActivation&&!navigator.userActivation.hasBeenActive?'Sesler ve anlatım için ekrana bir kez tıkla; sonra kumandayla oyna.':'Yön tuşlarıyla gez, ✕ ile seç, ○ ile geri dön.'}`;
  document.body.appendChild(t);t.animate([{opacity:0,transform:'translate(-50%,-20px)'},{opacity:1,transform:'translate(-50%,0)'}],{duration:300,fill:'forwards'});
  setTimeout(()=>t.animate([{opacity:1},{opacity:0}],{duration:400,fill:'forwards'}).finished.then(()=>t.remove()),5000)}
function padLoop(){
  const gp=getPad(),now=performance.now();
  if(gp){
    if(!PAD.on){PAD.on=true;PAD.prev=gp.buttons.map(b=>b.pressed);document.body.classList.add('pad-on');padBar();padToast()}
    const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed);
    [0,1,2,3,4,5,9].forEach(i=>{const p=b(i);if(p&&!PAD.prev[i])padAct(i);PAD.prev[i]=p});
    const ax=gp.axes||[],D={up:b(12)||ax[1]<-.55,down:b(13)||ax[1]>.55,left:b(14)||ax[0]<-.55,right:b(15)||ax[0]>.55};
    for(const d in D){if(D[d]){if(!PAD.rep[d]){PAD.rep[d]=now+380;padMove(d)}else if(now>=PAD.rep[d]){PAD.rep[d]=now+110;padMove(d)}}else PAD.rep[d]=0}
    const a=document.activeElement;if(!document.querySelector('.ov')&&(!a||a===document.body||!visible(a)))padAutoFocus();
    if(now-PAD.barT>400){PAD.barT=now;padBar()}
  }else if(PAD.on){PAD.on=false;document.body.classList.remove('pad-on');document.getElementById('padbar')?.remove()}
  requestAnimationFrame(padLoop);
}
requestAnimationFrame(padLoop);

/* ================= routing ================= */
function route(){
  B.tok++;hush();S=null;window.scrollTo(0,0);document.body.classList.remove('calm');const h=location.hash;let m;
  document.body.classList.toggle('at-home',!/^#(tema|ders|ogren|pratik|test|gorev|magaza|rapor)/.test(h));
  if((m=h.match(/^#tema-([1-9])$/))){const g=G.find(x=>x.id===+m[1]);setLast(h,`${g.id}. Tema görevi: ${g.name}`);document.title=g.name+' · Türkçe 7';if(g.brief)briefing(g);else start(g);return}
  if((m=h.match(/^#ders-([1-9]-\d)$/))){const l=LESSONS.find(x=>x.id===m[1]);if(l&&l.gen){setLast(h,`${l.no} ${l.t}`);document.title=l.t+' · Türkçe 7';start(GU(l.th),{lesson:l});return}}
  if((m=h.match(/^#ogren-([1-9]-\d)(?:-(\d+))?$/))){const l=LESSONS.find(x=>x.id===m[1]);if(l&&(l.script||l.learn!=null)){setLast('#ogren-'+l.id,`Öğren: ${l.no} ${l.t}`);document.title='Öğren · '+l.t;
    {const sc=scenesFor(l);briefing(GU(l.th),Math.min(+(m[2]||0),sc.length-1),l,sc)}
    if(m[2]!=null)document.getElementById('play')?.click();return}}
  if((m=h.match(/^#pratik-([a-z-]+)$/))&&SK1[m[1]]){const g=G[0];document.title='Pratik · Türkçe 7';start(g,{skill:m[1]});return}
  if((m=h.match(/^#test-([1-9])$/))){const g=G.find(x=>x.id===+m[1]);setLast(h,`${g.id}. Tema seviye testi`);document.title='Seviye testi · '+g.tema;start(g,{test:true});return}
  if(h==='#gorev'){document.title='Bugünün Görevi · Türkçe 7';startDaily();return}
  if(h==='#magaza')return shopPage();
  if(h==='#rapor')return reportPage();
  hub();
}
window.addEventListener('hashchange',route);route();

/* ===== "install as an app" button on the home map =====
   Chrome / Edge / Android: the browser's own install window (beforeinstallprompt). iPhone / iPad: Safari has no install
   window, so a short how-to is shown. Hidden when already running as the installed app, and inside claude.ai (not installable). */
const INST={evt:null,done:false};
const inApp=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const installable=()=>/\.github\.io$|^localhost$/.test(location.hostname);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();INST.evt=e;fillInstall()});
window.addEventListener('appinstalled',()=>{INST.done=true;INST.evt=null;fillInstall();banner('Uygulama yüklendi!')});
function fillInstall(){const slot=document.getElementById('instslot');if(!slot)return;slot.innerHTML='';
  if(inApp()||INST.done||!installable())return;
  if(!INST.evt&&!isIOS())return;
  slot.innerHTML=`<button class="btn gold" id="instb" type="button">${ic('home')} Uygulamayı yükle</button>`;
  document.getElementById('instb').onclick=async()=>{
    if(INST.evt){const e=INST.evt;INST.evt=null;e.prompt();try{const c=await e.userChoice;if(c.outcome!=='accepted')INST.evt=e}catch(_){}fillInstall();return}
    const o=document.createElement('div');o.className='ov';o.innerHTML=`<div class="pnl" style="max-width:520px;cursor:auto;text-align:left"><h2 style="margin-top:0">iPhone / iPad'e yükleme</h2>
      <ol style="line-height:1.7;padding-left:1.3em"><li>Bu sayfayı <b>Safari</b> ile açın.</li><li>Alttaki <b>Paylaş</b> düğmesine dokunun (yukarı ok olan kare).</li><li><b>Ana Ekrana Ekle</b>'yi seçin, sonra <b>Ekle</b>.</li></ol>
      <button class="btn gold" type="button">Tamam</button></div>`;o.onclick=ev=>{if(ev.target===o||ev.target.tagName==='BUTTON')o.remove()};document.body.appendChild(o)}}
new MutationObserver(()=>{const s=document.getElementById('instslot');if(s&&!s.dataset.f){s.dataset.f=1;fillInstall()}}).observe(document.getElementById('app'),{childList:true});
fillInstall();

/* no Turkish voice on this device: say how to add one (Android / Samsung / iPad / Windows) */
/* Edge on Android gives web pages no voices (its Read Aloud is separate); Chrome there uses the tablet's Google voices */
function edgeAndroid(){return /Android/i.test(navigator.userAgent)&&/EdgA\//.test(navigator.userAgent)}
function noVoiceMsg(){if(edgeAndroid())return 'Edge, Android tablette web sayfalarına Türkçe ses vermiyor. Sesli anlatım için oyunu <b>Chrome</b> ile açın (bilgisayarda ise Edge en iyisidir: Ahmet).';return 'Bu cihazda Türkçe ses bulunamadı; anlatımı altyazıdan okuyabilirsin. <a href="#" onclick="voiceHelp();return false">Türkçe ses nasıl eklenir?</a>'}
function voiceHelp(){const o=document.createElement('div');o.className='ov';o.innerHTML=`<div class="pnl" style="max-width:640px;cursor:auto;text-align:left;max-height:86vh;overflow:auto"><h2 style="margin-top:0">Türkçe ses ekleme</h2>${edgeAndroid()?'<p><b>Bu tablette Edge kullanılıyor.</b> Edge, Android’de web sayfalarına ses vermez. Oyunu <b>Chrome</b> ile açın; aşağıdaki ayarlar Chrome için geçerlidir.</p>':''}
  <p><b>Android tablet / telefon</b></p><ol style="line-height:1.6;padding-left:1.3em"><li>Play Store'dan <b>Google'ın Konuşma Hizmetleri</b> (Speech Services by Google) uygulamasını yükleyin veya güncelleyin.</li>
  <li>Ayarlar → <b>Metin okuma çıkışı</b> (Text-to-speech output). Samsung'da: Ayarlar → Genel yönetim → Metin okuma.</li>
  <li>Tercih edilen motor: <b>Google</b>. Yanındaki dişli → <b>Ses verilerini yükle</b> → <b>Türkçe</b>'yi indirin. Dil olarak Türkçe'yi seçin.</li>
  <li>Oyunu kapatıp yeniden açın.</li></ol>
  <p><b>iPad / iPhone</b>: Ayarlar → Erişilebilirlik → Seslendirilen İçerik → Sesler → <b>Türkçe</b> → bir ses indirin.</p>
  <p><b>Windows</b>: Ayarlar → Saat ve dil → Konuşma → Ses ekle → <b>Türkçe</b>. En doğal ses (Ahmet) Microsoft Edge'de internetle gelir.</p>
  <p class="hint">Bu cihazın bildirdiği sesler: ${VOICE.all||0} (Türkçe: ${(VOICE.list||[]).length}).</p>
  <button class="btn gold" type="button">Tamam</button></div>`;o.onclick=ev=>{if(ev.target===o||ev.target.tagName==='BUTTON')o.remove()};document.body.appendChild(o)}
/* a voice that turns up late: refresh the narrator button and drop the "no voice" note */
window.addEventListener('m7voice',()=>{const b=document.getElementById('vsel');if(b)b.innerHTML=`${ic('voice')} Anlatıcı: ${vName()}`;if(VOICE.v)document.querySelectorAll('.vnote').forEach(n=>n.remove())});
