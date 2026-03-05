import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WorkoutState {
    // === State ===
    completedExercises: Record<string, boolean>;
    loggedWeights: Record<string, number>;
    dismissTempoReminder: boolean;
    lastActiveDate: string | null;
    waterIntakeML: number;
    waterLogs: { id: string; amount: number; timestamp: number }[];
    scheduleOffset: number; // Persistent shift for workouts (e.g. -1 means everything moved back 1 day)

    // === Actions ===
    toggleExercise: (id: string) => void;
    setWeight: (id: string, weight: number) => void;
    addWater: (ml: number) => void;
    setScheduleOffset: (offset: number) => void;
    resetDailyChecklist: () => void;
    setDismissTempoReminder: (dismiss: boolean) => void;
    checkAndResetAtMidnight: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set, get) => ({
            completedExercises: {},
            loggedWeights: {},
            dismissTempoReminder: false,
            lastActiveDate: new Date().toDateString(),
            waterIntakeML: 0,
            waterLogs: [],
            scheduleOffset: 0,

            toggleExercise: (id) =>
                set((state) => {
                    const isCompletedNow = !state.completedExercises[id];
                    const nextCompleted = {
                        ...state.completedExercises,
                        [id]: isCompletedNow,
                    };

                    // Conditionally fire notification if this was the last exercise checked for today
                    if (isCompletedNow) {
                        const { getTodayWorkout } = require('@/utils/getTodayWorkout');
                        const todayWorkout = getTodayWorkout();
                        const allDone = todayWorkout.exercises.every((ex: { id: string }) => nextCompleted[ex.id]);
                        if (allDone) {
                            const { triggerWorkoutCompleteNotification } = require('@/utils/notifications');
                            triggerWorkoutCompleteNotification();
                        }
                    }

                    return { completedExercises: nextCompleted };
                }),

            setWeight: (id, weight) =>
                set((state) => ({
                    loggedWeights: {
                        ...state.loggedWeights,
                        [id]: weight,
                    },
                })),

            addWater: (ml: number) =>
                set((state) => ({
                    waterIntakeML: state.waterIntakeML + ml,
                    waterLogs: [
                        { id: Date.now().toString() + Math.random().toString(), amount: ml, timestamp: Date.now() },
                        ...state.waterLogs
                    ],
                })),

            setScheduleOffset: (offset: number) => {
                set({ scheduleOffset: offset });
                // Re-schedule alarms to match the new workout day layout for each physical day
                const { requestPermissionsAndSchedule } = require('@/utils/notifications');
                requestPermissionsAndSchedule(true);
            },

            resetDailyChecklist: () =>
                set({
                    completedExercises: {},
                    waterIntakeML: 0,
                    waterLogs: [],
                    lastActiveDate: new Date().toDateString(),
                }),

            setDismissTempoReminder: (dismiss) =>
                set({ dismissTempoReminder: dismiss }),

            checkAndResetAtMidnight: () => {
                const { lastActiveDate, resetDailyChecklist } = get();
                const currentDate = new Date().toDateString();

                // If the date has changed, reset the daily checklist
                if (lastActiveDate !== currentDate) {
                    resetDailyChecklist();
                }
            },
        }),
        {
            name: 'workout-storage', // unique name
            storage: createJSONStorage(() => ({
                setItem: async (name: string, value: string) => {
                    try {
                        await AsyncStorage.setItem(name, value);
                    } catch (_) {
                        // Silent failure on storage error
                    }
                },
                getItem: async (name: string) => {
                    try {
                        return await AsyncStorage.getItem(name);
                    } catch (_) {
                        // Silent failure on storage error
                        return null;
                    }
                },
                removeItem: async (name: string) => {
                    try {
                        await AsyncStorage.removeItem(name);
                    } catch (_) {
                        // Silent failure on storage error
                    }
                },
            })),
            // We only want to persist specific fields to AsyncStorage
            partialize: (state) => ({
                loggedWeights: state.loggedWeights,
                dismissTempoReminder: state.dismissTempoReminder,
                lastActiveDate: state.lastActiveDate,
                waterIntakeML: state.waterIntakeML,
                waterLogs: state.waterLogs,
                scheduleOffset: state.scheduleOffset,
                // Optional: you can choose to persist completedExercises if you want them to survive app unloads during the same day. 
                // We persist it here, but `checkAndResetAtMidnight` handles clearing it on a new day.
                completedExercises: state.completedExercises,
            }),
            onRehydrateStorage: () => (state) => {
                // As soon as the store rehydrates from AsyncStorage, check if it's a new day
                if (state) {
                    state.checkAndResetAtMidnight();
                }
            },
        }
    )
);
