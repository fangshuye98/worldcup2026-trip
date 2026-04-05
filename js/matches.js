import { MATCHES, TRAVELERS } from './config.js';

export async function init() {
  render();
}

function render() {
  const el = document.getElementById('matches-list');
  el.innerHTML = MATCHES.map(matchCard).join('');
  if (window.lucide) window.lucide.createIcons();
}

function groupSection(m) {
  if (m.stage === 'group') {
    const playing = m.teams.split(' vs ').map(t => t.trim());
    return `
      <div class="bg-white/10 rounded-lg p-3 mb-4">
        <div class="text-xs text-white/50 uppercase tracking-wide mb-2">Group ${m.group}</div>
        <div class="grid grid-cols-2 gap-1">
          ${m.groupTeams.map(t => {
            const isPlaying = playing.includes(t);
            return `<div class="flex items-center gap-1.5 text-sm ${isPlaying ? 'text-yellow-300 font-bold' : 'text-white/60'}">
              ${isPlaying ? '⚽' : '<span class="w-4 inline-block text-center">·</span>'} ${t}
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }
  if (m.stage === 'round-of-32' && m.groups) {
    return `
      <div class="bg-white/10 rounded-lg p-3 mb-4">
        <div class="text-xs text-white/50 uppercase tracking-wide mb-2">Round of 32 — Possible Teams</div>
        <div class="grid grid-cols-2 gap-3">
          ${m.groups.map(g => `
            <div>
              <div class="text-xs text-yellow-300/80 font-semibold mb-1">Group ${g.name}</div>
              ${g.teams.map(t => `<div class="text-sm text-white/60 flex items-center gap-1"><span class="w-4 inline-block text-center">·</span> ${t}</div>`).join('')}
            </div>
          `).join('')}
        </div>
      </div>`;
  }
  return '';
}

function seatSection(m) {
  if (!m.seats) return '';
  const { block, row, seatRange, level, angle } = m.seats;

  // Calculate dot position on the seating ring ellipse
  const cx = 100, cy = 75, rx = 80, ry = 60;
  const rad = angle * Math.PI / 180;
  const dotX = (cx + rx * Math.sin(rad)).toFixed(1);
  const dotY = (cy - ry * Math.cos(rad)).toFixed(1);

  // Offset label outward from center
  const labelRx = rx + 14, labelRy = ry + 14;
  let labelX = (cx + labelRx * Math.sin(rad)).toFixed(1);
  let labelY = (cy - labelRy * Math.cos(rad) + 3).toFixed(1);
  // Clamp within viewBox
  labelX = Math.max(20, Math.min(180, labelX));
  labelY = Math.max(8, Math.min(150, labelY));

  return `
    <div class="seat-section">
      <div class="seat-map-container">
        <svg viewBox="0 0 200 155" class="stadium-svg" xmlns="http://www.w3.org/2000/svg">
          <!-- Stadium outer shell -->
          <ellipse cx="100" cy="75" rx="92" ry="70" fill="#080d24" stroke="#1e2656" stroke-width="1"/>
          <!-- Seating tiers (subtle rings) -->
          <ellipse cx="100" cy="75" rx="85" ry="65" fill="none" stroke="#151b3e" stroke-width="8"/>
          <ellipse cx="100" cy="75" rx="80" ry="60" fill="none" stroke="#111633" stroke-width="8"/>
          <ellipse cx="100" cy="75" rx="72" ry="53" fill="none" stroke="#0d1230" stroke-width="4"/>
          <!-- Inner concourse -->
          <ellipse cx="100" cy="75" rx="56" ry="42" fill="#0a0f28" stroke="#1a2050" stroke-width="0.5"/>
          <!-- Field -->
          <rect x="64" y="50" width="72" height="50" rx="5" fill="#14451a" stroke="#1f6b28" stroke-width="0.5"/>
          <!-- Field markings -->
          <line x1="100" y1="50" x2="100" y2="100" stroke="#1f6b28" stroke-width="0.4"/>
          <rect x="74" y="62" width="52" height="26" rx="2" fill="none" stroke="#1f6b28" stroke-width="0.3"/>
          <circle cx="100" cy="75" r="7" fill="none" stroke="#1f6b28" stroke-width="0.3"/>
          <circle cx="100" cy="75" r="1" fill="#1f6b28"/>
          <!-- Goal areas -->
          <rect x="86" y="50" width="28" height="8" rx="1" fill="none" stroke="#1f6b28" stroke-width="0.3"/>
          <rect x="86" y="92" width="28" height="8" rx="1" fill="none" stroke="#1f6b28" stroke-width="0.3"/>
          <!-- Section glow -->
          <circle cx="${dotX}" cy="${dotY}" r="12" fill="#fbbf24" opacity="0.12">
            <animate attributeName="r" values="8;15;8" dur="2.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.2;0.06;0.2" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="${dotX}" cy="${dotY}" r="6" fill="#fbbf24" opacity="0.25">
            <animate attributeName="r" values="4;8;4" dur="2.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.35;0.1;0.35" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <!-- Section dot -->
          <circle cx="${dotX}" cy="${dotY}" r="3.5" fill="#fbbf24" stroke="#fef3c7" stroke-width="0.8"/>
          <!-- Section label -->
          <text x="${labelX}" y="${labelY}" text-anchor="middle" fill="#fbbf24" font-size="7" font-weight="bold" font-family="system-ui, sans-serif">${block}</text>
        </svg>
      </div>
      <div class="seat-ticket-card">
        <div class="seat-ticket-header">
          <span class="seat-ticket-icon">🎫</span> Your Seats
        </div>
        <div class="seat-ticket-grid">
          <div class="seat-ticket-item">
            <div class="seat-ticket-label">BLOCK</div>
            <div class="seat-ticket-value">${block}</div>
          </div>
          <div class="seat-ticket-item">
            <div class="seat-ticket-label">ROW</div>
            <div class="seat-ticket-value">${row}</div>
          </div>
          <div class="seat-ticket-item">
            <div class="seat-ticket-label">SEATS</div>
            <div class="seat-ticket-value">${seatRange}</div>
          </div>
        </div>
        <div class="seat-ticket-level">${level}</div>
      </div>
    </div>`;
}

