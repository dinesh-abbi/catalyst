import appTheme from '@/theme';
import { useDietStore } from '@/store/useDietStore';
import { AuthService } from '@/utils/AuthService';
import { UserProfile, UserService } from '@/utils/UserService';
import { useAlertStore } from '@/store/useAlertStore';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState, useMemo } from 'react';
import { 
    ActivityIndicator, 
    ScrollView, 
    StyleSheet, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProfileScreen() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [weightStr, setWeightStr] = useState('');
    const [heightStr, setHeightStr] = useState('');
    const [ageStr, setAgeStr] = useState('');
    const [targetWeightStr, setTargetWeightStr] = useState('');
    const [expenseName, setExpenseName] = useState('');
    const [expenseCost, setExpenseCost] = useState('');
    const [expenseReason, setExpenseReason] = useState('');
    const [expenseType, setExpenseType] = useState<'food' | 'supplements' | 'gear' | 'misc'>('misc');
    // Date/Time States
    const [expenseDate, setExpenseDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const { showAlert } = useAlertStore();
    const { getMonthlyTotal, addManualExpense, purchaseHistory, setPurchaseHistory } = useDietStore();
    const router = useRouter();


    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        const data = await UserService.getProfile();
        if (data) {
            setProfile(data);
            setWeightStr(data.weight?.toString() || '');
            setHeightStr(data.height?.toString() || '');
            setAgeStr(data.age?.toString() || '');
            setTargetWeightStr(data.targetWeight?.toString() || '');
            if (data.expenses && Array.isArray(data.expenses)) {
                setPurchaseHistory(data.expenses);
            }
        }
        setLoading(false);
    };


    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        
        const updatedProfile = {
            ...profile,
            weight: parseFloat(weightStr.replace(',', '.')) || 0,
            height: parseFloat(heightStr.replace(',', '.')) || 0,
            age: parseInt(ageStr) || 0,
            targetWeight: parseFloat(targetWeightStr.replace(',', '.')) || 0,
        };


        const success = await UserService.updateProfile(updatedProfile);
        setSaving(false);
        
        if (success) {
            setProfile(updatedProfile);
            showAlert('SUCCESS', 'Profile updated systems synchronized.', 'SUCCESS');
        } else {
            showAlert('ERROR', 'Failed to synchronize profile data.', 'ERROR');
        }
    };

    const handleAddExpense = () => {
        if (!expenseName.trim() || !expenseCost.trim()) {
            showAlert('ERROR', 'Item name and cost are required.', 'ERROR');
            return;
        }
        
        const cost = parseFloat(expenseCost.replace(',', '.'));
        if (isNaN(cost) || cost <= 0) {
            showAlert('ERROR', 'Enter a valid cost amount.', 'ERROR');
            return;
        }

        addManualExpense(expenseName.trim(), cost, expenseReason.trim(), expenseType, expenseDate.toISOString());
        setExpenseName('');
        setExpenseCost('');
        setExpenseReason('');
        setExpenseType('misc');
        setExpenseDate(new Date());
        showAlert('SUCCESS', 'Manual expense logged successfully.', 'SUCCESS');
    };


    const handleLogout = async () => {
        const { error } = await AuthService.logout();
        if (error) showAlert('ERROR', error, 'ERROR');
    };



    const currentMonthExpenses = useMemo(() => {
        if (!purchaseHistory) return [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return [...purchaseHistory]
            .filter(p => {
                const d = new Date(p.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [purchaseHistory]);

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={appTheme.colors.accent} />
                <Text style={styles.loadingText}>[ ACCESSING_USER_METADATA ]</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleContainer}>
                            <View style={styles.accentLine} />
                            <Text style={styles.title}>USER_PROFILE</Text>
                        </View>
                        <Text style={styles.emailText}>{profile?.email}</Text>
                    </View>

                    {/* Stats Grid */}
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.section}>
                        <Text style={styles.sectionLabel}>// PHYSICAL_METRICS</Text>
                        
                        <View style={styles.statsGrid}>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>WEIGHT (KG)</Text>
                                <TextInput 
                                    style={styles.statInput}
                                    keyboardType="decimal-pad"
                                    value={weightStr}
                                    onChangeText={setWeightStr}
                                    placeholder="00.0"
                                    placeholderTextColor={appTheme.colors.textTertiary}
                                />
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>HEIGHT (CM)</Text>
                                <TextInput 
                                    style={styles.statInput}
                                    keyboardType="decimal-pad"
                                    value={heightStr}
                                    onChangeText={setHeightStr}
                                    placeholder="000"
                                    placeholderTextColor={appTheme.colors.textTertiary}
                                />
                            </View>
                        </View>

                        <View style={styles.statBoxFull}>
                            <Text style={styles.statLabel}>AGE</Text>
                            <TextInput 
                                style={styles.statInput}
                                keyboardType="number-pad"
                                value={ageStr}
                                onChangeText={setAgeStr}
                                placeholder="00"
                                placeholderTextColor={appTheme.colors.textTertiary}
                            />
                        </View>
                    </Animated.View>

                    {/* Goals Section */}
                    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
                        <Text style={styles.sectionLabel}>// PERFORMANCE_TARGETS</Text>
                        <View style={styles.statBoxFull}>
                            <Text style={styles.statLabel}>TARGET_WEIGHT (KG)</Text>
                            <TextInput 
                                style={styles.statInput}
                                keyboardType="decimal-pad"
                                value={targetWeightStr}
                                onChangeText={setTargetWeightStr}
                                placeholder="00.0"
                                placeholderTextColor={appTheme.colors.textTertiary}
                            />
                        </View>
                    </Animated.View>

                    {/* Fuel Expenses Section */}
                    <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
                        <Text style={styles.sectionLabel}>// FINANCIAL_SYNC</Text>
                        <View style={[styles.statBoxFull, { borderColor: appTheme.colors.accent, backgroundColor: 'rgba(204, 255, 0, 0.05)' }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={styles.statLabel}>MONTHLY_FUEL_EXPENSE</Text>
                                    <Text style={[styles.statInput, { color: appTheme.colors.accent }]}>₹{getMonthlyTotal()}</Text>
                                </View>
                                <Feather name="trending-up" size={24} color={appTheme.colors.accent} />
                            </View>
                            <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 10, marginTop: 12, letterSpacing: 1 }}>
                                [ SYSTEM NOTE: GROCERY COSTS LOGGED FROM SHOPPING LIST AND MANUAL ENTRY ]
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Manual Expenses Section */}
                    <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
                        <Text style={styles.sectionLabel}>// LOG_MANUAL_EXPENSE</Text>
                        
                        <View style={styles.statsGrid}>
                            <View style={[styles.statBox, { flex: 2 }]}>
                                <Text style={styles.statLabel}>ITEM / SERVICE</Text>
                                <TextInput 
                                    style={[styles.statInput, { fontSize: 16 }]}
                                    value={expenseName}
                                    onChangeText={setExpenseName}
                                    placeholder="e.g. Supplements"
                                    placeholderTextColor={appTheme.colors.textTertiary}
                                />
                            </View>
                            <View style={[styles.statBox, { flex: 1 }]}>
                                <Text style={styles.statLabel}>COST (₹)</Text>
                                <TextInput 
                                    style={[styles.statInput, { fontSize: 16 }]}
                                    keyboardType="decimal-pad"
                                    value={expenseCost}
                                    onChangeText={setExpenseCost}
                                    placeholder="0"
                                    placeholderTextColor={appTheme.colors.textTertiary}
                                />
                            </View>
                        </View>
                        
                        <View style={styles.statBoxFull}>
                            <Text style={styles.statLabel}>REASON / NOTES</Text>
                            <TextInput 
                                style={[styles.statInput, { fontSize: 16 }]}
                                value={expenseReason}
                                onChangeText={setExpenseReason}
                                placeholder="Why did you buy this?"
                                placeholderTextColor={appTheme.colors.textTertiary}
                            />
                        </View>
                        
                        <View style={{ marginTop: 16 }}>
                            <Text style={styles.statLabel}>EXACT TIME & DATE</Text>
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                                <TouchableOpacity 
                                    style={{ flex: 1, backgroundColor: appTheme.colors.blockFill, borderWidth: 1, borderColor: appTheme.colors.blockBorder, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }} 
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Feather name="calendar" size={14} color={appTheme.colors.accent} />
                                    <Text style={{ fontFamily: appTheme.typography.fontFamily.monoBold, color: appTheme.colors.textPrimary, fontSize: 10 }}>{expenseDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={{ flex: 1, backgroundColor: appTheme.colors.blockFill, borderWidth: 1, borderColor: appTheme.colors.blockBorder, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }} 
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Feather name="clock" size={14} color={appTheme.colors.accent} />
                                    <Text style={{ fontFamily: appTheme.typography.fontFamily.monoBold, color: appTheme.colors.textPrimary, fontSize: 10 }}>{expenseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={expenseDate}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowDatePicker(Platform.OS === 'ios');
                                    if (date) setExpenseDate(date);
                                }}
                                maximumDate={new Date()}
                            />
                        )}
                        {showTimePicker && (
                            <DateTimePicker
                                value={expenseDate}
                                mode="time"
                                display="default"
                                onChange={(event, date) => {
                                    setShowTimePicker(Platform.OS === 'ios');
                                    if (date) setExpenseDate(date);
                                }}
                                maximumDate={new Date()}
                            />
                        )}
                        
                        <View style={{ marginTop: 16 }}>
                            <Text style={styles.statLabel}>CATEGORY</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
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
                                            style={{
                                                flex: 1,
                                                paddingVertical: 10,
                                                backgroundColor: isSelected ? appTheme.colors.accent : appTheme.colors.blockFill,
                                                borderColor: isSelected ? appTheme.colors.accent : appTheme.colors.blockBorder,
                                                borderWidth: 1,
                                                alignItems: 'center',
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                gap: 6
                                            }}
                                        >
                                            <Feather name={cat.icon as any} size={12} color={isSelected ? '#000' : appTheme.colors.textTertiary} />
                                            <Text style={{ fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, color: isSelected ? '#000' : appTheme.colors.textSecondary }}>{cat.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={{ 
                                backgroundColor: appTheme.colors.blockFill, 
                                borderWidth: 1, 
                                borderColor: appTheme.colors.blockBorder,
                                marginTop: 16,
                                paddingVertical: 14,
                                alignItems: 'center'
                            }} 
                            onPress={handleAddExpense}
                        >
                            <Text style={{ fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 12, color: appTheme.colors.textPrimary, letterSpacing: 2 }}>[ ADD_EXPENSE ]</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Expense Timeline Section */}
                    {currentMonthExpenses.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>// EXPENSE_TIMELINE_PREVIEW</Text>
                                <TouchableOpacity onPress={() => router.push('/expenses')}>
                                    <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 9, letterSpacing: 1 }}>[ VIEW LEDGER ]</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity 
                                activeOpacity={0.8}
                                onPress={() => router.push('/expenses')}
                                style={styles.timelineContainer}
                            >
                                {currentMonthExpenses.slice(0, 3).map((expense: any, index: number) => (
                                    <View key={index} style={styles.timelineItem}>
                                        <View style={styles.timelineDot} />
                                        {index !== currentMonthExpenses.length - 1 && <View style={styles.timelineLine} />}
                                        
                                        <View style={styles.timelineContent}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Text style={styles.timelineDate}>{new Date(expense.date).toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase()}</Text>
                                                <Text style={styles.timelineCost}>₹{expense.cost}</Text>
                                            </View>
                                            <Text style={styles.timelineName}>{expense.itemName.toUpperCase()}</Text>
                                            {expense.reason ? (
                                                <Text style={styles.timelineReason}>NOTE: {expense.reason.toUpperCase()}</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                ))}
                            </TouchableOpacity>
                        </Animated.View>
                    )}


                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity 
                            style={styles.saveButton} 
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.saveButtonText}>[ SYNC_CHANGES ]</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Feather name="log-out" size={16} color={appTheme.colors.textTertiary} />
                            <Text style={styles.logoutButtonText}>TERMINATE_SESSION</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appTheme.colors.backgroundMain,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    loadingText: {
        fontFamily: appTheme.typography.fontFamily.mono,
        color: appTheme.colors.textTertiary,
        fontSize: 10,
        marginTop: 16,
        letterSpacing: 2,
    },
    header: {
        marginBottom: 40,
        marginTop: 20,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    accentLine: {
        width: 12,
        height: 2,
        backgroundColor: appTheme.colors.accent,
        marginRight: 10,
    },
    title: {
        fontFamily: appTheme.typography.fontFamily.heading,
        fontSize: 32,
        color: appTheme.colors.textPrimary,
        letterSpacing: 1,
    },
    emailText: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 12,
        color: appTheme.colors.textSecondary,
        marginLeft: 22,
    },
    section: {
        marginBottom: 32,
    },
    sectionLabel: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 10,
        color: appTheme.colors.accent,
        letterSpacing: 2,
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    statBox: {
        flex: 1,
        backgroundColor: appTheme.colors.blockFill,
        borderWidth: 1,
        borderColor: appTheme.colors.blockBorder,
        padding: 16,
    },
    statBoxFull: {
        backgroundColor: appTheme.colors.blockFill,
        borderWidth: 1,
        borderColor: appTheme.colors.blockBorder,
        padding: 16,
    },
    statLabel: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 9,
        color: appTheme.colors.textTertiary,
        letterSpacing: 1,
        marginBottom: 8,
    },
    statInput: {
        fontFamily: appTheme.typography.fontFamily.heading,
        fontSize: 24,
        color: appTheme.colors.textPrimary,
        padding: 0,
    },
    timelineContainer: {
        marginTop: 8,
        paddingLeft: 8,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 16,
        position: 'relative',
    },
    timelineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: appTheme.colors.accent,
        marginTop: 6,
        marginRight: 16,
        zIndex: 2,
    },
    timelineLine: {
        position: 'absolute',
        top: 14,
        bottom: -20,
        left: 3.5,
        width: 1,
        backgroundColor: appTheme.colors.border,
        zIndex: 1,
    },
    timelineContent: {
        flex: 1,
        backgroundColor: appTheme.colors.blockFill,
        borderWidth: 1,
        borderColor: appTheme.colors.blockBorder,
        padding: 12,
    },
    timelineDate: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 10,
        color: appTheme.colors.textSecondary,
        letterSpacing: 1,
    },
    timelineCost: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 12,
        color: appTheme.colors.accent,
    },
    timelineName: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 14,
        color: appTheme.colors.textPrimary,
        marginTop: 4,
    },
    timelineReason: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 9,
        color: appTheme.colors.textTertiary,
        marginTop: 6,
        letterSpacing: 0.5,
    },
    actions: {
        marginTop: 20,
    },
    saveButton: {
        backgroundColor: appTheme.colors.accent,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    saveButtonText: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 14,
        color: '#000',
        letterSpacing: 2,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    logoutButtonText: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 10,
        color: appTheme.colors.textTertiary,
        letterSpacing: 2,
        marginLeft: 10,
        textDecorationLine: 'underline',
    },
});
