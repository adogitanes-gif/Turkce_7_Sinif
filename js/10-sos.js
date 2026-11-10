"use strict";
/* Türkçe 7 · thinking-with-evidence add-ons:
   question kinds  src (Kaynak Dedektifi) · tl (Zaman Tüneli) · sc (Sen Olsan? decision scenario) · map (Haritada Bul)
   scene ops       source · timeline · cycle · compare · map
   Maps: Natural Earth 1:50m (public domain), js/09-maps.js. */

/* ================= shared pieces ================= */
const SRC_T={belge:['📜','Belge'],gazete:['📰','Gazete'],alinti:['💬','Alıntı'],tablo:['📋','Tablo'],grafik:['📊','Grafik'],afis:['🪧','Afiş']};
function srcCard(d){const [ic0,nm]=SRC_T[d.t]||['📄','Kaynak'];const meta=[d.by,d.date].filter(Boolean).map(esc).join(' · ');
  let body='';
  if(d.t==='tablo'&&d.rows)body=`<table class="src-tab">${d.rows.map((r,i)=>`<tr>${r.map(c=>i?`<td>${esc(c)}</td>`:`<th>${esc(c)}</th>`).join('')}</tr>`).join('')}</table>`;
  else if(d.t==='grafik'&&d.bars){const mx=Math.max(...d.bars.map(b=>b[1]))||1;body=`<div class="src-bars">${d.bars.map(b=>`<div class="sb"><span>${esc(b[0])}</span><i><b style="width:${Math.round(b[1]/mx*100)}%"></b></i><em>${b[1].toLocaleString('tr-TR')}</em></div>`).join('')}</div>`}
  else body=`<p class="src-text">${esc(d.text||'')}</p>`;
  return `<figure class="src-card src-${d.t}"><figcaption><span class="src-badge">${ic0} ${nm}</span><b>${esc(d.title||'')}</b>${meta?`<small>${meta}</small>`:''}</figcaption>${body}</figure>`}
const yr=y=>y<0?`MÖ ${-y}`:String(y);
/* a small static timeline drawn under the explanation of a Zaman Tüneli question */
function tlSVG(ev){const n=ev.length,x0=60,x1=740,X=i=>n>1?x0+(x1-x0)*i/(n-1):400;
  return `<svg class="tl-mini" viewBox="0 0 800 ${n>4?190:170}" role="img" aria-label="Zaman tüneli"><line x1="30" y1="90" x2="770" y2="90" stroke="var(--gold)" stroke-width="5" stroke-linecap="round"/>
   ${ev.map(([y,t],i)=>{const up=i%2===0,L=wrapT(t,16);return `<circle cx="${X(i)}" cy="90" r="9" fill="var(--gold)"/><text x="${X(i)}" y="${up?62:124}" text-anchor="middle" class="pl b" style="fill:var(--gold)">${esc(yr(y))}</text><text y="${up?36-(L.length-1)*20:150}" text-anchor="middle" class="pl s">${tspans(X(i),L,20)}</text>`}).join('')}</svg>`}

/* ================= question kinds ================= */
const EXTRA_MAKE={
  src:(raw,base)=>({...base,kind:'choice',prompt:`${srcCard(raw.src)}<p>${raw.p}</p>`,options:shuffle([{html:raw.a,ok:true},...raw.w.map(([h,mis])=>({html:h,ok:false,mis:mis||'other'}))])}),
  tl:(raw,base)=>({...base,kind:'order',tl:true,items:raw.ev.map(x=>x[1]),mis:raw.mis||'other',
     prompt:`<p>${raw.p}</p><p class="hint">⏳ En eski olay en üste. Yılları kontrol edince göreceksin.</p>`,explain:`${raw.e}${tlSVG(raw.ev)}`}),
  sc:(raw,base)=>({...base,kind:'scenario',steps:raw.steps,role:raw.role,prompt:`<div class="sc-role"><span class="sc-badge">🎭 Sen Olsan?</span><p>${esc(raw.role)}</p></div>`}),
  map:(raw,base)=>({...base,kind:'map',map:raw.map,target:raw.a,cands:shuffle([raw.a,...raw.w]),mis:raw.mis||'other',prompt:`<p>🗺️ ${raw.p}</p>`})
};
const EXTRA_KINDS={
  scenario:{html:q=>{q.step=0;q.score=0;q.picks=[];return `<div class="sc-box" id="scbox"></div>`},setup:setupScenario},
  map:{html:q=>`<div class="map-q" id="mapq">${mapSVG(q.map,'q')}</div><p class="hint">Haritada doğru yere dokun.</p>`,setup:setupMap}
};

