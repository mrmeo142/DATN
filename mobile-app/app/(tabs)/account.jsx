import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ImageBackground, ActivityIndicator, Image, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import { apiGet, apiPut, apiPost } from '../../utils/api'

// IMPORTANT: This path must be correct
const backgroundImage = require('../../assets/img/login-background.png');

const accountScreen = () => {
    const router = useRouter()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [fullname, setFullname] = useState('')
    const [dob, setDob] = useState(null)
    const [showDobPicker, setShowDobPicker] = useState(false)
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [avatarUri, setAvatarUri] = useState('')
    const [pickedAvatarUri, setPickedAvatarUri] = useState('')
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('user')
    const [carBrand, setCarBrand] = useState('')
    const [carModel, setCarModel] = useState('')
    const [licensePlate, setLicensePlate] = useState('')

    useEffect(() => {
        const load = async () => {
            try {
                const token = await SecureStore.getItemAsync('jwt')
                if (!token) { setLoading(false); return }
                const data = await apiGet('/profile', { headers: { Authorization: `Bearer ${token}` } })
                setProfile(data)
                setFullname(String(data?.fullname || ''))
                setPhone(String(data?.phone || ''))
                setEmail(String(data?.email || ''))
                const d = data?.birthday ? new Date(data.birthday) : null
                setDob(d && !isNaN(d.getTime()) ? d : null)
                setAvatarUri(String(data?.avatarUrl || ''))
            } catch (e) {
                Alert.alert('Failed', String(e.message || e))
            } finally {
                setLoading(false)
            }
        }
        load()
        const loadCar = async () => {
            try {
                const token = await SecureStore.getItemAsync('jwt')
                if (!token) return
                const car = await apiGet('/api/user/car', { headers: { Authorization: `Bearer ${token}` } })
                setCarBrand(String(car?.brand || ''))
                setCarModel(String(car?.model || ''))
                setLicensePlate(String(car?.licensePlate || ''))
            } catch (e) {
            }
        }
        loadCar()
    }, [])

    const pickAvatar = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!perm.granted) { Alert.alert('Permission required', 'Please allow photo library access.'); return }
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 })
        if (res.canceled) return
        const asset = res.assets && res.assets[0]
        if (asset?.uri) setPickedAvatarUri(asset.uri)
    }

    const saveAvatar = async () => {
        if (!pickedAvatarUri) return
        setAvatarUri(pickedAvatarUri)
        setPickedAvatarUri('')
        Alert.alert('Success', 'Avatar updated locally')
    }

    const saveProfile = async () => {
        try {
            setSaving(true)
            const token = await SecureStore.getItemAsync('jwt')
            if (!token) return
            const body = { fullname, birthday: dob ? dob.toISOString() : null, phone }
            await apiPut('/update', body, { headers: { Authorization: `Bearer ${token}` } })
            Alert.alert('Saved', 'Profile updated')
        } catch (e) {
            Alert.alert('Failed', String(e.message || e))
        } finally { setSaving(false) }
    }

    const saveCar = async () => {
        try {
            setSaving(true)
            const token = await SecureStore.getItemAsync('jwt')
            if (!token) return
            const body = { type: (carModel || carBrand || 'car'), identifier: licensePlate }
            await apiPost('/add/vehicles', body, { headers: { Authorization: `Bearer ${token}` } })
            Alert.alert('Saved', 'Vehicle added')
        } catch (e) {
            Alert.alert('Failed', String(e.message || e))
        } finally { setSaving(false) }
    }

    const startEmailChange = async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt')
            if (!token) return
            await apiPost('/api/user/request-email-change', { email }, { headers: { Authorization: `Bearer ${token}` } })
            router.push({ pathname: '/verifyCode', params: { purpose: 'email-change', email } })
        } catch (e) { Alert.alert('Failed', String(e.message || e)) }
    }

    const startPhoneChange = async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt')
            if (!token) return
            await apiPost('/api/user/request-phone-change', { phone }, { headers: { Authorization: `Bearer ${token}` } })
            router.push({ pathname: '/verifyCode', params: { purpose: 'phone-change', phone } })
        } catch (e) { Alert.alert('Failed', String(e.message || e)) }
    }

    const logout = async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt')
            if (token) {
                await apiPost('/logout', {}, { headers: { Authorization: `Bearer ${token}` } })
            }
        } catch { }
        await SecureStore.deleteItemAsync('jwt')
        router.replace('/loginScreen')
    }

    return (
        <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
            <View style={styles.overlay} />
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Account</Text>
                {loading ? (
                    <ActivityIndicator size="large" />
                ) : profile ? (
                    <View style={styles.card}>
                        <View style={styles.tabBar}>
                            <TouchableOpacity style={[styles.tabButton, activeTab === 'user' && styles.tabButtonActive]} onPress={() => setActiveTab('user')}>
                                <Text style={[styles.tabText, activeTab === 'user' && styles.tabTextActive]}>User</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tabButton, activeTab === 'car' && styles.tabButtonActive]} onPress={() => setActiveTab('car')}>
                                <Text style={[styles.tabText, activeTab === 'car' && styles.tabTextActive]}>Car</Text>
                            </TouchableOpacity>
                        </View>

                        {activeTab === 'user' ? (
                            <View>
                                <View style={styles.avatarRow}>
                                    <TouchableOpacity style={styles.avatarFrame} onPress={pickAvatar}>
                                        {pickedAvatarUri || avatarUri ? (
                                            <Image source={{ uri: pickedAvatarUri || avatarUri }} style={styles.avatar} />
                                        ) : (
                                            <View style={styles.avatarPlaceholder}><Text style={styles.avatarPlaceholderText}>{(profile.username || 'U').slice(0, 1).toUpperCase()}</Text></View>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.smallButton} onPress={saveAvatar} disabled={saving || !pickedAvatarUri}>
                                        <Text style={styles.smallButtonText}>{saving ? '...' : 'Save Avatar'}</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>Username</Text>
                                <Text style={styles.item}>{profile.username}</Text>

                                <Text style={styles.label}>Full Name</Text>
                                <TextInput style={styles.input} value={fullname} onChangeText={setFullname} placeholder="Full name" placeholderTextColor="#ccc" />

                                <Text style={styles.label}>Date of Birth</Text>
                                <TouchableOpacity style={styles.input} onPress={() => setShowDobPicker(true)}>
                                    <Text style={styles.inputText}>{dob ? dob.toDateString() : 'Select DOB'}</Text>
                                </TouchableOpacity>
                                {showDobPicker ? (
                                    <DateTimePicker value={dob || new Date()} mode="date" display="default" onChange={(e, d) => { setShowDobPicker(false); if (d) setDob(d) }} />
                                ) : null}

                                <Text style={styles.label}>Phone</Text>
                                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor="#ccc" keyboardType="phone-pad" />
                                <TouchableOpacity style={styles.button} onPress={startPhoneChange}>
                                    <Text style={styles.buttonText}>Verify & Update Phone</Text>
                                </TouchableOpacity>

                                <Text style={styles.label}>Email</Text>
                                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#ccc" keyboardType="email-address" autoCapitalize="none" />
                                <TouchableOpacity style={styles.button} onPress={startEmailChange}>
                                    <Text style={styles.buttonText}>Verify & Update Email</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.primaryButton} onPress={saveProfile} disabled={saving}>
                                    <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.label}>Brand</Text>
                                <TextInput style={styles.input} value={carBrand} onChangeText={setCarBrand} placeholder="Brand" placeholderTextColor="#ccc" />

                                <Text style={styles.label}>Model</Text>
                                <TextInput style={styles.input} value={carModel} onChangeText={setCarModel} placeholder="Model" placeholderTextColor="#ccc" />

                                <Text style={styles.label}>License Plate</Text>
                                <TextInput style={styles.input} value={licensePlate} onChangeText={setLicensePlate} placeholder="License Plate" placeholderTextColor="#ccc" autoCapitalize="characters" />

                                <TouchableOpacity style={styles.primaryButton} onPress={saveCar} disabled={saving}>
                                    <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Car'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={styles.text}>Not logged in.</Text>
                )}
            </ScrollView>
        </ImageBackground>
    );
};

