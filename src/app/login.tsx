import { AuthService } from '@/utils/AuthService';
import { useAlertStore } from '@/store/useAlertStore';
import appTheme from '@/theme';
import { Feather } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { CatalystLogo } from '@/components/CatalystLogo';

// Animated input field — border glows on focus
const GlowInput = ({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    delay,
}: {
    label: string;
    icon: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    keyboardType?: any;
    autoCapitalize?: any;
    delay: number;
}) => {
    const borderColor = useSharedValue(0); // 0 = dim, 1 = accent

    const containerStyle = useAnimatedStyle(() => ({
        borderColor: borderColor.value === 1 ? '#CCFF00' : '#333333',
        shadowOpacity: borderColor.value * 0.25,
        shadowColor: '#CCFF00',
        shadowRadius: borderColor.value * 10,
        shadowOffset: { width: 0, height: 0 },
    }));

    const onFocus = () => {
        borderColor.value = withTiming(1, { duration: 220 });
    };

    const onBlur = () => {
        borderColor.value = withTiming(0, { duration: 300 });
    };

    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(500).easing(Easing.out(Easing.cubic))} style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{label}</Text>
            <Animated.View style={[styles.inputBox, containerStyle]}>
                <Feather name={icon as any} size={18} color={appTheme.colors.textTertiary} style={{ marginRight: 12 }} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={appTheme.colors.textTertiary}
                    value={value}
                    onChangeText={onChangeText}
                    autoCapitalize={autoCapitalize}
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
            </Animated.View>
        </Animated.View>
    );
};

export default function LoginScreen() {
    const { showAlert } = useAlertStore();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Button press ripple scale
    const btnScale = useSharedValue(1);

    const handleSubmit = async () => {
        if (!email || !password) {
            showAlert('INVALID_INPUT', 'Please provide both an email and a password.', 'ERROR');
            return;
        }

        // Button press feedback
        btnScale.value = withSequence(
            withSpring(0.96, { damping: 20, stiffness: 300 }),
            withSpring(1, { damping: 20, stiffness: 300 })
        );

        setIsLoading(true);
        try {
            const { user, error } = isLogin
                ? await AuthService.login(email, password)
                : await AuthService.register(email, password);

            if (error) {
                showAlert('AUTH_FAILURE', error, 'ERROR');
            }
        } catch (e) {
            showAlert('SYSTEM_CRITICAL', 'An unexpected error occurred.', 'ERROR');
        } finally {
            setIsLoading(false);
        }
    };

    const btnStyle = useAnimatedStyle(() => ({
        transform: [{ scale: btnScale.value }],
    }));

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Brand Header */}
                    <Animated.View entering={FadeInUp.duration(600).easing(Easing.out(Easing.cubic))} style={styles.header}>
                        {/* Logo with entrance spring */}
                        <CatalystLogo
                            size="lg"
                            glowing
                            pulsing
                            entering
                            style={styles.logo}
                        />

                        {/* Wordmark */}
                        <Animated.Text
                            entering={FadeInUp.delay(200).duration(500)}
                            style={styles.title}
                        >
                            CATALYST
                        </Animated.Text>

                        <Animated.Text
                            entering={FadeInUp.delay(360).duration(500)}
                            style={styles.subtitle}
                        >
                            [ AUTHENTICATION_REQUIRED ]
                        </Animated.Text>
                    </Animated.View>

                    {/* Auth Form */}
                    <View style={styles.formContainer}>
                        <GlowInput
                            label="USER_EMAIL"
                            icon="mail"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="your@email.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            delay={200}
                        />
                        <GlowInput
                            label="USER_PASSWORD"
                            icon="lock"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry
                            delay={320}
                        />

                        <Animated.View
                            entering={FadeInDown.delay(440).duration(500)}
                            style={btnStyle}
                        >
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmit}
                                disabled={isLoading}
                                activeOpacity={0.85}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text style={styles.submitButtonText}>
                                        {isLogin ? '[ INITIALIZE_SESSION ]' : '[ REGISTER_USER ]'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(560).duration(500)}>
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => setIsLogin(!isLogin)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.toggleText}>
                                    {isLogin
                                        ? "Don't have an account? REGISTER"
                                        : 'Already a member? LOGIN'}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* Footer */}
                    <Animated.View entering={FadeInDown.delay(700).duration(500)} style={styles.footer}>
                        <View style={styles.footerLine} />
                        <Text style={styles.footerText}>SECURED_BY_FIREBASE_V22</Text>
                        <View style={styles.footerLine} />
                    </Animated.View>
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
        paddingTop: 48,
        paddingBottom: 40,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 52,
    },
    logo: {
        marginBottom: 28,
    },
    title: {
        color: appTheme.colors.textPrimary,
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 36,
        letterSpacing: 6,
        textAlign: 'center',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    subtitle: {
        color: appTheme.colors.accent,
        fontFamily: 'SpaceMono_700Bold',
        fontSize: 10,
        letterSpacing: 2,
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 22,
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
        height: 56,
        paddingHorizontal: 16,
        elevation: 0,
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
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    submitButtonText: {
        color: '#000',
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 13,
        letterSpacing: 1,
    },
    toggleButton: {
        marginTop: 22,
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
        paddingTop: 36,
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
