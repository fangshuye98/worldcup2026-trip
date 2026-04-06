// Interactive Stadium Seat Maps — StubHub-style per-venue maps
// Each stadium has a unique shape, section layout, and level structure.

const CX = 250, CY = 210;
const VIEWBOX = '0 0 500 420';
const SECTION_GAP = 0.6; // degrees between sections

// ───────────────────────────────────────────────────
// Stadium configurations (shape, levels, sections)
// ───────────────────────────────────────────────────
const STADIUMS = {
  'Mercedes-Benz Stadium': {
    name: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    baseRx: 185, baseRy: 155,
    shapePower: 2.8,            // slightly octagonal superellipse
    fieldW: 78, fieldH: 50,
    levels: [
      { name: '100 Level', color: '#1e4080', hoverColor: '#3b82f6', inner: 0.44, outer: 0.55, count: 32, startNum: 101 },
      { name: '200 Level', color: '#4c1d95', hoverColor: '#8b5cf6', inner: 0.59, outer: 0.68, count: 24, startNum: 201 },
      { name: '300 Level', color: '#7f1d1d', hoverColor: '#ef4444', inner: 0.73, outer: 0.88, count: 32, startNum: 301 },
    ],
    decorations(svg) {
      // Subtle 8 petal roof lines
      let d = '';
      for (let i = 0; i < 8; i++) {
        const a = i * 45 * Math.PI / 180;
        const x1 = CX + 30 * Math.sin(a), y1 = CY - 30 * Math.cos(a);
        const x2 = CX + 60 * Math.sin(a), y2 = CY - 60 * Math.cos(a);
        d += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#1a2040" stroke-width="0.4" opacity="0.5"/>`;
      }
      return d;
    }
  },
  'Gillette Stadium': {
    name: 'Gillette Stadium',
    city: 'Foxborough',
    baseRx: 192, baseRy: 138,
    shapePower: 2.0,            // standard ellipse (elongated)
    fieldW: 76, fieldH: 46,
    levels: [
      { name: '100 Level', color: '#1e3a6e', hoverColor: '#3b82f6', inner: 0.44, outer: 0.55, count: 36, startNum: 101 },
      { name: '200 Level', color: '#4c1d95', hoverColor: '#8b5cf6', inner: 0.59, outer: 0.68, count: 24, startNum: 201 },
      { name: '300 Level', color: '#7f1d1d', hoverColor: '#ef4444', inner: 0.73, outer: 0.88, count: 36, startNum: 301 },
    ],
    decorations() {
      // Lighthouse beacon at ~0° (top, north)
      return `<polygon points="${CX},${CY - 155} ${CX - 4},${CY - 145} ${CX + 4},${CY - 145}" fill="#334155" opacity="0.4"/>
              <circle cx="${CX}" cy="${CY - 157}" r="2" fill="#fbbf24" opacity="0.35"/>`;
    }
  },
  'SoFi Stadium': {
    name: 'SoFi Stadium',
    city: 'Inglewood',
    baseRx: 196, baseRy: 132,
    shapePower: 2.3,            // slightly squared, wide
    fieldW: 68, fieldH: 40,
    levels: [
      { name: '100 Level', color: '#1e3a6e', hoverColor: '#3b82f6', inner: 0.34, outer: 0.43, count: 32, startNum: 101 },
      { name: '200 Level', color: '#065f46', hoverColor: '#10b981', inner: 0.47, outer: 0.54, count: 24, startNum: 201 },
      { name: '300 Level', color: '#4c1d95', hoverColor: '#8b5cf6', inner: 0.58, outer: 0.66, count: 32, startNum: 301 },
      { name: '400 Level', color: '#7f1d1d', hoverColor: '#ef4444', inner: 0.70, outer: 0.82, count: 60, startNum: 401 },
    ],
    decorations() {
      // Canopy arc
      return `<ellipse cx="${CX}" cy="${CY}" rx="172" ry="116" fill="none" stroke="#1e293b" stroke-width="0.6" stroke-dasharray="4 3" opacity="0.35"/>`;
    }
  },
  'AT&T Stadium': {
    name: 'AT&T Stadium',
    city: 'Arlington',
    baseRx: 184, baseRy: 146,
    shapePower: 3.5,            // more rectangular
    fieldW: 72, fieldH: 44,
    levels: [
      { name: '100 Level', color: '#1e3a6e', hoverColor: '#3b82f6', inner: 0.34, outer: 0.43, count: 36, startNum: 101 },
      { name: '200 Level', color: '#065f46', hoverColor: '#10b981', inner: 0.47, outer: 0.54, count: 28, startNum: 201 },
      { name: '300 Level', color: '#4c1d95', hoverColor: '#8b5cf6', inner: 0.58, outer: 0.66, count: 36, startNum: 301 },
      { name: '400 Level', color: '#7f1d1d', hoverColor: '#ef4444', inner: 0.70, outer: 0.82, count: 42, startNum: 401 },
    ],
    decorations() {
      // Giant center video board
      return `<rect x="${CX - 28}" y="${CY - 5}" width="56" height="10" rx="2" fill="none" stroke="#334155" stroke-width="0.5" opacity="0.5"/>
              <rect x="${CX - 26}" y="${CY - 3.5}" width="52" height="7" rx="1.5" fill="#0f172a" opacity="0.4"/>`;
    }
  },
};

