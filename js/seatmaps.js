// 3-Panel Seat Map: Overview → Nearby Blocks → Section Detail
// Panel 1: Static mini overview (full stadium, dot for location)
// Panel 2: Interactive zoomed view of nearby sections
// Panel 3: Detailed row/seat grid for the user's section

function seq(a, b) { return Array.from({ length: b - a + 1 }, (_, i) => a + i); }
const CX = 250, CY = 210, GAP = 0.6;

// ─── Stadium data ──────────────────────────────────
const STADIUMS = {
  'AT&T Stadium': {
    name: 'AT&T Stadium', shapePower: 3.5, baseRx: 184, baseRy: 146,
    fieldW: 72, fieldH: 44, angleOffset: 306, seatRows: 22, seatCols: 15,
    levels: [
      { name: 'Cat 1 · 100 Level', cat: 1, inner: 0.30, outer: 0.37, totalSlots: 60, baseNum: 101,
        sections: [101,102,103, ...seq(118,130), 142,143, ...seq(144,150)] },
      { name: 'Cat 1 · Club', cat: 1, inner: 0.38, outer: 0.43, totalSlots: 60, baseNum: 101, prefix: 'C',
        sections: [...seq(106,115), ...seq(132,139)] },
      { name: 'Cat 1 · 200 Level', cat: 1, inner: 0.45, outer: 0.52, totalSlots: 60, baseNum: 201,
        sections: [201, ...seq(203,205), ...seq(215,230), ...seq(240,250)] },
      { name: 'Cat 1 · Club 200', cat: 1, inner: 0.53, outer: 0.57, totalSlots: 60, baseNum: 201, prefix: 'C',
        sections: [...seq(206,213), ...seq(232,239)] },
      { name: 'Cat 2 · 300 Level', cat: 2, inner: 0.59, outer: 0.66, totalSlots: 60, baseNum: 301,
        sections: [...seq(301,305), ...seq(316,330), ...seq(341,350)] },
      { name: 'Cat 2 · Club 300', cat: 2, inner: 0.67, outer: 0.71, totalSlots: 60, baseNum: 301, prefix: 'C',
        sections: [...seq(308,314), ...seq(332,339)] },
      { name: 'Cat 2 · 400 Level', cat: 2, inner: 0.74, outer: 0.88, totalSlots: 60, baseNum: 401,
        sections: [...seq(404,418), ...seq(432,448)] },
      { name: 'Cat 3 · 400 Level', cat: 3, inner: 0.74, outer: 0.88, totalSlots: 60, baseNum: 401,
        sections: [...seq(401,403), ...seq(419,431), ...seq(449,460)] },
    ],
  },
  'Mercedes-Benz Stadium': {
    name: 'Mercedes-Benz Stadium', shapePower: 2.8, baseRx: 185, baseRy: 155,
    fieldW: 78, fieldH: 50, angleOffset: 0, seatRows: 20, seatCols: 14,
    levels: [
      { name: '100 Level', cat: 1, inner: 0.44, outer: 0.55, totalSlots: 32, baseNum: 101, sections: seq(101,132) },
      { name: '200 Level', cat: 2, inner: 0.59, outer: 0.68, totalSlots: 24, baseNum: 201, sections: seq(201,224) },
      { name: '300 Level', cat: 2, inner: 0.73, outer: 0.88, totalSlots: 32, baseNum: 301, sections: seq(301,332) },
    ],
  },
  'Gillette Stadium': {
    name: 'Gillette Stadium', shapePower: 2.0, baseRx: 192, baseRy: 138,
    fieldW: 76, fieldH: 46, angleOffset: 0, seatRows: 20, seatCols: 14,
    levels: [
      { name: '100 Level', cat: 1, inner: 0.44, outer: 0.55, totalSlots: 36, baseNum: 101, sections: seq(101,136) },
      { name: '200 Level', cat: 2, inner: 0.59, outer: 0.68, totalSlots: 24, baseNum: 201, sections: seq(201,224) },
      { name: '300 Level', cat: 2, inner: 0.73, outer: 0.88, totalSlots: 36, baseNum: 301, sections: seq(301,336) },
    ],
  },
  'SoFi Stadium': {
    name: 'SoFi Stadium', shapePower: 2.3, baseRx: 196, baseRy: 132,
    fieldW: 68, fieldH: 40, angleOffset: 0, seatRows: 20, seatCols: 14,
    levels: [
      { name: '100 Level', cat: 1, inner: 0.34, outer: 0.43, totalSlots: 32, baseNum: 101, sections: seq(101,132) },
      { name: '200 Level', cat: 1, inner: 0.47, outer: 0.54, totalSlots: 24, baseNum: 201, sections: seq(201,224) },
      { name: '300 Level', cat: 2, inner: 0.58, outer: 0.66, totalSlots: 32, baseNum: 301, sections: seq(301,332) },
      { name: '400 Level', cat: 2, inner: 0.70, outer: 0.82, totalSlots: 60, baseNum: 401, sections: seq(401,460) },
    ],
  },
};

