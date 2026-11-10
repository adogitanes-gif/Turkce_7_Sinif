"use strict";
/* Türkçe 7 · language add-ons:
   question kinds  listen (Dinle ve Cevapla) · ek (Ek Atölyesi: build) · split (Ek Atölyesi: take apart) ·
                   hunt (Yazım–Noktalama / Söz Sanatı Avcısı) · para (Paragraf Kurucu)
   scene op        ekler (suffix tiles snap into one word)
   Yazma Köşesi    #yaz-<lesson>: the child writes; the text is saved and travels in the teacher report */
SRC_T.metin=['📖','Metin'];SRC_T.siir=['🪶','Şiir'];

/* ---- Dinle ve Cevapla: the narrator reads a hidden text ---- */
function lsPlay(b){const t=b.closest('.ls-box').dataset.t;hush();say(t,true);b.classList.add('on');setTimeout(()=>b.classList.remove('on'),900)}
function lsShow(b){const p=b.closest('.ls-box').querySelector('.ls-text');p.hidden=!p.hidden;b.textContent=p.hidden?'📄 Metni göster':'🙈 Metni gizle'}
Object.assign(EXTRA_MAKE,{
  listen:(raw,base)=>({...base,kind:'choice',listen:raw.text,prompt:`<div class="ls-box" data-t="${esc(raw.text)}"><span class="ls-badge">🎧 Dinle ve Cevapla</span>
     <div class="row"><button class="go ls-play" type="button" onclick="lsPlay(this)">▶ Dinle</button><button class="btn sm ls-show" type="button" onclick="lsShow(this)">📄 Metni göster</button></div>
     <p class="ls-text" hidden>${esc(raw.text)}</p></div><p>${raw.p}</p>`,options:shuffle([{html:raw.a,ok:true},...raw.w.map(([h,mis])=>({html:h,ok:false,mis:mis||'other'}))])}),
  ek:(raw,base)=>({...base,kind:'ekb',parts:raw.parts,info:raw.info||null,tiles:shuffle([...raw.parts,...(raw.extra||[])].map((t,i)=>({t,i}))),mis:raw.mis||'other',
     prompt:`<p><span class="ek-badge">🧩 Ek Atölyesi</span> ${raw.p}</p>`}),
  split:(raw,base)=>({...base,kind:'split',word:raw.word,parts:raw.parts,mis:raw.mis||'other',prompt:`<p><span class="ek-badge">✂️ Ek Atölyesi</span> ${raw.p}</p>`}),
  hunt:(raw,base)=>({...base,kind:'hunt',toks:raw.s.split(' '),bad:raw.bad,fixed:raw.fixed,mis:raw.mis||'other',prompt:`<p><span class="hunt-badge">🔍 Avcı</span> ${raw.p}</p>`}),
  para:(raw,base)=>({...base,kind:'order',para:true,items:raw.items.slice(),mis:raw.mis||'other',prompt:`<p><span class="ek-badge">🧱 Paragraf Kurucu</span> ${raw.p}</p>`})
});