// ───────────────────────────────────────────────────
// Geometry helpers
// ───────────────────────────────────────────────────

/** Point on superellipse boundary.  angleDeg: 0=top (12-o'clock), clockwise. */
function superellipsePoint(rx, ry, angleDeg, n) {
  const rad = angleDeg * Math.PI / 180;
  const s = Math.sin(rad);   // horizontal
  const c = Math.cos(rad);   // vertical
  const as = Math.abs(s), ac = Math.abs(c);
  let r;
  if (as < 1e-12) r = ry;
  else if (ac < 1e-12) r = rx;
  else r = Math.pow(Math.pow(as / rx, n) + Math.pow(ac / ry, n), -1 / n);
  return { x: CX + r * s, y: CY - r * c };
}

/** SVG path for a ring-segment (section). */
function sectionPath(irx, iry, orx, ory, startA, endA, n, steps = 6) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = startA + (endA - startA) * i / steps;
    pts.push(superellipsePoint(irx, iry, a, n));
  }
  for (let i = steps; i >= 0; i--) {
    const a = startA + (endA - startA) * i / steps;
    pts.push(superellipsePoint(orx, ory, a, n));
  }
  return 'M' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L') + 'Z';
}

/** Center point of a section (for label placement). */
function sectionCenter(irx, iry, orx, ory, startA, endA, n) {
  const midA = (startA + endA) / 2;
  const mrx = (irx + orx) / 2, mry = (iry + ory) / 2;
  return superellipsePoint(mrx, mry, midA, n);
}

/** Build a closed superellipse outline path. */
function outlinePath(rx, ry, n, stepDeg = 2) {
  const pts = [];
  for (let a = 0; a < 360; a += stepDeg) pts.push(superellipsePoint(rx, ry, a, n));
  return 'M' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L') + 'Z';
}

// ───────────────────────────────────────────────────
// SVG generation
// ───────────────────────────────────────────────────

