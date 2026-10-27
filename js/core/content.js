(function(){
const store={};
const Content={
  pack:null, ready:false,
  get(name){ return store[name]; },
  async load(){
    const base='content/';
    let pack; try{ pack=await (await fetch(base+'pack.json')).json(); }catch(e){ pack={files:[]}; }
    this.pack=pack;
    const EG=window.EG=window.EG||{};
    const loadOne=async(name)=>{ try{ return await (await fetch(base+name+'.json')).json(); }catch(e){ return null; } };
    const files=pack.files||[];
    for(const f of files){
      const data=await loadOne(f); if(data==null) continue;
      store[f]=data;
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
    try{
      if(window.EGRC&&EGRC.bool('content_remote',true)&&pack.remoteUrl){
        const remote=await fetch(pack.remoteUrl+'pack.json').then(r=>r.ok?r.json():null).catch(()=>null);
        if(remote&&remote.semver&&remote.semver!==pack.semver){ /* bundled wins until hash */ }
      }
    }catch(e){}
    this._compat(EG);
    this.ready=true;
    return EG;
  },
  _compat(EG){
    EG.STYLES=EG.STYLES||[
      {id:'emo',name:'Эмо',blurb:'Чёрно-розовая классика'},
      {id:'alt',name:'Альт',blurb:'e-girl / e-boy'},
      {id:'idol',name:'Айдол',blurb:'K-pop сцена'},
      {id:'goth',name:'Гот',blurb:'Тьма и кружево'},
      {id:'punk',name:'Панк',blurb:'Ирокез и шипы'},
      {id:'skater',name:'Скейтер',blurb:'Доска и вайб'}
    ];
    EG.GENDERS=EG.GENDERS||[{id:'guy',name:'Парень'},{id:'girl',name:'Девушка'}];
    EG.charImg=(s,g)=>{
      const prefer={goth:'girl',punk:'guy',skater:'girl'};
      let gg=g; if(prefer[s] && !(window.__EG_CHAR_JPG&&window.__EG_CHAR_JPG[s+'_'+g])) gg=prefer[s]||g;
      const jpg=`img/chars/${s}_${gg}.webp`;
      const fs=EG.ANIMS&&EG.ANIMS.frameSets&&EG.ANIMS.frameSets[s+'_'+gg];
      if(fs&&fs.idle) return fs.idle;
      return jpg;
    };
    EG.PHASES=['morning','day','evening','night'];
    EG.phaseLabel={morning:'Утро',day:'День',evening:'Вечер',night:'Ночь'};
    EG.phaseOf=h=>{const x=((h%24)+24)%24;return x<6||x>=22?'night':x<11?'morning':x<17?'day':'evening'};
    EG.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    EG.locBg=(id,phase)=>{
      const known=window.__EG_LOC_KNOWN||{};
      const key=id+'_'+phase;
      if(known[key]) return `img/loc/${id}_${phase}.webp`;
      for(const p of [phase,'day','evening','night','morning']){
        if(known[id+'_'+p]) return `img/loc/${id}_${p}.webp`;
      }
      return 'img/loc/room_morning.webp';
    };
    EG.giftImg=g=> (g&&g.img)||(`img/gifts/${g&&g.id||'heart_plush'}.png`);
    EG.foodImg=f=> (f&&f.img)||(`img/food/${f&&f.id||'ramen'}.webp`);
    EG.drinkImg=d=> (d&&d.img)||(`img/drinks/${d&&d.id||'water'}.webp`);
    EG.shopImg=it=> (it&&it.img)||(`img/wardrobe/${it&&it.id||'hoodie'}.webp`);
    EG.wxLabel={clear:'ясно',rain:'дождь',snow:'снег',fog:'туман',storm:'гроза',heat:'жара'};
    EG.seasonLabel={spring:'весна',summer:'лето',autumn:'осень',winter:'зима'};
    EG.weatherText=(S)=>{
      const w=EG.wxLabel[S.weather]||S.weather||'';
      const s=EG.seasonLabel[S.season]||S.season||'';
      return (w&&s)?(w+' · '+s):(w||s||'');
    };
  }
};
window.EGContent=Content;
})();
