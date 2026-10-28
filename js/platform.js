// Emogame platform layer — one interface, adapters: android | vk | ok(via vk) | fs | web
// Secrets never here. VK/OK/FS launch params verified by game_backend.
(function(){
const W=window, A=W.AdBridge, B=W.AppBridge, P=W.PushBridge;
const tryf=(f,d)=>{try{return f()}catch(e){return d}};
const Q=tryf(()=>new URLSearchParams(location.search),new URLSearchParams(''));
const SHOT=!!Q.get('scr'); // store screenshots: no ads

const android={
  id:'android',
  version:()=>tryf(()=>B&&B.version?B.version():'0.8.2','0.8.2'),
  canSign:()=>!!(B&&B.gsig),
  sign:p=>tryf(()=>B.gsig(p),''),
  event:(n,o)=>tryf(()=>B&&B.event&&B.event(n,JSON.stringify(o||{}))),
  setConsent:(stats,pers)=>{tryf(()=>B&&B.setConsent&&B.setConsent(!!stats));tryf(()=>A&&A.setConsent&&A.setConsent(!!pers));},
  rcInt:(k,d)=>tryf(()=>B&&B.rcInt?B.rcInt(k,d):d,d),
  rcBool:(k,d)=>tryf(()=>B&&B.rcBool?B.rcBool(k,d):d,d),
  ads:{
    slot:def=>SHOT?0:tryf(()=>A&&A.slotDp?A.slotDp():def,def),
    banner:on=>{ if(SHOT)return; tryf(()=>A&&A.banner&&A.banner(!!on)); },
    rewardedAvail:()=>!SHOT&&tryf(()=>!!(A&&A.showRewarded&&A.enabled&&A.enabled()),false),
    showRewarded:k=>{ if(SHOT)return; tryf(()=>A.showRewarded(k)); },
    interstitialOn:()=>!SHOT&&tryf(()=>!!(A&&A.interstitialEnabled&&A.interstitialEnabled()),false),
    showInterstitial:()=>{ if(SHOT)return; tryf(()=>A.showInterstitial()); },
  },
  push:{
    avail:()=>!!P,
    setCats:o=>tryf(()=>P&&P.setCats(JSON.stringify(o))),
    setReminders:l=>tryf(()=>P&&P.setReminders(JSON.stringify(l))),
    ask:()=>tryf(()=>P&&P.ask()),
    token:()=>tryf(()=>P&&P.token?P.token():'',''),
    takeOpen:()=>tryf(()=>{const s=P&&P.takeOpen?P.takeOpen():'';return s?JSON.parse(s):null},null),
  },
  auth:{
    vkAvail:()=>tryf(()=>!!(B&&B.vkAvail&&B.vkAvail()),false), vkLogin:()=>tryf(()=>B.vkLogin('ru')),
    yaAvail:()=>tryf(()=>!!(B&&B.yaAvail&&B.yaAvail()),false), yaLogin:()=>tryf(()=>B.yaLogin('ru')),
  },
  social:{
    name:'RuStore', cur:'₽',
    items:[
      ['gems_80','80 кристаллов','99 ₽','gem'],
      ['gems_250','250 кристаллов','249 ₽','gem'],
      ['coins_5000','5 000 монет','149 ₽','coin'],
      ['sub_freechat','Свободный чат (30 дн)','199 ₽','sub']
    ],
    pay:async id=>{
      if(W.RuStore&&W.RuStore.purchase){ try{ return !!(await W.RuStore.purchase(id)); }catch(e){ return false; } }
      if(B&&B.purchase){ try{ return !!(await B.purchase(id)); }catch(e){ return false; } }
      return false;
    }
  },
  levelEnd:()=>tryf(()=>W.RuStore&&W.RuStore.levelEnd&&W.RuStore.levelEnd()),
  setShop:()=>{},
};

const web={
  id:'web', version:()=>'0.8.2', canSign:()=>false, sign:()=>'',
  event:(n,o)=>{}, setConsent:()=>{}, rcInt:(k,d)=>d, rcBool:(k,d)=>d,
  ads:{slot:()=>0, banner:()=>{}, rewardedAvail:()=>!SHOT, showRewarded:k=>{ setTimeout(()=>W.__adResult&&W.__adResult(k,true),400); },
       interstitialOn:()=>false, showInterstitial:()=>{}},
  push:{avail:()=>false,setCats:()=>{},setReminders:()=>{},ask:()=>{},token:()=>'',takeOpen:()=>null},
  auth:{vkAvail:()=>false,vkLogin:()=>{},yaAvail:()=>false,yaLogin:()=>{}},
  social:null, levelEnd:()=>{}, setShop:()=>{},
};

const VB=W.vkBridge;
const isVK=!!(Q.get('vk_app_id')||Q.get('vk_platform'))&&!!VB;
const onOK=Q.get('vk_client')==='ok';
const vsend=(m,p)=>{try{return VB.send(m,p||{}).catch(()=>null)}catch(e){return Promise.resolve(null)}};
let vkRc={}, vkRw=false, vkBWant=false, vkBReady=false;
const vkBGo=()=>{ if(vkBReady||SHOT)return; vkBReady=true; if(vkBWant)vk.ads.banner(true); };
if(W.addEventListener){ W.addEventListener('pointerdown',()=>setTimeout(vkBGo,1500),{once:true}); setTimeout(vkBGo,30000); }

const VK_ITEMS=[['gems_80','80 кристаллов',3,'gem'],['gems_250','250 кристаллов',8,'gem'],['coins_5000','5 000 монет',5,'coin']];
const OK_ITEMS=[['gems_80','80 кристаллов',20,'gem'],['gems_250','250 кристаллов',55,'gem'],['coins_5000','5 000 монет',35,'coin']];

const vk={
  id:onOK?'ok':'vk', version:()=>'0.8.2', canSign:()=>false, sign:()=>'',
  user:null, launch:Object.fromEntries(Q.entries()), launchQS:location.search.slice(1),
  social:{
    name:onOK?'ОК':'VK', cur:onOK?'ОК':'голосов', onOK,
    items:onOK?OK_ITEMS.slice():VK_ITEMS.slice(),
    friends:()=>vsend('VKWebAppGetFriends',{multi:true}).then(r=>((r&&r.users)||[]).map(u=>({id:u.id,name:((u.first_name||'')+' '+(u.last_name||'')).trim()}))),
    invite:()=>vsend('VKWebAppShowInviteBox'),
    share:()=>vsend('VKWebAppShare',{link:'https://vk.com/app'+(Q.get('vk_app_id')||'')}),
    notifyAsk:()=>vsend('VKWebAppAllowNotifications'),
    pay:item=>vsend('VKWebAppShowOrderBox',{type:'item',item}).then(r=>!!(r&&(r.success||r.status==='success'))),
  },
  event:()=>{}, setConsent:()=>{},
  rcInt:(k,d)=>k in vkRc?(vkRc[k]|0):d, rcBool:(k,d)=>k in vkRc?!!vkRc[k]:d,
  ads:{
    slot:()=>0,
    banner:on=>{ if(SHOT)return; vkBWant=!!on; if(!vkBReady)return;
      if(on)vsend('VKWebAppShowBannerAd',{banner_location:'bottom',layout_type:'resize',can_close:false});
      else vsend('VKWebAppHideBannerAd'); },
    rewardedAvail:()=>!SHOT&&vkRw,
    showRewarded:k=>{ if(SHOT)return; vsend('VKWebAppShowNativeAds',{ad_format:'reward'}).then(r=>{ W.__adResult&&W.__adResult(k,!!(r&&r.result)); vkCheck(); }); },
    interstitialOn:()=>!SHOT, // gated by RC ads_interstitial_enabled in game
    showInterstitial:()=>{ if(SHOT)return; vsend('VKWebAppShowNativeAds',{ad_format:'interstitial'}); },
  },
  push:{avail:()=>true,setCats:()=>{},setReminders:()=>{},ask:()=>vk.social.notifyAsk(),token:()=>'',takeOpen:()=>null},
  auth:{vkAvail:()=>false,vkLogin:()=>{},yaAvail:()=>false,yaLogin:()=>{}},
  levelEnd:()=>{}, setRc:o=>{vkRc=o||{}}, setShop:()=>{},
};
function vkCheck(){ vsend('VKWebAppCheckNativeAds',{ad_format:'reward'}).then(r=>{vkRw=!!(r&&r.result)}); }
if(isVK){
  vsend('VKWebAppInit').then(()=>{ vkCheck(); return vsend('VKWebAppGetUserInfo'); })
    .then(u=>{ if(u&&u.id)vk.user={id:u.id,name:((u.first_name||'')+' '+(u.last_name||'')).trim()}; });
}

// Fotostrana
const isFS=!B&&!isVK&&!!(Q.get('apiId')&&Q.get('viewerId')&&Q.get('authKey'));
let fsC=null, fsP=null, fsRc={}; const fsPend=new Set();
const fsFail=()=>{ fsPend.forEach(f=>f(false)); fsPend.clear(); };
const fsLoad=()=>fsP||(fsP=new Promise(res=>{
  const cfg=W.FS_CFG||{}; let u=null;
  try{ u=new URL(Q.get('fsapi')||''); if(u.protocol==='http:')u.protocol='https:'; }catch(e){u=null}
  if(!u||u.protocol!=='https:'||!/(^|\.)(fotostrana\.ru|fsimg\.ru|fotocdn\.net)$/.test(u.hostname)||!cfg.clientKey){ return res(null); }
  const s=document.createElement('script'); s.src=u.href; s.async=true;
  s.onload=()=>{ try{ if(typeof W.fsapi!=='function')return res(null);
    fsC=new W.fsapi(Q.get('apiId')||cfg.appId,cfg.clientKey);
    fsC.init(e=>{ console.warn('fs api error',e&&e.errorText); fsFail(); }); res(fsC); }catch(e){ res(null); } };
  s.onerror=()=>res(null); document.head.appendChild(s);
}));
const FS_IMG=(W.FS_CFG&&W.FS_CFG.imgBase)||'';
const FS_ITEMS=[['gems_80','80 кристаллов',20,'gem',1],['gems_250','250 кристаллов',55,'gem',2],['coins_5000','5 000 монет',35,'coin',3]];
const fs={
  id:'fs', version:()=>'0.8.2', canSign:()=>false, sign:()=>'',
  user:null, launch:Object.fromEntries(Q.entries()), launchQS:location.search.slice(1),
  social:{
    name:'ФОТОСТРАНА', cur:'ФМ', noFriends:true, items:FS_ITEMS.slice(),
    ready:()=>fsLoad().then(c=>!!c),
    pay:key=>fsLoad().then(c=>new Promise(res=>{
      const it=fs.social.items.find(i=>i[0]===key); if(!c||!it)return res(false);
      const done=ok=>{ if(!fsPend.delete(done))return; res(ok); }; fsPend.add(done);
      try{ c.event('buyItemCallback',r=>done(!!(r&&r.result==='success')),
        Object.assign({itemId:it[4],name:it[1],priceFmCents:it[2]*100,amount:1,picUrl:FS_IMG+it[3]+'.png'},
          ((W.FS_CFG&&W.FS_CFG.debugViewerIds)||[]).map(String).includes(String(Q.get('viewerId')))?{isDebug:1}:{})); }catch(e){ done(false); }
    })),
    invite:()=>{}, share:()=>{},
  },
  event:()=>{}, setConsent:()=>{},
  rcInt:(k,d)=>k in fsRc?(fsRc[k]|0):d, rcBool:(k,d)=>k in fsRc?!!fsRc[k]:d,
  // FS has no ad SDK (offerwall only via getOfferWall — optional later)
  ads:{slot:()=>0, banner:()=>{}, rewardedAvail:()=>false, showRewarded:k=>{W.__adResult&&W.__adResult(k,false)}, noDemo:true,
       interstitialOn:()=>false, showInterstitial:()=>{}},
  push:{avail:()=>true,setCats:()=>{},setReminders:()=>{},
    ask:()=>fsLoad().then(c=>{ if(c)tryf(()=>c.event('appSettings',()=>{},{request_permission:32})); }),
    token:()=>'',takeOpen:()=>null},
  auth:{vkAvail:()=>false,vkLogin:()=>{},yaAvail:()=>false,yaLogin:()=>{}},
  levelEnd:()=>{}, setRc:o=>{fsRc=o||{}}, setShop:()=>{},
};
if(isFS){
  // FS iframe 950x800 clamp (like capyfarm)
  const FH=800, FW=950;
  const ih=Object.getOwnPropertyDescriptor(W,'innerHeight'), iw=Object.getOwnPropertyDescriptor(W,'innerWidth');
  tryf(()=>{ Object.defineProperty(W,'innerHeight',{configurable:true,get:()=>Math.min(ih.get.call(W),FH)});
    Object.defineProperty(W,'innerWidth',{configurable:true,get:()=>Math.min(iw.get.call(W),FW)}); });
  fs.user={id:Q.get('viewerId'),name:''};
  fsLoad();
}

const icon=(id,rw)=>(rw&&rw.coins&&!rw.gems)||/^coins/.test(id)?'coin':'gem';
function setShop(sh){
  if(!sh||typeof sh!=='object')return;
  const map=(list,withFs)=>(Array.isArray(list)?list:[]).filter(i=>i&&i.id&&+i.price>0&&(!withFs||i.fs_id))
    .map(i=>{const r=[String(i.id),String(i.title||i.id),+i.price,icon(i.id,i.reward)];if(withFs)r.push(+i.fs_id);return r;});
  if(vk.social) vk.social.items=map(sh[onOK?'ok':'vk'],false);
  if(fs.social) fs.social.items=map(sh.fs,true);
}
vk.setShop=fs.setShop=setShop; android.setShop=web.setShop=()=>{};
W.__setShop=setShop;
W.Platform=B?android:(isVK?vk:(isFS?fs:web));
W.__adResult=W.__adResult||null;
})();

