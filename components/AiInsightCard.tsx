import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import appTheme from '@/theme';
import { GeminiService } from '@/utils/GeminiService';
import { useAiStore } from '@/store/useAiStore';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface AiInsightCardProps {
  workoutLog: {
    title: string;
    exercises: any[];
  };
}

export const AiInsightCard: React.FC<AiInsightCardProps> = ({ workoutLog }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { selectedModel } = useAiStore();

  const fetchInsight = async () => {
    if (workoutLog.exercises.length === 0) return;

    setLoading(true);
    try {
      const feedback = await GeminiService.getWorkoutFeedback(workoutLog);

      if (feedback.startsWith('__QUOTA_EXCEEDED__')) {
        const parts = feedback.split(':');
        const rpd = parts[2];
        setInsight(`Daily limit reached for ${selectedModel.name} (${rpd} RPD). Switch models to get more insights.`);
        return;
      }

      if (feedback === '__ERROR_BUSY__') {
        setInsight("The AI engine is currently busy. Please wait a moment and try again.");
        return;
      }

      if (feedback === '__ERROR_UNAVAILABLE__') {
        setInsight("This model is currently unavailable. Please switch to a different AI model in settings.");
        return;
      }

      if (feedback === '__ERROR_GENERAL__') {
        setInsight("Something went wrong while generating insights. Let's try again in a bit.");
        return;
      }

      setInsight(feedback);
    } catch (error) {
      console.error("Insight Error:", error);
      setInsight("Unable to generate insight at this time.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasCompleted = workoutLog.exercises.some(ex => ex.isCompleted);
    if (hasCompleted && !insight) {
      fetchInsight();
    }
  }, [workoutLog]);

  if (workoutLog.exercises.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInUp.delay(300)}
      style={{
        marginTop: 20,
        marginBottom: 10,
        backgroundColor: 'rgba(204, 255, 0, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(204, 255, 0, 0.2)',
        padding: 16,
        borderRadius: 2
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="zap" size={14} color={appTheme.colors.accent} style={{ marginRight: 8 }} />
          <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 1 }}>
            // OTTO INSIGHT
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: appTheme.typography.fontFamily.mono, fontSize: 8, color: appTheme.colors.textTertiary }}>
            {selectedModel.name.toUpperCase()}
          </Text>
          <TouchableOpacity onPress={fetchInsight} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={appTheme.colors.accent} />
            ) : (
              <Feather name="refresh-cw" size={14} color={appTheme.colors.textTertiary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading && !insight ? (
        <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 12 }}>
          DECRYPTION IN PROGRESS...
        </Text>
      ) : (
        <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 13, lineHeight: 18 }}>
          {insight || "Complete exercises to receive AI-driven performance analysis."}
        </Text>
      )}
    </Animated.View>
  );
};
