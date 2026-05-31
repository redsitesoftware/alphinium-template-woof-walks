/**
 * alphinium-push stub for WoofWalks.
 * Logs notification events to console and returns a resolved Promise.
 * Ready to swap for the real alphinium-push SDK in issue #12.
 */

const NOTIFICATION_TYPES = {
  WALK_STARTED: 'walk_started',
  PHOTO_UPDATE: 'photo_update',
  WALK_ENDED: 'walk_ended',
};

const NOTIFICATION_MESSAGES = {
  [NOTIFICATION_TYPES.WALK_STARTED]: (walkerName) => ({
    title: '🐾 Walk Started!',
    body: `${walkerName} has started Buddy's walk. GPS tracking is active.`,
  }),
  [NOTIFICATION_TYPES.PHOTO_UPDATE]: (walkerName) => ({
    title: '📸 Photo Update',
    body: `${walkerName} sent a photo update from the walk!`,
  }),
  [NOTIFICATION_TYPES.WALK_ENDED]: (walkerName) => ({
    title: '🏠 Walk Complete!',
    body: `${walkerName} has finished Buddy's walk. Great work!`,
  }),
};

/**
 * Schedule a push notification for a walk event.
 * @param {'walk_started'|'photo_update'|'walk_ended'} type - Notification event type.
 * @param {string} walkerName - The walker's display name.
 * @returns {Promise<void>}
 */
export async function scheduleWalkNotification(type, walkerName) {
  const messageBuilder = NOTIFICATION_MESSAGES[type];
  if (!messageBuilder) {
    console.warn('[alphinium-push] Unknown notification type:', type);
    return Promise.resolve();
  }

  const { title, body } = messageBuilder(walkerName);
  console.log(`[alphinium-push] scheduleWalkNotification → type=${type}`, { title, body });

  // TODO (issue #12): Replace with real alphinium-push SDK call, e.g.:
  // await AlphiniumPush.schedule({ type, title, body, walkerName });

  return Promise.resolve();
}

export { NOTIFICATION_TYPES };
