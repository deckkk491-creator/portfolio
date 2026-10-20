/* Кофейня «К»: тема, меню, анимации, статус «открыто», меню, конструктор напитка, бронь. */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const I = window.Illus;
  const rub = n => n.toLocaleString('ru-RU') + ' ₽';
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* тема */
  $$('.theme-btn').forEach(b => b.addEventListener('click', () => {
    const r = document.documentElement;
    const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    r.dataset.theme = dark ? 'light' : 'dark'; store.set('k-theme', r.dataset.theme);
  }));

  /* шапка, меню */
  const header = $('header.site');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $('.burger')?.addEventListener('click', e => { const o = document.body.classList.toggle('menu-open'); e.currentTarget.setAttribute('aria-expanded', o); });

  /* плавные переходы между страницами */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !/\.html$/.test(u.pathname) || u.pathname === location.pathname) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault(); document.body.classList.add('leaving'); setTimeout(() => location.href = a.href, 240);
  });
  addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('leaving', 'menu-open'); });

  /* открыто ли сейчас: ежедневно 8:00–19:00 по Москве (в Тамбове то же время) */
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const mins = now.getHours() * 60 + now.getMinutes(), open = mins >= 480 && mins < 1140;
  $$('.status').forEach(s => {
    s.classList.toggle('open', open);
    s.innerHTML = `<i></i>${open ? 'Открыто до 19:00' : 'Закрыто · с 8:00'}`;
  });

  /* появление при прокрутке */
  const io = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('[data-reveal]').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* иллюстрации */
  $$('[data-ico]').forEach(el => el.innerHTML = I.icon(el.dataset.ico));
  $('#hero-art') && ($('#hero-art').insertAdjacentHTML('beforeend', I.lamp + I.heroCup));
  $$('[data-room]').forEach(el => el.insertAdjacentHTML('afterbegin', I.room));
  $$('[data-shelf]').forEach(el => el.innerHTML = I.shelf);
  $$('[data-map]').forEach(el => el.innerHTML = I.map(el.dataset.map === 'dark'));

  /* ——— Меню ——— */
  const MENU = [
    { id: 'coffee', name: 'Кофе', note: 'Эспрессо на свежеобжаренной арабике. Объём: S 250 · M 350 · L 450 мл.', items: [
      ['espresso', 'Эспрессо', 'Плотный, с карамельной сладостью', [150]],
      ['americano', 'Американо', 'Эспрессо и горячая вода', [170, 210]],
      ['cappuccino', 'Капучино', 'Классика с плотной молочной пеной', [200, 240, 280], 1],
      ['latte', 'Латте', 'Больше молока, мягкий вкус', [220, 260, 300]],
      ['flat', 'Флэт уайт', 'Двойной эспрессо и немного молока', [250]],
      ['raf', 'Раф', 'Взбитый со сливками и ванильным сахаром', [260, 300, 340]],
      ['iced', 'Айс-латте', 'Холодный, со льдом', [280]]
    ] },
    { id: 'author', name: 'Авторские', note: 'То, за чем возвращаются гости.', items: [
      ['cheese', 'Сырный латте', 'Нежная сырная пенка и капля соли', [300, 340], 1],
      ['lavender', 'Лавандовый раф', 'Сливочный, с лавандовым сиропом', [320, 360]],
      ['latte', 'Пряный латте', 'Корица, кардамон, мускатный орех', [290, 330]],
      ['matcha', 'Матча-латте', 'Японский зелёный чай с молоком', [290]]
    ] },
    { id: 'nocoffee', name: 'Не кофе', note: 'Для тех, кому сегодня без кофеина.', items: [
      ['tea', 'Чай листовой', 'Чёрный, зелёный или травяной, чайник 500 мл', [180]],
      ['cocoa', 'Какао с маршмеллоу', 'Как в детстве, только вкуснее', [230]],
      ['choco', 'Горячий шоколад', 'Густой, на бельгийском шоколаде', [260]]
    ] },
    { id: 'food', name: 'Выпечка и сэндвичи', note: 'Свежая выпечка каждое утро. Сэндвичи собираем при вас.', items: [
      ['croissant', 'Круассан', 'Сливочное масло, хрустящие слои', [150], 1],
      ['croissant', 'Круассан с ветчиной и сыром', 'Подогреем, если хотите', [290]],
      ['sandwich', 'Сэндвич с курицей', 'Курица, сыр, томаты, айсберг', [320]],
      ['sandwich', 'Сэндвич с лососем', 'Слабосолёный лосось, сливочный сыр', [390]],
      ['cinnabon', 'Синнабон', 'Булочка с корицей и сливочным кремом', [220]],
      ['cheesecake', 'Чизкейк', 'Нью-Йорк, с ягодным соусом', [280]],
      ['cookie', 'Печенье с шоколадом', 'Большое, мягкое внутри', [120]]
    ] }
  ];
  const box = $('#menu');
  if (box) {
    const tabs = $('#tabs');
    tabs.innerHTML = MENU.map((g, i) => `<button class="tab" role="tab" type="button" data-g="${g.id}" aria-selected="${i === 0}">${g.name}</button>`).join('') + `<button class="tab" role="tab" type="button" data-g="build" aria-selected="false">Собрать напиток</button>`;
    box.innerHTML = MENU.map(g => `<section class="menu-group" id="${g.id}"><h2>${g.name}</h2><p>${g.note}</p><div class="items">${g.items.map(([ico, n, d, p, hit]) => `
      <div class="item" data-reveal><div class="ico">${I.icon(ico)}</div><div><h3>${n}${hit ? '<span class="hit">хит</span>' : ''}</h3><p>${d}</p></div>
      <div class="pr">${p.length > 1 ? `${rub(p[0])}<small>${p.length === 3 ? 'S · M · L: ' : 'S · M: '}${p.join(' / ')}</small>` : rub(p[0])}</div></div>`).join('')}</div></section>`).join('');
    $$('[data-reveal]', box).forEach(el => io ? io.observe(el) : el.classList.add('in'));
    tabs.addEventListener('click', e => {
      const b = e.target.closest('.tab'); if (!b) return;
      document.getElementById(b.dataset.g)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    // подсветка вкладки при прокрутке
    const groups = [...MENU.map(g => document.getElementById(g.id)), document.getElementById('build')];
    const spy = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      $$('.tab', tabs).forEach(t => { const on = t.dataset.g === en.target.id; t.setAttribute('aria-selected', on); if (on) t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
    }), { rootMargin: '-45% 0px -50% 0px' });
    groups.forEach(g => g && spy.observe(g));
  }

  /* ——— Конструктор напитка ——— */
  const bld = $('#builder');
  if (bld) {
    const BASES = {
      cappuccino: { n: 'Капучино', p: [200, 240, 280], l: [['esp', .22], ['milk', .38], ['foam', .26]] },
      latte: { n: 'Латте', p: [220, 260, 300], l: [['esp', .18], ['milk', .6], ['foam', .12]] },
      raf: { n: 'Раф', p: [260, 300, 340], l: [['raf', .78], ['foam', .12]] },
      flat: { n: 'Флэт уайт', p: [250, 290, 330], l: [['esp', .34], ['milk', .44], ['foam', .06]] },
      americano: { n: 'Американо', p: [170, 190, 210], l: [['water', .8], ['crema', .06]] }
    };
    const MILK = { cow: ['Обычное', 0, '#EADBC6'], oat: ['Овсяное', 60, '#E6D2B0'], coco: ['Кокосовое', 60, '#F2EDE3'], almond: ['Миндальное', 60, '#E9D5BD'] };
    const SYR = { none: ['Без сиропа', 0, null], caramel: ['Карамель', 40, '#D9A15B'], vanilla: ['Ваниль', 40, '#F2E2B8'], lavender: ['Лаванда', 40, '#CDBBE0'], cheese: ['Сырный', 40, '#F3D488'] };
    const st = { base: 'cappuccino', size: 1, milk: 'cow', syr: 'none', shot: 0 };
    const seg = (id, obj, key, fmt) => {
      const el = $(id);
      el.innerHTML = Object.entries(obj).map(([k, v]) => `<button type="button" data-v="${k}" aria-pressed="${st[key] == k}">${fmt(k, v)}</button>`).join('');
      el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; st[key] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; render(); });
    };
    seg('#b-base', BASES, 'base', (k, v) => v.n);
    seg('#b-size', { 0: 'S · 250', 1: 'M · 350', 2: 'L · 450' }, 'size', (k, v) => v);
    seg('#b-milk', MILK, 'milk', (k, v) => v[0] + (v[1] ? ` +${v[1]}` : ''));
    seg('#b-syr', SYR, 'syr', (k, v) => v[0] + (v[1] ? ` +${v[1]}` : ''));
    seg('#b-shot', { 0: 'Один шот', 1: 'Двойной +60' }, 'shot', (k, v) => v);
    const COLORS = { esp: '#4A2C1D', water: '#6E4127', crema: '#B9814E', foam: '#FBF5EC', raf: '#E3CDAE' };
    function render() {
      const b = BASES[st.base], noMilk = st.base === 'americano';
      if (noMilk) st.milk = 'cow';
      $$('#b-milk button').forEach(x => { x.disabled = noMilk; x.style.opacity = noMilk ? .4 : 1; });
      $$('#builder .seg button').forEach(x => {
        const key = { 'b-base': 'base', 'b-size': 'size', 'b-milk': 'milk', 'b-syr': 'syr', 'b-shot': 'shot' }[x.parentElement.id];
        x.setAttribute('aria-pressed', String(st[key]) === x.dataset.v);
      });
      const milkCol = MILK[st.milk][2], syr = SYR[st.syr][2];
      let y = 228; const H = 196;
      const layers = b.l.map(([k, f]) => {
        let col = k === 'milk' ? milkCol : COLORS[k];
        if (syr && (k === 'milk' || k === 'raf')) col = mix(col, syr, .45);
        if (st.shot && k === 'esp') f += .08;
        return [col, f];
      });
      const rects = $$('#glass .layer');
      rects.forEach((r, i) => {
        const L = layers[i];
        if (!L) { r.style.y = '30px'; r.style.height = '0px'; return; }
        const h = H * L[1]; y -= h;
        r.style.y = y + 'px'; r.style.height = (h + .5) + 'px'; r.style.fill = L[0];
      });
      $('#glass .glass-body').style.transform = `scale(${[.8, .9, 1][st.size]})`;
      const price = b.p[st.size] + (noMilk ? 0 : MILK[st.milk][1]) + SYR[st.syr][1] + st.shot * 60;
      $('#b-price').textContent = rub(price);
      $('#b-name').textContent = [b.n, ['S', 'M', 'L'][st.size], !noMilk && st.milk !== 'cow' ? MILK[st.milk][0].toLowerCase() + ' молоко' : '', st.syr !== 'none' ? 'сироп ' + SYR[st.syr][0].toLowerCase() : '', st.shot ? 'двойной шот' : ''].filter(Boolean).join(' · ');
    }
    function mix(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
    render();
  }

  /* ——— часы работы по дням ——— */
  const wk = $('#week');
  if (wk) {
    const d = (now.getDay() + 6) % 7;
    wk.innerHTML = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((n, i) => `<div class="${i === d ? 'today' : ''}"><b>${n}</b>8–19</div>`).join('');
  }

  /* ——— форма брони (демо) ——— */
  $$('input[type=tel]').forEach(inp => inp.addEventListener('input', () => {
    let v = inp.value.replace(/\D/g, ''); if (!v) { inp.value = ''; return; }
    if (v[0] === '8') v = '7' + v.slice(1); if (v[0] !== '7') v = '7' + v; v = v.slice(0, 11);
    const p = [v.slice(1, 4), v.slice(4, 7), v.slice(7, 9), v.slice(9, 11)];
    inp.value = '+7' + (p[0] ? ` (${p[0]}` : '') + (p[0].length === 3 ? ')' : '') + (p[1] ? ` ${p[1]}` : '') + (p[2] ? `-${p[2]}` : '') + (p[3] ? `-${p[3]}` : '');
  }));
  const guests = $('#guests');
  if (guests) {
    $$('[data-g-step]').forEach(b => b.addEventListener('click', () => { guests.value = Math.max(1, Math.min(8, +guests.value + +b.dataset.gStep)); }));
    const date = $('#bk-date'); const t = new Date(); date.min = t.toISOString().slice(0, 10); date.value = date.min;
    const time = $('#bk-time');
    for (let m = 8 * 60; m <= 18 * 60; m += 30) time.insertAdjacentHTML('beforeend', `<option>${String(m / 60 | 0).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}</option>`);
  }
  $$('form[data-demo]').forEach(f => {
    $$('input,select,textarea', f).forEach(i => i.addEventListener('input', () => i.closest('.field')?.classList.remove('err')));
    f.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      $$('[required]', f).forEach(i => {
        let bad = !i.value.trim(); if (!bad && i.type === 'tel') bad = i.value.replace(/\D/g, '').length < 11;
        i.closest('.field').classList.toggle('err', bad); if (bad && ok) { i.focus(); ok = false; }
      });
      if (!ok) return;
      const g = guests ? guests.value : '';
      f.closest('.panel').innerHTML = `<div class="success">${I.icon('cappuccino')}<h3>Столик забронирован</h3><p class="muted">${$('#bk-date') ? `${new Date($('#bk-date').value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, ${$('#bk-time').value}, гостей: ${g}.<br>` : ''}Это демонстрационный сайт — бронь никуда не отправлена. Чтобы забронировать по-настоящему, позвоните или напишите кофейне через 2ГИС.</p></div>`;
    });
  });
})();
