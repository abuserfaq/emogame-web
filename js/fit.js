/* 0.8.1: fixed 412x915 design canvas (mock size), uniformly zoomed to fit any viewport, centered */
(function(){
  function fit(){
    var r=document.getElementById('root');var w=(r&&r.clientWidth)||window.innerWidth||412,h=(r&&r.clientHeight)||window.innerHeight||915;
    /* 0.8.2: fill width; design height flexes 800..1100 so the canvas fills the screen without bars or distortion */
    var z=w/412,H=h/z; if(H<800){z=h/800;H=800;} if(H>1100){H=1100;z=Math.min(w/412,h/1100);}
    var de=document.documentElement; de.style.setProperty('--egz',String(z)); de.style.setProperty('--egh',String(Math.round(H*100)/100)); if(de.getAttribute('data-egshort')!==(H<880?'1':'0'))de.setAttribute('data-egshort',H<880?'1':'0'); de.style.setProperty('--egdy',String(Math.round((H-915)*100)/100)+'px');
  }
  fit(); document.addEventListener('DOMContentLoaded',fit); window.addEventListener('resize',fit); try{new MutationObserver(fit).observe(document.documentElement,{attributes:true,attributeFilter:['class']});}catch(e){} window.addEventListener('orientationchange',fit);
  window.EGFit=fit;
})();