const CAT_COLORS = {
  1: { fill: '#C9960B', hover: '#DAA520', label: 'Category 1' },
  2: { fill: '#A03030', hover: '#D04848', label: 'Category 2' },
  3: { fill: '#2956A0', hover: '#4A80D0', label: 'Category 3' },
};

// ─── Geometry ──────────────────────────────────────

function superPt(rx, ry, deg, n) {
  const rad = deg * Math.PI / 180;
  const s = Math.sin(rad), c = Math.cos(rad);
  const as = Math.abs(s), ac = Math.abs(c);
  let r;
  if (as < 1e-12) r = ry;
  else if (ac < 1e-12) r = rx;
  else r = Math.pow(Math.pow(as / rx, n) + Math.pow(ac / ry, n), -1 / n);
  return { x: CX + r * s, y: CY - r * c };
}

function secPath(irx, iry, orx, ory, sA, eA, n) {
  const pts = [], steps = 6;
  for (let i = 0; i <= steps; i++) pts.push(superPt(irx, iry, sA + (eA - sA) * i / steps, n));
  for (let i = steps; i >= 0; i--) pts.push(superPt(orx, ory, sA + (eA - sA) * i / steps, n));
  return 'M' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L') + 'Z';
}

function secCenter(irx, iry, orx, ory, sA, eA, n) {
  const mid = (sA + eA) / 2;
  return superPt((irx + orx) / 2, (iry + ory) / 2, mid, n);
}

function outline(rx, ry, n) {
  const pts = [];
  for (let a = 0; a < 360; a += 2) pts.push(superPt(rx, ry, a, n));
  return 'M' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L') + 'Z';
}

function secAngles(level, num, off) {
  const arc = 360 / level.totalSlots;
  const idx = num - level.baseNum;
  return { sA: off + idx * arc + GAP / 2, eA: off + (idx + 1) * arc - GAP / 2 };
}

function findConfig(venue) {
  for (const k of Object.keys(STADIUMS)) if (venue.includes(k)) return STADIUMS[k];
  return null;
}

function findUserLevel(cfg, block) {
  for (const lv of cfg.levels) if (lv.sections.includes(block)) return lv;
  return null;
}

function findUserCenter(cfg, block) {
  const lv = findUserLevel(cfg, block);
  if (!lv) return null;
  const { sA, eA } = secAngles(lv, block, cfg.angleOffset);
  return secCenter(cfg.baseRx * lv.inner, cfg.baseRy * lv.inner,
                   cfg.baseRx * lv.outer, cfg.baseRy * lv.outer, sA, eA, cfg.shapePower);
}

// ─── Panel 1: Static Overview ──────────────────────