export default accountScreen;

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    container: {
        flexGrow: 1,
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
    },
    text: {
        fontSize: 18,
        color: '#ccc',
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 16,
        borderRadius: 10,
        width: '100%',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
    },
    tabBar: { flexDirection: 'row', marginBottom: 12, borderRadius: 10, overflow: 'hidden' },
    tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)' },
    tabButtonActive: { backgroundColor: '#8BC34A', borderColor: '#8BC34A' },
    tabText: { color: 'white', fontWeight: 'bold' },
    tabTextActive: { color: 'white' },
    item: {
        fontSize: 16,
        color: 'white',
        marginBottom: 8,
    },
    label: {
        color: '#8BC34A',
        fontWeight: 'bold',
        marginTop: 12,
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        marginTop: 8,
        color: 'white',
    },
    inputText: {
        color: 'white',
        lineHeight: 50,
    },
    button: {
        backgroundColor: 'transparent',
        borderColor: '#8BC34A',
        borderWidth: 1,
        width: '100%',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    primaryButton: {
        backgroundColor: '#8BC34A',
        width: '100%',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatarFrame: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', borderColor: 'rgba(255,255,255,0.6)', borderWidth: 2, marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
    avatar: { width: '100%', height: '100%' },
    avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    avatarPlaceholderText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
    smallButton: { backgroundColor: '#8BC34A', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
    smallButtonText: { color: 'white', fontWeight: 'bold' },
    logoutButton: { backgroundColor: 'transparent', borderColor: '#FF4D4F', borderWidth: 1, width: '100%', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 16 },
    logoutText: { color: '#FF4D4F', fontWeight: 'bold' }
});