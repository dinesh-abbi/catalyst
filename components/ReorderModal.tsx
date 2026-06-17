import appTheme from '@/theme';
import { WorkoutDayRaw } from '@/utils/getTodayWorkout';
import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Modal, Text, TouchableOpacity, View, ScrollView, SafeAreaView } from 'react-native';
import * as Haptics from 'expo-haptics';

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface ReorderModalProps {
    visible: boolean;
    onClose: () => void;
    currentDays: WorkoutDayRaw[];
    onSave: (newDays: WorkoutDayRaw[]) => void;
}

export function ReorderModal({ visible, onClose, currentDays, onSave }: ReorderModalProps) {
    const [days, setDays] = useState<WorkoutDayRaw[]>([]);

    useEffect(() => {
        if (visible) {
            // Create a deep copy of the days
            setDays(JSON.parse(JSON.stringify(currentDays)));
        }
    }, [visible, currentDays]);

    const moveUp = (index: number) => {
        if (index <= 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const updated = [...days];
        const temp = updated[index];
        updated[index] = updated[index - 1];
        updated[index - 1] = temp;
        setDays(updated);
    };

    const moveDown = (index: number) => {
        if (index >= days.length - 1) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const updated = [...days];
        const temp = updated[index];
        updated[index] = updated[index + 1];
        updated[index + 1] = temp;
        setDays(updated);
    };

    const handleShuffle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const shuffled = [...days];
        // Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setDays(shuffled);
    };

    const handleSave = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Map new dayNumber and assignedDay according to their final positions
        const finalized = days.map((day, idx) => ({
            ...day,
            dayNumber: idx + 1,
            assignedDay: DAY_NAMES[idx]
        }));
        onSave(finalized);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: '#000000' }}>
                <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <View>
                            <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
                                [ SYSTEM_SPLIT_REORDER ]
                            </Text>
                            <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.heading, fontSize: 24 }}>
                                REORDER WORKOUTS
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{ backgroundColor: '#111111', width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: appTheme.colors.border }}
                        >
                            <Feather name="x" size={20} color={appTheme.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Instructions */}
                    <View style={{ backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: appTheme.colors.border, padding: 12, marginBottom: 20 }}>
                        <Text style={{ color: appTheme.colors.textSecondary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 11, lineHeight: 16 }}>
                            Use the arrows to shift workouts to different days of the week. Monday through Sunday slots remain fixed, while workout splits are re-mapped.
                        </Text>
                    </View>

                    {/* Days List */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                        {days.map((day, idx) => {
                            const isFirst = idx === 0;
                            const isLast = idx === days.length - 1;
                            const slotDay = DAY_NAMES[idx];

                            return (
                                <View
                                    key={idx}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: '#0A0A0A',
                                        borderWidth: 1,
                                        borderColor: appTheme.colors.border,
                                        padding: 16,
                                        marginBottom: 12
                                    }}
                                >
                                    {/* Left Slot Badge */}
                                    <View style={{ width: 85, marginRight: 12 }}>
                                        <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
                                            SLOT {idx + 1}
                                        </Text>
                                        <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 13, textTransform: 'uppercase' }} numberOfLines={1}>
                                            {slotDay}
                                        </Text>
                                    </View>

                                    {/* Middle Workout Detail */}
                                    <View style={{ flex: 1, paddingRight: 10 }}>
                                        <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.heading, fontSize: 15, textTransform: 'uppercase' }} numberOfLines={1}>
                                            {day.focus}
                                        </Text>
                                        <Text style={{ color: appTheme.colors.textSecondary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, marginTop: 2 }}>
                                            {day.isRecovery ? "Rest & Recovery" : `${day.exercises?.length || 0} Exercises`}
                                        </Text>
                                    </View>

                                    {/* Right Reorder controls */}
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        <TouchableOpacity
                                            disabled={isFirst}
                                            onPress={() => moveUp(idx)}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                backgroundColor: isFirst ? 'transparent' : '#111111',
                                                borderWidth: 1,
                                                borderColor: isFirst ? '#222' : appTheme.colors.border,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                opacity: isFirst ? 0.3 : 1
                                            }}
                                        >
                                            <Feather name="arrow-up" size={16} color={isFirst ? '#444' : appTheme.colors.textPrimary} />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            disabled={isLast}
                                            onPress={() => moveDown(idx)}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                backgroundColor: isLast ? 'transparent' : '#111111',
                                                borderWidth: 1,
                                                borderColor: isLast ? '#222' : appTheme.colors.border,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                opacity: isLast ? 0.3 : 1
                                            }}
                                        >
                                            <Feather name="arrow-down" size={16} color={isLast ? '#444' : appTheme.colors.textPrimary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {/* Bottom Sticky Action Bar */}
                    <View style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: '#000000',
                        borderTopWidth: 1,
                        borderTopColor: appTheme.colors.border,
                        paddingVertical: 16,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        gap: 12
                    }}>
                        <TouchableOpacity
                            onPress={handleShuffle}
                            style={{
                                flex: 1,
                                borderWidth: 1,
                                borderColor: appTheme.colors.accentTertiary || '#00E5FF',
                                backgroundColor: 'rgba(0, 229, 255, 0.05)',
                                paddingVertical: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                gap: 8
                            }}
                        >
                            <Feather name="shuffle" size={14} color={appTheme.colors.accentTertiary || '#00E5FF'} />
                            <Text style={{ color: appTheme.colors.accentTertiary || '#00E5FF', fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 11, letterSpacing: 1.5 }}>
                                SHUFFLE
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            style={{
                                flex: 1.5,
                                backgroundColor: appTheme.colors.accent,
                                paddingVertical: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                gap: 8
                            }}
                        >
                            <Feather name="check" size={14} color="#000000" strokeWidth={3} />
                            <Text style={{ color: '#000000', fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 11, letterSpacing: 1.5 }}>
                                SAVE SPLIT
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}
