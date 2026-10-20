/* Генератор иллюстраций букетов в SVG.
   Каждый букет собирается из описания (цветы, зелень, упаковка) и номера-зерна,
   поэтому одна и та же позиция всегда выглядит одинаково, а размеры S/M/L — как один букет разной пышности. */
(function () {
  const PAL = {
    blush:   { base: '#F4CFC7', mid: '#EAB2A9', dark: '#A9584E' },
    rose:    { base: '#E99A9C', mid: '#D97B80', dark: '#8E3843' },
    fuchsia: { base: '#D9708F', mid: '#C2547A', dark: '#7A2546' },
    burgundy:{ base: '#93304A', mid: '#76213A', dark: '#3A0E19' },
    red:     { base: '#CC3B42', mid: '#AD2834', dark: '#5E1119' },
    cream:   { base: '#F7ECDA', mid: '#EBD9BC', dark: '#A88B5E' },
    white:   { base: '#FDFBF6', mid: '#EFEAE0', dark: '#9C9384' },
    peach:   { base: '#F7C49F', mid: '#F0A87E', dark: '#AE5F36' },
    coral:   { base: '#F28E77', mid: '#E2715C', dark: '#9C3B2A' },
    yellow:  { base: '#F6D873', mid: '#EDC24B', dark: '#9E7716' },
    orange:  { base: '#F5A458', mid: '#E9893A', dark: '#9E4D10' },
    lilac:   { base: '#CDB8E2', mid: '#B39BD0', dark: '#664A8A' },
    blue:    { base: '#9DB3DB', mid: '#7E98CA', dark: '#3D5488' }
  };
  const GREEN = { stem: '#5F7D58', euca: ['#A8BEB0', '#8FA999'], eucaStem: '#7D978A', leaf: '#557552', leafLight: '#7E9C70' };

  function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const f = n => Math.round(n * 10) / 10;

  /* ——— Цветы. Каждый рисуется в начале координат с радиусом r ——— */
  const FLOWERS = {
    rose(r, c) {
      return `<circle r="${f(r)}" fill="${c.base}"/>`
        + `<path d="M${f(-r*.92)} ${f(r*.2)}C${f(-r*.82)} ${f(-r*.72)} ${f(r*.82)} ${f(-r*.72)} ${f(r*.92)} ${f(r*.2)}" fill="none" stroke="${c.dark}" stroke-opacity=".26" stroke-width="${f(r*.05)}" stroke-linecap="round"/>`
        + `<circle cy="${f(-r*.04)}" r="${f(r*.68)}" fill="${c.mid}"/>`
        + `<path d="M${f(-r*.62)} ${f(r*.3)}C${f(-r*.5)} ${f(-r*.48)} ${f(r*.5)} ${f(-r*.48)} ${f(r*.62)} ${f(r*.3)}" fill="none" stroke="${c.dark}" stroke-opacity=".3" stroke-width="${f(r*.05)}" stroke-linecap="round"/>`
        + `<circle cy="${f(-r*.08)}" r="${f(r*.4)}" fill="${c.base}"/>`
        + `<path d="M${f(-r*.04)} ${f(-r*.12)}a${f(r*.12)} ${f(r*.12)} 0 1 1 ${f(r*.18)} ${f(r*.08)}a${f(r*.24)} ${f(r*.22)} 0 1 1 ${f(-r*.4)} ${f(-r*.06)}" fill="none" stroke="${c.dark}" stroke-opacity=".45" stroke-width="${f(r*.05)}" stroke-linecap="round"/>`;
    },
    peony(r, c) {
      let s = '';
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; s += `<circle cx="${f(Math.cos(a)*r*.6)}" cy="${f(Math.sin(a)*r*.6)}" r="${f(r*.44)}" fill="${c.base}" stroke="${c.dark}" stroke-opacity=".14" stroke-width="${f(r*.03)}"/>`; }
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .3; s += `<circle cx="${f(Math.cos(a)*r*.36)}" cy="${f(Math.sin(a)*r*.34 - r*.05)}" r="${f(r*.34)}" fill="${c.mid}" stroke="${c.dark}" stroke-opacity=".12" stroke-width="${f(r*.03)}"/>`; }
      s += `<circle cy="${f(-r*.06)}" r="${f(r*.32)}" fill="${c.base}"/>`;
      s += `<path d="M${f(-r*.2)} ${f(-r*.02)}q${f(r*.1)} ${f(-r*.2)} ${f(r*.2)} 0q${f(r*.1)} ${f(-r*.2)} ${f(r*.2)} 0" fill="none" stroke="${c.dark}" stroke-opacity=".35" stroke-width="${f(r*.04)}" stroke-linecap="round"/>`;
      return s;
    },
    ranunculus(r, c) {
      const rings = [[1, c.base], [.8, c.mid], [.6, c.base], [.42, c.mid], [.24, c.base], [.11, c.dark]];
      return rings.map(([k, col], i) => `<circle cy="${f(-r*(1-k)*.22)}" r="${f(r*k)}" fill="${col}" stroke="${c.dark}" stroke-opacity="${i === 5 ? 0 : .22}" stroke-width="${f(r*.035)}"/>`).join('');
    },
    tulip(r, c) {
      return `<path d="M${f(-r*.62)} ${f(-r*.2)}C${f(-r*.72)} ${f(r*.55)} ${f(-r*.3)} ${f(r*.88)} 0 ${f(r*.88)}C${f(r*.3)} ${f(r*.88)} ${f(r*.72)} ${f(r*.55)} ${f(r*.62)} ${f(-r*.2)}C${f(r*.52)} ${f(-r*.5)} ${f(r*.34)} ${f(-r*.7)} ${f(r*.22)} ${f(-r*.78)}L0 ${f(-r*.32)}L${f(-r*.22)} ${f(-r*.78)}C${f(-r*.34)} ${f(-r*.7)} ${f(-r*.52)} ${f(-r*.5)} ${f(-r*.62)} ${f(-r*.2)}Z" fill="${c.base}" stroke="${c.dark}" stroke-opacity=".22" stroke-width="${f(r*.04)}"/>`
        + `<path d="M${f(-r*.3)} ${f(r*.84)}C${f(-r*.46)} ${f(r*.2)} ${f(-r*.24)} ${f(-r*.56)} 0 ${f(-r*.92)}C${f(r*.24)} ${f(-r*.56)} ${f(r*.46)} ${f(r*.2)} ${f(r*.3)} ${f(r*.84)}Z" fill="${c.mid}"/>`
        + `<path d="M0 ${f(-r*.7)}V${f(r*.7)}" stroke="${c.dark}" stroke-opacity=".18" stroke-width="${f(r*.04)}"/>`;
    },
    daisy(r, c) {
      let s = '';
      const n = 14;
      for (let i = 0; i < n; i++) s += `<ellipse cy="${f(-r*.56)}" rx="${f(r*.17)}" ry="${f(r*.44)}" fill="${c.base}" stroke="${c.dark}" stroke-opacity=".22" stroke-width="${f(r*.03)}" transform="rotate(${f(i*360/n)})"/>`;
      s += `<circle r="${f(r*.3)}" fill="#E8B637"/><circle r="${f(r*.3)}" fill="none" stroke="#B8861A" stroke-width="${f(r*.05)}" stroke-dasharray="${f(r*.04)} ${f(r*.08)}"/>`;
      return s;
    },
    anemone(r, c) {
      let s = '';
      for (let i = 0; i < 6; i++) s += `<ellipse cy="${f(-r*.5)}" rx="${f(r*.42)}" ry="${f(r*.52)}" fill="${c.base}" stroke="${c.dark}" stroke-opacity=".16" stroke-width="${f(r*.03)}" transform="rotate(${i*60})"/>`;
      s += `<circle r="${f(r*.3)}" fill="#2A2530"/>`;
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += `<circle cx="${f(Math.cos(a)*r*.38)}" cy="${f(Math.sin(a)*r*.38)}" r="${f(r*.045)}" fill="#2A2530"/>`; }
      return s;
    }
  };
  const SCALE = { peony: 1.18, rose: 1, ranunculus: .9, tulip: .95, daisy: .82, anemone: .9 };

  /* ——— Зелень ——— */
  function euca(x0, y0, x1, y1, R) {
    const n = 7, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    let s = `<path d="M${f(x0)} ${f(y0)}Q${f((x0+x1)/2 + nx*10)} ${f((y0+y1)/2 + ny*10)} ${f(x1)} ${f(y1)}" stroke="${GREEN.eucaStem}" stroke-width="2" fill="none"/>`;
    for (let i = 1; i <= n; i++) {
      const t = i / (n + .4), side = i % 2 ? 1 : -1, rr = 11 - t * 4 + R() * 2;
      const px = x0 + dx * t + nx * side * (rr * .8), py = y0 + dy * t + ny * side * (rr * .8);
      s += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(rr)}" fill="${GREEN.euca[i % 2]}"/>`;
    }
    return s;
  }
  function leaf(x0, y0, x1, y1) {
    const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + 90, L = Math.hypot(x1 - x0, y1 - y0) * .9, w = L * .36;
    return `<g transform="translate(${f(x1 - (x1-x0)*.85)} ${f(y1 - (y1-y0)*.85)}) rotate(${f(ang)})">`
      + `<path d="M0 0C${f(w*.7)} ${f(-L*.3)} ${f(w*.5)} ${f(-L*.8)} 0 ${f(-L)}C${f(-w*.5)} ${f(-L*.8)} ${f(-w*.7)} ${f(-L*.3)} 0 0Z" fill="${GREEN.leaf}"/>`
      + `<path d="M0 0V${f(-L*.9)}" stroke="${GREEN.leafLight}" stroke-width="1.4"/></g>`;
  }
  function spike(x0, y0, x1, y1, col) {
    const c = PAL[col] || PAL.lilac, n = 9;
    let s = `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="#6E7F5E" stroke-width="1.8"/>`;
    for (let i = 3; i <= n; i++) {
      const t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t, ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + 90;
      s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(4.4 - t * 1.4)}" ry="${f(6.4 - t * 2)}" fill="${i % 2 ? c.mid : c.base}" transform="rotate(${f(ang + (i % 2 ? 16 : -16))} ${f(px)} ${f(py)})"/>`;
    }
    return s;
  }
  function gyp(x, y, R, k = 1) {
    let s = '';
    for (let i = 0; i < 16; i++) {
      const a = R() * Math.PI * 2, d = R() * 22 * k, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * .8;
      s += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(2 + R() * 1.6)}" fill="#FFFDF8" stroke="#CFC6B6" stroke-width=".6"/>`;
    }
    return s;
  }

  /* ——— Сборка букета ——— */
  function bouquet(p, opts = {}) {
    const k = opts.k || 1;
    const R = rng(hash(p.id));
    const wrap = p.wrap || 'paper';
    const C = { x: 200, y: wrap === 'box' ? 212 : wrap === 'vase' ? 190 : 186 };
    const N = Math.max(3, Math.round(p.count * k));
    const rx = Math.min(150, (wrap === 'box' ? 104 : 96) + 26 * Math.sqrt(k) + Math.min(N, 26) * .8);
    const ry = rx * (wrap === 'box' ? .6 : .76);
    const baseR = Math.max(19, Math.min(46, Math.sqrt(rx * ry * Math.PI / N) * .6));

    // список голов по весам
    const pool = [];
    p.mix.forEach(([t, col, w]) => { for (let i = 0; i < w; i++) pool.push([t, col]); });
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }

    const heads = [];
    for (let i = 0; i < N; i++) {
      const t = Math.sqrt((i + .5) / N), a = i * 2.39996 + R() * .35;
      const [type, col] = pool[i % pool.length];
      const r = baseR * (SCALE[type] || 1) * (.9 + R() * .2) * (1 - t * .1);
      heads.push({ x: C.x + Math.cos(a) * rx * t * .92, y: C.y + Math.sin(a) * ry * t * .92 - (1 - t) * 16, r, type, col, rot: (R() - .5) * (type === 'tulip' ? 40 : 60) });
    }
    heads.sort((a, b) => a.y - b.y);

    const T = { x: 200, y: 356 };
    const out = [];
    const paper = p.paper || '#E8DCCB';
    const paperDark = shade(paper, -.12);

    // тень
    out.push(`<ellipse cx="200" cy="${wrap === 'paper' ? 486 : 476}" rx="${wrap === 'paper' ? 70 : 120}" ry="8" fill="#000" opacity=".07"/>`);

    // стебли под лентой
    if (wrap === 'paper') {
      [[-16, 476], [-7, 482], [2, 484], [10, 481], [18, 475]].forEach(([dx, y]) => {
        out.push(`<path d="M${200 + dx * .25} 362L${200 + dx} ${y}" stroke="${GREEN.stem}" stroke-width="4.2" stroke-linecap="round"/>`);
      });
    }

    const g = []; // группа, которая покачивается
    if (wrap === 'paper') {
      g.push(`<path d="M200 352L56 170Q92 118 152 100Z" fill="${paperDark}"/>`);
      g.push(`<path d="M200 352L344 170Q308 118 248 100Z" fill="${paperDark}"/>`);
      g.push(`<path d="M200 352L136 92Q200 64 264 92Z" fill="${paper}"/>`);
    }
    if (wrap === 'vase') {
      heads.forEach(h => g.push(`<path d="M${f(h.x)} ${f(h.y)}L${f(200 + (h.x - 200) * .2)} 312" stroke="${GREEN.stem}" stroke-width="2.6"/>`));
    } else if (wrap === 'paper') {
      heads.forEach(h => g.push(`<path d="M${f(h.x)} ${f(h.y)}L${f(200 + (h.x - 200) * .12)} 330" stroke="${GREEN.stem}" stroke-width="2.6"/>`));
    }

    // зелень по краю купола
    const greens = (p.greens || []).slice();
    const gn = Math.round(greens.length * (k > 1 ? 1.25 : k < 1 ? .75 : 1)) || greens.length;
    for (let j = 0; j < gn; j++) {
      const kind = greens[j % greens.length];
      const ang = -Math.PI - .3 + (j + .5) / gn * (Math.PI + .6) + (R() - .5) * .25;
      const x0 = C.x + Math.cos(ang) * rx * .5, y0 = C.y + Math.sin(ang) * ry * .5;
      let x1 = C.x + Math.cos(ang) * rx * (1.2 + R() * .2), y1 = C.y + Math.sin(ang) * ry * (1.3 + R() * .25);
      x1 = Math.max(16, Math.min(384, x1)); y1 = Math.max(16, Math.min(wrap === 'box' ? 300 : 330, y1));
      if (kind === 'euca') g.push(euca(x0, y0, x1, y1, R));
      else if (kind === 'leaf') g.push(leaf(x0, y0, x1, y1));
      else if (kind.startsWith('spike')) g.push(spike(x0, y0, x1, y1, kind.split(':')[1]));
    }
    if (p.gyp) {
      for (let j = 0; j < Math.round(5 * k); j++) {
        const ang = -Math.PI - .2 + R() * (Math.PI + .4);
        g.push(gyp(C.x + Math.cos(ang) * rx * 1.02, C.y + Math.sin(ang) * ry * 1.02, R));
      }
    }

    if (wrap === 'box') {
      g.push(`<ellipse cx="200" cy="292" rx="112" ry="24" fill="${paperDark}"/>`);
    }

    // головы цветов
    heads.forEach((h, i) => {
      const c = PAL[h.col] || PAL.blush;
      const draw = FLOWERS[h.type] || FLOWERS.rose;
      g.push(`<g transform="translate(${f(h.x)} ${f(h.y)}) rotate(${f(h.rot)})"><g class="head" style="--hd:${f(-i * .37)}s">${draw(h.r, c)}</g></g>`);
    });
    if (p.gyp) {
      for (let j = 0; j < Math.round(3 * k); j++) {
        const a = R() * Math.PI * 2, t = .4 + R() * .5;
        g.push(gyp(C.x + Math.cos(a) * rx * t, C.y + Math.sin(a) * ry * t, R, .6));
      }
    }

    if (wrap === 'paper') {
      g.push(`<path d="M90 250Q200 296 310 250L227 364L173 364Z" fill="${paper}"/>`);
      g.push(`<path d="M90 250Q140 276 200 282L200 364L173 364Z" fill="${paperDark}" opacity=".35"/>`);
      g.push(`<path d="M146 272L190 362M254 272L210 362" stroke="${paperDark}" stroke-width="1.2" opacity=".6"/>`);
      const rb = p.ribbon || '#B5523F', rbd = shade(rb, -.18);
      g.push(`<path d="M199 364L178 410L188 405L194 414Z" fill="${rbd}"/><path d="M201 364L222 410L212 405L206 414Z" fill="${rbd}"/>`);
      g.push(`<path d="M200 362C172 336 148 350 160 368C170 382 190 372 200 362Z" fill="${rb}"/><path d="M200 362C228 336 252 350 240 368C230 382 210 372 200 362Z" fill="${rb}"/>`);
      g.push(`<circle cx="200" cy="363" r="7" fill="${rbd}"/>`);
    }
    if (wrap === 'box') {
      const rb = p.ribbon || '#B5523F';
      g.push(`<path d="M88 292A112 24 0 0 0 312 292L312 452A112 24 0 0 1 88 452Z" fill="${paper}"/>`);
      g.push(`<path d="M88 292A112 24 0 0 0 312 292L312 452A112 24 0 0 1 88 452Z" fill="url(#bx${hash(p.id) % 999})"/>`);
      g.push(`<path d="M88 412A112 24 0 0 0 312 412L312 428A112 24 0 0 1 88 428Z" fill="${rb}"/>`);
      out.unshift(`<defs><linearGradient id="bx${hash(p.id) % 999}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs>`);
    }
    if (wrap === 'vase') {
      const v = p.paper || '#D9CFC2', vd = shade(v, -.14);
      g.push(`<path d="M152 330C120 362 116 432 160 470L240 470C284 432 280 362 248 330C244 318 252 308 262 302L138 302C148 308 156 318 152 330Z" fill="${v}"/>`);
      g.push(`<path d="M152 330C120 362 116 432 160 470L200 470L200 302L138 302C148 308 156 318 152 330Z" fill="${vd}" opacity=".35"/>`);
      g.push(`<ellipse cx="200" cy="302" rx="62" ry="9" fill="${vd}"/>`);
    }

    const cls = opts.sway ? ' class="sway"' : '';
    out.push(`<g${cls}>${g.join('')}</g>`);
    const label = opts.label ? ` role="img" aria-label="${opts.label}"` : ' aria-hidden="true"';
    return `<svg class="${opts.cls || 'bq'}" viewBox="0 0 400 500"${label} preserveAspectRatio="xMidYMid meet">${out.join('')}</svg>`;
  }

  /* одиночный цветок на стебле — для иконок поводов и портретов */
  function single(type, col, opts = {}) {
    const c = PAL[col] || PAL.blush, r = opts.r || 30;
    const draw = FLOWERS[type] || FLOWERS.rose;
    return `<svg class="${opts.cls || 'ic'}" viewBox="0 0 120 120" aria-hidden="true">`
      + `<path d="M60 64C58 84 62 100 58 120" stroke="${GREEN.stem}" stroke-width="3" fill="none"/>`
      + `<path d="M60 92C72 80 88 82 94 86C86 96 72 98 60 92Z" fill="${GREEN.leafLight}"/>`
      + `<path d="M59 100C48 90 34 92 28 96C36 106 50 106 59 100Z" fill="${GREEN.leaf}"/>`
      + `<g transform="translate(60 52) rotate(${opts.rot || 0})">${draw(r, c)}</g></svg>`;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = n >> 8 & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  }

  window.Bouquet = { bouquet, single, PAL };
})();
