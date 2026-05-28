import { 
    doc, 
    getDoc, 
    getFirestore, 
    setDoc, 
    updateDoc,
    arrayUnion
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

export interface UserProfile {
    uid: string;
    email: string;
    weight: number; // in kg
    height: number; // in cm
    age: number;
    targetWeight: number;
    updatedAt: any;
    expenses?: any[];
}

export const UserService = {
    /**
     * Fetch user profile from Firestore
     */
    getProfile: async (): Promise<UserProfile | null> => {
        try {
            const db = getFirestore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return null;

            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as UserProfile;
            } else {
                // Initialize profile if it doesn't exist
                const initialProfile: UserProfile = {
                    uid: user.uid,
                    email: user.email || '',
                    weight: 0,
                    height: 0,
                    age: 0,
                    targetWeight: 0,
                    updatedAt: new Date(),
                    expenses: [],
                };
                await setDoc(docRef, initialProfile);
                return initialProfile;
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    },

    /**
     * Update user profile in Firestore
     */
    updateProfile: async (data: Partial<UserProfile>) => {
        try {
            const db = getFirestore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return false;

            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, {
                ...data,
                updatedAt: new Date(),
            });
            return true;
        } catch (error) {
            console.error('Error updating user profile:', error);
            return false;
        }
    },

    /**
     * Log a new expense to Firestore array
     */
    logExpense: async (expense: any) => {
        try {
            const db = getFirestore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user || !expense) return false;

            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, {
                expenses: arrayUnion(expense),
            });
            return true;
        } catch (error) {
            console.error('Error logging expense to DB:', error);
            return false;
        }
    },

    /**
     * Update an existing expense by replacing it in the array
     */
    updateExpenseDB: async (id: string, updatedExpense: any) => {
        try {
            const db = getFirestore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user || !id) return false;

            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const expenses = data.expenses || [];
                const updatedExpenses = expenses.map((exp: any) => exp.id === id ? { ...exp, ...updatedExpense } : exp);
                await updateDoc(docRef, { expenses: updatedExpenses });
            }
            return true;
        } catch (error) {
            console.error('Error updating expense in DB:', error);
            return false;
        }
    },

    /**
     * Delete an expense from the array
     */
    deleteExpenseDB: async (id: string) => {
        try {
            const db = getFirestore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user || !id) return false;

            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const expenses = data.expenses || [];
                const updatedExpenses = expenses.filter((exp: any) => exp.id !== id);
                await updateDoc(docRef, { expenses: updatedExpenses });
            }
            return true;
        } catch (error) {
            console.error('Error deleting expense from DB:', error);
            return false;
        }
    }
};
