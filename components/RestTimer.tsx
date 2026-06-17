import appTheme from '@/theme';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RestTimerProps {
    exerciseName: string;
    seconds: number;
    onClose: () => void;
}

export function RestTimer({ exerciseName, seconds, onClose }: RestTimerProps) {
    const [timeLeft, setTimeLeft] = useState(seconds);
    const [totalSeconds, setTotalSeconds] = useState(seconds);

    useEffect(() => {
        setTimeLeft(seconds);
        setTotalSeconds(seconds);
    }, [seconds, exerciseName]);

    useEffect(() => {
        if (timeLeft <= 0) {
            // Timer complete: trigger notification and close
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onClose();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft]);

    const formatTime = (totalSecs: number) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const addTime = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeLeft(prev => prev + 30);
        setTotalSeconds(prev => prev + 30);
    };

    const subtractTime = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeLeft(prev => Math.max(0, prev - 30));
    };

    const progressWidth = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0;

    return (
        <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            style={{
                position: 'absolute',
                bottom: 24,
                left: 16,
                right: 16,
                backgroundColor: '#0F0F0F',
                borderWidth: 2,
                borderColor: appTheme.colors.accent,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.6,
                shadowRadius: 12,
                elevation: 10,
                zIndex: 100
            }}
        >
            {/* Top Progress bar */}
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: 4,
                width: `${progressWidth}%`,
                backgroundColor: appTheme.colors.accent
            }} />

            {/* Content */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                    <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>
                        [ ACTIVE_REST_PERIOD ]
                    </Text>
                    <Text style={{ color: appTheme.colors.textSecondary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 11 }} numberOfLines={1}>
                        Resting after: {exerciseName}
                    </Text>
                </View>
                <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 32, letterSpacing: -1 }}>
                    {formatTime(timeLeft)}
                </Text>
            </View>

            {/* Adjustments row */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                    onPress={subtractTime}
                    activeOpacity={0.8}
                    style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: appTheme.colors.border,
                        paddingVertical: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        backgroundColor: '#161616'
                    }}
                >
                    <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 11, letterSpacing: 1 }}>
                        - 30s
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={addTime}
                    activeOpacity={0.8}
                    style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: appTheme.colors.border,
                        paddingVertical: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        backgroundColor: '#161616'
                    }}
                >
                    <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 11, letterSpacing: 1 }}>
                        + 30s
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onClose();
                    }}
                    activeOpacity={0.8}
                    style={{
                        flex: 1.5,
                        backgroundColor: appTheme.colors.accentSecondary || '#FF3300',
                        paddingVertical: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row'
                    }}
                >
                    <Feather name="skip-forward" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#FFFFFF', fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 11, letterSpacing: 1.5 }}>
                        SKIP REST
                    </Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}
