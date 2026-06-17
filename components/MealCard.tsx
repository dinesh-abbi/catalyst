import appTheme from '@/theme';
import { NutritionService, MealStatus } from '@/utils/NutritionService';
import { Feather } from '@expo/vector-icons';
import React, { memo, useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View, Linking } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

interface MealCardProps {
    dayOfCycle: number;
    mealType: string;
    description: string;
    status: 'eaten' | 'missed' | 'alternative' | 'none';
    note?: string;
    onUpdateStatus: (status: 'eaten' | 'missed' | 'alternative' | 'none', note?: string) => void;
}

export const MealCard = memo(function MealCard({
    dayOfCycle,
    mealType,
    description,
    status,
    note,
    onUpdateStatus,
}: MealCardProps) {
    const [localNote, setLocalNote] = useState(note || '');

    useEffect(() => {
        setLocalNote(note || '');
    }, [note]);

    const handleStatusUpdate = async (newStatus: MealStatus | 'none') => {
        // If the user taps the same status again, we'll reset it to 'none'
        const finalStatus = status === newStatus ? 'none' : newStatus;
        onUpdateStatus(finalStatus, finalStatus === 'alternative' ? localNote : undefined);

        if (finalStatus !== 'none') {
            await NutritionService.logMeal({
                date: new Date().toISOString().split('T')[0],
                dayOfCycle,
                mealType,
                status: finalStatus as MealStatus,
                alternativeNote: finalStatus === 'alternative' ? localNote : undefined,
            });
        }
    };

    const handleNoteSubmit = () => {
        if (status === 'alternative') {
            onUpdateStatus('alternative', localNote);
            NutritionService.logMeal({
                date: new Date().toISOString().split('T')[0],
                dayOfCycle,
                mealType,
                status: 'alternative',
                alternativeNote: localNote,
            });
        }
    };

    const handleWatchRecipe = () => {
        const query = `${description} healthy recipe`;
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        Linking.openURL(url);
    };

    const cardBorderColor = 
        status === 'eaten' ? appTheme.colors.success :
        status === 'missed' ? appTheme.colors.error :
        status === 'alternative' ? appTheme.colors.accentTertiary :
        appTheme.colors.border;

    const cardBgColor = 
        status === 'eaten' ? 'rgba(16, 185, 129, 0.05)' :
        status === 'missed' ? 'rgba(239, 68, 68, 0.05)' :
        status === 'alternative' ? 'rgba(0, 229, 255, 0.05)' :
        appTheme.colors.backgroundCard;

    return (
        <View style={{ 
            backgroundColor: cardBgColor, 
            borderWidth: 1, 
            borderColor: cardBorderColor, 
            padding: 20, 
            marginBottom: 16 
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                    <Text style={{ 
                        color: status === 'none' ? appTheme.colors.textPrimary : appTheme.colors.textSecondary, 
                        fontFamily: appTheme.typography.fontFamily.heading, 
                        fontSize: 20, 
                        textTransform: 'uppercase', 
                        letterSpacing: -0.5,
                        textDecorationLine: status === 'missed' ? 'line-through' : 'none'
                    }}>
                        {mealType}
                    </Text>
                    <View style={{ marginTop: 8 }}>
                        <Text style={{ 
                            color: status === 'none' ? appTheme.colors.textSecondary : appTheme.colors.textTertiary, 
                            fontFamily: appTheme.typography.fontFamily.mono, 
                            fontSize: 14, 
                            lineHeight: 20,
                            textDecorationLine: status === 'missed' ? 'line-through' : 'none'
                        }}>
                            {description}
                        </Text>
                    </View>

                    <TouchableOpacity 
                        onPress={handleWatchRecipe}
                        style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            marginTop: 12,
                            backgroundColor: 'rgba(255, 0, 0, 0.05)',
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            alignSelf: 'flex-start',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 0, 0, 0.2)'
                        }}
                    >
                        <Feather name="youtube" size={14} color="#FF0000" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#FF0000', fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 1 }}>
                            [ WATCH RECIPE ]
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Status Action Row */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity 
                        onPress={() => handleStatusUpdate('eaten')}
                        style={{ 
                            width: 32, height: 32, 
                            backgroundColor: status === 'eaten' ? appTheme.colors.success : 'transparent',
                            borderWidth: 1, borderColor: status === 'eaten' ? appTheme.colors.success : appTheme.colors.border,
                            justifyContent: 'center', alignItems: 'center' 
                        }}
                    >
                        <Feather name="check" size={16} color={status === 'eaten' ? '#000' : appTheme.colors.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => handleStatusUpdate('missed')}
                        style={{ 
                            width: 32, height: 32, 
                            backgroundColor: status === 'missed' ? appTheme.colors.error : 'transparent',
                            borderWidth: 1, borderColor: status === 'missed' ? appTheme.colors.error : appTheme.colors.border,
                            justifyContent: 'center', alignItems: 'center' 
                        }}
                    >
                        <Feather name="x" size={16} color={status === 'missed' ? '#fff' : appTheme.colors.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => handleStatusUpdate('alternative')}
                        style={{ 
                            width: 32, height: 32, 
                            backgroundColor: status === 'alternative' ? appTheme.colors.accentTertiary : 'transparent',
                            borderWidth: 1, borderColor: status === 'alternative' ? appTheme.colors.accentTertiary : appTheme.colors.border,
                            justifyContent: 'center', alignItems: 'center' 
                        }}
                    >
                        <Feather name="refresh-cw" size={16} color={status === 'alternative' ? '#000' : appTheme.colors.textTertiary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Alternative Food Input */}
            {status === 'alternative' && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>
                        // LOG ALTERNATIVE FOOD
                    </Text>
                    <TextInput
                        style={{ 
                            backgroundColor: 'rgba(255,255,255,0.05)', 
                            color: appTheme.colors.accentTertiary, 
                            fontFamily: appTheme.typography.fontFamily.mono, 
                            fontSize: 12, 
                            padding: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.1)'
                        }}
                        placeholder="What did you eat instead?"
                        placeholderTextColor={appTheme.colors.textTertiary}
                        value={localNote}
                        onChangeText={setLocalNote}
                        onBlur={handleNoteSubmit}
                        returnKeyType="done"
                    />
                </Animated.View>
            )}

            {status === 'missed' && (
                <Animated.View entering={FadeIn} style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="alert-circle" size={12} color={appTheme.colors.error} />
                    <Text style={{ color: appTheme.colors.error, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, marginLeft: 6 }}>
                        MEAL SKIPPED // RECOVERY COMPROMISED
                    </Text>
                </Animated.View>
            )}
        </View>
    );
});
