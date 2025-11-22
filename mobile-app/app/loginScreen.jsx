import { Button, StyleSheet, Text, View, TextInput, ImageBackground, Alert } from 'react-native'
import React, { useState } from 'react'
import { Link, useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { apiPost, apiGet, apiBaseUrl } from '../utils/api'

// IMPORTANT: Make sure this path is correct
const backgroundImage = require('../assets/img/login-background.png');

const loginScreen = () => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [loginIdError, setLoginIdError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const router = useRouter()
    const [connMessage, setConnMessage] = useState('')

    const isValidEmail = (value) => {
        if (!value) return false;
        const v = String(value).trim();
        return v.includes('@');
    };

    const isValidUsername = (value) => {
        if (!value) return false
        const v = String(value).trim()
        return v.includes('@')
    }

    // Sửa logic validate trong loginScreen.js

    const handleLogin = async () => {
        // Bỏ logic Username, bắt buộc phải là Email vì Backend đang tìm theo Email
        const validLoginId = isValidEmail(loginId);

        setLoginIdError(!loginId ? 'Email is required' : !validLoginId ? 'Invalid email format' : '');
        setPasswordError(!password ? 'Password is required' : '');

        if (!validLoginId || !password) return;

        try {
            // Backend mong đợi key là "email"
            const body = { email: loginId, password: password }

            // Log ra để debug xem gửi gì đi
            console.log("Sending login request:", body);

            const data = await apiPost('/login', body)
            console.log("Received data:", data);
            // Kiểm tra kỹ data trả về
            if (data && data.token) {
                await SecureStore.setItemAsync('jwt', data.token)
                Alert.alert('Login Successful', 'Logged in')
                router.replace('/(tabs)/home')
            } else {
                throw new Error("No token received");
            }

        } catch (e) {
            console.error("Login error:", e);
            Alert.alert('Login Failed', String(e.message || "Unknown error"))
        }
    }

    return (
        <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
            {/* An overlay to make the text more readable */}
            <View style={styles.overlay} />

            <View style={styles.container}>
                <Text style={styles.title}>Welcome Back!</Text>

                <TextInput
                    style={styles.input}
                    placeholder='Email/Username'
                    placeholderTextColor="#ccc"
                    value={loginId}
                    onChangeText={(t) => {
                        setLoginId(t)
                        if (!t) setLoginIdError('Enter email or username')
                        else {
                            const isEmail = t.includes('@')
                            const valid = isEmail ? isValidEmail(t) : isValidUsername(t)
                            setLoginIdError(!valid ? 'Invalid email or username' : '')
                        }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {loginIdError ? <Text style={styles.errorText}>{loginIdError}</Text> : null}
                <TextInput
                    style={styles.input}
                    placeholder='Password'
                    placeholderTextColor="#ccc"
                    secureTextEntry={true}
                    value={password}
                    onChangeText={(t) => {
                        setPassword(t)
                        setPasswordError(!t ? 'Password is required' : '')
                    }}
                    autoCapitalize="none"
                />
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                <View style={styles.linkContainer}>
                    <Text style={styles.baseText}>
                        Forget Password? <Link href="/forgetPasswordScreen" style={styles.link}>Reset</Link>
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <Button title='Login' onPress={handleLogin} color="#8BC34A" />
                </View>

                <View style={styles.registerContainer}>
                    <Text style={styles.baseText}>
                        Don't have an account? <Link href="/registerScreen" style={styles.link}> Register </Link>
                    </Text>
                </View>
            </View>
        </ImageBackground>
    )
}

export default loginScreen

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)', // Dark semi-transparent overlay
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        width: '100%',
        zIndex: 1, // Ensures content is above the overlay
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 40,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    input: {
        width: '100%',
        height: 55,
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 20,
        marginBottom: 15,
        fontSize: 18,
        color: 'white', // White text in input
    },
    linkContainer: {
        width: '100%',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    buttonContainer: {
        width: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 10,
    },
    registerContainer: {
        marginTop: 30,
    },
    baseText: {
        fontSize: 16,
        color: 'white',
    },
    link: {
        color: '#8BC34A', // Green link color
        fontWeight: 'bold',
    },
    connBox: { width: '100%', marginBottom: 10 },
    connText: { color: '#ccc', marginBottom: 6 },
    connResult: { color: 'white', marginTop: 6 },
    errorText: {
        width: '100%',
        color: '#FF4D4F',
        fontSize: 14,
        marginTop: -10,
        marginBottom: 10,
    }
})