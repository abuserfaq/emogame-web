// Emogame shell — modules + content packs + daily care + gifts
(function(){
const $=s=>document.querySelector(s), app=$('#app');
const PL=window.Platform, W=window;
const SHOT=!!new URLSearchParams(location.search).get('scr');
if(SHOT) document.documentElement.classList.add('shot-mode','shot-hide-ads');

let S, EG, cur='';
const save=()=>EGSave.persist(S);
const clamp=(v,a,b)=>EG.clamp(v,a,b);
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
function phase(){ return EG.phaseOf(new Date().getHours()); }
function xpNeed(lv){ return 80+lv*40; }
function addXp(n){ S.xp+=n; while(S.xp>=xpNeed(S.level)){ S.xp-=xpNeed(S.level); S.level++;
  toast('Уровень '+S.level+'!'); const u=(EG.UNLOCKS&&EG.UNLOCKS.levels||{})[String(S.level)]; if(u&&u.coins) S.coins+=u.coins; } }

function clear(){ app.innerHTML=''; }
function setPhaseClass(){ app.className='phase-'+phase(); }
function unlockOk(loc){ return S.level>=(loc.minLevel||1); }

function careBanner(){
  const line=EGCare?EGCare.statusLine(S):'';
  const warn=EGCare&&(S.hunger<25||S.thirst<25||EGCare.dirtTotal(S)>100);
  const st=S.streak||{n:0};
  return `<div class="care-banner ${warn?'warn':''}">${line}
    <div style="margin-top:6px"><span class="streak-pill">🔥 серия ${st.n||0} дн.</span>
    · заходи каждый день: корми, убирай, пои</div></div>`;
}
function dirtRow(){
  const d=S.dirt||{trash:0,dishes:0,laundry:0};
  return `<div class="dirt-row">
    <button class="chip" data-clean="trash"><b>${Math.round(d.trash)}</b>мусор</button>
    <button class="chip" data-clean="dishes"><b>${Math.round(d.dishes)}</b>посуда</button>
    <button class="chip" data-clean="laundry"><b>${Math.round(d.laundry)}</b>бельё</button>
    <button class="chip" data-clean="all"><b>✨</b>убрать всё</button>
  </div>`;
}
function bindClean(){
  app.querySelectorAll('[data-clean]').forEach(b=>b.onclick=()=>{
    EGCare.clean(S,b.dataset.clean); S.cleans++; qAdd('cleans',1); addXp(6); save();
    toast('Чисто!'); go('home');
  });
}

function statRow(){
  const rows=[['Голод',S.hunger,'🍜'],['Жажда',S.thirst,'🧋'],['Энергия',S.energy,'⚡'],['Настрой',S.mood,'💜']];
  return `<div class="topbar">${rows.map(([l,v,i])=>`<div class="stat"><div class="lab">${i} ${l}</div><div class="bar"><i style="width:${clamp(v,0,100)}%"></i></div></div>`).join('')}
    <div class="phase-pill">${EG.phaseLabel[phase()]}</div></div>
    <div class="resbar">💰 <b>${S.coins}</b> · 💎 <b>${S.gems}</b> · ур. <b>${S.level}</b> · стиль <b>${Math.round(S.styleStat)}</b> · слава <b>${Math.round(S.fame||0)}</b>
      · <span class="streak-pill">🔥${(S.streak&&S.streak.n)||0}</span></div>`;
}
function nav(active){
  const inbox=(S.gifts&&S.gifts.inbox||[]).some(m=>!m.seen);
  const items=[['home','🏠','Дом'],['feed','🍜','Еда'],['sleep','🌙','Сон'],['map','🗺️','Карта'],['gifts','🎁','Подарки'+(inbox?'<i class="inbox-dot"></i>':'')],['chat','💬','Чат']];
  return `<div class="nav">${items.map(([id,ic,lab])=>`<button data-go="${id}" class="${active===id?'on':''}"><span class="ic">${ic}</span>${lab}</button>`).join('')}</div>`;
}
function bindNav(){ app.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go))); }

