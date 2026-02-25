import appTheme from '@/theme';
import { getTodayWorkout } from '@/utils/getTodayWorkout';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GoScreen() {
    const router = useRouter();
    const todayWorkout = useMemo(() => getTodayWorkout(), []);

    const handleDismiss = () => {
        router.replace('/');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Feather name="activity" size={64} color={appTheme.colors.accent} />
                </View>

                <Text style={styles.title}>Ignite the Catalyst</Text>

                <View style={styles.workoutBox}>
                    <Text style={styles.workoutLabel}>Today&apos;s Focus</Text>
                    <Text style={styles.workoutTitle}>{todayWorkout.title}</Text>
                </View>

                <Text style={styles.subtitle}>
                    It&apos;s time to put in the work. Get stretched, get focused, and let&apos;s crush today&apos;s session.
                </Text>

                <TouchableOpacity style={styles.button} onPress={handleDismiss} activeOpacity={0.8}>
                    <Text style={styles.buttonText}>Start Workout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appTheme.colors.backgroundMain,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: appTheme.colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: appTheme.colors.textPrimary,
        marginBottom: 24,
        textAlign: 'center',
    },
    workoutBox: {
        backgroundColor: appTheme.colors.backgroundCard,
        padding: 20,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: appTheme.colors.accent + '40',
    },
    workoutLabel: {
        fontSize: 14,
        color: appTheme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    workoutTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: appTheme.colors.accent,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: appTheme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 48,
    },
    button: {
        backgroundColor: appTheme.colors.accent,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        shadowColor: appTheme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
