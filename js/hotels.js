import { getHotels, addHotel, deleteHotel, toggleHotelVote, subscribeToTable } from './api.js';
import { TRAVELERS, VENUES } from './config.js';
import { openModal, closeModal, showToast, getCurrentTravelerId } from './app.js';
import { loadGoogleMaps, isMapsLoaded } from './maps.js';

// Haversine distance in miles
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceLabel(miles) {
  return miles < 0.5 ? `${Math.round(miles * 5280)} ft` : `${miles.toFixed(1)} mi`;
}

export async function init() {
  document.getElementById('add-hotel-btn').addEventListener('click', openAddHotelModal);
  subscribeToTable('hotels', () => render());
  subscribeToTable('hotel_votes', () => render());
  loadGoogleMaps();
  await render();
}

async function render() {
  const el = document.getElementById('hotels-list');
  try {
    const hotels = await getHotels();
    const cities = ['Atlanta', 'Boston', 'Seattle', 'Los Angeles', 'Dallas'];
    if (hotels.length === 0) {
      el.innerHTML = '<div class="text-gray-400 text-center py-8">No hotels yet. Add one!</div>';
      return;
    }
    el.innerHTML = cities.map(city => {
      const cityHotels = hotels.filter(h => h.city.toLowerCase() === city.toLowerCase());
      if (cityHotels.length === 0) return '';
      return `
        <div class="mb-6">
          <h3 class="font-bold text-lg mb-3" style="color:var(--fifa-blue)">${city}</h3>
          <div class="grid gap-3 sm:grid-cols-2">${cityHotels.map(hotelCard).join('')}</div>
        </div>`;
    }).join('') || '<div class="text-gray-400 text-center py-8">No hotels yet. Add one!</div>';
  } catch (e) {
    el.innerHTML = '<div class="text-gray-400 text-center py-8">Connect Supabase to see hotels</div>';
  }
  if (window.lucide) window.lucide.createIcons();
}