/* ---- Sen Olsan? ---- */
function setupScenario(){const q=S.q,box=document.getElementById('scbox'),n=q.steps.length;
  const step=()=>{const st=q.steps[q.step],opts=shuffle(st.o.map((o,i)=>i));
    box.insertAdjacentHTML('beforeend',`<div class="sc-step" data-s="${q.step}"><div class="sc-q"><span class="sc-n">${q.step+1}/${n}</span> ${esc(st.p)}</div>
      <div class="opts">${opts.map((i,k)=>`<button class="opt" type="button" data-o="${i}"><span class="k">${k+1}</span><span>${esc(st.o[i][0])}</span></button>`).join('')}</div><div class="sc-out" aria-live="polite"></div></div>`);
    const el=box.lastElementChild;if(!RM)el.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],{duration:350,easing:'ease-out'});
    el.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{if(S.done)return;const o=st.o[+b.dataset.o];q.score+=o[1];q.picks.push(o);
      el.querySelectorAll('.opt').forEach(x=>{x.disabled=true;const v=st.o[+x.dataset.o][1];if(x===b)x.classList.add(v===2?'right':v===1?'meh':'wrong');else if(v===2)x.classList.add('best')});
      const out=el.querySelector('.sc-out');out.innerHTML=`<p class="sc-cons ${o[1]===2?'good':o[1]===1?'mid':'bad'}">${o[1]===2?'🌟':o[1]===1?'🤔':'⚠️'} ${esc(o[2])}</p>`;
      if(!RM)out.animate([{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'none'}],{duration:300});
      sfx(o[1]===2?'coin':o[1]===1?'tick':'wrong');
      if(q.step<n-1){out.insertAdjacentHTML('beforeend',`<button class="go" type="button">Sonraki adım →</button>`);const nx=out.querySelector('.go');nx.onclick=()=>{nx.remove();q.step++;step()};try{nx.focus({preventScroll:true})}catch(e){}}
      else{const ok=q.score>=2*n-1,mis=(q.picks.find(p=>p[1]<2&&p[3])||[])[3]||'other';
        const best=q.steps.map((s,i)=>`${i+1}) ${esc(s.o.find(o=>o[1]===2)[0])}`).join('<br>');
        out.insertAdjacentHTML('beforeend',`<p class="sc-score">${'⭐'.repeat(Math.max(0,q.score-(2*n-3)))} Puanın: ${q.score} / ${2*n}</p>`);
        finish(ok,`<span class="ans">${best}</span>`,ok?null:mis,b)}})};
  step()}

/* ---- maps ---- */
function mapProj(v){const V=SOSMAP.views[v];return (lat,lon)=>[V.ox+(lon-V.lon0)*V.kx,V.oy+(V.lat1-lat)*V.ky]}
function mapSVG(v,mode){const V=SOSMAP.views[v];if(!V)return '';
  return `<svg class="map-svg map-${v}" viewBox="0 0 ${V.w} ${V.h}" role="img" aria-label="Harita"><defs><clipPath id="mclip-${mode}"><rect width="${V.w}" height="${V.h}" rx="18"/></clipPath></defs>
    <rect width="${V.w}" height="${V.h}" rx="18" class="map-sea"/><g clip-path="url(#mclip-${mode})">${Object.entries(V.paths).map(([k,d])=>`<path d="${d}" class="map-land" data-c="${k}"/>`).join('')}</g><g class="map-top"></g></svg>`}
