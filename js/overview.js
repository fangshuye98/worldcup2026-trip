import { getFlights, getHotels, getRestaurants, getNotes } from './api.js';
import { TRAVELERS, MATCHES } from './config.js';

let countdownInterval;

export async function init() {
  startCountdown();
  renderTravelers();
  await Promise.all([renderTimeline(), renderStats()]);
}

function startCountdown() {
  const target = new Date('2026-06-15T00:00:00-04:00'); // Atlanta ET
  const update = () => {
    const now = new Date();
    const diff = target - now;
    if (diff <= 0) {
      document.getElementById('countdown').innerHTML = `
        <div class="text-3xl font-extrabold text-fifa-gold">GAME DAY!</div>`;
      clearInterval(countdownInterval);
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    document.getElementById('countdown').innerHTML = `
      <div class="flex gap-3 justify-center flex-wrap">
        <div class="countdown-box"><div class="countdown-number">${days}</div><div class="countdown-label">Days</div></div>
        <div class="countdown-box"><div class="countdown-number">${hours}</div><div class="countdown-label">Hours</div></div>
        <div class="countdown-box"><div class="countdown-number">${minutes}</div><div class="countdown-label">Min</div></div>
        <div class="countdown-box"><div class="countdown-number">${seconds}</div><div class="countdown-label">Sec</div></div>
      </div>`;
  };
  update();
  countdownInterval = setInterval(update, 1000);
}

function getTravelerName(id) {
  const t = TRAVELERS.find(x => x.id === id);
  return t ? t.name : id;
}

function getTravelerColor(id) {
  const t = TRAVELERS.find(x => x.id === id);
  return t ? t.color : '#999';
}

function fmtMatchDate(dateStr) {
  // Parse YYYY-MM-DD directly to avoid timezone shift
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

async function renderTimeline() {
  const el = document.getElementById('timeline');
  const events = [];

  // Add matches as events
  MATCHES.forEach(m => {
    const attendees = m.attendeeIds.map(id => getTravelerName(id));
    events.push({
      sortTime: new Date(m.date + 'T12:00:00'),
      type: 'match',
      html: `
        <div><span class="font-bold text-sm">${fmtMatchDate(m.date)}</span>
          <span class="text-sm font-semibold" style="color:var(--fifa-gold)">⚽ Match ${m.number} - ${m.city}</span></div>
        <div class="text-xs text-gray-500 mt-0.5">${m.teams} · ${m.time}</div>
        <div class="text-xs text-gray-400 mt-0.5">${m.venue}</div>
        <div class="flex gap-1 mt-1 flex-wrap">${m.attendeeIds.map(id =>
          `<span class="inline-flex items-center gap-1 text-xs"><span class="traveler-dot" style="background:${getTravelerColor(id)}"></span>${getTravelerName(id)}</span>`
        ).join('')}</div>`,
    });
  });

  // Try to load flights from Supabase
  try {
    const flights = await getFlights();
    flights.forEach(f => {
      const name = getTravelerName(f.traveler_id);
      const color = getTravelerColor(f.traveler_id);
      const depDate = f.departure_time ? fmtDate(f.departure_time) : '?';
      const depTime = f.departure_time ? fmtTime(f.departure_time) : '';
      const arrTime = f.arrival_time ? fmtTime(f.arrival_time) : '';
      const statusBadge = f.status === 'booked'
        ? '<span class="badge badge-booked text-xs ml-1">Booked</span>'
        : '<span class="badge badge-looking text-xs ml-1">Looking</span>';
      events.push({
        sortTime: f.departure_time ? new Date(f.departure_time) : new Date(0),
        type: 'flight',
        html: `
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-sm">${depDate}</span>
            <span class="text-sm text-gray-500">✈ ${f.origin_airport} → ${f.destination_airport}</span>
            ${statusBadge}
          </div>
          <div class="text-xs text-gray-500 mt-0.5">${f.flight_number || ''} ${f.airline || ''} · ${depTime} → ${arrTime}</div>
          <div class="flex items-center gap-1 mt-1">
            <span class="traveler-dot" style="background:${color}"></span>
            <span class="text-xs text-gray-500">${name}</span>
          </div>
          ${f.notes ? `<div class="text-xs text-gray-400 mt-0.5">${f.notes}</div>` : ''}`,
      });
    });
  } catch (e) {
    // No flights loaded — timeline will just show matches
  }

  // Sort by time
  events.sort((a, b) => a.sortTime - b.sortTime);

  if (events.length === 0) {
    el.innerHTML = '<div class="text-gray-400 text-sm">No events yet</div>';
    return;
  }

  el.innerHTML = events.map((ev, i) => {
    const isMatch = ev.type === 'match';
    const isLast = i === events.length - 1;
    return `
      <div class="timeline-item ${isLast ? '' : 'pb-4'}">
        <div class="timeline-dot ${isMatch ? 'active' : ''}"></div>
        ${ev.html}
      </div>`;
  }).join('');
}

function renderTravelers() {
  const el = document.getElementById('traveler-cards');
  el.innerHTML = TRAVELERS.map(t => {
    const matchBadges = t.matches.map(m => {
      const match = MATCHES.find(x => x.cityKey === m);
      return `<span class="badge badge-suggested text-xs">${match ? match.city : m}</span>`;
    }).join(' ');
    return `
      <div class="card p-4" style="border-left: 4px solid ${t.color}">
        <div class="flex items-center gap-2 mb-2">
          <div class="traveler-dot" style="background:${t.color}"></div>
          <span class="font-bold text-sm">${t.name}</span>
        </div>
        <div class="text-xs text-gray-500 mb-2">${t.origin} (${t.airport})</div>
        <div class="flex gap-1 flex-wrap">${matchBadges}</div>
      </div>`;
  }).join('');
}

async function renderStats() {
  const el = document.getElementById('stats');
  try {
    const [flightsData, hotelsData, restaurantsData, notesData] = await Promise.all([
      getFlights(), getHotels(), getRestaurants(), getNotes()
    ]);
    const bookedFlights = flightsData.filter(f => f.status === 'booked').length;
    el.innerHTML = `
      <div class="stat-card"><div class="stat-number">${bookedFlights}</div><div class="stat-label">Flights Booked</div></div>
      <div class="stat-card"><div class="stat-number">${hotelsData.length}</div><div class="stat-label">Hotels</div></div>
      <div class="stat-card"><div class="stat-number">${restaurantsData.length}</div><div class="stat-label">Restaurants</div></div>
      <div class="stat-card"><div class="stat-number">${notesData.length}</div><div class="stat-label">Notes</div></div>`;
  } catch (e) {
    el.innerHTML = '<div class="text-gray-400 text-sm col-span-4">Connect Supabase to see stats</div>';
  }
}
