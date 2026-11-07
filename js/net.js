(function(){
const BASE='https://d5dkao4fh5oe83poui3n.d8epmcec.apigw.yandexcloud.net';
const GAME='emogame';
const PL=()=>window.Platform;
const tryf=(f,d)=>{try{return f()}catch(e){return d}};
let pid='', secret='', skew=0;
const LS='eg_online';
try{ const j=JSON.parse(localStorage.getItem(LS)||'{}'); pid=j.pid||''; secret=j.secret||''; }catch(e){}
function saveCred(){ tryf(()=>localStorage.setItem(LS,JSON.stringify({pid,secret}))); }
function nonce(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}
function appVer(){
  const v=tryf(()=>PL()&&PL().version&&PL().version(),'');
  return (v&&String(v))||window.__EG_VER||'0.8.4.1';
}
/** Player-secret HMAC (Web Crypto). Never use native gsig here — that is game-key only. */
async function hmacPlayer(key,msg){
  if(!key) return '';
  const enc=new TextEncoder();
  const k=await crypto.subtle.importKey('raw',enc.encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sig=await crypto.subtle.sign('HMAC',k,enc.encode(msg));
  return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
/** Game-key HMAC via native AppBridge.gsig (Android). Empty on web/vk/fs. */
function hmacGame(msg){
  return tryf(()=>PL()&&PL().canSign&&PL().canSign()&&PL().sign?PL().sign(msg):'','');
}
async function post(action,d,useGameKey){
  const ts=Math.floor(Date.now()/1000)+skew;
  const payload={a:action,g:GAME,pid:pid||'0',ts,n:nonce(),d:d||{}};
  const p=JSON.stringify(payload);
  let s='';
  if(useGameKey){
    // Android: native game key; web/vk/fs: empty (server verifies launch params)
    s=hmacGame(p);
  }else{
    s=await hmacPlayer(secret,p);
  }
  const r=await fetch(BASE+'/v2/'+action,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({p,s}),cache:'no-store'});
  const j=await r.json().catch(()=>({}));
  if(r.status===401&&j&&j.now){ skew=j.now-Math.floor(Date.now()/1000); }
  return {ok:r.ok,status:r.status,j};
}
let _lastPush='';
async function registerPush(tok,on){
  if(!pid||!secret) return {ok:false,reason:'no_cred'};
  const token=(tok!=null?tok:tryf(()=>PL().push&&PL().push.token&&PL().push.token(),''))||'';
  if(!token) return {ok:false,reason:'no_token'};
  if(token===_lastPush&&on!==false) return {ok:true,cached:true};
  const plat=tryf(()=>PL().id,'web')||'web';
  const r=await post('push_token',{token,on:on!==false,platform:plat==='android'?'android':plat,ver:appVer(),tz:-new Date().getTimezoneOffset()});
  if(r.ok) _lastPush=token;
  return r;
}
/* 0.8.4.1 online: register once, queue stats, submit level score */
const QK='eg_online_q';
const STATS={feeds:1,sleeps:1,chats:1,park:1,concerts:1,play_sec:1,ads_watched:1,best_level:1};
let q=tryf(()=>JSON.parse(localStorage.getItem(QK)||'{}'),{})||{};
function saveQ(){ tryf(()=>localStorage.setItem(QK,JSON.stringify(q))); }
let regP=null, bootP=null, flushing=false, regNext=0;
function consented(){ return tryf(()=>!!JSON.parse(localStorage.getItem('eg_save')||'{}').consent,false); }
async function ensure(){
  if(pid&&secret) return true;
  if(Date.now()<regNext) return false;
  if(!regP) regP=Net.register().then(r=>{ regP=null; if(!(pid&&secret)) regNext=Date.now()+600000; return !!(pid&&secret); },e=>{ regP=null; regNext=Date.now()+120000; throw e; });
  return regP;
}
function addStat(name,n){
  if(!STATS[name]) return;
  n=Math.floor(Number(n)||0); if(n<=0) return;
  q.stats=q.stats||{};
  if(name==='best_level') q.stats[name]=Math.max(q.stats[name]||0,n); else q.stats[name]=(q.stats[name]||0)+n;
  saveQ();
}
async function flush(){
  if(flushing||!consented()) return {ok:false,reason:'busy_or_no_consent'};
  flushing=true;
  try{
    if(!await ensure()) return {ok:false,reason:'no_cred'};
    let res={ok:true};
    const st=q.stats;
    if(st&&Object.keys(st).length){
      const r=await post('progress',{stats:st});
      if(r.ok||r.status===422||r.status===400){ if(q.stats===st) delete q.stats; saveQ(); }
      res.progress=r.status;
    }
    if(q.level&&q.level>(q.levelSent||0)){
      const lv=q.level, r=await post('score',{board:'level',score:lv});
      if(r.ok||r.status===422) { q.levelSent=lv; saveQ(); }
      res.score=r.status;
    }
    return res;
  }catch(e){ return {ok:false,reason:String(e&&e.message||e)}; }
  finally{ flushing=false; }
}
const Net={
  ready:()=>!!pid&&!!secret,
  ensure,
  stat(name,n){ addStat(name,n); },
  level(lv){ lv=Math.floor(Number(lv)||0); if(lv<1) return; if(lv>(q.level||0)){ q.level=lv; saveQ(); } addStat('best_level',lv); },
  flush,
  /** One online start per session: register (once ever), sync, push token, flush. */
  boot(){
    if(!consented()) return Promise.resolve({ok:false,reason:'no_consent'});
    if(!bootP) bootP=(async()=>{
      if(!await ensure()) throw new Error('register failed');
      const s=await Net.sync();
      await registerPush().catch(()=>{});
      await flush();
      return s;
    })().catch(e=>{ bootP=null; return {ok:false,error:String(e&&e.message||e)}; });
    return bootP;
  },
  pid:()=>pid,
  ver:appVer,
  async register(){
    const plat=PL();
    const body={platform:plat&&plat.id==='android'?'android':(plat&&plat.id)||'web'};
    if(plat&&(plat.id==='vk'||plat.id==='ok')) body.platform=plat.id, body.vk=plat.launchQS||'';
    if(plat&&plat.id==='fs') body.platform='fotostrana', body.fs=plat.launchQS||'';
    if(plat&&plat.id==='telegram') body.platform='telegram', body.tg=plat.initData||'';
    const {ok,status,j}=await post('register',body,true);
    if(!ok) tryf(()=>console.warn('[net] register',status,j&&j.error));
    if(ok&&j&&j.player_id){ pid=j.player_id; secret=j.secret||secret; saveCred(); }
    if(ok&&j&&j.config&&window.__setShop) window.__setShop(j.config.shop||j.shop);
    return {ok,j};
  },
  async sync(){
    if(!pid) return {ok:false};
    const {ok,j}=await post('sync',{ver:appVer(),'d.ver':appVer(),lang:'ru'});
    if(ok&&j){
      if(j.player_id) pid=j.player_id;
      if(j.config&&window.__setShop) window.__setShop(j.config.shop||j.shop);
      if(j.config&&j.config.remote&&PL().setRc) PL().setRc(j.config.remote);
    }
    return {ok,j};
  },
  async progress(stats){ return post('progress',{stats}); },
  async pushToken(token,on){ return registerPush(token,on); },
  registerPush,
  ev(n){ tryf(()=>PL().event&&PL().event(n,{})); },
  async lobbyCreate(loc){ return post('lobby_create',{loc:loc||'park'}); },
  async lobbyJoin(code){ return post('lobby_join',{code}); },
  async lobbyState(code){ return post('lobby_state',{code}); },
  async giftSend(to,giftId){ return post('gift_send',{to,giftId}); },
};

/* 0.8.1 net timeout */
Object.keys(Net).forEach(function(k){ var f=Net[k]; if(typeof f!=='function')return;
  if(k==='boot'||k==='flush'||k==='ensure') return;
  Net[k]=function(){ var r=f.apply(Net,arguments); if(!r||typeof r.then!=='function')return r;
    return Promise.race([r,new Promise(function(_,rej){setTimeout(function(){rej(new Error('timeout'))},5000);})]); }; });
window.Net=Net;
window.__EG_VER='0.8.4.1';
/* periodic flush + play time (visible only) */
let lastT=Date.now();
setInterval(function(){
  const now=Date.now(); if(document.visibilityState==='visible'){ const d=Math.round((now-lastT)/1000); if(d>0&&d<120) addStat('play_sec',d); }
  lastT=now;
},15000);
setInterval(function(){ if(consented()) Net.boot().then(()=>flush()).catch(()=>{}); },60000);
document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='hidden'&&pid&&secret) flush().catch(()=>{}); else lastT=Date.now(); });
window.__pushPerm=(function(prev){ return function(ok){ try{ prev&&prev(ok); }catch(e){} if(ok) registerPush().catch(()=>{}); }; })(window.__pushPerm);
/** RuStore Push token refresh → backend push_token */
window.__pushToken=function(t){
  try{
    if(!t) return;
    if(window.Net&&Net.registerPush) Net.registerPush(String(t),true).catch(function(){});
  }catch(e){}
};
})();
