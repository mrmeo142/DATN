import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const RootLayout = () => {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="loginScreen" options={{ headerShown: false }} />
            <Stack.Screen name="registerScreen" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="forgetPasswordScreen" options={{ headerShown: false }} />
            <Stack.Screen name="verifyCode" options={{ headerShown: false }} />
        </Stack >
    )
}

export default RootLayout
