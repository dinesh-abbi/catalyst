import { useWorkoutStore } from '@/store/useWorkoutStore';
import appTheme from '@/theme';
import { Exercise, workoutData, WorkoutDayRaw } from '@/utils/getTodayWorkout';
import { Feather } from '@expo/vector-icons';
import React, { memo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, Text, TouchableOpacity, View, Linking, TextInput, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { WorkoutAiParser } from '@/utils/WorkoutAiParser';
import { saveCustomExercises, clearCustomExercises } from '@/utils/WorkoutService';
import { useAlertStore } from '@/store/useAlertStore';
import { AiModelSelector } from '@/components/AiModelSelector';

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ReadOnlyExerciseCard = memo(({ exercise }: { exercise: Exercise }) => {
    const isCardio = !!exercise.isCardio;
    const searchYouTube = () => Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' exercise form')}`);
    const searchGoogle = () => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(exercise.name + ' exercise form')}`);

    return (
        <View style={{ backgroundColor: appTheme.colors.backgroundCard, borderColor: 'rgba(51, 65, 85, 0.4)', borderWidth: 1 }} className="rounded-[24px] p-6 mb-4">
            <View className="flex-row items-center mb-4">
                <View style={{ width: 4, height: 16, backgroundColor: appTheme.colors.accent, borderRadius: 2, marginRight: 10 }} />
                <Text style={{ color: appTheme.colors.textPrimary, ...(appTheme.typography.h3 as any) }} className="flex-1 tracking-wider uppercase">{exercise.name}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={searchYouTube} style={{ padding: 8, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        <Feather name="youtube" size={16} color="#ef4444" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={searchGoogle} style={{ padding: 8, borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                        <Feather name="search" size={16} color="#3b82f6" />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="flex-row items-center justify-between bg-[#0b0f19] rounded-[18px] p-4 mb-4 border border-slate-800/30">
                <View className="flex-row items-center flex-1">
                    <View className="mr-8">
                        <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.monoBold }} className="text-[10px] tracking-widest uppercase mb-1">{isCardio ? 'TYPE' : 'SETS'}</Text>
                        <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.monoBold }} className="text-lg">{isCardio ? exercise.tempo : exercise.sets}</Text>
                    </View>
                    <View>
                        <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.monoBold }} className="text-[10px] tracking-widest uppercase mb-1">{isCardio ? 'SETS' : 'REPS'}</Text>
                        <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.monoBold }} className="text-lg">{isCardio ? exercise.sets : exercise.reps}</Text>
                    </View>
                </View>

                <View style={{ backgroundColor: '#161e2e', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold }} className="text-[10px] uppercase tracking-widest">{isCardio ? 'CARDIO' : 'STRENGTH'}</Text>
                </View>
            </View>

            {exercise.notes && (
                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: appTheme.colors.accent }}>
                    <Text style={{ color: appTheme.colors.textSecondary, fontFamily: appTheme.typography.fontFamily.mono }} className="text-xs italic leading-snug">
                        {exercise.notes}
                    </Text>
                </View>
            )}

        </View>
    );
});
ReadOnlyExerciseCard.displayName = 'ReadOnlyExerciseCard';

