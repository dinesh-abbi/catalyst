import { 
    addDoc, 
    collection, 
    getFirestore, 
    serverTimestamp,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

export type MealStatus = 'eaten' | 'missed' | 'alternative';

export interface MealLog {
    userId: string;
    date: string; // YYYY-MM-DD
    dayOfCycle: number;
    mealType: string; // breakfast, lunch, etc.
    status: MealStatus;
    alternativeNote?: string;
    timestamp: any;
}

export const NutritionService = {
    /**
     * Log a meal action to Firestore
     */
    logMeal: async (logData: Omit<MealLog, 'userId' | 'timestamp'>) => {
        try {
            const db = getFirestore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) throw new Error("No authenticated user found");

            // Filter out undefined fields to avoid Firestore error
            const cleanData = Object.fromEntries(
                Object.entries(logData).filter(([_, v]) => v !== undefined)
            );

            const docRef = await addDoc(collection(db, 'nutrition_logs'), {
                ...cleanData,
                userId: user.uid,
                timestamp: serverTimestamp(),
            });
            console.log("Meal successfully logged to Firestore with ID:", docRef.id);
            return true;
        } catch (error) {
            console.error("Error logging meal to Firestore:", error);
            return false;
        }
    }
};
