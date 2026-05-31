/**
 * payments.js — alphinium-payments integration
 *
 * PCI compliance: raw card numbers are NEVER stored in JS state or logged.
 * The card input collects data locally, tokenises it via this service,
 * and only the returned token/reference is kept in store state.
 */

const PAYMENTS_BASE_URL = 'https://api.alphinium.dev/payments/v1';

/**
 * Tokenise card details on-device before any state is touched.
 * Returns a short-lived card token safe to pass to checkout().
 *
 * @param {{ number: string, expiry: string, cvv: string }} cardDetails
 * @returns {Promise<{ cardToken: string, last4: string, brand: string }>}
 */
export async function tokeniseCard({ number, expiry, cvv }) {
  // Strip spaces/dashes for transmission — never stored in app state
  const sanitised = {
    number: number.replace(/\s|-/g, ''),
    expiry,
    cvv,
  };

  const response = await fetch(`${PAYMENTS_BASE_URL}/tokenise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitised),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Tokenise failed (${response.status})`);
  }

  const data = await response.json();
  // Return only safe data — raw card details never leave this function
  return {
    cardToken: data.token,
    last4: data.last4,
    brand: data.brand, // e.g. 'Visa', 'Mastercard'
  };
}

/**
 * Submit a booking checkout via alphinium-payments.
 *
 * @param {{
 *   bookingDetails: object,
 *   amountCents: number,
 *   cardToken?: string,       // from tokeniseCard() — use for new cards
 *   savedCardId?: string,     // use for one-tap rebook with saved card
 *   tipCents?: number,
 * }} params
 * @returns {Promise<{
 *   bookingReference: string,
 *   amountCents: number,
 *   currency: string,
 *   walkerName: string,
 *   date: string,
 *   invoiceUrl: string,
 *   savedCardId: string,      // ID of the card saved for future use
 *   last4: string,
 *   brand: string,
 * }>}
 */
export async function checkout({ bookingDetails, amountCents, cardToken, savedCardId, tipCents = 0 }) {
  if (!cardToken && !savedCardId) {
    throw new Error('Either cardToken or savedCardId must be provided');
  }

  const response = await fetch(`${PAYMENTS_BASE_URL}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      booking: bookingDetails,
      amount_cents: amountCents,
      tip_cents: tipCents,
      ...(cardToken ? { card_token: cardToken } : { saved_card_id: savedCardId }),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Checkout failed (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch saved cards for the current user.
 * Returns masked card data only — no raw numbers.
 *
 * @returns {Promise<Array<{ id: string, last4: string, brand: string, expiry: string }>>}
 */
export async function getSavedCards() {
  const response = await fetch(`${PAYMENTS_BASE_URL}/saved-cards`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch saved cards (${response.status})`);
  }

  return response.json(); // [{ id, last4, brand, expiry }]
}

/**
 * Submit a tip after walk completion.
 *
 * @param {{ bookingReference: string, tipCents: number }} params
 * @returns {Promise<{ success: boolean, totalCents: number }>}
 */
export async function submitTip({ bookingReference, tipCents }) {
  const response = await fetch(`${PAYMENTS_BASE_URL}/tip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_reference: bookingReference, tip_cents: tipCents }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Tip submission failed (${response.status})`);
  }

  return response.json();
}

/**
 * Request a refund for a cancelled booking.
 *
 * @param {{ bookingReference: string, reason?: string }} params
 * @returns {Promise<{ refundReference: string, amountCents: number, estimatedDays: number }>}
 */
export async function refund({ bookingReference, reason = 'user_cancelled' }) {
  const response = await fetch(`${PAYMENTS_BASE_URL}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_reference: bookingReference, reason }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Refund failed (${response.status})`);
  }

  return response.json();
}

/**
 * Trigger walker payout after a completed walk.
 *
 * This is called by the platform backend once walk completion is confirmed
 * (e.g. via alphinium-push walk-ended event). Stubbed here to document
 * the client-side trigger point — in production this fires server-side.
 *
 * @param {{ bookingReference: string, walkerId: string }} params
 * @returns {Promise<{ payoutReference: string, amountCents: number }>}
 */
export async function triggerWalkerPayout({ bookingReference, walkerId }) {
  const response = await fetch(`${PAYMENTS_BASE_URL}/payout/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_reference: bookingReference, walker_id: walkerId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Payout trigger failed (${response.status})`);
  }

  return response.json();
}
