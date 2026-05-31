import { Alert, Platform } from 'react-native';

// expo-notifications is not available on web; guard all imports.
let Notifications = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch {
    // expo-notifications not installed — no-op in this environment
  }
}

// alphinium-push client (wired up in task #5 — may not exist yet)
let alphiniumClient = null;
try {
  alphiniumClient = require('./alphinium').default;
} catch {
  // alphinium SDK not yet configured (task #5 dependency)
}

/**
 * Request push notification permissions and register the device token
 * with alphinium-push.
 *
 * Returns { permission, token } — both may be null on web or if the user
 * denies permission.
 */
export async function registerForPushNotifications() {
  if (!Notifications) {
    return { permission: 'unavailable', token: null };
  }

  // Simulator / physical device check
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { permission: finalStatus, token: null };
  }

  // Retrieve Expo push token
  let token = null;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    token = tokenData.data;
  } catch {
    // Fails on simulators without credentials — acceptable in dev
  }

  // Register token with alphinium-push
  if (token && alphiniumClient) {
    try {
      await alphiniumClient.push.registerDevice({ token, platform: Platform.OS });
    } catch {
      // Non-fatal — token will be retried on next app start
    }
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('woof-walks', {
      name: 'WoofWalks',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });
  }

  return { permission: finalStatus, token };
}

/**
 * Configure foreground notification behaviour and attach handlers for the
 * three walk events: walk.started, walk.photo, walk.ended.
 *
 * @param {object} dispatch  - woofStore dispatch function
 * @param {object} navigation - optional navigation ref for deep-linking
 */
export function setupNotificationHandlers(dispatch, navigation) {
  if (!Notifications) return () => {};

  // Show banners even when the app is foregrounded
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Foreground handler — fired while the app is open
  const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
    const event = notification.request.content.data?.event;
    handleWalkEvent(event, notification.request.content.data, dispatch, navigation);
  });

  // Background / tapped handler — fired when the user taps a push
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const event = response.notification.request.content.data?.event;
    handleWalkEvent(event, response.notification.request.content.data, dispatch, navigation);
  });

  // Return cleanup function for useEffect
  return () => {
    foregroundSub.remove();
    responseSub.remove();
  };
}

/**
 * Route each alphinium-push walk event to the correct UI action.
 */
function handleWalkEvent(event, data, dispatch, navigation) {
  switch (event) {
    case 'walk.started':
      dispatch({ type: 'START_TRACKING' });
      Alert.alert(
        '🐾 Walk Started!',
        `${data?.walkerName || 'Your walker'} has picked up ${data?.dogName || 'your dog'} and the walk has begun.`,
        [{ text: 'View Live Walk', onPress: () => dispatch({ type: 'SET_PHASE', payload: 'tracking' }) }],
      );
      break;

    case 'walk.photo':
      // Navigate to TrackingScreen and signal a photo feed refresh
      dispatch({ type: 'SET_PHASE', payload: 'tracking' });
      dispatch({ type: 'WALK_PHOTO_RECEIVED', payload: data });
      break;

    case 'walk.ended':
      dispatch({ type: 'SET_PHASE', payload: 'tracking' });
      Alert.alert(
        '✅ Walk Complete!',
        `${data?.dogName || 'Your dog'}'s walk is finished. Would you like to leave a tip?`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Tip Walker', onPress: () => dispatch({ type: 'SET_PHASE', payload: 'payment' }) },
        ],
      );
      break;

    default:
      break;
  }
}