function generateSVGContent(config, userBlock) {
  const { baseRx, baseRy, shapePower: n, fieldW, fieldH, levels } = config;
  let svg = '';

  // Outer background shell
  const outerLevel = levels[levels.length - 1];
  const bgRx = baseRx * (outerLevel.outer + 0.04);
  const bgRy = baseRy * (outerLevel.outer + 0.04);
  svg += `<path d="${outlinePath(bgRx, bgRy, n)}" fill="#0a0e1f" stroke="#1a2040" stroke-width="1"/>`;

  // Draw sections level by level (inner → outer)
  levels.forEach((level, li) => {
    const irx = baseRx * level.inner, iry = baseRy * level.inner;
    const orx = baseRx * level.outer, ory = baseRy * level.outer;
    const arc = 360 / level.count;
    const halfGap = SECTION_GAP / 2;

    for (let si = 0; si < level.count; si++) {
      const num = level.startNum + si;
      const sA = si * arc + halfGap;
      const eA = (si + 1) * arc - halfGap;
      const isUser = (num === userBlock);

      const d = sectionPath(irx, iry, orx, ory, sA, eA, n);
      const fill = isUser ? '#fbbf24' : level.color;
      const cls = 'seatmap-sec' + (isUser ? ' seatmap-user-sec' : '');

      svg += `<path d="${d}" class="${cls}" data-section="${num}" data-level="${li}" data-level-name="${level.name}" fill="${fill}" stroke="#0d1225" stroke-width="0.5"/>`;

      // Label
      const ctr = sectionCenter(irx, iry, orx, ory, sA, eA, n);
      const fontSize = level.count > 40 ? 3.8 : level.count > 28 ? 4.5 : 5.5;
      const labelFill = isUser ? '#1a1a2e' : 'rgba(255,255,255,0.55)';
      const fw = isUser ? '800' : '500';
      svg += `<text x="${ctr.x.toFixed(1)}" y="${ctr.y.toFixed(1)}" class="seatmap-label" data-level="${li}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" fill="${labelFill}" font-weight="${fw}" font-family="system-ui,sans-serif" pointer-events="none">${num}</text>`;
    }
  });

  // Animated glow on user section
  const userCtr = findUserCenter(config, userBlock);
  if (userCtr) {
    svg += `<circle cx="${userCtr.x.toFixed(1)}" cy="${userCtr.y.toFixed(1)}" r="18" fill="#fbbf24" opacity="0.12" pointer-events="none">
      <animate attributeName="r" values="14;24;14" dur="2.2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.18;0.04;0.18" dur="2.2s" repeatCount="indefinite"/>
    </circle>`;
  }

  // Inner concourse
  const innerLevel = levels[0];
  const cRx = baseRx * (innerLevel.inner - 0.03);
  const cRy = baseRy * (innerLevel.inner - 0.03);
  svg += `<path d="${outlinePath(cRx, cRy, n)}" fill="#070b1a" stroke="#151b3a" stroke-width="0.5"/>`;

  // Stadium-specific decorations
  if (config.decorations) svg += config.decorations();

  // Field
  const fx = CX - fieldW / 2, fy = CY - fieldH / 2;
  svg += `<rect x="${fx}" y="${fy}" width="${fieldW}" height="${fieldH}" rx="4" fill="#14451a" stroke="#1f6b28" stroke-width="0.5"/>`;
  // Halfway line
  svg += `<line x1="${CX}" y1="${fy}" x2="${CX}" y2="${fy + fieldH}" stroke="#1f6b28" stroke-width="0.3"/>`;
  // Center circle
  svg += `<circle cx="${CX}" cy="${CY}" r="${fieldH * 0.15}" fill="none" stroke="#1f6b28" stroke-width="0.3"/>`;
  svg += `<circle cx="${CX}" cy="${CY}" r="1" fill="#1f6b28"/>`;
  // Penalty areas
  const paW = fieldW * 0.44, paH = fieldH * 0.2;
  svg += `<rect x="${CX - paW / 2}" y="${fy}" width="${paW}" height="${paH}" rx="1" fill="none" stroke="#1f6b28" stroke-width="0.25"/>`;
  svg += `<rect x="${CX - paW / 2}" y="${fy + fieldH - paH}" width="${paW}" height="${paH}" rx="1" fill="none" stroke="#1f6b28" stroke-width="0.25"/>`;
  // Goal boxes
  const gbW = fieldW * 0.22, gbH = fieldH * 0.08;
  svg += `<rect x="${CX - gbW / 2}" y="${fy}" width="${gbW}" height="${gbH}" rx="0.5" fill="none" stroke="#1f6b28" stroke-width="0.2"/>`;
  svg += `<rect x="${CX - gbW / 2}" y="${fy + fieldH - gbH}" width="${gbW}" height="${gbH}" rx="0.5" fill="none" stroke="#1f6b28" stroke-width="0.2"/>`;

  return svg;
}

function findUserCenter(config, userBlock) {
  if (!userBlock) return null;
  const { baseRx, baseRy, shapePower: n, levels } = config;
  for (const level of levels) {
    const idx = userBlock - level.startNum;
    if (idx >= 0 && idx < level.count) {
      const irx = baseRx * level.inner, iry = baseRy * level.inner;
      const orx = baseRx * level.outer, ory = baseRy * level.outer;
      const arc = 360 / level.count;
      const sA = idx * arc + SECTION_GAP / 2;
      const eA = (idx + 1) * arc - SECTION_GAP / 2;
      return sectionCenter(irx, iry, orx, ory, sA, eA, n);
    }
  }
  return null;
}

// ───────────────────────────────────────────────────
// Render into container
// ───────────────────────────────────────────────────

