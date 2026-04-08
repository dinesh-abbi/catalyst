import { 
    addDoc, 
    collection, 
    getDocs, 
    getFirestore, 
    serverTimestamp, 
    writeBatch,
    doc
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import workoutDataJSON from '@/data/workoutData.json';

// Get instances
const db = getFirestore();
const auth = getAuth();

/**
 * Service to handle workout-related Firestore operations
 */
export const uploadInitialData = async () => {
    try {
        const batch = writeBatch(db);
        const collectionRef = collection(db, 'exercises');
        
        for (const day of workoutDataJSON) {
            const docRef = doc(collectionRef, `day_${day.dayNumber}`);
            batch.set(docRef, day);
        }

        await batch.commit();
        console.log("Initial data successfully uploaded to Firestore!");
    } catch (error) {
        console.error("Error uploading initial data:", error);
    }
};

/**
 * Fetch exercises from Firestore
 */
export const fetchExercises = async () => {
    try {
        const snapshot = await getDocs(collection(db, 'exercises'));
        const data = snapshot.docs.map(doc => doc.data());
        return data as any[];
    } catch (error) {
        console.error("Error fetching exercises:", error);
        return [];
    }
};

/**
 * Log a completed workout session
 */
export const logCompletedWorkout = async (workoutData: any) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user found");

        // Filter out undefined fields to avoid Firestore error
        const cleanData = Object.fromEntries(
            Object.entries(workoutData).filter(([_, v]) => v !== undefined)
        );

        const docRef = await addDoc(collection(db, 'workout_logs'), {
            ...cleanData,
            userId: user.uid,
            completedAt: serverTimestamp(),
        });
        console.log("Workout session successfully logged to Firestore with ID:", docRef.id);
        return true;
    } catch (error) {
        console.error("Error logging workout session:", error);
        return false;
    }
};
