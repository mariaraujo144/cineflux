(function(){
  var iv=setInterval(function(){
    var h=document.querySelector('header');
    if(!h)return;
    var a=h.querySelector('a');
    if(!a)return;
    var d=a.querySelector('div');
    if(!d)return;
    // Esconde o div do ícone (fundo roxo)
    d.style.cssText='display:none!important';
    // Verifica se já substituiu
    if(a.querySelector('img[data-logo]')){clearInterval(iv);return;}
    // Cria imagem do logo
    var img=document.createElement('img');
    img.src='/cineflux_logo.png?v=15';
    img.alt='CineFlux';
    img.setAttribute('data-logo','1');
    img.style.cssText='height:32px;width:auto;display:block';
    a.insertBefore(img,a.firstChild);
    clearInterval(iv);
    console.log('[Logo] Replaced');
  },100);
  setTimeout(function(){clearInterval(iv)},10000);
})();
