setTimeout(function(){
  var header = document.querySelector('header');
  if(!header) return;
  
  // Encontrar o link do logo
  var links = header.querySelectorAll('a');
  var logoLink = null;
  for(var i=0;i<links.length;i++){
    if(links[i].querySelector('svg')){
      logoLink = links[i];
      break;
    }
  }
  if(!logoLink) return;
  
  // Esconde o conteúdo original do link
  logoLink.innerHTML = '';
  
  // Cria novo conteúdo: ícone de filme SVG + texto
  var container = document.createElement('div');
  container.style.cssText = 'display:flex;align-items:center;gap:10px';
  
  // Ícone de negativo de filme (SVG)
  var svgNS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '28');
  svg.setAttribute('height', '28');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', '#111');
  svg.setAttribute('stroke-width', '1.5');
  
  // Retângulo principal
  var rect = document.createElementNS(svgNS, 'rect');
  rect.setAttribute('x', '2');
  rect.setAttribute('y', '2');
  rect.setAttribute('width', '20');
  rect.setAttribute('height', '20');
  rect.setAttribute('rx', '2');
  svg.appendChild(rect);
  
  // Perfurações do filme (círculos)
  var positions = [[6,6],[10,6],[14,6],[18,6],[6,18],[10,18],[14,18],[18,18]];
  for(var j=0;j<positions.length;j++){
    var circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', positions[j][0]);
    circle.setAttribute('cy', positions[j][1]);
    circle.setAttribute('r', '1.5');
    circle.setAttribute('fill', '#111');
    circle.setAttribute('stroke', 'none');
    svg.appendChild(circle);
  }
  
  container.appendChild(svg);
  
  // Texto CineFlux
  var span = document.createElement('span');
  span.textContent = 'CineFlux';
  span.style.cssText = 'font-weight:800;font-size:15px;letter-spacing:-0.03em;color:#111';
  container.appendChild(span);
  
  logoLink.appendChild(container);
  logoLink.style.textDecoration = 'none';
  
  console.log('[Logo] v28 - Logo recreated with film icon');
}, 2000);
