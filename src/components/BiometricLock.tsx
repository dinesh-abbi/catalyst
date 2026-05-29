import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import appTheme from '@/theme';
import { CatalystLogo } from './CatalystLogo';

interface BiometricLockProps {
    onSuccess: () => void;
}

// One concentric sonar ring
const SonarRing = ({
    size,
    delay,
    color,
    active,
}: {
    size: number;
    delay: number;
    color: string;
    active: boolean;
}) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (!active) {
            scale.value = 1;
            opacity.value = 0;
            return;
        }
        const run = () => {
            scale.value = 1;
            opacity.value = 0.6;
            scale.value = withRepeat(
                withTiming(1.8, { duration: 1800 + delay * 300, easing: Easing.out(Easing.quad) }),
                -1,
                false
            );
            opacity.value = withRepeat(
                withTiming(0, { duration: 1800 + delay * 300, easing: Easing.out(Easing.cubic) }),
                -1,
                false
            );
        };
        const t = setTimeout(run, delay * 400);
        return () => clearTimeout(t);
    }, [active, color]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.sonarRing,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderColor: color,
                    shadowColor: color,
                },
                style,
            ]}
        />
    );
};

export const BiometricLock = ({ onSuccess }: BiometricLockProps) => {
    const [authError, setAuthError] = useState<string | null>(null);
    const [authenticating, setAuthenticating] = useState(false);

    // Screen entrance — slides up from below
    const translateY = useSharedValue(90);
    const masterOpacity = useSharedValue(0);

    // Shake animation on error
    const shakeX = useSharedValue(0);

    // Success collapse
    const successScale = useSharedValue(1);
    const successOpacity = useSharedValue(1);

    const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(style);
    };

    useEffect(() => {
        // Entrance slide-up spring
        translateY.value = withSpring(0, { damping: 20, stiffness: 180, mass: 0.9 });
        masterOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });

        // Auto-trigger biometric prompt
        handleBiometricAuth();
    }, []);

    const triggerShake = () => {
        shakeX.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(-8, { duration: 50 }),
            withTiming(8, { duration: 50 }),
            withTiming(-5, { duration: 50 }),
            withTiming(0, { duration: 50 })
        );
    };

    const triggerSuccessExit = () => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        // Logo implodes, screen fades
        successScale.value = withTiming(1.15, { duration: 160 }, () => {
            successScale.value = withTiming(0.6, { duration: 200 });
        });
        successOpacity.value = withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }, (finished) => {
            if (finished) runOnJS(onSuccess)();
        });
    };

    const handleBiometricAuth = async () => {
        if (authenticating) return;
        setAuthenticating(true);
        setAuthError(null);

        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                triggerSuccessExit();
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Verify to continue',
                fallbackLabel: 'Use Passcode',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });

            if (result.success) {
                triggerSuccessExit();
            } else {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                if (result.error !== 'user_cancel') {
                    setAuthError(`ACCESS DENIED`);
                    triggerShake();
                }
            }
        } catch (e) {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            setAuthError('SHIELD ERROR');
            triggerShake();
        } finally {
            setAuthenticating(false);
        }
    };

    const containerStyle = useAnimatedStyle(() => ({
        opacity: masterOpacity.value * successOpacity.value,
        transform: [
            { translateY: translateY.value },
            { translateX: shakeX.value },
            { scale: successScale.value },
        ],
    }));

    const ringColor = authError ? appTheme.colors.accentSecondary : appTheme.colors.accent;

    return (
        <View style={styles.backdrop}>
            <Animated.View style={[styles.content, containerStyle]}>
                {/* Logo + Sonar Stage */}
                <View style={styles.sonarStage}>
                    {/* Three sonar rings behind logo */}
                    <SonarRing size={220} delay={0} color={ringColor} active={!authError} />
                    <SonarRing size={170} delay={1} color={ringColor} active={!authError} />
                    <SonarRing size={120} delay={2} color={ringColor} active={!authError} />

                    {/* Error static rings */}
                    {authError && (
                        <>
                            <Animated.View style={[styles.sonarRing, { width: 180, height: 180, borderRadius: 90, borderColor: appTheme.colors.accentSecondary, shadowColor: appTheme.colors.accentSecondary, opacity: 0.35 }]} />
                            <Animated.View style={[styles.sonarRing, { width: 130, height: 130, borderRadius: 65, borderColor: appTheme.colors.accentSecondary, shadowColor: appTheme.colors.accentSecondary, opacity: 0.2 }]} />
                        </>
                    )}

                    {/* Logo */}
                    <CatalystLogo
                        size="lg"
                        glowing={!authError}
                        pulsing={!authError && !authenticating}
                        tintColor={authError ? appTheme.colors.accentSecondary : appTheme.colors.accent}
                    />
                </View>

                {/* Title */}
                <Text style={styles.title}>
                    {authError ? 'Verification Failed' : 'Welcome Back'}
                </Text>
                <Text style={[styles.subtitle, authError ? { color: appTheme.colors.accentSecondary } : {}]}>
                    {authError
                        ? 'Authentication unsuccessful'
                        : authenticating
                        ? 'Scanning...'
                        : 'Confirm your identity to continue'}
                </Text>

                {/* Tap button */}
                <TouchableOpacity
                    style={[styles.button, authError ? styles.buttonError : {}]}
                    onPress={handleBiometricAuth}
                    activeOpacity={0.75}
                    disabled={authenticating}
                >
                    <Text style={[styles.buttonText, authError ? { color: appTheme.colors.accentSecondary } : {}]}>
                        {authenticating ? 'Scanning...' : authError ? 'Try Again' : 'Use Biometrics'}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
        zIndex: 9998,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '82%',
    },
    sonarStage: {
        width: 240,
        height: 240,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    sonarRing: {
        position: 'absolute',
        borderWidth: 1.5,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 0,
    },
    title: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 22,
        color: '#FFFFFF',
        letterSpacing: 3,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'SpaceMono_700Bold',
        fontSize: 10,
        color: appTheme.colors.accent,
        letterSpacing: 3,
        marginBottom: 48,
        textAlign: 'center',
    },
    button: {
        width: '100%',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#CCFF00',
        paddingVertical: 18,
        alignItems: 'center',
    },
    buttonError: {
        borderColor: appTheme.colors.accentSecondary,
    },
    buttonText: {
        fontFamily: 'SpaceMono_700Bold',
        fontSize: 11,
        color: '#CCFF00',
        letterSpacing: 2,
    },
});