function hotelCard(h) {
  const votes = h.hotel_votes || [];
  const tid = getCurrentTravelerId();
  const hasVoted = votes.some(v => v.traveler_id === tid);
  const addedBy = TRAVELERS.find(t => t.id === h.added_by);
  const badgeClass = h.status === 'booked' ? 'badge-booked' : h.status === 'rejected' ? 'badge-rejected' : 'badge-suggested';
  const cityKey = h.city.toLowerCase();
  const venue = VENUES[cityKey];

  // Distance info
  let distHTML = '';
  if (h.lat && h.lng && venue) {
    const stadiumDist = getDistance(h.lat, h.lng, venue.stadium.lat, venue.stadium.lng);
    const airportDist = getDistance(h.lat, h.lng, venue.airport.lat, venue.airport.lng);
    distHTML = `
      <div class="flex gap-3 text-xs text-gray-500 mb-2 mt-2 bg-gray-50 rounded-lg p-2">
        <span title="${venue.stadium.name}"><i data-lucide="trophy" class="w-3 h-3 inline text-amber-500"></i> ${distanceLabel(stadiumDist)}</span>
        <span title="${venue.airport.name}"><i data-lucide="plane" class="w-3 h-3 inline text-blue-500"></i> ${distanceLabel(airportDist)}</span>
      </div>`;
  }

  // Google Maps links
  const mapsQuery = encodeURIComponent(`${h.name} ${h.address || h.city}`);
  const restaurantsQuery = h.lat && h.lng
    ? `https://www.google.com/maps/search/restaurants/@${h.lat},${h.lng},15z`
    : `https://www.google.com/maps/search/restaurants+near+${mapsQuery}`;

  // Embedded map
  let mapHTML = '';
  if (h.lat && h.lng) {
    const bbox = `${h.lng - 0.008},${h.lat - 0.005},${h.lng + 0.008},${h.lat + 0.005}`;
    mapHTML = `
      <div class="mt-2 rounded-lg overflow-hidden border border-gray-200" style="height:140px">
        <iframe width="100%" height="140" frameborder="0" scrolling="no" loading="lazy"
          src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${h.lat},${h.lng}">
        </iframe>
      </div>`;
  }

  return `
    <div class="card group p-4">
      <div class="flex justify-between items-start mb-1">
        <a href="https://www.google.com/maps/search/?api=1&query=${mapsQuery}" target="_blank"
           class="font-bold hover:text-blue-600 transition-colors">${h.name}</a>
        <span class="badge ${badgeClass}">${h.status}</span>
      </div>
      ${h.address ? `<div class="text-xs text-gray-500 mb-1"><i data-lucide="map-pin" class="w-3 h-3 inline"></i> ${h.address}</div>` : ''}
      ${mapHTML}
      ${distHTML}
      ${h.price_per_night ? `<div class="text-sm font-semibold text-green-600 mb-1">$${h.price_per_night}/night</div>` : ''}
      ${h.check_in ? `<div class="text-xs text-gray-500"><i data-lucide="calendar" class="w-3 h-3 inline"></i> ${h.check_in} → ${h.check_out || 'TBD'}</div>` : ''}
      <div class="flex gap-2 mt-2 text-xs">
        ${h.booking_url ? `<a href="${h.booking_url}" target="_blank" class="text-blue-500 hover:underline">Booking</a><span class="text-gray-300">·</span>` : ''}
        <a href="${restaurantsQuery}" target="_blank" class="text-orange-500 hover:underline flex items-center gap-0.5">
          <i data-lucide="utensils" class="w-3 h-3"></i> Nearby restaurants
        </a>
      </div>
      ${h.notes ? `<div class="text-xs text-gray-400 mt-1">${h.notes}</div>` : ''}
      <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div class="flex items-center gap-1">
          <button onclick="window._voteHotel('${h.id}')" class="vote-btn ${hasVoted ? 'voted' : 'text-gray-400'}" title="Vote">
            <i data-lucide="thumbs-up" class="w-4 h-4"></i>
          </button>
          <span class="text-sm font-bold">${votes.length}</span>
          <span class="text-xs text-gray-400 ml-1">${votes.map(v => { const t = TRAVELERS.find(x => x.id === v.traveler_id); return t ? t.name : ''; }).filter(Boolean).join(', ')}</span>
        </div>
        <div class="flex gap-2 items-center">
          ${addedBy ? `<span class="text-xs text-gray-300">by ${addedBy.name}</span>` : ''}
          <button onclick="window._deleteHotel('${h.id}')" class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-1" title="Delete">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    </div>`;
}

window._voteHotel = async (id) => {
  const tid = getCurrentTravelerId();
  if (!tid) { showToast('Select who you are first', 'error'); return; }
  try {
    await toggleHotelVote(id, tid);
    render();
  } catch (e) { showToast('Vote error: ' + e.message, 'error'); }
};

window._deleteHotel = async (id) => {
  if (!confirm('Delete this hotel?')) return;
  try { await deleteHotel(id); showToast('Hotel deleted'); render(); }
  catch (e) { showToast('Error: ' + e.message, 'error'); }
};

