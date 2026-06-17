import { useDietStore } from '@/store/useDietStore';
import appTheme from '@/theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExpensesScreen() {
    const router = useRouter();
    const { purchaseHistory } = useDietStore();

    const sortedHistory = useMemo(() => {
        if (!purchaseHistory) return [];
        return [...purchaseHistory].sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
            return timeB - timeA;
        });
    }, [purchaseHistory]);

    const getCategoryStyles = (type?: string) => {
        switch (type) {
            case 'food':
                return { icon: 'coffee', color: appTheme.colors.accent, bg: 'rgba(204, 255, 0, 0.15)' };
            case 'supplements':
                return { icon: 'zap', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)' };
            case 'gear':
                return { icon: 'box', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' };
            case 'misc':
            default:
                return { icon: 'tag', color: appTheme.colors.textSecondary, bg: appTheme.colors.blockFill };
        }
    };

    const formatTimestamp = (timestamp?: string) => {
        if (!timestamp) return '12:00 AM';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString([], { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        }).toUpperCase();
    };

    // Calculate total spend
    const totalSpend = useMemo(() => {
        return sortedHistory.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
    }, [sortedHistory]);

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const cat = getCategoryStyles(item.type);
        const isLast = index === sortedHistory.length - 1;
        
        return (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(500)}>
                <TouchableOpacity 
                    style={styles.transactionRow}
                    activeOpacity={0.7}
                    onPress={() => item.id ? router.push(`/edit-expense?id=${item.id}`) : null}
                >
                    {/* Timeline connector */}
                    {!isLast && <View style={styles.timelineConnector} />}
                    
                    {/* Icon Box */}
                    <View style={[styles.iconBox, { backgroundColor: cat.bg, borderColor: cat.color }]}>
                        <Feather name={cat.icon as any} size={20} color={cat.color} />
                    </View>
                    
                    {/* Details */}
                    <View style={styles.transactionDetails}>
                        <Text style={styles.itemName}>{item.itemName.toUpperCase()}</Text>
                        {item.reason ? (
                            <Text style={styles.itemReason}>NOTE: {item.reason.toUpperCase()}</Text>
                        ) : null}
                        <View style={styles.dateTimeContainer}>
                            <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
                            <Text style={styles.itemBullet}>•</Text>
                            <Text style={styles.itemDate}>{formatTimestamp(item.timestamp)}</Text>
                        </View>
                    </View>
                    
                    {/* Cost */}
                    <View style={styles.costContainer}>
                        <Text style={[styles.itemCost, { color: cat.color }]}>-₹{item.cost}</Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="chevron-left" size={28} color={appTheme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>FINANCIAL_LEDGER</Text>
            </View>

            <FlatList
                contentContainerStyle={styles.listContent}
                data={sortedHistory}
                keyExtractor={(item, index) => `${item.date}-${index}`}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryLabel}>// LIFETIME_EXPENSES</Text>
                        <Text style={styles.summaryTotal}>₹{totalSpend}</Text>
                        <View style={styles.summaryDivider} />
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Feather name="inbox" size={40} color={appTheme.colors.blockBorder} />
                        <Text style={styles.emptyText}>[ NO_TRANSACTIONS_FOUND ]</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appTheme.colors.backgroundMain,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: appTheme.colors.blockBorder,
        backgroundColor: appTheme.colors.backgroundCard,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        color: appTheme.colors.textPrimary,
        fontSize: 16,
        letterSpacing: 2,
    },
    listContent: {
        padding: 24,
        paddingBottom: 100,
    },
    summaryContainer: {
        marginBottom: 32,
    },
    summaryLabel: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 12,
        color: appTheme.colors.textSecondary,
        letterSpacing: 2,
        marginBottom: 8,
    },
    summaryTotal: {
        fontFamily: appTheme.typography.fontFamily.heading,
        fontSize: 48,
        color: appTheme.colors.textPrimary,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: appTheme.colors.border,
        opacity: 0.3,
        marginTop: 20,
    },
    transactionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 30,
        position: 'relative',
    },
    timelineConnector: {
        position: 'absolute',
        top: 45,
        left: 23,
        width: 2,
        height: '110%',
        backgroundColor: appTheme.colors.blockFill,
        zIndex: -1,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        zIndex: 1,
    },
    transactionDetails: {
        flex: 1,
        paddingTop: 4,
    },
    itemName: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 16,
        color: appTheme.colors.textPrimary,
        marginBottom: 4,
    },
    itemReason: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 10,
        color: appTheme.colors.textTertiary,
        marginBottom: 6,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemDate: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 10,
        color: appTheme.colors.textSecondary,
        letterSpacing: 0.5,
    },
    itemBullet: {
        color: appTheme.colors.textTertiary,
        marginHorizontal: 6,
        fontSize: 10,
    },
    costContainer: {
        paddingTop: 4,
        alignItems: 'flex-end',
    },
    itemCost: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 12,
        color: appTheme.colors.textTertiary,
        marginTop: 16,
        letterSpacing: 2,
    },
});
