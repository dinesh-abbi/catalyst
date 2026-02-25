import { Theme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../../global.css';

// Import our centralized theme
import appTheme from '../theme';

import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { requestPermissionsAndSchedule } from '../utils/notifications';

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

export default function RootLayout() {
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const router = useRouter();

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data.url &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const url = lastNotificationResponse.notification.request.content.data.url as string;
      // Extract the path from catalyst://path
      const path = url.replace('catalyst://', '');
      if (path === 'wake' || path === 'go' || path === 'complete') {
        router.push(`/${path}` as any);
      } else if (path === 'water') {
        router.push(`/?tab=water` as any);
      }
    }
  }, [lastNotificationResponse, router]);

  useEffect(() => {
    // Request permission and schedule the local motivational push notifications
    requestPermissionsAndSchedule();
  }, []);
  return (
    <ThemeProvider value={NativeTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="wake" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="go" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="complete" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
