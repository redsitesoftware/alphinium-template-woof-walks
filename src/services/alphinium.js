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
