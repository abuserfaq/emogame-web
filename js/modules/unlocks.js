// Level-based unlocks
(function(){
const U={
  init(){},
  data(){ return (window.EGContent&&EGContent.get('unlocks'))||{}; },
  locOk(S,id){ const m=(this.data().locations||{})[id]; return (S.level|0)>=(m||1); },
  foodOk(S,id){ const m=(this.data().foods||{})[id]; return m==null?true:(S.level|0)>=m; },
  drinkOk(S,id){ const m=(this.data().drinks||{})[id]; return m==null?true:(S.level|0)>=m; },
  onLevel(S,prev){
    const levels=this.data().levels||{};
    for(let lv=(prev|0)+1; lv<=(S.level|0); lv++){
      const r=levels[String(lv)]; if(!r) continue;
      S.coins=(S.coins|0)+(r.coins|0); S.gems=(S.gems|0)+(r.gems|0);
    }
  },
};
window.EGUnlocks=U;
EGModules&&EGModules.register('unlocks',U);
})();
