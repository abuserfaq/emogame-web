/* 0.8.4: keep the character fully visible — never covered by HUD, panels, cards, nav, banner or popups.
   Scans the character's column for visual UI above the stage and fits the char-wrap into the free gap nearest its floor spot. */
(function(){
function visual(e){
  if(!e||e.nodeType!==1) return false;
  const cs=getComputedStyle(e); if(cs.visibility==='hidden'||+cs.opacity<0.05||cs.display==='none') return false;
  if(/^(IMG|SVG|CANVAS|INPUT|TEXTAREA|SELECT|VIDEO)$/i.test(e.tagName)) return true;
  if(e.closest&&e.closest('svg')) return true;
  const bg=cs.backgroundColor; const m=bg&&bg.match(/rgba?\(([^)]+)\)/); if(m){ const p=m[1].split(',').map(Number); if((p.length<4||p[3]>0.05)&&!(p.length===4&&p[3]===0)) return true; }
  if(cs.backgroundImage&&cs.backgroundImage!=='none') return true;
  if(parseFloat(cs.borderTopWidth)>0&&!/rgba\(0, 0, 0, 0\)|transparent/.test(cs.borderTopColor)) return true;
  if(cs.boxShadow&&cs.boxShadow!=='none') return true;
  for(const n of e.childNodes) if(n.nodeType===3&&n.textContent.trim()) return true;
  return false;
}
function stageOf(w){ return w&&w.closest('.stage-bleed,.stage'); }
/** UI element covering point (x,y) above the stage, or null */
function coverAt(x,y,stage,w){
  const st=document.elementsFromPoint(x,y);
  for(const e of st){ if(e===stage||stage.contains(e)&&(e.classList.contains('bg')||e===w||w.contains(e))) return null;
    if(w.contains(e)) continue; if(stage.contains(e)&&e.closest('.ambient,.decor,.loc-decor')) continue;
    if(visual(e)) return e; }
  return null;
}
window.EGCharCover=coverAt; window.EGVisual=visual;
let busy=0;
/* 0.8.4b: the character stays hidden until the backgrounds/HUD art are loaded and charfit has placed it (no ~1 s overlap of the status panel on cold start) */
function settled(){ const app=document.getElementById('app')||document.body; for(const i of app.querySelectorAll('img')){ if(i.closest('#charWrap')) continue; if(!i.complete) return false; } return true; }
function uncovered(w){ const stage=stageOf(w); if(!stage) return true; const ci=w.querySelector('.char')||w; const c=ci.getBoundingClientRect(); if(!c.height) return false;
  for(let y=c.top+4;y<c.bottom-2;y+=8) for(const dx of[-0.3,0,0.3]) if(coverAt(c.left+c.width*(0.5+dx),y,stage,w)) return false; return true; }
function markPlaced(w){ if(!w||w.dataset.placed) return; if(!w.__t0) w.__t0=Date.now();
  const ok=settled()&&uncovered(w)&&Date.now()-w.__t0>250; const key=w.style.bottom+'|'+w.style.height;
  if((ok&&w.__lastKey===key)||Date.now()-w.__t0>3000){ w.dataset.placed='1'; return; }
  w.__lastKey=ok?key:null; clearTimeout(w.__pt); w.__pt=setTimeout(()=>{ fit(); markPlaced(w); },150); }
function fit(){
  const w=document.getElementById('charWrap'); if(!w||busy) return; const stage=stageOf(w); if(!stage){ markPlaced(w); return; }
  busy=1;
  try{
    // reset to stylesheet placement first (unless walking to the bed / sleeping)
    if(w.classList.contains('walking')||w.classList.contains('on-bed')) return;
    // sticky: keep an existing fitted placement while it is still uncovered (no jumps after actions/rerenders)
    if(w.style.getPropertyValue('bottom')&&w.dataset.fitLoc===(stage.dataset.loc||location.search)){ const ci=w.querySelector('.char')||w; const c=ci.getBoundingClientRect(); const cx0=c.left+c.width/2; let cov=false;
      for(let y=c.top+4;y<c.bottom-2&&!cov;y+=8) for(const dx of[-0.3,0,0.3]) if(coverAt(cx0+dx*c.width,y,stage,w)){cov=true;break;}
      if(!cov) return; }
    w.style.removeProperty('height'); w.style.removeProperty('bottom');
    const sr=stage.getBoundingClientRect(); const rw=w.getBoundingClientRect();
    const im=w.querySelector('.char'); const r0=im?im.getBoundingClientRect():rw; const dB=rw.bottom-r0.bottom, kH=rw.height/Math.max(1,r0.height); const asp=(im&&im.naturalWidth)?im.naturalWidth/im.naturalHeight:0.64;
    const want=r0.height; const halfW=Math.min(r0.width/2, want*asp/2)*0.92; const cx=r0.left+r0.width/2;
    const top=Math.max(0,sr.top), bot=Math.min(innerHeight,sr.bottom); const step=6;
    const xs=[cx-halfW*0.8,cx-halfW*0.35,cx+halfW*0.35,cx+halfW*0.8];
    const free=[]; for(let y=top;y<bot;y+=step){ let f=true; for(const x of xs){ if(coverAt(x,y,stage,w)){ f=false; break; } } free.push([y,f]); }
    const runs=[]; let s=null; free.forEach(([y,f],i)=>{ if(f&&s===null) s=y; if((!f||i===free.length-1)&&s!==null){ runs.push([s,f?y+step:y]); s=null; } });
    const floorY=r0.bottom; const M=10;
    const cand=runs.filter(r=>r[1]-r[0]>=Math.min(want, 0.55*want)+2*M);
    // already free?
    if(runs.some(r=>r[0]<=r0.top+1&&r[1]>=r0.bottom-1)) { w.dataset.fit='ok'; return; }
    let best=null;
    if(cand.length){ best=cand.slice().sort((a,b)=>{ const da=Math.abs(Math.min(a[1]-M,floorY)-floorY)+(a[1]<floorY-want?want:0), db=Math.abs(Math.min(b[1]-M,floorY)-floorY)+(b[1]<floorY-want?want:0); return da-db; })[0]; }
    else if(runs.length) best=runs.slice().sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];
    if(!best) return;
    const h=Math.min(want, best[1]-best[0]-2*M); const footY=Math.min(best[1]-M, Math.max(floorY, best[0]+M+h));
    const op=(w.offsetParent||stage); const pr=op.getBoundingClientRect();
    /* the app may be CSS-scaled (design 412x915 fitted into the viewport): convert screen px -> layout px */
    const k=(op.offsetHeight&&pr.height)?pr.height/op.offsetHeight:1;
    w.style.setProperty('height',Math.max(40,h*kH)/k+'px','important');
    w.style.setProperty('bottom',(pr.bottom-footY-dB*(h/Math.max(1,want)))/k+'px','important');
    w.dataset.fit='moved'; w.dataset.fitLoc=(stage.dataset.loc||location.search);
  } finally { busy=0; markPlaced(w); }
}
let t=null; function sched(){ clearTimeout(t); t=setTimeout(fit,60); }
window.EGCharFit=fit;
document.addEventListener('DOMContentLoaded',()=>{ const app=document.getElementById('app')||document.body;
  try{ new MutationObserver(m=>{ if(m.some(x=>!(x.target.closest&&x.target.closest('#charWrap')))) sched(); }).observe(app,{childList:true,subtree:true}); }catch(e){}
  window.addEventListener('resize',sched); document.addEventListener('load',e=>{ if(e.target&&e.target.tagName==='IMG'&&!(e.target.closest&&e.target.closest('#charWrap'))) sched(); },true); window.addEventListener('orientationchange',sched); setInterval(fit,8000); });
})();
