"use strict";
/* Türkçe 7 Oyunları · Maps and timeline for the Öğren lessons (no person is ever drawn), sequence/card scenes, and the ordering and sorting games */
/* ================= helpers ================= */
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
/* break a label into lines of about n characters (SVG text does not wrap by itself) */
function wrapT(t,n){const w=String(t).split(/\s+/),L=[];let c='';for(const x of w){if(c&&(c+' '+x).length>n){L.push(c);c=x}else c=c?c+' '+x:x}if(c)L.push(c);return L}
function tspans(x,lines,dy){return lines.map((l,i)=>`<tspan x="${x}" dy="${i?dy:0}">${esc(l)}</tspan>`).join('')}
const PL=(x,y,t,a='middle',cls='pl')=>`<text x="${x}" y="${y}" text-anchor="${a}" class="${cls}">${esc(t)}</text>`;
const LEAD=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="pl-lead"/>`;
const ARW=(x1,y1,x2,y2,col,w=4)=>{const a=Math.atan2(y2-y1,x2-x1),h=13,p=(d)=>[x2-h*Math.cos(a+d),y2-h*Math.sin(a+d)];const [ax,ay]=p(.42),[bx,by]=p(-.42);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><polygon points="${x2},${y2} ${ax.toFixed(1)},${ay.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}" fill="${col}"/>`};
const RED='#ff4d5e',BLUE='#4f7dff';

/* ================= the labelled diagrams ================= */
/* each returns {art, labels}: the drawing pops in first, then the labels appear one by one while the narrator speaks */
const SEA='#3f86c9',SAND='#d8b47a',GOLD='var(--gold)';
const DOT=(x,y,big)=>`<circle cx="${x}" cy="${y}" r="${big?9:7}" fill="${big?'#ffd166':'#fff'}" stroke="var(--ink)" stroke-width="2.5"/>`;
const COMPASS=(x,y)=>`<g transform="translate(${x},${y})"><circle r="30" fill="var(--panel2)" stroke="var(--line)" stroke-width="2"/><path d="M0,-26 L7,0 L0,26 L-7,0Z" fill="none" stroke="var(--ink-soft)" stroke-width="1.5"/><path d="M0,-26 L7,0 L-7,0Z" fill="${RED}"/>
  <text y="-34" text-anchor="middle" class="pl s">K</text><text y="48" text-anchor="middle" class="pl s">G</text><text x="40" y="5" text-anchor="middle" class="pl s">D</text><text x="-40" y="5" text-anchor="middle" class="pl s">B</text></g>`;
