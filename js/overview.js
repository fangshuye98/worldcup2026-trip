import { getFlights, getHotels, getRestaurants, getNotes } from './api.js';
import { TRAVELERS, MATCHES, VENUES } from './config.js';

let countdownInterval;
let mapInstance = null;
let mapMarkers = [];
let currentCity = 'atlanta';

export async function init() {
  startCountdown();
  renderTravelers();
  setupCityToggle();
  await Promise.all([renderTimeline(), renderStats(), renderMap('atlanta')]);
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

function setupCityToggle() {
  document.querySelectorAll('.city-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCity = btn.dataset.city;
      document.querySelectorAll('.city-toggle-btn').forEach(b => {
        b.classList.remove('bg-indigo-100', 'text-indigo-700');
        b.classList.add('text-gray-500', 'bg-gray-100');
      });
      btn.classList.remove('text-gray-500', 'bg-gray-100');
      btn.classList.add('bg-indigo-100', 'text-indigo-700');
      document.getElementById('map-city-label').textContent =
        currentCity === 'atlanta' ? 'Atlanta' : 'Boston';
      renderMap(currentCity);
    });
  });
}

function createMarkerIcon(color, symbol) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;line-height:1">${symbol}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

async function renderMap(cityKey) {
  const container = document.getElementById('overview-map');
  if (!container) return;

  if (!mapInstance) {
    mapInstance = L.map('overview-map', { zoomControl: true, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(mapInstance);
  }

  mapMarkers.forEach(m => mapInstance.removeLayer(m));
  mapMarkers = [];

  const venue = VENUES[cityKey];
  if (!venue) return;

  const bounds = [];

  // Stadium marker
  const cityMatches = MATCHES.filter(m => m.cityKey === cityKey);
  const matchInfo = cityMatches.map(m =>
    `<div style="margin-top:4px"><strong>${m.teams}</strong><br><span style="color:#666">${m.date} &middot; ${m.time}</span></div>`
  ).join('');
  const stadiumMarker = L.marker([venue.stadium.lat, venue.stadium.lng], {
    icon: createMarkerIcon('#D4AF37', '⚽'),
  }).addTo(mapInstance).bindPopup(`<strong>${venue.stadium.name}</strong>${matchInfo}`);
  mapMarkers.push(stadiumMarker);
  bounds.push([venue.stadium.lat, venue.stadium.lng]);

  // Airport marker
  const airportMarker = L.marker([venue.airport.lat, venue.airport.lng], {
    icon: createMarkerIcon('#6B7280', '✈️'),
  }).addTo(mapInstance).bindPopup(`<strong>${venue.airport.name}</strong>`);
  mapMarkers.push(airportMarker);
  bounds.push([venue.airport.lat, venue.airport.lng]);

  // Hotels and restaurants from Supabase
  try {
    const [hotels, restaurants] = await Promise.all([getHotels(), getRestaurants()]);

    hotels.filter(h => h.city.toLowerCase() === cityKey && h.lat && h.lng).forEach(h => {
      const votes = (h.hotel_votes || []).length;
      const status = h.status === 'booked' ? '<span style="color:#166534;font-weight:600">BOOKED</span>'
        : h.status === 'rejected' ? '<span style="color:#991b1b;font-weight:600">REJECTED</span>'
        : '<span style="color:#3730a3;font-weight:600">SUGGESTED</span>';
      const price = h.price_per_night ? `<span style="color:#16a34a;font-weight:600">$${h.price_per_night}/night</span> &middot; ` : '';
      const marker = L.marker([h.lat, h.lng], {
        icon: createMarkerIcon('#2563EB', '🏨'),
      }).addTo(mapInstance).bindPopup(
        `<strong>${h.name}</strong><br>${h.address ? `<span style="color:#666">${h.address}</span><br>` : ''}${price}${status}${votes > 0 ? ` &middot; ${votes} vote${votes > 1 ? 's' : ''}` : ''}`
      );
      mapMarkers.push(marker);
      bounds.push([h.lat, h.lng]);
    });

    restaurants.filter(r => r.city.toLowerCase() === cityKey && r.lat && r.lng).forEach(r => {
      const votes = (r.restaurant_votes || []).length;
      const marker = L.marker([r.lat, r.lng], {
        icon: createMarkerIcon('#EA580C', '🍽️'),
      }).addTo(mapInstance).bindPopup(
        `<strong>${r.name}</strong><br>${r.cuisine ? `<span style="color:#666">${r.cuisine}</span><br>` : ''}${r.meal_type !== 'any' ? `<span style="color:#3730a3">${r.meal_type}</span> &middot; ` : ''}${r.price_range || ''}${votes > 0 ? ` &middot; ${votes} vote${votes > 1 ? 's' : ''}` : ''}${r.address ? `<br><span style="color:#666;font-size:11px">${r.address}</span>` : ''}`
      );
      mapMarkers.push(marker);
      bounds.push([r.lat, r.lng]);
    });
  } catch (e) {
    console.warn('Map: Could not load hotels/restaurants', e.message);
  }

  if (bounds.length > 0) {
    mapInstance.fitBounds(bounds, { padding: [30, 30] });
  }

  renderMapLegend();
}

function renderMapLegend() {
  const el = document.getElementById('map-legend');
  if (!el) return;
  const items = [
    { color: '#D4AF37', label: 'Stadium' },
    { color: '#6B7280', label: 'Airport' },
    { color: '#2563EB', label: 'Hotels' },
    { color: '#EA580C', label: 'Restaurants' },
  ];
  el.innerHTML = items.map(item =>
    `<div class="map-legend-item"><div class="map-legend-dot" style="background:${item.color}"></div><span>${item.label}</span></div>`
  ).join('');
}
