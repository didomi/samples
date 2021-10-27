document.addEventListener("DOMContentLoaded", function(event) {
  window.addEventListener('scroll', function(e) {
    var distance = document.documentElement.scrollTop;
    if(distance == 0) {
      document.getElementsByTagName('header')[0].setAttribute('class', '')
    }
    else{
      document.getElementsByTagName('header')[0].setAttribute('class', 'sticky')
    }
  });


  document.getElementById('mobile_menu').addEventListener('click', function() {
    document.getElementsByTagName('nav')[0].classList.toggle('deployed');
  })
});
