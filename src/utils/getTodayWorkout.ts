import { useWorkoutStore } from '@/store/useWorkoutStore';

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

export const workoutData: WorkoutDayRaw[] =
    [
        {
            "dayNumber": 1,
            "assignedDay": "Monday",
            "focus": "Push (Chest / Shoulders / Triceps)",
            "isRecovery": false,
            "exercises": [
                { "id": "1-1", "name": "Incline DB Press", "sets": "3-4", "reps": "8-10", "tempo": "3:1:2:1", "notes": "Lower slowly to upper chest, elbows slightly tucked, smooth press." },
                { "id": "1-2", "name": "Machine Chest Press", "sets": "3", "reps": "10-12", "tempo": "3:1:2:1", "notes": "Shoulders back, grip slightly wide, squeeze chest at the top." },
                { "id": "1-3", "name": "Machine Shoulder Press", "sets": "3", "reps": "8-10", "tempo": "3:1:2:1", "notes": "Lower to chin height, keep core braced, press with control." },
                { "id": "1-4", "name": "DB Lateral Raises", "sets": "3", "reps": "12-15", "tempo": "3:1:2:1", "notes": "Lead with elbows, lift to shoulder height, don't swing." },
                { "id": "1-5", "name": "Cable Triceps Pushdown", "sets": "3", "reps": "12-15", "tempo": "3:1:2:1", "notes": "Keep elbows locked in, extend fully, pause at bottom." },
                { "id": "1-6", "name": "Overhead Rope Extension", "sets": "3", "reps": "12-15", "tempo": "3:1:2:1", "notes": "Stretch behind head, extend straight up, keep back still." },
                { "id": "1-7", "name": "Post-Workout Cardio", "sets": "1", "reps": "Time", "tempo": "Moderate", "notes": "Treadmill, stair stepper, or bike.", "isCardio": true }
            ]
        },
        {
            "dayNumber": 2,
            "assignedDay": "Tuesday",
            "focus": "Pull (Back / Rear Delts / Biceps)",
            "isRecovery": false,
            "exercises": [
                { "id": "2-1", "name": "Lat Pulldown", "sets": "3-4", "reps": "8-10", "tempo": "3:1:2:1", "notes": "Pull elbows down to ribs, chest tall, avoid using momentum." },
                { "id": "2-2", "name": "Chest-Supported Row", "sets": "3", "reps": "8-10", "tempo": "3:1:2:1", "notes": "Pull to lower chest, squeeze shoulder blades, stay supported." },
                { "id": "2-3", "name": "Seated Row", "sets": "3", "reps": "10-12", "tempo": "3:1:2:1", "notes": "Sit tall, pull the handle to belly button, control the return." },
                { "id": "2-4", "name": "Rear Delt Fly", "sets": "3", "reps": "12-15", "tempo": "3:1:2:1", "notes": "Move arms wide, feel rear delts, avoid shrugging shoulders." },
                { "id": "2-5", "name": "Dumbbell Curls", "sets": "3", "reps": "10-12", "tempo": "3:1:2:1", "notes": "Keep elbows by your sides, curl slowly, palms up, full squeeze." },
                { "id": "2-6", "name": "Incline DB Curls", "sets": "2-3", "reps": "10-12", "tempo": "3:1:2:1", "notes": "Let arms stretch fully at bottom, curl slowly, no swinging." },
                { "id": "2-7", "name": "Post-Workout Cardio", "sets": "1", "reps": "Time", "tempo": "Moderate", "notes": "Rowing machine or incline walk.", "isCardio": true }
            ]
        },
        {
            "dayNumber": 3,
            "assignedDay": "Wednesday",
            "focus": "Legs",
            "isRecovery": false,
            "exercises": [
                { "id": "3-1", "name": "Back Squat or Hack Squat", "sets": "3-4", "reps": "6-8", "tempo": "3:1:2:1", "notes": "Brace core, squat under control, push through the whole foot." },
                { "id": "3-2", "name": "Leg Press", "sets": "3", "reps": "10-12", "tempo": "3:1:2:1", "notes": "Feet mid-platform, knees to 90°, no locking out." },
                { "id": "3-3", "name": "Leg Extension", "sets": "3", "reps": "12-15", "tempo": "3:1:2:1", "notes": "Lift with quads, pause at top, lower slowly." },
                { "id": "3-4", "name": "Hamstring Curl", "sets": "3", "reps": "10-12", "tempo": "3:1:2:1", "notes": "Keep hips down, curl smoothly, squeeze at bottom." },
                { "id": "3-5", "name": "Calf Raise", "sets": "3-4", "reps": "12-15", "tempo": "3:1:2:1", "notes": "Full stretch, push through big toe, slow descent." },
                { "id": "3-6", "name": "Post-Workout Cardio", "sets": "1", "reps": "Time", "tempo": "Low", "notes": "Stationary bike to flush the legs out.", "isCardio": true }
            ]
        },
        {
            "dayNumber": 4,
            "assignedDay": "Thursday",
            "focus": "Active Recovery (Abs & Cardio)",
            "isRecovery": true,
            "exercises": [
                { "id": "4-1", "name": "Hanging Leg Raises", "sets": "3", "reps": "10-15", "tempo": "Control", "notes": "Focus on curling the pelvis upward; avoid swinging." },
                { "id": "4-2", "name": "Cable Crunches", "sets": "3", "reps": "12-15", "tempo": "Control", "notes": "Keep hips locked; crunch using the abdominals." },
                { "id": "4-3", "name": "Russian Twists", "sets": "3", "reps": "20", "tempo": "Steady", "notes": "Use a light weight; twist from the torso." },
                { "id": "4-4", "name": "Steady State Cardio", "sets": "1", "reps": "Time", "tempo": "Zone 2", "notes": "Incline walk or stationary bike. Maintain a conversational pace.", "isCardio": true }
            ]
        },
        {
            "dayNumber": 5,
            "assignedDay": "Friday",
            "focus": "Chest / Back / Arms",
            "isRecovery": false,
            "exercises": [
                { "id": "5-1", "name": "Flat DB Press", "sets": "3-4", "reps": "6-8", "tempo": "3:1:2:1", "notes": "Lower smoothly; elbows tucked; press evenly." },
                { "id": "5-2", "name": "Cable Chest Fly", "sets": "3", "reps": "12-15", "tempo": "3:1:2:1", "notes": "Slight elbow bend, hands meet at chest height." },
                { "id": "5-3", "name": "Lat Pulldown (Neutral Grip)", "sets": "3", "reps": "10-12", "tempo": "3:1:2:1", "notes": "Pull elbows down and forward; chest stays up." },
                { "id": "5-4", "name": "Seated Row", "sets": "3", "reps": "10-12", "tempo": "3:1:2:1", "notes": "Pull to stomach, squeeze mid-back, slow return." },
                { "id": "5-5", "name": "Cable Bicep Curls", "sets": "3", "reps": "12-15", "tempo": "3:1:2:1", "notes": "Keep elbows still, curl smoothly, full squeeze." },
                { "id": "5-6", "name": "Tricep Dips / Dip Machine", "sets": "3", "reps": "8-10", "tempo": "3:1:2:1", "notes": "Lower to 90°, push up under control." },
                { "id": "5-7", "name": "Post-Workout Cardio", "sets": "1", "reps": "Time", "tempo": "Moderate", "notes": "Treadmill or stair stepper.", "isCardio": true }
            ]
        },
        {
            "dayNumber": 6,
            "assignedDay": "Saturday",
            "focus": "Shoulders + Legs",
            "isRecovery": false,
            "exercises": [
                { "id": "6-1", "name": "DB Shoulder Press", "sets": "3-4", "reps": "6-8", "tempo": "3:1:2:1", "notes": "Lower to chin height, don't lock elbows, stay braced." },
                { "id": "6-2", "name": "Lateral Raises", "sets": "3", "reps": "12-15", "tempo": "3:1:2:1", "notes": "Lift to shoulder height, soft elbows, slow lower." },
                { "id": "6-3", "name": "Front Squat / Hack Squat", "sets": "3", "reps": "6-8", "tempo": "3:1:2:1", "notes": "Keep torso upright, and drive knees forward comfortably." },
                { "id": "6-4", "name": "Hamstring Curl", "sets": "3", "reps": "10-12", "tempo": "3:1:2:1", "notes": "Curl smoothly, squeeze hard, control stretch." },
                { "id": "6-5", "name": "Leg Extension", "sets": "3", "reps": "12-15", "tempo": "3:1:2:1", "notes": "Lock quads at top, pause, lower slowly." },
                { "id": "6-6", "name": "Post-Workout Cardio", "sets": "1", "reps": "Time", "tempo": "Moderate", "notes": "Any cardio machine of choice.", "isCardio": true }
            ]
        },
        {
            "dayNumber": 7,
            "assignedDay": "Sunday",
            "focus": "Active Recovery (Abs & Cardio)",
            "isRecovery": true,
            "exercises": [
                { "id": "7-1", "name": "Plank", "sets": "3", "reps": "60 sec", "tempo": "Static", "notes": "Keep core tight and back flat." },
                { "id": "7-2", "name": "Bicycle Crunches", "sets": "3", "reps": "20", "tempo": "Control", "notes": "Opposite elbow to opposite knee." },
                { "id": "7-3", "name": "HIIT Cardio", "sets": "1", "reps": "Time", "tempo": "Intervals", "notes": "Sprint for 30 sec, walk for 60 sec on the treadmill.", "isCardio": true }
            ]
        }
    ]

/**
 * Returns a workout mapped by a specific 1-7 day number.
 *
 * @param dayNumber 1=Monday ... 7=Sunday
 * @returns {TodayWorkout}
 */
export function getWorkoutByDayNumber(dayNumber: number): TodayWorkout {
    const workoutForDay = workoutData.find(day => day.dayNumber === dayNumber);

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
    const { scheduleOffset } = useWorkoutStore.getState();
    mappedDayNumber = ((mappedDayNumber - 1 + scheduleOffset) % 7 + 7) % 7 + 1;

    return getWorkoutByDayNumber(mappedDayNumber);
}
