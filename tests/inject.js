  // HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
  window.__results = [];
  // The app now opens on a fresh match to prepare; the suite runs on the sample match.
  state = sampleState(); ui.sheetMode = 'sheet'; $('sheet').hidden = true; $('final').hidden = true; $('home').hidden = true; commit();
  const T = (name, fn) => { try { fn(); __results.push('OK ' + name); } catch (e) { __results.push('FAIL ' + name + ': ' + (e && e.message || e) + ' ' + ((e && e.stack) || '').split('\n')[1]); } };
  const throws = (fn, re) => { try { fn(); } catch (e) { if (re.test(e.message)) return; throw new Error('wrong error ' + e.message); } throw new Error('did not throw'); };
  // Rects of the live screen at the suite's viewport (1280×800, sample match, defence), recorded before the design pass (M0b).
  const LIVE_GEOMETRY = {
    bar: { x: 16, y: 10, w: 1248, h: 73.39 },
    clock: { y: 37.39, h: 34 }, // x and width follow the display font, so they are not pinned
    court: { x: 205, y: 100.39, w: 750, h: 595.61 },
    bench: { x: 17, y: 122.19, w: 170, h: 384.98 },
    panel: { x: 972, y: 93.39, w: 292, h: 609.61 },
    'actions:btn-undo': { x: 798.44, y: 722, w: 48, h: 59 },
    'actions:btn-redo': { x: 854.44, y: 722, w: 48, h: 59 },
    'actions:btn-stop': { x: 910.44, y: 722, w: 101.7, h: 59 },
    'actions:btn-sheet': { x: 1020.14, y: 722, w: 68.12, h: 59 },
    'actions:btn-finish': { x: 1096.27, y: 722, w: 102.73, h: 59 },
    'actions:btn-theme': { x: 1207, y: 722, w: 48, h: 59 },
    'tokens:p1': { x: 539.39, y: 293.29, w: 81.22, h: 77.84 },
    'tokens:p22': { x: 282.2, y: 323.74, w: 81.22, h: 77.84 },
    'tokens:p5': { x: 370.18, y: 413.09, w: 81.22, h: 90.02 },
    'tokens:p14': { x: 478.48, y: 460.46, w: 81.22, h: 90.02 },
    'tokens:p18': { x: 600.3, y: 472.65, w: 81.22, h: 77.84 },
    'tokens:p19': { x: 708.6, y: 425.27, w: 81.22, h: 77.84 },
    'tokens:p17': { x: 796.59, y: 323.74, w: 81.22, h: 77.84 },
  };
  const LIVE_GEOMETRY_ELEMENTS = {
    bar: () => document.querySelector('.bar'), clock: () => $('clock'), court: () => $('court'), bench: () => $('bench'),
    panel: () => document.querySelector('aside[aria-label^="Portero"]'),
    ...Object.fromEntries([...document.querySelectorAll('.strip-actions .btn')].map((b) => [`actions:${b.id}`, () => b])),
    ...Object.fromEntries([...document.querySelectorAll('#tokens-layer .tok')].map((t) => [`tokens:${t.dataset.id}`, () => t])),
  };
  const GEOMETRY_TOLERANCE_PX = 0.5;
  T('design: contrastRatio matches known pairs', () => {
    const near = (a, b, tol) => Math.abs(a - b) <= tol;
    if (!near(contrastRatio('#000000', '#ffffff'), 21, 0.001)) throw new Error('black/white ' + contrastRatio('#000000', '#ffffff'));
    if (contrastRatio('#000', '#fff') !== contrastRatio('#000000', '#ffffff')) throw new Error('shorthand');
    if (!near(contrastRatio('#767676', '#ffffff'), 4.54, 0.01)) throw new Error('grey/white ' + contrastRatio('#767676', '#ffffff'));
    if (contrastRatio('#767676', '#ffffff') !== contrastRatio('#ffffff', '#767676')) throw new Error('order matters');
    if (!near(contrastRatio('#123456', '#123456'), 1, 0.001)) throw new Error('same colour');
  });
  T('design: live screen geometry unchanged', () => {
    const drift = [];
    Object.entries(LIVE_GEOMETRY).forEach(([name, want]) => {
      const el = LIVE_GEOMETRY_ELEMENTS[name] && LIVE_GEOMETRY_ELEMENTS[name]();
      if (!el) { drift.push(`${name} missing`); return; }
      const r = el.getBoundingClientRect();
      const got = { x: r.x, y: r.y, w: r.width, h: r.height };
      Object.keys(want).forEach((k) => { if (Math.abs(got[k] - want[k]) > GEOMETRY_TOLERANCE_PX) drift.push(`${name}.${k} ${got[k].toFixed(2)} vs ${want[k]}`); });
    });
    const extra = Object.keys(LIVE_GEOMETRY_ELEMENTS).filter((name) => !(name in LIVE_GEOMETRY));
    if (extra.length) drift.push('unrecorded: ' + extra.join());
    if (drift.length) throw new Error(drift.join('; '));
  });
  // ---- Design tokens (M0b) ----
  const inTheme = (theme, fn) => {
    const saved = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', theme);
    try { return fn(getComputedStyle(document.documentElement)); } finally { saved === null ? document.documentElement.removeAttribute('data-theme') : document.documentElement.setAttribute('data-theme', saved); }
  };
  const tokenValue = (css, name) => css.getPropertyValue(name).trim();
  const SEMANTIC_TOKENS = [
    ...['bg-page', 'bg-surface', 'bg-subtle', 'border', 'text', 'text-secondary', 'text-tertiary', 'accent', 'on-accent'].map((n) => `--color-${n}`),
    ...['display', 'title', 'heading', 'body', 'caption', 'kpi'].map((n) => `--type-${n}`),
    ...[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => `--space-${n}`),
    ...['sm', 'md', 'lg', 'xl', 'full'].map((n) => `--radius-${n}`),
    '--target', '--color-success', '--color-on-success', '--color-success-text', '--color-warning-text', '--color-danger-text', '--color-keeper', '--poster-tint', '--rate-tint',
    '--ring', '--ring-hover', '--photo-outline', '--dur-press', '--dur-state', '--dur-enter', '--dur-exit', '--ease-out', '--focus-ring',
    ...RATING_BANDS.flatMap((b) => [`--rating-${b}`, `--rating-ink-${b}`]),
  ];
  T('design: every semantic token resolves in both themes', () => {
    ['light', 'dark'].forEach((theme) => inTheme(theme, (css) => {
      const missing = SEMANTIC_TOKENS.filter((name) => !tokenValue(css, name));
      if (missing.length) throw new Error(`${theme}: ${missing.join()}`);
    }));
    if (RATING_BANDS.join() !== 'top,good,mid,low,bad') throw new Error('bands ' + RATING_BANDS);
  });
  T('design: semantic colours alias the existing ones', () => {
    ['light', 'dark'].forEach((theme) => inTheme(theme, (css) => {
      [['--color-bg-page', '--bg'], ['--color-bg-surface', '--surface'], ['--color-bg-subtle', '--soft'], ['--color-border', '--line'], ['--color-text', '--fg'], ['--color-text-secondary', '--muted'], ['--color-accent', '--brand'], ['--color-on-accent', '--brand-ink']]
        .forEach(([alias, base]) => { if (tokenValue(css, alias) !== tokenValue(css, base)) throw new Error(`${theme} ${alias} ${tokenValue(css, alias)} vs ${base} ${tokenValue(css, base)}`); });
    }));
  });
  T('design: tertiary text passes 4.5:1 on the surface in both themes', () => {
    ['light', 'dark'].forEach((theme) => inTheme(theme, (css) => {
      const ratio = contrastRatio(tokenValue(css, '--color-text-tertiary'), tokenValue(css, '--surface'));
      if (ratio < 4.5) throw new Error(`${theme} ${ratio.toFixed(2)}`);
    }));
  });
  T('design: rating band numerals pass 4.5:1 and fills 3:1 on the surface in both themes', () => {
    const weak = [];
    ['light', 'dark'].forEach((theme) => inTheme(theme, (css) => RATING_BANDS.forEach((band) => {
      const fill = tokenValue(css, `--rating-${band}`), ink = tokenValue(css, `--rating-ink-${band}`);
      const numerals = contrastRatio(fill, ink), edge = contrastRatio(fill, tokenValue(css, '--surface'));
      if (numerals < 4.5) weak.push(`${theme} ${band} numerals ${numerals.toFixed(2)}`);
      if (edge < 3) weak.push(`${theme} ${band} fill ${edge.toFixed(2)}`);
    })));
    if (weak.length) throw new Error(weak.join('; '));
  });
  T('design: adjacent rating bands differ in lightness', () => {
    const close = [];
    ['light', 'dark'].forEach((theme) => inTheme(theme, (css) => RATING_BANDS.slice(1).forEach((band, i) => {
      const ratio = contrastRatio(tokenValue(css, `--rating-${RATING_BANDS[i]}`), tokenValue(css, `--rating-${band}`));
      if (ratio < 1.3) close.push(`${theme} ${RATING_BANDS[i]}/${band} ${ratio.toFixed(2)}`);
    })));
    if (close.length) throw new Error(close.join('; '));
  });
  // The live screen reads these; recorded before the design pass (M0b).
  const LIVE_TOKENS = {
    light: { '--act-good': '#1f9d55', '--act-def': '#2563eb', '--act-bad': '#d4202a', '--act-rule': '#f08a1c', '--act-rival': '#7c3aed', '--gol': '#1f9d55', '--parada': '#2563eb', '--fallo': '#8a8f98', '--radius': '18px', '--tap': '56px' },
    dark: { '--act-good': '#2fbf71', '--act-def': '#4f8bff', '--act-bad': '#ef4444', '--act-rule': '#f08a1c', '--act-rival': '#9461ff', '--gol': '#2fbf71', '--parada': '#4f8bff', '--fallo': '#7d838c', '--radius': '18px', '--tap': '56px' },
  };
  T('design: live tokens keep their values', () => {
    const drift = [];
    Object.entries(LIVE_TOKENS).forEach(([theme, tokens]) => inTheme(theme, (css) => Object.entries(tokens).forEach(([name, want]) => {
      if (tokenValue(css, name) !== want) drift.push(`${theme} ${name} ${tokenValue(css, name)} vs ${want}`);
    })));
    if (drift.length) throw new Error(drift.join('; '));
  });
  T('design: type roles and the number utility apply', () => {
    const probe = document.createElement('p');
    document.body.append(probe);
    try {
      [['t-display', '36px'], ['t-title', '24px'], ['t-heading', '18px'], ['t-body', '16px'], ['t-caption', '13px']].forEach(([cls, size]) => {
        probe.className = cls;
        if (getComputedStyle(probe).fontSize !== size) throw new Error(`${cls} ${getComputedStyle(probe).fontSize}`);
      });
      probe.className = 'num';
      if (getComputedStyle(probe).fontVariantNumeric !== 'tabular-nums') throw new Error('num ' + getComputedStyle(probe).fontVariantNumeric);
    } finally { probe.remove(); }
  });
  // ---- Rings, radii, motion and focus (M0b) ----
  const withHost = (html, fn) => {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);
    try { return fn(host); } finally { host.remove(); }
  };
  // Calls visit(rule, inHover) for every style rule, nested media rules included; inHover is true inside «@media (hover: hover)».
  const walkRules = (rules, inHover, visit) => [...rules].forEach((rule) => {
    const hovering = inHover || Boolean(rule.media && /\(hover:\s*hover\)/.test(rule.media.mediaText));
    if (rule.selectorText !== undefined) visit(rule, hovering);
    if (rule.cssRules) walkRules(rule.cssRules, hovering, visit);
  });
  // The web-fonts stylesheet is cross-origin, so its rules cannot be read (and are not ours).
  const ownSheets = () => [...document.styleSheets].filter((sheet) => { try { return Boolean(sheet.cssRules); } catch (err) { return false; } });
  const outerRadius = (el) => {
    const radius = getComputedStyle(el).borderTopLeftRadius;
    return radius.endsWith('%') ? parseFloat(radius) / 100 * Math.min(el.offsetWidth, el.offsetHeight) : parseFloat(radius);
  };
  const CONCENTRIC_TOLERANCE_PX = 1;
  // The pairs that occur: team and player cards hold season KPIs and stat tiles, the squad face card holds a disc.
  T('design: nested radii are concentric', () => withHost('<section class="sheet-card"><div class="season-kpis"><div class="season-kpi">1</div></div><div class="tiles"><div class="tile">1</div></div></section><button class="face"><span class="disc">7</span></button>', (host) => {
    const off = [];
    [['.sheet-card', '.season-kpi'], ['.sheet-card', '.tile'], ['.face', '.disc']].forEach(([outerSel, innerSel]) => {
      const outer = host.querySelector(outerSel), inner = host.querySelector(innerSel), css = getComputedStyle(outer);
      const want = outerRadius(inner) + parseFloat(css.paddingTop) + parseFloat(css.borderTopWidth), got = outerRadius(outer);
      if (Math.abs(got - want) > CONCENTRIC_TOLERANCE_PX) off.push(`${outerSel} > ${innerSel}: outer ${got}px, inner + padding + border ${want}px`);
    });
    if (off.length) throw new Error(off.join('; '));
  }));
  T('design: cards outside the live screen carry the ring on a transparent border', () => withHost('<section class="sheet-card"></section>', (host) => {
    const css = getComputedStyle(host.firstChild);
    if (css.borderTopColor !== 'rgba(0, 0, 0, 0)' || css.borderTopWidth !== '1px') throw new Error(`border ${css.borderTopWidth} ${css.borderTopColor}`);
    if (css.boxShadow === 'none' || css.borderTopLeftRadius !== '24px') throw new Error(`ring ${css.boxShadow} radius ${css.borderTopLeftRadius}`);
  }));
  T('design: no transition: all and every hover is gated', () => {
    const ungated = [], everything = [];
    let gated = 0;
    ownSheets().forEach((sheet) => walkRules(sheet.cssRules, false, (rule, inHover) => {
      rule.selectorText.split(',').map((sel) => sel.trim()).filter((sel) => sel.includes(':hover') && sel !== '.rex-chip:hover .x').forEach((sel) => { if (inHover) gated += 1; else ungated.push(sel); });
      if (rule.style.transitionProperty === 'all' || /(^|[\s,])all([\s,]|$)/.test(rule.style.getPropertyValue('transition'))) everything.push(rule.selectorText);
    }));
    if (ungated.length) throw new Error('ungated hover: ' + ungated.join(' | '));
    if (everything.length) throw new Error('transition all: ' + everything.join(' | '));
    if (!gated) throw new Error('no hover rule found inside (hover: hover)');
  });
  // The real cascade: each reduced-motion media rule is forced on or off in turn, then the computed transition is read.
  const forceMotionPreference = (reduce, fn) => {
    const rules = [];
    const collect = (list) => [...list].forEach((rule) => { if (rule.media && /prefers-reduced-motion/.test(rule.media.mediaText)) rules.push([rule, rule.media.mediaText]); if (rule.cssRules) collect(rule.cssRules); });
    ownSheets().forEach((sheet) => collect(sheet.cssRules));
    rules.forEach(([rule, text]) => { rule.media.mediaText = /reduce\b/.test(text) === reduce ? 'all' : 'not all'; });
    try { return fn(); } finally { rules.forEach(([rule, text]) => { rule.media.mediaText = text; }); }
  };
  T('design: reduced motion leaves no transform transition', () => withHost('<div class="home"><button class="press" type="button">x</button></div>', (host) => {
    const press = host.querySelector('.press');
    const read = (reduce) => forceMotionPreference(reduce, () => { const css = getComputedStyle(press); return [css.transitionProperty, css.transitionDuration]; });
    const [reducedProperty, reducedDuration] = read(true), [movingProperty, movingDuration] = read(false);
    if (reducedDuration !== '0s') throw new Error(`reduced: ${reducedProperty} ${reducedDuration}`);
    if (movingProperty !== 'transform' || movingDuration !== '0.15s') throw new Error(`no-preference: ${movingProperty} ${movingDuration}`);
  }));
  T('design: photos get a neutral outline outside the live screen only', () => {
    const bench = document.createElement('div');
    bench.className = 'bench-player';
    document.body.append(bench);
    try {
      ['home', 'sheet', 'final'].forEach((id) => {
        const host = $(id), disc = document.createElement('span');
        disc.className = 'disc photo';
        host.append(disc);
        try {
          const css = getComputedStyle(disc);
          if (css.outlineStyle !== 'solid' || css.outlineWidth !== '1px' || css.outlineOffset !== '-1px') throw new Error(`#${id}: ${css.outlineStyle} ${css.outlineWidth} offset ${css.outlineOffset}`);
          if (inTheme('light', () => css.outlineColor) !== 'rgba(0, 0, 0, 0.1)') throw new Error(`#${id}: colour ${css.outlineColor}`);
        } finally { disc.remove(); }
      });
      const benchDisc = document.createElement('span');
      benchDisc.className = 'disc photo';
      bench.append(benchDisc);
      if (getComputedStyle(benchDisc).outlineStyle !== 'none') throw new Error('bench disc outlined');
    } finally { bench.remove(); }
  });
  T('design: the focus ring on chips stays off the live screen', () => {
    const leaks = [];
    ownSheets().forEach((sheet) => walkRules(sheet.cssRules, false, (rule) => rule.selectorText.split(',').map((sel) => sel.trim())
      .filter((sel) => sel.includes('.chip:focus-visible') && !/^(\.home|#sheet|#final) /.test(sel)).forEach((sel) => leaks.push(sel))));
    if (leaks.length) throw new Error('unscoped: ' + leaks.join(' | '));
  });
  T('design: focus ring covers links, fields, summaries and chips', () => {
    const wanted = ['a:focus-visible', 'input:focus-visible', 'select:focus-visible', 'summary:focus-visible', '[tabindex]:focus-visible', '.home .chip:focus-visible'];
    let ring = '';
    ownSheets().forEach((sheet) => walkRules(sheet.cssRules, false, (rule) => { if (rule.style.getPropertyValue('outline') === 'var(--focus-ring)') ring += rule.selectorText + ','; }));
    const missing = wanted.filter((selector) => !ring.includes(selector));
    if (missing.length) throw new Error('no focus ring on ' + missing.join());
  });
  // ---- Pages outside the live screen: contrast of what the probe cannot see (M0b.4) ----
  const rgbOf = (css) => {
    const swatch = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    swatch.fillStyle = css; swatch.fillRect(0, 0, 1, 1);
    return [...swatch.getImageData(0, 0, 1, 1).data].slice(0, 3);
  };
  const hexOfRgb = (rgb) => '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');
  const hexMix = (top, under, share) => hexOfRgb(rgbOf(top).map((c, i) => Math.round(c * share + rgbOf(under)[i] * (1 - share))));
  T('design: success, warning and danger text pass 4.5:1 on the surface and the subtle fill, in both themes', () => {
    const weak = [];
    ['light', 'dark'].forEach((theme) => inTheme(theme, (css) => ['success', 'warning', 'danger'].forEach((kind) => {
      const ratio = contrastRatio(tokenValue(css, `--color-${kind}-text`), tokenValue(css, '--surface'));
      if (ratio < 4.5) weak.push(`${theme} ${kind} ${ratio.toFixed(2)}`);
    })));
    ['light', 'dark'].forEach((theme) => inTheme(theme, (css) => {
      const numerals = contrastRatio(tokenValue(css, '--color-success'), tokenValue(css, '--color-on-success'));
      if (numerals < 4.5) weak.push(`${theme} success button ${numerals.toFixed(2)}`);
    }));
    if (weak.length) throw new Error(weak.join('; '));
  });
  T('design: position colours keep dorsals readable and rings visible on the pages', () => withHost('<div class="home"><i></i></div>', (host) => {
    const weak = [];
    ['light', 'dark'].forEach((theme) => inTheme(theme, () => {
      const css = getComputedStyle(host.firstChild.firstChild), surface = css.getPropertyValue('--surface').trim();
      Object.entries(CONFIG.positions).forEach(([key, { color, darkText }]) => {
        const fill = css.getPropertyValue(color.slice(4, -1)).trim(), ink = darkText ? '#151515' : '#ffffff';
        const dorsal = contrastRatio(fill, ink), ring = contrastRatio(fill, surface);
        if (dorsal < 4.5) weak.push(`${theme} ${key} dorsal ${dorsal.toFixed(2)}`);
        if (ring < 3) weak.push(`${theme} ${key} ring ${ring.toFixed(2)}`);
      });
    }));
    if (weak.length) throw new Error(weak.join('; '));
  }));
  T('design: poster text passes 4.5:1 on the gradient\'s worst region, for every position in both themes', () => withHost('<div class="home"><section class="sheet-card poster"></section></div>', (host) => {
    const weak = [];
    ['light', 'dark'].forEach((theme) => inTheme(theme, () => {
      const css = getComputedStyle(host.querySelector('.poster')), tint = parseFloat(css.getPropertyValue('--poster-tint')) / 100;
      Object.entries(CONFIG.positions).forEach(([key, { color }]) => {
        const worst = hexMix(css.getPropertyValue(color.slice(4, -1)).trim(), css.getPropertyValue('--surface').trim(), tint);
        ['--fg', '--muted'].forEach((ink) => {
          const ratio = contrastRatio(css.getPropertyValue(ink).trim(), worst);
          if (ratio < 4.5) weak.push(`${theme} ${key} ${ink} ${ratio.toFixed(2)}`);
        });
      });
    }));
    if (weak.length) throw new Error(weak.join('; '));
  }));
  T('design: rate tiles keep their text at 4.5:1 across the whole scale, in both themes', () => withHost('<div class="home"></div>', (host) => {
    const weak = [];
    ['light', 'dark'].forEach((theme) => inTheme(theme, () => {
      [0, 0.25, 0.5, 0.75, 1].forEach((fraction) => {
        host.firstChild.innerHTML = `<div class="rate-tile" style="--rate:${rateColour(fraction)}"><b>1</b><span>x</span></div>`;
        const css = getComputedStyle(host.firstChild.firstChild);
        const ratio = contrastRatio(hexOfRgb(rgbOf(css.color)), hexOfRgb(rgbOf(css.backgroundColor)));
        if (ratio < 4.5) weak.push(`${theme} ${fraction} ${ratio.toFixed(2)}`);
      });
    }));
    if (weak.length) throw new Error(weak.join('; '));
  }));
  T('render all tabs', () => { Object.keys(SHEET_TABS).forEach((t) => { ui.sheetTab = t; renderSheet(); }); ui.sheetGk = state.gkId; ui.sheetTab = 'gk'; renderSheet(); ui.sheetGk = null; });
  T('score pop', () => { openScorePop({ x: 100, y: 100 }); closePop(); });
  T('score fix +1 and undo', () => { const b = score().us; addEvent('SCORE_FIX', { team: 'us', delta: 1 }); if (score().us !== b + 1) throw new Error('no +1'); undo(); if (score().us !== b) throw new Error('undo'); });
  T('rival 2m: card then dorsal, chip shows the dorsal', () => { $('btn-rival-2m').click(); if (ui.popView.type !== 'rivalSanction' || ui.popView.card !== '2M') throw new Error('no pop'); if (document.querySelector('[data-card="2M"]').getAttribute('aria-pressed') !== 'true') throw new Error('2 min not preselected'); const r = sortedRivals()[0]; document.querySelector(`[data-rival-sanction="${r.id}"]`).click(); const e = state.events.at(-1); if (e.kind !== 'RIVAL_SANCTION' || e.card !== '2M' || e.rivalId !== r.id) throw new Error(JSON.stringify(e)); if (activeRivalExclusions().length !== 1) throw new Error('no rex'); if (!$('rex').textContent.includes(`#${r.num}`)) throw new Error('chip ' + $('rex').innerHTML); if (!$('rex').textContent.includes('×')) throw new Error('strength'); });
  T('clock down', () => { state.clockDown = true; renderClock(); const t = $('clock').textContent; if (t !== mmss(CONFIG.halfSeconds - periodSeconds())) throw new Error(t); state.clockDown = false; renderClock(); });
  T('clock pop mode', () => { openClockPop({ x: 100, y: 100 }); const b = document.querySelector('[data-clock-mode="down"]'); b.click(); if (!state.clockDown) throw new Error('mode'); if (!$('period').textContent.includes('↓')) throw new Error('arrow'); document.querySelector('[data-clock-mode="up"]').click(); closePop(); });
  T('clock pop offers ±1, 5 and 10 s that add up', () => { const saved = state.clock; state.clock = { period: 1, elapsedMs: 60000, runningSince: null }; try { openClockPop({ x: 100, y: 100 }); const btns = [...document.querySelectorAll('[data-adjust]')]; const labels = btns.map((b) => b.textContent).join(' '); if (labels !== '−10s −5s −1s +1s +5s +10s') throw new Error(labels); ['10', '5', '1'].forEach((s) => document.querySelector(`[data-adjust="${s}"]`).click()); if (state.clock.elapsedMs !== 76000) throw new Error('elapsed ' + state.clock.elapsedMs); } finally { closePop(); state.clock = saved; commit(); } });
  T('frame detection', () => { if (!onGoalFrame({ x: 322, y: 150 })) throw new Error('post'); if (!onGoalFrame({ x: 500, y: 25 })) throw new Error('bar'); if (onGoalFrame({ x: 500, y: 150 })) throw new Error('face'); if (onGoalFrame({ x: 200, y: 150 })) throw new Error('outside'); });
  T('goal cell', () => { const c = goalCell({ x: 330, y: 30 }); const d = goalCell({ x: 670, y: 250 }); if (c.join() !== '0,0' || d.join() !== '2,2') throw new Error(c + ' ' + d); });
  T('zones by distance: 6 m, 9 m on the dashed line, +11 m', () => { const cases = [[m(0, 7), '6M'], [m(0, 8.6), '6M'], [m(0, 8.8), '9M'], [m(0, 10.9), '9M'], [m(0, 11.2), '11M'], [m(-6, 8), '9M']]; cases.forEach(([pt, z]) => { if (zoneFrom(pt) !== z) throw new Error(`${JSON.stringify(pt)} → ${zoneFrom(pt)}, expected ${z}`); }); });
  T('court reaches 11.8 m and draws the +11 m line', () => { if (COURT.maxY !== 850) throw new Error('maxY ' + COURT.maxY); if ($('court').viewBox.baseVal.height !== COURT_VIEW_H) throw new Error('viewBox ' + $('court').viewBox.baseVal.height); if (!$('court-floor').textContent.includes('+11 m')) throw new Error('no +11 m label'); });
  T('11M shots count in zone tables', () => { try { addEvent('SHOT', { playerId: 'p8', origin: m(0, 11.5), target: { x: 500, y: 120 }, from: '11M', zone: '11M', result: 'GOL' }); const z = liveStats().us.zones.find((x) => x.id === '11M'); if (!z || z.att < 1) throw new Error('live zone'); if (!playerStats('p8').shots['11M']) throw new Error('player stats'); if (!shotZoneRows(ourShots()).some((r) => r[0] === '+11 m' && r[1] >= 1)) throw new Error('zone rows'); } finally { undo(); } });
  T('old 7M events still count', () => { addEvent('SHOT', { playerId: 'p8', origin: m(0, 7), target: { x: 500, y: 120 }, from: '7M', zone: '7M', result: 'GOL' }); const z = liveStats().us.zones.find((x) => x.id === '7M'); if (!z || z.att < 1) throw new Error('7M lost'); undo(); });
  T('highlight', () => { highlightGoal({ x: 500, y: 150 }); if ($('goal-sector').getAttribute('visibility') !== 'visible') throw new Error('sector'); highlightGoal({ x: 321, y: 150 }); if ($('goal-frame-hot').getAttribute('visibility') !== 'visible' || $('goal-sector').getAttribute('visibility') !== 'hidden') throw new Error('frame'); highlightGoal(null); if ($('goal-face').classList.contains('hot')) throw new Error('reset'); });
  T('drop on post = Palo', () => { const savedRivals = state.rivals; state.rivals = []; const n = state.events.length; openShotPop({ type: 'rivalShot', origin: m(0, 8), target: { x: 680, y: 120 } }, { x: 10, y: 10 }); const e = state.events[state.events.length - 1]; if (state.events.length !== n + 1 || e.result !== 'PALO') throw new Error('not palo'); undo(); state.rivals = savedRivals; });
  T('rival popup offers only Gol and Parada', () => { const saved = state.rivals; try { [saved, []].forEach((rivals) => { state.rivals = rivals; openShotPop({ type: 'rivalShot', origin: m(0, 8), target: { x: 500, y: 120 } }, { x: 10, y: 10 }); const results = [...document.querySelectorAll('[data-result]')].map((b) => b.dataset.result).join(); closePop(); if (results !== 'GOL,PARADA') throw new Error(rivals.length + ' rivals: ' + results); }); } finally { state.rivals = saved; } });
  T('our shot popup offers only Gol and Parada', () => { setPhase('ATK'); openShotPop({ type: 'ourShot', playerId: 'p8', origin: m(0, 8), target: { x: 500, y: 120 } }, { x: 10, y: 10 }); const results = [...document.querySelectorAll('[data-result]')].map((b) => b.dataset.result).join(); closePop(); if (results !== 'GOL,PARADA') throw new Error(results); });
  T('sanction cards', () => { openPlayerPop('p8', { x: 10, y: 10 }); const n = document.querySelectorAll('.card-btn').length; closePop(); if (n !== 4) throw new Error('cards ' + n); });
  T('blue card counts', () => { addEvent('SANCTION', { playerId: 'p8', card: 'AZ' }); if (playerStats('p8').AZ !== 1) throw new Error('AZ'); undo(); });
  T('parseRoster valid', () => { const r = parseRoster(JSON.stringify({ format: 'hbstats-plantilla', version: 1, team: 'X', players: [{ num: 1, name: 'A', pos: 'POR' }, { num: 2, name: 'B', pos: 'LAT' }] })); if (r.players.length !== 2 || r.team !== 'X') throw new Error('bad'); });
  T('parseRoster duplicate', () => throws(() => parseRoster(JSON.stringify({ format: 'hbstats-plantilla', players: [{ num: 1, name: 'A', pos: 'POR' }, { num: 1, name: 'B', pos: 'LAT' }] })), /repetido/));
  T('parseRoster no gk', () => throws(() => parseRoster(JSON.stringify({ format: 'hbstats-plantilla', players: [{ num: 2, name: 'B', pos: 'LAT' }] })), /portero/));
  T('parseRoster reads the card name and photo, refuses a photo that is not an image', () => { const png = 'data:image/png;base64,iVBORw0KGgo='; const r = parseRoster(JSON.stringify({ format: 'hbstats-plantilla', players: [{ num: 1, name: 'A', pos: 'POR', fullName: '  Ana Ruiz Gómez ', photo: png }, { num: 2, name: 'B', pos: 'LAT' }] })); if (r.players[0].fullName !== 'Ana Ruiz Gómez' || r.players[0].photo !== png || 'photo' in r.players[1] || 'fullName' in r.players[1]) throw new Error(JSON.stringify(r.players)); throws(() => parseRoster(JSON.stringify({ format: 'hbstats-plantilla', players: [{ num: 1, name: 'A', pos: 'POR', photo: 'javascript:alert(1)' }] })), /foto/); throws(() => parseRoster(JSON.stringify({ format: 'hbstats-plantilla', players: [{ num: 1, name: 'A', pos: 'POR', photo: 'data:image/png;base64,' + 'A'.repeat(MAX_PHOTO_LENGTH) }] })), /foto/); });
  T('parseRoster bad json', () => throws(() => parseRoster('{nope'), /JSON/));
  T('parseRoster bad pos', () => throws(() => parseRoster(JSON.stringify({ format: 'hbstats-plantilla', players: [{ num: 1, name: 'A', pos: 'XX' }] })), /puesto/));
  T('dorsal duplicate refused', () => { ui.sheetTab = 'acta'; renderSheet(); const p = state.players[2]; const before = p.num; setDorsal(p, String(state.players[3].num)); if (p.num !== before) throw new Error('changed'); if (!$('roster-status').textContent.includes('ya está')) throw new Error('msg'); });
  T('dorsal out of range refused', () => { const p = state.players[2]; const before = p.num; setDorsal(p, '150'); if (p.num !== before) throw new Error('changed'); });
  T('full roster refuses add', () => { if (state.players.length !== MAX_ROSTER) throw new Error('sample not full'); addPlayer(); if (state.players.length !== MAX_ROSTER) throw new Error('added past max'); });
  T('add/remove player', () => { const free = state.players.find((p) => !rosterLock(p) && p.pos !== 'POR'); removePlayer(free); const n = state.players.length; if (n !== MAX_ROSTER - 1) throw new Error('remove free'); addPlayer(); if (state.players.length !== n + 1) throw new Error('add'); removePlayer(state.players.at(-1)); if (state.players.length !== n) throw new Error('remove'); });
  T('player with events locked', () => { const n = state.players.length; removePlayer(playerById('p8')); if (state.players.length !== n) throw new Error('removed'); });
  T('gk position lock', () => { const gk = playerById(state.gkId); setPosition(gk, 'LAT'); if (gk.pos !== 'POR') throw new Error('changed'); });
  T('to POR leaves lineups', () => { setPosition(playerById('p22'), 'POR'); if (state.lineups.ATK.p22 || state.lineups.DEF.p22) throw new Error('still on court'); setPosition(playerById('p22'), 'EXT'); });
  T('team name', () => { setTeamName('them', '  BM Sur  '); if (state.them !== 'BM Sur') throw new Error(state.them); setTeamName('them', '   '); if (state.them !== 'BM Sur') throw new Error('emptied'); });
  const courtShot = (target) => { const r = $('court').getBoundingClientRect(); const ctm = $('court').getScreenCTM(); const toClient = (pt) => { const q = $('court').createSVGPoint(); q.x = pt.x; q.y = pt.y; return q.matrixTransform(ctm); }; const a = toClient(m(0, 8)), b = toClient(target); const ev = (type, c) => $('court').dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: c.x, clientY: c.y, pointerId: 7, pointerType: 'pen' })); ev('pointerdown', a); ev('pointermove', b); ev('pointerup', b); };
  T('attack empty-court shot is ours with the zone shooter preselected', () => { setPhase('ATK'); disarm(); const last = zoneShooterId(m(0, 8)); if (last !== 'p19') throw new Error('central shot should preselect the centre back, got ' + last); courtShot({ x: 500, y: 120 }); const v = ui.popView; if (!v || v.type !== 'ourShot' || v.playerId !== last) throw new Error('view ' + JSON.stringify(v && { t: v.type, p: v.playerId })); if (!$('pop').classList.contains('wide')) throw new Error('not wide'); const pressed = document.querySelector('[data-pick][aria-pressed="true"]'); if (!pressed || pressed.dataset.pick !== last) throw new Error('preselect'); const n = state.events.length; document.querySelector('[data-result="GOL"]').click(); const e = state.events.at(-1); if (state.events.length !== n + 1 || e.kind !== 'SHOT' || e.playerId !== last) throw new Error('commit'); undo(); setPhase('ATK'); });
  T('attack picker: court first, bench second, switch shooter', () => { disarm(); courtShot({ x: 500, y: 120 }); const cols = document.querySelectorAll('.picker > div'); const court = [...cols[0].querySelectorAll('[data-pick]')].map((b) => b.dataset.pick); const bench = [...cols[1].querySelectorAll('[data-pick]')].map((b) => b.dataset.pick); const onCourt = Object.keys(state.lineups.ATK).filter((id) => !ourOffCourt().has(id)); if (court.length !== onCourt.length || !court.every((id) => onCourt.includes(id))) throw new Error('court col'); if (bench.some((id) => onCourt.includes(id) || playerById(id).pos === 'POR')) throw new Error('bench col'); document.querySelector(`[data-pick="${bench[0]}"]`).click(); if (ui.popView.playerId !== bench[0]) throw new Error('switch'); document.querySelector('[data-result="PARADA"]').click(); const e = state.events.at(-1); if (e.playerId !== bench[0] || e.result !== 'PARADA') throw new Error('commit'); undo(); setPhase('ATK'); });
  T('attack outside goal asks who, one tap commits Fuera', () => { disarm(); const n = state.events.length; courtShot({ x: 150, y: 120 }); if (state.events.length !== n) throw new Error('committed without shooter'); if (ui.popView.preset !== 'FUERA') throw new Error('preset'); const id = Object.keys(state.lineups.ATK)[0]; document.querySelector(`[data-pick="${id}"]`).click(); const e = state.events.at(-1); if (e.kind !== 'SHOT' || e.result !== 'FUERA' || e.playerId !== id || !$('pop').hidden) throw new Error('fuera'); undo(); setPhase('ATK'); });
  T('attack with nobody on court to preselect: results disabled until pick', () => { const saved = state.lineups.ATK; state.lineups.ATK = {}; try { disarm(); courtShot({ x: 500, y: 120 }); if (!document.querySelector('[data-result="GOL"]').disabled) throw new Error('enabled'); } finally { closePop(); state.lineups.ATK = saved; commit(); } });
  T('armed shooter skips picker', () => { const id = Object.keys(state.lineups.ATK)[1]; armShooter(id); courtShot({ x: 150, y: 120 }); const e = state.events.at(-1); if (e.result !== 'FUERA' || e.playerId !== id) throw new Error('armed'); undo(); setPhase('ATK'); });
  T('defence empty-court shot stays rival', () => { setPhase('DEF'); courtShot({ x: 500, y: 120 }); if (ui.popView.type !== 'rivalShot') throw new Error('not rival'); closePop(); });
  T('our 2 min button picks a player and sanctions', () => { setPhase('DEF'); $('btn-us-2m').click(); if (ui.popView.type !== 'sanctionPick') throw new Error('no picker'); const ids = [...document.querySelectorAll('.picker > div')[0].querySelectorAll('[data-pick]')].map((b) => b.dataset.pick); if (!ids.includes(state.gkId)) throw new Error('gk missing on court'); const id = Object.keys(state.lineups.DEF)[0]; const before = playerStats(id)['2M']; document.querySelector(`[data-pick="${id}"]`).click(); if (playerStats(id)['2M'] !== before + 1 || !$('pop').hidden) throw new Error('not sanctioned'); undo(); });
  T('rival timeouts counted and capped', () => { state.timeoutsUsedThem = 0; for (let i = 0; i < CONFIG.timeoutsPerTeam + 1; i++) $('btn-tm-them').click(); if (state.timeoutsUsedThem !== CONFIG.timeoutsPerTeam) throw new Error('count ' + state.timeoutsUsedThem); if ($('tm-dots-them').querySelectorAll('.used').length !== CONFIG.timeoutsPerTeam) throw new Error('dots'); state.timeoutsUsedThem = 0; state.timeout = null; state.alerts = []; commit(); });
  T('score and clock centred, team controls on their side', () => { const bar = document.querySelector('.bar').getBoundingClientRect(); const c = document.querySelector('.center').getBoundingClientRect(); const off = Math.abs((c.left + c.right) / 2 - (bar.left + bar.right) / 2); if (off > 2) throw new Error('off centre ' + off); const mid = (bar.left + bar.right) / 2; if ($('btn-tm-us').getBoundingClientRect().right > mid || $('btn-us-2m').getBoundingClientRect().right > c.left) throw new Error('ours not left'); if ($('btn-tm-them').getBoundingClientRect().left < c.right || $('btn-rival-2m').getBoundingClientRect().left < c.right) throw new Error('rival not right'); });
  const onCourtDef = () => Object.keys(state.lineups.DEF).find((id) => !isDisqualified(id));
  T('red card: 2 min short-handed, off both lineups, locked on bench', () => { setPhase('DEF'); const id = onCourtDef(); const inAtk = Boolean(state.lineups.ATK[id]); const exBefore = activeExclusions().length; addSanction(id, 'D'); if (activeExclusions().length !== exBefore + 1) throw new Error('no 2 min'); if (state.lineups.DEF[id] || state.lineups.ATK[id]) throw new Error('still on court'); if (!state.alerts.some((a) => a.kind === 'desc' && a.title.includes('Descalificado'))) throw new Error('no alert'); if (!document.querySelector(`.bench-player.out[data-id="${id}"]`)) throw new Error('bench not locked'); if (playerStats(id)['2M'] !== 0 && !inAtk) throw new Error('2M stat changed'); undo(); if (isDisqualified(id)) throw new Error('undo'); });
  T('blue after red: one 2 min only', () => { const id = onCourtDef(); const exBefore = activeExclusions().length; addSanction(id, 'D'); addSanction(id, 'AZ'); if (activeExclusions().length !== exBefore + 1) throw new Error('double timer ' + (activeExclusions().length - exBefore)); undo(); undo(); });
  T('blue card alone disqualifies', () => { const id = onCourtDef(); addSanction(id, 'AZ'); if (!isDisqualified(id) || state.lineups.DEF[id]) throw new Error('not out'); undo(); });
  T('third 2 min disqualifies, no extra timer', () => { const snap = JSON.stringify(state); const id = onCourtDef(); const before = playerStats(id)['2M']; for (let i = before; i < CONFIG.exclusionsToDisqualify; i++) { state.clock.elapsedMs += CONFIG.exclusionSeconds * 1000; addSanction(id, '2M'); } if (!isDisqualified(id)) throw new Error('not out'); if (!runningExclusionOf('SANCTION', id)) throw new Error('no timer'); if (exclusionEvents().filter((e) => e.playerId === id).length !== CONFIG.exclusionsToDisqualify) throw new Error('timers'); state = JSON.parse(snap); commit(); });
  T('disqualified excluded from shot picker', () => { const id = onCourtDef(); addSanction(id, 'D'); setPhase('ATK'); openShotPop({ type: 'ourShot', playerId: null, pick: true, origin: m(0, 8), target: { x: 500, y: 120 } }, { x: 10, y: 10 }); if (document.querySelector(`[data-pick="${id}"]`)) throw new Error('listed'); closePop(); undo(); setPhase('DEF'); });
  T('red card to goalkeeper switches to spare', () => { const gk = state.gkId; addSanction(gk, 'D'); if (state.gkId === gk) throw new Error('same gk'); undo(); state.gkId = gk; commit(); });
  T('map colours: our GK red/blue/grey, theirs green/blue/grey', () => { const g = MAP_VIEWS.GK.colors, u = MAP_VIEWS.US.colors; if (g.GOL !== 'var(--red)' || g.PARADA !== 'var(--parada)' || g.FALLO !== 'var(--fallo)') throw new Error('GK'); if (u.GOL !== 'var(--gol)' || u.PARADA !== 'var(--parada)' || u.FALLO !== 'var(--fallo)') throw new Error('US'); });
  T('team selector: same layout for both teams', () => { const labels = () => [...$('live').querySelectorAll('.kpi span, .fact span, .zone b')].map((e) => e.textContent).join('|'); document.querySelector('#team-seg [data-source="US"]').click(); const a = labels(); const usShots = $('live').querySelector('.kpi small').textContent; document.querySelector('#team-seg [data-source="GK"]').click(); const b = labels(); if (a !== b) throw new Error(a + ' vs ' + b); const s = liveStats(); if (s.them.shots !== rivalShots().length || s.us.shots !== ourShots().length) throw new Error('counts'); if (!usShots.endsWith('/' + s.us.shots)) throw new Error('us kpi ' + usShots); });
  T('rival ratings read from our side', () => { if (rateSide(90, 'shooting', false) !== 'r-bad' || rateSide(90, 'shooting', true) !== 'r-good') throw new Error('invert'); });
  T('rival 2 min split from rival side', () => { const s = liveStats(); const [ug, tg] = s.us.superiority.split('–'); const [tg2, ug2] = s.them.inferiority.split('–'); if (ug !== ug2 || tg !== tg2) throw new Error(s.us.superiority + ' ' + s.them.inferiority); });
  T('no 5 min popups; 5 min score derived from goals', () => { checkTimers(); if (state.alerts.some((a) => a.kind === 'checkpoint')) throw new Error('popup'); const rows = scoreCheckRows(); if (rows.length !== Math.floor(absSeconds() / 300)) throw new Error('rows ' + rows.length); const until = 300; const s5 = score(state.events.filter((e) => e.abs <= until)); if (rows[0][1] !== `${s5.us}–${s5.them}`) throw new Error(rows[0][1]); });
  const rivalDraw = (target) => openShotPop({ type: 'rivalShot', origin: m(0, 8), target }, { x: 10, y: 10 });
  T('rival shot popup offers dorsals; pick is stored', () => { setPhase('DEF'); rivalDraw({ x: 500, y: 120 }); const chips = document.querySelectorAll('[data-rival]'); if (chips.length !== state.rivals.length - rivalOffCourt().size) throw new Error('chips ' + chips.length); const r = sortedRivals().filter((x) => !rivalOffCourt().has(x.id))[1]; document.querySelector(`[data-rival="${r.id}"]`).click(); if (ui.popView.rivalId !== r.id) throw new Error('select'); document.querySelector(`[data-rival="${r.id}"]`).click(); if (ui.popView.rivalId) throw new Error('toggle off'); document.querySelector(`[data-rival="${r.id}"]`).click(); document.querySelector('[data-result="GOL"]').click(); const e = state.events.at(-1); if (e.kind !== 'RIVAL_SHOT' || e.rivalId !== r.id) throw new Error('stored'); if (!describe(e).includes(rivalLabel(r))) throw new Error(describe(e)); undo(); setPhase('DEF'); });
  T('rival shot without dorsal still works', () => { rivalDraw({ x: 500, y: 120 }); document.querySelector('[data-result="PARADA"]').click(); if (state.events.at(-1).rivalId !== null) throw new Error('not null'); undo(); setPhase('DEF'); });
  T('rival miss with roster asks who; Sin dorsal commits', () => { const n = state.events.length; rivalDraw({ x: 150, y: 120 }); if (state.events.length !== n || ui.popView.preset !== 'FUERA') throw new Error('no ask'); document.querySelector('[data-rival=""]').click(); const e = state.events.at(-1); if (e.result !== 'FUERA' || e.rivalId !== null) throw new Error('commit'); undo(); setPhase('DEF'); rivalDraw({ x: 150, y: 120 }); const r = sortedRivals().find((x) => !rivalOffCourt().has(x.id)); document.querySelector(`[data-rival="${r.id}"]`).click(); if (state.events.at(-1).rivalId !== r.id) throw new Error('chip commit'); undo(); setPhase('DEF'); });
  T('rival miss without roster is direct', () => { const saved = state.rivals; state.rivals = []; const n = state.events.length; rivalDraw({ x: 150, y: 120 }); if (state.events.length !== n + 1) throw new Error('asked'); undo(); state.rivals = saved; setPhase('DEF'); });
  T('add rival dorsals with skips', () => { const saved = state.rivals; state.rivals = []; ui.sheetTab = 'acta'; renderSheet(); addRivalDorsals('3 5, 5 120'); const nums = state.rivals.map((r) => r.num).join(); if (nums !== '3,5') throw new Error(nums); const msg = $('rival-status').textContent; if (!msg.includes('5:') || !msg.includes('120:')) throw new Error(msg); state.rivals = saved; commit(); });
  T('add a rival dorsal with name and position in one go', () => { const snap = JSON.stringify(state); try { state.rivals = []; ui.sheetTab = 'acta'; renderSheet(); $('sheet').hidden = false; $('rival-dorsals').value = '7'; $('rival-new-name').value = ' Pérez '; document.querySelector('[data-rival-new-pos="new:LAT"]').click(); if (document.querySelector('[data-rival-new-pos="new:LAT"]').getAttribute('aria-pressed') !== 'true' || $('rival-dorsals').value !== '7') throw new Error('pick lost the typing'); document.querySelector('[data-rival-add]').click(); const r = state.rivals[0]; if (state.rivals.length !== 1 || r.num !== 7 || r.name !== 'Pérez' || r.pos !== 'LAT') throw new Error(JSON.stringify(state.rivals)); if (ui.rivalNewPos !== null || $('rival-new-name').value !== '' || document.activeElement !== $('rival-dorsals')) throw new Error('form not reset'); $('rival-dorsals').value = '9'; $('rival-dorsals').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); if (state.rivals.length !== 2 || state.rivals[1].name !== '' || state.rivals[1].pos !== null) throw new Error('plain add'); $('rival-dorsals').value = '4 5'; $('rival-new-name').value = 'Lolo'; document.querySelector('[data-rival-add]').click(); if (state.rivals.length !== 2 || !$('rival-status').textContent.includes('uno en uno')) throw new Error('several with a name'); } finally { state = JSON.parse(snap); $('sheet').hidden = true; commit(); } });
  T('rival dorsal duplicate refused, name optional', () => { ui.sheetTab = 'acta'; renderSheet(); const [a, b] = sortedRivals(); setRivalDorsal(a, String(b.num)); if (a.num === b.num) throw new Error('dup'); setRivalName(a, '  '); if (a.name !== '') throw new Error('name'); });
  T('rival with shots locked', () => { const r = rivalById(rivalShots()[0].rivalId); const n = state.rivals.length; removeRival(r); if (state.rivals.length !== n) throw new Error('removed'); });
  T('parseRoster rival: dorsals only', () => { const r = parseRoster(JSON.stringify({ format: 'hbstats-plantilla', team: 'BM Sur', players: [{ num: 4 }, { num: 7, name: 'Pérez' }] }), 'them'); if (r.players.length !== 2 || r.team !== 'BM Sur' || r.players[1].name !== 'Pérez' || r.players[0].pos) throw new Error('bad'); throws(() => parseRoster(JSON.stringify({ format: 'hbstats-plantilla', players: [{ num: 4 }, { num: 4 }] }), 'them'), /repetido/); });
  T('goal shooters table with Sin dorsal row last', () => { addEvent('RIVAL_SHOT', { gkId: state.gkId, rivalId: null, origin: m(0, 8), target: { x: 500, y: 120 }, zone: '9M', result: 'GOL', contra: false }); const rows = goalShooterRows(rivalShots(), 'GK'); if (rows.at(-1)[1] !== 'Sin dorsal') throw new Error('no unknown row'); const total = rows.reduce((t, r) => t + r[2], 0); if (total !== rivalShots().length) throw new Error('total'); undo(); ui.sheetTab = 'gk'; renderSheet(); if (!$('sheet').textContent.includes('Lanzadores de')) throw new Error('sheet'); });
  T('shooter ranking: most goals first, then shots, unknown last', () => { addEvent('RIVAL_SHOT', { gkId: state.gkId, rivalId: null, origin: m(0, 8), target: { x: 500, y: 120 }, zone: '9M', result: 'GOL', contra: false }); addEvent('RIVAL_SHOT', { gkId: state.gkId, rivalId: null, origin: m(0, 8), target: { x: 500, y: 120 }, zone: '9M', result: 'GOL', contra: false }); const r = shooterRanking(rivalShots()); undo(); undo(); if (r.at(-1).shooter !== null || r.at(-1).goals !== 2) throw new Error('unknown not last despite most goals'); const known = r.slice(0, -1); if (!known.every((x, i) => i === 0 || known[i - 1].goals > x.goals || (known[i - 1].goals === x.goals && known[i - 1].list.length >= x.list.length))) throw new Error('order ' + JSON.stringify(known.map((x) => [x.shooter.num, x.goals, x.list.length]))); if (known[0].shooter.num !== 9) throw new Error('top rival should be #9 Lolo'); });
  T('our shots without a player are listed as Sin jugador', () => { addEvent('SHOT', { playerId: null, origin: m(0, 8), target: { x: 500, y: 120 }, from: '9M', zone: '9M', result: 'FUERA' }); const rows = goalShooterRows(ourShots(), 'US'); undo(); if (rows.at(-1)[1] !== 'Sin jugador') throw new Error(rows.at(-1)[1]); });
  T('sheet rival goal: map shows our dorsals and a shooter can be focused', () => { ui.sheetTab = 'gk'; ui.sheetGoal = 'GK'; renderSheet(); document.querySelector('[data-sheet-goal="US"]').click(); const dorsals = [...document.querySelectorAll('.shot-map .map-dorsal')].map((t) => t.textContent).sort(); const drawn = (list) => list.filter((e) => ['PARADA', 'GOL'].includes(groupOf(e.result))); const expected = drawn(ourShots()).map((e) => shooterOf(e)).filter(Boolean).map((p) => String(p.num)).sort(); if (dorsals.join() !== expected.join() || !dorsals.length) throw new Error(dorsals.join() + ' vs ' + expected.join()); if (document.querySelector('[data-sheet-gk]')) throw new Error('keeper chips on rival goal'); const first = document.querySelector('[data-sheet-shooter]'); const id = first.dataset.sheetShooter; first.click(); if (ui.sheetShooter !== id) throw new Error('focus'); const faded = document.querySelectorAll('.shot-map g[opacity]').length; if (faded !== drawn(ourShots()).filter((e) => shooterKey(e) !== id).length) throw new Error('faded ' + faded); document.querySelector(`[data-sheet-shooter="${id}"]`).click(); if (ui.sheetShooter !== null) throw new Error('toggle off'); document.querySelector('[data-sheet-goal="GK"]').click(); if (!document.querySelector('[data-sheet-gk]') || document.querySelectorAll('.shot-map .map-dorsal').length !== drawn(rivalShots()).filter((e) => shooterOf(e)).length) throw new Error('our goal'); });
  T('live court is drawn from the shared court markup', () => { if (!$('court-floor').querySelector('clipPath#court-clip') || !$('goal-frame').querySelector('path') || !$('goal-net').querySelector('line')) throw new Error('court'); });
  T('match details saved', () => { setMatchField('venue', '  Pabellón Sur  '); setMatchField('date', '2026-10-12'); if (state.venue !== 'Pabellón Sur' || matchDateText() !== new Date('2026-10-12T12:00:00').toLocaleDateString('es-ES')) throw new Error('fields'); });
  T('rival shot popup: dorsals big, results small, fits with 16 rivals', () => { const saved = state.rivals; const check = (label) => { openShotPop({ type: 'rivalShot', origin: m(0, 8), target: { x: 500, y: 120 } }, { x: 640, y: 300 }); const chip = document.querySelector('[data-rival]').getBoundingClientRect(); const results = [...document.querySelectorAll('[data-result]')].map((b) => b.getBoundingClientRect()); const pop = $('pop').getBoundingClientRect(); document.querySelector('[data-rival]').click(); const after = $('pop').getBoundingClientRect().width; closePop(); if (after !== pop.width) throw new Error(label + ': width changed on pick ' + pop.width + ' → ' + after); if (chip.height < 64) throw new Error(label + ': dorsal ' + chip.height); if (!results.every((r) => r.height < chip.height)) throw new Error(label + ': results not smaller'); if (new Set(results.map((r) => Math.round(r.top))).size !== 1) throw new Error(label + ': results not in one row'); if (pop.top < 0 || pop.bottom > innerHeight || pop.right > innerWidth) throw new Error(label + ': popup off screen'); }; try { check('roster'); state.rivals = Array.from({ length: 16 }, (_, i) => ({ id: 'rx' + i, num: i + 1, name: '', pos: null })); check('16 unnamed'); state.rivals = state.rivals.map((r) => ({ ...r, name: 'Jugador ' + r.num })); check('16 named'); } finally { state.rivals = saved; } });
  T('rival goal button is red', () => { openShotPop({ type: 'rivalShot', origin: m(0, 8), target: { x: 500, y: 120 } }, { x: 10, y: 10 }); const st = document.querySelector('[data-result="GOL"]').getAttribute('style'); closePop(); if (!st.includes('var(--red)')) throw new Error(st); });
  T('both keepers: same rows and names, only goal colour differs', () => { const read = (src) => { ui.source = src; renderShots(); return [...$('tallies').querySelectorAll('.tally-label')].map((t) => t.textContent).join('|'); }; const gk = read('GK'), us = read('US'); if (gk !== us || gk !== 'DETENIDOS|GOLES ENCAJADOS|FALLOS') throw new Error(gk + ' vs ' + us); const nums = (src) => { ui.source = src; renderShots(); return [...$('tallies').querySelectorAll('.tally-num')].map((t) => t.getAttribute('fill')); }; const a = nums('GK'), b = nums('US'); if (a[0] !== b[0] || a[2] !== b[2] || a[1] === b[1]) throw new Error(a + ' / ' + b); ui.source = 'GK'; renderShots(); });
  T('rival positions: set, clear, shown in picker colour', () => { ui.sheetTab = 'acta'; renderSheet(); const r = sortedRivals().find((x) => !x.pos); document.querySelector(`[data-rival-pos="${r.id}:PIV"]`).click(); if (r.pos !== 'PIV') throw new Error('set'); openShotPop({ type: 'rivalShot', origin: m(0, 8), target: { x: 500, y: 120 } }, { x: 10, y: 10 }); const disc = document.querySelector(`[data-rival="${r.id}"] .disc`); closePop(); if (!disc || !disc.getAttribute('style').includes('var(--piv)')) throw new Error('colour'); ui.sheetTab = 'acta'; renderSheet(); document.querySelector(`[data-rival-pos="${r.id}:PIV"]`).click(); if (r.pos !== null) throw new Error('clear'); });
  T('parseRoster rival keeps positions, rejects unknown', () => { const r = parseRoster(JSON.stringify({ format: 'hbstats-plantilla', players: [{ num: 4, pos: 'EXT' }, { num: 5 }] }), 'them'); if (r.players[0].pos !== 'EXT' || r.players[1].pos !== null) throw new Error('pos'); throws(() => parseRoster(JSON.stringify({ format: 'hbstats-plantilla', players: [{ num: 4, pos: 'XX' }] }), 'them'), /puesto/); });
  T('pickers ordered by position then dorsal', () => { const ranks = (ids, find) => ids.map((id) => find(id)).map((p) => [positionRank(p), p.num]); const sorted = (arr) => arr.every((x, i) => i === 0 || x[0] > arr[i - 1][0] || (x[0] === arr[i - 1][0] && x[1] > arr[i - 1][1])); setPhase('ATK'); openShotPop({ type: 'ourShot', playerId: null, pick: true, origin: m(0, 8), target: { x: 500, y: 120 } }, { x: 10, y: 10 }); const cols = [...document.querySelectorAll('.picker > div')].map((c) => [...c.querySelectorAll('[data-pick]')].map((b) => b.dataset.pick)); closePop(); if (!cols.every((ids) => sorted(ranks(ids, playerById)))) throw new Error('ours'); setPhase('DEF'); openShotPop({ type: 'rivalShot', origin: m(0, 8), target: { x: 500, y: 120 } }, { x: 10, y: 10 }); const rids = [...document.querySelectorAll('[data-rival]')].map((b) => b.dataset.rival); closePop(); const rr = ranks(rids, rivalById); if (!sorted(rr) || rr.at(-1)[0] !== POSITION_ORDER.length) throw new Error('rival ' + JSON.stringify(rr)); });
  T('lanes from the attacker view', () => { const cases = [[m(-8.4, 1.6), 'EXT_I'], [m(-5.6, 8.3), 'LAT_I'], [m(0, 9.7), 'CEN'], [m(-1.6, 6.7), 'CEN'], [m(5.6, 8.3), 'LAT_D'], [m(8.4, 1.6), 'EXT_D']]; cases.forEach(([pt, id]) => { if (laneOf(pt) !== id) throw new Error(JSON.stringify(pt) + ' ' + laneOf(pt)); }); });
  T('attack analysis is symmetric and consistent', () => { const a = attackAnalysis('them'), b = attackAnalysis('us'); const keys = (o) => Object.keys(o).sort().join(); if (keys(a) !== keys(b)) throw new Error('shape'); [a, b].forEach((x) => { const laneTotal = x.lanes.reduce((t, l) => t + l.list.length, 0); if (laneTotal !== x.field.length) throw new Error('lanes ' + laneTotal + '/' + x.field.length); if (x.field.length + x.penalties.length !== x.shots.length) throw new Error('7m split'); }); if (a.topShooter.label[0] !== '#') throw new Error('rival top'); });
  T('key points react to the data', () => { const saved = state.events; const shot = (o, t, res, rivalId) => makeEvent('RIVAL_SHOT', { gkId: state.gkId, rivalId, origin: m(o[0], o[1]), target: gf(t[0], t[1]), zone: zoneFrom(m(o[0], o[1])), result: res, contra: false }); state.events = [shot([-8, 1.5], [0.15, 0.2], 'GOL', 'r4'), shot([-8.2, 1.4], [0.15, 0.25], 'GOL', 'r4'), shot([-7.9, 1.7], [0.1, 0.2], 'GOL', 'r4'), shot([-1, 6.5], [0.5, 0.9], 'GOL', 'r7')]; const k = keyPoints(); state.events = saved; const txt = k.defence.map((x) => x.text).join(' | '); if (!txt.includes('extremo izq.')) throw new Error('lane: ' + txt); if (!txt.includes('6 m')) throw new Error('penetration: ' + txt); if (!txt.includes('#4')) throw new Error('scorer: ' + txt); if (!txt.includes('arriba izquierda')) throw new Error('sector: ' + txt); if (k.defence.some((x) => x.tone !== 'bad')) throw new Error('tone'); });
  T('key points empty without data', () => { const saved = state.events; state.events = []; const k = keyPoints(); state.events = saved; if (k.defence.length || k.attack.length) throw new Error(JSON.stringify(k)); });
  T('analysis tab renders both teams alike', () => { ui.sheetTab = 'analysis'; renderSheet(); const cols = document.querySelectorAll('.analysis-col'); if (cols.length !== 2) throw new Error('cols'); const shape = (c) => [...c.querySelectorAll('.sum span, th')].map((e) => e.textContent).join('|'); if (shape(cols[0]) !== shape(cols[1])) throw new Error('shape'); });
  T('plural', () => { if (plural(1, 'gol', 'goles') !== '1 gol' || plural(2, 'gol', 'goles') !== '2 goles') throw new Error('plural'); });
  const snapshot = () => JSON.stringify(state);
  const restore = (snap) => { state = JSON.parse(snap); $('final').hidden = true; $('sheet').hidden = true; ui.sheetMode = 'sheet'; commit(); };
  T('quick note: saved with the minute, shown in strip and sheet, undoable, does not start the clock', () => { const snap = snapshot(); try { pauseClock(); const n = state.events.length; $('note-text').value = '  Pivote   les gana la espalda  '; $('note-text').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); const e = state.events.at(-1); if (state.events.length !== n + 1 || e.kind !== 'NOTE' || e.text !== 'Pivote les gana la espalda' || e.abs !== absSeconds()) throw new Error(JSON.stringify(e)); if ($('note-text').value !== '' || isRunning()) throw new Error('not cleared or clock started'); if (!$('events').textContent.includes('Nota: Pivote')) throw new Error('strip'); ui.sheetTab = 'stats'; renderSheet(); if (!$('sheet').textContent.includes('les gana la espalda')) throw new Error('sheet'); if (noteRows()[0][1] !== e.text) throw new Error('rows'); $('note-text').value = '   '; $('note-form').requestSubmit(); if (state.events.length !== n + 1) throw new Error('blank note saved'); if (addNote('x'.repeat(300)) !== true || state.events.at(-1).text.length !== NOTE_MAX_LENGTH) throw new Error('length'); undo(); undo(); if (state.events.length !== n) throw new Error('undo'); } finally { restore(snap); } });
  T('bench is one list: goalkeepers first, then EXT, LAT, CEN, PIV by dorsal', () => { const snap = snapshot(); try { state.lineups[state.phase] = {}; renderBench(); const ids = [...$('bench').querySelectorAll('.bench-player')].map((b) => b.dataset.id); const ranks = ids.map((id) => playerById(id)).map((p) => [p.pos === 'POR' ? -1 : POSITION_ORDER.indexOf(p.pos), p.num]); const sorted = ranks.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (JSON.stringify(ranks) !== JSON.stringify(sorted)) throw new Error(JSON.stringify(ranks)); if (ids.includes(state.gkId) || $('bench').querySelector('.bench-label')) throw new Error('goal keeper in goal listed or label'); if (playerById(ids[0]).pos !== 'POR') throw new Error('goalkeeper not first'); } finally { restore(snap); } });
  const rivalOf = (i) => sortedRivals()[i];
  T('rival red card: one 2 min, dorsal sent off and hidden from the shooter picker', () => { const snap = snapshot(); const r = rivalOf(2); const ex0 = activeRivalExclusions().length; $('btn-rival-2m').click(); document.querySelector('[data-card="D"]').click(); if (ui.popView.card !== 'D' || document.querySelector('[data-card="D"]').getAttribute('aria-pressed') !== 'true') throw new Error('card not chosen'); document.querySelector(`[data-rival-sanction="${r.id}"]`).click(); if (activeRivalExclusions().length !== ex0 + 1) throw new Error('no 2 min'); if (!rivalDisqualifications().has(r.id)) throw new Error('not out'); if (!state.alerts.some((a) => a.kind === 'desc' && a.title.includes(`#${r.num}`))) throw new Error('no alert'); addRivalSanction(r.id, 'AZ'); if (activeRivalExclusions().length !== ex0 + 1) throw new Error('blue after red added time'); setPhase('DEF'); openShotPop({ type: 'rivalShot', origin: m(0, 8), target: { x: 500, y: 120 } }, { x: 10, y: 10 }); if (document.querySelector(`[data-rival="${r.id}"]`)) throw new Error('still pickable'); closePop(); $('btn-rival-2m').click(); const chip = document.querySelector(`[data-rival-sanction="${r.id}"]`); if (!chip.classList.contains('sent-off') || chip.querySelectorAll('.card-ico.mini').length !== 2) throw new Error('chip marks'); closePop(); restore(snap); });
  T('rival third 2 min disqualifies without an extra timer', () => { const snap = snapshot(); const r = rivalOf(3); for (let i = 0; i < CONFIG.exclusionsToDisqualify; i++) { state.clock.elapsedMs += CONFIG.exclusionSeconds * 1000; addRivalSanction(r.id, '2M'); } if (!rivalDisqualifications().has(r.id)) throw new Error('not out'); if (rivalExclusionEvents().filter((e) => e.rivalId === r.id).length !== CONFIG.exclusionsToDisqualify) throw new Error('timers'); restore(snap); });
  T('rival yellow: no timer, no send-off; undo removes it', () => { const r = rivalOf(4); const ex0 = activeRivalExclusions().length; const n = state.events.length; addRivalSanction(r.id, 'A'); if (activeRivalExclusions().length !== ex0 || rivalDisqualifications().has(r.id)) throw new Error('yellow counted'); if (!describe(state.events.at(-1)).includes(`#${r.num}`)) throw new Error('describe'); undo(); if (state.events.length !== n) throw new Error('undo'); });
  T('rival card without dorsal: red still leaves them 2 min short', () => { const snap = snapshot(); const ex0 = activeRivalExclusions().length; $('btn-rival-2m').click(); document.querySelector('[data-card="D"]').click(); document.querySelector('[data-rival-sanction=""]').click(); const e = state.events.at(-1); if (e.rivalId !== null || e.card !== 'D') throw new Error(JSON.stringify(e)); if (activeRivalExclusions().length !== ex0 + 1) throw new Error('no 2 min'); restore(snap); });
  T('rival cards without roster commit with one tap on the card', () => { const snap = snapshot(); state.rivals = []; $('btn-rival-2m').click(); if (document.querySelector('[data-rival-sanction]')) throw new Error('asks dorsal'); document.querySelector('[data-sanction="AZ"]').click(); const e = state.events.at(-1); if (e.kind !== 'RIVAL_SANCTION' || e.card !== 'AZ' || e.rivalId !== null) throw new Error(JSON.stringify(e)); restore(snap); });
  T('end of a rival 2 min names the dorsal', () => { const snap = snapshot(); const r = rivalOf(1); addRivalSanction(r.id, '2M'); const e = state.events.at(-1); state.clock.elapsedMs += CONFIG.exclusionSeconds * 1000; checkTimers(); const a = state.alerts.find((x) => x.id === `rex-${e.id}`); if (!a || !a.title.includes(`#${r.num}`) || !a.title.includes('puede volver')) throw new Error(a && a.title); restore(snap); });
  T('our 2 min button can switch card', () => { const snap = snapshot(); $('btn-us-2m').click(); document.querySelector('[data-card="A"]').click(); if (ui.popView.type !== 'sanctionPick' || ui.popView.card !== 'A') throw new Error('card'); const id = document.querySelector('[data-pick]').dataset.pick; document.querySelector(`[data-pick="${id}"]`).click(); const e = state.events.at(-1); if (e.kind !== 'SANCTION' || e.card !== 'A' || e.playerId !== id) throw new Error(JSON.stringify(e)); restore(snap); });
  T('rival sanctions listed with dorsal', () => { const snap = snapshot(); const r = rivalOf(0); addRivalSanction(r.id, 'A'); const row = sanctionRows().at(-1); if (!row[1].includes(`#${r.num}`)) throw new Error(row.join()); restore(snap); });
  T('rival serving 2 min cannot shoot until it ends', () => { const snap = snapshot(); const r = rivalOf(1); addRivalSanction(r.id, '2M'); setPhase('DEF'); openShotPop({ type: 'rivalShot', origin: m(0, 8), target: { x: 500, y: 120 } }, { x: 10, y: 10 }); if (document.querySelector(`[data-rival="${r.id}"]`)) throw new Error('pickable during 2 min'); closePop(); $('btn-rival-2m').click(); if (!document.querySelector(`[data-rival-sanction="${r.id}"]`).classList.contains('sent-off')) throw new Error('not dimmed'); closePop(); state.clock.elapsedMs += CONFIG.exclusionSeconds * 1000; openShotPop({ type: 'rivalShot', origin: m(0, 8), target: { x: 500, y: 120 } }, { x: 10, y: 10 }); if (!document.querySelector(`[data-rival="${r.id}"]`)) throw new Error('still out after 2 min'); closePop(); restore(snap); });
  T('our player serving 2 min: cards only, not in the shot picker', () => { const snap = snapshot(); setPhase('ATK'); const id = Object.keys(state.lineups.ATK).find((x) => !ourOffCourt().has(x)); addSanction(id, '2M'); openPlayerPop(id, { x: 10, y: 10 }); if (document.querySelector('[data-arm]') || document.querySelector('[data-action]') || document.querySelectorAll('[data-sanction]').length !== 3 || document.querySelector('[data-sanction="2M"]')) throw new Error('actions offered'); closePop(); openShotPop({ type: 'ourShot', playerId: null, pick: true, origin: m(0, 8), target: { x: 500, y: 120 } }, { x: 10, y: 10 }); if (document.querySelector(`[data-pick="${id}"]`)) throw new Error('pickable'); closePop(); if (zoneShooterId(state.lineups.ATK[id]) === id) throw new Error('preselected'); $('btn-us-2m').click(); if (document.querySelector(`[data-pick="${id}"]`)) throw new Error('second 2 min offered'); document.querySelector('[data-card="A"]').click(); if (!document.querySelector(`[data-pick="${id}"]`)) throw new Error('cannot be carded'); closePop(); restore(snap); });
  T('rival 2 min closed with one tap on its chip: back in play, no alarm, undoable', () => { const snap = snapshot(); const r = rivalOf(1); addRivalSanction(r.id, '2M'); const e = state.events.at(-1); const chip = document.querySelector(`#rex [data-rex="${e.id}"]`); if (!chip) throw new Error('no chip'); if (!chip.querySelector('.x')) throw new Error('no close mark'); chip.click(); if (runningExclusionOf('RIVAL_SANCTION', r.id) || rivalOffCourt().has(r.id)) throw new Error('still serving'); if (document.querySelector(`[data-rex="${e.id}"]`)) throw new Error('chip left'); state.clock.elapsedMs += CONFIG.exclusionSeconds * 1000; checkTimers(); if (state.alerts.some((a) => a.id === `rex-${e.id}`)) throw new Error('alarm rang'); state.clock.elapsedMs -= CONFIG.exclusionSeconds * 1000; undo(); if (!runningExclusionOf('RIVAL_SANCTION', r.id)) throw new Error('undo did not restore'); restore(snap); });
  T('our 2 min: chip on the left, ended early from the token popup', () => { const snap = snapshot(); setPhase('DEF'); const id = onCourtDef(); addSanction(id, '2M'); const e = state.events.at(-1); if (!document.querySelector(`#uex [data-rex="${e.id}"]`)) throw new Error('no left chip'); if (document.querySelector(`#rex [data-rex="${e.id}"]`)) throw new Error('on rival side'); document.querySelector(`#uex [data-rex="${e.id}"]`).click(); if (ourOffCourt().has(id)) throw new Error('chip did not close'); undo(); openPlayerPop(id, { x: 10, y: 10 }); document.querySelector(`[data-end-ex="${e.id}"]`).click(); if (ourOffCourt().has(id)) throw new Error('still out'); const s0 = liveStats(); if (!describe(state.events.at(-1)).includes(`#${playerById(id).num}`)) throw new Error('describe'); restore(snap); });
  T('no second 2 min while serving one', () => { const snap = snapshot(); const r = rivalOf(2); addRivalSanction(r.id, '2M'); const n = state.events.length; addRivalSanction(r.id, '2M'); if (state.events.length !== n) throw new Error('rival double'); $('btn-rival-2m').click(); if (!document.querySelector(`[data-rival-sanction="${r.id}"]`).disabled) throw new Error('chip enabled'); document.querySelector('[data-card="A"]').click(); if (document.querySelector(`[data-rival-sanction="${r.id}"]`).disabled) throw new Error('yellow blocked'); closePop(); setPhase('DEF'); const id = onCourtDef(); addSanction(id, '2M'); const m0 = state.events.length; addSanction(id, '2M'); if (state.events.length !== m0) throw new Error('our double'); $('btn-us-2m').click(); if (document.querySelector(`[data-pick="${id}"]`)) throw new Error('in 2 min picker'); document.querySelector('[data-card="D"]').click(); if (!document.querySelector(`[data-pick="${id}"]`)) throw new Error('red not allowed'); closePop(); openPlayerPop(id, { x: 10, y: 10 }); if (document.querySelector('[data-sanction="2M"]')) throw new Error('2 min offered'); closePop(); restore(snap); });
  T('exclusions: pure over a saved state equals the live result', () => {
    const snap = snapshot();
    const saved = JSON.parse(snap);
    const two = saved.events.find((e) => e.kind === 'SANCTION' && e.card === '2M');
    saved.events.push({ id: 'e-early', abs: two.abs + 30, kind: 'EXCLUSION_END', sanctionId: two.id });
    try {
    state = JSON.parse(JSON.stringify(saved)); commit();
    const live = { off: [...sendOffsOf('SANCTION').keys()], ex: exclusionsOf('SANCTION').map((e) => e.id), early: earlyEndOf(two), end: exclusionEnd(two), rival: exclusionsOf('RIVAL_SANCTION').length };
    state = freshMatch(state); commit();
    if (exclusionsOf('SANCTION').length) throw new Error('the swapped state still has exclusions');
    const pure = { off: [...sendOffsOf('SANCTION', saved.events).keys()], ex: exclusionsOf('SANCTION', saved.events).map((e) => e.id), early: earlyEndOf(two, saved.events), end: exclusionEnd(two, saved.events), rival: exclusionsOf('RIVAL_SANCTION', saved.events).length };
    if (!live.ex.length || live.end !== two.abs + 30) throw new Error('the sample has no cut 2 min: ' + JSON.stringify(live));
    if (JSON.stringify(pure) !== JSON.stringify(live)) throw new Error(JSON.stringify({ pure, live }));
    } finally { restore(snap); }
  });
  // ---- Court log (M1): a match created after M1 keeps who is on court, recorded from the substitutions already made ----
  const withCourtMatch = (fn) => () => {
    const snap = snapshot();
    try { state = freshMatch(sampleState()); state.setupDone = true; commit(); fn(); } finally { disarmAction(); cancelPenalty(); closePop(); restore(snap); }
  };
  const atSecond = (abs) => { state.clock = { period: abs >= CONFIG.halfSeconds ? 2 : 1, elapsedMs: (abs % CONFIG.halfSeconds) * 1000, runningSince: null }; };
  const courtSummary = () => JSON.stringify(state.court.map((c) => [c.abs, c.on.length]));
  const benchFieldPlayer = () => state.players.find((p) => p.pos !== 'POR' && !state.lineups.ATK[p.id] && !state.lineups.DEF[p.id]);
  T('court: a bench substitution logs a new entry', withCourtMatch(() => {
    if (state.court.length !== 1 || state.court[0].abs !== 0 || state.court[0].on.length !== CONFIG.maxFieldPlayers + 1) throw new Error('first entry ' + JSON.stringify(state.court));
    setPhase('ATK'); atSecond(100);
    const inP = benchFieldPlayer(), outId = Object.keys(lineup())[0];
    substituteFromBench(inP.id, outId); commit();
    const last = state.court.at(-1);
    if (state.court.length !== 2 || last.abs !== 100 || !last.on.includes(inP.id) || last.on.includes(outId) || last.on.join() !== [...last.on].sort().join()) throw new Error(JSON.stringify(state.court));
  }));
  T('court: switching to defence with specialists logs the defence lineup', withCourtMatch(() => {
    setPhase('ATK'); atSecond(60); commit();
    const atk = state.court.at(-1).on;
    setPhase('DEF');
    const last = state.court.at(-1);
    if (last.on.join() !== onCourtIds().join() || last.on.join() === atk.join() || !last.on.includes('p5') || last.on.includes('p8')) throw new Error(JSON.stringify([atk, last.on]));
  }));
  T('court: a goalkeeper change logs', withCourtMatch(() => {
    atSecond(200);
    const spare = state.players.find((p) => p.pos === 'POR' && p.id !== state.gkId);
    state.gkId = spare.id; commit();
    const last = state.court.at(-1);
    if (last.abs !== 200 || !last.on.includes(spare.id) || last.on.includes('p1')) throw new Error(JSON.stringify(last));
  }));
  T('court: undoing a bench swap logs the restored lineup', withCourtMatch(() => {
    setPhase('ATK'); state.autoPhase = false; atSecond(300);
    const before = state.court.at(-1).on.slice();
    commitShot({ type: 'ourShot', playerId: 'p21', origin: m(0, 8), target: { x: 500, y: 120 }, zone: '9M' }, 'GOL');
    const swapped = state.court.at(-1).on;
    if (!swapped.includes('p21')) throw new Error('swap not logged ' + JSON.stringify(swapped));
    atSecond(310); undo();
    if (state.court.at(-1).on.join() !== before.join() || state.court.at(-1).abs !== 310) throw new Error('undo ' + JSON.stringify(state.court));
    atSecond(320); redo();
    if (!state.court.at(-1).on.includes('p21')) throw new Error('redo ' + JSON.stringify(state.court));
    if (!state.events.at(-1).on.includes('p21')) throw new Error('redone event lost its stamp');
  }));
  T('court: the same second replaces, a clock moved back clamps', withCourtMatch(() => {
    setPhase('ATK'); atSecond(100);
    const inP = benchFieldPlayer(), outId = Object.keys(lineup())[0];
    substituteFromBench(inP.id, outId); commit();
    const n = state.court.length;
    const other = Object.keys(lineup()).find((id) => id !== inP.id);
    substituteFromBench(outId, other); commit();
    if (state.court.length !== n || state.court.at(-1).abs !== 100 || state.court.at(-1).on.includes(other)) throw new Error('not replaced ' + courtSummary());
    substituteFromBench(other, outId); commit();
    if (state.court.length !== n || state.court.at(-1).on.includes(outId)) throw new Error('did not replace back ' + courtSummary());
    atSecond(400); setPhase('DEF');
    atSecond(50); substituteFromBench(benchFieldPlayer().id, Object.keys(lineup())[0]); commit();
    const abs = state.court.map((c) => c.abs);
    if (abs.join() !== '0,100,400' || state.court.at(-1).on.join() !== onCourtIds().join()) throw new Error('not clamped ' + courtSummary());
  }));
  T('court: half-time writes a break entry', withCourtMatch(() => {
    setPhase('ATK'); atSecond(CONFIG.halfSeconds - 30); commit();
    startPeriod(2);
    const [brk, second] = state.court.slice(-2);
    if (brk.abs !== CONFIG.halfSeconds - 30 || brk.on.length || second.abs !== CONFIG.halfSeconds || second.on.length !== CONFIG.maxFieldPlayers + 1) throw new Error(JSON.stringify(state.court.slice(-2)));
    atSecond(CONFIG.halfSeconds - 1); startPeriod(1); atSecond(CONFIG.halfSeconds); startPeriod(2);
    if (!state.court.some((c, i) => !c.on.length && state.court[i + 1] && state.court[i + 1].abs === c.abs)) throw new Error('break lost at the same second ' + courtSummary());
  }));
  T('court: old matches and the sample get no log', () => {
    const snap = snapshot();
    try {
      const old = JSON.parse(snap); delete old.court; old.sample = false;
      state = restoreState(old); commit(); setPhase('ATK');
      addEvent('RIVAL_SHOT', { gkId: state.gkId, rivalId: null, origin: m(0, 8), target: { x: 500, y: 120 }, zone: '6M', result: 'GOL', contra: false });
      if ('court' in state || 'on' in state.events.at(-1)) throw new Error('old match grew a log');
      state = sampleState(); commit(); setPhase('DEF');
      if ('court' in state) throw new Error('sample has a log');
      const fresh = freshMatch(sampleState());
      if (!Array.isArray(fresh.court) || fresh.court.length) throw new Error('fresh match');
      if (!Array.isArray(restartedMatch(JSON.parse(snap)).court) || restartedMatch({ ...JSON.parse(snap), court: [{ abs: 5, on: ['p1'] }] }).court.length) throw new Error('restarted match');
    } finally { restore(snap); }
  });
  T('court: setup and a finished match log nothing', () => {
    const snap = snapshot();
    try {
      state = freshMatch(sampleState()); commit();
      state.lineups.ATK = { ...state.lineups.ATK }; delete state.lineups.ATK.p8; commit();
      if (state.court.length) throw new Error('setup logged ' + courtSummary());
      state.setupDone = true; commit();
      state.finished = true; setPhase('DEF');
      if (state.court.length !== 1) throw new Error('finished logged ' + courtSummary());
    } finally { restore(snap); }
  });
  T('court: a shot by a bench player stamps him on court', withCourtMatch(() => {
    setPhase('ATK'); state.autoPhase = false; atSecond(120);
    const p = benchFieldPlayer();
    commitShot({ type: 'ourShot', playerId: p.id, origin: m(0, 8), target: { x: 500, y: 120 }, zone: '9M' }, 'GOL');
    const e = state.events.at(-1);
    if (e.kind !== 'SHOT' || !e.on || !e.on.includes(p.id) || e.on.length !== CONFIG.maxFieldPlayers + 1 || e.on.join() !== e.on.slice().sort().join()) throw new Error(JSON.stringify(e.on));
    if (e.on.join() !== state.court.at(-1).on.join()) throw new Error('stamp and court log disagree');
    commitShot({ type: 'rivalShot', rivalId: null, origin: m(0, 8), target: { x: 500, y: 120 }, zone: '6M' }, 'PARADA');
    if (!state.events.at(-1).on.includes(state.gkId)) throw new Error('rival shot without the goalkeeper');
  }));
  T('court: team fault stamps the players on court', withCourtMatch(() => {
    setPhase('ATK'); atSecond(150);
    addEvent('ACTION', { playerId: null, action: 'NOATK' });
    const e = state.events.at(-1);
    if (!e.on || e.on.join() !== onCourtIds().join()) throw new Error(JSON.stringify(e.on));
    addEvent('ACTION', { playerId: 'p8', action: 'ASIST' });
    if ('on' in state.events.at(-1)) throw new Error('a player action was stamped');
    addEvent('NOTE', { text: 'x' });
    if ('on' in state.events.at(-1)) throw new Error('a note was stamped');
  }));
  T('court: a 2 min stays on court, a red card takes the player out', withCourtMatch(() => {
    setPhase('ATK'); atSecond(200);
    addSanction('p8', '2M');
    if (!state.court.at(-1).on.includes('p8')) throw new Error('2 min removed him from the log');
    atSecond(500); addSanction('p8', 'D');
    if (state.court.at(-1).on.includes('p8') || state.court.at(-1).abs !== 500) throw new Error(JSON.stringify(state.court.at(-1)));
  }));
  T('fresh match: setup first, our roster kept, opponent reset', () => { const f = freshMatch(sampleState()); if (f.setupDone || f.finished || f.events.length || f.rivals.length || f.them !== 'Rival' || !f.players.length || f.clock.elapsedMs) throw new Error(JSON.stringify({ s: f.setupDone, e: f.events.length })); });
  T('setup screen: Empezar goes to the court with the clock stopped', () => { const snap = snapshot(); state = freshMatch(state); commit(); openSetup(); if (!document.querySelector('[data-start-match]') || !document.querySelector('[data-team="them"]') || !document.querySelector('#rival-dorsals')) throw new Error('setup content'); document.querySelector('[data-start-match]').click(); if (!state.setupDone || !$('sheet').hidden || isRunning()) throw new Error('start'); restore(snap); });
  T('setup refuses to start without a goalkeeper', () => { const snap = snapshot(); state = freshMatch(state); state.players = state.players.filter((p) => p.pos !== 'POR'); openSetup(); document.querySelector('[data-start-match]').click(); if (state.setupDone || $('sheet').hidden) throw new Error('started'); if (!$('setup-status').textContent.includes('portero')) throw new Error('msg'); restore(snap); });
  T('play logged with the clock stopped starts it', () => { const snap = snapshot(); pauseClock(); addEvent('TURNOVER', { playerId: 'p8', subtype: 'Pasos' }); if (!isRunning()) throw new Error('not started'); restore(snap); });
  T('sanction, score fix and time-out do not start the clock', () => { const snap = snapshot(); pauseClock(); addSanction('p8', 'A'); addEvent('SCORE_FIX', { team: 'us', delta: 1 }); if (isRunning()) throw new Error('started on sanction/fix'); state.timeout = { team: 'us', endsAt: Date.now() + 60000 }; addEvent('SHOT', { playerId: 'p8', origin: m(0, 8), target: gf(0.5, 0.5), from: '9M', zone: '9M', result: 'GOL' }); if (isRunning()) throw new Error('started in time-out'); restore(snap); });
  T('half over: a play does not restart the clock', () => { const snap = snapshot(); pauseClock(); state.clock.elapsedMs = CONFIG.halfSeconds * 1000; addEvent('TURNOVER', { playerId: 'p8', subtype: 'Pasos' }); if (isRunning()) throw new Error('restarted'); restore(snap); });
  T('clock text parsing', () => { const cases = [['12:40', 760], ['1240', 760], ['740', 460], ['0:05', 5], ['30:00', 1800]]; cases.forEach(([raw, sec]) => { if (parseClockText(raw) !== sec) throw new Error(raw + ' ' + parseClockText(raw)); }); ['12:75', '31:00', 'abc', '', '12345'].forEach((raw) => { if (parseClockText(raw) !== null) throw new Error('accepted ' + raw); }); });
  T('set exact time, up and down', () => { const snap = snapshot(); pauseClock(); setClockText('10:00'); if (periodSeconds() !== 600 || clockText() !== '10:00') throw new Error('up ' + clockText()); state.clockDown = true; setClockText('05:00'); if (clockText() !== '05:00' || periodSeconds() !== CONFIG.halfSeconds - 300) throw new Error('down ' + clockText()); if (setClockText('99:99')) throw new Error('accepted bad'); restore(snap); });
  T('clock popup sets the typed time', () => { const snap = snapshot(); pauseClock(); openClockPop({ x: 100, y: 100 }); $('clock-input').value = '08:15'; $('clock-set').requestSubmit(); if (periodSeconds() !== 495 || !$('pop').hidden) throw new Error(clockText()); restore(snap); });
  T('time input keeps the colon while typing', () => { const cases = [['1', '00:01'], ['12', '00:12'], ['123', '01:23'], ['12:405', '24:05'], ['', '00:00'], ['ab12:3', '01:23']]; cases.forEach(([raw, out]) => { if (maskClockText(raw) !== out) throw new Error(raw + ' → ' + maskClockText(raw)); }); openClockPop({ x: 100, y: 100 }); const input = $('clock-input'); input.value = '12:403'; input.dispatchEvent(new Event('input', { bubbles: true })); const v = input.value; closePop(); if (v !== '24:03') throw new Error(v); });
  T('rewinding the clock shows the half-time window again', () => { const snap = snapshot(); const toEnd = () => { state.clock.elapsedMs = CONFIG.halfSeconds * 1000 - 500; state.clock.runningSince = Date.now() - 1000; checkTimers(); }; state.fired = []; state.clock = { period: 1, elapsedMs: 0, runningSince: null }; toEnd(); if ($('final').hidden) throw new Error('first'); $('final').hidden = true; setClockText('29:50'); if (state.fired.includes(HALFTIME_KEY) || state.alerts.some((a) => a.kind === 'period')) throw new Error('not re-armed'); toEnd(); if ($('final').hidden || !$('final').textContent.includes('Descanso')) throw new Error('not shown again'); restore(snap); });
  T('rewinding after the final whistle shows the final summary again', () => { const snap = snapshot(); const toEnd = () => { state.clock.elapsedMs = CONFIG.halfSeconds * 1000 - 500; state.clock.runningSince = Date.now() - 1000; checkTimers(); }; state.clock = { period: 2, elapsedMs: 0, runningSince: null }; toEnd(); if (!state.finished) throw new Error('first'); $('final').hidden = true; adjustClock(-30); if (state.finished) throw new Error('still finished'); toEnd(); if (!state.finished || $('final').hidden || !$('final').textContent.includes('Final')) throw new Error('not shown again'); restore(snap); });
  T('an action by a bench player brings them on for the same position', () => { const snap = snapshot(); try { setPhase('ATK'); const lats = Object.keys(lineup()).filter((id) => playerById(id).pos === 'LAT'); addEvent('ACTION', { playerId: 'p21', action: 'ASIST' }, { bringOn: 'p21' }); if (!lineup().p21) throw new Error('not on court'); const gone = lats.filter((id) => !lineup()[id]); if (gone.length !== 1) throw new Error('replaced ' + gone); if (state.events.at(-1).playerId !== 'p21') throw new Error('event'); } finally { restore(snap); } });
  T('undo reverts the automatic substitution', () => { const snap = snapshot(); const canon = () => JSON.stringify(Object.entries(lineup()).sort()); try { setPhase('ATK'); const before = canon(); const n = state.events.length; addEvent('ACTION', { playerId: 'p21', action: 'ASIST' }, { bringOn: 'p21' }); const after = canon(); if (after === before) throw new Error('no swap'); undo(); if (state.events.length !== n) throw new Error('event kept'); if (canon() !== before) throw new Error('lineup not restored'); redo(); if (canon() !== after || state.events.length !== n + 1) throw new Error('redo'); } finally { restore(snap); } });
  T('no court player of that position: event kept, lineup untouched', () => { const snap = snapshot(); try { setPhase('ATK'); Object.keys(lineup()).filter((id) => playerById(id).pos === 'PIV').forEach((id) => delete lineup()[id]); const keys = Object.keys(lineup()).sort().join(); addEvent('ACTION', { playerId: 'p10', action: 'ASIST' }, { bringOn: 'p10' }); if (state.events.at(-1).playerId !== 'p10') throw new Error('event'); if (Object.keys(lineup()).sort().join() !== keys) throw new Error('lineup changed'); if (!$('hint').textContent.includes('Arrástralo')) throw new Error('hint ' + $('hint').textContent); } finally { restore(snap); } });
  T('a player already on court is not moved', () => { const snap = snapshot(); try { setPhase('ATK'); const before = JSON.stringify(lineup()); addEvent('ACTION', { playerId: 'p8', action: 'ASIST' }, { bringOn: 'p8' }); if (JSON.stringify(lineup()) !== before) throw new Error('moved'); } finally { restore(snap); } });
  const samePt = (a, b) => a && b && a.x === b.x && a.y === b.y;
  T('provoked 7 m: next shot starts on the mark as 7M', () => { const snap = snapshot(); try { setPhase('ATK'); openPlayerPop('p8', { x: 10, y: 10 }); document.querySelector('[data-action="PROV7"]').click(); if (!ui.penalty || ui.penalty.team !== 'us') throw new Error('no pending penalty'); if ($('penalty-spot').getAttribute('visibility') !== 'visible') throw new Error('mark not lit'); shotFromDrag(m(-5, 9), { x: 500, y: 120 }, { x: 10, y: 10 }); document.querySelector('[data-result="GOL"]').click(); const e = state.events.at(-1); if (e.kind !== 'SHOT' || !samePt(e.origin, PENALTY_SPOT) || e.from !== '7M' || e.zone !== '7M') throw new Error(JSON.stringify(e)); if (ui.penalty) throw new Error('still pending'); } finally { cancelPenalty(); restore(snap); } });
  T('penalty shooter defaults to the last 7 m taker, else the provoker', () => { const snap = snapshot(); try { setPhase('ATK'); const taker = ourShots().filter((e) => e.from === '7M').at(-1).playerId; addEvent('ACTION', { playerId: 'p8', action: 'PROV7' }); if (penaltyShooterId() !== taker) throw new Error('not last taker ' + penaltyShooterId()); state.events = state.events.filter((e) => !(e.kind === 'SHOT' && e.from === '7M')); if (penaltyShooterId() !== 'p8') throw new Error('not provoker ' + penaltyShooterId()); } finally { cancelPenalty(); restore(snap); } });
  T('committed 7 m: next rival shot is a 7M rival shot', () => { const snap = snapshot(); try { setPhase('DEF'); state.rivals = []; addEvent('ACTION', { playerId: 'p5', action: 'PEN7C' }); if (!ui.penalty || ui.penalty.team !== 'them') throw new Error('no pending penalty'); shotFromDrag(m(3, 5), { x: 500, y: 120 }, { x: 10, y: 10 }); document.querySelector('[data-result="PARADA"]').click(); const e = state.events.at(-1); if (e.kind !== 'RIVAL_SHOT' || e.zone !== '7M' || !samePt(e.origin, PENALTY_SPOT)) throw new Error(JSON.stringify(e)); } finally { cancelPenalty(); restore(snap); } });
  T('pending penalty survives auto phase change, ends on manual toggle, undo or ✕', () => { const snap = snapshot(); try { setPhase('ATK'); addEvent('ACTION', { playerId: 'p8', action: 'PROV7' }); addEvent('TURNOVER', { playerId: 'p8', subtype: 'Pase' }); if (state.phase !== 'DEF' || !ui.penalty) throw new Error('lost on auto phase'); document.querySelector('.phase [data-phase="ATK"]').click(); if (ui.penalty) throw new Error('kept on manual toggle'); addEvent('ACTION', { playerId: 'p8', action: 'PROV7' }); undo(); if (ui.penalty) throw new Error('kept after undo'); addEvent('ACTION', { playerId: 'p8', action: 'PROV7' }); if ($('armed-bar').hidden || !$('armed-bar').textContent.includes('Penalti a favor')) throw new Error('bar'); $('armed-bar').querySelector('[data-unarm]').click(); if (ui.penalty || $('penalty-spot').getAttribute('visibility') === 'visible') throw new Error('kept after ✕'); } finally { cancelPenalty(); restore(snap); } });
  T('no Contraataque on a penalty shot', () => { const snap = snapshot(); try { setPhase('ATK'); addEvent('ACTION', { playerId: 'p8', action: 'PROV7' }); shotFromDrag(m(0, 9), { x: 500, y: 120 }, { x: 10, y: 10 }); if (document.querySelector('#pop [data-contra]')) throw new Error('contra offered'); if (!document.querySelector('#pop .zone-big').textContent.includes('7 m')) throw new Error('zone'); closePop(); } finally { cancelPenalty(); restore(snap); } });
  T('expected position from where the shot starts', () => { [[m(-8, 2), 'EXT'], [m(1, 6.5), 'PIV'], [m(0.5, 9.5), 'CEN'], [m(-4, 9), 'LAT'], [m(8, 3), 'EXT']].forEach(([pt, pos]) => { if (expectedPosition(pt) !== pos) throw new Error(`${JSON.stringify(pt)} → ${expectedPosition(pt)}, expected ${pos}`); }); });
  T('drawn attack shot preselects the court player of that zone', () => { const snap = snapshot(); try { setPhase('ATK'); disarm(); state.lineups.ATK = sampleState().lineups.ATK; shotFromDrag(m(-8, 2), { x: 500, y: 120 }, { x: 10, y: 10 }); const pressed = document.querySelector('[data-pick][aria-pressed="true"]'); if (!pressed || pressed.dataset.pick !== 'p22') throw new Error('preselected ' + (pressed && pressed.dataset.pick)); closePop(); } finally { restore(snap); } });
  T('a player off court (2 min) is never preselected', () => { const snap = snapshot(); try { setPhase('ATK'); state.lineups.ATK = sampleState().lineups.ATK; addSanction('p22', '2M'); const id = zoneShooterId(m(-8, 2)); if (!id || id === 'p22') throw new Error('got ' + id); } finally { restore(snap); } });
  T('a bench shooter picked for a drawn shot comes on', () => { const snap = snapshot(); try { setPhase('ATK'); state.lineups.ATK = sampleState().lineups.ATK; disarm(); shotFromDrag(m(-4, 9), { x: 500, y: 120 }, { x: 10, y: 10 }); document.querySelector('[data-pick="p21"]').click(); document.querySelector('[data-result="GOL"]').click(); if (state.events.at(-1).playerId !== 'p21') throw new Error('shooter'); if (!state.lineups.ATK.p21) throw new Error('not on court'); } finally { restore(snap); } });
  const tapEl = (el) => { const r = el.getBoundingClientRect(); const o = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 7, pointerType: 'pen' }; el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new PointerEvent('pointerup', o)); };
  const panelKeys = () => [...new Set([...document.querySelectorAll('#acts [data-panel-act], #acts [data-panel-key]')].map((b) => b.dataset.panelAct || b.dataset.panelKey))].join();
  const withSample = (fn) => () => { const snap = snapshot(); try { state.lineups = sampleState().lineups; commit(); fn(); } finally { disarmAction(); cancelPenalty(); closePop(); restore(snap); } };
  T('panel shows only the current phase actions', withSample(() => { setPhase('ATK'); if (panelKeys() !== 'ASIST,PROV7,TURNOVER') throw new Error('ATK ' + panelKeys()); setPhase('DEF'); if (panelKeys() !== 'RECUP,BLOC,DEFFAULT') throw new Error('DEF ' + panelKeys()); if (document.querySelector('#acts [data-sanction], #acts [data-card]')) throw new Error('sanctions in panel'); }));
  T('arm then tap: recovery by a bench player is logged and they come on', withSample(() => { setPhase('DEF'); document.querySelector('[data-panel-act="RECUP"]').click(); const glowing = document.querySelectorAll('#tokens-layer .tok.target').length; if (glowing !== Object.keys(lineup()).length) throw new Error('court glow ' + glowing); const b = document.querySelector('.bench-player[data-id="p21"]'); if (!b.classList.contains('target')) throw new Error('bench glow'); tapEl(b); const e = state.events.at(-1); if (e.kind !== 'ACTION' || e.action !== 'RECUP' || e.playerId !== 'p21') throw new Error(JSON.stringify(e)); if (state.phase !== 'ATK') throw new Error('phase'); if (!state.lineups.DEF.p21) throw new Error('not on court in DEF'); if (ui.armedAction) throw new Error('still armed'); }));
  T('turnover types are a panel section: one tap arms the type', withSample(() => { setPhase('ATK'); if (document.querySelector('#acts [data-panel-act="TURNOVER"]')) throw new Error('still a chooser button'); const types = [...document.querySelectorAll('#acts [data-panel-key="TURNOVER"]')].map((b) => b.dataset.panelSub); if (types.join() !== CONFIG.turnoverGroups.flatMap((g) => g.types).join()) throw new Error(types.join()); document.querySelector('#acts [data-panel-sub="Pase"]').click(); if (!document.querySelector('.tok.target')) throw new Error('no glow'); if (document.querySelector('#acts [data-panel-sub="Pase"]').getAttribute('aria-pressed') !== 'true') throw new Error('not pressed'); tapEl(document.querySelector('#tokens-layer .tok[data-id="p8"]')); const e = state.events.at(-1); if (e.kind !== 'TURNOVER' || e.subtype !== 'Pase' || e.playerId !== 'p8') throw new Error(JSON.stringify(e)); }));
  T('defensive fault section: 7 m committed in, regulation foul out', withSample(() => { setPhase('DEF'); const subs = [...document.querySelectorAll('#acts [data-panel-sub]')].map((b) => b.dataset.panelSub); if (!subs.includes('PEN7C') || subs.includes('FALTA') || !subs.includes('BEATEN')) throw new Error(subs.join()); document.querySelector('#acts [data-panel-sub="PEN7C"]').click(); tapEl(document.querySelector('#tokens-layer .tok[data-id="p5"]')); if (state.events.at(-1).action !== 'PEN7C' || !ui.penalty || ui.penalty.team !== 'them') throw new Error('7 m committed did not leave a rival penalty'); cancelPenalty(); document.querySelector('#acts [data-panel-sub="BEATEN"]').click(); tapEl(document.querySelector('#tokens-layer .tok[data-id="p5"]')); const e = state.events.at(-1); if (e.kind !== 'ACTION' || e.action !== 'BEATEN' || e.playerId !== 'p5') throw new Error(JSON.stringify(e)); }));
  T('goalkeeper glows only for Asistencia', withSample(() => { setPhase('ATK'); document.querySelector('[data-panel-act="ASIST"]').click(); if (!$('gk-card').classList.contains('target') || !document.querySelector('#tokens-layer .tok.gk.target')) throw new Error('gk not lit for assist'); disarmAction(); setPhase('DEF'); document.querySelector('[data-panel-act="RECUP"]').click(); if ($('gk-card').classList.contains('target') || document.querySelector('#tokens-layer .tok.gk.target')) throw new Error('gk lit for recovery'); const n = state.events.length; $('gk-card').click(); if (state.events.length !== n) throw new Error('gk got a recovery'); }));
  T('a 7 m provoked from the panel leaves a pending penalty', withSample(() => { setPhase('ATK'); const id = Object.keys(lineup()).find((x) => !ourOffCourt().has(x)); document.querySelector('[data-panel-act="PROV7"]').click(); tapEl(document.querySelector(`#tokens-layer .tok[data-id="${id}"]`)); if (!ui.penalty || ui.penalty.byId !== id) throw new Error('no penalty'); }));
  T('a failed exit is a defensive fault, not a turnover', () => { if (CONFIG.turnoverGroups.some((g) => g.types.includes('Salida fallada'))) throw new Error('still a turnover'); if (!TACTICAL_FAULTS.includes('BADEXIT')) throw new Error('missing in defence'); });
  T('lack of intensity is a team fault: one tap, no player', withSample(() => { setPhase('DEF'); document.querySelector('[data-panel-mode="acts"]').click(); if (document.querySelector('#acts [data-panel-sub="NOATK"]')) throw new Error('offered per player in the panel'); armAction('DEFFAULT', 'LATE'); const n = state.events.length; document.querySelector('#acts [data-team-fault="NOATK"]').click(); const e = state.events.at(-1); if (state.events.length !== n + 1 || e.kind !== 'ACTION' || e.action !== 'NOATK' || e.playerId !== null) throw new Error(JSON.stringify(e)); if (ui.armedAction) throw new Error('armed'); if (describe(e) !== 'Falta de contundencia · equipo') throw new Error(describe(e)); if (!defFaultCounts(state.events)['Falta de contundencia']) throw new Error('not counted for the team'); openPlayerPop('p5', { x: 10, y: 10 }); const inPop = document.querySelector('#pop [data-action="NOATK"]'); closePop(); if (inPop) throw new Error('offered in the player popup'); undo(); if (state.events.length !== n) throw new Error('undo'); }));
  T('the player popup has no regulation foul; past ones still count', withSample(() => { setPhase('DEF'); openPlayerPop('p5', { x: 10, y: 10 }); const falta = document.querySelector('#pop [data-action="FALTA"]'), pen = document.querySelector('#pop [data-action="PEN7C"]'); closePop(); if (falta) throw new Error('regulation foul offered'); if (!pen) throw new Error('7 m committed missing'); if (!pen.classList.contains('c-act-bad') || !document.querySelector('#acts [data-panel-sub="PEN7C"]').classList.contains('c-act-bad')) throw new Error('7 m committed not red'); addEvent('ACTION', { playerId: 'p5', action: 'FALTA' }); if (!defFaultCounts(state.events)[ACTIONS.FALTA.label] || playerStats('p5').FALTA !== 1) throw new Error('past foul not counted'); undo(); }));
  T('a blocked shot is a purple turnover that still counts as blocked', withSample(() => { setPhase('ATK'); document.querySelector('[data-panel-mode="acts"]').click(); const b = document.querySelector('#acts [data-panel-sub="Bloqueado"]'); if (!b || !b.classList.contains('c-act-rival')) throw new Error('no purple Bloqueado'); const before = { p: playerStats('p8').blocked, live: liveStats().us.blocked, an: attackAnalysis('us').blocked, lost: liveStats().us.turnovers }; b.click(); tapEl(document.querySelector('#tokens-layer .tok[data-id="p8"]')); const e = state.events.at(-1); if (e.kind !== 'TURNOVER' || e.subtype !== 'Bloqueado' || e.playerId !== 'p8') throw new Error(JSON.stringify(e)); if (playerStats('p8').blocked !== before.p + 1 || liveStats().us.blocked !== before.live + 1 || attackAnalysis('us').blocked !== before.an + 1) throw new Error('blocked not counted'); if (liveStats().us.turnovers !== before.lost + 1) throw new Error('not a turnover'); }));
  T('action colours: good green, good in defence blue, bad red, rule breaches orange, forced by the rival purple', withSample(() => { const want = { ASIST: 'act-good', PROV7: 'act-good', RECUP: 'act-def', BLOC: 'act-def', PEN7C: 'act-bad', BEATEN: 'act-bad', BADEXIT: 'act-bad', LATE: 'act-bad', HELP: 'act-bad', NOATK: 'act-rival', GOLPE: 'act-rule' }; const wrong = Object.entries(want).filter(([k, g]) => ACTIONS[k].group !== g); if (wrong.length) throw new Error('actions ' + wrong.map(([k]) => k).join()); const turnover = { Pase: 'c-act-bad', Recepción: 'c-act-bad', Bote: 'c-act-bad', Pasos: 'c-act-rule', Dobles: 'c-act-rule', Área: 'c-act-rule', Pasivo: 'c-act-rule', 'Falta ataque': 'c-act-rival', Bloqueado: 'c-act-rival' }; setPhase('ATK'); document.querySelector('[data-panel-mode="acts"]').click(); const bad = Object.entries(turnover).filter(([t, c]) => !document.querySelector(`#acts [data-panel-sub="${t}"]`).classList.contains(c)); if (bad.length) throw new Error('turnovers ' + bad.map(([t]) => t).join()); ['ASIST', 'PROV7'].forEach((k) => { if (!document.querySelector(`#acts [data-panel-act="${k}"]`).classList.contains('c-act-good')) throw new Error('panel ' + k); }); setPhase('DEF'); ['RECUP', 'BLOC'].forEach((k) => { if (!document.querySelector(`#acts [data-panel-act="${k}"]`).classList.contains('c-act-def')) throw new Error('panel ' + k); }); addEvent('TURNOVER', { playerId: 'p8', subtype: 'Pasos' }); const col = eventColor(state.events.at(-1)); undo(); if (col !== 'var(--act-rule)') throw new Error('strip colour ' + col); }));
  T('each kind of turnover or defensive fault has its own labelled row', withSample(() => { document.querySelector('[data-panel-mode="acts"]').click(); const rows = () => [...document.querySelectorAll('#acts .type-row')].map((r) => r.querySelector('span').textContent + ':' + r.querySelectorAll('button').length).join(); setPhase('ATK'); const atk = CONFIG.turnoverGroups.map((g) => g.label + ':' + g.types.length).join(); if (rows() !== atk) throw new Error('ATK ' + rows() + ' vs ' + atk); setPhase('DEF'); if (rows() !== 'Regla:2,Táctico:4,Equipo:1') throw new Error('DEF ' + rows()); }));
  T('a hit is an orange regulation fault, counted in the player Falta column', withSample(() => { setPhase('DEF'); document.querySelector('[data-panel-mode="acts"]').click(); const b = document.querySelector('#acts [data-panel-sub="GOLPE"]'); if (!b || !b.classList.contains('c-act-rule')) throw new Error('no orange Golpe'); if (!document.querySelector('#acts [data-team-fault="NOATK"]').classList.contains('c-act-rival')) throw new Error('team fault not purple'); const col = PLAYER_HEAD.indexOf('Falta'); const before = playerRow(playerById('p5'))[col]; b.click(); tapEl(document.querySelector('#tokens-layer .tok[data-id="p5"]')); const e = state.events.at(-1); if (e.kind !== 'ACTION' || e.action !== 'GOLPE' || e.playerId !== 'p5') throw new Error(JSON.stringify(e)); if (playerRow(playerById('p5'))[col] !== before + 1) throw new Error('not in Falta column'); if (!defFaultCounts(state.events).Golpe) throw new Error('not a team defensive fault'); openPlayerPop('p5', { x: 10, y: 10 }); const inPop = document.querySelector('#pop [data-action="GOLPE"]'); closePop(); if (!inPop || !inPop.classList.contains('c-act-rule')) throw new Error('not in the player popup'); }));
  const dragTo = (from, to) => { const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(); const at = (r) => ({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }); const o = { bubbles: true, pointerId: 9, pointerType: 'pen' }; from.dispatchEvent(new PointerEvent('pointerdown', { ...o, ...at(a) })); $('court').dispatchEvent(new PointerEvent('pointermove', { ...o, ...at(b) })); $('court').dispatchEvent(new PointerEvent('pointerup', { ...o, ...at(b) })); };
  T('a bench substitution on a player in both phases is made in both', withSample(() => { setPhase('DEF'); const atk = { ...state.lineups.ATK.p18 }, def = { ...state.lineups.DEF.p18 }; substituteFromBench('p21', 'p18'); const L = state.lineups; if (L.DEF.p18 || L.ATK.p18) throw new Error('p18 still on'); if (JSON.stringify(L.DEF.p21) !== JSON.stringify(def) || JSON.stringify(L.ATK.p21) !== JSON.stringify(atk)) throw new Error('p21 not in both spots'); }));
  T('a bench substitution on a one-phase player stays in that phase', withSample(() => { setPhase('DEF'); const atk = JSON.stringify(state.lineups.ATK); substituteFromBench('p21', 'p5'); if (!state.lineups.DEF.p21 || state.lineups.DEF.p5) throw new Error('DEF'); if (JSON.stringify(state.lineups.ATK) !== atk) throw new Error('ATK changed'); }));
  T('dragging a court player onto a bench player is an attack-defence change in this phase only', withSample(() => { setPhase('DEF'); document.querySelector('[data-panel-mode="acts"]').click(); const spot = JSON.stringify(state.lineups.DEF.p17), atk = JSON.stringify(state.lineups.ATK); dragTo(document.querySelector('#tokens-layer .tok[data-id="p17"]'), document.querySelector('.bench-player[data-id="p3"]')); if (JSON.stringify(state.lineups.DEF.p3) !== spot || state.lineups.DEF.p17) throw new Error('DEF ' + JSON.stringify(Object.keys(state.lineups.DEF))); if (JSON.stringify(state.lineups.ATK) !== atk) throw new Error('ATK changed'); if (!document.querySelector('#tokens-layer .tok[data-id="p3"] .ad-mark') || !document.querySelector('.bench-player[data-id="p17"] .ad-mark')) throw new Error('no ⇄ mark'); }));
  T('dragging a court player onto empty bench space still takes them off this phase', withSample(() => { setPhase('DEF'); dragTo(document.querySelector('#tokens-layer .tok[data-id="p17"]'), document.querySelector('#bench .empty, #bench') ); if (state.lineups.DEF.p17 || !state.lineups.ATK.p17) throw new Error(JSON.stringify(Object.keys(state.lineups.DEF))); }));
  T('the automatic bring-on is made in both phases and undone in both', withSample(() => { setPhase('ATK'); state.autoPhase = false; const before = JSON.stringify(state.lineups); addEvent('ACTION', { playerId: 'p21', action: 'ASIST' }, { bringOn: 'p21' }); const L = state.lineups; const out = Object.keys(JSON.parse(before).ATK).find((id) => !L.ATK[id]); if (!L.ATK.p21 || !out) throw new Error('not on in ATK'); if (JSON.parse(before).DEF[out] && (!L.DEF.p21 || L.DEF[out])) throw new Error('not mirrored in DEF for ' + out); undo(); const sorted = (l) => JSON.stringify(Object.fromEntries(Object.entries(l).map(([ph, team]) => [ph, Object.fromEntries(Object.entries(team).sort())]))); if (sorted(state.lineups) !== sorted(JSON.parse(before))) throw new Error('undo'); }));
  T('one-phase players carry the ⇄ mark, on court and on the bench', withSample(() => { setPhase('ATK'); const marked = (sel) => Boolean(document.querySelector(sel + ' .ad-mark')); if (!marked('#tokens-layer .tok[data-id="p8"]') || marked('#tokens-layer .tok[data-id="p22"]')) throw new Error('court'); if (!marked('.bench-player[data-id="p5"]') || marked('.bench-player[data-id="p21"]')) throw new Error('bench'); if (marked('#tokens-layer .tok.gk')) throw new Error('goalkeeper'); }));
  const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  T('a player photo fills the disc and the court token, the dorsal stays on top', withSample(() => { setTeamPhotos([{ id: 'p8', photo: TINY_PNG }, { id: 'p22', photo: 'javascript:alert(1)' }]); setPhase('ATK'); renderAll(); const disc = discHtml(playerById('p8')); if (!disc.includes(TINY_PNG) || !disc.includes('>8<')) throw new Error('disc ' + disc); const tok = document.querySelector('#tokens-layer .tok[data-id="p8"]'); if (!tok.querySelector('image') || tok.querySelector('image').getAttribute('href') !== TINY_PNG || !tok.textContent.includes('8')) throw new Error('token'); if (document.querySelector('#tokens-layer .tok[data-id="p22"] image') || discHtml(playerById('p22')).includes('url(')) throw new Error('unsafe photo used'); setTeamPhotos([]); renderAll(); if (document.querySelector('#tokens-layer image')) throw new Error('photo kept after clearing');  if (!discHtml({ id: 'x1', num: 5, pos: 'LAT', photo: TINY_PNG }).includes(TINY_PNG)) throw new Error('roster photo not shown'); }));
  T('tapping the armed type again disarms, another type switches', withSample(() => { setPhase('DEF'); const sub = (k) => document.querySelector(`#acts [data-panel-sub="${k}"]`); sub('LATE').click(); sub('HELP').click(); if (!ui.armedAction || ui.armedAction.sub !== 'HELP') throw new Error('no switch'); sub('HELP').click(); if (ui.armedAction || document.querySelector('.target')) throw new Error('not disarmed'); }));
  T('the actions panel fits without scrolling', withSample(() => { document.querySelector('[data-panel-mode="acts"]').click(); ['ATK', 'DEF'].forEach((ph) => { setPhase(ph); const box = $('acts').closest('.scroll'); if (box.scrollHeight > box.clientHeight) throw new Error(ph + ' scrolls by ' + (box.scrollHeight - box.clientHeight)); }); }));
  T('a pending penalty or armed action does not follow into another match', withSample(() => { setPhase('ATK'); addEvent('ACTION', { playerId: 'p8', action: 'PROV7' }); armAction('ASIST'); openSample(); if (ui.penalty || ui.armedAction || ui.armTimer || $('penalty-spot').getAttribute('visibility') === 'visible' || !$('armed-bar').hidden) throw new Error('carried over'); }));
  T('undoing the penalty shot brings the penalty back', withSample(() => { setPhase('ATK'); addEvent('ACTION', { playerId: 'p8', action: 'PROV7' }); shotFromDrag(m(0, 9), { x: 500, y: 120 }, { x: 10, y: 10 }); document.querySelector('[data-result="GOL"]').click(); if (ui.penalty) throw new Error('kept after shot'); undo(); if (!ui.penalty || ui.penalty.team !== 'us') throw new Error('not restored by undo'); redo(); if (ui.penalty) throw new Error('kept after redo'); }));
  T('undo after a manual swap leaves a consistent lineup', withSample(() => { setPhase('ATK'); addEvent('ACTION', { playerId: 'p21', action: 'ASIST' }, { bringOn: 'p21' }); const team = lineup(); team.p5 = team.p21; delete team.p21; const n = Object.keys(team).length; undo(); const spots = Object.values(lineup()).map((p) => `${p.x},${p.y}`); if (Object.keys(lineup()).length !== n || new Set(spots).size !== spots.length || !lineup().p5) throw new Error(JSON.stringify(lineup())); }));
  T('the bench note survives the action hint', withSample(() => { setPhase('ATK'); Object.keys(lineup()).filter((id) => playerById(id).pos === 'PIV').forEach((id) => delete lineup()[id]); commit(); armAction('ASIST'); tapEl(document.querySelector('.bench-player[data-id="p10"]')); if (state.events.at(-1).playerId !== 'p10' || !$('hint').textContent.includes('Arrástralo')) throw new Error('hint ' + $('hint').textContent); }));
  T('the penalty bar leaves the phase toggle free', withSample(() => { setPhase('ATK'); addEvent('ACTION', { playerId: 'p8', action: 'PROV7' }); const a = $('armed-bar').getBoundingClientRect(), b = document.querySelector('.phase').getBoundingClientRect(); const overlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom; if ($('armed-bar').hidden || !a.width) throw new Error('bar not shown'); if (overlap) throw new Error('covers the phase toggle'); }));
  T('an undo that flips the phase disarms the panel action', withSample(() => { setPhase('ATK'); addEvent('TURNOVER', { playerId: 'p8', subtype: 'Pase' }); armAction('BLOC'); undo(); if (state.phase !== 'ATK' || ui.armedAction) throw new Error('still armed in ' + state.phase); }));
  T('an automatic substitution never takes off a player serving 2 min', withSample(() => { setPhase('ATK'); addSanction('p8', '2M'); addEvent('ACTION', { playerId: 'p21', action: 'ASIST' }, { bringOn: 'p21' }); if (!lineup().p8 || !lineup().p21 || lineup().p18) throw new Error(JSON.stringify(Object.keys(lineup()))); }));
  T('players out of play do not glow', withSample(() => { setPhase('DEF'); addSanction('p5', '2M'); addSanction('p21', 'D'); document.querySelector('[data-panel-act="BLOC"]').click(); const lit = [...document.querySelectorAll('.target')].map((el) => el.dataset.id); if (lit.includes('p5') || lit.includes('p21')) throw new Error('lit ' + lit.join()); }));
  T('armed action calms down after CONFIG.armMs', withSample(() => { setPhase('DEF'); document.querySelector('[data-panel-act="BLOC"]').click(); if (!ui.armedAction || !ui.armTimer) throw new Error('not armed'); disarmAction(); if (ui.armedAction || document.querySelector('.target') || document.querySelector('#acts [aria-pressed="true"]')) throw new Error('still armed'); }));
  T('arming an action clears the armed shooter and vice versa', withSample(() => { setPhase('ATK'); armShooter('p8'); document.querySelector('[data-panel-act="ASIST"]').click(); if (ui.shooter) throw new Error('shooter kept'); armShooter('p8'); if (ui.armedAction) throw new Error('action kept'); disarm(); }));
  T('a team button shows its KPIs, Acciones goes back', withSample(() => { document.querySelector('#team-seg [data-source="US"]').click(); if ($('kpis').hidden || !$('acts').hidden || !document.querySelector('#live .kpi') || ui.source !== 'US') throw new Error('kpis'); if (document.querySelector('[data-panel-mode="acts"]').getAttribute('aria-pressed') !== 'false') throw new Error('acciones still pressed'); document.querySelector('[data-panel-mode="acts"]').click(); if (!$('kpis').hidden || $('acts').hidden) throw new Error('acts'); }));
  T('a tap without an armed action still opens the player popup', withSample(() => { setPhase('ATK'); tapEl(document.querySelector('#tokens-layer .tok[data-id="p8"]')); if ($('pop').hidden || !document.querySelector('#pop [data-arm]')) throw new Error('no popup'); }));
  T('ending the match early is not undone by the clock tick', () => { const snap = snapshot(); state.clock = { period: 2, elapsedMs: 600000, runningSince: null }; finishMatch(); checkTimers(); if (!state.finished) throw new Error('unfinished'); restore(snap); });
  T('the strip ends the match on a second tap, in either half', () => { const snap = snapshot(); state.clock = { period: 1, elapsedMs: 600000, runningSince: null }; renderAll(); const b = $('btn-finish'); if (b.textContent !== 'Finalizar') throw new Error('label ' + b.textContent); b.click(); if (state.finished || !b.classList.contains('armed') || !b.textContent.includes('Seguro')) throw new Error('first tap ended it'); b.click(); if (!state.finished || $('final').hidden || b.textContent !== 'Resumen' || b.classList.contains('armed')) throw new Error('second tap'); $('final').hidden = true; b.click(); if ($('final').hidden) throw new Error('summary not reopened'); $('final').hidden = true; restore(snap); renderAll(); });
  T('an armed «Finalizar» calms down by itself', () => { const snap = snapshot(); renderAll(); $('btn-finish').click(); if (!ui.finishArmedTimer) throw new Error('not armed'); disarmFinish(); if (ui.finishArmedTimer || $('btn-finish').textContent !== 'Finalizar' || state.finished) throw new Error('still armed'); restore(snap); renderAll(); });
  T('end of the second half opens the final summary', () => { const snap = snapshot(); state.clock = { period: 2, elapsedMs: CONFIG.halfSeconds * 1000 - 500, runningSince: Date.now() - 1000 }; checkTimers(); if (!state.finished || $('final').hidden || isRunning()) throw new Error('not finished'); if ($('final').querySelectorAll('.kpi-tile').length !== summaryKpis().length) throw new Error('kpi tiles'); if (!$('final').querySelector('details.more table')) throw new Error('detail table not folded'); const rows = [...$('final').querySelectorAll('tbody tr')].map((r) => r.children[0].textContent); ['Goles', '% de tiro', 'Paradas del portero', '7 m', 'Máximo goleador'].forEach((label) => { if (!rows.includes(label)) throw new Error('missing ' + label); }); const head = [...$('final').querySelectorAll('th')].map((t) => t.textContent); if (head[1] !== state.us || head[2] !== state.them) throw new Error('teams'); restore(snap); });
  T('end of the first half opens the half-time summary once, with key points', () => { const snap = snapshot(); state.fired = state.fired.filter((k) => k !== 'period-1'); state.clock = { period: 1, elapsedMs: CONFIG.halfSeconds * 1000 - 500, runningSince: Date.now() - 1000 }; checkTimers(); if ($('final').hidden || !$('final').textContent.includes('Descanso')) throw new Error('not opened'); if (!$('final').querySelector('.kpi-tile') || $('final').querySelectorAll('.halftime-points .keypoints').length !== 2) throw new Error('content'); $('final').hidden = true; state.clock.runningSince = Date.now() - 1000; checkTimers(); if (!$('final').hidden) throw new Error('reopened'); document.querySelector('[data-halftime]').click(); if ($('final').hidden) throw new Error('alert Resumen'); document.querySelector('[data-second-half]').click(); if (state.clock.period !== 2 || !$('final').hidden || state.alerts.some((a) => a.kind === 'period')) throw new Error('second half'); restore(snap); });
  T('summary KPIs colour our value against the rival', () => { const goals = summaryKpis()[0]; const losses = summaryKpis().find((k) => k.label === 'Pérdidas'); openHalftime(); const tiles = [...$('final').querySelectorAll('.kpi-tile')]; const toneOf = (k, tile) => tile.querySelector('.us strong').className; const expect = (k, better) => (k.us === k.them ? '' : (better ? k.us > k.them : k.us < k.them) ? 'r-good' : 'r-bad'); if (toneOf(goals, tiles[0]) !== expect(goals, true)) throw new Error('goals ' + toneOf(goals, tiles[0])); if (toneOf(losses, tiles[4]) !== expect(losses, false)) throw new Error('losses'); $('final').hidden = true; });
  T('turnovers are shown as a count, not a percentage', () => { ui.source = 'US'; renderLive(); const live = liveStats(); const tile = [...$('live').querySelectorAll('.kpi')].find((k) => k.textContent.includes('Pérdidas')); if (tile.querySelector('strong').textContent !== String(live.us.turnovers)) throw new Error('live ' + tile.textContent); const row = finalRows().find((r) => r[0] === 'Pérdidas'); if (row[1] !== live.us.turnovers || row[2] !== live.them.turnovers) throw new Error('final ' + row); if (summaryKpis().find((k) => k.label === 'Pérdidas').sub.some((t) => t.includes('%'))) throw new Error('tile sub'); ui.source = 'GK'; renderLive(); });
  T('shooter leaders: most shots, goals and misses', () => { const l = shooterLeaders(rivalShots()); if (l.scores.shooter.num !== 9 || l.shoots.shooter.num !== 9 || l.misses.shooter.num !== 7) throw new Error([l.shoots.shooter.num, l.scores.shooter.num, l.misses.shooter.num].join()); if (shooterLeaders([]).scores !== null) throw new Error('empty'); ui.sheetTab = 'gk'; ui.sheetGoal = 'GK'; renderSheet(); if (document.querySelectorAll('.shot-map').length !== 2 || !$('sheet').textContent.includes('Más falla')) throw new Error('gk tab'); });
  T('play after the final whistle does not restart the clock', () => { const snap = snapshot(); state.finished = true; pauseClock(); state.clock.elapsedMs = 0; addEvent('TURNOVER', { playerId: 'p8', subtype: 'Pasos' }); if (isRunning()) throw new Error('restarted'); restore(snap); });
  T('report e-mail addresses and mailto', () => { if (!parseEmails('a@x.es, b@y.com;c@z.org') || parseEmails('a@x.es, nope') || parseEmails('')) throw new Error('parse'); const url = mailtoUrl(['a@x.es', 'b@y.com'], ['informe.pdf']); if (!url.startsWith('mailto:a@x.es,b@y.com?subject=') || !decodeURIComponent(url).includes(finalTitle()) || !decodeURIComponent(url).includes('informe.pdf')) throw new Error(url); });
  T('invalid e-mail is refused without leaving the page', () => { const snap = snapshot(); openFinal(); $('final-email').value = 'entrenador@'; document.querySelector('[data-final-mail]').click(); if (!$('final-status').textContent.includes('válidas')) throw new Error($('final-status').textContent); restore(snap); });
  T('mvp: final screen picks, changes and clears the MVP', () => {
    const snap = snapshot(); openFinal();
    const pick = (id) => document.querySelector(`[data-mvp="${id}"]`).click();
    const [a, b] = state.players.map((p) => p.id);
    pick(a); if (state.mvpId !== a) throw new Error('pick ' + state.mvpId);
    if (document.querySelector(`[data-mvp="${a}"]`).getAttribute('aria-pressed') !== 'true' || $('final').querySelectorAll('.crown-face').length !== 1) throw new Error('crown not shown on the pick');
    if (restoreState(JSON.parse(snapshot())).mvpId !== a) throw new Error('not kept by restoreState');
    pick(a); if (state.mvpId !== null) throw new Error('clear ' + state.mvpId);
    pick(a); pick(b); if (state.mvpId !== b) throw new Error('change ' + state.mvpId);
    restore(snap);
  });
  T('mvp: picking keeps an e-mail typed but not sent', () => {
    const snap = snapshot(); openFinal();
    $('final-email').value = 'entrenador@club.es';
    document.querySelector(`[data-mvp="${state.players[0].id}"]`).click();
    if ($('final-email').value !== 'entrenador@club.es') throw new Error('typed e-mail lost: ' + $('final-email').value);
    restore(snap);
  });
  T('mvp: old saved matches restore with no MVP', () => { const saved = JSON.parse(snapshot()); delete saved.mvpId; if (restoreState(saved).mvpId !== null) throw new Error('not null'); });
  T('mvp: picking the MVP changes no statistic', () => { const snap = snapshot(); const before = JSON.stringify([liveStats(), score()]); setMvp(state.players[0].id); if (JSON.stringify([liveStats(), score()]) !== before) throw new Error('stats changed'); restore(snap); });
  T('mvp: a restarted match has no MVP', () => { const saved = JSON.parse(snapshot()); saved.mvpId = saved.players[0].id; if (restartedMatch(saved).mvpId !== null) throw new Error('MVP kept'); });
  T('crowns on screen never share gradient ids', () => { const ids = [...(crownSvg() + crownSvg('x')).matchAll(/id="([^"]+)"/g)].map((x) => x[1]); if (!ids.length || new Set(ids).size !== ids.length) throw new Error(ids.join()); });

  // ---- Drill-down: the per-match drawing helpers work over any saved state (M0c) ----
  // Runs buildPdf('players') with the drawing primitives replaced by recorders, so the player pages can be compared as data.
  const recordPlayerPages = () => {
    const saved = { pdfNewDoc, pdfHeader, pdfTable, pdfShotChart };
    const calls = [];
    const ids = (shots) => shots.map((e) => `${e.abs}:${e.zone}:${e.result}`);
    pdfNewDoc = () => ({ addPage: () => calls.push(['page']) });
    pdfHeader = (doc, title, subtitle) => calls.push(['header', title, subtitle]);
    pdfTable = (doc, opts) => { calls.push(['table', opts]); return opts.startY + 10; };
    pdfShotChart = (doc, x, y, w, shots, viewKey, dorsals = false) => { calls.push(['chart', x, y, w, ids(shots), viewKey, dorsals]); return y + 50; };
    const snap = snapshot();
    try { state = sampleState(); buildPdf('players'); } finally { ({ pdfNewDoc, pdfHeader, pdfTable, pdfShotChart } = saved); restore(snap); }
    return JSON.stringify(calls);
  };
  // Recorded from the code before the report refactor (sample match): the player pages must not change.
  const PDF_PLAYERS_SNAPSHOT = [["header","#3 Raulito","Extremo"],["chart",12,26,120,[],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","0/0","– de acierto"],["Parados",0,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",0,""],["Pérdidas",0,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",0,0,0,0,"–"],["Total",0,0,0,0,"–"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["-","Sin acciones"]],"startY":50,"left":140}],["page"],["header","#5 Marcos","Lateral"],["chart",12,26,120,[],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","0/0","– de acierto"],["Parados",0,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",0,""],["Pérdidas",1,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",0,0,0,0,"–"],["Total",0,0,0,0,"–"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Pasos",1]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["05:20","Pérdida pasos"]],"startY":50,"left":140}],["page"],["header","#8 Alex","Lateral"],["chart",12,26,120,["80:9M:GOL","690:9M:FUERA"],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","1/2","50% de acierto"],["Parados",0,"por el portero rival"],["Fallados",1,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",0,""],["Pérdidas",1,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",2,1,0,1,"50%"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",0,0,0,0,"–"],["Total",2,1,0,1,"50%"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Falta ataque",1]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["01:20","Gol 9 m"],["10:50","Pérdida falta ataque"],["11:30","Fuera 9 m"]],"startY":50,"left":140}],["page"],["header","#10 Juni","Pivote"],["chart",12,26,120,[],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","0/0","– de acierto"],["Parados",0,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",1,""],["Blocajes",0,""],["Pérdidas",0,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",0,0,0,0,"–"],["Total",0,0,0,0,"–"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["07:50","Recuperación"]],"startY":50,"left":140}],["page"],["header","#11 Bokiki","Central"],["chart",12,26,120,[],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","0/0","– de acierto"],["Parados",0,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",0,""],["Pérdidas",0,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",0,0,0,0,"–"],["Total",0,0,0,0,"–"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["-","Sin acciones"]],"startY":50,"left":140}],["page"],["header","#13 Kike","Pivote"],["chart",12,26,120,[],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","0/0","– de acierto"],["Parados",0,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",0,""],["Pérdidas",0,""],["Fallos defensivos",0,""],["Sanciones","1 2'",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",0,0,0,0,"–"],["Total",0,0,0,0,"–"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["11:40","Exclusión 2'"]],"startY":50,"left":140}],["page"],["header","#14 Achi","Pivote"],["chart",12,26,120,[],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","0/0","– de acierto"],["Parados",0,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",0,""],["Pérdidas",0,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",0,0,0,0,"–"],["Total",0,0,0,0,"–"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["-","Sin acciones"]],"startY":50,"left":140}],["page"],["header","#17 Jenny","Extremo"],["chart",12,26,120,["130:6M:PARADA","745:6M:GOL"],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","1/2","50% de acierto"],["Parados",1,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",0,""],["Pérdidas",0,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",2,1,1,0,"50%"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",0,0,0,0,"–"],["Total",2,1,1,0,"50%"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["02:10","Parada 6 m"],["12:25","Gol 6 m"]],"startY":50,"left":140}],["page"],["header","#18 Iker","Lateral"],["chart",12,26,120,["190:9M:GOL"],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","1/1","100% de acierto"],["Parados",0,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",1,""],["Pérdidas",0,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",1,1,0,0,"100%"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",0,0,0,0,"–"],["Total",1,1,0,0,"100%"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["03:10","Gol 9 m"],["12:15","Blocaje"]],"startY":50,"left":140}],["page"],["header","#19 Gonzalo","Central"],["chart",12,26,120,[],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","0/0","– de acierto"],["Parados",0,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",1,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",0,""],["Pérdidas",0,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",0,0,0,0,"–"],["Total",0,0,0,0,"–"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["06:40","Pase de gol"]],"startY":50,"left":140}],["page"],["header","#21 Jaime","Lateral"],["chart",12,26,120,["401:CONTRA:GOL"],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","1/1","100% de acierto"],["Parados",0,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",0,""],["Pérdidas",0,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",1,1,0,0,"100%"],["7 m",0,0,0,0,"–"],["Total",1,1,0,0,"100%"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["06:41","Gol Contra"]],"startY":50,"left":140}],["page"],["header","#22 Diego","Extremo"],["chart",12,26,120,["480:CONTRA:GOL"],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","1/1","100% de acierto"],["Parados",0,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",0,""],["Pérdidas",0,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",1,1,0,0,"100%"],["7 m",0,0,0,0,"–"],["Total",1,1,0,0,"100%"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["08:00","Gol Contra"]],"startY":50,"left":140}],["page"],["header","#25 Nacho","Extremo"],["chart",12,26,120,[],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","0/0","– de acierto"],["Parados",0,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",0,""],["Pérdidas",0,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",0,0,0,0,"–"],["Total",0,0,0,0,"–"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["-","Sin acciones"]],"startY":50,"left":140}],["page"],["header","#77 Sergio","Lateral"],["chart",12,26,120,["590:7M:GOL"],"US",false],["table",{"head":["Dato","Valor",""],"body":[["Goles","1/1","100% de acierto"],["Parados",0,"por el portero rival"],["Fallados",0,"fuera · palo · bloqueado"],["Pases de gol",0,""],["Provoca 7 m",0,""],["Recuperaciones",0,""],["Blocajes",0,""],["Pérdidas",0,""],["Fallos defensivos",0,""],["Sanciones","–",""]],"startY":30,"left":140,"width":69.5}],["table",{"title":"Por zona","head":["Zona","Lanz.","Goles","Parados","Fallados","% gol"],"body":[["6 m",0,0,0,0,"–"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",1,1,0,0,"100%"],["Total",1,1,0,0,"100%"]],"startY":30,"left":215.5,"width":69.5}],["table",{"title":"Pérdidas por tipo","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":140,"width":69.5}],["table",{"title":"Fallos defensivos","head":["Tipo","N"],"body":[["Ninguno",0]],"startY":40,"left":215.5,"width":69.5}],["table",{"title":"Cronología","head":["Min","Acción"],"body":[["09:50","Gol 7 m"]],"startY":50,"left":140}],["page"],["header","#1 Jose","Portero"],["chart",12,26,120,["45:9M:GOL","160:6M:PARADA","230:6M:GOL","350:9M:GOL","450:9M:PARADA","540:7M:GOL","630:6M:PARADA","670:9M:FUERA","720:6M:GOL"],"GK",true],["table",{"head":["Dato","Valor",""],"body":[["Paradas","38%","3/8 a puerta"],["Detenidos",3,""],["Encajados",5,""],["Fuera · palo · bloq.",1,"sin ir a puerta"],["7 m parados","0/1",""]],"startY":30,"left":140}],["table",{"title":"Por zona de lanzamiento","head":["Zona","Recibidos","A puerta","Detenidos","Encajados","% paradas"],"body":[["6 m",4,4,2,2,"50%"],["9 m",3,2,1,1,"50%"],["+11 m",0,0,0,0,"–"],["Contra",1,1,0,1,"0%"],["7 m",1,1,0,1,"0%"],["Total",9,8,3,5,"38%"]],"startY":40,"left":140}],["table",{"title":"Detenidos (vista del lanzador)","head":["","Izq.","Centro","Der."],"body":[["Arriba",1,0,0],["Medio",0,1,0],["Abajo",1,0,0]],"startY":50,"left":140,"width":69.5}],["table",{"title":"Encajados (vista del lanzador)","head":["","Izq.","Centro","Der."],"body":[["Arriba",1,0,2],["Medio",0,0,0],["Abajo",1,0,1]],"startY":50,"left":215.5,"width":69.5}],["page"],["header","#12 Verdugo","Portero"],["chart",12,26,120,[],"GK",true],["table",{"head":["Dato","Valor",""],"body":[["Paradas","–","0/0 a puerta"],["Detenidos",0,""],["Encajados",0,""],["Fuera · palo · bloq.",0,"sin ir a puerta"],["7 m parados","0/0",""]],"startY":30,"left":140}],["table",{"title":"Por zona de lanzamiento","head":["Zona","Recibidos","A puerta","Detenidos","Encajados","% paradas"],"body":[["6 m",0,0,0,0,"–"],["9 m",0,0,0,0,"–"],["+11 m",0,0,0,0,"–"],["Contra",0,0,0,0,"–"],["7 m",0,0,0,0,"–"],["Total",0,0,0,0,"–"]],"startY":40,"left":140}],["table",{"title":"Detenidos (vista del lanzador)","head":["","Izq.","Centro","Der."],"body":[["Arriba",0,0,0],["Medio",0,0,0],["Abajo",0,0,0]],"startY":50,"left":140,"width":69.5}],["table",{"title":"Encajados (vista del lanzador)","head":["","Izq.","Centro","Der."],"body":[["Arriba",0,0,0],["Medio",0,0,0],["Abajo",0,0,0]],"startY":50,"left":215.5,"width":69.5}]];
  // A different match from the sample: shifted dorsals, other team names and other events (shots, a turnover, a 2 min with its early
  // return, a rival sanction), so a helper that reads the global state instead of its argument gives a different answer.
  const SHIFTED_DORSAL = 100;
  const OTHER_MATCH_SANCTION_ID = 'other-sanction';
  const otherMatch = () => {
    const s = sampleState();
    s.players.forEach((p) => { p.num += SHIFTED_DORSAL; });
    s.rivals.forEach((r) => { r.num += SHIFTED_DORSAL; });
    s.us = 'Otro club'; s.them = 'Visitante';
    const ownShot = s.events.find((e) => e.kind === 'SHOT' && e.playerId === 'p8');
    const keeperShot = s.events.find((e) => e.kind === 'RIVAL_SHOT' && e.gkId === 'p1');
    const extra = [
      { ...ownShot, id: 'o1', abs: 900, result: 'FUERA' }, { ...ownShot, id: 'o2', abs: 910, result: 'PARADA' },
      { ...keeperShot, id: 'o3', abs: 920, result: 'PARADA', rivalId: 'r7' },
      { id: 'o4', abs: 930, kind: 'TURNOVER', playerId: 'p8', subtype: 'Pasos' },
      { id: OTHER_MATCH_SANCTION_ID, abs: 940, kind: 'SANCTION', playerId: 'p8', card: '2M' },
      { id: 'o5', abs: 950, kind: 'EXCLUSION_END', sanctionId: OTHER_MATCH_SANCTION_ID },
      { id: 'o6', abs: 960, kind: 'RIVAL_SANCTION', rivalId: 'r7', card: '2M' }
    ];
    s.events = [...s.events.filter((e) => e.playerId !== 'p8' && e.gkId !== 'p1'), ...extra];
    return s;
  };
  // Renders with `draw(s)` over the live state, then over the other match passed as the argument while the global state is the sample.
  const overSavedState = (draw) => {
    const snap = snapshot();
    try {
      const saved = otherMatch();
      state = JSON.parse(JSON.stringify(saved)); const live = draw(state);
      state = sampleState(); const viaArgument = draw(JSON.parse(JSON.stringify(saved))); const sampleOwn = draw(state);
      return { live, viaArgument, sampleOwn };
    } finally { restore(snap); }
  };
  T('shot map: pure over a saved state equals the live one', () => {
    const { live, viaArgument, sampleOwn } = overSavedState((s) => [['US', ourShots(s.events)], ['GK', rivalShots(s.events)]].map(([view, shots]) => shotMapSvg(shots, view, null, { s })).join(''));
    if (!/class="map-dorsal"[^>]*>1\d\d</.test(live)) throw new Error('the shifted dorsals are not drawn');
    if (live !== viaArgument) throw new Error('the map read the global state');
    if (live === sampleOwn) throw new Error('the check cannot tell the two states apart');
  });
  T('shot map: custom colours replace the view colours', () => {
    const shots = ourShots().slice(0, 1);
    const svg = shotMapSvg(shots, 'US', null, { colours: { GOL: '#123456', PARADA: '#123456', FALLO: '#123456' } });
    if (!svg.includes('#123456') || svg.includes(MAP_VIEWS.US.colors[groupOf(shots[0].result)])) throw new Error('colours ignored');
  });
  T('player figures: pure over a saved state equals the live one', () => {
    const { live, viaArgument, sampleOwn } = overSavedState((s) => JSON.stringify(s.players.map((p) => playerFigures(p, s))) + JSON.stringify(eventsOf('p8', s.events)));
    if (live !== viaArgument) throw new Error('the figures read the global state');
    if (live === sampleOwn) throw new Error('the check cannot tell the two states apart');
  });
  T('player report: pure over a saved state, keeper and field player', () => {
    const describedBy = (s) => ['EXCLUSION_END', 'RIVAL_SANCTION'].map((kind) => { const e = s.events.find((x) => x.kind === kind); return e ? describe(e, s) : null; });
    const { live, viaArgument, sampleOwn } = overSavedState((s) => JSON.stringify([...['p8', 'p1'].map((id) => playerReport(playerById(id, s), s)), describedBy(s)]));
    if (live !== viaArgument) throw new Error('the report read the global state');
    const [field, keeper, described] = JSON.parse(live);
    if (described[0] !== `Vuelve antes de su 2' · #108 Alex` || described[1] !== `Visitante #107 Pérez: Exclusión 2'`) throw new Error('describe ' + JSON.stringify(described));
    if (field.shots.length !== 2 || field.timeline.length !== 4) throw new Error('events of the other match ' + live);
    if (field.keeper || !keeper.keeper || field.zoneHead[1] !== 'Lanz.' || keeper.zoneHead[1] !== 'Recibidos') throw new Error('shape');
    if (!field.timeline.length || !field.timeline.every(([clock, text]) => clock && text && !text.includes(' ·'))) throw new Error('timeline ' + JSON.stringify(field.timeline));
    if (live === sampleOwn) throw new Error('the check cannot tell the two states apart');
  });
  T('pdf: player pages unchanged after the report refactor', () => {
    const now = recordPlayerPages();
    if (now !== JSON.stringify(PDF_PLAYERS_SNAPSHOT)) { const i = [...now].findIndex((c, k) => c !== JSON.stringify(PDF_PLAYERS_SNAPSHOT)[k]); throw new Error('differs at ' + i + ': ' + now.slice(i - 60, i + 60)); }
  });
  // ---- Accounts, team and saved matches (device backend; Supabase mapping through a fake client) ----
  const TA = async (name, fn) => { try { await fn(); __results.push('OK ' + name); } catch (e) { __results.push('FAIL ' + name + ': ' + (e && e.message || e) + ' ' + ((e && e.stack) || '').split('\n')[1]); } };
  const tick0 = () => new Promise((r) => setTimeout(r, 0));
  const accountTests = async () => {
    await TA('design: theme switch suppresses transitions for two frames', async () => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
      const switchStyle = () => document.getElementById('theme-switch-style');
      const before = currentTheme();
      $('btn-theme').click();
      try {
        if (!switchStyle() || !/transition:\s*none\s*!important/.test(switchStyle().textContent)) throw new Error('no suppression right after the switch');
        await frame();
        if (!switchStyle()) throw new Error('removed after one frame');
        await frame();
        if (switchStyle()) throw new Error('still there after two frames');
      } finally { applyTheme(before); }
    });
    await TA('home opens on team creation when the device has no team', async () => { await startHome(); if (home.view !== 'team-new' || $('home').hidden || !document.querySelector('[data-form="team-new"]')) throw new Error(home.view); });
    await TA('create team: name, colours and initials crest applied', async () => { $('team-club').value = 'CB Ejemplo'; $('team-name').value = 'Ejemplo Sur'; $('team-brand').value = '#1d4ed8'; $('team-brand2').value = '#facc15'; await submitTeam(document.querySelector('[data-form="team-new"]'), true); if (home.view !== 'team' || team.name !== 'Ejemplo Sur' || !team.id) throw new Error(home.view + ' ' + team.name); if (getComputedStyle($('score-us')).color !== 'rgb(29, 78, 216)') throw new Error('score colour ' + getComputedStyle($('score-us')).color); if (PDF_RGB.brand.join() !== '29,78,216' || team.brandInk !== '#ffffff') throw new Error('pdf/ink'); if (!decodeURIComponent($('bar-crest').src).includes('>ES<')) throw new Error('initials'); if (inkFor('#facc15') !== '#151515') throw new Error('ink for light'); });
    await TA('team form refuses empty names', async () => { showHomeView('team-edit'); $('team-name').value = '  '; await submitTeam(document.querySelector('[data-form="team"]'), false); if (team.name !== 'Ejemplo Sur' || !$('home-status').textContent.includes('vacíos')) throw new Error($('home-status').textContent); });
    await TA('team roster: add, position, duplicate dorsal refused, retire', async () => { showHomeView('team-edit'); await addTeamPlayer(); await addTeamPlayer(); await addTeamPlayer(); const [a, b, c] = home.roster; await saveTeamPlayer(a, { pos: 'POR', name: 'Ana' }); if (rosterPlayer(a.id).pos !== 'POR') throw new Error('pos'); await saveTeamPlayer(rosterPlayer(b.id), { num: a.num }); if (rosterPlayer(b.id).num === a.num || !$('home-status').textContent.includes('ya está')) throw new Error('dup'); document.querySelector(`[data-team-del="${c.id}"]`).click(); if (!rosterPlayer(c.id)) throw new Error('retired on first tap'); document.querySelector(`[data-team-del="${c.id}"]`).click(); await tick0(); await tick0(); if (rosterPlayer(c.id)) throw new Error('not retired'); const listed = await backend.listPlayers(team.id); if (listed.length !== 2) throw new Error('backend ' + listed.length); });
    await TA('roster file adds new dorsals and updates existing ones', async () => { const a = home.roster.find((p) => p.pos === 'POR'); const file = new File([JSON.stringify({ format: ROSTER_FORMAT, players: [{ num: a.num, name: 'Ana Ruiz', pos: 'POR' }, { num: 9, name: 'Lola', pos: 'CEN' }, { num: 11, name: 'Marta', pos: 'EXT' }, { num: 12, name: 'Sara', pos: 'POR' }] })], 'p.json', { type: 'application/json' }); await importTeamRoster(file); if (home.roster.length !== 5 || rosterPlayer(a.id).name !== 'Ana Ruiz') throw new Error(home.roster.map((p) => p.num + p.name).join()); });
    // ---- Season data layer ----
    const seasonShot = (playerId, result, zone = '9M') => ({ id: newId('e'), abs: 10, kind: 'SHOT', playerId, zone, from: zone, result });
    const seasonRivalShot = (gkId, result) => ({ id: newId('e'), abs: 20, kind: 'RIVAL_SHOT', gkId, zone: '9M', result });
    const seasonPlayers = [{ id: 'sp1', num: 1, name: 'Gk', pos: 'POR' }, { id: 'sp2', num: 2, name: 'Wing', pos: 'EXT' }];
    const seasonState = (over) => ({ sample: false, setupDone: true, finished: true, date: '2026-10-01', them: 'Rival', venue: '', players: seasonPlayers, events: [], ...over });
    const seasonRow = (id, over) => { const s = seasonState(over); return { ...matchSummary(id, s), state: s }; };
    await TA('season: local backend lists match states with their summary', async () => {
      const local = localBackend();
      const a = seasonState({ them: 'A', events: [seasonShot('sp2', 'GOL')] }), b = seasonState({ them: 'B', events: [seasonRivalShot('sp1', 'PARADA')] });
      for (const [teamId, id, st] of [['season-team', 'sm1', a], ['season-team', 'sm2', b], ['other-team', 'sm3', a]]) { await local.saveMatch(teamId, id, st); writeJson(MATCH_KEY_PREFIX + id, { id, teamId, state: st, dirty: false }); }
      try {
        const listed = await local.listMatchStates('season-team');
        if (listed.length !== 2 || !listed.every((x) => Array.isArray(x.state.events) && x.state.events.length === 1)) throw new Error(JSON.stringify(listed.map((x) => x.id)));
        const first = listed.find((x) => x.id === 'sm1');
        if (first.them !== 'A' || first.status !== 'finished' || first.scoreUs !== 1) throw new Error(JSON.stringify(first));
      } finally { for (const id of ['sm1', 'sm2', 'sm3']) { await local.deleteMatch(id); removeKey(MATCH_KEY_PREFIX + id); } }
    });
    await TA('season: only live and finished matches, sample excluded, local changes merged', async () => {
      const real = backend, savedId = team.id;
      team.id = 'season-team';
      const dirtyId = 'sm-dirty';
      try {
        backend = { listMatchStates: async () => [
          seasonRow('s-old', { date: '2026-09-01' }), seasonRow('s-live', { date: '2026-09-15', finished: false, events: [seasonShot('sp2', 'GOL')] }),
          seasonRow('s-setup', { date: '2026-09-20', setupDone: false }), seasonRow('s-sample', { date: '2026-09-25', sample: true }), seasonRow(dirtyId, { date: '2026-09-02', them: 'Old copy' })
        ] };
        storeLocalMatch(dirtyId, seasonState({ date: '2026-10-05', them: 'New copy' }), true);
        const { matches, offline } = await loadSeason();
        const ids = matches.map((x) => x.id).join();
        if (offline || ids !== `${dirtyId},s-live,s-old` || home.season !== matches) throw new Error(ids + ' offline ' + offline);
        if (matches[0].them !== 'New copy' || !matches[0].state) throw new Error('local copy not merged');
      } finally { backend = real; team.id = savedId; removeKey(MATCH_KEY_PREFIX + dirtyId); }
    });
    await TA('season: no coverage builds the season from device copies, none gives an empty season, offline', async () => {
      const real = backend, savedId = team.id;
      team.id = 'season-empty-team';
      try {
        backend = { listMatchStates: async () => { throw new Error('Failed to fetch'); } };
        const none = await loadSeason();
        if (none.matches.length || !none.offline || home.season.length) throw new Error(none.matches.length + ' ' + none.offline);
        writeJson(MATCH_KEY_PREFIX + 'sd1', { id: 'sd1', teamId: team.id, state: seasonState({ date: '2026-09-01' }), dirty: false });
        writeJson(MATCH_KEY_PREFIX + 'sd2', { id: 'sd2', teamId: team.id, state: seasonState({ date: '2026-09-08', setupDone: false }), dirty: false });
        writeJson(MATCH_KEY_PREFIX + 'sd3', { id: 'sd3', teamId: 'other-team', state: seasonState(), dirty: false });
        const copies = await loadSeason();
        if (!copies.offline || copies.matches.map((x) => x.id).join() !== 'sd1' || !copies.matches[0].state) throw new Error(copies.matches.map((x) => x.id).join());
      } finally { backend = real; team.id = savedId; ['sd1', 'sd2', 'sd3'].forEach((id) => removeKey(MATCH_KEY_PREFIX + id)); }
    });
    await TA('season: rows without a state are skipped, not fatal', async () => {
      const real = backend, savedId = team.id;
      team.id = 'season-null-team';
      try {
        backend = { listMatchStates: async () => [seasonRow('n-ok', { date: '2026-09-01' }), { ...seasonRow('n-bad', { date: '2026-09-02' }), state: null }] };
        const online = await loadSeason();
        if (online.matches.map((x) => x.id).join() !== 'n-ok') throw new Error(online.matches.map((x) => x.id).join());
        const local = localBackend();
        for (const [id, st] of [['nl1', seasonState()], ['nl2', null]]) { await local.saveMatch(team.id, id, seasonState()); writeJson(MATCH_KEY_PREFIX + id, { id, teamId: team.id, state: st, dirty: false }); }
        const listed = await local.listMatchStates(team.id);
        if (listed.map((x) => x.id).join() !== 'nl1') throw new Error('local ' + listed.map((x) => x.id).join());
        backend = { listMatchStates: async () => { throw new Error('Failed to fetch'); } };
        const offline = await loadSeason();
        if (offline.matches.map((x) => x.id).join() !== 'nl1') throw new Error('offline ' + offline.matches.map((x) => x.id).join());
      } finally { backend = real; team.id = savedId; for (const id of ['nl1', 'nl2']) { await localBackend().deleteMatch(id); removeKey(MATCH_KEY_PREFIX + id); } }
    });
    T('team page styles do not leak into the live match KPI strip and chips', () => {
      const probe = document.createElement('div');
      probe.innerHTML = '<div class="kpis"><div class="kpi"><strong>1</strong></div><div class="kpi"></div><div class="kpi"></div></div><button class="chip" type="button" aria-pressed="true">x</button>';
      document.body.appendChild(probe);
      try {
        const strip = getComputedStyle(probe.querySelector('.kpis')), tile = getComputedStyle(probe.querySelector('.kpi')), chip = getComputedStyle(probe.querySelector('.chip'));
        if (strip.gridTemplateColumns.split(' ').length !== 3 || strip.columnGap !== '6px' || strip.paddingLeft !== '10px') throw new Error('kpis ' + strip.gridTemplateColumns + ' ' + strip.columnGap + ' ' + strip.paddingLeft);
        if (tile.textAlign !== 'center' || tile.paddingTop !== '6px' || tile.paddingLeft !== '4px') throw new Error('kpi ' + tile.textAlign + ' ' + tile.padding);
        if (chip.minHeight !== '40px' || chip.borderTopLeftRadius !== '20px' || chip.paddingLeft !== '14px') throw new Error('chip ' + chip.minHeight + ' ' + chip.borderTopLeftRadius + ' ' + chip.paddingLeft);
      } finally { probe.remove(); }
    });
    T('season: team record uses finished matches only', () => {
      const finished = seasonRow('f1', { events: [seasonShot('sp2', 'GOL')] }), live = seasonRow('l1', { finished: false, events: [seasonShot('sp2', 'FALLO')] });
      finished.scoreUs = 28; finished.scoreThem = 23; live.scoreUs = 3; live.scoreThem = 5;
      const t = teamSeason([live, finished]);
      if (t.won !== 1 || t.lost !== 0 || t.drawn !== 0 || t.played !== 1 || t.goalsFor !== 31 || t.goalsAgainst !== 28) throw new Error(JSON.stringify(t));
      if (t.form.join() !== 'G' || t.latest !== finished || t.shots !== 2 || t.shotGoals !== 1) throw new Error(JSON.stringify(t));
      if (matchResult({ scoreUs: 20, scoreThem: 20 }) !== 'E' || matchResult({ scoreUs: 1, scoreThem: 2 }) !== 'P') throw new Error('result');
      if (teamSeason([]).latest !== null) throw new Error('latest of an empty season');
    });
    T('season: player rows skip matches without the player and count MVPs', () => {
      const wing = seasonPlayers[1];
      const withPlayer = seasonRow('p1', { mvpId: 'sp2', events: [seasonShot('sp2', 'GOL'), seasonShot('sp2', 'PARADA'), { id: 'x', abs: 1, kind: 'ACTION', playerId: 'sp2', action: 'FALTA' }, { id: 'y', abs: 2, kind: 'SANCTION', playerId: 'sp2', card: '2M' }] });
      const without = seasonRow('p2', { players: [seasonPlayers[0]] });
      const season = playerSeason([without, withPlayer], wing);
      const [row] = season.rows;
      if (season.rows.length !== 1 || season.mvps !== 1 || !row.mvp) throw new Error(JSON.stringify(season));
      if (row.goals !== 1 || row.shots !== 2 || row.faults !== 2 || row.shotsList.length !== 2 || season.totals.goals !== 1 || season.totals.faults !== 2) throw new Error(JSON.stringify(row));
      if (playerMatchRow(without, wing) !== null) throw new Error('row for a missing player');
    });
    T('season: goalkeeper row counts saves and on-target rival shots', () => {
      const gk = seasonPlayers[0];
      const match = seasonRow('g1', { events: [seasonRivalShot('sp1', 'PARADA'), seasonRivalShot('sp1', 'PARADA'), seasonRivalShot('sp1', 'GOL'), seasonRivalShot('sp1', 'FUERA'), seasonRivalShot('other', 'PARADA')] });
      const season = playerSeason([match], gk);
      const [row] = season.rows;
      if (row.saves !== 2 || row.onTarget !== 3 || row.facedList.length !== 4 || 'shots' in row || season.totals.saves !== 2 || season.totals.onTarget !== 3) throw new Error(JSON.stringify(row));
    });
    const seasonTurnovers = () => ({ id: newId('e'), abs: 30, kind: 'TURNOVER', playerId: 'sp2', subtype: 'Pase' });
    T('season: player rows count blocks, 7 m provoked, recoveries and turnovers', () => {
      const action = (name, n) => Array.from({ length: n }, () => ({ id: newId('e'), abs: 5, kind: 'ACTION', playerId: 'sp2', action: name }));
      const match = seasonRow('pr1', { events: [...action('BLOC', 2), ...action('PROV7', 3), ...action('RECUP', 4), seasonTurnovers(), seasonTurnovers()] });
      const season = playerSeason([match], seasonPlayers[1]), [row] = season.rows;
      if (row.blocks !== 2 || row.prov7 !== 3 || row.recoveries !== 4 || row.turnovers !== 2) throw new Error(JSON.stringify(row));
      const t = season.totals;
      if (t.blocks !== 2 || t.prov7 !== 3 || t.recoveries !== 4 || t.turnovers !== 2) throw new Error(JSON.stringify(t));
    });
    T('season: team totals count turnovers, recoveries and saves', () => {
      const recovery = { id: newId('e'), abs: 5, kind: 'ACTION', playerId: 'sp2', action: 'RECUP' };
      const a = seasonRow('tt1', { events: [seasonTurnovers(), recovery, seasonRivalShot('sp1', 'PARADA'), seasonRivalShot('sp1', 'GOL')] });
      const b = seasonRow('tt2', { events: [seasonTurnovers(), seasonTurnovers(), recovery, recovery, seasonRivalShot('sp1', 'PARADA'), seasonRivalShot('sp1', 'FUERA')] });
      const t = teamSeason([a, b]);
      if (t.turnovers !== 3 || t.recoveries !== 3 || t.saves !== 2 || t.onTarget !== 3) throw new Error(JSON.stringify(t));
    });
    T('zones: lane and ring from the origin, 7 m and counters apart', () => {
      const shot = (over) => ({ kind: 'SHOT', from: '9M', zone: '9M', origin: m(0, 10), ...over });
      const zones = [shotZone(shot({ origin: m(-8, 2) })), shotZone(shot()), shotZone(shot({ from: '7M', zone: '7M' })), shotZone(shot({ zone: 'CONTRA' }))];
      if (zones.join() !== 'EXT_I:near,CEN:far,P7,CONTRA') throw new Error(zones.join());
      const rival = (over) => ({ kind: 'RIVAL_SHOT', zone: '9M', contra: false, origin: m(0, 10), ...over });
      const theirs = [shotZone(rival({ zone: '7M' })), shotZone(rival({ contra: true })), shotZone(rival({ origin: m(8, 4) }))];
      if (theirs.join() !== 'P7,CONTRA,EXT_D:near') throw new Error(theirs.join());
    });
    T('zones: a shot without origin is skipped by the map', () => {
      const lost = { kind: 'SHOT', from: '9M', zone: '9M', result: 'GOL' };
      if (shotZone(lost) !== ZONE_UNKNOWN || shotZone({ kind: 'RIVAL_SHOT', zone: '9M', contra: false, result: 'GOL' }) !== ZONE_UNKNOWN) throw new Error('zone ' + shotZone(lost));
      const rates = zoneRates([lost], (e) => e.result === 'GOL');
      if (rates.size !== 1 || JSON.stringify(rates.get(ZONE_UNKNOWN)) !== '{"ok":1,"n":1}') throw new Error(JSON.stringify([...rates]));
      const svg = zoneMapSvg([lost], () => true, { GOL: 'x', PARADA: 'x', FALLO: 'x' });
      if (/class="zone-(pct|n|dot)"/.test(svg) || /NaN|undefined/.test(svg)) throw new Error('the map drew a shot without origin');
    });
    T('zones: rates count shots on target unless told to count every shot', () => {
      const shots = ['GOL', 'PARADA', 'FUERA', 'PALO'].map((result) => ({ kind: 'SHOT', from: '9M', zone: '9M', origin: m(0, 10), target: gf(0.1, 0.1), result }));
      const rates = zoneRates(shots, (e) => e.result === 'GOL');
      if (rates.size !== 1 || JSON.stringify(rates.get('CEN:far')) !== '{"ok":1,"n":2}') throw new Error(JSON.stringify([...rates]));
      const every = zoneRates(shots, (e) => e.result === 'GOL', anyShot);
      if (JSON.stringify(every.get('CEN:far')) !== '{"ok":1,"n":4}') throw new Error('all shots ' + JSON.stringify([...every]));
      const grid = goalRates([...shots, { ...shots[0], target: { x: 0, y: 0 } }], (e) => e.result === 'GOL');
      if (grid.length !== GOAL_GRID || JSON.stringify(grid[0][0]) !== '{"ok":1,"n":2}' || grid.flat().reduce((n, c) => n + c.n, 0) !== 2) throw new Error(JSON.stringify(grid));
    });
    const RADAR_KEYS = { field: 'pct,goals,assists,prov7,recoveries,blocks,security,discipline', keeper: 'pct,near,far,p7,contra,assists' };
    const bestOf = (keys, value) => Object.fromEntries(keys.split(',').map((k) => [k, value]));
    T('radar: fractions against the team best, inverted axes', () => {
      const lost = () => seasonRow(newId('r'), { events: [seasonTurnovers(), seasonTurnovers(), seasonShot('sp2', 'GOL')] });
      const season = playerSeason([lost(), lost()], seasonPlayers[1]);
      const axes = fieldRadar(season, bestOf(RADAR_KEYS.field, 4));
      if (axes.map((a) => a.key).join() !== RADAR_KEYS.field) throw new Error(axes.map((a) => a.key).join());
      const by = Object.fromEntries(axes.map((a) => [a.key, a]));
      if (by.security.value !== 2 || by.security.fraction !== 0.5 || by.goals.value !== 1 || by.goals.fraction !== 0.25 || by.pct.value !== 1 || by.pct.fraction !== 0.25) throw new Error(JSON.stringify(axes));
      if (axes.map((a) => a.group).join() !== 'act-good,act-good,act-good,act-good,act-def,act-def,act-bad,act-rule') throw new Error('groups');
      if (fieldRadar(season, bestOf(RADAR_KEYS.field, 0)).find((a) => a.key === 'security').fraction !== 1) throw new Error('best 0');
      if (fieldRadar(season, bestOf(RADAR_KEYS.field, 0.5)).find((a) => a.key === 'goals').fraction !== 1) throw new Error('not clamped');
      const empty = fieldRadar(playerSeason([], seasonPlayers[1]), bestOf(RADAR_KEYS.field, 4));
      if (empty.some((a) => Number.isNaN(a.value) || Number.isNaN(a.fraction)) || empty.find((a) => a.key === 'security').fraction !== 1 || empty.find((a) => a.key === 'goals').fraction !== 0) throw new Error(JSON.stringify(empty));
    });
    const faced = (result, over) => ({ ...seasonRivalShot('sp1', result), origin: m(0, 10), target: gf(0.5, 0.5), ...over });
    T('radar: keeper axes and groups', () => {
      const match = seasonRow(newId('k'), { events: [faced('PARADA'), faced('GOL'), faced('PARADA', { zone: '7M', origin: m(0, 7) }), faced('GOL', { contra: true }), faced('PARADA', { origin: m(-2, 3) })] });
      const axes = keeperRadar(playerSeason([match], seasonPlayers[0]), bestOf(RADAR_KEYS.keeper, 1));
      const by = Object.fromEntries(axes.map((a) => [a.key, a]));
      if (axes.map((a) => a.key).join() !== RADAR_KEYS.keeper || axes.map((a) => a.group).join() !== 'act-def,act-def,act-def,act-rule,act-bad,act-good') throw new Error(JSON.stringify(axes));
      if (by.pct.value !== 0.6 || by.far.value !== 0.5 || by.near.value !== 1 || by.p7.value !== 1 || by.contra.value !== 0 || by.assists.value !== 0) throw new Error(JSON.stringify(axes));
      if (keeperRadar(playerSeason([], seasonPlayers[0]), bestOf(RADAR_KEYS.keeper, 1)).some((a) => a.fraction !== 0)) throw new Error('empty keeper');
    });
    T('radar: team best ignores players missing from the roster', () => {
      const stranger = { id: 'sp9', num: 9, name: 'Left', pos: 'EXT' };
      const match = seasonRow(newId('b'), { players: [...seasonPlayers, stranger], events: [seasonShot('sp2', 'GOL'), seasonShot('sp9', 'GOL'), seasonShot('sp9', 'GOL'), seasonTurnovers(), faced('PARADA')] });
      const best = teamBest([match], seasonPlayers);
      if (Object.keys(best.field).join() !== RADAR_KEYS.field || Object.keys(best.keeper).join() !== RADAR_KEYS.keeper) throw new Error(JSON.stringify(best));
      if (best.field.goals !== 1 || best.field.security !== 1 || best.keeper.pct !== 1) throw new Error(JSON.stringify(best));
      const none = teamBest([match], []);
      if (Object.values(none.field).some((v) => v !== 0) || Object.values(none.keeper).some((v) => v !== 0)) throw new Error('empty roster');
    });
    T('radar: shooting axis falls back when nobody reaches the minimum shots', () => {
      if (CONFIG.leaders.minShots !== 3) throw new Error('premise: minimum shots ' + CONFIG.leaders.minShots);
      const second = { id: 'sp3', num: 3, name: 'Back', pos: 'LAT' };
      const match = seasonRow(newId('f'), { players: [...seasonPlayers, second], events: [seasonShot('sp2', 'GOL'), seasonShot('sp2', 'FALLO'), seasonShot('sp3', 'FALLO')] });
      const best = teamBest([match], [...seasonPlayers, second]);
      if (best.field.pct !== 0.5) throw new Error('fallback ' + best.field.pct);
      const enough = seasonRow(newId('f'), { players: [...seasonPlayers, second], events: [seasonShot('sp3', 'GOL'), seasonShot('sp3', 'FALLO'), seasonShot('sp3', 'FALLO'), seasonShot('sp2', 'GOL')] });
      if (teamBest([enough], [...seasonPlayers, second]).field.pct !== 1 / 3) throw new Error('a one-shot 100% beat the qualified players');
    });
    T('radar: rate colour runs red to amber to green over the theme tokens', () => {
      const [low, mid, high] = [rateColour(0), rateColour(0.5), rateColour(1)];
      if (!low.startsWith('color-mix(in srgb') || !low.includes('var(--act-bad)') || !mid.includes('var(--dos)') || !high.includes('var(--act-good)')) throw new Error([low, mid, high].join(' | '));
      if (rateColour(-3) !== low || rateColour(7) !== high) throw new Error('not clamped');
    });
    const chartAxes = (label) => ['act-good', 'act-good', 'act-def', 'act-bad', 'act-rule'].map((group, i) => ({ key: `k${i}`, label: i ? `Eje ${i}` : label, value: i, text: `${i},5`, fraction: i / 4, group }));
    const countOf = (svg, re) => (svg.match(re) || []).length;
    T('charts: radar labels every axis with its value and colour', () => {
      const svg = radarSvg(chartAxes('Acierto'), '72%', 'Nota');
      if (countOf(svg, /<text/g) !== 5 * 2 + 2) throw new Error(`texts ${countOf(svg, /<text/g)}`);
      if (countOf(svg, /stroke="var\(--act-good\)"/g) !== 2 || countOf(svg, /fill="var\(--act-good\)"/g) !== 2) throw new Error('good spokes and dots');
      ['var(--act-def)', 'var(--act-bad)', 'var(--act-rule)'].forEach((c) => { if (!svg.includes(`stroke="${c}"`) || !svg.includes(`fill="${c}"`)) throw new Error(`no ${c}`); });
      if (!svg.includes('>72%<') || !svg.includes('>Nota<') || !svg.includes('>Acierto<') || !svg.includes('>3,5<')) throw new Error('texts missing');
      if (/NaN|undefined/.test(svg)) throw new Error('bad coordinates');
      const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/), xs = [...svg.matchAll(/<text[^>]* x="(-?[\d.]+)"/g)].map((x) => +x[1]);
      if (!vb || xs.some((x) => x < 0 || x > +vb[1])) throw new Error('label outside the viewBox');
    });
    const chartShot = (over) => ({ kind: 'SHOT', from: '9M', zone: '9M', origin: m(0, 10), target: gf(0.5, 0.5), result: 'GOL', ...over });
    T('charts: zone map labels only zones with shots and skips 7 m and counters', () => {
      const colours = { GOL: 'var(--c-gol)', PARADA: 'var(--c-parada)', FALLO: 'var(--c-fallo)' };
      const list = [chartShot(), chartShot({ result: 'PARADA' }), chartShot({ origin: m(-5, 6), result: 'GOL' }), chartShot({ from: '7M', zone: '7M', origin: m(0, 7) }), chartShot({ zone: 'CONTRA' }), chartShot({ origin: m(6, 10), result: 'FUERA' })];
      const svg = zoneMapSvg(list, (e) => e.result === 'GOL', colours);
      if (countOf(svg, /class="zone-pct"/g) !== 2 || countOf(svg, /class="zone-n"/g) !== 2) throw new Error('labels ' + countOf(svg, /class="zone-pct"/g));
      if (!svg.includes('>50%<') || !svg.includes('>1/2<') || !svg.includes('>100%<') || !svg.includes('>1/1<')) throw new Error('rates');
      if (countOf(svg, /class="zone-dot"/g) !== 4 || !svg.includes('fill="var(--c-gol)"') || !svg.includes('fill="var(--c-fallo)"')) throw new Error('dots');
      if (countOf(svg, /class="lane-divider"[^>]*stroke="var\(--[\w-]+\)"[^>]*stroke-dasharray/g) !== LANES.length - 1) throw new Error('lane dividers');
      LANES.forEach((l) => { if (!svg.includes(`>${l.label}<`)) throw new Error(`lane ${l.label}`); });
      if (!svg.includes('>6 m<') || /NaN/.test(svg)) throw new Error('court');
      const again = zoneMapSvg([], () => true, colours), ids = [...(svg + again).matchAll(/ id="([^"]+)"/g)].map((x) => x[1]);
      if (new Set(ids).size !== ids.length) throw new Error('shared ids ' + ids.join());
      if (again.includes('zone-pct')) throw new Error('labels without shots');
    });
    T('charts: zone map draws each lane on the side its shots came from', () => {
      const colours = { GOL: 'x', PARADA: 'x', FALLO: 'x' };
      const labelX = (origin) => +zoneMapSvg([chartShot({ origin })], () => true, colours).match(/class="zone-pct" x="(-?[\d.]+)"/)[1];
      const wingL = m(-8, 3), wingR = m(8, 3), latL = m(-5, 6), latR = m(5, 6);
      if (laneOf(wingL) !== 'EXT_I' || laneOf(wingR) !== 'EXT_D') throw new Error('lane premise');
      if (!(labelX(wingL) < CENTER_X && labelX(latL) < CENTER_X && labelX(wingR) > CENTER_X && labelX(latR) > CENTER_X)) throw new Error('map mirrored against the lane keys');
    });
    T('charts: near-ring labels keep clear of the 6 m and 9 m lines', () => {
      const colours = { GOL: 'x', PARADA: 'x', FALLO: 'x' }, CLEARANCE = 40, SIX_M_PX = 6 * UNITS_PER_M, NINE_M_PX = 9 * UNITS_PER_M, LABEL_MIDDLE = 10;
      // The 6 m and 9 m lines are the points 6 and 9 m from the goal-line segment between the posts.
      const lineDistance = (x, y) => Math.hypot(Math.max(CENTER_X - POST_HALF_M * UNITS_PER_M - x, 0, x - CENTER_X - POST_HALF_M * UNITS_PER_M), y - GOAL_LINE_Y);
      [m(-8, 3), m(-5, 6), m(0, 8), m(5, 6), m(8, 3)].forEach((origin) => {
        const svg = zoneMapSvg([chartShot({ origin })], () => true, colours), [, x, y] = svg.match(/class="zone-pct" x="(-?[\d.]+)" y="(-?[\d.]+)"/);
        const d = lineDistance(+x, +y + LABEL_MIDDLE);
        if (d - SIX_M_PX < CLEARANCE || NINE_M_PX - d < CLEARANCE) throw new Error(`${laneOf(origin)} label ${Math.round(d)} px from the goal, lines at ${SIX_M_PX} and ${NINE_M_PX}`);
      });
    });
    T('charts: no NaN with empty axes or missing rates', () => {
      const bad = (svg) => /NaN|undefined/.test(svg);
      if (bad(radarSvg([], '–', 'Nota'))) throw new Error('empty radar');
      const rows = [{ date: '2026-10-01', goals: 2, made: 0.5 }, { date: '2026-10-08', goals: 3, made: NaN }, { date: '2026-10-15', goals: 1, made: null }];
      const svg = evolutionSvg(rows, 'goals', (r) => r.made);
      if (bad(svg) || countOf(svg, /class="evo-dot"/g) !== 1 || countOf(svg, /class="evo-bar"/g) !== 3) throw new Error('missing rates: dots ' + countOf(svg, /class="evo-dot"/g));
      if (bad(evolutionSvg(rows.slice(1), 'goals', (r) => r.made)) || evolutionSvg(rows.slice(1), 'goals', (r) => r.made).includes('class="evo-dot"')) throw new Error('only missing rates');
    });
    T('charts: goal grid shows rates for cells with shots', () => {
      const list = [chartShot({ target: gf(0.1, 0.1) }), chartShot({ target: gf(0.1, 0.1), result: 'PARADA' }), chartShot({ target: gf(0.9, 0.9) }), chartShot({ target: gf(0.5, 0.5), result: 'FUERA' })];
      const svg = goalRateSvg(list, (e) => e.result === 'GOL');
      if (countOf(svg, /class="goal-pct"/g) !== 2 || !svg.includes('>50%<') || !svg.includes('>1/2<') || !svg.includes('>100%<') || !svg.includes('>1/1<')) throw new Error('labels');
      if (countOf(svg, /class="goal-cell"/g) !== GOAL_GRID * GOAL_GRID || /NaN/.test(svg)) throw new Error('cells');
    });
    T('charts: user text is escaped in charts', () => {
      const svg = radarSvg(chartAxes('<img src=x>'), '<b>1</b>', '"&"');
      if (/<img|<b>/.test(svg) || !svg.includes('&lt;img src=x&gt;') || !svg.includes('&lt;b&gt;1&lt;/b&gt;') || !svg.includes('&quot;&amp;&quot;')) throw new Error('not escaped');
    });
    T('charts: evolution draws a bar per match, a single match included', () => {
      const row = (date, goals, made) => ({ date, goals, made });
      if (evolutionSvg([], 'goals', (r) => r.made) !== '') throw new Error('not empty');
      const one = evolutionSvg([row('2026-10-01', 4, 0.5)], 'goals', (r) => r.made);
      if (countOf(one, /class="evo-bar"/g) !== 1 || countOf(one, /class="evo-dot"/g) !== 1 || /NaN|Infinity/.test(one)) throw new Error('single match');
      const zero = evolutionSvg([row('2026-10-01', 0, 0)], 'goals', (r) => r.made);
      if (/NaN|Infinity/.test(zero)) throw new Error('all zero');
      const three = evolutionSvg([row('2026-10-01', 2, 0.2), row('2026-10-08', 4, 0.6), row('2026-10-15', 3, 1)], 'goals', (r) => r.made);
      const xs = [...three.matchAll(/class="evo-bar" x="([\d.]+)"/g)].map((x) => +x[1]);
      if (xs.length !== 3 || !(xs[0] < xs[1] && xs[1] < xs[2]) || !three.includes(`>${shortDateText('2026-10-01')}<`) || !three.includes('<polyline')) throw new Error('order ' + xs);
    });
    await TA('a roster file with card names and photos stores them', async () => { const a = home.roster.find((p) => p.pos === 'POR'); const file = new File([JSON.stringify({ format: ROSTER_FORMAT, players: [{ num: a.num, name: 'Ana', pos: 'POR', fullName: 'Ana Ruiz', photo: TINY_PNG }, { num: 31, name: 'Eva', pos: 'EXT', fullName: 'Eva Gil Mora', photo: TINY_PNG }] })], 'p.json', { type: 'application/json' }); await importTeamRoster(file); const list = await backend.listPlayers(team.id); const ana = list.find((p) => p.id === a.id), eva = list.find((p) => p.num === 31); if (!ana || ana.fullName !== 'Ana Ruiz' || ana.photo !== TINY_PNG || !eva || eva.fullName !== 'Eva Gil Mora' || eva.photo !== TINY_PNG) throw new Error('not stored'); await retireTeamPlayer(rosterPlayer(eva.id)); });
    await TA('the full name and photo are saved and survive a roster file', async () => { const a = home.roster.find((p) => p.pos === 'POR'); await saveTeamPlayer(a, { fullName: 'Ana Ruiz Gómez', photo: TINY_PNG }); const file = new File([JSON.stringify({ format: ROSTER_FORMAT, players: [{ num: a.num, name: 'Ana', pos: 'POR' }] })], 'p.json', { type: 'application/json' }); await importTeamRoster(file); const stored = (await backend.listPlayers(team.id)).find((p) => p.id === a.id); if (!stored || stored.name !== 'Ana' || stored.fullName !== 'Ana Ruiz Gómez' || stored.photo !== TINY_PNG) throw new Error(JSON.stringify(stored && { ...stored, photo: Boolean(stored.photo) })); });
    await TA('convocatoria: needs a goalkeeper, then opens the setup with the squad', async () => { openSquad(); if (home.squad.size !== home.roster.length) throw new Error('default squad'); home.squad = new Set(home.roster.filter((p) => p.pos !== 'POR').map((p) => p.id)); renderHome(); if (!document.querySelector('[data-squad-next]').disabled) throw new Error('no goalkeeper accepted'); const gk = home.roster.find((p) => p.pos === 'POR'); document.querySelector(`[data-squad="${gk.id}"]`).click(); if (document.querySelector('[data-squad-next]').disabled) throw new Error('still disabled'); document.querySelector('[data-squad-next]').click(); if (!currentMatchId || state.players.length !== home.squad.size || state.us !== team.name || !$('home').hidden) throw new Error('match'); if ($('sheet').hidden || ui.sheetMode !== 'setup') throw new Error('setup'); if (!localMatch(currentMatchId).dirty) throw new Error('not saved'); });
    await TA('a played match is uploaded, listed at home and reopens as it was', async () => { const id = currentMatchId; state.them = 'BM Norte'; startMatch(); addEvent('SHOT', { playerId: state.players.find((p) => p.pos !== 'POR').id, origin: m(0, 8), target: gf(0.5, 0.5), from: '9M', zone: '9M', result: 'GOL' }); pauseClock(); await syncMatches(); if (localMatch(id).dirty) throw new Error('still dirty'); $('btn-home').click(); await showMatches(); if (currentMatchId || $('home').hidden) throw new Error('not home'); const row = home.matches.find((x) => x.id === id); if (!row || row.status !== 'live' || row.scoreUs !== 1 || row.them !== 'BM Norte') throw new Error(JSON.stringify(row)); document.querySelector(`[data-open-match="${id}"]`).click(); await tick0(); if (currentMatchId !== id || state.events.length !== 1 || !$('home').hidden) throw new Error('reopen'); });
    await TA('reload in the middle of a match goes straight back to it', async () => { const id = currentMatchId; await selectTeam(team); if (currentMatchId !== id || !$('home').hidden) throw new Error('not resumed'); });
    await TA('signed in with teams and no match in progress: the profile opens first', async () => { const id = currentMatchId; const cur = localStorage.getItem(CURRENT_MATCH_KEY); removeKey(CURRENT_MATCH_KEY); try { await loadTeams(); if (home.view !== 'profile' || $('home').hidden) throw new Error(home.view); ['Mis equipos', 'Plantillas de rivales', 'Cuenta'].forEach((h) => { if (!$('home').textContent.includes(h)) throw new Error('missing ' + h); }); if (!document.querySelector(`[data-open-team="${team.id}"]`) || !document.querySelector('[data-new-team]')) throw new Error('team cards'); } finally { localStorage.setItem(CURRENT_MATCH_KEY, cur); await loadTeams(); } if (currentMatchId !== id) throw new Error('match not resumed'); });
    await TA('template editor: dorsals, duplicate refused, name required, saved to the profile', async () => { const keep = currentMatchId; leaveMatch(); await showProfile(); document.querySelector('[data-template-new]').click(); if (home.view !== 'template') throw new Error(home.view); $('tpl-dorsals').value = '4 7 9'; document.querySelector('[data-tpl-add]').click(); if (home.template.players.length !== 3) throw new Error('add'); $('tpl-dorsals').value = '10'; $('tpl-new-name').value = 'Gómez'; document.querySelector('[data-tpl-new-pos="new:PIV"]').click(); document.querySelector('[data-tpl-add]').click(); const g = home.template.players.find((r) => r.num === 10); if (!g || g.name !== 'Gómez' || g.pos !== 'PIV') throw new Error(JSON.stringify(g)); const r4 = home.template.players.find((r) => r.num === 4); const inp = document.querySelector(`[data-tpl-num="${r4.id}"]`); inp.value = '7'; inp.dispatchEvent(new Event('change', { bubbles: true })); if (r4.num !== 4 || !$('home-status').textContent.includes('ya está')) throw new Error('dup'); document.querySelector('[data-template-store]').click(); await tick0(); if (!$('home-status').textContent.includes('nombre')) throw new Error('nameless saved'); $('tpl-name').value = 'BM Sur'; document.querySelector('[data-template-store]').click(); for (let i = 0; i < 5; i++) await tick0(); if (home.view !== 'profile' || home.templates.length !== 1) throw new Error('not saved ' + home.view); const saved = (await backend.listTemplates())[0]; if (saved.name !== 'BM Sur' || saved.players.map((x) => x.num).join() !== '4,7,9,10' || saved.players[3].pos !== 'PIV' || saved.players[0].pos !== null || 'id' in saved.players[0]) throw new Error(JSON.stringify(saved)); document.querySelector('[data-template-new]').click(); $('tpl-name').value = 'bm sur'; $('tpl-dorsals').value = '1'; document.querySelector('[data-tpl-add]').click(); $('tpl-name').value = 'bm sur'; document.querySelector('[data-template-store]').click(); await tick0(); if (home.templates.length !== 1 || !$('home-status').textContent.includes('Ya tienes')) throw new Error('same name accepted'); await showProfile(); await openMatch(keep); });
    await TA('acta: «Cargar plantilla» fills the rival, «Guardar plantilla» updates the profile', async () => { ui.sheetMode = 'sheet'; ui.sheetTab = 'acta'; renderSheet(); $('sheet').hidden = false; const snap = snapshot(); try { state.rivals = []; renderSheet(); if ($('sheet').querySelector('[data-roster-export], [data-roster-import], [data-team-export]')) throw new Error('old file buttons in the acta'); document.querySelector('[data-template-pick]').click(); for (let i = 0; i < 3; i++) await tick0(); const t = home.templates[0]; document.querySelector(`[data-template-load="${t.id}"]`).click(); if (state.them !== 'BM Sur' || state.rivals.length !== 4 || state.rivals.find((r) => r.num === 10).name !== 'Gómez' || !state.rivals.every((r) => r.id)) throw new Error(JSON.stringify(state.rivals)); if (document.querySelector('[data-template-load]')) throw new Error('picker stays open'); addRivalDorsals('22'); document.querySelector('[data-template-save]').click(); for (let i = 0; i < 5; i++) await tick0(); const all = await backend.listTemplates(); if (all.length !== 1 || all[0].players.length !== 5 || !$('rival-status').textContent.includes('actualizada')) throw new Error($('rival-status').textContent); const r = state.rivals[0]; state.events.push({ id: 'x', kind: 'SHOT', rivalId: r.id }); document.querySelector('[data-template-pick]').click(); await tick0(); if (document.querySelector('[data-template-load]') || !$('rival-status').textContent.includes('Ya hay jugadas')) throw new Error('loaded over played dorsals'); } finally { restore(snap); $('sheet').hidden = true; } });
    await TA('profile: import a template file, export and delete it (asks twice)', async () => { const keep = currentMatchId; leaveMatch(); await showProfile(); await importTemplateFile(new File([JSON.stringify({ format: ROSTER_FORMAT, team: 'CB Este', players: [{ num: 3 }, { num: 8, name: 'Ruiz', pos: 'LAT' }] })], 'e.json', { type: 'application/json' })); if (home.view !== 'template' || $('tpl-name').value !== 'CB Este' || home.template.players.length !== 2) throw new Error('editor'); document.querySelector('[data-template-store]').click(); for (let i = 0; i < 5; i++) await tick0(); if (home.templates.length !== 2) throw new Error('not saved'); await importTemplateFile(new File([JSON.stringify({ format: ROSTER_FORMAT, team: 'CB ESTE', players: [{ num: 5 }] })], 'e.json', { type: 'application/json' })); if (!$('home-status').textContent.includes('sustituirá')) throw new Error('replace warning'); document.querySelector('[data-template-store]').click(); for (let i = 0; i < 5; i++) await tick0(); const este = home.templates.find((t) => t.name === 'CB Este'); if (home.templates.length !== 2 || este.players.length !== 1) throw new Error('not replaced'); await importTemplateFile(new File(['{nope'], 'e.json')); if (!$('home-status').textContent.includes('JSON')) throw new Error('bad file'); await showProfile(); document.querySelector(`[data-template-del="${este.id}"]`).click(); if (home.templates.length !== 2) throw new Error('deleted on first tap'); document.querySelector(`[data-template-del="${este.id}"]`).click(); for (let i = 0; i < 5; i++) await tick0(); if (home.templates.length !== 1 || (await backend.listTemplates()).length !== 1) throw new Error('not deleted'); await openMatch(keep); });
    await TA('failed upload keeps the match pending until the connection is back', async () => { const real = backend.saveMatch; backend.saveMatch = async () => { throw new Error('Failed to fetch'); }; addEvent('TURNOVER', { playerId: state.players.find((p) => p.pos !== 'POR').id, subtype: 'Pasos' }); await syncMatches(); const pending = localMatch(currentMatchId).dirty; backend.saveMatch = real; if (!pending) throw new Error('marked clean'); if (!withLocalChanges([]).some((x) => x.id === currentMatchId && x.pending)) throw new Error('not listed as pending'); await syncMatches(); if (localMatch(currentMatchId).dirty) throw new Error('not uploaded later'); });
    await TA('offline: the match list comes from the device copy', async () => { leaveMatch(); const real = backend.listMatches; backend.listMatches = async () => { throw new Error('Failed to fetch'); }; await showMatches(); backend.listMatches = real; if (!home.offline || !home.matches.length || !$('home').textContent.includes('Sin conexión')) throw new Error('offline list'); });
    await TA('restarting a match asks twice and keeps the setup with an empty log', async () => { await showMatches(); const row = home.matches.find((x) => x.status !== 'setup'); const id = row.id; const before = await loadLatestMatch(id); if (!before.state.events.length) throw new Error('nothing to restart'); document.querySelector(`[data-restart-match="${id}"]`).click(); if ((await loadLatestMatch(id)).state.events.length !== before.state.events.length) throw new Error('restarted on first tap'); document.querySelector(`[data-restart-match="${id}"]`).click(); for (let i = 0; i < 5; i++) await tick0(); const after = (await loadLatestMatch(id)).state; if (after.events.length || after.history.length || after.finished || after.clock.elapsedMs || after.clock.period !== 1 || after.timeoutsUsed) throw new Error(JSON.stringify(after.clock)); if (after.them !== before.state.them || after.players.length !== before.state.players.length || !after.setupDone) throw new Error('setup lost'); const listed = home.matches.find((x) => x.id === id); if (listed.scoreUs || listed.scoreThem || !$('home-status').textContent.includes('reiniciado')) throw new Error(JSON.stringify(listed)); if (document.querySelector('[data-restart-match]') && home.matches.some((x) => x.status === 'setup' && document.querySelector(`[data-restart-match="${x.id}"]`))) throw new Error('offered on a match not started'); });
    await TA('deleting a match asks twice', async () => { await showMatches(); const id = home.matches[0].id; document.querySelector(`[data-delete-match="${id}"]`).click(); if (!home.matches.some((x) => x.id === id)) throw new Error('deleted on first tap'); document.querySelector(`[data-delete-match="${id}"]`).click(); for (let i = 0; i < 5; i++) await tick0(); if (home.matches.some((x) => x.id === id) || localMatch(id)) throw new Error('still there'); });
    await TA('match from the previous release is offered and imported', async () => { const old = sampleState(); old.sample = false; localStorage.setItem('hbstats:triana:v4', JSON.stringify(old)); await showMatches(); if (!document.querySelector('[data-legacy-import]')) throw new Error('no offer'); await importLegacyMatch(); if (localStorage.getItem('hbstats:triana:v4') || legacyMatch()) throw new Error('kept'); if (!home.matches.some((x) => x.them === old.them && x.scoreUs === score(old.events).us)) throw new Error('not listed'); });
    await TA('season: importing a legacy match clears the season', async () => {
      const old = sampleState(); old.sample = false; localStorage.setItem('hbstats:triana:v4', JSON.stringify(old));
      const keep = home.season;
      try { home.season = [seasonRow('lg1')]; await importLegacyMatch(); if (home.season !== null) throw new Error('season kept after the import'); }
      finally { home.season = keep; }
    });
    await TA('sample match is never saved over a real one', async () => { openSample(); const keys = storedKeys(MATCH_KEY_PREFIX).length; addEvent('TURNOVER', { playerId: 'p8', subtype: 'Pasos' }); if (currentMatchId || storedKeys(MATCH_KEY_PREFIX).length !== keys) throw new Error('saved'); $('btn-home').click(); await showMatches(); });
    await TA('setup screen goes back home', async () => { openSquad(); createMatch(); document.querySelector('[data-go-home]').click(); await tick0(); if ($('home').hidden || !$('sheet').hidden) throw new Error('not home'); });
    await TA('team page: opening a team shows the team page first', async () => { await selectTeam(team); if (home.view !== 'team' || !document.querySelector('.team-page')) throw new Error(home.view); const faces = document.querySelectorAll('.squad [data-player]'); if (!home.roster.length || faces.length !== home.roster.length) throw new Error(faces.length + ' faces for ' + home.roster.length); if (!document.querySelector('[data-home-view="matches"]') || !document.querySelector('[data-new-match]')) throw new Error('tabs or new match missing'); document.querySelector('[data-home-view="matches"]').click(); for (let i = 0; i < 5; i++) await tick0(); if (home.view !== 'matches') throw new Error('matches tab ' + home.view); document.querySelector('[data-home-view="team"]').click(); for (let i = 0; i < 5; i++) await tick0(); if (home.view !== 'team') throw new Error('team tab ' + home.view); });
    await TA('team page: leaders switch metric and respect the minimum shots', async () => {
      const mk = (id, num, pos) => ({ id, num, name: id, pos });
      const [a, b, c, g] = [mk('la', 5, 'EXT'), mk('lb', 3, 'LAT'), mk('lc', 9, 'PIV'), mk('lg', 1, 'POR')];
      const outsider = mk('lx', 7, 'CEN');
      const rivalShot = (result) => ({ id: newId('e'), abs: 20, kind: 'RIVAL_SHOT', gkId: 'lg', zone: '9M', result });
      const shots = (id, goals, misses) => [...Array(goals).fill('GOL'), ...Array(misses).fill('FALLO')].map((r) => seasonShot(id, r));
      const match = seasonRow('lm1', { players: [a, b, c, g, outsider], mvpId: 'lb', events: [...shots('la', 3, 0), ...shots('lb', 3, 1), ...shots('lc', 2, 0), ...shots('lx', 9, 0), rivalShot('PARADA'), rivalShot('PARADA'), rivalShot('GOL')] });
      const goals = leaders([match], [a, b, c, g], 'goals');
      if (goals.map((r) => r.player.id).join() !== 'lb,la,lc') throw new Error('goals ' + goals.map((r) => r.player.id + ':' + r.value));
      if (goals[0].value !== 3 || !goals[0].detail.includes('3/4')) throw new Error('detail ' + goals[0].detail);
      const pct = leaders([match], [a, b, c, g], 'pct');
      if (pct.map((r) => r.player.id).join() !== 'la,lb' || pct[0].value !== 100 || pct[1].value !== 75) throw new Error('pct ' + JSON.stringify(pct.map((r) => [r.player.id, r.value])));
      const saves = leaders([match], [a, b, c, g], 'saves');
      if (saves.length !== 1 || saves[0].player.id !== 'lg' || saves[0].value !== 2) throw new Error('saves ' + JSON.stringify(saves.map((r) => r.player.id)));
      const mvps = leaders([match], [a, b, c, g], 'mvps');
      if (mvps.length !== 1 || mvps[0].player.id !== 'lb' || mvps[0].value !== 1) throw new Error('mvps');
      const crowd = Array.from({ length: 10 }, (_, i) => mk('lr' + i, 20 + i, 'LAT'));
      const many = leaders([seasonRow('lm2', { players: crowd, events: crowd.flatMap((p) => shots(p.id, 1, 0)) })], crowd, 'goals');
      if (many.length !== 7 || many[0].player.num !== 20) throw new Error('cap ' + many.length);
      home.season = [match]; home.roster = [a, b, c, g]; home.leaderMetric = 'goals'; showHomeView('team');
      if (!document.querySelector('[data-leader]')) throw new Error(home.view + ' ' + $('home').innerHTML.slice(0, 300)); document.querySelector('[data-leader="pct"]').click();
      if (home.leaderMetric !== 'pct' || document.querySelectorAll('.leaders [data-player]').length !== 2 || document.querySelector('[data-leader="pct"]').getAttribute('aria-pressed') !== 'true') throw new Error('chip ' + home.leaderMetric);
      home.leaderMetric = 'goals';
    });
    await TA('team page: Editar equipo opens the old editor with import and export', async () => { await selectTeam(team); document.querySelector('[data-home-view="team-edit"]').click(); if (home.view !== 'team-edit' || !document.querySelector('[data-team-export]') || !document.querySelector('[data-roster-import="team"]') || !document.querySelector('[data-form="team"]')) throw new Error(home.view); document.querySelector('[data-home-view="team"]').click(); for (let i = 0; i < 5; i++) await tick0(); if (home.view !== 'team') throw new Error('back ' + home.view); });
    await TA('team page: a team without matches shows the empty text, no NaN', async () => {
      const real = backend, savedId = team.id;
      team.id = 'page-empty-team';
      try {
        backend = { listMatchStates: async () => [] };
        home.season = null;
        await showTeamPage();
        const text = $('home').textContent;
        if (!text.includes('Sin partidos todavía') || /NaN|undefined/.test(text) || document.querySelector('.leaders [data-player]')) throw new Error(text.slice(0, 300));
      } finally { backend = real; team.id = savedId; }
    });
    await TA('team page: offline season says only this tablet\'s matches count, and online clears it', async () => {
      const real = backend, savedId = team.id;
      team.id = 'page-offline-team';
      try {
        backend = { listMatchStates: async () => { throw new Error('Failed to fetch'); } };
        home.season = null; home.offline = false;
        await showTeamPage();
        const text = $('home').textContent;
        if (!home.offline || !text.includes('Sin conexión: solo cuentan los partidos abiertos en esta tablet.') || text.includes('ves la copia guardada')) throw new Error(text.slice(0, 200));
        backend = { listMatchStates: async () => [] };
        home.season = null;
        await showTeamPage();
        if (home.offline || $('home').textContent.includes('Sin conexión')) throw new Error('offline note stays after a good load');
      } finally { backend = real; team.id = savedId; home.season = null; home.offline = false; }
    });
    await TA('team best and the lead tile need the minimum shots', async () => {
      const lucky = { id: 'ta', num: 4, name: 'Lucky', pos: 'EXT' }, steady = { id: 'tb', num: 6, name: 'Steady', pos: 'LAT' };
      const shot = (id, result) => ({ ...seasonShot(id, result), origin: m(0, 10), target: gf(0.5, 0.5) });
      const match = seasonRow('tm1', { players: [lucky, steady], events: [shot('ta', 'GOL'), shot('tb', 'GOL'), shot('tb', 'GOL'), shot('tb', 'FALLO'), shot('tb', 'FALLO')] });
      const best = teamBest([match], [lucky, steady]);
      if (best.field.pct !== 0.5) throw new Error('best ' + best.field.pct);
      if (fieldCard(playerSeason([match], lucky), best.field).lead.leads) throw new Error('one shot leads the team');
      if (!fieldCard(playerSeason([match], steady), best.field).lead.leads) throw new Error('qualified shooter does not lead');
    });
    await TA('imageFromFile asks the browser for upright pixels', async () => {
      const real = window.createImageBitmap; let options;
      window.createImageBitmap = (file, opts) => { options = opts; return real.call(window, file, opts); };
      try {
        const c = document.createElement('canvas'); c.width = 4; c.height = 2;
        const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
        await imageFromFile(new File([blob], 'f.png', { type: 'image/png' }), 16, 'image/png');
      } finally { window.createImageBitmap = real; }
      if (!options || options.imageOrientation !== 'from-image') throw new Error(JSON.stringify(options));
    });
    // ---- Player card ----
    const cardField = { id: 'ca', num: 5, name: 'Ari', pos: 'EXT', fullName: 'Ari Gómez Ruiz' }, cardKeeper = { id: 'cg', num: 1, name: 'Gus', pos: 'POR' };
    const cardMatch = (over) => seasonRow('cm1', { players: [cardField, cardKeeper], events: [seasonShot('ca', 'GOL'), seasonShot('ca', 'GOL'), seasonShot('ca', 'GOL', 'CONTRA'), seasonShot('ca', 'PARADA'), seasonRivalShot('cg', 'PARADA'), seasonRivalShot('cg', 'PARADA'), seasonRivalShot('cg', 'GOL'), { ...seasonRivalShot('cg', 'PARADA'), zone: '7M' }, { ...seasonRivalShot('cg', 'GOL'), zone: '7M' }, seasonRivalShot('cg', 'FUERA')].map((e) => ({ origin: m(0, 10), target: gf(0.5, 0.5), ...e })), ...over });
    const openCard = (id, matches) => { home.roster = [cardField, cardKeeper]; home.season = matches; showHomeView('team'); document.querySelector(`.squad [data-player="${id}"]`).click(); };
    await TA('player card: tapping a face opens the card with sentences and radar', async () => {
      const keep = { roster: home.roster, season: home.season };
      try {
        openCard('ca', [cardMatch()]);
        if (home.view !== 'player' || home.playerId !== 'ca' || !document.querySelector('.player-page .poster')) throw new Error(home.view);
        const text = $('home').textContent;
        ['3 goles en 4 lanzamientos', '1 partido jugado', '0 pérdidas', '1 gol al contraataque', 'Ari', 'Ari Gómez Ruiz', 'Extremo', '#5'].forEach((s) => { if (!text.includes(s)) throw new Error('missing «' + s + '»: ' + text.slice(0, 400)); });
        if (!document.querySelector('.player-page .radar svg') || !document.querySelector('.radar').textContent.includes('75%')) throw new Error('radar');
        if (!document.querySelector('.player-page .zone-map svg') || !document.querySelector('.player-page .goal-chart svg') || !document.querySelector('.player-page .evolution svg')) throw new Error('charts');
        const lead = document.querySelector('.tile.lead-field');
        if (!lead || !lead.textContent.includes('el mejor del equipo') || !lead.textContent.includes('75%')) throw new Error('lead tile');
        if (document.querySelectorAll('.match-table tbody tr').length !== 1 || /NaN|undefined/.test(text)) throw new Error('rows or NaN');
        if (!document.querySelector('.player-bar [data-home-view="team"]').textContent.includes(`‹ ${team.name}`)) throw new Error('back button');
      } finally { Object.assign(home, keep); }
    });
    await TA('player card: goalkeeper card uses keeper sentences and radar', async () => {
      const keep = { roster: home.roster, season: home.season };
      try {
        openCard('cg', [cardMatch()]);
        const text = $('home').textContent;
        ['3 paradas de 5 a puerta', '1 de 2 penaltis parados', '2 goles encajados', '1 partido jugado'].forEach((s) => { if (!text.includes(s)) throw new Error('missing «' + s + '»: ' + text.slice(0, 400)); });
        if (!document.querySelector('.tile.lead-keeper') || !document.querySelector('.radar').textContent.includes('60%') || !document.querySelector('.radar').textContent.includes('Cerca')) throw new Error('keeper radar');
        const heads = [...document.querySelectorAll('.match-table th')].map((th) => th.textContent).join();
        if (!heads.includes('Paradas') || !heads.includes('7 m') || heads.includes('Pérd.')) throw new Error(heads);
        if (document.querySelectorAll('.rate-tile').length !== 2) throw new Error('7 m and counter tiles');
      } finally { Object.assign(home, keep); }
    });
    await TA('player card: MVP crown and tile appear only with an MVP', async () => {
      const keep = { roster: home.roster, season: home.season };
      try {
        openCard('ca', [cardMatch()]);
        if (document.querySelector('.poster .crown-face') || document.querySelector('.mvp-tile') || document.querySelector('.mvp-row')) throw new Error('crown without MVP');
        openCard('ca', [cardMatch({ mvpId: 'ca' }), seasonRow('cm2', { players: [cardField], date: '2026-09-01' })]);
        if (!document.querySelector('.poster .crown-face') || document.querySelectorAll('.mvp-row').length !== 1 || document.querySelectorAll('.mvp-row .crown-face').length !== 1) throw new Error('crown');
        if (!document.querySelector('.mvp-tile').textContent.includes('MVP del partido · 1 de 2 partidos')) throw new Error(document.querySelector('.mvp-tile').textContent);
      } finally { Object.assign(home, keep); }
    });
    await TA('player card: no matches shows the empty text', async () => {
      const keep = { roster: home.roster, season: home.season };
      try {
        openCard('ca', []);
        const text = $('home').textContent;
        if (!text.includes('Sin partidos todavía') || !document.querySelector('.poster') || document.querySelector('.radar, .zone-map, .match-table') || /NaN|undefined/.test(text)) throw new Error(text.slice(0, 300));
        const real = backend;
        try { backend = { listMatchStates: async () => [] }; showPlayer('nobody'); for (let i = 0; i < 5; i++) await tick0(); } finally { backend = real; }
        if (home.view !== 'team') throw new Error('unknown player: ' + home.view);
      } finally { Object.assign(home, keep); }
    });
    await TA('layout: team page and player card have no horizontal overflow at the test viewport', async () => {
      const keep = { roster: home.roster, season: home.season };
      const overflow = (where) => { const wide = document.documentElement.scrollWidth - innerWidth; if (wide > 0) throw new Error(`${where} overflows by ${wide}px`); };
      try {
        const matches = [cardMatch({ mvpId: 'ca' }), seasonRow('cm2', { players: [cardField, cardKeeper], date: '2026-09-01', them: 'Un rival con un nombre largo' })];
        openCard('ca', matches); overflow('field card');
        showHomeView('team'); overflow('team page');
        openCard('cg', matches); overflow('goalkeeper card');
        const wrap = document.querySelector('.match-table').parentElement;
        if (wrap.scrollWidth > wrap.clientWidth) throw new Error(`match table scrolls sideways by ${wrap.scrollWidth - wrap.clientWidth}px`);
      } finally { Object.assign(home, keep); }
    });
    await TA('layout: radar labels stay inside their card', async () => {
      const keep = { roster: home.roster, season: home.season };
      try {
        for (const id of ['ca', 'cg']) {
          openCard(id, [cardMatch({ mvpId: id })]);
          const card = document.querySelector('.radar').getBoundingClientRect(), labels = document.querySelectorAll('.radar text');
          if (!labels.length) throw new Error('no radar labels');
          labels.forEach((t) => { const b = t.getBoundingClientRect(); if (b.left < card.left || b.right > card.right || b.top < card.top || b.bottom > card.bottom) throw new Error(`${id}: «${t.textContent}» sticks out of the card`); });
        }
      } finally { Object.assign(home, keep); }
    });
    // The probe's control selector (tools/screenshots.py) and its size: a control is as big as the element itself, a ::after hit area does not count.
    const TARGET_SELECTOR = 'button, a[href], input, select, summary, [role=button], [data-player-match]', MIN_TARGET_PX = 44;
    const smallControls = (root) => [...root.querySelectorAll(TARGET_SELECTOR)].filter((el) => el.checkVisibility() && !el.hasAttribute('data-target-exempt')).flatMap((el) => {
      const { width, height } = el.getBoundingClientRect();
      return width >= MIN_TARGET_PX && height >= MIN_TARGET_PX ? [] : [`${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ').join('.') : ''} ${Math.round(width)}×${Math.round(height)}`];
    });
    await TA('design: home, sheet and final controls are at least 44 px', async () => {
      const keep = { roster: home.roster, season: home.season, matches: home.matches, view: home.view }, snap = snapshot();
      const small = [];
      const check = (where, root) => { const found = [...new Set(smallControls(root))]; if (found.length) small.push(`${where}: ${found.join(', ')}`); };
      try {
        home.roster = [cardField, cardKeeper];
        home.season = [cardMatch({ mvpId: 'ca' })];
        home.matches = ['finished', 'live', 'setup'].map((status, i) => ({ id: `tm${i}`, date: '2026-10-1' + i, them: 'Rival ' + i, venue: '', status, scoreUs: 3, scoreThem: 2 }));
        Object.keys(HOME_VIEWS).filter((view) => view !== 'player').forEach((view) => { showHomeView(view); check(`home ${view}`, $('home')); });
        showPlayer('ca'); check('player card', $('home'));
        document.querySelector('[data-player-edit]').click(); check('player card, edit panel', $('home'));
        showPlayer('cg'); check('goalkeeper card', $('home'));
        home.armed = null; $('home').hidden = true;
        $('sheet').hidden = false;
        Object.keys(SHEET_TABS).forEach((tab) => { ui.sheetTab = tab; renderSheet(); check(`sheet ${tab}`, $('sheet')); });
        $('sheet').hidden = true;
        openFinal(); check('final', $('final'));
        if (small.length) throw new Error(small.join(' | '));
      } finally { restore(snap); $('final').hidden = true; $('sheet').hidden = true; $('home').hidden = true; Object.assign(home, keep); }
    });
    await TA('design: every number cell is tabular', async () => {
      const keep = { roster: home.roster, season: home.season };
      const seen = new Set(), plain = [];
      const check = (root) => ['td', '.kpi strong', '.leader .value', '.tile b'].forEach((selector) => root.querySelectorAll(selector).forEach((el) => {
        seen.add(selector);
        if (!getComputedStyle(el).fontVariantNumeric.includes('tabular-nums')) plain.push(`${selector} «${el.textContent.trim().slice(0, 20)}»`);
      }));
      try {
        openCard('ca', [cardMatch({ mvpId: 'ca' })]); check($('home'));
        showHomeView('team'); check($('home'));
        $('sheet').hidden = false; ui.sheetTab = 'stats'; renderSheet(); check($('sheet')); $('sheet').hidden = true;
        check(document.body);
        const missing = ['td', '.kpi strong', '.leader .value', '.tile b'].filter((selector) => !seen.has(selector));
        if (missing.length) throw new Error('nothing to check for ' + missing.join());
        if (plain.length) throw new Error(plain.slice(0, 8).join('; '));
      } finally { $('home').hidden = true; Object.assign(home, keep); }
    });
    await TA('team page: coming back does not download the season again, a changed match does', async () => {
      const real = backend, savedId = team.id, keep = { roster: home.roster, season: home.season };
      team.id = 'page-back-team';
      let downloads = 0;
      try {
        backend = { listMatchStates: async () => { downloads++; return []; }, deleteMatch: async () => {}, listMatches: async () => [] };
        home.roster = [cardField]; home.season = null;
        await showTeamPage();
        showHomeView('team-edit');
        document.querySelector('[data-home-view="team"]').click(); await tick0();
        showPlayer('ca');
        document.querySelector('.player-bar [data-home-view="team"]').click(); await tick0();
        if (downloads !== 1 || home.view !== 'team' || !document.querySelector('.team-page')) throw new Error(`downloads ${downloads} view ${home.view}`);
        await deleteMatch('gone');
        document.querySelector('[data-home-view="team"]').click(); await tick0();
        if (downloads !== 2) throw new Error('season kept after a match was deleted: ' + downloads);
      } finally { backend = real; team.id = savedId; Object.assign(home, keep); }
    });
    // The tests below swap the team and the backend; this puts both back.
    const withTeams = async (fn) => {
      const real = backend, savedTeam = team, keep = { roster: home.roster, season: home.season, offline: home.offline, seasonOffline: home.seasonOffline };
      try { await fn(); } finally { backend = real; applyTeam(savedTeam); Object.assign(home, keep); }
    };
    await TA('season: entering, restarting and switching team clear the season', async () => withTeams(async () => {
      const marker = [seasonRow('cl1')], other = { ...team, id: 'season-clear-team' };
      let downloads = 0;
      backend = { listMatchStates: async () => { downloads++; return []; }, listPlayers: async () => [cardField], listMatches: async () => [], loadMatch: async () => null, saveMatch: async () => { throw new Error('Failed to fetch'); } };
      home.season = marker;
      await selectTeam(other);
      if (home.season === marker || downloads !== 1) throw new Error('switching team kept the season: downloads ' + downloads);
      const keepState = state, keepId = currentMatchId, id = 'season-clear-match';
      try {
        home.season = marker;
        enterMatch(id, sampleState(), false);
        if (home.season !== null) throw new Error('entering a match kept the season');
        home.season = marker;
        await restartMatch(id);
        if (home.season !== null) throw new Error('restarting a match kept the season');
      } finally { state = keepState; currentMatchId = keepId; removeKey(MATCH_KEY_PREFIX + id); removeKey(CURRENT_MATCH_KEY); renderAll(); }
    }));
    await TA('season: a team switch during loading keeps the new team\'s season', async () => withTeams(async () => {
      const teamA = { ...team, id: 'race-a' }, teamB = { ...team, id: 'race-b' };
      let releaseA;
      backend = { listMatchStates: (id) => (id === teamA.id ? new Promise((resolve) => { releaseA = () => resolve([seasonRow('ra', { them: 'Rival A' })]); }) : Promise.resolve([seasonRow('rb', { them: 'Rival B' })])) };
      applyTeam(teamA); home.season = null;
      const first = showTeamPage();
      applyTeam(teamB); home.season = null;
      await showTeamPage();
      releaseA(); await first;
      if (!home.season || home.season.length !== 1 || home.season[0].them !== 'Rival B') throw new Error('the old team\'s season replaced the new one: ' + JSON.stringify(home.season && home.season.map((x) => x.them)));
    }));
    await TA('season: coming back online reloads an offline season', async () => withTeams(async () => {
      let online = false, downloads = 0;
      backend = { listMatchStates: async () => { downloads++; if (!online) throw new Error('Failed to fetch'); return [seasonRow('on1', { them: 'Rival On' })]; }, saveMatch: async () => { throw new Error('Failed to fetch'); } };
      applyTeam({ ...team, id: 'season-online-team' }); home.season = null;
      await showTeamPage();
      if (!home.seasonOffline || !$('home').textContent.includes('Sin conexión')) throw new Error('premise: not offline');
      online = true;
      window.dispatchEvent(new Event('online'));
      for (let i = 0; i < 5; i++) await tick0();
      if (downloads !== 2 || home.seasonOffline || !home.season.some((x) => x.them === 'Rival On') || $('home').textContent.includes('Sin conexión') || home.view !== 'team') throw new Error(`downloads ${downloads} offline ${home.seasonOffline}`);
      window.dispatchEvent(new Event('online'));
      for (let i = 0; i < 5; i++) await tick0();
      if (downloads !== 2) throw new Error('an online season was downloaded again');
      home.seasonOffline = true; showHomeView('matches');
      window.dispatchEvent(new Event('online'));
      for (let i = 0; i < 5; i++) await tick0();
      if (home.season !== null || downloads !== 2) throw new Error('away from the team pages: cleared, not downloaded');
    }));
    await TA('player card: a player removed from the roster falls back to the team page', async () => withTeams(async () => {
      backend = { listMatchStates: async () => [] };
      openCard('ca', [cardMatch()]);
      if (home.view !== 'player') throw new Error('premise ' + home.view);
      home.roster = [cardKeeper]; renderHome();
      for (let i = 0; i < 3; i++) await tick0();
      if (home.view !== 'team' || !document.querySelector('.team-page') || document.querySelector('.player-page') || /NaN|undefined/.test($('home').textContent)) throw new Error(home.view);
    }));
    await TA('player card: a malicious name is escaped in the poster, the table and every SVG', async () => withTeams(async () => {
      const evil = '<u data-evil>x</u>"\'&';
      const hostile = { id: 'ce', num: 7, name: evil, pos: 'EXT', fullName: evil };
      const shot = (result) => ({ ...seasonShot('ce', result), origin: m(0, 10), target: gf(0.5, 0.5) });
      home.roster = [hostile, cardKeeper];
      home.season = [seasonRow('ev9', { players: [hostile, cardKeeper], them: evil, venue: evil, mvpId: 'ce', events: [shot('GOL'), shot('FUERA'), shot('GOL')] })];
      showPlayer('ce');
      const page = document.querySelector('.player-page');
      if (!page || page.querySelector('[data-evil]') || $('home').querySelector('[data-evil]')) throw new Error('markup injected');
      if (!page.querySelector('.poster-name').textContent.includes(evil) || !page.querySelector('.match-table').textContent.includes(evil)) throw new Error('name not shown as text');
      if (!page.querySelectorAll('svg').length || [...page.querySelectorAll('svg')].some((svg) => svg.querySelector('[data-evil]') || /&(?!amp;|lt;|gt;|quot;|#39;)/.test(svg.innerHTML.replace(/<[^>]*>/g, '')))) throw new Error('svg injected');
    }));
    await TA('team page: the latest match MVP shows the roster photo', async () => {
      const keep = { roster: home.roster, season: home.season }, photos = ui.photos;
      try {
        ui.photos = new Map();
        home.roster = [{ ...cardField, photo: TINY_PNG }, cardKeeper];
        home.season = [seasonRow('mv1', { players: [cardField, cardKeeper], mvpId: 'ca', events: [] })];
        showHomeView('team');
        if (!document.querySelector('.mvp-face-static .disc.photo')) throw new Error($('home').innerHTML.slice(0, 300));
      } finally { Object.assign(home, keep); ui.photos = photos; }
    });
    await TA('player card: field zone map and tiles count every shot', async () => {
      const keep = { roster: home.roster, season: home.season };
      const shot = (result, over) => ({ ...seasonShot('ca', result), origin: m(0, 10), target: gf(0.5, 0.5), ...over });
      const events = [shot('GOL'), shot('FUERA'), shot('FUERA'), shot('GOL', { from: '7M', zone: '7M', origin: m(0, 7) }), shot('FUERA', { from: '7M', zone: '7M', origin: m(0, 7) }), shot('GOL', { zone: 'CONTRA' }), shot('FUERA', { zone: 'CONTRA' }), shot('FUERA', { zone: 'CONTRA' })];
      try {
                openCard('ca', [seasonRow('ev1', { players: [cardField], events })]);
        const tiles = [...document.querySelectorAll('.rate-tile')].map((t) => t.textContent);
        if (tiles.length !== 2 || !tiles[0].includes('7 m · 1/2') || !tiles[1].includes('Contraataque · 1/3')) throw new Error(tiles.length + ' tiles: ' + $('home').textContent.slice(0, 300));
        const labels = [...document.querySelectorAll('.zone-map .zone-n')].map((t) => t.textContent);
        if (labels.join() !== '1/3') throw new Error('zone labels ' + labels.join());
      } finally { Object.assign(home, keep); }
    });
    // ---- Player card: one match ----
    const matchMarks = (svg, s) => svg.querySelectorAll('g').length - new DOMParser().parseFromString(shotMapSvg([], 'US', null, { s }), 'text/html').querySelectorAll('g').length;
    const SHOT_END_FILL = 'var(--surface)'; // the ring where a trajectory meets the goal, not a result colour
    const matchMaps = () => [...document.querySelectorAll('.match-grid .shot-map')];
    const gridSum = (card) => [...card.querySelectorAll('.goal-grid b')].reduce((n, b) => n + Number(b.textContent), 0);
    const gridCards = () => [...document.querySelectorAll('.match-grid .goal-grid')].map((g) => g.closest('.sheet-card'));
    await TA('player card: tapping a match row opens that match for the player', async () => {
      const keep = { roster: home.roster, season: home.season };
      try {
        const matches = [cardMatch(), seasonRow('cm2', { players: [cardField, cardKeeper], date: '2026-09-01' })];
        openCard('ca', matches);
        const rowEl = [...document.querySelectorAll('.match-table tr[data-player-match]')].find((r) => r.dataset.playerMatch === 'cm2');
        if (!rowEl || !rowEl.classList.contains('row-link')) throw new Error('row affordance');
        const btn = rowEl.querySelector('button.row-btn[data-player-match="cm2"]');
        if (!btn || btn.getBoundingClientRect().height < 44) throw new Error('date button size');
        rowEl.querySelector('td:nth-child(3)').click();
        if (home.view !== 'player-match' || home.playerMatchId !== 'cm2') throw new Error(home.view + ' ' + home.playerMatchId);
        if (document.querySelector('.tabs [data-home-view="team"]').getAttribute('aria-pressed') !== 'true') throw new Error('Equipo tab not pressed');
        showPlayer('ca'); document.querySelector('.match-table button.row-btn[data-player-match="cm1"]').click();
        if (home.view !== 'player-match' || home.playerMatchId !== 'cm1') throw new Error('button tap ' + home.view);
      } finally { Object.assign(home, keep); }
    });
    await TA('player match: field map draws one mark per shot with the card colours', async () => {
      const keep = { roster: home.roster, season: home.season };
      try {
        const match = cardMatch();
        openCard('ca', [match]);
        showPlayerMatch('cm1');
        const row = playerMatchRow(match, cardField), [svg] = matchMaps();
        if (matchMaps().length !== 1 || row.shotsList.length !== 4 || matchMarks(svg, match.state) !== row.shotsList.length) throw new Error('marks ' + matchMarks(svg, match.state));
        const fills = new Set([...svg.querySelectorAll('g circle')].map((c) => c.getAttribute('fill')).filter((f) => f !== SHOT_END_FILL));
        if (![...fills].every((f) => ['var(--gol)', 'var(--parada)', 'var(--fallo)'].includes(f)) || !fills.has('var(--gol)') || !fills.has('var(--parada)')) throw new Error([...fills].join());
        const text = $('home').textContent;
        ['Dónde marca', 'Dónde se lo paran', 'Abrir el partido', '‹ Ficha', 'Rival'].forEach((t) => { if (!text.includes(t)) throw new Error('missing «' + t + '»'); });
        const [scored, saved] = gridCards();
        if (gridSum(scored) !== 3 || gridSum(saved) !== 1) throw new Error(gridSum(scored) + '/' + gridSum(saved));
        const figure = (label) => { const sum = [...document.querySelectorAll('.player-page .sum')].find((x) => x.querySelector('span').textContent === label); return sum && sum.querySelector('strong').textContent; };
        if (figure('Goles') !== '3/4' || figure('Parados') !== '1' || /NaN|undefined/.test(text)) throw new Error('figures ' + figure('Goles') + ' ' + figure('Parados'));
        const dorsals = [...svg.querySelectorAll('text.map-dorsal')].map((t) => t.textContent);
        if (dorsals.length !== row.shotsList.length || dorsals.some((d) => d !== String(cardField.num))) throw new Error('dorsals ' + dorsals.join());
        if (!document.querySelector('#home-status')) throw new Error('no status line');
      } finally { Object.assign(home, keep); }
    });
    await TA('player match: goalkeeper sees rival shots faced, saves and goals', async () => {
      const keep = { roster: home.roster, season: home.season };
      try {
        const match = cardMatch();
        openCard('cg', [match]);
        showPlayerMatch('cm1');
        const row = playerMatchRow(match, cardKeeper), maps = matchMaps();
        const goals = row.onTarget - row.saves;
        if (maps.length !== 2 || matchMarks(maps[0], match.state) !== row.saves || matchMarks(maps[1], match.state) !== goals) throw new Error(maps.map((m) => matchMarks(m, match.state)).join());
        if (row.saves !== 3 || goals !== 2 || row.facedList.length !== 6) throw new Error('premise ' + row.saves + '/' + goals + '/' + row.facedList.length);
        const figure = (label) => { const sum = [...document.querySelectorAll('.player-page .sum')].find((x) => x.querySelector('span').textContent === label); return sum && sum.querySelector('strong').textContent; };
        if (figure('Detenidos') !== '3' || figure('Encajados') !== '2') throw new Error('figures ' + figure('Detenidos') + '/' + figure('Encajados'));
        if (!gridCards()[0].querySelector('.goal-grid div').getAttribute('style').includes('--c:var(--gol)') || !gridCards()[1].querySelector('.goal-grid div').getAttribute('style').includes('--c:var(--red)')) throw new Error('grid colours');
        const [saved, conceded] = gridCards();
        if (gridSum(saved) !== row.saves || gridSum(conceded) !== goals) throw new Error(gridSum(saved) + '/' + gridSum(conceded));
        const fills = new Set([...document.querySelectorAll('.match-grid .shot-map g circle')].map((c) => c.getAttribute('fill')).filter((f) => f !== SHOT_END_FILL));
        if (![...fills].every((f) => ['var(--gol)', 'var(--red)', 'var(--fallo)'].includes(f))) throw new Error([...fills].join());
        const text = $('home').textContent;
        ['Detenidos por zona de portería', 'Encajados por zona de portería', 'Paradas'].forEach((t) => { if (!text.includes(t)) throw new Error('missing «' + t + '»'); });
      } finally { Object.assign(home, keep); }
    });
    await TA("player match: another match's shots are not drawn", async () => {
      const keep = { roster: home.roster, season: home.season };
      try {
        const other = seasonRow('cm2', { players: [cardField, cardKeeper], date: '2026-09-01', events: [seasonShot('ca', 'GOL'), seasonShot('ca', 'GOL'), seasonRivalShot('cg', 'GOL')].map((e) => ({ origin: m(0, 10), target: gf(0.5, 0.5), ...e })) });
        const first = cardMatch();
        openCard('ca', [first, other]);
        showPlayerMatch('cm2');
        if (matchMarks(matchMaps()[0], other.state) !== 2 || gridSum(gridCards()[0]) !== 2) throw new Error('field shows ' + matchMarks(matchMaps()[0], other.state));
        showPlayer('cg'); showPlayerMatch('cm2');
        const maps = matchMaps();
        if (matchMarks(maps[0], other.state) !== 0 || matchMarks(maps[1], other.state) !== 1) throw new Error('keeper shows ' + maps.map((x) => matchMarks(x, other.state)).join());
      } finally { Object.assign(home, keep); }
    });
    await TA('player match: back returns to the card; a missing match falls back to the card', async () => {
      const keep = { roster: home.roster, season: home.season };
      try {
        openCard('ca', [cardMatch()]);
        showPlayerMatch('cm1');
        document.querySelector('[data-player-back]').click();
        if (home.view !== 'player' || home.playerId !== 'ca' || !document.querySelector('.match-table')) throw new Error('back ' + home.view);
        showPlayerMatch('nope');
        if (home.view !== 'player') throw new Error('missing match ' + home.view);
        home.playerMatchId = 'gone'; showHomeView('player-match');
        for (let i = 0; i < 3; i++) await tick0();
        if (home.view !== 'player' || /NaN|undefined/.test($('home').textContent)) throw new Error('rendered a vanished match ' + home.view);
        showPlayerMatch('cm1');
        if (!document.querySelector('[data-player-match-open="cm1"]')) throw new Error('no open button');
        home.season = null; renderHome();
        for (let i = 0; i < 3; i++) await tick0();
        if (home.view !== 'player-match' || !$('home').textContent.includes('Cargando…')) throw new Error('cleared season: ' + home.view);
      } finally { Object.assign(home, keep); }
    });
    await TA('player match: rival and player names are escaped', async () => withTeams(async () => {
      const evil = '<img src=x onerror=alert(1) data-evil>';
      const hostile = { id: 'ce', num: 7, name: evil, pos: 'EXT', fullName: evil };
      home.roster = [hostile, cardKeeper];
      home.season = [seasonRow('ev9', { players: [hostile, cardKeeper], them: evil, venue: evil, mvpId: 'ce', events: [{ ...seasonShot('ce', 'GOL'), origin: m(0, 10), target: gf(0.5, 0.5) }] })];
      showPlayer('ce'); showPlayerMatch('ev9');
      const page = document.querySelector('.player-page');
      if (!page || $('home').querySelector('[data-evil], img[onerror]')) throw new Error('markup injected');
      if (!page.querySelector('.last-who').textContent.includes(evil)) throw new Error('name not shown as text');
    }));
    // ---- Hoja: the «Jugador» tab, and opening a match from the card ----
    await TA("sheet: Jugador tab lists convocados and shows the picked player's figures", async () => {
      const keep = { state, tab: ui.sheetTab, picked: ui.sheetPlayer };
      try {
        state = sampleState();
        Object.assign(ui, { sheetTab: 'player', sheetPlayer: null });
        renderSheet();
        const chips = () => [...$('sheet').querySelectorAll('[data-sheet-player]')];
        if (chips().length !== state.players.length || !$('sheet').textContent.includes('Elige un jugador')) throw new Error('chips ' + chips().length);
        if (chips().some((c) => c.getAttribute('aria-pressed') !== 'false' || !c.querySelector('.disc'))) throw new Error('chip face or state');
        const goalsOf = (p) => ourShots().filter((e) => e.playerId === p.id && e.result === 'GOL').length;
        const scorer = fieldPlayers().reduce((best, p) => (goalsOf(p) > goalsOf(best) ? p : best));
        $('sheet').hidden = false;
        if (chips().some((c) => c.getBoundingClientRect().height < 44)) throw new Error('chip target size');
        $('sheet').querySelector(`[data-sheet-player="${scorer.id}"]`).click();
        const shots = ourShots().filter((e) => e.playerId === scorer.id);
        if (!goalsOf(scorer)) throw new Error('premise: the scorer has no goals');
        const figure = (label) => { const sum = [...$('sheet').querySelectorAll('.sum')].find((x) => x.querySelector('span').textContent === label); return sum && sum.querySelector('strong').textContent; };
        if (figure('Goles') !== `${goalsOf(scorer)}/${shots.length}` || ui.sheetPlayer !== scorer.id) throw new Error('figures ' + figure('Goles'));
        if (chips().filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.sheetPlayer).join() !== scorer.id) throw new Error('pressed chip');
        const text = $('sheet').textContent;
        ['Por zona', 'Pérdidas por tipo', 'Fallos defensivos', 'Cronología'].forEach((t) => { if (!text.includes(t)) throw new Error('missing «' + t + '»'); });
        if ($('sheet').querySelectorAll('.shot-map').length !== 1 || /NaN|undefined/.test(text)) throw new Error('map or text');
      } finally { $('sheet').hidden = true; state = keep.state; Object.assign(ui, { sheetTab: keep.tab, sheetPlayer: keep.picked }); renderSheet(); }
    });
    await TA('sheet: Jugador tab escapes player names', async () => {
      const keep = { state, tab: ui.sheetTab, picked: ui.sheetPlayer };
      const evil = '<img src=x onerror=alert(1) data-evil>';
      try {
        state = sampleState();
        state.players = state.players.map((p, i) => (i ? p : { ...p, name: evil }));
        Object.assign(ui, { sheetTab: 'player', sheetPlayer: state.players[0].id });
        renderSheet();
        if ($('sheet').querySelector('[data-evil], img[onerror]') || !$('sheet').textContent.includes(evil)) throw new Error('name injected');
      } finally { state = keep.state; Object.assign(ui, { sheetTab: keep.tab, sheetPlayer: keep.picked }); renderSheet(); }
    });
    const SAMPLE_WING_ID = 'p17', SAMPLE_KEEPER_ID = 'p1';
    // A finished match of the sample squad, as the backend would hand it over.
    const sampleMatch = (over) => { const st = { ...sampleState(), sample: false, finished: true, ...over }; return { ...matchSummary('om1', st), state: st }; };
    const openFromCard = async (playerId, match, fn) => withTeams(async () => {
      const keepState = state, keepId = currentMatchId, keepTab = ui.sheetTab;
      backend = { listMatchStates: async () => [match], listPlayers: async () => match.state.players, listMatches: async () => [], loadMatch: async () => match.state, saveMatch: async () => { throw new Error('Failed to fetch'); } };
      try {
        home.roster = match.state.players; home.season = [match];
        showPlayer(playerId);
        showPlayerMatch(match.id);
        document.querySelector('[data-player-match-open]').click();
        for (let i = 0; i < 5; i++) await tick0();
        await fn();
      } finally { state = keepState; currentMatchId = keepId; ui.sheetTab = keepTab; removeKey(MATCH_KEY_PREFIX + match.id); removeKey(CURRENT_MATCH_KEY); $('sheet').hidden = true; $('final').hidden = true; renderAll(); }
    });
    await TA('open match for player: lands on the Jugador tab filtered to him', async () => {
      await openFromCard(SAMPLE_WING_ID, sampleMatch(), async () => {
        if (currentMatchId !== 'om1' || !$('final').hidden || $('sheet').hidden || ui.sheetTab !== 'player' || ui.sheetPlayer !== SAMPLE_WING_ID) throw new Error(`final ${$('final').hidden} sheet ${$('sheet').hidden} ${ui.sheetTab} ${ui.sheetPlayer}`);
        if ($('sheet').querySelector(`[data-sheet-player="${SAMPLE_WING_ID}"]`).getAttribute('aria-pressed') !== 'true') throw new Error('chip not pressed');
        if (!$('home').hidden || $('sheet').querySelector('[data-close-sheet]').textContent !== '‹ Ficha') throw new Error('home or button label');
      });
    });
    await TA('open match for player: a goalkeeper lands on his saves', async () => {
      const base = sampleMatch();
      const match = { ...base, state: { ...base.state, events: [...base.state.events, { ...seasonRivalShot('other-gk', 'GOL'), origin: m(0, 10), target: gf(0.5, 0.5) }] } };
      await openFromCard(SAMPLE_KEEPER_ID, match, async () => {
        if (ui.sheetPlayer !== SAMPLE_KEEPER_ID || ui.sheetTab !== 'player') throw new Error('not on his tab');
        const maps = [...$('sheet').querySelectorAll('.match-grid .shot-map')];
        const faced = rivalShots(state.events).filter((e) => e.gkId === SAMPLE_KEEPER_ID);
        const saved = faced.filter((e) => e.result === 'PARADA').length, conceded = faced.filter((e) => e.result === 'GOL').length;
        if (maps.length !== 2 || matchMarks(maps[0], state) !== saved || matchMarks(maps[1], state) !== conceded) throw new Error(maps.map((x) => matchMarks(x, state)).join() + ' vs ' + saved + '/' + conceded);
        if (faced.length !== rivalShots(state.events).length - 1 || $('sheet').querySelectorAll('.goal-grid').length !== 2) throw new Error('other keeper counted or grids missing');
      });
    });
    await TA('open match for player: Volver returns to the player match view', async () => {
      await openFromCard(SAMPLE_WING_ID, sampleMatch(), async () => {
        $('sheet').querySelector('[data-close-sheet]').click();
        for (let i = 0; i < 5; i++) await tick0();
        if (currentMatchId !== null || !$('sheet').hidden || ui.sheetReturn || ui.sheetPlayer) throw new Error('still in the match');
        if (home.view !== 'player-match' || home.playerId !== SAMPLE_WING_ID || home.playerMatchId !== 'om1') throw new Error(home.view + ' ' + home.playerId + ' ' + home.playerMatchId);
        if (!document.querySelector('[data-player-match-open="om1"]') || /Cargando/.test($('home').textContent)) throw new Error('match view not drawn again');
      });
    });
    await TA('open match for player: a normal match keeps Volver and lands on the final', async () => {
      const keepState = state, keepId = currentMatchId;
      try {
        enterMatch('plain-final', sampleMatch().state, false);
        if (ui.sheetReturn || ui.sheetPlayer || $('final').hidden || !$('sheet').hidden) throw new Error('final not shown');
        renderSheet();
        if ($('sheet').querySelector('[data-close-sheet]').textContent !== 'Volver') throw new Error('label');
      } finally { state = keepState; currentMatchId = keepId; removeKey(MATCH_KEY_PREFIX + 'plain-final'); removeKey(CURRENT_MATCH_KEY); $('final').hidden = true; renderAll(); }
    });
    await TA('player card: field radar names the assists axis «Pases de gol» and the leaders chip says MVPs', async () => {
      if (FIELD_AXES.find((a) => a.key === 'assists').label !== 'Pases de gol' || LEADER_METRICS.find((x) => x.key === 'mvps').label !== 'MVPs') throw new Error('wording');
    });
    const openEdit = async (p) => { await selectTeam(team); showPlayer(p.id); document.querySelector('[data-player-edit]').click(); if (!$('player-name')) throw new Error('edit panel closed'); };
    const saveCard = async () => { document.querySelector('[data-player-save]').click(); for (let i = 0; i < 5; i++) await tick0(); };
    await TA('player card: edit saves court name, card name and position', async () => {
      await selectTeam(team);
      const p = home.roster.find((x) => x.pos !== 'POR');
      await openEdit(p);
      $('player-name').value = 'Nuria'; $('player-full').value = 'Nuria Pérez Lara';
      document.querySelector(`[data-player-pos="${p.id}:PIV"]`).click();
      if ($('player-name').value !== 'Nuria') throw new Error('typed text lost on position tap');
      await saveCard();
      const stored = (await backend.listPlayers(team.id)).find((x) => x.id === p.id);
      if (stored.name !== 'Nuria' || stored.fullName !== 'Nuria Pérez Lara' || stored.pos !== 'PIV') throw new Error(JSON.stringify(stored));
      if ($('player-name') || home.view !== 'player' || !$('home').textContent.includes('Nuria Pérez Lara') || !$('home-status').textContent.includes('Ficha guardada')) throw new Error('panel stays open or card not refreshed');
      document.querySelector('[data-player-edit]').click(); $('player-name').value = '  '; await saveCard();
      if (rosterPlayer(p.id).name !== 'Nuria' || !$('player-name') || !$('home-status').textContent.includes('vacío')) throw new Error('empty name accepted');
    });
    await TA('player card: a taken dorsal is refused and nothing changes', async () => {
      await selectTeam(team);
      const [a, b] = home.roster;
      await openEdit(b);
      $('player-num').value = String(a.num); $('player-name').value = 'Otro';
      await saveCard();
      const stored = (await backend.listPlayers(team.id)).find((x) => x.id === b.id);
      if (stored.num !== b.num || stored.name !== b.name || rosterPlayer(b.id).num !== b.num) throw new Error('changed');
      if (!$('player-name') || $('player-name').value !== 'Otro' || !$('home-status').textContent.includes('ya está')) throw new Error('panel or message: ' + $('home-status').textContent);
    });
    await TA('player card: photo upload becomes a small square jpeg', async () => {
      const c = document.createElement('canvas'); c.width = 300; c.height = 200; c.getContext('2d').fillRect(0, 0, 300, 200);
      const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
      const photo = await photoFromFile(new File([blob], 'f.png', { type: 'image/png' }));
      if (!/^data:image\/jpeg;base64,/.test(photo) || photo.length >= MAX_PHOTO_LENGTH) throw new Error(photo.slice(0, 30) + ' ' + photo.length);
      const img = new Image(); img.src = photo; await img.decode();
      if (img.width !== CONFIG.photoSizePx || img.height !== CONFIG.photoSizePx || CONFIG.photoSizePx !== 128) throw new Error(img.width + 'x' + img.height);
      let refused = false; try { await photoFromFile(new File(['x'], 'f.gif', { type: 'image/gif' })); } catch (err) { refused = /PNG/.test(err.message); }
      if (!refused) throw new Error('gif accepted');
      await selectTeam(team);
      const p = home.roster[0];
      await openEdit(p);
      await pickPhoto(new File([blob], 'f.png', { type: 'image/png' }));
      await saveCard();
      if (!/^data:image\/jpeg/.test(rosterPlayer(p.id).photo || '') || !photoOf(p.id)) throw new Error('not saved or faces not refreshed');
      document.querySelector('[data-player-edit]').click(); document.querySelector('[data-player-photo-clear]').click(); await saveCard();
      if (rosterPlayer(p.id).photo || photoOf(p.id) || (await backend.listPlayers(team.id)).find((x) => x.id === p.id).photo) throw new Error('photo not removed');
    });
    await TA('player card: a photo that is ready after leaving the editor is dropped silently', async () => {
      const c = document.createElement('canvas'); c.width = 20; c.height = 20; c.getContext('2d').fillRect(0, 0, 20, 20);
      const blob = await new Promise((r) => c.toBlob(r, 'image/png')), file = new File([blob], 'f.png', { type: 'image/png' });
      await selectTeam(team);
      const [a, b] = home.roster.filter((x) => x.pos !== 'POR');
      await openEdit(a);
      const closed = pickPhoto(file);
      showHomeView('team');
      await closed;
      if (home.view !== 'team' || /No se pudo|Foto lista/.test($('home').textContent)) throw new Error('message after leaving: ' + $('home').textContent.slice(0, 120));
      await openEdit(a);
      const other = pickPhoto(file);
      showPlayer(b.id); document.querySelector('[data-player-edit]').click();
      await other;
      if (home.playerId !== b.id || home.playerDraft.photo !== undefined || /Foto lista/.test($('home').textContent)) throw new Error('photo leaked into another draft');
    });
    await TA('crest upload becomes a small square PNG', async () => { showHomeView('team-edit'); const c = document.createElement('canvas'); c.width = 300; c.height = 200; c.getContext('2d').fillRect(0, 0, 300, 200); const blob = await new Promise((r) => c.toBlob(r, 'image/png')); await pickCrest(new File([blob], 'e.png', { type: 'image/png' })); if (!IMAGE_DATA_URL.test(home.crestDraft || '')) throw new Error('not a data url'); const img = new Image(); img.src = home.crestDraft; await img.decode(); if (img.width !== CREST_SIZE_PX || img.height !== CREST_SIZE_PX) throw new Error(img.width + 'x' + img.height); await pickCrest(new File(['x'], 'e.gif', { type: 'image/gif' })); if (!$('home-status').textContent.includes('PNG')) throw new Error('gif accepted'); });
    await TA('a coach adds a second team; rosters and matches stay apart; switch between them', async () => { await showMatches(); const first = team; const firstMatches = home.matches.length; if (!firstMatches) throw new Error('first team has no matches to compare'); await showProfile(); document.querySelector('[data-new-team]').click(); if (home.view !== 'team-new' || !document.querySelector('[data-cancel-team]')) throw new Error('no new-team form'); document.querySelector('[data-cancel-team]').click(); await tick0(); if (home.view !== 'profile' || team.id !== first.id) throw new Error('cancel'); document.querySelector('[data-new-team]').click(); $('team-club').value = 'CB Ejemplo'; $('team-name').value = 'Ejemplo Fem'; await submitTeam(document.querySelector('[data-form="team-new"]'), true); if (team.name !== 'Ejemplo Fem' || home.teams.length !== 2) throw new Error('not created'); await showMatches(); if (home.roster.length || home.matches.length) throw new Error('shares data with the first team'); document.querySelector('[data-home-view="profile"]').click(); for (let i = 0; i < 5; i++) await tick0(); if (home.view !== 'profile' || document.querySelectorAll('[data-open-team]').length !== 2) throw new Error('profile teams'); document.querySelector(`[data-open-team="${first.id}"]`).click(); for (let i = 0; i < 5; i++) await tick0(); await showMatches(); if (team.id !== first.id || home.matches.length !== firstMatches || !home.roster.length) throw new Error('switch back'); });
    await TA('deleting a team asks twice and opens the remaining one', async () => { const other = home.teams.find((x) => x.id !== team.id); await selectTeam(other); showHomeView('team-edit'); document.querySelector('[data-delete-team]').click(); if (home.teams.length !== 2) throw new Error('deleted on first tap'); document.querySelector('[data-delete-team]').click(); for (let i = 0; i < 5; i++) await tick0(); if (home.teams.length !== 1 || home.view !== 'profile' || document.querySelector(`[data-open-team="${other.id}"]`)) throw new Error('not deleted'); if ((await backend.listTeams()).some((x) => x.id === other.id)) throw new Error('still in backend'); });
    await TA('a failed team deletion is reported and keeps the team', async () => { await selectTeam(home.teams[0]); if (team.id === null) throw new Error('deleted team left applied'); const real = backend.deleteTeam; backend.deleteTeam = async () => { throw new Error('solo quien creó el equipo puede borrarlo'); }; showHomeView('team-edit'); document.querySelector('[data-delete-team]').click(); document.querySelector('[data-delete-team]').click(); for (let i = 0; i < 5; i++) await tick0(); backend.deleteTeam = real; if (home.teams.length !== 1 || !$('home-status').textContent.includes('quien creó')) throw new Error($('home-status').textContent); });
    await TA('deleting the last team asks for a new one, with nothing to cancel back to', async () => { showHomeView('team-edit'); document.querySelector('[data-delete-team]').click(); document.querySelector('[data-delete-team]').click(); for (let i = 0; i < 5; i++) await tick0(); if (home.teams.length || home.view !== 'team-new' || document.querySelector('[data-cancel-team]') || team.id !== null) throw new Error(home.view); });
    await TA('demo opens the sample match, offers sign-in and saves nothing', async () => { const keys = storedKeys(MATCH_KEY_PREFIX).length; openDemo(); try { if (!state.sample || !state.events.length || !$('home').hidden || $('btn-home').textContent !== 'Entrar' || team.name !== 'Demo') throw new Error('demo'); addEvent('TURNOVER', { playerId: 'p8', subtype: 'Pasos' }); if (currentMatchId || storedKeys(MATCH_KEY_PREFIX).length !== keys) throw new Error('saved'); } finally { $('btn-home').textContent = '‹ Partidos'; } });
    await TA('cloud errors are explained in Spanish', async () => { if (cloudErrorText({ message: 'Invalid login credentials' }) !== 'email o contraseña incorrectos' || cloudErrorText(new TypeError('Failed to fetch')) !== 'sin conexión') throw new Error('map'); });
    await TA('Supabase backend maps rows and reports errors', async () => {
      const calls = []; let next = { data: [], error: null };
      const query = () => new Proxy({}, { get: (t, k) => (k === 'then' ? (ok) => ok(next) : (...a) => { calls.push([k, ...a]); return query(); }) });
      const fakeClient = { from: (tbl) => { calls.push(['from', tbl]); return query(); }, rpc: (fn, args) => { calls.push(['rpc', fn, args]); return query(); }, auth: { getSession: async () => ({ data: { session: { user: { email: 'a@b.es' } } }, error: null }) } };
      const savedLib = window.supabase; window.supabase = { createClient: () => fakeClient };
      try {
        const cloud = await supabaseBackend({ url: 'https://x.supabase.co', anonKey: 'k' });
        if ((await cloud.currentUser()).email !== 'a@b.es') throw new Error('user');
        next = { data: [{ id: 'm8', played_on: '2026-10-10', rival: 'Sur', venue: 'P', status: 'live', score_us: 3, score_them: 2, state: null }, { id: 'm9', played_on: '2026-10-10', rival: 'Sur', venue: 'P', status: 'live', score_us: 3, score_them: 2, state: { events: [] } }], error: null };
        const withStates = await cloud.listMatchStates('t1');
        if (withStates.map((x) => x.id).join() !== 'm9') throw new Error('null state kept ' + withStates.map((x) => x.id).join());
        next = { data: [{ id: 'm1', played_on: '2026-10-10', rival: 'Sur', venue: 'P', status: 'live', score_us: 3, score_them: 2 }], error: null };
        const [row] = await cloud.listMatches('t1');
        if (row.date !== '2026-10-10' || row.them !== 'Sur' || row.scoreUs !== 3) throw new Error(JSON.stringify(row));
        next = { data: null, error: null }; calls.length = 0;
        const s = sampleState(); await cloud.saveMatch('t1', 'm2', s);
        const up = calls.find((c) => c[0] === 'upsert')[1];
        if (up.team_id !== 't1' || up.rival !== s.them || up.score_us !== score(s.events).us || up.state !== s || up.status !== 'live') throw new Error(JSON.stringify(up).slice(0, 200));
        next = { data: { id: 't9', club: 'C', name: 'N', brand: '#000000', brand2: '#ffffff', brand_ink: '#ffffff', crest: null }, error: null };
        const created = await cloud.createTeam({ club: 'C', name: 'N', brand: '#000000', brand2: '#ffffff', brandInk: '#ffffff', crest: null });
        if (created.brandInk !== '#ffffff' || calls.find((c) => c[0] === 'rpc')[1] !== 'create_team') throw new Error('create');
        next = { data: null, error: { message: 'duplicate key value violates unique constraint "players_team_num_active"' } };
        let msg = ''; try { await cloud.savePlayer('t1', { id: null, num: 4, name: 'X', pos: 'LAT' }); } catch (e) { msg = cloudErrorText(e); }
        if (msg !== 'ese dorsal ya está en la plantilla') throw new Error(msg);
        next = { data: { id: 'tp1', name: 'Sur', players: [{ num: 4, name: '', pos: null }] }, error: null }; calls.length = 0;
        const tpl = await cloud.saveTemplate({ id: null, name: 'Sur', players: [{ num: 4, name: '', pos: null }] });
        if (tpl.id !== 'tp1' || calls[0][1] !== 'rival_templates' || calls[1][0] !== 'insert' || 'user_id' in calls[1][1]) throw new Error(JSON.stringify(calls));
        next = { data: null, error: { message: 'duplicate key value violates unique constraint "rival_templates_user_name"' } };
        msg = ''; try { await cloud.saveTemplate({ id: 'tp1', name: 'Sur', players: [] }); } catch (e) { msg = cloudErrorText(e); }
        if (msg !== 'ya tienes una plantilla con ese nombre') throw new Error(msg);
      } finally { window.supabase = savedLib; }
    });
    // ---- Calendar: the federation's fixtures, kept per team and linked to the matches played ----
    const calFile = (over, fixtures) => JSON.stringify({ format: CALENDAR_FORMAT, version: 1, team: 'Triana', season: '2026/2027', competition: 'Liga', fixtures: fixtures || [
      { round: 1, weekend: '2026-10-18', home: true, opponent: 'EL JAMON CBM LEPE' }, { round: 2, weekend: '2026-10-25', home: false, opponent: 'BALONMANO GADES - ASISA' }, { round: 3, weekend: '2026-11-08', home: true, opponent: 'BM Nazareno' }], ...over });
    const fx = (id, round, weekend, opponent, over) => ({ id, season: '2026/2027', competition: 'Liga', round, weekend, home: true, opponent, kickoff: null, venue: null, matchId: null, ...over });
    const mt = (id, date, them) => ({ id, date, them });
    await TA('calendar: parses a hbstats-calendario file', async () => {
      const c = parseCalendar(calFile());
      if (c.team !== 'Triana' || c.season !== '2026/2027' || c.competition !== 'Liga' || c.fixtures.length !== 3) throw new Error(JSON.stringify(c));
      if (c.fixtures.map((f) => f.round).join() !== '1,2,3' || c.fixtures.map((f) => f.home).join() !== 'true,false,true') throw new Error(JSON.stringify(c.fixtures));
      if (c.fixtures.map((f) => f.weekend).join() !== '2026-10-18,2026-10-25,2026-11-08' || c.fixtures[2].opponent !== 'BM Nazareno') throw new Error(JSON.stringify(c.fixtures));
    });
    await TA('calendar: refuses a wrong format, a repeated round and a bad date', async () => {
      throws(() => parseCalendar('{nope'), /no es JSON/);
      throws(() => parseCalendar(JSON.stringify({ format: ROSTER_FORMAT, players: [] })), /calendario/);
      throws(() => parseCalendar(calFile({}, [{ round: 1, weekend: '2026-10-18', home: true, opponent: 'A' }, { round: 1, weekend: '2026-10-25', home: true, opponent: 'B' }])), /repetida: 1/);
      throws(() => parseCalendar(calFile({}, [{ round: 2, weekend: '2026-02-31', home: true, opponent: 'A' }])), /fecha no válida en la jornada 2/);
      throws(() => parseCalendar(calFile({}, [{ round: 3, weekend: '18/10/2026', home: true, opponent: 'A' }])), /fecha/);
      throws(() => parseCalendar(calFile({}, [{ round: 4, weekend: '2026-10-18', home: true, opponent: '  ' }])), /falta el rival en la jornada 4/);
    });
    await TA('calendar: local backend saves and lists; re-import keeps the kickoff and venue', async () => {
      const local = localBackend(), file = parseCalendar(calFile());
      try {
        const saved = await local.saveFixtures('cal-team', file);
        if (saved.length !== 3 || saved.map((f) => f.round).join() !== '1,2,3' || saved[0].matchId !== null || saved[0].kickoff !== null) throw new Error(JSON.stringify(saved));
        const updated = await local.updateFixture(saved[0].id, { kickoff: '2026-10-17T18:00:00.000Z', venue: 'Vivero', matchId: 'm-played' });
        if (updated.kickoff !== '2026-10-17T18:00:00.000Z' || updated.venue !== 'Vivero' || updated.matchId !== 'm-played') throw new Error(JSON.stringify(updated));
        const again = await local.saveFixtures('cal-team', { ...file, fixtures: file.fixtures.map((f) => (f.round === 1 ? { ...f, opponent: 'CBM LEPE' } : f)) });
        const first = again.find((f) => f.round === 1);
        if (again.length !== 3 || first.id !== saved[0].id || first.opponent !== 'CBM LEPE' || first.kickoff !== updated.kickoff || first.venue !== 'Vivero' || first.matchId !== 'm-played') throw new Error(JSON.stringify(again));
        if ((await local.listFixtures('other-team')).length) throw new Error('fixtures leak into another team');
        await local.updateFixture(saved[0].id, { venue: null });
        if ((await local.listFixtures('cal-team'))[0].kickoff !== updated.kickoff) throw new Error('a partial update cleared the kickoff');
        await local.deleteMatch('m-played');
        if ((await local.listFixtures('cal-team'))[0].matchId !== null) throw new Error('a deleted match stays linked');
      } finally { await local.deleteTeam('cal-team'); }
      if ((await local.listFixtures('cal-team')).length) throw new Error('fixtures outlive the team');
    });
    await TA('calendar: Supabase backend upserts only the file columns', async () => {
      const calls = []; let next = { data: [], error: null };
      const query = () => new Proxy({}, { get: (t, k) => (k === 'then' ? (ok) => ok(next) : (...a) => { calls.push([k, ...a]); return query(); }) });
      const savedLib = window.supabase; window.supabase = { createClient: () => ({ from: (tbl) => { calls.push(['from', tbl]); return query(); } }) };
      try {
        const cloud = await supabaseBackend({ url: 'https://x.supabase.co', anonKey: 'k' });
        const row = { id: 'f1', season: '2026/2027', competition: 'Liga', round: 1, weekend: '2026-10-18', home: true, opponent: 'A', kickoff: null, venue: null, match_id: 'm1' };
        next = { data: [row], error: null };
        const list = await cloud.saveFixtures('t1', parseCalendar(calFile({}, [{ round: 1, weekend: '2026-10-18', home: true, opponent: 'A' }])));
        const [, rows, options] = calls.find((c) => c[0] === 'upsert');
        if (Object.keys(rows[0]).sort().join() !== 'competition,home,opponent,round,season,team_id,weekend' || options.onConflict !== 'team_id,season,competition,round') throw new Error(JSON.stringify(calls));
        if (list[0].matchId !== 'm1' || list[0].id !== 'f1') throw new Error(JSON.stringify(list));
        calls.length = 0; next = { data: row, error: null };
        await cloud.updateFixture('f1', { venue: 'Vivero' });
        const [, patch] = calls.find((c) => c[0] === 'update');
        if (Object.keys(patch).join() !== 'venue') throw new Error(JSON.stringify(patch));
        calls.length = 0;
        await cloud.updateFixture('f1', { matchId: 'm2' });
        if (calls.find((c) => c[0] === 'update')[1].match_id !== 'm2') throw new Error(JSON.stringify(calls));
      } finally { window.supabase = savedLib; }
    });
    const withCalendarTeam = async (fn) => {
      const real = backend, previous = team, calTeam = { id: 'cal-team', club: 'Cal', name: 'Cal', brand: '#1a4a8a', brand2: '#ffffff', brandInk: '#ffffff', crest: null };
      backend = localBackend();
      applyTeam(calTeam);
      try { await fn(calTeam); } finally { await backend.deleteTeam('cal-team'); backend = real; applyTeam(previous); home.fixtures = null; home.teamMatches = []; removeKey(CACHE_KEY_PREFIX + 'fixtures:cal-team'); removeKey(CACHE_KEY_PREFIX + 'players:cal-team'); }
    };
    await TA('calendar: fixtures load from the device copy offline', async () => {
      await withCalendarTeam(async () => {
        const cached = [fx('f1', 1, '2026-10-18', 'EL JAMON CBM LEPE')];
        backend = { listFixtures: async () => cached };
        let r = await loadFixtures();
        if (r.offline || home.fixtures.length !== 1 || !readJson(CACHE_KEY_PREFIX + 'fixtures:cal-team')) throw new Error('online read');
        home.fixtures = null;
        backend = { listFixtures: async () => { throw new TypeError('Failed to fetch'); }, deleteTeam: async () => {} };
        r = await loadFixtures();
        if (!r.offline || home.fixtures.length !== 1 || home.fixtures[0].id !== 'f1') throw new Error(JSON.stringify(home.fixtures));
      });
    });
    await TA('calendar: selecting a team clears the fixtures of the previous one and loads its own', async () => {
      await withCalendarTeam(async (calTeam) => {
        await backend.saveFixtures('cal-team', parseCalendar(calFile()));
        home.fixtures = [fx('stale', 1, '2026-10-18', 'A')]; home.teamMatches = [mt('stale-m', '2026-10-17', 'A')];
        await selectTeam(calTeam);
        if (home.fixtures.length !== 3 || home.fixtures.some((f) => f.id === 'stale') || home.teamMatches.some((m) => m.id === 'stale-m')) throw new Error('stale fixtures ' + JSON.stringify(home.fixtures));
      });
    });
    await TA('calendar: «Editar equipo» shows the count and imports a file', async () => {
      await withCalendarTeam(async () => {
        home.fixtures = [];
        showHomeView('team-edit');
        if (!$('home').textContent.includes('Sin calendario') || !document.querySelector('[data-calendar-import]')) throw new Error('empty row');
        await importCalendar(new File([calFile()], 'calendario.json', { type: 'application/json' }));
        if (home.fixtures.length !== 3 || !$('home').textContent.includes('3 jornadas · 2026/2027') || !$('home-status').textContent.includes('Calendario importado: 3 jornadas.')) throw new Error($('home').textContent.slice(0, 300));
        await importCalendar(new File(['{nope'], 'x.json'));
        if (!$('home-status').textContent.includes('no es JSON') || home.fixtures.length !== 3) throw new Error('bad file: ' + $('home-status').textContent);
        showHomeView('profile');
      });
    });
    await TA('calendar: CBMLEPE on 2026-10-17 links to round 1', async () => {
      const fixtures = [fx('r1', 1, '2026-10-18', 'EL JAMON CBM LEPE'), fx('r8', 8, '2026-12-20', 'EL JAMON CBM LEPE')];
      const links = linkFixtures(fixtures, [mt('m1', '2026-10-17', 'CBMLEPE')]);
      if (links.get('r1').id !== 'm1' || links.has('r8') || links.size !== 1) throw new Error([...links.keys()].join());
      if (weekOf('2026-10-18').join() !== '2026-10-12,2026-10-18') throw new Error(weekOf('2026-10-18').join());
    });
    await TA('calendar: sameOpponent ignores accents, dots and club words', async () => {
      const cases = [['Gades', 'BALONMANO GADES - ASISA', true], ['BM Nazareno', 'BALONMANO NAZARENO', true], ['BM.Lauro', 'EL JAMON CBM LEPE', false], ['BM Sur', 'BM PROIN SAN JOSÉ RINCONADA', false], ['San José', 'BM PROIN SAN JOSE RINCONADA', true], ['CB', 'CBM LEPE', false]];
      cases.forEach(([a, b, expected]) => { if (sameOpponent(a, b) !== expected || sameOpponent(b, a) !== expected) throw new Error(`${a} / ${b}`); });
    });
    await TA('calendar: the same rival in another week does not link', async () => {
      const f = fx('r8', 8, '2026-12-20', 'EL JAMON CBM LEPE');
      if (fixtureMatch(f, [mt('m1', '2026-10-17', 'CBMLEPE')]) !== null) throw new Error('linked across weeks');
      if (fixtureMatch(f, [mt('m1', '2026-12-14', 'CBMLEPE')]).id !== 'm1' || fixtureMatch(f, [mt('m1', '2026-12-13', 'CBMLEPE')]) !== null) throw new Error('week edges');
      if (fixtureMatch(f, [mt('m1', '2026-12-19', 'BM Sur')]) !== null) throw new Error('another rival linked');
    });
    await TA('calendar: an explicit matchId wins over the auto link', async () => {
      const fixtures = [fx('r1', 1, '2026-10-18', 'EL JAMON CBM LEPE', { matchId: 'm2' })];
      const links = linkFixtures(fixtures, [mt('m1', '2026-10-17', 'CBMLEPE'), mt('m2', '2026-11-30', 'Otro')]);
      if (links.get('r1').id !== 'm2') throw new Error(links.get('r1').id);
    });
    await TA('calendar: a match links to one fixture only', async () => {
      const fixtures = [fx('a', 1, '2026-10-18', 'EL JAMON CBM LEPE'), fx('b', 2, '2026-10-25', 'EL JAMON CBM LEPE', { kickoff: '2026-10-17T10:00:00' })];
      const links = linkFixtures(fixtures, [mt('m1', '2026-10-17', 'CBMLEPE')]);
      if (links.size !== 1 || links.get('a').id !== 'm1') throw new Error([...links.keys()].join());
      const explicit = linkFixtures([fx('a', 1, '2026-10-18', 'EL JAMON CBM LEPE'), fx('c', 3, '2026-11-01', 'Z', { matchId: 'm1' })], [mt('m1', '2026-10-17', 'CBMLEPE')]);
      if (explicit.get('c').id !== 'm1' || explicit.has('a')) throw new Error('explicit link lost its match to an auto link');
    });
    await TA('calendar: a kickoff moved to another week still links by its date', async () => {
      const moved = fx('r1', 1, '2026-10-18', 'EL JAMON CBM LEPE', { kickoff: new Date(2026, 9, 28, 19, 30).toISOString() });
      if (fixtureMatch(moved, [mt('m1', '2026-10-28', 'CBMLEPE')]).id !== 'm1') throw new Error('kickoff date ignored');
    });
    await TA('calendar: persistLinks writes only new auto links, only online, and only warns on failure', async () => {
      const real = backend, savedFixtures = home.fixtures, savedMatches = home.teamMatches, online = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine'), warn = console.warn;
      const writes = [], warnings = [];
      const setOnline = (value) => Object.defineProperty(navigator, 'onLine', { value, configurable: true });
      try {
        home.fixtures = [fx('r1', 1, '2026-10-18', 'EL JAMON CBM LEPE'), fx('r2', 2, '2026-10-25', 'BALONMANO NAZARENO', { matchId: 'm9' })];
        home.teamMatches = [mt('m1', '2026-10-17', 'CBMLEPE'), mt('m3', '2026-10-24', 'Nazareno'), { ...mt('m4', '2026-10-17', 'CBMLEPE'), pending: true }];
        backend = { updateFixture: async (id, patch) => { writes.push([id, patch]); return { ...home.fixtures.find((f) => f.id === id), ...patch }; } };
        console.warn = (m) => warnings.push(m);
        setOnline(false); await persistLinks();
        if (writes.length) throw new Error('wrote offline');
        setOnline(true); await persistLinks();
        if (JSON.stringify(writes) !== '[["r1",{"matchId":"m1"}]]' || home.fixtures[0].matchId !== 'm1') throw new Error(JSON.stringify(writes));
        home.fixtures[0].matchId = null;
        backend = { updateFixture: async () => { throw new Error('Failed to fetch'); } };
        await persistLinks();
        if (!warnings.length || home.fixtures[0].matchId !== null) throw new Error('failure not warned');
      } finally { console.warn = warn; backend = real; home.fixtures = savedFixtures; home.teamMatches = savedMatches; delete navigator.onLine; if (online) Object.defineProperty(Navigator.prototype, 'onLine', online); }
    });
    // ---- Team page: «Próximo partido» and «Calendario» ----
    const weeksFromNow = (n) => isoOfUtc(Date.parse(`${weekOf(todayIso())[1]}T00:00:00Z`) + n * 7 * DAY_MS);
    const finishedMatch = (id, them, scoreUs, scoreThem, over) => ({ id, date: weeksFromNow(-2), them, venue: '', status: 'finished', scoreUs, scoreThem, ...over });
    const showCalendarPage = (fixtures, matches) => { home.fixtures = fixtures; home.teamMatches = matches; home.season = []; showHomeView('team'); };
    const season14 = () => Array.from({ length: 14 }, (_, i) => fx('r' + (i + 1), i + 1, weeksFromNow(i - 2), 'Rival ' + (i + 1), { home: i % 2 === 0 }));
    const flatText = (el) => el.textContent.replace(/\s+/g, ' ').trim();
    await TA('team page: next match shows round, weekend, rival and home or away', async () => {
      await withCalendarTeam(async () => {
        showCalendarPage([fx('r1', 1, '2099-10-25', 'BALONMANO GADES - ASISA', { home: false }), fx('r2', 2, '2099-11-01', 'Otro')], []);
        const card = document.querySelector('.team-page > .next-card:first-child');
        const text = card && flatText(card);
        if (!text || !text.includes('Próximo partido') || !text.includes('Jornada 1') || !text.includes('fin de semana 24–25 oct') || !text.includes('BALONMANO GADES - ASISA') || !text.includes('Fuera') || text.includes('Otro')) throw new Error(text);
        if (card.querySelector('.go, [data-fixture-new]') || !card.querySelector('[data-fixture-edit="r1"]')) throw new Error('the card has a second new-match button or no Fecha');
        showCalendarPage([fx('r1', 1, '2099-10-25', 'Local FC', { home: true })], []);
        if (!flatText(document.querySelector('.next-card')).includes('Casa')) throw new Error('home badge');
      });
    });
    await TA('team page: exact date and time replace the weekend once set', async () => {
      await withCalendarTeam(async () => {
        const kickoff = new Date(2026, 9, 24, 18, 0).toISOString();
        if (fixtureWhenText(fx('a', 1, '2026-10-25', 'X', { kickoff })) !== 'sáb 24 oct · 18:00') throw new Error(fixtureWhenText(fx('a', 1, '2026-10-25', 'X', { kickoff })));
        if (fixtureWhenText(fx('a', 1, '2026-11-01', 'X')) !== 'fin de semana 31 oct–1 nov') throw new Error(fixtureWhenText(fx('a', 1, '2026-11-01', 'X')));
        showCalendarPage([fx('r1', 1, '2099-10-25', 'Gades', { kickoff: new Date(2099, 9, 24, 18, 0).toISOString(), venue: 'Pabellón Vivero' })], []);
        const text = flatText(document.querySelector('.next-card'));
        if (!text.includes('sáb 24 oct · 18:00') || text.includes('fin de semana') || !text.includes('Pabellón Vivero')) throw new Error(text);
      });
    });
    await TA('team page: calendar lists every round; played ones open their match', async () => {
      await withCalendarTeam(async () => {
        const fixtures = season14().map((f) => (f.round === 1 ? { ...f, opponent: 'CBM LEPE' } : f));
        showCalendarPage(fixtures, [finishedMatch('m1', 'Lepe', 28, 23), finishedMatch('m2', 'Rival 2', 20, 20, { date: weeksFromNow(-1) })]);
        const rows = document.querySelectorAll('.calendar-card .cal-row');
        if (rows.length !== 14 || !rows[0].textContent.includes('J1') || !rows[13].textContent.includes('J14')) throw new Error('rows ' + rows.length);
        const chip = rows[0].querySelector('[data-open-match]');
        if (!chip || chip.dataset.openMatch !== 'm1' || flatText(chip) !== 'G 28–23') throw new Error(chip && flatText(chip));
        if (flatText(rows[1].querySelector('[data-open-match]')) !== 'E 20–20') throw new Error('draw chip');
        if (rows[2].querySelector('[data-open-match]')) throw new Error('an unplayed round opens a match');
        if (![...rows].every((r) => /Casa|Fuera/.test(r.textContent) && r.querySelector('[data-fixture-edit]'))) throw new Error('badge or edit missing');
      });
    });
    await TA('team page: the current week has a ring and reads Esta semana', async () => {
      await withCalendarTeam(async () => {
        showCalendarPage(season14(), []);
        const current = document.querySelectorAll('[aria-current="date"]');
        if (current.length !== 1 || !current[0].textContent.includes('J3') || !current[0].textContent.includes('Esta semana')) throw new Error(current.length);
        if ((document.querySelector('.calendar-card').textContent.match(/Esta semana/g) || []).length !== 1) throw new Error('label repeated');
        if (nextFixture(season14(), new Map()).round !== 3) throw new Error('next is not this week');
      });
    });
    await TA('team page: nextFixture skips finished matches and past weeks', async () => {
      const fixtures = [fx('a', 1, '2026-10-18', 'A'), fx('b', 2, '2026-10-25', 'B'), fx('c', 3, '2026-11-01', 'C')];
      const links = new Map([['b', finishedMatch('mb', 'B', 1, 0)], ['c', { id: 'mc', status: 'live' }]]);
      if (nextFixture(fixtures, links, '2026-10-24').id !== 'c') throw new Error('finished round not skipped');
      if (nextFixture(fixtures, new Map(), '2026-10-25').id !== 'b') throw new Error('Sunday of the round must count');
      if (nextFixture(fixtures, new Map(), '2026-10-26').id !== 'c' || nextFixture(fixtures, new Map(), '2026-11-02') !== null) throw new Error('past weeks');
      if (nextFixture([], new Map(), '2026-10-24') !== null) throw new Error('empty');
    });
    await TA('team page: fixtureRivalName cuts at a word boundary within the limit', async () => {
      if (fixtureRivalName('BALONMANO GADES - ASISA') !== 'BALONMANO GADES - ASISA') throw new Error('short name changed');
      const cut = fixtureRivalName('BM PROIN SAN JOSE RINCONADA SUR');
      if (cut !== 'BM PROIN SAN JOSE') throw new Error(cut);
      if (fixtureRivalName('A'.repeat(40)) !== 'A'.repeat(MAX_NAME_LENGTH)) throw new Error('no space to cut at');
      if (fixtureRivalName('X'.repeat(MAX_NAME_LENGTH) + ' Y') !== 'X'.repeat(MAX_NAME_LENGTH)) throw new Error('boundary at the limit');
    });
    await TA('team page: the fixture editor saves date, time and venue, and an empty date clears the kickoff', async () => {
      await withCalendarTeam(async () => {
        const [saved] = await backend.saveFixtures('cal-team', parseCalendar(calFile({}, [{ round: 1, weekend: '2099-10-25', home: true, opponent: 'Gades' }])));
        showCalendarPage([saved], []);
        document.querySelector('.cal-row [data-fixture-edit]').click();
        if (!$('fx-date') || !$('fx-date').closest('.calendar-card') || document.activeElement !== $('fx-date') || !$('fx-time') || !$('fx-venue')) throw new Error('editor not open');
        $('fx-date').value = '2099-10-24'; $('fx-time').value = '18:30'; $('fx-venue').value = 'Pabellón Vivero';
        document.querySelector('[data-fixture-save]').click();
        for (let i = 0; i < 6; i++) await tick0();
        const stored = (await backend.listFixtures('cal-team'))[0];
        if (new Date(stored.kickoff).getTime() !== new Date(2099, 9, 24, 18, 30).getTime() || stored.venue !== 'Pabellón Vivero' || home.fixtures[0].kickoff !== stored.kickoff) throw new Error(JSON.stringify(stored));
        if (!flatText(document.querySelector('.next-card')).includes('sáb 24 oct · 18:30') || document.querySelector('#fx-date')) throw new Error('page not refreshed');
        document.querySelector('.cal-row [data-fixture-edit]').click();
        if ($('fx-date').value !== '2099-10-24' || $('fx-time').value !== '18:30' || $('fx-venue').value !== 'Pabellón Vivero') throw new Error('editor not prefilled');
        $('fx-time').value = '';
        document.querySelector('[data-fixture-save]').click();
        for (let i = 0; i < 3; i++) await tick0();
        if (!$('fx-date') || !$('fx-error').textContent.includes('hora') || !document.querySelector('.cal-row #fx-error')) throw new Error('a date without a time was accepted, or the error is not in the row');
        $('fx-date').value = ''; $('fx-venue').value = '';
        document.querySelector('[data-fixture-save]').click();
        for (let i = 0; i < 6; i++) await tick0();
        const cleared = (await backend.listFixtures('cal-team'))[0];
        if (cleared.kickoff !== null || cleared.venue !== null) throw new Error(JSON.stringify(cleared));
        document.querySelector('.next-card [data-fixture-edit]').click();
        if (!$('fx-date').closest('.next-card')) throw new Error('the card button opens the editor elsewhere');
        document.querySelector('[data-fixture-cancel]').click();
        if (document.querySelector('#fx-date')) throw new Error('cancel left the editor open');
      });
    });
    await TA('new match from a fixture: rival, date and venue prefilled and linked', async () => {
      await withCalendarTeam(async () => {
        const [saved] = await backend.saveFixtures('cal-team', parseCalendar(calFile({}, [{ round: 4, weekend: '2026-11-08', home: false, opponent: 'BM PROIN SAN JOSE RINCONADA SUR' }])));
        const fixture = await backend.updateFixture(saved.id, { kickoff: new Date(2026, 10, 7, 19, 0).toISOString(), venue: 'Pabellón Rinconada' });
        home.roster = [await backend.savePlayer('cal-team', { num: 1, name: 'Portero', pos: 'POR', photo: null }), await backend.savePlayer('cal-team', { num: 7, name: 'Lateral', pos: 'LAT', photo: null })];
        home.fixtures = [fixture]; home.teamMatches = [];
        openSquad({ fixtureId: fixture.id });
        if (home.view !== 'squad' || !$('home').textContent.includes('Jornada 4')) throw new Error('squad view does not say which round');
        await createMatch();
        if (state.them !== 'BM PROIN SAN JOSE' || state.date !== '2026-11-07' || state.venue !== 'Pabellón Rinconada' || state.setupDone) throw new Error(JSON.stringify([state.them, state.date, state.venue]));
        const linkedTo = currentMatchId;
        const stored = (await backend.listFixtures('cal-team'))[0];
        if (stored.matchId !== linkedTo || home.fixtures[0].matchId !== linkedTo) throw new Error('not linked ' + stored.matchId);
        if (!(await backend.listMatches('cal-team')).some((m) => m.id === linkedTo)) throw new Error('the match was not uploaded before the link');
        openSquad();
        await createMatch();
        if (state.them !== 'Rival' || state.date !== todayIso() || state.venue !== '' || (await backend.listFixtures('cal-team'))[0].matchId !== linkedTo) throw new Error('a plain new match took the fixture');
        removeKey(MATCH_KEY_PREFIX + linkedTo); removeKey(MATCH_KEY_PREFIX + currentMatchId); removeKey(SQUAD_KEY_PREFIX + 'cal-team');
        ['home', 'sheet', 'final'].forEach((id) => { $(id).hidden = true; });
      });
    });
    await TA('new match from a fixture: the header button prefills and links when the next round is unlinked, and is plain otherwise', async () => {
      await withCalendarTeam(async () => {
        home.roster = [await backend.savePlayer('cal-team', { num: 1, name: 'Portero', pos: 'POR', photo: null })];
        const open = [fx('r1', 1, '2099-10-25', 'Gades')];
        showCalendarPage(open, []);
        if (document.querySelectorAll('.team-page .btn.go, .home-head .btn.go').length !== 1) throw new Error('more than one green new-match button');
        document.querySelector('[data-new-match]').click();
        if (home.squadFixture !== 'r1') throw new Error('header button ignores the next round');
        showCalendarPage(open, [{ id: 'm1', date: '2099-10-24', them: 'Gades', venue: '', status: 'live', scoreUs: 0, scoreThem: 0 }]);
        document.querySelector('[data-new-match]').click();
        if (home.squadFixture !== null) throw new Error('header button prefilled a linked round');
        showCalendarPage([], []);
        document.querySelector('[data-new-match]').click();
        if (home.squadFixture !== null) throw new Error('header button prefilled with no calendar');
        showHomeView('matches');
        document.querySelector('[data-new-match]').click();
        if (home.squadFixture !== null) throw new Error('Partidos tab prefilled');
      });
    });
    await TA('new match from a fixture: a failed link only warns', async () => {
      await withCalendarTeam(async () => {
        const warn = console.warn, warnings = [];
        console.warn = (m) => warnings.push(m);
        try {
          home.roster = [await backend.savePlayer('cal-team', { num: 1, name: 'Portero', pos: 'POR', photo: null })];
          home.fixtures = [fx('gone', 1, '2099-10-25', 'Gades')]; home.teamMatches = [];
          openSquad({ fixtureId: 'gone' });
          await createMatch();
          if (!warnings.some((w) => /existe/.test(w)) || state.them !== 'Gades') throw new Error(warnings.join() + state.them);
        } finally { console.warn = warn; removeKey(MATCH_KEY_PREFIX + currentMatchId); removeKey(SQUAD_KEY_PREFIX + 'cal-team'); ['home', 'sheet', 'final'].forEach((id) => { $(id).hidden = true; }); }
      });
    });
    await TA('team page: opponent names are escaped and no fixtures shows the hint, no NaN', async () => {
      await withCalendarTeam(async () => {
        showCalendarPage([fx('r1', 1, '2099-10-25', '<img src=x onerror=alert(1)>', { venue: '<b>Pabellón</b>' })], []);
        if (document.querySelector('.team-page img[src="x"]') || document.querySelector('.team-page .cal-row b:not(.cal-round)') || document.querySelector('.team-page .next-card b')) throw new Error('markup from a name was rendered');
        if (!$('home').textContent.includes('<img src=x onerror=alert(1)>') || !$('home').textContent.includes('<b>Pabellón</b>')) throw new Error('name not shown as text');
        for (const none of [[], null]) {
          showCalendarPage(none, []);
          const text = $('home').textContent;
          if (!text.includes('Importa el calendario en «Editar equipo».') || document.querySelector('.next-card') || /NaN|undefined/.test(text)) throw new Error(text.slice(0, 300));
        }
      });
    });
    await TA('calendar: an explicit matchId pointing at a missing match shows the fixture unlinked', async () => {
      const gone = fx('r1', 1, '2026-10-18', 'EL JAMON CBM LEPE', { matchId: 'deleted' });
      if (fixtureMatch(gone, [mt('m1', '2026-10-17', 'CBMLEPE')]) !== null || linkFixtures([gone], [mt('m1', '2026-10-17', 'CBMLEPE')]).size !== 0) throw new Error('fell back to the auto link');
    });
    const emptySession = (date = '2026-10-20', kind = 'ENTRENO') => ({ id: 'sess-' + date + kind, date, kind, matchId: null, marks: {}, note: '' });
    const withAttendanceTeam = async (fn) => {
      await withCalendarTeam(async (calTeam) => {
        const savedSessions = home.sessions;
        try { await fn(calTeam); } finally { removeKey(attendanceKey('cal-team')); removeKey(CACHE_KEY_PREFIX + 'attendance:cal-team'); clearTimeout(attendanceSyncTimer); home.sessions = savedSessions; }
      });
    };
    await TA('attendance: tapping cycles Presente, Falta, Justificada, Lesionado', async () => {
      const train = ['P', 'F', 'J', 'L', 'P'], seen = [train[0]];
      train.slice(1).forEach(() => seen.push(nextStatus(seen[seen.length - 1], false)));
      if (seen.join() !== train.join()) throw new Error(seen.join());
      const match = ['NC', 'F', 'J', 'L', 'NC'], seenMatch = [match[0]];
      match.slice(1).forEach(() => seenMatch.push(nextStatus(seenMatch[seenMatch.length - 1], true)));
      if (seenMatch.join() !== match.join()) throw new Error(seenMatch.join());
      const s0 = emptySession(), s1 = setMark(s0, 'p1', 'F', 'x'.repeat(CONFIG.attendance.noteMax + 5));
      if (s1.marks.p1.s !== 'F' || s1.marks.p1.n.length !== CONFIG.attendance.noteMax || Object.keys(s0.marks).length) throw new Error(JSON.stringify([s0, s1]));
      if (setMark(s1, 'p1', 'J').marks.p1.n !== s1.marks.p1.n) throw new Error('the note was lost on the next tap');
      if (ATTENDANCE.NC !== 'No convocado' || ATTENDANCE.J !== 'Justificada') throw new Error('labels');
    });
    await TA('attendance: Presente stores nothing', async () => {
      const marked = setMark(setMark(emptySession(), 'p1', 'L', 'rodilla'), 'p2', 'F');
      const back = setMark(marked, 'p1', 'P');
      if ('p1' in back.marks || !('p2' in back.marks)) throw new Error(JSON.stringify(back.marks));
      if ('p2' in setMark(marked, 'p2', 'NC').marks) throw new Error('NC stored a mark');
      const match = { state: { players: [{ id: 'p1' }] } }, day = { ...emptySession('2026-10-17', 'PARTIDO'), marks: { p1: { s: 'F' }, p3: { s: 'J' } } };
      if (sessionStatus(day, 'p1', match) !== 'P' || sessionStatus(day, 'p2', match) !== 'NC' || sessionStatus(day, 'p3', match) !== 'J') throw new Error('match day statuses');
      const orphan = { ...emptySession('2026-10-17', 'PARTIDO'), marks: { p3: { s: 'F' } } };
      if (sessionStatus(orphan, 'p2', null) !== 'NC' || sessionStatus(orphan, 'p3', null) !== 'F') throw new Error('a match day without a match must not count everybody');
      if (sessionStatus(emptySession(), 'p2', null) !== 'P' || sessionStatus({ ...emptySession(), marks: { p2: { s: 'L' } } }, 'p2', null) !== 'L') throw new Error('training statuses');
    });
    await TA('attendance: a session saved offline is uploaded when back online', async () => {
      await withAttendanceTeam(async () => {
        const local = backend, calls = []; let failing = true;
        try {
        backend = { listSessions: local.listSessions, saveSession: async (teamId, s) => { calls.push(s.date); if (failing) throw new TypeError('Failed to fetch'); return local.saveSession(teamId, s); } };
        storeLocalSession(setMark(emptySession(), 'p1', 'F'), true);
        await syncAttendance();
        if (!localSessions()[0].dirty || (await local.listSessions('cal-team')).length) throw new Error('uploaded while offline');
        failing = false;
        window.dispatchEvent(new Event('online'));
        for (let i = 0; i < 5; i++) await tick0();
        if (localSessions()[0].dirty || calls.length !== 2 || (await local.listSessions('cal-team')).length !== 1) throw new Error(JSON.stringify([calls, localSessions()]));
        await syncAttendance();
        if (calls.length !== 2) throw new Error('a clean session was uploaded again');
        const offline = await loadAttendance();
        if (offline.offline || home.sessions.length !== 1 || home.sessions[0].marks.p1.s !== 'F') throw new Error(JSON.stringify(home.sessions));
        } finally { backend = local; }
      });
    });
    await TA('attendance: the same day and kind upsert one session', async () => {
      await withAttendanceTeam(async () => {
        const local = backend;
        const first = await local.saveSession('cal-team', setMark(emptySession(), 'p1', 'F'));
        const second = await local.saveSession('cal-team', { ...setMark(emptySession(), 'p2', 'J'), id: 'other-device' });
        if (second.id !== first.id || (await local.listSessions('cal-team')).length !== 1 || !('p2' in second.marks)) throw new Error(JSON.stringify([first, second]));
        await local.saveSession('cal-team', emptySession('2026-10-20', 'PARTIDO'));
        if ((await local.listSessions('cal-team')).length !== 2) throw new Error('kinds must be apart');
        storeLocalSession({ ...emptySession(), id: 'other-device' }, true);
        await syncAttendance();
        if (localSessions().length !== 1 || localSessions()[0].id !== first.id) throw new Error('the id the backend returned was not adopted: ' + JSON.stringify(localSessions()));
        await loadAttendance();
        if (home.sessions.filter((x) => x.kind === 'ENTRENO').length !== 1) throw new Error(JSON.stringify(home.sessions));
        await local.deleteSession(first.id);
        if ((await local.listSessions('cal-team')).some((x) => x.id === first.id)) throw new Error('not deleted');
      });
    });
    await TA('attendance: Supabase backend upserts on team, day and kind; the first id stays; a stale delete errors', async () => {
      await withAttendanceTeam(async () => {
      const calls = [], rows = [];
      // Models the table: the unique key plus the attendance_keep_id trigger (an update keeps the first id).
      const table = {
        upsert: (row, options) => {
          calls.push(['upsert', row, options]);
          const found = rows.find((r) => r.team_id === row.team_id && r.on_date === row.on_date && r.kind === row.kind);
          if (found) Object.assign(found, row, { id: found.id }); else rows.push({ ...row });
          const stored = found || rows[rows.length - 1];
          return { select: () => ({ single: async () => ({ data: { ...stored }, error: null }) }) };
        },
        delete: () => ({ eq: (column, id) => ({ select: async () => { const gone = rows.filter((r) => r.id === id); gone.forEach((r) => rows.splice(rows.indexOf(r), 1)); return { data: gone, error: null }; } }) })
      };
      const savedLib = window.supabase; window.supabase = { createClient: () => ({ from: (name) => { calls.push(['from', name]); return table; } }) };
      try {
        const cloud = await supabaseBackend({ url: 'https://x.supabase.co', anonKey: 'k' });
        const first = await cloud.saveSession('cal-team', { ...emptySession(), id: 'first-id', marks: { p1: { s: 'F' } } });
        const [, row, options] = calls.find((c) => c[0] === 'upsert');
        if (options.onConflict !== 'team_id,on_date,kind' || row.team_id !== 'cal-team' || row.on_date !== '2026-10-20' || row.id !== 'first-id') throw new Error(JSON.stringify(calls));
        if (first.id !== 'first-id' || first.date !== '2026-10-20' || first.note !== '' || first.marks.p1.s !== 'F') throw new Error(JSON.stringify(first));
        // The second device saves the same day and kind with its own id.
        const local = backend; backend = cloud;
        try {
          storeLocalSession({ ...emptySession(), id: 'second-device-id', marks: { p2: { s: 'J' } } }, true);
          await syncAttendance();
          const device = localSessions();
          if (rows.length !== 1 || device.length !== 1 || device[0].id !== 'first-id' || device[0].dirty || !('p2' in rows[0].marks)) throw new Error(JSON.stringify([rows, device]));
        } finally { backend = local; }
        await cloud.deleteSession('first-id');
        let failure = '';
        try { await cloud.deleteSession('second-device-id'); } catch (err) { failure = err.message; }
        if (rows.length || !/ya no existe/.test(failure)) throw new Error('stale delete: ' + failure);
      } finally { window.supabase = savedLib; }
      });
    });
    await TA('attendance: scheduling replaces the timer and signing out waits for pending sessions', async () => {
      await withAttendanceTeam(async () => {
        const real = backend; let uploads = 0, signedOut = false;
        try {
        backend = { saveSession: async () => { uploads++; throw new TypeError('Failed to fetch'); }, signOut: async () => { signedOut = true; } };
        const delay = CONFIG.attendance.syncDelayMs;
        CONFIG.attendance.syncDelayMs = 20;
        try {
          storeLocalSession(setMark(emptySession(), 'p1', 'F'), true);
          scheduleAttendanceSync();
          scheduleAttendanceSync();
          await new Promise((r) => setTimeout(r, 100));
        } finally { CONFIG.attendance.syncDelayMs = delay; }
        if (uploads !== 1) throw new Error('stacked timers uploaded ' + uploads + ' times');
        uploads = 0;
        await signOut();
        if (uploads !== 1 || signedOut || !localSessions()[0].dirty || !/asistencia sin subir/.test($('home-status').textContent)) throw new Error(JSON.stringify([uploads, signedOut, $('home-status').textContent]));
        } finally { backend = real; }
      });
    });
    const withAttendanceView = async (fn, { season = [], fixtures = [], teamMatches = [] } = {}) => {
      await withAttendanceTeam(async () => {
        const saved = { roster: home.roster, season: home.season, view: home.view, sessions: home.sessions, fixtures: home.fixtures, teamMatches: home.teamMatches, stateMatches: home.stateMatches, attendanceDate: home.attendanceDate };
        try {
          home.roster = [];
          for (const [num, name, pos] of [[1, 'Portero Uno', 'POR'], [7, 'Lateral Siete', 'LI'], [9, 'Pivote Nueve', 'PIV']]) home.roster.push(await backend.savePlayer('cal-team', { num, name, pos, photo: null }));
          home.sessions = []; home.season = season; home.stateMatches = season; home.fixtures = fixtures; home.teamMatches = teamMatches;
          await showAttendance();
          await fn();
        } finally { Object.assign(home, saved); showHomeView('team'); }
      });
    };
    const badgeOf = (id) => document.querySelector(`[data-att="${id}"] .att-badge`).textContent.replace(/\s+/g, ' ').trim();
    await TA('attendance view: today by default, faces by position, every one Presente', async () => {
      await withAttendanceView(async () => {
        const faces = [...document.querySelectorAll('.squad [data-att]')];
        if (home.attendanceDate !== todayIso() || home.attendanceKind !== 'ENTRENO' || $('att-date').value !== todayIso()) throw new Error(home.attendanceDate + home.attendanceKind);
        if (faces.length !== 3 || faces.some((f) => f.disabled) || !faces.every((f) => /Presente/.test(f.textContent))) throw new Error(faces.map((f) => f.textContent).join('|'));
        if (document.querySelectorAll('.squad h4').length !== 3) throw new Error('not grouped by position');
        if (document.querySelector('[data-att-kind="ENTRENO"]').getAttribute('aria-pressed') !== 'true' || document.querySelector('[data-att-kind="PARTIDO"]').getAttribute('aria-pressed') !== 'false') throw new Error('kind chips');
        if (!/3 presentes/.test(flatText(document.querySelector('.att-count'))) || /NaN|undefined/.test($('home').textContent)) throw new Error(flatText(document.querySelector('.att-count')));
        if (document.querySelector('[data-att-delete]')) throw new Error('delete offered for a session that does not exist');
      });
    });
    await TA('attendance view: tapping a face cycles its badge text and saves the session', async () => {
      await withAttendanceView(async () => {
        const id = home.roster[1].id, seen = [badgeOf(id)];
        for (let i = 0; i < 4; i++) { document.querySelector(`[data-att="${id}"]`).click(); seen.push(badgeOf(id)); }
        if (seen.join() !== 'P Presente,F Falta,J Justificada,L Lesionado,P Presente') throw new Error(seen.join());
        document.querySelector(`[data-att="${id}"]`).click();
        document.querySelector(`[data-att="${home.roster[2].id}"]`).click();
        document.querySelector(`[data-att="${home.roster[2].id}"]`).click();
        const stored = localSessions();
        if (stored.length !== 1 || !stored[0].dirty || stored[0].date !== todayIso() || stored[0].marks[id].s !== 'F' || stored[0].marks[home.roster[2].id].s !== 'J') throw new Error(JSON.stringify(stored));
        if (!/1 presente · 1 falta · 1 justificada/.test(flatText(document.querySelector('.att-count'))) || !/Guardado en la tablet/.test($('home-status').textContent)) throw new Error(flatText(document.querySelector('.att-count')));
        if (!document.querySelector('[data-att-delete]')) throw new Error('no delete for a saved session');
        await syncAttendance();
        if (localSessions()[0].dirty || (await backend.listSessions('cal-team')).length !== 1 || !/Subido/.test($('home-status').textContent)) throw new Error('not uploaded');
      });
    });
    await TA('attendance view: on a match day, convocados are locked and others read No convocado', async () => {
      const day = todayIso(), call = (ids) => ({ id: 'mx', date: day, them: 'Rival', state: { players: ids.map((id) => ({ id })) } });
      await withAttendanceView(async () => {
        home.season = home.stateMatches = [call([home.roster[0].id, home.roster[1].id])];
        home.teamMatches = [{ id: 'mx', date: day, them: 'Rival' }];
        await showAttendance();
        const [gk, lat, piv] = home.roster.map((p) => document.querySelector(`[data-att="${p.id}"]`));
        if (home.attendanceKind !== 'PARTIDO' || !gk.disabled || !lat.disabled || piv.disabled) throw new Error('lock: ' + home.attendanceKind);
        if (!/Convocado/.test(gk.textContent) || !/No convocado/.test(piv.textContent)) throw new Error(gk.textContent + '|' + piv.textContent);
        if (!/2 presentes/.test(flatText(document.querySelector('.att-count'))) || /no convocado/i.test(flatText(document.querySelector('.att-count')))) throw new Error('counter ' + flatText(document.querySelector('.att-count')));
        gk.click();
        if (localSessions().length) throw new Error('a locked face changed the session');
        piv.click();
        if (!/F Falta/.test(badgeOf(home.roster[2].id)) || localSessions()[0].matchId !== 'mx') throw new Error(badgeOf(home.roster[2].id) + JSON.stringify(localSessions()));
        for (let i = 0; i < 3; i++) document.querySelector(`[data-att="${home.roster[2].id}"]`).click();
        if (!/No convocado/.test(badgeOf(home.roster[2].id))) throw new Error('did not return to No convocado');
      });
    });
    await TA('attendance view: a fixture kickoff today also makes it a match day', async () => {
      await withAttendanceView(async () => {
        home.fixtures = [fx('f1', 1, weekOf(todayIso())[1], 'Rival', { kickoff: new Date().toISOString() })];
        await showAttendance();
        if (home.attendanceKind !== 'PARTIDO') throw new Error(home.attendanceKind);
      });
    });
    await TA('attendance view: a note is saved and escaped', async () => {
      await withAttendanceView(async () => {
        const id = home.roster[1].id;
        if (document.querySelector(`[data-att-note="${id}"]`)) throw new Error('a note offered to a present player');
        document.querySelector(`[data-att="${id}"]`).click();
        document.querySelector(`[data-att-note="${id}"]`).click();
        const input = document.querySelector(`[data-att-note-input="${id}"]`);
        if (!input || Number(input.maxLength) !== CONFIG.attendance.noteMax) throw new Error('no note input');
        input.value = '<img src=x onerror=alert(1)>';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        if (localSessions()[0].marks[id].n !== '<img src=x onerror=alert(1)>') throw new Error(JSON.stringify(localSessions()));
        document.querySelector(`[data-att="${id}"]`).click();
        if (document.querySelector('.squad img[src="x"]') || !$('home').textContent.includes('<img src=x onerror=alert(1)>') || localSessions()[0].marks[id].s !== 'J') throw new Error('note lost or markup rendered');
        document.querySelector(`[data-att-note="${id}"]`).click();
        if (document.querySelector(`[data-att-note-input="${id}"]`).value !== '<img src=x onerror=alert(1)>') throw new Error('the input does not hold the note');
      });
    });
    await TA('attendance view: a note typed and never confirmed survives a tap on another face', async () => {
      await withAttendanceView(async () => {
        const [first, second] = [home.roster[1].id, home.roster[2].id];
        document.querySelector(`[data-att="${first}"]`).click();
        document.querySelector(`[data-att-note="${first}"]`).click();
        const input = document.querySelector(`[data-att-note-input="${first}"]`);
        input.value = 'rodilla';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector(`[data-att="${second}"]`).click();
        if (localSessions()[0].marks[first].n !== 'rodilla' || document.querySelector('[data-att-note-input]')) throw new Error(JSON.stringify(localSessions()));
        document.querySelector(`[data-att-note="${first}"]`).click();
        document.querySelector('[data-att-note-save]').click();
        if (document.querySelector('[data-att-note-input]') || !/rodilla/.test(document.querySelector(`[data-att-note="${first}"]`).textContent)) throw new Error('Guardar did not close the editor');
        if (document.querySelectorAll('.att-foot').length !== 3) throw new Error('every tile needs the footer slot');
      });
    });
    await TA('attendance view: a match still in setup locks its convocados and its id is backfilled', async () => {
      const day = todayIso();
      await withAttendanceView(async () => {
        const setup = { id: 'ms', date: day, them: 'Rival', status: 'setup', state: { players: [{ id: home.roster[0].id }] } };
        home.stateMatches = [setup]; home.teamMatches = [{ id: 'ms', date: day, them: 'Rival' }];
        await showAttendance();
        if (home.attendanceKind !== 'PARTIDO' || !document.querySelector(`[data-att="${home.roster[0].id}"]`).disabled || !/1 presente/.test(flatText(document.querySelector('.att-count')))) throw new Error('setup match not counted');
        document.querySelector(`[data-att="${home.roster[1].id}"]`).click();
        if (localSessions()[0].matchId !== 'ms') throw new Error('no match id');
        home.stateMatches = []; home.sessions = home.sessions.map((x) => ({ ...x, matchId: null }));
        home.stateMatches = [setup];
        document.querySelector(`[data-att="${home.roster[1].id}"]`).click();
        if (localSessions()[0].matchId !== 'ms') throw new Error('match id not backfilled: ' + JSON.stringify(localSessions()));
      });
    });
    await TA('attendance view: changing the date opens that day\'s session', async () => {
      await withAttendanceView(async () => {
        const id = home.roster[0].id;
        document.querySelector(`[data-att="${id}"]`).click();
        $('att-date').value = '2026-10-01';
        $('att-date').dispatchEvent(new Event('change', { bubbles: true }));
        if (home.attendanceDate !== '2026-10-01' || !/Presente/.test(badgeOf(id)) || document.querySelector('[data-att-delete]')) throw new Error('the other day shows today\'s marks');
        document.querySelector(`[data-att="${id}"]`).click();
        document.querySelector(`[data-att="${id}"]`).click();
        $('att-date').value = todayIso();
        $('att-date').dispatchEvent(new Event('change', { bubbles: true }));
        if (!/Falta/.test(badgeOf(id))) throw new Error('today lost its mark');
        $('att-date').value = '';
        $('att-date').dispatchEvent(new Event('change', { bubbles: true }));
        if (home.attendanceDate !== todayIso() || $('att-date').value !== todayIso()) throw new Error('an empty date was accepted');
      });
    });
    await TA('attendance view: Borrar sesión is armed, then removes the session', async () => {
      await withAttendanceView(async () => {
        const id = home.roster[0].id;
        document.querySelector(`[data-att="${id}"]`).click();
        await syncAttendance();
        document.querySelector('[data-att-delete]').click();
        if ((await backend.listSessions('cal-team')).length !== 1 || !/¿Seguro\?/.test(document.querySelector('[data-att-delete]').textContent)) throw new Error('deleted on the first tap');
        document.querySelector('[data-att-delete]').click();
        for (let i = 0; i < 5; i++) await tick0();
        if ((await backend.listSessions('cal-team')).length || localSessions().length || home.sessions.length || !/Presente/.test(badgeOf(id)) || document.querySelector('[data-att-delete]')) throw new Error('session kept');
      });
    });
    await TA('attendance view: the team page offers Asistencia', async () => {
      await withAttendanceView(async () => {
        showHomeView('team');
        const open = document.querySelector('.squad [data-home-view="attendance"]');
        if (!open || open.textContent !== 'Asistencia') throw new Error('no Asistencia button');
        open.click();
        for (let i = 0; i < 5; i++) await tick0();
        if (home.view !== 'attendance' || !document.querySelector('[data-att]')) throw new Error(home.view);
      });
    });
    // Attendance rates: pure rows first, then the three pages that show them.
    const ratePlayers = [1, 2, 3].map((n) => ({ id: 'ra' + n, num: n, name: 'Jugador ' + n, pos: n === 1 ? 'POR' : 'LI' }));
    const rateMatch = (id, date, ids, status = 'finished') => ({ id, date, status, state: { players: ids.map((x) => ({ id: x })) } });
    const rateSession = (date, kind, marks = {}, matchId = null) => ({ ...emptySession(date, kind), matchId, marks });
    const rowOf = (rows, id) => rows.find((r) => r.player.id === id);
    await TA('attendance: match convocados count present, non-convocados are not counted', async () => {
      const matches = [rateMatch('rm1', '2026-10-17', ['ra1', 'ra2']), rateMatch('rm2', '2026-10-24', ['ra1'], 'setup')];
      const derived = attendanceRows([], matches, ratePlayers);
      const r1 = rowOf(derived, 'ra1'), r3 = rowOf(derived, 'ra3');
      if (r1.P !== 1 || r1.counted !== 1 || r1.pct !== 100 || r1.byKind.PARTIDO.counted !== 1 || r1.byKind.ENTRENO.counted !== 0) throw new Error('convocado: ' + JSON.stringify(r1));
      if (r3.counted !== 0 || r3.F + r3.P + r3.J + r3.L !== 0) throw new Error('non-convocado counted (or a setup match derived): ' + JSON.stringify(r3));
      // A stored «Partido» session replaces the derived one: the convocados stay present (once) and a non-convocado marked F counts.
      const stored = attendanceRows([rateSession('2026-10-17', 'PARTIDO', { ra3: { s: 'F' } }, 'rm1')], matches, ratePlayers);
      if (rowOf(stored, 'ra1').counted !== 1 || rowOf(stored, 'ra3').F !== 1 || rowOf(stored, 'ra3').pct !== 0) throw new Error('stored match day: ' + JSON.stringify(stored.map((r) => [r.P, r.F, r.counted])));
      // Found by date when the stored session has no match id yet.
      if (rowOf(attendanceRows([rateSession('2026-10-17', 'PARTIDO')], matches, ratePlayers), 'ra1').counted !== 1) throw new Error('date link');
    });
    await TA('attendance: injured sessions leave the rate, absences and justified lower it', async () => {
      const days = [['2026-10-01', { ra1: { s: 'L' } }], ['2026-10-02', { ra1: { s: 'F' } }], ['2026-10-03', { ra1: { s: 'J' } }], ['2026-10-04', {}]];
      const r = rowOf(attendanceRows(days.map(([d, marks]) => rateSession(d, 'ENTRENO', marks)), [], ratePlayers), 'ra1');
      if (r.P !== 1 || r.F !== 1 || r.J !== 1 || r.L !== 1 || r.counted !== 3 || r.pct !== 33 || r.byKind.ENTRENO.pct !== 33 || r.byKind.PARTIDO.pct !== null) throw new Error(JSON.stringify(r));
    });
    await TA('attendance: a player with no counted session reads – and no NaN', async () => {
      const onlyInjured = rateSession('2026-10-01', 'ENTRENO', { ra2: { s: 'L' } });
      const rows = attendanceRows([onlyInjured], [], ratePlayers);
      if (rowOf(rows, 'ra2').pct !== null || attendanceRows([], [], ratePlayers).some((r) => r.pct !== null)) throw new Error('pct must be null');
      await withAttendanceView(async () => {
        home.roster = ratePlayers; home.sessions = [onlyInjured]; home.stateMatches = []; home.season = [];
        showHomeView('team');
        const text = $('home').textContent;
        if (/NaN|undefined/.test(text) || !document.querySelector('.squad [data-player="ra2"] .face-att') || document.querySelector('[data-player="ra2"] .face-att').textContent.trim() !== '–') throw new Error('squad: ' + text.slice(0, 200));
        home.sessions = []; showHomeView('team');
        if (document.querySelector('.attendance-card') || document.querySelector('.face-att')) throw new Error('rates shown without sessions');
      });
    });
    await TA('player card: attendance tile with percent and counts', async () => {
      await withAttendanceView(async () => {
        home.sessions = [rateSession('2026-10-01', 'ENTRENO'), rateSession('2026-10-02', 'ENTRENO', { ca: { s: 'F' } }), rateSession('2026-10-03', 'ENTRENO', { ca: { s: 'J' } }), rateSession('2026-10-04', 'ENTRENO', { ca: { s: 'L' } })];
        openCard('ca', [cardMatch()]);
        home.stateMatches = home.season;
        showPlayer('ca');
        const tile = document.querySelector('.att-tile'), text = tile && tile.textContent.replace(/\s+/g, ' ').trim();
        if (!text || !text.includes('Asistencia · 50%') || !text.includes('2 de 4 · 1 falta · 1 justificada · 1 lesionado') || !text.includes('Entrenos 33% · Partidos 100%') || /NaN|undefined/.test(text)) throw new Error(text);
        if (document.querySelector('.att-tile .att-low') === null) throw new Error('50 % is below warnPct and needs the «!»');
      });
    });
    await TA('team page: most absences ranked by faltas, then justificadas', async () => {
      await withAttendanceView(async () => {
        const marks = (...codes) => Object.fromEntries(codes.map(([id, s]) => [id, { s }]));
        home.roster = [1, 2, 3, 4, 5].map((n) => ({ id: 'rt' + n, num: n, name: 'Jugador ' + n, pos: 'LI' }));
        home.stateMatches = []; home.season = [];
        home.sessions = [rateSession('2026-10-01', 'ENTRENO', marks(['rt1', 'F'], ['rt2', 'J'], ['rt3', 'F'], ['rt4', 'J'])), rateSession('2026-10-02', 'ENTRENO', marks(['rt3', 'F'], ['rt2', 'J'], ['rt1', 'J']))];
        showHomeView('team');
        const card = document.querySelector('.attendance-card');
        if (!card || !/Más faltas/.test(card.textContent) || !card.textContent.includes('2 entrenos · 0 partidos')) throw new Error(card && card.textContent);
        const order = [...card.querySelectorAll('[data-player]')].map((b) => b.dataset.player).join();
        if (order !== 'rt3,rt1,rt2') throw new Error('order: ' + order);
        if (card.querySelector('[data-player="rt5"]') || card.querySelector('[data-player="rt4"]')) throw new Error('only the top 3 with absences');
      });
    });
    await TA('squad: low attendance is marked with text, not colour only', async () => {
      await withAttendanceView(async () => {
        home.roster = ratePlayers; home.stateMatches = []; home.season = [];
        home.sessions = [rateSession('2026-10-01', 'ENTRENO', { ra1: { s: 'F' } }), rateSession('2026-10-02', 'ENTRENO')];
        showHomeView('team');
        const low = document.querySelector('.squad [data-player="ra1"]'), fine = document.querySelector('.squad [data-player="ra2"]');
        if (!low.textContent.includes('50%') || !low.querySelector('.att-low[aria-label]') || low.querySelector('.att-low').textContent !== '!' || !/baja/.test(low.getAttribute('aria-label'))) throw new Error('low: ' + low.outerHTML.slice(0, 300));
        if (!fine.textContent.includes('100%') || fine.querySelector('.att-low')) throw new Error('fine marked');
      });
    });
    await TA('attendance: a team switch forgets the other team\'s matches before its season loads', async () => {
      await withAttendanceView(async () => {
        const day = todayIso(), other = { id: 'cal-other', club: 'Other', name: 'Other', brand: '#1a4a8a', brand2: '#ffffff', brandInk: '#ffffff', crest: null };
        const real = backend, previous = team;
        try {
          home.stateMatches = [{ id: 'foreign', date: day, them: 'Rival', status: 'finished', state: { players: [] } }];
          backend = { ...real, listMatchStates: () => new Promise(() => {}), listPlayers: async () => [], listFixtures: async () => [], listSessions: async () => [] };
          selectTeam(other);
          if (attendanceMatch(day) !== null || home.stateMatches.length) throw new Error('the old team\'s matches are still there');
          showAttendance(); home.attendanceKind = 'PARTIDO'; renderHome();
          if (localSessions('cal-other').some((x) => x.matchId === 'foreign')) throw new Error('foreign match id stored');
        } finally { backend = real; applyTeam(previous); home.stateMatches = []; }
      });
    });
    await TA('attendance: sessions load once per team, fall back to the device copy and reload when back online', async () => {
      await withAttendanceView(async () => {
        const real = backend;
        let reads = 0;
        try {
          backend = { ...real, listSessions: async () => { reads += 1; return []; } };
          home.sessions = null; await ensureSessions(); await ensureSessions();
          if (reads !== 1 || !Array.isArray(home.sessions)) throw new Error('reads ' + reads);
          backend = { ...real, listSessions: async () => { throw new Error('sin conexión'); } };
          removeKey(CACHE_KEY_PREFIX + 'attendance:' + team.id);
          home.sessions = null; await ensureSessions();
          if (!Array.isArray(home.sessions)) throw new Error('no fallback');
          backend = { ...real, listSessions: async () => { reads += 1; return [rateSession('2026-10-01', 'ENTRENO')]; } };
          showHomeView('team'); window.dispatchEvent(new Event('online'));
          for (let i = 0; i < 5; i++) await tick0();
          if (reads !== 2 || home.sessions.length !== 1) throw new Error('not reloaded: ' + reads);
        } finally { backend = real; }
      });
    });
    await TA('calendar: deleting a team removes its calendar copy from the device', async () => {
      const gone = { id: 'cal-gone', club: 'Gone', name: 'Gone', brand: '#1a4a8a', brand2: '#ffffff', brandInk: '#ffffff', crest: null };
      const real = backend, previous = team, savedTeams = home.teams;
      try {
        backend = { deleteTeam: async () => {} };
        applyTeam(gone);
        writeJson(CACHE_KEY_PREFIX + 'fixtures:cal-gone', [fx('f', 1, '2026-10-18', 'A')]);
        home.teams = [gone, previous];
        await deleteTeam();
        if (readJson(CACHE_KEY_PREFIX + 'fixtures:cal-gone') !== null) throw new Error('calendar copy kept');
      } finally { backend = real; applyTeam(previous); home.teams = savedTeams; showHomeView('team'); }
    });
    currentMatchId = null; removeKey(CURRENT_MATCH_KEY);
    state = sampleState(); ['home', 'sheet', 'final'].forEach((id) => { $(id).hidden = true; }); commit();
  };
  accountTests().then(() => loadPdfLibs()).then(() => {
    T('pdf match', () => { addNote('Salida fallada del 9 en la 2ª acción — revisar'); const { doc, filename } = buildPdf('match'); undo(); __results.push('match pages ' + doc.getNumberOfPages() + ' ' + filename); window.__pdfMatch = doc.output('datauristring'); });
    T('pdf players', () => { const { doc } = buildPdf('players'); __results.push('players pages ' + doc.getNumberOfPages()); window.__pdfPlayers = doc.output('datauristring'); });
    T('pdf one', () => { const { filename } = buildPdf('p8'); __results.push(filename); });
  }).catch((e) => __results.push('FAIL libs ' + e.message)).finally(() => {
    const pre = document.createElement('pre'); pre.id = 'res'; pre.textContent = __results.join('\n'); document.body.appendChild(pre);
    ['__pdfMatch', '__pdfPlayers'].forEach((k) => { if (window[k]) { const t = document.createElement('textarea'); t.id = k; t.textContent = window[k]; document.body.appendChild(t); } });
  });
