import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const LOGO = require('../../assets/images/adaptive-icon.png');

const SIZE_MAP = {
    sm: { img: 40, container: 56, glowRadius: 28, glowWidth: 72 },
    md: { img: 56, container: 72, glowRadius: 36, glowWidth: 96 },
    lg: { img: 80, container: 100, glowRadius: 50, glowWidth: 140 },
    xl: { img: 110, container: 140, glowRadius: 70, glowWidth: 190 },
};

interface CatalystLogoProps {
    size?: keyof typeof SIZE_MAP;
    /** Render with neon acid-green glow rings */
    glowing?: boolean;
    /** Continuously breathe/pulse in size */
    pulsing?: boolean;
    /** Animate entrance on mount (spring in from scale 0.6) */
    entering?: boolean;
    /** Override tint color — defaults to acid green #CCFF00 */
    tintColor?: string;
    style?: object;
}

export const CatalystLogo = ({
    size = 'lg',
    glowing = true,
    pulsing = false,
    entering = false,
    tintColor = '#CCFF00',
    style,
}: CatalystLogoProps) => {
    const dim = SIZE_MAP[size];

    // Entrance animation
    const scale = useSharedValue(entering ? 0.55 : 1);
    const opacity = useSharedValue(entering ? 0 : 1);

    // Breathing pulse
    const breathScale = useSharedValue(1);

    // Glow ring 1 — slow ambient pulse
    const glowOp1 = useSharedValue(glowing ? 0.15 : 0);
    // Glow ring 2 — slightly offset phase
    const glowOp2 = useSharedValue(glowing ? 0.08 : 0);

    useEffect(() => {
        if (entering) {
            scale.value = withSpring(1, { damping: 14, stiffness: 120, mass: 0.8 });
            opacity.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.quad) });
        }

        if (pulsing) {
            breathScale.value = withRepeat(
                withSequence(
                    withTiming(1.04, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
                    withTiming(1.0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                true
            );
        }

        if (glowing) {
            glowOp1.value = withRepeat(
                withSequence(
                    withTiming(0.55, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0.15, { duration: 1200, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                true
            );
            glowOp2.value = withRepeat(
                withSequence(
                    withTiming(0.25, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0.06, { duration: 1600, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                true
            );
        }
    }, []);

    const wrapperStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value * breathScale.value }],
        opacity: opacity.value,
    }));

    const glow1Style = useAnimatedStyle(() => ({
        opacity: glowOp1.value,
    }));

    const glow2Style = useAnimatedStyle(() => ({
        opacity: glowOp2.value,
    }));

    return (
        <Animated.View style={[styles.root, { width: dim.container, height: dim.container }, wrapperStyle, style]}>
            {/* Outer soft glow ring */}
            {glowing && (
                <Animated.View
                    style={[
                        styles.glowRing,
                        {
                            width: dim.glowWidth,
                            height: dim.glowWidth,
                            borderRadius: dim.glowWidth / 2,
                            borderColor: tintColor,
                            shadowColor: tintColor,
                        },
                        glow2Style,
                    ]}
                />
            )}
            {/* Inner tight glow ring */}
            {glowing && (
                <Animated.View
                    style={[
                        styles.glowRingInner,
                        {
                            width: dim.glowRadius * 2 + 8,
                            height: dim.glowRadius * 2 + 8,
                            borderRadius: dim.glowRadius + 4,
                            borderColor: tintColor,
                            shadowColor: tintColor,
                        },
                        glow1Style,
                    ]}
                />
            )}

            {/* Icon container */}
            <View
                style={[
                    styles.iconBox,
                    {
                        width: dim.container,
                        height: dim.container,
                        borderRadius: dim.container / 2,
                        borderColor: tintColor + '33',
                    },
                ]}
            >
                <Image
                    source={LOGO}
                    style={{ width: dim.img, height: dim.img, tintColor }}
                    resizeMode="contain"
                />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    root: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowRing: {
        position: 'absolute',
        borderWidth: 1.5,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 18,
        elevation: 0,
    },
    glowRingInner: {
        position: 'absolute',
        borderWidth: 1,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 0,
    },
    iconBox: {
        backgroundColor: '#050505',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
