(function(){
  var attempt = 0;
  var iv = setInterval(function(){
    attempt++;
    if (attempt > 80) { clearInterval(iv); return; }
    
    var header = document.querySelector('header');
    if (!header) return;
    
    // Procurar por SVGs com viewBox 24x24 no header
    var svgs = header.querySelectorAll('svg[viewBox="0 0 24 24"]');
    if (svgs.length === 0) return;
    
    clearInterval(iv);
    var svg = svgs[0];
    var link = svg.closest('a') || svg.parentElement.parentElement;
    
    // Criar style dinâmico
    var style = document.createElement('style');
    style.textContent =
      'header a:first-child svg { display:none !important; }' +
      'header a:first-child span { display:none !important; }' +
      'header a:first-child::before {' +
        'content:"" !important;' +
        'display:inline-block !important;' +
        'width:130px !important;height:32px !important;' +
        'background:url(/cineflux_logo.png?v=23) no-repeat left center/contain !important;' +
      '}';
    document.head.appendChild(style);
    
    console.log('[Logo] CSS injected');
  }, 125);
})();
