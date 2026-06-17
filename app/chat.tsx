import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Clipboard
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import appTheme from '@/theme';
import { GeminiService } from '@/utils/GeminiService';
import { useAiStore } from '@/store/useAiStore';
import { useChatStore, ChatMessage } from '@/store/useChatStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeInLeft, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const SUGGESTED_PROMPTS = [
    { id: '1', text: 'Create a 3-day workout split', icon: 'zap' },
    { id: '2', text: 'Give me a healthy dinner idea', icon: 'coffee' },
    { id: '3', text: 'Explain progressive overload', icon: 'trending-up' },
    { id: '4', text: 'Motivation for leg day', icon: 'target' },
];

export default function ChatScreen() {
    const insets = useSafeAreaInsets();
    const [input, setInput] = useState('');
    const [showModels, setShowModels] = useState(false);
    const { messages, addMessage, isTyping, setTyping, clearChat } = useChatStore();
    const { models, selectedModel, setSelectedModel, usageMap } = useAiStore();
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages, isTyping]);

    const handleSend = async (overrideText?: string) => {
        const textToSend = overrideText || input.trim();
        if (!textToSend || isTyping) return;

        setInput('');
        addMessage('user', textToSend);

        setTyping(true);
        try {
            const response = await GeminiService.generateText(textToSend);

            if (response === '__ERROR_BUSY__') {
                Alert.alert("Engine High Demand", "The AI is currently processing a high volume of requests. Please wait 60 seconds.");
                addMessage('model', "[ERROR]: SYSTEM OVERLOAD. PLEASE RETRY IN 60s.");
            } else if (response === '__ERROR_UNAVAILABLE__') {
                Alert.alert("Link Failure", "The connection to this model was lost. Please switch models.");
                addMessage('model', "[ERROR]: MODEL UNAVAILABLE. SELECT ALTERNATE ENGINE.");
            } else if (response.startsWith('__QUOTA_EXCEEDED__')) {
                const rpd = response.split(':')[2];
                Alert.alert("Quota Exceeded", `Daily limit reached for ${selectedModel.name} (${rpd} RPD).`);
                addMessage('model', `[QUOTA]: DAILY LIMIT REACHED (${rpd}).`);
            } else {
                addMessage('model', response);
            }
        } catch (error) {
            console.error('[Chat] Error:', error);
            addMessage('model', "CONNECTION INTERRUPTED. UNABLE TO RETRIEVE DATA.");
        } finally {
            setTyping(false);
        }
    };

    const copyToClipboard = (text: string) => {
        Clipboard.setString(text);
        Alert.alert("Copied", "Response copied to clipboard.");
    };

    const RenderFormattedText = ({ text, style }: { text: string, style: any }) => {
        // Simple formatter for bold and bullet points
        const lines = text.split('\n');
        return (
            <View>
                {lines.map((line, i) => {
                    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
                    const content = line.trim().replace(/^[\*\-]\s/, '');
                    
                    // Handle bold text **something**
                    const parts = content.split('**');
                    
                    return (
                        <View key={i} style={{ flexDirection: 'row', marginBottom: line.trim() ? 4 : 8 }}>
                            {isBullet && <Text style={[style, { marginRight: 5 }]}>•</Text>}
                            <Text style={style}>
                                {parts.map((part, idx) => (
                                    <Text key={idx} style={idx % 2 === 1 ? { fontWeight: 'bold', color: appTheme.colors.accent } : {}}>
                                        {part}
                                    </Text>
                                ))}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';
        return (
            <Animated.View 
                entering={isUser ? FadeInRight : FadeInLeft}
                style={[
                    styles.messageWrapper,
                    isUser ? styles.userWrapper : styles.aiWrapper
                ]}
            >
                <View style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.aiBubble
                ]}>
                    {!isUser && (
                        <View style={styles.bubbleHeader}>
                            <Text style={styles.aiLabel}>// {selectedModel.name.toUpperCase()}</Text>
                            <TouchableOpacity onPress={() => copyToClipboard(item.content)}>
                                <Feather name="copy" size={10} color={appTheme.colors.textTertiary} />
                            </TouchableOpacity>
                        </View>
                    )}
                    {isUser ? (
                        <Text style={[styles.messageText, styles.userText]}>{item.content}</Text>
                    ) : (
                        <RenderFormattedText text={item.content} style={[styles.messageText, styles.aiText]} />
                    )}
                </View>
                <Text style={styles.timestamp}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </Animated.View>
        );
    };

    return (
            <KeyboardAvoidingView
                style={[styles.container, { paddingTop: insets.top, flex: 1 }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <TouchableOpacity 
                        onPress={() => setShowModels(!showModels)}
                        style={styles.modelToggle}
                    >
                        <Text style={styles.headerSubtitle}>// CONNECTED TO {selectedModel.name.toUpperCase()}</Text>
                        <Feather name={showModels ? "chevron-up" : "chevron-down"} size={10} color={appTheme.colors.accent} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CATALYST AI</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 20 }}>
                    <TouchableOpacity onPress={() => {
                        Alert.alert("Purge History", "Clear all messages?", [
                            { text: "Cancel", style: 'cancel' },
                            { text: "Purge", style: 'destructive', onPress: clearChat }
                        ]);
                    }}>
                        <Feather name="trash-2" size={20} color={appTheme.colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="x" size={20} color={appTheme.colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Model Selector Sheet (Expandable) */}
            {showModels && (
                <Animated.View entering={FadeIn} style={styles.modelSelector}>
                    {models.map(model => {
                        const isSelected = selectedModel.id === model.id;
                        return (
                            <TouchableOpacity 
                                key={model.id}
                                onPress={() => {
                                    setSelectedModel(model);
                                    setShowModels(false);
                                }}
                                style={[styles.modelItem, isSelected && styles.modelItemActive]}
                            >
                                <Feather name="cpu" size={14} color={isSelected ? "#000" : appTheme.colors.textSecondary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.modelItemName, isSelected && { color: '#000' }]}>{model.name}</Text>
                                    <Text style={[styles.modelItemDesc, isSelected && { color: 'rgba(0,0,0,0.6)' }]}>{model.description}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.modelItemUsage, isSelected && { color: '#000' }]}>
                                        Quota: {model.rpd - (usageMap[model.id] || 0)} / {model.rpd}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </Animated.View>
            )}

            {/* Main Chat Area */}
            <View style={{ flex: 1 }}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.suggestedContainer}>
                            <Text style={styles.suggestedTitle}>SUGGESTED COMMANDS</Text>
                            <View style={styles.suggestedGrid}>
                                {SUGGESTED_PROMPTS.map(prompt => (
                                    <TouchableOpacity 
                                        key={prompt.id}
                                        onPress={() => handleSend(prompt.text)}
                                        style={styles.promptBtn}
                                    >
                                        <Feather name={prompt.icon as any} size={12} color={appTheme.colors.accent} />
                                        <Text style={styles.promptText}>{prompt.text}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    }
                />

                {/* Flexible Input Bar (No longer absolute) */}
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10), paddingTop: 10 }]}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { maxHeight: 120 }]}
                            placeholder="TYPE COMMAND..."
                            placeholderTextColor={appTheme.colors.textTertiary}
                            value={input}
                            onChangeText={setInput}
                            multiline
                        />
                        <TouchableOpacity 
                            onPress={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                            style={[
                                styles.sendBtn,
                                (!input.trim() || isTyping) && { opacity: 0.5 }
                            ]}
                        >
                            {isTyping ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Feather name="arrow-up" size={18} color="#000" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appTheme.colors.backgroundMain,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        zIndex: 100,
    },
    modelToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 10,
        color: appTheme.colors.accent,
        letterSpacing: 1,
    },
    headerTitle: {
        fontFamily: appTheme.typography.fontFamily.heading,
        fontSize: 24,
        color: appTheme.colors.textPrimary,
    },
    modelSelector: {
        backgroundColor: appTheme.colors.backgroundCard,
        padding: 10,
        borderBottomWidth: 1,
        borderColor: appTheme.colors.border,
    },
    modelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
        marginBottom: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modelItemActive: {
        backgroundColor: appTheme.colors.accent,
        borderColor: appTheme.colors.accent,
    },
    modelItemName: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 12,
        color: appTheme.colors.textPrimary,
    },
    modelItemDesc: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 9,
        color: appTheme.colors.textTertiary,
    },
    modelItemUsage: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 10,
        color: appTheme.colors.textSecondary,
    },
    suggestedContainer: {
        marginBottom: 30,
    },
    suggestedTitle: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 9,
        color: appTheme.colors.textTertiary,
        marginBottom: 12,
        letterSpacing: 1,
    },
    suggestedGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    promptBtn: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    promptText: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 11,
        color: appTheme.colors.textSecondary,
    },
    listContent: {
        padding: 20,
        paddingBottom: 200,
    },
    messageWrapper: {
        marginBottom: 20,
        maxWidth: '85%',
    },
    userWrapper: {
        alignSelf: 'flex-end',
    },
    aiWrapper: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        padding: 12,
        borderRadius: 2,
    },
    bubbleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    userBubble: {
        backgroundColor: appTheme.colors.accent,
    },
    aiBubble: {
        backgroundColor: appTheme.colors.backgroundCard,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    aiLabel: {
        fontFamily: appTheme.typography.fontFamily.monoBold,
        fontSize: 8,
        color: appTheme.colors.accent,
        letterSpacing: 0.5,
    },
    messageText: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 14,
        lineHeight: 20,
    },
    userText: {
        color: '#000',
    },
    aiText: {
        color: appTheme.colors.textPrimary,
    },
    timestamp: {
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 8,
        color: appTheme.colors.textTertiary,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        paddingHorizontal: 20,
        backgroundColor: appTheme.colors.backgroundMain,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: appTheme.colors.backgroundCard,
        borderWidth: 1,
        borderColor: appTheme.colors.border,
        padding: 6,
        gap: 10,
    },
    input: {
        flex: 1,
        fontFamily: appTheme.typography.fontFamily.mono,
        fontSize: 14,
        color: appTheme.colors.textPrimary,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 45,
    },
    sendBtn: {
        width: 40,
        height: 40,
        backgroundColor: appTheme.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 2,
        marginBottom: 2,
    },
});

