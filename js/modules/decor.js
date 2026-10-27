// Room decoration
(function(){
const Decor={
  init(){},
  catalog(){ const p=window.EGContent&&EGContent.get('decor'); return p||{slots:[],items:[]}; },
  place(S,itemId){
    const it=(this.catalog().items||[]).find(x=>x.id===itemId); if(!it) return {ok:false};
    if((S.coins|0)<(it.cost|0)) return {ok:false,err:'coins'};
    S.coins-=it.cost|0; S.decor=S.decor||{}; S.decor[it.slot]=itemId;
    S.decorCount=Object.keys(S.decor).length;
    S.mood=Math.min(100,(S.mood|0)+(it.mood|0));
    return {ok:true,it};
  },
};
window.EGDecor=Decor;
EGModules&&EGModules.register('decor',Decor);
})();
