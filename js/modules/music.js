// Music rhythm mini-game scoring
(function(){
const Music={
  init(){},
  play(S,hits,total){
    total=Math.max(1,total|0); hits=Math.max(0,hits|0);
    const score=Math.round(100*hits/total);
    S.musicScore=(S.musicScore|0)+score;
    S.music=(S.music|0)+Math.floor(score/20);
    S.mood=Math.min(100,(S.mood|0)+Math.floor(score/25));
    if(score>=80){ S.fame=(S.fame|0)+2; S.coins=(S.coins|0)+15; }
    else S.coins=(S.coins|0)+5;
    return {score,xp:Math.floor(score/10)};
  },
};
window.EGMusic=Music;
EGModules&&EGModules.register('music',Music);
})();
