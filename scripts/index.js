;(function () {

window.onload = function () {
  update();
  setInterval(update, 5000);
};

var update = function () {
  updatePrice();
  updateFork();
};

var getRequest = function () {
  try { return new XMLHttpRequest(); }
  catch (error) {}
  try { return new ActiveXObject('Msxml2.XMLHTTP'); }
  catch (error) {}
  try { return new ActiveXObject('Microsoft.XMLHTTP'); }
  catch (error) {}
  throw new Error('Could not create HTTP request object.');
};

var updatePrice = function () {
  try {
    var request = getRequest();
    request.open('GET', 'http://codingbean.com/cat/cat.php', true);
    request.send(null);
    request.onreadystatechange = function () {
      if (request.readyState == 4) {
        document.getElementById('trade').innerHTML = request.responseText;
      }
    };
  } catch (err) {}
};

var updateFork = function () {
  try {
    var request = getRequest();
    request.open('GET', 'http://catchain.info/chain/Catcoin/q/getblockcount', true);
    request.send(null);
    request.onreadystatechange = function () {
      if (request.readyState == 4 && request.responseText && !isNaN(request.responseText)) {
        document.getElementById('fork-blocks').innerHTML = ' in ' + Math.ceil(20290 - parseInt(request.responseText, 10), 0) + ' blocks';
      }
    };
  } catch (err) {}
};

})();