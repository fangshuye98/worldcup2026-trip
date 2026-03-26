import { getRestaurants, addRestaurant, deleteRestaurant, toggleRestaurantVote, subscribeToTable } from './api.js';
import { TRAVELERS } from './config.js';
import { openModal, closeModal, showToast, getCurrentTravelerId } from './app.js';

let currentFilter = 'all';

export async function init() {
  document.getElementById('add-restaurant-btn').addEventListener('click', openAddRestaurantModal);
  document.querySelectorAll('.meal-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.meal;
      document.querySelectorAll('.meal-filter-btn').forEach(b => b.classList.remove('bg-indigo-100', 'text-indigo-700'));
      btn.classList.add('bg-indigo-100', 'text-indigo-700');
      render();
    });
  });
  subscribeToTable('restaurants', () => render());
  subscribeToTable('restaurant_votes', () => render());
  await render();
}

async function render() {
  const el = document.getElementById('restaurants-list');
  try {
    let rests = await getRestaurants();
    if (currentFilter !== 'all') {
      rests = rests.filter(r => r.meal_type === currentFilter || r.meal_type === 'any');
    }
    const cities = ['Atlanta', 'Boston'];
    if (rests.length === 0) {
      el.innerHTML = '<div class="text-gray-400 text-center py-8">No restaurants yet. Add one!</div>';
      return;
    }
    el.innerHTML = cities.map(city => {
      const cityRests = rests.filter(r => r.city.toLowerCase() === city.toLowerCase());
      if (cityRests.length === 0) return '';
      return `
        <div class="mb-6">
          <h3 class="font-bold text-lg mb-3" style="color:var(--fifa-blue)">${city}</h3>
          <div class="grid gap-3 sm:grid-cols-2">${cityRests.map(restaurantCard).join('')}</div>
        </div>`;
    }).join('') || '<div class="text-gray-400 text-center py-8">No restaurants match the filter</div>';
    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    el.innerHTML = '<div class="text-gray-400 text-center py-8">Connect Supabase to see restaurants</div>';
  }
}

function priceDisplay(range) {
  const levels = { '$': 1, '$$': 2, '$$$': 3 };
  const level = levels[range] || 2;
  return Array.from({ length: 3 }, (_, i) =>
    `<span class="${i < level ? 'price-dollar' : 'price-dollar-inactive'}">$</span>`
  ).join('');
}

function restaurantCard(r) {
  const votes = r.restaurant_votes || [];
  const tid = getCurrentTravelerId();
  const hasVoted = votes.some(v => v.traveler_id === tid);
  const addedBy = TRAVELERS.find(t => t.id === r.added_by);
  return `
    <div class="card p-4">
      <div class="flex justify-between items-start mb-1">
        <span class="font-bold">${r.name}</span>
        <span class="text-sm">${priceDisplay(r.price_range)}</span>
      </div>
      ${r.cuisine ? `<div class="text-xs text-gray-500 mb-1">${r.cuisine}</div>` : ''}
      <div class="flex gap-1 mb-2">
        <span class="badge badge-suggested text-xs">${r.meal_type}</span>
      </div>
      ${r.address ? `<div class="text-xs text-gray-500 mb-1"><i data-lucide="map-pin" class="w-3 h-3 inline"></i> ${r.address}</div>` : ''}
      ${r.booking_url ? `<a href="${r.booking_url}" target="_blank" class="text-xs text-blue-500 hover:underline">Link</a>` : ''}
      ${r.notes ? `<div class="text-xs text-gray-400 mt-1">${r.notes}</div>` : ''}
      <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div class="flex items-center gap-1">
          <button onclick="window._voteRestaurant('${r.id}')" class="vote-btn ${hasVoted ? 'voted' : 'text-gray-400'}">
            <i data-lucide="thumbs-up" class="w-4 h-4"></i>
          </button>
          <span class="text-sm font-bold">${votes.length}</span>
        </div>
        <div class="flex gap-2 items-center">
          ${addedBy ? `<span class="text-xs text-gray-300">by ${addedBy.name}</span>` : ''}
          <button onclick="window._deleteRestaurant('${r.id}')" class="text-xs text-red-400 hover:text-red-600">Delete</button>
        </div>
      </div>
    </div>`;
}

window._voteRestaurant = async (id) => {
  const tid = getCurrentTravelerId();
  if (!tid) { showToast('Select who you are first', 'error'); return; }
  try { await toggleRestaurantVote(id, tid); render(); }
  catch (e) { showToast('Vote error: ' + e.message, 'error'); }
};

window._deleteRestaurant = async (id) => {
  if (!confirm('Delete this restaurant?')) return;
  try { await deleteRestaurant(id); showToast('Restaurant deleted'); render(); }
  catch (e) { showToast('Error: ' + e.message, 'error'); }
};

function openAddRestaurantModal() {
  const tid = getCurrentTravelerId();
  if (!tid) { showToast('Please select who you are first', 'error'); return; }
  const html = `
    <div class="grid gap-3">
      <div><label class="form-label">Restaurant Name</label><input id="r-name" class="form-input" placeholder="The Varsity"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="form-label">City</label><select id="r-city" class="form-input"><option value="Atlanta">Atlanta</option><option value="Boston">Boston</option></select></div>
        <div><label class="form-label">Cuisine</label><input id="r-cuisine" class="form-input" placeholder="Southern, BBQ..."></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="form-label">Meal</label><select id="r-meal" class="form-input"><option value="any">Any</option><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option></select></div>
        <div><label class="form-label">Price Range</label><select id="r-price" class="form-input"><option value="$">$ (Budget)</option><option value="$$" selected>$$ (Moderate)</option><option value="$$$">$$$ (Upscale)</option></select></div>
      </div>
      <div><label class="form-label">Address</label><input id="r-address" class="form-input" placeholder="Optional"></div>
      <div><label class="form-label">Link</label><input id="r-url" class="form-input" placeholder="https://..."></div>
      <div><label class="form-label">Notes</label><input id="r-notes" class="form-input" placeholder="Optional"></div>
    </div>`;
  openModal('Add Restaurant', html, async () => {
    try {
      await addRestaurant({
        name: document.getElementById('r-name').value,
        city: document.getElementById('r-city').value,
        cuisine: document.getElementById('r-cuisine').value,
        meal_type: document.getElementById('r-meal').value,
        price_range: document.getElementById('r-price').value,
        address: document.getElementById('r-address').value,
        booking_url: document.getElementById('r-url').value,
        notes: document.getElementById('r-notes').value,
        added_by: tid,
      });
      closeModal();
      showToast('Restaurant added!');
      render();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
  });
}
