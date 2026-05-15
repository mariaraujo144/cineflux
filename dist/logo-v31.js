(function(){
  console.log('[Logo v31] Starting');
  var attempts = 0;
  
  function tryReplace() {
    attempts++;
    if (attempts > 50) { console.log('[Logo] Max attempts'); return; }
    
    var header = document.querySelector('header');
    if (!header) { console.log('[Logo] No header, attempt', attempts); return; }
    
    var links = header.querySelectorAll('a');
    console.log('[Logo] Found', links.length, 'links');
    
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      console.log('[Logo] Link', i, 'children:', link.children.length, 'has div:', !!link.querySelector('div'));
      
      // Verificar se o link tem um div (quadrado roxo do ícone)
      if (link.querySelector('div') || link.querySelector('svg')) {
        console.log('[Logo] Found logo link at index', i);
        
        // Esconde todos os filhos
        var children = link.children;
        for (var j = 0; j < children.length; j++) {
          children[j].style.display = 'none';
        }
        
        // Insere logo PNG
        if (!link.querySelector('img[data-logo]')) {
          var img = document.createElement('img');
          img.src = '/cineflux_logo.png?v=31';
          img.alt = 'CineFlux';
          img.setAttribute('data-logo', '1');
          img.style.cssText = 'height:32px;width:auto;display:inline-block';
          link.appendChild(img);
          console.log('[Logo] SUCCESS');
        }
        return;
      }
    }
  }
  
  // Tenta a cada 200ms
  var iv = setInterval(function() {
    tryReplace();
    if (attempts > 50) clearInterval(iv);
  }, 200);
  
  // Tenta imediatamente
  tryReplace();
})();
