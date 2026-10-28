(function(){
/** Frame-based character animator — one transparent PNG at a time, never the whole sheet. */
const Anim={
  state:'idle', el:null, timer:null, key:'emo_guy', i:0, seq:[],
  mount(imgEl, style, gender){
    this.el=imgEl; this.key=(style||'emo')+'_'+(gender||'guy');
    if(this.el){
      this.el.classList.remove('char-sheet');
      this.el.style.width=''; this.el.style.objectPosition='bottom';
      this.el.style.objectFit='contain';
      this.el.style.background='transparent';
      // sizing owned by .char-wrap CSS when present
      if(!this.el.closest || !this.el.closest('.char-wrap')){
        this.el.style.maxWidth='58%';
        this.el.style.height='58%';
      } else {
        this.el.style.maxWidth=''; this.el.style.height='';
      }
      this.el.style.imageRendering='auto';
    }
    this.play('idle');
  },
  frames(){
    const A=window.EG&&EG.ANIMS; if(!A) return null;
    return (A.frameSets&&A.frameSets[this.key]) || null;
  },
  seqFor(state){
    const A=window.EG&&EG.ANIMS;
    return (A&&A.sequences&&A.sequences[state]) || [state,'idle'];
  },
  url(name){
    const fs=this.frames();
    if(fs&&fs[name]) return fs[name];
    // fallback portrait — never sheet
    const [st,g]=this.key.split('_');
    return (window.EG&&EG.charImg)?EG.charImg(st,g):'img/chars/emo_guy.jpg';
  },
  _c:{},
  ready(u){ const c=this._c[u]; return !!(c&&c.ok); },
  preload(u){ if(!u||this._c[u]) return; const im=new Image(); const c=this._c[u]={im,ok:false};
    im.onload=()=>{ (im.decode?im.decode():Promise.resolve()).catch(()=>{}).then(()=>{c.ok=true;}); }; im.onerror=()=>{c.ok=false;}; im.src=u; },
  preloadAll(){ const fs=this.frames(); if(fs) Object.values(fs).forEach(u=>typeof u==='string'&&this.preload(u)); },
  play(state){
    this.state=state||'idle';
    if(!this.el) return;
    clearInterval(this.timer);
    this.el.classList.remove('anim-bob','anim-sad','anim-dance','anim-sleep','char-sheet');
    const fs=this.frames();
    if(!fs){
      this.el.src=this.url('idle');
      this.el.classList.add(state==='dance'||state==='happy'?'anim-dance':state==='sleep'?'anim-sleep':(state==='sad'||state==='sick'||state==='hungry')?'anim-sad':'anim-bob');
      return;
    }
    this.preloadAll();
    if(!this.el.__egGuard){ this.el.__egGuard=1; const el=this.el;
      el.addEventListener('load',()=>{ if(el.naturalWidth) el.__egGood=el.getAttribute('src'); });
      el.addEventListener('error',()=>{ const g=el.__egGood; const bad=el.getAttribute('src'); if(this._c[bad]) this._c[bad].ok=false; if(g&&g!==bad) el.src=g; }); }
    { const cur=this.el.getAttribute('src'); if(cur&&this.el.complete&&this.el.naturalWidth) this._c[cur]=this._c[cur]||{ok:true}; }
    this.seq=this.seqFor(this.state);
    this.i=0;
    const show=()=>{
      if(!this.el) return;
      const name=this.seq[this.i%this.seq.length];
      const u=this.url(name);
      /* 0.8.2: never swap to a frame that is not decoded yet (cold cache on web showed an empty/transparent character) */
      if(this.ready(u)){ if(this.el.getAttribute('src')!==u) this.el.src=u; } else this.preload(u);
      this.el.classList.add('anim-bob');
      this.i++;
    };
    show();
    const fps=((window.EG&&EG.ANIMS&&EG.ANIMS.fps)||{})[this.state]||3;
    this.timer=setInterval(show, Math.max(90, 1000/fps));
  },
  fromNeeds(S){
    if(S.hunger<20||S.thirst<20) return this.play('hungry');
    if(S.mood<25) return this.play('sad');
    if(S.energy<15) return this.play('sick');
    const dirt=((S.dirt&&S.dirt.trash)||0)+((S.dirt&&S.dirt.dishes)||0)+((S.dirt&&S.dirt.laundry)||0);
    if(dirt>120) return this.play('sad');
    return this.play('idle');
  }
};
window.EGAnim=Anim;
})();
