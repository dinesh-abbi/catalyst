import React, { useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import appTheme from '@/theme';
import { useAiStore, AiModel } from '@/store/useAiStore';
import { Feather } from '@expo/vector-icons';

interface AiModelSelectorProps {
    onModelSelect?: (model: AiModel) => void;
}

const BADGE_COLORS: Record<string, string> = {
    LATEST: '#ccff00',
    PREMIUM: '#a78bfa',
    STABLE: '#60a5fa',
    FAST: '#34d399',
    UNLIMITED: '#f97316',
};

export const AiModelSelector: React.FC<AiModelSelectorProps> = ({ onModelSelect }) => {
    const { models, selectedModel, usageMap, isLoadingUsage, setSelectedModel, refreshUsage } = useAiStore();

    useEffect(() => {
        refreshUsage();
    }, []);

    const handleSelect = (model: AiModel) => {
        setSelectedModel(model);
        if (onModelSelect) onModelSelect(model);
    };

    const getUsedCount = (modelId: string) => usageMap[modelId] || 0;
    const getProgressPercent = (modelId: string, rpd: number) => {
        if (rpd >= 1500) return 0; // treat as unlimited, never fill bar
        const used = getUsedCount(modelId);
        return Math.min((used / rpd) * 100, 100);
    };
    const isExhausted = (modelId: string, rpd: number) => {
        if (rpd >= 1500) return false;
        return getUsedCount(modelId) >= rpd;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerLabel}>// AI ENGINE</Text>
                {isLoadingUsage
                    ? <ActivityIndicator size="small" color={appTheme.colors.accent} />
                    : <TouchableOpacity onPress={refreshUsage} style={styles.refreshBtn}>
                        <Feather name="refresh-cw" size={12} color={appTheme.colors.textTertiary} />
                    </TouchableOpacity>
                }
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
                {models.map((model) => {
                    const used = getUsedCount(model.id);
                    const isSelected = selectedModel.id === model.id;
                    const exhausted = isExhausted(model.id, model.rpd);
                    const progress = getProgressPercent(model.id, model.rpd);
                    const badgeColor = BADGE_COLORS[model.badge] || appTheme.colors.accent;
                    const isUnlimited = model.rpd >= 1500;

                    return (
                        <TouchableOpacity
                            key={model.id}
                            onPress={() => !exhausted && handleSelect(model)}
                            activeOpacity={exhausted ? 1 : 0.8}
                            style={[
                                styles.card,
                                isSelected && { borderColor: badgeColor },
                                exhausted && styles.cardExhausted,
                            ]}
                        >
                            {/* Badge */}
                            <View style={[styles.badge, { backgroundColor: badgeColor + '22', borderColor: badgeColor + '66' }]}>
                                <Text style={[styles.badgeText, { color: badgeColor }]}>{model.badge}</Text>
                            </View>

                            {/* Model Name */}
                            <Text style={[styles.modelName, exhausted && styles.textDim]} numberOfLines={1}>
                                {model.name}
                            </Text>

                            {/* Category */}
                            <Text style={styles.category}>{model.category}</Text>

                            {/* Usage Stats */}
                            <View style={styles.usageRow}>
                                {isLoadingUsage
                                    ? <ActivityIndicator size="small" color={appTheme.colors.accent} style={{ marginTop: 8 }} />
                                    : <>
                                        <Text style={[styles.usageText, exhausted && { color: '#ef4444' }]}>
                                            {isUnlimited ? `${used} used` : `${used} / ${model.rpd} RPD`}
                                        </Text>

                                        {!isUnlimited && (
                                            <View style={styles.progressTrack}>
                                                <View style={[
                                                    styles.progressFill,
                                                    { width: `${progress}%` as any, backgroundColor: exhausted ? '#ef4444' : badgeColor }
                                                ]} />
                                            </View>
                                        )}
                                        {isUnlimited && (
                                            <Text style={styles.unlimitedLabel}>∞ UNLIMITED</Text>
                                        )}
                                    </>
                                }
                            </View>

                            {/* Selected Indicator */}
                            {isSelected && (
                                <View style={[styles.selectedDot, { backgroundColor: badgeColor }]} />
                            )}

                            {/* Exhausted Overlay */}
                            {exhausted && (
                                <View style={styles.exhaustedOverlay}>
                                    <Feather name="lock" size={14} color="#ef4444" />
                                    <Text style={styles.exhaustedText}>DAILY LIMIT</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Selected Model Detail */}
            <View style={styles.detailRow}>
                <Text style={styles.activeLabel}>ACTIVE: </Text>
                <Text style={styles.activeName}>{selectedModel.name}</Text>
                <Text style={styles.activeDesc}> — {selectedModel.description}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerLabel: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 10,
        color: appTheme.colors.accent,
        letterSpacing: 1,
    },
    refreshBtn: {
        padding: 4,
    },
    scrollRow: {
        marginHorizontal: -4,
    },
    card: {
        width: 150,
        backgroundColor: appTheme.colors.backgroundCard || '#141a24',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 12,
        marginHorizontal: 4,
        position: 'relative',
        overflow: 'hidden',
    },
    cardExhausted: {
        opacity: 0.55,
    },
    badge: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 3,
        marginBottom: 6,
    },
    badgeText: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 8,
        letterSpacing: 0.5,
    },
    modelName: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 12,
        color: appTheme.colors.textPrimary,
        marginBottom: 2,
    },
    textDim: {
        color: appTheme.colors.textTertiary,
    },
    category: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 9,
        color: appTheme.colors.textTertiary,
        marginBottom: 8,
    },
    usageRow: {
        minHeight: 28,
    },
    usageText: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 10,
        color: appTheme.colors.textSecondary,
        marginBottom: 4,
    },
    progressTrack: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: 3,
        borderRadius: 2,
    },
    unlimitedLabel: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 9,
        color: '#f97316',
        letterSpacing: 0.5,
    },
    selectedDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    exhaustedOverlay: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    exhaustedText: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 7,
        color: '#ef4444',
        letterSpacing: 0.5,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 2,
        flexWrap: 'wrap',
    },
    activeLabel: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 9,
        color: appTheme.colors.accent,
        letterSpacing: 1,
    },
    activeName: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 9,
        color: appTheme.colors.textPrimary,
    },
    activeDesc: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 9,
        color: appTheme.colors.textTertiary,
        flex: 1,
    },
});
