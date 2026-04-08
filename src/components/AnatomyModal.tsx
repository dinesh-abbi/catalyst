import appTheme from '@/theme';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { 
    Modal, 
    ScrollView, 
    Text, 
    TouchableOpacity, 
    View, 
    Dimensions,
    StyleSheet
} from 'react-native';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

const ANATOMY_IMAGES: Record<string, any> = {
    chest: require('@/assets/anatomy/chest.png'),
    back: require('@/assets/anatomy/back.png'),
    shoulders: require('@/assets/anatomy/shoulders.png'),
    abs: require('@/assets/anatomy/abs.png'),
    biceps: require('@/assets/anatomy/biceps.png'),
    triceps: require('@/assets/anatomy/triceps.png'),
    forearms: require('@/assets/anatomy/forearms.png'),
    lower_body: require('@/assets/anatomy/lower_body.png'),
};

interface AnatomyModalProps {
    visible: boolean;
    onClose: () => void;
    anatomyFocus: string[];
}

export function AnatomyModal({ visible, onClose, anatomyFocus }: AnatomyModalProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!anatomyFocus || anatomyFocus.length === 0) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>ANATOMY_VIEWER</Text>
                            <Text style={styles.subtitle}>// TARGET_MUSCLE_GROUPS</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color={appTheme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Progress Dots */}
                    {anatomyFocus.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {anatomyFocus.map((_, i) => (
                                <View 
                                    key={i} 
                                    style={[
                                        styles.dot, 
                                        { backgroundColor: i === activeIndex ? appTheme.colors.accent : appTheme.colors.border }
                                    ]} 
                                />
                            ))}
                        </View>
                    )}

                    <ScrollView 
                        horizontal 
                        pagingEnabled 
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                            const x = e.nativeEvent.contentOffset.x;
                            setActiveIndex(Math.round(x / width));
                        }}
                        scrollEventThrottle={16}
                    >
                        {anatomyFocus.map((focus) => (
                            <View key={focus} style={styles.slide}>
                                <View style={styles.focusLabelContainer}>
                                    <Text style={styles.focusLabel}>{focus.replace('_', ' ')}</Text>
                                </View>
                                <ScrollView 
                                    contentContainerStyle={styles.imageScrollContent}
                                    maximumZoomScale={3}
                                    minimumZoomScale={1}
                                >
                                    <Image 
                                        source={ANATOMY_IMAGES[focus]} 
                                        style={styles.image}
                                        contentFit="contain"
                                        transition={200}
                                    />
                                </ScrollView>
                                <View style={styles.footer}>
                                    <Feather name="info" size={14} color={appTheme.colors.accent} />
                                    <Text style={styles.footerText}>
                                        STUDY THE ANATOMICAL POSITIONING TO MAXIMIZE NEURAL DRIVE.
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: appTheme.colors.backgroundMain,
        height: '85%',
        borderTopWidth: 2,
        borderTopColor: appTheme.colors.accent,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: appTheme.colors.border,
    },
    title: {
        color: appTheme.colors.textPrimary,
        fontFamily: appTheme.typography.fontFamily.heading,
        fontSize: 24,
        letterSpacing: 1,
    },
    subtitle: {
        color: appTheme.colors.accent,
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 10,
        marginTop: 4,
    },
    closeButton: {
        padding: 4,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    slide: {
        width: width,
        flex: 1,
    },
    focusLabelContainer: {
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    focusLabel: {
        color: appTheme.colors.textSecondary,
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    imageScrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    image: {
        width: width - 40,
        height: width * 1.4, // Aspect ratio roughly matches portrait page
        backgroundColor: '#000',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(204, 255, 0, 0.05)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(204, 255, 0, 0.1)',
    },
    footerText: {
        color: appTheme.colors.textTertiary,
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 9,
        marginLeft: 12,
        flex: 1,
    }
});
