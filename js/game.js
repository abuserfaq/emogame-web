// Emogame shell — modules + content packs + daily care + gifts
(function(){
const $=s=>document.querySelector(s), app=$('#app');
const PL=window.Platform, W=window;
const SHOT=!!new URLSearchParams(location.search).get('scr');
if(SHOT) document.documentElement.classList.add('shot-mode','shot-hide-ads');

let S, EG, cur='';
const save=()=>EGSave.persist(S);
const clamp=(v,a,b)=>EG.clamp(v,a,b);
const egA=(ev,p)=>{ try{ if(window.EGAudio) EGAudio.emit(ev,p||{}); }catch(e){} };
const ico=(k,c)=>window.EGUI?EGUI.icon(k,c):'';
window.toast=function(t){ [...document.querySelectorAll('body>.toast')].forEach(x=>x.remove());
  const e=document.createElement('div'); e.className='toast eg-toast'; e.textContent=t;
  Object.assign(e.style,{position:'fixed',zIndex:'9999',left:'0',top:'0',bottom:'auto',transform:'none',visibility:'hidden',boxSizing:'border-box'});
  document.body.appendChild(e); window.EGToastPlace(e);
  e.style.visibility='visible'; setTimeout(()=>e.style.opacity=0,1600); setTimeout(()=>e.remove(),2100);
  /* 0.8.4: layout can change after the toast appears (character placed after load) -> re-place if it now overlaps anything */
  const iv=setInterval(()=>{ if(!e.isConnected){ clearInterval(iv); return; } const r=e.getBoundingClientRect(); if(window.EGToastBlockers().some(b=>Math.min(r.right,b.right)>Math.max(r.left,b.left)&&Math.min(r.bottom,b.bottom)>Math.max(r.top,b.top))) window.EGToastPlace(e); },120); };
// 0.8.2: place transient popups only in free scene area (never over HUD/panels/nav/banner/controls)
window.EGToastBlockers=function(){ const out=[]; const add=el=>{ if(!el||el.classList.contains('toast')) return; const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0) return; const r=el.getBoundingClientRect(); if(r.width>2&&r.height>2) out.push(r); };
  const scr=document.querySelector('#app .screen')||document.querySelector('#app');
  if(scr) [...scr.children].forEach(c=>{ if(c.matches('.stage-bleed,.act-layer,.ambient,.bg,img.bg')) return; const r=c.getBoundingClientRect(); if(r.width>=innerWidth*0.95&&r.height>=innerHeight*0.9) return; add(c); });
  { const cw=document.getElementById('charWrap'); if(cw&&!document.querySelector('.sleep-dim')){ const im=cw.querySelector('.char')||cw; const r=im.getBoundingClientRect(); if(r.width>2) out.push(r); } } /* 0.8.4: popups never cover the character */
  document.querySelectorAll('#app button, #app .act-spot, #app input, #app a, #bannerStrip, .eg-sheet-root, #app .nav-dock, #app nav').forEach(el=>{ if(!el.closest('.toast')) add(el); });
  return out; };
window.EGToastPlace=function(e){ const W=innerWidth,H=innerHeight,M=8,B=window.EGToastBlockers(); const ban=document.getElementById('bannerStrip'); const lim=ban?Math.min(H,ban.getBoundingClientRect().top||H):H;
  let best=null;
  for(let y=M;y<lim-30;y+=4){ // free horizontal intervals for band [y, y+hEst]
    for(const hEst of [36,56,76,96]){ const iv=[[M,W-M]]; B.forEach(r=>{ if(r.bottom<=y-M/2||r.top>=y+hEst+M/2) return; for(let k=iv.length-1;k>=0;k--){ const [a,b]=iv[k]; const L=r.left-M/2,R=r.right+M/2; if(R<=a||L>=b) continue; const n=[]; if(L>a) n.push([a,L]); if(R<b) n.push([R,b]); iv.splice(k,1,...n);} });
      iv.forEach(([a,b])=>{ const w=Math.min(b-a,320); if(w<(hEst>56?118:150)) return; const sc=Math.min(w,260)*2-Math.abs((y+hEst/2)-H*0.42)*0.6-(hEst>56?hEst*3:0); if(!best||sc>best.sc) best={sc,a,b,w,y,hEst}; }); } }
  if(!best){ e.style.left=M+'px'; e.style.top=M+'px'; e.style.maxWidth=(W-2*M)+'px'; return; }
  e.style.width=best.w+'px'; e.style.maxWidth=best.w+'px'; e.style.fontSize=''; let h=e.getBoundingClientRect().height;
  let fs=parseFloat(getComputedStyle(e).fontSize)||14; while(h>best.hEst&&fs>10){ fs-=1; e.style.fontSize=fs+'px'; h=e.getBoundingClientRect().height; }
  e.style.left=Math.round(best.a+(best.b-best.a-best.w)/2)+'px'; e.style.top=Math.round(best.y+(best.hEst-h)/2)+'px'; };

function tickNeeds(){
  const now=Date.now(), dt=Math.min(12*3600e3, Math.max(0, now-S.lastTick))/3600e3;
  if(dt>0){
    if(window.EGModules) EGModules.tickAll(dt,S);
    else { /* fallback minimal */ }
    S.lastTick=now; save();
  }
}
function phase(){ const q=new URLSearchParams(location.search); const o=q.get('phase')||window.__EG_PHASE; if(o&&['morning','day','evening','night'].includes(o)) return o; return EG.phaseOf(new Date().getHours()); }
function xpNeed(lv){ return 80+lv*40; }
function addXp(n){ S.xp+=n; const prev=S.level;
  while(S.xp>=xpNeed(S.level)){ S.xp-=xpNeed(S.level); S.level++; toast('Уровень '+S.level+'!'); egA('level_up'); }
  if(S.level>prev){ if(window.EGUnlocks) EGUnlocks.onLevel(S,prev); if(window.EGAch){ const u=EGAch.check(S); u.forEach(a=>{toast('Ачивка: '+a.name); egA('achievement');}); } } }

function clear(){ app.innerHTML=''; }
function setPhaseClass(){ app.className='phase-'+phase(); }
function unlockOk(loc){ if(window.EGUnlocks) return EGUnlocks.locOk(S,loc.id); return S.level>=(loc.minLevel||1); }

function careBanner(){
  const line=EGCare?EGCare.statusLine(S):'';
  const warn=EGCare&&(S.hunger<25||S.thirst<25||EGCare.dirtTotal(S)>100);
  const st=S.streak||{n:0};
  return `<div class="care-banner ${warn?'warn':''}">${line}
    <div style="margin-top:6px"><span class="streak-pill">${ico('streak')} серия ${st.n||0} дн.</span>
    · заходи каждый день: корми, убирай, пои</div></div>`;
}
/* 0.8.4: dirtRow removed (not in home mock; cleaning via room hotspots) */
function bindClean(){
  app.querySelectorAll('[data-clean]').forEach(b=>b.onclick=()=>{
    const kind=b.dataset.clean;
    if(window.EGAnim&&window.EGAnim.busy()){ egA('tap'); riFlash(b); toast('Сначала доделаю начатое'); return; }
    /* 0.8.4: clean IN PLACE with its own AI animation (no walking off), natural speed */
    const ms=window.EGAnim?window.EGAnim.act('clean_'+kind, 3200, ()=>{}):3200;
    egA(kind==='trash'?'trash':kind==='dishes'?'dishes':kind==='laundry'?'laundry':'clean');
    setTimeout(()=>{
      EGCare.clean(S,kind); qAdd('cleans',1); addXp(6); save();
      toast('Чисто!'); go(cur==='home'?'home':cur);
    }, ms);
  });
}

const LOC_RU={park:'Парк',cemetery:'Кладбище',metro:'Метро',cafe:'Кафе',concert:'Концерт',rooftop:'Крыша',records:'Пластинки',skate:'Скейт-парк',arcade:'Аркада',karaoke:'Караоке',tattoo:'Тату-салон',mall:'ТЦ',school:'Колледж',garage:'Гараж',factory:'Завод',embankment:'Набережная',station:'Вокзал',festival:'Фестиваль',idol_stage:'Айдол-сцена',nightclub:'Ночной клуб',bookcafe:'Книжное кафе',beach:'Пляж',room:'Комната'};
function locName(id){ return LOC_RU[id]||''; }
function avatarSrc(style,gender){
  const s=(style||S.style||'emo'), g=(gender||S.gender||'guy');
  return `img/ui/avatars/${s}_${g}.webp`;
}
function peerAvatar(name){
  const map={
    'Лила':'lila','Lila':'lila',
    'ДемонX':'demonx','ДемонХ':'demonx','DemonX':'demonx',
    'Кошмарик':'koshmarik',
    'raven':'raven','Raven':'raven'
  };
  const k=map[name]||'lila';
  return `img/ui/avatars/${k}.webp`;
}

function fmtNum(n){ n=Math.round(+n||0); return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' '); }
function hudHTML(){
  const rows=[['Голод',S.hunger,'hunger'],['Жажда',S.thirst,'thirst'],['Энергия',S.energy,'energy'],['Настрой',S.mood,'mood']];
  const need=xpNeed(S.level); const pct=Math.round(clamp((S.xp/need)*100,0,100));
  return `<div class="hud">
    <div class="hud-stats">${rows.map(([l,v,i])=>`<div class="hud-stat"><div class="lab">${ico(i)}<span class="lab-t">${l}</span></div><div class="bar"><i style="width:${clamp(v,0,100)}%"></i></div></div>`).join('')}</div>
    <div class="hud-res">
      <div class="hud-res-box">
        <div class="hud-chip">${ico('coins')} ${fmtNum(S.coins)}</div>
        <div class="hud-chip">${ico('gems')} ${fmtNum(S.gems)}</div>
        <div class="hud-chip xp">${ico('level')} ${S.level}<div class="xpbar"><i style="width:${pct}%"></i><span>${pct}%</span></div></div>
      </div>
      <button class="hud-gear" id="hudGear" type="button">${ico('settings')}</button>
    </div>
  </div>`;
}
function statRow(){
  // legacy fallback for older screens
  return hudHTML().replace('class="hud"','class="hud" style="position:relative;padding-bottom:8px"');
}
function nav(active){
  const inboxN=(S.gifts&&S.gifts.inbox||[]).filter(m=>!m.seen).length;
  // icon key uses nav_*_mock for larger mock-matched glyphs; sub = heart|x|dots|none
  const items=[
    ['home','nav_home_mock','Дом','heart'],
    ['feed','nav_food_mock','Еда',''],
    ['map','nav_map_mock','Карта','x'],
    ['gifts','nav_gifts_mock','Подарки','heart'],
    ['chat','nav_chat_mock','Чат','dots']
  ];
  const subSvg={
    heart:'<svg class="nav-sub" viewBox="0 0 12 10" aria-hidden="true"><path fill="#ff2d78" d="M6 9.2L1.2 4.6C.2 3.6.3 2 1.5 1.3 2.5.7 3.8.9 4.5 1.8L6 3.5l1.5-1.7C8.2.9 9.5.7 10.5 1.3c1.2.7 1.3 2.3.3 3.3L6 9.2z"/></svg>',
    x:'<svg class="nav-sub" viewBox="0 0 10 10" aria-hidden="true"><path stroke="#ff8fb8" stroke-width="1.8" d="M2 2l6 6M8 2L2 8"/></svg>',
    dots:'<svg class="nav-sub" viewBox="0 0 14 6" aria-hidden="true"><circle cx="2" cy="3" r="1.5" fill="#ff8fb8"/><circle cx="7" cy="3" r="1.5" fill="#ff8fb8"/><circle cx="12" cy="3" r="1.5" fill="#ff8fb8"/></svg>',
    '':''
  };
  return `<div class="nav-dock"><img class="nav-ornament tl" src="img/ui/chrome/nav_bracket_bl.webp" alt=""><img class="nav-ornament tr" src="img/ui/chrome/nav_bracket_br.webp" alt=""><img class="nav-ornament bl" src="img/ui/chrome/nav_bracket_bl.webp" alt=""><img class="nav-ornament br" src="img/ui/chrome/nav_bracket_br.webp" alt="">${items.map(([id,ic,lab,sub])=>{
    const badge=(id==='chat'&&inboxN)?`<span class="nav-badge">${inboxN}</span>`:'';
    const icUse=(id==='chat'&&active==='chat')?'nav_chat_batwing':ic;
    return `<button data-go="${id}" class="${active===id?'on':''}${id==='chat'&&active==='chat'?' chat-bat':''}" type="button"><span class="ic">${ico(icUse)}</span><span class="lab">${lab}</span>${subSvg[sub]||''}${badge}</button>`;
  }).join('')}</div>`;
}
function dirtHotspots(){
  const d=S.dirt||{trash:0,dishes:0,laundry:0};
  const mk=(k,cls)=>{
    const n=Math.round(d[k]||0); if(n<=0) return '';
    return `<button class="hot ${cls}" data-clean="${k}" type="button"><img src="img/props/${k}.webp" alt=""><span class="n">${n}</span></button>`;
  };
  return `<div class="dirt-hotspots">${mk('trash','hot-trash')}${mk('dishes','hot-dishes')}${mk('laundry','hot-laundry')}</div>`;
}
function roomInteract(){
  return `<div class="room-interact">
    <button class="ri hot-bed" data-ri="bed" type="button" title="Кровать"></button>
    <button class="ri hot-fridge" data-ri="fridge" type="button" title="Холодильник"></button>
    <button class="ri hot-window" data-ri="window" type="button" title="Окно"></button>
    <button class="ri hot-table" data-ri="table" type="button" title="Стол"></button>
  </div>`;
}
const SLEEP_CD=4*3600*1000; /* 0.8.3: full sleep every 4h (daily engagement: 3-4 naps a day) */
function sleepLeft(){ return Math.max(0,(S.sleepNext||0)-Date.now()); }
function fmtLeft(ms){ const m=Math.ceil(ms/60000),h=Math.floor(m/60); return h?(h+' ч '+(m%60)+' мин'):(m+' мин'); }
function riFlash(b){ if(!b) return; b.classList.remove('tapped'); void b.offsetWidth; b.classList.add('tapped'); setTimeout(()=>b.classList.remove('tapped'),900); }
function startSleep(){
  if(cur!=='home') return;
  const scr=app.querySelector('.screen.home-mode'); const wrap=$('#charWrap'); if(!scr||!wrap) return;
  if(scr.classList.contains('sleeping')) return;
  const left=sleepLeft();
  walkCharTo('.hot-bed','idle');
  if(left>0){ setTimeout(()=>{ if(cur==='home') toast('Пока не хочется спать · приходи через '+fmtLeft(left)); },1500); return; }
  const g0={e:S.energy,m:S.mood};
  S.energy=clamp((S.energy||0)+55,0,100); S.mood=clamp((S.mood||0)+10,0,100); S.hunger=clamp((S.hunger||0)-8,0,100);
  S.dirt=S.dirt||{}; S.dirt.laundry=clamp((S.dirt.laundry||0)+15,0,100);
  S.sleeps=(S.sleeps||0)+1; qAdd('sleeps',1); addXp(8); S.sleepNext=Date.now()+SLEEP_CD; save();
  const T=W.__sleepT=[]; const at=(ms,f)=>T.push(setTimeout(()=>{ if(cur==='home'&&scr.isConnected) f(); },ms));
  at(1500,()=>{
    scr.classList.add('sleeping'); wrap.style.removeProperty('left'); wrap.style.removeProperty('bottom'); wrap.classList.add('on-bed');
    if(window.EGAnim) window.EGAnim.play('sleep'); egA('sleep');
    const ov=document.createElement('div'); ov.className='sleep-dim'; ov.innerHTML='<div class="zzz"><i>z</i><i>z</i><i>Z</i></div><div class="sleep-card"><b>Сон</b><span>+'+Math.round(S.energy-g0.e)+' энергии · +'+Math.round(S.mood-g0.m)+' настрой</span><button class="btn" id="wakeBtn" type="button">Проснуться</button></div>';
    scr.appendChild(ov); ov.querySelector('#wakeBtn').onclick=()=>wakeUp();
    egA('snore'); T.push(setInterval(()=>{ if(cur==='home') egA('snore'); },2600));
    at(10000,()=>wakeUp());
  });
  function wakeUp(){ (W.__sleepT||[]).forEach(x=>{clearTimeout(x);clearInterval(x);}); W.__sleepT=[]; if(cur!=='home'||!scr.isConnected) return;
    egA('wake'); const ov=scr.querySelector('.sleep-dim'); if(ov) ov.classList.add('out');
    setTimeout(()=>{ if(cur!=='home') return; scr.classList.remove('sleeping'); wrap.classList.remove('on-bed'); if(ov) ov.remove(); if(window.EGAnim) window.EGAnim.play('happy'); toast('Доброе утро! Энергия '+Math.round(S.energy)); setTimeout(()=>{ if(cur==='home'&&window.EGAnim) window.EGAnim.fromNeeds(S); },1500); },600);
  }
}
function bindRoomInteract(){
  app.querySelectorAll('[data-ri]').forEach(b=>b.onclick=()=>{
    const kind=b.dataset.ri; riFlash(b); egA('tap');
    if(app.querySelector('.screen.sleeping')) return;
    if(kind==='bed') return startSleep();
    if(window.EGAnim&&window.EGAnim.busy()) return;
    /* 0.8.4: each room action has its own AI animation, performed in place */
    if(window.EGAnim) window.EGAnim.act(kind, 3000, ()=>{ if(cur==='home') window.EGAnim.fromNeeds(S); });
    setTimeout(()=>{
      if(kind==='fridge'||kind==='table'){ S.hunger=Math.min(100,(S.hunger||0)+8); S.thirst=Math.min(100,(S.thirst||0)+6); egA(kind==='fridge'?'eat':'drink'); toast(kind==='fridge'?'Перекус':'Глоток'); }
      else { S.mood=Math.min(100,(S.mood||0)+5); egA('happy'); toast('У окна…'); }
      save();
    }, 900);
  });
}
function bindNav(){ app.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{ egA('tab'); go(b.dataset.go); })); }

