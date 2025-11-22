import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'

const NewUser = () => {
    const router = useRouter()
    const [numberPlate, setNumberPlate] = useState('')
    const [vehicleType, setVehicleType] = useState(null)

    const handleSelect = (type) => {
        setVehicleType(type)
    }

    const handleContinue = () => {
        router.replace('/(tabs)/home')
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Vehicle Setup</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your number-plate"
                placeholderTextColor="#999"
                value={numberPlate}
                onChangeText={setNumberPlate}
                autoCapitalize="characters"
            />
            <View style={styles.typeRow}>
                <TouchableOpacity
                    style={[styles.typeButton, vehicleType === 'car' && styles.typeSelected]}
                    onPress={() => handleSelect('car')}
                >
                    <Text style={styles.typeText}>Car</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.typeButton, vehicleType === 'motorbike' && styles.typeSelected]}
                    onPress={() => handleSelect('motorbike')}
                >
                    <Text style={styles.typeText}>Motorbike</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue} disabled={!numberPlate || !vehicleType}>
                <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
        </View>
    )
}

export default NewUser

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold'
    },
    input: {
        width: '90%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        marginTop: 16
    },
    typeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '90%',
        marginTop: 16
    },
    typeButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 12,
        marginHorizontal: 6,
        alignItems: 'center'
    },
    typeSelected: {
        borderColor: '#8BC34A'
    },
    typeText: {
        fontSize: 16
    },
    continueButton: {
        width: '90%',
        backgroundColor: '#8BC34A',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24
    },
    continueText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    }
})
