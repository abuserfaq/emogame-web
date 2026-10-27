// Daily care retention: decay, dirt, streak, push copy, neglect anim
(function(){
const dayKey=()=>new Date().toISOString().slice(0,10);
const Care={
  init(ctx){ this.ctx=ctx; this._armPush(ctx.S); },
  tick(dtH,S){
    if(dtH<=0) return;
    const mult=(window.EGRC?EGRC.int('care_decay_mult',100):100)/100;
    S.hunger=EG.clamp(S.hunger-dtH*7*mult,0,100);
    S.thirst=EG.clamp(S.thirst-dtH*9*mult,0,100);
    if(S.loc==='room') S.energy=EG.clamp(S.energy+dtH*1.5,0,100);
    else S.energy=EG.clamp(S.energy-dtH*4*mult,0,100);
    // dirt accumulates always (faster if eating without clean)
    S.dirt=S.dirt||{trash:0,dishes:0,laundry:0};
    S.dirt.trash=EG.clamp(S.dirt.trash+dtH*4,0,100);
    S.dirt.dishes=EG.clamp(S.dirt.dishes+dtH*3.5,0,100);
    S.dirt.laundry=EG.clamp(S.dirt.laundry+dtH*2.5,0,100);
    const neglect=(S.hunger<25?1:0)+(S.thirst<25?1:0)+(S.energy<20?1:0)+((S.dirt.trash+S.dirt.dishes+S.dirt.laundry)>150?1:0);
    if(neglect) S.mood=EG.clamp(S.mood-dtH*6*neglect,0,100);
    this._armPush(S);
  },
  onLogin(S){
    const d=dayKey();
    const st=S.streak||(S.streak={n:0,last:'',freeze:0});
    if(st.last===d) return {same:true};
    const y=new Date(); y.setDate(y.getDate()-1);
    const yKey=y.toISOString().slice(0,10);
    if(st.last===yKey){ st.n=(st.n||0)+1; }
    else if(st.freeze>0){ st.freeze--; st.n=(st.n||0)+1; toast&&toast('Заморозка серии спасла стрик!'); }
    else if(!st.last){ st.n=1; }
    else { st.n=1; if(window.toast) toast('Серия сброшена — заходи каждый день'); }
    st.last=d; S.lastLoginDay=d;
    const reward=Math.min(200, 20+st.n*10);
    S.coins+=reward; S.mood=EG.clamp(S.mood+5,0,100);
    if(window.toast) toast('Серия '+st.n+' дн. · +'+reward+'💰');
    return {streak:st.n,reward};
  },
  clean(S,what){
    S.dirt=S.dirt||{trash:0,dishes:0,laundry:0};
    if(what==='all'){ S.dirt.trash=0; S.dirt.dishes=0; S.dirt.laundry=0; }
    else S.dirt[what]=0;
    S.cleans=(S.cleans||0)+1; S.mood=EG.clamp(S.mood+8,0,100);
    S.energy=EG.clamp(S.energy-4,0,100);
  },
  dirtTotal(S){ const d=S.dirt||{}; return (d.trash|0)+(d.dishes|0)+(d.laundry|0); },
  statusLine(S){
    const parts=[];
    if(S.hunger<25) parts.push('голоден(на)');
    if(S.thirst<25) parts.push('хочет пить');
    if(S.energy<20) parts.push('вымотан(а)');
    if(this.dirtTotal(S)>100) parts.push('в комнате бардак');
    if(S.mood<30) parts.push('грустит');
    return parts.length?('Персонаж: '+parts.join(', ')):'Всё ок — но заглядывай каждый день';
  },
  freezeStreak(S){
    if(!(window.EGRC?EGRC.bool('streak_freeze_enabled',true):true)) return false;
    S.streak=S.streak||{n:0,last:'',freeze:0};
    S.streak.freeze=(S.streak.freeze||0)+1;
    return true;
  },
  _armPush(S){
    if(!(window.EGRC?EGRC.bool('push_care_enabled',true):true)) return;
    const P=window.Platform; if(!P||!P.push||!P.push.avail||!P.push.avail()) return;
    const msgs=[];
    if(S.hunger<35) msgs.push({id:'hunger',title:'Emogame',body:'я голоден… зайди покормить',when:Date.now()+3600e3});
    if(this.dirtTotal(S)>80) msgs.push({id:'dirt',title:'Emogame',body:'в комнате бардак Sweep',when:Date.now()+7200e3});
    if(S.thirst<35) msgs.push({id:'thirst',title:'Emogame',body:'хочу пить 🧋',when:Date.now()+5400e3});
    try{ P.push.setReminders(msgs); }catch(e){}
  },
  onScreen(){},
};
window.EGModules&&EGModules.register('care', Care);
window.EGCare=Care;
})();
