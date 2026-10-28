(function(){
const I=k=>`img/ui/icons/${k}.webp`;
const UI={
  icon(k,cls){ return `<img class="pxico ${cls||''}" src="${I(k)}" alt="" width="28" height="28" decoding="async" onerror="this.style.opacity=0">`; },
  iconSrc:I,
  wardrobeIcon(gender){ return I(gender==='girl'?'wardrobe_girl':'wardrobe_guy'); },
  /** Pixel bottom-sheet / modal with backdrop, X, swipe-down */
  openSheet({title, bodyHtml, icon}){
    const prev=document.querySelector('.eg-sheet-root'); if(prev) prev.remove();
    const root=document.createElement('div'); root.className='eg-sheet-root';
    root.innerHTML=`<div class="eg-sheet-bg" data-close="1"></div>
      <div class="eg-sheet" role="dialog" aria-modal="true">
        <div class="eg-sheet-handle"></div>
        <div class="eg-sheet-head">
          ${icon?`<img class="pxico" src="${icon}" width="28" height="28" alt="">`:''}
          <h3>${title||''}</h3>
          <button type="button" class="eg-sheet-x" data-close="1" aria-label="Закрыть">✕</button>
        </div>
        <div class="eg-sheet-body eg-scroll">${bodyHtml||''}</div>
      </div>`;
    (document.querySelector('#app')||document.body).appendChild(root);
    const sheet=root.querySelector('.eg-sheet');
    const close=()=>{ try{ if(window.EGAudio) EGAudio.emit('sheet_close'); }catch(e){} root.classList.add('out'); setTimeout(()=>root.remove(),180); };
    root.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',e=>{ if(e.target.dataset.close||e.currentTarget.dataset.close) close(); }));
    // swipe down
    let y0=null, dy=0;
    sheet.addEventListener('touchstart',e=>{ y0=e.touches[0].clientY; dy=0; },{passive:true});
    sheet.addEventListener('touchmove',e=>{ if(y0==null)return; dy=e.touches[0].clientY-y0; if(dy>0) sheet.style.transform='translateY('+dy+'px)'; },{passive:true});
    sheet.addEventListener('touchend',()=>{ if(dy>90) close(); else sheet.style.transform=''; y0=null; });
    root._close=close; root._sheet=sheet;
    return root;
  }
};
window.EGUI=UI;
})();
