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

/**
 * Service to handle workout-related Firestore operations
 */
export const uploadInitialData = async () => {
    try {
        const db = getFirestore();
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
 * Fetch exercises from Firestore with robust local fallback and automatic seeding
 */
export const fetchExercises = async () => {
    try {
        const db = getFirestore();
        console.log("WorkoutService: Fetching exercises from Firestore...");
        const snapshot = await getDocs(collection(db, 'exercises'));
        console.log(`WorkoutService: Fetched snapshot successfully. Document count: ${snapshot.size}`);
        
        if (snapshot.empty) {
            console.log("WorkoutService: Exercises collection is empty in Firestore. Seeding initial data...");
            // Seed in the background so the user gets an instant fallback response
            uploadInitialData().catch(err => 
                console.error("WorkoutService: Error seeding initial data in background:", err)
            );
            return workoutDataJSON as any[];
        }
        
        const data = snapshot.docs.map(doc => {
            const docData = doc.data();
            console.log(`WorkoutService: Loaded doc ID: ${doc.id}, dayNumber: ${docData.dayNumber} (type: ${typeof docData.dayNumber})`);
            return docData;
        });
        
        // Sort by dayNumber to ensure consistent ordered days
        data.sort((a: any, b: any) => Number(a.dayNumber || 0) - Number(b.dayNumber || 0));
        return data as any[];
    } catch (error) {
        console.error("WorkoutService: Error fetching exercises from Firestore, falling back to local JSON:", error);
        return workoutDataJSON as any[];
    }
};

/**
 * Log a completed workout session
 */
export const logCompletedWorkout = async (workoutData: any) => {
    try {
        const db = getFirestore();
        const auth = getAuth();
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
