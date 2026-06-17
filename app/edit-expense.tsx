import { useDietStore } from '@/store/useDietStore';
import appTheme from '@/theme';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
    KeyboardAvoidingView, 
    Platform, 
    StyleSheet, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View, 
    StatusBar,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditExpenseScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { purchaseHistory, updateExpense, deleteExpense } = useDietStore();

    const [expenseName, setExpenseName] = useState('');
    const [expenseCost, setExpenseCost] = useState('');
    const [expenseReason, setExpenseReason] = useState('');
    const [expenseType, setExpenseType] = useState<'food' | 'supplements' | 'gear' | 'misc'>('misc');
    
    // DateTime Picker State
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        if (id) {
            const exp = purchaseHistory.find(p => p.id === id);
            if (exp) {
                setExpenseName(exp.itemName);
                setExpenseCost(exp.cost.toString());
                setExpenseReason(exp.reason || '');
                setExpenseType(exp.type as any || 'misc');
                
                if (exp.timestamp) {
                    setDate(new Date(exp.timestamp));
                } else if (exp.date) {
                    setDate(new Date(exp.date));
                }
            }
        }
    }, [id, purchaseHistory]);

    const handleSave = () => {
        if (!expenseName.trim() || !expenseCost.trim()) return;

        updateExpense(id as string, {
            itemName: expenseName.trim(),
            cost: parseFloat(expenseCost),
            reason: expenseReason.trim(),
            type: expenseType,
            timestamp: date.toISOString(),
        });
        
        router.back();
    };

    const handleDelete = () => {
        deleteExpense(id as string);
        router.back();
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) setDate(selectedDate);
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedDate) setDate(selectedDate);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Feather name="x" size={24} color={appTheme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>EDIT_EXPENSE</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>ITEM NAME</Text>
                        <TextInput
                            style={styles.input}
                            value={expenseName}
                            onChangeText={setExpenseName}
                            placeholder="Protein Powder"
                            placeholderTextColor={appTheme.colors.textTertiary}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>COST (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={expenseCost}
                            onChangeText={setExpenseCost}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor={appTheme.colors.textTertiary}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>CATEGORY</Text>
                        <View style={styles.categoryRow}>
                            {[
                                { id: 'food', label: 'FOOD', icon: 'coffee' },
                                { id: 'supplements', label: 'SUPPS', icon: 'zap' },
                                { id: 'gear', label: 'GEAR', icon: 'box' },
                                { id: 'misc', label: 'MISC', icon: 'tag' }
                            ].map((cat) => {
                                const isSelected = expenseType === cat.id;
                                return (
                                    <TouchableOpacity 
                                        key={cat.id} 
                                        onPress={() => setExpenseType(cat.id as any)}
                                        style={[
                                            styles.categoryBtn,
                                            isSelected && styles.categoryBtnActive
                                        ]}
                                    >
                                        <Feather name={cat.icon as any} size={14} color={isSelected ? '#000' : appTheme.colors.textTertiary} />
                                        <Text style={[styles.categoryBtnText, isSelected && { color: '#000' }]}>{cat.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>EXACT TIME & DATE</Text>
                        <View style={styles.dateTimeRow}>
                            <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowDatePicker(true)}>
                                <Feather name="calendar" size={16} color={appTheme.colors.accent} />
                                <Text style={styles.dateTimeText}>
                                    {date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowTimePicker(true)}>
                                <Feather name="clock" size={16} color={appTheme.colors.accent} />
                                <Text style={styles.dateTimeText}>
                                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                    
                    {showTimePicker && (
                        <DateTimePicker
                            value={date}
                            mode="time"
                            display="default"
                            onChange={onTimeChange}
                            maximumDate={new Date()}
                        />
                    )}

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>REASON / NOTES</Text>
                        <TextInput
                            style={styles.input}
                            value={expenseReason}
                            onChangeText={setExpenseReason}
                            placeholder="Optional notes"
                            placeholderTextColor={appTheme.colors.textTertiary}
                        />
                    </View>
                </ScrollView>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                        <Feather name="trash-2" size={18} color="#EF4444" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>[ UPDATE_EXPENSE ]</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: appTheme.colors.blockBorder,
        backgroundColor: appTheme.colors.backgroundCard,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        color: appTheme.colors.textPrimary,
        fontSize: 14,
        letterSpacing: 2,
    },
    content: {
        padding: 24,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 10,
        color: appTheme.colors.textSecondary,
        letterSpacing: 2,
        marginBottom: 8,
    },
    input: {
        backgroundColor: appTheme.colors.blockFill,
        borderWidth: 1,
        borderColor: appTheme.colors.blockBorder,
        color: appTheme.colors.textPrimary,
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 16,
        padding: 16,
    },
    categoryRow: {
        flexDirection: 'row',
        gap: 8,
    },
    categoryBtn: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: appTheme.colors.blockFill,
        borderColor: appTheme.colors.blockBorder,
        borderWidth: 1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6
    },
    categoryBtnActive: {
        backgroundColor: appTheme.colors.accent,
        borderColor: appTheme.colors.accent,
    },
    categoryBtnText: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 10,
        color: appTheme.colors.textSecondary,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateTimeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: appTheme.colors.blockFill,
        borderWidth: 1,
        borderColor: appTheme.colors.blockBorder,
        paddingVertical: 16,
    },
    dateTimeText: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        color: appTheme.colors.textPrimary,
        fontSize: 12,
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        gap: 16,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 0 : 24,
        borderTopWidth: 1,
        borderColor: appTheme.colors.blockBorder,
        backgroundColor: appTheme.colors.backgroundCard,
    },
    deleteBtn: {
        width: 56,
        height: 56,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtn: {
        flex: 1,
        height: 56,
        backgroundColor: appTheme.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnText: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 14,
        color: '#000',
        letterSpacing: 2,
    }
});
