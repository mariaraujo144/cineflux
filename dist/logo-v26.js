setTimeout(function(){
  var header = document.querySelector('header');
  if(!header){ console.log('[Logo] No header'); return; }
  
  var allSvgs = header.querySelectorAll('svg');
  console.log('[Logo] SVGs found:', allSvgs.length);
  
  if(allSvgs.length === 0) return;
  
  var svg = allSvgs[0];
  var link = svg.closest('a') || svg.parentElement;
  if(!link) return;
  
  // Esconde SVG e spans
  svg.style.display='none';
  var spans = link.querySelectorAll('span');
  for(var i=0;i<spans.length;i++) spans[i].style.display='none';
  
  // Insere logo
  if(!link.querySelector('img[data-logo]')){
    var img = document.createElement('img');
    img.src='/cineflux_logo.png?v=26';
    img.alt='CineFlux';
    img.setAttribute('data-logo','1');
    img.style.cssText='height:32px;width:auto;display:inline-block';
    link.insertBefore(img, link.firstChild);
    console.log('[Logo] Replaced');
  }
}, 2000);
