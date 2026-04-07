import appTheme from '@/theme';
import { useAlertStore } from '@/store/useAlertStore';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ThemedAlert = () => {
    const { visible, title, message, type, hideAlert } = useAlertStore();

    if (!visible) return null;

    const getColors = () => {
        switch (type) {
            case 'SUCCESS': return { accent: '#22c55e', icon: 'check-circle' as const };
            case 'ERROR': return { accent: '#ef4444', icon: 'alert-triangle' as const };
            case 'INFO': return { accent: appTheme.colors.accent, icon: 'info' as const };
            default: return { accent: appTheme.colors.accent, icon: 'info' as const };
        }
    };

    const { accent, icon } = getColors();

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <Animated.View 
                    entering={FadeIn.duration(200)} 
                    exiting={FadeOut.duration(200)} 
                    style={styles.backdrop} 
                />
                
                <Animated.View 
                    entering={ZoomIn.duration(300).springify().damping(20)} 
                    exiting={ZoomOut.duration(200)}
                    style={[styles.alertCard, { borderColor: accent }]}
                >
                    {/* Header Strip */}
                    <View style={[styles.headerStrip, { backgroundColor: accent }]}>
                        <Text style={styles.headerText}>[ SYSTEM_OS_NOTIFICATION ]</Text>
                        <Feather name={icon} size={14} color="#000" />
                    </View>

                    <View style={styles.content}>
                        <Text style={[styles.title, { color: accent }]}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <TouchableOpacity 
                            style={[styles.button, { borderColor: accent }]}
                            onPress={hideAlert}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.buttonText, { color: accent }]}>[ ACKNOWLEDGE ]</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Industrial Footer Details */}
                    <View style={styles.cardFooter}>
                        <View style={[styles.dot, { backgroundColor: accent }]} />
                        <View style={styles.footerLine} />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(11, 15, 25, 0.9)',
    },
    alertCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: appTheme.colors.backgroundCard,
        borderWidth: 1,
        overflow: 'hidden',
    },
    headerStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    headerText: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 8,
        letterSpacing: 1,
        color: '#000',
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontFamily: appTheme.typography.fontFamily.heading,
        fontSize: 22,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 13,
        lineHeight: 18,
        color: appTheme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    buttonText: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 12,
        letterSpacing: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    dot: {
        width: 4,
        height: 4,
        marginRight: 8,
    },
    footerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    }
});
