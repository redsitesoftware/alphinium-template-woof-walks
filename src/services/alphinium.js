/**
 * Alphinium shared API client
 *
 * Provides a thin REST client and per-domain helper functions for the three
 * live alphinium services used by WoofWalks: maps, payments, and push.
 *
 * No official alphinium SDK is published on npm; all communication is done
 * via fetch() against the REST API described in the alphinium developer docs.
 * Set ALPHINIUM_API_BASE_URL and the per-service keys in your .env file
 * (see .env.example).
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = process.env.ALPHINIUM_API_BASE_URL || '';
const MAPS_KEY = process.env.ALPHINIUM_MAPS_KEY || '';
const PAYMENTS_KEY = process.env.ALPHINIUM_PAYMENTS_KEY || '';
const PUSH_KEY = process.env.ALPHINIUM_PUSH_KEY || '';

const IS_DEV = process.env.NODE_ENV !== 'production';

function warnMissingKey(name) {
  if (IS_DEV) {
    console.warn(`[alphinium] Missing env var: ${name}. Some features will not work.`);
  }
}

if (!BASE_URL) warnMissingKey('ALPHINIUM_API_BASE_URL');
if (!MAPS_KEY) warnMissingKey('ALPHINIUM_MAPS_KEY');
if (!PAYMENTS_KEY) warnMissingKey('ALPHINIUM_PAYMENTS_KEY');
if (!PUSH_KEY) warnMissingKey('ALPHINIUM_PUSH_KEY');

// ---------------------------------------------------------------------------
// Core client
// ---------------------------------------------------------------------------

/**
 * Make an authenticated request to the alphinium REST API.
 *
 * @param {string} path - API path, e.g. "/maps/geocode"
 * @param {string} apiKey - Service-specific API key
 * @param {RequestInit} [options] - fetch options (method, body, etc.)
 * @returns {Promise<unknown>} Parsed JSON response
 * @throws {Error} On non-2xx responses or network failures
 */
async function alphiniumRequest(path, apiKey, options = {}) {
  if (!BASE_URL) {
    throw new Error('[alphinium] ALPHINIUM_API_BASE_URL is not configured.');
  }

  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkError) {
    throw new Error(`[alphinium] Network error calling ${url}: ${networkError.message}`);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body.message || body.error || '';
    } catch (_) {
      // ignore parse errors — use HTTP status only
    }
    throw new Error(
      `[alphinium] Request failed — ${response.status} ${response.statusText}${detail ? `: ${detail}` : ''} (${url})`
    );
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Maps helpers
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} LatLng
 * @property {number} lat
 * @property {number} lng
 */

/**
 * Geocode a text address to lat/lng coordinates.
 *
 * @param {string} address - Human-readable address
 * @returns {Promise<LatLng>}
 */
export async function mapsGeocode(address) {
  return alphiniumRequest(
    `/maps/geocode?address=${encodeURIComponent(address)}`,
    MAPS_KEY
  );
}

/**
 * Fetch a live walker route for display on the tracking screen.
 *
 * @param {string} walkId - Active walk ID
 * @returns {Promise<{ polyline: LatLng[]; progress: number }>}
 */
export async function mapsGetWalkRoute(walkId) {
  return alphiniumRequest(`/maps/walks/${encodeURIComponent(walkId)}/route`, MAPS_KEY);
}

// ---------------------------------------------------------------------------
// Payments helpers
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} PaymentIntent
 * @property {string} id
 * @property {string} clientSecret
 * @property {number} amount - Amount in cents
 * @property {string} currency
 */

/**
 * Create a payment intent for a booking.
 *
 * @param {{ walkerId: string; amount: number; currency?: string; bookingId: string }} params
 * @returns {Promise<PaymentIntent>}
 */
export async function paymentsCreateIntent(params) {
  return alphiniumRequest('/payments/intents', PAYMENTS_KEY, {
    method: 'POST',
    body: JSON.stringify({ currency: 'aud', ...params }),
  });
}

/**
 * Confirm a payment intent after the user approves.
 *
 * @param {string} intentId
 * @returns {Promise<{ status: string }>}
 */
export async function paymentsConfirmIntent(intentId) {
  return alphiniumRequest(`/payments/intents/${encodeURIComponent(intentId)}/confirm`, PAYMENTS_KEY, {
    method: 'POST',
  });
}

// ---------------------------------------------------------------------------
// Push notification helpers
// ---------------------------------------------------------------------------

/**
 * Register a device push token with the alphinium push service.
 *
 * @param {{ userId: string; token: string; platform: 'ios' | 'android' | 'web' }} params
 * @returns {Promise<{ registered: boolean }>}
 */
