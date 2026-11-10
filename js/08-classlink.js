"use strict";
/* Grade 7 games · class link (shared by Matematik 7, Fen 7, Peygamberimizin Hayatı 7, English 7 and the teacher panel).
   No server: the student's name/class are entered once and shared by all games (same web address = same storage);
   reports travel as a link the student sends (WhatsApp / BiP / e-mail); the teacher's note comes back as a link.
   The part after "#" in a link is never sent to any server. */
const CL={
  PANEL:'https://adogitanes-gif.github.io/Ogretmen_7/',
  GAMES:{m7:{name:'Matematik 7',tr:'Matematik',url:'https://adogitanes-gif.github.io/Matematik_7_Sinif/'},
         f7:{name:'Fen Bilimleri 7',tr:'Fen Bilimleri',url:'https://adogitanes-gif.github.io/Fen_7_Sinif/'},
         p7:{name:'Peygamberimizin Hayatı 7',tr:'Peygamberimizin Hayatı',url:'https://adogitanes-gif.github.io/Peygamber_7_Sinif/'},
         e7:{name:'English 7',tr:'İngilizce',url:'https://adogitanes-gif.github.io/English_7_Sinif/'},
         s7:{name:'Sosyal Bilgiler 7',tr:'Sosyal Bilgiler',url:'https://adogitanes-gif.github.io/Sosyal_7_Sinif/'},
         t7:{name:'Türkçe 7',tr:'Türkçe',url:'https://adogitanes-gif.github.io/Turkce_7_Sinif/'}},
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
  h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')},
  /* text <-> link-safe code */
  enc(o){const s=JSON.stringify(o);return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')},
  dec(c){try{c=String(c).replace(/-/g,'+').replace(/_/g,'/');while(c.length%4)c+='=';return JSON.parse(decodeURIComponent(escape(atob(c))))}catch(e){return null}},
  /* a light seal: stops casual editing of a report by hand (not real security) */
  seal(o){const s=JSON.stringify(o)+'·g7';let x=0x811c9dc5;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)>>>0}return x.toString(36)},
  pack(o){return CL.enc({...o,z:CL.seal(o)})},
  unpack(c){const o=CL.dec(c);if(!o||!o.z)return null;const {z,...rest}=o;return CL.seal(rest)===z?rest:null},
  /* names */
  cap(s){return String(s||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('tr').replace(/(^|[\s-])(\S)/g,(m,a,b)=>a+b.toLocaleUpperCase('tr'))},
  /* class code: grade 1-12, then 1-3 letters/digits. Without a separator the part must start with a letter ("11A" is 11-A;
     "111", "71", "13A" are refused); a part starting with a digit needs -, /, . or a space ("7-101"). */
  normClass(s){const m=String(s||'').trim().toLocaleUpperCase('tr').match(/^(1[0-2]|[1-9])(?:\s*[-/.\s]\s*([A-ZÇĞİÖŞÜ0-9]{1,3})|([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ0-9]{0,2}))$/);return m?m[1]+'-'+(m[2]||m[3]):null},
  student(){return CL.get('g7-student',null)},
  parent(){const p=CL.get('g7-parent',{});return {father:p.father||p.phone||'',mother:p.mother||'',email:p.email||''}},
  intl(t){let d=String(t||'').replace(/\D/g,'');if(/^0\d{10}$/.test(d))d='9'+d;else if(/^5\d{9}$/.test(d))d='90'+d;return d},
  phones(c,en){return [[en?'Father':'Baba',c.father],[en?'Mother':'Anne',c.mother]].filter(x=>x[1]&&String(x[1]).trim())},
  okPhone(t){const d=String(t||'').replace(/\D/g,'');return !d||/^(0?5\d{9}|905\d{9})$/.test(d)},
  okMail(t){t=String(t||'').trim();return !t||/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)},
  full(st){return st?`${st.n} ${st.s}`:''},
  key(st){return (st.c+'|'+st.n+' '+st.s).toLocaleLowerCase('tr')},
  date(t){try{return new Date(t).toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'})}catch(e){return ''}},
  pct(a,b){return b?Math.round(a/b*100):0},
  cut(t,n){t=String(t||'');if(t.length<=n)return t;const c=t.slice(0,n-1),i=c.lastIndexOf(' ');return (i>n*.6?c.slice(0,i):c)+'…'},

  /* ===== homework (Ödev): the teacher sets it in the panel and sends it as a #odev=… link.
     An assignment: {id, g: game id, ti: title, m: note, c: class, to: [student keys] or none (= whole class),
       t: time given, due: last moment (end of the due day), it: [[kind 'p' play | 'w' write, lesson id, label]]}.
     An item is done when, after the assignment was given, the lesson is played with at least 7/10
     (from <game>-plays) or the writing is saved (from <game>-writes). The first done time is kept (g7-odev-done). */
  odevOk(a){return !!(a&&a.id&&a.g&&CL.GAMES[a.g]&&a.ti&&a.due&&a.t&&Array.isArray(a.it)&&a.it.length&&a.it.every(x=>Array.isArray(x)&&(x[0]==='p'||x[0]==='w')&&x[1]))},
  odevMine(a,st){if(!st)return true;return a.to&&a.to.length?a.to.includes(CL.key(st)):a.c===st.c},
  odevItem(a,it){const [ty,lid]=it;
    if(ty==='p'){const P=CL.get(a.g+'-plays',[]).filter(x=>x.l===lid&&x.t>=a.t),ok=P.find(x=>x.s>=7);return [ok?ok.t:0,P.length?Math.max(...P.map(x=>x.s)):null]}
    const w=CL.get(a.g+'-writes',{})[lid];return [w&&w.t>=a.t?w.t:0,null]},
  odevCheck(a){const D=CL.get('g7-odev-done',{}),d=D[a.id]||{};let ch=false;
    const r=a.it.map(it=>{const k=it[0]+':'+it[1];let [t,sc]=CL.odevItem(a,it);if(d[k])t=d[k];else if(t){d[k]=t;ch=true}return [it[0],it[1],t,sc]});
    if(ch){D[a.id]=d;CL.set('g7-odev-done',D)}return r},
  odevState(due,items,now){const n=items.length,k=items.filter(x=>x[2]).length;
    if(n&&k===n)return Math.max(...items.map(x=>x[2]))<=due?'ok':'late';return (now||Date.now())>due?'miss':k?'go':'new'},
  ODS:{ok:['✅','Tamamlandı','g'],late:['⏰','Geç teslim edildi','y'],go:['🔄','Devam ediyor','n'],new:['⬜','Başlanmadı','n'],miss:['❌','Süresi geçti, eksik','r']},
  ODS_EN:{ok:['✅','Done','g'],late:['⏰','Done late','y'],go:['🔄','In progress','n'],new:['⬜','Not started','n'],miss:['❌','Past due, missing','r']},
  dueText(due,en){const d=Math.ceil((due-Date.now())/864e5);if(d<0)return en?'past due':'süresi geçti';if(d===0)return en?'due today':'bugün son gün';return en?`${d} day${d>1?'s':''} left`:`${d} gün kaldı`},
  /* the student's homework status as sent in the report: [{id,g,ti,due,t,it:[[kind,lesson,doneTime,best]]}] */
  odevReport(st){return CL.get('g7-odev',[]).filter(a=>CL.odevOk(a)&&CL.odevMine(a,st)).slice(-12).map(a=>({id:a.id,g:a.g,ti:a.ti,due:a.due,t:a.t,it:CL.odevCheck(a)}))},

  /* ===== roles: the coordinator (class teacher) invites subject teachers (#ogr=… opens the panel), a teacher invites a class
     (#davet=… opens a game), a teacher sends the coordinator a class summary (#oz=…). Every note and homework carries
     by:{tid,n}, the sender, so the student sees who sent it. Teachers known to a student: g7-teachers {tid:{n,sub,c,ph,em,t}}. */
  invOk(o){return !!(o&&o.k==='cinv'&&o.tid&&o.tn&&CL.normClass(o.c))},
  subs(sub){return (sub||[]).filter(g=>CL.GAMES[g]).map(g=>CL.GAMES[g].tr).join(', ')},
  tlabel(t,en){if(!t)return '';const r=t.role==='coord'?(en?'class teacher':'Sınıf öğretmeni'):'',sb=t.sub&&t.sub.length?CL.subs(t.sub):'';return t.n+(r||sb?' ('+[r,sb].filter(Boolean).join(' · ')+')':'')},

  /* ===== signatures: class links (#sinif=) and announcements (#duyuru=) are signed with ECDSA P-256 (WebCrypto) by the
     coordinator's or a teacher's panel; a student's game keeps the class's public key from the first join and accepts later
     updates only if they verify. CL.seal stays a casual-edit guard only. Public keys travel compressed (33 bytes). */
  canon(o){if(Array.isArray(o))return '['+o.map(CL.canon).join(',')+']';if(o&&typeof o==='object')return '{'+Object.keys(o).filter(k=>o[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+CL.canon(o[k])).join(',')+'}';return JSON.stringify(o)},
  b64u(buf){let s='';new Uint8Array(buf).forEach(b=>s+=String.fromCharCode(b));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')},
  ub64u(t){t=String(t).replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';const s=atob(t),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a},
  canSign(){try{return !!(window.crypto&&crypto.subtle&&window.isSecureContext!==false&&typeof BigInt==='function')}catch(e){return false}},
  _pw(b,e,m){let r=1n;b%=m;while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n}return r},
  compress(raw){const a=new Uint8Array(raw),c=new Uint8Array(33);c[0]=2+(a[64]&1);c.set(a.slice(1,33),1);return CL.b64u(c)},
  decompress(t){const c=CL.ub64u(t);if(c.length!==33)throw new Error('key');
    const P=BigInt('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff'),B=BigInt('0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b');
    let x=0n;for(let i=1;i<33;i++)x=(x<<8n)|BigInt(c[i]);const y2=(((x*x%P)*x-3n*x+B)%P+P)%P;let y=CL._pw(y2,(P+1n)/4n,P);if((y&1n)!==BigInt(c[0]&1))y=P-y;
    const out=new Uint8Array(65);out[0]=4;out.set(c.slice(1),1);for(let i=64;i>=33;i--){out[i]=Number(y&255n);y>>=8n}return out},
  async genKey(){const k=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
    return {pub:CL.compress(await crypto.subtle.exportKey('raw',k.publicKey)),priv:await crypto.subtle.exportKey('jwk',k.privateKey)}},
  async signObj(priv,o){const k=await crypto.subtle.importKey('jwk',priv,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
    return CL.b64u(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},k,new TextEncoder().encode(CL.canon(o))))},
  async verifyObj(pub,o,sig){try{const k=await crypto.subtle.importKey('raw',CL.decompress(pub),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
    return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},k,CL.ub64u(sig),new TextEncoder().encode(CL.canon(o)))}catch(e){return false}},
  unsigned(o){const b={...o};delete b.sig;return b},
  byeOk(o){return !!(o&&o.k==='bye'&&o.cid&&o.co&&o.co.tid&&o.co.pub&&o.bye&&o.bye.key&&typeof o.bye.pt==='number'&&o.sig)},
  clsOk(o){return !!(o&&o.k==='cls'&&o.cid&&CL.normClass(o.c)&&o.co&&o.co.tid&&o.co.n&&o.co.pub&&Array.isArray(o.seats)&&typeof o.v==='number'&&typeof o.t==='number'&&o.sig)},

  /* ===== the Turkish parent message (used by the games and by the teacher panel) ===== */
  parentMessage(st,games,o={}){
    const ids=Object.keys(games||{}).filter(k=>games[k]&&CL.GAMES[k]);const L=[];
    const w=ids.map(k=>games[k].wk||{n:0,ok:0,days:0}),wn=w.reduce((a,x)=>a+x.n,0),wok=w.reduce((a,x)=>a+x.ok,0),wd=Math.max(0,...w.map(x=>x.days||0));
    L.push(`Sayın Veli,`);
    L.push(`${CL.full(st)} (${st.c}) için uygulama özeti${o.date?` (${o.date})`:''}:`);
    if(wn)L.push(`📅 Son 7 gün: ${wd} gün çalıştı, ${wn} soru çözdü, doğruluk %${CL.pct(wok,wn)}.`);
    else L.push(`📅 Son 7 günde uygulamalarda çalışma görünmüyor.`);
    ids.forEach(k=>{const g=games[k];L.push(`• ${CL.GAMES[k].tr}: ${g.done}/${g.less} ders tamamlandı, genel doğruluk %${CL.pct(g.ok,g.n)}${g.streak?`, ${g.streak} gün üst üste görev`:''}.`)});
    /* strongest unit (enough answers) */
    let best=null;ids.forEach(k=>(games[k].units||[]).forEach(u=>{if(u[3]>=8){const a=u[2]/u[3];if(!best||a>best.a)best={a,k,t:u[1]}}}));
    if(best&&best.a>=.75)L.push(`✅ Güçlü olduğu konu: ${CL.GAMES[best.k].tr} – ${best.t} (%${Math.round(best.a*100)}).`);
    /* what to work on */
    const todo=[];ids.forEach(k=>{const g=games[k];(g.weak||[]).slice(0,2).forEach(t=>todo.push(`${CL.GAMES[k].tr}: "${t}" dersini tekrar etmeli.`));
      if(k!=='e7')(g.mis||[]).slice(0,1).forEach(m=>{if(m[2])todo.push(`${CL.GAMES[k].tr} – sık yapılan hata (${m[0]}): ${m[2]}`)})});
    if(todo.length){L.push(`📌 Çalışması gerekenler:`);todo.slice(0,5).forEach(t=>L.push(`  - ${t}`))}
    /* reward */
    const gl=ids.map(k=>games[k].goal).filter(Boolean)[0];
    if(wd>=5)L.push(`🏆 Bu hafta ${wd} gün düzenli çalıştı; küçük bir ödülü ve takdiri hak ediyor.`);
    else if(wd>=3)L.push(`👍 Bu hafta ${wd} gün çalıştı. Haftada 5 güne çıkarsa bir ödül sözü verebilirsiniz.`);
    if(gl&&gl.target){const left=Math.max(0,gl.target-gl.got),named=gl.reward&&!/^(aile ödülü|family reward)$/i.test(gl.reward.trim()),rw=named?`aile ödülüne ("${gl.reward}")`:'aile ödülü hedefine';L.push(left?`🎯 Uygulamadaki ${rw} ${left} altın kaldı.`:`🎉 Uygulamadaki ${rw} ulaştı; ödülü verme zamanı!`)}
    L.push(`💡 Öneri: Her gün yaklaşık 15 dakika "Bugünün Görevi"ni birlikte açın. Yanlış cevapta çıkan kısa açıklamayı birlikte okuyun ve doğrusunu ona anlattırın. Emeğini övün, sadece puanı değil.`);
    if(o.od&&o.od.length){const now=Date.now(),cnt={ok:0,late:0,go:0,new:0,miss:0};const miss=[];o.od.forEach(a=>{const s=CL.odevState(a.due,a.it,now);cnt[s]++;if(s==='miss'||((s==='go'||s==='new')&&a.due-now<2*864e5))miss.push(`${CL.GAMES[a.g]?CL.GAMES[a.g].tr+' – ':''}${a.ti} (son gün ${CL.date(a.due)})`)});
      const parts=[cnt.ok&&`${cnt.ok} tamamlandı`,cnt.late&&`${cnt.late} geç teslim`,(cnt.go+cnt.new)&&`${cnt.go+cnt.new} devam ediyor`,cnt.miss&&`${cnt.miss} eksik`].filter(Boolean);
      L.push(`📋 Öğretmenin verdiği ödevler: ${parts.join(', ')}.`);if(miss.length){L.push(`  Takip etmeniz gerekenler:`);miss.slice(0,3).forEach(t=>L.push(`  - ${t}`))}}
    const nw=ids.reduce((a,k)=>a+((games[k].writes||[]).length),0);if(nw)L.push(`✍️ Yazma Köşesi'nde ${nw} yazı yazdı. Yazısını birlikte okuyup övgüyle geri bildirim verebilirsiniz.`);
    if(o.note)L.push(`📝 Öğretmen notu: ${o.note}`);
    if(o.teachers&&o.teachers.length)L.push(`👩‍🏫 Öğretmenleri: ${o.teachers.join(' · ')}`);
    if(o.reply)L.push(`Sorularınız için bu mesaja yanıt verebilirsiniz.`);
    L.push(o.sign||`— ${st.c} Sınıf Öğretmeni`);
    return L.join('\n')},

  /* ===== share window: Paylaş (BiP, WhatsApp… from the phone's list), WhatsApp, e-posta, kopyala ===== */
  share(o){const T=o.en?{share:'Share',copy:'Copy',close:'Close',mail:'E-mail',copied:'Copied!',bip:'For BiP: tap Share and choose BiP, or Copy and paste it.'}:
      {share:'Paylaş',copy:'Kopyala',close:'Kapat',mail:'E-posta',copied:'Kopyalandı!',bip:'BiP için: "Paylaş"a dokunup BiP\'i seçin ya da Kopyala ile BiP\'e yapıştırın.'};
    const ov=document.createElement('div');ov.className='ov cl-ov';ov.innerHTML=`<div class="pnl cl-pnl" role="dialog" aria-modal="true" aria-label="${CL.h(o.title)}">
      <h2 style="margin-top:0">${CL.h(o.title)}</h2>${o.intro?`<p class="hint">${o.intro}</p>`:''}
      <textarea class="cl-ta" rows="${o.rows||9}" ${o.edit?'':'readonly'}>${CL.h(o.text)}</textarea>
      <div class="row cl-btns">${navigator.share?`<button class="btn gold" data-a="share" type="button">📤 ${T.share}</button>`:''}
        ${(o.phones&&o.phones.length?o.phones:[['','']]).map((p,i)=>`<a class="btn" data-a="wa" data-i="${i}" target="_blank" rel="noopener">WhatsApp${p[0]?' · '+CL.h(p[0]):''}</a>`).join('')}<a class="btn" data-a="mail">✉️ ${T.mail}</a>
        <button class="btn" data-a="copy" type="button">📋 ${T.copy}</button><button class="btn" data-a="close" type="button">${T.close}</button></div>
      <p class="hint">${T.bip}</p></div>`;
    document.body.appendChild(ov);const ta=ov.querySelector('.cl-ta'),txt=()=>ta.value;
    const was=[...ov.querySelectorAll('[data-a=wa]')],ml=ov.querySelector('[data-a=mail]'),PH=(o.phones&&o.phones.length?o.phones:[['','']]).map(p=>CL.intl(p[1]));
    const upd=()=>{was.forEach((a,i)=>a.href=`https://wa.me/${PH[i]}?text=${encodeURIComponent(txt())}`);ml.href=`mailto:${encodeURIComponent(o.email||'')}?subject=${encodeURIComponent(o.subject||o.title)}&body=${encodeURIComponent(txt())}`};upd();ta.oninput=upd;
    ov.querySelector('[data-a=close]').onclick=()=>ov.remove();
    ov.querySelector('[data-a=copy]').onclick=async e=>{try{await navigator.clipboard.writeText(txt())}catch(_){ta.select();document.execCommand('copy')}e.target.textContent=T.copied};
    const fire=()=>{if(o.onSend)try{o.onSend()}catch(e){}};was.forEach(a=>a.addEventListener('click',fire));ml.addEventListener('click',fire);ov.querySelector('[data-a=copy]').addEventListener('click',fire);
    const sb=ov.querySelector('[data-a=share]');if(sb)sb.onclick=()=>navigator.share({title:o.subject||o.title,text:txt()}).then(fire).catch(()=>{});
    ov.addEventListener('click',e=>{if(e.target===ov)ov.remove()});return ov}
};

/* ======================= inside a game ======================= */
if(typeof window!=='undefined'&&window.G7_GAME&&typeof LESSONS!=='undefined'){(function(){
  const GM=window.G7_GAME,PX=GM.id,EN=GM.lang==='en',T=EN?{
    who:'Who is playing?',whoHint:'Type your first name, surname and class once. All the games will remember it.',
    n:'First name',s:'Surname',c:'Class (e.g. 7-A)',save:'Save',bad:'Please write your first name, surname and class like 7-A.',
    edit:'Change name',send:'📤 Send to my teacher',sendT:'Send your report to your teacher',
    sendIntro:'Send this message to your teacher on WhatsApp, BiP or e-mail. Your teacher opens the link to see your progress.',
    note:'Message from your teacher',read:'Got it',forOther:'This message is for',parent:'👨‍👩‍👧 Send to parent (Turkish)',parentT:'Message for the parent (Turkish)',
    parentIntro:'A Turkish summary for the parent with advice and a reward idea. You can edit it before sending.',
    classPanel:'Teacher and parent',classHint:'Send your progress in all the games to your teacher, or a Turkish summary to your parent.',pf:'Father\'s phone (optional)',pm:'Mother\'s phone (optional)',pe:'Parent\'s e-mail (optional)',pHint:'Saved only on this device. Then WhatsApp and e-mail open straight to your parent.',pBad:'Please check the phone number (like 0532 123 45 67) and the e-mail.',pTo:'Goes straight to:',pNone:'Tip: add your parent\'s phone or e-mail with "✎ Change name" to send in one tap.',pEdit:'Parent contact'}:{
    who:'Kim oynuyor?',whoHint:'Adını, soyadını ve sınıfını bir kez yaz. Tüm oyunlar hatırlar.',
    n:'Ad',s:'Soyad',c:'Sınıf / şube (örnek: 7-A)',save:'Kaydet',bad:'Lütfen ad, soyad ve sınıfı 7-A gibi yaz.',
    edit:'Adı değiştir',send:'📤 Öğretmenime gönder',sendT:'Raporunu öğretmenine gönder',
    sendIntro:'Bu mesajı öğretmenine WhatsApp, BiP ya da e-posta ile gönder. Öğretmenin bağlantıyı açınca ilerlemeni görür.',
    note:'Öğretmeninden mesaj',read:'Okudum',forOther:'Bu mesaj şu öğrenci için:',parent:'👨‍👩‍👧 Veliye gönder',parentT:'Veli mesajı',
    parentIntro:'Velinize gidecek Türkçe özet: ilerleme, öneriler ve ödül fikri. Göndermeden önce değiştirebilirsiniz.',
    classPanel:'Öğretmen ve veli',classHint:'Tüm oyunlardaki ilerlemeni öğretmenine, Türkçe özeti velinize gönder.',pf:'Babanın telefonu (isteğe bağlı)',pm:'Annenin telefonu (isteğe bağlı)',pe:'Velinin e-postası (isteğe bağlı)',pHint:'Yalnızca bu cihazda saklanır. Böylece WhatsApp ve e-posta doğrudan velinize açılır.',pBad:'Telefonu (örnek 0532 123 45 67) ve e-postayı kontrol edin.',pTo:'Doğrudan gidecek:',pNone:'İpucu: "✎ Adı değiştir" ile velinin telefonunu ya da e-postasını eklerseniz tek dokunuşla gönderilir.',pEdit:'Veli iletişimi'};

  /* ---- this game's summary, cached in shared storage so any game can send all four ---- */
  function summary(){
    const log=CL.get(PX+'-log',[]),lb=CL.get(PX+'-lbest',{}),now=Date.now(),wk=log.filter(e=>(e.d||0)>now-7*864e5);
    const dayset=new Set(wk.map(e=>new Date(e.d).toDateString()));
    const units=G.map(g=>{const e=log.filter(x=>x.th===g.id);return [g.id,CL.cut(g.tema||g.name,44),e.filter(x=>x.ok).length,e.length]});
    let weak=[];try{const S0=srsState();weak=LESSONS.filter(l=>S0[l.id]&&S0[l.id].weak).sort((a,b)=>S0[a.id].acc-S0[b.id].acc).slice(0,4).map(l=>CL.cut(`${l.no} ${l.t}`,64))}catch(e){}
    const mc={};log.filter(e=>!e.ok&&e.mis&&e.mis!=='other').forEach(e=>mc[e.mis]=(mc[e.mis]||0)+1);
    const mis=Object.entries(mc).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,c])=>{const m=M[k]||{};return [CL.cut(m.m||k,40),c,CL.cut(m.s||'',170)]});
    let streak=0;try{const d=dailyInfo();streak=d.alive?d.streak:0}catch(e){}
    const goal=CL.get(PX+'-goal',{target:500,reward:EN?'Family reward':'Aile ödülü',base:0}),got=Math.max(0,CL.get(PX+'-earned',0)-(goal.base||0));
    const sm={t:now,n:log.length,ok:log.filter(e=>e.ok).length,less:LESSONS.length,done:LESSONS.filter(l=>lb[l.id]>=7).length,
      last:log.length?log[log.length-1].d||0:0,streak,wk:{n:wk.length,ok:wk.filter(e=>e.ok).length,days:dayset.size},units,weak,mis,goal:{target:goal.target,reward:goal.reward,got}};
    /* writings: the ones set as homework first, then the newest (up to 6) */
    const W=CL.get(PX+'-writes',{}),asg=new Set(CL.get('g7-odev',[]).filter(a=>a.g===PX&&Array.isArray(a.it)).flatMap(a=>a.it.filter(x=>x[0]==='w').map(x=>x[1])));
    const wr=Object.entries(W).map(([id,w])=>[w.no||id,CL.cut(w.title||'',40),CL.cut(w.text||'',900),w.t||0,asg.has(id)?1:0]).sort((a,b)=>b[4]-a[4]||b[3]-a[3]).slice(0,6).map(x=>x.slice(0,4));if(wr.length)sm.writes=wr;
    CL.set('g7-sum-'+PX,sm);return sm}
  function allSums(){summary();const o={};for(const k in CL.GAMES){const s=CL.get('g7-sum-'+k,null);if(s&&s.n)o[k]=s}if(!Object.keys(o).length)o[PX]=CL.get('g7-sum-'+PX,null);return o}

  /* ---- parent contact to the teacher (opt-in, parent's permission, one send only) and the last prepared report ---- */
  const V=EN?{vc:"With my parent's permission, send their phone numbers to my teacher",why:'So the teacher can reach your parent directly. Only for the next report.',added:"📞 Parent contact added (with the parent's permission).",last:'Last prepared',other:'Other teacher'}
    :{vc:'Velimin izniyle veli telefonlarını öğretmenime gönder',why:'Öğretmen velinize doğrudan ulaşabilsin diye. Yalnızca bir sonraki raporda gider.',added:'📞 Veli iletişimi eklendi (velinin izniyle).',last:'Son hazırlanan',other:'Başka öğretmen'};
  function lastLine(){const st=CL.student();if(!st)return '';const E=Object.values((CL.get('g7-lastsent',{})[CL.key(st)])||{}).sort((a,b)=>b.t-a.t)[0];return E?`${V.last}: ${CL.date(E.t)} · ${E.n}`:''}

  /* ---- name, surname, class: asked once ---- */
  function askName(force,opt={}){const st=CL.student();if(st&&!force)return;if(document.querySelector('.cl-who'))return;
    const ov=document.createElement('div');ov.className='ov cl-ov cl-who';ov.innerHTML=`<div class="pnl cl-pnl" role="dialog" aria-modal="true" aria-label="${T.who}">
      <h2 style="margin-top:0">👋 ${T.who}</h2>${opt.intro?`<p class="cl-inv">${opt.intro}</p>`:''}<p class="hint">${T.whoHint}</p>
      <label class="field">${T.n}<input id="cl-n" autocomplete="given-name" value="${CL.h(st?st.n:'')}"></label>
      <label class="field">${T.s}<input id="cl-s" autocomplete="family-name" value="${CL.h(st?st.s:'')}"></label>
      <label class="field">${T.c}<input id="cl-c" placeholder="7-A" value="${CL.h(st?st.c:(opt.c||''))}" autocapitalize="characters"></label>
      <hr style="border:0;border-top:1px solid var(--line);margin:12px 0 4px"><p class="hint">${T.pHint}</p>
      <label class="field">${T.pf}<input id="cl-pf" type="tel" inputmode="tel" autocomplete="off" placeholder="05xx xxx xx xx" value="${CL.h(CL.parent().father)}"></label>
      <label class="field">${T.pm}<input id="cl-pm" type="tel" inputmode="tel" autocomplete="off" placeholder="05xx xxx xx xx" value="${CL.h(CL.parent().mother)}"></label>
      <label class="field">${T.pe}<input id="cl-pe" type="email" inputmode="email" autocomplete="off" value="${CL.h(CL.parent().email)}"></label>
      <label style="display:flex;gap:8px;align-items:flex-start;margin:8px 0"><input type="checkbox" id="cl-vc" style="margin-top:4px"><span>${V.vc}<br><small class="hint">${V.why}</small></span></label>
      <p class="hint cl-err" hidden>${T.bad}</p><p class="hint cl-perr" hidden>${T.pBad}</p><div class="row"><button class="btn gold" id="cl-ok" type="button">${T.save}</button>${st?`<button class="btn" id="cl-x" type="button">✕</button>`:''}</div></div>`;
    document.body.appendChild(ov);const $=id=>ov.querySelector('#'+id);setTimeout(()=>$('cl-n').focus(),50);
    const ok=()=>{const n=CL.cap($('cl-n').value),s=CL.cap($('cl-s').value),c=CL.normClass($('cl-c').value);
      if(n.length<2||s.length<2||!c){ov.querySelector('.cl-err').hidden=false;return}
      const pf=$('cl-pf').value.trim(),pm=$('cl-pm').value.trim(),pe=$('cl-pe').value.trim();if(!CL.okPhone(pf)||!CL.okPhone(pm)||!CL.okMail(pe)){ov.querySelector('.cl-perr').hidden=false;return}
      CL.set('g7-parent',{father:pf,mother:pm,email:pe});setStudent({n,s,c,t:Date.now()});if($('cl-vc').checked&&(pf||pm||pe))CL.set('g7-vcok',{key:CL.key({n,s,c}),t:Date.now()});else CL.set('g7-vcok',null);rebuildTeachers();ov.remove();if(!location.hash||location.hash==='#')hub();else decorateHome();if(opt.after)opt.after()};
    $('cl-ok').onclick=ok;ov.querySelectorAll('input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')ok()});if($('cl-x'))$('cl-x').onclick=()=>ov.remove()}

  /* ---- teacher notes (arrive as #not=… links) ---- */
  function notesCard(){const st=CL.student(),N=CL.get('g7-notes',[]).map((x,i)=>({x,i})).filter(o=>!o.x.read).slice(-3);if(!N.length)return '';
    return N.map(({x,i})=>{const mine=!st||!x.to||CL.key(x.to)===CL.key(st);return `<section class="pnl cl-note" data-i="${i}">
      <h2 style="margin:0 0 6px">💬 ${x.by?`${CL.h(x.by.n)} · ${I.msg}`:T.note}</h2>${byWarn(x.by)}${mine?'':`<p class="hint">${T.forOther} ${CL.h(CL.full(x.to))} (${CL.h(x.to.c)})</p>`}
      <p style="white-space:pre-wrap;margin:6px 0 10px">${CL.h(x.m)}</p><div class="row"><span class="hint">${CL.date(x.t)}${x.g&&CL.GAMES[x.g]?' · '+CL.GAMES[x.g].name:''}</span><button class="btn sm cl-read" type="button">✔ ${T.read}</button></div></section>`}).join('')}
  function takeHash(){const h=location.hash||'';let m;
    if((m=h.match(/^#not=([A-Za-z0-9_-]+)/))){const o=CL.unpack(m[1]);if(o&&o.m){const N=CL.get('g7-notes',[]);if(!N.some(x=>x.t===o.t&&x.m===o.m)){N.push({...o,read:false});CL.set('g7-notes',N.slice(-30))}}
      history.replaceState(null,'',location.pathname+location.search);hub();return true}
    if((m=h.match(/^#odev=([A-Za-z0-9_-]+)/))){const a=CL.unpack(m[1]);history.replaceState(null,'',location.pathname+location.search);
      if(CL.odevOk(a)){const A=CL.get('g7-odev',[]).filter(x=>x.id!==a.id);A.push(a);CL.set('g7-odev',A.slice(-40));hub();flash(O.got)}else{hub();flash(O.bad)}return true}
    if((m=h.match(/^#davet=([A-Za-z0-9_-]+)/))){const o=CL.unpack(m[1]);history.replaceState(null,'',location.pathname+location.search);
      if(!CL.invOk(o)){hub();flash(I.bad);return true}
      o.c=CL.normClass(o.c);const TT=CL.get('g7-teachers',{});TT[o.tid]={n:o.tn,sub:(o.sub||[]).filter(g=>CL.GAMES[g]),c:o.c,ph:o.ph||'',em:o.em||'',t:Date.now()};CL.set('g7-teachers',TT);
      hub();const st=CL.student();
      if(!st)askName(true,{c:o.c,intro:I.inv(o),after:()=>joinAsk(o)});else if(st.c!==o.c)classAsk(o,st);else joinAsk(o);return true}
    if((m=h.match(/^#sinif=([A-Za-z0-9_-]+)/))){const o=CL.unpack(m[1]);history.replaceState(null,'',location.pathname+location.search);
      if(o&&o.k==='bye'){if(!CL.byeOk(o)){hub();flash(Cx.bad);return true}takeBye(o);return true}
      if(!CL.clsOk(o)){hub();flash(Cx.bad);return true}HOLD=true;o._raw=o.seats;o.seats=o.seats.map(z=>z.length===1?[z[0],o.co.tid,o.co.n,o.co.pub,o.co.alias||[],o.co.ph||'',o.co.em||'']:z);takeClass(o);return true}
    if((m=h.match(/^#duyuru=([A-Za-z0-9_-]+)/))){const o=CL.unpack(m[1]);history.replaceState(null,'',location.pathname+location.search);
      if(!o||o.k!=='duyuru'||!o.cid||!o.by||!o.by.tid||!o.m||!o.sig||!o.t){hub();flash(Cx.annBad);return true}takeAnn(o);return true}
    return false}

  /* ---- the class is the pivot (#sinif=…, signed by the coordinator). Membership is kept per student (siblings on one
     device do not mix): g7-classes {studentKey:{cid:{c,v,t,co:{tid,n,pub,alias},seats:[[game,tid,name,pub,alias,ph,em]],former,joined}}}.
     Seated teachers are copied into g7-teachers with src:'seat'; teachers from older personal invitations stay (inv). ---- */
  const Cx=EN?{bad:'This class link could not be read or was changed.',nosig:'This browser cannot check signed class links. Open the game from its web address in Chrome, Edge or Safari.',
      inv:o=>`🎉 <b>${CL.h(o.co.n)}</b> invites you to class <b>${CL.h(o.c)}</b>.`,joined:o=>`You joined class ${CL.h(o.c)}.`,list:'Your teachers:',updated:'Your class teachers were updated.',
      wrongKey:'This update is not from your class coordinator, so it was refused.',old:'This class link is older than the one you have. Nothing changed.',
      nkT:'New coordinator key',nk:o=>`${CL.h(o.co.n)} says the class key has changed. Accept this only if your teacher showed you this QR code in class.`,nkYes:'Yes, I got it in class',nkNo:'No, refuse',
      chT:c=>`Teacher change in ${CL.h(c)}`,coord:'Class teacher',chHint:'Accept only if your teacher told you about this change.',chYes:'Accept',chNo:'Refuse',
      former:'This message is from a former teacher of your class.',notYou:'This link is for another student.',removed:c=>`You were removed from class ${CL.h(c)}. To join again, ask your teacher.`,byeNone:'You are not in this class.',byeOther:'This notice is for another student.',byeBad:'This notice could not be checked, so it was refused.',byeT:c=>`You left class ${CL.h(c)}`,byeMsg:'Your coordinator removed you from this class. Your progress in the games is kept.',byeFor:n=>`This notice is for ${CL.h(n)}: removed from the class on this device.`,moving:'moving',myClasses:'My classes',ann:'Announcement',annGot:'📣 New class announcement',annBad:'This announcement could not be checked, so it was refused.',annNo:'This announcement is for a class you have not joined.'}
    :{bad:'Bu sınıf bağlantısı okunamadı ya da değiştirilmiş.',nosig:'Bu tarayıcı imzalı sınıf bağlantılarını denetleyemiyor. Oyunu internet adresinden Chrome, Edge ya da Safari ile açın.',
      inv:o=>`🎉 <b>${CL.h(o.co.n)}</b> seni <b>${CL.h(o.c)}</b> sınıfına davet ediyor.`,joined:o=>`${CL.h(o.c)} sınıfına katıldın.`,list:'Öğretmenlerin:',updated:'Sınıf öğretmenlerin güncellendi.',
      wrongKey:'Bu güncelleme sınıfının koordinatöründen gelmiyor; kabul edilmedi.',old:'Bu sınıf bağlantısı elindekinden eski. Bir şey değişmedi.',
      nkT:'Yeni koordinatör anahtarı',nk:o=>`${CL.h(o.co.n)} sınıf anahtarının değiştiğini söylüyor. Bunu yalnızca öğretmenin bu QR kodunu sınıfta gösterdiyse kabul et.`,nkYes:'Evet, sınıfta aldım',nkNo:'Hayır, reddet',
      chT:c=>`${CL.h(c)} sınıfında öğretmen değişikliği`,coord:'Sınıf öğretmeni',chHint:'Yalnızca öğretmenin bu değişikliği sana söylediyse kabul et.',chYes:'Kabul et',chNo:'Reddet',
      former:'Bu mesaj sınıfının eski bir öğretmeninden.',notYou:'Bu bağlantı başka bir öğrenci için.',removed:c=>`${CL.h(c)} sınıfından çıkarıldın. Tekrar katılmak için öğretmenine sor.`,byeNone:'Bu sınıfta değilsin.',byeOther:'Bu bildirim başka bir öğrenci için.',byeBad:'Bu bildirim denetlenemedi; kabul edilmedi.',byeT:c=>`${CL.h(c)} sınıfından ayrıldın`,byeMsg:'Koordinatörün seni bu sınıftan çıkardı. Oyunlardaki ilerlemen korunur.',byeFor:n=>`Bu bildirim ${CL.h(n)} için: bu cihazda sınıftan çıkarıldı.`,moving:'taşınıyor',myClasses:'Sınıfların',ann:'Duyuru',annGot:'📣 Yeni sınıf duyurusu',annBad:'Bu duyuru denetlenemedi; kabul edilmedi.',annNo:'Bu duyuru katılmadığın bir sınıf için.'};
  function setStudent(nst){const old=CL.student(),ok=old?CL.key(old):null,nk=CL.key(nst),same=old&&nst.n===old.n&&nst.s===old.s;
    nst={...nst,sid:same&&old.sid?old.sid:(Date.now().toString(36)+Math.random().toString(36).slice(2,8))};CL.set('g7-student',nst);
    if(ok&&ok!==nk&&nst.n===old.n&&nst.s===old.s)['g7-classes','g7-classes-bye','g7-lastsent'].forEach(K=>{const A=CL.get(K,{});if(A[ok]){A[nk]={...A[ok],...(A[nk]||{})};delete A[ok];CL.set(K,A)}});
    const v=CL.get('g7-vcok',null);if(v&&v.key===ok&&ok!==nk&&nst.n===old.n&&nst.s===old.s)CL.set('g7-vcok',{...v,key:nk})}
  function CLS(){const st=CL.student();return st?(CL.get('g7-classes',{})[CL.key(st)]||{}):{}}
  function saveCls(m){const st=CL.student();if(!st)return;const A=CL.get('g7-classes',{});A[CL.key(st)]=m;CL.set('g7-classes',A)}
  function rebuildTeachers(){const TT=CL.get('g7-teachers',{});
    for(const k in TT)if(TT[k].src==='seat'){if(TT[k].inv){TT[k]={...TT[k],src:'invite',sub:TT[k].isub||TT[k].sub,cid:undefined}}else delete TT[k]}
    const m=CLS();for(const cid in m){const x=m[cid];
      const add=(tid,n,sub,ph,em,alias,role)=>{const e=TT[tid]||{},inv=!!(e.src&&e.src!=='seat')||!!e.inv;
        TT[tid]={...e,n,sub:[...new Set([...(e.src==='seat'?e.sub||[]:[]),...sub])],isub:inv?(e.isub||e.sub||[]):undefined,c:x.c,ph:ph||e.ph||'',em:em||e.em||'',t:e.t||Date.now(),src:'seat',inv,cid,alias:alias||[],...(role?{role}:{})}};
      add(x.co.tid,x.co.n,[],x.co.ph||'',x.co.em||'',x.co.alias,'coord');x.seats.forEach(([g,tid,n,pub,al,ph,em])=>add(tid,n,[g],ph,em,al))}
    CL.set('g7-teachers',TT)}
  function knownTid(tid){const TT=CL.get('g7-teachers',{});return !!TT[tid]||Object.values(TT).some(t=>(t.alias||[]).includes(tid))}
  function byes(sk){return (CL.get('g7-classes-bye',{})[sk])||{}}
  function formerTid(tid){const st=CL.student(),hit=f=>f[0]===tid||(f[2]||[]).includes(tid);return Object.values(CLS()).some(x=>(x.former||[]).some(hit))||(st?Object.values(byes(CL.key(st))).some(b=>(b.former||[]).some(hit)):false)}
  let HOLD=false;
  async function takeClass(o){
    if(!CL.canSign()){HOLD=false;hub();flash(Cx.nosig);if(!CL.student())askName(false);return}
    const raw={...o,seats:o._raw||o.seats};delete raw._raw;if(!await CL.verifyObj(o.co.pub,CL.unsigned(raw),o.sig)){HOLD=false;hub();flash(Cx.bad);if(!CL.student())askName(false);return}HOLD=false;
    o.c=CL.normClass(o.c);const st=CL.student();
    if(!st){askName(true,{c:o.c,intro:Cx.inv(o),after:()=>takeClass(o)});return}
    const sk=CL.key(st);
    if(o.to&&o.to.key!==sk&&!Object.values(CLS()).some(x=>x.enrolKey===o.to.key)){hub();flash(Cx.notYou);return}
    const tomb=byes(sk)[o.cid];
    if(tomb){if(!o.to){hub();flash(Cx.removed(o.c));return}if(!(o.to.pt>tomb.pt)){hub();flash(Cx.old);return}}
    if(st.c!==o.c){dlg(`<p class="cl-inv">${Cx.inv(o)}</p><p>${I.diff(o.c,st.c)}</p>`,[[I.mk(o.c),()=>{setStudent({...st,c:o.c,t:Date.now()});takeClass(o)}],[I.keep(st.c),()=>hub()]]);return}
    const ex=CLS()[o.cid],newer=!ex||o.v>ex.v||(o.v===ex.v&&o.t>ex.t);
    const apply=()=>{const m2=CLS(),e0=m2[o.cid],former=[...(e0&&e0.former||[])];
      if(e0&&newer){const now=new Set(o.seats.map(z=>z[1]));e0.seats.filter(z=>!now.has(z[1])&&z[1]!==o.co.tid).forEach(z=>former.push([z[1],z[2],z[4]||[]]));if(e0.co.tid!==o.co.tid)former.push([e0.co.tid,e0.co.n,e0.co.alias||[]])}
      const base=newer?{c:o.c,v:o.v,t:o.t,co:o.co,seats:o.seats,ds:String(o.ds||'').slice(0,60)}:{c:e0.c,v:e0.v,t:e0.t,co:e0.co,seats:e0.seats,ds:e0.ds||''};
      /* only a join sets the membership time: a class-wide join uses the link time, a personal enrol its own pt; seat updates keep it */
      const pt=o.to?Math.max(o.to.pt,(e0&&e0.pt)||0):(e0?(e0.pt||0):o.t);
      m2[o.cid]={...base,former:former.filter(f=>!base.seats.some(z=>z[1]===f[0])).slice(-20),joined:e0?e0.joined:Date.now(),pt,enrolKey:o.to?sk:((e0&&e0.enrolKey)||sk),moving:false};
      if(o.to&&o.from&&o.from.cid!==o.cid&&m2[o.from.cid]&&m2[o.from.cid].co.pub===o.co.pub)m2[o.from.cid].moving=true;
      saveCls(m2);if(tomb&&o.to){const B=CL.get('g7-classes-bye',{});if(B[sk]){delete B[sk][o.cid];CL.set('g7-classes-bye',B)}}
      rebuildTeachers();hub();if(!e0)joinClass(o);else flash(Cx.updated)};
    if(!ex){apply();return}
    if(ex.co.pub!==o.co.pub){if(!o.nk){hub();flash(Cx.wrongKey);return}
      hub();dlg(`<h2 style="margin-top:0">🔑 ${Cx.nkT}</h2><p>${Cx.nk(o)}</p>`,[[Cx.nkYes,()=>seatAsk(ex,o,apply)],[Cx.nkNo,null]]);return}
    if(!newer){if(o.to&&o.to.pt>(ex.pt||0)){apply();return}hub();flash(Cx.old);return}
    hub();seatAsk(ex,o,apply)}
  /* removal notice (k:'bye', sent as #sinif=): verified with the class key this device pinned; applies only if newer than the join */
  async function takeBye(o){if(!CL.canSign()){hub();flash(Cx.nosig);return}
    const A=CL.get('g7-classes',{}),st=CL.student(),cur=st?CL.key(st):'';
    const sk=Object.keys(A).find(k=>A[k][o.cid]&&(A[k][o.cid].enrolKey===o.bye.key||k===o.bye.key));
    if(!sk){hub();flash(o.bye.key===cur?Cx.byeNone:Cx.byeOther);return}
    const x=A[sk][o.cid];if(!await CL.verifyObj(x.co.pub,CL.unsigned(o),o.sig)){hub();flash(Cx.byeBad);return}
    if(!(o.bye.pt>(x.pt||0))){hub();flash(Cx.old);return}
    const go=()=>{const A2=CL.get('g7-classes',{}),x2=A2[sk]&&A2[sk][o.cid];if(!x2)return;delete A2[sk][o.cid];CL.set('g7-classes',A2);
      const B=CL.get('g7-classes-bye',{});B[sk]=B[sk]||{};B[sk][o.cid]={pt:o.bye.pt,c:x2.c,former:[[x2.co.tid,x2.co.n,x2.co.alias||[]],...x2.seats.map(z=>[z[1],z[2],z[4]||[]])]};
      const ks=Object.keys(B[sk]);if(ks.length>50)ks.sort((p,q)=>B[sk][p].pt-B[sk][q].pt).slice(0,ks.length-50).forEach(k=>delete B[sk][k]);
      CL.set('g7-classes-bye',B);rebuildTeachers();hub()};
    hub();if(sk===cur)dlg(`<h2 style="margin-top:0">${Cx.byeT(x.c)}</h2><p>${Cx.byeMsg}</p>`,[[T.read,go]]);
    else dlg(`<p>${Cx.byeFor(CL.cap(sk.split('|')[1]||sk))}</p>`,[[T.read,go]])}
  function classesLine(){const L=Object.values(CLS()).map(x=>CL.h(x.c)+(x.ds?' – '+CL.h(x.ds):'')+(x.moving?` (${Cx.moving})`:''));return L.length?`🏫 ${Cx.myClasses}: ${L.join(' · ')}`:''}
  function seatAsk(ex,o,apply){const M=s=>{const r={};s.forEach(x=>r[x[0]]=x[2]);return r},A=M(ex.seats),B=M(o.seats),ch=[...new Set([...Object.keys(A),...Object.keys(B)])].filter(g=>A[g]!==B[g]);
    if(!ch.length&&ex.co.n===o.co.n){apply();return}
    dlg(`<h2 style="margin-top:0">${Cx.chT(o.c)}</h2><ul>${ch.map(g=>`<li>${CL.h(CL.GAMES[g]?CL.GAMES[g].tr:g)}: ${CL.h(A[g]||'—')} → <b>${CL.h(B[g]||'—')}</b></li>`).join('')}${ex.co.n!==o.co.n?`<li>${Cx.coord}: ${CL.h(ex.co.n)} → <b>${CL.h(o.co.n)}</b></li>`:''}</ul><p class="hint">${Cx.chHint}</p>`,[[Cx.chYes,apply],[Cx.chNo,null]])}
  function joinClass(o){dlg(`<h2 style="margin-top:0">🎉 ${Cx.joined(o)}</h2><p style="margin:.3em 0">${Cx.list}</p>${teachersHtml(false)}<p class="hint">${I.joinHint}</p>`,[[I.join,()=>sendTeacher(o.co.tid,true)],[I.later,null]])}
  /* announcements: signed by the class coordinator or a seated teacher (a former teacher's key no longer counts) */
  async function takeAnn(o){if(!CL.canSign()){hub();flash(Cx.nosig);return}const st=CL.student(),x=CLS()[o.cid];if(!st||!x){hub();flash(Cx.annNo);return}
    let pub=null;if(o.by.tid===x.co.tid)pub=x.co.pub;else{const s=x.seats.find(s=>s[1]===o.by.tid);if(s)pub=s[3]}
    if(!pub||!await CL.verifyObj(pub,CL.unsigned(o),o.sig)){hub();flash(Cx.annBad);return}
    const sk=CL.key(st),A=CL.get('g7-ann',[]).filter(a=>(a.exp||0)>Date.now());if(!A.some(a=>a.sk===sk&&a.by.tid===o.by.tid&&a.t===o.t))A.push({sk,cid:o.cid,c:x.c,by:o.by,m:String(o.m).slice(0,400),t:o.t,exp:Math.min(o.exp||0,o.t+30*864e5),read:false});
    CL.set('g7-ann',A.sort((a,b)=>a.t-b.t).slice(-10));hub();flash(Cx.annGot)}
  function annCard(){const st=CL.student();if(!st)return '';const sk=CL.key(st),A=CL.get('g7-ann',[]).map((a,i)=>({a,i})).filter(o=>o.a.sk===sk&&!o.a.read&&(o.a.exp||0)>Date.now());
    return A.slice(-3).map(({a,i})=>`<section class="pnl cl-note cl-ann" data-i="${i}"><h2 style="margin:0 0 6px">📣 ${Cx.ann} · ${CL.h(a.c)} · ${CL.h(a.by.n)}</h2><p style="white-space:pre-wrap;margin:6px 0 10px">${CL.h(a.m)}</p><div class="row"><span class="hint">${CL.date(a.t)}</span><button class="btn sm cl-aread" type="button">✔ ${T.read}</button></div></section>`).join('')}

  /* ---- my teachers: class invitations (#davet=…), who sent a message, which teacher a report goes to ---- */
  const I=EN?{msg:'message',bad:'This invitation link could not be read.',inv:o=>`🎉 <b>${CL.h(o.tn)}</b>${o.sub&&o.sub.length?' ('+CL.h(CL.subs(o.sub))+')':''} invites you to class <b>${CL.h(o.c)}</b>.`,
      diff:(c,my)=>`This invitation is for class <b>${CL.h(c)}</b>, but your class is <b>${CL.h(my)}</b>.`,mk:c=>`Yes, my class is ${c}`,keep:c=>`No, keep ${c}`,
      joined:o=>`${CL.h(o.tn)} is now in your teacher list.`,joinHint:'Tell your teacher you joined: your report goes to them and you appear in the class list.',join:'📤 Tell my teacher I joined',later:'Later',
      mine:'👩‍🏫 My teachers',none:'No teacher yet. Your teacher sends you an invitation link.',pick:'Which teacher?',other:'Another teacher',rm:'Remove',joinMsg:'👋 I joined the class',
      unknown:'⚠️ This sender is not in your teacher list. If you are not sure, ask your teacher.',from:'From'}
    :{msg:'mesajı',bad:'Bu davet bağlantısı okunamadı.',inv:o=>`🎉 <b>${CL.h(o.tn)}</b>${o.sub&&o.sub.length?' ('+CL.h(CL.subs(o.sub))+')':''} seni <b>${CL.h(o.c)}</b> sınıfına davet ediyor.`,
      diff:(c,my)=>`Bu davet <b>${CL.h(c)}</b> sınıfı için, senin kayıtlı sınıfın <b>${CL.h(my)}</b>.`,mk:c=>`Evet, sınıfım ${c}`,keep:c=>`Hayır, ${c} kalsın`,
      joined:o=>`${CL.h(o.tn)} öğretmenler listene eklendi.`,joinHint:'Öğretmenine katıldığını bildir: raporun ona gider ve sınıf listesinde görünürsün.',join:'📤 Katıldığımı bildir',later:'Sonra',
      mine:'👩‍🏫 Öğretmenlerim',none:'Henüz öğretmen yok. Öğretmenin sana bir davet bağlantısı gönderir.',pick:'Hangi öğretmenine?',other:'Başka bir öğretmen',rm:'Çıkar',joinMsg:'👋 Sınıfa katıldım',
      unknown:'⚠️ Bu gönderen öğretmenler listende yok. Emin değilsen öğretmenine sor.',from:'Gönderen'};
  function dlg(html,btns){const ov=document.createElement('div');ov.className='ov cl-ov';ov.innerHTML=`<div class="pnl cl-pnl" role="dialog" aria-modal="true">${html}<div class="row cl-btns" style="margin-top:12px">${btns.map((b,i)=>`<button class="btn${i?'':' gold'}" data-i="${i}" type="button">${CL.h(b[0])}</button>`).join('')}</div></div>`;
    document.body.appendChild(ov);ov.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{ov.remove();const f=btns[+x.dataset.i][1];if(f)f()});return ov}
  function classAsk(o,st){dlg(`<p class="cl-inv">${I.inv(o)}</p><p>${I.diff(o.c,st.c)}</p>`,[[I.mk(o.c),()=>{setStudent({...st,c:o.c,t:Date.now()});hub();joinAsk(o)}],[I.keep(st.c),()=>joinAsk(o)]])}
  function joinAsk(o){dlg(`<h2 style="margin-top:0">🎉 ${I.joined(o)}</h2><p class="hint">${I.joinHint}</p>`,[[I.join,()=>sendTeacher(o.tid,true)],[I.later,null]])}
  function byWarn(by){if(!by||!by.tid)return '';if(knownTid(by.tid))return '';if(formerTid(by.tid))return `<p class="hint">${Cx.former}</p>`;return `<p class="hint cl-warn">${I.unknown}</p>`}
  function pickTeacher(TT,go){dlg(`<h2 style="margin-top:0">${I.pick}</h2>`,[...Object.entries(TT).sort((a,b)=>b[1].t-a[1].t).map(([k,t])=>[CL.tlabel(t,EN)+' · '+t.c,()=>go(k)]),[I.other,()=>go(null)]])}
  function teachersHtml(edit){const TT=CL.get('g7-teachers',{}),E=Object.entries(TT);if(!E.length)return edit?`<p class="hint">${I.none}</p>`:'';
    return `<div class="cl-tch">${edit?`<b>${I.mine}</b><br>`:'👩‍🏫 '}${E.map(([k,t])=>`<span class="cl-tc">${CL.h(CL.tlabel(t,EN))}${edit?` · ${CL.h(t.c)}${t.src==='seat'?'':` <button class="cl-edit cl-trm" data-k="${CL.h(k)}" type="button" title="${I.rm}" aria-label="${I.rm}">✕</button>`}`:''}</span>`).join(edit?'<br>':' · ')}</div>`}
  function flash(t){const d=document.createElement('div');d.className='cl-flash';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),3500)}

  /* ---- homework (Ödev) ---- */
  const O=EN?{title:'My homework',from:'From your teacher',due:'Due',play:'Play: at least 7/10',best:'best',write:'Writing Corner',go:'Start',goW:'Write',other:'open in',send:'📤 Done! Send to my teacher',got:'📋 New homework added!',bad:'This homework link could not be read.',forOther:'This homework is for',after:'Counts only after the homework was given.'}:
    {title:'Ödevlerim',from:'Öğretmeninden',due:'Son gün',play:'Oyna: en az 7/10',best:'en iyi',write:'Yazma Köşesi',go:'Başla',goW:'Yaz',other:'aç:',send:'📤 Bitti! Öğretmenime gönder',got:'📋 Yeni ödev eklendi!',bad:'Bu ödev bağlantısı okunamadı.',forOther:'Bu ödev şu sınıf/öğrenciler için:',after:'Ödev verildikten sonra yapılanlar sayılır.'};
  function odevCard(){const st=CL.student(),now=Date.now(),OS=EN?CL.ODS_EN:CL.ODS;
    const rows=CL.get('g7-odev',[]).filter(CL.odevOk).map(a=>{const it=CL.odevCheck(a),s=CL.odevState(a.due,it,now),fin=it.every(x=>x[2])?Math.max(...it.map(x=>x[2])):0;return {a,it,s,fin,mine:CL.odevMine(a,st)}})
      .filter(o=>!((o.s==='ok'||o.s==='late')&&now-o.fin>3*864e5)&&!(o.s==='miss'&&now-o.a.due>14*864e5))
      .sort((x,y)=>(y.mine-x.mine)||((x.a.g===PX?0:1)-(y.a.g===PX?0:1))||x.a.due-y.a.due).slice(0,4);
    if(!rows.length)return '';
    return `<section class="pnl cl-odev"><h2 style="margin:0 0 4px">📋 ${O.title}</h2><p class="hint" style="margin:0 0 6px">${O.after}</p>${rows.map(({a,it,s,mine})=>{const g=CL.GAMES[a.g],here=a.g===PX,base=here?'':g.url;
      return `<div class="cl-oa cl-s-${CL.h(s)}"><div class="row" style="justify-content:space-between"><b>${here?'':CL.h(g.name)+' · '}${CL.h(a.ti)}</b>
        <span class="cl-pill ${OS[s][2]}">${OS[s][0]} ${OS[s][1]}</span></div>
        <p class="hint" style="margin:2px 0">${O.due}: ${CL.date(a.due)} · ${CL.dueText(a.due,EN)}${mine?'':` · ${O.forOther} ${CL.h(a.to&&a.to.length?a.to.map(k=>k.split('|')[1]).join(', '):a.c)}`}</p>
        ${a.by?`<p class="hint" style="margin:2px 0">👩‍🏫 ${I.from}: ${CL.h(a.by.n)}</p>${byWarn(a.by)}`:''}
        ${a.m?`<p style="margin:4px 0;white-space:pre-wrap">💬 ${CL.h(a.m)}</p>`:''}
        <ul class="cl-items">${it.map(([ty,lid,t,sc],i)=>{const lab=a.it[i][2]||lid,href=base+(ty==='p'?'#ders-':'#yaz-')+lid;
          return `<li class="${t?'cl-done':''}"><span class="cl-box">${t?'☑':'☐'}</span><span class="cl-it">${ty==='w'?'📝 ':''}${CL.h(lab)}<br><small class="hint">${ty==='p'?O.play+(sc!=null?` · ${O.best} ${sc}/10`:''):O.write}${t?' · '+CL.date(t):''}</small></span>
            ${t?'':`<a class="btn sm" href="${CL.h(href)}">${ty==='p'?O.go:O.goW} ▶</a>`}</li>`}).join('')}</ul>
        ${mine&&(s==='ok'||s==='late')?`<button class="btn gold sm cl-osend" data-t="${CL.h(a.by&&CL.get('g7-teachers',{})[a.by.tid]?a.by.tid:'')}" type="button">${O.send}</button>`:''}</div>`}).join('')}</section>`}
  /* every finished lesson play is kept with its time and score (the engine keeps only the best score) */
  function notePlay(){try{if(S&&S.lesson&&!S.daily&&!S.test&&typeof S.score==='number'){const P=CL.get(PX+'-plays',[]);P.push({l:S.lesson.id,s:S.score,t:Date.now()});CL.set(PX+'-plays',P.slice(-400))}}catch(e){}}

  /* ---- send buttons ---- */
  /* tid: undefined = ask which teacher (if more than one), null = another teacher, an id = that teacher */
  function sendTeacher(tid,join){const st=CL.student();if(!st){askName(true);return}
    const TT=CL.get('g7-teachers',{}),ids=Object.keys(TT);
    if(tid===undefined){if(ids.length>1)return pickTeacher(TT,k=>sendTeacher(k));tid=ids[0]||null}
    const tc=tid&&TT[tid]?TT[tid]:null,okv=CL.get('g7-vcok',null),pcx=CL.parent(),vc={};
    if(okv&&okv.key===CL.key(st))['father','mother','email'].forEach(f=>{if(String(pcx[f]||'').trim())vc[f]=String(pcx[f]).trim()});const hasVc=Object.keys(vc).length>0;
    const games=allSums(),od=CL.odevReport(st),code=CL.pack({v:1,st,t:Date.now(),g:games,...(hasVc?{vc}:{}),...(od.length?{od}:{}),...(tc?{to:tid}:{}),...(ids.length?{tch:ids.map(k=>[k,TT[k].n])}:{}),...(Object.keys(CLS()).length?{cl:Object.entries(CLS()).map(([cid,x])=>[cid,x.c,x.v])}:{})});
    const lines=[`${join?I.joinMsg+' · ':''}📊 ${EN?'Student report':'Öğrenci raporu'}: ${CL.full(st)} (${st.c}) · ${CL.date(Date.now())}`];
    if(tc)lines.splice(0,0,`${EN?'To':'Sayın'} ${tc.n},`);
    for(const k in games){const g=games[k];lines.push(`• ${CL.GAMES[k].name}: ${g.done}/${g.less} ${EN?'lessons':'ders'} · %${CL.pct(g.ok,g.n)} ${EN?'correct':'doğru'} · ${EN?'last 7 days':'son 7 gün'}: ${g.wk.n} ${EN?'answers':'cevap'}`)}
    const OS=EN?CL.ODS_EN:CL.ODS;od.forEach(a=>{const s=CL.odevState(a.due,a.it);lines.push(`📋 ${EN?'Homework':'Ödev'}: ${a.ti} · ${OS[s][0]} ${OS[s][1]} (${a.it.filter(x=>x[2]).length}/${a.it.length})`)});
    if(hasVc)lines.push(V.added);
    lines.push('',EN?'Teacher panel link:':'Öğretmen paneli bağlantısı:',CL.PANEL+'#r='+code);
    const onSend=()=>{if(hasVc)CL.set('g7-vcok',null);const L=CL.get('g7-lastsent',{}),k=CL.key(st);L[k]=L[k]||{};L[k][tid||'other']={t:Date.now(),n:tc?tc.n:V.other};CL.set('g7-lastsent',L);
      document.querySelectorAll('.cl-last').forEach(e=>e.textContent=lastLine())};
    CL.share({en:EN,title:tc?`${T.sendT} · ${tc.n}`:T.sendT,intro:T.sendIntro,text:lines.join('\n'),subject:`${EN?'Report':'Rapor'} – ${CL.full(st)} (${st.c})`,rows:9,
      phones:tc&&tc.ph?[[tc.n,tc.ph]]:[],email:tc?tc.em:'',onSend})}
  function sendParent(){const st=CL.student();if(!st){askName(true);return}const pc=CL.parent(),ph=CL.phones(pc,EN),to=[...ph.map(p=>p[0]+' '+p[1]),pc.email].filter(Boolean).join(' · ');
    CL.share({en:EN,title:T.parentT,intro:T.parentIntro+'<br>'+(to?`<b>${T.pTo}</b> ${CL.h(to)}`:T.pNone),phones:ph,email:pc.email,edit:true,rows:14,text:CL.parentMessage(st,allSums(),{date:CL.date(Date.now()),od:CL.odevReport(st),teachers:Object.values(CL.get('g7-teachers',{})).map(t=>CL.tlabel(t)),sign:'— Oyunlardan otomatik hazırlanan özet'}),subject:`${CL.full(st)} – haftalık özet`})}

  /* ---- home screen: the student's name, the send button, teacher notes ---- */
  function decorateHome(){const st=CL.student(),nm=document.querySelector('#app .profile .nm');if(!nm)return;
    if(st){nm.innerHTML=`${CL.h(CL.full(st))} <small class="cl-cls">${CL.h(st.c)}</small> <button class="cl-edit" type="button" title="${T.edit}" aria-label="${T.edit}">✎</button>`;nm.querySelector('.cl-edit').onclick=()=>askName(true)}
    document.querySelectorAll('#app .profile .cl-tch').forEach(x=>x.remove());const th=teachersHtml(false);if(th)nm.insertAdjacentHTML('afterend',th);
    const pb=document.querySelector('#app .profile .pbtns');if(pb&&!pb.querySelector('.cl-send')){const b=document.createElement('button');b.className='btn cl-send';b.type='button';b.textContent=T.send;b.onclick=()=>sendTeacher();pb.insertBefore(b,pb.children[2]||null)}
    const prof=document.querySelector('#app .profile');document.querySelectorAll('#app .cl-note,#app .cl-odev').forEach(x=>x.remove());
    const oc=odevCard();if(prof&&oc){prof.insertAdjacentHTML('afterend',oc);document.querySelectorAll('#app .cl-odev .cl-osend').forEach(b=>b.onclick=()=>sendTeacher(b.dataset.t||undefined))}
    document.querySelectorAll('#app .cl-ann').forEach(x=>x.remove());const ac=annCard();if(prof&&ac){prof.insertAdjacentHTML('afterend',ac);document.querySelectorAll('#app .cl-ann .cl-aread').forEach(b=>b.onclick=()=>{const i=+b.closest('.cl-ann').dataset.i,A=CL.get('g7-ann',[]);if(A[i])A[i].read=true;CL.set('g7-ann',A);b.closest('.cl-ann').remove()})}
    const nc=notesCard();if(prof&&nc){prof.insertAdjacentHTML('afterend',nc);document.querySelectorAll('#app .cl-note .cl-read').forEach(b=>b.onclick=()=>{const i=+b.closest('.cl-note').dataset.i,N=CL.get('g7-notes',[]);if(N[i])N[i].read=true;CL.set('g7-notes',N);b.closest('.cl-note').remove()})}}
  function decorateReport(){const pg=document.querySelector('#app .page');if(!pg||pg.querySelector('.cl-rep'))return;const h1=pg.querySelector('h1');if(!h1)return;
    const st=CL.student();h1.insertAdjacentHTML('afterend',`<section class="pnl cl-rep"><h2>${T.classPanel}${st?` · ${CL.h(CL.full(st))} (${CL.h(st.c)})`:''}</h2><p class="hint">${T.classHint}</p>
      <p class="hint cl-cls2">${classesLine()}</p><div class="cl-tlist">${teachersHtml(true)}</div><p class="hint cl-last">${CL.h(lastLine())}</p>
      <div class="row"><button class="btn gold cl-rs" type="button">${T.send}</button><button class="btn cl-rp" type="button">${T.parent}</button><button class="btn cl-re" type="button">✎ ${T.edit} · ${T.pEdit}</button></div></section>`);
    const wireRm=()=>pg.querySelectorAll('.cl-trm').forEach(b=>b.onclick=()=>{const TT=CL.get('g7-teachers',{});delete TT[b.dataset.k];CL.set('g7-teachers',TT);pg.querySelector('.cl-tlist').innerHTML=teachersHtml(true);wireRm()});wireRm();
    pg.querySelector('.cl-rs').onclick=()=>sendTeacher();pg.querySelector('.cl-rp').onclick=sendParent;pg.querySelector('.cl-re').onclick=()=>askName(true)}

  /* small styles for the windows and the name line */
  const css=document.createElement('style');css.textContent=`.cl-ov{cursor:auto}.cl-pnl{max-width:640px;width:100%;max-height:88vh;overflow:auto;text-align:left;cursor:auto}
    .cl-pnl .field{margin:8px 0}.cl-pnl .field input{width:100%}.cl-ta{width:100%;box-sizing:border-box;background:var(--paper);border:2px solid var(--line);border-radius:10px;padding:10px;color:var(--ink);font:500 .95rem/1.45 var(--f-body,system-ui);resize:vertical;margin:8px 0}
    .cl-btns{flex-wrap:wrap;gap:8px}.cl-cls{font-size:.7em;opacity:.8;margin-left:4px}.cl-edit{background:none;border:0;color:var(--ink-soft);cursor:pointer;font-size:.8em;padding:2px 6px}
    .cl-note{border-color:var(--gold)!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--gold) 40%,transparent)}
    .cl-odev{border-color:var(--cyan,#22e4ff)!important}.cl-oa{border-top:1px solid var(--line);padding:8px 0 4px}.cl-oa:first-of-type{border-top:0}
    .cl-items{list-style:none;margin:6px 0;padding:0}.cl-items li{display:flex;gap:8px;align-items:center;padding:5px 0}.cl-items li.cl-done .cl-it{opacity:.75}
    .cl-box{font-size:1.25em;line-height:1}.cl-items li.cl-done .cl-box{color:var(--green,#3ddc97)}.cl-it{flex:1;min-width:0}
    .cl-pill{display:inline-block;border-radius:999px;padding:1px 9px;font-weight:700;font-size:.85rem;border:1.5px solid var(--line)}
    .cl-pill.g{color:var(--green,#3ddc97);border-color:currentColor}.cl-pill.y{color:var(--gold);border-color:currentColor}.cl-pill.r{color:var(--red,#ff5a6e);border-color:currentColor}
    .cl-tch{font-size:.85rem;color:var(--ink-soft);margin:2px 0 4px}.cl-rep .cl-tch{margin:6px 0 10px;line-height:1.8}.cl-warn{color:var(--gold)!important}
    .cl-inv{background:color-mix(in srgb,var(--gold) 16%,transparent);border:1.5px solid var(--gold);border-radius:10px;padding:8px 10px;margin:6px 0}
    .cl-flash{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:var(--gold);color:#1d1400;padding:10px 18px;border-radius:12px;font-weight:700;z-index:999;box-shadow:0 6px 20px rgba(0,0,0,.35)}`;document.head.appendChild(css);

  /* wrap the game's own home and report pages (they are global functions) */
  const _hub=hub;hub=function(){const r=_hub.apply(this,arguments);try{summary();decorateHome()}catch(e){}return r};
  const _rep=reportPage;reportPage=function(){const r=_rep.apply(this,arguments);try{summary();decorateReport()}catch(e){}return r};
  const _res=result;result=function(){notePlay();return _res.apply(this,arguments)};
  window.addEventListener('hashchange',()=>{takeHash()});
  const FASTMODE=/[?&]fast=1/.test(location.search);
  if(FASTMODE&&!/[?&]nost=1/.test(location.search)&&!CL.student())CL.set('g7-student',{n:'Test',s:'Öğrenci',c:'7-A',t:Date.now()});
  if(!takeHash()){if(!location.hash||location.hash==='#')hub();else if(location.hash==='#rapor')reportPage()}
  if(!CL.student()&&!HOLD)askName(false);
  window.CL_GAME={summary,allSums,sendTeacher,sendParent,askName};
})()}
