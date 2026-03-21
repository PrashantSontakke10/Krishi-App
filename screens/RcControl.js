import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import Paho from 'paho-mqtt';
import { WebView } from 'react-native-webview';
import { t } from '../utils/translations';

const STREAM_URL = 'http://10.13.19.84:81/stream';

const MQTT_BROKER = '10.13.19.102'; // Hive MQ IP
const MQTT_PORT = 8000; // MUST BE WEBSOCKET PORT (For HiveMQ it usually defaults to 8000)

export default function RcControl({ openMenu, language }) {
    const [client, setClient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [lastCmdText, setLastCmdText] = useState('None');
    const [replyText, setReplyText] = useState('Waiting');
    const [streamError, setStreamError] = useState(false);
    const [streamKey, setStreamKey] = useState(0);

    // Custom states for actions
    const [relayState, setRelayState] = useState(false); // false = OFF, true = ON

    const mqttClientRef = useRef(null);

    useEffect(() => {
        // Generate a random client ID
        const clientId = 'krishiapp_' + Math.random().toString(16).substr(2, 8);
        const mqttClient = new Paho.Client(MQTT_BROKER, MQTT_PORT, clientId);

        mqttClient.onConnectionLost = (responseObject) => {
            if (responseObject.errorCode !== 0) {
                console.log("Connection Lost:", responseObject.errorMessage);
            }
            setConnected(false);
        };

        mqttClient.onMessageArrived = (message) => {
            if (message.destinationName === 'rc/car/status') {
                setReplyText(message.payloadString);
            }
        };

        const onConnect = () => {
            console.log('Connected to MQTT');
            setConnected(true);
            mqttClient.subscribe('rc/car/status', { qos: 0 });
        };

        const onFailure = (err) => {
            console.log('Failed to connect:', err);
            setConnected(false);
        };

        try {
            // Connect to MQTT broker
            mqttClient.connect({
                onSuccess: onConnect,
                onFailure: onFailure,
                cleanSession: true,
                useSSL: false, // Ensure SSL is false for local IP connections
            });
            mqttClientRef.current = mqttClient;
            setClient(mqttClient);
        } catch (e) {
            console.log("MQTT Connect error", e);
        }

        // Cleanup on unmount
        return () => {
            if (mqttClientRef.current && mqttClientRef.current.isConnected()) {
                mqttClientRef.current.disconnect();
            }
        };
    }, []);

    const sendMqttMessage = (topic, msg) => {
        if (mqttClientRef.current && mqttClientRef.current.isConnected()) {
            const message = new Paho.Message(msg);
            message.destinationName = topic;
            mqttClientRef.current.send(message);
        } else {
            console.log("Cannot send message, MQTT not connected.");
        }
    };

    const handleTouchDown = (dir) => {
        sendMqttMessage('rc/car/control', dir);
        setLastCmdText(dir);
    };

    const handleTouchUp = () => {
        sendMqttMessage('rc/car/control', 'STOP');
        setLastCmdText('STOP');
    };

    const handleRelayToggle = () => {
        const newState = !relayState;
        setRelayState(newState); // toggle

        const cmd = newState ? 'RELAY_ON' : 'RELAY_OFF';
        sendMqttMessage('rc/car/control', cmd);
        setLastCmdText(cmd.replace('_', ' '));
    };

    const handleStopClick = () => {
        handleTouchUp();
    };

    return (
        <View style={styles.container}>
            {/* Premium Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.menuBtn} onPress={openMenu}>
                    <Text style={styles.menu}>☰</Text>
                </TouchableOpacity>
                <Text style={styles.header}>{t("🏎️ RC Control", language)}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>{t("Control your Krishi rover and view live camera feed right from your dashboard.", language)}</Text>

                {/* MQTT Connection Status Indicator */}
                <View style={styles.statusBox}>
                    <Text style={[styles.statusText, { color: connected ? '#4CAF50' : '#f44336' }]}>
                        {connected ? t("✓ Connected", language) : t("X Disconnected", language)}
                    </Text>
                    <Text style={styles.brokerText}>ws://{MQTT_BROKER}:{MQTT_PORT}</Text>
                </View>

                {/* Video Feed Card */}
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>{t('Camera', language)}</Text>
                    <View style={styles.videoSection}>
                        {streamError ? (
                            <View style={styles.streamErrorBox}>
                                <Text style={styles.videoText}>{t('Camera Feed Unavailable', language)}</Text>
                                <TouchableOpacity
                                    style={styles.retryBtn}
                                    onPress={() => { setStreamError(false); setStreamKey(k => k + 1); }}
                                >
                                    <Text style={styles.retryBtnText}>🔄 {t('Retry', language) || 'Retry'}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                                <WebView
                                    key={streamKey}
                                    source={{ 
                                        html: `
                                            <html>
                                                <body style="margin:0;padding:0;background-color:#000;display:flex;justify-content:center;align-items:center;height:100vh;">
                                                    <img src="${STREAM_URL}" style="width:100%; height:auto; object-fit:contain;" />
                                                </body>
                                            </html>
                                        ` 
                                    }}
                                    style={styles.webview}
                                    onError={() => setStreamError(true)}
                                    onHttpError={() => setStreamError(true)}
                                    startInLoadingState={true}
                                    renderLoading={() => (
                                        <View style={styles.streamLoadingBox}>
                                            <ActivityIndicator size="large" color="#4CAF50" />
                                            <Text style={{ color: '#fff', marginTop: 10, fontSize: 13 }}>Connecting to camera...</Text>
                                        </View>
                                    )}
                                    scrollEnabled={false}
                                    allowsInlineMediaPlayback={true}
                                    mediaPlaybackRequiresUserAction={false}
                                    originWhitelist={['*']}
                                    javaScriptEnabled={true}
                                    domStorageEnabled={true}
                                    mixedContentMode="always"
                                    userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Mobile Safari/537.36"
                                    incognito={true}
                                />
                        )}
                    </View>
                </View>

                {/* Controls Card */}
                <View style={[styles.formCard, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>{t("Navigation", language)}</Text>

                    <View style={styles.padContainer}>
                        <TouchableOpacity
                            style={styles.navBtn}
                            onPressIn={() => handleTouchDown('FORWARD')}
                            onPressOut={handleTouchUp}
                            delayPressIn={0}
                        >
                            <Text style={styles.navBtnText}>{t("Forward", language)}</Text>
                        </TouchableOpacity>

                        <View style={styles.padRow}>
                            <TouchableOpacity
                                style={styles.navBtn}
                                onPressIn={() => handleTouchDown('LEFT')}
                                onPressOut={handleTouchUp}
                                delayPressIn={0}
                            >
                                <Text style={styles.navBtnText}>{t("Left", language)}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.navBtn, styles.stopBtn, { marginHorizontal: 15 }]}
                                onPress={handleStopClick}
                            >
                                <Text style={styles.stopBtnText}>{t("STOP", language)}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.navBtn}
                                onPressIn={() => handleTouchDown('RIGHT')}
                                onPressOut={handleTouchUp}
                                delayPressIn={0}
                            >
                                <Text style={styles.navBtnText}>{t("Right", language)}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.navBtn}
                            onPressIn={() => handleTouchDown('BACKWARD')}
                            onPressOut={handleTouchUp}
                            delayPressIn={0}
                        >
                            <Text style={styles.navBtnText}>{t("Backward", language)}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* MQTT Action Logs */}
                    <View style={styles.logBox}>
                        <Text style={styles.logText}>{t("Last Command:", language)} {t(lastCmdText, language)}</Text>
                        <Text style={[styles.logText, { color: '#B8860B', marginTop: 5 }]}>{t("Reply:", language)} {t(replyText, language)}</Text>
                    </View>

                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{t("Commands", language)}</Text>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, relayState ? { backgroundColor: '#f44336', shadowColor: '#f44336' } : {}]}
                            onPress={handleRelayToggle}
                        >
                            <Text style={styles.actionButtonText}>
                                {relayState ? t('RELAY ON', language) : t('RELAY OFF', language)}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>{t("Camera", language)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>{t("Get Sensor Values", language)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7F6', paddingTop: 20, marginTop: 30 },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
    menuBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginRight: 15 },
    menu: { fontSize: 20, color: '#333' },
    header: { fontSize: 24, fontWeight: '800', color: '#1B5E20', letterSpacing: -0.5 },
    scroll: { paddingHorizontal: 20, paddingBottom: 50 },
    subtitle: { fontSize: 15, color: '#666', lineHeight: 22, paddingBottom: 5, paddingLeft: 5 },
    statusBox: { alignItems: 'center', marginBottom: 15 },
    statusText: { fontSize: 16, fontWeight: 'bold' },
    brokerText: { fontSize: 12, color: '#888', marginTop: 2 },
    formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#888', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
    videoSection: { height: 220, backgroundColor: '#1B1B1B', justifyContent: 'center', alignItems: 'center', borderRadius: 16, overflow: 'hidden' },
    videoText: { color: '#fff', fontSize: 14, fontWeight: '600', opacity: 0.8 },
    webview: { width: '100%', height: '100%', backgroundColor: '#1B1B1B' },
    streamLoadingBox: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1B1B1B', justifyContent: 'center', alignItems: 'center' },
    streamErrorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
    retryBtn: { backgroundColor: '#2E7D32', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
    retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    actionButtons: { flexDirection: 'column', gap: 12 },
    actionButton: { backgroundColor: '#2E7D32', paddingVertical: 14, borderRadius: 16, alignItems: 'center', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginBottom: 12 },
    actionButtonText: { color: '#fff', fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    padContainer: { alignItems: 'center', marginVertical: 10 },
    padRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
    navBtn: { backgroundColor: '#E8F5E9', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, minWidth: 85, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#C8E6C9' },
    stopBtn: { backgroundColor: '#d32f2f', borderColor: '#c62828', shadowColor: '#d32f2f', shadowOpacity: 0.4 },
    navBtnText: { color: '#2E7D32', fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },
    stopBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    logBox: { marginTop: 15, padding: 15, backgroundColor: '#FAFAFA', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
    logText: { fontSize: 14, color: '#555', fontWeight: '600' }
});
