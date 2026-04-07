import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    type FirebaseAuthTypes
} from '@react-native-firebase/auth';

const auth = getAuth();

/**
 * Authentication Service using React Native Firebase (Modular SDK API)
 */
export const AuthService = {
    /**
     * Register a new user with email and password
     */
    register: async (email: string, password: string) => {
        try {
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
        return auth.currentUser;
    },

    /**
     * Subscribe to authentication state changes
     */
    onAuthStateChanged: (callback: (user: FirebaseAuthTypes.User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    }
};
