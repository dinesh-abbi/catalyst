import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, SafeAreaView, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { getTodayWorkout } from '@/utils/getTodayWorkout';
import { TempoReminder } from '@/components/TempoReminder';
import { ExerciseCard } from '@/components/ExerciseCard';

export default function HomeScreen() {
    const {
        completedExercises,
        loggedWeights,
        dismissTempoReminder,
        toggleExercise,
        setWeight,
        setDismissTempoReminder,
        checkAndResetAtMidnight
    } = useWorkoutStore();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkAndResetAtMidnight();
            }
        });

        // Trigger on mount as well to ensure correctness upon cold start
        checkAndResetAtMidnight();

        return () => {
            subscription.remove();
        };
    }, [checkAndResetAtMidnight]);

    const todayWorkout = useMemo(() => getTodayWorkout(), []);

    // Custom date formatting (e.g., "Monday, Oct 24")
    const formattedDate = useMemo(() => new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    }).format(new Date()), []);

    // Memoize the handle functions deeply to avoid unnecessary re-renders of ExerciseCard
    const handleToggleComplete = useCallback((id: string) => {
        toggleExercise(id);
    }, [toggleExercise]);

    const handleUpdateWeight = useCallback((id: string, weight: number) => {
        setWeight(id, weight);
    }, [setWeight]);

    const renderExercise = useCallback(({ item }: any) => {
        return (
            <ExerciseCard
                exercise={item}
                isCompleted={!!completedExercises[item.id]}
                loggedWeight={loggedWeights[item.id]}
                onToggleComplete={() => handleToggleComplete(item.id)}
                onUpdateWeight={(weight) => handleUpdateWeight(item.id, weight)}
            />
        );
    }, [completedExercises, loggedWeights, handleToggleComplete, handleUpdateWeight]);

    const renderEmptyComponent = useCallback(() => (
        <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-textSecondary text-lg text-center">
                Awesome! Today is an active recovery day or rest day.{'\n'}
                Check your specific instructions.
            </Text>
        </View>
    ), []);

    return (
        <SafeAreaView className="flex-1 bg-backgroundMain">
            <View className="flex-1 px-5 pt-8">

                {/* Header Section */}
                <View className="mb-6">
                    <Text className="text-textSecondary text-sm font-medium tracking-widest uppercase mb-1">
                        TODAY • {formattedDate}
                    </Text>
                    <Text className="text-accent text-3xl font-extrabold tracking-tight leading-tight">
                        {todayWorkout.title}
                    </Text>
                </View>

                {/* Tempo Reminder Banner */}
                {!dismissTempoReminder && (
                    <TempoReminder onDismiss={() => setDismissTempoReminder(true)} />
                )}

                {/* Exercise List */}
                <FlatList
                    data={todayWorkout.exercises}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                    ListEmptyComponent={renderEmptyComponent}
                    renderItem={renderExercise}
                    initialNumToRender={5}
                    windowSize={5}
                    maxToRenderPerBatch={5}
                    removeClippedSubviews={true}
                />
            </View>
        </SafeAreaView>
    );
}
