import { useWorkoutStore } from '@/store/useWorkoutStore';
import appTheme from '@/theme';
import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function HydrationClock({ logs }: { logs: { id: string; amount: number; timestamp: number }[] }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const slotAmounts = new Array(12).fill(0);
    logs.forEach(log => {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        if (
            logDate.getDate() === today.getDate() &&
            logDate.getMonth() === today.getMonth() &&
            logDate.getFullYear() === today.getFullYear()
        ) {
            const hour = logDate.getHours();
            const slot = hour % 12;
            slotAmounts[slot] += log.amount;
        }
    });

    const CLOCK_SIZE = 280;
    const BORDER_WIDTH = 6;
    const RADIUS = CLOCK_SIZE / 2;
    const CENTER = RADIUS - BORDER_WIDTH;

    const droplets = Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const distance = CENTER - 26;
        const x = CENTER + distance * Math.cos(angle) - 16;
        const y = CENTER + distance * Math.sin(angle) - 16;

        const isFilled = slotAmounts[i] > 0;

        return (
            <View key={i} style={{ position: 'absolute', left: x, top: y, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
                {isFilled ? (
                    <View style={styles.clockFilledDrop}>
                        <Ionicons name="water" size={16} color={appTheme.colors.accent} />
                    </View>
                ) : (
                    <Ionicons name="water-outline" size={14} color="#334155" />
                )}
            </View>
        );
    });

    const h = time.getHours();
    const m = time.getMinutes();
    const s = time.getSeconds();

    const secondAngle = `${s * 6}deg`;
    const minuteAngle = `${m * 6 + s * 0.1}deg`;
    const hourAngle = `${(h % 12) * 30 + m * 0.5}deg`;

    return (
        <View style={styles.clockContainer}>
            <Text style={styles.clockHeader}>Hydration Clock</Text>
            <View style={styles.clockFace}>
                {/* Droplets */}
                {droplets}

                {/* Hour Hand */}
                <View style={[styles.handContainer, { transform: [{ rotate: hourAngle }] }]}>
                    <View style={styles.hourHand} />
                </View>

                {/* Minute Hand */}
                <View style={[styles.handContainer, { transform: [{ rotate: minuteAngle }] }]}>
                    <View style={styles.minuteHand} />
                </View>

                {/* Second Hand */}
                <View style={[styles.handContainer, { transform: [{ rotate: secondAngle }] }]}>
                    <View style={styles.secondHand} />
                </View>

                {/* Center dot */}
                <View style={styles.centerDotOuter}>
                    <View style={styles.centerDotInner} />
                </View>
            </View>

            <View style={styles.clockLegend}>
                <Ionicons name="water" size={16} color={appTheme.colors.accent} />
                <Text style={styles.clockLegendText}>Water Logged</Text>
            </View>
        </View>
    );
}

export function WaterTracker() {
    const { waterIntakeML, addWater, waterLogs } = useWorkoutStore();
    const GOAL_ML = 2500;

    const clampedAmount = Math.max(0, Math.min(waterIntakeML, GOAL_ML));
    const percentage = Math.round((clampedAmount / GOAL_ML) * 100);

    const TANK_HEIGHT = 200;

    // Use a reference up to 1 for easier calculation natively
    const fillAnim = useRef(new Animated.Value(clampedAmount / GOAL_ML)).current;

    useEffect(() => {
        Animated.spring(fillAnim, {
            toValue: clampedAmount / GOAL_ML,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, [clampedAmount, fillAnim, GOAL_ML]);

    // Translate Y pushes the "fill" layer down. 0 means full to the top. TANK_HEIGHT means empty.
    const translateY = fillAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [TANK_HEIGHT, 0],
    });

    const isGoalMet = waterIntakeML >= GOAL_ML;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Feather name="droplet" size={48} color={appTheme.colors.accent} />
                    <Text style={styles.title}>Hydration Tracker</Text>
                    <Text style={styles.subtitle}>
                        {isGoalMet
                            ? "Awesome! You've reached your daily goal! 🎉"
                            : "Keep drinking! Your muscles need hydration."}
                    </Text>
                </View>

                {/* Hydration Clock UI Prominent Hero */}
                <HydrationClock logs={waterLogs} />

                {/* Animated Tank UI - Compact Glassmorphic */}
                <View style={[styles.tankContainer, { height: TANK_HEIGHT }]}>
                    <Animated.View
                        style={[
                            styles.tankFill,
                            {
                                height: TANK_HEIGHT,
                                transform: [{ translateY }],
                            },
                        ]}
                    />
                    <View style={styles.tankOverlay}>
                        <Text style={styles.percentageText}>{percentage}%</Text>
                        <Text style={styles.mlText}>{Math.max(0, waterIntakeML)} / {GOAL_ML} ML</Text>
                    </View>
                </View>

                <View style={styles.controls}>
                    <Text style={styles.question}>Log your water intake</Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.noButton]}
                            onPress={() => addWater(-250)}
                            activeOpacity={0.7}
                        >
                            <Feather name="minus" size={24} color={appTheme.colors.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.logCenterDisplay}>
                            <Feather name="droplet" size={20} color={appTheme.colors.accent} />
                            <Text style={styles.logCenterText}>250 ML</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, styles.yesButton]}
                            onPress={() => addWater(250)}
                            activeOpacity={0.7}
                        >
                            <Feather name="plus" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appTheme.colors.backgroundMain,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 32,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: appTheme.colors.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: appTheme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    tankContainer: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#1E293B',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 32,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    tankFill: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(6, 182, 212, 0.2)', // Soft animated cyan wave
        borderRadius: 24,
    },
    tankOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentageText: {
        fontSize: 48,
        fontWeight: '900',
        color: appTheme.colors.accent,
        letterSpacing: -1,
    },
    mlText: {
        fontSize: 16,
        fontWeight: '600',
        color: appTheme.colors.textSecondary,
        marginTop: 4,
    },
    controls: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    question: {
        fontSize: 16,
        fontWeight: 'bold',
        color: appTheme.colors.textSecondary,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        width: '100%',
        marginBottom: 24,
    },
    button: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    yesButton: {
        backgroundColor: appTheme.colors.accent,
        shadowColor: appTheme.colors.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    noButton: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    logCenterDisplay: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    logCenterText: {
        color: appTheme.colors.textPrimary,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    clockContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    clockHeader: {
        fontSize: 18,
        fontWeight: '900',
        color: appTheme.colors.textPrimary,
        marginBottom: 24,
    },
    clockFace: {
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: '#0F172A',
        borderWidth: 4,
        borderColor: '#1E293B',
        position: 'relative',
        shadowColor: appTheme.colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
    },
    clockFilledDrop: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(6, 182, 212, 0.4)',
    },
    handContainer: {
        position: 'absolute',
        width: 280,
        height: 280,
        top: -6,
        left: -6,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    hourHand: {
        width: 6,
        height: 65,
        backgroundColor: '#94A3B8',
        borderRadius: 4,
        marginTop: 75,
    },
    minuteHand: {
        width: 4,
        height: 90,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        marginTop: 50,
    },
    secondHand: {
        width: 2,
        height: 105,
        backgroundColor: appTheme.colors.accent,
        borderRadius: 2,
        marginTop: 35,
    },
    centerDotOuter: {
        position: 'absolute',
        top: 126,
        left: 126,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    centerDotInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: appTheme.colors.accent,
    },
    clockLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 32,
        backgroundColor: appTheme.colors.backgroundCard,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    clockLegendText: {
        marginLeft: 8,
        color: appTheme.colors.textSecondary,
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