// Unified facades (pay/share/storage) — game uses these; adapters stay source.
(function(){
  const P=window.Platform; if(!P) return;
  const W=window, B=W.AppBridge, tryf=(f,d)=>{try{return f()}catch(e){return d}};
  P.storage=P.storage||{
    get:k=>{try{return localStorage.getItem('eg_'+k)}catch(e){return null}},
    set:(k,v)=>{try{localStorage.setItem('eg_'+k,v)}catch(e){}},
    del:k=>{try{localStorage.removeItem('eg_'+k)}catch(e){}},
  };
  const AND_ITEMS=[['gems_80','80 кристаллов','99 ₽','gem'],['gems_250','250 кристаллов','249 ₽','gem'],['coins_5000','5 000 монет','149 ₽','coin'],['sub_freechat','Свободный чат (30 дн)','199 ₽','sub']];
  P.pay=P.pay||{
    items:()=>{
      if(P.social&&P.social.items&&P.social.items.length) return P.social.items;
      if(P.id==='android') return AND_ITEMS;
      if(P.id==='web') return AND_ITEMS.map(x=>[x[0],x[1],x[2]+' (ЮKassa)',x[3]]);
      return [];
    },
    purchase:async id=>{
      if(P.social&&P.social.pay){ const ok=await P.social.pay(id); if(ok) return true; }
      if(W.YooKassa&&W.YooKassa.checkout){ try{ return !!(await W.YooKassa.checkout(id)); }catch(e){} }
      if(B&&B.yookassa){ try{ return !!(await B.yookassa(id)); }catch(e){} }
      if(P.id==='web'){ console.info('[pay] YooKassa stub',id); return true; }
      return false;
    }
  };
  P.auth=P.auth||{};
  P.auth.tgAvail=P.auth.tgAvail||(()=>tryf(()=>!!(B&&B.tgAvail&&B.tgAvail()),false));
  P.auth.tgLogin=P.auth.tgLogin||(()=>tryf(()=>B.tgLogin&&B.tgLogin()));
  P.auth.ttAvail=P.auth.ttAvail||(()=>tryf(()=>!!(B&&B.ttAvail&&B.ttAvail()),false));
  P.auth.ttLogin=P.auth.ttLogin||(()=>tryf(()=>B.ttLogin&&B.ttLogin()));
  P.auth.okAvail=P.auth.okAvail||(()=>P.id==='ok'||tryf(()=>!!(B&&B.okAvail&&B.okAvail()),false));

  P.share=P.share||{
    invite:()=>{ if(P.social&&P.social.invite) return P.social.invite(); },
    link:url=>{ if(P.social&&P.social.share) return P.social.share();
      try{ navigator.clipboard&&navigator.clipboard.writeText(url||location.href);}catch(e){} },
  };
  // Future adapters (Yandex Games / iOS) plug in here with same Platform shape.
  P.__extensible=true;
})();
