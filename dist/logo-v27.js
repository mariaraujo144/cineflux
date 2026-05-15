setTimeout(function(){
  var header = document.querySelector('header');
  if(!header) return;
  
  // Criar CSS dinâmico
  var style = document.createElement('style');
  style.textContent =
    'header svg{display:none!important}'+
    'header a:first-child span{display:none!important}'+
    'header a:first-child::before{content:""!important;display:inline-block!important;width:130px!important;height:32px!important;background:url(/cineflux_logo.png?v=27) no-repeat left center/contain!important}';
  document.head.appendChild(style);
  
  console.log('[Logo] v27 CSS injected');
}, 2500);