const PICS={
 /* schematic map of the region in the book's Mekke years (north up; distances not to scale) */
 harita:()=>({art:`<rect x="20" y="10" width="760" height="400" rx="18" fill="${SAND}" opacity=".55"/>
   <path d="M158,10 L232,10 L227,90 L275,150 L335,204 L353,250 L410,320 L458,380 L472,410 L440,410 L425,410 L371,370 L338,320 L296,270 L248,210 L200,150 L158,82Z" fill="${SEA}" opacity=".85"/>
   <path d="M20,10 L158,10 L158,82 L200,150 L248,210 L296,270 L338,320 L371,370 L425,410 L20,410Z" fill="#c9a467" opacity=".5"/>
   <text transform="translate(290,262) rotate(52)" text-anchor="middle" class="pl s" style="fill:#fff;letter-spacing:5px">KIZILDENİZ</text>
   <text x="590" y="210" text-anchor="middle" class="pl b" style="fill:var(--ink-soft);letter-spacing:2px">ARAP YARIMADASI</text>
   <text x="110" y="300" text-anchor="middle" class="pl b" style="fill:var(--ink-soft);letter-spacing:2px">AFRİKA</text>
   ${COMPASS(716,70)}`,
   labels:[DOT(374,252,1)+PL(360,246,'Mekke','end','pl b'),DOT(404,262)+PL(418,268,'Taif','start'),DOT(368,190)+PL(384,186,'Medine (Yesrib)','start','pl b'),
     DOT(254,44)+PL(270,40,'Kudüs (Mescid-i Aksa)','start'),DOT(330,398)+PL(316,404,'Habeşistan','end'),
     PL(780,428,'Harita ölçekli değildir','end','pl s')]}),
 /* the Hicret route of the book's Harita 1.2: south to Sevr first, then up the coast, Kuba, Medine */
 hicret:()=>({art:`<rect x="20" y="10" width="760" height="400" rx="18" fill="${SAND}" opacity=".55"/>
   <path d="M20,10 L210,10 C190,90 236,150 200,220 C176,290 230,350 205,410 L20,410Z" fill="${SEA}" opacity=".85"/>
   <text transform="translate(110,240) rotate(-80)" text-anchor="middle" class="pl s" style="fill:#fff;letter-spacing:5px">KIZILDENİZ</text>
   <path d="M470,340 C500,280 530,200 490,90" stroke="var(--ink-soft)" stroke-width="4" fill="none" stroke-dasharray="12 9"/>
   ${COMPASS(716,70)}
   <g transform="translate(560,330)"><line x1="0" y1="0" x2="44" y2="0" stroke="${GOLD}" stroke-width="7" stroke-linecap="round"/><text x="56" y="6" class="pl s">Hicret yolu</text>
   <line x1="0" y1="30" x2="44" y2="30" stroke="var(--ink-soft)" stroke-width="4" stroke-dasharray="12 9"/><text x="56" y="36" class="pl s">Ana yol</text></g>`,
   labels:[DOT(470,340,1)+PL(456,346,'MEKKE','end','pl b'),
     `<path d="M470,340 L498,380" stroke="${GOLD}" stroke-width="7" stroke-linecap="round"/>`+DOT(498,380)+PL(514,386,'Sevr Mağarası (3 gün)','start'),
     `<path d="M498,380 C420,396 330,390 290,340 C250,300 262,200 300,150 C340,104 420,104 482,112" stroke="${GOLD}" stroke-width="7" fill="none" stroke-linecap="round"/>`+PL(262,262,'Sahil yolu','end','pl s'),
     DOT(482,112)+PL(500,124,'KUBA · ilk mescit','start'),
     `<path d="M482,112 L476,70" stroke="${GOLD}" stroke-width="7" stroke-linecap="round"/>`+DOT(476,64,1)+PL(494,58,'MEDİNE · 622','start','pl b')]}),
 /* the Mekke years, as in the book's Bilgi Grafiği 1.3 */
 zaman:()=>{const Y=[[610,'İlk vahiy (Hira)'],[613,'Açık davet'],[615,'Habeşistan’a hicret'],[616,'Boykot başlar'],[619,'Boykot biter'],[620,'Hüzün Yılı · Taif'],[621,'İsra ve miraç · I. Akabe'],[622,'II. Akabe · Hicret']];
   const X=y=>70+(y-610)*55;
   return {art:`<line x1="50" y1="225" x2="760" y2="225" stroke="var(--ink-soft)" stroke-width="5" stroke-linecap="round"/>${ARW(700,225,764,225,'var(--ink-soft)',5)}
     ${Array.from({length:13},(_,i)=>`<line x1="${X(610+i)}" y1="217" x2="${X(610+i)}" y2="233" stroke="var(--ink-soft)" stroke-width="2"/>`).join('')}`,
   labels:Y.map(([y,t],i)=>{const up=i%2===0,x=X(y),ty=up?(i%4===0?120:150):(i%4===1?310:340),L=wrapT(t,14);
     return `<line x1="${x}" y1="225" x2="${x}" y2="${up?ty+8+22*(L.length-1):ty-26}" stroke="${GOLD}" stroke-width="2.5"/>`+DOT(x,225,y===622)+
       `<text x="${x}" y="${up?ty-26:ty-4}" text-anchor="middle" class="pl b" style="fill:var(--gold)">${y}</text><text y="${up?ty:ty+22}" text-anchor="middle" class="pl s">${tspans(x,L,20)}</text>`})}}
};