function go(n,a){ if(n!==cur) document.querySelectorAll('body>.toast').forEach(x=>x.remove()); /* 0.8.3: toasts never leak onto the next screen */ (W.__sleepT||[]).forEach(x=>{clearTimeout(x);clearInterval(x);}); W.__sleepT=[]; if(typeof SCR[n]!=='function'){ if(n==='room') n='home'; else if(EG.LOCS&&EG.LOCS.some(l=>l.id===n)){ a=n; n='loc'; } else n='home'; } tickNeeds(); clear(); setPhaseClass(); if(n!==cur) egA('tap'); cur=n; try{ const ph=phase(); const sm=(W.EGAudio&&EGAudio.map&&EGAudio.map.screenMusic)||{}; const loc=(n==='loc'&&a)?a:(n==='home'?'room':(sm[n]?null:(S&&S.loc))); egA('scene',{screen:n,loc:loc,phase:ph,weather:S&&S.weather}); }catch(e){} 
  const bannerOn=S.consent!=null && n!=='consent' && n!=='consentSet' && n!=='onboardCare' && n!=='create' && !SHOT;
  const nativeAds=!!(window.AdBridge); // Android Yandex banner lives outside WebView
  if(nativeAds) document.documentElement.classList.add('eg-native-ads');
  PL.ads.banner(bannerOn);
  if(window.EGModules) EGModules.onScreen(n,S);
  SCR[n](a); bindNav();
  // Web placeholder only for web/VK; on Android hide it (native banner fills bottom slot)
  let bs=document.getElementById('bannerStrip');
  if(nativeAds){
    if(bs){ bs.classList.remove('on'); bs.setAttribute('aria-hidden','true'); bs.style.display='none'; }
  } else {
    if(!bs){
      bs=document.createElement('div'); bs.id='bannerStrip';
      bs.innerHTML='<span class="ad-label">реклама</span>';
    }
    if(bannerOn){ bs.classList.add('on'); bs.setAttribute('aria-hidden','false'); bs.style.display=''; }
    else { bs.classList.remove('on'); bs.setAttribute('aria-hidden','true'); }
    document.body.appendChild(bs);
  }
  // 0.8.0: banner lives in its own slot BELOW #app; #app shrinks so nav never covers / sits over it
  try{
    const shot=document.documentElement.classList.contains('shot-mode')||document.documentElement.classList.contains('shot-hide-ads')||/[?&]scr=1/.test(location.search);
    let h=0; if(bannerOn&&!shot){ h=nativeAds?0:50; /* 0.8.2: native WebView is already shrunk above the banner slot (setWebBottom) — no second CSS reserve */ }
    document.documentElement.style.setProperty('--ad-h',h+'px');
    document.documentElement.classList.toggle('ad-on',h>0);
  }catch(e){}
  try{ PL.event('screen',{n}); }catch(e){}
}

const SCR={};

if(!window.__hudGearDelegate){ window.__hudGearDelegate=1; document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('#hudGear'); if(b&&!b.onclick) go('hub'); }); }
SCR.consent=()=>{
  app.innerHTML=`<div class="screen consent">
    <h1>Emogame</h1>
    <p>Расти эмо-персонажа каждый день: корми, убирай комнату, гуляй и дари подарки. Мы используем технические данные для работы игры. Подробности — в политике на сайте приложения.</p>
    <button class="btn" id="ok">Хорошо</button>
    <button class="link-grey" id="set">Настройки</button>
  </div>`;
  $('#ok').onclick=()=>{ S.consent=Date.now(); S.stats=true; S.pers=true; save(); PL.setConsent(true,true); afterConsent(); };
  $('#set').onclick=()=>go('consentSet');
};
SCR.consentSet=()=>{
  const ap=(window.EGAudio&&EGAudio.getPrefs())||{musicOn:S.musicOn!==false,sfxOn:S.sfx!==false,musicVol:0.7,sfxVol:0.85,muted:false};
  app.innerHTML=`<div class="screen consent">
    <h1>Настройки</h1>
    <p>Можно отключить необязательную аналитику и персонализацию рекламы.</p>
    <label class="card" style="display:block;margin-bottom:8px"><input type="checkbox" id="st" ${S.stats?'checked':''}> Аналитика</label>
    <label class="card" style="display:block;margin-bottom:8px"><input type="checkbox" id="pe" ${S.pers?'checked':''}> Персонализация рекламы</label>
    <label class="card" style="display:block;margin-bottom:8px"><input type="checkbox" id="auMusic" ${ap.musicOn&&!ap.muted?'checked':''}> Музыка</label>
    <label class="card" style="display:block;margin-bottom:8px"><input type="checkbox" id="auSfx" ${ap.sfxOn&&!ap.muted?'checked':''}> Звуки</label>
    <label class="card" style="display:block;margin-bottom:8px">Громкость музыки <input type="range" id="auMv" min="0" max="100" value="${Math.round((ap.musicVol||0.7)*100)}"></label>
    <label class="card" style="display:block;margin-bottom:16px">Громкость звуков <input type="range" id="auSv" min="0" max="100" value="${Math.round((ap.sfxVol||0.85)*100)}"></label>
    <button class="btn" id="ok">Хорошо</button>
  </div>`;
  const applyAu=()=>{
    const musicOn=!!$('#auMusic').checked; const sfxOn=!!$('#auSfx').checked;
    const musicVol=($('#auMv').value|0)/100; const sfxVol=($('#auSv').value|0)/100;
    S.musicOn=musicOn; S.sfx=sfxOn;
    if(window.EGAudio) EGAudio.setPrefs({musicOn,sfxOn,musicVol,sfxVol,muted:false});
    egA('tap');
  };
  ['auMusic','auSfx','auMv','auSv'].forEach(id=>{ const el=$('#'+id); if(el) el.onchange=applyAu; if(el) el.oninput=applyAu; });
  $('#ok').onclick=()=>{ S.consent=Date.now(); S.stats=!!$('#st').checked; S.pers=!!$('#pe').checked; applyAu(); save(); PL.setConsent(S.stats,S.pers); afterConsent(); };
};
function afterConsent(){
  if(!localStorage.getItem('eg_care_onboard')) go('onboardCare');
  else if(!localStorage.getItem('eg_created')) go('create');
  else { EGCare&&EGCare.onLogin(S); EGWeather&&EGWeather.sync(S); EGAch&&EGAch.check(S); save(); go('home'); Net.register().then(()=>Net.sync().then(j=>{applyServer(j);return Net.registerPush();})).catch(()=>{}); }
}
function applyServer(res){
  if(res&&res.j&&res.j.config&&res.j.config.remote) EGRC.apply(res.j.config.remote);
  if(res&&res.j&&res.j.events) EGEvents.apply(res.j.events);
}

SCR.onboardCare=()=>{
  app.innerHTML=`<div class="screen"><div class="onboard-care">
    <h3>Заходи каждый день</h3>
    <p>Персонаж голодает и грустит в реальном времени, даже когда ты офлайн. Комната загрязняется — нужна уборка (мусор, посуда, бельё).</p>
    <ul style="margin:8px 0 12px 18px;color:#ccc;font-size:14px;line-height:1.5">
      <li>Корми и пои каждый день</li>
      <li>Убирай комнату</li>
      <li>Серия входов даёт награды — пропуск сбрасывает (можно заморозить за рекламу)</li>
      <li>Пуши напомнят: «я голоден», «в комнате бардак»</li>
    </ul>
    <button class="btn" id="go">Понятно — буду заботиться</button>
  </div></div>`;
  $('#go').onclick=()=>{ localStorage.setItem('eg_care_onboard','1');
    if(!localStorage.getItem('eg_created')) go('create'); else { EGCare&&EGCare.onLogin(S); save(); go('home'); } };
};

SCR.create=()=>{
  let style=S.style||'emo', gender=S.gender||'guy';
  const paint=()=>{
    app.innerHTML=`<div class="screen create">
      <h2>Кто ты?</h2>
      <div class="seg">${EG.GENDERS.map(g=>`<button data-g="${g.id}" class="${gender===g.id?'on':''}">${g.name}</button>`).join('')}</div>
      <div class="seg">${EG.STYLES.map(s=>`<button data-s="${s.id}" class="${style===s.id?'on':''}">${s.name}</button>`).join('')}</div>
      <div class="chars">${EG.STYLES.map(s=>`<div class="pick ${style===s.id?'on':''}" data-pick="${s.id}">
        <img src="img/chars/${s.id}_${gender}.webp" alt="${s.name}" onerror="this.src=\'img/chars/${s.id}_guy.webp\'"><span>${s.name}<br><small>${s.blurb}</small></span></div>`).join('')}</div>
      <input id="nm" placeholder="Имя (необязательно)" maxlength="16" value="${S.name||''}"
        style="width:100%;padding:12px;border-radius:12px;border:1px solid #2a1a24;background:#161018;color:#fff;margin-bottom:12px">
      <button class="btn" id="go">Начать</button>
    </div>`;
    app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{gender=b.dataset.g;paint();});
    app.querySelectorAll('[data-s],[data-pick]').forEach(b=>b.onclick=()=>{style=b.dataset.s||b.dataset.pick;paint();});
    $('#go').onclick=()=>{
      S.style=style; S.gender=gender; S.name=($('#nm').value||'').trim().slice(0,16);
      localStorage.setItem('eg_created','1'); EGCare&&EGCare.onLogin(S); save(); go('home'); toast('Добро пожаловать — заглядывай каждый день');
    };
  };
  paint();
};

function decorHTML(locId){
  if(locId&&locId!=='room') return '';
  const d=S.decor||{}; const slots=Object.keys(d);
  if(!slots.length) return '';
  return slots.map((slot,i)=>{
    const id=d[slot]; const g=EGGifts.byId(id); if(!g) return '';
    const left=14+(i*19)%64; const bottom=26+(i%3)*7;
    return `<img class="decor-layer" src="${EG.giftImg(g)}" alt="" style="left:${left}%;bottom:${bottom}%;position:absolute;width:42px;height:42px">`;
  }).join('');
}

