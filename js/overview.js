import { getFlights, getHotels, getRestaurants, getNotes } from './api.js';
import { TRAVELERS, MATCHES } from './config.js';

let countdownInterval;

export async function init() {
  startCountdown();
  renderTimeline();
  renderTravelers();
  await renderStats();
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

function renderTimeline() {
  const el = document.getElementById('timeline');
  el.innerHTML = `
    <div class="timeline-item pb-4">
      <div class="timeline-dot active"></div>
      <div><span class="font-bold text-sm">Jun 14</span> <span class="text-gray-500 text-sm">- Arrive in Atlanta</span></div>
      <div class="text-xs text-gray-400 mt-1">Everyone flies in from SEA, LAX, SFO</div>
    </div>
    <div class="timeline-item pb-4">
      <div class="timeline-dot active"></div>
      <div><span class="font-bold text-sm">Jun 15</span> <span class="text-sm font-semibold" style="color:var(--fifa-gold)">Match 14 - Atlanta</span></div>
      <div class="text-xs text-gray-400 mt-1">Mercedes-Benz Stadium - All 4 attend</div>
    </div>
    <div class="timeline-item pb-4">
      <div class="timeline-dot"></div>
      <div><span class="font-bold text-sm">Jun 15 evening</span> <span class="text-gray-500 text-sm">- Fly to Boston (2 people)</span></div>
      <div class="text-xs text-gray-400 mt-1">2 continue to Boston, others return home</div>
    </div>
    <div class="timeline-item pb-4">
      <div class="timeline-dot active"></div>
      <div><span class="font-bold text-sm">Jun 16</span> <span class="text-sm font-semibold" style="color:var(--fifa-gold)">Match 18 - Boston</span></div>
      <div class="text-xs text-gray-400 mt-1">Gillette Stadium, Foxborough - 2 attend</div>
    </div>
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div><span class="font-bold text-sm">Jun 16 evening</span> <span class="text-gray-500 text-sm">- Return home</span></div>
      <div class="text-xs text-gray-400 mt-1">1 to Seattle, 1 to LA</div>
    </div>`;
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
