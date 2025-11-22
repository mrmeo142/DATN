import React, { useEffect, useMemo, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ImageBackground,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import { apiGet } from '../../utils/api';
import * as SecureStore from 'expo-secure-store'

const backgroundImage = require('../../assets/img/login-background.png');
const { width: screenWidth } = Dimensions.get('window');

const historyScreen = () => {
    const [mode, setMode] = useState('charge');

    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [showDatePickerCharge, setShowDatePickerCharge] = useState(false);
    const [chargeSessions, setChargeSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState(null);

    const [startDate, setStartDate] = useState(() => new Date());
    const [endDate, setEndDate] = useState(() => new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [paymentSessions, setPaymentSessions] = useState([]);

    const fetchChargeHistory = async (date) => {
        const d = date || selectedDate;
        try {
            const token = await SecureStore.getItemAsync('jwt')
            if (!token) throw new Error('HTTP 401')
            const bills = await apiGet('/bills/all', { headers: { Authorization: `Bearer ${token}` } })
            const dayKey = formatDateISO(d)
            const sessions = (Array.isArray(bills) ? bills : [])
                .filter(b => b.billType && String(b.billType).toUpperCase().includes('ELEC'))
                .filter(b => (b.createdAt || '').slice(0, 10) === dayKey)
                .flatMap(b => (Array.isArray(b.timeUse) ? b.timeUse : []).map((s, idx) => ({
                    id: `${b.id || idx}-${idx}`,
                    startTime: s.startedAt,
                    endTime: s.endedAt,
                    timestamps: [],
                    amps: [],
                    volts: [],
                    battery: []
                })))
            setChargeSessions(sessions)
            setSelectedSessionId(sessions.length ? sessions[0].id : null)
        } catch (e) {
            const mock = mockChargeSessionsForDate(d);
            setChargeSessions(mock);
            setSelectedSessionId(mock.length ? mock[0].id : null);
        }
    };

    const fetchPaymentHistory = async (start, end) => {
        const s = start || startDate;
        const e = end || endDate;
        try {
            const token = await SecureStore.getItemAsync('jwt')
            if (!token) throw new Error('HTTP 401')
            const bills = await apiGet('/bills/all', { headers: { Authorization: `Bearer ${token}` } })
            const sKey = formatDateISO(s)
            const eKey = formatDateISO(e)
            const sessions = (Array.isArray(bills) ? bills : [])
                .filter(b => b.billType && String(b.billType).toUpperCase().includes('BANK'))
                .filter(b => {
                    const d = (b.paidAt || b.createdAt || '').slice(0, 10)
                    return d >= sKey && d <= eKey
                })
                .map((b, idx) => ({ id: b.id || idx, startTime: b.createdAt, endTime: b.paidAt || b.createdAt, fee: b.amount || 0 }))
            setPaymentSessions(sessions)
        } catch (err) {
            setPaymentSessions(mockPaymentSessionsBetween(s, e));
        }
    };

    useEffect(() => {
        fetchChargeHistory(selectedDate);
    }, []);

    useEffect(() => {
        fetchPaymentHistory(startDate, endDate);
    }, []);

    const selectedSession = useMemo(() => {
        return chargeSessions.find((s) => (s.id ?? s._id) === selectedSessionId) || null;
    }, [chargeSessions, selectedSessionId]);

    const onChangeChargeDate = (_, date) => {
        if (!date) return setShowDatePickerCharge(false);
        setShowDatePickerCharge(false);
        setSelectedDate(date);
        fetchChargeHistory(date);
    };

    const onChangeStartDate = (_, date) => {
        if (!date) return setShowStartPicker(false);
        setShowStartPicker(false);
        setStartDate(date);
        fetchPaymentHistory(date, endDate);
    };

    const onChangeEndDate = (_, date) => {
        if (!date) return setShowEndPicker(false);
        setShowEndPicker(false);
        setEndDate(date);
        fetchPaymentHistory(startDate, date);
    };

    return (
        <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
            <View style={styles.overlay} />
            <View style={styles.mainContainer}>
                <Text style={styles.header}>History</Text>

                <View style={styles.switchRow}>
                    <TouchableOpacity
                        style={[styles.switchBtn, mode === 'charge' ? styles.switchBtnActive : null]}
                        onPress={() => setMode('charge')}
                    >
                        <MaterialIcons name="bolt" color={mode === 'charge' ? 'white' : '#8BC34A'} size={22} />
                        <Text style={[styles.switchText, mode === 'charge' ? styles.switchTextActive : null]}>Charge</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.switchBtn, mode === 'payments' ? styles.switchBtnActive : null]}
                        onPress={() => setMode('payments')}
                    >
                        <MaterialIcons name="payment" color={mode === 'payments' ? 'white' : '#8BC34A'} size={22} />
                        <Text style={[styles.switchText, mode === 'payments' ? styles.switchTextActive : null]}>Pay Fee</Text>
                    </TouchableOpacity>
                </View>

                {mode === 'charge' ? (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.inputRow}>
                            <View style={styles.inputCol}>
                                <Text style={styles.label}>Date</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formatDateDisplay(selectedDate)}
                                    editable={false}
                                />
                            </View>
                            <TouchableOpacity style={styles.pickBtn} onPress={() => setShowDatePickerCharge(true)}>
                                <MaterialIcons name="date-range" color="white" size={20} />
                                <Text style={styles.pickBtnText}>Pick Date</Text>
                            </TouchableOpacity>
                        </View>
                        {showDatePickerCharge && (
                            <DateTimePicker value={selectedDate} mode="date" onChange={onChangeChargeDate} />
                        )}

                        {chargeSessions.length > 1 && (
                            <View style={styles.sessionsBox}>
                                <Text style={styles.label}>Select Session</Text>
                                {chargeSessions.map((s) => {
                                    const id = s.id ?? s._id;
                                    const active = id === selectedSessionId;
                                    return (
                                        <TouchableOpacity
                                            key={id}
                                            style={[styles.sessionItem, active ? styles.sessionItemActive : null]}
                                            onPress={() => setSelectedSessionId(id)}
                                        >
                                            <MaterialIcons name="schedule" size={20} color={active ? 'white' : '#8BC34A'} />
                                            <Text style={[styles.sessionText, active ? styles.sessionTextActive : null]}>
                                                {formatTimeRange(s.startTime, s.endTime)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {selectedSession ? (
                            <View>
                                <Text style={styles.chartTitle}>Amps</Text>
                                <LineChart
                                    data={{ labels: selectedSession.timestamps?.map(formatTimeLabel) || [], datasets: [{ data: selectedSession.amps || [] }] }}
                                    width={screenWidth - 40}
                                    height={180}
                                    yAxisSuffix="A"
                                    withVerticalLines={false}
                                    chartConfig={chartConfig}
                                    bezier
                                    style={styles.chart}
                                />
                                <Text style={styles.chartTitle}>Volts</Text>
                                <LineChart
                                    data={{ labels: selectedSession.timestamps?.map(formatTimeLabel) || [], datasets: [{ data: selectedSession.volts || [] }] }}
                                    width={screenWidth - 40}
                                    height={180}
                                    yAxisSuffix="V"
                                    withVerticalLines={false}
                                    chartConfig={chartConfig}
                                    bezier
                                    style={styles.chart}
                                />
                                <Text style={styles.chartTitle}>Battery %</Text>
                                <LineChart
                                    data={{ labels: selectedSession.timestamps?.map(formatTimeLabel) || [], datasets: [{ data: selectedSession.battery || [] }] }}
                                    width={screenWidth - 40}
                                    height={180}
                                    yAxisSuffix="%"
                                    withVerticalLines={false}
                                    chartConfig={chartConfig}
                                    bezier
                                    style={styles.chart}
                                />
                            </View>
                        ) : (
                            <View style={styles.emptyBox}>
                                <MaterialIcons name="info" size={20} color="#ccc" />
                                <Text style={styles.emptyText}>No sessions for this day</Text>
                            </View>
                        )}
                    </ScrollView>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.inputRow}>
                            <View style={styles.inputCol}>
                                <Text style={styles.label}>Start</Text>
                                <TextInput style={styles.input} value={formatDateDisplay(startDate)} editable={false} />
                            </View>
                            <TouchableOpacity style={styles.pickBtn} onPress={() => setShowStartPicker(true)}>
                                <MaterialIcons name="date-range" color="white" size={20} />
                                <Text style={styles.pickBtnText}>Pick</Text>
                            </TouchableOpacity>
                        </View>
                        {showStartPicker && (
                            <DateTimePicker value={startDate} mode="date" onChange={onChangeStartDate} />
                        )}

                        <View style={styles.inputRow}>
                            <View style={styles.inputCol}>
                                <Text style={styles.label}>End</Text>
                                <TextInput style={styles.input} value={formatDateDisplay(endDate)} editable={false} />
                            </View>
                            <TouchableOpacity style={styles.pickBtn} onPress={() => setShowEndPicker(true)}>
                                <MaterialIcons name="date-range" color="white" size={20} />
                                <Text style={styles.pickBtnText}>Pick</Text>
                            </TouchableOpacity>
                        </View>
                        {showEndPicker && (
                            <DateTimePicker value={endDate} mode="date" onChange={onChangeEndDate} />
                        )}

                        <View style={styles.sessionsBox}>
                            <Text style={styles.label}>Payment Sessions</Text>
                            {paymentSessions.length ? (
                                paymentSessions.map((s, idx) => (
                                    <View key={`${s.id ?? s._id ?? idx}`} style={styles.paymentItem}>
                                        <MaterialIcons name="receipt" size={20} color="#8BC34A" />
                                        <View style={styles.paymentTextCol}>
                                            <Text style={styles.paymentText}>{formatTimeRange(s.startTime, s.endTime)}</Text>
                                            <Text style={styles.paymentFee}>Fee: {formatCurrency(s.fee)}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyBox}>
                                    <MaterialIcons name="info" size={20} color="#ccc" />
                                    <Text style={styles.emptyText}>No payment history in range</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                )}
            </View>
        </ImageBackground>
    );
};

const chartConfig = {
    backgroundColor: '#1e2923',
    backgroundGradientFrom: 'rgba(255, 255, 255, 0.1)',
    backgroundGradientTo: 'rgba(255, 255, 255, 0.1)',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(139, 195, 74, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#8BC34A' },
};

const formatDateISO = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDateDisplay = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
};

const formatTimeLabel = (t) => {
    const dt = new Date(t);
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

const formatTimeRange = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const fmt = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${fmt(s)} - ${fmt(e)}`;
};

const formatCurrency = (n) => {
    const num = typeof n === 'number' ? n : parseFloat(n || '0');
    return `$${num.toFixed(2)}`;
};

const mockChargeSessionsForDate = (date) => {
    const baseDay = new Date(date);
    const makeSeries = (startHour) => {
        const timestamps = [];
        const amps = [];
        const volts = [];
        const battery = [];
        for (let i = 0; i < 12; i++) {
            const dt = new Date(baseDay);
            dt.setHours(startHour, i * 5, 0, 0);
            timestamps.push(dt.toISOString());
            const a = 30 + Math.random() * 6;
            const v = 220 + Math.random() * 20;
            const b = Math.min(100, 40 + i * 4 + Math.random() * 3);
            amps.push(parseFloat(a.toFixed(1)));
            volts.push(parseFloat(v.toFixed(1)));
            battery.push(parseFloat(b.toFixed(1)));
        }
        const start = new Date(baseDay);
        start.setHours(startHour, 0, 0, 0);
        const end = new Date(baseDay);
        end.setHours(startHour + 1, 0, 0, 0);
        return { id: `${baseDay.getTime()}-${startHour}`, startTime: start.toISOString(), endTime: end.toISOString(), timestamps, amps, volts, battery };
    };
    const sessions = [makeSeries(9), makeSeries(18)];
    return sessions;
};

const mockPaymentSessionsBetween = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const days = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
    const arr = [];
    for (let i = 0; i < days; i++) {
        const day = new Date(s);
        day.setDate(s.getDate() + i);
        const startTime = new Date(day);
        startTime.setHours(9, 0, 0, 0);
        const endTime = new Date(day);
        endTime.setHours(10, 15, 0, 0);
        const fee = 5 + Math.random() * 7;
        arr.push({ id: `${day.toDateString()}-fee`, startTime: startTime.toISOString(), endTime: endTime.toISOString(), fee: parseFloat(fee.toFixed(2)) });
    }
    return arr;
};

export default historyScreen;

const styles = StyleSheet.create({
    background: { flex: 1, width: '100%', height: '100%' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    mainContainer: { flex: 1, zIndex: 1, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 80 },
    header: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 16 },
    switchRow: { flexDirection: 'row', marginBottom: 16 },
    switchBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#8BC34A', marginRight: 8 },
    switchBtnActive: { backgroundColor: '#8BC34A' },
    switchText: { color: '#8BC34A', fontSize: 16, fontWeight: '600', marginLeft: 8 },
    switchTextActive: { color: 'white' },
    scrollContent: { paddingBottom: 40 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
    inputCol: { flex: 1, marginRight: 12 },
    label: { color: '#ccc', marginBottom: 6 },
    input: { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
    pickBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8BC34A', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
    pickBtnText: { color: 'white', fontSize: 16, marginLeft: 6, fontWeight: '600' },
    sessionsBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 8, marginBottom: 12 },
    sessionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
    sessionItemActive: { backgroundColor: '#8BC34A' },
    sessionText: { color: '#8BC34A', marginLeft: 8, fontSize: 16, fontWeight: '600' },
    sessionTextActive: { color: 'white' },
    chartTitle: { fontSize: 16, color: 'white', fontWeight: '600', marginTop: 10, marginBottom: 6 },
    chart: { borderRadius: 12 },
    emptyBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16 },
    emptyText: { color: '#ccc', marginLeft: 8 },
    paymentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
    paymentTextCol: { marginLeft: 10 },
    paymentText: { color: 'white', fontSize: 16, fontWeight: '600' },
    paymentFee: { color: '#ccc', marginTop: 2 },
});