function stageHTML(locId, bleed){
  const ph=phase(); const bg=EG.locBg(locId,ph);
  const loc=(EG.LOCS||[]).find(l=>l.id===locId)||{name:locId};
  const floorCls='floor-'+(locId||'room');
  const cls=bleed?'stage-bleed':'stage';
  const ambient=ambientHTML(locId||'room');
  return `<div class="${cls} ${floorCls}" data-loc="${locId||'room'}"><img class="bg" src="${bg}" alt="" onerror="this.src='img/loc/room_morning.webp'">
    ${bleed?'':`<div class="loc-title">${loc.name||locId}</div>`}
    ${decorHTML(locId)}
    ${ambient}
    <div class="char-wrap" id="charWrap"><img class="char-shadow" src="img/chars/shadow.webp" alt=""><img class="char" id="charSpr" src="${(function(){const k=(S.style||'emo')+'_'+(S.gender||'guy');const fs=EG.ANIMS&&EG.ANIMS.frameSets&&EG.ANIMS.frameSets[k];const sit=(locId==='cafe'||locId==='bookcafe')?(`img/chars/frames/${k}/sit.webp`):''; if(sit) return sit; return (fs&&fs.idle)||EG.charImg(S.style,S.gender);})()}" alt=""></div></div>`;
}
function ambientHTML(locId){
  const ph=phase();
  const bits=[];
  if(locId==='metro'||locId==='station'||locId==='nightclub'||locId==='arcade') bits.push('<div class="fx-neon"></div>');
  if(ph==='night'||ph==='evening') bits.push('<div class="fx-neon" style="opacity:.35"></div>');
  if(ph==='night'||ph==='evening') bits.push('<div class="fx-flicker"></div>');
  if((S.weather||'').includes('снег')||(S.weather||'')==='snow'||locId==='metro') bits.push('<div class="fx-snow"></div>');
  if((S.weather||'').includes('дожд')||(S.weather||'')==='rain'||ph==='evening') bits.push('<div class="fx-rain"></div>');
  if(locId==='cafe'||locId==='bookcafe') bits.push('<div class="fx-steam"></div>');
  if(locId==='room'){ bits.push('<div class="fx-cat" title="cat"></div>'); bits.push('<div class="fx-candle"></div>'); bits.push('<div class="fx-candle c2"></div>'); }
  if(locId==='park'||locId==='cemetery'||locId==='rooftop') bits.push('<div class="fx-leaves"></div>');
  if(locId==='metro'||locId==='station') bits.push('<div class="fx-train"></div>');
  const AMB={beach:['waves','clouds'],embankment:['waves','clouds'],concert:['lights'],festival:['lights','leaves'],idol_stage:['lights'],nightclub:['lights'],karaoke:['lights','neon'],
    factory:['dust'],garage:['dust'],records:['dust','neon'],tattoo:['dust','neon'],mall:['dust','neon'],school:['dust','neon'],skate:['leaves','clouds'],rooftop:['clouds','dust'],
    bookcafe:['dust'],arcade:['dust'],cemetery:['fog','dust'],park:['clouds']};
  if(locId!=='room'||ph==='night') bits.push('<div class="fx-motes"></div>'); /* 0.8.2: room night had no visible motion */
  (AMB[locId]||[]).forEach(k=>{ if(k==='neon'&&bits.some(x=>x.includes('fx-neon"'))) return; if(k==='leaves'&&bits.some(x=>x.includes('fx-leaves'))) return; bits.push('<div class="fx-'+k+'"></div>'); });
  return bits.length?`<div class="ambient">${bits.join('')}</div>`:'';
}
function walkCharTo(sel, thenPlay){
  const wrap=$('#charWrap'); const el=$('#charSpr'); if(!wrap||!el) return;
  const t=app.querySelector(sel); if(!t){ if(window.EGAnim) window.EGAnim.play(thenPlay||'idle'); return; }
  const sr=wrap.getBoundingClientRect(); const tr=t.getBoundingClientRect(); const ar=app.getBoundingClientRect();
  const nx=((tr.left+tr.width/2)-ar.left)/ar.width*100;
  const nb=100-((tr.top+tr.height)-ar.top)/ar.height*100;
  wrap.classList.add('walking'); wrap.classList.toggle('face-left', (tr.left+tr.width/2) < (sr.left+sr.width/2));
  wrap.style.setProperty('left',Math.max(14,Math.min(86,nx))+'%','important'); wrap.style.setProperty('bottom',Math.max(12, Math.min(40, nb-2))+'%','important'); /* 0.8.3: inline !important — stylesheet pinned left/bottom with !important so the walk never moved */
  if(window.EGAnim) window.EGAnim.play('walk'); egA('footsteps');
  setTimeout(()=>{ wrap.classList.remove('walking','face-left'); if(window.EGAnim) window.EGAnim.play(thenPlay||'happy'); }, 1450); /* 0.8.4: slower natural walk */
}

function mountAnim(opts){
  const el=$('#charSpr'); if(!el||!window.EGAnim) return;
  opts=opts||{};
  (function(){ let st=S.style,g=S.gender; const fs=EG.ANIMS&&EG.ANIMS.frameSets;
      if(!(fs&&fs[st+'_'+g])){ if(st==='goth'){st='goth';g='girl';} else if(st==='punk'){st='punk';g='guy';} else if(st==='skater'){st='skater';g='girl';} }
      window.EGAnim.mount(el,st,g);
      if(opts.pose==='sit'){ window.EGAnim.play('sit'); }
      else { window.EGAnim.fromNeeds(S); }
  })();
}

/* 0.8.4: home evening/night follow their own mocks (profile header / status panel), panels never over the character (charfit) */
function homeVariantHTML(){
  const ph=phase(); const need=xpNeed(S.level); const pct=Math.round(clamp((S.xp/need)*100,0,100));
  const nm=(S.name||'Эмо').slice(0,12); const k=(S.style||'emo')+'_'+(S.gender||'girl');
  const bar=(v,c)=>`<div class="hv-bar"><i style="width:${clamp(v,0,100)}%;background:${c}"></i></div>`;
  if(ph==='evening') return `<div class="hv-eve-top">
      <div class="hv-ava"><img src="img/chars/frames/${k}/idle.webp" alt=""></div>
      <div class="hv-who"><b>${nm.toUpperCase()}</b><small>УР ${S.level}</small><div class="hv-xp"><i style="width:${pct}%"></i><span>${Math.round(S.xp)} / ${need}</span></div></div>
      <div class="hv-cur"><div>${ico('coins')}<b>${fmtNum(S.coins)}</b><span>+</span></div><div>${ico('gems')}<b>${fmtNum(S.gems)}</b><span>+</span></div></div>
    </div>
    <div class="hv-title"><i></i><b>✦ ДОМ ✦</b><i></i><button class="hv-menu" id="hudGear" type="button" aria-label="меню">☰</button></div>
    <div class="hv-side"><button data-hv="ach" type="button">${ico('mood')}<span>СТАТЫ</span></button><button data-hv="diary" type="button">${ico('level')}<span>ЦЕЛИ</span></button><button data-hv="consentSet" type="button">${ico('settings')}<span>НАСТР.</span></button></div>
    <div class="hv-cards">${[['НАСТРОЙ',S.mood,'mood','#ff4f9a'],['ЭНЕРГИЯ',S.energy,'energy','#8e5cff'],['ГОЛОД',S.hunger,'hunger','#ff6f91']].map(([n,v,i,c])=>`<div class="hv-card"><div class="hv-cl">${ico(i)}<span>${n}</span></div>${bar(v,c)}<small>${Math.round(v)} / 100</small></div>`).join('')}</div>`;
  if(ph==='night') return `<div class="hv-night-top">
      <div class="hv-sk">${ico('skull')}</div><div class="hv-who"><b>${nm}</b><div class="hv-lv"><div class="hv-xp n"><i style="width:${pct}%"></i></div><small>УРОВЕНЬ ${S.level}</small></div></div>
      <button class="hv-gear" id="hudGear" type="button" aria-label="настройки">${ico('settings')}</button>
    </div>
    <div class="hv-status"><div class="hv-sh"><span>СТАТУС</span><span>⌄</span></div>
      ${[['ГОЛОД',S.hunger,'hunger','#d84a4a'],['ЖАЖДА',S.thirst,'thirst','#3f7fe0'],['ЭНЕРГИЯ',S.energy,'energy','#e9a62c'],['НАСТРОЙ',S.mood,'mood','#9b5cff']].map(([n,v,i,c])=>`<div class="hv-row">${ico(i)}<span>${n}</span>${bar(v,c)}<em>${Math.round(v)} / 100</em></div>`).join('')}
    </div>`;
  return hudHTML();
}
SCR.home=()=>{
  S.loc='room'; save();
  { const low=Math.min(S.hunger||0,S.thirst||0,S.mood||0); if(low<20&&!W.__sadPlayed){ W.__sadPlayed=1; setTimeout(()=>egA('sad'),600); } else if(low>=30) W.__sadPlayed=0; }
  const stN=(S.streak&&S.streak.n)||0;
  app.innerHTML=`<div class="screen immersive home-mode">
    ${stageHTML('room', true)}
    ${dirtHotspots()}
    ${roomInteract()}
    <button class="scene-fab" id="wardrobe" type="button" aria-label="Гардероб"><span class="fab-ring"><img class="fab-hanger" src="img/ui/icons/wardrobe.png" alt=""><span class="fab-lab">ГАРДЕРОБ</span></span></button>
    ${homeVariantHTML()}
    ${nav('home')}
  </div>`;
  { const sc=app.querySelector('.screen'); const ph=phase(); if(ph==='evening'||ph==='night') sc.classList.add('home-v-'+ph); }
  app.querySelectorAll('[data-hv]').forEach(b=>b.onclick=()=>{ egA('tap'); go(b.dataset.hv); });
  bindNav(); bindClean(); bindRoomInteract(); mountAnim(); if(window.EGAnim) window.EGAnim.play('idle');
  const g=$('#hudGear'); if(g) g.onclick=()=>go('hub');
  $('#wardrobe').onclick=()=>go('wardrobe');
  
};

function ensureQuests(){
  const d=new Date().toISOString().slice(0,10);
  if(S.questDay!==d){ S.questDay=d; S.quest={}; (EG.QUESTS||[]).forEach(q=>S.quest[q.id]={p:0,done:false}); save(); }
}
function qAdd(stat,n){
  ensureQuests();
  (EG.QUESTS||[]).filter(q=>q.stat===stat).forEach(q=>{
    const st=S.quest[q.id]; if(!st||st.done)return;
    st.p=(st.p||0)+n; if(st.p>=q.goal){ st.done=true; S.coins+=q.reward.coins; addXp(q.reward.xp); toast('Квест: '+q.title); }
  }); save();
}


SCR.wardrobe=()=>{
  const giftWear=(EG.GIFTS&&EG.GIFTS.items||[]).filter(g=>g.kind==='wear'&&(S.gifts&&S.gifts.inv[g.id]>0));
  const slots=['top','bottom','shoes','acc','hair'];
  const slotRu={top:'Верх',bottom:'Низ',shoes:'Обувь',acc:'Аксессуар',hair:'Волосы'};
  S.equip=S.equip||{};
  const previewSrc=(function(){const k=(S.style||'emo')+'_'+(S.gender||'guy');const fs=EG.ANIMS&&EG.ANIMS.frameSets&&EG.ANIMS.frameSets[k];return (fs&&fs.idle)||EG.charImg(S.style,S.gender);})();
  const g=S.gender||'guy';
  S.wardrobe=S.wardrobe||{}; S.equip=S.equip||{};
  // Seed a few owned+equipped for checkmarks; high-unlock items stay locked for padlock badges
  [['hoodie','top'],['boots','shoes'],['choker','acc']].forEach(([id,slot])=>{
    if(!S.wardrobe[id]) S.wardrobe[id]=1;
    if(!S.equip[slot]) S.equip[slot]=id;
  });
  const cards=(EG.SHOP||[]).filter(it=>{
    const gg=it.gender||'any';
    return gg==='any'||gg===g;
  }).map(it=>{
    const owned=!!S.wardrobe[it.id]; const eq=S.equip[it.slot]===it.id;
    const need=it.unlockLevel||it.minLevel||1; const locked=(S.level|0)<need && !owned;
    const badge=locked?'<span class="ward-badge lock" aria-hidden="true"><img src="img/ui/icons/level.webp" alt="" style="width:14px;height:14px"></span>':(eq?'<span class="ward-badge check" aria-hidden="true">✓</span>':'');
    return `<button class="card food-card ward-card ${eq?'on':''} ${locked?'locked':''}" data-w="${it.id}" data-slot="${it.slot}" ${locked?'aria-disabled="true"':''}>
      ${badge}
      <img class="food-art" src="${EG.shopImg(it)}" alt="">
      <b>${it.name}</b>
      <span class="sub">${locked?('ур.'+need):(owned?(eq?'надет':'есть'):(it.cost+''))}</span>
    </button>`;
  }).join('');
  app.innerHTML=`<div class="screen ward-screen">
    <div class="ward-head"><img class="ward-title-art" src="img/ui/chrome/ward_title_oswald.webp" alt="Гардероб"><div class="ward-heart hud-chip">${ico('mood')} ${Math.round(S.styleStat||0)}</div></div>
    <div class="ward-preview"><img id="wardPrev" src="${previewSrc}" alt=""></div>
    <div class="ward-body eg-scroll"><div class="grid ward-grid">${cards}</div>
      ${giftWear.length?`<h3 style="margin-top:10px;color:#ff4d9a;font-size:14px">Подарки</h3><div class="grid">${giftWear.map(g=>`<button class="card food-card" data-gw="${g.id}"><img class="food-art" src="${EG.giftImg(g)}" alt=""><b>${g.name}</b></button>`).join('')}</div>`:''}
    </div>
    ${nav('home')}
  </div>`;
  bindNav();
  app.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{
    const it=EG.SHOP.find(x=>x.id===b.dataset.w); if(!it)return;
    const needL=it.unlockLevel||it.minLevel||1; if(!S.wardrobe[it.id]&&(S.level|0)<needL){ egA('error'); toast('Откроется с уровня '+needL); return; }
    if(!S.wardrobe[it.id]){
      if(S.coins<it.cost){ egA('error'); egA('error'); toast('Мало монет'); return; }
      S.coins-=it.cost; S.wardrobe[it.id]=1; S.styleStat=clamp(S.styleStat+it.style,0,100);
      toast('Куплено: '+it.name);
    }
    S.equip=S.equip||{}; S.equip[it.slot]=it.id; save();
    go('wardrobe');
  });
  app.querySelectorAll('[data-gw]').forEach(b=>b.onclick=()=>{
    const r=EGGifts.wear(S,b.dataset.gw); if(r.ok){ save(); egA('happy'); toast('Надето'); go('home'); window.EGAnim&&window.EGAnim.play('happy'); }
  });
};
function openWardrobe(){ go('wardrobe'); }