const isPin=id=>!!SOSMAP.pins[id];
function placeName(id){if(isPin(id))return SOSMAP.pins[id][2];return (MAPNAMES[id]||id)}
const MAPNAMES={TUR:'Türkiye',GRC:'Yunanistan',BGR:'Bulgaristan',CYP:'Güney Kıbrıs',CYN:'KKTC',SYR:'Suriye',IRQ:'Irak',IRN:'İran',AZE:'Azerbaycan',GEO:'Gürcistan',ARM:'Ermenistan',
  EGY:'Mısır',LBY:'Libya',TUN:'Tunus',DZA:'Cezayir',MAR:'Fas',SAU:'Suudi Arabistan',YEM:'Yemen',JOR:'Ürdün',ISR:'İsrail',LBN:'Lübnan',HUN:'Macaristan',AUT:'Avusturya',SRB:'Sırbistan',
  BIH:'Bosna-Hersek',KOS:'Kosova',ALB:'Arnavutluk',MKD:'Kuzey Makedonya',ROU:'Romanya',UKR:'Ukrayna',RUS:'Rusya',ITA:'İtalya',ESP:'İspanya',PRT:'Portekiz',FRA:'Fransa',DEU:'Almanya',
  GBR:'Birleşik Krallık',POL:'Polonya',KAZ:'Kazakistan',UZB:'Özbekistan',TKM:'Türkmenistan',KGZ:'Kırgızistan',AFG:'Afganistan',PAK:'Pakistan',IND:'Hindistan',CHN:'Çin',JPN:'Japonya',
  SOM:'Somali',SDN:'Sudan',ETH:'Etiyopya',NGA:'Nijerya',ZAF:'Güney Afrika',USA:'ABD',CAN:'Kanada',BRA:'Brezilya',ARG:'Arjantin',MEX:'Meksika',AUS:'Avustralya',IDN:'Endonezya',BGD:'Bangladeş',MYS:'Malezya'};
/* the point where a place's marker sits: the pin, or the middle of the country's largest part */
function placeXY(svg,v,id){if(isPin(id)){const p=SOSMAP.pins[id];return mapProj(v)(p[0],p[1])}
  const path=svg.querySelector(`.map-land[data-c="${id}"]`);if(!path)return null;let best=null;
  for(const part of path.getAttribute('d').split('Z').filter(Boolean)){const n=part.replace(/^M/,'').split('L').map(s=>s.trim().split(/\s+/).map(Number));const xs=n.map(p=>p[0]),ys=n.map(p=>p[1]);
    const a=(Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys));if(!best||a>best.a)best={a,x:(Math.max(...xs)+Math.min(...xs))/2,y:(Math.max(...ys)+Math.min(...ys))/2}}return best?[best.x,best.y]:null}
const SVGNS='http://www.w3.org/2000/svg';
function svgAdd(parent,html){const g=document.createElementNS(SVGNS,'g');g.innerHTML=html;parent.appendChild(g);return g}
function setupMap(){const q=S.q,svg=document.querySelector('#mapq svg'),top=svg.querySelector('.map-top'),COLS=['#4f8bff','#ff8a3d','#3ddc97','#c77dff','#ffc83d'];
  q.cands.forEach((id,i)=>{const xy=placeXY(svg,q.map,id);if(!xy)return;
    if(!isPin(id)){const p=svg.querySelector(`.map-land[data-c="${id}"]`);p.classList.add('cand');p.style.setProperty('--cc',COLS[i%COLS.length]);p.dataset.id=id}
    const g=svgAdd(top,`<g class="map-hit" data-id="${id}" tabindex="0" role="button" aria-label="Seçenek ${i+1}"><circle cx="${xy[0]}" cy="${xy[1]}" r="24" fill="transparent"/>
      <circle cx="${xy[0]}" cy="${xy[1]}" r="13" class="pin" style="fill:${COLS[i%COLS.length]}"/><text x="${xy[0]}" y="${xy[1]+5}" text-anchor="middle" class="pin-n">${i+1}</text></g>`);
    if(!RM)g.animate([{opacity:0,transform:'translateY(-30px)'},{opacity:1,transform:'none'}],{duration:420,delay:i*120,easing:'cubic-bezier(.3,1.5,.6,1)',fill:'backwards'})});
  const pickId=id=>{if(S.done)return;const ok=id===q.target;
    top.querySelectorAll('.map-hit').forEach(h=>{const hid=h.dataset.id,xy=placeXY(svg,q.map,hid);const good=hid===q.target;if(hid===id||good){h.classList.add(good?'right':'wrong');
      svgAdd(top,`<text x="${xy[0]}" y="${xy[1]-22}" text-anchor="middle" class="pin-l ${good?'g':'r'}">${esc(placeName(hid))}</text>`)}});
    finish(ok,`<span class="ans">${esc(placeName(q.target))}</span>`,ok?null:q.mis,svg)};
  top.querySelectorAll('.map-hit').forEach(h=>{h.onclick=()=>pickId(h.dataset.id);h.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pickId(h.dataset.id)}}});
  svg.querySelectorAll('.map-land.cand').forEach(p=>p.onclick=()=>pickId(p.dataset.id))}

