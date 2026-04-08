import { ExpenseService } from '@/utils/ExpenseService';
import { useDietStore } from '@/store/useDietStore';
import appTheme from '@/theme';
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface GroceryListModalProps {
    visible: boolean;
    onClose: () => void;
    groceryData: any;
}

export function GroceryListModal({ visible, onClose, groceryData }: GroceryListModalProps) {
    const { currentDay, boughtItems, toggleBoughtItem } = useDietStore();
    const [showAll, setShowAll] = useState(false);

    if (!groceryData) return null;

    const isMonthlyDay = currentDay === 1;
    const isWeeklyDay = [1, 8, 15, 22].includes(currentDay);

    const filteredData = useMemo(() => {
        if (showAll) return groceryData;
        return {
            monthly: isMonthlyDay ? groceryData.monthly : [],
            weekly: isWeeklyDay ? groceryData.weekly : [],
            daily: groceryData.daily,
        };
    }, [showAll, currentDay, groceryData]);

    const totalBudget = useMemo(() => {
        let total = 0;
        ['monthly', 'weekly', 'daily'].forEach(cat => {
            filteredData[cat]?.forEach((item: any) => {
                total += item.cost;
            });
        });
        return total;
    }, [filteredData]);

    const remainingBudget = useMemo(() => {
        let total = 0;
        ['monthly', 'weekly', 'daily'].forEach(cat => {
            filteredData[cat]?.forEach((item: any) => {
                if (!boughtItems[item.item]) {
                    total += item.cost;
                }
            });
        });
        return total;
    }, [filteredData, boughtItems]);

    const handleToggle = async (item: string, cost: number, category: 'monthly' | 'weekly' | 'daily') => {
        const isCurrentlyBought = !!boughtItems[item];
        toggleBoughtItem(item, cost);

        if (!isCurrentlyBought) {
            // Log to Firestore if we are marking it as bought
            await ExpenseService.logPurchase({
                itemName: item,
                cost: cost,
                category: category,
                date: new Date().toISOString().split('T')[0]
            });
        }
    };

    const renderSection = (title: string, items: { item: string, cost: number }[], category: 'monthly' | 'weekly' | 'daily') => {
        if (!items || items.length === 0) return null;
        return (
            <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 8, height: 8, backgroundColor: appTheme.colors.accent, marginRight: 8 }} />
                    <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.heading, fontSize: 18, textTransform: 'uppercase' }}>
                        {title}
                    </Text>
                </View>
                {items.map((entry, idx) => {
                    const isBought = !!boughtItems[entry.item];
                    return (
                        <TouchableOpacity 
                            key={idx} 
                            onPress={() => handleToggle(entry.item, entry.cost, category)}
                            activeOpacity={0.7}
                            style={{ 
                                flexDirection: 'row', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                backgroundColor: isBought ? 'transparent' : appTheme.colors.blockFill, 
                                borderWidth: 1, 
                                borderColor: isBought ? appTheme.colors.border : appTheme.colors.blockBorder, 
                                padding: 12, 
                                marginBottom: 12,
                                opacity: isBought ? 0.4 : 1
                            }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <View style={{ 
                                    width: 18, 
                                    height: 18, 
                                    borderWidth: 1, 
                                    borderColor: isBought ? appTheme.colors.accent : appTheme.colors.textTertiary, 
                                    backgroundColor: isBought ? appTheme.colors.accent : 'transparent',
                                    marginRight: 12,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    {isBought && <Feather name="check" size={12} color="#000" />}
                                </View>
                                <Text style={{ 
                                    color: isBought ? appTheme.colors.textTertiary : appTheme.colors.textSecondary, 
                                    fontFamily: appTheme.typography.fontFamily.mono, 
                                    fontSize: 14, 
                                    flex: 1,
                                    textDecorationLine: isBought ? 'line-through' : 'none'
                                }}>
                                    {entry.item}
                                </Text>
                            </View>
                            <Text style={{ 
                                color: isBought ? appTheme.colors.textTertiary : appTheme.colors.accent, 
                                fontFamily: appTheme.typography.fontFamily.monoBold, 
                                fontSize: 14,
                                textDecorationLine: isBought ? 'line-through' : 'none'
                            }}>
                                ₹{entry.cost}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
                <View style={{ 
                    backgroundColor: appTheme.colors.backgroundMain, 
                    height: '90%', 
                    borderTopWidth: 1, 
                    borderTopColor: appTheme.colors.accent,
                    paddingTop: 16
                }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: appTheme.colors.border }}>
                        <View>
                            <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.heading, fontSize: 24, textTransform: 'uppercase', letterSpacing: -0.5 }}>
                                Shopping List
                            </Text>
                            <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, marginTop: 4 }}>
                                // DAY {currentDay} REQUIREMENTS
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                            <Feather name="x" size={24} color={appTheme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Quick Stats & Toggle */}
                    <View style={{ flexDirection: 'row', padding: 16, backgroundColor: appTheme.colors.backgroundCard, borderBottomWidth: 1, borderBottomColor: appTheme.colors.border }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, letterSpacing: 1 }}>TOTAL BUDGET</Text>
                            <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.heading, fontSize: 20 }}>₹{totalBudget}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, letterSpacing: 1 }}>REMAINING</Text>
                            <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.heading, fontSize: 20 }}>₹{remainingBudget}</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowAll(!showAll)}
                            style={{ 
                                alignSelf: 'center',
                                paddingVertical: 6, 
                                paddingHorizontal: 10, 
                                borderWidth: 1, 
                                borderColor: showAll ? appTheme.colors.accent : appTheme.colors.border,
                                backgroundColor: showAll ? 'rgba(204, 255, 0, 0.1)' : 'transparent'
                            }}>
                            <Text style={{ color: showAll ? appTheme.colors.accent : appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10 }}>
                                {showAll ? '[ SHOW SMART ]' : '[ SHOW ALL ]'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                        {renderSection('Monthly', filteredData.monthly, 'monthly')}
                        {renderSection('Weekly', filteredData.weekly, 'weekly')}
                        {renderSection('Daily', filteredData.daily, 'daily')}
                        
                        {!showAll && !isMonthlyDay && !isWeeklyDay && (
                            <View style={{ padding: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: appTheme.colors.border, alignItems: 'center' }}>
                                <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 12, textAlign: 'center' }}>
                                    Only daily essentials shown for today.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
