import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';

export const NotificationService = {
    /**
     * Request notification permissions for Android and iOS
     */
    requestPermissions: async () => {
        try {
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
                console.log('Android 13+ notification permission:', granted);
            }

            const authStatus = await messaging().requestPermission();
            const enabled = 
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('FCM Authorization status:', authStatus);
            }
        } catch (error) {
            console.error('Permission request error:', error);
        }
    },

    /**
     * Create Android Notification Channels
     */
    createChannels: async () => {
        try {
            await notifee.createChannel({
                id: 'workout_reminders',
                name: 'Workout Reminders',
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                sound: 'catalyst_alert', // References catalyst_alert.wav in res/raw
            });
            console.log('Notification channels created successfully.');
        } catch (error) {
            console.error('Channel creation error:', error);
        }
    },

    /**
     * Generate and log the FCM Token
     */
    getFcmToken: async () => {
        try {
            const token = await messaging().getToken();
            console.log('--- FCM_TOKEN ---');
            console.log(token);
            console.log('-----------------');
            return token;
        } catch (error) {
            console.error('FCM Token generation error:', error);
            return null;
        }
    },

    /**
     * Display a local notification using Notifee
     */
    displayNotification: async (title: string, body: string, data?: any) => {
        try {
            await notifee.displayNotification({
                title: title,
                body: body,
                data: data,
                android: {
                    channelId: 'workout_reminders',
                    largeIcon: 'ic_launcher',
                    pressAction: {
                        id: 'default',
                    },
                },
            });
        } catch (error) {
            console.error('Display notification error:', error);
        }
    }
};
