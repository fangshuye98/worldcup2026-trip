import { SUPABASE_URL, SUPABASE_ANON_KEY, SEED_FLIGHTS } from './config.js';

let supabase = null;

export function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.warn('Supabase JS library not loaded');
  }
}

export function getClient() { return supabase; }

function requireSupabase() {
  if (!supabase) throw new Error('Supabase not connected');
}

// ---- FLIGHTS ----
export async function getFlights() {
  requireSupabase();
  const { data, error } = await supabase.from('flights').select('*').order('departure_time');
  if (error) throw error;
  return data || [];
}

export async function addFlight(flight) {
  requireSupabase();
  const { data, error } = await supabase.from('flights').insert(flight).select();
  if (error) throw error;
  return data[0];
}

export async function updateFlight(id, updates) {
  requireSupabase();
  const { error } = await supabase.from('flights').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteFlight(id) {
  requireSupabase();
  const { error } = await supabase.from('flights').delete().eq('id', id);
  if (error) throw error;
}

// ---- HOTELS ----
export async function getHotels() {
  requireSupabase();
  const { data, error } = await supabase.from('hotels').select('*, hotel_votes(*)').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function addHotel(hotel) {
  requireSupabase();
  const { data, error } = await supabase.from('hotels').insert(hotel).select();
  if (error) throw error;
  return data[0];
}

export async function updateHotel(id, updates) {
  requireSupabase();
  const { error } = await supabase.from('hotels').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteHotel(id) {
  requireSupabase();
  const { error } = await supabase.from('hotels').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleHotelVote(hotelId, travelerId) {
  requireSupabase();
  const { data: existing } = await supabase.from('hotel_votes')
    .select('id').eq('hotel_id', hotelId).eq('traveler_id', travelerId);
  if (existing && existing.length > 0) {
    await supabase.from('hotel_votes').delete().eq('id', existing[0].id);
  } else {
    await supabase.from('hotel_votes').insert({ hotel_id: hotelId, traveler_id: travelerId });
  }
}

// ---- RESTAURANTS ----
export async function getRestaurants() {
  requireSupabase();
  const { data, error } = await supabase.from('restaurants').select('*, restaurant_votes(*)').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function addRestaurant(restaurant) {
  requireSupabase();
  const { data, error } = await supabase.from('restaurants').insert(restaurant).select();
  if (error) throw error;
  return data[0];
}

export async function updateRestaurant(id, updates) {
  requireSupabase();
  const { error } = await supabase.from('restaurants').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteRestaurant(id) {
  requireSupabase();
  const { error } = await supabase.from('restaurants').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleRestaurantVote(restaurantId, travelerId) {
  requireSupabase();
  const { data: existing } = await supabase.from('restaurant_votes')
    .select('id').eq('restaurant_id', restaurantId).eq('traveler_id', travelerId);
  if (existing && existing.length > 0) {
    await supabase.from('restaurant_votes').delete().eq('id', existing[0].id);
  } else {
    await supabase.from('restaurant_votes').insert({ restaurant_id: restaurantId, traveler_id: travelerId });
  }
}

// ---- NOTES ----
export async function getNotes() {
  requireSupabase();
  const { data, error } = await supabase.from('notes').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addNote(note) {
  requireSupabase();
  const { data, error } = await supabase.from('notes').insert(note).select();
  if (error) throw error;
  return data[0];
}

export async function updateNote(id, updates) {
  requireSupabase();
  updates.updated_at = new Date().toISOString();
  const { error } = await supabase.from('notes').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteNote(id) {
  requireSupabase();
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

// ---- REAL-TIME ----
export function subscribeToTable(table, callback) {
  if (!supabase) return null;
  return supabase
    .channel(`${table}-changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
}

// ---- SEED ----
export async function seedIfEmpty() {
  requireSupabase();
  const { data } = await supabase.from('flights').select('id').limit(1);
  if (!data || data.length === 0) {
    await supabase.from('flights').insert(SEED_FLIGHTS);
  }
}