window.openQuests=function openQuests(){ egA('sheet_open');
  ensureQuests();
  const body=`<div class="sheet-grid">${(EG.QUESTS||[]).map(q=>{
    const st=S.quest[q.id]||{p:0};
    const art=`img/ui/sheets/quest_${q.id}.webp`;
    return `<div class="sheet-card ${st.done?'done':''}">
      <img class="sheet-art" src="${art}" alt="" onerror="this.onerror=null;this.src='img/ui/icons/quests.webp'">
      <b>${q.title}</b>
      <span class="sub">${Math.min(st.p|0,q.goal)}/${q.goal}${st.done?' ✓':''} · +${q.reward.coins} <img class="coin" src="img/ui/icons/coins.webp" alt=""></span>
    </div>`;
  }).join('')||'<p style="color:#888">Нет квестов</p>'}</div>`;
  EGUI.openSheet({title:'Квесты дня', icon:EGUI.iconSrc('quests'), bodyHtml:body});
}
window.openShop=function openShop(){ egA('sheet_open');
  const items=(PL.pay&&PL.pay.items?PL.pay.items():(PL.social&&PL.social.items)||[]);
  const packArt=id=>{
    const s=String(id||'').toLowerCase();
    if(s.includes('gems_80')||s==='gems_80') return 'shop_gems80';
    if(s.includes('gems_250')) return 'shop_gems250';
    if(s.includes('coin')) return 'shop_coins';
    if(s.includes('freechat')||s.includes('sub')) return 'shop_chat';
    if(s.includes('energy')) return 'shop_energy';
    return 'shop_gems80';
  };
  const body=`<div class="sheet-grid">
    <button class="sheet-card" id="rw" type="button"><img class="sheet-art" src="img/ui/sheets/shop_energy.webp" alt="" onerror="this.onerror=null;this.src='img/ui/icons/energy.webp'"><b>Реклама: +40 энергии</b><span class="sub">вознаграждение</span></button>
    ${items.length?items.map(it=>`<button class="sheet-card" data-pay="${it[0]}" type="button"><img class="sheet-art" src="img/ui/sheets/${packArt(it[0])}.webp" alt="" onerror="this.onerror=null;this.src='img/ui/icons/shop.webp'"><b>${it[1]}</b><span class="sub">${it[2]}</span></button>`).join(''):
      '<p style="color:#888;font-size:13px;margin:8px 0">Платные пакеты — через VK, OK или RuStore.</p>'}
    <button class="sheet-card" id="auth" type="button"><img class="sheet-art" src="img/ui/sheets/shop_account.webp" alt="" onerror="this.onerror=null;this.src='img/ui/icons/settings.webp'"><b>Аккаунт / привязка</b><span class="sub">войти</span></button>
  </div>`;
  const root=EGUI.openSheet({title:'Магазин', icon:EGUI.iconSrc('shop'), bodyHtml:body});
  root.querySelector('#rw').onclick=()=>{
    if(!PL.ads.rewardedAvail()){ S.energy=clamp(S.energy+40,0,100); save(); toast('+40 энергии'); root._close(); return; }
    W.__adResult=(k,ok)=>{ if(ok){ S.energy=clamp(S.energy+40,0,100); save(); toast('+40 энергии'); } };
    PL.ads.showRewarded('energy');
  };
  const au=root.querySelector('#auth'); if(au) au.onclick=()=>{ root._close(); go('account'); };
  root.querySelectorAll('[data-pay]').forEach(b=>b.onclick=async()=>{
    const ok=PL.pay?await PL.pay.purchase(b.dataset.pay):false;
    toast(ok?'Спасибо!':'Покупка недоступна');
  });
}

SCR.feed=()=>{
  const tab0=(S.feedTab==='drinks')?'drinks':'food';
  const foodCard=(f,kind)=>{
    const need=f.unlockLevel||f.minLevel||1; const locked=(S.level|0)<need;
    return `<button class="card food-card ${locked?'locked':''}" data-${kind==='food'?'f':'d'}="${f.id}" ${locked?'disabled':''}>
      <img class="food-art" src="${kind==='food'?EG.foodImg(f):EG.drinkImg(f)}" alt="">
      <b>${f.name}</b>
      <span class="sub">${locked?('с ур.'+need):`<img class="coin" src="img/ui/icons/coins.webp" alt=""> ${f.cost}`}</span>
    </button>`;
  };
  const foods=(EG.FOOD||[]).slice(0,6);
  const drinks=(EG.DRINKS||[]).slice(0,6);
  const paint=(tab)=>{
    S.feedTab=tab; try{save();}catch(e){}
    const items=tab==='drinks'?drinks:foods;
    const grid=items.map(f=>foodCard(f,tab==='drinks'?'drink':'food')).join('');
    app.innerHTML=`<div class="screen feed-screen">
      <div class="feed-head"><img class="feed-title-art" src="img/ui/chrome/feed_title.webp" alt="Еда"></div>
      <div class="feed-currency">
        <div class="hud-chip">${ico('coins')} ${fmtNum(S.coins)} <b class="plus">+</b></div>
        <div class="hud-chip">${ico('skull')} ${fmtNum(S.gems)} <b class="plus">+</b></div>
      </div>
      <div class="feed-tabs" role="tablist">
        <button type="button" class="feed-tab ${tab==='food'?'on':''}" data-tab="food" role="tab"><img class="ft-ico" src="img/ui/icons/food.webp" alt="">Еда</button>
        <button type="button" class="feed-tab ${tab==='drinks'?'on':''}" data-tab="drinks" role="tab"><img class="ft-ico" src="img/ui/icons/thirst.webp" alt="">Напитки</button>
      </div>
      <div class="feed-body eg-scroll">
        <div class="grid food-grid">${grid}</div>
      </div>
      ${nav('feed')}
    </div>`;
    bindNav();
    app.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>paint(b.dataset.tab));
    app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{
      const f=EG.FOOD.find(x=>x.id===b.dataset.f); if(!f||S.coins<f.cost)return toast('Мало монет');
      S.coins-=f.cost; S.hunger=clamp(S.hunger+f.hunger,0,100); S.mood=clamp(S.mood+(f.mood||0),0,100);
      S.dirt.dishes=clamp((S.dirt.dishes||0)+12,0,100); S.dirt.trash=clamp((S.dirt.trash||0)+6,0,100);
      S.feeds++; qAdd('feeds',1); addXp(5); save(); toast('Вкусно'); egA('eat'); if(window.EGAnim) window.EGAnim.act('food',3000,()=>window.EGAnim.fromNeeds(S)); setTimeout(()=>paint('food'),500);
    });
    app.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{
      const f=EG.DRINKS.find(x=>x.id===b.dataset.d); if(!f||S.coins<f.cost)return toast('Мало монет');
      S.coins-=f.cost; S.thirst=clamp(S.thirst+f.thirst,0,100); S.energy=clamp(S.energy+(f.energy||0),0,100);
      S.mood=clamp(S.mood+(f.mood||0),0,100); S.dirt.dishes=clamp((S.dirt.dishes||0)+8,0,100);
      S.drinks++; qAdd('drinks',1); addXp(4); save(); toast('Бульк'); egA('drink'); if(window.EGAnim) window.EGAnim.act('drinks',3000,()=>window.EGAnim.fromNeeds(S)); setTimeout(()=>paint('drinks'),500);
    });
  };
  paint(tab0);
};

SCR.sleep=()=>{ SCR.home(); cur='home'; setTimeout(startSleep,300); };

SCR.map=()=>{
  const ph=phase();
  const pins=[
    {id:'metro',lab:'Метро',x:'22%',y:'38%'},
    {id:'cafe',lab:'Кафе',x:'62%',y:'30%'},
    {id:'park',lab:'Парк',x:'74%',y:'48%'},
    {id:'room',lab:'Дом',x:'40%',y:'62%'}
  ];
  const av=avatarSrc(S.style,S.gender);
  const need=xpNeed(S.level); const xp=Math.round(clamp(S.xp,0,need));
  app.innerHTML=`<div class="screen immersive map-screen">
    <div class="map-bleed"><img class="mapbg" src="img/loc/city_map.webp" alt=""></div>
    <div class="map-pins">${pins.map(p=>{
      const loc=(EG.LOCS||[]).find(l=>l.id===p.id)||{id:p.id,minLevel:1};
      const ok=unlockOk(loc)&&(!loc.phases||loc.phases.includes(ph));
      return `<button class="map-pin" style="left:${p.x};top:${p.y}" data-l="${p.id}" ${ok?'':'disabled'}><img class="pin-art" src="img/ui/pins/${p.id}.webp" alt=""><span class="pin-lab">${p.lab}</span></button>`;
    }).join('')}</div>
    <div class="map-head map-head-v2">
      <div class="map-id">
        <img class="map-av" src="${av}" alt="">
        <div class="map-meta">
          <div class="map-name">${S.name||'Пустышка'}</div>
          <div class="map-lv">${ico('skull')} УРОВЕНЬ ${S.level}</div>
          <div class="map-xp"><div class="xpbar"><i style="width:${Math.round(xp/need*100)}%"></i><span>${xp} / ${need}</span></div></div>
        </div>
      </div>
      <div class="map-cur">
        <div class="hud-chip">${ico('coins')} ${fmtNum(S.coins)} <b class="plus">+</b></div>
        <div class="hud-chip">${ico('gems')} ${fmtNum(S.gems)} <b class="plus">+</b></div>
        <button class="hud-gear" id="hudGear" type="button">${ico('settings')}</button>
      </div>
    </div>
    <button class="map-all" id="mapAll" type="button"><img src="img/ui/icons/map.webp" alt="" onerror="this.style.opacity=0"><b>Все места</b><span>${(EG.LOCS||[]).filter(l=>l.id!=='room'&&unlockOk(l)).length}/${(EG.LOCS||[]).filter(l=>l.id!=='room').length}</span></button>
    ${nav('map')}
  </div>`;
  bindNav();
  const g=$('#hudGear'); if(g) g.onclick=()=>go('hub');
  $('#mapAll').onclick=()=>{ egA('tap');
    const L=(EG.LOCS||[]).filter(l=>l.id!=='room').slice().sort((a,b)=>(a.minLevel||1)-(b.minLevel||1));
    const body=`<div class="sheet-grid loc-grid">${L.map(l=>{ const ok=unlockOk(l);
      return `<button class="sheet-card ${ok?'':'locked'}" data-all="${l.id}" type="button"><img class="sheet-art" src="img/ui/pins/${l.id}.webp" alt=""><b>${l.name}</b><span class="sub">${ok?('−'+(l.energy||5)+' энергии'):('🔒 ур. '+(l.minLevel||1))}</span></button>`; }).join('')}</div>`;
    const root=EGUI.openSheet({title:'Все места', icon:'img/ui/icons/map.webp', bodyHtml:body});
    root.querySelectorAll('[data-all]').forEach(b=>b.onclick=()=>{ const l=L.find(x=>x.id===b.dataset.all);
      if(!unlockOk(l)){ egA('error'); toast('Нужен уровень '+l.minLevel); return; }
      root.remove(); go('loc',l.id); });
  };
  app.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>go('loc',b.dataset.l));
};

