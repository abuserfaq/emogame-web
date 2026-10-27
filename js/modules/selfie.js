// Selfies & followers / fame
(function(){
const Selfie={
  init(){},
  tick(dtH,S){ /* passive follower drip */ if((S.fame|0)>0) S.followers=(S.followers|0)+Math.floor(dtH*(1+(S.fame|0)/20)); },
  shoot(S,filter){
    if((S.energy|0)<5) return {ok:false,err:'energy'};
    S.energy-=5; S.selfies=(S.selfies|0)+1;
    const boost=8+((filter==='idol')?6:0)+((filter==='emo')?4:0);
    S.followers=(S.followers|0)+boost+Math.floor((S.styleStat|0)/10);
    S.fame=(S.fame|0)+1; S.mood=Math.min(100,(S.mood|0)+5);
    S.lastSelfie=Date.now();
    return {ok:true,gain:boost};
  },
};
window.EGSelfie=Selfie;
EGModules&&EGModules.register('selfie',Selfie);
})();