/* ---- Ek Atölyesi: build a word from tiles ---- */
EXTRA_KINDS.ekb={html:q=>{q.pick=[];return `<div class="ek-word" id="ekw"></div><div class="ek-pool" id="ekp"></div>
  <div class="row"><button class="go" id="chk" type="button" disabled>Kontrol et</button><button class="go alt" id="clr" type="button">Temizle</button></div><p class="hint">Parçalara sırayla dokun. Yanlış koyduğuna dokunursan geri çıkar.</p>`},
 setup(){const q=S.q,W=document.getElementById('ekw'),P=document.getElementById('ekp'),chk=document.getElementById('chk');
  const draw=()=>{W.innerHTML=q.parts.map((_,k)=>{const t=q.pick[k];return t?`<button class="ek-tile in" type="button" data-k="${k}">${esc(t.t)}</button>`:`<span class="ek-slot">·</span>`}).join('<span class="ek-plus">+</span>');
    P.innerHTML=q.tiles.map((t,i)=>q.pick.includes(t)?'':`<button class="ek-tile" type="button" data-i="${i}">${esc(t.t)}</button>`).join('');
    chk.disabled=q.pick.length!==q.parts.length;
    P.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{if(S.done||q.pick.length>=q.parts.length)return;q.pick.push(q.tiles[+b.dataset.i]);sfx('tick');draw()});
    W.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{if(S.done)return;q.pick.splice(+b.dataset.k,1);sfx('flip');draw()})};
  draw();document.getElementById('clr').onclick=()=>{if(S.done)return;q.pick=[];draw()};
  chk.onclick=()=>{if(S.done)return;const ok=q.pick.map(t=>t.t).join('|')===q.parts.join('|');
    W.innerHTML=`<span class="ek-built ${ok?'good':'bad'}">${q.pick.map(t=>`<b>${esc(t.t)}</b>`).join('')}</span>`;if(!RM)W.firstChild.animate([{letterSpacing:'.6em',opacity:.4},{letterSpacing:'0',opacity:1}],{duration:500,easing:'ease-out'});
    app.querySelectorAll('.ek-tile').forEach(b=>b.disabled=true);
    finish(ok,`<span class="ans">${q.parts.map((p,k)=>`<span class="ek-ans"><b>${esc(p)}</b>${q.info?`<small>${esc(q.info[k])}</small>`:''}</span>`).join('<span class="ek-plus">+</span>')}</span>`,ok?null:q.mis,chk)}}};

/* ---- Ek Atölyesi: tap the boundaries between root and suffixes ---- */
EXTRA_KINDS.split={html:q=>{q.cuts=new Set();return `<div class="sp-word" id="spw"></div><div class="row"><button class="go" id="chk" type="button">Kontrol et</button><button class="go alt" id="clr" type="button">Temizle</button></div>
  <p class="hint">Kök ile ek, ek ile ek arasına dokun (✂️). Bir daha dokunursan kesik kalkar.</p>`},
 setup(){const q=S.q,Wd=document.getElementById('spw'),chk=document.getElementById('chk'),L=[...q.word];
  const draw=()=>{Wd.innerHTML=L.map((ch,i)=>`<span class="sp-ch">${esc(ch)}</span>${i<L.length-1?`<button class="sp-gap${q.cuts.has(i+1)?' cut':''}" type="button" data-g="${i+1}" aria-label="${i+1}. harften sonra kes">${q.cuts.has(i+1)?'✂️':''}</button>`:''}`).join('');
    Wd.querySelectorAll('.sp-gap').forEach(b=>b.onclick=()=>{if(S.done)return;const g=+b.dataset.g;q.cuts.has(g)?q.cuts.delete(g):q.cuts.add(g);sfx('tick');draw()})};
  draw();document.getElementById('clr').onclick=()=>{if(S.done)return;q.cuts.clear();draw()};
  chk.onclick=()=>{if(S.done)return;const want=new Set();let n=0;q.parts.slice(0,-1).forEach(p=>{n+=[...p].length;want.add(n)});
    const ok=want.size===q.cuts.size&&[...want].every(x=>q.cuts.has(x));
    Wd.innerHTML=q.parts.map((p,k)=>`<span class="sp-part p${k%4}">${esc(p)}</span>`).join('<span class="ek-plus">+</span>');
    finish(ok,`<span class="ans">${q.parts.map(esc).join(' + ')}</span>`,ok?null:q.mis,chk)}}};