function buildOverview(cfg, userBlock) {
  const n = cfg.shapePower;
  let svg = '';
  const lastLv = cfg.levels[cfg.levels.length - 1];
  svg += `<path d="${outline(cfg.baseRx * (lastLv.outer + 0.04), cfg.baseRy * (lastLv.outer + 0.04), n)}" fill="#e8e8e8" stroke="#ccc" stroke-width="1"/>`;

  cfg.levels.forEach(lv => {
    const irx = cfg.baseRx * lv.inner, iry = cfg.baseRy * lv.inner;
    const orx = cfg.baseRx * lv.outer, ory = cfg.baseRy * lv.outer;
    const color = CAT_COLORS[lv.cat] || CAT_COLORS[2];
    lv.sections.forEach(num => {
      const { sA, eA } = secAngles(lv, num, cfg.angleOffset);
      const isUser = num === userBlock;
      svg += `<path d="${secPath(irx, iry, orx, ory, sA, eA, n)}" fill="${isUser ? '#fbbf24' : color.fill}" stroke="#fff" stroke-width="0.4" opacity="${isUser ? 1 : 0.85}"/>`;
    });
  });

  // Field
  const fx = CX - cfg.fieldW / 2, fy = CY - cfg.fieldH / 2;
  svg += `<rect x="${fx}" y="${fy}" width="${cfg.fieldW}" height="${cfg.fieldH}" rx="3" fill="#2d8a3e" stroke="#3aa850" stroke-width="0.4"/>`;
  svg += `<line x1="${CX}" y1="${fy}" x2="${CX}" y2="${fy + cfg.fieldH}" stroke="#3aa850" stroke-width="0.3"/>`;
  svg += `<circle cx="${CX}" cy="${CY}" r="${cfg.fieldH * 0.14}" fill="none" stroke="#3aa850" stroke-width="0.3"/>`;

  // User dot with glow
  const uc = findUserCenter(cfg, userBlock);
  if (uc) {
    svg += `<circle cx="${uc.x.toFixed(1)}" cy="${uc.y.toFixed(1)}" r="10" fill="#fbbf24" opacity="0.2">
      <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite"/>
    </circle>`;
    svg += `<circle cx="${uc.x.toFixed(1)}" cy="${uc.y.toFixed(1)}" r="4" fill="#fbbf24" stroke="#fff" stroke-width="1.2"/>`;
  }

  return `<svg viewBox="0 0 500 420" class="seatmap-overview-svg">${svg}</svg>`;
}

// ─── Panel 2: Nearby Blocks (interactive) ──────────

function buildNearbyBlocks(cfg, userBlock, userRow, userSeats, userLevel) {
  const n = cfg.shapePower;
  const userLv = findUserLevel(cfg, userBlock);
  if (!userLv) return '';

  // Collect nearby sections: same ring ±8, plus adjacent rings
  const nearbyNums = new Set();
  const userIdx = userBlock - userLv.baseNum;
  for (let d = -8; d <= 8; d++) {
    const num = userLv.baseNum + ((userIdx + d + userLv.totalSlots) % userLv.totalSlots);
    if (userLv.sections.includes(num)) nearbyNums.add(num);
  }
  // Also add other levels that overlap angularly
  const { sA: uSA, eA: uEA } = secAngles(userLv, userBlock, cfg.angleOffset);
  const midAngle = (uSA + uEA) / 2;
  cfg.levels.forEach(lv => {
    if (lv === userLv) return;
    lv.sections.forEach(num => {
      const { sA, eA } = secAngles(lv, num, cfg.angleOffset);
      const mid = (sA + eA) / 2;
      const diff = Math.abs(((mid - midAngle + 540) % 360) - 180);
      if (diff < 65) nearbyNums.add(num);
    });
  });

  // Build SVG for nearby sections
  let svg = '';
  const drawn = new Map(); // num -> { levelIdx, center }

  cfg.levels.forEach((lv, li) => {
    const irx = cfg.baseRx * lv.inner, iry = cfg.baseRy * lv.inner;
    const orx = cfg.baseRx * lv.outer, ory = cfg.baseRy * lv.outer;
    const color = CAT_COLORS[lv.cat] || CAT_COLORS[2];

    lv.sections.forEach(num => {
      if (!nearbyNums.has(num)) return;
      const { sA, eA } = secAngles(lv, num, cfg.angleOffset);
      const isUser = num === userBlock;

      svg += `<path d="${secPath(irx, iry, orx, ory, sA, eA, n)}" class="nb-sec" data-sec="${num}" data-li="${li}" data-name="${lv.name}" data-prefix="${lv.prefix || ''}" fill="${isUser ? '#fbbf24' : color.fill}" stroke="#fff" stroke-width="0.6"/>`;

      const ctr = secCenter(irx, iry, orx, ory, sA, eA, n);
      const prefix = lv.prefix || '';
      const label = `${prefix}${num}`;
      const fs = lv.prefix ? 4.5 : 6;
      svg += `<text x="${ctr.x.toFixed(1)}" y="${ctr.y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="${fs}" fill="${isUser ? '#1a1a2e' : '#fff'}" font-weight="${isUser ? '800' : '600'}" font-family="system-ui,sans-serif" pointer-events="none">${label}</text>`;
      drawn.set(num, { li, ctr });
    });
  });

  // User glow
  const uc = findUserCenter(cfg, userBlock);
  if (uc) {
    svg += `<circle cx="${uc.x.toFixed(1)}" cy="${uc.y.toFixed(1)}" r="16" fill="#fbbf24" opacity="0.15" pointer-events="none">
      <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite"/>
    </circle>`;
  }

  // Compute viewBox to auto-zoom onto nearby area
  let minX = 500, minY = 420, maxX = 0, maxY = 0;
  drawn.forEach(({ ctr }) => {
    minX = Math.min(minX, ctr.x - 20); minY = Math.min(minY, ctr.y - 20);
    maxX = Math.max(maxX, ctr.x + 20); maxY = Math.max(maxY, ctr.y + 20);
  });
  const pad = 15;
  minX -= pad; minY -= pad; maxX += pad; maxY += pad;
  const w = maxX - minX, h = maxY - minY;
  const vb = `${minX.toFixed(0)} ${minY.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}`;

  const id = 'nb-' + Math.random().toString(36).slice(2, 6);
  return `
    <div class="nb-panel" id="${id}">
      <div class="nb-header">
        <span>📍 Nearby Sections</span>
        <div class="nb-zoom-bar">
          <button class="nb-zoom-btn" data-action="in">+</button>
          <button class="nb-zoom-btn" data-action="reset">⊙</button>
          <button class="nb-zoom-btn" data-action="out">−</button>
        </div>
      </div>
      <div class="nb-viewport" data-id="${id}" data-vb="${vb}">
        <svg viewBox="${vb}" class="nb-svg"><g class="nb-g">${svg}</g></svg>
        <div class="nb-tooltip"></div>
      </div>
    </div>`;
}

