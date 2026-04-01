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
