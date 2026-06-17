import { CustomTabBar } from '@/components/CustomTabBar';
import { Feather } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import appTheme from '@/theme';

export default function TabLayout() {
    const router = useRouter();

    return (
        <View style={{ flex: 1 }}>
            <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Today',
                    tabBarIcon: ({ color }) => <Feather name="zap" color={color} size={22} />,
                }}
            />
            <Tabs.Screen
                name="weekly"
                options={{
                    href: null,
                    title: 'Weekly',
                    tabBarIcon: ({ color }) => <Feather name="calendar" color={color} size={22} />,
                }}
            />
            <Tabs.Screen
                name="nutrition"
                options={{
                    title: 'Fuel',
                    tabBarIcon: ({ color }) => <Feather name="pie-chart" color={color} size={22} />,
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <Feather name="user" color={color} size={22} />,
                }}
            />
        </Tabs>
        
        {/* Catalyst AI Universal FAB */}
        <TouchableOpacity 
            style={styles.fab}
            onPress={() => router.push('/chat')}
            activeOpacity={0.8}
        >
            <Feather name="cpu" size={24} color="#000" />
        </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 100 : 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: appTheme.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: appTheme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    }
});