SCR.loc=(id)=>{
  const loc=(EG.LOCS||[]).find(l=>l.id===id)||{id:'room',name:'Комната'};
  if(loc.id!=='room'){
    if(!unlockOk(loc)){ egA('error'); toast('Нужен уровень '+loc.minLevel); return go('map'); }
    if(!SHOT && S.energy<(loc.energy||5)){ egA('hungry'); toast('Мало энергии — покорми и выспись'); return go('map'); }
    if(!SHOT) S.energy=clamp(S.energy-(loc.energy||5),0,100);
    S.mood=clamp(S.mood+(loc.mood||0),0,100);
    S.social=clamp(S.social+(loc.social||0),0,100);
    S.fame=clamp((S.fame||0)+(loc.fame||0),0,100);
    if(loc.hunger) S.hunger=clamp(S.hunger+loc.hunger,0,100);
    if(loc.thirst) S.thirst=clamp(S.thirst+loc.thirst,0,100);
    S.loc=loc.id; S.outings++; qAdd('outings',1);
    if(loc.id==='park'){ S.park++; qAdd('park',1); }
    if(loc.id==='concert'){ S.concerts++; qAdd('concerts',1); }
    if(window.EGWeather) EGWeather.applyVisit(S,loc.id);
    const npcHere=(window.EGNpc?EGNpc.list():[]).find(n=>n.loc===loc.id);
    if(npcHere){ EGNpc.meet(S,npcHere.id); toast(npcHere.name+' здесь'); }
    egA('travel'); egA('door'); if((loc&&loc.id)==='metro'||S.loc==='metro') egA('metro_arrive'); addXp(10); if(window.EGAch) EGAch.check(S); save();
  } else { S.loc='room'; save(); return go('home'); }
  const wtxt=(EG.weatherText&&EG.weatherText(S))||S.weatherText||((S.weather||'')+' · '+(S.season||''));
  const isMetro=loc.id==='metro'||loc.id==='station';
  const isCafe=loc.id==='cafe'||loc.id==='bookcafe';
  const isPark=loc.id==='park';
  const clock=new Date(); const hh=String(clock.getHours()).padStart(2,'0'); const mm=String(clock.getMinutes()).padStart(2,'0');
  const headTitle=isMetro?'СТАНЦИЯ: СЕВЕРНАЯ':(loc.name||loc.id).toUpperCase();
  const headSub=isMetro?'ЛИНИЯ 1 · МОСКВА':(wtxt||'');
  const locTitle=isMetro?'МЕТРО · СЕВЕРНАЯ':(loc.name||'');
  const locSub=isMetro?'Подземная станция':(wtxt||'');
    const weatherLine=isMetro?'Снег · Зима · −6°C · Ощущается как −9°C':(isPark?(({morning:'УТРО',day:'ДЕНЬ',evening:'ВЕЧЕР',night:'НОЧЬ'})[phase()]+' · 14°C'):(isCafe?(({morning:'УТРО',day:'ДЕНЬ',evening:'ВЕЧЕР',night:'НОЧЬ'})[phase()]+' · кафе'):(wtxt||'—')));
  const locCls='loc-mode loc-'+(loc.id||'x')+' ph-'+phase();
  const isParkDay=isPark&&phase()==='day';
  const isCem=loc.id==='cemetery';
  const phN=phase(); const cafeEve=isCafe&&(phN==='evening'||phN==='night'); const parkNight=isPark&&phN==='night';
  const showHud=(isCafe&&!cafeEve)||(isPark&&!isParkDay&&!parkNight);
  const segBar=(v,c)=>`<span class="v4-seg">${[...Array(10)].map((_,k)=>`<i style="${k<Math.round(clamp(v,0,100)/10)?'background:'+c:''}"></i>`).join('')}</span>`;
  const v4Hud=cafeEve?`<div class="v4-cafe-h"><span class="v4-cup">☕</span><b class="${loc.id==='cafe'?'':'long'}">${loc.id==='cafe'?'КАФЕ':String(loc.name||'КАФЕ').toUpperCase()}</b><button class="v4-x" id="back" type="button" aria-label="назад">♥</button></div>
    <div class="v4-cafe-st"><div class="v4-sh">● СТАТУС</div>${[['НАСТРОЕНИЕ',S.mood,'mood','#ff4f9a'],['ЭНЕРГИЯ',S.energy,'energy','#f0a030'],['ЖАЖДА',S.thirst,'thirst','#4f7fff']].map(([n,v,i,c])=>`<div class="v4-r">${ico(i)}<span>${n}</span>${segBar(v,c)}<em style="color:${c}">${Math.round(v)}%</em></div>`).join('')}</div>`
    :parkNight?`<div class="v4-park-h"><div class="v4-pa"><img src="img/chars/frames/${(S.style||'emo')+'_'+(S.gender||'girl')}/idle.webp" alt=""></div><div class="v4-pst"><b>СТАТУС</b>${[['ГОЛОД',S.hunger,'hunger','#c8323c'],['ЭНЕРГИЯ',S.energy,'energy','#2f7fe0'],['НАСТРОЙ',S.mood,'mood','#8b4fe0']].map(([n,v,i,c])=>`<div class="v4-r">${ico(i)}<span>${n}</span><div class="v4-b"><i style="width:${clamp(v,0,100)}%;background:${c}"></i></div></div>`).join('')}</div>
      <div class="v4-pr"><div>${ico('coins')}<b>${fmtNum(S.coins)}</b></div><div>☾<b>${hh}:${mm}</b></div></div><button class="v4-back" id="back" type="button" aria-label="назад">←</button></div>
      <div class="v4-rain"><span>☂</span><div>${String(wtxt||'НОЧЬ · 14°C').toUpperCase()}<br><small>НОЧЬ В ПАРКЕ · ВИДИМОСТЬ ПОНИЖЕНА</small></div></div>`:'';
  const seg=(v)=>{ const n=Math.max(0,Math.min(4, Math.round((v||0)/25))); return `<span class="seg">${[0,1,2,3].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`; };
  const cafeParkHud=()=>{
    const nm=S.name||'×_МРАЧКА_×';
    const hearts=Math.round(clamp((S.mood||0)/10,0,10));
    const heartRow=[...Array(10)].map((_,i)=>`<i class="hrt ${i<hearts?'on':''}">♥</i>`).join('');
    const phaseLab=({morning:'УТРО',day:'ДЕНЬ',evening:'ВЕЧЕР',night:'НОЧЬ'})[phase()]||'ДЕНЬ';
    const phaseIc='';
    return `<div class="loc-hud-mock ${isCafe?'cafe-hud':'park-hud'}">
      <div class="lh-top">
        <div class="lh-user">${ico('skull')}<div><b class="lh-name">${nm}</b><div class="lh-hearts">${heartRow}</div></div></div>
        <div class="lh-phase">${ico('energy')}<div><b>${hh}:${mm}</b><span>${phaseIc} ${phaseLab}</span></div></div>
      </div>
      <div class="lh-stats">
        ${[['Голод',S.hunger,'hunger'],['Жажда',S.thirst,'thirst'],['Энергия',S.energy,'energy'],['Настрой',S.mood,'mood']].map(([n,v,i])=>`
          <div class="lh-stat">${ico(i)}<span>${n}</span>${seg(v)}</div>`).join('')}
      </div>
    </div>
    <div class="loc-badge">${isCafe?'КАФЕ':'ПАРК'}</div>`;
  };
  const statusCard=`<div class="lp-card">
        <div class="lp-status-h"><span>СТАТУС</span><span><img class="coin" src="img/ui/icons/heart.webp" alt=""> ${Math.round(S.mood||0)}/100</span></div>
        <div class="lp-bars">
          ${[['Голод',S.hunger,'#e53935'],['Жажда',S.thirst,'#1e88e5'],['Энергия',S.energy,'#8e24aa'],['Настрой',S.mood,'#ff2d78']].map(([n,v,c])=>`
            <div class="lp-row"><span class="nm">${n}</span><div class="bar"><i style="width:${clamp(v,0,100)}%;background:${c}"></i></div><span class="val">${Math.round(v)}/100</span></div>`).join('')}
        </div>
      </div>`;
  app.innerHTML=`<div class="screen immersive ${locCls}">
    ${stageHTML(loc.id, true)}
    ${showHud?cafeParkHud():''}${v4Hud}
    ${window.EGAct?`<div class="act-layer" id="actLayer">${EGAct.spotsHTML(S,loc.id)}</div>${EGAct.panelHTML(S,loc.id)}`:''}
    ${isParkDay?`<div class="loc-head pd-head"><button class="pd-ic" id="back" aria-label="назад">${ico('skull')}</button><div class="pd-t">ПАРК</div><button class="pd-ic" id="hudGear" aria-label="настройки">${ico('gear')}</button></div>`:''}
    ${isCem?`<div class="loc-head cem-head"><div class="cem-p"><img src="img/chars/frames/${(S.style||'emo')+'_'+(S.gender||'girl')}/idle.webp" alt=""><div><b>${(S.name||'ЭМО').slice(0,8)} ♥</b><div class="cem-bar"><i style="width:${clamp(S.mood,0,100)}%"></i></div><small>${Math.round(S.mood||0)}/100</small></div></div><div class="cem-t"><small>ЛОКАЦИЯ</small><b>✦ КЛАДБИЩЕ ✦</b><span>прогулка</span></div><button class="btn ghost" id="back" style="width:auto;padding:6px 10px;font-size:12px">←</button></div>`:''}
    <div class="loc-head ${(isParkDay||isCem||cafeEve||parkNight)?'pd-hidden':''} ${isMetro?'metro-head':''} ${isCafe?'cafe-head':''} ${isPark?'park-head':''}">${isMetro?'<div class="metro-m" aria-hidden="true">M</div>':''}<div style="flex:1;min-width:0"><div class="mt">${headTitle}</div>
      <div class="ms">${headSub}</div></div>
      <div class="loc-head-right">${isMetro?`<span class="metro-wx">${ico('snowflake')}<b>${hh}:${mm}</b></span><span class="metro-bat">${ico('battery')}<b>36%</b></span>`:`<b class="loc-clock">${hh}:${mm}</b>`}</div>
      ${(!isMetro&&!isParkDay&&!isCem&&!cafeEve&&!parkNight)?`<button class="btn ghost" id="back" style="margin-left:8px;width:auto;padding:8px 10px;font-size:12px">←</button>`:''}</div>
    <div class="loc-panel ${isParkDay?'pd-panel':''} ${parkNight?'v4-hidden':''} ${isCem?'cem-panel':''}" id="locPanel">
      ${isParkDay?`<div class="lp-card pd-status"><div class="pd-sh">СТАТУС ▲</div>${[['Голод',S.hunger,'hunger','#ff6f91'],['Энергия',S.energy,'energy','#f5c518'],['Настроение',S.mood,'mood','#9b5cff']].map(([n,v,i,c])=>`<div class="pd-row">${ico(i)}<span>${n.toUpperCase()}</span><div class="pd-bar">${[...Array(10)].map((_,k)=>`<i style="${k<Math.round(clamp(v,0,100)/10)?'background:'+c:''}"></i>`).join('')}</div></div>`).join('')}</div>`:''}
      ${isCem?`<div class="lp-card cem-np">${ico('music')}<span><b>СЕЙЧАС ИГРАЕТ:</b> кладбищенский эмбиент</span><span class="cem-play">▶</span></div>`:''}
      <div class="lp-card" style="${(isParkDay||isCem)?'display:none':''}">
        <div class="lp-top">
          <img class="lp-pin" src="img/ui/pins/${isMetro?'metro':(loc.id||'metro')}.webp" alt="" onerror="this.src='img/ui/chrome/map_pin_generic.webp'">
          <div><div class="lp-title">${locTitle|| (isCafe?'КАФЕ':isPark?'ПАРК':(loc.name||''))}</div><div class="lp-sub">${locSub}</div></div>
        </div>
        ${weatherLine&&weatherLine!==locSub?`<div class="lp-weather">${weatherLine}</div>`:""}
        ${isMetro?`<div class="lp-status-h"><span>СТАТУС</span><span><img class="coin" src="img/ui/icons/heart.webp" alt=""> ${Math.round(S.mood||0)}/100</span></div>
        <div class="lp-bars">
          ${[['Голод',S.hunger,'#e53935'],['Жажда',S.thirst,'#1e88e5'],['Энергия',S.energy,'#8e24aa'],['Настрой',S.mood,'#ff2d78']].map(([n,v,c])=>`
            <div class="lp-row"><span class="nm">${n}</span><div class="bar"><i style="width:${clamp(v,0,100)}%;background:${c}"></i></div><span class="val">${Math.round(v)}/100</span></div>`).join('')}
        </div>`:''}
      </div>
      <div class="lp-actions" style="${(isMetro||isCafe||isPark)?'display:none':''}">
          <button class="btn" id="chat">Чат</button>
          ${['concert','karaoke','arcade','skate','garage','idol_stage','nightclub','records'].includes(loc.id)?`<button class="btn" id="mini">Мини-игра</button>`:''}
          ${loc.id==='garage'||loc.id==='nightclub'||loc.id==='festival'?`<button class="btn" id="gig">Гиги</button>`:''}
        </div>
    </div>
    ${nav('map')}
  </div>`;
  /* 0.8.4c: no empty boxes (cards whose content is hidden by the screen variant) */
  app.querySelectorAll('#locPanel .lp-card').forEach(c=>{ if(!(c.innerText||'').trim()&&![...c.querySelectorAll('img,button')].some(x=>x.offsetWidth>2)) c.classList.add('lp-empty'); });
  bindNav();
  if(isCafe) mountAnim({pose:'sit'});
  else { mountAnim(); if(window.EGAnim) window.EGAnim.play('idle'); }
  const gBtn=$('#hudGear'); if(gBtn) gBtn.onclick=()=>go('consentSet');
  const back=$('#back'); if(back) back.onclick=()=>go('map');
  const chatBtn=$('#chat'); if(chatBtn) chatBtn.onclick=()=>go('chat');
  const m=$('#mini'); if(m) m.onclick=()=>go(loc.id==='skate'?'mg_skate':loc.id==='arcade'?'mg_arcade':loc.id==='karaoke'?'mg_karaoke':loc.id==='records'?'mg_music':'minigame');
  const g=$('#gig'); if(g) g.onclick=()=>go('band');
  bindActs(loc.id);
};
function bindActs(locId){
  if(!window.EGAct) return;
  const rer=()=>{ const l=$('#actLayer'); if(l) l.innerHTML=EGAct.spotsHTML(S,locId); const p=$('#actPanel'); if(p){ const t=document.createElement('div'); t.innerHTML=EGAct.panelHTML(S,locId); p.replaceWith(t.firstElementChild); } const vals=[S.hunger,S.thirst,S.energy,S.mood]; app.querySelectorAll('.lp-bars .lp-row').forEach((r,i)=>{ const v=Math.round(vals[i]||0); const b=r.querySelector('.bar i'); if(b) b.style.width=clamp(v,0,100)+'%'; const t=r.querySelector('.val'); if(t) t.textContent=v+'/100'; }); bindActs(locId); setTimeout(()=>{ if(window.EGAnim&&!EGAct.busy) window.EGAnim.play(locId==='cafe'||locId==='bookcafe'?'sit':'idle'); },1600); };
  app.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{ egA('tap'); EGAct.run(S,locId,b.dataset.act,{act:(n,ms)=>window.EGAnim?window.EGAnim.act(n,ms,()=>{ if(!window.EGAnim) return; const sit=locId==='cafe'||locId==='bookcafe'; if(sit){ const w=document.getElementById('charWrap'); if(w){ w.classList.remove('eg-resit'); void w.offsetWidth; w.classList.add('eg-resit'); setTimeout(()=>w.classList.remove('eg-resit'),500); } } window.EGAnim.play(sit?'sit':'idle'); }):ms,egA,toast,addXp,save,clamp,rerender:rer}); });
}

