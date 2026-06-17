import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const DAILY_WATER_GOAL = 8; // 8 glasses of water

interface WaterState {
    // === State ===
    glassesDrank: number;
    lastActiveDate: string | null;

    // === Actions ===
    addWater: () => void;
    removeWater: () => void;
    checkAndResetAtMidnight: () => void;
}

export const useWaterStore = create<WaterState>()(
    persist(
        (set, get) => ({
            glassesDrank: 0,
            lastActiveDate: new Date().toDateString(),

            addWater: () =>
                set((state) => ({
                    glassesDrank: Math.min(state.glassesDrank + 1, 20), // Cap at 20 glasses safely
                })),

            removeWater: () =>
                set((state) => ({
                    glassesDrank: Math.max(state.glassesDrank - 1, 0),
                })),

            checkAndResetAtMidnight: () => {
                const { lastActiveDate } = get();
                const currentDate = new Date().toDateString();

                // If the date has changed, reset the daily count
                if (lastActiveDate !== currentDate) {
                    set({
                        glassesDrank: 0,
                        lastActiveDate: currentDate,
                    });
                }
            },
        }),
        {
            name: 'water-storage',
            storage: createJSONStorage(() => ({
                setItem: async (name: string, value: string) => {
                    try {
                        await AsyncStorage.setItem(name, value);
                    } catch (_) { }
                },
                getItem: async (name: string) => {
                    try {
                        return await AsyncStorage.getItem(name);
                    } catch (_) {
                        return null;
                    }
                },
                removeItem: async (name: string) => {
                    try {
                        await AsyncStorage.removeItem(name);
                    } catch (_) { }
                },
            })),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.checkAndResetAtMidnight();
                }
            },
        }
    )
);
