import { ThemeProvider, Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../../global.css';

// Import our centralized theme
import appTheme from '../theme';

const NativeTheme: Theme = {
  dark: true,
  colors: {
    primary: appTheme.colors.accent,
    background: appTheme.colors.backgroundMain,
    card: appTheme.colors.backgroundCard,
    text: appTheme.colors.textPrimary,
    border: appTheme.colors.backgroundCard,
    notification: appTheme.colors.accent,
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700',
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '900',
    },
  },
};

import { useEffect } from 'react';
import { requestPermissionsAndSchedule } from '../utils/notifications';

export default function RootLayout() {
  useEffect(() => {
    // Request permission and schedule the local motivational push notifications
    requestPermissionsAndSchedule();
  }, []);
  return (
    <ThemeProvider value={NativeTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
