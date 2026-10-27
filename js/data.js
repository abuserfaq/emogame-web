// Compat bootstrap — real content loads from content/*.json via EGContent.
// Kept so older references to EG.* before async load still have safe defaults.
window.EG=window.EG||{};
EG.STYLES=[{id:'emo',name:'Эмо',blurb:'Чёрно-розовая классика'},{id:'alt',name:'Альт',blurb:'e-girl / e-boy вайб'},{id:'idol',name:'Айдол',blurb:'K-pop сцена и танцы'}];
EG.GENDERS=[{id:'guy',name:'Парень'},{id:'girl',name:'Девушка'}];
EG.charImg=(s,g)=>`img/chars/${s}_${g}.jpg`;
EG.PHASES=['morning','day','evening','night'];
EG.phaseLabel={morning:'Утро',day:'День',evening:'Вечер',night:'Ночь'};
EG.phaseOf=h=>{const x=((h%24)+24)%24;return x<6||x>=22?'night':x<11?'morning':x<17?'day':'evening'};
EG.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
EG.LOCS=EG.LOCS||[]; EG.FOOD=EG.FOOD||[]; EG.DRINKS=EG.DRINKS||[]; EG.SHOP=EG.SHOP||[];
EG.QUESTS=EG.QUESTS||[]; EG.CHAT=EG.CHAT||{}; EG.CHAT_CATS=EG.CHAT_CATS||[];
EG.locBg=(id,phase)=>{
  const known=window.__EG_LOC_KNOWN||{};
  const key=id+'_'+phase;
  if(known[key]) return `img/loc/${id}_${phase}.jpg`;
  for(const p of [phase,'day','evening','night','morning']) if(known[id+'_'+p]) return `img/loc/${id}_${p}.jpg`;
  return 'img/loc/room_morning.jpg';
};
// known shipped backgrounds (updated as arts land)
window.__EG_LOC_KNOWN={'cafe_day':1,'cafe_evening':1,'cafe_morning':1,'cafe_night':1,'cemetery_day':1,'cemetery_evening':1,'cemetery_morning':1,'cemetery_night':1,'concert_day':1,'concert_evening':1,'concert_morning':1,'concert_night':1,'metro_day':1,'metro_evening':1,'metro_morning':1,'metro_night':1,'park_day':1,'park_evening':1,'park_morning':1,'park_night':1,'room_day':1,'room_evening':1,'room_morning':1,'room_night':1};
