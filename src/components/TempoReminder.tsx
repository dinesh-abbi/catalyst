import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';

interface TempoReminderProps {
    onDismiss: () => void;
}

export function TempoReminder({ onDismiss }: TempoReminderProps) {
    return (
        <View className="flex-row items-center justify-between bg-accent/20 border border-accent/50 p-4 rounded-xl mb-6">
            <View className="flex-1 mr-4">
                <Text className="text-accent font-bold text-sm tracking-wider uppercase mb-1">Tempo Rule</Text>
                <Text className="text-textPrimary font-semibold text-base">3:1:2:1</Text>
            </View>
            <TouchableOpacity
                onPress={onDismiss}
                className="p-2 bg-backgroundMain/50 rounded-full"
                activeOpacity={0.7}
            >
                <X size={20} color="#e63946" strokeWidth={2.5} />
            </TouchableOpacity>
        </View>
    );
}
