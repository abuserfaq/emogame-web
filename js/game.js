// Emogame shell — modules + content packs + daily care + gifts
(function(){
const $=s=>document.querySelector(s), app=$('#app');
const PL=window.Platform, W=window;
const SHOT=!!new URLSearchParams(location.search).get('scr');
if(SHOT) document.documentElement.classList.add('shot-mode','shot-hide-ads');

let S, EG, cur='';
const save=()=>EGSave.persist(S);
const clamp=(v,a,b)=>EG.clamp(v,a,b);
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
function phase(){ return EG.phaseOf(new Date().getHours()); }
function xpNeed(lv){ return 80+lv*40; }
function addXp(n){ S.xp+=n; const prev=S.level;
  while(S.xp>=xpNeed(S.level)){ S.xp-=xpNeed(S.level); S.level++; toast('Уровень '+S.level+'!'); }
  if(S.level>prev){ if(window.EGUnlocks) EGUnlocks.onLevel(S,prev); if(window.EGAch){ const u=EGAch.check(S); u.forEach(a=>toast('Ачивка: '+a.name)); } } }

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
    EGCare.clean(S,b.dataset.clean); S.cleans++; qAdd('cleans',1); addXp(6); save();
    toast('Чисто!'); go('home');
  });
}

function statRow(){
  const rows=[['Голод',S.hunger,'hunger'],['Жажда',S.thirst,'thirst'],['Энергия',S.energy,'energy'],['Настрой',S.mood,'mood']];
  return `<div class="topbar">${rows.map(([l,v,i])=>`<div class="stat"><div class="lab">${ico(i)} ${l}</div><div class="bar"><i style="width:${clamp(v,0,100)}%"></i></div></div>`).join('')}
    <div class="phase-pill">${EG.phaseLabel[phase()]}</div></div>
    <div class="resbar">${ico('coins')} <b>${S.coins}</b> · ${ico('gems')} <b>${S.gems}</b> · ур. <b>${S.level}</b> · стиль <b>${Math.round(S.styleStat)}</b> · слава <b>${Math.round(S.fame||0)}</b>
      · <span class="streak-pill">${ico('streak')}${(S.streak&&S.streak.n)||0}</span></div>`;
}
function nav(active){
  const inbox=(S.gifts&&S.gifts.inbox||[]).some(m=>!m.seen);
  const items=[['home','home','Дом'],['feed','food','Еда'],['map','map','Карта'],['gifts','gifts','Подарки'],['hub','hub','Ещё'],['chat','chat','Чат']];
  return `<div class="nav">${items.map(([id,ic,lab])=>`<button data-go="${id}" class="${active===id?'on':''}"><span class="ic">${ico(ic,'lg')}</span>${lab}${id==='gifts'&&inbox?' ·':''}</button>`).join('')}</div>`;
}
function bindNav(){ app.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go))); }

function go(n,a){ tickNeeds(); clear(); setPhaseClass(); cur=n;
  const bannerOn=S.consent!=null && n!=='consent' && n!=='consentSet' && n!=='onboardCare' && n!=='create' && !SHOT;
  PL.ads.banner(bannerOn);
  const bs=document.getElementById('bannerStrip');
  if(bs){ if(bannerOn){ bs.classList.add('on'); bs.setAttribute('aria-hidden','false'); } else { bs.classList.remove('on'); bs.setAttribute('aria-hidden','true'); } }
  if(window.EGModules) EGModules.onScreen(n,S);
  SCR[n](a); bindNav();
  const navEl=app.querySelector('.nav');
  if(bs&&navEl&&bs.classList.contains('on')&&navEl.parentElement){ navEl.parentElement.insertBefore(bs, navEl); }
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
  else { EGCare&&EGCare.onLogin(S); EGWeather&&EGWeather.sync(S); EGAch&&EGAch.check(S); save(); go('home'); Net.register().then(()=>Net.sync().then(applyServer)).catch(()=>{}); }
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
  const floorCls='floor-'+(locId||'room');
  return `<div class="stage ${floorCls}" data-loc="${locId||'room'}"><img class="bg" src="${bg}" alt="" onerror="this.src='img/loc/room_morning.jpg'">
    <div class="loc-title">${loc.name||locId}</div>
    ${decorHTML()}
    <img class="char" id="charSpr" src="${(function(){const k=(S.style||'emo')+'_'+(S.gender||'guy');const fs=EG.ANIMS&&EG.ANIMS.frameSets&&EG.ANIMS.frameSets[k];return (fs&&fs.idle)||EG.charImg(S.style,S.gender);})()}" alt=""></div>`;
}
function mountAnim(){
  const el=$('#charSpr'); if(!el||!window.EGAnim) return;
  (function(){ let st=S.style,g=S.gender; const fs=EG.ANIMS&&EG.ANIMS.frameSets;
      if(!(fs&&fs[st+'_'+g])){ if(st==='goth'){st='goth';g='girl';} else if(st==='punk'){st='punk';g='guy';} else if(st==='skater'){st='skater';g='girl';} }
      EGAnim.mount(el,st,g); EGAnim.fromNeeds(S); })();
}

