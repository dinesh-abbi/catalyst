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
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { PremiumSplash } from '@/components/PremiumSplash';
import { BiometricLock } from '@/components/BiometricLock';
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
  const [isLocked, setIsLocked] = useState(false);
  const backgroundedAtRef = useRef<number | null>(null);
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
      subscriber = AuthService.onAuthStateChanged(async (user) => {
        setUser(user);
        
        if (user) {
          // If a user is active, check if Biometric Shield is enabled
          const enabled = await AsyncStorage.getItem('biometrics_enabled');
          if (enabled === 'true') {
            setIsLocked(true);
          } else {
            setIsLocked(false);
          }
        } else {
          setIsLocked(false);
        }

        if (initializing) setInitializing(false);
      });
    };

    initAuth();
    
    return () => {
      if (subscriber) subscriber();
    };
  }, [initializing]);

  // AppState Listener — only re-lock if app was in background > 5 minutes
  const LOCK_GRACE_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Record the exact moment the app was minimized
        backgroundedAtRef.current = Date.now();
      } else if (nextAppState === 'active' && user) {
        const enabled = await AsyncStorage.getItem('biometrics_enabled');
        if (enabled === 'true') {
          const backgroundedAt = backgroundedAtRef.current;
          const elapsed = backgroundedAt ? Date.now() - backgroundedAt : Infinity;
          // Only lock if away for longer than the grace period
          if (elapsed > LOCK_GRACE_MS) {
            setIsLocked(true);
          }
          backgroundedAtRef.current = null;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [user]);

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

  const AppContent = () => {
    const ty = useSharedValue(28);
    const op = useSharedValue(0);

    useEffect(() => {
      ty.value = withSpring(0, { damping: 22, stiffness: 160, mass: 0.8 });
      op.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) });
    }, []);

    const enterStyle = useAnimatedStyle(() => ({
      flex: 1,
      transform: [{ translateY: ty.value }],
      opacity: op.value,
    }));

    return (
      <Animated.View style={enterStyle}>
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
    );
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={NativeTheme}>
        {!isSplashComplete && <PremiumSplash onComplete={() => setIsSplashComplete(true)} />}
        {isSplashComplete && isLocked && user && (
          <BiometricLock onSuccess={() => setIsLocked(false)} />
        )}

        <AppContent />
        <StatusBar style="light" />
        <ThemedAlert />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

