// Achievements checker
(function(){
const A={
  init(){},
  list(){ return (window.EGContent&&EGContent.get('achievements'))||[]; },
  check(S){
    const unlocked=[];
    for(const a of this.list()){
      if(!a||!a.id) continue;
      if(S.ach&&S.ach[a.id]) continue;
      const need=a.need|0; const stat=a.stat;
      let val=0;
      if(stat==='streak') val=(S.streak&&S.streak.n)|0;
      else if(stat==='npcMax') val=S.npcMax|0;
      else if(stat==='npcMet') val=S.npcMet|0;
      else if(stat==='collections') val=S.collections|0;
      else if(stat==='decorCount') val=S.decorCount|0;
      else if(stat==='catBond') val=S.catBond|0;
      else if(stat==='seasonsSeen') val=S.seasonsSeenCount|0;
      else if(stat==='followers') val=S.followers|0;
      else if(stat==='diaryDays') val=S.diaryDays|0;
      else if(stat==='musicScore') val=S.musicScore|0;
      else val=S[stat]|0;
      if(val>=need){
        S.ach=S.ach||{}; S.ach[a.id]=Date.now();
        const r=a.reward||{}; S.coins=(S.coins|0)+(r.coins|0); S.gems=(S.gems|0)+(r.gems|0); try{ if((r.gems|0)>0 && window.EGAudio) EGAudio.emit('gem'); }catch(e){}
        unlocked.push(a);
      }
    }
    return unlocked;
  },
};
window.EGAch=A;
EGModules&&EGModules.register('achievements',A);
})();
