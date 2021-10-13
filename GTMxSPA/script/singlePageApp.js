
function makePage(json) {
  if(json) {
    document.querySelector('#main').setAttribute('class', json.page);
    document.querySelector('.title').innerHTML = json.title;
    document.querySelector('.description').innerHTML = json.description;
    document.querySelector('.image').setAttribute('src', json.image);
    document.querySelector('.article').innerHTML = '';
    json.article.forEach(function(paragraph) {
      var p = document.createElement('p');
      p.innerHTML = paragraph;
      document.querySelector('.article').appendChild(p);
    })

  }
}

function loadPage(page, success) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onload = function () {
      makePage(JSON.parse(this.responseText));
      window.location.hash = page

      /*
      Callback function
      */
      success();

    }
    xmlHttp.open('GET', 'pages/' + page + '.json');
    xmlHttp.send();
}