function renderMap(container, config, userBlock, userRow, userSeats, userLevel) {
  const id = 'sm-' + Math.random().toString(36).slice(2, 8);

  const levelBtns = config.levels.map((l, i) =>
    `<button class="seatmap-lvl-btn active" data-map="${id}" data-level="${i}">
      <span class="seatmap-lvl-dot" style="background:${l.color}"></span>${l.name}
    </button>`
  ).join('');

  const svgContent = generateSVGContent(config, userBlock);

  container.innerHTML = `
    <div class="seatmap-panel" id="${id}">
      <div class="seatmap-top-bar">
        <div class="seatmap-venue-title">🏟️ ${config.name}</div>
        <button class="seatmap-find-btn" data-map="${id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
          My Seats
        </button>
      </div>
      <div class="seatmap-level-bar">${levelBtns}</div>
      <div class="seatmap-viewport" data-map="${id}">
        <svg viewBox="${VIEWBOX}" xmlns="http://www.w3.org/2000/svg" class="seatmap-svg">
          <g class="seatmap-g">${svgContent}</g>
        </svg>
        <div class="seatmap-tooltip"></div>
        <div class="seatmap-zoom-bar">
          <button class="seatmap-zoom-btn" data-action="in" title="Zoom in">+</button>
          <button class="seatmap-zoom-btn" data-action="reset" title="Reset view">⊙</button>
          <button class="seatmap-zoom-btn" data-action="out" title="Zoom out">−</button>
        </div>
        <div class="seatmap-hint">Scroll to zoom · Drag to pan</div>
      </div>
    </div>`;

  setupInteraction(container, id, config, userBlock, userRow, userSeats, userLevel);
}

// ───────────────────────────────────────────────────
// Interactivity (zoom, pan, hover, level toggles)
// ───────────────────────────────────────────────────