/* ================= lesson scene ops ================= */
Object.assign(OPS,{
  /* a document unfolds, then the key words glow */
  source:async(st,d,hl=[])=>{const [ic0,nm]=SRC_T[d.t]||['📄','Kaynak'];const lines=wrapT(d.text||'',40).slice(0,7),h0=176+lines.length*28;
    const g=add(st,`<g><rect x="130" y="70" width="540" height="${h0}" rx="14" class="src-paper"/><text x="160" y="108" class="pl s" style="fill:var(--gold)">${ic0} ${esc(nm.toLocaleUpperCase('tr'))}</text>
      <text x="160" y="140" class="src-ttl">${esc(d.title||'')}</text><text x="160" y="166" class="src-meta">${esc([d.by,d.date].filter(Boolean).join(' · '))}</text>
      ${lines.map((l,i)=>`<text x="160" y="${204+i*28}" class="src-line">${l.split(/(\s+)/).map(w=>`<tspan class="src-w">${esc(w)}</tspan>`).join('')}</text>`).join('')}</g>`);
    g.animate([{transform:'scaleY(0)',opacity:0},{transform:'scaleY(1)',opacity:1}],{duration:RM?1:550,easing:'ease-out'});sfx('flip');await wait(650);
    const words=[...g.querySelectorAll('.src-w')];const want=hl.join(' ').toLocaleLowerCase('tr').split(/\s+/).filter(Boolean);
    for(const w of words){const t=w.textContent.toLocaleLowerCase('tr').replace(/[.,;:!?"“”'’()]/g,'');if(t&&want.includes(t)){w.classList.add('src-hl');if(!RM)w.animate([{opacity:.3},{opacity:1}],{duration:400});sfx('tick');await wait(220)}}},
  /* events pop onto a growing line */
  timeline:async(st,ev)=>{const n=ev.length,x0=90,x1=710,X=i=>n>1?x0+(x1-x0)*i/(n-1):400;
    const ln=add(st,`<line x1="50" y1="240" x2="750" y2="240" stroke="var(--gold)" stroke-width="6" stroke-linecap="round"/>`);
    ln.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:RM?1:600,easing:'ease-out'});await wait(500);
    for(let i=0;i<n;i++){const [y,t]=ev[i],up=i%2===0,L=wrapT(t,14);
      const e=add(st,`<circle cx="${X(i)}" cy="240" r="12" fill="var(--gold)" stroke="#fff" stroke-width="3"/><line x1="${X(i)}" y1="${up?226:254}" x2="${X(i)}" y2="${up?178:302}" stroke="var(--gold)" stroke-width="2"/>
        <text x="${X(i)}" y="${up?166:330}" text-anchor="middle" class="pl b" style="fill:var(--gold);font-size:24px">${esc(yr(y))}</text><text y="${up?140-(L.length-1)*22:358}" text-anchor="middle" class="pl">${tspans(X(i),L,22)}</text>`);
      await pop(e,0,450);sfx('tick');await wait(160)}},
  /* a turning loop: production → distribution → consumption … */
  cycle:async(st,nodes,center)=>{const n=nodes.length,cx=400,cy=228,R=125,P=i=>{const a=-Math.PI/2+2*Math.PI*i/n;return [cx+R*Math.cos(a),cy+R*Math.sin(a)]};
    add(st,`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--line)" stroke-width="3" stroke-dasharray="10 10"/>`);
    if(center)await pop(add(st,`<circle cx="${cx}" cy="${cy}" r="62" class="ch-b"/><text x="${cx}" y="${cy+8}" text-anchor="middle" class="st-txt" style="font-size:22px">${esc(center)}</text>`),0,450);
    for(let i=0;i<n;i++){const [x,y]=P(i),[x2,y2]=P((i+1)%n),a0=Math.atan2(y-cy,x-cx),a1=Math.atan2(y2-cy,x2-cx);
      await pop(add(st,`<circle cx="${x}" cy="${y}" r="44" class="ch-b"/><text x="${x}" y="${y+14}" text-anchor="middle" style="font-size:38px">${nodes[i][0]}</text>
        <text x="${x}" y="${y+(y>cy?70:-56)}" text-anchor="middle" class="ch-l" style="font-size:20px">${esc(nodes[i][1])}</text>`),0,420);sfx('tick');
      const mid=(a0+a1+(a1<a0?2*Math.PI:0))/2,mx=cx+R*Math.cos(mid),my=cy+R*Math.sin(mid),tx=-Math.sin(mid),ty=Math.cos(mid);
      add(st,ARW(mx-tx*14,my-ty*14,mx+tx*14,my+ty*14,'var(--gold)',6));await wait(140)}
    const dot=add(st,`<circle cx="${cx}" cy="${cy-R}" r="9" fill="var(--gold)" class="cy-dot"><animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="5s" repeatCount="indefinite"/></circle>`);
    if(RM)dot.querySelector('animateTransform').remove()},
  /* then and now, side by side */
  compare:async(st,heads,rows)=>{const yl=118;
    await pop(add(st,`<rect x="60" y="70" width="320" height="50" rx="12" fill="var(--cyan)" opacity=".85"/><text x="220" y="104" text-anchor="middle" class="st-txt" style="fill:#08131f;font-size:24px">${esc(heads[0])}</text>
      <rect x="420" y="70" width="320" height="50" rx="12" fill="var(--gold)" opacity=".9"/><text x="580" y="104" text-anchor="middle" class="st-txt" style="fill:#1d1400;font-size:24px">${esc(heads[1])}</text><text x="400" y="104" text-anchor="middle" style="font-size:26px">⇄</text>`),0,400);
    for(let i=0;i<rows.length;i++){const y=yl+30+i*68;
      const a=add(st,`<rect x="60" y="${y}" width="320" height="56" rx="12" class="card-r"/><text x="220" y="${y+36}" text-anchor="middle" class="st-txt" style="font-size:${fitFs(rows[i][0],22,600)}px">${esc(rows[i][0])}</text>`);
      const b=add(st,`<rect x="420" y="${y}" width="320" height="56" rx="12" class="card-r"/><text x="580" y="${y+36}" text-anchor="middle" class="st-txt" style="font-size:${fitFs(rows[i][1],22,600)}px">${esc(rows[i][1])}</text>`);
      a.animate([{transform:'translateX(-60px)',opacity:0},{transform:'none',opacity:1}],{duration:RM?1:380,easing:'ease-out'});await wait(200);
      b.animate([{transform:'translateX(60px)',opacity:0},{transform:'none',opacity:1}],{duration:RM?1:380,easing:'ease-out'});sfx('tick');await wait(280)}},
  /* an animated map: pins drop, countries light up */
  map:async(st,v,marks)=>{const V=SOSMAP.views[v];if(!V)return;const sc=Math.min(760/V.w,316/V.h),ox=400-V.w*sc/2,oy=60;
    const g=add(st,`<g transform="translate(${ox},${oy}) scale(${sc})">${mapSVG(v,'s').replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</g>`);
    g.animate([{opacity:0},{opacity:1}],{duration:RM?1:500});await wait(450);const inner=g.firstElementChild,top=g.querySelector('.map-top');
    for(const [t,id,lab] of marks){let xy;
      if(t==='country'){const p=g.querySelector(`.map-land[data-c="${id}"]`);if(p){p.classList.add('lit');xy=placeXY(g,v,id)}}
      else{const pp=SOSMAP.pins[id];if(pp)xy=mapProj(v)(pp[0],pp[1])}
      if(!xy)continue;const lab2=lab||placeName(id);
      const m=svgAdd(top,`<circle cx="${xy[0]}" cy="${xy[1]}" r="${t==='pin'?9:6}" class="pin" style="fill:${t==='pin'?'var(--red)':'var(--gold)'}"/><text x="${xy[0]}" y="${xy[1]-14}" text-anchor="middle" class="pin-l s">${esc(lab2)}</text>`);
      if(!RM)m.animate([{opacity:0,transform:'translateY(-24px)'},{opacity:1,transform:'none'}],{duration:420,easing:'cubic-bezier(.3,1.5,.6,1)'});sfx('tick');await wait(420)}}
});

/* ================= hooks into the engine ================= */
window.EXTRA_MAKE=EXTRA_MAKE;window.EXTRA_KINDS=EXTRA_KINDS;
