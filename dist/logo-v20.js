(function(){
  function fixHeader() {
    var header = document.querySelector('header');
    if (!header) return false;
    
    // Não esconde o header, só modifica o logo
    var links = header.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      // Procurar por SVG dentro do link
      var svg = link.querySelector('svg');
      if (!svg) continue;
      
      // Verificar se o link está no início do header (logo)
      var rect = link.getBoundingClientRect();
      if (rect.left > 100) continue; // Não é o logo (está muito à direita)
      
      // Encontrou o logo! Substituir.
      var parentDiv = svg.parentElement;
      if (parentDiv && parentDiv !== link) {
        parentDiv.style.display = 'none';
      }
      svg.style.display = 'none';
      
      // Esconder spans
      var spans = link.querySelectorAll('span');
      for (var j = 0; j < spans.length; j++) {
        spans[j].style.display = 'none';
      }
      
      // Inserir logo PNG
      if (!link.querySelector('img[data-logo]')) {
        var img = document.createElement('img');
        img.src = '/cineflux_logo.png?v=20';
        img.alt = 'CineFlux';
        img.setAttribute('data-logo', '1');
        img.style.cssText = 'height:32px;width:auto;display:inline-block;vertical-align:middle';
        link.insertBefore(img, link.firstChild);
      }
      
      return true;
    }
    return false;
  }
  
  var count = 0;
  var iv = setInterval(function(){
    count++;
    if (fixHeader() || count > 100) clearInterval(iv);
  }, 100);
})();
