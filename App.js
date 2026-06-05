import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotifications, setupNotificationHandlers } from './src/services/notifications';
import { WoofProvider, useWoof } from './src/store/woofStore';
import { colors } from './src/theme';

/**
 * Mounts inside WoofProvider so it can dispatch to the store.
 * Requests push permissions on first render and wires up notification handlers.
 */
function NotificationBootstrap() {
  const { dispatch } = useWoof();

  useEffect(() => {
    async function init() {
      const { permission, token } = await registerForPushNotifications();
      dispatch({ type: 'SET_NOTIFICATION_PERMISSION', payload: permission });
      if (token) dispatch({ type: 'SET_DEVICE_TOKEN', payload: token });
    }
    init();

    const cleanup = setupNotificationHandlers(dispatch);
    return cleanup;
  }, [dispatch]);

  return null;
}

export default function App() {
  return (
    <WoofProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <NotificationBootstrap />
        <AppNavigator />
      </View>
    </WoofProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
