// Jobs / shifts
(function(){
const Jobs={
  init(){},
  list(){ const p=window.EGContent&&EGContent.get('jobs'); return (p&&p.items)||[]; },
  work(S,jid){
    const j=this.list().find(x=>x.id===jid); if(!j) return {ok:false};
    if((S.level|0)<(j.minLevel||1)) return {ok:false,err:'level'};
    if((S.energy|0)<(j.energy||10)) return {ok:false,err:'energy'};
    S.energy-=j.energy|0; S.coins=(S.coins|0)+(j.pay|0); S.jobs=(S.jobs|0)+1;
    if(j.fame) S.fame=(S.fame|0)+j.fame;
    S.mood=Math.max(0,(S.mood|0)-2);
    return {ok:true,j};
  },
};
window.EGJobs=Jobs;
EGModules&&EGModules.register('jobs',Jobs);
})();
