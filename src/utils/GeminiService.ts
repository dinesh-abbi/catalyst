import { GoogleGenerativeAI } from "@google/generative-ai";
// @ts-ignore
import { EXPO_PUBLIC_GEMINI_API_KEY } from "@env";
import { AiUsageService } from './AiUsageService';
import { useAiStore } from '@/store/useAiStore';

const API_KEY = EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Gets the currently selected model from the global AI store.
 */
function getActiveModel(): string {
    return useAiStore.getState().selectedModel.id;
}

/**
 * Gets the RPD limit for the currently selected model.
 */
function getActiveModelRpd(): number {
    return useAiStore.getState().selectedModel.rpd;
}

/**
 * Checks if the user has exceeded their daily quota for the given model.
 * Returns true if quota exceeded.
 */
async function isQuotaExceeded(modelId: string, rpd: number): Promise<boolean> {
    // Models with very high rpd (1500+) are treated as effectively unlimited
    if (rpd >= 1500) return false;
    const usage = await AiUsageService.getTodayUsage(modelId);
    return usage >= rpd;
}

export class GeminiService {
    /**
     * Internal helper to handle retries with exponential backoff for 503/429 errors.
     */
    private static async withRetry<T>(fn: () => Promise<T>, retries: number = 2, delay: number = 1000): Promise<T> {
        try {
            return await fn();
        } catch (error: any) {
            const isRetryable = error?.message?.includes('503') || error?.message?.includes('429');
            if (isRetryable && retries > 0) {
                console.warn(`[Gemini Retry] Model busy, retrying in ${delay}ms... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.withRetry(fn, retries - 1, delay * 2);
            }
            throw error;
        }
    }

    /**
     * Generates text response from a prompt using the user-selected model.
     */
    static async generateText(prompt: string): Promise<string> {
        const modelId = getActiveModel();
        const rpd = getActiveModelRpd();

        try {
            if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured.");

            if (await isQuotaExceeded(modelId, rpd)) {
                return `__QUOTA_EXCEEDED__:${modelId}:${rpd}`;
            }

            const model = genAI.getGenerativeModel({ model: modelId });
            console.log(`[Gemini] Calling model: ${modelId}`);
            
            const result = await this.withRetry(() => model.generateContent(prompt));
            const response = await result.response;
            const text = response.text();

            // Track usage in Firestore and in memory
            AiUsageService.incrementUsage(modelId);
            useAiStore.getState().incrementLocalUsage(modelId);

            return text;
        } catch (error: any) {
            console.error(`[Gemini Error] model=${modelId} | ${error?.message}`, error);
            if (error?.message?.includes('429') || error?.message?.includes('503')) {
                return "__ERROR_BUSY__";
            }
            if (error?.message?.includes('404')) {
                return "__ERROR_UNAVAILABLE__";
            }
            return "__ERROR_GENERAL__";
        }
    }

    /**
     * Analyzes an image with a prompt using the user-selected model.
     */
    static async analyzeImage(prompt: string, base64Image: string, mimeType: string = "image/jpeg"): Promise<string> {
        const modelId = getActiveModel();
        const rpd = getActiveModelRpd();
        const selectedModel = useAiStore.getState().selectedModel;

        try {
            if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured.");

            if (!selectedModel.supportsVision) {
                return `__NO_VISION__:${selectedModel.name}`;
            }

            if (await isQuotaExceeded(modelId, rpd)) {
                return `__QUOTA_EXCEEDED__:${modelId}:${rpd}`;
            }

            const imagePart = {
                inlineData: { data: base64Image, mimeType },
            };

            const model = genAI.getGenerativeModel({ model: modelId });
            console.log(`[Gemini Vision] Calling model: ${modelId}`);
            
            const result = await this.withRetry(() => model.generateContent([prompt, imagePart]));
            const response = await result.response;
            const text = response.text();

            // Track usage
            AiUsageService.incrementUsage(modelId);
            useAiStore.getState().incrementLocalUsage(modelId);

            return text;
        } catch (error: any) {
            console.error(`[Gemini Vision Error] model=${modelId} | ${error?.message}`, error);
            if (error?.message?.includes('429') || error?.message?.includes('503')) {
                return "__ERROR_BUSY__";
            }
            if (error?.message?.includes('404')) {
                return "__ERROR_UNAVAILABLE__";
            }
            return "__ERROR_GENERAL__";
        }
    }

    /**
     * Predefined prompt for Nutrition Scanning
     */
    static async scanMeal(base64Image: string): Promise<string> {
        const prompt = `
      Identify the food items in this image and provide a JSON response with the following format:
      {
        "items": [
          {"name": "Food Item 1", "estimatedCalories": 0, "protein": 0, "carbs": 0, "fats": 0}
        ],
        "total": {"calories": 0, "protein": 0, "carbs": 0, "fats": 0},
        "healthScore": 0,
        "advice": "Short tip about this meal"
      }
      If the image is not food, respond with an error message in JSON format.
      Return ONLY THE JSON.
    `;
        return this.analyzeImage(prompt, base64Image);
    }

    /**
     * Predefined prompt for Workout Feedback
     */
    static async getWorkoutFeedback(workoutLog: any): Promise<string> {
        const prompt = `
      Based on this workout log: ${JSON.stringify(workoutLog)}, 
      provide a short, motivational, and technical analysis of the performance. 
      Focus on progressive overload and intensity. Keep it under 100 words.
    `;
        return this.generateText(prompt);
    }
}