function go(n,a){ tickNeeds(); clear(); setPhaseClass(); cur=n;
  const bannerOn=S.consent!=null && n!=='consent' && n!=='consentSet' && n!=='onboardCare' && !SHOT;
  PL.ads.banner(bannerOn);
  if(window.EGModules) EGModules.onScreen(n,S);
  SCR[n](a); bindNav();
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
  app.innerHTML=`<div class="screen consent">
    <h1>Настройки</h1>
    <p>Можно отключить необязательную аналитику и персонализацию рекламы.</p>
    <label class="card" style="display:block;margin-bottom:8px"><input type="checkbox" id="st" ${S.stats?'checked':''}> Аналитика</label>
    <label class="card" style="display:block;margin-bottom:16px"><input type="checkbox" id="pe" ${S.pers?'checked':''}> Персонализация рекламы</label>
    <button class="btn" id="ok">Хорошо</button>
  </div>`;
  $('#ok').onclick=()=>{ S.consent=Date.now(); S.stats=!!$('#st').checked; S.pers=!!$('#pe').checked; save(); PL.setConsent(S.stats,S.pers); afterConsent(); };
};
function afterConsent(){
  if(!localStorage.getItem('eg_care_onboard')) go('onboardCare');
  else if(!localStorage.getItem('eg_created')) go('create');
  else { EGCare&&EGCare.onLogin(S); save(); go('home'); Net.register().then(()=>Net.sync().then(applyServer)).catch(()=>{}); }
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
        <img src="${EG.charImg(s.id,gender)}" alt="${s.name}"><span>${s.name}<br><small>${s.blurb}</small></span></div>`).join('')}</div>
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

function stageHTML(locId){
  const ph=phase(); const bg=EG.locBg(locId,ph);
  const loc=(EG.LOCS||[]).find(l=>l.id===locId)||{name:locId};
  return `<div class="stage"><img class="bg" src="${bg}" alt="" onerror="this.src='img/loc/room_morning.jpg'">
    <div class="loc-title">${loc.name||locId}</div>
    ${decorHTML()}
    <img class="char" id="charSpr" src="${EG.charImg(S.style,S.gender)}" alt=""></div>`;
}
function mountAnim(){
  const el=$('#charSpr'); if(!el||!window.EGAnim) return;
  EGAnim.mount(el,S.style,S.gender); EGAnim.fromNeeds(S);
}

SCR.home=()=>{
  S.loc='room'; save();
  app.innerHTML=`<div class="screen">${statRow()}${careBanner()}${stageHTML('room')}${dirtRow()}
    <div style="padding:8px 12px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn ghost" id="wardrobe" style="flex:1">👗 Гардероб</button>
      <button class="btn ghost" id="quests" style="flex:1">✓ Квесты</button>
      <button class="btn ghost" id="shop" style="flex:1">🛒</button>
      <button class="btn ghost" id="freeze" style="flex:1">❄️ Стрик</button>
    </div>${nav('home')}</div>`;
  bindNav(); bindClean(); mountAnim();
  $('#wardrobe').onclick=()=>openWardrobe();
  $('#quests').onclick=()=>openQuests();
  $('#shop').onclick=()=>openShop();
  $('#freeze').onclick=()=>{
    if(!PL.ads.rewardedAvail()){ if(EGCare.freezeStreak(S)){ save(); toast('Серия заморожена (демо)'); } return; }
    W.__adResult=(k,ok)=>{ if(ok&&EGCare.freezeStreak(S)){ save(); toast('Серия заморожена'); } };
    PL.ads.showRewarded('streak_freeze');
  };
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

function openWardrobe(){
  const el=document.createElement('div'); el.className='panel';
  const giftWear=(EG.GIFTS&&EG.GIFTS.items||[]).filter(g=>g.kind==='wear'&&(S.gifts&&S.gifts.inv[g.id]>0));
  el.innerHTML=`<h3>Гардероб</h3><div class="grid">${(EG.SHOP||[]).map(it=>{
    const owned=!!S.wardrobe[it.id];
    return `<button class="card" data-w="${it.id}">${it.name}<span class="sub">${owned?'есть · ':''}+${it.style} стиль · ${it.cost}💰</span></button>`;
  }).join('')}</div>
  <h3 style="margin-top:10px">Подарки — надеть</h3><div class="grid">${giftWear.map(g=>`<button class="card" data-gw="${g.id}"><img src="${EG.giftImg(g)}" style="width:40px;height:40px;vertical-align:middle"> ${g.name}</button>`).join('')||'<p style="color:#888;font-size:12px">Пока нет носимых подарков</p>'}
  </div><button class="btn ghost" id="cl" style="margin-top:10px">Закрыть</button>`;
  app.querySelector('.screen').appendChild(el);
  el.querySelector('#cl').onclick=()=>el.remove();
  el.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{
    const it=EG.SHOP.find(x=>x.id===b.dataset.w); if(!it)return;
    if(S.wardrobe[it.id]){ toast('Уже есть'); return; }
    if(S.coins<it.cost){ toast('Мало монет'); return; }
    S.coins-=it.cost; S.wardrobe[it.id]=1; S.styleStat=clamp(S.styleStat+it.style,0,100); save(); toast('Куплено: '+it.name); el.remove(); go('home');
  });
  el.querySelectorAll('[data-gw]').forEach(b=>b.onclick=()=>{
    const r=EGGifts.wear(S,b.dataset.gw); if(r.ok){ save(); toast('Надето'); el.remove(); go('home'); EGAnim&&EGAnim.play('happy'); }
  });
}
function openQuests(){
  ensureQuests();
  const el=document.createElement('div'); el.className='panel';
  el.innerHTML=`<h3>Квесты дня</h3>${(EG.QUESTS||[]).map(q=>{
    const st=S.quest[q.id]||{p:0}; return `<div class="card">${q.title}<span class="sub">${Math.min(st.p,q.goal)}/${q.goal}${st.done?' ✓':''} · +${q.reward.coins}💰</span></div>`;
  }).join('')}<button class="btn ghost" id="cl" style="margin-top:10px">Закрыть</button>`;
  app.querySelector('.screen').appendChild(el);
  el.querySelector('#cl').onclick=()=>el.remove();
}
function openShop(){
  const items=(PL.pay&&PL.pay.items?PL.pay.items():(PL.social&&PL.social.items)||[]);
  const el=document.createElement('div'); el.className='panel';
  el.innerHTML=`<h3>Магазин</h3>
    <button class="card" id="rw">▶ Реклама: +40 энергии<span class="sub">вознаграждение</span></button>
    ${items.length?items.map(it=>`<button class="card" data-pay="${it[0]}">${it[1]}<span class="sub">${it[2]} ${PL.social&&PL.social.cur||''}</span></button>`).join(''):
      '<p style="color:#888;font-size:13px;margin:8px 0">Платные пакеты — на VK/OK/ФС или RuStore.</p>'}
    <button class="btn ghost" id="cl" style="margin-top:10px">Закрыть</button>`;
  app.querySelector('.screen').appendChild(el);
  el.querySelector('#cl').onclick=()=>el.remove();
  el.querySelector('#rw').onclick=()=>{
    if(!PL.ads.rewardedAvail()){ S.energy=clamp(S.energy+40,0,100); save(); toast('+40 энергии'); el.remove(); return; }
    W.__adResult=(k,ok)=>{ if(ok){ S.energy=clamp(S.energy+40,0,100); save(); toast('+40 энергии'); } };
    PL.ads.showRewarded('energy');
  };
  el.querySelectorAll('[data-pay]').forEach(b=>b.onclick=async()=>{
    const ok=PL.pay?await PL.pay.purchase(b.dataset.pay):false;
    toast(ok?'Оплата отправлена':'Позже или отменено');
  });
}

SCR.feed=()=>{
  app.innerHTML=`<div class="screen">${statRow()}${careBanner()}
    <div class="panel" style="position:relative;inset:auto;margin:10px;max-height:none">
      <h3>Еда</h3><div class="grid">${(EG.FOOD||[]).filter(f=>S.level>=(f.minLevel||1)).map(f=>`<button class="card" data-f="${f.id}">${f.name}<span class="sub">+${f.hunger} голод · ${f.cost}💰</span></button>`).join('')}</div>
      <h3 style="margin-top:14px">Напитки</h3><div class="grid">${(EG.DRINKS||[]).filter(f=>S.level>=(f.minLevel||1)).map(f=>`<button class="card" data-d="${f.id}">${f.name}<span class="sub">+${f.thirst||0} жажда · ${f.cost}💰</span></button>`).join('')}</div>
    </div>${nav('feed')}</div>`;
  bindNav();
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{
    const f=EG.FOOD.find(x=>x.id===b.dataset.f); if(!f||S.coins<f.cost)return toast('Мало монет');
    S.coins-=f.cost; S.hunger=clamp(S.hunger+f.hunger,0,100); S.mood=clamp(S.mood+(f.mood||0),0,100);
    S.dirt.dishes=clamp((S.dirt.dishes||0)+12,0,100); S.dirt.trash=clamp((S.dirt.trash||0)+6,0,100);
    S.feeds++; qAdd('feeds',1); addXp(5); save(); toast('Вкусно'); if(EGAnim) EGAnim.play('eat'); setTimeout(()=>go('feed'),500);
  });
  app.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{
    const f=EG.DRINKS.find(x=>x.id===b.dataset.d); if(!f||S.coins<f.cost)return toast('Мало монет');
    S.coins-=f.cost; S.thirst=clamp(S.thirst+f.thirst,0,100); S.energy=clamp(S.energy+(f.energy||0),0,100);
    S.mood=clamp(S.mood+(f.mood||0),0,100); S.dirt.dishes=clamp((S.dirt.dishes||0)+8,0,100);
    S.drinks++; qAdd('drinks',1); addXp(4); save(); toast('Бульк'); if(EGAnim) EGAnim.play('drink'); setTimeout(()=>go('feed'),500);
  });
};

SCR.sleep=()=>{
  app.innerHTML=`<div class="screen">${statRow()}${stageHTML('room')}
    <div style="padding:12px"><button class="btn" id="sl">Спать (восстановить энергию)</button>
    <p style="color:#888;font-size:12px;margin-top:8px;text-align:center">Сон восстанавливает энергию. Нужды всё равно тикают офлайн — заходи каждый день.</p></div>${nav('sleep')}</div>`;
  bindNav(); mountAnim(); if(EGAnim) EGAnim.play('sleep');
  $('#sl').onclick=()=>{
    S.energy=clamp(S.energy+55,0,100); S.mood=clamp(S.mood+10,0,100); S.hunger=clamp(S.hunger-8,0,100);
    S.dirt.laundry=clamp((S.dirt.laundry||0)+15,0,100);
    S.sleeps++; qAdd('sleeps',1); addXp(8); save(); toast('Спокойной ночи'); go('home');
  };
};

SCR.map=()=>{
  const ph=phase();
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px;max-height:none">
      <h3>Куда идём? · ${EG.phaseLabel[ph]}</h3>
      <div class="grid">${(EG.LOCS||[]).filter(l=>l.id!=='room').map(l=>{
        const phaseOk=!l.phases||l.phases.includes(ph);
        const lvOk=unlockOk(l);
        const ok=phaseOk&&lvOk;
        return `<button class="card" data-l="${l.id}" ${ok?'':'disabled'} style="${ok?'':'opacity:.4'}">${l.name}
          <span class="sub">${!lvOk?('ур.'+l.minLevel):(!phaseOk?'сейчас закрыто':(l.phases||[]).join('/'))} · ⚡${l.energy||0}</span></button>`;
      }).join('')}</div>
      <button class="card" data-l="room" style="margin-top:8px">Домой</button>
      <button class="btn ghost" id="coop" style="margin-top:10px">Кооп-лобби</button>
      ${PL.share?`<button class="btn ghost" id="inv" style="margin-top:8px">Пригласить друзей</button>`:''}
    </div>${nav('map')}</div>`;
  bindNav();
  app.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>go('loc',b.dataset.l));
  const inv=$('#inv'); if(inv) inv.onclick=()=>PL.share.invite();
  $('#coop').onclick=()=>go('coop');
};

