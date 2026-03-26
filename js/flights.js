import { getFlights, addFlight, deleteFlight, subscribeToTable } from './api.js';
import { TRAVELERS } from './config.js';
import { openModal, closeModal, showToast, getCurrentTravelerId } from './app.js';

export async function init() {
  document.getElementById('add-flight-btn').addEventListener('click', openAddFlightModal);
  subscribeToTable('flights', () => render());
  await render();
}

async function render() {
  const el = document.getElementById('flights-list');
  try {
    const flights = await getFlights();
    if (flights.length === 0) {
      el.innerHTML = '<div class="text-gray-400 text-center py-8">No flights yet. Add one!</div>';
      return;
    }
    // Group by traveler
    const grouped = {};
    flights.forEach(f => {
      if (!grouped[f.traveler_id]) grouped[f.traveler_id] = [];
      grouped[f.traveler_id].push(f);
    });
    el.innerHTML = Object.entries(grouped).map(([tid, tFlights]) => {
      const traveler = TRAVELERS.find(t => t.id === tid) || { name: tid, color: '#999' };
      return `
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <div class="traveler-dot" style="background:${traveler.color}"></div>
            <span class="font-bold">${traveler.name}</span>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            ${tFlights.map(f => flightCard(f, traveler)).join('')}
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = '<div class="text-gray-400 text-center py-8">Connect Supabase to see flights</div>';
  }
}

function flightCard(f, traveler) {
  const depTime = f.departure_time ? new Date(f.departure_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'TBD';
  const arrTime = f.arrival_time ? new Date(f.arrival_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'TBD';
  const badgeClass = f.status === 'booked' ? 'badge-booked' : 'badge-looking';
  return `
    <div class="card group p-4" style="border-top: 3px solid ${traveler.color}">
      <div class="flex justify-between items-start mb-2">
        <div>
          <span class="font-bold text-lg">${f.airline || ''} ${f.flight_number || ''}</span>
        </div>
        <span class="badge ${badgeClass}">${f.status}</span>
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <span class="font-semibold">${f.origin_airport}</span>
        <i data-lucide="arrow-right" class="w-4 h-4"></i>
        <span class="font-semibold">${f.destination_airport}</span>
      </div>
      <div class="text-xs text-gray-500 mb-1"><i data-lucide="clock" class="w-3 h-3 inline"></i> ${depTime} &rarr; ${arrTime}</div>
      ${f.price ? `<div class="text-xs text-gray-500"><i data-lucide="dollar-sign" class="w-3 h-3 inline"></i> $${f.price}</div>` : ''}
      ${f.notes ? `<div class="text-xs text-gray-400 mt-1">${f.notes}</div>` : ''}
      <div class="mt-2 flex justify-end">
        <button onclick="window._deleteFlight('${f.id}')" class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-1" title="Delete">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>`;
}

window._deleteFlight = async (id) => {
  if (!confirm('Delete this flight?')) return;
  try {
    await deleteFlight(id);
    showToast('Flight deleted');
    render();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
};

function openAddFlightModal() {
  const tid = getCurrentTravelerId();
  if (!tid) { showToast('Please select who you are first', 'error'); return; }
  const travelerOptions = TRAVELERS.map(t =>
    `<option value="${t.id}" ${t.id === tid ? 'selected' : ''}>${t.name}</option>`
  ).join('');
  const html = `
    <div class="grid gap-3">
      <div><label class="form-label">Traveler</label><select id="f-traveler" class="form-input">${travelerOptions}</select></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="form-label">Airline</label><input id="f-airline" class="form-input" placeholder="Delta"></div>
        <div><label class="form-label">Flight #</label><input id="f-number" class="form-input" placeholder="DL0589"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="form-label">From</label><input id="f-from" class="form-input" placeholder="SEA"></div>
        <div><label class="form-label">To</label><input id="f-to" class="form-input" placeholder="ATL"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="form-label">Departure</label><input id="f-depart" type="datetime-local" class="form-input"></div>
        <div><label class="form-label">Arrival</label><input id="f-arrive" type="datetime-local" class="form-input"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="form-label">Status</label><select id="f-status" class="form-input"><option value="booked">Booked</option><option value="looking">Looking</option></select></div>
        <div><label class="form-label">Price ($)</label><input id="f-price" type="number" class="form-input" placeholder="Optional"></div>
      </div>
      <div><label class="form-label">Notes</label><input id="f-notes" class="form-input" placeholder="Optional notes"></div>
    </div>`;
  openModal('Add Flight', html, async () => {
    try {
      await addFlight({
        traveler_id: document.getElementById('f-traveler').value,
        airline: document.getElementById('f-airline').value,
        flight_number: document.getElementById('f-number').value,
        origin_airport: document.getElementById('f-from').value.toUpperCase(),
        destination_airport: document.getElementById('f-to').value.toUpperCase(),
        departure_time: document.getElementById('f-depart').value || null,
        arrival_time: document.getElementById('f-arrive').value || null,
        status: document.getElementById('f-status').value,
        price: document.getElementById('f-price').value || null,
        notes: document.getElementById('f-notes').value,
      });
      closeModal();
      showToast('Flight added!');
      render();
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  });
}
