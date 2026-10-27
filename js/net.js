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
async function hmac(key,msg){
  if(PL().canSign&&PL().canSign()) return PL().sign(msg);
  if(!key) return '';
  const enc=new TextEncoder();
  const k=await crypto.subtle.importKey('raw',enc.encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sig=await crypto.subtle.sign('HMAC',k,enc.encode(msg));
  return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function post(action,d,useGameKey){
  const ts=Math.floor(Date.now()/1000)+skew;
  const payload={a:action,g:GAME,pid:pid||'0',ts,n:nonce(),d:d||{}};
  const p=JSON.stringify(payload);
  let s='';
  if(useGameKey){
    // web/vk/fs register: server verifies launch params; client sends s=""
    s='';
  }else{
    s=await hmac(secret,p);
  }
  const r=await fetch(BASE+'/v2/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({p,s})});
  const j=await r.json().catch(()=>({}));
  if(r.status===401&&j&&j.now){ skew=j.now-Math.floor(Date.now()/1000); }
  return {ok:r.ok,status:r.status,j};
}
const Net={
  ready:()=>!!pid&&!!secret,
  pid:()=>pid,
  async register(){
    const plat=PL();
    const body={};
    // platform launch params for server verification (vk/fs)
    if(plat.id==='vk'||plat.id==='ok') body.platform=plat.id, body.vk=plat.launchQS||'';
    if(plat.id==='fs') body.platform='fotostrana', body.fs=plat.launchQS||'';
    // Android uses game key via native sign on later calls; first register may use bridge
    const {ok,j}=await post('register',body,true);
    if(ok&&j&&j.player_id){ pid=j.player_id; secret=j.secret||secret; saveCred(); }
    if(ok&&j&&j.config&&window.__setShop) window.__setShop(j.config.shop||j.shop);
    return {ok,j};
  },
  async sync(){
    if(!pid) return {ok:false};
    const {ok,j}=await post('sync',{ver:'0.1.0',lang:'ru'});
    if(ok&&j){
      if(j.player_id) pid=j.player_id;
      if(j.config&&window.__setShop) window.__setShop(j.config.shop||j.shop);
      if(j.config&&j.config.remote&&PL().setRc) PL().setRc(j.config.remote);
    }
    return {ok,j};
  },
  async progress(stats){ return post('progress',{stats}); },
  async pushToken(token,on){ return post('push_token',{token,on:!!on}); },
  ev(n){ tryf(()=>PL().event&&PL().event(n,{})); },
  async lobbyCreate(loc){ return post('lobby_create',{loc:loc||'park'}); },
  async lobbyJoin(code){ return post('lobby_join',{code}); },
  async lobbyState(code){ return post('lobby_state',{code}); },
  async giftSend(to,giftId){ return post('gift_send',{to,giftId}); },
};

window.Net=Net;
})();
