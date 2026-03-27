import { GOOGLE_MAPS_API_KEY } from './config.js';

let mapsPromise = null;

export function loadGoogleMaps() {
  if (mapsPromise) return mapsPromise;
  if (!GOOGLE_MAPS_API_KEY) return Promise.resolve(false);
  mapsPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.onload = () => resolve(true);
    script.onerror = () => { mapsPromise = null; resolve(false); };
    document.head.appendChild(script);
  });
  return mapsPromise;
}

export function isMapsLoaded() {
  return !!(window.google && window.google.maps && window.google.maps.places);
}
