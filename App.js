import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { WoofProvider } from './src/store/woofStore';
import { colors } from './src/theme';

export default function App() {
  return (
    <WoofProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
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
