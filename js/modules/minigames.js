// Extra mini-games hub helpers
(function(){
const MG={
  init(){},
  dance(S,score){ S.coins+=(5+Math.floor(score/10)); S.mood=Math.min(100,S.mood+Math.floor(score/20)); S.dances=(S.dances|0)+1; return score; },
  skate(S,tricks){ const sc=tricks*12; S.coins+=sc; S.energy=Math.max(0,S.energy-8); S.skates=(S.skates|0)+1; return sc; },
  arcade(S,won){ if(won){ S.coins+=25; S.mood=Math.min(100,S.mood+8);} else S.coins=Math.max(0,S.coins-5); S.arcades=(S.arcades|0)+1; },
  karaoke(S,score){ S.fame+=Math.floor(score/30); S.music+=2; S.mood=Math.min(100,S.mood+6); S.karaokes=(S.karaokes|0)+1; },
};
window.EGMinigames=MG;
EGModules&&EGModules.register('minigames',MG);
})();
