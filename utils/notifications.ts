import notificationMessages from '@/data/notificationMessages.json';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set how notifications should behave when the app is running in the foreground
try {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
} catch (e) {
    // Muted: setNotificationHandler fallback
}

// Channel ID — bump the version suffix if you ever need to change channel settings (sound, vibration, etc.)
// Android caches channels permanently, so the ONLY way to apply new settings is a fresh channel ID.
const CHANNEL_ID = 'catalyst_alerts_v6';

export async function requestPermissionsAndSchedule(force = false) {
    if (Platform.OS === 'android') {
        // Delete any old cached channels so Android doesn't ignore our new sound setting
        try {
            await Notifications.deleteNotificationChannelAsync('water_reminder_channel');
            await Notifications.deleteNotificationChannelAsync('catalyst_alerts_v2');
            await Notifications.deleteNotificationChannelAsync('catalyst_alerts_v3');
            await Notifications.deleteNotificationChannelAsync('catalyst_alerts_v4');
        } catch (_) { /* channels may not exist, that's fine */ }

        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Catalyst Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#CCFF00',
            sound: 'appsound.wav', // App brand sound — res/raw/appsound.wav
            audioAttributes: {
                usage: 5,       // NOTIFICATION (expo enum)
                contentType: 4, // SONIFICATION (expo enum)
            },
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
            // Muted: getPermissionsAsync fallback
            return;
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
        // Muted: Permission error fallback (Expected in some Expo Go scenarios)
        return;
    }

    // Check if we already have notifications scheduled before fiercely cancelling and rebuilding them
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    // If we have more than 10 alarms, they are already correctly set up, so we leave them alone
    // to prevent continuous cancellation from ruining the OS delivery schedule.
    if (scheduled.length > 10 && !force) {
        return;
    }

    // Otherwise, clear any existing and rebuild the schedule properly
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule the 3x daily motivational alarms (skipping Sunday)
    await scheduleWorkoutNotifications();

    // Schedule daily water reminders
    await scheduleWaterReminders();

    // Schedule daily meal reminders
    await scheduleMealReminders();

    // Schedule daily grocery reminders
    await scheduleGroceryReminders();
}

async function scheduleMealReminders() {
    const mealTimes = [
        { name: 'Breakfast', hour: 8, minute: 30 },
        { name: 'Lunch', hour: 13, minute: 30 },
        { name: 'Snack', hour: 17, minute: 30 },
        { name: 'Dinner', hour: 20, minute: 30 },
    ];

    for (const meal of mealTimes) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `${meal.name} Time! 🍽️`,
                body: `Check your meal plan for today's ${meal.name.toLowerCase()}.`,
                sound: 'appsound.wav',
                data: { url: 'catalyst://nutrition' },
                ...(Platform.OS === 'android' && { icon: 'notification_icon', channelId: CHANNEL_ID }),
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: meal.hour,
                minute: meal.minute,
                repeats: true
            } as Notifications.DailyTriggerInput,
        });
    }
}

async function scheduleGroceryReminders() {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Shopping Checklist 🛒",
            body: "Check your grocery list! It's updated for today's requirements.",
            sound: 'appsound.wav',
            data: { url: 'catalyst://nutrition?tab=shopping' },
            ...(Platform.OS === 'android' && { icon: 'notification_icon', channelId: CHANNEL_ID }),
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 7,
            minute: 30,
            repeats: true
        } as Notifications.DailyTriggerInput,
    });
}

async function scheduleWorkoutNotifications() {
    // In Expo Notification Triggers: Sunday=1, Monday=2, Tuesday=3, ... Saturday=7
    const activeDays = [2, 3, 4, 5, 6, 7]; // Monday to Saturday

    // Attempt to get the schedule offset from the store if possible, otherwise default to 0
    let scheduleOffset = 0;
    try {
        const { useWorkoutStore } = require('@/store/useWorkoutStore');
        scheduleOffset = useWorkoutStore.getState().scheduleOffset;
    } catch (e) {
        // Fallback to 0 if store isn't available
    }

    for (const weekday of activeDays) {
        // Calculate which workout day assigned to this physical weekday
        const jsDayIndex = weekday - 1;
        const m = jsDayIndex === 0 ? 7 : jsDayIndex; // 1=Mon ... 7=Sun
        const d = ((m - 1 + scheduleOffset) % 7 + 7) % 7 + 1;

        // Map workout day back to message key (1=Sun, 2=Mon... 7=Sat)
        const dayKey = (d === 7 ? "1" : (d + 1).toString()) as keyof typeof notificationMessages;
        const msg = notificationMessages[dayKey];

        if (msg) {
            // 6:00 AM Notification (Wake)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: msg.wake.title,
                    body: msg.wake.body,
                    sound: 'appsound.wav',
                    data: { url: 'catalyst://wake' },
                    ...(Platform.OS === 'android' && { icon: 'notification_icon', channelId: CHANNEL_ID }),
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
                    sound: 'appsound.wav',
                    data: { url: 'catalyst://go' },
                    ...(Platform.OS === 'android' && { icon: 'notification_icon', channelId: CHANNEL_ID }),
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

    let scheduleOffset = 0;
    try {
        const { useWorkoutStore } = require('@/store/useWorkoutStore');
        scheduleOffset = useWorkoutStore.getState().scheduleOffset;
    } catch (e) {
        // fallback
    }

    // Calculate which workout day is today
    const jsDayIndex = expoWeekday - 1;
    const m = jsDayIndex === 0 ? 7 : jsDayIndex;
    const d = ((m - 1 + scheduleOffset) % 7 + 7) % 7 + 1;

    // Map workout day to message key
    const dayKey = (d === 7 ? "1" : (d + 1).toString()) as keyof typeof notificationMessages;
    const msg = notificationMessages[dayKey];

    if (msg) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: msg.complete.title,
                body: msg.complete.body,
                sound: 'appsound.wav',
                data: { url: 'catalyst://complete' },
                ...(Platform.OS === 'android' && { icon: 'notification_icon', channelId: CHANNEL_ID }),
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 1,
            },
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
                sound: 'appsound.wav',
                data: { url: 'catalyst://water' }, // Deep link to the new water tab/screen
                ...(Platform.OS === 'android' && { icon: 'notification_icon', channelId: CHANNEL_ID }),
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

