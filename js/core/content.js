(function(){
const Content={
  pack:null, ready:false,
  async load(){
    const base='content/';
    let pack; try{ pack=await (await fetch(base+'pack.json')).json(); }catch(e){ pack={files:[]}; }
    this.pack=pack;
    const EG=window.EG=window.EG||{};
    const loadOne=async(name)=>{ try{ return await (await fetch(base+name+'.json')).json(); }catch(e){ return null; } };
    const files=pack.files||[];
    for(const f of files){
      const data=await loadOne(f); if(data==null) continue;
      if(f==='locations') EG.LOCS=data;
      else if(f==='foods') EG.FOOD=data;
      else if(f==='drinks') EG.DRINKS=data;
      else if(f==='shop') EG.SHOP=data;
      else if(f==='gifts') EG.GIFTS=data;
      else if(f==='achievements') EG.ACHIEVEMENTS=data;
      else if(f==='quests') EG.QUESTS=data;
      else if(f==='chat'){ EG.CHAT=data.phrases||data; EG.CHAT_CATS=data.cats||EG.CHAT_CATS; }
      else if(f==='events') EG.EVENTS_DEF=data;
      else if(f==='unlocks') EG.UNLOCKS=data;
      else if(f==='anims') EG.ANIMS=data;
    }
    // remote overlay
    try{
      if(window.EGRC&&EGRC.bool('content_remote',true)&&pack.remoteUrl){
        const remote=await fetch(pack.remoteUrl+'pack.json').then(r=>r.ok?r.json():null).catch(()=>null);
        if(remote&&remote.semver&&remote.semver!==pack.semver){
          // optional: pull newer files later; for now keep bundled as source of truth until hash check
        }
      }
    }catch(e){}
    this._compat(EG);
    this.ready=true;
    return EG;
  },
  _compat(EG){
    EG.STYLES=EG.STYLES||[{id:'emo',name:'Эмо',blurb:'Чёрно-розовая классика'},{id:'alt',name:'Альт',blurb:'e-girl / e-boy'},{id:'idol',name:'Айдол',blurb:'K-pop сцена'}];
    EG.GENDERS=EG.GENDERS||[{id:'guy',name:'Парень'},{id:'girl',name:'Девушка'}];
    EG.charImg=(s,g)=>`img/chars/${s}_${g}.jpg`;
    EG.PHASES=['morning','day','evening','night'];
    EG.phaseLabel={morning:'Утро',day:'День',evening:'Вечер',night:'Ночь'};
    EG.phaseOf=h=>{const x=((h%24)+24)%24;return x<6||x>=22?'night':x<11?'morning':x<17?'day':'evening'};
    EG.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    EG.locBg=(id,phase)=>{
      const known=window.__EG_LOC_KNOWN||{};
      const key=id+'_'+phase;
      if(known[key]!==0) return `img/loc/${id}_${phase}.jpg`;
      // fallback phases
      for(const p of [phase,'day','evening','night','morning']){
        if(known[id+'_'+p]) return `img/loc/${id}_${p}.jpg`;
      }
      return 'img/loc/room_morning.jpg';
    };
    EG.giftImg=g=> (g&&g.img)||(`img/gifts/${g&&g.id||'heart_plush'}.png`);
  }
};
window.EGContent=Content;
})();
