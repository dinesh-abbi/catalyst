import { ExerciseCard } from '@/components/ExerciseCard';
import { AnatomyModal } from '@/components/AnatomyModal';
import { GymPrompt } from '@/components/GymPrompt';
import { TempoReminder } from '@/components/TempoReminder';
import { WaterTracker } from '@/components/WaterTracker';
import { AiInsightCard } from '@/components/AiInsightCard';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import appTheme from '@/theme';
import { fetchExercises, logCompletedWorkout } from '@/utils/WorkoutService';
import { useAlertStore } from '@/store/useAlertStore';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, Text, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
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
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'exercises' | 'water'>('exercises');
    const [fetchedDays, setFetchedDays] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAnatomyVisible, setIsAnatomyVisible] = useState(false);

    const [todayDate, setTodayDate] = useState(new Date());

    useEffect(() => {
        const fetchInterval = setInterval(() => {
            const now = new Date();
            if (now.getDate() !== todayDate.getDate()) {
                setTodayDate(now);
                checkAndResetAtMidnight();
            }
        }, 60000); // Check every minute
        return () => clearInterval(fetchInterval);
    }, [todayDate]);

    const currentPhysicalDay = useMemo(() => {
        const jsDay = todayDate.getDay();
        return jsDay === 0 ? 7 : jsDay;
    }, [todayDate]);

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
                setTodayDate(new Date());
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
            if (isLoading) {
                return { title: 'Loading...', exercises: [], dayNumber: 0, anatomyFocus: [] };
            }
            // Failsafe: if not loading and fetchedDays is empty, fall back to local workout generator
            try {
                const { getTodayWorkout } = require('@/utils/getTodayWorkout');
                const fallbackWorkout = getTodayWorkout(effectiveToday);
                return {
                    title: fallbackWorkout.title,
                    exercises: fallbackWorkout.exercises || [],
                    dayNumber: fallbackWorkout.dayNumber,
                    anatomyFocus: (fallbackWorkout as any).anatomyFocus || []
                };
            } catch (e) {
                return { title: 'Rest Day', exercises: [], dayNumber: effectiveToday, anatomyFocus: ["abs"] };
            }
        }
        const workoutForDay = fetchedDays.find(d => Number(d.dayNumber) === Number(effectiveToday));
        if (!workoutForDay) {
            return { title: 'Rest Day', exercises: [], dayNumber: effectiveToday, anatomyFocus: ["abs"] };
        }
        return {
            title: workoutForDay.focus,
            exercises: workoutForDay.exercises || [],
            dayNumber: Number(workoutForDay.dayNumber),
            anatomyFocus: (workoutForDay as any).anatomyFocus || []
        };
    }, [effectiveToday, fetchedDays, isLoading]);

    const formattedDate = useMemo(() => new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    }).format(todayDate), [todayDate]);

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
            <KeyboardAvoidingView 
                className="flex-1 pt-4"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >

                {/* Neo-Technical Header Section */}
                <View style={{ marginBottom: 24, paddingHorizontal: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{
                            color: appTheme.colors.textSecondary,
                            fontFamily: appTheme.typography.fontFamily.mono,
                            fontSize: 10,
                            letterSpacing: 2,
                            textTransform: 'uppercase'
                        }}>
                            // {formattedDate}
                        </Text>
                        
                        <TouchableOpacity 
                            onPress={() => router.push('/weekly')}
                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 }}
                        >
                            <Feather name="calendar" size={10} color={appTheme.colors.accent} style={{ marginRight: 4 }} />
                            <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 9, letterSpacing: 1 }}>[ WEEKLY PLAN ]</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ marginBottom: 12 }}>
                        <Text style={{
                            color: appTheme.colors.textPrimary,
                            ...appTheme.typography.h1,
                            fontSize: 28, // Reduced from 34 for better fit
                            textTransform: 'uppercase',
                            lineHeight: 34,
                        }}
                        numberOfLines={2}
                        adjustsFontSizeToFit
                        >
                            {todayWorkout.title}
                        </Text>
                    </View>

                    {/* Action Bar */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {todayWorkout.anatomyFocus.length > 0 && (
                            <TouchableOpacity 
                                onPress={() => setIsAnatomyVisible(true)}
                                activeOpacity={0.7}
                                style={{
                                    backgroundColor: 'rgba(204, 255, 0, 0.1)',
                                    borderWidth: 1,
                                    borderColor: appTheme.colors.accent,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    flexDirection: 'row',
                                    alignItems: 'center'
                                }}
                            >
                                <Feather name="layers" size={12} color={appTheme.colors.accent} style={{ marginRight: 6 }} />
                                <Text style={{
                                    color: appTheme.colors.accent,
                                    fontFamily: appTheme.typography.fontFamily.monoBold,
                                    fontSize: 10,
                                    letterSpacing: 1
                                }}>[ VIEW ANATOMY ]</Text>
                            </TouchableOpacity>
                        )}
                        <View style={{
                            backgroundColor: appTheme.colors.blockFill,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: appTheme.colors.accent,
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <View style={{ width: 6, height: 6, backgroundColor: appTheme.colors.accent, borderRadius: 3, marginRight: 8 }} />
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
                                        <View>
                                            <AiInsightCard 
                                                workoutLog={{
                                                    title: todayWorkout.title,
                                                    exercises: todayWorkout.exercises.map((ex: any) => ({
                                                        ...ex,
                                                        isCompleted: !!completedExercises[ex.id],
                                                        weight: loggedWeights[ex.id] || 0
                                                    }))
                                                }}
                                            />
                                            <TouchableOpacity
                                                onPress={handleFinishWorkout}
                                                style={{
                                                    marginTop: 10,
                                                    backgroundColor: appTheme.colors.accent,
                                                    paddingVertical: 18,
                                                    alignItems: 'center',
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(255,255,255,0.2)'
                                                }}
                                            >
                                                <Text style={{ color: '#000', fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 14, letterSpacing: 2 }}>FINISH WORKOUT</Text>
                                            </TouchableOpacity>
                                        </View>
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

            </KeyboardAvoidingView>
            <AnatomyModal 
                visible={isAnatomyVisible} 
                onClose={() => setIsAnatomyVisible(false)} 
                anatomyFocus={todayWorkout.anatomyFocus} 
            />
        </SafeAreaView>
    );
}
