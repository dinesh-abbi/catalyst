import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
    hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    // Add your state properties here
    userToken: string | null;
    setUserToken: (token: string | null) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            hasHydrated: false,
            setHasHydrated: (state) => set({ hasHydrated: state }),
            userToken: null,
            setUserToken: (token) => set({ userToken: token }),
        }),
        {
            name: 'uponetraining-storage',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