export default function WeeklyOverviewScreen() {
    type ShiftedDay = WorkoutDayRaw & { physicalDayNum: number, physicalDayName: string };
    const [selectedDay, setSelectedDay] = useState<ShiftedDay | null>(null);
    const [isShifting, setIsShifting] = useState(false);
    const insets = useSafeAreaInsets();
    const { scheduleOffset, setScheduleOffset, customWorkoutDays, setCustomWorkoutDays } = useWorkoutStore();
    const { showAlert } = useAlertStore();

    // AI Ingestion UI States
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [copiedText, setCopiedText] = useState('');
    const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);

    // Document Picker Handler
    const handlePickDocument = async (isImage: boolean) => {
        try {
            const types = isImage ? ['image/*'] : ['application/pdf', 'text/plain'];
            const result = await DocumentPicker.getDocumentAsync({
                type: types,
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                let mimeType = asset.mimeType || '';
                
                // Mime-type fallback
                if (!mimeType) {
                    if (asset.name.endsWith('.pdf')) mimeType = 'application/pdf';
                    else if (asset.name.endsWith('.txt')) mimeType = 'text/plain';
                    else if (asset.name.endsWith('.png')) mimeType = 'image/png';
                    else if (asset.name.endsWith('.jpg') || asset.name.endsWith('.jpeg')) mimeType = 'image/jpeg';
                    else mimeType = isImage ? 'image/jpeg' : 'application/pdf';
                }

                setSelectedFile({
                    uri: asset.uri,
                    name: asset.name,
                    mimeType: mimeType
                });
                setCopiedText(''); // Reset text to avoid mixing sources
                showAlert('SUCCESS', `Loaded document: ${asset.name}`, 'SUCCESS');
            }
        } catch (e: any) {
            showAlert('ERROR', 'Failed to retrieve document.', 'ERROR');
        }
    };

    // Trigger AI Analysis
    const handleAnalyzeWorkout = async () => {
        if (!copiedText.trim() && !selectedFile) {
            showAlert('INPUT_REQUIRED', 'Please either pick a workout document or paste a routine description.', 'INFO');
            return;
        }

        setIsAnalyzing(true);
        setAnalysisLogs(['[ INITIATING COGNITIVE SPLIT PARSER ]']);

        try {
            let parsedDays: WorkoutDayRaw[] = [];

            // Stage 1: Reading file or text input
            if (selectedFile) {
                setAnalysisLogs(prev => [...prev, `[ STREAMING: ${selectedFile.name.toUpperCase()} ]`]);
                
                if (selectedFile.mimeType === 'text/plain') {
                    const rawText = await FileSystem.readAsStringAsync(selectedFile.uri, { encoding: 'utf8' });
                    setAnalysisLogs(prev => [...prev, '[ EXTRACTING RAW TEXT CHARACTERS ]']);
                    setAnalysisLogs(prev => [...prev, '[ INGESTING INTO GEMINI NEURAL CHANNELS ]']);
                    parsedDays = await WorkoutAiParser.parseTextWorkout(rawText);
                } else {
                    const base64Content = await FileSystem.readAsStringAsync(selectedFile.uri, { encoding: 'base64' });
                    setAnalysisLogs(prev => [...prev, `[ PREPARING BASE64 INLINE DATA: ${selectedFile.mimeType.toUpperCase()} ]`]);
                    setAnalysisLogs(prev => [...prev, '[ CALLING GEMINI VISION & FILE DECODER ]']);
                    parsedDays = await WorkoutAiParser.parseDocumentWorkout(base64Content, selectedFile.mimeType);
                }
            } else {
                setAnalysisLogs(prev => [...prev, '[ INGESTING MANUAL COPIED ROUTINE TEXT ]']);
                setAnalysisLogs(prev => [...prev, '[ TRANSMITTING TO COGNITIVE ANALYSIS CHANNELS ]']);
                parsedDays = await WorkoutAiParser.parseTextWorkout(copiedText);
            }

            setAnalysisLogs(prev => [...prev, '[ NEURAL DECRYPTION COMPLETED ]']);
            setAnalysisLogs(prev => [...prev, '[ WRITING PARSED DAYS SPLIT TO NEURAL CELL ]']);

            // Save locally in Zustand
            setCustomWorkoutDays(parsedDays);

            // Silently back up to Firestore in the background
            saveCustomExercises(parsedDays).catch(err => {
                console.warn("Failed to silently upload custom routine to Firestore:", err);
            });

            setAnalysisLogs(prev => [...prev, '[ STACK SYNCHRONIZATION: OK ]']);
            setTimeout(() => {
                setIsAnalyzing(false);
                setIsImportModalVisible(false);
                setSelectedFile(null);
                setCopiedText('');
                showAlert('SUCCESS', 'Neural Split compiled and synchronized successfully!', 'SUCCESS');
            }, 1000);

        } catch (error: any) {
            console.error("[Ingestion Error]", error);
            setAnalysisLogs(prev => [...prev, `[ !! CRITICAL INTERRUPT: ${error?.message || 'PARSE FAILURE'} ]`]);
            setTimeout(() => {
                setIsAnalyzing(false);
                showAlert('ERROR', error?.message || 'Cognitive parsing failed. Verify document contents.', 'ERROR');
            }, 2000);
        }
    };

    // Reset Custom Routine
    const handleResetCustomWorkout = () => {
        Alert.alert(
            "Reset Split",
            "This will delete your custom routine and reset exercises back to default factory settings. Proceed?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setCustomWorkoutDays(null);
                            showAlert('SUCCESS', 'Active routine reset back to factory settings.', 'SUCCESS');
                            
                            // Delete from Firestore in background
                            clearCustomExercises().catch(err => {
                                console.warn("Failed to delete custom routine from Firestore:", err);
                            });
                        } catch (e) {
                            showAlert('ERROR', 'Failed to complete reset.', 'ERROR');
                        }
                    }
                }
            ]
        );
    };

    const currentDayIndex = new Date().getDay();
    const currentPhysicalDay = currentDayIndex === 0 ? 7 : currentDayIndex;

    const activeDaysList = customWorkoutDays && customWorkoutDays.length > 0 ? customWorkoutDays : workoutData;

    const shiftedWorkoutData = activeDaysList.map(day => {
        const physicalDayNum = ((day.dayNumber - 1 - scheduleOffset) % 7 + 7) % 7 + 1;
        return {
            ...day,
            physicalDayNum,
            physicalDayName: DAY_NAMES[physicalDayNum - 1]
        };
    }).sort((a, b) => a.physicalDayNum - b.physicalDayNum);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: appTheme.colors.backgroundMain }}>
            <ScrollView className="flex-1 px-6 pt-10" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.duration(600)} className="mb-10 flex-row justify-between items-end">
                    <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                            <View style={{ width: 12, height: 2, backgroundColor: appTheme.colors.accent, marginRight: 8 }} />
                            <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold }} className="text-[10px] tracking-[3px] uppercase">Training Split</Text>
                        </View>
                        <Text style={{ color: appTheme.colors.textPrimary, ...(appTheme.typography.h1 as any) }} className="text-4xl tracking-tighter uppercase">
                            WEEKLY
                        </Text>
                    </View>

                    {scheduleOffset !== 0 && (
                        <TouchableOpacity
                            onPress={() => setScheduleOffset(0)}
                            style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.2)', borderWidth: 1 }}
                            className="px-4 py-2 rounded-xl flex-row items-center"
                        >
                            <Feather name="refresh-ccw" size={12} color={appTheme.colors.accent} />
                            <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold }} className="text-[10px] ml-2 uppercase tracking-widest">
                                RESET
                            </Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>

                {/* Custom Neural Routine operations card */}
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={{ marginBottom: 20 }}>
                    <View style={{
                        backgroundColor: appTheme.colors.backgroundCard,
                        borderColor: 'rgba(51, 65, 85, 0.4)',
                        borderWidth: 1,
                        borderRadius: 24,
                        padding: 20
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ color: appTheme.colors.textSecondary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 2 }}>
                                {"// CUSTOM_NEURAL_ROUTINE"}
                            </Text>
                            <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: customWorkoutDays ? appTheme.colors.accent : '#555'
                            }} />
                        </View>
                        <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.heading, fontSize: 18, marginBottom: 6, textTransform: 'uppercase' }}>
                            {customWorkoutDays ? "NEURAL_SPLIT_ACTIVE" : "FACTORY_ROUTINE_ACTIVE"}
                        </Text>
                        <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, lineHeight: 14, marginBottom: 16 }}>
                            {customWorkoutDays 
                                ? "Your custom workout split is live. Active exercises are parsed and synchronized. Tap below to reset back to factory defaults."
                                : "Upload a PDF, text file, or image plan. Our cybernetic neural coach will automatically parse it and set it as your active workout schedule."
                            }
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {customWorkoutDays ? (
                                <TouchableOpacity
                                    onPress={handleResetCustomWorkout}
                                    activeOpacity={0.8}
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'rgba(255, 51, 0, 0.05)',
                                        borderColor: '#FF3300',
                                        borderWidth: 1,
                                        paddingVertical: 12,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        gap: 6
                                    }}
                                >
                                    <Feather name="refresh-ccw" size={12} color="#FF3300" />
                                    <Text style={{ color: '#FF3300', fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 1 }}>{"[ RESET_TO_FACTORY ]"}</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setIsImportModalVisible(true)}
                                    activeOpacity={0.8}
                                    style={{
                                        flex: 1,
                                        backgroundColor: appTheme.colors.accent,
                                        paddingVertical: 12,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        gap: 6
                                    }}
                                >
                                    <Feather name="upload-cloud" size={12} color="#000" />
                                    <Text style={{ color: '#000', fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 1 }}>{"[ IMPORT_CUSTOM_SPLIT ]"}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Animated.View>

                <View>
                    {shiftedWorkoutData.map((day, index) => {
                        const isToday = day.physicalDayNum === currentPhysicalDay;
                        return (
                            <Animated.View key={day.dayNumber} entering={FadeInDown.delay(index * 100).duration(500)}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setSelectedDay(day)}
                                    style={{
                                        backgroundColor: isToday ? 'rgba(56, 189, 248, 0.05)' : appTheme.colors.backgroundCard,
                                        borderColor: isToday ? 'rgba(56, 189, 248, 0.3)' : 'rgba(51, 65, 85, 0.2)',
                                        borderWidth: 1,
                                        marginBottom: 16,
                                        borderRadius: 24,
                                        padding: 24
                                    }}
                                >
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text style={{ color: isToday ? appTheme.colors.accent : appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.monoBold }} className="tracking-[2px] uppercase text-[10px]">
                                            {day.physicalDayName} {isToday && '• TODAY'}
                                        </Text>
                                        <Text style={{ color: isToday ? appTheme.colors.accent : 'rgba(148, 163, 184, 0.3)', fontFamily: appTheme.typography.fontFamily.monoBold }} className="text-xs uppercase tracking-widest">
                                            DAY {day.dayNumber}
                                        </Text>
                                    </View>
                                    <Text style={{ color: isToday ? appTheme.colors.textPrimary : 'rgba(248, 250, 252, 0.8)', fontFamily: appTheme.typography.fontFamily.heading }} className="text-2xl tracking-tight uppercase">
                                        {day.focus}
                                    </Text>

                                    {day.isRecovery && (
                                        <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 12 }}>
                                            <Text style={{ color: appTheme.colors.accentSecondary, fontFamily: appTheme.typography.fontFamily.monoBold }} className="text-[10px] uppercase tracking-widest">
                                                RECOVERY DAY
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>
            </ScrollView>

            <Modal
                visible={!!selectedDay}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectedDay(null)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(11, 15, 25, 0.98)' }}>
                    <SafeAreaView className="flex-1 px-6 pt-10">
                        <View className="flex-row justify-between items-start mb-10">
                            <View className="flex-1 pr-4">
                                <View className="flex-row items-center mb-1">
                                    <View style={{ width: 8, height: 2, backgroundColor: appTheme.colors.accent, marginRight: 6 }} />
                                    <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold }} className="text-[10px] tracking-widest uppercase">{selectedDay?.assignedDay}</Text>
                                </View>
                                <Text style={{ color: appTheme.colors.textPrimary, ...(appTheme.typography.h1 as any) }} className="text-4xl tracking-tighter uppercase">{selectedDay?.focus}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setSelectedDay(null)}
                                style={{ backgroundColor: '#161e2e', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(51, 65, 85, 0.4)' }}
                            >
                                <Feather name="x" size={20} color={appTheme.colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {selectedDay && selectedDay.physicalDayNum !== currentPhysicalDay && (
                            <TouchableOpacity
                                disabled={isShifting}
                                onPress={() => {
                                    setIsShifting(true);
                                    setTimeout(() => {
                                        let newOffset = selectedDay.dayNumber - currentPhysicalDay;
                                        if (newOffset > 3) newOffset -= 7;
                                        if (newOffset < -3) newOffset += 7;

                                        setScheduleOffset(newOffset);
                                        setIsShifting(false);
                                        setSelectedDay(null);
                                    }, 800);
                                }}
                                style={{
                                    backgroundColor: appTheme.colors.accent,
                                    paddingVertical: 18,
                                    borderRadius: 20,
                                    marginBottom: 32,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    shadowColor: appTheme.colors.accent,
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 12,
                                    elevation: 8
                                }}
                            >
                                {isShifting ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Feather name="zap" size={16} color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={{ fontFamily: appTheme.typography.fontFamily.monoBold }} className="text-white uppercase tracking-widest text-xs">
                                            ACTIVATE THIS WORKOUT
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        <FlatList
                            data={selectedDay?.exercises || []}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            renderItem={({ item, index }) => (
                                <Animated.View entering={FadeInRight.delay(index * 50)}>
                                    <ReadOnlyExerciseCard exercise={item} />
                                </Animated.View>
                            )}
                        />
                    </SafeAreaView>
                </View>
            </Modal>

            {/* Custom Neural split importer modal */}
            <Modal
                visible={isImportModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    if (!isAnalyzing) setIsImportModalVisible(false);
                }}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(11, 15, 25, 0.98)' }}>
                    <SafeAreaView className="flex-1 px-6 pt-10">
                        {/* Header */}
                        <View className="flex-row justify-between items-start mb-8">
                            <View className="flex-1 pr-4">
                                <View className="flex-row items-center mb-1">
                                    <View style={{ width: 8, height: 2, backgroundColor: appTheme.colors.accent, marginRight: 6 }} />
                                    <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold }} className="text-[10px] tracking-widest uppercase">COGNITIVE_INGESTION</Text>
                                </View>
                                <Text style={{ color: appTheme.colors.textPrimary, ...(appTheme.typography.h1 as any) }} className="text-3xl tracking-tighter uppercase">IMPORT SPLIT</Text>
                            </View>
                            <TouchableOpacity
                                disabled={isAnalyzing}
                                onPress={() => setIsImportModalVisible(false)}
                                style={{ backgroundColor: '#161e2e', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(51, 65, 85, 0.4)' }}
                            >
                                <Feather name="x" size={20} color={appTheme.colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} className="flex-1">
                            {/* AI Model Engine Selector */}
                            <View style={{ marginBottom: 24 }}>
                                <AiModelSelector />
                            </View>

                            {/* Selected File Banner */}
                            {selectedFile && (
                                <Animated.View entering={FadeInUp} style={{ borderColor: appTheme.colors.accent, borderWidth: 1, backgroundColor: 'rgba(204, 255, 0, 0.05)' }} className="p-4 rounded-2xl mb-6 flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1 mr-2">
                                        <Feather name="file-text" size={18} color={appTheme.colors.accent} />
                                        <Text numberOfLines={1} style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 12, marginLeft: 8 }} className="flex-1">
                                            {selectedFile.name}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setSelectedFile(null)} className="p-1">
                                        <Feather name="trash-2" size={14} color="#ff3300" />
                                    </TouchableOpacity>
                                </Animated.View>
                            )}

                            {/* Section 1: Pickers */}
                            <Text style={{ color: appTheme.colors.textSecondary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>
                                // UPLOAD_CHANNELS
                            </Text>

                            <View className="flex-row gap-4 mb-8">
                                <TouchableOpacity
                                    disabled={isAnalyzing}
                                    onPress={() => handlePickDocument(false)}
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#161e2e',
                                        borderColor: 'rgba(51, 65, 85, 0.4)',
                                        borderWidth: 1,
                                        borderRadius: 20,
                                        paddingVertical: 20,
                                        alignItems: 'center',
                                        gap: 8
                                    }}
                                >
                                    <Feather name="file" size={24} color={appTheme.colors.accent} />
                                    <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10 }}>PDF_OR_TXT</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    disabled={isAnalyzing}
                                    onPress={() => handlePickDocument(true)}
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#161e2e',
                                        borderColor: 'rgba(51, 65, 85, 0.4)',
                                        borderWidth: 1,
                                        borderRadius: 20,
                                        paddingVertical: 20,
                                        alignItems: 'center',
                                        gap: 8
                                    }}
                                >
                                    <Feather name="image" size={24} color={appTheme.colors.accent} />
                                    <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10 }}>PLAN_IMAGE</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Section 2: Direct text input console */}
                            <Text style={{ color: appTheme.colors.textSecondary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>
                                // OR_PASTE_RAW_TEXT_CONSOLE
                            </Text>

                            <TextInput
                                multiline
                                numberOfLines={8}
                                placeholder="Paste your weekly workout routine, days, sets, reps, and exercises. Our neural coach will interpret it natively..."
                                placeholderTextColor="rgba(148, 163, 184, 0.3)"
                                value={copiedText}
                                onChangeText={(text) => {
                                    setCopiedText(text);
                                    if (selectedFile) setSelectedFile(null); // Clear selected file when typing
                                }}
                                editable={!isAnalyzing}
                                style={{
                                    backgroundColor: '#0b0f19',
                                    borderColor: copiedText.trim() ? appTheme.colors.accent : 'rgba(51, 65, 85, 0.4)',
                                    borderWidth: 1,
                                    borderRadius: 20,
                                    color: appTheme.colors.textPrimary,
                                    fontFamily: appTheme.typography.fontFamily.mono,
                                    fontSize: 12,
                                    padding: 18,
                                    height: 180,
                                    textAlignVertical: 'top',
                                    marginBottom: 32
                                }}
                            />

                            {/* Trigger Analyze Action */}
                            <TouchableOpacity
                                disabled={isAnalyzing || (!copiedText.trim() && !selectedFile)}
                                onPress={handleAnalyzeWorkout}
                                style={{
                                    backgroundColor: (copiedText.trim() || selectedFile) ? appTheme.colors.accent : 'rgba(204, 255, 0, 0.2)',
                                    paddingVertical: 18,
                                    borderRadius: 20,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    shadowColor: appTheme.colors.accent,
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: (copiedText.trim() || selectedFile) ? 0.3 : 0,
                                    shadowRadius: 12,
                                    elevation: (copiedText.trim() || selectedFile) ? 8 : 0
                                }}
                            >
                                <Feather name="cpu" size={16} color="#000" style={{ marginRight: 10 }} />
                                <Text style={{ fontFamily: appTheme.typography.fontFamily.monoBold, color: '#000', fontSize: 12, letterSpacing: 2 }}>
                                    INGEST_ROUTINE_NOW
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </SafeAreaView>

                    {/* Cyber Neural Loading Overlay */}
                    {isAnalyzing && (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                            <View className="items-center mb-8">
                                <ActivityIndicator size="large" color={appTheme.colors.accent} style={{ marginBottom: 16 }} />
                                <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 14, letterSpacing: 4 }} className="uppercase">
                                    [ NEURAL COACH ANALYZING ]
                                </Text>
                            </View>
                            
                            {/* Cyber terminal logs */}
                            <View style={{ backgroundColor: '#05070a', borderColor: 'rgba(51,65,85,0.4)', borderWidth: 1, borderRadius: 16, width: '100%', padding: 20, height: 220 }}>
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
                                    {analysisLogs.map((log, index) => (
                                        <Text key={index} style={{ color: log.includes('!!') ? '#ff3300' : appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, lineHeight: 16, marginBottom: 4 }}>
                                            {log}
                                        </Text>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}
