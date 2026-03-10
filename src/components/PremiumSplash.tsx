import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';

interface PremiumSplashProps {
    onComplete: () => void;
}

export const PremiumSplash = ({ onComplete }: PremiumSplashProps) => {
    // Initial state matches the native splash (fully visible, standard scale)
    const logoScale = useSharedValue(1);
    const logoOpacity = useSharedValue(1);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        // Hold the native-looking state for a moment to ensure a seamless handoff

        // Subtle premium pulse before exit
        logoScale.value = withDelay(800, withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.ease) }));

        // Fade and scale out
        logoOpacity.value = withDelay(1200, withTiming(0, { duration: 500 }));
        logoScale.value = withDelay(1200, withTiming(1.3, { duration: 600, easing: Easing.in(Easing.quad) }));

        // Container fade out and trigger completion
        containerOpacity.value = withDelay(1400, withTiming(0, { duration: 400 }, (finished) => {
            if (finished) {
                runOnJS(onComplete)();
            }
        }));
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <View style={styles.centerStage}>
                {/* 
                  The image size here (200x200) coordinates with the `imageWidth: 200` 
                  setting in app.json for the native expo-splash-screen, ensuring no layout jump 
                  when React Native takes over rendering.
                */}
                <Animated.View style={logoStyle}>
                    <Image
                        source={require('../../assets/images/legacy-icon.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </Animated.View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0b0f19', // Matches app.json native splash background exactly
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerStage: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    logoImage: {
        width: 200,
        height: 200,
    },
});
