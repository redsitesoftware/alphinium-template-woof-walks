/**
 * Walkers service
 *
 * Provides getWalkers() and createWalkerProfile() backed by the alphinium
 * walkers REST API. When the API is unavailable (dev/demo mode or missing
 * env vars) all functions fall back gracefully to returning null so callers
 * can use their own fallback data.
 *
 * API response field mapping:
 *   price_per_30min  → pricePer30
 *   max_dogs         → dogs  (formatted as "Up to N" or "Solo only")
 *   years_experience → appended to bio/tags
 */

const BASE_URL = process.env.ALPHINIUM_API_BASE_URL || '';
const WALKERS_KEY = process.env.ALPHINIUM_WALKERS_KEY || '';

const IS_DEV = process.env.NODE_ENV !== 'production';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isConfigured() {
  return Boolean(BASE_URL);
}

async function walkersRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(WALKERS_KEY ? { Authorization: `Bearer ${WALKERS_KEY}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    throw new Error(`[walkers] HTTP ${response.status} ${response.statusText} — ${path}`);
  }

  return response.json();
}

/**
 * Map a single walker API response object to the shape expected by woofStore.
 *
 * API fields that differ from the store shape:
 *   price_per_30min  → pricePer30
 *   max_dogs         → dogs  (number → "Up to N" string; 1 → "Solo only")
 *   years_experience → appended to bio and added as a tag
 */
function mapApiWalker(apiWalker) {
  const maxDogs = apiWalker.max_dogs;
  const dogsLabel = maxDogs === 1 ? 'Solo only' : `Up to ${maxDogs}`;

  const yearsExp = apiWalker.years_experience;
  const expTag = yearsExp ? `${yearsExp}+ yrs experience` : null;
  const expBio = yearsExp ? ` ${yearsExp} years of experience.` : '';

  return {
    // Identity
    id: apiWalker.id,
    name: apiWalker.name,
    emoji: apiWalker.emoji ?? '',
    suburb: apiWalker.suburb,
    distance: apiWalker.distance ?? 0,

    // Ratings
    rating: apiWalker.rating ?? 0,
    reviewCount: apiWalker.review_count ?? 0,
    ratingBreakdown: apiWalker.rating_breakdown ?? {
      reliability: 0,
      punctuality: 0,
      communication: 0,
      care: 0,
    },

    // Pricing (mapped)
    pricePerWalk: apiWalker.price_per_walk ?? 0,
    pricePer30: apiWalker.price_per_30min ?? 0,

    // Availability
    available: apiWalker.available ?? false,
    nextSlot: apiWalker.next_slot ?? '',

    // Capacity (mapped)
    dogs: dogsLabel,

    // Badge
    badge: apiWalker.badge ?? null,
    badgeColor: apiWalker.badge_color ?? null,

    // Verification status
    verified: apiWalker.verified ?? false,

    // Services / bio / tags (years_experience merged in)
    services: apiWalker.services ?? [],
    bio: (apiWalker.bio ?? '') + expBio,
    tags: expTag ? [...(apiWalker.tags ?? []), expTag] : (apiWalker.tags ?? []),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the list of walkers from the API.
 *
 * @returns {Promise<Array<object>|null>} Mapped walker objects, or null if the
 *   API is not configured or the request fails (caller should use fallback data).
 */
export async function getWalkers() {
  if (!isConfigured()) {
    if (IS_DEV) {
      console.warn('[walkers] ALPHINIUM_API_BASE_URL not set — using fallback data.');
    }
    return null;
  }

  try {
    const data = await walkersRequest('/walkers');
    const walkers = Array.isArray(data) ? data : (data.walkers ?? []);
    return walkers.map(mapApiWalker);
  } catch (error) {
    if (IS_DEV) {
      console.warn('[walkers] getWalkers() failed — using fallback data.', error);
    }
    return null;
  }
}

/**
 * Create a new walker profile via the API.
 *
 * @param {object} profileData - Walker profile fields
 * @returns {Promise<object|null>} The created walker (mapped), or null on failure.
 */
export async function createWalkerProfile(profileData) {
  if (!isConfigured()) {
    if (IS_DEV) {
      console.warn('[walkers] ALPHINIUM_API_BASE_URL not set — cannot create walker profile.');
    }
    return null;
  }

  try {
    const created = await walkersRequest('/walkers', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
    return mapApiWalker(created);
  } catch (error) {
    if (IS_DEV) {
      console.warn('[walkers] createWalkerProfile() failed.', error);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Availability & schedule management (EXPO_PUBLIC_WOOF_API_BASE_URL)
// These follow the payments.js throw-on-error pattern since callers need to
// surface failures directly (no silent fallback to static data).
// ---------------------------------------------------------------------------

const WOOF_API_BASE_URL = process.env.EXPO_PUBLIC_WOOF_API_BASE_URL || '';

/**
 * Fetch available time slots for a specific walker on a given date.
 *
 * @param {string} walkerId - The walker's ID.
 * @param {string} date - ISO date string (e.g. '2026-07-04').
 * @param {string} [authToken] - Optional auth token (public endpoint).
 * @returns {Promise<Array<{ time: string, available: boolean }>>} Array of time slot objects.
 * @throws {Error} If the request fails.
 */
export async function getWalkerAvailability(walkerId, date, authToken) {
  const url = `${WOOF_API_BASE_URL}/api/walkers/${walkerId}/availability?date=${encodeURIComponent(date)}`;
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, { method: 'GET', headers });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch walker availability (${response.status})`);
  }

  return response.json();
}

/**
 * Set the walker's weekly recurring schedule.
 *
 * @param {{ mon?: { start: string, end: string }, tue?: { start: string, end: string }, wed?: { start: string, end: string }, thu?: { start: string, end: string }, fri?: { start: string, end: string }, sat?: { start: string, end: string }, sun?: { start: string, end: string } }} schedule - Weekly schedule keyed by day abbreviation with start/end times (24h, e.g. '07:00').
 * @param {string} authToken - Auth token for the authenticated walker.
 * @returns {Promise<object>} The updated schedule as returned by the API.
 * @throws {Error} If the request fails.
 */
export async function setWeeklySchedule(schedule, authToken) {
  const response = await fetch(`${WOOF_API_BASE_URL}/api/walkers/me/schedule`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(schedule),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update weekly schedule (${response.status})`);
  }

  return response.json();
}

/**
 * Block one or more specific dates so the walker is unavailable.
 *
 * @param {string[]} dates - Array of ISO date strings to block (e.g. ['2026-07-04', '2026-07-05']).
 * @param {string} authToken - Auth token for the authenticated walker.
 * @returns {Promise<{ blocked: string[] }>} The list of newly blocked dates as confirmed by the API.
 * @throws {Error} If the request fails.
 */
export async function blockDates(dates, authToken) {
  const response = await fetch(`${WOOF_API_BASE_URL}/api/walkers/me/block`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ dates }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to block dates (${response.status})`);
  }

  return response.json();
}
