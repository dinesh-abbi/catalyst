import { CustomTabBar } from '@/components/CustomTabBar';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
    return (
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
    );
}
