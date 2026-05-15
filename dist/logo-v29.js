(function(){
  console.log('[Logo v29] Starting');
  
  function attemptReplace() {
    var header = document.querySelector('header');
    if(!header){ console.log('[Logo] No header'); return false; }
    
    var links = header.querySelectorAll('a');
    console.log('[Logo] Links in header:', links.length);
    
    for(var i=0; i<links.length; i++){
      var link = links[i];
      console.log('[Logo] Checking link', i, '- href:', link.href, '- has SVG:', !!link.querySelector('svg'));
      
      if(link.querySelector('svg')){
        console.log('[Logo] Found link with SVG at index', i);
        
        // Limpa o link
        link.innerHTML = '';
        
        // Cria container
        var div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;gap:8px';
        
        // Cria SVG do ícone de filme
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '28');
        svg.setAttribute('height', '28');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.style.cssText = 'display:block';
        
        // Retângulo com borda
        var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '2');
        rect.setAttribute('y', '2');
        rect.setAttribute('width', '20');
        rect.setAttribute('height', '20');
        rect.setAttribute('rx', '2');
        rect.setAttribute('stroke', '#111');
        rect.setAttribute('stroke-width', '1.5');
        svg.appendChild(rect);
        
        // Círculos (perfurações do filme)
        var circles = [
          [6,6], [10,6], [14,6], [18,6],
          [6,18], [10,18], [14,18], [18,18]
        ];
        for(var j=0; j<circles.length; j++){
          var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('cx', circles[j][0]);
          c.setAttribute('cy', circles[j][1]);
          c.setAttribute('r', '1.5');
          c.setAttribute('fill', '#111');
          svg.appendChild(c);
        }
        
        div.appendChild(svg);
        
        // Texto
        var span = document.createElement('span');
        span.textContent = 'CineFlux';
        span.style.cssText = 'font-weight:800;font-size:15px;letter-spacing:-0.03em;color:#111;font-family:system-ui,-apple-system,sans-serif';
        div.appendChild(span);
        
        link.appendChild(div);
        link.style.textDecoration = 'none';
        
        console.log('[Logo] SUCCESS - Replaced!');
        return true;
      }
    }
    return false;
  }
  
  // Tenta imediatamente
  if(attemptReplace()) return;
  
  // Tenta a cada 500ms por 15 segundos
  var count = 0;
  var iv = setInterval(function(){
    count++;
    if(attemptReplace() || count > 30) clearInterval(iv);
  }, 500);
})();
