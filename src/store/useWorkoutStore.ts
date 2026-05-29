import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Exercise {
    id: string;
    name: string;
    sets: string;
    reps: string;
    tempo: string;
    notes: string;
    isCardio?: boolean;
}

export interface WorkoutDayRaw {
    dayNumber: number;
    assignedDay: string;
    focus: string;
    isRecovery: boolean;
    exercises: Exercise[];
}

interface WorkoutState {
    // === State ===
    completedExercises: Record<string, boolean>;
    loggedWeights: Record<string, number>;
    dismissTempoReminder: boolean;
    lastActiveDate: string | null;
    waterIntakeML: number;
    waterLogs: { id: string; amount: number; timestamp: number }[];
    scheduleOffset: number; // Persistent shift for workouts (e.g. -1 means everything moved back 1 day)
    gymMorningPromptStatus: 'none' | 'yes' | 'no';
    gymEveningPromptStatus: 'none' | 'yes' | 'no';
    customWorkoutDays: WorkoutDayRaw[] | null;

    // === Actions ===
    toggleExercise: (id: string) => void;
    setWeight: (id: string, weight: number) => void;
    addWater: (ml: number) => void;
    setScheduleOffset: (offset: number) => void;
    setGymMorningPromptStatus: (status: 'none' | 'yes' | 'no') => void;
    setGymEveningPromptStatus: (status: 'none' | 'yes' | 'no') => void;
    resetDailyChecklist: () => void;
    setDismissTempoReminder: (dismiss: boolean) => void;
    checkAndResetAtMidnight: () => void;
    setCustomWorkoutDays: (days: WorkoutDayRaw[] | null) => void;
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
            gymMorningPromptStatus: 'none',
            gymEveningPromptStatus: 'none',
            customWorkoutDays: null,

            setCustomWorkoutDays: (days) => set({ customWorkoutDays: days }),

            toggleExercise: (id) =>
                set((state) => {
                    const isCompletedNow = !state.completedExercises[id];
                    const nextCompleted = {
                        ...state.completedExercises,
                        [id]: isCompletedNow,
                    };

                    // Conditionally fire notification if this was the last exercise checked for today
                    if (isCompletedNow) {
                        try {
                            const { getTodayWorkout } = require('@/utils/getTodayWorkout');
                            const todayWorkout = getTodayWorkout();
                            const allDone = todayWorkout.exercises.every((ex: { id: string }) => nextCompleted[ex.id]);
                            if (allDone) {
                                const { triggerWorkoutCompleteNotification } = require('@/utils/notifications');
                                triggerWorkoutCompleteNotification();
                            }
                        } catch (e) {
                            console.warn('[store] Notification trigger failed:', e);
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
                // Re-schedule alarms to match the new workout day layout
                try {
                    const { requestPermissionsAndSchedule } = require('@/utils/notifications');
                    requestPermissionsAndSchedule(true);
                } catch (e) {
                    console.warn('[store] Notification reschedule failed:', e);
                }
            },

            setGymMorningPromptStatus: (status) => set({ gymMorningPromptStatus: status }),
            setGymEveningPromptStatus: (status) => set({ gymEveningPromptStatus: status }),

            resetDailyChecklist: () =>
                set({
                    completedExercises: {},
                    loggedWeights: {},
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
                    set({ gymMorningPromptStatus: 'none', gymEveningPromptStatus: 'none' });
                    // Reset schedule offset on Monday
                    if (new Date().getDay() === 1) {
                        set({ scheduleOffset: 0 });
                    }
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
                gymMorningPromptStatus: state.gymMorningPromptStatus,
                gymEveningPromptStatus: state.gymEveningPromptStatus,
                completedExercises: state.completedExercises,
                customWorkoutDays: state.customWorkoutDays,
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
