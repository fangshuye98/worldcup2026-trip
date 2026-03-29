import { TRAVELERS } from './config.js';
import { initSupabase, seedIfEmpty } from './api.js';
import * as overview from './overview.js';
import * as flights from './flights.js';
import * as hotels from './hotels.js';
import * as restaurants from './restaurants.js';
import * as matches from './matches.js';
import * as notes from './notes.js';

const TABS = ['overview', 'flights', 'stays', 'eats', 'matches', 'notes'];
let currentTravelerId = localStorage.getItem('travelerId') || null;

// ---- Public API ----
export function getCurrentTraveler() {
  return TRAVELERS.find(t => t.id === currentTravelerId) || null;
}

export function getCurrentTravelerId() {
  return currentTravelerId;
}

export function openModal(title, bodyHTML, onSubmit) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  overlay.classList.remove('hidden');
  overlay._onSubmit = onSubmit;
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

export function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };
  toast.className = `toast fixed bottom-4 right-4 ${colors[type] || colors.info} text-white px-5 py-3 rounded-lg shadow-lg z-50 text-sm font-medium`;
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => { toast.classList.add('hidden'); toast.classList.remove('toast-exit'); }, 300);
  }, 3000);
}

// ---- Tab switching ----
function switchTab(tabName) {
  TABS.forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== tabName);
    document.getElementById(`tab-btn-${t}`).classList.toggle('tab-active', t === tabName);
  });
  history.replaceState(null, '', `#${tabName}`);
}

// ---- Identity selector ----
function setupIdentity() {
  const select = document.getElementById('identity-select');
  select.innerHTML = '<option value="">Select yourself...</option>';
  TRAVELERS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = `${t.name} (${t.origin})`;
    if (t.id === currentTravelerId) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener('change', (e) => {
    currentTravelerId = e.target.value || null;
    if (currentTravelerId) {
      localStorage.setItem('travelerId', currentTravelerId);
    } else {
      localStorage.removeItem('travelerId');
    }
    showToast(currentTravelerId ? `Hi, ${getCurrentTraveler().name}!` : 'Identity cleared', 'info');
  });
}

// ---- Modal handlers ----
function setupModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.getElementById('modal-submit').addEventListener('click', () => {
    const overlay = document.getElementById('modal-overlay');
    if (overlay._onSubmit) overlay._onSubmit();
  });
}

// ---- Initialization ----
async function init() {
  try {
    initSupabase();
  } catch (e) {
    console.warn('Supabase init failed:', e.message);
  }

  setupIdentity();
  setupModal();

  // Tab click handlers
  TABS.forEach(t => {
    document.getElementById(`tab-btn-${t}`).addEventListener('click', () => switchTab(t));
  });

  // Read URL hash (with backward compat for old names)
  let hash = window.location.hash.slice(1);
  if (hash === 'hotels') hash = 'stays';
  if (hash === 'restaurants') hash = 'eats';
  switchTab(TABS.includes(hash) ? hash : 'overview');

  // Seed data
  try {
    await seedIfEmpty();
  } catch (e) {
    console.warn('Seed failed (may need Supabase config):', e.message);
  }

  // Init all tabs
  const modules = [overview, flights, hotels, restaurants, matches, notes];
  for (const mod of modules) {
    try {
      await mod.init();
    } catch (e) {
      console.warn(`Module init failed:`, e.message);
    }
  }

  // Lucide icons
  if (window.lucide) window.lucide.createIcons();
}

// Modules are deferred, so DOM is ready. Run init immediately.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
