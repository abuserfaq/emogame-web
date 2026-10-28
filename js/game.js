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
window.toast=function(t){ const e=document.createElement('div'); e.className='toast'; e.textContent=t; app.appendChild(e);
  setTimeout(()=>e.style.opacity=0,1600); setTimeout(()=>e.remove(),2100); };

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
function dirtRow(){
  const d=S.dirt||{trash:0,dishes:0,laundry:0};
  return `<div class="dirt-row">
    <button class="chip" data-clean="trash">${ico('trash')}<b>${Math.round(d.trash)}</b>мусор</button>
    <button class="chip" data-clean="dishes">${ico('dishes')}<b>${Math.round(d.dishes)}</b>посуда</button>
    <button class="chip" data-clean="laundry">${ico('laundry')}<b>${Math.round(d.laundry)}</b>бельё</button>
    <button class="chip" data-clean="all">${ico('clean')}убрать всё</button>
  </div>`;
}
function bindClean(){
  app.querySelectorAll('[data-clean]').forEach(b=>b.onclick=()=>{
    const kind=b.dataset.clean;
    walkCharTo('.'+({trash:'hot-trash',dishes:'hot-dishes',laundry:'hot-laundry'}[kind]||'hot-trash'), 'clean');
    setTimeout(()=>{
      EGCare.clean(S,kind); S.cleans++; qAdd('cleans',1); addXp(6); save();
      egA(kind==='trash'?'trash':kind==='dishes'?'dishes':kind==='laundry'?'laundry':'clean'); toast('Чисто!'); go(cur==='home'?'home':cur);
    }, 800);
  });
}

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
function bindRoomInteract(){
  app.querySelectorAll('[data-ri]').forEach(b=>b.onclick=()=>{
    const kind=b.dataset.ri;
    const map={bed:['.hot-bed','sleep'],fridge:['.hot-fridge','eat'],window:['.hot-window','react'],table:['.hot-table','drink']};
    const [sel,anim]=map[kind]||['.hot-bed','idle'];
    walkCharTo(sel, anim);
    setTimeout(()=>{
      if(kind==='bed'){ S.energy=Math.min(100,(S.energy||0)+12); egA('sleep'); toast('Сладких снов'); }
      else if(kind==='fridge'||kind==='table'){ S.hunger=Math.min(100,(S.hunger||0)+8); S.thirst=Math.min(100,(S.thirst||0)+6); egA(kind==='fridge'?'eat':'drink'); toast(kind==='fridge'?'Перекус':'Глоток'); }
      else { S.mood=Math.min(100,(S.mood||0)+5); egA('happy'); toast('У окна…'); }
      save();
    }, 900);
  });
}
function bindNav(){ app.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{ egA('tab'); go(b.dataset.go); })); }

function go(n,a){ tickNeeds(); clear(); setPhaseClass(); if(n!==cur) egA('tap'); cur=n; try{ const ph=phase(); const loc=(n==='loc'&&a)?a:(n==='home'?'room':(S&&S.loc)); egA('scene',{screen:n,loc:loc,phase:ph,weather:S&&S.weather}); }catch(e){} 
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
    const navEl=app.querySelector('.nav-dock')||app.querySelector('.nav');
    const host=(navEl&&navEl.parentElement&&navEl.parentElement.classList.contains('screen')&&!navEl.parentElement.classList.contains('immersive'))
      ? navEl.parentElement : app;
    host.appendChild(bs);
  }
  try{ PL.event('screen',{n}); }catch(e){}
}

const SCR={};

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

