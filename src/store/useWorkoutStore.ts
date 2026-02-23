import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayWorkout } from '@/utils/getTodayWorkout';
import { triggerWorkoutCompleteNotification } from '@/utils/notifications';

interface WorkoutState {
    // === State ===
    completedExercises: Record<string, boolean>;
    loggedWeights: Record<string, number>;
    dismissTempoReminder: boolean;
    lastActiveDate: string | null;

    // === Actions ===
    toggleExercise: (id: string) => void;
    setWeight: (id: string, weight: number) => void;
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
            lastActiveDate: new Date().toDateString(), // Store the date string to check against

            toggleExercise: (id) =>
                set((state) => {
                    const isCompletedNow = !state.completedExercises[id];
                    const nextCompleted = {
                        ...state.completedExercises,
                        [id]: isCompletedNow,
                    };

                    // Conditionally fire notification if this was the last exercise checked for today
                    if (isCompletedNow) {
                        const todayWorkout = getTodayWorkout();
                        const allDone = todayWorkout.exercises.every(ex => nextCompleted[ex.id]);
                        if (allDone) {
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

            resetDailyChecklist: () =>
                set({
                    completedExercises: {},
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
                    } catch (error) {
                        // Silent failure on storage error
                    }
                },
                getItem: async (name: string) => {
                    try {
                        return await AsyncStorage.getItem(name);
                    } catch (error) {
                        // Silent failure on storage error
                        return null;
                    }
                },
                removeItem: async (name: string) => {
                    try {
                        await AsyncStorage.removeItem(name);
                    } catch (error) {
                        // Silent failure on storage error
                    }
                },
            })),
            // We only want to persist specific fields to AsyncStorage
            partialize: (state) => ({
                loggedWeights: state.loggedWeights,
                dismissTempoReminder: state.dismissTempoReminder,
                lastActiveDate: state.lastActiveDate,
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
