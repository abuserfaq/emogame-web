// NPC friendships
(function(){
const Npc={
  init(){},
  list(){ const p=window.EGContent&&EGContent.get('npcs'); return (p&&p.items)||[]; },
  rel(S,id){ S.npc=S.npc||{}; S.npc[id]=S.npc[id]||{bond:0,met:0}; return S.npc[id]; },
  meet(S,id){ const r=this.rel(S,id); if(!r.met){ r.met=1; S.npcMet=(S.npcMet|0)+1; } r.bond=Math.min(100,(r.bond|0)+8); S.social=Math.min(100,(S.social|0)+4); S.npcMax=Math.max(S.npcMax|0,r.bond); return r; },
  gift(S,id){ const r=this.rel(S,id); r.bond=Math.min(100,(r.bond|0)+15); S.npcMax=Math.max(S.npcMax|0,r.bond); return r; },
};
window.EGNpc=Npc;
EGModules&&EGModules.register('npc',Npc);
})();
