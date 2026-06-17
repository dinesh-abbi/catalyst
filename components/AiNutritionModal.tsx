import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import appTheme from '@/theme';
import { GeminiService } from '@/utils/GeminiService';
import { AiModelSelector } from './AiModelSelector';

interface AiNutritionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AiNutritionModal: React.FC<AiNutritionModalProps> = ({ visible, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickImage = async (useCamera: boolean) => {
    const permissionResult = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", `You need to allow Catalyst to access your ${useCamera ? 'camera' : 'photos'} to scan meals.`);
      return;
    }

    const result = await (useCamera 
      ? ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 }) 
      : ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5 }));

    if (!result.canceled && result.assets[0].base64) {
      setImage(result.assets[0].uri);
      handleScan(result.assets[0].base64);
    }
  };

  const handleScan = async (base64: string) => {
    setLoading(true);
    setResult(null);
    try {
      const responseText = await GeminiService.scanMeal(base64);

      // Handle quota exceeded sentinel
      if (responseText.startsWith('__QUOTA_EXCEEDED__')) {
        const parts = responseText.split(':');
        const rpd = parts[2];
        Alert.alert("Daily Limit Reached", `You've used all ${rpd} daily requests for this model. Please select a different model or try again tomorrow.`);
        setImage(null);
        return;
      }

      // Handle no-vision sentinel
      if (responseText.startsWith('__NO_VISION__')) {
        const modelName = responseText.split(':')[1];
        Alert.alert("Model Not Supported", `${modelName} does not support image analysis. Please select a vision-capable model.`);
        setImage(null);
        return;
      }

      // Handle specific error sentinels
      if (responseText === '__ERROR_BUSY__') {
        Alert.alert("AI Busy", "The AI is currently at capacity. Please wait 60 seconds and try again.");
        setImage(null);
        return;
      }
      if (responseText === '__ERROR_UNAVAILABLE__') {
        Alert.alert("Model Unavailable", "This model is currently not responding. Please try a different Gemini model.");
        setImage(null);
        return;
      }
      if (responseText === '__ERROR_GENERAL__') {
        Alert.alert("AI Error", "Something went wrong with the AI analysis. Please try again with a clearer photo.");
        setImage(null);
        return;
      }

      // Check if we got any other generic error message
      if (responseText.includes("trouble thinking") || responseText.includes("couldn't analyze")) {
        Alert.alert("AI Unavailable", "The AI is currently at capacity. Please wait a minute and try again.");
        setImage(null);
        return;
      }

      // Gemini might return markdown JSON blocks, so we strip them
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      setResult(parsed);
    } catch (error: any) {
      console.error("Scan Error:", error);
      if (error?.message?.includes('429')) {
        Alert.alert("Quota Exceeded", "The AI is currently busy. Please wait 60 seconds and try again.");
      } else {
        Alert.alert("Scan Failed", "I couldn't identify the food. Please try with a clearer photo.");
      }
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
        <View style={{ 
          backgroundColor: appTheme.colors.backgroundMain, 
          height: '85%', 
          borderTopLeftRadius: 30, 
          borderTopRightRadius: 30,
          padding: 20
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View>
              <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 12 }}>// CATALYST AI</Text>
              <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.heading, fontSize: 24 }}>MEAL SCANNER</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
              <Feather name="x" size={24} color={appTheme.colors.textTertiary} />
            </TouchableOpacity>
            </View>

          {/* Model Selector */}
          <AiModelSelector />

          {!image ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ 
                width: 100, 
                height: 100, 
                borderRadius: 50, 
                backgroundColor: 'rgba(204, 255, 0, 0.1)', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginBottom: 20,
                borderWidth: 1,
                borderColor: appTheme.colors.accent,
                borderStyle: 'dashed'
              }}>
                <Feather name="camera" size={40} color={appTheme.colors.accent} />
              </View>
              <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.mono, fontSize: 16, textAlign: 'center', marginBottom: 30, paddingHorizontal: 40 }}>
                Point your camera at your meal to get instant macro estimates and health advice.
              </Text>
              
              <View style={{ width: '100%', gap: 12 }}>
                <TouchableOpacity 
                  onPress={() => pickImage(true)}
                  style={{ 
                    backgroundColor: appTheme.colors.accent, 
                    padding: 16, 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}
                >
                  <Feather name="camera" size={20} color="#000" style={{ marginRight: 10 }} />
                  <Text style={{ fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 14 }}>LAUNCH CAMERA</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => pickImage(false)}
                  style={{ 
                    borderWidth: 1,
                    borderColor: appTheme.colors.border,
                    padding: 16, 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}
                >
                  <Feather name="image" size={20} color={appTheme.colors.textSecondary} style={{ marginRight: 10 }} />
                  <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 14 }}>GALLERY</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ height: 250, width: '100%', marginBottom: 20, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: appTheme.colors.border }}>
                <Image source={{ uri: image }} style={{ flex: 1 }} resizeMode="cover" />
                {loading && (
                   <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
                      <ActivityIndicator size="large" color={appTheme.colors.accent} />
                      <Text style={{ color: appTheme.colors.accent, marginTop: 15, fontFamily: appTheme.typography.fontFamily.monoBold }}>AI IS ANALYZING...</Text>
                   </View>
                )}
              </View>

              {result && (
                <View style={{ gap: 20 }}>
                  <View style={{ backgroundColor: appTheme.colors.blockFill, padding: 16, borderWidth: 1, borderColor: appTheme.colors.border }}>
                    <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 12, marginBottom: 8 }}>ANALYSIS COMPLETE</Text>
                    {result.items?.map((item: any, idx: number) => (
                      <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.mono }}>• {item.name}</Text>
                        <Text style={{ color: appTheme.colors.textSecondary, fontFamily: appTheme.typography.fontFamily.mono }}>{item.estimatedCalories} kcal</Text>
                      </View>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, alignItems: 'center' }}>
                      <Text style={{ color: appTheme.colors.textTertiary, fontSize: 10, fontFamily: appTheme.typography.fontFamily.mono }}>PRO</Text>
                      <Text style={{ color: appTheme.colors.textPrimary, fontSize: 18, fontFamily: appTheme.typography.fontFamily.monoBold }}>{result.total.protein}g</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, alignItems: 'center' }}>
                      <Text style={{ color: appTheme.colors.textTertiary, fontSize: 10, fontFamily: appTheme.typography.fontFamily.mono }}>CARB</Text>
                      <Text style={{ color: appTheme.colors.textPrimary, fontSize: 18, fontFamily: appTheme.typography.fontFamily.monoBold }}>{result.total.carbs}g</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, alignItems: 'center' }}>
                      <Text style={{ color: appTheme.colors.textTertiary, fontSize: 10, fontFamily: appTheme.typography.fontFamily.mono }}>FAT</Text>
                      <Text style={{ color: appTheme.colors.textPrimary, fontSize: 18, fontFamily: appTheme.typography.fontFamily.monoBold }}>{result.total.fats}g</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: 'rgba(204, 255, 0, 0.05)', padding: 16, borderLeftWidth: 3, borderLeftColor: appTheme.colors.accent }}>
                    <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 12, marginBottom: 4 }}>OTTO'S ADVICE</Text>
                    <Text style={{ color: appTheme.colors.textPrimary, lineHeight: 20 }}>{result.advice}</Text>
                  </View>

                  <TouchableOpacity 
                    onPress={reset}
                    style={{ 
                      padding: 16, 
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: appTheme.colors.border,
                      marginBottom: 40
                    }}
                  >
                    <Text style={{ color: appTheme.colors.textTertiary, fontFamily: appTheme.typography.fontFamily.monoBold }}>SCAN ANOTHER MEAL</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};
