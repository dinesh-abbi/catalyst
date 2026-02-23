import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import notificationMessages from '@/data/notificationMessages.json';

// Set how notifications should behave when the app is running in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function requestPermissionsAndSchedule() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#e63946',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return;
    }

    // Schedule the 3x daily motivational alarms (skipping Sunday)
    await scheduleWorkoutNotifications();
}

async function scheduleWorkoutNotifications() {
    // Clear any existing notifications to avoid duplicate stacking across app opens
    await Notifications.cancelAllScheduledNotificationsAsync();

    // In Expo Notification Triggers: Sunday=1, Monday=2, Tuesday=3, ... Saturday=7
    const activeDays = [2, 3, 4, 5, 6, 7]; // Monday to Saturday

    for (const weekday of activeDays) {
        const dayKey = weekday.toString() as keyof typeof notificationMessages;
        const msg = notificationMessages[dayKey];

        if (msg) {
            // 6:00 AM Notification (Wake)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: msg.wake.title,
                    body: msg.wake.body,
                    sound: 'default',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                    weekday: weekday,
                    hour: 6,
                    minute: 0,
                },
            });

            // 7:00 AM Notification (Go)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: msg.go.title,
                    body: msg.go.body,
                    sound: 'default',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                    weekday: weekday,
                    hour: 7,
                    minute: 0,
                },
            });
        }
    }
}

export async function triggerWorkoutCompleteNotification() {
    // JS getDay is 0 (Sunday) to 6 (Saturday). Expo Weekday is 1 (Sunday) to 7 (Saturday).
    const expoWeekday = new Date().getDay() + 1;
    const dayKey = expoWeekday.toString() as keyof typeof notificationMessages;
    const msg = notificationMessages[dayKey];

    if (msg) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: msg.complete.title,
                body: msg.complete.body,
                sound: 'default',
            },
            trigger: null, // trigger immediately
        });
    }
}
