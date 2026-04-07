import { 
    doc, 
    getDoc, 
    getFirestore, 
    setDoc, 
    updateDoc 
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

const db = getFirestore();
const auth = getAuth();

export interface UserProfile {
    uid: string;
    email: string;
    weight: number; // in kg
    height: number; // in cm
    age: number;
    targetWeight: number;
    updatedAt: any;
}

export const UserService = {
    /**
     * Fetch user profile from Firestore
     */
    getProfile: async (): Promise<UserProfile | null> => {
        try {
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
    }
};
