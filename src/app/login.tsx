import { AuthService } from '@/utils/AuthService';
import { useAlertStore } from '@/store/useAlertStore';
import appTheme from '@/theme';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { 
    ActivityIndicator, 
    KeyboardAvoidingView, 
    Platform, 
    ScrollView, 
    StyleSheet, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View,
    Alert,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
    const { showAlert } = useAlertStore();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email || !password) {
            showAlert('INVALID_INPUT', 'Please provide both an email and a password.', 'ERROR');
            return;
        }

        setIsLoading(true);
        try {
            const { user, error } = isLogin 
                ? await AuthService.login(email, password)
                : await AuthService.register(email, password);

            if (error) {
                showAlert('AUTH_FAILURE', error, 'ERROR');
            }
            // User state will be handled by the root layout listener
        } catch (e) {
            console.error('System error:', e);
            showAlert('SYSTEM_CRITICAL', 'An unexpected error occurred.', 'ERROR');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Brand Header */}
                    <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Feather name="zap" size={40} color={appTheme.colors.accent} />
                        </View>
                        <Text style={styles.title}>CATALYST</Text>
                        <Text style={styles.subtitle}>[ AUTHENTICATION_REQUIRED ]</Text>
                    </Animated.View>

                    {/* Auth Form */}
                    <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.formContainer}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>USER_EMAIL</Text>
                            <View style={styles.inputBox}>
                                <Feather name="mail" size={18} color={appTheme.colors.textTertiary} style={{ marginRight: 12 }} />
                                <TextInput 
                                    style={styles.input}
                                    placeholder="your@email.com"
                                    placeholderTextColor={appTheme.colors.textTertiary}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>USER_PASSWORD</Text>
                            <View style={styles.inputBox}>
                                <Feather name="lock" size={18} color={appTheme.colors.textTertiary} style={{ marginRight: 12 }} />
                                <TextInput 
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={appTheme.colors.textTertiary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {isLogin ? '[ INITIALIZE_SESSION ]' : '[ REGISTER_USER ]'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.toggleButton}
                            onPress={() => setIsLogin(!isLogin)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.toggleText}>
                                {isLogin 
                                    ? "Don't have an account? REGISTER" 
                                    : "Already a member? LOGIN"}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Visual Footnote */}
                    <View style={styles.footer}>
                        <View style={styles.footerLine} />
                        <Text style={styles.footerText}>SECURED_BY_FIREBASE_V22</Text>
                        <View style={styles.footerLine} />
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: 60,
        paddingBottom: 40,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderWidth: 1,
        borderColor: appTheme.colors.accent,
        backgroundColor: appTheme.colors.blockFill,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        // Neon glow
        shadowColor: appTheme.colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    title: {
        color: appTheme.colors.textPrimary,
        ...(appTheme.typography.h1 as any),
        fontSize: 40,
        letterSpacing: 4,
        textAlign: 'center',
        textTransform: 'uppercase' as const,
    },
    subtitle: {
        color: appTheme.colors.accent,
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 10,
        letterSpacing: 2,
        marginTop: 8,
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 24,
    },
    inputLabel: {
        color: appTheme.colors.textSecondary,
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 10,
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appTheme.colors.blockFill,
        borderWidth: 1,
        borderColor: appTheme.colors.blockBorder,
        height: 56,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        color: appTheme.colors.textPrimary,
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: appTheme.colors.accent,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    submitButtonText: {
        color: '#000',
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 14,
        letterSpacing: 1,
    },
    toggleButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    toggleText: {
        color: appTheme.colors.textTertiary,
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: 40,
    },
    footerLine: {
        flex: 1,
        height: 1,
        backgroundColor: appTheme.colors.border,
        opacity: 0.3,
    },
    footerText: {
        color: appTheme.colors.textTertiary,
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 8,
        marginHorizontal: 16,
        letterSpacing: 1,
    },
});