SCR.gifts=()=>{
  const G=EGGifts; const items=G.catalog();
  const freeLeft=G.canFree(S)?0:G.freeLeftDays(S);
  const inv=G.ensure(S).inv;
  const inbox=G.ensure(S).inbox||[];
  const chip=g=>{ const so=g.sources||[];
    if(so.includes('coins')) return `<span class="gp-chip"><img src="img/ui/icons/coins.webp" alt="">${g.cost||0} монет</span>`;
    if(so.includes('rewarded')) return `<span class="gp-chip ad"><img src="img/ui/icons/price_ad.webp" alt="">за рекламу</span>`;
    if(so.includes('paid')) return `<span class="gp-chip vote"><img src="img/ui/icons/price_vote.webp" alt="">${g.cost||1} за голоса</span>`;
    return `<span class="gp-chip free"><img src="img/ui/icons/gifts.webp" alt="">бесплатно</span>`; };
  const tag=g=>`<span class="gp-tag">${g.kind==='decor'?'В комнату':'Надеть'}</span>`;
  const unseen=inbox.filter(m=>!m.seen).length;
  const tab=W.__giftTab||'gifts';
  const card=(attr,img,name,sub)=>`<button class="gcard gm" ${attr}><span class="gm-art"><img src="${img}" alt=""></span><b>${name}</b><span class="gm-sub">${sub}</span></button>`;
  const price=g=>{ const so=g.sources||[]; return so.includes('coins')?`<img src="img/ui/icons/coins.webp" alt="">${g.cost||0}`:so.includes('rewarded')?`<img src="img/ui/icons/price_ad.webp" alt="">реклама`:so.includes('paid')?`<img src="img/ui/icons/price_vote.webp" alt="">${g.cost||1}`:'бесплатно'; };
  const row=(m,i,inb)=>{ const g=G.byId(m.id)||{id:m.id,name:'Подарок'}; return `<div class="gw-row" ${inb?`data-in="${i}"`:''}><span class="gw-ava"><img src="${EG.giftImg(g)}" alt=""></span><div><b>${m.from||'Друг'}</b><span>отправил(а) тебе ${g.name}${inb&&!m.seen?' · новое':''}</span></div><img class="gw-gift" src="${EG.giftImg(g)}" alt=""></div>`; };
  const wall=(G.ensure(S).wall||[]);
  let body='';
  if(tab==='gifts') body=`<div class="gift-grid3 gm-grid">
      <button class="gcard gm gm-free" id="free" ${freeLeft?'disabled':''}><span class="gm-art"><img src="img/ui/icons/gifts.webp" alt=""></span><b>Бесплатный</b><span class="gm-sub">${freeLeft?('через '+freeLeft+' дн.'):'доступен'}</span></button>
      <button class="gcard gm gm-free" id="rad"><span class="gm-art"><img src="img/ui/icons/price_ad.webp" alt=""></span><b>За рекламу</b><span class="gm-sub">смотри</span></button>
      ${Object.keys(inv).filter(id=>inv[id]>0&&G.byId(id)).map(id=>card(`data-use="${id}"`,EG.giftImg(G.byId(id)),G.byId(id).name,'♥ x'+inv[id])).join('')}
      ${items.map(g=>card(`data-buy="${g.id}"`,EG.giftImg(g),g.name,price(g))).join('')}</div>`;
  if(tab==='gifts'){ const t=document.createElement('div'); t.innerHTML=body; const cs=[...t.firstElementChild.children]; const first=cs.slice(0,9).map(e=>e.outerHTML).join(''), rest=cs.slice(9).map(e=>e.outerHTML).join('');
    body=`<div class="gift-grid3 gm-grid">${first}</div>@@WALL@@${rest?`<div class="gift-h">Ещё подарки</div><div class="gift-grid3 gm-grid">${rest}</div>`:''}`; }
  else if(tab==='inbox') body=`<div class="gift-wall gm-list">${inbox.slice(0,20).map((m,i)=>row(m,i,1)).join('')||'<p class="gift-empty">Нет входящих</p>'}</div><button class="cu-btn gift-npc" id="npc">Получить подарок от друга</button>`;
  else body=`<div class="gift-wall gm-list">${wall.slice(0,30).map(m=>row(m)).join('')||'<p class="gift-empty">Пока пусто</p>'}</div>`;
  app.innerHTML=`<div class="screen gifts-v2 gifts-mock">
    <div class="gm-head"><button class="gm-back" id="gback" type="button" aria-label="Назад">&#x2190;</button>
      <div class="gm-title"><b>Emogame</b><span>Подарки</span></div>
      <div class="gm-coins"><img src="img/ui/icons/coins.webp" alt="">${fmtNum(S.coins)}</div></div>
    <div class="gm-tabs">${[['gifts','Подарки'],['inbox','Входящие'],['wall','Стена']].map(([k,l])=>`<button class="gm-tab ${tab===k?'on':''}" data-gtab="${k}" type="button">${l}${k==='inbox'&&unseen?`<i class="gift-badge">${unseen}</i>`:''}</button>`).join('')}</div>
    <div class="gifts-scroll eg-scroll">${body.replace('@@WALL@@',tab==='gifts'?`<div class="gm-wall"><div class="gm-wh">Стена подарков</div>${(wall.length?wall:inbox).slice(0,2).map((m,i)=>row(m,i,!wall.length)).join('')||'<p class="gift-empty">Пока пусто</p>'}<button class="gm-all" data-gtab="wall" type="button">Посмотреть все &#x2192;</button></div>`:'')}
    </div>${nav('gifts')}</div>`;
  bindNav();
  $('#gback').onclick=()=>go('home');
  app.querySelectorAll('[data-gtab]').forEach(b=>b.onclick=()=>{ W.__giftTab=b.dataset.gtab; go('gifts'); });
  if($('#free')) $('#free').onclick=()=>{ const r=G.takeFree(S); if(r.ok){ save(); egA('gift_receive'); toast('Бесплатно: '+r.item.name); go('gifts'); } else toast('Через '+r.days+' дн.'); };
  if($('#rad')) $('#rad').onclick=()=>{
    const finish=()=>{ const r=G.fromRewarded(S); if(r.ok){ save(); egA('gift_receive'); toast('За рекламу: '+r.item.name); go('gifts'); } };
    if(!PL.ads.rewardedAvail()){ finish(); return; }
    W.__adResult=(k,ok)=>{ if(ok) finish(); };
    PL.ads.showRewarded('gift');
  };
  app.querySelectorAll('[data-buy]').forEach(b=>b.onclick=async()=>{
    const it=G.byId(b.dataset.buy); if(!it)return;
    if((it.sources||[]).includes('paid')){
      const paid=PL.pay?await PL.pay.purchase('gift_'+it.id):false;
      if(paid){ G.addInv(S,it.id,1); save(); egA('purchase'); egA('gift_open'); toast('Куплено'); go('gifts'); } else toast('Оплата недоступна / отмена');
      return;
    }
    if((it.sources||[]).includes('coins')){
      const r=G.buyCoins(S,it.id); if(r.ok){ save(); egA('purchase'); egA('coin'); toast('Куплено: '+it.name); go('gifts'); } else toast('Мало монет');
    } else toast('Смотри кнопки бесплатно / реклама');
  });
  app.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.use; const it=G.byId(id);
    const el=EGUI.openSheet({title:it.name, icon:EG.giftImg(it), bodyHtml:`<div class="gift-use-body">
      <img class="gift-use-art" src="${EG.giftImg(it)}" alt="">
      <button class="btn" id="u1">${it.kind==='decor'?'Поставить в комнате':'Надеть'}</button>
      <button class="btn ghost" id="u2">Подарить другу (демо)</button>
      <button class="btn ghost" id="cl" data-close="1">Закрыть</button></div>`});
    el.querySelector('#cl').onclick=()=>el._close();
    el.querySelector('#u1').onclick=()=>{
      const r=it.kind==='decor'?G.placeDecor(S,id):G.wear(S,id);
      if(r.ok){ save(); toast('Готово'); el.remove(); go(it.kind==='decor'?'home':'gifts'); }
    };
    el.querySelector('#u2').onclick=()=>{ const r=G.sendDemo(S,id); if(r.ok){ save(); toast('Подарок отправлен'); el.remove(); go('gifts'); } };
  });
  app.querySelectorAll('[data-in]').forEach(b=>b.onclick=()=>{ G.claimInbox(S,+b.dataset.in); save(); toast('На стену'); go('gifts'); });
  if($('#npc')) $('#npc').onclick=()=>{
    const pool=G.catalog(); const it=pool[Math.floor(Math.random()*pool.length)];
    G.receive(S,{giftId:it.id,fromName:'Алекс'}); save(); egA('notification'); toast('Подарок от Алекс'); go('gifts');
  };
};

SCR.coop=()=>{
  let code=(S.coopCode||(Math.random().toString(36).slice(2,8)||'emo123').toUpperCase());
  const paint=(extra)=>{
    app.innerHTML=`<div class="screen">${statRow()}
      <div class="panel" style="position:relative;inset:auto;margin:10px">
        <h3>Кооп-лобби</h3>
        <p style="color:#aaa;font-size:13px">Создай код и поделись другом. Чат только пресетами. Заходи каждый день — друзья тоже ждут ухода.</p>
        <div class="card">Твой код: <b id="code">${code}</b></div>
        <div id="st" style="color:#c8a0b8;font-size:12px;margin:6px 0">${extra||''}</div>
        <input id="join" placeholder="Код друга" maxlength="8" style="width:100%;padding:12px;border-radius:12px;border:1px solid #2a1a24;background:#161018;color:#fff;margin:10px 0">
        <button class="btn" id="mk">Создать лобби</button>
        <button class="btn ghost" id="jn" style="margin-top:8px">Войти</button>
        <button class="btn ghost" id="rf" style="margin-top:8px">Обновить</button>
        <button class="btn ghost" id="back" style="margin-top:8px">Назад</button>
      </div>${nav('map')}</div>`;
    bindNav();
    $('#mk').onclick=async()=>{
      try{
        const r=await Net.lobbyCreate('park');
        const c=(r&&r.j&&(r.j.code||r.j.lobby))||code;
        code=String(c).toUpperCase(); S.coopCode=code; save();
        toast('Лобби '+code); paint('Онлайн · ждём друга');
      }catch(e){ S.coopCode=code; save(); toast('Оффлайн-код '+code); paint('Оффлайн — синк позже'); }
    };
    $('#jn').onclick=async()=>{
      const c=($('#join').value||'').trim().toUpperCase();
      if(c.length<4) return toast('Код?');
      try{
        const r=await Net.lobbyJoin(c);
        if(r&&r.ok===false) return toast('Не вышло войти');
        S.coopCode=c; code=c; save(); toast('В лобби '+c);
        paint('В лобби '+c);
      }catch(e){ toast('Сеть недоступна'); }
    };
    $('#rf').onclick=async()=>{
      paint('Проверяем…');
      if(!S.coopCode) return toast('Сначала создай/войди');
      try{
        const r=await Net.lobbyState(S.coopCode);
        const n=(r&&r.j&&(r.j.players||r.j.n))||'?';
        paint('Игроков: '+n);
      }catch(e){ paint('Нет ответа сервера'); }
    };
    $('#back').onclick=()=>go('map');
  };
  paint();
};

SCR.chat=()=>{
  const peers=[
    {name:'Лила', t:'Наконец-то пятница... Мир такой скучный без вас 😞', av:'lila', tm:'21:30'},
    {name:'ДемонX', t:'Согласен... Спасает только музыка 💔', av:'demonx', tm:'21:32'},
    {name:'Кошмарик', t:'Кто со мной в заброшку сегодня? 👀', av:'koshmarik', tm:'21:35'},
    {name:'Рэйвен', t:'Я с вами! Берите фонарики 🖤', av:'raven', tm:'21:36'}
  ];
  const quick=[['Привет','qr_heart'],['Как дела','qr_broken'],['Идём гулять','qr_bat']];
  const myAv=avatarSrc(S.style,S.gender);
  const scrubChat=t=>{
    if(Array.isArray(t)) t=t[0];
    t=String(t==null?'':t);
    t=t.replace(/[*_`]*qr_[a-z0-9_]+[*_`]*/gi,'').replace(/,\s*$/,'').replace(/^\s*,\s*/,'').trim();
    return t||'…';
  };
  // Always seed demo thread so the middle isn't empty; append user history after
  const demo=peers.map(p=>({me:false,t:p.t,name:p.name,av:p.av,tm:p.tm,demo:true}));
  let hist=[];
  if(S.chat&&S.chat.length){
    S.chat=S.chat.map(m=>Object.assign({},m,{t:scrubChat(m&&m.t)}));
    try{save();}catch(e){}
    hist=S.chat.filter(m=>!m.demo).slice(-6).map(m=>{
      if(m.me) return {me:true,t:m.t,name:'Ты',av:myAv};
      const p=peers[Math.abs((m.t||'').length)%peers.length];
      return {me:false,t:m.t,name:m.name||p.name,av:m.av||p.av};
    });
  }
  const msgs=demo.concat(hist);
  const paint=()=>{
    const list=msgs.map(m=>{
      const src=m.me?myAv:(`img/ui/avatars/${m.av||'lila'}.webp`);
      return `<div class="msg"><span class="av-wrap"><img class="av" src="${src}" alt="" width="58" height="58" decoding="async"></span><div class="bubble"><div class="bh"><span class="nm">${m.name}</span><span class="tm">${m.tm||'сейчас'}</span></div><div class="tx">${m.t}</div><span class="bubble-heart" aria-hidden="true">♥</span></div></div>`;
    }).join('');
    const freeOn=!!(S.sub&&S.sub.freeChat);
    const upsell=freeOn
      ? `<div class="chat-upsell on"><div class="cu-row"><input id="chatFree" type="text" maxlength="80" placeholder="Свободный чат — напиши…" autocomplete="off"><button type="button" id="chatSend" class="cu-send">➤</button></div></div>`
      : `<div class="chat-upsell"><div class="cu-copy"><b>Свободный чат</b><span>Пиши что угодно · без пресетов</span></div><button type="button" id="chatUpsell" class="cu-btn">Открыть · 199 ₽</button></div>`;
    app.innerHTML=`<div class="screen chat-v2">
      <div class="chat-bg" aria-hidden="true"></div>
      <div class="chat-title"><img src="img/ui/chrome/chat_title.webp" alt="Чат"></div>
      <div class="chat-list eg-scroll" id="bub">${list}</div>
      <div class="chat-dock">
        <div class="chat-div"><img src="img/ui/chrome/drip_heart.webp" alt=""></div>
        <div class="quick">${quick.map(([q,ic])=>`<button data-p="${q}"><img src="img/ui/chrome/${ic}.webp" alt="">${q}</button>`).join('')}</div>
        ${upsell}
      </div>
      ${nav('chat')}
    </div>`;
    bindNav();
    const bub=app.querySelector('#bub'); if(bub) bub.scrollTop=bub.scrollHeight;
    const sendTxt=(txt)=>{
      txt=scrubChat(txt); if(!txt||txt==='…') return;
      const peer=peers[Math.floor(Math.random()*peers.length)];
      S.chat=(S.chat||[]).concat([{me:true,t:txt,name:'Ты'}]); egA('chat_send');
      const POOL={
        'Привет':{lila:['Привеет 🖤 скучала','О, ты тут! Хай','Хэй, как настрой?'],demonx:['Йо. Здарова','Привет, бро 🤘','Ну привет, полуночник'],koshmarik:['Бу! 👻 Привет','Приветик из темноты','О, живой человек!'],raven:['Хай 🖤','Привет-привет','Наконец кто-то пишет']},
        'Как дела':{lila:['Грустно, но держусь 😞','Слушаю MCR и норм','Лучше, когда ты пишешь'],demonx:['Как всегда — на грани 💔','Норм, гитару мучаю','Жив. А ты?'],koshmarik:['Ищу приключения 👀','Скучно без заброшек','Отлично, ночь же!'],raven:['Тихо и мрачно — идеально','Пишу стихи 🖤','Нормас, чай пью']},
        'Идём гулять':{lila:['Давай в парк, там фонари','Только если в кафе потом ☕','Иду! Жди у метро'],demonx:['В скейт-парк? Я в деле','Погнали, только недолго','Давай, возьму наушники'],koshmarik:['На кладбище! 👻','Заброшка ждёт 👀','Я уже обуваюсь'],raven:['Я с вами! Берите фонарики 🖤','Ночная прогулка — моё','Только в тёмные улицы']}
      };
      const pk=(peer.av in POOL['Привет'])?peer.av:'raven';
      const arr=((POOL[txt]||{})[pk])||['Ммм, интересно…','Расскажи ещё 🖤','Хах, понимаю','Согласен(на)','Серьёзно? 😮','Это вайб'];
      const last=(S.chat||[]).filter(m=>!m.me).map(m=>m.t);
      const fresh=arr.filter(x=>!last.slice(-6).includes(x));
      const replyTxt=(fresh.length?fresh:arr)[Math.floor(Math.random()*(fresh.length||arr.length))];
      S.chat.push({me:false,t:scrubChat(replyTxt),name:peer.name,av:peer.av}); egA('chat_receive');
      if(S.chat.length>40) S.chat=S.chat.slice(-40);
      S.chats++; S.social=clamp(S.social+2,0,100); qAdd('chats',1); addXp(2); save(); SCR.chat();
    };
    app.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>sendTxt(b.dataset.p));
    const up=app.querySelector('#chatUpsell');
    if(up) up.onclick=async()=>{
      const ok=PL.pay?await PL.pay.purchase('sub_freechat'):true;
      if(ok){ S.sub={freeChat:true,until:Date.now()+30*864e5}; save(); toast('Свободный чат открыт'); SCR.chat(); }
    };
    const send=app.querySelector('#chatSend');
    const inp=app.querySelector('#chatFree');
    if(send&&inp){
      send.onclick=()=>sendTxt(inp.value);
      inp.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); sendTxt(inp.value); } };
    }
  };
  paint();
};


SCR.account=()=>{
  const a=(window.EGAuth&&EGAuth.state())||{provider:'guest'};
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel eg-scroll" style="position:relative;inset:auto;margin:10px;max-height:75vh;overflow:auto">
      <h3>Аккаунт</h3>
      <p style="color:#aaa;font-size:12px">Гость по умолчанию. Привязка ВКонтакте / Одноклассники / Яндекс / Телеграм / ТикТок — облачное сохранение. Почту не показываем.</p>
      <div class="card">Сейчас: <b>${a.displayName||'Гость'}</b> · ${({guest:'гость',vk:'ВКонтакте',ok:'Одноклассники',yandex:'Яндекс',telegram:'Телеграм',tiktok:'ТикТок'})[a.provider]||'гость'}
        <span class="sub">${a.verified?('телефон '+a.phoneMasked):'телефон не подтверждён'} · свободный чат: ${(S.sub&&S.sub.freeChat)?'да':'нет'}</span></div>
      <div class="grid" style="margin-top:10px">
        ${['vk','ok','yandex','telegram','tiktok'].map(pr=>`<button class="card" data-p="${pr}">Войти через ${({vk:'ВКонтакте',ok:'Одноклассники',yandex:'Яндекс',telegram:'Телеграм',tiktok:'ТикТок'})[pr]}</button>`).join('')}
        <button class="card" data-p="guest">Продолжить как гость</button>
        <button class="card" id="ver">Подтвердить телефон</button>
        <button class="card" id="sub">Подписка «Свободный чат»</button>
      </div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-p]').forEach(b=>b.onclick=async()=>{ await EGAuth.login(b.dataset.p); toast('Готово'); go('account'); });
  $('#ver').onclick=async()=>{ await EGAuth.verifyPhone(); toast('Телефон подтверждён'); go('account'); };
  $('#sub').onclick=async()=>{
    const ok=PL.pay?await PL.pay.purchase('sub_freechat'):true;
    if(ok){ S.sub={freeChat:true,until:Date.now()+30*864e5}; save(); toast('Подписка активна'); }
    go('account');
  };
  $('#back').onclick=()=>go('hub');
};

SCR.minigame=()=>{
  let score=0, left=8;
  app.innerHTML=`<div class="screen" style="align-items:center;justify-content:center;padding:20px">
    <h2 style="color:var(--accent)">Танцпол</h2>
    <p style="color:#aaa;margin:8px 0 16px">Жми в такт · осталось <b id="n">${left}</b></p>
    <button class="btn" id="tap" style="width:160px;height:160px;border-radius:50%;font-size:28px">♥</button>
    <p style="margin-top:16px">Очки: <b id="sc">0</b></p>
    <button class="btn ghost" id="done" style="margin-top:20px;max-width:200px">Готово</button>
  </div>`;
  let last=0; if(window.EGAnim) window.EGAnim.play('dance');
  $('#tap').onclick=()=>{
    const now=Date.now(); if(now-last<280) return; last=now;
    left--; score+=10; $('#n').textContent=left; $('#sc').textContent=score;
    if(left<=0){ S.mood=clamp(S.mood+15,0,100); S.coins+=score; addXp(15); save(); toast('Концерт +'+score); go('loc','concert'); }
  };
  $('#done').onclick=()=>{ S.mood=clamp(S.mood+Math.min(15,score/10),0,100); S.coins+=score; save(); go('map'); };
};

// boot


SCR.more=()=>SCR.hub();
SCR.hub=()=>{
  const items=[
    ['consentSet','settings','Настройки'],['sleep','energy','Сон'],['band','fame','Группа / гиги'],['mg_music','energy','Музыка'],
    ['selfie','fame','Селфи'],['npc','hub','Знакомые'],['diary','quests','Дневник'],
    ['collections','gifts','Коллекции'],['decor','home','Декор'],['pet','mood','Чёрный кот'],
    ['jobs','coins','Работа'],['ach','fame','Ачивки'],['minigame','mood','Танцы'],
    ['mg_skate','map','Скейт'],['mg_arcade','hub','Аркада'],['mg_karaoke','fame','Караоке'],
    ['coop','gifts','Кооп'],['account','home','Аккаунт']
  ];
  /* 0.8.4: hub laid out like its mock (header, sub-bar, big illustrated cards, rest as compact list) */
  const big=[['selfie','selfie','Селфи дневник','Воспоминания и эмоции'],['pet','pet','Питомцы','Заботься и играй'],
    ['jobs','jobs','Работа','Зарабатывай эмокоины'],['collections','frames','Пиксельные рамки','Коллекционируй и украшай']];
  const rest=items.filter(([id])=>!['selfie','pet','jobs','collections','band'].includes(id));
  app.innerHTML=`<div class="screen hub-mock">
    <div class="gm-head"><button class="gm-back" id="hback" type="button" aria-label="Назад">&#x2190;</button>
      <div class="gm-title"><b><i class="o">Emo</i>game</b><span>-&#x2665;-</span></div>
      <div class="gm-coins hb-more">&#x2665; Ещё</div></div>
    <div class="hb-sub"><b>&#x2665; Ещё</b><i></i><button data-g="decor" aria-label="Магазин">${ico('gifts')}</button><button data-g="chat" aria-label="Почта">${ico('hub')}</button><button data-g="consentSet" aria-label="Настройки">${ico('settings')}</button><button data-g="account" aria-label="Помощь">?</button></div>
    <div class="hb-scroll eg-scroll">
      <div class="hb-grid">${big.map(([id,art,t,sub])=>`<button class="hb-card" data-g="${id}"><span class="hb-art"><img src="img/ui/hub/${art}.webp" alt=""></span><b>${t}</b><span>${sub}</span><em>&#x203A;</em></button>`).join('')}
        <button class="hb-card hb-wide" data-g="band"><span class="hb-art"><img src="img/ui/hub/band.webp" alt=""></span><b>Банды</b><span>Создавай. Сражайся. Будь легендой</span><em>&#x203A;</em></button></div>
      <div class="hb-list">${rest.map(([id,ic,lab])=>`<button class="card" data-g="${id}">${ico(ic)} ${lab}</button>`).join('')}</div>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>go(b.dataset.g));
  const hb=$('#hback'); if(hb) hb.onclick=()=>go('home');
};

