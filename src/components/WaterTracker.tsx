import { useWorkoutStore } from '@/store/useWorkoutStore';
import appTheme from '@/theme';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
                    <Feather name="droplet" size={48} color="#38BDF8" />
                    <Text style={styles.title}>Hydration Tracker</Text>
                    <Text style={styles.subtitle}>
                        {isGoalMet
                            ? "Awesome! You've reached your daily goal! 🎉"
                            : "Keep drinking! Your muscles need hydration."}
                    </Text>
                </View>

                {/* Animated Tank UI */}
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
                            activeOpacity={0.8}
                        >
                            <Feather name="minus" size={20} color={appTheme.colors.textSecondary} />
                            <Text style={styles.noText}>250 ML</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.yesButton]}
                            onPress={() => addWater(250)}
                            activeOpacity={0.8}
                        >
                            <Feather name="plus" size={20} color="#FFF" />
                            <Text style={styles.yesText}>250 ML</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Hydration Timeline */}
                <View style={styles.timelineContainer}>
                    <Text style={styles.timelineTitle}>Today&apos;s Log</Text>
                    {waterLogs.length === 0 ? (
                        <View style={styles.emptyTimelineContainer}>
                            <Feather name="clock" size={24} color={appTheme.colors.textSecondary} />
                            <Text style={styles.emptyTimelineText}>No water logged yet today.</Text>
                        </View>
                    ) : (
                        <View style={styles.timelineList}>
                            {waterLogs.map((log, index) => {
                                const isPositive = log.amount > 0;
                                const timeString = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <View key={log.id} style={styles.timelineRow}>
                                        {/* Decorator (Line & Dot) */}
                                        <View style={styles.timelineDecorator}>
                                            <View style={[styles.timelineLineTop, index === 0 && { backgroundColor: 'transparent' }]} />
                                            <View style={[styles.timelineDot, isPositive ? styles.timelineDotPositive : styles.timelineDotNegative]}>
                                                <Feather name={isPositive ? "droplet" : "minus"} size={10} color={isPositive ? "#38bdf8" : "#fb923c"} />
                                            </View>
                                            <View style={[styles.timelineLineBottom, index === waterLogs.length - 1 && { backgroundColor: 'transparent' }]} />
                                        </View>

                                        {/* Content */}
                                        <View style={styles.timelineContent}>
                                            <Text style={styles.timelineTime}>{timeString}</Text>
                                            <View style={[styles.timelineAmountBadge, isPositive ? styles.timelineBadgePositive : styles.timelineBadgeNegative]}>
                                                <Text style={[styles.timelineAmountText, isPositive ? styles.timelineAmountTextPositive : styles.timelineAmountTextNegative]}>
                                                    {isPositive ? '+' : '-'}{Math.abs(log.amount)} ML
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
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
        width: 160,
        backgroundColor: appTheme.colors.backgroundCard,
        borderRadius: 80,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#1E293B',
        marginBottom: 48,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    tankFill: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#38BDF8',
        borderRadius: 80,
    },
    tankOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentageText: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFF',
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    mlText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
    },
    controls: {
        width: '100%',
        alignItems: 'center',
    },
    question: {
        fontSize: 18,
        fontWeight: 'bold',
        color: appTheme.colors.textPrimary,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
        marginBottom: 24,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    yesButton: {
        backgroundColor: '#0284C7',
        shadowColor: '#0284C7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    noButton: {
        backgroundColor: appTheme.colors.backgroundCard,
        borderWidth: 1,
        borderColor: '#334155',
    },
    yesText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noText: {
        color: appTheme.colors.textSecondary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    timelineContainer: {
        width: '100%',
        marginTop: 16,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
    },
    timelineTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: appTheme.colors.textPrimary,
        marginBottom: 20,
    },
    emptyTimelineContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        gap: 12,
    },
    emptyTimelineText: {
        color: appTheme.colors.textSecondary,
        fontSize: 14,
        fontStyle: 'italic',
    },
    timelineList: {
        paddingVertical: 8,
    },
    timelineRow: {
        flexDirection: 'row',
        minHeight: 60,
    },
    timelineDecorator: {
        width: 32,
        alignItems: 'center',
    },
    timelineLineTop: {
        width: 2,
        height: '35%',
        backgroundColor: '#334155',
    },
    timelineLineBottom: {
        width: 2,
        flex: 1,
        backgroundColor: '#334155',
    },
    timelineDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: appTheme.colors.backgroundMain,
    },
    timelineDotPositive: {
        borderColor: '#0284C7',
    },
    timelineDotNegative: {
        borderColor: '#EA580C',
    },
    timelineContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 24, // Matches the height of the row to space out elements
        paddingLeft: 12,
    },
    timelineTime: {
        fontSize: 16,
        fontWeight: '600',
        color: appTheme.colors.textPrimary,
    },
    timelineAmountBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    timelineBadgePositive: {
        backgroundColor: 'rgba(2, 132, 199, 0.15)',
        borderColor: 'rgba(2, 132, 199, 0.3)',
    },
    timelineBadgeNegative: {
        backgroundColor: 'rgba(234, 88, 12, 0.15)',
        borderColor: 'rgba(234, 88, 12, 0.3)',
    },
    timelineAmountText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    timelineAmountTextPositive: {
        color: '#38BDF8',
    },
    timelineAmountTextNegative: {
        color: '#FB923C',
    },
});
