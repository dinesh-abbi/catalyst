import React, { useCallback, useEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// MP4 / H.264 portrait — universally supported on Android & iOS
const LAUNCHER_VIDEO = require('../../assets/videos/launcher.mp4');

// Maximum time to show the splash before auto-advancing (safety net)
const MAX_SPLASH_MS = 8000;

interface PremiumSplashProps {
    onComplete: () => void;
}

export const PremiumSplash = ({ onComplete }: PremiumSplashProps) => {
    const fadeOut = useSharedValue(1);
    const didComplete = useRef(false);

    const triggerHaptic = useCallback(() => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
    }, []);

    /** Fades out the splash and calls onComplete exactly once */
    const finish = useCallback(() => {
        if (didComplete.current) return;
        didComplete.current = true;
        triggerHaptic();
        fadeOut.value = withTiming(
            0,
            { duration: 450, easing: Easing.in(Easing.quad) },
            (finished) => {
                if (finished) runOnJS(onComplete)();
            }
        );
    }, [onComplete, fadeOut, triggerHaptic]);

    const player = useVideoPlayer(LAUNCHER_VIDEO, (p) => {
        p.loop = false;
        p.muted = true;
        p.play();
    });

    useEffect(() => {
        // Primary signal — video reached its end
        const sub = player.addListener('playToEnd', finish);

        // Secondary signal — status changes to idle/paused after playback
        const statusSub = player.addListener('statusChange', ({ status }) => {
            // 'idle' means playback finished on some Android ExoPlayer versions
            if (status === 'idle') finish();
        });

        // Tertiary safety net — if the video never fires any event (codec
        // unsupported, file missing, etc.) we still advance after MAX_SPLASH_MS
        const safetyTimer = setTimeout(finish, MAX_SPLASH_MS);

        return () => {
            sub.remove();
            statusSub.remove();
            clearTimeout(safetyTimer);
        };
    }, [player, finish]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: fadeOut.value,
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <VideoView
                player={player}
                style={styles.video}
                contentFit="cover"
                nativeControls={false}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
        zIndex: 9999,
    },
    video: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});
