import { Theme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../../global.css';

// Import our centralized theme
import appTheme from '../theme';

// Notifications are disabled temporarily due to SDK 53 native module linking issues
// import * as Notifications from 'expo-notifications';
// import { requestPermissionsAndSchedule } from '../utils/notifications';

import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PremiumSplash } from '../components/PremiumSplash';

// Prevent auto-hide so we can control when to hide native splash
SplashScreen.preventAutoHideAsync();

const NativeTheme: Theme = {
  dark: true,
  colors: {
    primary: appTheme.colors.accent,
    background: appTheme.colors.backgroundMain,
    card: appTheme.colors.backgroundCard,
    text: appTheme.colors.textPrimary,
    border: appTheme.colors.border,
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
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Notifications logic temporarily disabled to prevent SDK 53 freezing
  /*
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data.url &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const url = lastNotificationResponse.notification.request.content.data.url as string;
      const path = url.replace('catalyst://', '');
      if (path === 'wake' || path === 'go' || path === 'complete') {
        router.push(`/${path}` as any);
      } else if (path === 'water') {
        router.push(`/?tab=water` as any);
      }
    }
  }, [lastNotificationResponse, router]);

  useEffect(() => {
    requestPermissionsAndSchedule();
  }, []);
  */

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={NativeTheme}>
      {!isSplashComplete && <PremiumSplash onComplete={() => setIsSplashComplete(true)} />}

      <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(1000).delay(200)}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="wake" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="go" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="complete" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
        </Stack>
      </Animated.View>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