/* ================= new lesson scene operations ================= */
Object.assign(OPS,{
 pic:async(st,name)=>{const P=PICS[name];if(!P)return;const d=P();
   /* drawn 84 % size, a little below the scene name, so a caption line at y ≈ 410 never covers the drawing */
   const box=document.createElementNS(NS,'g');box.setAttribute('transform','translate(64,30) scale(.84)');st.appendChild(box);
   const g=add(box,d.art);await pop(g,0,600);
   for(const l of d.labels){const e=add(box,l);e.animate([{opacity:0},{opacity:1}],{duration:RM?1:320,fill:'backwards'});sfx('tick');await wait(260)}},
 /* a sequence: steps appear one by one, joined by arrows (food chain, path of food, star life, energy changes) */
 chain:async(st,steps,y=230)=>{const n=steps.length,step=Math.min(170,740/n),x0=400-step*(n-1)/2,r=Math.min(46,step*.34);
   for(let i=0;i<n;i++){const [emo,lab]=steps[i],x=x0+i*step,lines=wrapT(lab,Math.max(8,Math.round(step/11)));
     if(i){const a=add(st,ARW(x-step+r+8,y,x-r-8,y,'var(--gold)',4));a.animate([{opacity:0,transform:'translateX(-10px)'},{opacity:1,transform:'none'}],{duration:RM?1:300,fill:'backwards'});await wait(180)}
     await pop(add(st,`<circle cx="${x}" cy="${y}" r="${r}" class="ch-b"/><text x="${x}" y="${y+r*.36}" text-anchor="middle" style="font-size:${Math.round(r*1.05)}px">${emo}</text><text y="${y+r+30}" text-anchor="middle" class="ch-l">${tspans(x,lines,22)}</text>`));sfx('tick');await wait(300)}},
 /* a few cards side by side (types, groups, examples) */
 cards:async(st,cards)=>{const n=cards.length,cols=n<=3?n:n===4?2:3,rows=Math.ceil(n/cols),gap=18,w=Math.min(232,(740-(cols-1)*gap)/cols),h=rows===1?230:148,
   x0=400-(cols*w+(cols-1)*gap)/2,y0=rows===1?100:64;
   for(let i=0;i<n;i++){const [emo,lab,note]=cards[i],c=i%cols,r=Math.floor(i/cols),x=x0+c*(w+gap),y=y0+r*(h+gap),cx=x+w/2,big=rows===1;
     const nl=note?wrapT(note,Math.round(w/9.5)):[];
     await pop(add(st,`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" class="card-r"/><text x="${cx}" y="${y+(big?78:56)}" text-anchor="middle" style="font-size:${big?56:42}px">${emo}</text>
       <text x="${cx}" y="${y+(big?128:94)}" text-anchor="middle" class="st-txt" style="font-size:${fitFs(lab,24,w*2.2)}px">${esc(lab)}</text>${nl.length?`<text y="${y+(big?160:120)}" text-anchor="middle" class="pl s">${tspans(cx,nl.slice(0,big?3:2),19)}</text>`:''}`));sfx('tick');await wait(320)}}
});

/* ================= Sırala: put the steps in order ================= */
function orderHTML(q){let it;do{it=shuffle(q.items)}while(it.every((x,i)=>x===q.items[i]));q.pool=it;q.pick=[];
  return `<p class="hint">Doğru sırayla dokun. Yanlış koyduğuna dokunursan geri çıkar.</p><ol class="oslots" id="oslots"></ol><div class="opool" id="opool"></div>
    <div class="row"><button class="go" id="chk" type="button" disabled>Kontrol et</button><button class="go alt" id="clr" type="button">Temizle</button></div>`}
function setupOrder(){const q=S.q,slots=document.getElementById('oslots'),pool=document.getElementById('opool'),chk=document.getElementById('chk');
  const draw=()=>{slots.innerHTML=q.items.map((_,i)=>{const t=q.pick[i];return `<li class="oslot${t!=null?' full':''}"><span class="on">${i+1}</span>${t!=null?`<button class="oitem" type="button" data-back="${i}"><span class="ot">${esc(t)}</span></button>`:'<span class="oe">…</span>'}</li>`}).join('');
    pool.innerHTML=q.pool.map((t,i)=>q.pick.includes(t)?'':`<button class="oitem" type="button" data-i="${i}"><span class="ot">${esc(t)}</span></button>`).join('');
    chk.disabled=q.pick.length!==q.items.length;
    pool.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{if(S.done)return;q.pick.push(q.pool[+b.dataset.i]);sfx('tick');draw();if(PAD.on)(pool.querySelector('button')||chk).focus({preventScroll:true})});
    slots.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>{if(S.done)return;q.pick.splice(+b.dataset.back,1);sfx('flip');draw()})};
  draw();document.getElementById('clr').onclick=()=>{if(S.done)return;q.pick=[];draw()};
  chk.onclick=()=>{if(S.done)return;const ok=q.pick.every((t,i)=>t===q.items[i]);
    slots.querySelectorAll('.oslot').forEach((li,i)=>li.classList.add(q.pick[i]===q.items[i]?'right':'wrong'));
    app.querySelectorAll('.answers button').forEach(b=>b.disabled=true);
    finish(ok,`<span class="seq">${q.items.map((t,i)=>`<span>${i+1}. ${esc(t)}</span>`).join('<i>→</i>')}</span>`,ok?null:q.mis,chk)}}