// ─── Panel 3: Section Detail (rows & seats) ────────

function buildSectionDetail(cfg, userBlock, userRow, userSeats) {
  const rows = cfg.seatRows || 20;
  const cols = cfg.seatCols || 14;
  const userR = parseInt(userRow);
  // Parse seat range "1–3" → [1, 2, 3]
  const seatNums = [];
  const m = userSeats.match(/(\d+)\s*[–\-]\s*(\d+)/);
  if (m) {
    for (let i = parseInt(m[1]); i <= parseInt(m[2]); i++) seatNums.push(i);
  }

  let grid = '';
  const cellW = 22, cellH = 18;
  const padL = 36, padT = 10;
  const svgW = padL + cols * cellW + 10;
  const svgH = padT + rows * cellH + 24;

  // Row labels (bottom = row 1, top = max row) — field is at bottom
  for (let r = 1; r <= rows; r++) {
    const y = padT + (rows - r) * cellH;
    grid += `<text x="${padL - 6}" y="${y + cellH / 2 + 1}" text-anchor="end" font-size="9" fill="${r === userR ? '#fbbf24' : '#888'}" font-weight="${r === userR ? '700' : '400'}" font-family="system-ui">${r}</text>`;

    for (let s = 1; s <= cols; s++) {
      const x = padL + (s - 1) * cellW;
      const isUser = r === userR && seatNums.includes(s);
      grid += `<rect x="${x + 1}" y="${y + 1}" width="${cellW - 2}" height="${cellH - 2}" rx="3"
        fill="${isUser ? '#fbbf24' : '#e8e8e8'}" stroke="${isUser ? '#d4a017' : '#d0d0d0'}" stroke-width="0.5"/>`;
      if (isUser) {
        grid += `<text x="${x + cellW / 2}" y="${y + cellH / 2 + 1}" text-anchor="middle" dominant-baseline="central" font-size="8" fill="#1a1a2e" font-weight="700" font-family="system-ui">${s}</text>`;
      }
    }
  }

  // Bottom label
  grid += `<text x="${padL + cols * cellW / 2}" y="${svgH - 4}" text-anchor="middle" font-size="9" fill="#999" font-family="system-ui">← Seats →</text>`;
  // Left label
  grid += `<text x="6" y="${padT + rows * cellH / 2}" text-anchor="middle" transform="rotate(-90 6 ${padT + rows * cellH / 2})" font-size="9" fill="#999" font-family="system-ui">Rows ↑</text>`;
  // Arrow to field
  grid += `<text x="${padL + cols * cellW / 2}" y="${padT + rows * cellH + 6}" text-anchor="middle" font-size="8" fill="#3aa850" font-family="system-ui">▼ Closer to field</text>`;

  return `
    <div class="sd-panel">
      <div class="sd-header">🔍 Section ${userBlock} · Row ${userRow} · Seats ${userSeats}</div>
      <div class="sd-view">
        <svg viewBox="0 0 ${svgW} ${svgH}" class="sd-svg">${grid}</svg>
      </div>
      <div class="sd-legend">
        <span class="sd-legend-item"><span class="sd-dot sd-dot-user"></span>Your Seats</span>
        <span class="sd-legend-item"><span class="sd-dot sd-dot-other"></span>Other Seats</span>
      </div>
    </div>`;
}

