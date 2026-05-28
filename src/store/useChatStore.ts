import { create } from 'zustand';

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: string;
    timestamp: number;
}

interface ChatState {
    messages: ChatMessage[];
    isTyping: boolean;
    addMessage: (role: 'user' | 'model', content: string) => void;
    clearChat: () => void;
    setTyping: (isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [
        {
            id: 'welcome',
            role: 'model',
            content: "SYSTEM ONLINE. I am CATALYST AI. How can I assist your evolution today?",
            timestamp: Date.now()
        }
    ],
    isTyping: false,

    addMessage: (role, content) => {
        const newMessage: ChatMessage = {
            id: Math.random().toString(36).substring(7),
            role,
            content,
            timestamp: Date.now()
        };
        set((state) => ({
            messages: [...state.messages, newMessage]
        }));
    },

    clearChat: () => {
        set({ 
            messages: [
                {
                    id: 'welcome-' + Date.now(),
                    role: 'model',
                    content: "MEMORY PURGED. Listening for new commands.",
                    timestamp: Date.now()
                }
            ] 
        });
    },

    setTyping: (isTyping) => set({ isTyping }),
}));
