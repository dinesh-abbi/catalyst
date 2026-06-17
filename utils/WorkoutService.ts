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
        const auth = getAuth();
        const user = auth.currentUser;
        
        // Check if there is an active custom neural workout split in Firestore
        if (user) {
            console.log(`WorkoutService: Checking user-specific custom split for UID ${user.uid}...`);
            const customSnapshot = await getDocs(collection(db, `users/${user.uid}/custom_exercises`));
            if (!customSnapshot.empty && customSnapshot.size === 7) {
                console.log("WorkoutService: Loaded user-specific custom split from Firestore!");
                const customData = customSnapshot.docs.map(doc => doc.data());
                customData.sort((a: any, b: any) => Number(a.dayNumber || 0) - Number(b.dayNumber || 0));
                
                // Sync to local Zustand store in the background
                try {
                    const { useWorkoutStore } = require('@/store/useWorkoutStore');
                    if (JSON.stringify(useWorkoutStore.getState().customWorkoutDays) !== JSON.stringify(customData)) {
                        useWorkoutStore.getState().setCustomWorkoutDays(customData);
                    }
                } catch (e) {
                    console.warn("Failed to sync remote custom split to Zustand in fetch:", e);
                }
                
                return customData as any[];
            }
        }

        console.log("WorkoutService: Fetching default exercises from Firestore...");
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

        // Check if the remote database contains the old stale plan template
        if (data.length > 0 && (data[0].focus !== workoutDataJSON[0].focus || !data[0].warmup)) {
            console.log("WorkoutService: Stale default exercises (missing warmup or mismatch) detected in Firestore. Overwriting database with updated plan...");
            uploadInitialData().catch(err => 
                console.error("WorkoutService: Error seeding updated default exercises:", err)
            );
            return workoutDataJSON as any[];
        }
        
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

/**
 * Save custom exercises for a specific user to Firestore
 */
export const saveCustomExercises = async (days: any[]) => {
    try {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return false;

        const batch = writeBatch(db);
        const collectionRef = collection(db, `users/${user.uid}/custom_exercises`);

        for (const day of days) {
            const docRef = doc(collectionRef, `day_${day.dayNumber}`);
            batch.set(docRef, day);
        }

        await batch.commit();
        console.log("Custom workout split successfully uploaded to Firestore!");
        return true;
    } catch (error) {
        console.error("Error uploading custom workout split:", error);
        return false;
    }
};

/**
 * Clear custom exercises for a specific user from Firestore to reset to default
 */
export const clearCustomExercises = async () => {
    try {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return false;

        const batch = writeBatch(db);
        const collectionRef = collection(db, `users/${user.uid}/custom_exercises`);
        const snapshot = await getDocs(collectionRef);

        for (const snapDoc of snapshot.docs) {
            batch.delete(doc(collectionRef, snapDoc.id));
        }

        await batch.commit();
        console.log("Custom workout split successfully cleared from Firestore!");
        return true;
    } catch (error) {
        console.error("Error clearing custom workout split:", error);
        return false;
    }
};
