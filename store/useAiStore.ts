import { create } from 'zustand';
import aiModels from '@/data/aiModels.json';
import { AiUsageService } from '@/utils/AiUsageService';

export interface AiModel {
    id: string;
    name: string;
    category: string;
    rpd: number;
    description: string;
    supportsVision: boolean;
    badge: string;
}

interface AiStoreState {
    models: AiModel[];
    selectedModel: AiModel;
    usageMap: Record<string, number>;       // modelId -> today's used count
    isLoadingUsage: boolean;

    setSelectedModel: (model: AiModel) => void;
    refreshUsage: () => Promise<void>;
    incrementLocalUsage: (modelId: string) => void;
}

const DEFAULT_MODEL = (aiModels as AiModel[]).find(m => m.id === 'gemini-2.5-flash') || (aiModels as AiModel[])[0];

export const useAiStore = create<AiStoreState>((set, get) => ({
    models: aiModels as AiModel[],
    selectedModel: DEFAULT_MODEL,
    usageMap: {},
    isLoadingUsage: false,

    setSelectedModel: (model: AiModel) => {
        set({ selectedModel: model });
    },

    refreshUsage: async () => {
        try {
            set({ isLoadingUsage: true });
            const modelIds = (aiModels as AiModel[]).map(m => m.id);
            const usageMap = await AiUsageService.getAllTodayUsage(modelIds);
            set({ usageMap, isLoadingUsage: false });
        } catch (e) {
            console.error('[useAiStore] Failed to refresh usage:', e);
            set({ isLoadingUsage: false });
        }
    },

    incrementLocalUsage: (modelId: string) => {
        const current = get().usageMap[modelId] || 0;
        set(state => ({
            usageMap: { ...state.usageMap, [modelId]: current + 1 },
        }));
    },
}));
