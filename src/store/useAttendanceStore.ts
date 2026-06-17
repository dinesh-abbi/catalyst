import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { AttendanceService } from '@/utils/AttendanceService';

interface QueuedLog {
  id: string;
  localUri: string;
  timestamp: string;
}

interface AttendanceState {
  offlineQueue: QueuedLog[];
  isSyncing: boolean;
  addToQueue: (tempUri: string) => Promise<string>;
  processQueue: () => Promise<{ success: boolean; attempted: number; uploaded: number }>;
  clearQueue: () => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      offlineQueue: [],
      isSyncing: false,

      addToQueue: async (tempUri: string) => {
        try {
          const localDir = `${FileSystem.documentDirectory}attendance_logs/`;
          // Ensure directory exists
          const dirInfo = await FileSystem.getInfoAsync(localDir);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
          }
          
          // Copy image from temp path to permanent local path
          const filename = `attendance_${Date.now()}.jpg`;
          const localUri = `${localDir}${filename}`;
          await FileSystem.copyAsync({ from: tempUri, to: localUri });

          const newLog: QueuedLog = {
            id: Date.now().toString(),
            localUri,
            timestamp: new Date().toISOString(),
          };

          set((state) => ({
            offlineQueue: [...state.offlineQueue, newLog],
          }));

          return localUri;
        } catch (e) {
          console.error("Error writing file locally:", e);
          throw e;
        }
      },

      processQueue: async () => {
        const { offlineQueue, isSyncing } = get();
        if (isSyncing || offlineQueue.length === 0) {
          return { success: true, attempted: 0, uploaded: 0 };
        }

        set({ isSyncing: true });
        
        // Dynamic fetch of env variables via process.env or expo-constants.
        // In Expo 54 and standard react-native-dotenv, process.env is standard.
        const webhookUrl = process.env.EXPO_PUBLIC_DISCORD_WEBHOOK_URL;
        if (!webhookUrl) {
          console.warn("Discord Webhook URL not configured in .env");
          set({ isSyncing: false });
          return { success: false, attempted: 0, uploaded: 0 };
        }

        const remainingQueue: QueuedLog[] = [];
        let uploaded = 0;
        let success = true;

        for (const log of offlineQueue) {
          try {
            // Prepare Multipart Form Data
            const formData = new FormData();
            formData.append('content', 'attendance log marked');
            
            const filename = log.localUri.split('/').pop() || 'attendance.jpg';
            
            // Construct file object for React Native fetch
            formData.append('files[0]', {
              uri: log.localUri,
              name: filename,
              type: 'image/jpeg',
            } as any);

            // Send to Discord Webhook
            const response = await fetch(webhookUrl, {
              method: 'POST',
              body: formData,
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });

            if (response.ok || response.status === 204) {
              // Successfully transmitted. Now log backup to Firestore.
              await AttendanceService.logAttendance({
                timestamp: log.timestamp,
                discordSent: true,
                localUri: log.localUri,
                firebaseLogged: true,
              });
              uploaded++;
              
              // Optionally clean up the local file to save storage
              try {
                await FileSystem.deleteAsync(log.localUri, { idempotent: true });
              } catch (fsErr) {
                console.warn(`Failed to clean up local file ${log.localUri}:`, fsErr);
              }
            } else {
              throw new Error(`Discord gateway returned code ${response.status}`);
            }
          } catch (error) {
            console.error(`Failed to upload queued log ${log.id}:`, error);
            remainingQueue.push(log);
            success = false;
          }
        }

        set({
          offlineQueue: remainingQueue,
          isSyncing: false,
        });

        return { success, attempted: offlineQueue.length, uploaded };
      },

      clearQueue: () => {
        const { offlineQueue } = get();
        // Delete all stored images
        Promise.all(
          offlineQueue.map(async (log) => {
            try {
              await FileSystem.deleteAsync(log.localUri, { idempotent: true });
            } catch (_) {}
          })
        ).catch(console.error);

        set({ offlineQueue: [] });
      },
    }),
    {
      name: 'attendance-storage',
      storage: createJSONStorage(() => ({
        setItem: async (name: string, value: string) => {
          try {
            await AsyncStorage.setItem(name, value);
          } catch (_) {}
        },
        getItem: async (name: string) => {
          try {
            return await AsyncStorage.getItem(name);
          } catch (_) {
            return null;
          }
        },
        removeItem: async (name: string) => {
          try {
            await AsyncStorage.removeItem(name);
          } catch (_) {}
        },
      })),
    }
  )
);
