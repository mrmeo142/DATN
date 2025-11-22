import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ImageBackground,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions
} from 'react-native';
import { Link } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

// IMPORTANT: This path must be correct from the new file location
const backgroundImage = require('../../assets/img/login-background.png');
const { width: screenWidth } = Dimensions.get('window');

// --- Main Component ---
const homeScreen = () => { // Function name can stay homeScreen
    // State for the main scenario: 'IDLE', 'PLUGGED_IN', 'CHARGING', 'SUMMARY'
    const [chargingState, setChargingState] = useState('IDLE');

    // State for real-time charging data
    const [amps, setAmps] = useState(0.0);
    const [volts, setVolts] = useState(0.0);
    const [power, setPower] = useState(0.0); // This is kW
    const [batteryPercent, setBatteryPercent] = useState(65);
    const [timeElapsed, setTimeElapsed] = useState(0);

    // State for the chart data
    const [chartData, setChartData] = useState([0, 0]);

    // State for the final summary
    const [summary, setSummary] = useState({ percentAdded: 0, fee: 0.00, startTime: 0 });

    // --- Real-time Data Simulation ---
    useEffect(() => {
        let interval;
        if (chargingState === 'CHARGING') {
            interval = setInterval(() => {
                setBatteryPercent(prev => Math.min(prev + 1, 100));
                const newAmps = Math.random() * 2 + 31.0;
                const newVolts = Math.random() * 5 + 235.0;
                const newPower = (newVolts * newAmps) / 1000;
                setAmps(newAmps);
                setVolts(newVolts);
                setPower(newPower);
                setTimeElapsed(prev => prev + 3);
                setChartData(prevData => {
                    const newData = [...prevData, newPower];
                    return newData.length > 10 ? newData.slice(newData.length - 10) : newData;
                });
                if (batteryPercent >= 100) {
                    stopCharging();
                }
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [chargingState, batteryPercent]);

    // --- State Transition Functions ---
    const simulatePlugIn = () => {
        Alert.alert('Server Message', 'Vehicle has connected.');
        setChargingState('PLUGGED_IN');
        setBatteryPercent(65);
    };
    const simulateUnplug = () => {
        Alert.alert('Server Message', 'Vehicle has disconnected.');
        setChargingState('IDLE');
    };
    const startCharging = () => {
        console.log('Sending message to server: START_CHARGING');
        setChargingState('CHARGING');
        setTimeElapsed(0);
        setAmps(32.0);
        setVolts(240.0);
        const startPower = (32 * 240) / 1000;
        setPower(startPower);
        setChartData([startPower, startPower]);
        setSummary({ ...summary, startTime: batteryPercent });
    };
    const stopCharging = () => {
        console.log('Sending message to server: STOP_CHARGING');
        setChargingState('SUMMARY');
        const percentAdded = batteryPercent - summary.startTime;
        const totalKWh = (power * (timeElapsed / 3600));
        const fee = totalKWh * 0.45;
        setSummary({ ...summary, percentAdded, fee: fee.toFixed(2) });
    };
    const chargeAgain = () => {
        setChargingState('PLUGGED_IN');
    };

    // --- Helper Component: Data Box ---
    const DataBox = ({ icon, value, unit }) => (
        <View style={styles.dataBox}>
            <MaterialIcons name={icon} size={28} color="#8BC34A" />
            <Text style={styles.dataBoxValue}>{value}</Text>
            <Text style={styles.dataBoxUnit}>{unit}</Text>
        </View>
    );

    // --- SCENARIO 1: Before Charging (IDLE) ---
    const renderIdle = () => (
        <View style={styles.scenarioContainer}>
            <Text style={styles.scenarioTitle}>Welcome!</Text>
            <Text style={styles.scenarioText}>Find a charging station and plug in your vehicle to begin.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={simulatePlugIn}>
                <Text style={styles.primaryButtonText}>(Simulate Vehicle Plug-In)</Text>
            </TouchableOpacity>
        </View>
    );

    // --- SCENARIO 1.5: Plugged In (Ready) ---
    const renderPluggedIn = () => (
        <View style={styles.scenarioContainer}>
            <FontAwesome5 name="car" size={60} color="#8BC34A" />
            <Text style={styles.scenarioTitle}>Vehicle Connected</Text>
            <Text style={styles.scenarioText}>Your vehicle is at {batteryPercent}%. Ready to charge.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={startCharging}>
                <Text style={styles.primaryButtonText}>Start Charging</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={simulateUnplug}>
                <Text style={styles.secondaryButtonText}>(Simulate Unplug)</Text>
            </TouchableOpacity>
        </View>
    );

    // --- SCENARIO 2: While Charging ---
    const renderCharging = () => (
        <ScrollView contentContainerStyle={styles.chargingContainer}>
            <Text style={styles.chargingTitle}>Charging...</Text>
            <View style={styles.batteryContainer}>
                <FontAwesome5 name="battery-three-quarters" size={40} color="white" />
                <Text style={styles.batteryPercent}>{batteryPercent}%</Text>
            </View>
            <View style={styles.dataBoxRow}>
                <DataBox icon="flash-on" value={power.toFixed(2)} unit="kW" />
                <DataBox icon="timelapse" value={`${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`} unit="min:sec" />
            </View>
            <View style={styles.dataBoxRow}>
                <DataBox icon="bolt" value={volts.toFixed(1)} unit="Volts" />
                <DataBox icon="power" value={amps.toFixed(1)} unit="Amps" />
            </View>
            <Text style={styles.chartTitle}>Real-time Power (kW)</Text>
            <LineChart
                data={{ datasets: [{ data: chartData }] }}
                width={screenWidth - 40}
                height={200}
                yAxisSuffix="kW"
                withVerticalLines={false}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
            />
            <TouchableOpacity style={styles.stopButton} onPress={stopCharging}>
                <Text style={styles.stopButtonText}>Stop Charging</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    // --- SCENARIO 3: After Charging (Summary) ---
    const renderSummary = () => (
        <View style={styles.scenarioContainer}>
            <MaterialIcons name="check-circle" size={60} color="#8BC34A" />
            <Text style={styles.scenarioTitle}>Charging Complete</Text>
            <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Total Energy Added</Text>
                <Text style={styles.summaryValue}>{summary.percentAdded}%</Text>
            </View>
            <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Estimated Cost</Text>
                <Text style={styles.summaryValue}>${summary.fee}</Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={chargeAgain}>
                <Text style={styles.primaryButtonText}>Charge Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={simulateUnplug}>
                <Text style={styles.secondaryButtonText}>Done (Simulate Unplug)</Text>
            </TouchableOpacity>
        </View>
    );

    // --- Main Render Function ---
    return (
        <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
            <View style={styles.overlay} />
            {/* *** IMPORTANT CHANGE IS HERE *** */}
            <View style={styles.mainContainer}>
                {chargingState === 'IDLE' && renderIdle()}
                {chargingState === 'PLUGGED_IN' && renderPluggedIn()}
                {chargingState === 'CHARGING' && renderCharging()}
                {chargingState === 'SUMMARY' && renderSummary()}
            </View>
        </ImageBackground>
    );
};

// --- Chart Configuration ---
const chartConfig = {
    backgroundColor: '#1e2923',
    backgroundGradientFrom: 'rgba(255, 255, 255, 0.1)',
    backgroundGradientTo: 'rgba(255, 255, 255, 0.1)',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(139, 195, 74, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '6', strokeWidth: '2', stroke: '#8BC34A' },
};

// --- Styles ---
const styles = StyleSheet.create({
    background: { flex: 1, width: '100%', height: '100%' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    mainContainer: {
        flex: 1,
        zIndex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 80, // <-- *** ADDED PADDING TO AVOID TAB BAR ***
    },
    scenarioContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chargingContainer: { paddingBottom: 40 },
    scenarioTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', textAlign: 'center', marginTop: 20, marginBottom: 10 },
    scenarioText: { fontSize: 18, color: '#ccc', textAlign: 'center', marginBottom: 30, maxWidth: '90%' },
    chargingTitle: { fontSize: 28, fontWeight: '600', color: 'white', textAlign: 'center', marginBottom: 20 },
    batteryContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    batteryPercent: { fontSize: 48, fontWeight: 'bold', color: 'white', marginLeft: 15 },
    dataBoxRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    dataBox: { width: '48%', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 20, borderRadius: 10, alignItems: 'center', borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1 },
    dataBoxValue: { fontSize: 26, fontWeight: 'bold', color: 'white', marginTop: 8 },
    dataBoxUnit: { fontSize: 16, color: '#ccc', marginTop: 4 },
    chartTitle: { fontSize: 18, color: 'white', fontWeight: '600', marginBottom: 10, marginTop: 15 },
    chart: { borderRadius: 16 },
    summaryBox: { backgroundColor: 'rgba(255, 255, 255, 0.1)', width: '100%', padding: 20, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
    summaryLabel: { fontSize: 16, color: '#ccc' },
    summaryValue: { fontSize: 32, fontWeight: 'bold', color: 'white', marginTop: 8 },
    primaryButton: { backgroundColor: '#8BC34A', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    primaryButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    secondaryButton: { backgroundColor: 'transparent', borderColor: '#8BC34A', borderWidth: 1, width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 },
    secondaryButtonText: { color: '#8BC34A', fontSize: 18, fontWeight: 'bold' },
    stopButton: { backgroundColor: '#D32F2F', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30 },
    stopButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default homeScreen;