import { GeminiService } from './GeminiService';
import { WorkoutDayRaw } from '@/store/useWorkoutStore';

const PARSE_SYSTEM_PROMPT = `
You are the Catalyst Cybernetic Neural Coach. Your task is to analyze the provided workout document or text description and extract a highly structured, complete 7-day weekly training split.

You MUST return a JSON array containing exactly 7 elements, corresponding to the days of the week starting from Monday (dayNumber: 1) to Sunday (dayNumber: 7).

Each object in the array must strictly match the following format:
{
  "dayNumber": number,
  "assignedDay": string,
  "focus": string,
  "isRecovery": boolean,
  "exercises": [
    {
      "id": string,
      "name": string,
      "sets": string,
      "reps": string,
      "tempo": string,
      "notes": string,
      "isCardio": boolean
    }
  ]
}

CRITICAL RULES:
1. You MUST generate a day for every day from 1 (Monday) to 7 (Sunday) in chronological order.
2. If the uploaded routine only has less than 7 days, mark the other unused days as "isRecovery": true and "exercises": []. Focus for rest days should be "RECOVERY / REST".
3. Assign unique snake_case string IDs for exercises, e.g., "incline_db_press", "lat_pulldown". Make sure they are alphanumeric and distinct.
4. Return ONLY the raw JSON array. Do NOT wrap the output in markdown code blocks like \`\`\`json ... \`\`\`. Do not output any explanation text outside the JSON. The response must be immediately parseable as JSON.
`;

export class WorkoutAiParser {
    /**
     * Parses a text-based workout plan description using Gemini.
     */
    static async parseTextWorkout(text: string): Promise<WorkoutDayRaw[]> {
        const prompt = `${PARSE_SYSTEM_PROMPT}\n\nHere is the workout plan to parse:\n${text}`;
        const response = await GeminiService.generateText(prompt);
        return this.parseJsonResponse(response);
    }

    /**
     * Parses a document file (PDF, TXT, or Image) using Gemini.
     * @param base64Data Base64 representation of the file
     * @param mimeType Mime type of the file (e.g. 'application/pdf', 'image/jpeg')
     */
    static async parseDocumentWorkout(base64Data: string, mimeType: string): Promise<WorkoutDayRaw[]> {
        const prompt = `${PARSE_SYSTEM_PROMPT}\n\nPlease analyze the uploaded file and parse the workout schedule.`;
        const response = await GeminiService.analyzeImage(prompt, base64Data, mimeType);
        return this.parseJsonResponse(response);
    }

    /**
     * Helper to sanitize and parse JSON response from Gemini.
     */
    private static parseJsonResponse(rawText: string): WorkoutDayRaw[] {
        if (!rawText) {
            throw new Error("Empty response received from Neural Coach.");
        }

        // Handle error status responses from GeminiService
        if (rawText.startsWith("__QUOTA_EXCEEDED__")) {
            throw new Error("Quota exceeded. Please select another AI model or wait until tomorrow.");
        }
        if (rawText === "__ERROR_BUSY__") {
            throw new Error("Neural Coach is currently busy. Please try again in a moment.");
        }
        if (rawText === "__ERROR_UNAVAILABLE__") {
            throw new Error("Model unavailable. Please choose a different active AI model.");
        }
        if (rawText === "__ERROR_GENERAL__") {
            throw new Error("A cybernetic transmission error occurred while parsing the document.");
        }

        let cleanJson = rawText.trim();
        
        // Remove markdown code blocks if the AI enclosed it in ```json ... ```
        if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
        }
        cleanJson = cleanJson.trim();

        try {
            const parsed = JSON.parse(cleanJson);
            if (!Array.isArray(parsed) || parsed.length !== 7) {
                throw new Error("Invalid structure. Workout must contain exactly 7 training days.");
            }

            // Validate schema elements minimally to ensure runtime stability
            const validated = parsed.map((day: any) => {
                return {
                    dayNumber: Number(day.dayNumber) || 1,
                    assignedDay: String(day.assignedDay) || "Unknown",
                    focus: String(day.focus || "Rest Day").toUpperCase(),
                    isRecovery: !!day.isRecovery,
                    exercises: Array.isArray(day.exercises) ? day.exercises.map((ex: any) => ({
                        id: String(ex.id || 'custom_' + Math.random().toString(36).substr(2, 9)),
                        name: String(ex.name || 'Custom Exercise'),
                        sets: String(ex.sets || '3'),
                        reps: String(ex.reps || '10'),
                        tempo: String(ex.tempo || 'N/A'),
                        notes: String(ex.notes || ''),
                        isCardio: !!ex.isCardio
                    })) : []
                };
            });

            return validated as WorkoutDayRaw[];
        } catch (e: any) {
            console.error("[AiParser JSON Error]", e, "Raw output was:", rawText);
            throw new Error("Failed to parse workout layout JSON. Please check document contents or try copy-pasting the text instead.");
        }
    }
}
