/* Leaderboard: sort, search, and mobile row expand. No dependencies. */
(function () {
  var table = document.getElementById('board');
  if (!table) return;
  var body = table.tBodies[0];
  var rows = Array.prototype.slice.call(body.rows);
  var heads = Array.prototype.slice.call(table.tHead.rows[0].cells);
  var q = document.getElementById('q');
  var count = document.getElementById('count');
  var empty = document.getElementById('empty');
  var sel = document.getElementById('sortsel');

  function cellValue(row, col, type) {
    var v = row.cells[col].getAttribute('data-v');
    if (v === '' || v === null) return null; // not reported: always sorts last
    return type === 'num' ? parseFloat(v) : v;
  }

  function sortBy(col, dir) {
    var type = heads[col].getAttribute('data-type');
    var sorted = rows.slice().sort(function (a, b) {
      var x = cellValue(a, col, type), y = cellValue(b, col, type);
      if (x === null && y === null) return +a.cells[0].getAttribute('data-v') - +b.cells[0].getAttribute('data-v');
      if (x === null) return 1;
      if (y === null) return -1;
      var c = x < y ? -1 : x > y ? 1 : 0;
      if (c === 0) return +a.cells[0].getAttribute('data-v') - +b.cells[0].getAttribute('data-v');
      return dir === 'desc' ? -c : c;
    });
    sorted.forEach(function (r) { body.appendChild(r); });
    heads.forEach(function (h, i) { h.setAttribute('aria-sort', i === col ? (dir === 'desc' ? 'descending' : 'ascending') : 'none'); });
    if (sel) sel.value = [0, 1, 3, 4, 5, 6, 11].indexOf(col) >= 0 ? String(col) : sel.value;
  }

  var state = { col: 0, dir: 'asc' };
  function onHead(col) {
    var type = heads[col].getAttribute('data-type');
    if (state.col === col) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
    else { state.col = col; state.dir = col === 0 || type === 'text' ? 'asc' : 'desc'; }
    sortBy(col, state.dir);
  }
  heads.forEach(function (h, i) {
    h.setAttribute('aria-sort', i === 0 ? 'ascending' : 'none');
    h.querySelector('button').addEventListener('click', function () { onHead(i); });
  });
  if (sel) sel.addEventListener('change', function () {
    var col = +sel.value;
    state = { col: col, dir: col === 0 || heads[col].getAttribute('data-type') === 'text' ? 'asc' : 'desc' };
    sortBy(col, state.dir);
  });

  function filter() {
    var term = (q.value || '').trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (r) {
      var hit = !term || r.getAttribute('data-name').indexOf(term) >= 0;
      r.hidden = !hit;
      if (hit) shown++;
    });
    count.textContent = term ? shown + ' of ' + rows.length + ' shown' : '';
    empty.hidden = shown !== 0;
  }
  if (q) q.addEventListener('input', filter);

  rows.forEach(function (r) {
    var b = r.querySelector('.expand');
    if (!b) return;
    b.addEventListener('click', function () {
      var open = r.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
})();
