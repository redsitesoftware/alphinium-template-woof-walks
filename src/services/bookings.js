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
