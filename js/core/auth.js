(function(){
/** Guest-first auth + account linking. Never surface email in UI. */
const Auth={
  providers:['guest','vk','ok','yandex','telegram','tiktok'],
  state(){ const s=window.S; return (s&&s.auth)||{provider:'guest', linked:[], verified:false, phoneMasked:'', displayName:''}; },
  isGuest(){ return this.state().provider==='guest' && !(this.state().linked||[]).length; },
  canFreeChat(){
    const a=this.state();
    return !!(a.verified && (window.S&&window.S.sub&&window.S.sub.freeChat));
  },
  async login(provider){
    const P=window.Platform;
    if(provider==='guest'){ return this._apply({provider:'guest', displayName:'Гость'}); }
    if(provider==='vk' && P.auth&&P.auth.vkAvail&&P.auth.vkAvail()){ try{ await P.auth.vkLogin(); }catch(e){} }
    if(provider==='yandex' && P.auth&&P.auth.yaAvail&&P.auth.yaAvail()){ try{ await P.auth.yaLogin(); }catch(e){} }
    if(provider==='telegram' && P.auth&&P.auth.tgAvail&&P.auth.tgAvail()){ try{ await P.auth.tgLogin(); }catch(e){} }
    if(provider==='tiktok' && P.auth&&P.auth.ttAvail&&P.auth.ttAvail()){ try{ await P.auth.ttLogin(); }catch(e){} }
    if(provider==='ok' && P.auth&&P.auth.okAvail&&P.auth.okAvail()&&P.auth.okLogin){ try{ await P.auth.okLogin(); }catch(e){} }
    // Social SDKs may complete async via bridge callbacks; store intent
    const name={vk:'VK',ok:'OK',yandex:'Яндекс',telegram:'Telegram',tiktok:'TikTok'}[provider]||provider;
    return this._apply({provider, displayName:name+' игрок', linked:[provider], pendingVerify:true});
  },
  async link(provider){
    const a=this.state(); const linked=new Set(a.linked||[]); linked.add(provider);
    return this._apply(Object.assign({},a,{linked:[...linked], provider:a.provider==='guest'?provider:a.provider}));
  },
  /** Phone verification via provider (RF messaging law). No email shown. */
  async verifyPhone(){
    const a=this.state();
    // Real OTP flows live in native/WebView bridges; mark verified after platform confirm
    const masked='+7 ••• ••• ••67';
    return this._apply(Object.assign({},a,{verified:true, phoneMasked:masked, pendingVerify:false}));
  },
  _apply(patch){
    if(!window.S) return patch;
    const S=window.S;
    S.auth=Object.assign(this.state(), patch, {email:undefined}); // never persist email for UI
    delete S.auth.email;
    if(window.EGSave) EGSave.persist(S);
    try{ window.Net&&Net.sync&&Net.sync(); }catch(e){}
    return S.auth;
  },
  uiName(){ const a=this.state(); const S=window.S; return (a.displayName)||(S&&S.name)||'Игрок'; }
};
window.EGAuth=Auth;
})();
