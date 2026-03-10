import { useWorkoutStore } from '@/store/useWorkoutStore';
import appTheme from '@/theme';
import { Exercise, workoutData, WorkoutDayRaw } from '@/utils/getTodayWorkout';
import { Feather } from '@expo/vector-icons';
import React, { memo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ReadOnlyExerciseCard = memo(({ exercise }: { exercise: Exercise }) => {
    const isCardio = !!exercise.isCardio;
    return (
        <View style={{ backgroundColor: appTheme.colors.backgroundCard, borderColor: 'rgba(51, 65, 85, 0.4)', borderWidth: 1 }} className="rounded-[24px] p-6 mb-4">
            <View className="flex-row items-center mb-4">
                <View style={{ width: 4, height: 16, backgroundColor: appTheme.colors.accent, borderRadius: 2, marginRight: 10 }} />
                <Text style={{ color: appTheme.colors.textPrimary }} className="text-lg font-black tracking-tight flex-1">{exercise.name}</Text>
            </View>

            <View className="flex-row items-center justify-between bg-[#0b0f19] rounded-[18px] p-4 mb-4 border border-slate-800/30">
                <View className="flex-row items-center flex-1">
                    <View className="mr-8">
                        <Text style={{ color: appTheme.colors.textTertiary }} className="text-[10px] font-black tracking-widest uppercase mb-1">{isCardio ? 'TYPE' : 'SETS'}</Text>
                        <Text style={{ color: appTheme.colors.textPrimary }} className="font-black text-lg">{isCardio ? exercise.tempo : exercise.sets}</Text>
                    </View>
                    <View>
                        <Text style={{ color: appTheme.colors.textTertiary }} className="text-[10px] font-black tracking-widest uppercase mb-1">{isCardio ? 'SETS' : 'REPS'}</Text>
                        <Text style={{ color: appTheme.colors.textPrimary }} className="font-black text-lg">{isCardio ? exercise.sets : exercise.reps}</Text>
                    </View>
                </View>

                <View style={{ backgroundColor: '#161e2e', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Text style={{ color: appTheme.colors.accent }} className="text-[10px] font-bold uppercase tracking-widest">{isCardio ? 'CARDIO' : 'STRENGTH'}</Text>
                </View>
            </View>

            {exercise.notes && (
                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: appTheme.colors.accent }}>
                    <Text style={{ color: appTheme.colors.textSecondary }} className="text-xs italic leading-snug">
                        {exercise.notes}
                    </Text>
                </View>
            )}
        </View>
    );
});
ReadOnlyExerciseCard.displayName = 'ReadOnlyExerciseCard';

export default function WeeklyOverviewScreen() {
    type ShiftedDay = WorkoutDayRaw & { physicalDayNum: number, physicalDayName: string };
    const [selectedDay, setSelectedDay] = useState<ShiftedDay | null>(null);
    const [isShifting, setIsShifting] = useState(false);
    const insets = useSafeAreaInsets();
    const { scheduleOffset, setScheduleOffset } = useWorkoutStore();

    const currentDayIndex = new Date().getDay();
    const currentPhysicalDay = currentDayIndex === 0 ? 7 : currentDayIndex;

    const shiftedWorkoutData = workoutData.map(day => {
        const physicalDayNum = ((day.dayNumber - 1 - scheduleOffset) % 7 + 7) % 7 + 1;
        return {
            ...day,
            physicalDayNum,
            physicalDayName: DAY_NAMES[physicalDayNum - 1]
        };
    }).sort((a, b) => a.physicalDayNum - b.physicalDayNum);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: appTheme.colors.backgroundMain }}>
            <ScrollView className="flex-1 px-6 pt-10" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.duration(600)} className="mb-10 flex-row justify-between items-end">
                    <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                            <View style={{ width: 12, height: 2, backgroundColor: appTheme.colors.accent, marginRight: 8 }} />
                            <Text style={{ color: appTheme.colors.accent }} className="text-[10px] font-black tracking-[3px] uppercase">Training Split</Text>
                        </View>
                        <Text style={{ color: appTheme.colors.textPrimary }} className="text-4xl font-black tracking-tighter">
                            WEEKLY
                        </Text>
                    </View>

                    {scheduleOffset !== 0 && (
                        <TouchableOpacity
                            onPress={() => setScheduleOffset(0)}
                            style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.2)', borderWidth: 1 }}
                            className="px-4 py-2 rounded-xl flex-row items-center"
                        >
                            <Feather name="refresh-ccw" size={12} color={appTheme.colors.accent} />
                            <Text style={{ color: appTheme.colors.accent }} className="text-[10px] font-black ml-2 uppercase tracking-widest">
                                RESET
                            </Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>

                <View>
                    {shiftedWorkoutData.map((day, index) => {
                        const isToday = day.physicalDayNum === currentPhysicalDay;
                        return (
                            <Animated.View key={day.dayNumber} entering={FadeInDown.delay(index * 100).duration(500)}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setSelectedDay(day)}
                                    style={{
                                        backgroundColor: isToday ? 'rgba(56, 189, 248, 0.05)' : appTheme.colors.backgroundCard,
                                        borderColor: isToday ? 'rgba(56, 189, 248, 0.3)' : 'rgba(51, 65, 85, 0.2)',
                                        borderWidth: 1,
                                        marginBottom: 16,
                                        borderRadius: 24,
                                        padding: 24
                                    }}
                                >
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text style={{ color: isToday ? appTheme.colors.accent : appTheme.colors.textTertiary }} className="font-black tracking-[2px] uppercase text-[10px]">
                                            {day.physicalDayName} {isToday && '• TODAY'}
                                        </Text>
                                        <Text style={{ color: isToday ? appTheme.colors.accent : 'rgba(148, 163, 184, 0.3)' }} className="font-black text-xs uppercase tracking-widest">
                                            DAY {day.dayNumber}
                                        </Text>
                                    </View>
                                    <Text style={{ color: isToday ? appTheme.colors.textPrimary : 'rgba(248, 250, 252, 0.8)' }} className="text-2xl font-black tracking-tight">
                                        {day.focus}
                                    </Text>

                                    {day.isRecovery && (
                                        <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 12 }}>
                                            <Text style={{ color: appTheme.colors.accentSecondary }} className="text-[10px] font-black uppercase tracking-widest">
                                                RECOVERY DAY
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>
            </ScrollView>

            <Modal
                visible={!!selectedDay}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectedDay(null)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(11, 15, 25, 0.98)' }}>
                    <SafeAreaView className="flex-1 px-6 pt-10">
                        <View className="flex-row justify-between items-start mb-10">
                            <View className="flex-1 pr-4">
                                <View className="flex-row items-center mb-1">
                                    <View style={{ width: 8, height: 2, backgroundColor: appTheme.colors.accent, marginRight: 6 }} />
                                    <Text style={{ color: appTheme.colors.accent }} className="text-[10px] font-black tracking-widest uppercase">{selectedDay?.assignedDay}</Text>
                                </View>
                                <Text style={{ color: appTheme.colors.textPrimary }} className="text-4xl font-black tracking-tighter">{selectedDay?.focus}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setSelectedDay(null)}
                                style={{ backgroundColor: '#161e2e', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(51, 65, 85, 0.4)' }}
                            >
                                <Feather name="x" size={20} color={appTheme.colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {selectedDay && selectedDay.physicalDayNum !== currentPhysicalDay && (
                            <TouchableOpacity
                                disabled={isShifting}
                                onPress={() => {
                                    setIsShifting(true);
                                    setTimeout(() => {
                                        let newOffset = selectedDay.dayNumber - currentPhysicalDay;
                                        if (newOffset > 3) newOffset -= 7;
                                        if (newOffset < -3) newOffset += 7;

                                        setScheduleOffset(newOffset);
                                        setIsShifting(false);
                                        setSelectedDay(null);
                                    }, 800);
                                }}
                                style={{
                                    backgroundColor: appTheme.colors.accent,
                                    paddingVertical: 18,
                                    borderRadius: 20,
                                    marginBottom: 32,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    shadowColor: appTheme.colors.accent,
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 12,
                                    elevation: 8
                                }}
                            >
                                {isShifting ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Feather name="zap" size={16} color="#fff" style={{ marginRight: 10 }} />
                                        <Text className="text-white font-black uppercase tracking-widest text-xs">
                                            ACTIVATE THIS WORKOUT
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        <FlatList
                            data={selectedDay?.exercises || []}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            renderItem={({ item, index }) => (
                                <Animated.View entering={FadeInRight.delay(index * 50)}>
                                    <ReadOnlyExerciseCard exercise={item} />
                                </Animated.View>
                            )}
                        />
                    </SafeAreaView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
