import { Alert, Platform } from 'react-native';
import { pushRegisterToken } from './alphinium';

// expo-notifications is only available on iOS/Android — not on web.
// Dynamic require prevents the web bundle from breaking.
let Notifications = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch {
    // Package not installed in this environment — all handlers become no-ops.
  }
}

/**
 * Request push notification permissions and register the device token with
 * alphinium-push.
 *
 * @returns {Promise<{ permission: string, token: string|null }>}
 */
export async function registerForPushNotifications() {
  if (!Notifications) {
    return { permission: 'unavailable', token: null };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { permission: finalStatus, token: null };
  }

  // Create Android notification channel before fetching the token.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('woof-walks', {
      name: 'WoofWalks',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16A34A',
    });
  }

  let token = null;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    token = tokenData.data;
  } catch {
    // Fails on simulators without push credentials — acceptable in dev.
  }

  if (token) {
    try {
      await pushRegisterToken({ token, platform: Platform.OS });
    } catch {
      // Non-fatal: token registration will be retried on next app start.
    }
  }

  return { permission: finalStatus, token };
}

/**
 * Configure foreground notification behaviour and attach handlers for the
 * three walk push events: walk.started, walk.photo, walk.ended.
 *
 * @param {Function} dispatch - woofStore dispatch function
 * @returns {Function} Cleanup function to pass to useEffect's return
 */
export function setupNotificationHandlers(dispatch) {
  if (!Notifications) return () => {};

  // Show banners even when the app is in the foreground.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Foreground handler — fired while the app is open and visible.
  const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
    const { event, ...data } = notification.request.content.data ?? {};
    handleWalkEvent(event, data, dispatch);
  });

  // Response handler — fired when the user taps a push notification.
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const { event, ...data } = response.notification.request.content.data ?? {};
    handleWalkEvent(event, data, dispatch);
  });

  return () => {
    foregroundSub.remove();
    responseSub.remove();
  };
}

/**
 * Route each alphinium-push walk event to the correct store/UI action.
 *
 * @param {string} event - e.g. 'walk.started', 'walk.photo', 'walk.ended'
 * @param {object} data  - notification payload data
 * @param {Function} dispatch
 */
function handleWalkEvent(event, data, dispatch) {
  const walkerName = data?.walkerName ?? 'Your walker';
  const dogName = data?.dogName ?? 'your dog';

  switch (event) {
    case 'walk.started':
      dispatch({ type: 'START_TRACKING' });
      Alert.alert(
        '🐾 Walk Started!',
        `${walkerName} has picked up ${dogName} and the walk has begun. GPS tracking is now active.`,
        [{ text: 'View Live Walk', onPress: () => dispatch({ type: 'SET_PHASE', payload: 'tracking' }) }],
      );
      break;

    case 'walk.photo':
      // Navigate to TrackingScreen and signal the photo feed to refresh.
      dispatch({ type: 'SET_PHASE', payload: 'tracking' });
      dispatch({ type: 'WALK_PHOTO_RECEIVED', payload: data });
      break;

    case 'walk.ended':
      dispatch({ type: 'SET_PHASE', payload: 'tracking' });
      Alert.alert(
        '✅ Walk Complete!',
        `${dogName}'s walk is finished. Great work by ${walkerName}! Would you like to leave a tip?`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Tip Walker', onPress: () => dispatch({ type: 'SET_PHASE', payload: 'booking' }) },
        ],
      );
      break;

    default:
      if (event) {
        console.warn('[alphinium-push] Unhandled notification event:', event);
      }
  }
}
