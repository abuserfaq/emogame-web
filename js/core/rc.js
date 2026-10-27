(function(){
const DEF={
  ads_interstitial_enabled:false,
  free_gift_interval_days:7,
  content_remote:true,
  care_decay_mult:100,
  streak_freeze_enabled:true,
  push_care_enabled:true,
  gifts_enabled:true,
  coop_enabled:true,
};
const RC={
  raw:Object.assign({},DEF),
  apply(obj){ if(obj&&typeof obj==='object') Object.assign(this.raw,obj);
    const P=window.Platform; if(P&&P.setRc) P.setRc(this.raw); },
  bool(k,d){ const P=window.Platform; if(P&&P.rcBool){ const v=P.rcBool(k, this.raw[k]!==undefined?!!this.raw[k]:!!d); return v; }
    return this.raw[k]!==undefined?!!this.raw[k]:!!d; },
  int(k,d){ const P=window.Platform; const fallback=this.raw[k]!==undefined?(this.raw[k]|0):(d|0);
    if(P&&P.rcInt) return P.rcInt(k, fallback)|0; return fallback|0; },
  freeGiftIntervalDays(){ return Math.max(1, this.int('free_gift_interval_days', 7)); },
};
window.EGRC=RC;
})();
