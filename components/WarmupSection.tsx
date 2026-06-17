import appTheme from '@/theme';
import { WarmupExercise } from '@/utils/getTodayWorkout';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { Layout, FadeIn, FadeOut } from 'react-native-reanimated';

interface WarmupSectionProps {
    warmup: WarmupExercise[];
}

export function WarmupSection({ warmup }: WarmupSectionProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

    if (!warmup || warmup.length === 0) return null;

    const toggleCheck = (idx: number) => {
        setCheckedItems(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const completedCount = Object.values(checkedItems).filter(Boolean).length;
    const isAllCompleted = completedCount === warmup.length;

    return (
        <View style={{ backgroundColor: appTheme.colors.backgroundCard, borderWidth: 1, borderColor: appTheme.colors.border, padding: 16, marginBottom: 24 }}>
            {/* Header */}
            <TouchableOpacity
                onPress={() => setCollapsed(!collapsed)}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
                <View style={{ flex: 1 }}>
                    <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
                        [ PRE_WORKOUT_WARMUP ]
                    </Text>
                    <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.heading, fontSize: 18, textTransform: 'uppercase' }}>
                        {warmup.length} Movements ({completedCount}/{warmup.length} done)
                    </Text>
                </View>
                <Feather
                    name={collapsed ? "chevron-down" : "chevron-up"}
                    size={20}
                    color={appTheme.colors.accent}
                />
            </TouchableOpacity>

            {/* List */}
            {!collapsed && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={{ marginTop: 16 }}>
                    {warmup.map((item, idx) => {
                        const isChecked = !!checkedItems[idx];
                        return (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => toggleCheck(idx)}
                                activeOpacity={0.8}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: isChecked ? appTheme.colors.blockFill : 'transparent',
                                    borderWidth: 1,
                                    borderColor: isChecked ? appTheme.colors.accent : appTheme.colors.border,
                                    padding: 12,
                                    marginBottom: idx === warmup.length - 1 ? 0 : 10
                                }}
                            >
                                <View style={{ flex: 1, marginRight: 16 }}>
                                    <Text style={{
                                        color: isChecked ? appTheme.colors.textTertiary : appTheme.colors.textPrimary,
                                        fontFamily: appTheme.typography.fontFamily.heading,
                                        fontSize: 14,
                                        textTransform: 'uppercase',
                                        textDecorationLine: isChecked ? 'line-through' : 'none'
                                    }}>
                                        {item.name}
                                    </Text>
                                    <Text style={{
                                        color: appTheme.colors.textSecondary,
                                        fontFamily: appTheme.typography.fontFamily.mono,
                                        fontSize: 10,
                                        marginTop: 4
                                    }}>
                                        {item.focus}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{
                                        color: appTheme.colors.accent,
                                        fontFamily: appTheme.typography.fontFamily.monoBold,
                                        fontSize: 10,
                                        marginRight: 12
                                    }}>
                                        {item.duration}
                                    </Text>
                                    <View style={{
                                        width: 18,
                                        height: 18,
                                        borderWidth: 1,
                                        borderColor: isChecked ? appTheme.colors.accent : appTheme.colors.border,
                                        backgroundColor: isChecked ? appTheme.colors.accent : 'transparent',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        {isChecked && (
                                            <Feather name="check" size={12} color="#000000" strokeWidth={3} />
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {isAllCompleted && (
                        <View style={{
                            marginTop: 16,
                            backgroundColor: 'rgba(204, 255, 0, 0.1)',
                            borderWidth: 1,
                            borderColor: appTheme.colors.accent,
                            padding: 12,
                            alignItems: 'center'
                        }}>
                            <Text style={{
                                color: appTheme.colors.accent,
                                fontFamily: appTheme.typography.fontFamily.monoBold,
                                fontSize: 10,
                                letterSpacing: 2,
                                textTransform: 'uppercase'
                            }}>
                                [ WARMUP PROTOCOL COMPLETE - READY FOR LOAD ]
                            </Text>
                        </View>
                    )}
                </Animated.View>
            )}
        </View>
    );
}
