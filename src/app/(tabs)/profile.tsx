import appTheme from '@/theme';
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
    const { showAlert } = useAlertStore();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        const data = await UserService.getProfile();
        setProfile(data);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        const success = await UserService.updateProfile(profile);
        setSaving(false);
        
        if (success) {
            showAlert('SUCCESS', 'Profile updated systems synchronized.', 'SUCCESS');
        } else {
            showAlert('ERROR', 'Failed to synchronize profile data.', 'ERROR');
        }
    };

    const handleLogout = async () => {
        const { error } = await AuthService.logout();
        if (error) showAlert('ERROR', error, 'ERROR');
    };

    const updateField = (field: keyof UserProfile, value: string) => {
        if (!profile) return;
        const numValue = parseFloat(value) || 0;
        setProfile({ ...profile, [field]: numValue });
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
                                    keyboardType="numeric"
                                    value={profile?.weight?.toString() || ''}
                                    onChangeText={(v) => updateField('weight', v)}
                                    placeholder="00.0"
                                    placeholderTextColor={appTheme.colors.textTertiary}
                                />
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>HEIGHT (CM)</Text>
                                <TextInput 
                                    style={styles.statInput}
                                    keyboardType="numeric"
                                    value={profile?.height?.toString() || ''}
                                    onChangeText={(v) => updateField('height', v)}
                                    placeholder="000"
                                    placeholderTextColor={appTheme.colors.textTertiary}
                                />
                            </View>
                        </View>

                        <View style={styles.statBoxFull}>
                            <Text style={styles.statLabel}>AGE</Text>
                            <TextInput 
                                style={styles.statInput}
                                keyboardType="numeric"
                                value={profile?.age?.toString() || ''}
                                onChangeText={(v) => updateField('age', v)}
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
                                keyboardType="numeric"
                                value={profile?.targetWeight?.toString() || ''}
                                onChangeText={(v) => updateField('targetWeight', v)}
                                placeholder="00.0"
                                placeholderTextColor={appTheme.colors.textTertiary}
                            />
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
