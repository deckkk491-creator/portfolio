/* «Мирт»: общая логика сайта — тема, меню, анимации, корзина и страницы. */
(function () {
  const D = window.MIRT, B = window.Bouquet;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmt = n => n.toLocaleString('ru-RU') + ' ₽';
  const SIZE_K = { S: .75, M: 1, L: 1.4 };
  const VASE = 1900;
  const priceOf = (p, size) => Math.round(p.price * SIZE_K[size || 'M'] / 100) * 100;
  const byId = id => D.products.find(p => p.id === id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  document.documentElement.classList.remove('no-js');

  /* ——— Тема ——— */
  $$('.theme-btn').forEach(b => b.addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    store.set('mirt-theme', root.dataset.theme);
  }));

  /* ——— Шапка и меню ——— */
  const header = $('header.site');
  const onScroll = () => header && header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger');
  if (burger) burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
  });

  /* ——— Плавный уход со страницы ——— */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname) || (url.pathname === location.pathname && url.hash)) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, 260);
  });
  addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('leaving', 'menu-open'); });

  /* ——— Появление при прокрутке ——— */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 }) : null;
  const reveal = (root = document) => $$('[data-reveal]:not(.in)', root).forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ——— Корзина ——— */
  const cart = {
    items() { return store.get('mirt-cart', []); },
    save(list) { store.set('mirt-cart', list); updateCount(true); },
    add(item) {
      const list = this.items();
      const same = list.find(x => x.id === item.id && x.size === item.size && !!x.vase === !!item.vase && (x.text || '') === (item.text || ''));
      if (same) same.qty += item.qty || 1; else list.push({ qty: 1, ...item });
      this.save(list);
    },
    count() { return this.items().reduce((s, x) => s + x.qty, 0); }
  };
  function updateCount(bump) {
    $$('.cart-count').forEach(el => {
      const n = cart.count();
      el.textContent = n; el.classList.toggle('on', n > 0);
      if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    });
  }
  updateCount(false);

  let toastT;
  function toast(text) {
    let t = $('.toast');
    if (!t) {
      t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
      document.body.append(t);
    }
    t.innerHTML = `<i><svg viewBox="0 0 16 16"><path d="M4 8.5l2.5 2.5L12 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></i><span>${text}</span><a href="cart.html">В корзину</a>`;
    requestAnimationFrame(() => t.classList.add('on'));
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200);
  }

  /* ——— Карточка букета ——— */
  function card(p, i = 0) {
    const tagCls = p.tag === 'хит' ? 'tag hot' : 'tag';
    return `<article class="card" style="--i:${i};--c-tint:${p.tint}">
      <div class="pic">${p.tag ? `<span class="${tagCls}">${p.tag}</span>` : ''}${B.bouquet(p)}
        <div class="quick"><button class="btn sm block" type="button" data-add="${p.id}">В корзину · ${fmt(p.price)}</button></div></div>
      <div class="meta"><h3><a href="product.html?id=${p.id}">${p.name}</a></h3><p class="comp">${p.comp}</p><p class="price">${fmt(p.price)}</p></div>
    </article>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    const p = byId(b.dataset.add); if (!p) return;
    cart.add({ id: p.id, size: 'M' });
    toast(`«${p.name}» в корзине`);
  });

  /* ——— Демонстрационные формы ——— */
  function validate(form) {
    let ok = true;
    $$('[required]', form).forEach(inp => {
      const f = inp.closest('.field'); let bad = !inp.value.trim();
      if (!bad && inp.type === 'tel') bad = inp.value.replace(/\D/g, '').length < 11;
      if (!bad && inp.type === 'email') bad = !/^\S+@\S+\.\S+$/.test(inp.value);
      if (f) f.classList.toggle('err', bad);
      if (bad && ok) { inp.focus(); ok = false; }
    });
    return ok;
  }
  function phoneMask(inp) {
    inp.addEventListener('input', () => {
      let d = inp.value.replace(/\D/g, ''); if (!d) { inp.value = ''; return; }
      if (d[0] === '8') d = '7' + d.slice(1); if (d[0] !== '7') d = '7' + d; d = d.slice(0, 11);
      const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
      inp.value = '+7' + (p[0] ? ` (${p[0]}` : '') + (p[0].length === 3 ? ')' : '') + (p[1] ? ` ${p[1]}` : '') + (p[2] ? `-${p[2]}` : '') + (p[3] ? `-${p[3]}` : '');
    });
  }
  $$('input[type=tel]').forEach(phoneMask);
  const successSVG = B.single('peony', 'blush', { cls: '', r: 30 });
  $$('form[data-demo]').forEach(form => {
    $$('input,select,textarea', form).forEach(i => i.addEventListener('input', () => i.closest('.field')?.classList.remove('err')));
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate(form)) return;
      const box = form.closest('.panel') || form;
      box.innerHTML = `<div class="success">${successSVG}<h3>${form.dataset.title || 'Спасибо!'}</h3><p class="muted">${form.dataset.text || 'Мы свяжемся с вами в течение 15 минут.'}</p></div>`;
    });
  });

  /* ——— Страницы ——— */
  const page = document.body.dataset.page;

  if (page === 'home') {
    $('#hero-bq').innerHTML = B.bouquet(D.hero, { sway: true, cls: 'bq', label: 'Иллюстрация букета' });
    const art = $('.hero-art');
    if (art && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('span'); s.className = 'petal';
        s.style.cssText = `left:${10 + i * 14}%;top:${4 + (i % 3) * 6}%;animation-duration:${9 + i * 1.7}s;animation-delay:${i * 1.6}s;background:${['#EBC9C1', '#F4CFC7', '#F7ECDA'][i % 3]}`;
        art.append(s);
      }
    }
    const hits = D.products.slice().sort((a, b) => b.pop - a.pop).slice(0, 4);
    $('#hits').innerHTML = hits.map(card).join('');
    $('#story-young').insertAdjacentHTML('afterbegin', B.bouquet(byId('mandarin')));
    $('#story-adult').insertAdjacentHTML('afterbegin', B.bouquet(byId('mame')));
    $('#vase').innerHTML = B.bouquet(D.vase, { sway: true });
    const icons = { birthday: ['ranunculus', 'peach'], love: ['rose', 'red'], mom: ['peony', 'rose'], date: ['rose', 'coral'], thanks: ['anemone', 'white'], just: ['daisy', 'white'], wedding: ['peony', 'white'] };
    $$('.occ[data-occ]').forEach(el => { const [t, c] = icons[el.dataset.occ] || ['rose', 'blush']; el.insertAdjacentHTML('beforeend', B.single(t, c, { cls: 'ic', rot: -8 })); });
  }

  if (page === 'catalog') {
    const params = new URLSearchParams(location.search);
    const st = { occ: params.get('occ') || '', color: params.get('color') || '', price: params.get('price') || '', sort: 'pop' };
    const occBox = $('#f-occ'), colBox = $('#f-color'), priceBox = $('#f-price');
    occBox.innerHTML = `<button class="chip" type="button" data-v="">Все поводы</button>` + Object.entries(D.occasions).map(([k, v]) => `<button class="chip" type="button" data-v="${k}">${v}</button>`).join('');
    colBox.innerHTML = Object.entries(D.colors).map(([k, v]) => `<button class="chip" type="button" data-v="${k}"><i style="background:${v.dot}"></i>${v.name}</button>`).join('');
    const PR = { low: ['до 5 000 ₽', 0, 5000], mid: ['5–10 тыс. ₽', 5000, 10000], high: ['от 10 тыс. ₽', 10000, 1e9] };
    priceBox.innerHTML = Object.entries(PR).map(([k, v]) => `<button class="chip" type="button" data-v="${k}">${v[0]}</button>`).join('');
    const bind = (box, key, toggle) => box.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      st[key] = toggle && st[key] === b.dataset.v ? '' : b.dataset.v; render();
    });
    bind(occBox, 'occ'); bind(colBox, 'color', true); bind(priceBox, 'price', true);
    $('#f-sort').addEventListener('change', e => { st.sort = e.target.value; render(); });
    $('#reset').addEventListener('click', () => { st.occ = st.color = st.price = ''; render(); });
    function render() {
      $$('.chip', occBox).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === st.occ));
      $$('.chip', colBox).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === st.color));
      $$('.chip', priceBox).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === st.price));
      let list = D.products.filter(p => (!st.occ || p.occ.includes(st.occ)) && (!st.color || p.color === st.color) && (!st.price || (p.price >= PR[st.price][1] && p.price < PR[st.price][2])));
      list.sort(st.sort === 'asc' ? (a, b) => a.price - b.price : st.sort === 'desc' ? (a, b) => b.price - a.price : (a, b) => b.pop - a.pop);
      $('#found').textContent = `${list.length} ${plural(list.length, ['букет', 'букета', 'букетов'])}`;
      $('#title-occ').textContent = st.occ ? D.occasions[st.occ].toLowerCase() : 'на любой повод';
      $('#reset').hidden = !(st.occ || st.color || st.price);
      $('#catalog').innerHTML = list.length ? list.map(card).join('')
        : `<div class="empty"><h3>Такого букета пока нет</h3><p>Попробуйте убрать один из фильтров — или напишите флористу, соберём специально для вас.</p></div>`;
      const q = new URLSearchParams(); if (st.occ) q.set('occ', st.occ); if (st.color) q.set('color', st.color); if (st.price) q.set('price', st.price);
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
    }
    render();
  }

  if (page === 'product') {
    const p = byId(new URLSearchParams(location.search).get('id')) || D.products[0];
    document.title = `${p.name} — Мирт`;
    const st = { size: 'M', vase: false, card: false };
    const g = $('.gallery .main'); g.style.setProperty('--c-tint', p.tint);
    g.innerHTML = B.bouquet(p, { label: p.name }) + `<span class="size-note" id="size-note">${D.sizes[1].note}</span>`;
    $('#p-crumb').textContent = p.name;
    $('#p-name').textContent = p.name;
    $('#p-comp').textContent = p.comp;
    $('#p-desc').textContent = p.desc;
    $('#p-occ').innerHTML = p.occ.map(o => `<a class="chip" href="catalog.html?occ=${o}">${D.occasions[o]}</a>`).join('');
    $('#sizes').innerHTML = D.sizes.map(s => `<button class="size" type="button" data-s="${s.key}" aria-pressed="${s.key === 'M'}"><b>${s.key}</b><span>${s.label}<br>${fmt(priceOf(p, s.key))}</span></button>`).join('');
    const total = () => priceOf(p, st.size) + (st.vase ? VASE : 0);
    function upd() {
      $('#p-price').textContent = fmt(total());
      $('#buy').textContent = `Добавить в корзину · ${fmt(total())}`;
    }
    $('#sizes').addEventListener('click', e => {
      const b = e.target.closest('.size'); if (!b || b.dataset.s === st.size) return;
      st.size = b.dataset.s;
      $$('.size').forEach(x => x.setAttribute('aria-pressed', x === b));
      const s = D.sizes.find(x => x.key === st.size);
      const svg = $('svg', g); svg.classList.add('swap');
      setTimeout(() => { svg.outerHTML = B.bouquet(p, { k: s.k, label: p.name, cls: 'bq swap' }); requestAnimationFrame(() => requestAnimationFrame(() => $('svg', g).classList.remove('swap'))); }, 260);
      $('#size-note').textContent = s.note;
      upd();
    });
    $('#vase').addEventListener('change', e => { st.vase = e.target.checked; upd(); });
    $('#card').addEventListener('change', e => { $('.card-text').classList.toggle('on', e.target.checked); });
    $('#buy').addEventListener('click', () => {
      cart.add({ id: p.id, size: st.size, vase: st.vase, text: $('#card').checked ? $('#card-msg').value.trim() : '' });
      toast(`«${p.name}», размер ${st.size}, в корзине`);
    });
    upd();
    const rel = D.products.filter(x => x.id !== p.id && x.occ.some(o => p.occ.includes(o))).sort((a, b) => b.pop - a.pop).slice(0, 4);
    $('#related').innerHTML = rel.map(card).join('');
  }

  if (page === 'cart') {
    let promo = store.get('mirt-promo', false);
    const st = { zone: 'mkad' };
    const ZONES = { mkad: 490, out: 890, far: 1490 };
    function render() {
      const list = cart.items().filter(x => byId(x.id));
      const box = $('#lines');
      if (!list.length) {
        $('#cart-full').hidden = true; $('#cart-empty').hidden = false;
        $('#cart-empty .grid').innerHTML = D.products.slice().sort((a, b) => b.pop - a.pop).slice(0, 4).map(card).join('');
        return;
      }
      box.innerHTML = list.map((x, i) => {
        const p = byId(x.id), unit = priceOf(p, x.size) + (x.vase ? VASE : 0);
        const extra = [`размер ${x.size}`, x.vase ? 'с вазой' : '', x.text ? 'с открыткой' : ''].filter(Boolean).join(' · ');
        return `<div class="line-item" style="--c-tint:${p.tint};animation-delay:${i * 60}ms">
          <a class="thumb" href="product.html?id=${p.id}">${B.bouquet(p, { k: SIZE_K[x.size] === 1 ? 1 : D.sizes.find(s => s.key === x.size).k })}</a>
          <div><h3><a href="product.html?id=${p.id}">${p.name}</a></h3><p class="sub">${extra}</p><button class="rm" type="button" data-rm="${i}">Удалить</button></div>
          <div class="right"><div class="qty"><button type="button" data-q="${i}" data-d="-1" aria-label="Меньше">−</button><span>${x.qty}</span><button type="button" data-q="${i}" data-d="1" aria-label="Больше">+</button></div><span class="sum">${fmt(unit * x.qty)}</span></div>
        </div>`;
      }).join('');
      const sub = list.reduce((s, x) => s + (priceOf(byId(x.id), x.size) + (x.vase ? VASE : 0)) * x.qty, 0);
      const disc = promo ? Math.round(sub * .1) : 0;
      const del = st.zone === 'mkad' && sub - disc >= 7000 ? 0 : ZONES[st.zone];
      $('#s-sub').textContent = fmt(sub);
      $('#s-disc-row').hidden = !promo; $('#s-disc').textContent = '−' + fmt(disc);
      $('#s-del').textContent = del ? fmt(del) : 'бесплатно';
      $('#s-total').textContent = fmt(sub - disc + del);
      $('#s-hint').textContent = st.zone === 'mkad' && sub - disc < 7000 ? `Ещё ${fmt(7000 - (sub - disc))} — и доставка в пределах МКАД бесплатно` : '';
    }
    $('#lines').addEventListener('click', e => {
      const list = cart.items();
      const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
      if (q) { const it = list[+q.dataset.q]; it.qty = Math.max(1, Math.min(20, it.qty + +q.dataset.d)); }
      else if (rm) list.splice(+rm.dataset.rm, 1);
      else return;
      cart.save(list); render();
    });
    $('#zone').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      st.zone = b.dataset.z; $$('#zone button').forEach(x => x.setAttribute('aria-pressed', x === b)); render();
    });
    $('#promo-form').addEventListener('submit', e => {
      e.preventDefault();
      const ok = $('#promo').value.trim().toUpperCase() === 'МИРТ10';
      promo = promo || ok; store.set('mirt-promo', promo);
      $('#promo-msg').textContent = ok ? 'Промокод применён: −10%' : 'Такого промокода нет. Попробуйте МИРТ10';
      $('#promo-msg').style.color = ok ? 'var(--moss)' : 'var(--accent)';
      render();
    });
    const d = $('#date'); if (d) { const t = new Date(); d.min = t.toISOString().slice(0, 10); d.value = d.min; }
    $('#order').addEventListener('submit', e => {
      e.preventDefault();
      if (!validate(e.target)) return;
      const n = Math.floor(1000 + Math.random() * 9000);
      store.set('mirt-cart', []); updateCount(false);
      $('#cart-full').innerHTML = `<div class="panel success" style="grid-column:1/-1">${successSVG}<h3>Заказ № ${n} принят</h3><p class="muted">Флорист позвонит в течение 15 минут, чтобы подтвердить детали, и пришлёт фото букета перед отправкой.<br>Это демонстрационный сайт — заказ никуда не отправлен.</p><p style="margin-top:26px"><a class="btn" href="catalog.html">Вернуться в каталог</a></p></div>`;
      scrollTo({ top: 0, behavior: 'smooth' });
    });
    render();
  }

  if (page === 'subscription') {
    $('#vase').innerHTML = B.bouquet(D.vase, { sway: true });
    const m = new Date().getMonth();
    $$('.month').forEach((el, i) => el.classList.toggle('now', i === m));
    $$('[data-plan]').forEach(b => b.addEventListener('click', () => {
      const sel = $('#plan'); sel.value = b.dataset.plan;
      $('#sub-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  if (page === 'about') {
    const looks = [['peony', 'blush'], ['ranunculus', 'peach'], ['anemone', 'white']];
    $$('.person .ph').forEach((el, i) => {
      const [t, c] = looks[i % 3];
      el.innerHTML = `<svg viewBox="0 0 300 375" aria-hidden="true"><circle cx="150" cy="170" r="120" fill="${['#F2D9D2', '#F6E2CF', '#E7EBE2'][i % 3]}"/>` +
        `<text x="150" y="220" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-size="150" fill="${['#C26A5E', '#C9783F', '#557552'][i % 3]}" opacity=".9">${el.dataset.l}</text>` +
        `<g transform="translate(150 205) scale(1.25)">${B.single(t, c).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`;
    });
  }

  if (page === 'delivery') {
    const st = { zone: 'mkad', express: false };
    const Z = { mkad: 490, out: 890, far: 1490 };
    const sum = $('#calc-sum');
    function calc() {
      const s = Math.max(0, +sum.value || 0);
      let d = st.zone === 'mkad' && s >= 7000 ? 0 : Z[st.zone];
      if (st.express) d += 700;
      $('#calc-out').textContent = d ? fmt(d) : 'бесплатно';
      $('#calc-hint').textContent = st.zone === 'mkad' && s < 7000 ? `До бесплатной доставки не хватает ${fmt(7000 - s)}` : st.zone === 'mkad' ? 'Доставка в пределах МКАД бесплатна' : '';
    }
    sum.addEventListener('input', calc);
    $('#calc-zone').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.zone = b.dataset.z; $$('#calc-zone button').forEach(x => x.setAttribute('aria-pressed', x === b)); calc(); });
    $('#calc-exp').addEventListener('change', e => { st.express = e.target.checked; calc(); });
    calc();
  }

  function plural(n, f) { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? f[2] : b > 1 && b < 5 ? f[1] : b === 1 ? f[0] : f[2]; }

  reveal();
})();