/* ---- Avcı: tap the wrong word (spelling/punctuation) or the words that make a figure of speech ---- */
EXTRA_KINDS.hunt={html:q=>{q.sel=new Set();return `<div class="hunt-s" id="hs"></div><div class="row"><button class="go" id="chk" type="button" disabled>Kontrol et</button></div><p class="hint">Cümlede doğru sözcüğe dokun. ${q.bad.length>1?`(${q.bad.length} sözcük)`:''}</p>`},
 setup(){const q=S.q,H=document.getElementById('hs'),chk=document.getElementById('chk');
  const draw=()=>{H.innerHTML=q.toks.map((t,i)=>`<button class="hunt-t${q.sel.has(i)?' sel':''}" type="button" data-i="${i}">${esc(t)}</button>`).join(' ');chk.disabled=!q.sel.size;
    H.querySelectorAll('.hunt-t').forEach(b=>b.onclick=()=>{if(S.done)return;const i=+b.dataset.i;if(q.sel.has(i))q.sel.delete(i);else{if(q.sel.size>=q.bad.length)q.sel.delete([...q.sel][0]);q.sel.add(i)}sfx('tick');draw()})};
  draw();
  chk.onclick=()=>{if(S.done)return;const ok=q.sel.size===q.bad.length&&q.bad.every(i=>q.sel.has(i));
    H.querySelectorAll('.hunt-t').forEach(b=>{const i=+b.dataset.i;b.disabled=true;if(q.bad.includes(i))b.classList.add('right');else if(q.sel.has(i))b.classList.add('wrong')});
    finish(ok,`<span class="ans">${esc(q.fixed)}</span>`,ok?null:q.mis,chk)}}};

/* the listening text plays once by itself when the question appears */
{const _render=render;render=function(){const r=_render.apply(this,arguments);try{if(S&&S.q&&S.q.listen&&!S.q._heard&&VOICE.on&&!FAST){S.q._heard=true;const q0=S.q,t0=S.q.listen;setTimeout(()=>{if(S&&S.q===q0){hush();say(t0)}},450)}}catch(e){}return r}}

/* ---- scene op: suffix tiles fly in and snap into one word ---- */
Object.assign(OPS,{
  ekler:async(st,parts,labels)=>{const n=parts.length,fs=Math.max(30,Math.min(56,620/Math.max(6,parts.join('').length))),cw=parts.map(p=>[...p].length*fs*.62+18),gap=40;
    const tot=cw.reduce((a,b)=>a+b,0)+gap*(n-1);let x=400-tot/2;const xs=cw.map(w=>{const c=x+w/2;x+=w+gap;return c});
    const tot2=cw.reduce((a,b)=>a+b,0)-18*(n-1);let x2=400-tot2/2;const xs2=cw.map(w=>{const ww=w-18,c=x2+ww/2;x2+=ww;return c});
    const G=[];const COLS=['var(--gold)','var(--cyan)','#ff8a3d','#3ddc97','#c77dff','#ff6b8a'];
    for(let i=0;i<n;i++){const g=add(st,`<g><rect x="${xs[i]-cw[i]/2}" y="170" width="${cw[i]}" height="${fs*1.5}" rx="14" fill="${COLS[i%6]}" opacity=".9"/><text x="${xs[i]}" y="${170+fs*1.08}" text-anchor="middle" style="font:900 ${fs}px var(--f-body,system-ui);fill:#0b0a1f">${esc(parts[i])}</text></g>`);
      g.animate([{transform:`translateY(${i%2?120:-120}px)`,opacity:0},{transform:'none',opacity:1}],{duration:RM?1:420,easing:'cubic-bezier(.3,1.4,.6,1)'});G.push(g);sfx('tick');await wait(260)}
    await wait(350);
    G.forEach((g,i)=>{const dx=xs2[i]-xs[i];g.animate([{transform:'none'},{transform:`translateX(${dx}px)`}],{duration:RM?1:450,easing:'ease-in-out',fill:'forwards'})});sfx('coin');await wait(520);
    if(labels)for(let i=0;i<n;i++){const L=wrapT(labels[i],13),yb=170+fs*1.5,dy=(i%2)*64;await pop(add(st,`<path d="M${xs2[i]-cw[i]/2+14},${yb+12} v10 h${cw[i]-28} v-10" fill="none" stroke="${COLS[i%6]}" stroke-width="3"/>
      <line x1="${xs2[i]}" y1="${yb+22}" x2="${xs2[i]}" y2="${yb+30+dy}" stroke="${COLS[i%6]}" stroke-width="2"/>
      <text y="${yb+50+dy}" text-anchor="middle" class="pl s" style="fill:${COLS[i%6]};font-size:17px">${tspans(xs2[i],L,19)}</text>`),0,380);await wait(150)}}
});

