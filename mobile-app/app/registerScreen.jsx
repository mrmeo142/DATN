import {
    Button,
    StyleSheet,
    Text,
    TextInput,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    ImageBackground
} from 'react-native'
import React, { useState } from 'react'
import { Link, useRouter } from 'expo-router';
import { apiPost } from '../utils/api'

// IMPORTANT: Ensure this path is correct for your background image
const backgroundImage = require('../assets/img/login-background.png');

const registerScreen = () => {
    const router = useRouter()
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isInfoConfirmed, setIsInfoConfirmed] = useState(false);
    const [fullNameError, setFullNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

    const handleRegister = async () => {
        setFullNameError(!fullName ? 'Full name is required' : '')
        setEmailError(!email ? 'Email is required' : email && !isValidEmail(email) ? 'Invalid email address' : '')
        setPasswordError(!password ? 'Password is required' : '')
        setConfirmPasswordError(!confirmPassword ? 'Confirm your password' : confirmPassword !== password ? 'Passwords do not match' : '')
        if (!isInfoConfirmed) return
        const allValid = fullName && email && isValidEmail(email) && password && confirmPassword && confirmPassword === password && isInfoConfirmed
        if (!allValid) return
        try {
            const body = { fullname: fullName, email: email, password: password }
            await apiPost('/create', body)
            Alert.alert('Registered', 'Account created. You can login now.')
            router.replace('/loginScreen')
        } catch (e) {
            Alert.alert('Register Failed', String(e.message || e))
        }
    }

    return (
        <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
            <View style={styles.overlay} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.container}>
                    <Text style={styles.title}>Create Account</Text>


                    <TextInput
                        style={styles.input}
                        placeholder='Full Name'
                        placeholderTextColor="#ccc"
                        value={fullName}
                        onChangeText={(t) => {
                            setFullName(t)
                            setFullNameError(!t ? 'Full name is required' : '')
                        }}
                    />
                    {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}

                    <TextInput
                        style={styles.input}
                        placeholder='Email'
                        placeholderTextColor="#ccc"
                        value={email}
                        onChangeText={(t) => {
                            setEmail(t)
                            setEmailError(!t ? 'Email is required' : !isValidEmail(t) ? 'Invalid email address' : '')
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                    <TextInput
                        style={styles.input}
                        placeholder='Password'
                        placeholderTextColor="#ccc"
                        secureTextEntry={true}
                        value={password}
                        onChangeText={(t) => {
                            setPassword(t)
                            setPasswordError(!t ? 'Password is required' : '')
                            setConfirmPasswordError(confirmPassword && t !== confirmPassword ? 'Passwords do not match' : '')
                        }}
                        autoCapitalize="none"
                    />
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                    <TextInput
                        style={styles.input}
                        placeholder='Confirm Password'
                        placeholderTextColor="#ccc"
                        secureTextEntry={true}
                        value={confirmPassword}
                        onChangeText={(t) => {
                            setConfirmPassword(t)
                            setConfirmPasswordError(!t ? 'Confirm your password' : t !== password ? 'Passwords do not match' : '')
                        }}
                        autoCapitalize="none"
                    />
                    {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

                    <TouchableOpacity
                        style={styles.confirmContainer}
                        onPress={() => {
                            setIsInfoConfirmed(!isInfoConfirmed)
                        }}
                    >
                        <View style={styles.checkbox}>
                            {isInfoConfirmed && <View style={styles.checkboxInner} />}
                        </View>
                        <Text style={styles.confirmText}>I confirm my information is correct</Text>
                    </TouchableOpacity>

                    <View style={styles.buttonContainer}>
                        <Button title='Register' onPress={handleRegister} color="#8BC34A" />
                    </View>

                    <View style={styles.loginLinkContainer}>
                        <Text style={styles.baseText}>
                            Already have an account?{' '}
                        </Text>
                        <Link href="/loginScreen">
                            <Text style={[styles.baseText, styles.link]}>Login</Text>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </ImageBackground>
    )
}

export default registerScreen

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)', // Dark semi-transparent overlay
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 40, // Add vertical padding for scrolling content
    },
    container: {
        // flex: 1, removed as scrollContainer handles flexGrow
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        width: '100%',
        zIndex: 1, // Ensure content is above the overlay
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white', // White title for contrast
        marginBottom: 30,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    input: {
        width: '100%',
        height: 55, // Slightly taller input
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
        borderColor: 'rgba(255, 255, 255, 0.4)', // Semi-transparent border
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 20,
        marginBottom: 15,
        fontSize: 18,
        color: 'white', // White text in input
    },
    label: {
        fontSize: 16,
        color: 'white', // White label
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    genderOption: {
        flex: 1,
        paddingVertical: 12,
        marginHorizontal: 4,
        alignItems: 'center',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slightly transparent background
    },
    genderOptionSelected: {
        backgroundColor: '#8BC34A', // Green selected background
        borderColor: '#8BC34A',
    },
    genderText: {
        fontSize: 16,
        color: 'white', // White text
    },
    genderTextSelected: {
        color: 'white',
        fontWeight: 'bold',
    },
    confirmContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
        marginTop: 5,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#8BC34A', // Green checkbox border
        borderRadius: 4,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Transparent white
    },
    checkboxInner: {
        width: 14,
        height: 14,
        backgroundColor: '#8BC34A', // Green checkbox fill
        borderRadius: 2,
    },
    confirmText: {
        fontSize: 16,
        color: 'white', // White text
        flex: 1,
    },
    buttonContainer: {
        width: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 10,
    },
    loginLinkContainer: {
        marginTop: 30,
    },
    baseText: {
        fontSize: 16,
        color: 'white' // White text
    },
    link: {
        color: '#8BC34A', // Green link color
        fontWeight: 'bold',
    },
    errorText: {
        width: '100%',
        color: '#FF4D4F',
        fontSize: 14,
        marginTop: -10,
        marginBottom: 10,
    },
    birthRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    birthInput: {
        flex: 1,
        marginBottom: 0,
    },
    dateButton: {
        marginLeft: 10,
        height: 55,
        width: 55,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
    }
})