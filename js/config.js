// Supabase connection
export const SUPABASE_URL = 'https://imorawuusspgpexqyrmm.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imltb3Jhd3V1c3NwZ3BleHF5cm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTc3NzgsImV4cCI6MjA5MDA3Mzc3OH0.aJliW88b85TLY0dFpzcS5_WAdoi4QeqJGnMf-jTrYAs';

// Traveler definitions
export const TRAVELERS = [
  { id: 'traveler-1', name: 'Fangshu', origin: 'Seattle, WA', airport: 'SEA', color: '#2563EB', matches: ['atlanta', 'boston'] },
  { id: 'traveler-2', name: 'Jikai', origin: 'Seattle, WA', airport: 'SEA', color: '#16A34A', matches: ['atlanta'] },
  { id: 'traveler-3', name: 'Zhijiong', origin: 'Los Angeles, CA', airport: 'LAX', color: '#EA580C', matches: ['atlanta', 'boston'] },
  { id: 'traveler-4', name: 'Chengpeng', origin: 'Bay Area, CA', airport: 'SJC', color: '#9333EA', matches: ['atlanta'] },
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
    attendeeIds: ['traveler-1', 'traveler-2', 'traveler-3', 'traveler-4'],
  },
  {
    id: 'match-18',
    number: 18,
    city: 'Boston',
    cityKey: 'boston',
    venue: 'Gillette Stadium, Foxborough',
    date: '2026-06-16',
    time: '6:00 PM ET / 3:00 PM PT',
    teams: 'TBD (Playoff) vs Norway',
    attendeeIds: ['traveler-1', 'traveler-3'],
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
    departure_time: '2026-06-14T06:00:00-07:00',
    arrival_time: '2026-06-14T10:56:00-07:00',
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
    departure_time: '2026-06-17T15:35:00-07:00',
    arrival_time: '2026-06-17T22:05:00-07:00',
    status: 'booked',
    price: null,
    notes: 'Jun 17 - Departs 6:35 PM ET (3:35 PM PT), arrives 10:05 PM PT',
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
  price_per_night numeric,
  check_in date,
  check_out date,
  booking_url text DEFAULT '',
  added_by text NOT NULL,
  notes text DEFAULT '',
  status text DEFAULT 'suggested',
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
  booking_url text DEFAULT '',
  added_by text NOT NULL,
  notes text DEFAULT '',
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
