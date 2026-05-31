// alphinium-payments integration stub
// Replace the body of processPayment with the real alphinium-payments SDK when going live.

/**
 * Process a payment for a booking.
 * @param {object} booking - The booking data from woofStore.
 * @returns {Promise<{status: 'paid'|'failed', transactionId: string}>}
 */
export function processPayment(booking) {
  return Promise.resolve({
    status: 'paid',
    transactionId: `txn_${Date.now()}`,
  });
}
