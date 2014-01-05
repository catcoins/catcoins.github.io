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

var hashrateLimit = 200;
var hashrateAvg = 5;

var drawHashrateChart = function (data) {
  var raw = data.slice(data.indexOf('START DATA') + 10).trim().split('\n').map(function (v) { return v.split(',').map(function (w) { return parseFloat(w.trim()); }) });
  data = [];
  var temp = [];

  var avg = [];
  for (var i = 1; i <= hashrateAvg; i++) { avg.push(i); }

  for (var i = 0; i < Math.floor(hashrateLimit / hashrateAvg); i++) {
    for (var j = 0; j < 8; j++) {
      temp[j] = avg.map(function (n) { return raw[hashrateLimit - hashrateAvg * i - n][j]; }).sort(function (a, b) { return a - b; })[Math.floor(hashrateAvg / 2)];
    }
    data.unshift(temp.slice(0));
  }

  var height = 500, width = 700, timeStep = 60000;

  var time = [], difficulty = [], hashrate = [];
  data.forEach(function (v, i) {
    time.push(new Date(v[1] * 1000));
    difficulty.push(Math.round(v[4] * 10) / 10);
    if (v[7] === Infinity) { v[7] = ((data[i - 1] || data[i + 1])[7] + (data[i + 1] || data[i - 1])[7]) / 2; }
    hashrate.push(Math.round(v[7] / 1000000));
  });

  document.getElementById('hashdiff-hash').innerHTML = hashrate.slice(-1)[0] + ' MH/s';
  document.getElementById('hashdiff-diff').innerHTML = Math.round(raw.slice(-1)[0][4] * 10) / 10;
  document.getElementById('hashdiff-block').innerHTML = Math.round(raw.slice(-1)[0][0]);
  var change = 36 * Math.ceil((raw.slice(-1)[0][0] / 36) + 0.01) - Math.round(raw.slice(-1)[0][0]);
  document.getElementById('hashdiff-change').innerHTML = change + ' block' + (change === 1 ? '' : 's');
  document.getElementById('hashdiff-next').innerHTML = Math.round(600 * hashrate.slice(-1)[0] * 10000000 / 4294967296) / 10;

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

var drawPoolsChart = function (data) {
  data = JSON.parse(data).sort(function (a, b) {
    return b.hashrate - a.hashrate;
  });

  var getAngle = function (d) {
    var ang = (180 / Math.PI * (d.startAngle + d.endAngle) / 2 - 90);
    return (ang > 90) ? (180 + ang) : ang;
    return (ang > 180) ? 180 - ang : ang;
  };

  var height = 600, width = 900, radius = 275;
  var color = d3.scale.category20();

  var html = '';
  data.forEach(function (v, i) {
    html += '<span>' + v.name + ': <span style="color: ' + color(i) + '">' + v.hashrate + ' MH/s</span> <a href="' + v.url + '" target="_blank"><i class="fa fa-external-link"></i></a></span>';
  });
  document.getElementById('pools-values').innerHTML = html;

  var arc = d3.svg.arc().outerRadius(radius - 10).innerRadius(0);
  var pie = d3.layout.pie().value(function (d) { return d.hashrate; });

  var svg = d3.select('#pools-chart').append('svg').attr('width', width).attr('height', height)
    .append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

  var g = svg.selectAll('.arc').data(pie(data)).enter().append('g').attr('class', 'arc');
  g.append('path').attr('d', arc).style('fill', function (d, i) { return color(i); });
  g.append('text').attr('transform', function (d) { return 'translate(' + arc.centroid(d) + ') rotate(' + getAngle(d) + ')'; }).attr('dy', '.35em').style('text-anchor', 'middle').text(function (d, i) { return data[i].name; });
};

getData('http://catchain.info/chain/Catcoin/q/nethash/1/-' + hashrateLimit, drawHashrateChart);
getData('http://api.catcoins.biz/pools', drawPoolsChart);

})();