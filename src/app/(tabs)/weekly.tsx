import React, { useState, memo } from 'react';
import { View, Text, FlatList, SafeAreaView, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { workoutData, WorkoutDayRaw, Exercise } from '@/utils/getTodayWorkout';

const ReadOnlyExerciseCard = memo(({ exercise }: { exercise: Exercise }) => {
    const isCardio = !!exercise.isCardio;
    return (
        <View className="bg-backgroundCard rounded-2xl p-5 mb-4 border border-slate-800">
            <Text className="text-xl font-bold text-textPrimary mb-4">{exercise.name}</Text>

            <View className="flex-row items-center justify-between bg-backgroundMain rounded-xl p-3 mb-4">
                <View className="flex-1 flex-row items-center gap-x-6">
                    <View>
                        <Text className="text-textSecondary text-xs uppercase font-bold tracking-wider mb-1">
                            {isCardio ? 'Type' : 'Sets'}
                        </Text>
                        <Text className="font-semibold text-lg text-textPrimary">
                            {isCardio ? exercise.tempo : exercise.sets}
                        </Text>
                    </View>
                    <View>
                        <Text className="text-textSecondary text-xs uppercase font-bold tracking-wider mb-1">
                            {isCardio ? 'Sets' : 'Reps'}
                        </Text>
                        <Text className="font-semibold text-lg text-textPrimary">
                            {isCardio ? exercise.sets : exercise.reps}
                        </Text>
                    </View>
                </View>
            </View>

            <View className="bg-slate-800/30 rounded-lg p-3">
                <Text className="text-sm leading-tight text-textSecondary">
                    <Text className="font-bold">Note:</Text> {exercise.notes}
                </Text>
            </View>
        </View>
    );
});

export default function WeeklyOverviewScreen() {
    const [selectedDay, setSelectedDay] = useState<WorkoutDayRaw | null>(null);
    const insets = useSafeAreaInsets();

    const currentDayIndex = new Date().getDay();
    const mappedDayNumber = currentDayIndex === 0 ? 7 : currentDayIndex;

    return (
        <SafeAreaView className="flex-1 bg-backgroundMain">
            <ScrollView className="flex-1 px-5 pt-8" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
                <View className="mb-6">
                    <Text className="text-header uppercase text-3xl font-extrabold tracking-tight mb-2">
                        Weekly Overview
                    </Text>
                    <Text className="text-textSecondary text-sm leading-relaxed">
                        Your 7-day training split.
                    </Text>
                </View>

                <View>
                    {workoutData.map((day) => {
                        const isToday = day.dayNumber === mappedDayNumber;
                        return (
                            <TouchableOpacity
                                key={day.dayNumber}
                                activeOpacity={0.7}
                                onPress={() => setSelectedDay(day)}
                                className={`mb-4 rounded-2xl p-5 border ${isToday ? 'bg-accent/10 border-accent/60' : 'bg-backgroundCard border-slate-800'}`}
                            >
                                <View className="flex-row items-center justify-between mb-1">
                                    <Text className={`font-bold tracking-wider uppercase text-sm ${isToday ? 'text-accent' : 'text-textSecondary'}`}>
                                        {day.assignedDay} {isToday && '(TODAY)'}
                                    </Text>
                                    <Text className={`font-black text-lg ${isToday ? 'text-accent' : 'text-slate-600'}`}>
                                        Day {day.dayNumber}
                                    </Text>
                                </View>
                                <Text className={`text-xl font-bold ${isToday ? 'text-textPrimary' : 'text-slate-300'}`}>
                                    {day.focus}
                                </Text>
                                {day.isRecovery && (
                                    <View className="mt-3 bg-slate-800/50 self-start px-3 py-1 rounded-full">
                                        <Text className="text-xs font-semibold text-textSecondary uppercase tracking-widest">
                                            Recovery Strategy
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <Modal
                visible={!!selectedDay}
                animationType="slide"
                presentationStyle="pageSheet"
                hardwareAccelerated={true}
                onRequestClose={() => setSelectedDay(null)}
            >
                <View className="flex-1 bg-backgroundMain pt-6 px-5" style={{ paddingBottom: insets.bottom }}>
                    <View className="flex-row justify-between items-start mb-6 mt-4">
                        <View className="flex-1 pr-4">
                            <Text className="text-accent text-sm font-bold tracking-widest uppercase mb-1">{selectedDay?.assignedDay}</Text>
                            <Text className="text-3xl font-extrabold text-textPrimary leading-tight">{selectedDay?.focus}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setSelectedDay(null)}
                            className="bg-slate-800 p-3 rounded-full justify-center items-center"
                        >
                            <Text className="text-textPrimary font-bold">✕</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={selectedDay?.exercises || []}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        renderItem={({ item }) => <ReadOnlyExerciseCard exercise={item} />}
                    />
                </View>
            </Modal>
        </SafeAreaView>
    );
}
