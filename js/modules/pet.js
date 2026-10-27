// Black cat pet
(function(){
const Pet={
  init(){},
  meta(){ return (window.EGContent&&EGContent.get('pet'))||{actions:[]}; },
  ensure(S){ S.pet=S.pet||{hunger:70,bond:20,name:'Тень'}; return S.pet; },
  tick(dtH,S){
    const p=this.ensure(S); const m=this.meta();
    p.hunger=Math.max(0,(p.hunger|0)-dtH*(m.hungerDecay||3));
    if(p.hunger<20) p.bond=Math.max(0,(p.bond|0)-dtH*(m.bondDecay||1));
    S.catBond=p.bond|0;
  },
  act(S,aid){
    const p=this.ensure(S); const a=(this.meta().actions||[]).find(x=>x.id===aid); if(!a) return {ok:false};
    if((a.cost|0)>0 && (S.coins|0)<a.cost) return {ok:false,err:'coins'};
    if(a.cost) S.coins-=a.cost;
    if(a.hunger) p.hunger=Math.min(100,(p.hunger|0)+a.hunger);
    if(a.bond) p.bond=Math.min(100,(p.bond|0)+a.bond);
    if(a.mood) S.mood=Math.min(100,(S.mood|0)+a.mood);
    if(a.energy) S.energy=Math.max(0,Math.min(100,(S.energy|0)+a.energy));
    S.catBond=p.bond|0;
    return {ok:true,p};
  },
};
window.EGPet=Pet;
EGModules&&EGModules.register('pet',Pet);
})();
