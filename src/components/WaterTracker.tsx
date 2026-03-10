import { useWorkoutStore } from '@/store/useWorkoutStore';
import appTheme from '@/theme';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function HydrationClock({ logs }: { logs: { id: string; amount: number; timestamp: number }[] }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const amAmounts = new Array(12).fill(0);
    const pmAmounts = new Array(12).fill(0);

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
            if (hour < 12) amAmounts[slot] += log.amount;
            else pmAmounts[slot] += log.amount;
        }
    });

    const CLOCK_SIZE = 260;
    const CENTER = CLOCK_SIZE / 2;

    const allBlips = [];
    for (let i = 0; i < 12; i++) {
        const angleRad = (i * 30 - 90) * (Math.PI / 180);
        const pmX = CENTER + (CENTER - 20) * Math.cos(angleRad);
        const pmY = CENTER + (CENTER - 20) * Math.sin(angleRad);
        const amX = CENTER + (CENTER - 45) * Math.cos(angleRad);
        const amY = CENTER + (CENTER - 45) * Math.sin(angleRad);

        if (pmAmounts[i] > 0) {
            allBlips.push(
                <View key={`PM-${i}`} style={[styles.clockBlip, { left: pmX - 2, top: pmY - 6, transform: [{ rotate: `${i * 30}deg` }], backgroundColor: appTheme.colors.accentSecondary }]} />
            );
        }
        if (amAmounts[i] > 0) {
            allBlips.push(
                <View key={`AM-${i}`} style={[styles.clockBlip, { left: amX - 2, top: amY - 6, transform: [{ rotate: `${i * 30}deg` }], backgroundColor: appTheme.colors.accentTertiary }]} />
            );
        }
    }

    const s = time.getSeconds();
    const m = time.getMinutes();
    const h = time.getHours();

    return (
        <View style={styles.clockContainer}>
            <View style={styles.clockOuterRing}>
                <View style={styles.clockFace}>
                    {/* Crosshairs for stark radar look */}
                    <View style={styles.crosshairVertical} />
                    <View style={styles.crosshairHorizontal} />

                    {allBlips}

                    {/* Industrial Hands */}
                    <View style={[styles.handContainer, { transform: [{ rotate: `${h * 30 + m * 0.5}deg` }] }]}><View style={styles.hourHand} /></View>
                    <View style={[styles.handContainer, { transform: [{ rotate: `${m * 6}deg` }] }]}><View style={styles.minuteHand} /></View>
                    <View style={[styles.handContainer, { transform: [{ rotate: `${s * 6}deg` }] }]}><View style={styles.secondHand} /></View>
                    <View style={styles.centerSquareOuter}><View style={styles.centerSquareInner} /></View>
                </View>
            </View>

            <View style={styles.clockLegendsWrapper}>
                <View style={styles.clockLegendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSquare, { backgroundColor: appTheme.colors.accentSecondary }]} />
                        <Text style={styles.legendText}>PM_DATA</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSquare, { backgroundColor: appTheme.colors.accentTertiary }]} />
                        <Text style={styles.legendText}>AM_DATA</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

