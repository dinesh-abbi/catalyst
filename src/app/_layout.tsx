import { Theme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../../global.css';

// Import our centralized theme
import appTheme from '@/theme';

import * as Notifications from 'expo-notifications';
import { requestPermissionsAndSchedule } from '@/utils/notifications';

import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PremiumSplash } from '@/components/PremiumSplash';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthService } from '@/utils/AuthService';
import LoginScreen from './login';
import { ThemedAlert } from '@/components/ThemedAlert';
import { NotificationService } from '@/utils/NotificationService';
import { getMessaging, onMessage, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// Prevent auto-hide so we can control when to hide native splash
SplashScreen.preventAutoHideAsync();

// Register background messaging handler
// This must be outside the component entry point to handle notifications when the app is killed.
const registerBackgroundHandler = async () => {
  try {
    // Check if Firebase is initialized before calling messaging()
    const { getApp } = await import('@react-native-firebase/app');
    try {
      getApp(); // Throws if no app
      setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
        console.log('FCM Background Message:', remoteMessage);
        // Custom background logic here
      });
    } catch (e) {
      console.log('FCM: Waiting for default app initialization...');
    }
  } catch (e) {
    console.error("FCM Background Registration Error:", e);
  }
};

registerBackgroundHandler();

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
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
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

  // Schedule notifications safely
  useEffect(() => {
    try {
      requestPermissionsAndSchedule();
    } catch (e) {
      // Muted: Notification scheduling fallback
    }
  }, []);

  // Handle auth state changes
  useEffect(() => {
    let subscriber: (() => void) | undefined;
    
    const initAuth = async () => {
      await AuthService.waitForInitialization();
      subscriber = AuthService.onAuthStateChanged((user) => {
        setUser(user);
        if (initializing) setInitializing(false);
      });
    };

    initAuth();
    
    return () => {
      if (subscriber) subscriber();
    };
  }, [initializing]);

  // Handle notification deep links safely
  useEffect(() => {
    let subscription: Notifications.Subscription | undefined;
    try {
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.url as string | undefined;
        if (url) {
          const path = url.replace('catalyst://', '');
          if (path === 'wake' || path === 'go' || path === 'complete') {
            router.push(`/${path}` as any);
          } else if (path === 'water') {
            router.push(`/?tab=water` as any);
          }
        }
      });
    } catch (e) {
        // Muted: Notification listener fallback
    }
    return () => {
      if (subscription) subscription.remove();
    };
  }, [router]);

  // Initialize Firebase Cloud Messaging & Notifee
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initNotifications = async () => {
      await AuthService.waitForInitialization();
      
      await NotificationService.requestPermissions();
      await NotificationService.createChannels();
      await NotificationService.getFcmToken();
      
      // Foreground listener
      unsubscribe = onMessage(getMessaging(), async remoteMessage => {
        console.log('FCM Foreground Message:', remoteMessage);
        if (remoteMessage.notification) {
          await NotificationService.displayNotification(
            remoteMessage.notification.title || 'CATALYST NOTICE',
            remoteMessage.notification.body || '',
            remoteMessage.data
          );
        }
      });
    };
    
    initNotifications();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (!fontsLoaded || initializing) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={NativeTheme}>
        {!isSplashComplete && <PremiumSplash onComplete={() => setIsSplashComplete(true)} />}

        <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(1000).delay(200)}>
          {!user ? (
            <LoginScreen />
          ) : (
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="wake" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="go" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="chat" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="expenses" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="edit-expense" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
            </Stack>
          )}
        </Animated.View>
        <StatusBar style="light" />
        <ThemedAlert />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