SCR.band=()=>{
  const gigs=(EGBand.catalog().gigs||[]);
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px;max-height:75vh;overflow:auto">
      <h3>Группа · гиги: ${S.gigs|0}</h3>
      <p style="color:#aaa;font-size:12px">Музыка ${(S.music|0)} · слава ${(S.fame|0)}</p>
      <div class="grid">${gigs.map(g=>`<button class="card" data-g="${g.id}" ${EGBand.canPlay(S,g)?'':'disabled'} style="${EGBand.canPlay(S,g)?'':'opacity:.4'}">
        <b>${g.name}</b><span class="sub">ур.${g.minLevel} · ${g.pay} · слава ${g.fame} · ${g.energy}</span></button>`).join('')}</div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{
    const r=EGBand.playGig(S,b.dataset.g); if(!r.ok) return toast('Нельзя сейчас');
    addXp(12); EGAch&&EGAch.check(S); save(); toast('Гиг! +'+r.g.pay); go('band');
  });
  $('#back').onclick=()=>go('hub');
};

SCR.mg_music=()=>{
  let hits=0,total=10,left=10;
  app.innerHTML=`<div class="screen" style="align-items:center;justify-content:center;padding:20px">
    <h2 style="color:var(--accent)">Ритм</h2>
    <p style="color:#aaa">Жми в такт · осталось <b id="n">${left}</b></p>
    <button class="btn" id="tap" style="width:140px;height:140px;border-radius:50%;font-size:26px">♪</button>
    <p>Попадания: <b id="h">0</b></p>
    <button class="btn ghost" id="done" style="margin-top:16px;max-width:200px">Готово</button>
  </div>`;
  let last=0;
  $('#tap').onclick=()=>{ const now=Date.now(); if(left<=0)return; left--; $('#n').textContent=left;
    if(now-last>350&&now-last<900) hits++; last=now; $('#h').textContent=hits; };
  $('#done').onclick=()=>{ const r=EGMusic.play(S,hits,total); addXp(r.xp); EGAch&&EGAch.check(S); save(); toast('Счёт '+r.score); go('hub'); };
};

SCR.selfie=()=>{
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px">
      <h3>Селфи · ${S.followers|0}</h3>
      <p style="color:#aaa;font-size:12px">Фильтр влияет на охваты. Заглядывай каждый день — лента любит активность.</p>
      <div class="grid">
        <button class="card" data-f="emo">Эмо</button>
        <button class="card" data-f="alt">Альт</button>
        <button class="card" data-f="idol">Айдол</button>
      </div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{
    const r=EGSelfie.shoot(S,b.dataset.f); if(!r.ok) return toast('Мало энергии');
    addXp(5); EGAch&&EGAch.check(S); save(); toast('+'+r.gain+' подписчиков'); go('selfie');
  });
  $('#back').onclick=()=>go('hub');
};

SCR.npc=()=>{
  const list=EGNpc.list();
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px;max-height:75vh;overflow:auto">
      <h3>Знакомые</h3>
      <div class="grid">${list.map(n=>{ const r=EGNpc.rel(S,n.id);
        return `<button class="card" data-n="${n.id}"><img src="${n.av||('img/ui/avatars/npc_'+n.id+'.webp')}" alt="" style="width:56px;height:56px;border-radius:50%;border:2px solid #ff3d8b;display:block;margin:0 auto 4px"><b>${n.name}</b><span class="sub">${((EG.LOCS||[]).find(l=>l.id===n.loc)||{}).name||locName(n.loc)} · связь ${r.bond|0}${r.met?'':' · не встречен'}</span></button>`; }).join('')}</div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{ EGNpc.meet(S,b.dataset.n); EGAch&&EGAch.check(S); save(); toast('Поговорили'); go('npc'); });
  $('#back').onclick=()=>go('hub');
};

