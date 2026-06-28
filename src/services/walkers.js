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
