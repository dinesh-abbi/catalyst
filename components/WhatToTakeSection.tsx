import appTheme from '@/theme';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface WhatToTakeSectionProps {
    whatToTake: string[];
}

export function WhatToTakeSection({ whatToTake }: WhatToTakeSectionProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [takenItems, setTakenItems] = useState<Record<number, boolean>>({});

    if (!whatToTake || whatToTake.length === 0) return null;

    const toggleTaken = (idx: number) => {
        setTakenItems(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const takenCount = Object.values(takenItems).filter(Boolean).length;
    const isAllTaken = takenCount === whatToTake.length;

    return (
        <View style={{ backgroundColor: appTheme.colors.backgroundCard, borderWidth: 1, borderColor: appTheme.colors.border, padding: 16, marginBottom: 24 }}>
            {/* Header */}
            <TouchableOpacity
                onPress={() => setCollapsed(!collapsed)}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
                <View style={{ flex: 1 }}>
                    <Text style={{ color: appTheme.colors.accentTertiary || '#00E5FF', fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
                        [ INTRA_NUTRITION_SUPPLEMENTS ]
                    </Text>
                    <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.heading, fontSize: 18, textTransform: 'uppercase' }}>
                        WHAT TO TAKE ({takenCount}/{whatToTake.length} taken)
                    </Text>
                </View>
                <Feather
                    name={collapsed ? "chevron-down" : "chevron-up"}
                    size={20}
                    color={appTheme.colors.accentTertiary || '#00E5FF'}
                />
            </TouchableOpacity>

            {/* List */}
            {!collapsed && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={{ marginTop: 16 }}>
                    {whatToTake.map((item, idx) => {
                        const isChecked = !!takenItems[idx];
                        
                        // Parse prefix type (Pre-Workout, Intra-Workout, Post-Workout, Weekly Prep, Nutrition)
                        let prefix = "";
                        let cleanText = item;
                        if (item.includes(":")) {
                            const parts = item.split(":", 2);
                            prefix = parts[0].trim().toUpperCase();
                            cleanText = parts[1].trim();
                        }

                        return (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => toggleTaken(idx)}
                                activeOpacity={0.8}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: isChecked ? appTheme.colors.blockFill : 'transparent',
                                    borderWidth: 1,
                                    borderColor: isChecked ? (appTheme.colors.accentTertiary || '#00E5FF') : appTheme.colors.border,
                                    padding: 12,
                                    marginBottom: idx === whatToTake.length - 1 ? 0 : 10
                                }}
                            >
                                <View style={{ flex: 1, marginRight: 16 }}>
                                    {prefix ? (
                                        <Text style={{
                                            color: isChecked ? appTheme.colors.textTertiary : (appTheme.colors.accentTertiary || '#00E5FF'),
                                            fontFamily: appTheme.typography.fontFamily.monoBold,
                                            fontSize: 9,
                                            letterSpacing: 1,
                                            marginBottom: 2
                                        }}>
                                            {prefix}
                                        </Text>
                                    ) : null}
                                    <Text style={{
                                        color: isChecked ? appTheme.colors.textTertiary : appTheme.colors.textPrimary,
                                        fontFamily: appTheme.typography.fontFamily.heading,
                                        fontSize: 14,
                                        textDecorationLine: isChecked ? 'line-through' : 'none'
                                    }}>
                                        {cleanText}
                                    </Text>
                                </View>
                                <View style={{
                                    width: 18,
                                    height: 18,
                                    borderWidth: 1,
                                    borderColor: isChecked ? (appTheme.colors.accentTertiary || '#00E5FF') : appTheme.colors.border,
                                    backgroundColor: isChecked ? (appTheme.colors.accentTertiary || '#00E5FF') : 'transparent',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    {isChecked && (
                                        <Feather name="check" size={12} color="#000000" strokeWidth={3} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {isAllTaken && (
                        <View style={{
                            marginTop: 16,
                            backgroundColor: 'rgba(0, 229, 255, 0.1)',
                            borderWidth: 1,
                            borderColor: appTheme.colors.accentTertiary || '#00E5FF',
                            padding: 12,
                            alignItems: 'center'
                        }}>
                            <Text style={{
                                color: appTheme.colors.accentTertiary || '#00E5FF',
                                fontFamily: appTheme.typography.fontFamily.monoBold,
                                fontSize: 10,
                                letterSpacing: 2,
                                textTransform: 'uppercase'
                            }}>
                                [ SUPPLEMENTATION / DIET PREP LOGGED ]
                            </Text>
                        </View>
                    )}
                </Animated.View>
            )}
        </View>
    );
}
