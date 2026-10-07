/* Dataset filters, URL state, sorting, and mobile row expansion. */
(function () {
  var table = document.getElementById('board');
  if (!table) return;
  var body = table.tBodies[0];
  var rows = Array.prototype.slice.call(body.rows);
  var heads = Array.prototype.slice.call(table.tHead.rows[0].cells);
  var q = document.getElementById('q');
  var status = document.getElementById('filter-status');
  var klass = document.getElementById('filter-class');
  var type = document.getElementById('filter-type');
  var revenue = document.getElementById('filter-revenue');
  var count = document.getElementById('count');
  var empty = document.getElementById('empty');
  var select = document.getElementById('sortsel');
  var watching = table.getAttribute('data-watching') === 'true';
  var allowedSorts = {};
  heads.forEach(function (head) { allowedSorts[head.getAttribute('data-key')] = head; });

  function params() { return new URLSearchParams(window.location.search); }
  function choose(control, value) {
    if (!control || !value) return;
    if (Array.prototype.some.call(control.options, function (option) { return option.value === value; })) {
      control.value = value;
    }
  }

  var initial = params();
  q.value = initial.get('q') || '';
  choose(status, initial.get('status'));
  choose(klass, watching ? '2' : initial.get('class'));
  choose(type, initial.get('type'));
  revenue.checked = initial.get('revenue') === '1';
  var sortKey = allowedSorts[initial.get('sort')] ? initial.get('sort') : 'default';
  var direction = initial.get('dir');
  if (direction !== 'asc' && direction !== 'desc') {
    direction = sortKey === 'default' ? 'asc' : (allowedSorts[sortKey].getAttribute('data-default-dir') || 'asc');
  }
  choose(select, sortKey);

  function value(row, key) {
    var cell = row.querySelector('[data-key="' + key + '"]');
    if (!cell) return null;
    var raw = cell.getAttribute('data-sort-value');
    if (raw === '' || raw === null) return null;
    var kind = allowedSorts[key].getAttribute('data-kind');
    if (kind === 'number') {
      var number = Number(raw);
      return Number.isFinite(number) ? number : null;
    }
    return kind === 'text' ? raw.toLowerCase() : raw;
  }

  function sortRows() {
    var sorted = rows.slice();
    if (sortKey === 'default') {
      sorted.sort(function (a, b) { return Number(a.getAttribute('data-order')) - Number(b.getAttribute('data-order')); });
      heads.forEach(function (head) { head.setAttribute('aria-sort', 'none'); });
    } else {
      var head = allowedSorts[sortKey];
      sorted.sort(function (a, b) {
        var x = value(a, sortKey), y = value(b, sortKey);
        if (x === null && y === null) return Number(a.getAttribute('data-order')) - Number(b.getAttribute('data-order'));
        if (x === null) return 1;
        if (y === null) return -1;
        var comparison = x < y ? -1 : x > y ? 1 : 0;
        if (comparison) return direction === 'desc' ? -comparison : comparison;
        return Number(a.getAttribute('data-order')) - Number(b.getAttribute('data-order'));
      });
      heads.forEach(function (item) {
        item.setAttribute('aria-sort', item === head ? (direction === 'desc' ? 'descending' : 'ascending') : 'none');
      });
    }
    sorted.forEach(function (row) { body.appendChild(row); });
  }

  function applyFilters() {
    var term = (q.value || '').trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (row) {
      var hit = (!term || row.getAttribute('data-name').indexOf(term) >= 0) &&
        (!status.value || row.getAttribute('data-status') === status.value) &&
        (!klass.value || row.getAttribute('data-class') === klass.value) &&
        (!type.value || row.getAttribute('data-type') === type.value) &&
        (!revenue.checked || row.getAttribute('data-revenue') === 'true') &&
        (!watching || row.getAttribute('data-class') === '2');
      row.hidden = !hit;
      if (hit) shown++;
    });
    count.textContent = (term || status.value || klass.value || type.value || revenue.checked)
      ? shown + ' of ' + rows.length + ' shown' : '';
    empty.hidden = shown !== 0;
  }

  function writeUrl() {
    var url = new URL(window.location.href);
    ['q', 'status', 'class', 'type', 'revenue', 'sort', 'dir'].forEach(function (key) { url.searchParams.delete(key); });
    if (q.value.trim()) url.searchParams.set('q', q.value.trim());
    if (status.value) url.searchParams.set('status', status.value);
    if (klass.value) url.searchParams.set('class', klass.value);
    if (type.value) url.searchParams.set('type', type.value);
    if (revenue.checked) url.searchParams.set('revenue', '1');
    if (sortKey !== 'default') {
      url.searchParams.set('sort', sortKey);
      url.searchParams.set('dir', direction);
    }
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }

  function render(updateUrl) {
    sortRows();
    applyFilters();
    if (updateUrl) writeUrl();
  }

  heads.forEach(function (head) {
    var key = head.getAttribute('data-key');
    head.querySelector('button').addEventListener('click', function () {
      if (sortKey === key) direction = direction === 'asc' ? 'desc' : 'asc';
      else {
        sortKey = key;
        direction = head.getAttribute('data-default-dir') || 'asc';
      }
      select.value = sortKey;
      render(true);
    });
  });
  select.addEventListener('change', function () {
    sortKey = select.value;
    direction = sortKey === 'default' ? 'asc' :
      (allowedSorts[sortKey].getAttribute('data-default-dir') || 'asc');
    render(true);
  });
  [q, status, klass, type, revenue].forEach(function (control) {
    control.addEventListener(control === q ? 'input' : 'change', function () { render(true); });
  });
  rows.forEach(function (row) {
    var button = row.querySelector('.expand');
    button.addEventListener('click', function () {
      var open = row.classList.toggle('open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  render(!window.location.search);
})();
