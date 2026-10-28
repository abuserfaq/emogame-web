// Collections
(function(){
const Col={
  init(){},
  sets(){ const p=window.EGContent&&EGContent.get('collections'); return (p&&p.sets)||[]; },
  progress(S,set){
    const inv=(S.gifts&&S.gifts.inv)||{}; const owned=new Set(Object.keys(inv).filter(k=>inv[k]>0));
    // also decor
    Object.keys(S.decor||{}).forEach(k=>owned.add(k));
    const need=set.need||[]; const have=need.filter(id=>owned.has(id));
    return {have:have.length,need:need.length,done:have.length>=need.length};
  },
  claim(S,sid){
    const set=this.sets().find(x=>x.id===sid); if(!set) return {ok:false};
    S.colClaimed=S.colClaimed||{}; if(S.colClaimed[sid]) return {ok:false,err:'claimed'};
    const p=this.progress(S,set); if(!p.done) return {ok:false,err:'incomplete'};
    S.colClaimed[sid]=1; S.collections=(S.collections|0)+1;
    const r=set.reward||{}; S.coins=(S.coins|0)+(r.coins|0); S.gems=(S.gems|0)+(r.gems|0); try{ if((r.gems|0)>0 && window.EGAudio) EGAudio.emit('gem'); }catch(e){}
    S.fame=(S.fame|0)+(r.fame|0); S.mood=Math.min(100,(S.mood|0)+(r.mood|0)); S.styleStat=(S.styleStat|0)+(r.style|0);
    return {ok:true,r};
  },
};
window.EGCollections=Col;
EGModules&&EGModules.register('collections',Col);
})();
