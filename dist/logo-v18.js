(function(){
  function fixLogo() {
    var header = document.querySelector('header');
    if (!header) return false;
    var links = header.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var svg = link.querySelector('svg');
      if (!svg) continue;
      // Esconde SVG e spans
      svg.style.display = 'none';
      var div = svg.parentElement;
      if (div && div !== link) div.style.display = 'none';
      var spans = link.querySelectorAll('span');
      for (var s = 0; s < spans.length; s++) spans[s].style.display = 'none';
      // Insere imagem
      if (link.querySelector('img[data-logo]')) return true;
      var img = document.createElement('img');
      img.src = '/cineflux_logo.png?v=18';
      img.alt = 'CineFlux';
      img.setAttribute('data-logo', '1');
      img.style.height = '32px';
      img.style.width = 'auto';
      link.insertBefore(img, link.firstChild);
      return true;
    }
    return false;
  }
  var iv = setInterval(function(){ if(fixLogo()) clearInterval(iv); }, 100);
  setTimeout(function(){clearInterval(iv)}, 10000);
})();
