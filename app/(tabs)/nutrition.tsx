import { GroceryListModal } from '@/components/GroceryListModal';
import { MealCard } from '@/components/MealCard';
import { AiNutritionModal } from '@/components/AiNutritionModal';
import foodData from '@/data/food.json';
import { useDietStore } from '@/store/useDietStore';
import appTheme from '@/theme';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SHOPPING_DAYS = [1, 8, 15, 22];

export default function NutritionScreen() {
    const { currentDay, startDate, mealLogs, updateMealStatus, nextDay, prevDay, initializeCycle, syncToDate } = useDietStore();
    const params = useLocalSearchParams<{ tab?: string }>();
    const [groceryModalVisible, setGroceryModalVisible] = useState(false);
    const [aiModalVisible, setAiModalVisible] = useState(false);

    // Initial Sync logic
    useEffect(() => {
        if (!startDate) {
            initializeCycle(7); // Initialize such that Today is Day 7
        } else {
            syncToDate();
        }
    }, []);

    // Helper to calculate actual today relative to startDate for the UI
    const actualToday = useMemo(() => {
        if (!startDate) return 7;
        const start = new Date(startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.floor(Math.abs(today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return (diffDays % 28) + 1;
    }, [startDate]);

    const isViewingToday = currentDay === actualToday;

    useEffect(() => {
        if (params.tab === 'shopping') {
            setGroceryModalVisible(true);
        }
    }, [params.tab]);

    const isShoppingDay = SHOPPING_DAYS.includes(currentDay);
    const shoppingType = currentDay === 1 ? 'MONTHLY + WEEKLY' : 'WEEKLY';

    const todayMeals = useMemo(() => {
        return foodData.meal_plan.find((day) => day.day === currentDay);
    }, [currentDay]);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: appTheme.colors.backgroundMain }}>
            <KeyboardAvoidingView 
                className="flex-1 pt-4"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header Section */}
                <View style={{ marginBottom: 16, paddingHorizontal: 20 }}>
                    <Text style={{
                        color: appTheme.colors.textSecondary,
                        fontFamily: appTheme.typography.fontFamily.mono,
                        fontSize: 10,
                        letterSpacing: 2,
                        marginBottom: 4,
                        textTransform: 'uppercase'
                    }}>
                        // 28-DAY NUTRITION CYCLE
                    </Text>
                    <Text style={{
                        color: appTheme.colors.textTertiary,
                        fontFamily: appTheme.typography.fontFamily.monoBold,
                        fontSize: 12,
                        marginBottom: 12,
                        textTransform: 'uppercase'
                    }}>
                        {new Intl.DateTimeFormat('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                        }).format(new Date())}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={{
                                color: appTheme.colors.textPrimary,
                                fontFamily: appTheme.typography.fontFamily.heading,
                                fontSize: 34,
                                textTransform: 'uppercase'
                            }}>
                                DAY {currentDay}
                            </Text>
                            {!isViewingToday && (
                                <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, marginTop: -4 }}>
                                    [ VIEWING HISTORY ]
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity 
                            onPress={() => setGroceryModalVisible(true)}
                            style={{
                                backgroundColor: appTheme.colors.blockFill,
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                borderWidth: 1,
                                borderColor: isShoppingDay ? appTheme.colors.accent : appTheme.colors.border,
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}>
                            <Feather name="shopping-cart" size={14} color={isShoppingDay ? appTheme.colors.accent : appTheme.colors.textTertiary} style={{ marginRight: 8 }} />
                            <Text style={{ color: isShoppingDay ? appTheme.colors.accent : appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 12, letterSpacing: 1 }}>
                                {isShoppingDay ? 'RESTOCK' : 'LIST'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => setAiModalVisible(true)}
                            style={{
                                backgroundColor: 'rgba(204, 255, 0, 0.1)',
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                borderWidth: 1,
                                borderColor: appTheme.colors.accent,
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginLeft: 8
                            }}>
                            <Feather name="zap" size={14} color={appTheme.colors.accent} style={{ marginRight: 8 }} />
                            <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 12, letterSpacing: 1 }}>
                                AI SCAN
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {isShoppingDay && (
                        <View style={{ 
                            backgroundColor: 'rgba(204, 255, 0, 0.1)', 
                            borderWidth: 1, 
                            borderColor: appTheme.colors.accent, 
                            padding: 12, 
                            marginTop: 12,
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <Feather name="alert-triangle" size={16} color={appTheme.colors.accent} style={{ marginRight: 10 }} />
                            <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 12, letterSpacing: 0.5 }}>
                                {shoppingType} RESTOCK REQUIRED
                            </Text>
                        </View>
                    )}
                </View>

                {/* High-Noticeability Navigation Controls */}
                <View style={{ flexDirection: 'row', height: 60, borderTopWidth: 1, borderBottomWidth: 1, borderColor: appTheme.colors.border, backgroundColor: appTheme.colors.backgroundCard }}>
                    <TouchableOpacity 
                        onPress={prevDay} 
                        style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: appTheme.colors.border }}
                    >
                        <Feather name="arrow-left" size={20} color={appTheme.colors.accent} />
                        <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 14, marginLeft: 10 }}>PREV</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => !isViewingToday && syncToDate()}
                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isViewingToday ? 'transparent' : 'rgba(204, 255, 0, 0.1)' }}
                    >
                        <Text style={{ color: isViewingToday ? appTheme.colors.textTertiary : appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 14 }}>
                            {isViewingToday ? `DAY ${currentDay}` : 'TODAY'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={nextDay} 
                        style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderColor: appTheme.colors.border }}
                    >
                        <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 14, marginRight: 10 }}>NEXT</Text>
                        <Feather name="arrow-right" size={20} color={appTheme.colors.accent} />
                    </TouchableOpacity>
                </View>

                {/* Meals ScrollView */}
                <ScrollView 
                    className="flex-1 px-5 pt-6" 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {todayMeals ? (
                        <>
                            {/* Reordered: Breakfast -> Lunch -> Snack -> Dinner */}
                            {['breakfast', 'lunch', 'snack', 'dinner'].map((type) => {
                                const log = mealLogs[currentDay]?.[type] || { status: 'none' };
                                return (
                                    <MealCard 
                                        key={type}
                                        dayOfCycle={currentDay}
                                        mealType={type} 
                                        description={(todayMeals as any)[type]} 
                                        status={log.status}
                                        note={log.note}
                                        onUpdateStatus={(status, note) => updateMealStatus(currentDay, type, status, note)} 
                                    />
                                );
                            })}
                        </>
                    ) : (
                        <View className="flex-1 items-center justify-center mt-20">
                            <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.mono }}>LOADING CYCLE DATA...</Text>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            <GroceryListModal 
                visible={groceryModalVisible} 
                onClose={() => setGroceryModalVisible(false)} 
                groceryData={foodData.grocery} 
            />

            <AiNutritionModal 
                visible={aiModalVisible}
                onClose={() => setAiModalVisible(false)}
            />
        </SafeAreaView>
    );
}
