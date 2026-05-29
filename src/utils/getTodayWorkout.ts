
export interface Exercise {
    id: string;
    name: string;
    sets: string;
    reps: string;
    tempo: string;
    notes: string;
    isCardio?: boolean;
}

export interface WorkoutDayRaw {
    dayNumber: number;
    assignedDay: string;
    focus: string;
    isRecovery: boolean;
    exercises: Exercise[];
}

export interface TodayWorkout {
    dayNumber: number;
    dayName: string;
    title: string;
    exercises: Exercise[];
}

import workoutDataJSON from '@/data/workoutData.json';

export const workoutData: WorkoutDayRaw[] = workoutDataJSON as WorkoutDayRaw[];


/**
 * Returns a workout mapped by a specific 1-7 day number.
 *
 * @param dayNumber 1=Monday ... 7=Sunday
 * @returns {TodayWorkout}
 */
export function getWorkoutByDayNumber(dayNumber: number): TodayWorkout {
    let daysSource = workoutData;
    try {
        const { useWorkoutStore } = require('@/store/useWorkoutStore');
        const customDays = useWorkoutStore.getState().customWorkoutDays;
        if (customDays && customDays.length > 0) {
            daysSource = customDays;
        }
    } catch (e) {
        // fallback
    }

    const workoutForDay = daysSource.find(day => day.dayNumber === dayNumber);

    if (!workoutForDay) {
        // Failsafe return if something goes unexpectedly wrong
        return {
            dayNumber: dayNumber,
            dayName: "Unknown",
            title: "Rest Day",
            exercises: []
        };
    }

    // Format the output object mapping `focus` to `title`
    return {
        dayNumber: workoutForDay.dayNumber,
        dayName: workoutForDay.assignedDay,
        title: workoutForDay.focus,
        exercises: workoutForDay.exercises,
    };
}

/**
 * Returns today's workout mapped based on the day of the week.
 *
 * Days are mapped from 1 to 7:
 * Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7
 *
 * @param overrideDayNumber Optional day number (1-7) to fetch instead of the current physical date
 * @returns {TodayWorkout} An object containing the day number, title (focus), and exercises.
 */
export function getTodayWorkout(overrideDayNumber?: number): TodayWorkout {
    if (overrideDayNumber !== undefined && overrideDayNumber >= 1 && overrideDayNumber <= 7) {
        return getWorkoutByDayNumber(overrideDayNumber);
    }

    const currentDayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    // Transform standard JS day indices (0-6) to 1-7 mapping (Monday=1, ..., Sunday=7)
    let mappedDayNumber = currentDayIndex === 0 ? 7 : currentDayIndex;

    // Apply persistent schedule offset
    let scheduleOffset = 0;
    try {
        const { useWorkoutStore } = require('@/store/useWorkoutStore');
        scheduleOffset = useWorkoutStore.getState().scheduleOffset;
    } catch (e) {
        // fallback
    }
    mappedDayNumber = ((mappedDayNumber - 1 + scheduleOffset) % 7 + 7) % 7 + 1;

    return getWorkoutByDayNumber(mappedDayNumber);
}
