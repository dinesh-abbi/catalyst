import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { UserService } from '@/utils/UserService';

interface DietState {
    currentDay: number;
    startDate: string | null; // ISO Date String
    mealLogs: Record<number, Record<string, { status: 'eaten' | 'missed' | 'alternative' | 'none', note?: string }>>;
    boughtItems: Record<string, boolean>;
    purchaseHistory: { id?: string, itemName: string, cost: number, date: string, timestamp?: string, type?: 'food' | 'supplements' | 'gear' | 'misc', reason?: string, isManual?: boolean }[];

    setCurrentDay: (day: number) => void;
    nextDay: () => void;
    prevDay: () => void;
    updateMealStatus: (day: number, mealType: string, status: 'eaten' | 'missed' | 'alternative' | 'none', note?: string) => void;
    toggleBoughtItem: (itemName: string, cost: number) => void;
    resetBoughtItems: () => void;
    addManualExpense: (itemName: string, cost: number, reason: string, type: 'food' | 'supplements' | 'gear' | 'misc', timestampOverride?: string) => void;
    updateExpense: (id: string, data: Partial<{ itemName: string, cost: number, timestamp: string, type: string, reason: string }>) => void;
    deleteExpense: (id: string) => void;
    initializeCycle: (dayFromToday: number) => void;
    syncToDate: () => void;
    getMonthlyTotal: () => number;
    setPurchaseHistory: (history: any[]) => void;
}

const SHOPPING_DAYS = [1, 8, 15, 22];

export const useDietStore = create<DietState>()(
    persist(
        (set, get) => ({
            currentDay: 1,
            startDate: null,
            mealLogs: {},
            boughtItems: {},
            purchaseHistory: [],

            setCurrentDay: (day) => {
                const prevDay = get().currentDay;
                if (SHOPPING_DAYS.includes(day) && day !== prevDay) {
                    set({ boughtItems: {} });
                }
                set({ currentDay: day });
            },
            nextDay: () => {
                const next = get().currentDay >= 28 ? 1 : get().currentDay + 1;
                if (SHOPPING_DAYS.includes(next)) {
                    set({ boughtItems: {} });
                }
                set({ currentDay: next });
            },
            prevDay: () => {
                const prev = get().currentDay <= 1 ? 28 : get().currentDay - 1;
                set({ currentDay: prev });
            },
            updateMealStatus: (day, mealType, status, note) =>
                set((state) => {
                    const dayLogs = state.mealLogs[day] || {};
                    return {
                        mealLogs: {
                            ...state.mealLogs,
                            [day]: {
                                ...dayLogs,
                                [mealType]: { status, note },
                            },
                        },
                    };
                }),
            toggleBoughtItem: (itemName, cost) =>
                set((state) => {
                    const isBuying = !state.boughtItems[itemName];
                    const today = new Date().toISOString().split('T')[0];
                    
                    let newHistory = [...state.purchaseHistory];
                    if (isBuying) {
                        const newExpense = { id: Date.now().toString(), itemName, cost, date: today, timestamp: new Date().toISOString(), type: 'food' as const };
                        newHistory.push(newExpense);
                        UserService.logExpense(newExpense).catch(console.error);
                    } else {
                        // Remove the latest instance of this item from history for simplicity
                        const lastIdx = [...newHistory].reverse().findIndex(p => p.itemName === itemName);
                        if (lastIdx !== -1) {
                            const actualIdx = newHistory.length - 1 - lastIdx;
                            newHistory.splice(actualIdx, 1);
                        }
                    }

                    return {
                        boughtItems: {
                            ...state.boughtItems,
                            [itemName]: isBuying,
                        },
                        purchaseHistory: newHistory
                    };
                }),
            resetBoughtItems: () => set({ boughtItems: {} }),
            addManualExpense: (itemName: string, cost: number, reason: string, type: any, timestampOverride?: string) => 
                set((state) => {
                    const now = timestampOverride ? new Date(timestampOverride) : new Date();
                    const today = now.toISOString().split('T')[0];
                    const newExpense = { id: Date.now().toString(), itemName, cost, date: today, timestamp: now.toISOString(), type, reason, isManual: true };
                    
                    UserService.logExpense(newExpense).catch(console.error);

                    return {
                        purchaseHistory: [
                            ...state.purchaseHistory,
                            newExpense
                        ]
                    };
                }),
            updateExpense: (id: string, data: any) => 
                set((state) => {
                    const idx = state.purchaseHistory.findIndex(p => p.id === id);
                    if (idx !== -1) {
                        const updated = { ...state.purchaseHistory[idx], ...data };
                        if (data.timestamp) {
                            updated.date = new Date(data.timestamp).toISOString().split('T')[0];
                        }
                        const newHistory = [...state.purchaseHistory];
                        newHistory[idx] = updated as any;
                        
                        UserService.updateExpenseDB(id, updated).catch(console.error);
                        return { purchaseHistory: newHistory };
                    }
                    return state;
                }),
            deleteExpense: (id: string) => 
                set((state) => {
                    const newHistory = state.purchaseHistory.filter(p => p.id !== id);
                    UserService.deleteExpenseDB(id).catch(console.error);
                    return { purchaseHistory: newHistory };
                }),
            initializeCycle: (dayNumber) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                // Set startDate back by (dayNumber - 1) days
                const start = new Date(today);
                start.setDate(today.getDate() - (dayNumber - 1));
                set({ startDate: start.toISOString(), currentDay: dayNumber });
            },
            syncToDate: () => {
                const { startDate } = get();
                if (!startDate) return;

                const start = new Date(startDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const diffTime = Math.abs(today.getTime() - start.getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const actualDay = (diffDays % 28) + 1;

                if (get().currentDay !== actualDay) {
                    set({ currentDay: actualDay });
                }
            },
            getMonthlyTotal: () => {
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                return get().purchaseHistory
                    .filter(p => {
                        const d = new Date(p.date);
                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    })
                    .reduce((total, p) => total + p.cost, 0);
            },
            setPurchaseHistory: (history) => {
                set({ purchaseHistory: history });
            },
        }),
        {
            name: 'diet-storage',
            storage: createJSONStorage(() => ({
                setItem: async (name: string, value: string) => {
                    try {
                        await AsyncStorage.setItem(name, value);
                    } catch (_) {}
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
                    } catch (_) {}
                },
            })),
            partialize: (state) => ({
                currentDay: state.currentDay,
                startDate: state.startDate,
                mealLogs: state.mealLogs,
                boughtItems: state.boughtItems,
                purchaseHistory: state.purchaseHistory,
            }),
        }
    )
);
