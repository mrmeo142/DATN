import React, { useState } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ImageBackground, Alert } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { apiPost } from '../utils/api'

const backgroundImage = require('../assets/img/login-background.png')

const ForgetPasswordScreen = () => {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState('')

    const isValidEmail = (value) => {
        if (!value) return false
        const v = String(value).trim()
        return v.includes('@')
    }

    const handleSendCode = async () => {
        const emailValid = email ? isValidEmail(email) : false
        setEmailError(email && !emailValid ? 'Invalid email address' : '')
        if (!emailValid) return
        Alert.alert('Not Available', 'Password reset is not available in current backend.')
    }

    return (
        <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
            <View style={styles.overlay} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="white" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.container}>
                <Text style={styles.title}>Forgot Password</Text>
                <Text style={styles.subtitle}>Enter your email or phone to receive a code.</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#ccc"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(t) => {
                        setEmail(t)
                        setEmailError(t.length && !isValidEmail(t) ? 'Invalid email address' : '')
                    }}
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                <TouchableOpacity style={styles.button} onPress={handleSendCode}>
                    <Text style={styles.buttonText}>Send Code</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    )
}

export default ForgetPasswordScreen

const styles = StyleSheet.create({
    background: { flex: 1, width: '100%', height: '100%' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    header: { position: 'absolute', top: 40, left: 20, zIndex: 2 },
    backButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8 },
    backText: { color: 'white', fontSize: 16, marginLeft: 6 },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, width: '100%', zIndex: 1 },
    title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 30 },
    input: {
        width: '100%',
        height: 55,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 20,
        marginBottom: 15,
        fontSize: 18,
        color: 'white',
    },
    button: { backgroundColor: '#8BC34A', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    errorText: { width: '100%', color: '#FF4D4F', fontSize: 14, marginTop: -10, marginBottom: 10 },
})