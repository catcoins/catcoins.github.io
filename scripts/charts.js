(function () {

var getRequest = function () {
  try { return new XMLHttpRequest(); }
  catch (error) {}
  try { return new ActiveXObject('Msxml2.XMLHTTP'); }
  catch (error) {}
  try { return new ActiveXObject('Microsoft.XMLHTTP'); }
  catch (error) {}
  throw new Error('Could not create HTTP request object.');
};

var getData = function (url, next) {
  try {
    var request = getRequest();
    request.open('GET', url, true);
    request.send(null);
    request.onreadystatechange = function () {
      if (request.readyState == 4) {
        next(request.responseText);
      }
    };
  } catch (e) {}
};

var drawHashrateChart = function (data) {
  data = data.slice(data.indexOf('START DATA') + 10).trim().split('\n').map(function (v) { return v.split(',').map(function (w) { return parseFloat(w.trim()); }) });

  var height = 500, width = 700, timeStep = 60000;

  var block = [], time = [], difficulty = [], hashrate = [];
  data.forEach(function (v, i) {
    block.push(v[0]);
    time.push(new Date(v[1] * 1000));
    difficulty.push(v[4]);
    if (v[7] === Infinity) { v[7] = ((data[i - 1] || data[i + 1])[7] + (data[i + 1] || data[i - 1])[7]) / 2; }
    hashrate.push(Math.round(v[7] / 1000000));
  });

  document.getElementById('hashdiff-hash').innerHTML = hashrate.slice(-1)[0] + ' MH/s';
  document.getElementById('hashdiff-diff').innerHTML = difficulty.slice(-1)[0];

  var x = d3.time.scale().domain([d3.min(time), d3.max(time)]).range([0, width]);
  var y1 = d3.scale.linear().domain([0, Math.max(d3.min(hashrate), 3000)]).range([height, 0]);
  var y2 = d3.scale.linear().domain([0, 1.2 * d3.max(difficulty)]).range([height, 0]);

  var chart = d3.select('#hashdiff-chart').append('svg').attr('width', width + 200).attr('height', height + 100)
    .append('g').attr('transform', 'translate(100, 50)');

  var xa = d3.svg.axis().scale(x).tickSize(-height).tickSubdivide(true);
  var ya1 = d3.svg.axis().scale(y1).ticks(4).orient('left');
  var ya2 = d3.svg.axis().scale(y2).ticks(4).orient('right');
  chart.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')').call(xa);
  chart.append('g').attr('class', 'y axis axisLeft').attr('transform', 'translate(-15,0)').call(ya1);
  chart.append('g').attr('class', 'y axis axisRight').attr('transform', 'translate(' + (width + 15) + ',0)').call(ya2);
  chart.append('text').attr('class', 'y text textLeft').attr('y', -75).attr('x', -330).attr('transform', 'rotate(-90)').text('Network hashrate (MH/s)');
  chart.append('text').attr('class', 'y text textRight').attr('y', -770).attr('x', 190).attr('transform', 'rotate(90)').text('Network difficulty');

  var l1 = d3.svg.line().interpolate('basis').x(function (d, i) { return x(time[i].getTime()); }).y(function (d) { return y1(d); });
  var l2 = d3.svg.line().x(function (d, i) { return x(time[i].getTime()); }).y(function (d) { return y2(d); });
  chart.append('path').attr('d', l1(hashrate)).attr('class', 'data1');
  chart.append('path').attr('d', l2(difficulty)).attr('class', 'data2');
};

getData('http://catchain.info/chain/Catcoin/q/nethash/2/-200', drawHashrateChart);

})();