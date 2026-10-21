/* Иллюстрации кофейни «К» в SVG: напитки, выпечка, лампа, зал, книжная полка, схема проезда. */
(function () {
  const C = { esp: '#4A2C1D', crema: '#B9814E', milk: '#EADBC6', foam: '#FBF5EC', cheese: '#F3D488', cup: '#FFFFFF', cupLine: '#D9CEC0', saucer: '#F1EBE2', glass: 'rgba(255,255,255,.55)', glassLine: '#CDBFAF', tea: '#C9873B', cocoa: '#7A4A30', green: '#7F8F6E' };

  const cup = (top, art) => `<ellipse cx="50" cy="86" rx="40" ry="8" fill="${C.saucer}" stroke="${C.cupLine}"/>
    <path d="M78 46c10 0 12 14 0 16" fill="none" stroke="${C.cupLine}" stroke-width="5" stroke-linecap="round"/>
    <path d="M16 42h64l-5 30c-1.5 8-8 12-16 12H37c-8 0-14.5-4-16-12Z" fill="${C.cup}" stroke="${C.cupLine}"/>
    <ellipse cx="48" cy="42" rx="32" ry="7" fill="${top}"/>${art || ''}`;
  const heart = '<path d="M48 45c-6-4-8-6-5-8s5 1 5 1 2-3 5-1-1 4-5 8Z" fill="#FBF5EC"/>';
  const glass = (layers) => {
    // слои снизу вверх: [цвет, доля]
    let y = 86, s = '';
    layers.forEach(([col, k]) => { const h = 58 * k; y -= h; s += `<rect x="31" y="${y.toFixed(1)}" width="38" height="${h.toFixed(1)}" fill="${col}"/>`; });
    return `<ellipse cx="50" cy="90" rx="26" ry="4" fill="#000" opacity=".07"/><clipPath id="gl"><path d="M30 24h40l-3 62H33Z"/></clipPath><g clip-path="url(#gl)">${s}</g><path d="M30 24h40l-3 62H33Z" fill="none" stroke="${C.glassLine}" stroke-width="1.6"/><path d="M36 30l-1.5 50" stroke="#fff" stroke-width="2.4" opacity=".6" stroke-linecap="round"/>`;
  };
  const mug = (fill, extra) => `<path d="M74 44c12 0 12 20 0 20" fill="none" stroke="${C.cupLine}" stroke-width="6" stroke-linecap="round"/>
    <rect x="22" y="34" width="54" height="52" rx="12" fill="${C.cup}" stroke="${C.cupLine}"/><ellipse cx="49" cy="36" rx="25" ry="5" fill="${fill}"/>${extra || ''}`;

  const ICONS = {
    espresso: `<ellipse cx="50" cy="80" rx="32" ry="7" fill="${C.saucer}" stroke="${C.cupLine}"/><path d="M70 56c8 0 9 10 0 12" fill="none" stroke="${C.cupLine}" stroke-width="4" stroke-linecap="round"/><path d="M28 52h44l-4 18c-1 5-5 8-10 8H42c-5 0-9-3-10-8Z" fill="${C.cup}" stroke="${C.cupLine}"/><ellipse cx="50" cy="52" rx="22" ry="5" fill="${C.crema}"/><ellipse cx="50" cy="52" rx="14" ry="3" fill="${C.esp}" opacity=".5"/>`,
    americano: cup(C.esp, `<ellipse cx="44" cy="41" rx="10" ry="2" fill="${C.crema}" opacity=".6"/>`),
    cappuccino: cup(C.foam, `<ellipse cx="48" cy="42" rx="26" ry="5" fill="${C.crema}" opacity=".35"/>${heart}`),
    flat: cup(C.crema, `<path d="M40 42c4-4 12-4 16 0" stroke="${C.foam}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M42 44c3-2 9-2 12 0" stroke="${C.foam}" stroke-width="2" fill="none" stroke-linecap="round"/>`),
    latte: glass([[C.esp, .22], [C.milk, .5], [C.foam, .18]]),
    raf: glass([['#E3CDAE', .72], [C.foam, .18]]),
    cheese: glass([[C.esp, .18], [C.milk, .42], [C.cheese, .3]]) + `<circle cx="44" cy="31" r="2" fill="#E9B94B"/><circle cx="55" cy="33" r="1.6" fill="#E9B94B"/>`,
    lavender: glass([[C.esp, .18], ['#D9CBE6', .52], [C.foam, .2]]) + `<path d="M56 18l6-10" stroke="${C.green}" stroke-width="1.4"/><ellipse cx="60" cy="11" rx="2" ry="3" fill="#A88BC9"/><ellipse cx="62" cy="8" rx="1.6" ry="2.6" fill="#A88BC9"/>`,
    iced: glass([[C.esp, .3], ['#D8C1A2', .45], ['rgba(255,255,255,.2)', .1]]) + `<rect x="38" y="44" width="11" height="11" rx="2" fill="#fff" opacity=".7" transform="rotate(12 43 49)"/><rect x="51" y="52" width="10" height="10" rx="2" fill="#fff" opacity=".6" transform="rotate(-10 56 57)"/><path d="M58 14l-4 40" stroke="${C.crema}" stroke-width="3" stroke-linecap="round"/>`,
    tea: `<ellipse cx="50" cy="90" rx="26" ry="4" fill="#000" opacity=".07"/><path d="M72 44c11 0 11 22 0 22" fill="none" stroke="${C.glassLine}" stroke-width="4"/><path d="M26 30h48l-4 54H30Z" fill="${C.tea}" opacity=".85"/><path d="M26 30h48l-4 54H30Z" fill="none" stroke="${C.glassLine}" stroke-width="1.6"/><circle cx="56" cy="40" r="9" fill="#F4D35E" stroke="#E2B53A" stroke-width="1.5"/><path d="M56 31v18M47 40h18M50 34l12 12M62 34L50 46" stroke="#E2B53A" stroke-width=".8"/><path d="M38 18l3 12" stroke="${C.green}" stroke-width="2"/><ellipse cx="36" cy="15" rx="4" ry="2.4" fill="${C.green}" transform="rotate(-30 36 15)"/>`,
    cocoa: mug(C.cocoa, `<rect x="36" y="27" width="9" height="9" rx="3" fill="#fff" stroke="#EEDFD3"/><rect x="48" y="25" width="9" height="9" rx="3" fill="#FCE4EC" stroke="#EEDFD3"/><rect x="56" y="30" width="8" height="8" rx="3" fill="#fff" stroke="#EEDFD3"/>`),
    choco: mug('#4E2A1C', `<path d="M36 36c5-3 9 3 14 0s9-3 12 0" stroke="#8A5236" stroke-width="2" fill="none"/>`),
    matcha: cup('#9DB46B', `<path d="M40 42c4-3 12-3 16 0" stroke="#E8EFD5" stroke-width="2.2" fill="none" stroke-linecap="round"/>`),
    croissant: `<ellipse cx="50" cy="80" rx="40" ry="6" fill="#000" opacity=".06"/><path d="M12 64c4-18 20-30 38-30s34 12 38 30c-6 6-14 4-18 0-4 6-12 8-20 8s-16-2-20-8c-4 4-12 6-18 0Z" fill="#E1A65B"/><path d="M28 40c4 10 6 20 4 30M50 34v36M72 40c-4 10-6 20-4 30" stroke="#B9783A" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M20 52c10-12 50-12 60 0" stroke="#F2C88A" stroke-width="2" fill="none" opacity=".7"/>`,
    sandwich: `<ellipse cx="50" cy="84" rx="38" ry="5" fill="#000" opacity=".06"/><path d="M14 78L50 22l36 56Z" fill="#E9C48D"/><path d="M18 72L50 30l32 42Z" fill="#F6E3C3"/><path d="M22 66c6-4 10 2 14-2s8 2 12-2 8 2 12-2 10 2 16 4" stroke="#7FA05A" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M24 62h52" stroke="#E79C8E" stroke-width="5" stroke-linecap="round"/><path d="M27 56h46" stroke="#F3CF62" stroke-width="5" stroke-linecap="round"/>`,
    cinnabon: `<ellipse cx="50" cy="82" rx="36" ry="6" fill="#000" opacity=".06"/><circle cx="50" cy="54" r="30" fill="#D89A5B"/><path d="M50 54m0-4a4 4 0 1 1-4 4 9 9 0 0 1 9-9 14 14 0 0 1 14 14 19 19 0 0 1-19 19 24 24 0 0 1-24-24 28 28 0 0 1 28-28" fill="none" stroke="#9C5E2C" stroke-width="3" stroke-linecap="round"/><path d="M30 42c8-10 30-12 40 2 4 6-2 10-6 6s-10 2-14-2-12 6-16 0-6 0-4-6Z" fill="#FBF5EC" opacity=".9"/>`,
    cheesecake: `<ellipse cx="50" cy="84" rx="38" ry="5" fill="#000" opacity=".06"/><path d="M14 62L80 38v34L14 80Z" fill="#F7E7C6"/><path d="M14 62L80 38l6 4-66 24Z" fill="#FBF3E2"/><path d="M14 80l66-8v6l-66 8Z" fill="#C98C4C"/><path d="M80 38l6 4v34l-6-4Z" fill="#E9D3A8"/><circle cx="66" cy="40" r="5" fill="#C9384A"/><path d="M66 35l2-4" stroke="${C.green}" stroke-width="1.6"/>`,
    cookie: `<ellipse cx="50" cy="82" rx="34" ry="5" fill="#000" opacity=".06"/><circle cx="50" cy="52" r="30" fill="#D9A465"/><g fill="#4A2C1D"><circle cx="40" cy="42" r="4"/><circle cx="58" cy="38" r="3.4"/><circle cx="62" cy="58" r="4.2"/><circle cx="42" cy="62" r="3.6"/><circle cx="52" cy="52" r="2.6"/></g>`,
    syrup: `<rect x="38" y="24" width="24" height="62" rx="6" fill="${C.crema}" opacity=".85"/><rect x="42" y="12" width="16" height="14" rx="3" fill="#3B2A20"/><rect x="38" y="44" width="24" height="18" fill="#FBF5EC"/><path d="M44 53h12" stroke="${C.crema}" stroke-width="3" stroke-linecap="round"/>`
  };
  const icon = (k) => `<svg viewBox="0 0 100 100" aria-hidden="true">${ICONS[k] || ICONS.cappuccino}</svg>`;

  const steam = (x, y, s = 1) => `<g class="steam" fill="none" stroke="currentColor" stroke-width="${3 * s}" stroke-linecap="round" opacity=".5">
    <path d="M${x - 22 * s} ${y}c-10-16 12-24 2-42s10-26 2-40"/><path d="M${x} ${y - 4}c-10-16 12-24 2-42s10-26 2-40"/><path d="M${x + 22 * s} ${y}c-10-16 12-24 2-42s10-26 2-40"/></g>`;

  const heroCup = `<svg class="cup" viewBox="0 0 400 380" aria-hidden="true" style="color:var(--ink-mute)">
    ${steam(186, 150, 1.2)}
    <ellipse cx="200" cy="350" rx="170" ry="22" fill="#000" opacity=".06"/>
    <ellipse cx="200" cy="334" rx="168" ry="34" fill="${C.saucer}" stroke="${C.cupLine}" stroke-width="2"/>
    <ellipse cx="200" cy="328" rx="110" ry="18" fill="#E8DFD3"/>
    <path d="M318 196c48 0 52 70 0 76" fill="none" stroke="${C.cupLine}" stroke-width="20" stroke-linecap="round"/>
    <path d="M318 196c48 0 52 70 0 76" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
    <path d="M60 176h272l-20 118c-6 30-30 40-60 40H140c-30 0-54-10-60-40Z" fill="#fff" stroke="${C.cupLine}" stroke-width="2"/>
    <path d="M86 196c14 70 26 110 60 124" stroke="#F1E9DE" stroke-width="10" fill="none" stroke-linecap="round"/>
    <ellipse cx="196" cy="176" rx="136" ry="26" fill="${C.crema}"/>
    <ellipse cx="196" cy="178" rx="118" ry="20" fill="#C48B55"/>
    <path d="M196 196c-30-6-62-10-62-20 0-6 18-8 30-6-14-6-16-14 2-14 10 0 20 4 26 10-6-10-2-18 10-18s12 10 4 20c8-6 18-8 26-6 12 4 4 12-8 14 10 0 22 2 22 8 0 8-28 10-50 12Z" fill="${C.foam}"/>
    <path d="M196 158v38" stroke="#C48B55" stroke-width="2.4" stroke-linecap="round"/>
    <text x="196" y="270" text-anchor="middle" font-family="Unbounded, Arial Black, sans-serif" font-size="46" font-weight="500" fill="#3B2A20">К</text>
    <g transform="translate(282 262) rotate(-8) scale(.8)"><path d="M0 70c6-26 30-44 56-44s50 18 56 44c-8 8-20 6-26 0-6 8-18 12-30 12s-24-4-30-12c-6 6-18 8-26 0Z" fill="#E1A65B"/><path d="M22 34c6 14 8 28 6 44M56 26v52M90 34c-6 14-8 28-6 44" stroke="#B9783A" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>
  </svg>`;

  const lamp = `<svg class="lamp" viewBox="0 0 160 260" aria-hidden="true">
    <path d="M80 0v120" stroke="var(--ink)" stroke-width="2"/>
    <defs><radialGradient id="glow"><stop offset="0" stop-color="#FFE3A8" stop-opacity=".9"/><stop offset="1" stop-color="#FFE3A8" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="80" cy="196" rx="76" ry="56" fill="url(#glow)"/>
    <path d="M14 196a66 76 0 0 1 132 0Z" fill="#D9B47F"/>
    <g stroke="#B88D56" stroke-width="2" fill="none">${Array.from({ length: 9 }, (_, i) => `<path d="M${22 + i * 14.5} 196C${30 + i * 12} 170 ${46 + i * 7} 140 80 120"/>`).join('')}
    <path d="M24 176c36-8 76-8 112 0M36 150c28-6 60-6 88 0M54 132c18-3 34-3 52 0"/></g>
    <path d="M14 196h132" stroke="#B88D56" stroke-width="3"/>
    <ellipse cx="80" cy="200" rx="14" ry="8" fill="#FFF1CC"/>
  </svg>`;

  const books = (x, y, w, n, seed) => {
    const cols = ['#B7743A', '#7F8F6E', '#3B2A20', '#E3C79B', '#C9573F', '#9DB3C6', '#F0E4D2', '#5D6B4E'];
    let s = '', cx = x, r = seed;
    for (let i = 0; i < n && cx < x + w - 6; i++) {
      r = (r * 9301 + 49297) % 233280; const t = r / 233280;
      const bw = 7 + t * 9, bh = 34 + t * 24, lean = i === n - 2 && t > .5;
      s += `<rect class="book" x="${cx.toFixed(1)}" y="${(y - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="1.5" fill="${cols[(i + seed) % cols.length]}"${lean ? ` transform="rotate(8 ${cx} ${y})"` : ''}/>`;
      cx += bw + 1.5;
    }
    return s;
  };

  const room = `<svg viewBox="0 0 500 400" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <rect width="500" height="400" fill="var(--paper)"/>
    <rect x="30" y="40" width="220" height="250" rx="6" fill="#DCE8EC" opacity=".8"/>
    <path d="M140 40v250M30 165h220" stroke="#fff" stroke-width="8"/>
    <rect x="30" y="40" width="220" height="250" rx="6" fill="none" stroke="#fff" stroke-width="10"/>
    <text x="85" y="120" font-family="Unbounded,sans-serif" font-size="54" fill="#fff" opacity=".8">К</text>
    <rect x="0" y="300" width="500" height="100" fill="#E7DCCD"/>
    <path d="M300 60h170M300 130h170M300 200h170M300 270h170" stroke="#fff" stroke-width="8"/>
    <path d="M300 56v218M470 56v218" stroke="#fff" stroke-width="6"/>
    ${books(310, 126, 150, 12, 3)}${books(316, 196, 140, 10, 7)}${books(312, 266, 150, 11, 11)}
    <g transform="translate(250 230)"><path d="M-30 70h60l-6 40h-48Z" fill="#C98C4C"/><g fill="#7F8F6E"><ellipse cx="-20" cy="40" rx="12" ry="32" transform="rotate(-24 -20 40)"/><ellipse cx="18" cy="36" rx="12" ry="34" transform="rotate(22 18 36)"/><ellipse cx="0" cy="26" rx="12" ry="40"/></g><g fill="#93A381"><ellipse cx="-34" cy="54" rx="9" ry="22" transform="rotate(-50 -34 54)"/><ellipse cx="34" cy="52" rx="9" ry="22" transform="rotate(48 34 52)"/></g></g>
    <path d="M70 330h200" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/><path d="M110 336v60M230 336v60" stroke="#fff" stroke-width="6"/>
    <g transform="translate(120 296) scale(.34)">${ICONS.cappuccino}</g><g transform="translate(180 300) scale(.3)">${ICONS.croissant}</g>
    <g transform="translate(150 0)"><path d="M10 0v54" stroke="#3B2A20" stroke-width="1.4"/><path d="M-16 82a26 30 0 0 1 52 0Z" fill="#D9B47F"/></g>
  </svg>`;

  const shelf = `<svg viewBox="0 0 400 400" aria-hidden="true">
    <rect width="400" height="400" fill="var(--paper)"/>
    <g stroke="#fff" stroke-width="9" fill="none" stroke-linejoin="round"><path d="M60 360V40h280v320"/><path d="M60 110h140l0 0M200 110v70h140M60 180h80v80h200M140 260v100M60 300h80"/></g>
    ${books(72, 104, 120, 10, 2)}${books(210, 174, 120, 9, 5)}${books(72, 174, 60, 5, 9)}${books(150, 254, 180, 13, 4)}${books(72, 294, 60, 5, 1)}${books(150, 354, 180, 12, 8)}
    <g transform="translate(250 60)"><path d="M0 46h40l-5 26H5Z" fill="#fff"/><g fill="#7F8F6E"><ellipse cx="10" cy="30" rx="6" ry="18" transform="rotate(-20 10 30)"/><ellipse cx="28" cy="28" rx="6" ry="20" transform="rotate(18 28 28)"/><ellipse cx="20" cy="22" rx="6" ry="22"/></g></g>
  </svg>`;

  const map = (dark) => {
    const road = dark ? '#3E3229' : 'var(--line)', bg = dark ? '#2E241E' : 'var(--paper)', txt = dark ? '#A89A8E' : 'var(--ink-mute)', blk = dark ? '#372B23' : 'color-mix(in srgb,var(--line) 60%,var(--paper))';
    return `<svg viewBox="0 0 480 360" role="img" aria-label="Схема: кофейня «К» на Московской улице, 30а, рядом с «Магнитом»" preserveAspectRatio="xMidYMid meet">
    <rect width="480" height="360" fill="${bg}"/>
    <g fill="${blk}"><rect x="40" y="40" width="130" height="90" rx="8"/><rect x="300" y="30" width="150" height="100" rx="8"/><rect x="30" y="220" width="150" height="110" rx="8"/><rect x="300" y="220" width="150" height="110" rx="8"/></g>
    <g stroke="${road}" fill="none" stroke-linecap="round"><path d="M-10 180L490 170" stroke-width="22"/><path d="M230 -10L240 370" stroke-width="12"/><path d="M190 140v-150" stroke-width="5"/></g>
    <rect x="252" y="196" width="40" height="18" rx="4" fill="${dark ? '#4A3A2E' : '#fff'}"/>
    <rect x="200" y="214" width="78" height="52" rx="6" fill="${dark ? '#5A2F2F' : '#F2D5D5'}"/><text x="239" y="245" text-anchor="middle" font-family="Onest,sans-serif" font-size="11" font-weight="600" fill="${dark ? '#E3B5B5' : '#B04545'}">Магнит</text>
    <text x="20" y="166" font-family="Onest,sans-serif" font-size="11" fill="${txt}" transform="rotate(-1 20 166)">Московская улица</text>
    <g transform="translate(390 196)"><rect x="-10" y="-10" width="20" height="20" rx="5" fill="#4F7BC4"/><path d="M-4 -4h8v8h-8z" fill="#fff"/><text x="-14" y="26" text-anchor="middle" font-family="Onest,sans-serif" font-size="9.5" fill="${txt}">ост. «Протезное</text><text x="-14" y="38" text-anchor="middle" font-family="Onest,sans-serif" font-size="9.5" fill="${txt}">предприятие»</text></g>
    <circle class="pulse" cx="300" cy="238" r="12" fill="#B7743A"/>
    <g class="pin"><path d="M300 240c-11-13-17-20-17-29a17 17 0 0 1 34 0c0 9-6 16-17 29Z" fill="#B7743A"/><text x="300" y="217" text-anchor="middle" font-family="Unbounded,sans-serif" font-size="13" fill="#fff">К</text></g>
    <rect x="322" y="246" width="96" height="26" rx="13" fill="${dark ? '#F3ECE3' : 'var(--card)'}"/><text x="370" y="263" text-anchor="middle" font-family="Onest,sans-serif" font-size="11" font-weight="600" fill="#231B16">Кофейня «К»</text>
  </svg>`;
  };

  window.Illus = { icon, heroCup, lamp, room, shelf, map, C };
})();
