import appTheme from '@/theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompleteScreen() {
    const router = useRouter();

    const handleDismiss = () => {
        router.replace('/');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.iconContainer}>
                    <Feather name="award" size={64} color="#eab308" />
                </View>

                <Text style={styles.title}>Workout Complete!</Text>

                <Text style={styles.subtitle}>
                    You showed up and put in the work. Now it&apos;s time to recover so you can come back stronger.
                </Text>

                <View style={styles.nutritionBox}>
                    <View style={styles.boxHeader}>
                        <Feather name="coffee" size={24} color={appTheme.colors.accent} />
                        <Text style={styles.boxTitle}>Post-Workout Fuel</Text>
                    </View>
                    <Text style={styles.nutritionText}>
                        • <Text style={styles.highlight}>Protein:</Text> Aim for 25-40g to rebuild muscle (shake, chicken, eggs).{'\n\n'}
                        • <Text style={styles.highlight}>Carbs:</Text> Replenish glycogen with fast-digesting carbs (rice, banana, oats).{'\n\n'}
                        • <Text style={styles.highlight}>Hydration:</Text> Drink at least 16-24oz of water.
                    </Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleDismiss} activeOpacity={0.8}>
                    <Text style={styles.buttonText}>Back to Home</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appTheme.colors.backgroundMain,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 40,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: appTheme.colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#eab308',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: appTheme.colors.textPrimary,
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: appTheme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    nutritionBox: {
        backgroundColor: appTheme.colors.backgroundCard,
        padding: 24,
        borderRadius: 16,
        width: '100%',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: appTheme.colors.accent + '30',
    },
    boxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    boxTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: appTheme.colors.textPrimary,
        marginLeft: 12,
    },
    nutritionText: {
        fontSize: 15,
        color: appTheme.colors.textSecondary,
        lineHeight: 22,
    },
    highlight: {
        fontWeight: 'bold',
        color: appTheme.colors.textPrimary,
    },
    button: {
        backgroundColor: appTheme.colors.accent,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        shadowColor: appTheme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
