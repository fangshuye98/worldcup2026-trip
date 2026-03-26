import { getHotels, addHotel, deleteHotel, toggleHotelVote, subscribeToTable } from './api.js';
import { TRAVELERS } from './config.js';
import { openModal, closeModal, showToast, getCurrentTravelerId } from './app.js';

export async function init() {
  document.getElementById('add-hotel-btn').addEventListener('click', openAddHotelModal);
  subscribeToTable('hotels', () => render());
  subscribeToTable('hotel_votes', () => render());
  await render();
}

async function render() {
  const el = document.getElementById('hotels-list');
  try {
    const hotels = await getHotels();
    const cities = ['Atlanta', 'Boston'];
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
}

function hotelCard(h) {
  const votes = h.hotel_votes || [];
  const tid = getCurrentTravelerId();
  const hasVoted = votes.some(v => v.traveler_id === tid);
  const addedBy = TRAVELERS.find(t => t.id === h.added_by);
  const badgeClass = h.status === 'booked' ? 'badge-booked' : h.status === 'rejected' ? 'badge-rejected' : 'badge-suggested';
  return `
    <div class="card p-4">
      <div class="flex justify-between items-start mb-2">
        <span class="font-bold">${h.name}</span>
        <span class="badge ${badgeClass}">${h.status}</span>
      </div>
      ${h.address ? `<div class="text-xs text-gray-500 mb-1"><i data-lucide="map-pin" class="w-3 h-3 inline"></i> ${h.address}</div>` : ''}
      ${h.price_per_night ? `<div class="text-sm font-semibold text-green-600 mb-1">$${h.price_per_night}/night</div>` : ''}
      ${h.check_in ? `<div class="text-xs text-gray-500">${h.check_in} &rarr; ${h.check_out || 'TBD'}</div>` : ''}
      ${h.booking_url ? `<a href="${h.booking_url}" target="_blank" class="text-xs text-blue-500 hover:underline">Booking link</a>` : ''}
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
          <button onclick="window._deleteHotel('${h.id}')" class="text-xs text-red-400 hover:text-red-600">Delete</button>
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
  if (window.lucide) window.lucide.createIcons();
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
      <div><label class="form-label">Hotel Name</label><input id="h-name" class="form-input" placeholder="Hyatt Regency Atlanta"></div>
      <div><label class="form-label">City</label><select id="h-city" class="form-input"><option value="Atlanta">Atlanta</option><option value="Boston">Boston</option></select></div>
      <div><label class="form-label">Address</label><input id="h-address" class="form-input" placeholder="Optional"></div>
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
  openModal('Add Hotel Option', html, async () => {
    try {
      await addHotel({
        name: document.getElementById('h-name').value,
        city: document.getElementById('h-city').value,
        address: document.getElementById('h-address').value,
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
}
