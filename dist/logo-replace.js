// CineFlux Logo Replacement - v11
(function() {
  var DONE = false;

  // SVG do ícone de negativo de filme (estilo do print da Mari)
  var FILM_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="6" cy="6" r="1.5" fill="#111" stroke="none"/><circle cx="10" cy="6" r="1.5" fill="#111" stroke="none"/><circle cx="14" cy="6" r="1.5" fill="#111" stroke="none"/><circle cx="18" cy="6" r="1.5" fill="#111" stroke="none"/><circle cx="6" cy="18" r="1.5" fill="#111" stroke="none"/><circle cx="10" cy="18" r="1.5" fill="#111" stroke="none"/><circle cx="14" cy="18" r="1.5" fill="#111" stroke="none"/><circle cx="18" cy="18" r="1.5" fill="#111" stroke="none"/></svg>';

  function replace() {
    if (DONE) return;

    // Estratégia 1: procurar pelo link do logo no header
    var header = document.querySelector('header');
    if (!header) return;

    var links = header.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var svg = link.querySelector('svg');
      if (!svg) continue;

      // Verificar se é o ícone do logo (viewBox 24x24 e paths múltiplos)
      var vb = svg.getAttribute('viewBox');
      var paths = svg.querySelectorAll('path, rect, line, circle');
      if (vb && vb.indexOf('24') !== -1 && paths.length >= 2) {
        // Encontrou! Substituir.
        DONE = true;

        // Limpar o link
        link.innerHTML = '';

        // Criar container flex
        var div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;gap:8px';

        // Adicionar ícone SVG
        var iconSpan = document.createElement('span');
        iconSpan.innerHTML = FILM_ICON;
        iconSpan.style.cssText = 'display:inline-flex;flex-shrink:0';
        div.appendChild(iconSpan);

        // Adicionar texto "CineFlux"
        var text = document.createElement('span');
        text.textContent = 'CineFlux';
        text.style.cssText = 'font-weight:800;font-size:15px;letter-spacing:-0.03em;color:#111;font-family:system-ui,-apple-system,sans-serif';
        div.appendChild(text);

        link.appendChild(div);
        link.style.cssText = 'display:inline-flex;text-decoration:none';

        console.log('[CineFlux Logo] Successfully replaced with film negative icon');
        return;
      }
    }
  }

  // Tentar imediatamente
  replace();

  // Tentar a cada 50ms por 10 segundos
  var count = 0;
  var iv = setInterval(function() {
    count++;
    if (DONE || count > 200) {
      clearInterval(iv);
      if (!DONE) console.log('[CineFlux Logo] Could not find logo element');
    }
    replace();
  }, 50);

  // Tentar no DOMContentLoaded também
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', replace);
  }
})();
