// Weather & seasons
(function(){
const Weather={
  init(){ this._last=''; },
  meta(){ return (window.EGContent&&EGContent.get('weather'))||{seasons:[],weathers:[],effects:{}}; },
  sync(S){
    const m=this.meta(); const now=new Date();
    const season=m.seasons[((now.getMonth())/3)|0]||'spring';
    // deterministic daily weather
    const seed=(now.toISOString().slice(0,10)+'eg').split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    const wlist=m.weathers||['clear']; const weather=wlist[seed%wlist.length];
    S.season=season; S.weather=weather;
    const wxL=(window.EG&&EG.wxLabel)||{}; const seL=(window.EG&&EG.seasonLabel)||{};
    S.weatherText=(wxL[weather]||weather)+' · '+(seL[season]||season);
    S.seasonsSeen=S.seasonsSeen||{}; S.seasonsSeen[season]=1;
    S.seasonsSeenCount=Object.keys(S.seasonsSeen).length;
    return {season,weather,fx:(m.effects||{})[weather]||{}};
  },
  applyVisit(S,locId){
    const {fx}=this.sync(S); if(!fx) return;
    if(fx.mood) S.mood=Math.max(0,Math.min(100,(S.mood|0)+fx.mood));
    if(fx.energy) S.energy=Math.max(0,Math.min(100,(S.energy|0)+fx.energy));
    if(fx.thirst) S.thirst=Math.max(0,Math.min(100,(S.thirst|0)+fx.thirst));
    const b=(fx.locs_bonus||{})[locId]; if(b) S.mood=Math.min(100,(S.mood|0)+b);
    if(fx.home_bonus && locId==='room') S.mood=Math.min(100,(S.mood|0)+fx.home_bonus);
  },
};
window.EGWeather=Weather;
EGModules&&EGModules.register('weather',Weather);
})();
