(function(){
/** Frame-based character animator — one transparent PNG at a time, never the whole sheet. */
const Anim={
  state:'idle', el:null, timer:null, key:'emo_guy', i:0, seq:[],
  mount(imgEl, style, gender){
    this.el=imgEl; this.key=(style||'emo')+'_'+(gender||'guy');
    if(this.el){
      this.el.classList.remove('char-sheet');
      this.el.style.width=''; this.el.style.objectPosition='';
      this.el.style.objectFit='contain';
      this.el.style.background='transparent';
      this.el.style.maxWidth='58%';
      this.el.style.height='58%';
      this.el.style.imageRendering='pixelated';
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
    this.seq=this.seqFor(this.state);
    this.i=0;
    const show=()=>{
      if(!this.el) return;
      const name=this.seq[this.i%this.seq.length];
      this.el.src=this.url(name);
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