SCR.home=()=>{
  S.loc='room'; save();
  app.innerHTML=`<div class="screen">${statRow()}${careBanner()}${stageHTML('room')}${dirtRow()}
    <div style="padding:8px 12px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn ghost" id="wardrobe" style="flex:1"><img class="pxico" src="${(EGUI&&EGUI.wardrobeIcon(S.gender))||'img/ui/icons/wardrobe.png'}" alt=""> Гардероб</button>
      <button class="btn ghost" id="quests" style="flex:1">${ico('quests')} Квесты</button>
      <button class="btn ghost" id="shop" style="flex:1">${ico('shop')}</button>
      <button class="btn ghost" id="freeze" style="flex:1">${ico('freeze')} Стрик</button>
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
  const giftWear=(EG.GIFTS&&EG.GIFTS.items||[]).filter(g=>g.kind==='wear'&&(S.gifts&&S.gifts.inv[g.id]>0));
  const slots=['top','bottom','shoes','acc','hair'];
  const slotRu={top:'Верх',bottom:'Низ',shoes:'Обувь',acc:'Аксессуар',hair:'Волосы'};
  S.equip=S.equip||{};
  const previewSrc=(function(){const k=(S.style||'emo')+'_'+(S.gender||'guy');const fs=EG.ANIMS&&EG.ANIMS.frameSets&&EG.ANIMS.frameSets[k];return (fs&&fs.idle)||EG.charImg(S.style,S.gender);})();
  const bySlot=slots.map(sl=>{
    const items=(EG.SHOP||[]).filter(it=>it.slot===sl);
    if(!items.length) return '';
    return `<div class="ward-slot"><div class="ward-slot-h">${slotRu[sl]||sl}</div><div class="grid ward-grid">${items.map(it=>{
      const owned=!!S.wardrobe[it.id]; const eq=S.equip[sl]===it.id;
      const need=it.unlockLevel||it.minLevel||1; const locked=(S.level|0)<need && !owned;
      return `<button class="card food-card ward-card ${eq?'on':''} ${locked?'locked':''}" data-w="${it.id}" data-slot="${sl}" ${locked?'disabled':''}>
        <img class="food-art" src="${EG.shopImg(it)}" alt="">
        <b>${it.name}</b>
        <span class="sub">${locked?('🔒 ур.'+need):((owned?(eq?'надет':'есть'):'купить')+' +'+(it.style||it.mood||0)+' стиль')} · <img class="coin" src="img/ui/icons/coins.png" alt=""> ${it.cost}</span>
      </button>`;
    }).join('')}</div></div>`;
  }).join('');
  const body=`<div class="ward-preview"><img id="wardPrev" src="${previewSrc}" alt=""></div>
  ${bySlot}
  <h3 style="margin-top:10px;color:#ff4d9a;font-size:14px">Подарки — надеть</h3>
  <div class="grid">${giftWear.map(g=>`<button class="card food-card" data-gw="${g.id}"><img class="food-art" src="${EG.giftImg(g)}" alt=""><b>${g.name}</b></button>`).join('')||'<p style="color:#888;font-size:12px">Пока нет носимых подарков</p>'}</div>`;
  const root=EGUI.openSheet({title:'Гардероб', icon:EGUI.wardrobeIcon(S.gender), bodyHtml:body});
  root.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{
    const it=EG.SHOP.find(x=>x.id===b.dataset.w); if(!it)return;
    if(!S.wardrobe[it.id]){
      if(S.coins<it.cost){ toast('Мало монет'); return; }
      S.coins-=it.cost; S.wardrobe[it.id]=1; S.styleStat=clamp(S.styleStat+it.style,0,100);
      toast('Куплено: '+it.name);
    }
    S.equip=S.equip||{}; S.equip[it.slot]=it.id; save();
    const prev=root.querySelector('#wardPrev'); if(prev) prev.src=EG.shopImg(it);
    root.querySelectorAll('.ward-card').forEach(x=>x.classList.toggle('on', S.equip[x.dataset.slot]===x.dataset.w));
    toast('Надето: '+it.name);
  });
  root.querySelectorAll('[data-gw]').forEach(b=>b.onclick=()=>{
    const r=EGGifts.wear(S,b.dataset.gw); if(r.ok){ save(); toast('Надето'); root._close(); go('home'); EGAnim&&EGAnim.play('happy'); }
  });
}
function openQuests(){
  ensureQuests();
  const body=(EG.QUESTS||[]).map(q=>{
    const st=S.quest[q.id]||{p:0}; return `<div class="card">${q.title}<span class="sub">${Math.min(st.p,q.goal)}/${q.goal}${st.done?' ✓':''} · +${q.reward.coins}</span></div>`;
  }).join('')||'<p style="color:#888">Нет квестов</p>';
  EGUI.openSheet({title:'Квесты дня', icon:EGUI.iconSrc('quests'), bodyHtml:body});
}
function openShop(){
  const items=(PL.pay&&PL.pay.items?PL.pay.items():(PL.social&&PL.social.items)||[]);
  const body=`<button class="card" id="rw">${ico('energy')} Реклама: +40 энергии<span class="sub">вознаграждение</span></button>
    ${items.length?items.map(it=>`<button class="card" data-pay="${it[0]}">${it[1]}<span class="sub">${it[2]}</span></button>`).join(''):
      '<p style="color:#888;font-size:13px;margin:8px 0">Платные пакеты — VK/OK/ФС или RuStore / ЮKassa.</p>'}
    <button class="card" id="auth">${ico('home')} Аккаунт / привязка</button>`;
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
  const foodCard=(f,kind)=>{
    const need=f.unlockLevel||f.minLevel||1; const locked=(S.level|0)<need;
    return `<button class="card food-card ${locked?'locked':''}" data-${kind==='food'?'f':'d'}="${f.id}" ${locked?'disabled':''}>
      <img class="food-art" src="${kind==='food'?EG.foodImg(f):EG.drinkImg(f)}" alt="">
      <b>${f.name}</b>
      <span class="sub">${locked?('🔒 ур.'+need):('+'+ (kind==='food'?f.hunger:(f.thirst||0))+' '+(kind==='food'?'голод':'жажда')+' · ')} ${locked?'':''}<img class="coin" src="img/ui/icons/coins.png" alt=""> ${f.cost}</span>
    </button>`;
  };
  app.innerHTML=`<div class="screen">${statRow()}${careBanner()}
    <div class="panel feed-panel" style="position:relative;inset:auto;margin:10px;max-height:none">
      <h3>Еда</h3><div class="grid food-grid">${(EG.FOOD||[]).map(f=>foodCard(f,'food')).join('')}</div>
      <h3 style="margin-top:14px">Напитки</h3><div class="grid food-grid">${(EG.DRINKS||[]).map(f=>foodCard(f,'drink')).join('')}</div>
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
      <h3>Куда идём? · ${EG.phaseLabel[ph]}</h3><p style="color:#aaa;font-size:12px">${ico('mood')} ${(EGWeather&&EGWeather.sync(S), (EG.weatherText&&EG.weatherText(S))||S.weatherText||'')} · подп. ${S.followers|0}</p>
      <div class="grid">${(EG.LOCS||[]).filter(l=>l.id!=='room').map(l=>{
        const phaseOk=!l.phases||l.phases.includes(ph);
        const lvOk=unlockOk(l);
        const ok=phaseOk&&lvOk;
        return `<button class="card" data-l="${l.id}" ${ok?'':'disabled'} style="${ok?'':'opacity:.4'}">${l.name}
          <span class="sub">${!lvOk?('ур.'+l.minLevel):(!phaseOk?'сейчас закрыто':(l.phases||[]).join('/'))} · ${ico('energy')}${l.energy||0}</span></button>`;
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
    if(window.EGWeather) EGWeather.applyVisit(S,loc.id);
    const npcHere=(window.EGNpc?EGNpc.list():[]).find(n=>n.loc===loc.id);
    if(npcHere){ EGNpc.meet(S,npcHere.id); toast(npcHere.name+' здесь'); }
    addXp(10); if(window.EGAch) EGAch.check(S); save();
  } else { S.loc='room'; save(); return go('home'); }
  app.innerHTML=`<div class="screen">${statRow()}${stageHTML(loc.id)}
    <div style="padding:10px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn ghost" id="back" style="flex:1">← Карта</button>
      <button class="btn" id="chat" style="flex:1">Чат</button>
      ${['concert','karaoke','arcade','skate','garage','idol_stage','nightclub','records'].includes(loc.id)?`<button class="btn" id="mini" style="flex:1">Мини-игра</button>`:''}
      ${loc.id==='garage'||loc.id==='nightclub'||loc.id==='festival'?`<button class="btn" id="gig" style="flex:1">Гиги</button>`:''}
    </div>
    <div style="padding:0 10px 10px;color:#c8a0b8;font-size:12px">${(EG.weatherText&&EG.weatherText(S))||S.weatherText||((S.weather||'')+' · '+(S.season||''))}</div>
    ${nav('map')}</div>`;
  bindNav(); mountAnim(); if(EGAnim) EGAnim.play('walk');
  $('#back').onclick=()=>go('map');
  $('#chat').onclick=()=>go('chat');
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
  let cat='greet';
  const peer=(window.EGAuth&&EGAuth.uiName())||(S.name)||'xShadow_666';
  const st=(S.style==='goth'||S.style==='skater'||S.style==='punk')?'alt':S.style;
  const av=EG.charImg(st,S.gender);
  const cats=[{id:'greet',name:'Привет',ic:'mood'},{id:'mood',name:'Настроение',ic:'mood'},{id:'food',name:'Еда',ic:'food'},{id:'locs',name:'Локации',ic:'map'},{id:'support',name:'Поддержка',ic:'gifts'},{id:'concert',name:'Концерт',ic:'fame'}];
  const paint=()=>{
    const phrases=Array.isArray(EG.CHAT&&EG.CHAT[cat])?(EG.CHAT[cat]):(Array.isArray(EG.CHAT&&EG.CHAT.greet)?EG.CHAT.greet:['Привет','Йо','Как дела?']);
    const free=!!(window.EGAuth&&EGAuth.canFreeChat());
    let hist=(S.chat||[]).slice(-12); if(!hist.length){ hist=[{me:false,t:'Выбери фразу ниже'},{me:true,t:'Привет'}]; }
    const bubbles=hist.map(m=>{
      const avHtml=m.me?'':'<img class="av-inline" src="'+av+'" alt="">';
      return '<div class="bub '+(m.me?'me':'them')+'">'+avHtml+m.t+'</div>';
    }).join('')||'<div class="bub them">Выбери фразу ниже</div>';
    const upsell=free?'':'<div class="chat-upsell">Свободный чат — подписка + верификация телефона (VK ID / Яндекс / Telegram). Пресеты бесплатны.<button class="btn" id="upsell">Открыть свободный чат</button></div>';
    app.innerHTML='<div class="screen chat-screen">'+statRow()+
      '<div class="chat-peer"><img class="av" src="'+av+'" alt=""><div><div class="nm">'+peer+'</div><div class="on">онлайн</div></div>'+
      '<button class="btn ghost" id="acc" style="margin-left:auto;width:auto;padding:8px 10px;font-size:11px">Аккаунт</button></div>'+
      '<div class="chat-bubbles eg-scroll" id="bub">'+bubbles+'</div>'+upsell+
      '<div class="chat-cats">'+cats.map(c=>'<button data-c="'+c.id+'" class="'+(cat===c.id?'on':'')+'">'+ico(c.ic)+'<span>'+c.name+'</span></button>').join('')+'</div>'+
      '<div class="phrases eg-scroll">'+phrases.map(p=>'<button data-p="'+p+'">'+ico('chat')+p+'</button>').join('')+'</div>'+
      '<div class="chat-mod"><button class="btn ghost" id="rep">Жалоба</button><button class="btn ghost" id="blk">Блок</button></div>'+
      nav('chat')+'</div>';
    bindNav();
    const bub=$('#bub'); if(bub) bub.scrollTop=bub.scrollHeight;
    app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{cat=b.dataset.c;paint();});
    app.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{
      const raw=b.dataset.p;
      const allowed=[].concat(...Object.values(EG.CHAT||{}).map(v=>Array.isArray(v)?v:[]));
      if(allowed.length && !allowed.includes(raw)) return;
      const f=window.EGChatMod?EGChatMod.filter(raw):{text:raw};
      S.chat=(S.chat||[]).concat([{me:true,t:f.text}]);
      const pool=phrases; const reply=pool[Math.floor(Math.random()*pool.length)];
      S.chat.push({me:false,t:reply}); if(S.chat.length>40) S.chat=S.chat.slice(-40);
      S.chats++; S.social=clamp(S.social+2,0,100); qAdd('chats',1); addXp(2); save(); paint();
    });
    const up=$('#upsell'); if(up) up.onclick=()=>go('account');
    const acc=$('#acc'); if(acc) acc.onclick=()=>go('account');
    const rep=$('#rep'); if(rep) rep.onclick=()=>{ EGChatMod&&EGChatMod.report(S,'peer','spam'); save(); toast('Жалоба отправлена'); };
    const blk=$('#blk'); if(blk) blk.onclick=()=>{ EGChatMod&&EGChatMod.block(S,'peer'); save(); toast('Заблокировано'); };
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
  app.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ const r=EGPet.act(S,b.dataset.a); if(!r.ok)return toast('Нельзя'); EGAch&&EGAch.check(S); save(); toast('Мяу'); go('pet'); });
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
  window.EG=EG;
  S=EGSave.load(); window.S=S;
  if(window.EGEvents) EGEvents.fromPack();
  const ctx={S,EG,PL,save,go,toast};
  if(window.EGModules) EGModules.initAll(ctx);
  tickNeeds(); ensureQuests();
  const q=new URLSearchParams(location.search);
  const shotGo=SHOT && q.get('go');
  if(shotGo){
    S.consent=S.consent||Date.now(); S.name=S.name||'xShadow_666';
    S.hunger=72; S.thirst=65; S.energy=80; S.mood=70; S.coins=Math.max(S.coins,1200); S.gems=Math.max(S.gems,40);
    S.level=Math.max(S.level,5); S.streak=S.streak||{n:3,last:'',freeze:0}; S.streak.n=Math.max(S.streak.n,3);
    S.dirt=S.dirt||{trash:18,dishes:12,laundry:8};
    localStorage.setItem('eg_created','1'); localStorage.setItem('eg_care_onboard','1');
    save();
    if(shotGo==='wardrobe'){ go('home'); try{ openWardrobe(); }catch(e){}; return; }
    go(shotGo, q.get('a')||undefined); return;
  }
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
