(function(){
const Events={
  active:[],
  apply(list){ this.active=Array.isArray(list)?list.slice():[]; },
  fromPack(){ this.active=(window.EG&&EG.EVENTS_DEF)||[]; },
  today(){
    const dow=new Date().getDay(); // 0 Sun
    return (this.active||[]).filter(e=>{
      if(e.dow && !e.dow.includes(dow===0?7:dow) && !e.dow.includes(dow)) return false;
      return true;
    });
  },
};
window.EGEvents=Events;
})();
