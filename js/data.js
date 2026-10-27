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
window.__EG_LOC_KNOWN={'arcade_day':1,'arcade_evening':1,'arcade_morning':1,'arcade_night':1,'beach_day':1,'beach_evening':1,'beach_morning':1,'beach_night':1,'bookcafe_day':1,'bookcafe_evening':1,'bookcafe_morning':1,'bookcafe_night':1,'cafe_day':1,'cafe_evening':1,'cafe_morning':1,'cafe_night':1,'cemetery_day':1,'cemetery_evening':1,'cemetery_morning':1,'cemetery_night':1,'concert_day':1,'concert_evening':1,'concert_morning':1,'concert_night':1,'embankment_day':1,'embankment_evening':1,'embankment_morning':1,'embankment_night':1,'factory_day':1,'factory_evening':1,'factory_morning':1,'factory_night':1,'festival_day':1,'festival_evening':1,'festival_morning':1,'festival_night':1,'garage_day':1,'garage_evening':1,'garage_morning':1,'garage_night':1,'idol_stage_day':1,'idol_stage_evening':1,'idol_stage_morning':1,'idol_stage_night':1,'karaoke_day':1,'karaoke_evening':1,'karaoke_morning':1,'karaoke_night':1,'mall_day':1,'mall_evening':1,'mall_morning':1,'mall_night':1,'metro_day':1,'metro_evening':1,'metro_morning':1,'metro_night':1,'nightclub_day':1,'nightclub_evening':1,'nightclub_morning':1,'nightclub_night':1,'park_day':1,'park_evening':1,'park_morning':1,'park_night':1,'records_day':1,'records_evening':1,'records_morning':1,'records_night':1,'rooftop_day':1,'rooftop_evening':1,'rooftop_morning':1,'rooftop_night':1,'room_day':1,'room_evening':1,'room_morning':1,'room_night':1,'school_day':1,'school_evening':1,'school_morning':1,'school_night':1,'skate_day':1,'skate_evening':1,'skate_morning':1,'skate_night':1,'station_day':1,'station_evening':1,'station_morning':1,'station_night':1,'tattoo_day':1,'tattoo_evening':1,'tattoo_morning':1,'tattoo_night':1};