function matchCard(m) {
  const attendees = m.attendeeIds.map(id => TRAVELERS.find(t => t.id === id)).filter(Boolean);
  const dateObj = new Date(m.date + 'T12:00:00');
  const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const stageBadge = m.stage === 'round-of-32'
    ? '<span class="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full font-medium">Round of 32</span>'
    : `<span class="text-xs bg-white/15 text-white/70 px-2 py-0.5 rounded-full font-medium">Group ${m.group}</span>`;

  return `
    <div class="match-card p-6 mb-6">
      <div class="flex items-center gap-3 mb-4">
        <span class="match-number">Match ${m.number}</span>
        <span class="text-white/70 text-sm">${m.city}</span>
        ${stageBadge}
      </div>
      <div class="text-2xl font-extrabold mb-1">${m.teams}</div>
      <div class="flex items-center gap-2 text-white/80 text-sm mb-4">
        <i data-lucide="calendar" class="w-4 h-4"></i>
        <span>${dateStr}</span>
        ${m.time !== 'TBD' ? `<span class="mx-1">|</span><i data-lucide="clock" class="w-4 h-4"></i><span>${m.time}</span>` : '<span class="mx-1">| Time TBD</span>'}
      </div>
      <div class="flex items-center gap-2 text-white/70 text-sm mb-5">
        <i data-lucide="map-pin" class="w-4 h-4"></i>
        <span>${m.venue}</span>
      </div>
      ${groupSection(m)}
      ${seatSection(m)}
      <div class="border-t border-white/20 pt-4">
        <div class="text-xs text-white/50 uppercase tracking-wide mb-2">Attendees (${attendees.length})</div>
        <div class="flex flex-wrap gap-2">
          ${attendees.map(t => `
            <div class="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
              <div class="traveler-dot" style="background:${t.color}"></div>
              <span class="text-sm text-white">${t.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}
