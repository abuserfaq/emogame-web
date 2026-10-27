// Versioned save + migrations
(function(){
const KEY='eg_save';
const SAVE_VERSION=2;
const DEF=()=>({
  v:SAVE_VERSION, consent:null, stats:true, pers:true,
  style:'emo', gender:'guy', name:'',
  hunger:70, thirst:70, energy:80, mood:65, social:40, styleStat:20, fame:0, music:0,
  coins:200, gems:5, xp:0, level:1,
  loc:'room', wardrobe:{}, decor:{}, questDay:'', quest:{},
  chat:[], lastTick:Date.now(), lastLoginDay:'',
  sleeps:0, feeds:0, drinks:0, chats:0, park:0, concerts:0, cleans:0, outings:0,
  // care / streak
  dirt:{trash:0,dishes:0,laundry:0},
  streak:{n:0,last:'',freeze:0},
  careNotifArmed:false,
  // gifts
  gifts:{inv:{}, inbox:[], wall:[], lastFreeAt:0, sent:0, recv:0},
  ach:{},
  musicOn:true, sfx:true,
});
const MIG={
  1:(s)=>{ s.v=2;
    s.dirt=s.dirt||{trash:0,dishes:0,laundry:0};
    s.streak=s.streak||{n:0,last:'',freeze:0};
    s.gifts=s.gifts||{inv:{},inbox:[],wall:[],lastFreeAt:0,sent:0,recv:0};
    s.decor=s.decor||{}; s.fame=s.fame||0; s.music=s.music||0;
    s.drinks=s.drinks||0; s.cleans=s.cleans||0; s.outings=s.outings||0; s.ach=s.ach||{};
    return s;
  },
};
function migrate(s){
  if(!s||typeof s!=='object') s=DEF();
  let v=s.v|0; if(!v) v=1;
  while(v<SAVE_VERSION){ const fn=MIG[v]; if(!fn) break; s=fn(s)||s; v=s.v|0; }
  s.v=SAVE_VERSION;
  // fill missing keys from DEF
  const d=DEF(); for(const k of Object.keys(d)){ if(s[k]===undefined) s[k]=d[k]; }
  return s;
}
const Save={
  VERSION:SAVE_VERSION,
  defaults:DEF,
  load(){ try{ return migrate(Object.assign(DEF(), JSON.parse(localStorage.getItem(KEY)||'{}'))); }
          catch(e){ return DEF(); } },
  persist(S){ try{ S.v=SAVE_VERSION; localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} },
  reset(){ try{ localStorage.removeItem(KEY);}catch(e){} },
};
window.EGSave=Save;
})();
