"use strict";
/* Türkçe 7 Oyunları · Turns each lesson's question bank (js/units/u*.js) into game questions */
/* A lesson's questions are dealt from a shuffled deck, so a round of 10 repeats nothing until the deck is used up. */
const DECKS={};
function deal(l){let d=DECKS[l.id];if(!d||!d.length)d=DECKS[l.id]=shuffle(l.q.map((_,i)=>i));return l.q[d.pop()]}
function makeQ(raw,l){
  const base={sk:l?l.id:null,raw,explain:raw.e,prompt:`<p>${raw.p}</p>`};
  if(raw.k==='mc')return {...base,kind:'choice',options:shuffle([{html:raw.a,ok:true},...raw.w.map(([h,mis])=>({html:h,ok:false,mis:mis||'other'}))])};
  if(raw.k==='tf')return {...base,kind:'choice',tf:true,prompt:`<p class="tfh">Doğru mu, yanlış mı?</p><p class="big tfp">${raw.p}</p>`,
    options:[{html:'✔ Doğru',ok:raw.a===true,mis:raw.a?null:raw.mis||'other'},{html:'✘ Yanlış',ok:raw.a===false,mis:raw.a?raw.mis||'other':null}]};
  if(raw.k==='order')return {...base,kind:'order',items:raw.items.slice(),mis:raw.mis||'other'};
  if(raw.k==='sort')return {...base,kind:'sort',bins:raw.bins.slice(),items:raw.items.map(x=>x.slice()),mis:raw.mis||'other'};
  if(window.EXTRA_MAKE&&EXTRA_MAKE[raw.k])return EXTRA_MAKE[raw.k](raw,base);
  throw new Error('unknown question kind '+raw.k);
}
/* a question from a lesson; a unit's own mixed game takes its lessons in turn */
const lessonQ=l=>makeQ(deal(l),l);
function unitQ(th){const ls=LESSONS.filter(l=>l.th===th&&l.q&&l.q.length);const l=pick(ls);const q=lessonQ(l);q.from=l;return q}
