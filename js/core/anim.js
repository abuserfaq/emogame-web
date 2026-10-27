(function(){
// Sprite sheet animator + CSS fallback bob for missing sheets
const Anim={
  state:'idle', el:null, timer:null, frame:0,
  mount(imgEl, style, gender){
    this.el=imgEl; this.key=style+'_'+gender; this.play('idle');
  },
  sheet(){ const A=window.EG&&EG.ANIMS; return A&&A.sheets&&A.sheets[this.key]; },
  play(state){
    this.state=state||'idle';
    if(!this.el) return;
    const sheet=this.sheet();
    this.el.classList.remove('anim-bob','anim-sad','anim-dance','anim-sleep');
    if(sheet){
      // use sheet as CSS sprite if columns known
      const cols=(EG.ANIMS&&EG.ANIMS.sheetCols)||8;
      this.el.src=sheet;
      this.el.style.objectFit='cover';
      this.el.style.objectPosition='0% 50%';
      this.el.dataset.cols=cols;
      clearInterval(this.timer);
      const fps=(EG.ANIMS.fps&&EG.ANIMS.fps[state])||2;
      const map={idle:0,idle2:1,walk:2,walk2:3,eat:4,drink:5,sleep:6,dance:7,happy:7,sad:0,sick:6,hungry:0};
      let f0=map[state]|0; let t=0;
      this.timer=setInterval(()=>{
        if(!this.el) return;
        // ping-pong idle between 0 and 1; walk 2-3
        let f=f0;
        if(state==='idle') f=(t++%2);
        else if(state==='walk') f=2+(t++%2);
        else if(state==='dance'||state==='happy') f=7;
        const pct=cols<=1?0:(f/(cols-1))*100;
        this.el.style.objectPosition=pct+'% 50%';
        this.el.style.width=(cols*48)+'%'; // approximate crop via overflow parent
      }, Math.max(80, 1000/fps));
      this.el.classList.add('char-sheet');
    } else {
      // portrait fallback + CSS class
      this.el.src=EG.charImg(this.key.split('_')[0], this.key.split('_')[1]);
      this.el.style.width=''; this.el.style.objectPosition='';
      if(state==='sad'||state==='sick'||state==='hungry') this.el.classList.add('anim-sad');
      else if(state==='dance'||state==='happy') this.el.classList.add('anim-dance');
      else if(state==='sleep') this.el.classList.add('anim-sleep');
      else this.el.classList.add('anim-bob');
    }
  },
  fromNeeds(S){
    if(S.hunger<20||S.thirst<20) return this.play('hungry');
    if(S.mood<25) return this.play('sad');
    if(S.energy<15) return this.play('sick');
    const dirt=(S.dirt.trash+S.dirt.dishes+S.dirt.laundry);
    if(dirt>120) return this.play('sad');
    return this.play('idle');
  }
};
window.EGAnim=Anim;
})();
