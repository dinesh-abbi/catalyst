import { ExerciseCard } from '@/components/ExerciseCard';
import { GymPrompt } from '@/components/GymPrompt';
import { TempoReminder } from '@/components/TempoReminder';
import { WaterTracker } from '@/components/WaterTracker';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import appTheme from '@/theme';
import { fetchExercises, logCompletedWorkout } from '@/utils/WorkoutService';
import { useAlertStore } from '@/store/useAlertStore';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SegmentedControl = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: 'exercises' | 'water') => void }) => {
    const underlineX = useSharedValue(activeTab === 'exercises' ? 0 : (SCREEN_WIDTH - 40) / 2);

    useEffect(() => {
        underlineX.value = withSpring(activeTab === 'exercises' ? 0 : (SCREEN_WIDTH - 40) / 2, {
            damping: 20,
            stiffness: 250 // Snappier, mechanical spring
        });
    }, [activeTab]);

    const underlineStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: underlineX.value }],
    }));

    return (
        <View style={{ flexDirection: 'row', position: 'relative', height: 48, marginBottom: 20, marginHorizontal: 20, backgroundColor: appTheme.colors.blockFill, borderWidth: 1, borderColor: appTheme.colors.blockBorder }}>
            <TouchableOpacity
                onPress={() => onTabChange('exercises')}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                activeOpacity={1}
            >
                <Text style={{
                    color: activeTab === 'exercises' ? appTheme.colors.textPrimary : appTheme.colors.textTertiary,
                    fontFamily: appTheme.typography.fontFamily.monoBold,
                    fontSize: 12,
                    letterSpacing: 2
                }}>[ EXERCISES ]</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => onTabChange('water')}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                activeOpacity={1}
            >
                <Text style={{
                    color: activeTab === 'water' ? appTheme.colors.textPrimary : appTheme.colors.textTertiary,
                    fontFamily: appTheme.typography.fontFamily.monoBold,
                    fontSize: 12,
                    letterSpacing: 2
                }}>[ HYDRATION ]</Text>
            </TouchableOpacity>

            {/* Stark Animated Line */}
            <Animated.View
                style={[
                    { position: 'absolute', bottom: -1, width: '50%', height: 2, backgroundColor: appTheme.colors.accent, zIndex: 10, shadowColor: appTheme.colors.accent, shadowOpacity: 0.8, shadowRadius: 5 },
                    underlineStyle
                ]}
            />
        </View>
    );
};

