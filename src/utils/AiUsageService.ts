import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

interface DailyUsageRecord {
    userId: string;
    modelId: string;
    date: string; // YYYY-MM-DD (local device date)
    count: number;
    lastUsed: any;
}

/**
 * Returns today's date as a YYYY-MM-DD string (device local time)
 */
function getTodayString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Returns the Firestore document ID for a user's daily model usage.
 * Format: userId_modelId_YYYY-MM-DD
 */
function getUsageDocId(userId: string, modelId: string, date: string): string {
    const safeModelId = modelId.replace(/[^a-zA-Z0-9-]/g, '_');
    return `${userId}_${safeModelId}_${date}`;
}

export const AiUsageService = {
    /**
     * Fetches the current usage count for a given model for today.
     * Returns 0 if no record exists.
     */
    getTodayUsage: async (modelId: string): Promise<number> => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return 0;

            const db = getFirestore();
            const today = getTodayString();
            const docId = getUsageDocId(user.uid, modelId, today);
            const docRef = doc(db, 'ai_usage', docId);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                return (snap.data() as DailyUsageRecord).count || 0;
            }
            return 0;
        } catch (error) {
            console.error('[AiUsageService] Error fetching usage:', error);
            return 0;
        }
    },

    /**
     * Fetches usage for all tracked models for today.
     * Returns a map of { modelId: count }.
     */
    getAllTodayUsage: async (modelIds: string[]): Promise<Record<string, number>> => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return {};

            const db = getFirestore();
            const today = getTodayString();
            const usageMap: Record<string, number> = {};

            await Promise.all(
                modelIds.map(async (modelId) => {
                    const docId = getUsageDocId(user.uid, modelId, today);
                    const docRef = doc(db, 'ai_usage', docId);
                    const snap = await getDoc(docRef);
                    usageMap[modelId] = snap.exists()
                        ? (snap.data() as DailyUsageRecord).count || 0
                        : 0;
                })
            );

            return usageMap;
        } catch (error) {
            console.error('[AiUsageService] Error fetching all usage:', error);
            return {};
        }
    },

    /**
     * Increments the usage counter for a given model by 1.
     * Creates the record if it doesn't exist.
     */
    incrementUsage: async (modelId: string): Promise<void> => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return;

            const db = getFirestore();
            const today = getTodayString();
            const docId = getUsageDocId(user.uid, modelId, today);
            const docRef = doc(db, 'ai_usage', docId);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                await updateDoc(docRef, {
                    count: increment(1),
                    lastUsed: serverTimestamp(),
                });
            } else {
                const newRecord: DailyUsageRecord = {
                    userId: user.uid,
                    modelId,
                    date: today,
                    count: 1,
                    lastUsed: serverTimestamp(),
                };
                await setDoc(docRef, newRecord);
            }
        } catch (error) {
            console.error('[AiUsageService] Error incrementing usage:', error);
        }
    },
};
