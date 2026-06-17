import { create } from 'zustand';

export type AlertType = 'SUCCESS' | 'ERROR' | 'INFO';

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    onClose?: () => void;
    showAlert: (title: string, message: string, type: AlertType, onClose?: () => void) => void;
    hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
    visible: false,
    title: '',
    message: '',
    type: 'INFO',
    onClose: undefined,
    showAlert: (title, message, type, onClose) => set({ 
        visible: true, 
        title, 
        message, 
        type, 
        onClose 
    }),
    hideAlert: () => set((state) => {
        if (state.onClose) state.onClose();
        return { visible: false };
    })
}));
