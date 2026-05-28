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

export interface PurchaseLog {
    userId: string;
    itemName: string;
    cost: number;
    category: 'monthly' | 'weekly' | 'daily';
    date: string; // YYYY-MM-DD
    timestamp: any;
}

export const ExpenseService = {
    /**
     * Log a purchase to Firestore
     */
    logPurchase: async (purchaseData: Omit<PurchaseLog, 'userId' | 'timestamp'>) => {
        try {
            const db = getFirestore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) throw new Error("No authenticated user found");

            const docRef = await addDoc(collection(db, 'purchase_logs'), {
                ...purchaseData,
                userId: user.uid,
                timestamp: serverTimestamp(),
            });
            console.log("Purchase successfully logged to Firestore with ID:", docRef.id);
            return true;
        } catch (error) {
            console.error("Error logging purchase to Firestore:", error);
            return false;
        }
    }
};
