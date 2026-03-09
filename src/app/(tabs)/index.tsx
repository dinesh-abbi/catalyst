import { ExerciseCard } from '@/components/ExerciseCard';
import { GymPrompt } from '@/components/GymPrompt';
import { TempoReminder } from '@/components/TempoReminder';
import { WaterTracker } from '@/components/WaterTracker';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { getTodayWorkout } from '@/utils/getTodayWorkout';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const {
        completedExercises,
        loggedWeights,
        dismissTempoReminder,
        toggleExercise,
        setWeight,
        setDismissTempoReminder,
        checkAndResetAtMidnight,
        scheduleOffset
    } = useWorkoutStore();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ tab?: string }>();
    const [activeTab, setActiveTab] = useState<'exercises' | 'water'>('exercises');

    // Physical day calculation (1-7)
    const currentPhysicalDay = useMemo(() => {
        const jsDay = new Date().getDay();
        return jsDay === 0 ? 7 : jsDay;
    }, []);

    const effectiveToday = useMemo(() => {
        return ((currentPhysicalDay - 1 + scheduleOffset) % 7 + 7) % 7 + 1;
    }, [currentPhysicalDay, scheduleOffset]);

    const scrollViewRef = useRef<ScrollView>(null);
    const screenWidth = Dimensions.get('window').width;

    // Reset to physical day when app comes to foreground on a new day
    useEffect(() => {
        if (params.tab === 'water' || params.tab === 'exercises') {
            // Need a tiny delay for ScrollView to mount/layout its dimensions
            setTimeout(() => {
                scrollToTab(params.tab as 'water' | 'exercises');
            }, 100);
        }
    }, [params.tab]);

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
    }, [checkAndResetAtMidnight, effectiveToday]);

    // Fetch the dynamically selected day instead of hard physical day
    const todayWorkout = useMemo(() => getTodayWorkout(effectiveToday), [effectiveToday]);

    // Custom date formatting (e.g., "Monday, Oct 24")
    const formattedDate = useMemo(() => new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
    }).format(new Date()), []);

    // Tab Navigation Logic
    const scrollToTab = (tab: 'exercises' | 'water') => {
        setActiveTab(tab);
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                x: tab === 'exercises' ? 0 : screenWidth,
                animated: true
            });
        }
    };

    const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const newIndex = Math.round(offsetX / screenWidth);
        setActiveTab(newIndex === 0 ? 'exercises' : 'water');
    };


    // Memoize the handle functions deeply to avoid unnecessary re-renders of ExerciseCard
    const handleToggleComplete = useCallback((id: string) => {
        toggleExercise(id);
    }, [toggleExercise]);

    const handleUpdateWeight = useCallback((id: string, weight: number) => {
        setWeight(id, weight);
    }, [setWeight]);

    const renderExercise = useCallback(({ item, index }: any) => {
        return (
            <ExerciseCard
                exercise={item}
                index={index}
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
            <View className="flex-1 pt-8">

                {/* Header Section (Padding matched to tab buttons) */}
                <View className="mb-4 px-5">
                    <Text className="text-textSecondary text-sm font-medium tracking-widest uppercase mb-1">
                        TODAY • {formattedDate}
                    </Text>

                    {/* Header: Title ONLY */}
                    <View className="flex-row items-center justify-center">
                        <Text className="text-accent text-2xl font-extrabold tracking-tight leading-tight text-center" numberOfLines={1}>
                            {todayWorkout.title}
                        </Text>
                    </View>
                </View>

                {/* Top Tabs */}
                <View className="flex-row border-b border-slate-800 mb-6 px-5">
                    <TouchableOpacity
                        onPress={() => scrollToTab('exercises')}
                        className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'exercises' ? 'border-sky-400' : 'border-transparent'}`}
                    >
                        <Text className={`font-bold ${activeTab === 'exercises' ? 'text-sky-400' : 'text-slate-400'}`}>Exercises</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => scrollToTab('water')}
                        className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'water' ? 'border-sky-400' : 'border-transparent'}`}
                    >
                        <Text className={`font-bold ${activeTab === 'water' ? 'text-sky-400' : 'text-slate-400'}`}>Water</Text>
                    </TouchableOpacity>
                </View>

                {/* Swipeable Content Area */}
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    className="flex-1"
                >
                    {/* Exercises View */}
                    <View style={{ width: screenWidth }} className="px-5">
                        {/* Tempo Reminder Banner */}
                        {!dismissTempoReminder && (
                            <TempoReminder onDismiss={() => setDismissTempoReminder(true)} />
                        )}

                        <GymPrompt />

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
                        />
                    </View>

                    {/* Water Tracker View */}
                    <View style={{ width: screenWidth }}>
                        <WaterTracker />
                    </View>
                </ScrollView>

            </View>
        </SafeAreaView>
    );
}