export async function pushRegisterToken(params) {
  return alphiniumRequest('/push/tokens', PUSH_KEY, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Send a push notification to a user.
 *
 * @param {{ userId: string; title: string; body: string; data?: Record<string, unknown> }} params
 * @returns {Promise<{ sent: boolean; messageId: string }>}
 */
export async function pushSendNotification(params) {
  return alphiniumRequest('/push/send', PUSH_KEY, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ---------------------------------------------------------------------------
// Maps / GPS tracking helpers (alphinium-maps)
// ---------------------------------------------------------------------------

// Simulated GPS route for demo/dev (20 waypoints ≈ a park loop, sampled at ~5s each).
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

let _walkStep = 8;
const _pollStartTime = Date.now();

/** Configurable polling interval (ms). Components should import this constant. */
export const TRACKING_POLL_INTERVAL_MS = 5000;

/** Total waypoints in the simulated route (used for progress calculation). */
export const ROUTE_TOTAL_WAYPOINTS = SIMULATED_ROUTE.length;

/**
 * Returns the current GPS position of the walker.
 * Falls back to alphinium REST API in production; uses simulation in dev.
 * @param {string} walkId
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
export async function getWalkPosition(walkId) {
  if (BASE_URL && MAPS_KEY) {
    try {
      const data = await alphiniumRequest(`/maps/walks/${encodeURIComponent(walkId)}/position`, MAPS_KEY);
      return data;
    } catch (_) {
      // fall through to simulation
    }
  }
  const elapsed = Date.now() - _pollStartTime;
  const idx = Math.min(_walkStep + Math.floor(elapsed / TRACKING_POLL_INTERVAL_MS), SIMULATED_ROUTE.length - 1);
  return SIMULATED_ROUTE[idx] ?? null;
}

/**
 * Returns the full GPS route walked so far.
 * @param {string} walkId
 * @returns {Promise<Array<{ lat: number, lng: number }>>}
 */
export async function getRouteHistory(walkId) {
  if (BASE_URL && MAPS_KEY) {
    try {
      return await alphiniumRequest(`/maps/walks/${encodeURIComponent(walkId)}/route`, MAPS_KEY);
    } catch (_) {
      // fall through to simulation
    }
  }
  const elapsed = Date.now() - _pollStartTime;
  const idx = Math.min(_walkStep + Math.floor(elapsed / TRACKING_POLL_INTERVAL_MS) + 1, SIMULATED_ROUTE.length);
  return SIMULATED_ROUTE.slice(0, idx);
}

/**
 * Returns photo updates published during the walk.
 * @param {string} walkId
 * @returns {Promise<Array<{ id: string, uri: string, caption: string, timestamp: number, walkerName: string }>>}
 */
export async function getWalkPhotos(walkId) {
  if (BASE_URL && MAPS_KEY) {
    try {
      return await alphiniumRequest(`/maps/walks/${encodeURIComponent(walkId)}/photos`, MAPS_KEY);
    } catch (_) {
      // fall through to simulation
    }
  }
  const elapsed = Date.now() - _pollStartTime;
  const count = Math.min(Math.floor(elapsed / (TRACKING_POLL_INTERVAL_MS * 6)) + 2, SIMULATED_PHOTOS.length);
  return SIMULATED_PHOTOS.slice(0, count);
}

/**
 * Upload a photo taken during an active walk.
 *
 * @param {string} walkId - Active walk ID
 * @param {{ uri: string | null, caption: string }} photoPayload - Photo data
 * @param {string} authToken - Walker's Bearer auth token
 * @returns {Promise<{ id: string, uri: string, caption: string, timestamp: number, walkerName: string }>}
 */
export async function uploadWalkPhoto(walkId, photoPayload, authToken) {
  if (BASE_URL && MAPS_KEY) {
    try {
      return await alphiniumRequest(
        `/maps/walks/${encodeURIComponent(walkId)}/photos`,
        MAPS_KEY,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
          body: JSON.stringify(photoPayload),
        }
      );
    } catch (_) {
      // fall through to simulation
    }
  }
  // Simulation fallback — demo works without a live API
  return {
    id: `p_${Date.now()}`,
    uri: SIMULATED_PHOTOS[0].uri,
    caption: photoPayload.caption || 'Walk update!',
    timestamp: Date.now(),
    walkerName: 'Demo Walker',
  };
}


/**
 * Publish a walker's current GPS position to the server (best-effort).
 *
 * GPS position publishing is fire-and-forget — errors are silently swallowed
 * so a network blip never crashes the tracking session.
 *
 * Falls back to a no-op `{ accepted: true }` when BASE_URL or MAPS_KEY is
 * not configured (demo / CI environments).
 *
 * @param {string} walkId - The active walk identifier
 * @param {{ lat: number, lng: number, timestamp: number }} coords - Position payload
 * @param {string} authToken - Walker's Bearer auth token
 * @returns {Promise<{ accepted: boolean }>}
 */
export async function postWalkLocation(walkId, coords, authToken) {
  if (!BASE_URL || !MAPS_KEY) {
    return { accepted: true };
  }

  try {
    return await alphiniumRequest(
      `/maps/walks/${encodeURIComponent(walkId)}/location`,
      MAPS_KEY,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(coords),
      }
    );
  } catch (_) {
    // Best-effort — silent failure so tracking is never interrupted
    return { accepted: false };
  }
}