function setupInteraction(container, mapId, config, userBlock, userRow, userSeats, userLevel) {
  const panel = container.querySelector(`#${mapId}`);
  const viewport = panel.querySelector('.seatmap-viewport');
  const svg = viewport.querySelector('.seatmap-svg');
  const g = svg.querySelector('.seatmap-g');
  const tooltip = viewport.querySelector('.seatmap-tooltip');

  // ── State ──
  const st = { zoom: 1, panX: 0, panY: 0, dragging: false, sx: 0, sy: 0, spx: 0, spy: 0 };

  function applyTransform(animate) {
    g.style.transition = animate ? 'transform 0.35s cubic-bezier(.4,0,.2,1)' : 'none';
    g.setAttribute('transform', `translate(${st.panX.toFixed(2)} ${st.panY.toFixed(2)}) scale(${st.zoom.toFixed(4)})`);
  }

  function viewBoxScale() {
    const r = svg.getBoundingClientRect();
    return { sx: 500 / r.width, sy: 420 / r.height };
  }

  // ── Zoom buttons ──
  panel.querySelectorAll('.seatmap-zoom-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.action;
      const vb = viewBoxScale();
      // Zoom centred on viewBox middle
      const vcx = 250, vcy = 210;
      const ccx = (vcx - st.panX) / st.zoom;
      const ccy = (vcy - st.panY) / st.zoom;
      const oldZ = st.zoom;
      if (a === 'in') st.zoom = Math.min(st.zoom * 1.5, 10);
      else if (a === 'out') st.zoom = Math.max(st.zoom / 1.5, 0.5);
      else { st.zoom = 1; st.panX = 0; st.panY = 0; applyTransform(true); return; }
      st.panX += ccx * (oldZ - st.zoom);
      st.panY += ccy * (oldZ - st.zoom);
      applyTransform(true);
    });
  });

  // ── Wheel zoom (centred on cursor) ──
  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    const vbx = (e.clientX - r.left) * (500 / r.width);
    const vby = (e.clientY - r.top) * (420 / r.height);
    const ccx = (vbx - st.panX) / st.zoom;
    const ccy = (vby - st.panY) / st.zoom;
    const oldZ = st.zoom;
    const factor = e.deltaY > 0 ? 0.88 : 1.14;
    st.zoom = Math.max(0.5, Math.min(10, st.zoom * factor));
    st.panX += ccx * (oldZ - st.zoom);
    st.panY += ccy * (oldZ - st.zoom);
    applyTransform(false);
  }, { passive: false });

  // ── Mouse drag pan ──
  viewport.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    st.dragging = true; st.sx = e.clientX; st.sy = e.clientY;
    st.spx = st.panX; st.spy = st.panY;
    viewport.classList.add('grabbing');
    e.preventDefault();
  });
  const onMouseMove = e => {
    if (!st.dragging) return;
    const { sx: scx, sy: scy } = viewBoxScale();
    st.panX = st.spx + (e.clientX - st.sx) * scx;
    st.panY = st.spy + (e.clientY - st.sy) * scy;
    applyTransform(false);
  };
  const onMouseUp = () => { if (st.dragging) { st.dragging = false; viewport.classList.remove('grabbing'); } };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // ── Touch drag + pinch zoom ──
  let lastDist = 0;
  viewport.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    } else if (e.touches.length === 1) {
      st.dragging = true; st.sx = e.touches[0].clientX; st.sy = e.touches[0].clientY;
      st.spx = st.panX; st.spy = st.panY;
    }
  }, { passive: true });
  viewport.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && lastDist) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const scale = d / lastDist;
      st.zoom = Math.max(0.5, Math.min(10, st.zoom * scale));
      lastDist = d;
      applyTransform(false);
      e.preventDefault();
    } else if (e.touches.length === 1 && st.dragging) {
      const { sx: scx, sy: scy } = viewBoxScale();
      st.panX = st.spx + (e.touches[0].clientX - st.sx) * scx;
      st.panY = st.spy + (e.touches[0].clientY - st.sy) * scy;
      applyTransform(false);
      e.preventDefault();
    }
  }, { passive: false });
  viewport.addEventListener('touchend', () => { st.dragging = false; lastDist = 0; });

  // ── Section hover / tooltip ──
  g.querySelectorAll('.seatmap-sec').forEach(sec => {
    sec.addEventListener('mouseenter', () => {
      const num = parseInt(sec.dataset.section);
      const li = parseInt(sec.dataset.level);
      const lvName = sec.dataset.levelName;
      const isUser = (num === userBlock);

      if (!isUser) sec.setAttribute('fill', config.levels[li].hoverColor);
      sec.style.filter = 'brightness(1.3)';

      let html = `<div class="seatmap-tip-num">Section ${num}</div><div class="seatmap-tip-level">${lvName}</div>`;
      if (isUser) {
        html += `<div class="seatmap-tip-user">⭐ YOUR SEATS</div>`;
        html += `<div class="seatmap-tip-detail">Row ${userRow} · Seats ${userSeats}</div>`;
        html += `<div class="seatmap-tip-detail">${userLevel}</div>`;
      }
      tooltip.innerHTML = html;
      tooltip.style.display = 'block';
    });

    sec.addEventListener('mouseleave', () => {
      const num = parseInt(sec.dataset.section);
      const li = parseInt(sec.dataset.level);
      if (num !== userBlock) sec.setAttribute('fill', config.levels[li].color);
      sec.style.filter = '';
      tooltip.style.display = 'none';
    });

    sec.addEventListener('mousemove', e => {
      const rect = viewport.getBoundingClientRect();
      let x = e.clientX - rect.left + 14;
      let y = e.clientY - rect.top - 10;
      if (x + 150 > rect.width) x = e.clientX - rect.left - 160;
      if (y < 0) y = 4;
      if (y + 80 > rect.height) y = rect.height - 84;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    });
  });

  // ── Level toggles ──
  panel.querySelectorAll('.seatmap-lvl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const li = btn.dataset.level;
      const vis = btn.classList.contains('active');
      g.querySelectorAll(`[data-level="${li}"]`).forEach(el => {
        el.style.display = vis ? '' : 'none';
      });
    });
  });

  // ── Find My Seats ──
  const findBtn = panel.querySelector('.seatmap-find-btn');
  if (findBtn) {
    findBtn.addEventListener('click', () => {
      const uc = findUserCenter(config, userBlock);
      if (!uc) return;
      st.zoom = 4;
      st.panX = 250 - st.zoom * uc.x;
      st.panY = 210 - st.zoom * uc.y;
      applyTransform(true);
    });
  }

  viewport.style.cursor = 'grab';

  // Hide hint after first interaction
  const hint = viewport.querySelector('.seatmap-hint');
  if (hint) {
    const hide = () => { hint.style.opacity = '0'; setTimeout(() => hint.remove(), 400); };
    viewport.addEventListener('wheel', hide, { once: true });
    viewport.addEventListener('mousedown', hide, { once: true });
    viewport.addEventListener('touchstart', hide, { once: true });
  }
}

// ───────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────

function findStadiumConfig(venue) {
  for (const key of Object.keys(STADIUMS)) {
    if (venue.includes(key)) return STADIUMS[key];
  }
  return null;
}

export function initSeatMaps() {
  document.querySelectorAll('.interactive-seatmap').forEach(el => {
    const venue = el.dataset.venue;
    const block = parseInt(el.dataset.block);
    const row = el.dataset.row;
    const seats = el.dataset.seats;
    const level = el.dataset.level;
    const config = findStadiumConfig(venue);
    if (!config) return;
    renderMap(el, config, block, row, seats, level);
  });
}
