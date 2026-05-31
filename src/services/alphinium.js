/**
 * alphinium API client
 * Provides access to alphinium-maps GPS tracking, route history, and walk photo feed.
 *
 * In production this would call real alphinium endpoints authenticated via SDK config.
 * For demo/development the client returns realistic simulated walk data.
 */

// Simulated GPS coordinates representing a walk through a park loop (lat/lng pairs).
// Each entry is one step along the route, sampled at ~5-second intervals.
const SIMULATED_ROUTE = [
  { lat: -33.8856, lng: 151.2099 },
  { lat: -33.8854, lng: 151.2103 },
  { lat: -33.8851, lng: 151.2108 },
  { lat: -33.8848, lng: 151.2113 },
  { lat: -33.8845, lng: 151.2117 },
  { lat: -33.8843, lng: 151.2122 },
  { lat: -33.8841, lng: 151.2127 },
  { lat: -33.8839, lng: 151.2131 },
  { lat: -33.8837, lng: 151.2136 },
  { lat: -33.8836, lng: 151.2141 },
  { lat: -33.8835, lng: 151.2146 },
  { lat: -33.8835, lng: 151.2151 },
  { lat: -33.8836, lng: 151.2156 },
  { lat: -33.8838, lng: 151.2160 },
  { lat: -33.8841, lng: 151.2163 },
  { lat: -33.8844, lng: 151.2165 },
  { lat: -33.8847, lng: 151.2164 },
  { lat: -33.8850, lng: 151.2161 },
  { lat: -33.8852, lng: 151.2157 },
  { lat: -33.8853, lng: 151.2152 },
];

// Simulated photo updates that the walker shares during the walk.
const SIMULATED_PHOTOS = [
  {
    id: 'photo-1',
    uri: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600',
    caption: 'Buddy spotted a squirrel — full sprint mode activated! 🐿️',
    timestamp: Date.now() - 12 * 60 * 1000,
    walkerName: 'Jessica Park',
  },
  {
    id: 'photo-2',
    uri: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600',
    caption: 'Happy boy at the halfway point — tongue out, tail wagging! 🐾',
    timestamp: Date.now() - 6 * 60 * 1000,
    walkerName: 'Jessica Park',
  },
  {
    id: 'photo-3',
    uri: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600',
    caption: 'Water break at the fountain. Buddy is loving this walk! 💧',
    timestamp: Date.now() - 2 * 60 * 1000,
    walkerName: 'Jessica Park',
  },
];

// Internal walk state used by the simulated GPS feed.
let _walkStep = 8; // start partway through to match the 40% progress shown on screen
let _lastPhotoIndex = 1;
const _pollStartTime = Date.now();
const GPS_POLL_INTERVAL_MS = 5000;

/**
 * Returns the current GPS position of the walker.
 * @param {string} walkId - The active walk identifier.
 * @returns {Promise<{ lat: number, lng: number } | null>} Current position or null if unavailable.
 */
export async function getWalkPosition(walkId) {
  // Advance the simulated walker one step per poll cycle.
  const elapsed = Date.now() - _pollStartTime;
  const stepIndex = _walkStep + Math.floor(elapsed / GPS_POLL_INTERVAL_MS);
  const clampedIndex = Math.min(stepIndex, SIMULATED_ROUTE.length - 1);
  return SIMULATED_ROUTE[clampedIndex] ?? null;
}

/**
 * Returns the full route history (all coordinates walked so far).
 * @param {string} walkId - The active walk identifier.
 * @returns {Promise<Array<{ lat: number, lng: number }>>}
 */
export async function getRouteHistory(walkId) {
  const elapsed = Date.now() - _pollStartTime;
  const stepIndex = _walkStep + Math.floor(elapsed / GPS_POLL_INTERVAL_MS);
  const clampedIndex = Math.min(stepIndex + 1, SIMULATED_ROUTE.length);
  return SIMULATED_ROUTE.slice(0, clampedIndex);
}

/**
 * Returns photo updates published by the walker during the walk.
 * @param {string} walkId - The active walk identifier.
 * @returns {Promise<Array<{ id: string, uri: string, caption: string, timestamp: number, walkerName: string }>>}
 */
export async function getWalkPhotos(walkId) {
  const elapsed = Date.now() - _pollStartTime;
  const extraPhotos = Math.floor(elapsed / (GPS_POLL_INTERVAL_MS * 6));
  const count = Math.min(_lastPhotoIndex + 1 + extraPhotos, SIMULATED_PHOTOS.length);
  return SIMULATED_PHOTOS.slice(0, count);
}

/** Configurable polling interval (ms). Components should use this constant. */
export const TRACKING_POLL_INTERVAL_MS = GPS_POLL_INTERVAL_MS;

/** Total number of waypoints in the simulated route (used for progress calculation). */
export const ROUTE_TOTAL_WAYPOINTS = SIMULATED_ROUTE.length;
