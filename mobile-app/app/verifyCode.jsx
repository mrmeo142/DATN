import React, { useState } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ImageBackground, Alert } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { apiPost } from '../utils/api'

const backgroundImage = require('../assets/img/login-background.png')

export const isValidEmail = (value) => {
  if (!value) return false
  const v = String(value).trim()
  return v.includes('@')
}

export const isValidPhone = (value) => {
  if (!value) return false
  const digits = String(value).replace(/\D/g, '')
  return /^\d{10}$/.test(digits)
}

const VerifyCode = () => {
  const router = useRouter()
  const { email: initialEmail, phone: initialPhone, purpose } = useLocalSearchParams()
  const [email, setEmail] = useState(initialEmail || '')
  const [phone, setPhone] = useState(initialPhone || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handleVerify = async () => {
    if (!code || code.trim().length < 4) {
      Alert.alert('Error', 'Please enter the verification code.')
      return
    }
    Alert.alert('Not Available', 'Verification flows are not available in current backend.')
  }

  const handleResend = async () => {
    Alert.alert('Not Available', 'Resend code is not available in current backend.')
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
        <Text style={styles.title}>Verify Code</Text>
        <Text style={styles.subtitle}>{purpose === 'phone-change' ? 'Enter the code sent to your phone.' : 'Enter the code sent to your email.'}</Text>
        {purpose === 'phone-change' ? (
          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor="#ccc"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#ccc"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Verification code"
          placeholderTextColor="#ccc"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />
        {purpose === 'reset' ? (
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor="#ccc"
            secureTextEntry={true}
            autoCapitalize="none"
            value={newPassword}
            onChangeText={setNewPassword}
          />
        ) : null}
        <TouchableOpacity style={styles.button} onPress={handleVerify}>
          <Text style={styles.buttonText}>Verify</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleResend}>
          <Text style={styles.secondaryButtonText}>Resend Code</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  )
}

export default VerifyCode

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
    letterSpacing: 4,
    textAlign: 'center',
  },
  button: { backgroundColor: '#8BC34A', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: 'transparent', borderColor: '#8BC34A', borderWidth: 1, width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  secondaryButtonText: { color: '#8BC34A', fontSize: 16, fontWeight: 'bold' },
})