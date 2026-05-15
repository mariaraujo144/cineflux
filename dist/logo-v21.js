(function(){
  console.log('[Logo] Script started');
  var attempts = 0;
  var iv = setInterval(function(){
    attempts++;
    var header = document.querySelector('header');
    if (!header) { if(attempts>50){clearInterval(iv);} return; }
    
    var allLinks = header.querySelectorAll('a');
    console.log('[Logo] Found ' + allLinks.length + ' links in header');
    
    for (var i = 0; i < allLinks.length; i++) {
      var link = allLinks[i];
      var svg = link.querySelector('svg');
      if (!svg) continue;
      
      console.log('[Logo] Found link with SVG at index ' + i);
      console.log('[Logo] Link href: ' + link.href);
      
      // Substituir todo o conteúdo do link
      link.innerHTML = '<img src="/cineflux_logo.png?v=21" alt="CineFlux" style="height:32px;width:auto;display:block">';
      link.style.cssText = 'display:inline-flex;text-decoration:none';
      
      clearInterval(iv);
      console.log('[Logo] SUCCESS - Logo replaced');
      return;
    }
    
    if (attempts > 100) {
      clearInterval(iv);
      console.log('[Logo] FAILED - Max attempts reached');
    }
  }, 100);
})();
