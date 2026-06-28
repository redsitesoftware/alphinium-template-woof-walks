/**
 * dogs.js — Dog profiles service
 *
 * API client for the WoofWalks dog profile endpoints.
 * Mirrors the fetch/error-handling pattern in payments.js.
 *
 * Endpoints:
 *   POST /api/dogs     — create a dog profile (authenticated)
 *   GET  /api/dogs/me  — fetch the authenticated owner's dogs
 */

const WOOF_API_BASE_URL = process.env.EXPO_PUBLIC_WOOF_API_BASE_URL || '';

/**
 * Create a new dog profile for the authenticated owner.
 *
 * @param {{
 *   name: string,
 *   breed: string,
 *   age?: number,
 *   weight_kg?: number,
 *   temperament?: 'calm' | 'energetic' | 'anxious',
 *   on_leash_only?: boolean,
 *   vaccination_expiry?: string,
 *   vet_name?: string,
 *   vet_phone?: string,
 *   emergency_contact?: string,
 *   allergies?: string,
 *   photo?: string | null,
 * }} dogData
 * @param {string} authToken - Bearer token (required)
 * @returns {Promise<{
 *   id: string,
 *   name: string,
 *   breed: string,
 *   age: number,
 *   weight_kg: number,
 *   temperament: string,
 *   on_leash_only: boolean,
 *   vaccination_expiry: string,
 *   vet_name: string,
 *   vet_phone: string,
 *   emergency_contact: string,
 *   allergies: string,
 *   photo: string | null,
 * }>}
 */
export async function createDog(dogData, authToken) {
  if (!authToken) {
    throw new Error('createDog requires an auth token');
  }

  const response = await fetch(`${WOOF_API_BASE_URL}/api/dogs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(dogData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Create dog failed (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch the authenticated owner's dog profiles.
 *
 * @param {string} authToken - Bearer token
 * @returns {Promise<Array<{
 *   id: string,
 *   name: string,
 *   breed: string,
 *   age: number,
 *   weight_kg: number,
 *   temperament: string,
 *   on_leash_only: boolean,
 *   vaccination_expiry: string,
 *   vet_name: string,
 *   vet_phone: string,
 *   emergency_contact: string,
 *   allergies: string,
 *   photo: string | null,
 * }>>}
 */
export async function getMyDogs(authToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${WOOF_API_BASE_URL}/api/dogs/me`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch dogs (${response.status})`);
  }

  return response.json();
}
