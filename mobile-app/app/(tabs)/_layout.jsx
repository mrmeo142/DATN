import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

// This is the main layout for the tab bar
const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hides the "home", "history" text at the top
        tabBarShowLabel: true, // Show text under the icon
        tabBarActiveTintColor: '#8BC34A', // Active icon color (our theme green)
        tabBarInactiveTintColor: '#999', // Inactive icon color
        tabBarStyle: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)', // Make tab bar dark
          borderTopColor: 'rgba(255, 255, 255, 0.1)', // Light border
          paddingTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="home" // This links to app/(tabs)/home.js
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="charging-station" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history" // This links to app/(tabs)/history.js
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account" // This links to app/(tabs)/account.js
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;