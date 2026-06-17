import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    type FirebaseAuthTypes
} from '@react-native-firebase/auth';

/**
 * Authentication Service using React Native Firebase (Modular SDK API)
 */
export const AuthService = {
    /**
     * Wait for Firebase to be initialized properly (Native Bridge handshake)
     */
    waitForInitialization: async (): Promise<void> => {
        const { getApp } = await import('@react-native-firebase/app');
        let retries = 0;
        while (retries < 20) {
            try {
                getApp();
                return;
            } catch (e) {
                retries++;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        console.warn('Firebase: Initialization timeout. Proceeding with caution.');
    },

    /**
     * Register a new user with email and password
     */
    register: async (email: string, password: string) => {
        try {
            const auth = getAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return { user: userCredential.user, error: null };
        } catch (error: any) {
            console.error('Registration error:', error);
            return { user: null, error: error.message };
        }
    },

    /**
     * Login an existing user
     */
    login: async (email: string, password: string) => {
        try {
            const auth = getAuth();
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { user: userCredential.user, error: null };
        } catch (error: any) {
            console.error('Login error:', error);
            return { user: null, error: error.message };
        }
    },

    /**
     * Logout the current user
     */
    logout: async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            return { error: null };
        } catch (error: any) {
            console.error('Logout error:', error);
            return { error: error.message };
        }
    },

    /**
     * Get the current user synchronously
     */
    getCurrentUser: (): FirebaseAuthTypes.User | null => {
        try {
            return getAuth().currentUser;
        } catch (e) {
            return null;
        }
    },

    /**
     * Subscribe to authentication state changes
     */
    onAuthStateChanged: (callback: (user: FirebaseAuthTypes.User | null) => void) => {
        const auth = getAuth();
        return onAuthStateChanged(auth, callback);
    }
};
