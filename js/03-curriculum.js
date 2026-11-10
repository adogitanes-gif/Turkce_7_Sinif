"use strict";
/* Türkçe 7 Oyunları · The curriculum: 6 temas of MEB 7. sınıf Türkçe (2 kitap), built from js/units/u*.js */
const G=Object.keys(FEN.units).map(Number).sort((a,b)=>a-b).map(n=>{const u=FEN.units[n];
  return {id:n,book:u.book,hue:u.hue,icon:u.icon,name:u.game,tema:u.name,pages:u.pages,topics:u.topics,gen:()=>unitQ(n)}});
const LESSONS=[];
for(const l of FEN.lessons.slice().sort((a,b)=>{const [x1,y1]=a.id.split('-').map(Number),[x2,y2]=b.id.split('-').map(Number);return x1-x2||y1-y2})){
  const th=+l.id.split('-')[0],u=FEN.units[th];
  const L={th,id:l.id,no:l.id.replace('-','.'),t:l.t,p:l.p,kw:l.kw||'',book:u.book,learn:null,script:l.script||null,q:l.q||[],write:l.write||null};
  L.gen=L.q.length?()=>lessonQ(L):null;LESSONS.push(L)}
const nextLesson=l=>LESSONS.slice(LESSONS.indexOf(l)+1).find(x=>x.gen)||null;
const fold=s=>s.toLocaleLowerCase('tr').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/â/g,'a');
function setLast(hash,label){ST.set('t7-last',{hash,label})}
const GU=th=>G.find(g=>g.id===th);