SCR.loc=(id)=>{
  const loc=(EG.LOCS||[]).find(l=>l.id===id)||{id:'room',name:'Комната'};
  if(loc.id!=='room'){
    if(!unlockOk(loc)){ toast('Нужен уровень '+loc.minLevel); return go('map'); }
    if(S.energy<(loc.energy||5)){ toast('Мало энергии — покорми и выспись'); return go('map'); }
    S.energy=clamp(S.energy-(loc.energy||5),0,100);
    S.mood=clamp(S.mood+(loc.mood||0),0,100);
    S.social=clamp(S.social+(loc.social||0),0,100);
    S.fame=clamp((S.fame||0)+(loc.fame||0),0,100);
    if(loc.hunger) S.hunger=clamp(S.hunger+loc.hunger,0,100);
    if(loc.thirst) S.thirst=clamp(S.thirst+loc.thirst,0,100);
    S.loc=loc.id; S.outings++; qAdd('outings',1);
    if(loc.id==='park'){ S.park++; qAdd('park',1); }
    if(loc.id==='concert'){ S.concerts++; qAdd('concerts',1); }
    addXp(10); save();
  } else { S.loc='room'; save(); return go('home'); }
  app.innerHTML=`<div class="screen">${statRow()}${stageHTML(loc.id)}
    <div style="padding:10px;display:flex;gap:8px">
      <button class="btn ghost" id="back" style="flex:1">← Карта</button>
      <button class="btn" id="chat" style="flex:1">Чат</button>
      ${loc.id==='concert'||loc.minigame?`<button class="btn" id="mini" style="flex:1">Мини-игра</button>`:''}
    </div>${nav('map')}</div>`;
  bindNav(); mountAnim(); if(EGAnim) EGAnim.play('walk');
  $('#back').onclick=()=>go('map');
  $('#chat').onclick=()=>go('chat');
  const m=$('#mini'); if(m) m.onclick=()=>go('minigame');
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
        <button class="btn" id="free" ${freeLeft?'disabled':''}>🎁 Бесплатный</button>
        <button class="btn ghost" id="rad">▶ За рекламу</button>
      </div>
      <h3>Каталог</h3>
      <div class="gift-grid">${items.map(g=>{
        const src=(g.sources||[]).join('/');
        return `<button class="card" data-buy="${g.id}"><img src="${EG.giftImg(g)}" alt="" onerror="this.style.display='none'"><b>${g.name}</b>
          <span class="sub">${src}${g.cost?(' · '+g.cost+'💰'):''} · ${g.kind}</span></button>`;
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
  $('#free').onclick=()=>{ const r=G.takeFree(S); if(r.ok){ save(); toast('Бесплатно: '+r.item.name); go('gifts'); } else toast('Через '+r.days+' дн.'); };
  $('#rad').onclick=()=>{
    const finish=()=>{ const r=G.fromRewarded(S); if(r.ok){ save(); toast('За рекламу: '+r.item.name); go('gifts'); } };
    if(!PL.ads.rewardedAvail()){ finish(); return; }
    W.__adResult=(k,ok)=>{ if(ok) finish(); };
    PL.ads.showRewarded('gift');
  };
  app.querySelectorAll('[data-buy]').forEach(b=>b.onclick=async()=>{
    const it=G.byId(b.dataset.buy); if(!it)return;
    if((it.sources||[]).includes('paid')){
      const paid=PL.pay?await PL.pay.purchase('gift_'+it.id):false;
      if(paid){ G.addInv(S,it.id,1); save(); toast('Куплено'); go('gifts'); } else toast('Оплата недоступна / отмена');
      return;
    }
    if((it.sources||[]).includes('coins')){
      const r=G.buyCoins(S,it.id); if(r.ok){ save(); toast('Куплено: '+it.name); go('gifts'); } else toast('Мало монет');
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
  const code=(Math.random().toString(36).slice(2,8)||'emo123').toUpperCase();
  app.innerHTML=`<div class="screen">${statRow()}
    <div class="panel" style="position:relative;inset:auto;margin:10px">
      <h3>Кооп-лобби</h3>
      <p style="color:#aaa;font-size:13px">Создай код и поделись другом. Чат только пресетами.</p>
      <div class="card">Твой код: <b id="code">${(S.coopCode||code)}</b></div>
      <input id="join" placeholder="Код друга" maxlength="8" style="width:100%;padding:12px;border-radius:12px;border:1px solid #2a1a24;background:#161018;color:#fff;margin:10px 0">
      <button class="btn" id="mk">Создать лобби</button>
      <button class="btn ghost" id="jn" style="margin-top:8px">Войти</button>
      <button class="btn ghost" id="back" style="margin-top:8px">Назад</button>
    </div>${nav('map')}</div>`;
  bindNav();
  $('#mk').onclick=()=>{ S.coopCode=code; save(); toast('Лобби '+code); try{ Net.post&&Net.post('lobby_create',{code}); }catch(e){} };
  $('#jn').onclick=()=>{ const c=($('#join').value||'').trim().toUpperCase(); if(c.length<4)return toast('Код?'); toast('Вход в '+c+' (синк при онлайне)'); };
  $('#back').onclick=()=>go('map');
};

SCR.chat=()=>{
  let cat='greet';
  const paint=()=>{
    const phrases=(EG.CHAT&&EG.CHAT[cat])||[];
    app.innerHTML=`<div class="screen">${statRow()}
      <div class="chat-bubbles" id="bub">${(S.chat||[]).slice(-12).map(m=>`<div class="bub ${m.me?'me':'them'}">${m.t}</div>`).join('')||'<div class="bub them">Выбери фразу ниже</div>'}</div>
      <div class="cats">${(EG.CHAT_CATS||[]).map(c=>`<button data-c="${c.id}" class="${cat===c.id?'on':''}">${c.name}</button>`).join('')}</div>
      <div class="phrases">${phrases.map(p=>`<button class="card" data-p="${p}">${p}</button>`).join('')}</div>
      ${nav('chat')}</div>`;
    bindNav();
    const bub=$('#bub'); if(bub) bub.scrollTop=bub.scrollHeight;
    app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{cat=b.dataset.c;paint();});
    app.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{
      const t=b.dataset.p; const allowed=Object.values(EG.CHAT||{}).flat();
      if(!allowed.includes(t)) return;
      S.chat=(S.chat||[]).concat([{me:true,t}]);
      const pool=EG.CHAT[cat]||EG.CHAT.greet; const reply=pool[Math.floor(Math.random()*pool.length)];
      S.chat.push({me:false,t:reply}); if(S.chat.length>40) S.chat=S.chat.slice(-40);
      S.chats++; S.social=clamp(S.social+2,0,100); qAdd('chats',1); addXp(2); save(); paint();
    });
  };
  paint();
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
async function boot(){
  if(window.EGRC) EGRC.apply({});
  EG=await EGContent.load();
  window.EG=EG;
  S=EGSave.load();
  if(window.EGEvents) EGEvents.fromPack();
  const ctx={S,EG,PL,save,go,toast};
  if(window.EGModules) EGModules.initAll(ctx);
  tickNeeds(); ensureQuests();
  if(S.consent==null) go('consent');
  else if(!localStorage.getItem('eg_care_onboard')) go('onboardCare');
  else if(!localStorage.getItem('eg_created')) go('create');
  else { EGCare&&EGCare.onLogin(S); save(); go('home'); Net.register().then(()=>Net.sync().then(applyServer)).catch(()=>{}); }
  W.__egMaybeInterstitial=()=>{
    if(SHOT) return;
    if(!EGRC.bool('ads_interstitial_enabled', false)) return;
    if(PL.ads.interstitialOn&&PL.ads.interstitialOn()) PL.ads.showInterstitial();
  };
}
boot();
})();