// ─── Setup nearby block interactivity ──────────────

function setupNearbyInteraction(container) {
  container.querySelectorAll('.nb-panel').forEach(panel => {
    const id = panel.id;
    const viewport = panel.querySelector('.nb-viewport');
    const svg = viewport.querySelector('.nb-svg');
    const g = svg.querySelector('.nb-g');
    const tooltip = viewport.querySelector('.nb-tooltip');
    const origVB = viewport.dataset.vb;

    const st = { zoom: 1, panX: 0, panY: 0, dragging: false, sx: 0, sy: 0, spx: 0, spy: 0 };

    function apply(anim) {
      g.style.transition = anim ? 'transform 0.3s ease' : 'none';
      g.setAttribute('transform', `translate(${st.panX.toFixed(1)} ${st.panY.toFixed(1)}) scale(${st.zoom.toFixed(3)})`);
    }

    // Zoom buttons
    panel.querySelectorAll('.nb-zoom-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a === 'reset') { st.zoom = 1; st.panX = 0; st.panY = 0; }
        else if (a === 'in') st.zoom = Math.min(st.zoom * 1.5, 8);
        else st.zoom = Math.max(st.zoom / 1.5, 0.5);
        apply(true);
      });
    });

    // Wheel zoom
    viewport.addEventListener('wheel', e => {
      e.preventDefault();
      st.zoom = Math.max(0.5, Math.min(8, st.zoom * (e.deltaY > 0 ? 0.88 : 1.14)));
      apply(false);
    }, { passive: false });

    // Drag pan — convert screen px to SVG units
    viewport.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      st.dragging = true; st.sx = e.clientX; st.sy = e.clientY;
      st.spx = st.panX; st.spy = st.panY;
      viewport.style.cursor = 'grabbing';
      e.preventDefault();
    });
    window.addEventListener('mousemove', e => {
      if (!st.dragging) return;
      const rect = svg.getBoundingClientRect();
      const vbParts = origVB.split(' ').map(Number);
      const scaleX = vbParts[2] / rect.width;
      const scaleY = vbParts[3] / rect.height;
      st.panX = st.spx + (e.clientX - st.sx) * scaleX;
      st.panY = st.spy + (e.clientY - st.sy) * scaleY;
      apply(false);
    });
    window.addEventListener('mouseup', () => {
      if (st.dragging) { st.dragging = false; viewport.style.cursor = 'grab'; }
    });

    // Tooltips
    g.querySelectorAll('.nb-sec').forEach(sec => {
      sec.addEventListener('mouseenter', () => {
        const num = sec.dataset.sec;
        const prefix = sec.dataset.prefix || '';
        const name = sec.dataset.name;
        sec.style.filter = 'brightness(1.25)';
        tooltip.innerHTML = `<b>Section ${prefix}${num}</b><br><span style="font-size:10px;color:#999">${name}</span>`;
        tooltip.style.display = 'block';
      });
      sec.addEventListener('mouseleave', () => {
        sec.style.filter = '';
        tooltip.style.display = 'none';
      });
      sec.addEventListener('mousemove', e => {
        const rect = viewport.getBoundingClientRect();
        let x = e.clientX - rect.left + 12;
        let y = e.clientY - rect.top - 8;
        if (x + 130 > rect.width) x = e.clientX - rect.left - 140;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
      });
    });

    viewport.style.cursor = 'grab';
  });
}

// ─── Public API ────────────────────────────────────

export function initSeatMaps() {
  document.querySelectorAll('.interactive-seatmap').forEach(el => {
    const venue = el.dataset.venue;
    const block = parseInt(el.dataset.block);
    const row = el.dataset.row;
    const seats = el.dataset.seats;
    const level = el.dataset.level;
    const cfg = findConfig(venue);
    if (!cfg) return;

    el.innerHTML = `
      <div class="seatmap-3panel">
        <div class="seatmap-row-top">
          <div class="seatmap-overview">${buildOverview(cfg, block)}</div>
          <div class="seatmap-nearby">${buildNearbyBlocks(cfg, block, row, seats, level)}</div>
        </div>
        <div class="seatmap-detail">${buildSectionDetail(cfg, block, row, seats)}</div>
      </div>`;

    setupNearbyInteraction(el);
  });
}
