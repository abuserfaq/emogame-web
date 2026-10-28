/* 0.8.1: fixed 412x915 design canvas (mock size), uniformly zoomed to fit any viewport, centered */
(function(){
  function fit(){
    var r=document.getElementById('root');var w=(r&&r.clientWidth)||window.innerWidth||412,h=(r&&r.clientHeight)||window.innerHeight||915;
    var z=Math.min(w/412,h/915);
    document.documentElement.style.setProperty('--egz',String(z));
  }
  fit(); document.addEventListener('DOMContentLoaded',fit); window.addEventListener('resize',fit); try{new MutationObserver(fit).observe(document.documentElement,{attributes:true,attributeFilter:['class']});}catch(e){} window.addEventListener('orientationchange',fit);
  window.EGFit=fit;
})();