const MOOD_RU={'😊':'радость','😢':'грусть','😤':'злость','😴':'сонно','🖤':'эмо','💖':'любовь','🎸':'музыка','🌧️':'дождь','🌧':'дождь'};
const moodRu=m=>MOOD_RU[m]||m;
SCR.diary=()=>{
  const d=EGDiary.prompts(); const moods=d.moods||['грусть'];
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel diary-panel" style="position:relative;inset:auto;margin:10px">
      <h3>Дневник настроения</h3>
      <p style="color:#aaa;font-size:12px">${(d.prompts||['Как день?'])[Math.floor(Math.random()*(d.prompts||['?']).length)]}</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${moods.map(m=>`<button class="chip" data-m="${m}">${moodRu(m)}</button>`).join('')}</div>
      <input id="tx" placeholder="Пара слов…" maxlength="140" style="width:100%;padding:12px;border-radius:12px;border:1px solid #2a1a24;background:#161018;color:#fff">
      <button class="btn" id="ok" style="margin-top:10px">Записать</button>
      <button class="btn ghost" id="back" style="margin-top:8px">Назад</button>
      <div style="margin-top:12px;font-size:12px;color:#aaa">${(S.diary||[]).slice(-5).reverse().map(e=>`<div>${moodRu(e.mood)} ${e.day}: ${e.text||'—'}</div>`).join('')}</div>
    </div>${nav('hub')}</div>`;
  bindNav(); let mood=moods[0];
  app.querySelectorAll('[data-m]').forEach((b,i)=>{ if(!i) b.classList.add('on'); b.onclick=()=>{ mood=b.dataset.m; app.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b)); egA&&egA('tap'); }; });
  $('#ok').onclick=()=>{ EGDiary.write(S,mood,$('#tx').value); EGAch&&EGAch.check(S); save(); toast('Записано — заходи завтра'); go('diary'); };
  $('#back').onclick=()=>go('hub');
};

SCR.collections=()=>{
  const sets=EGCollections.sets();
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px;max-height:75vh;overflow:auto">
      <h3>Коллекции</h3>
      <div class="grid">${sets.map(s=>{ const p=EGCollections.progress(S,s); const claimed=S.colClaimed&&S.colClaimed[s.id];
        return `<button class="card" data-c="${s.id}" ${p.done&&!claimed?'':'aria-disabled="true"'} style="${p.done?'':'opacity:.5'}">${s.img?`<img src="${s.img}" alt="" style="width:64px;height:64px;image-rendering:pixelated">`:''}<b>${s.name}</b>
          <span class="sub">${p.have}/${p.need}${claimed?' · ✓':''}</span></button>`; }).join('')}</div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{ const r=EGCollections.claim(S,b.dataset.c); if(!r.ok){ egA('error'); const s0=sets.find(x=>x.id===b.dataset.c); const pp=s0?EGCollections.progress(S,s0):null; return toast(pp&&pp.done?'Уже получено':'Собери все предметы'+(pp?' · '+pp.have+'/'+pp.need:'')); } EGAch&&EGAch.check(S); save(); toast('Коллекция!'); go('collections'); });
  $('#back').onclick=()=>go('hub');
};

SCR.decor=()=>{
  const items=(EGDecor.catalog().items||[]);
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px;max-height:75vh;overflow:auto">
      <h3>Декор комнаты</h3>
      <p style="color:#aaa;font-size:12px">Слоты: ${Object.entries(S.decor||{}).map(([k,v])=>({wall:'стена',light:'свет',floor:'пол',shelf:'полка',pet:'питомец'})[k]+': '+(((EGDecor.catalog().items||[]).find(i=>i.id===v)||{}).name||'—')).join(', ')||'пусто'}</p>
      <div class="grid">${items.map(it=>`<button class="card" data-d="${it.id}"><b>${it.name}</b><span class="sub">${({wall:'стена',light:'свет',floor:'пол',shelf:'полка',pet:'питомец'})[it.slot]||''} · ${it.cost} монет · +${it.mood} настрой</span></button>`).join('')}</div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{ const r=EGDecor.place(S,b.dataset.d); if(!r.ok)return toast('Мало монет'); EGAch&&EGAch.check(S); save(); toast('Поставлено'); go('decor'); });
  $('#back').onclick=()=>go('hub');
};

SCR.pet=()=>{
  const p=EGPet.ensure(S); const acts=EGPet.meta().actions||[];
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px">
      <h3>${p.name||'Тень'}</h3>
      <img src="img/pet/black_cat_idle.png" alt="" style="width:96px;height:96px;image-rendering:pixelated;display:block;margin:8px auto" onerror="this.style.display='none'">
      <p style="text-align:center;color:#aaa;font-size:12px">Голод ${Math.round(p.hunger)} · связь ${Math.round(p.bond)}</p>
      <p style="color:#c8a0b8;font-size:12px;text-align:center">Корми кота каждый день — иначе связь падает</p>
      <div class="grid">${acts.map(a=>`<button class="card" data-a="${a.id}"><b>${a.name}</b><span class="sub">${a.cost?a.cost:'бесплатно'}</span></button>`).join('')}</div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ const r=EGPet.act(S,b.dataset.a); if(!r.ok){ egA('error'); return toast('Нельзя'); } egA(b.dataset.a==='pet'||b.dataset.a==='stroke'?'cat_purr':'cat_meow'); EGAch&&EGAch.check(S); save(); toast('Мяу'); const pa=b.dataset.a; if(pa==='pet'||pa==='play'){ go('home'); setTimeout(()=>{ if(cur==='home'&&window.EGAnim) window.EGAnim.act(pa,3000,()=>window.EGAnim.fromNeeds(S)); },60); } else go('pet'); });
  $('#back').onclick=()=>go('hub');
};

SCR.jobs=()=>{
  const list=EGJobs.list();
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px;max-height:75vh;overflow:auto">
      <h3>Работа · смен: ${S.jobs|0}</h3>
      <div class="grid">${list.map(j=>`<button class="card" data-j="${j.id}" ${(S.level>=(j.minLevel||1)&&S.energy>=(j.energy||10))?'':'disabled'} style="${(S.level>=(j.minLevel||1))?'':'opacity:.4'}">
        <b>${j.name}</b><span class="sub">${LOC_RU[j.loc]||j.loc} · ур.${j.minLevel} · +${j.pay} монет · −${j.energy} энергии</span></button>`).join('')}</div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{ const r=EGJobs.work(S,b.dataset.j); if(!r.ok)return toast(r.err==='energy'?'Мало энергии':'Уровень'); addXp(8); EGAch&&EGAch.check(S); save(); toast('+'+r.j.pay); go('jobs'); });
  $('#back').onclick=()=>go('hub');
};

SCR.ach=()=>{
  const list=EGAch.list();
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px;max-height:75vh;overflow:auto">
      <h3>Ачивки · ${Object.keys(S.ach||{}).length}/${list.length}</h3>
      <div class="grid">${list.map(a=>{ const on=S.ach&&S.ach[a.id];
        return `<div class="card" style="${on?'':'opacity:.45'}"><img src="${a.icon||''}" width="32" height="32" style="image-rendering:pixelated" onerror="this.style.display='none'"><b>${a.name||a.title||''}</b>
          <span class="sub">${a.desc||(('+'+(a.xp||0)+' опыта · +'+(a.coins||0)+' монет'))}${on?' · ✓':''}</span></div>`; }).join('')}</div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav(); $('#back').onclick=()=>go('hub');
};

SCR.mg_skate=()=>{
  let tricks=0,left=6;
  app.innerHTML=`<div class="screen" style="align-items:center;justify-content:center;padding:20px">
    <h2 style="color:var(--accent)">Скейт</h2>
    <p style="color:#aaa">Трюки · осталось <b id="n">${left}</b></p>
    <button class="btn" id="tap" style="width:140px;height:140px;border-radius:50%">Жми</button>
    <p>Трюки: <b id="h">0</b></p>
    <button class="btn ghost" id="done" style="margin-top:16px;max-width:200px">Готово</button></div>`;
  $('#tap').onclick=()=>{ if(left<=0)return; left--; if(Math.random()>0.35)tricks++; $('#n').textContent=left; $('#h').textContent=tricks; };
  $('#done').onclick=()=>{ const sc=EGMinigames.skate(S,tricks); addXp(6); save(); toast('+'+sc); go('hub'); };
};

SCR.mg_arcade=()=>{
  app.innerHTML=`<div class="screen" style="align-items:center;justify-content:center;padding:20px">
    <h2 style="color:var(--accent)">Аркада</h2>
    <p style="color:#aaa">Угадай сторону</p>
    <div style="display:flex;gap:12px"><button class="btn" id="l">◀</button><button class="btn" id="r">▶</button></div>
    <button class="btn ghost" id="back" style="margin-top:16px;max-width:200px">Назад</button></div>`;
  const play=side=>{ const win=Math.random()>0.45; EGMinigames.arcade(S,win); addXp(win?5:1); save(); toast(win?'Победа!': 'Мимо'); go('hub'); };
  $('#l').onclick=()=>play(0); $('#r').onclick=()=>play(1); $('#back').onclick=()=>go('hub');
};

SCR.mg_karaoke=()=>{
  let score=0,left=8;
  app.innerHTML=`<div class="screen" style="align-items:center;justify-content:center;padding:20px">
    <h2 style="color:var(--accent)">Караоке</h2>
    <p style="color:#aaa">Пой · <b id="n">${left}</b></p>
    <button class="btn" id="tap" style="width:140px;height:140px;border-radius:50%">Жми</button>
    <p>Очки: <b id="sc">0</b></p>
    <button class="btn ghost" id="done" style="margin-top:16px;max-width:200px">Готово</button></div>`;
  $('#tap').onclick=()=>{ if(left<=0)return; left--; score+=10+Math.floor(Math.random()*15); $('#n').textContent=left; $('#sc').textContent=score; };
  $('#done').onclick=()=>{ EGMinigames.karaoke(S,score); addXp(8); save(); toast('Браво '+score); go('hub'); };
};

async function boot(){
  if(window.EGRC) EGRC.apply({});
  EG=await EGContent.load();
  try{ if(window.EGAudio) await EGAudio.init(); }catch(e){}
  window.EG=EG;
  S=EGSave.load(); window.S=S;
  if(window.EGEvents) EGEvents.fromPack();
  const ctx={S,EG,PL,save,go,toast};
  if(window.EGModules) EGModules.initAll(ctx);
  tickNeeds(); ensureQuests();
  const q=new URLSearchParams(location.search);
  const shotGo=SHOT && q.get('go');
  if(shotGo){
    const live=q.get('live')==='1' || q.get('proof')==='1';
    S.consent=S.consent||Date.now(); S.name=S.name||'Пустышка';
    S.style=q.get('style')||(live?'goth':'emo'); S.gender=q.get('gender')||(live?'girl':'guy');
    S.char={style:S.style,gender:S.gender};
    S.hunger=q.get('hunger')!=null?+q.get('hunger'):(live?20:8);
    S.thirst=q.get('thirst')!=null?+q.get('thirst'):(live?30:25);
    S.energy=q.get('energy')!=null?+q.get('energy'):(live?50:60);
    S.mood=q.get('mood')!=null?+q.get('mood'):(live?85:10);
    S.coins=q.get('coins')!=null?+q.get('coins'):(live?999:12450);
    S.gems=q.get('gems')!=null?+q.get('gems'):320;
    S.level=q.get('level')!=null?+q.get('level'):24;
    S.xp=Math.round(xpNeed(S.level)*0.65);
    S.streak=S.streak||{n:3,last:'',freeze:0}; S.streak.n=Math.max(S.streak.n||0,3);
    S.dirt=live?{trash:42,dishes:18,laundry:25}:{trash:0,dishes:0,laundry:0};
    S.styleStat=125; S.wardrobe=S.wardrobe||{};
    S.gifts=S.gifts||{inbox:[{id:'p1',seen:false},{id:'p2',seen:false}],outbox:[]};
    if(q.get('phase')) window.__EG_PHASE=q.get('phase');
    else if(live) window.__EG_PHASE='night';
    localStorage.setItem('eg_created','1'); localStorage.setItem('eg_care_onboard','1');
    save();
    if(shotGo!=='room'&&(EG.LOCS||[]).some(l=>l.id===shotGo)||shotGo==='metro'||shotGo==='cafe'||shotGo==='park'||shotGo==='station'){ go('loc', shotGo); return; }
    if(shotGo==='loc'){ go('loc', q.get('loc')||q.get('a')||'metro'); return; }
    if(shotGo==='more'){ go('hub'); return; }
    if(shotGo==='quests'){ go('home'); requestAnimationFrame(()=>openQuests()); return; }
    if(shotGo==='shop'){ go('home'); requestAnimationFrame(()=>openShop()); return; }
    go(shotGo, q.get('a')||undefined); return;
  }
  if(S.consent!=null){ try{ PL.setConsent(S.stats!==false,S.pers!==false); }catch(e){} } /* 0.8.1 boot consent */
  if(S.consent==null) go('consent');
  else if(!localStorage.getItem('eg_care_onboard')) go('onboardCare');
  else if(!localStorage.getItem('eg_created')) go('create');
  else { EGCare&&EGCare.onLogin(S); save(); go('home'); Net.register().then(()=>Net.sync().then(j=>{applyServer(j);return Net.registerPush();})).catch(()=>{}); }
  W.__egMaybeInterstitial=()=>{
    if(SHOT) return;
    if(!EGRC.bool('ads_interstitial_enabled', false)) return;
    if(PL.ads.interstitialOn&&PL.ads.interstitialOn()) PL.ads.showInterstitial();
  };
}
boot();
})();

/* 0.8.1 tapfx */
document.addEventListener('click',function(e){ var t=e.target.closest&&e.target.closest('#tap,#mk,#rf,#jn,.feed-tab.on'); if(t){ try{ window.EGAudio&&EGAudio.emit('tap',{}); }catch(_){} } },true);