export default function HomeScreen() {
    const {
        completedExercises,
        loggedWeights,
        dismissTempoReminder,
        toggleExercise,
        setWeight,
        setDismissTempoReminder,
        checkAndResetAtMidnight,
        scheduleOffset,
        resetDailyChecklist
    } = useWorkoutStore();
    const { showAlert } = useAlertStore();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ tab?: string }>();
    const [activeTab, setActiveTab] = useState<'exercises' | 'water'>('exercises');
    const [fetchedDays, setFetchedDays] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const currentPhysicalDay = useMemo(() => {
        const jsDay = new Date().getDay();
        return jsDay === 0 ? 7 : jsDay;
    }, []);

    const effectiveToday = useMemo(() => {
        return ((currentPhysicalDay - 1 + scheduleOffset) % 7 + 7) % 7 + 1;
    }, [currentPhysicalDay, scheduleOffset]);

    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (params.tab === 'water' || params.tab === 'exercises') {
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
        checkAndResetAtMidnight();
        return () => subscription.remove();
    }, [checkAndResetAtMidnight, effectiveToday]);

    const loadData = async (refreshing = false) => {
        if (refreshing) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const data = await fetchExercises();
            setFetchedDays(data);
        } catch (error) {
            console.error("Error loading exercises:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = useCallback(() => {
        loadData(true);
    }, []);

    const handleFinishWorkout = async () => {
        const completedIds = Object.keys(completedExercises).filter(id => completedExercises[id]);
        
        if (completedIds.length === 0) {
            showAlert('EMPTY_WORKOUT', "You haven't completed any exercises yet.", 'INFO');
            return;
        }

        // We use system Alert for confirmation since it's a native OS pattern for safety, 
        // but for results/errors we use our ThemedAlert.
        Alert.alert(
            "Finish Workout",
            "Are you sure you want to save this session?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Save",
                    onPress: async () => {
                        const workoutData = {
                            title: todayWorkout.title,
                            dayNumber: todayWorkout.dayNumber,
                            exercises: todayWorkout.exercises.map((ex: any) => ({
                                id: ex.id,
                                name: ex.name,
                                isCompleted: !!completedExercises[ex.id],
                                weight: loggedWeights[ex.id] || 0
                            }))
                        };

                        const success = await logCompletedWorkout(workoutData);
                        if (success) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            resetDailyChecklist();
                            showAlert('SUCCESS', "Workout logged to neural backup.", 'SUCCESS');
                        } else {
                            showAlert('ERROR', "Failed to synchronize workout data.", 'ERROR');
                        }
                    }
                }
            ]
        );
    };

    const todayWorkout = useMemo(() => {
        if (fetchedDays.length === 0) {
            return { title: 'Loading...', exercises: [], dayNumber: 0 };
        }
        const workoutForDay = fetchedDays.find(d => d.dayNumber === effectiveToday);
        if (!workoutForDay) {
            return { title: 'Rest Day', exercises: [], dayNumber: effectiveToday };
        }
        return {
            title: workoutForDay.focus,
            exercises: workoutForDay.exercises || [],
            dayNumber: workoutForDay.dayNumber
        };
    }, [effectiveToday, fetchedDays]);

    const formattedDate = useMemo(() => new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    }).format(new Date()), []);

    const scrollToTab = (tab: 'exercises' | 'water') => {
        if (activeTab !== tab) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setActiveTab(tab);
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                x: tab === 'exercises' ? 0 : SCREEN_WIDTH,
                animated: true
            });
        }
    };

    const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const newIndex = Math.round(offsetX / SCREEN_WIDTH);
        setActiveTab(newIndex === 0 ? 'exercises' : 'water');
    };

    const handleToggleComplete = useCallback((id: string) => {
        toggleExercise(id);
    }, [toggleExercise]);

    const handleUpdateWeight = useCallback((id: string, weight: number) => {
        setWeight(id, weight);
    }, [setWeight]);

    const renderExercise = useCallback(({ item, index }: any) => {
        return (
            <Animated.View entering={FadeInDown.delay(index * 75).duration(400).springify().damping(25).stiffness(250)}>
                <ExerciseCard
                    exercise={item}
                    index={index}
                    isCompleted={!!completedExercises[item.id]}
                    loggedWeight={loggedWeights[item.id]}
                    onToggleComplete={() => handleToggleComplete(item.id)}
                    onUpdateWeight={(weight) => handleUpdateWeight(item.id, weight)}
                />
            </Animated.View>
        );
    }, [completedExercises, loggedWeights, handleToggleComplete, handleUpdateWeight]);

    const renderEmptyComponent = useCallback(() => (
        <View className="flex-1 items-center justify-center mt-20 px-10">
            <Text className="text-textSecondary text-xl font-bold text-center mb-2">RECOVERY DAY</Text>
            <Text className="text-textTertiary text-base text-center leading-relaxed">
                Your muscles grow during rest. Focus on hydration and mobility today.
            </Text>
        </View>
    ), []);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: appTheme.colors.backgroundMain }}>
            <View className="flex-1 pt-4">

                {/* Neo-Technical Header Section */}
                <View style={{ marginBottom: 24, paddingHorizontal: 20 }}>
                    <Text style={{
                        color: appTheme.colors.textSecondary,
                        fontFamily: appTheme.typography.fontFamily.mono,
                        fontSize: 10,
                        letterSpacing: 2,
                        marginBottom: 4,
                        textTransform: 'uppercase'
                    }}>
                        // {formattedDate}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{
                            color: appTheme.colors.textPrimary,
                            ...appTheme.typography.h1,
                            fontSize: 34,
                            textTransform: 'uppercase'
                        }}>
                            {todayWorkout.title}
                        </Text>
                        <View style={{
                            backgroundColor: appTheme.colors.blockFill,
                            paddingVertical: 4,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: appTheme.colors.accent,
                        }}>
                            <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 1 }}>[ ACTIVE ]</Text>
                        </View>
                    </View>
                </View>

                {/* Custom Segmented Control */}
                <SegmentedControl activeTab={activeTab} onTabChange={scrollToTab} />

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
                    <View style={{ width: SCREEN_WIDTH }} className="px-5">
                        {!dismissTempoReminder && (
                            <TempoReminder onDismiss={() => setDismissTempoReminder(true)} />
                        )}

                        <GymPrompt />

                        {isLoading ? (
                            <View className="flex-1 items-center justify-center">
                                <ActivityIndicator size="large" color={appTheme.colors.accent} />
                                <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, marginTop: 16, letterSpacing: 2 }}>[ SYNCING_DATA ]</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={todayWorkout.exercises}
                                keyExtractor={(item) => item.id}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
                                ListEmptyComponent={renderEmptyComponent}
                                renderItem={renderExercise}
                                removeClippedSubviews={false} // Important for layout animations
                                refreshControl={
                                    <RefreshControl
                                        refreshing={isRefreshing}
                                        onRefresh={onRefresh}
                                        tintColor={appTheme.colors.accent}
                                        colors={[appTheme.colors.accent]}
                                    />
                                }
                                ListFooterComponent={
                                    todayWorkout.exercises.length > 0 ? (
                                        <TouchableOpacity
                                            onPress={handleFinishWorkout}
                                            style={{
                                                marginTop: 20,
                                                backgroundColor: appTheme.colors.accent,
                                                paddingVertical: 18,
                                                alignItems: 'center',
                                                borderWidth: 1,
                                                borderColor: 'rgba(255,255,255,0.2)'
                                            }}
                                        >
                                            <Text style={{ color: '#000', fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 14, letterSpacing: 2 }}>FINISH WORKOUT</Text>
                                        </TouchableOpacity>
                                    ) : null
                                }
                            />
                        )}
                    </View>

                    {/* Water Tracker View */}
                    <View style={{ width: SCREEN_WIDTH }}>
                        <WaterTracker />
                    </View>
                </ScrollView>

            </View>
        </SafeAreaView>
    );
}
