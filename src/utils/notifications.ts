import notificationMessages from '@/data/notificationMessages.json';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set how notifications should behave when the app is running in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
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

    // Attempt to request local notification permissions safely
    try {
        if (Platform.OS === 'web') return;

        // Try getting existing status first
        let finalStatus = '';
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            finalStatus = existingStatus;
        } catch (innerError) {
            console.warn('[notifications.ts] getPermissionsAsync failed. Bypassing safely.', innerError);
            return; // Exit safely for Expo Go
        }

        if (finalStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Permission not granted for local notifications.');
            return;
        }
    } catch (e) {
        // Expo Go sometimes throws an error here on SDK 53 due to lacking remote push support.
        // We catch it so the app doesn't crash, since we are only doing LOCAL scheduling.
        console.warn('Unhandled notification permission error bypassed.', e);
        return; // Don't crash but don't attempt to schedule
    }

    // Check if we already have notifications scheduled before fiercely cancelling and rebuilding them
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    // If we have more than 10 alarms, they are already correctly set up, so we leave them alone
    // to prevent continuous cancellation from ruining the OS delivery schedule.
    if (scheduled.length > 10) {
        return;
    }

    // Otherwise, clear any existing and rebuild the schedule properly
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule the 3x daily motivational alarms (skipping Sunday)
    await scheduleWorkoutNotifications();

    // Schedule daily water reminders
    await scheduleWaterReminders();
}

async function scheduleWorkoutNotifications() {
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
                    data: { url: 'catalyst://wake' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                    weekday: weekday,
                    hour: 6,
                    minute: 0,
                    // Critical for preventing the OS from destroying the timer after 1 run
                    repeats: true
                } as Notifications.WeeklyTriggerInput,
            });

            // 7:00 AM Notification (Go)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: msg.go.title,
                    body: msg.go.body,
                    sound: 'default',
                    data: { url: 'catalyst://go' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                    weekday: weekday,
                    hour: 7,
                    minute: 0,
                    repeats: true
                } as Notifications.WeeklyTriggerInput,
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
                data: { url: 'catalyst://complete' },
            },
            trigger: null, // trigger immediately
        });
    }
}

async function scheduleWaterReminders() {
    // We want daily reminders every hour from 8 to 22
    const waterHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

    for (const hour of waterHours) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Hydration Check 💧",
                body: "Time to drink some water! Let's hit that 2.5L daily goal.",
                sound: 'default',
                data: { url: 'catalyst://water' }, // Deep link to the new water tab/screen
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: hour,
                minute: 0,
                repeats: true
            } as Notifications.DailyTriggerInput,
        });
    }
}
