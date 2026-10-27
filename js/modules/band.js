// Band & gigs
(function(){
const Band={
  init(){},
  catalog(){ return (window.EGContent&&EGContent.get('band'))||{gigs:[],songs:[]}; },
  canPlay(S,g){ return (S.level|0)>=(g.minLevel||1) && (S.energy|0)>=(g.energy||10); },
  playGig(S,gid){
    const g=(this.catalog().gigs||[]).find(x=>x.id===gid); if(!g) return {ok:false,err:'no'};
    if(!this.canPlay(S,g)) return {ok:false,err:'need'};
    S.energy=Math.max(0,(S.energy|0)-(g.energy|0));
    S.coins=(S.coins|0)+(g.pay|0); S.fame=(S.fame|0)+(g.fame|0); S.music=(S.music|0)+5;
    S.gigs=(S.gigs|0)+1; S.mood=Math.min(100,(S.mood|0)+8);
    return {ok:true,g};
  },
};
window.EGBand=Band;
EGModules&&EGModules.register('band',Band);
})();
