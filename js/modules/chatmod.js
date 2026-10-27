(function(){
const BAD=/([хx][уy][йi]|бля|еб[аa]|пизд|сука|мраз|fag|nigg)/i;
const Mod={
  init(){},
  filter(text){
    const t=String(text||'');
    if(BAD.test(t)) return {ok:false, text:t.replace(BAD,'***'), flagged:true};
    return {ok:true, text:t, flagged:false};
  },
  report(S, targetId, reason){
    S.mod=S.mod||{reports:[], blocks:[]};
    S.mod.reports.push({targetId, reason:String(reason||'').slice(0,200), t:Date.now()});
    try{ Net.post&&Net.post('mod_report',{targetId,reason}); }catch(e){}
    return true;
  },
  block(S, targetId){
    S.mod=S.mod||{reports:[], blocks:[]};
    if(!S.mod.blocks.includes(targetId)) S.mod.blocks.push(targetId);
    return true;
  },
  isBlocked(S, id){ return !!(S.mod&&S.mod.blocks&&S.mod.blocks.includes(id)); }
};
window.EGChatMod=Mod;
EGModules&&EGModules.register('chatmod',Mod);
})();
