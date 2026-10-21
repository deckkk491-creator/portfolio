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

  /* ——— Онлайн-заказ (демо) ——— */
  const order = {
    items() { try { return JSON.parse(store.get('k-order')) || []; } catch (e) { return []; } },
    save(l) { store.set('k-order', JSON.stringify(l)); renderOrder(); },
    add(it) {
      const l = this.items(), key = [it.name, it.size, it.opts || ''].join('|');
      const same = l.find(x => x.key === key);
      if (same) same.qty++; else l.push({ ...it, key, qty: 1 });
      this.save(l); toast(`${it.name}${it.size ? ' ' + it.size : ''} — в заказе`); bump();
    },
    sum() { return this.items().reduce((s, x) => s + x.price * x.qty, 0); },
    count() { return this.items().reduce((s, x) => s + x.qty, 0); }
  };
  document.body.insertAdjacentHTML('beforeend', `
    <button class="fab" type="button" aria-label="Открыть заказ" hidden><span class="fab-n">0</span><span>Ваш заказ</span><b class="fab-sum"></b></button>
    <div class="scrim" hidden></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-title" aria-hidden="true" inert>
      <div class="dr-head"><h2 id="dr-title">Ваш заказ</h2><button class="icon-btn dr-close" type="button" aria-label="Закрыть">✕</button></div>
      <div class="dr-body"></div>
    </aside>
    <div class="toast" role="status"></div>`);
  const drawer = $('.drawer'), scrim = $('.scrim'), fab = $('.fab');
  function openOrder() { renderOrder(); scrim.hidden = false; drawer.removeAttribute('inert'); drawer.setAttribute('aria-hidden', 'false'); requestAnimationFrame(() => { scrim.classList.add('on'); drawer.classList.add('on'); }); document.body.style.overflow = 'hidden'; setTimeout(() => $('.dr-close').focus(), 50); }
  function closeOrder() { scrim.classList.remove('on'); drawer.classList.remove('on'); drawer.setAttribute('inert', ''); drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; setTimeout(() => scrim.hidden = true, 400); }
  $$('.order-open').forEach(b => b.addEventListener('click', () => order.count() ? openOrder() : (location.pathname.endsWith('menu.html') ? $('#menu')?.scrollIntoView({ behavior: 'smooth' }) : (location.href = 'menu.html'))));
  fab.addEventListener('click', openOrder); scrim.addEventListener('click', closeOrder); $('.dr-close').addEventListener('click', closeOrder);
  addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('on')) closeOrder(); });
  let tT;
  function toast(t) { const el = $('.toast'); el.innerHTML = `${t}<button type="button">Оформить</button>`; el.classList.add('on'); el.querySelector('button').onclick = openOrder; clearTimeout(tT); tT = setTimeout(() => el.classList.remove('on'), 2800); }
  function bump() { fab.classList.remove('bump'); void fab.offsetWidth; fab.classList.add('bump'); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (b) order.add(JSON.parse(decodeURIComponent(b.dataset.add))); });

  function slots() {
    // интервалы по 15 минут: от «через 15 минут» до 18:45; если поздно — на завтра с 8:00
    const res = [], m0 = Math.ceil((mins + 15) / 15) * 15;
    if (open && m0 <= 18 * 60 + 45) for (let m = m0; m <= 18 * 60 + 45; m += 15) res.push(['Сегодня', m]);
    else for (let m = 8 * 60; m <= 12 * 60; m += 15) res.push(['Завтра', m]);
    return res.map(([d, m]) => `${d}, ${String(m / 60 | 0).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  function renderOrder() {
    const l = order.items(), n = order.count(), sum = order.sum();
    fab.hidden = !n; $('.fab-n').textContent = n; $('.fab-sum').textContent = rub(sum);
    const body = $('.dr-body');
    if (body.dataset.done) return;
    if (!n) { body.innerHTML = `<div class="dr-empty">${I.icon('espresso')}<h3>Пока пусто</h3><p class="muted">Выберите напиток в меню — нажмите на его цену.</p><a class="btn" href="menu.html">Открыть меню</a></div>`; return; }
    const keep = {}; $$('input,textarea,select', body).forEach(i => keep[i.id] = i.value);
    const asap = open && mins < 18 * 60 + 45;
    body.innerHTML = `<ul class="dr-list">${l.map((x, i) => `<li><span class="ico">${I.icon(x.ico)}</span><div><b>${x.name}${x.size ? ' · ' + x.size : ''}</b>${x.opts ? `<small>${x.opts}</small>` : ''}<span class="qty"><button type="button" data-q="${i}" data-d="-1" aria-label="Меньше">−</button>${x.qty}<button type="button" data-q="${i}" data-d="1" aria-label="Больше">+</button></span></div><strong>${rub(x.price * x.qty)}</strong></li>`).join('')}</ul>
      <form class="form dr-form" novalidate>
        <div class="field"><span class="lbl2">Как заберёте</span><div class="seg" id="o-where"><button type="button" aria-pressed="true" data-v="С собой">С собой</button><button type="button" aria-pressed="false" data-v="В зале">Выпью в зале</button></div></div>
        <div class="field"><label for="o-time">Когда</label><select id="o-time">${asap ? '<option>Как можно скорее · 10–15 минут</option>' : ''}${slots().map(s => `<option>${s}</option>`).join('')}</select>${!asap ? '<p class="muted" style="font-size:13px">Сейчас кофейня закрыта — оформите предзаказ на утро.</p>' : ''}</div>
        <div class="two"><div class="field"><label for="o-name">Имя</label><input id="o-name" autocomplete="given-name" required><span class="msg">Как назвать заказ?</span></div>
        <div class="field"><label for="o-phone">Телефон</label><input id="o-phone" type="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" required><span class="msg">Проверьте номер</span></div></div>
        <div class="field"><label for="o-note">Комментарий</label><textarea id="o-note" placeholder="Например: без сахара, крышку не нужно"></textarea></div>
        <div class="dr-total"><span>Итого · оплата при получении</span><b>${rub(sum)}</b></div>
        <button class="btn" type="submit">Оформить заказ</button>
        <p class="muted" style="font-size:12.5px;text-align:center">Демо: заказ кофейне не отправляется</p>
      </form>`;
    Object.entries(keep).forEach(([k, v]) => { const el = document.getElementById(k); if (el && v) el.value = v; });
    $$('input[type=tel]', body).forEach(phoneMask);
    $$('input,textarea', body).forEach(i => i.addEventListener('input', () => i.closest('.field')?.classList.remove('err')));
    $('#o-where').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#o-where button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $('.dr-list').addEventListener('click', e => {
      const q = e.target.closest('[data-q]'); if (!q) return;
      const l2 = order.items(), it = l2[+q.dataset.q]; it.qty += +q.dataset.d;
      if (it.qty < 1) l2.splice(+q.dataset.q, 1);
      order.save(l2);
    });
    $('.dr-form').addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      $$('[required]', e.target).forEach(i => { let bad = !i.value.trim(); if (!bad && i.type === 'tel') bad = i.value.replace(/\D/g, '').length < 11; i.closest('.field').classList.toggle('err', bad); if (bad && ok) { i.focus(); ok = false; } });
      if (!ok) return;
      const num = 100 + Math.floor(Math.random() * 900), when = $('#o-time').value, where = $('#o-where [aria-pressed="true"]').dataset.v, name = $('#o-name').value.trim();
      store.set('k-order', '[]'); body.dataset.done = '1'; fab.hidden = true;
      body.innerHTML = `<div class="dr-done"><p class="eyebrow">Заказ № ${num}</p><h3>${name}, спасибо!</h3><p class="muted">${when.startsWith('Как можно') ? 'Будет готов через 10–15 минут' : when} · ${where.toLowerCase()} · ${rub(sum)}</p>
        <ol class="track"><li class="on">Принят</li><li>Готовим</li><li>Готов, ждём вас</li></ol>
        <div class="dr-cup">${I.icon('cappuccino')}</div>
        <p class="muted" style="font-size:13px">Назовите бариста номер заказа. Это демонстрационный сайт: заказ никуда не отправлен.</p>
        <button class="btn ghost" type="button" id="o-new">Новый заказ</button></div>`;
      const steps = $$('.track li', body);
      setTimeout(() => steps[1]?.classList.add('on'), 1600); setTimeout(() => steps[2]?.classList.add('on'), 4200);
      $('#o-new').onclick = () => { delete body.dataset.done; closeOrder(); renderOrder(); };
    });
  }
  function phoneMask(inp) {
    inp.addEventListener('input', () => {
      let v = inp.value.replace(/\D/g, ''); if (!v) { inp.value = ''; return; }
      if (v[0] === '8') v = '7' + v.slice(1); if (v[0] !== '7') v = '7' + v; v = v.slice(0, 11);
      const p = [v.slice(1, 4), v.slice(4, 7), v.slice(7, 9), v.slice(9, 11)];
      inp.value = '+7' + (p[0] ? ` (${p[0]}` : '') + (p[0].length === 3 ? ')' : '') + (p[1] ? ` ${p[1]}` : '') + (p[2] ? `-${p[2]}` : '') + (p[3] ? `-${p[3]}` : '');
    });
  }
  renderOrder();

  /* ——— Меню ——— */
  /* Напитки и цены — из меню в Telegram-канале кофейни (@kkkkofe). Объёмы: S 250 · M 350 · L 450 мл. */
  const MENU = [
    { id: 'coffee', name: 'Кофе', note: 'Классические кофейные. Горячие напитки готовим 60–65 °C — если любите погорячее, скажите бариста.', items: [
      ['espresso', 'Эспрессо', '36 мл, плотный и сладковатый', { '': 120 }],
      ['americano', 'Американо', 'Эспрессо и горячая вода', { S: 130, M: 160, L: 180 }],
      ['cappuccino', 'Капучино', 'Классика с плотной молочной пеной', { S: 140, M: 200, L: 260 }, 1],
      ['latte', 'Латте', 'Больше молока, мягкий вкус', { M: 200, L: 240 }],
      ['flat', 'Флэт уайт', 'Двойной эспрессо и немного молока', { S: 180, L: 260 }],
      ['raf', 'Раф', 'Взбитый со сливками', { M: 260, L: 310 }]
    ] },
    { id: 'cold', name: 'Со льдом', note: 'Холодные напитки, 350 мл.', items: [
      ['iced', 'Айс-латте', 'Эспрессо, молоко и много льда', { M: 200 }],
      ['iced', 'Бамбл', 'Свежевыжатый апельсин, карамель и эспрессо', { M: 330 }, 1, 'oranges'],
      ['iced', 'Эспрессо-тоник', 'Тоник, лёд и шот эспрессо сверху', { M: 230 }],
      ['iced', 'Лимонад малина-мята', 'Освежающий, без кофеина', { M: 250 }]
    ] },
    { id: 'author', name: 'Special', note: 'Авторские напитки — то, за чем возвращаются гости.', items: [
      ['cheese', 'Раф крем-чиз с солёной карамелью', 'Сливочный, с солёно-сладкой нотой', { L: 320 }, 1],
      ['cheese', 'Латте крем-чиз с черникой', 'Нежная сырная шапка и ягоды', { L: 250 }],
      ['latte', 'Пряный латте', 'Тёплые специи и молоко', { M: 200 }],
      ['raf', 'Лавандовый раф', 'Сливочный, с лавандой', { M: 330 }],
      ['raf', 'Малиновый раф', 'Сливочный, с малиной', { M: 330 }]
    ] },
    { id: 'nocoffee', name: 'Без кофе', note: 'Для тех, кому сегодня без кофеина.', items: [
      ['cocoa', 'Какао', 'Как в детстве, только вкуснее', { S: 160, M: 200, L: 260 }],
      ['choco', 'Горячий шоколад', 'Густой и согревающий', { S: 170, M: 230, L: 270 }],
      ['cocoa', 'Молочный коктейль', 'Холодный, взбитый', { S: 160, M: 180, L: 210 }],
      ['matcha', 'Матча-латте', 'Японский зелёный чай с молоком', { M: 190 }],
      ['tea', 'Чай малиновый крем-чиз', 'Ягодный чай с нежной пенкой', { M: 210 }],
      ['tea', 'Чай облепиховый', 'Яркий, с кислинкой — греет в холод', { M: 160 }],
      ['tea', 'Чай листовой', 'Чёрный или зелёный', { M: 100 }]
    ] },
    { id: 'food', name: 'Завтраки и витрина', note: 'Выпечку и сэндвичи привозят каждое утро, витрина меняется — что сегодня, кофейня пишет в Telegram.', items: [
      ['sandwich', 'К-комбо с сэндвичем', 'Сэндвич и кофе — завтрак по пути на работу', { '': 430 }, 1, 'breakfast'],
      ['croissant', 'К-комбо с сырниками', 'Сырники с топпингом и кофе', { '': 365 }]
    ] }
  ];
  const box = $('#menu');
  if (box) {
    const tabs = $('#tabs');
    tabs.innerHTML = MENU.map((g, i) => `<button class="tab" role="tab" type="button" data-g="${g.id}" aria-selected="${i === 0}">${g.name}</button>`).join('') + `<button class="tab" role="tab" type="button" data-g="build" aria-selected="false">Собрать напиток</button>`;
    box.innerHTML = MENU.map(g => `<section class="menu-group" id="${g.id}"><h2>${g.name}</h2><p>${g.note}</p><div class="items">${g.items.map(([ico, n, d, p, hit, ph]) => `
      <div class="item" data-reveal><div class="ico${ph ? ' ph' : ''}">${ph ? `<img src="assets/photos/${ph}.webp" alt="" loading="lazy" width="600" height="800">` : I.icon(ico)}</div><div><h3>${n}${hit ? '<span class="hit">хит</span>' : ''}</h3><p>${d}</p></div>
      <div class="buy">${Object.entries(p).map(([sz, pr]) => `<button type="button" class="add" data-add="${encodeURIComponent(JSON.stringify({ ico, name: n, size: sz, price: pr }))}" aria-label="Добавить: ${n}${sz ? ', размер ' + sz : ''}, ${pr} рублей">${sz ? `<i>${sz}</i>` : ''}${pr} ₽<span aria-hidden="true">+</span></button>`).join('')}</div></div>`).join('')}</div></section>`).join('');
    const vit = $('#vitrine-box'), food = document.getElementById('food');
    if (vit && food) food.append(vit);
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
      cappuccino: { n: 'Капучино', p: [140, 200, 260], l: [['esp', .22], ['milk', .38], ['foam', .26]] },
      latte: { n: 'Латте', p: [null, 200, 240], l: [['esp', .18], ['milk', .6], ['foam', .12]] },
      raf: { n: 'Раф', p: [null, 260, 310], l: [['raf', .78], ['foam', .12]] },
      flat: { n: 'Флэт уайт', p: [180, null, 260], l: [['esp', .34], ['milk', .44], ['foam', .06]] },
      americano: { n: 'Американо', p: [130, 160, 180], l: [['water', .8], ['crema', .06]] }
    };
    const MILK = { cow: ['Обычное', 0, '#EADBC6'], oat: ['Овсяное', 50, '#E6D2B0'], coco: ['Кокосовое', 50, '#F2EDE3'], almond: ['Миндальное', 50, '#E9D5BD'] };
    const SYR = { none: ['Без сиропа', 0, null], caramel: ['Карамель', 40, '#D9A15B'], vanilla: ['Ваниль', 40, '#F2E2B8'], lavender: ['Лаванда', 40, '#CDBBE0'], honey: ['Мёд', 40, '#E9B85A'] };
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
    const TOP = { 0: ['Без топпинга', 0, ''], 1: ['Маршмеллоу', 30, 'маршмеллоу'], 2: ['Сырная пенка', 50, 'сырная пенка'] };
    seg('#b-shot', TOP, 'shot', (k, v) => v[0] + (v[1] ? ` +${v[1]}` : ''));
    const priceOf = () => { const b = BASES[st.base], noMilk = st.base === 'americano'; return b.p[st.size] + (noMilk ? 0 : MILK[st.milk][1]) + SYR[st.syr][1] + TOP[st.shot][1]; };
    const optsOf = () => { const noMilk = st.base === 'americano'; return [!noMilk && st.milk !== 'cow' ? MILK[st.milk][0].toLowerCase() + ' молоко' : '', st.syr !== 'none' ? (st.syr === 'honey' ? 'мёд' : 'сироп ' + SYR[st.syr][0].toLowerCase()) : '', TOP[st.shot][2]]; };
    const COLORS = { esp: '#4A2C1D', water: '#6E4127', crema: '#B9814E', foam: '#FBF5EC', raf: '#E3CDAE' };
    function render() {
      const b = BASES[st.base], noMilk = st.base === 'americano';
      if (noMilk) st.milk = 'cow';
      if (b.p[st.size] == null) st.size = b.p[1] != null ? 1 : 2;
      $$('#b-size button').forEach(x => { const off = b.p[+x.dataset.v] == null; x.disabled = off; x.style.opacity = off ? .4 : 1; });
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
        if (st.shot === 2 && k === 'foam') col = '#F3D488';
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
      $('#b-price').textContent = rub(priceOf());
      $('#b-name').textContent = [b.n, ['S', 'M', 'L'][st.size], ...optsOf()].filter(Boolean).join(' · ');
    }
    $('#b-add').addEventListener('click', () => {
      const b = BASES[st.base], price = priceOf(), opts = optsOf().filter(Boolean).join(', ');
      order.add({ ico: st.base === 'raf' ? 'raf' : st.base === 'americano' ? 'americano' : st.base === 'latte' ? 'latte' : st.base === 'flat' ? 'flat' : 'cappuccino', name: b.n, size: 'SML'[st.size], opts, price });
    });
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
