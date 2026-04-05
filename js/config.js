// Supabase connection
export const SUPABASE_URL = 'https://imorawuusspgpexqyrmm.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imltb3Jhd3V1c3NwZ3BleHF5cm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTc3NzgsImV4cCI6MjA5MDA3Mzc3OH0.aJliW88b85TLY0dFpzcS5_WAdoi4QeqJGnMf-jTrYAs';

// Google Maps API key (for Places autocomplete)
export const GOOGLE_MAPS_API_KEY = 'AIzaSyDNQJymjHaDIhsdcPttvMBAbimEPBpmYtM';

// Venue & airport coordinates for distance calculations
export const VENUES = {
  atlanta: {
    stadium: { name: 'Mercedes-Benz Stadium', lat: 33.7553, lng: -84.4006 },
    airport: { name: 'ATL Airport', lat: 33.6407, lng: -84.4277 },
  },
  boston: {
    stadium: { name: 'Gillette Stadium', lat: 42.0909, lng: -71.2643 },
    airport: { name: 'BOS Airport', lat: 42.3656, lng: -71.0096 },
  },
  los_angeles: {
    stadium: { name: 'SoFi Stadium', lat: 33.9535, lng: -118.3392 },
    airport: { name: 'LAX Airport', lat: 33.9425, lng: -118.4081 },
  },
  dallas: {
    stadium: { name: 'AT&T Stadium', lat: 32.7473, lng: -97.0945 },
    airport: { name: 'DFW Airport', lat: 32.8998, lng: -97.0403 },
  },
};

// Traveler definitions
export const TRAVELERS = [
  { id: 'traveler-1', name: 'Fangshu', origin: 'Seattle, WA', airport: 'SEA', color: '#2563EB', matches: ['atlanta', 'boston', 'los_angeles', 'dallas'] },
  { id: 'traveler-2', name: 'Jikai', origin: 'Seattle, WA', airport: 'SEA', color: '#16A34A', matches: ['atlanta'] },
  { id: 'traveler-3', name: 'Zhijiong', origin: 'Los Angeles, CA', airport: 'LAX', color: '#EA580C', matches: ['atlanta', 'boston'] },
  { id: 'traveler-4', name: 'Chengpeng', origin: 'Bay Area, CA', airport: 'SJC', color: '#9333EA', matches: ['atlanta', 'los_angeles', 'dallas'] },
];

// Match definitions
export const MATCHES = [
  {
    id: 'match-14',
    number: 14,
    city: 'Atlanta',
    cityKey: 'atlanta',
    venue: 'Mercedes-Benz Stadium',
    date: '2026-06-15',
    time: '12:00 PM ET / 9:00 AM PT',
    teams: 'Spain vs Cape Verde',
    stage: 'group',
    group: 'H',
    groupTeams: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
    attendeeIds: ['traveler-1', 'traveler-2', 'traveler-3', 'traveler-4'],
    seats: { block: 312, row: 8, seatRange: '1–4', level: '300 Level (Upper Deck)', angle: 85 },
  },
  {
    id: 'match-18',
    number: 18,
    city: 'Boston',
    cityKey: 'boston',
    venue: 'Gillette Stadium, Foxborough',
    date: '2026-06-16',
    time: '6:00 PM ET / 3:00 PM PT',
    teams: 'Iraq vs Norway',
    stage: 'group',
    group: 'I',
    groupTeams: ['France', 'Senegal', 'Iraq', 'Norway'],
    attendeeIds: ['traveler-1', 'traveler-3'],
    seats: { block: 325, row: 6, seatRange: '18–19', level: 'Upper Level', angle: 223 },
  },
  {
    id: 'match-73',
    number: 73,
    city: 'Los Angeles',
    cityKey: 'los_angeles',
    venue: 'SoFi Stadium, Inglewood',
    date: '2026-06-28',
    time: '3:00 PM ET / 12:00 PM PT',
    teams: 'Group A 2nd vs Group B 2nd',
    stage: 'round-of-32',
    groups: [
      { name: 'A', teams: ['Mexico', 'South Africa', 'South Korea', 'Czechia'] },
      { name: 'B', teams: ['Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland'] },
    ],
    attendeeIds: ['traveler-1', 'traveler-4'],
    seats: { block: 457, row: 4, seatRange: '21–23', level: '400 Level', angle: 200 },
  },
  {
    id: 'match-78',
    number: 78,
    city: 'Dallas',
    cityKey: 'dallas',
    venue: 'AT&T Stadium, Arlington',
    date: '2026-06-30',
    time: '1:00 PM ET / 10:00 AM PT',
    teams: 'Group E 2nd vs Group I 2nd',
    stage: 'round-of-32',
    groups: [
      { name: 'E', teams: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'] },
      { name: 'I', teams: ['France', 'Senegal', 'Iraq', 'Norway'] },
    ],
    attendeeIds: ['traveler-1', 'traveler-4'],
    seats: { block: 421, row: 4, seatRange: '1–3', level: '400 Level', angle: 168 },
  },
];

// Pre-populated flights
export const SEED_FLIGHTS = [
  {
    traveler_id: 'traveler-1',
    flight_number: 'DL0569',
    airline: 'Delta',
    origin_airport: 'SEA',
    destination_airport: 'ATL',
    departure_time: '2026-06-13T06:00:00-07:00',
    arrival_time: '2026-06-13T10:56:00-07:00',
    status: 'booked',
    price: null,
    notes: 'Departs 6:00 AM PT, arrives 1:56 PM ET (10:56 AM PT)',
  },
  {
    traveler_id: 'traveler-1',
    flight_number: 'DL0324',
    airline: 'Delta',
    origin_airport: 'BOS',
    destination_airport: 'SEA',
    departure_time: '2026-06-17T16:25:00-07:00',
    arrival_time: '2026-06-17T22:49:00-07:00',
    status: 'booked',
    price: null,
    notes: 'Jun 17 - Departs 7:25 PM ET (4:25 PM PT), arrives 10:49 PM PT',
  },
];

// Supabase table creation SQL (for reference)
export const SETUP_SQL = `
CREATE TABLE flights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  traveler_id text NOT NULL,
  flight_number text,
  airline text,
  origin_airport text NOT NULL,
  destination_airport text NOT NULL,
  departure_time timestamptz,
  arrival_time timestamptz,
  status text DEFAULT 'looking',
  price numeric,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE hotels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  city text NOT NULL,
  name text NOT NULL,
  address text DEFAULT '',
  lat double precision,
  lng double precision,
  price_per_night numeric,
  check_in date,
  check_out date,
  booking_url text DEFAULT '',
  added_by text NOT NULL,
  notes text DEFAULT '',
  status text DEFAULT 'suggested',
  type text DEFAULT 'hotel',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE hotel_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE,
  traveler_id text NOT NULL,
  UNIQUE(hotel_id, traveler_id)
);

CREATE TABLE restaurants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  city text NOT NULL,
  name text NOT NULL,
  cuisine text DEFAULT '',
  meal_type text DEFAULT 'any',
  price_range text DEFAULT '$$',
  address text DEFAULT '',
  lat double precision,
  lng double precision,
  booking_url text DEFAULT '',
  added_by text NOT NULL,
  notes text DEFAULT '',
  category text DEFAULT 'restaurant',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE restaurant_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  traveler_id text NOT NULL,
  UNIQUE(restaurant_id, traveler_id)
);

CREATE TABLE notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text DEFAULT '',
  added_by text NOT NULL,
  pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
`;
