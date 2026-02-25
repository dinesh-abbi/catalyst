import appTheme from '@/theme';
import { Exercise } from '@/utils/getTodayWorkout';
import { CheckCircle2, Circle } from 'lucide-react-native';
import React, { memo, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

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
    const checkedScale = useSharedValue(isCompleted ? 1 : 0);

    const ITEM_SIZE = 180; // Approximate height + margin of a card

    useEffect(() => {
        if (isCompleted) {
            scale.value = withSequence(
                withTiming(1.2, { duration: 100 }),
                withSpring(1, { damping: 10, stiffness: 200 })
            );
            checkedScale.value = withTiming(1, { duration: 300 });
        } else {
            scale.value = withTiming(1, { duration: 100 });
            checkedScale.value = withTiming(0, { duration: 300 });
        }
    }, [isCompleted, scale, checkedScale]);

    const animatedCheckStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }]
        };
    });

    const animatedCardStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            checkedScale.value,
            [0, 1],
            [appTheme.colors.backgroundCard, 'rgba(34, 197, 94, 0.1)'] // Tailwind bg-backgroundCard to bg-green-500/10
        );

        const borderColor = interpolateColor(
            checkedScale.value,
            [0, 1],
            ['#1e293b', 'rgba(34, 197, 94, 0.5)'] // Tailwind border-slate-800 to border-green-500/50
        );

        return {
            backgroundColor,
            borderColor,
        };
    });

    const isCardio = !!exercise.isCardio;
    const inputSuffix = isCardio ? 'min' : 'kg';

    return (
        <Animated.View style={[animatedCardStyle, { borderWidth: 1 }]} className={`rounded-2xl p-5 mb-4`}>

            {/* Header Row: Title and Checkbox on the right */}
            <View className="flex-row items-start justify-between mb-4">
                <Text className={`text-xl font-bold flex-1 ${isCompleted ? 'text-green-500/70 line-through' : 'text-textPrimary'}`}>
                    {exercise.name}
                </Text>

                <TouchableOpacity
                    onPress={onToggleComplete}
                    className="ml-4 flex-row items-center justify-center p-1"
                    activeOpacity={0.7}
                >
                    <Animated.View style={animatedCheckStyle}>
                        {isCompleted ? (
                            <CheckCircle2 color="#22c55e" size={28} />
                        ) : (
                            <Circle color={appTheme.colors.textSecondary} size={28} />
                        )}
                    </Animated.View>
                </TouchableOpacity>
            </View>

            {/* Details Row: Sets, Reps, Logging */}
            <View className="flex-row items-center justify-between bg-backgroundMain rounded-xl p-3 mb-4">
                <View className="flex-1 flex-row items-center gap-x-6">
                    <View>
                        <Text className="text-textSecondary text-xs uppercase font-bold tracking-wider mb-1">
                            {isCardio ? 'Type' : 'Sets'}
                        </Text>
                        <Text className={`font-semibold text-lg ${isCompleted ? 'text-textSecondary' : 'text-textPrimary'}`}>
                            {isCardio ? exercise.tempo : exercise.sets}
                        </Text>
                    </View>
                    <View>
                        <Text className="text-textSecondary text-xs uppercase font-bold tracking-wider mb-1">
                            {isCardio ? 'Sets' : 'Reps'}
                        </Text>
                        <Text className={`font-semibold text-lg ${isCompleted ? 'text-textSecondary' : 'text-textPrimary'}`}>
                            {isCardio ? exercise.sets : exercise.reps}
                        </Text>
                    </View>
                </View>

                {/* Log Input */}
                <View className="w-24 border border-slate-700 bg-backgroundCard rounded-lg px-3 py-1 flex-row items-center">
                    <TextInput
                        className={`flex-1 text-right text-lg font-bold ${isCompleted ? 'text-textSecondary' : 'text-textPrimary'}`}
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor={appTheme.colors.textSecondary}
                        value={loggedWeight ? loggedWeight.toString() : ''}
                        onChangeText={(val) => {
                            const num = parseFloat(val);
                            if (!isNaN(num)) {
                                onUpdateWeight(num);
                            } else if (val === '') {
                                onUpdateWeight(0);
                            }
                        }}
                    />
                    <Text className="text-textSecondary font-medium ml-1 text-sm mt-1">{inputSuffix}</Text>
                </View>
            </View>

            {/* Notes */}
            <View className="bg-slate-800/30 rounded-lg p-3">
                <Text className={`text-sm leading-tight ${isCompleted ? 'text-textSecondary line-through' : 'text-textSecondary'}`}>
                    <Text className="font-bold">Note:</Text> {exercise.notes}
                </Text>
            </View>
        </Animated.View>
    );
});