/* ================= Grupla: sort the items into groups ================= */
function sortHTML(q){q.place={};q.sel=null;q.order=shuffle(q.items.map((_,i)=>i));
  return `<p class="hint">Önce bir karta, sonra ait olduğu gruba dokun. Hepsi yerleşince bir karta dokunup yerini değiştirebilirsin.</p><div class="spool" id="spool"></div>
    <div class="sbins" id="sbins" style="--n:${q.bins.length}">${q.bins.map((b,j)=>`<div class="sbin" role="button" tabindex="0" data-b="${j}" aria-label="Gruba koy: ${esc(b)}"><b>${esc(b)}</b><span class="sin" id="sin${j}"></span></div>`).join('')}</div>
    <div class="row"><button class="go" id="chk" type="button" disabled>Kontrol et</button><button class="go alt" id="clr" type="button">Temizle</button></div>`}
function setupSort(){const q=S.q,pool=document.getElementById('spool'),chk=document.getElementById('chk');
  const chip=(i,where)=>`<button class="sitem${q.sel===i?' sel':''}" type="button" data-it="${i}" data-w="${where}"><span class="ot">${esc(q.items[i][0])}</span></button>`;
  const draw=()=>{pool.innerHTML=q.order.filter(i=>q.place[i]==null).map(i=>chip(i,'p')).join('')||'<span class="hint">Hepsi yerleşti. Kontrol et!</span>';
    q.bins.forEach((_,j)=>{document.getElementById('sin'+j).innerHTML=q.order.filter(i=>q.place[i]===j).map(i=>chip(i,'b')).join('')});
    chk.disabled=Object.keys(q.place).length!==q.items.length;
    app.querySelectorAll('.sitem').forEach(b=>b.onclick=e=>{e.stopPropagation();if(S.done)return;const i=+b.dataset.it;
      /* a card is waiting to be placed: tapping anywhere in a group, even on a card already there, puts it in that group */
      if(b.dataset.w==='b'&&q.sel!=null&&q.place[q.sel]==null){b.closest('.sbin').onclick();return}
      if(b.dataset.w==='b'){delete q.place[i];q.sel=i;sfx('flip')}else{q.sel=q.sel===i?null:i;sfx('tick')}draw()});
    app.querySelectorAll('.sbin').forEach(b=>b.classList.toggle('ready',q.sel!=null))};
  app.querySelectorAll('.sbin').forEach(b=>{b.onclick=()=>{if(S.done||q.sel==null)return;q.place[q.sel]=+b.dataset.b;q.sel=null;
    const left=q.order.find(i=>q.place[i]==null);if(left!=null)q.sel=left;sfx('tick');draw()};
    b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();b.onclick()}}});
  q.sel=q.order[0];draw();
  document.getElementById('clr').onclick=()=>{if(S.done)return;q.place={};q.sel=q.order[0];draw()};
  chk.onclick=()=>{if(S.done)return;const ok=q.items.every((x,i)=>q.place[i]===x[1]);
    app.querySelectorAll('.sbin .sitem').forEach(b=>{const i=+b.dataset.it,r=q.place[i]===q.items[i][1];b.classList.add(r?'right':'wrong');if(!r)b.insertAdjacentHTML('beforeend',`<small>→ ${esc(q.bins[q.items[i][1]])}</small>`)});
    app.querySelectorAll('.answers button').forEach(b=>b.disabled=true);
    finish(ok,`<span class="ans">${q.bins.map((b,j)=>`<b>${esc(b)}:</b> ${q.items.filter(x=>x[1]===j).map(x=>esc(x[0])).join(', ')}`).join('<br>')}</span>`,ok?null:q.mis,chk)}}