function decorHTML(){
  const d=S.decor||{}; const slots=Object.keys(d);
  if(!slots.length) return '';
  return slots.map((slot,i)=>{
    const id=d[slot]; const g=EGGifts.byId(id); if(!g) return '';
    const left=20+(i*18)%60; const bottom=12+(i%3)*10;
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
    ${decorHTML()}
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
  return bits.length?`<div class="ambient">${bits.join('')}</div>`:'';
}
function walkCharTo(sel, thenPlay){
  const wrap=$('#charWrap'); const el=$('#charSpr'); if(!wrap||!el) return;
  const t=app.querySelector(sel); if(!t){ if(EGAnim) EGAnim.play(thenPlay||'idle'); return; }
  const sr=wrap.getBoundingClientRect(); const tr=t.getBoundingClientRect(); const ar=app.getBoundingClientRect();
  const nx=((tr.left+tr.width/2)-ar.left)/ar.width*100;
  const nb=100-((tr.top+tr.height)-ar.top)/ar.height*100;
  wrap.classList.add('walking');
  wrap.style.left=nx+'%'; wrap.style.bottom=Math.max(12, Math.min(40, nb-2))+'%';
  if(EGAnim) EGAnim.play('walk'); egA('footsteps');
  setTimeout(()=>{ wrap.classList.remove('walking'); if(EGAnim) EGAnim.play(thenPlay||'happy'); }, 750);
}

function mountAnim(opts){
  const el=$('#charSpr'); if(!el||!window.EGAnim) return;
  opts=opts||{};
  (function(){ let st=S.style,g=S.gender; const fs=EG.ANIMS&&EG.ANIMS.frameSets;
      if(!(fs&&fs[st+'_'+g])){ if(st==='goth'){st='goth';g='girl';} else if(st==='punk'){st='punk';g='guy';} else if(st==='skater'){st='skater';g='girl';} }
      EGAnim.mount(el,st,g);
      if(opts.pose==='sit'){ EGAnim.play('sit'); }
      else { EGAnim.fromNeeds(S); }
  })();
}

SCR.home=()=>{
  S.loc='room'; save();
  const stN=(S.streak&&S.streak.n)||0;
  app.innerHTML=`<div class="screen immersive home-mode">
    ${stageHTML('room', true)}
    ${dirtHotspots()}
    ${roomInteract()}
    <button class="scene-fab" id="wardrobe" type="button" aria-label="Гардероб"><span class="fab-ring"><img class="fab-hanger" src="img/ui/icons/wardrobe.png" alt=""><span class="fab-lab">ГАРДЕРОБ</span></span></button>
    ${hudHTML()}
    ${nav('home')}
  </div>`;
  bindNav(); bindClean(); bindRoomInteract(); mountAnim(); if(EGAnim) EGAnim.play('idle');
  const g=$('#hudGear'); if(g) g.onclick=()=>go('consentSet');
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
    const badge=locked?'<span class="ward-badge lock" aria-hidden="true">🔒</span>':(eq?'<span class="ward-badge check" aria-hidden="true">✓</span>':'');
    return `<button class="card food-card ward-card ${eq?'on':''} ${locked?'locked':''}" data-w="${it.id}" data-slot="${it.slot}" ${locked?'disabled':''}>
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
    if(!S.wardrobe[it.id]){
      if(S.coins<it.cost){ egA('error'); egA('error'); toast('Мало монет'); return; }
      S.coins-=it.cost; S.wardrobe[it.id]=1; S.styleStat=clamp(S.styleStat+it.style,0,100);
      toast('Куплено: '+it.name);
    }
    S.equip=S.equip||{}; S.equip[it.slot]=it.id; save();
    go('wardrobe');
  });
  app.querySelectorAll('[data-gw]').forEach(b=>b.onclick=()=>{
    const r=EGGifts.wear(S,b.dataset.gw); if(r.ok){ save(); egA('happy'); toast('Надето'); go('home'); EGAnim&&EGAnim.play('happy'); }
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
      '<p style="color:#888;font-size:13px;margin:8px 0">Платные пакеты — VK/OK/ФС или RuStore / ЮKassa.</p>'}
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
      <span class="sub">${locked?('🔒 ур.'+need):`<img class="coin" src="img/ui/icons/coins.webp" alt=""> ${f.cost}`}</span>
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
        <button type="button" class="feed-tab ${tab==='food'?'on':''}" data-tab="food" role="tab">🍽 Еда</button>
        <button type="button" class="feed-tab ${tab==='drinks'?'on':''}" data-tab="drinks" role="tab">☕ Напитки</button>
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
      S.feeds++; qAdd('feeds',1); addXp(5); save(); toast('Вкусно'); egA('eat'); if(EGAnim) EGAnim.play('eat'); setTimeout(()=>paint('food'),500);
    });
    app.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{
      const f=EG.DRINKS.find(x=>x.id===b.dataset.d); if(!f||S.coins<f.cost)return toast('Мало монет');
      S.coins-=f.cost; S.thirst=clamp(S.thirst+f.thirst,0,100); S.energy=clamp(S.energy+(f.energy||0),0,100);
      S.mood=clamp(S.mood+(f.mood||0),0,100); S.dirt.dishes=clamp((S.dirt.dishes||0)+8,0,100);
      S.drinks++; qAdd('drinks',1); addXp(4); save(); toast('Бульк'); egA('drink'); if(EGAnim) EGAnim.play('drink'); setTimeout(()=>paint('drinks'),500);
    });
  };
  paint(tab0);
};

SCR.sleep=()=>{
  app.innerHTML=`<div class="screen">${statRow()}${stageHTML('room')}
    <div style="padding:12px"><button class="btn" id="sl">Спать (восстановить энергию)</button>
    <p style="color:#888;font-size:12px;margin-top:8px;text-align:center">Сон восстанавливает энергию. Нужды всё равно тикают офлайн — заходи каждый день.</p></div>${nav('sleep')}</div>`;
  bindNav(); mountAnim(); if(EGAnim) EGAnim.play('sleep');
  $('#sl').onclick=()=>{
    S.energy=clamp(S.energy+55,0,100); S.mood=clamp(S.mood+10,0,100); S.hunger=clamp(S.hunger-8,0,100);
    S.dirt.laundry=clamp((S.dirt.laundry||0)+15,0,100);
    S.sleeps++; qAdd('sleeps',1); addXp(8); save(); toast('Спокойной ночи'); egA('sleep'); go('home');
  };
};

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
    ${nav('map')}
  </div>`;
  bindNav();
  const g=$('#hudGear'); if(g) g.onclick=()=>go('consentSet');
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
    const weatherLine=isMetro?'❄ Снег · Зима · −6°C · Ощущается как −9°C':(isPark?'🌧 ВЕЧЕР · 14°C':(isCafe?'☕ УТРО · кафе':(wtxt||'—')));
  const locCls='loc-mode loc-'+(loc.id||'x');
  const showHud=isCafe||isPark;
  const seg=(v)=>{ const n=Math.max(0,Math.min(4, Math.round((v||0)/25))); return `<span class="seg">${[0,1,2,3].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`; };
  const cafeParkHud=()=>{
    const nm=S.name||'×_МРАЧКА_×';
    const hearts=Math.round(clamp((S.mood||0)/10,0,10));
    const heartRow=[...Array(10)].map((_,i)=>`<i class="hrt ${i<hearts?'on':''}">♥</i>`).join('');
    const phaseLab=isCafe?'УТРО':'ВЕЧЕР';
    const phaseIc=isCafe?'☀':'🌧';
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
    <div class="loc-badge">${isCafe?'☕ КАФЕ':'🌳 ПАРК'}</div>`;
  };
  const statusCard=`<div class="lp-card">
        <div class="lp-status-h"><span>СТАТУС</span><span>♡ ${Math.round(S.mood||0)}/100</span></div>
        <div class="lp-bars">
          ${[['Голод',S.hunger,'#e53935'],['Жажда',S.thirst,'#1e88e5'],['Энергия',S.energy,'#8e24aa'],['Настрой',S.mood,'#ff2d78']].map(([n,v,c])=>`
            <div class="lp-row"><span class="nm">${n}</span><div class="bar"><i style="width:${clamp(v,0,100)}%;background:${c}"></i></div><span class="val">${Math.round(v)}/100</span></div>`).join('')}
        </div>
      </div>`;
  app.innerHTML=`<div class="screen immersive ${locCls}">
    ${stageHTML(loc.id, true)}
    ${showHud?cafeParkHud():''}
    <div class="loc-head ${isMetro?'metro-head':''} ${isCafe?'cafe-head':''} ${isPark?'park-head':''}">${isMetro?'<div class="metro-m" aria-hidden="true">M</div>':''}<div style="flex:1;min-width:0"><div class="mt">${headTitle}</div>
      <div class="ms">${headSub}</div></div>
      <div class="loc-head-right">${isMetro?`<span class="metro-wx">${ico('snowflake')}<b>${hh}:${mm}</b></span><span class="metro-bat">${ico('battery')}<b>36%</b></span>`:`<b class="loc-clock">${hh}:${mm}</b>`}</div>
      ${(!isMetro)?`<button class="btn ghost" id="back" style="margin-left:8px;width:auto;padding:8px 10px;font-size:12px">←</button>`:''}</div>
    <div class="loc-panel" id="locPanel">
      <div class="lp-card">
        <div class="lp-top">
          <img class="lp-pin" src="img/ui/pins/${isMetro?'metro':(loc.id||'metro')}.webp" alt="" onerror="this.src='img/ui/chrome/map_pin_generic.webp'">
          <div><div class="lp-title">${locTitle|| (isCafe?'КАФЕ':isPark?'ПАРК':(loc.name||''))}</div><div class="lp-sub">${locSub}</div></div>
        </div>
        <div class="lp-weather">${weatherLine}</div>
        ${isMetro?`<div class="lp-status-h"><span>СТАТУС</span><span>♡ ${Math.round(S.mood||0)}/100</span></div>
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
  bindNav();
  if(isCafe) mountAnim({pose:'sit'});
  else { mountAnim(); if(EGAnim) EGAnim.play('idle'); }
  const gBtn=$('#hudGear'); if(gBtn) gBtn.onclick=()=>go('consentSet');
  const back=$('#back'); if(back) back.onclick=()=>go('map');
  const chatBtn=$('#chat'); if(chatBtn) chatBtn.onclick=()=>go('chat');
  const m=$('#mini'); if(m) m.onclick=()=>go(loc.id==='skate'?'mg_skate':loc.id==='arcade'?'mg_arcade':loc.id==='karaoke'?'mg_karaoke':loc.id==='records'?'mg_music':'minigame');
  const g=$('#gig'); if(g) g.onclick=()=>go('band');
};

SCR.gifts=()=>{
  const G=EGGifts; const items=G.catalog();
  const freeLeft=G.canFree(S)?0:G.freeLeftDays(S);
  const inv=G.ensure(S).inv;
  const inbox=G.ensure(S).inbox||[];
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px;max-height:70vh;overflow:auto">
      <h3>Подарки</h3>
      <p style="color:#aaa;font-size:12px;margin:0 0 8px">Бесплатный подарок раз в <b>${EGRC.freeGiftIntervalDays()}</b> дн. (RC). Сейчас: ${freeLeft?('через '+freeLeft+' дн.'):'доступен!'}</p>
      <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <button class="btn" id="free" ${freeLeft?'disabled':''}>${ico('gifts')} Бесплатный</button>
        <button class="btn ghost" id="rad">▶ За рекламу</button>
      </div>
      <h3>Каталог</h3>
      <div class="gift-grid">${items.map(g=>{
        const src=(g.sources||[]).join('/');
        return `<button class="card" data-buy="${g.id}"><img src="${EG.giftImg(g)}" alt="" onerror="this.style.display='none'"><b>${g.name}</b>
          <span class="sub">${src}${g.cost?(' · '+g.cost):''} · ${g.kind}</span></button>`;
      }).join('')}</div>
      <h3 style="margin-top:12px">Инвентарь</h3>
      <div class="gift-grid">${Object.keys(inv).map(id=>{ const g=G.byId(id); if(!g)return '';
        return `<button class="card" data-use="${id}"><img src="${EG.giftImg(g)}"><b>${g.name} ×${inv[id]}</b>
          <span class="sub">${g.kind==='decor'?'поставить':'надеть'} / подарить</span></button>`; }).join('')||'<p style="color:#888;font-size:12px">Пусто</p>'}
      </div>
      <h3 style="margin-top:12px">Входящие ${inbox.some(m=>!m.seen)?'<i class="inbox-dot"></i>':''}</h3>
      ${(inbox.slice(0,8).map((m,i)=>`<div class="card" data-in="${i}">от <b>${m.from}</b>: ${ (G.byId(m.id)||{}).name||m.id } ${m.seen?'':'· новое'}</div>`).join(''))||'<p style="color:#888;font-size:12px">Нет входящих</p>'}
      <h3 style="margin-top:12px">Стена подарков</h3>
      <div class="gift-grid">${(G.ensure(S).wall||[]).slice(0,8).map(m=>{ const g=G.byId(m.id); return `<div class="card"><img src="${EG.giftImg(g||{id:m.id})}"><span class="sub">от ${m.from}</span></div>`; }).join('')||'<p style="color:#888;font-size:12px">Пока пусто</p>'}
      </div>
      <button class="btn ghost" id="npc" style="margin-top:10px">Получить демо-подарок от NPC</button>
    </div>${nav('gifts')}</div>`;
  bindNav();
  $('#free').onclick=()=>{ const r=G.takeFree(S); if(r.ok){ save(); egA('gift_receive'); toast('Бесплатно: '+r.item.name); go('gifts'); } else toast('Через '+r.days+' дн.'); };
  $('#rad').onclick=()=>{
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
    const el=document.createElement('div'); el.className='panel';
    el.innerHTML=`<h3>${it.name}</h3>
      <button class="btn" id="u1" style="margin:6px 0">${it.kind==='decor'?'Поставить в комнате':'Надеть'}</button>
      <button class="btn ghost" id="u2">Подарить другу (демо)</button>
      <button class="btn ghost" id="cl">Закрыть</button>`;
    app.querySelector('.screen').appendChild(el);
    el.querySelector('#cl').onclick=()=>el.remove();
    el.querySelector('#u1').onclick=()=>{
      const r=it.kind==='decor'?G.placeDecor(S,id):G.wear(S,id);
      if(r.ok){ save(); toast('Готово'); el.remove(); go(it.kind==='decor'?'home':'gifts'); }
    };
    el.querySelector('#u2').onclick=()=>{ const r=G.sendDemo(S,id); if(r.ok){ save(); toast('Подарок отправлен'); el.remove(); go('gifts'); } };
  });
  app.querySelectorAll('[data-in]').forEach(b=>b.onclick=()=>{ G.claimInbox(S,+b.dataset.in); save(); toast('На стену'); go('gifts'); });
  $('#npc').onclick=()=>{
    const pool=G.catalog(); const it=pool[Math.floor(Math.random()*pool.length)];
    G.receive(S,{giftId:it.id,fromName:'Алекс'}); save(); toast('Подарок от Алекс'); go('gifts');
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
    {name:'raven', t:'Я с вами! Берите фонарики 🖤', av:'raven', tm:'21:36'}
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
      const replyTxt=peer.t.split('...')[0]||peer.t;
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
      <p style="color:#aaa;font-size:12px">Гость по умолчанию. Привязка VK / OK / Яндекс / Telegram / TikTok — облачный сейв. Email не показываем.</p>
      <div class="card">Сейчас: <b>${a.displayName||'Гость'}</b> · ${a.provider}
        <span class="sub">${a.verified?('телефон '+a.phoneMasked):'телефон не подтверждён'} · свободный чат: ${(S.sub&&S.sub.freeChat)?'да':'нет'}</span></div>
      <div class="grid" style="margin-top:10px">
        ${['vk','ok','yandex','telegram','tiktok'].map(pr=>`<button class="card" data-p="${pr}">Войти / связать ${pr.toUpperCase()}</button>`).join('')}
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
  let last=0; if(EGAnim) EGAnim.play('dance');
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
    ['sleep','sleep','Сон'],['band','fame','Группа / гиги'],['mg_music','energy','Музыка'],
    ['selfie','fame','Селфи'],['npc','hub','Знакомые'],['diary','quests','Дневник'],
    ['collections','gifts','Коллекции'],['decor','home','Декор'],['pet','mood','Чёрный кот'],
    ['jobs','coins','Работа'],['ach','fame','Ачивки'],['minigame','mood','Танцы'],
    ['mg_skate','map','Скейт'],['mg_arcade','hub','Аркада'],['mg_karaoke','fame','Караоке'],
    ['coop','gifts','Кооп'],['account','home','Аккаунт']
  ];
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel eg-scroll" style="position:relative;inset:auto;margin:10px;max-height:75vh;overflow:auto">
      <h3>Ещё · каждый день!</h3>
      <div class="grid">${items.map(([id,ic,lab])=>`<button class="card" data-g="${id}">${ico(ic)} ${lab}</button>`).join('')}</div>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>go(b.dataset.g));
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
        return `<button class="card" data-n="${n.id}"><b>${n.name}</b><span class="sub">${n.loc} · связь ${r.bond|0}${r.met?'':' · не встречен'}</span></button>`; }).join('')}</div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{ EGNpc.meet(S,b.dataset.n); EGAch&&EGAch.check(S); save(); toast('Поговорили'); go('npc'); });
  $('#back').onclick=()=>go('hub');
};