export function WaterTracker() {
    const { waterIntakeML, addWater, waterLogs } = useWorkoutStore();
    const GOAL_ML = 2500;
    const BAR_WIDTH = 280;

    const fillProgress = useSharedValue(Math.max(0, Math.min(waterIntakeML / GOAL_ML, 1)));

    useEffect(() => {
        fillProgress.value = withSpring(Math.max(0, Math.min(waterIntakeML / GOAL_ML, 1)), {
            damping: 20,
            stiffness: 150
        });
    }, [waterIntakeML]);

    const animatedFillStyle = useAnimatedStyle(() => ({
        width: interpolate(fillProgress.value, [0, 1], [0, BAR_WIDTH]),
    }));

    const percentage = Math.round(Math.min(100, (waterIntakeML / GOAL_ML) * 100));

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>

                {/* Data Readout Headers */}
                <View style={styles.dataHeader}>
                    <Text style={styles.massiveDataText}>{percentage}<Text style={{ fontSize: 24, color: appTheme.colors.accentSecondary }}>%</Text></Text>
                    <Text style={styles.subDataText}>SYS_HYDRATION_LEVEL</Text>
                </View>

                {/* Segmented LED Bar Visualizer */}
                <View style={styles.trackerBarContainer}>
                    <View style={[styles.barOutline, { width: BAR_WIDTH }]}>
                        <Animated.View style={[styles.barFill, animatedFillStyle]} />
                        {/* Cutouts to make it look "segmented" */}
                        <View style={styles.segmentedOverlay}>
                            {[...Array(9)].map((_, i) => (
                                <View key={i} style={styles.segmentDivider} />
                            ))}
                        </View>
                    </View>
                    <View style={styles.trackerLabels}>
                        <Text style={styles.trackerLabelText}>0_ML</Text>
                        <Text style={[styles.trackerLabelText, { color: appTheme.colors.textPrimary }]}>{Math.max(0, waterIntakeML)}_ML</Text>
                        <Text style={styles.trackerLabelText}>{GOAL_ML}_ML</Text>
                    </View>
                </View>

                <HydrationClock logs={waterLogs} />

                {/* Industrial Controls */}
                <View style={styles.controlsCompact}>
                    <TouchableOpacity
                        style={styles.adjustBtnBase}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid); addWater(-250); }}
                        activeOpacity={1}
                    >
                        <Text style={styles.btnText}>[-_250]</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.adjustBtnPrimary}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid); addWater(250); }}
                        activeOpacity={1}
                    >
                        <Text style={styles.btnTextPrimary}>[+_250_ML]</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 140, paddingTop: 10 },
    content: { alignItems: 'center', paddingHorizontal: 24 },

    dataHeader: { alignItems: 'center', marginBottom: 40 },
    massiveDataText: { fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 80, color: appTheme.colors.textPrimary, letterSpacing: -4, lineHeight: 90 },
    subDataText: { fontFamily: appTheme.typography.fontFamily.mono, fontSize: 12, color: appTheme.colors.textSecondary, letterSpacing: 2 },

    trackerBarContainer: { width: '100%', alignItems: 'center', marginBottom: 40 },
    barOutline: { height: 40, borderWidth: 1, borderColor: appTheme.colors.border, backgroundColor: appTheme.colors.blockFill, position: 'relative' },
    barFill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: appTheme.colors.accent },
    segmentedOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
    segmentDivider: { width: 4, height: '100%', backgroundColor: appTheme.colors.backgroundMain },
    trackerLabels: { flexDirection: 'row', justifyContent: 'space-between', width: 280, marginTop: 8 },
    trackerLabelText: { fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, color: appTheme.colors.textTertiary, letterSpacing: 1 },

    clockContainer: { width: '100%', alignItems: 'center', marginBottom: 40 },
    clockOuterRing: { width: 260, height: 260, borderWidth: 1, borderColor: appTheme.colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: appTheme.colors.blockFill },
    clockFace: { width: 240, height: 240, backgroundColor: appTheme.colors.backgroundMain, borderWidth: 1, borderColor: appTheme.colors.border, position: 'relative', overflow: 'hidden' },
    clockBlip: { position: 'absolute', width: 4, height: 12 },
    crosshairVertical: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: appTheme.colors.border, marginLeft: -0.5 },
    crosshairHorizontal: { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: appTheme.colors.border, marginTop: -0.5 },
    handContainer: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center' },
    hourHand: { width: 4, height: 50, backgroundColor: appTheme.colors.textSecondary, marginTop: 70 },
    minuteHand: { width: 2, height: 80, backgroundColor: appTheme.colors.textPrimary, marginTop: 40 },
    secondHand: { width: 1, height: 100, backgroundColor: appTheme.colors.accent, marginTop: 20 },
    centerSquareOuter: { position: 'absolute', top: '50%', left: '50%', width: 16, height: 16, marginTop: -8, marginLeft: -8, borderWidth: 1, borderColor: appTheme.colors.border, backgroundColor: appTheme.colors.backgroundMain, justifyContent: 'center', alignItems: 'center' },
    centerSquareInner: { width: 6, height: 6, backgroundColor: appTheme.colors.accent },
    clockLegendsWrapper: { marginTop: 16 },
    clockLegendContainer: { flexDirection: 'row', gap: 20 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendSquare: { width: 8, height: 8, borderWidth: 1, borderColor: appTheme.colors.border },
    legendText: { fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, color: appTheme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },

    controlsCompact: { flexDirection: 'row', gap: 16, width: 280, justifyContent: 'center' },
    adjustBtnBase: { flex: 1, height: 56, borderWidth: 1, borderColor: appTheme.colors.border, backgroundColor: appTheme.colors.blockFill, justifyContent: 'center', alignItems: 'center' },
    btnText: { fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 14, color: appTheme.colors.textSecondary, letterSpacing: 1 },
    adjustBtnPrimary: { flex: 2, height: 56, borderWidth: 1, borderColor: appTheme.colors.accent, backgroundColor: 'rgba(204, 255, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
    btnTextPrimary: { fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 16, color: appTheme.colors.accent, letterSpacing: 1 },
});