function openAddHotelModal() {
  const tid = getCurrentTravelerId();
  if (!tid) { showToast('Please select who you are first', 'error'); return; }
  const html = `
    <div class="grid gap-3">
      <div>
        <label class="form-label">Search Hotel</label>
        <input id="h-search" class="form-input" placeholder="Type hotel name to search..." autocomplete="off">
        <input id="h-name" type="hidden">
        <input id="h-address" type="hidden">
        <input id="h-lat" type="hidden">
        <input id="h-lng" type="hidden">
        <div id="h-preview" class="hidden mt-2 p-3 bg-blue-50 rounded-lg text-sm">
          <div id="h-preview-name" class="font-bold"></div>
          <div id="h-preview-address" class="text-xs text-gray-500 mt-0.5"></div>
          <div id="h-preview-dist" class="text-xs text-gray-500 mt-1"></div>
        </div>
      </div>
      <div><label class="form-label">City</label><select id="h-city" class="form-input"><option value="Atlanta">Atlanta</option><option value="Boston">Boston</option><option value="Seattle">Seattle</option><option value="Los Angeles">Los Angeles</option><option value="Dallas">Dallas</option></select></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="form-label">Price/Night ($)</label><input id="h-price" type="number" class="form-input" placeholder="150"></div>
        <div><label class="form-label">Status</label><select id="h-status" class="form-input"><option value="suggested">Suggested</option><option value="booked">Booked</option><option value="rejected">Rejected</option></select></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="form-label">Check-in</label><input id="h-checkin" type="date" class="form-input"></div>
        <div><label class="form-label">Check-out</label><input id="h-checkout" type="date" class="form-input"></div>
      </div>
      <div><label class="form-label">Booking URL</label><input id="h-url" class="form-input" placeholder="https://..."></div>
      <div><label class="form-label">Notes</label><input id="h-notes" class="form-input" placeholder="Optional"></div>
    </div>`;
  openModal('Add Hotel', html, async () => {
    const name = document.getElementById('h-name').value || document.getElementById('h-search').value;
    if (!name.trim()) { showToast('Hotel name is required', 'error'); return; }
    try {
      await addHotel({
        name: name.trim(),
        city: document.getElementById('h-city').value,
        address: document.getElementById('h-address').value,
        lat: parseFloat(document.getElementById('h-lat').value) || null,
        lng: parseFloat(document.getElementById('h-lng').value) || null,
        price_per_night: document.getElementById('h-price').value || null,
        status: document.getElementById('h-status').value,
        check_in: document.getElementById('h-checkin').value || null,
        check_out: document.getElementById('h-checkout').value || null,
        booking_url: document.getElementById('h-url').value,
        notes: document.getElementById('h-notes').value,
        added_by: tid,
      });
      closeModal();
      showToast('Hotel added!');
      render();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
  });

  // Setup Places Autocomplete if available
  setTimeout(() => setupAutocomplete(), 100);
}

function setupAutocomplete() {
  const input = document.getElementById('h-search');
  if (!input) return;

  if (isMapsLoaded()) {
    const autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['lodging'],
      fields: ['name', 'formatted_address', 'geometry'],
    });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      fillPlaceDetails(place.name, place.formatted_address,
        place.geometry.location.lat(), place.geometry.location.lng());
    });
  } else {
    // Fallback: manual entry, just use search text as hotel name
    input.addEventListener('input', () => {
      document.getElementById('h-name').value = input.value;
    });
  }
}

function fillPlaceDetails(name, address, lat, lng) {
  document.getElementById('h-name').value = name;
  document.getElementById('h-address').value = address || '';
  document.getElementById('h-lat').value = lat;
  document.getElementById('h-lng').value = lng;

  // Show preview
  const preview = document.getElementById('h-preview');
  document.getElementById('h-preview-name').textContent = name;
  document.getElementById('h-preview-address').textContent = address || '';

  // Calculate distances based on selected city
  const cityKey = document.getElementById('h-city').value.toLowerCase();
  const venue = VENUES[cityKey];
  if (venue && lat && lng) {
    const stadiumDist = getDistance(lat, lng, venue.stadium.lat, venue.stadium.lng);
    const airportDist = getDistance(lat, lng, venue.airport.lat, venue.airport.lng);
    document.getElementById('h-preview-dist').innerHTML =
      `📍 ${distanceLabel(stadiumDist)} to ${venue.stadium.name} · ${distanceLabel(airportDist)} to ${venue.airport.name}`;
  }
  preview.classList.remove('hidden');

  // Auto-detect city from address
  if (address) {
    const lower = address.toLowerCase();
    if (lower.includes('atlanta') || lower.includes(', ga')) {
      document.getElementById('h-city').value = 'Atlanta';
    } else if (lower.includes('boston') || lower.includes('foxborough') || lower.includes(', ma')) {
      document.getElementById('h-city').value = 'Boston';
    } else if (lower.includes('seattle') || lower.includes(', wa')) {
      document.getElementById('h-city').value = 'Seattle';
    } else if (lower.includes('los angeles') || lower.includes('inglewood') || lower.includes(', ca')) {
      document.getElementById('h-city').value = 'Los Angeles';
    } else if (lower.includes('dallas') || lower.includes('arlington') || lower.includes(', tx')) {
      document.getElementById('h-city').value = 'Dallas';
    }
  }
}