SCR.diary=()=>{
  const d=EGDiary.prompts(); const moods=d.moods||['грусть'];
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px">
      <h3>Дневник настроения</h3>
      <p style="color:#aaa;font-size:12px">${(d.prompts||['Как день?'])[Math.floor(Math.random()*(d.prompts||['?']).length)]}</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${moods.map(m=>`<button class="chip" data-m="${m}">${m}</button>`).join('')}</div>
      <input id="tx" placeholder="Пара слов…" maxlength="140" style="width:100%;padding:12px;border-radius:12px;border:1px solid #2a1a24;background:#161018;color:#fff">
      <button class="btn" id="ok" style="margin-top:10px">Записать</button>
      <button class="btn ghost" id="back" style="margin-top:8px">Назад</button>
      <div style="margin-top:12px;font-size:12px;color:#aaa">${(S.diary||[]).slice(-5).reverse().map(e=>`<div>${e.mood} ${e.day}: ${e.text||'—'}</div>`).join('')}</div>
    </div>${nav('hub')}</div>`;
  bindNav(); let mood=moods[0];
  app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{ mood=b.dataset.m; toast(mood); });
  $('#ok').onclick=()=>{ EGDiary.write(S,mood,$('#tx').value); EGAch&&EGAch.check(S); save(); toast('Записано — заходи завтра'); go('diary'); };
  $('#back').onclick=()=>go('hub');
};

SCR.collections=()=>{
  const sets=EGCollections.sets();
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px;max-height:75vh;overflow:auto">
      <h3>Коллекции</h3>
      <div class="grid">${sets.map(s=>{ const p=EGCollections.progress(S,s); const claimed=S.colClaimed&&S.colClaimed[s.id];
        return `<button class="card" data-c="${s.id}" ${p.done&&!claimed?'':'disabled'} style="${p.done?'':'opacity:.5'}"><b>${s.name}</b>
          <span class="sub">${p.have}/${p.need}${claimed?' · ✓':''}</span></button>`; }).join('')}</div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{ const r=EGCollections.claim(S,b.dataset.c); if(!r.ok)return toast('Ещё рано'); EGAch&&EGAch.check(S); save(); toast('Коллекция!'); go('collections'); });
  $('#back').onclick=()=>go('hub');
};

SCR.decor=()=>{
  const items=(EGDecor.catalog().items||[]);
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px;max-height:75vh;overflow:auto">
      <h3>Декор комнаты</h3>
      <p style="color:#aaa;font-size:12px">Слоты: ${Object.entries(S.decor||{}).map(([k,v])=>k+':'+v).join(', ')||'пусто'}</p>
      <div class="grid">${items.map(it=>`<button class="card" data-d="${it.id}"><b>${it.name}</b><span class="sub">${it.slot} · ${it.cost} · +${it.mood} настрой</span></button>`).join('')}</div>
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
      <img src="img/pet/black_cat_idle.png" alt="cat" style="width:96px;height:96px;image-rendering:pixelated;display:block;margin:8px auto" onerror="this.src='img/pet/black_cat.png'">
      <p style="text-align:center;color:#aaa;font-size:12px">Голод ${Math.round(p.hunger)} · связь ${Math.round(p.bond)}</p>
      <p style="color:#c8a0b8;font-size:12px;text-align:center">Корми кота каждый день — иначе связь падает</p>
      <div class="grid">${acts.map(a=>`<button class="card" data-a="${a.id}"><b>${a.name}</b><span class="sub">${a.cost?a.cost:'бесплатно'}</span></button>`).join('')}</div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav();
  app.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ const r=EGPet.act(S,b.dataset.a); if(!r.ok){ egA('error'); return toast('Нельзя'); } egA(b.dataset.a==='pet'||b.dataset.a==='stroke'?'cat_purr':'cat_meow'); EGAch&&EGAch.check(S); save(); toast('Мяу'); go('pet'); });
  $('#back').onclick=()=>go('hub');
};

SCR.jobs=()=>{
  const list=EGJobs.list();
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px;max-height:75vh;overflow:auto">
      <h3>Работа · смен: ${S.jobs|0}</h3>
      <div class="grid">${list.map(j=>`<button class="card" data-j="${j.id}" ${(S.level>=(j.minLevel||1)&&S.energy>=(j.energy||10))?'':'disabled'} style="${(S.level>=(j.minLevel||1))?'':'opacity:.4'}">
        <b>${j.name}</b><span class="sub">${j.loc} · ур.${j.minLevel} · ${j.pay} · ${j.energy}</span></button>`).join('')}</div>
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
        return `<div class="card" style="${on?'':'opacity:.45'}"><img src="${a.icon||''}" width="32" height="32" style="image-rendering:pixelated" onerror="this.style.display='none'"><b>${a.name}</b>
          <span class="sub">${a.desc||''}${on?' · ✓':''}</span></div>`; }).join('')}</div>
      <button class="btn ghost" id="back" style="margin-top:10px">Назад</button>
    </div>${nav('hub')}</div>`;
  bindNav(); $('#back').onclick=()=>go('hub');
};

SCR.mg_skate=()=>{
  let tricks=0,left=6;
  app.innerHTML=`<div class="screen" style="align-items:center;justify-content:center;padding:20px">
    <h2 style="color:var(--accent)">Скейт</h2>
    <p style="color:#aaa">Трюки · осталось <b id="n">${left}</b></p>
    <button class="btn" id="tap" style="width:140px;height:140px;border-radius:50%">GO</button>
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
    <button class="btn" id="tap" style="width:140px;height:140px;border-radius:50%">GO</button>
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
    if(shotGo==='metro'||shotGo==='cafe'||shotGo==='park'||shotGo==='station'){ go('loc', shotGo); return; }
    if(shotGo==='loc'){ go('loc', q.get('loc')||q.get('a')||'metro'); return; }
    if(shotGo==='more'){ go('hub'); return; }
    if(shotGo==='quests'){ go('home'); requestAnimationFrame(()=>openQuests()); return; }
    if(shotGo==='shop'){ go('home'); requestAnimationFrame(()=>openShop()); return; }
    go(shotGo, q.get('a')||undefined); return;
  }
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
