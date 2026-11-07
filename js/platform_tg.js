// Telegram Mini App adapter for Emogame. Loaded after platform.js; overrides window.Platform when Telegram.WebApp is present.
// Portrait virtual-life game — no CSS rotation. Adsgram rewarded stub off until window.TG_ADSGRAM_BLOCK. No interstitials.
(function(){
const W=window, TW=W.Telegram&&W.Telegram.WebApp;
if(!TW)return;
const tryf=(f,d)=>{try{return f()}catch(e){return d}};
const DARK='#0a0a0c';

function applyChrome(){
  tryf(()=>TW.setHeaderColor&&TW.setHeaderColor(DARK));
  tryf(()=>TW.setBackgroundColor&&TW.setBackgroundColor(DARK));
  tryf(()=>TW.setBottomBarColor&&TW.setBottomBarColor(DARK));
  const r=document.documentElement, b=document.body;
  if(r){ r.style.background=DARK; r.style.backgroundColor=DARK; }
  if(b){ b.style.background=DARK; b.style.backgroundColor=DARK; }
}
applyChrome();
TW.ready();
tryf(()=>TW.expand());
if(TW.isVersionAtLeast&&TW.isVersionAtLeast('8.0')){
  tryf(()=>TW.requestFullscreen&&TW.requestFullscreen());
  tryf(()=>TW.disableVerticalSwipes&&TW.disableVerticalSwipes());
  tryf(()=>W.screen&&screen.orientation&&screen.orientation.lock&&screen.orientation.lock('portrait'));
  if((TW.viewportWidth||innerWidth)<=(TW.viewportStableHeight||TW.viewportHeight||innerHeight))
    tryf(()=>TW.lockOrientation&&TW.lockOrientation());
}
applyChrome();

const theme=()=>{ applyChrome();
  const s=TW.themeParams||{}, r=document.documentElement;
  if(s.button_color)r.style.setProperty('--tg-btn',s.button_color);
  if(s.text_color)r.style.setProperty('--tg-fg',s.text_color);
  r.style.setProperty('--tg-bg', DARK);
};
theme(); TW.onEvent&&TW.onEvent('themeChanged',theme);

if(!document.getElementById('tg-shell-css')){
  const st=document.createElement('style'); st.id='tg-shell-css';
  st.textContent='html,body,#root{background:'+DARK+'!important;background-color:'+DARK+'!important;}'+
    'html,body{overscroll-behavior:none;}'+
    '#bannerStrip{display:none!important;}'+
    '#root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);}';
  (document.head||document.documentElement).appendChild(st);
}

const BOT='emogame_play_bot', APP='play';
const APP_LINK='https://t.me/'+BOT+'/'+APP;
const BASE=(W.Net&&W.Net.BASE)||'https://d5dkao4fh5oe83poui3n.d8epmcec.apigw.yandexcloud.net';
const GAME='emogame';
const GPI={
  gems_80:{gems:80},
  gems_250:{gems:250},
  coins_5000:{coins:5000},
};
const ITEMS=[
  ['gems_80','80 кристаллов','50 ⭐','gem'],
  ['gems_250','250 кристаллов','100 ⭐','gem'],
  ['coins_5000','5 000 монет','250 ⭐','coin'],
];

let tgRc={}, cloudT=0;
const uid=()=>{ const u=TW.initDataUnsafe&&TW.initDataUnsafe.user; return u&&u.id?String(u.id):''; };
const uname=()=>{ const u=TW.initDataUnsafe&&TW.initDataUnsafe.user; if(!u)return '';
  return ((u.first_name||'')+' '+(u.last_name||'')).trim()||(u.username?('@'+u.username):''); };

function cloudPull(){
  const CS=TW.CloudStorage; if(!CS||!CS.getItem)return;
  tryf(()=>CS.getItem('eg_save',(e,v)=>{ if(e||!v)return;
    const local=tryf(()=>localStorage.getItem('eg_save'),null);
    if(!local) tryf(()=>localStorage.setItem('eg_save',v));
  }));
}
function cloudPush(v){
  const CS=TW.CloudStorage; if(!CS||!CS.setItem)return;
  clearTimeout(cloudT); cloudT=setTimeout(()=>tryf(()=>CS.setItem('eg_save',String(v),()=>{})),800);
}
cloudPull();
(function(){ const sI=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){ sI.call(this,k,v); if(this===W.localStorage&&k==='eg_save')cloudPush(v); };
})();

tryf(()=>{ const BB=TW.BackButton; if(!BB)return;
  BB.show(); BB.onClick(()=>{ try{ if(W.__egBack)return W.__egBack(); }catch(e){}
    tryf(()=>TW.close()); });
});

const hap=(t)=>{ tryf(()=>{ const H=TW.HapticFeedback; if(!H)return;
  if(t==='success')H.notificationOccurred('success');
  else if(t==='error')H.notificationOccurred('error');
  else H.impactOccurred('light'); }); };

function creditLocal(key){
  const r=GPI[key]; if(!r)return;
  try{
    const live=W.S;
    if(live){
      if(r.gems) live.gems=(live.gems|0)+r.gems;
      if(r.coins) live.coins=(live.coins|0)+r.coins;
      if(W.EGSave&&EGSave.persist) EGSave.persist(live);
    }else if(W.EGSave&&EGSave.load){
      const s=EGSave.load();
      if(r.gems) s.gems=(s.gems|0)+r.gems;
      if(r.coins) s.coins=(s.coins|0)+r.coins;
      EGSave.persist(s);
    }
    if(W.toast) W.toast(r.gems?('+'+r.gems+' кристаллов'):('+'+r.coins+' монет'));
  }catch(e){}
}

const AG_BLOCK=W.TG_ADSGRAM_BLOCK||'';
let agReady=false, agBusy=false;
function agLoad(){ if(!AG_BLOCK||agReady)return Promise.resolve(!!AG_BLOCK&&!!W.Adsgram);
  return new Promise(res=>{ const s=document.createElement('script'); s.src='https://sad.adsgram.ai/js/sad.min.js'; s.async=true;
    s.onload=()=>{agReady=true;res(!!W.Adsgram)}; s.onerror=()=>res(false); document.head.appendChild(s); }); }

const tg={
  id:'telegram', version:()=>'0.8.4.1', canSign:()=>false, sign:()=>'',
  user:uid()?{id:uid(),name:uname()}:null,
  initData:TW.initData||'', launch:TW.initDataUnsafe||{}, launchQS:'',
  social:{
    name:'Telegram', cur:'⭐', noFriends:true, items:ITEMS.slice(),
    ready:()=>Promise.resolve(!!(TW.initData&&TW.openInvoice)),
    pay:key=>new Promise(async res=>{
      if(!TW.initData||!TW.openInvoice){res(false);return;}
      if(!GPI[key]){res(false);return;}
      hap('light');
      let j; try{
        const r=await fetch(BASE+'/tg/invoice/'+GAME,{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({initData:TW.initData,item:key})});
        j=await r.json();
      }catch(e){res(false);return;}
      if(!j||!j.url){res(false);return;}
      TW.openInvoice(j.url, st=>{
        if(st==='paid'){ creditLocal(key); hap('success'); res(true); }
        else { hap('error'); res(false); }
      });
    }),
    share:()=>{ const link=APP_LINK+'?startapp=ref_'+(uid()||'0');
      if(TW.switchInlineQuery){ tryf(()=>TW.switchInlineQuery('Играй в Emogame! '+link,['users','groups','channels'])); return; }
      if(TW.openTelegramLink) tryf(()=>TW.openTelegramLink('https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent('Эмо-жизнь прямо в Telegram!')));
      else if(navigator.share) navigator.share({text:'Играй в Emogame! '+link}).catch(()=>{});
    },
    support:'https://t.me/'+BOT,
  },
  event:(n,o)=>{}, setConsent:()=>{},
  rcInt:(k,d)=>k in tgRc?(tgRc[k]|0):d, rcBool:(k,d)=>k in tgRc?!!tgRc[k]:d,
  ads:{
    slot:()=>0,
    banner:()=>{},
    noDemo:true,
    rewardedAvail:()=>!!(AG_BLOCK&&W.Adsgram&&!agBusy),
    noAdMsg:'Реклама пока недоступна',
    showRewarded:k=>{ if(!AG_BLOCK){W.__adResult&&W.__adResult(k,false);return;}
      agLoad().then(ok=>{ if(!ok||!W.Adsgram){W.__adResult&&W.__adResult(k,false);return;}
        try{ const c=W.Adsgram.init({blockId:AG_BLOCK}); agBusy=true;
          c.show().then(r=>{agBusy=false;W.__adResult&&W.__adResult(k,!!(r&&r.done));})
           .catch(()=>{agBusy=false;W.__adResult&&W.__adResult(k,false);});
        }catch(e){agBusy=false;W.__adResult&&W.__adResult(k,false);}
      }); },
    interstitialOn:()=>false,
    showInterstitial:()=>{},
  },
  push:{avail:()=>false,setCats:()=>{},setReminders:()=>{},ask:()=>{},token:()=>'',takeOpen:()=>null},
  auth:{vkAvail:()=>false,vkLogin:()=>{},yaAvail:()=>false,yaLogin:()=>{},
    tgAvail:()=>true, tgLogin:()=>{ try{ if(W.EGAuth&&EGAuth.login) EGAuth.login('telegram'); }catch(e){} }},
  levelEnd:()=>{},
  setRc:o=>{tgRc=o||{}},
  setShop:sh=>{ if(!sh||!Array.isArray(sh.tg))return;
    const map=(list)=>(list||[]).filter(i=>i&&i.id&&+i.price>0).map(i=>[String(i.id),String(i.title||i.id),+i.price,/^coins/.test(i.id)?'coin':'gem']);
    const m=map(sh.tg); if(m.length)tg.social.items=m; },
};

W.Platform=tg;
(function(P){const cut=v=>String(v||'').slice(0,60);
 P.STORE_URL=APP_LINK;
 P.deviceInfo=()=>{const n=navigator,ua=n.userAgent||'',m=ua.match(/Android [\d.]+|iPhone OS [\d_]+|Windows NT [\d.]+|Mac OS X [\d_.]+|Linux|CrOS/);
  return {lang:cut((TW.initDataUnsafe&&TW.initDataUnsafe.user&&TW.initDataUnsafe.user.language_code)||(navigator.language||'ru').slice(0,5)),
    platform:'telegram',model:cut((n.userAgentData&&n.userAgentData.platform)||n.platform||''),
    os:cut(m?m[0].replace(/_/g,'.'):''),device:cut(/Mobi|Android|iPhone/.test(ua)?'mobile':'desktop')};};
 P.canShare=()=>true;
 const doShare=t=>{ const link=APP_LINK+'?startapp=ref_'+(uid()||'0'); const text=(t||'Играй в Emogame!')+' '+link;
   if(TW.switchInlineQuery)tryf(()=>TW.switchInlineQuery(text,['users','groups','channels']));
   else if(TW.openTelegramLink)tryf(()=>TW.openTelegramLink('https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent(t||'Эмо-жизнь в Telegram!')));
   else if(navigator.share)navigator.share({text}).catch(()=>{}); };
 P.shareGame=doShare;
 P.canRate=()=>false; P.rate=()=>{}; P.openStore=()=>tryf(()=>TW.openTelegramLink&&TW.openTelegramLink(APP_LINK));
 P.haptic=hap;
 P.storage={
   get:k=>{try{return localStorage.getItem('eg_'+k)}catch(e){return null}},
   set:(k,v)=>{try{localStorage.setItem('eg_'+k,v)}catch(e){}},
   del:k=>{try{localStorage.removeItem('eg_'+k)}catch(e){}},
 };
 P.pay={
   items:()=>(P.social&&P.social.items)||ITEMS.slice(),
   purchase:async id=>{ if(P.social&&P.social.pay) return !!(await P.social.pay(id)); return false; },
 };
 P.share={ invite:()=>doShare(), link:url=>doShare(url) };
})(tg);

// Re-run facade piece that platform.js attached to previous Platform — ensure pay facade
(function(){
  const P=W.Platform; if(!P)return;
  if(!P.pay||!P.pay.purchase){
    P.pay={ items:()=>(P.social&&P.social.items)||[], purchase:async id=>P.social&&P.social.pay?!!(await P.social.pay(id)):false };
  }
})();

tryf(()=>{ const sp=TW.initDataUnsafe&&TW.initDataUnsafe.start_param; if(sp&&/^ref_/.test(sp)) tryf(()=>sessionStorage.setItem('eg_ref',sp.slice(4))); });

const relayout=()=>{ applyChrome();
  if((TW.viewportWidth||innerWidth)<=(TW.viewportStableHeight||TW.viewportHeight||innerHeight))
    tryf(()=>TW.lockOrientation&&TW.lockOrientation());
  tryf(()=>W.EGFit&&EGFit());
  tryf(()=>W.dispatchEvent(new Event('resize')));
};
['viewportChanged','safeAreaChanged','contentSafeAreaChanged','fullscreenChanged'].forEach(ev=>{
  tryf(()=>TW.onEvent&&TW.onEvent(ev, relayout));
});
setTimeout(()=>{ if(TW.isVersionAtLeast&&TW.isVersionAtLeast('8.0')&&!TW.isFullscreen)
  tryf(()=>TW.requestFullscreen&&TW.requestFullscreen()); applyChrome(); relayout(); }, 400);
setTimeout(()=>{ if(TW.isVersionAtLeast&&TW.isVersionAtLeast('8.0')&&!TW.isFullscreen)
  tryf(()=>TW.requestFullscreen&&TW.requestFullscreen()); applyChrome(); }, 1200);

W.__tgPlatform=tg;
W.__setShop=function(sh){ try{ tg.setShop(sh); }catch(e){} };
})();
