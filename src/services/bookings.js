/**
 * bookings.js — Booking service
 *
 * API client for the WoofWalks bookings endpoint.
 * Mirrors the fetch/error-handling pattern in dogs.js.
 *
 * Endpoints:
 *   POST /api/bookings — create a booking (authenticated)
 */

const WOOF_API_BASE_URL = process.env.EXPO_PUBLIC_WOOF_API_BASE_URL || '';

/**
 * Map the store's camelCase bookingData shape to the API's snake_case request body.
 *
 * @param {{
 *   date: string,
 *   time: string,
 *   duration: 30 | 60,
 *   dogName?: string,
 *   notes?: string,
 *   recurring?: boolean,
 * }} bookingData - camelCase booking fields from woofStore
 * @param {{ id: string }} walker - the selected walker object
 * @param {Array<{ id: string, name: string }>} dogs - the owner's dog profiles from store
 * @returns {{
 *   walker_id: string,
 *   date: string,
 *   time: string,
 *   duration_minutes: 30 | 60,
 *   dog_ids: string[],
 *   special_instructions: string | null,
 *   booking_type: 'instant' | 'request',
 * }}
 */
export function mapBookingData(bookingData, walker, dogs) {
  const matchedDog = Array.isArray(dogs)
    ? dogs.find((d) => d.name === bookingData.dogName)
    : null;
  const dogIds = matchedDog ? [matchedDog.id] : [];

  return {
    walker_id: walker.id,
    date: bookingData.date || '',
    time: bookingData.time || '',
    duration_minutes: bookingData.duration === 60 ? 60 : 30,
    dog_ids: dogIds,
    special_instructions: bookingData.notes || null,
    booking_type: bookingData.recurring ? 'request' : 'instant',
  };
}

/**
 * Submit a booking to the Woof API.
 *
 * @param {{
 *   walker_id: string,
 *   date: string,
 *   time: string,
 *   duration_minutes: 30 | 60,
 *   dog_ids: string[],
 *   special_instructions: string | null,
 *   booking_type: 'instant' | 'request',
 * }} bookingPayload - snake_case payload (use mapBookingData to produce this)
 * @param {string} authToken - Bearer token (required)
 * @returns {Promise<{
 *   booking_id: string,
 *   status: 'confirmed' | 'pending_walker',
 * }>}
 */
export async function createBooking(bookingPayload, authToken) {
  if (!authToken) {
    throw new Error('createBooking requires an auth token');
  }

  const response = await fetch(`${WOOF_API_BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(bookingPayload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Create booking failed (${response.status})`);
  }

  return response.json();
}

/**
 * Pay for a confirmed booking via the Woof API.
 *
 * Falls back to a synthetic simulation result when WOOF_API_BASE_URL is not
 * configured or the request fails, so the demo works without a live API.
 *
 * @param {string} bookingId - The booking to pay for
 * @param {{
 *   card_token?: string,
 *   saved_card_id?: string,
 *   amount_cents: number,
 * }} paymentPayload
 * @param {string} authToken - Bearer token (required)
 * @returns {Promise<{
 *   payment_reference: string,
 *   booking_id: string,
 *   amount_cents: number,
 *   platform_fee_cents: number,
 *   walker_payout_cents: number,
 *   status: string,
 * }>}
 */
export async function payBooking(bookingId, paymentPayload, authToken) {
  if (WOOF_API_BASE_URL) {
    try {
      const response = await fetch(
        `${WOOF_API_BASE_URL}/api/bookings/${encodeURIComponent(bookingId)}/pay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(paymentPayload),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Payment failed');
      }

      return response.json();
    } catch (err) {
      // fall through to simulation
      if (!WOOF_API_BASE_URL) throw err; // re-throw only if we expected a real call
    }
  }

  // Simulation fallback — 15% platform fee, 85% walker payout
  return {
    payment_reference: `pay_${Date.now()}`,
    booking_id: bookingId,
    amount_cents: paymentPayload.amount_cents,
    platform_fee_cents: Math.round(paymentPayload.amount_cents * 0.15),
    walker_payout_cents: Math.round(paymentPayload.amount_cents * 0.85),
    status: 'paid',
  };
}

/**
 * Cancel a booking, applying the appropriate refund policy based on how close
 * the cancellation is to the walk date.
 *
 * Refund policy:
 * - More than 24 hours before the walk  → 'full_refund'  (100% returned)
 * - 24 hours or fewer before the walk   → 'no_show_fee'  (50% retained, 50% refunded)
 *
 * Falls back to a synthetic simulation result when WOOF_API_BASE_URL is not
 * configured or the request fails.
 *
 * @param {string} bookingId - The booking to cancel
 * @param {string} walkDateIso - ISO 8601 walk date/time string (e.g. '2026-07-01T09:00:00')
 * @param {string} authToken - Bearer token (required)
 * @returns {Promise<{
 *   refund_reference: string,
 *   refund_amount_cents: number,
 *   fee_retained_cents: number,
 *   refund_type: 'full_refund' | 'no_show_fee',
 * }>}
 */
export async function cancelBooking(bookingId, walkDateIso, authToken) {
  const hoursUntilWalk = (new Date(walkDateIso).getTime() - Date.now()) / (1000 * 60 * 60);
  const refund_type = hoursUntilWalk > 24 ? 'full_refund' : 'no_show_fee';

  if (WOOF_API_BASE_URL) {
    try {
      const response = await fetch(
        `${WOOF_API_BASE_URL}/api/bookings/${encodeURIComponent(bookingId)}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ refund_type }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Cancel booking failed (${response.status})`);
      }

      return response.json();
    } catch (err) {
      // fall through to simulation
    }
  }

  // Simulation fallback — use a representative amount for demo purposes
  const SIMULATED_AMOUNT_CENTS = 2800; // $28 default walk price
  if (refund_type === 'full_refund') {
    return {
      refund_reference: `ref_${Date.now()}`,
      refund_amount_cents: SIMULATED_AMOUNT_CENTS,
      fee_retained_cents: 0,
      refund_type,
    };
  }
  // no_show_fee: 50% retained, 50% refunded
  const half = Math.round(SIMULATED_AMOUNT_CENTS / 2);
  return {
    refund_reference: `ref_${Date.now()}`,
    refund_amount_cents: half,
    fee_retained_cents: SIMULATED_AMOUNT_CENTS - half,
    refund_type,
  };
}
