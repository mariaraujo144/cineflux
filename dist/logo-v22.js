(function(){
  console.log('[Logo v22] Starting...');
  var count = 0;
  var iv = setInterval(function(){
    count++;
    var header = document.querySelector('header');
    if (!header) { console.log('[Logo] No header yet'); return; }
    
    var svgs = header.querySelectorAll('svg');
    console.log('[Logo] Found ' + svgs.length + ' SVGs in header');
    
    if (svgs.length === 0) { if(count>30)clearInterval(iv); return; }
    
    // Pegar o primeiro SVG do header
    var svg = svgs[0];
    var link = svg.closest('a');
    if (!link) link = svg.parentElement;
    
    console.log('[Logo] Replacing SVG in', link.tagName);
    
    // Esconde o div pai do SVG (quadrado roxo)
    var parentDiv = svg.parentElement;
    if (parentDiv && parentDiv !== link) {
      parentDiv.style.display = 'none';
      console.log('[Logo] Hidden parent div');
    }
    
    // Esconde o SVG
    svg.style.display = 'none';
    
    // Esconde spans dentro do link
    var spans = link.querySelectorAll('span');
    for (var j = 0; j < spans.length; j++) {
      spans[j].style.display = 'none';
    }
    
    // Insere logo PNG
    if (!link.querySelector('img[data-logo]')) {
      var img = document.createElement('img');
      img.src = '/cineflux_logo.png?v=22';
      img.alt = 'CineFlux';
      img.setAttribute('data-logo', '1');
      img.style.cssText = 'height:32px;width:auto;display:inline-block;vertical-align:middle';
      link.insertBefore(img, link.firstChild);
      console.log('[Logo] SUCCESS');
    }
    
    clearInterval(iv);
  }, 200);
  setTimeout(function(){ clearInterval(iv); console.log('[Logo] Timeout'); }, 10000);
})();
