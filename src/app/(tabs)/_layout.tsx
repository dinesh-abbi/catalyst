import { Tabs } from 'expo-router';
import React from 'react';
import { Feather } from '@expo/vector-icons';
import appTheme from '@/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: appTheme.colors.accent,
                tabBarInactiveTintColor: appTheme.colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: appTheme.colors.backgroundCard,
                    borderTopColor: '#334155', // slate-700
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 60,
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Today',
                    tabBarIcon: ({ color }) => <Feather name="target" color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="weekly"
                options={{
                    title: 'Weekly Overview',
                    tabBarIcon: ({ color }) => <Feather name="calendar" color={color} size={24} />,
                }}
            />
        </Tabs>
    );
}
