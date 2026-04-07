import appTheme from '@/theme';
import { Exercise } from '@/utils/getTodayWorkout';
import { Check } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import React, { memo, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View, Linking } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface ExerciseCardProps {
    exercise: Exercise;
    isCompleted: boolean;
    loggedWeight: number | undefined;
    onToggleComplete: () => void;
    onUpdateWeight: (weight: number) => void;
    index: number;
}

export const ExerciseCard = memo(function ExerciseCard({
    exercise,
    isCompleted,
    loggedWeight,
    onToggleComplete,
    onUpdateWeight,
    index,
}: ExerciseCardProps) {
    const scale = useSharedValue(1);
    const checkedProgress = useSharedValue(isCompleted ? 1 : 0);

    useEffect(() => {
        if (isCompleted) {
            scale.value = withSequence(
                withTiming(1.15, { duration: 150 }),
                withSpring(1, { damping: 12, stiffness: 200 })
            );
            checkedProgress.value = withTiming(1, { duration: 400 });
        } else {
            scale.value = withTiming(1, { duration: 150 });
            checkedProgress.value = withTiming(0, { duration: 400 });
        }
    }, [isCompleted]);

    const animatedCheckStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        backgroundColor: interpolateColor(
            checkedProgress.value,
            [0, 1],
            ['transparent', appTheme.colors.accent]
        ),
        borderColor: interpolateColor(
            checkedProgress.value,
            [0, 1],
            [appTheme.colors.border, appTheme.colors.accent]
        ),
    }));

    const animatedCardStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: interpolateColor(
                checkedProgress.value,
                [0, 1],
                [appTheme.colors.backgroundCard, appTheme.colors.blockFill]
            ),
            borderColor: interpolateColor(
                checkedProgress.value,
                [0, 1],
                [appTheme.colors.border, appTheme.colors.accent]
            ),
        };
    });

    const isCardio = !!exercise.isCardio;
    const inputSuffix = isCardio ? 'MIN' : 'KG';
    const searchYouTube = () => Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' exercise form')}`);
    const searchGoogle = async () => {
        const query = encodeURIComponent(exercise.name + ' exercise form');
        const googleAppUrl = `google://search?q=${query}`;
        const webUrl = `https://www.google.com/search?q=${query}`;
        try {
            const supported = await Linking.canOpenURL(googleAppUrl);
            if (supported) {
                await Linking.openURL(googleAppUrl);
            } else {
                await Linking.openURL(webUrl);
            }
        } catch (e) {
            Linking.openURL(webUrl);
        }
    };

    return (
        <Animated.View
            style={[animatedCardStyle, { borderWidth: 1, padding: 20, marginBottom: 16 }]}
        >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                    <Text
                        style={{ color: isCompleted ? appTheme.colors.textTertiary : appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.heading, fontSize: 24, textTransform: 'uppercase', letterSpacing: -0.5, textDecorationLine: isCompleted ? 'line-through' : 'none' }}
                    >
                        {exercise.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                        <View style={{ width: 8, height: 8, backgroundColor: appTheme.colors.accent, marginRight: 8 }} />
                        <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>
                            {isCardio ? 'ENDURANCE_PROTO' : 'HYPERTROPHY_PROTO'}
                        </Text>
                    </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                    <TouchableOpacity
                        onPress={onToggleComplete}
                        style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
                        activeOpacity={1}
                    >
                        <Animated.View style={[animatedCheckStyle, { width: 24, height: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center' }]}>
                            {isCompleted && (
                                <Check color="#000000" size={16} strokeWidth={4} />
                            )}
                        </Animated.View>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={searchYouTube} style={{ padding: 6, borderRadius: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                            <Feather name="youtube" size={14} color="#ef4444" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={searchGoogle} style={{ padding: 6, borderRadius: 6, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                            <Feather name="search" size={14} color="#3b82f6" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: appTheme.colors.blockFill, borderWidth: 1, borderColor: appTheme.colors.blockBorder, padding: 16, marginBottom: exercise.notes ? 16 : 0 }}>
                <View style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={{ marginRight: 32 }}>
                        <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>
                            {isCardio ? 'TYPE' : 'SETS'}
                        </Text>
                        <Text style={{ color: isCompleted ? appTheme.colors.textTertiary : appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 20 }}>
                            {isCardio ? exercise.tempo : exercise.sets}
                        </Text>
                    </View>
                    <View>
                        <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>
                            {isCardio ? 'TIME' : 'REPS'}
                        </Text>
                        <Text style={{ color: isCompleted ? appTheme.colors.textTertiary : appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 20 }}>
                            {isCardio ? exercise.sets : exercise.reps}
                        </Text>
                    </View>
                </View>

                <View style={{ backgroundColor: appTheme.colors.backgroundMain, borderWidth: 1, borderColor: appTheme.colors.border, width: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }}>
                    <TextInput
                        style={{ color: isCompleted ? appTheme.colors.textTertiary : appTheme.colors.accent, flex: 1, textAlign: 'right', fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 18, padding: 0 }}
                        keyboardType="numeric"
                        placeholder="--"
                        placeholderTextColor={appTheme.colors.textTertiary}
                        value={loggedWeight ? loggedWeight.toString() : ''}
                        onChangeText={(val) => {
                            const num = parseFloat(val);
                            onUpdateWeight(!isNaN(num) ? num : 0);
                        }}
                    />
                    <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, marginLeft: 6, marginTop: 4 }}>
                        {inputSuffix}
                    </Text>
                </View>
            </View>

            {exercise.notes && (
                <View style={{ padding: 12, borderLeftWidth: 2, borderLeftColor: appTheme.colors.accent, backgroundColor: appTheme.colors.blockFill }}>
                    <Text style={{ color: appTheme.colors.textSecondary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, lineHeight: 16, letterSpacing: 0.5 }}>
                        /* {exercise.notes} */
                    </Text>
                </View>
            )}
        </Animated.View>
    );
});
