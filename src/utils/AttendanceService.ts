import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

export interface AttendanceLog {
  id?: string;
  timestamp: string;
  discordSent: boolean;
  localUri?: string;
  firebaseLogged?: boolean;
}

export const AttendanceService = {
  /**
   * Logs a marked attendance entry into Firebase Firestore under a subcollection.
   */
  logAttendance: async (log: Omit<AttendanceLog, 'id'>) => {
    try {
      const db = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return false;

      const userLogRef = collection(db, 'users', user.uid, 'attendance_logs');
      await addDoc(userLogRef, {
        ...log,
        createdAt: new Date(),
      });
      return true;
    } catch (e) {
      console.error("Error logging attendance to Firebase:", e);
      return false;
    }
  },

  /**
   * Fetches the list of recent attendance logs from Firestore.
   */
  getRecentLogs: async (limitCount = 5): Promise<AttendanceLog[]> => {
    try {
      const db = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return [];

      const userLogRef = collection(db, 'users', user.uid, 'attendance_logs');
      const q = query(userLogRef, orderBy('createdAt', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      
      const logs: AttendanceLog[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({ 
          id: doc.id, 
          timestamp: data.timestamp || new Date().toISOString(),
          discordSent: !!data.discordSent,
          firebaseLogged: true 
        });
      });
      return logs;
    } catch (e) {
      console.error("Error fetching attendance logs:", e);
      return [];
    }
  }
};
