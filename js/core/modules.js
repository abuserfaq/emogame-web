(function(){
const map=new Map();
const Modules={
  register(id, api){ map.set(id, api||{}); },
  get(id){ return map.get(id); },
  initAll(ctx){ map.forEach(m=>{ try{ m.init&&m.init(ctx);}catch(e){console.warn(e);} }); },
  tickAll(dtH,S){ map.forEach(m=>{ try{ m.tick&&m.tick(dtH,S);}catch(e){} }); },
  onScreen(name,S){ map.forEach(m=>{ try{ m.onScreen&&m.onScreen(name,S);}catch(e){} }); },
  broadcast(ev,payload){ map.forEach(m=>{ try{ m.on&&m.on(ev,payload);}catch(e){} }); },
  list(){ return [...map.keys()]; },
};
window.EGModules=Modules;
})();
