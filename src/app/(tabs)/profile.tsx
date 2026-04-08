import appTheme from '@/theme';
import { useDietStore } from '@/store/useDietStore';
import { AuthService } from '@/utils/AuthService';
import { UserProfile, UserService } from '@/utils/UserService';
import { useAlertStore } from '@/store/useAlertStore';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
    const { showAlert } = useAlertStore();
    const { getMonthlyTotal } = useDietStore();


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


    const handleLogout = async () => {
        const { error } = await AuthService.logout();
        if (error) showAlert('ERROR', error, 'ERROR');
    };



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
                                [ SYSTEM NOTE: GROCERY COSTS LOGGED FROM SHOPPING LIST ]
                            </Text>
                        </View>
                    </Animated.View>


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