/* ================= Yazma Köşesi ================= */
const WKEY='t7-writes';
const wordsOf=t=>(String(t).trim().match(/\S+/g)||[]).length;
function writePage(id){const l=LESSONS.find(x=>x.id===id);if(!l||!l.write){location.hash='';return}
  const W=l.write,all=CL.get(WKEY,{}),cur=all[id]||{text:'',t:0},draft=CL.get(WKEY+'-draft-'+id,null)||cur.text||'';
  document.title='Yazma Köşesi · '+l.t;
  app.innerHTML=`<div class="page wr-page"><div class="row" style="justify-content:space-between"><a class="btn" href="#">← Harita</a><span class="hint">${l.no} ${esc(l.t)} · s. ${l.p}</span></div>
   <h1>📝 Yazma Köşesi</h1><section class="pnl"><h2 style="margin-top:0">${esc(W.title)}</h2><p class="wr-prompt">${esc(W.prompt)}</p>
   <ul class="wr-tips">${W.tips.map((t,i)=>`<li><label><input type="checkbox" data-i="${i}"> ${esc(t)}</label></li>`).join('')}</ul>
   <textarea id="wrt" rows="10" placeholder="Buraya yaz…" spellcheck="true" lang="tr">${esc(draft)}</textarea>
   <div class="row" style="justify-content:space-between"><span class="hint" id="wrc"></span><span class="hint">${cur.t?`Son kayıt: ${CL.date(cur.t)}`:''}</span></div>
   <div class="row"><button class="btn gold" id="wrs" type="button">💾 Kaydet</button><button class="btn" id="wrr" type="button">🔊 Sesli oku</button>${typeof CL_GAME!=='undefined'?`<button class="btn" id="wrt2" type="button">📤 Öğretmenime gönder</button>`:''}</div>
   <p class="hint">Yazın bu cihazda saklanır ve "Öğretmenime gönder" raporuyla öğretmenine ulaşır. Puanlanmaz; öğretmenin okuyup sana mesaj gönderebilir.</p></section></div>`;
  const ta=document.getElementById('wrt'),cnt=document.getElementById('wrc');
  const upd=()=>{const n=wordsOf(ta.value);cnt.innerHTML=`${n} kelime${n<W.min?` · en az ${W.min} kelime yaz`:' · ✅ yeterli uzunluk'}`;try{localStorage.setItem(WKEY+'-draft-'+id,JSON.stringify(ta.value))}catch(e){}};upd();ta.oninput=upd;
  document.getElementById('wrs').onclick=()=>{const t=ta.value.trim();if(wordsOf(t)<W.min){cnt.innerHTML=`⚠️ En az ${W.min} kelime yazmalısın (şu an ${wordsOf(t)}).`;return}
    const A=CL.get(WKEY,{});const first=!A[id];A[id]={text:t.slice(0,1500),t:Date.now(),no:l.no,title:W.title};CL.set(WKEY,A);if(first)addCoins(20);sfx('combo');
    cnt.innerHTML=`✅ Kaydedildi${first?' · +20 altın':''}. Öğretmenine göndermeyi unutma!`;try{CL_GAME.summary()}catch(e){}};
  document.getElementById('wrr').onclick=()=>{hush();say(ta.value||W.prompt,true)};
  const tb=document.getElementById('wrt2');if(tb)tb.onclick=()=>CL_GAME.sendTeacher()}
window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#yaz-(\d{1,2}-\d{1,2})$/);if(m)writePage(m[1])});
window.addEventListener('load',()=>{const m=location.hash.match(/^#yaz-(\d{1,2}-\d{1,2})$/);if(m)writePage(m[1])});
