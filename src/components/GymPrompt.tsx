import { useWorkoutStore } from '@/store/useWorkoutStore';
import appTheme from '@/theme';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function GymPrompt() {
    const {
        gymMorningPromptStatus,
        gymEveningPromptStatus,
        setGymMorningPromptStatus,
        setGymEveningPromptStatus,
        scheduleOffset,
        setScheduleOffset
    } = useWorkoutStore();

    const [promptType, setPromptType] = useState<'morning' | 'evening' | null>(null);

    useEffect(() => {
        const hour = new Date().getHours();
        // Morning prompt: 5 AM to 11 AM (11:59)
        if (hour >= 5 && hour < 12 && gymMorningPromptStatus === 'none') {
            setPromptType('morning');
        }
        // Evening prompt: 5 PM to 11 PM
        else if (hour >= 17 && hour < 24 && gymEveningPromptStatus === 'none') {
            setPromptType('evening');
        } else {
            setPromptType(null);
        }
    }, [gymMorningPromptStatus, gymEveningPromptStatus]);

    if (!promptType) return null;

    const handleResponse = (went: boolean) => {
        if (promptType === 'morning') {
            setGymMorningPromptStatus(went ? 'yes' : 'no');
            if (!went) setScheduleOffset(scheduleOffset - 1);
        } else {
            setGymEveningPromptStatus(went ? 'yes' : 'no');
            if (!went) setScheduleOffset(scheduleOffset - 1);
        }
        setPromptType(null);
    };

    const isMorning = promptType === 'morning';

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.iconContainer}>
                    <Feather name={isMorning ? "sunrise" : "moon"} size={20} color={appTheme.colors.accent} />
                </View>
                <Text style={styles.title}>
                    {isMorning ? "Morning Check-in" : "Evening Check-in"}
                </Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.subtitle}>
                    {isMorning ? "Are you hitting the gym this morning?" : "Did you crush your workout today?"}
                </Text>
            </View>
            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.noButton]} onPress={() => handleResponse(false)} activeOpacity={0.7}>
                    <Text style={styles.noButtonText}>{isMorning ? "Not Today" : "Missed It"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.yesButton]} onPress={() => handleResponse(true)} activeOpacity={0.7}>
                    <Text style={styles.yesButtonText}>{isMorning ? "Let's Go!" : "Yes, Crushed It!"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        marginBottom: 20,
    },
    title: {
        color: appTheme.colors.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    subtitle: {
        color: appTheme.colors.textSecondary,
        fontSize: 15,
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noButton: {
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#334155',
    },
    noButtonText: {
        color: appTheme.colors.textSecondary,
        fontWeight: '600',
        fontSize: 15,
    },
    yesButton: {
        backgroundColor: appTheme.colors.accent,
        shadowColor: appTheme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    yesButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
