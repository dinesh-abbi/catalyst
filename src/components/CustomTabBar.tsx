import appTheme from '@/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();

    // Using absolute pixel width is safer for Reanimated `withSpring` than string percentage logic
    const tabWidthPx = windowWidth / state.routes.length;

    const animatedIndicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                translateX: withSpring(state.index * tabWidthPx, {
                    damping: 20,
                    stiffness: 250,
                })
            }],
        };
    });

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.tabWrapper}>
                {/* Sharp Accent Line Indicator */}
                <Animated.View
                    style={[
                        styles.indicator,
                        { width: tabWidthPx },
                        animatedIndicatorStyle
                    ]}
                />

                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;
                    const label = route.name === 'index' ? '[ TODAY ]' : '[ WEEKLY ]';

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid); // Harder haptics for neo-technical
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={styles.tabButton}
                            activeOpacity={1} // No soft fading on press
                        >
                            <View style={styles.iconContainer}>
                                {options.tabBarIcon && options.tabBarIcon({
                                    color: isFocused ? appTheme.colors.accent : appTheme.colors.textSecondary,
                                    focused: isFocused,
                                    size: 24 // Slightly larger, starker icons
                                })}
                            </View>
                            <Text style={[
                                styles.label,
                                { color: isFocused ? appTheme.colors.textPrimary : appTheme.colors.textTertiary }
                            ]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: appTheme.colors.backgroundCard,
        borderTopWidth: 1,
        borderColor: appTheme.colors.border,
    },
    tabWrapper: {
        flexDirection: 'row',
        height: 72,
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    iconContainer: {
        marginBottom: 8,
    },
    indicator: {
        position: 'absolute',
        top: -1, // Overlaps the borderTop exactly
        height: 2,
        backgroundColor: appTheme.colors.accent,
        zIndex: 20,
        shadowColor: appTheme.colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5, // Gives it a neon glow effect
    },
    label: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 10,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
});
