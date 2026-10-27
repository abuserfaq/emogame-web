// Gifts: free every N days (RC free_gift_interval_days, default 7), rewarded, coins, paid
(function(){
const Gifts={
  init(ctx){ this.ctx=ctx; },
  catalog(){ return (window.EG&&EG.GIFTS&&EG.GIFTS.items)||[]; },
  byId(id){ return this.catalog().find(g=>g.id===id); },
  intervalMs(){ const d=window.EGRC?EGRC.freeGiftIntervalDays():7; return d*86400e3; },
  canFree(S){ const last=(S.gifts&&S.gifts.lastFreeAt)|0; return Date.now()-last >= this.intervalMs(); },
  freeLeftDays(S){
    const left=this.intervalMs()- (Date.now()-((S.gifts&&S.gifts.lastFreeAt)|0));
    return Math.max(0, Math.ceil(left/86400e3));
  },
  ensure(S){ S.gifts=S.gifts||{inv:{},inbox:[],wall:[],lastFreeAt:0,sent:0,recv:0}; return S.gifts; },
  addInv(S,id,n){ const g=this.ensure(S); g.inv[id]=(g.inv[id]|0)+(n||1); },
  takeFree(S){
    if(!this.canFree(S)) return {ok:false,reason:'wait',days:this.freeLeftDays(S)};
    const freeItems=this.catalog().filter(g=>(g.sources||[]).includes('free'));
    const it=freeItems[Math.floor(Math.random()*Math.max(1,freeItems.length))]||this.catalog()[0];
    if(!it) return {ok:false};
    this.ensure(S).lastFreeAt=Date.now();
    this.addInv(S,it.id,1);
    return {ok:true,item:it};
  },
  buyCoins(S,id){
    const it=this.byId(id); if(!it) return {ok:false};
    if(!(it.sources||[]).includes('coins')) return {ok:false};
    if(S.coins<(it.cost|0)) return {ok:false,reason:'coins'};
    S.coins-=it.cost|0; this.addInv(S,id,1); return {ok:true,item:it};
  },
  fromRewarded(S,id){
    const it=this.byId(id)||this.catalog().find(g=>(g.sources||[]).includes('rewarded'));
    if(!it) return {ok:false};
    this.addInv(S,it.id,1); return {ok:true,item:it};
  },
  receive(S,payload){
    const giftId=payload&&payload.giftId; const it=this.byId(giftId); if(!it) return {ok:false};
    const g=this.ensure(S);
    g.inbox.unshift({id:giftId,from:(payload&&payload.fromName)||'Друг',fromId:(payload&&payload.fromId)||'',ts:Date.now(),seen:false});
    if(g.inbox.length>50) g.inbox.length=50;
    g.recv=(g.recv|0)+1; this.addInv(S,giftId,1); return {ok:true,item:it};
  },
  claimInbox(S,idx){
    const g=this.ensure(S); const m=g.inbox[idx]; if(!m) return;
    m.seen=true; g.wall.unshift({id:m.id,from:m.from,ts:m.ts}); if(g.wall.length>40) g.wall.length=40;
  },
  placeDecor(S,id,slot){
    const it=this.byId(id); if(!it||it.kind!=='decor') return {ok:false};
    if(!(this.ensure(S).inv[id]>0)) return {ok:false,reason:'inv'};
    S.decor=S.decor||{}; S.decor[slot||it.slot]=id;
    S.mood=EG.clamp(S.mood+(it.mood||5),0,100); return {ok:true};
  },
  wear(S,id){
    const it=this.byId(id); if(!it||it.kind!=='wear') return {ok:false};
    if(!(this.ensure(S).inv[id]>0)) return {ok:false,reason:'inv'};
    S.wardrobe=S.wardrobe||{}; S.wardrobe[id]=1;
    S.styleStat=EG.clamp(S.styleStat+(it.style||6),0,100); return {ok:true};
  },
  sendDemo(S,id){
    if(!(this.ensure(S).inv[id]>0)) return {ok:false};
    this.ensure(S).inv[id]--; if(S.gifts.inv[id]<=0) delete S.gifts.inv[id];
    S.gifts.sent=(S.gifts.sent|0)+1; S.social=EG.clamp(S.social+5,0,100); return {ok:true};
  },
  tick(){}, onScreen(){},
};
window.EGModules&&EGModules.register('gifts', Gifts);
window.EGGifts=Gifts;
})();
