window.addEventListener('scroll', function(e) {
  var dist = document.documentElement.scrollTop;
  if(dist == 0) {
    document.getElementsByTagName('header')[0].setAttribute('class', '')
  }
  else{
    document.getElementsByTagName('header')[0].setAttribute('class', 'sticky')
  }
});


document.getElementById('mobile_menu').addEventListener('click', function() {
  document.getElementsByTagName('nav')[0].classList.toggle('deployed');
})
