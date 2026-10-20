// Тема (светлая / тёмная, выбор запоминается) и кнопки «копировать»
(function () {
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') root.dataset.theme = saved;
  } catch (e) {}
  var mq = matchMedia('(prefers-color-scheme: dark)');
  function isDark() { return root.dataset.theme ? root.dataset.theme === 'dark' : mq.matches; }
  function paint() {
    document.querySelectorAll('.switch button').forEach(function (b) {
      b.setAttribute('aria-pressed', String((b.dataset.t === 'dark') === isDark()));
    });
    document.dispatchEvent(new Event('themechange'));
  }
  document.querySelectorAll('.switch button').forEach(function (b) {
    b.addEventListener('click', function () {
      root.dataset.theme = b.dataset.t;
      try { localStorage.setItem('theme', b.dataset.t); } catch (e) {}
      paint();
    });
  });
  mq.addEventListener('change', paint);
  paint();

  document.querySelectorAll('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = document.getElementById(b.dataset.copy);
      var done = function () { b.textContent = 'скопировано'; setTimeout(function () { b.textContent = 'копировать'; }, 1500); };
      var select = function () { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      try { navigator.clipboard.writeText(el.textContent).then(done, select); } catch (e) { select(); }
    });
  });
})();

// Форматирование чисел для проектов
window.fmt = {
  rub: function (v) { return Math.round(v).toLocaleString('ru-RU') + ' ₽'; },
  num: function (v) { return Math.round(v).toLocaleString('ru-RU'); },
  pct: function (v, d) { return (v * 100).toLocaleString('ru-RU', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }) + '%'; },
  mln: function (v) { return (v / 1e6).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' млн ₽'; }
};
