/* Project page charts. Reads history.json next to the page; draws single-series lines with Chart.js. */
(function () {
  if (!window.Chart) return;
  var figs = document.querySelectorAll('figure.chart[data-chart]');
  if (!figs.length) return;
  var css = getComputedStyle(document.documentElement);
  var color = function (n) { return css.getPropertyValue(n).trim(); };
  var DAY = 86400000;

  function iso(day) { return new Date(day * DAY).toISOString().slice(0, 10); }
  function fmt(kind, v) {
    if (v === null || v === undefined) return 'Not reported';
    if (kind === 'usd') {
      var s = Math.abs(v) >= 1000 ? Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 0 })
        : Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return (v < 0 ? '−' : '') + '$' + s;
    }
    if (kind === 'ratio') return Math.round(v * 100) + '%';
    if (kind === 'rating') return v.toFixed(1);
    return Math.round(v).toLocaleString('en-US');
  }

  fetch('history.json').then(function (r) { return r.json(); }).then(function (data) {
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.color = color('--ink-2');
    figs.forEach(function (fig) {
      var s = data.series[fig.getAttribute('data-chart')];
      if (!s) return;
      var pts = s.points.map(function (p) { return { x: p[0], y: p[1] }; });
      var real = pts.filter(function (p) { return p.y !== null; }).length;
      var first = pts[0].x, last = pts[pts.length - 1].x;
      var isRatio = s.kind === 'ratio', isRating = s.kind === 'rating';
      var line = color('--series-1');
      new Chart(fig.querySelector('canvas'), {
        type: 'line',
        data: { datasets: [{
          data: pts, borderColor: line, backgroundColor: line, borderWidth: 2, tension: 0, spanGaps: false,
          pointRadius: real === 1 ? 5 : real <= 60 ? 2.5 : 0, pointHoverRadius: 5, pointHitRadius: 12,
          pointBorderColor: color('--bg'), pointBorderWidth: 1,
          borderJoinStyle: 'round', borderCapStyle: 'round'
        }] },
        options: {
          parsing: false, animation: false, responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'nearest', axis: 'x', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: { displayColors: false, callbacks: {
              title: function (items) { return iso(items[0].parsed.x); },
              label: function (item) { return s.title + ': ' + fmt(s.kind, item.parsed.y); }
            } }
          },
          scales: {
            x: { type: 'linear', min: first === last ? first - 1 : first, max: first === last ? last + 1 : last,
              grid: { display: false }, border: { color: color('--rule') },
              ticks: { maxTicksLimit: 6, maxRotation: 0, precision: 0, callback: function (v) { return iso(v); } } },
            y: { beginAtZero: s.kind !== 'usd' || pts.every(function (p) { return p.y === null || p.y >= 0; }),
              suggestedMax: isRating ? 5 : undefined, max: isRatio ? undefined : undefined,
              grid: { color: color('--rule-soft'), lineWidth: 1 }, border: { display: false },
              ticks: { maxTicksLimit: 5, callback: function (v) { return fmt(s.kind, v); } } }
          }
        }
      });
    });
  });
})();
