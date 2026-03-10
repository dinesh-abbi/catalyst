import appTheme from '@/theme';
import { X } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface TempoReminderProps {
    onDismiss: () => void;
}

export function TempoReminder({ onDismiss }: TempoReminderProps) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: appTheme.colors.blockFill, borderWidth: 1, borderColor: appTheme.colors.border, padding: 16, marginBottom: 24 }}>
            <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ color: appTheme.colors.accent, fontFamily: appTheme.typography.fontFamily.monoBold, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>[ SYSTEM_TEMPO_RULE ]</Text>
                <Text style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.typography.fontFamily.heading, fontSize: 16, textTransform: 'uppercase' }}>3 : 1 : 2 : 1</Text>
            </View>
            <TouchableOpacity
                onPress={onDismiss}
                style={{ padding: 8, borderWidth: 1, borderColor: appTheme.colors.border }}
                activeOpacity={1}
            >
                <X size={20} color={appTheme.colors.accentSecondary} strokeWidth={2} />
            </TouchableOpacity>
        </View>
    );
}
