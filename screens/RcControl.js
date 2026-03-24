import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, TextInput, Modal, Alert } from 'react-native';
import axios from 'axios';
import Paho from 'paho-mqtt';
import { WebView } from 'react-native-webview';
import { t } from '../utils/translations';

const CONTROL_URL = process.env.EXPO_PUBLIC_RC_CONTROL_URL || 'http://10.13.19.160';
const STREAM_URL = process.env.EXPO_PUBLIC_RC_STREAM_URL || 'http://10.13.19.160/capture';

const MQTT_BROKER = process.env.EXPO_PUBLIC_MQTT_BROKER || '10.13.19.102'; // Hive MQ IP
const MQTT_PORT = parseInt(process.env.EXPO_PUBLIC_MQTT_PORT) || 8000; // MUST BE WEBSOCKET PORT

const DEFAULT_FARM_BOUNDARY = `76.67877949840206,20.78223135963174,0 76.67878260048575,20.78222128119604,0 76.67878184584922,20.78220990784899,0 76.67878433895004,20.78220058939666,0 76.67878677823384,20.78219217853808,0 76.67878816718793,20.78218109131431,0 76.6787938415405,20.78217420425095,0 76.67879294406336,20.78216475857916,0 76.6787954501449,20.7821584442226,0 76.67879744621884,20.78215203119859,0 76.67879788874895,20.78214427604501,0 76.67879988163651,20.78213896344793,0 76.67880132382095,20.78213213225587,0 76.67880261871632,20.78212431773141,0 76.67880570962315,20.7821187926276,0 76.67881584367493,20.78212149713459,0 76.67883048059527,20.78212365220068,0 76.67883952210182,20.78212527440008,0 76.67885020945798,20.782126727403,0 76.6788622330841,20.7821291957958,0 76.67887192361515,20.78213182048268,0 76.67888152026138,20.78213135702934,0 76.67889411550627,20.78213710340274,0 76.67889412224902,20.78214325689104,0 76.6788932725197,20.78215442253895,0 76.67889154849509,20.78216196586244,0 76.67889171065664,20.78217029424607,0 76.67889066019147,20.78218134376954,0 76.67888506351795,20.78219918553059,0 76.67888486585063,20.78220606291953,0 76.67888253117067,20.78221802123231,0 76.67887922235543,20.78223310897701,0 76.67887800223251,20.78223937422335,0 76.67887683022641,20.78225026539202,0 76.67887683022641,20.78225026539202,0 76.67887445853169,20.7822579760087,0 76.67886975515144,20.78226345050075,0 76.67885791955723,20.78226263825224,0 76.67884387391604,20.78226106261606,0 76.67883275465455,20.78225974061137,0 76.67881881438713,20.78225832705887,0 76.67880856595464,20.78225731295181,0 76.67879227386457,20.78225411888618,0 76.67878005337671,20.78225242076291,0 76.67877949840206,20.78223135963174,0`;

const parseFarmBoundary = (coordsRaw) => {
    return coordsRaw.trim().split(/\s+/).map(p => {
        const [lon, lat] = p.split(',').map(Number);
        return [lat, lon];
    });
};


export default function RcControl({ openMenu, language }) {
    const [farmBoundaryStr, setFarmBoundaryStr] = useState(DEFAULT_FARM_BOUNDARY);
    const [isEditingBoundary, setIsEditingBoundary] = useState(false);
    const [editPoints, setEditPoints] = useState([]);
    const [boundaryModalVisible, setBoundaryModalVisible] = useState(false);
    const [tempBoundaryStr, setTempBoundaryStr] = useState(DEFAULT_FARM_BOUNDARY);

    const farmPolygon = parseFarmBoundary(farmBoundaryStr);

    const [client, setClient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [lastCmdText, setLastCmdText] = useState('None');
    const [replyText, setReplyText] = useState('Waiting');
    const [streamError, setStreamError] = useState(false);
    const [loadingCam, setLoadingCam] = useState(true);
    const [roverLocation, setRoverLocation] = useState(parseFarmBoundary(DEFAULT_FARM_BOUNDARY)[0]); // Default to first point
    const webviewRef = useRef(null);

    // Double Buffer State to prevent screen tearing/blinking
    const [buffers, setBuffers] = useState({
        base: `${STREAM_URL}?t=0`,
        next: `${STREAM_URL}?t=1`,
        activeBuffer: 'base' // which one is currently visible to user
    });

    // Custom states for actions
    const [relayState, setRelayState] = useState(false); // false = OFF, true = ON
    const [turnState, setTurnState] = useState(false); // false = OFF, true = ON
    const [picState, setPicState] = useState(false); // false = OFF, true = ON

    const mqttClientRef = useRef(null);
    const turnStateRef = useRef(turnState);

    useEffect(() => {
        turnStateRef.current = turnState;
    }, [turnState]);

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
            if (message.destinationName === 'rc/car/gps') {
                try {
                    const gps = JSON.parse(message.payloadString);
                    if (gps.lat && gps.lon) {
                        const newLoc = [parseFloat(gps.lat), parseFloat(gps.lon)];
                        setRoverLocation(newLoc);
                        // Update webview map via injected JS
                        webviewRef.current?.injectJavaScript(`updateRoverPosition(${newLoc[0]}, ${newLoc[1]});`);
                    }
                } catch (e) {
                    console.log("GPS parse error", e);
                }
            }
        };

        const onConnect = () => {
            setConnected(true);
            mqttClient.subscribe('rc/car/status', { qos: 0 });
            mqttClient.subscribe('rc/car/gps', { qos: 0 });

            // Set initial hardware states to match app states (OFF)
            try {
                const relayMsg = new Paho.Message('RELAY_OFF');
                relayMsg.destinationName = 'rc/car/control';
                mqttClient.send(relayMsg);

                const picMsg = new Paho.Message('PIC_OFF');
                picMsg.destinationName = 'rc/car/control';
                mqttClient.send(picMsg);
            } catch (err) {
                console.log('Failed to send initial states', err);
            }
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

        const wakeUpCamera = async () => {
            try {
                // Optimizes camera for speed: CIF resolution (val=5) and good compression (quality=12)
                await axios.get(`${CONTROL_URL}/control?var=framesize&val=5`);
                await axios.get(`${CONTROL_URL}/control?var=quality&val=12`);
            } catch (e) {
                console.log("Could not optimize camera:", e);
            }
        };

        wakeUpCamera();

        // Slower 1-second update interval for maximum stability and no skipping
        const intervalId = setInterval(() => {
            if (!turnStateRef.current) return;
            setBuffers(prev => {
                const newlyFetchedUri = `${STREAM_URL}?t=${Date.now()}`;
                return {
                    ...prev,
                    [prev.activeBuffer === 'base' ? 'next' : 'base']: newlyFetchedUri
                };
            });
        }, 1000);

        // Cleanup on unmount
        return () => {
            clearInterval(intervalId);
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

    const handleTurnToggle = () => {
        const newState = !turnState;
        setTurnState(newState);

        const cmd = newState ? 'TURN_ON' : 'TURN_OFF';
        sendMqttMessage('rc/car/control', cmd);
        setLastCmdText(cmd.replace('_', ' '));
    };

    const handlePicToggle = () => {
        const newState = !picState;
        setPicState(newState);

        const cmd = newState ? 'PIC_ON' : 'PIC_OFF';
        sendMqttMessage('rc/car/control', cmd);
        setLastCmdText(cmd.replace('_', ' '));
    };

    const handleStopClick = () => {
        handleTouchUp();
    };

    const handleGetSensors = () => {
        sendMqttMessage('rc/car/control', 'GET_SENSORS');
        setLastCmdText('GET SENSORS');
    };

    const handleMapMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'MAP_CLICK' && isEditingBoundary) {
                setEditPoints(prev => [...prev, [data.lat, data.lon]]);
            }
        } catch (e) {
            console.error("Map message error:", e);
        }
    };

    const saveEditBoundary = () => {
        if (editPoints.length < 3) {
            Alert.alert("Incomplete", "Please select at least 3 points to form a shape.");
            return;
        }

        // We get the points from state as they were synced via bridge
        const newStr = editPoints.map(p => `${p[1]},${p[0]},0`).join(' ');
        const closedStr = newStr + ` ${editPoints[0][1]},${editPoints[0][0]},0`;

        // Update main state - this will force a WebView reload with the NEW boundary
        setFarmBoundaryStr(closedStr);
        setEditPoints([]);
        setIsEditingBoundary(false);

        Alert.alert("Success", "LATEST farm boundary saved successfully!");
    };

    const handleUndo = () => {
        if (editPoints.length > 0) {
            setEditPoints(prev => prev.slice(0, -1));
            // Tell the webview to also remove its last point to keep them in sync
            webviewRef.current?.injectJavaScript(`popLastPoint();`);
        }
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
                {/* TOP SECTION: Camera Feed (Tightened) */}
                <View style={[styles.formCard, { padding: 12 }]}>
                    <View style={styles.cardHeaderSmall}>
                        <Text style={styles.sectionTitleSmall}>{t('Live Feed', language)}</Text>
                        <TouchableOpacity onPress={handleTurnToggle}>
                            <Text style={styles.statusBadgeTextSmall}>{turnState ? "🔴 LIVE" : "⚪ OFF"}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.videoSectionCompact}>
                        {streamError ? (
                            <View style={styles.streamErrorBox}><Text style={styles.videoText}>{t('Unavailable', language)}</Text></View>
                        ) : !turnState ? (
                            <TouchableOpacity style={styles.streamErrorBox} onPress={handleTurnToggle}>
                                <Text style={styles.retryBtnText}>▶ {t('START', language)}</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.webview}>
                                {loadingCam && <View style={styles.streamLoadingBox}><ActivityIndicator size="small" color="#4CAF50" /></View>}
                                <Image source={{ uri: buffers.base }} style={[styles.videoImage, buffers.activeBuffer === 'base' ? { zIndex: 2 } : { opacity: 0 }]} resizeMode="cover" fadeDuration={0} onLoad={() => { setLoadingCam(false); setBuffers(p => ({ ...p, activeBuffer: 'base' })); }} />
                                <Image source={{ uri: buffers.next }} style={[styles.videoImage, buffers.activeBuffer === 'next' ? { zIndex: 2 } : { opacity: 0 }]} resizeMode="cover" fadeDuration={0} onLoad={() => { setLoadingCam(false); setBuffers(p => ({ ...p, activeBuffer: 'next' })); }} />
                            </View>
                        )}
                    </View>
                </View>

                {/* MIDDLE SECTION: Farm Visualization (Tightened) */}
                <View style={[styles.formCard, { marginTop: 12, padding: 12 }]}>
                    <View style={styles.cardHeaderSmall}>
                        <Text style={styles.sectionTitleSmall}>{t('Smart Geofence', language)}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            {isEditingBoundary && (
                                <>
                                    <TouchableOpacity onPress={handleUndo} style={styles.editBtnSmall}><Text style={styles.editBtnTextSmall}>Undo</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setEditPoints([]); }} style={[styles.editBtnSmall, { backgroundColor: '#d32f2f' }]}><Text style={styles.editBtnTextSmall}>Clear</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={saveEditBoundary} style={styles.saveBtnSmall}><Text style={styles.editBtnTextSmall}>Save</Text></TouchableOpacity>
                                </>
                            )}
                            <TouchableOpacity onPress={() => setIsEditingBoundary(!isEditingBoundary)} style={[styles.drawBtn, isEditingBoundary && styles.drawBtnActive]}>
                                <Text style={styles.drawBtnText}>{isEditingBoundary ? "DONE" : "🖊️ DRAW"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setTempBoundaryStr(farmBoundaryStr); setBoundaryModalVisible(true); }}><Text style={styles.statusBadgeTextSmall}>⚙️</Text></TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.mapSectionCompact}>
                        <WebView
                            key={farmBoundaryStr} // FORCE FULL RE-RENDER WHEN BOUNDARY SAVED
                            ref={webviewRef}
                            style={{ flex: 1 }}
                            originWhitelist={['*']}
                            onMessage={handleMapMessage}
                            onLoad={() => {
                                // Once loaded, if editing, we might need to restore state (but here we just prevent reloads)
                            }}
                            source={{
                                html: `
              <!DOCTYPE html><html><head><meta name="viewport" content="initial-scale=1, maximum-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>
                  body { margin: 0; padding: 0; background: #eee; }
                  #map { height: 100vh; width: 100%; border-radius: 8px; }
                  .leaflet-control-attribution { display: none !important; }
                  .ui-overlay { position: absolute; z-index: 1000; display: flex; flex-direction: column; gap: 8px; }
                  .zoom-bar { right: 10px; top: 10px; }
                  .nav-bar { right: 10px; bottom: 10px; align-items: flex-end; }
                  .ui-btn { width: 32px; height: 32px; background: #fff; border: 1px solid #ccc; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #1B5E20; box-shadow: 0 1px 4px rgba(0,0,0,0.2); pointer-events: auto; }
                  .nav-row { display: flex; gap: 4px; }
                </style></head><body><div id="map"></div>
                <div class="ui-overlay zoom-bar"><div class="ui-btn" onclick="map.zoomIn()">+</div><div class="ui-btn" onclick="map.zoomOut()">−</div></div>
                <div class="ui-overlay nav-bar">
                    <div class="ui-btn" onclick="map.panBy([0, -100])">▲</div>
                    <div class="nav-row"><div class="ui-btn" onclick="map.panBy([-100, 0])">◀</div><div class="ui-btn" onclick="map.panBy([100, 0])">▶</div></div>
                    <div class="ui-btn" onclick="map.panBy([0, 100])">▼</div>
                </div>
                <script>
                  var map;
                  var polygon;
                  var editPoints = [];
                  var editLayer = L.layerGroup();
                  var roverMarker;
                  const farmBoundary = ${JSON.stringify(farmPolygon)};
                  var isEditing = ${isEditingBoundary};

                  function initMap() {
                      map = L.map('map', { zoomControl: false, dragging: true }).setView(farmBoundary[0], 19);
                      L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { maxZoom: 22 }).addTo(map);
                      editLayer.addTo(map);

                      if (!isEditing) {
                          polygon = L.polygon(farmBoundary, { color: '#FFD54F', fillColor: '#FFD54F', fillOpacity: 0.15, weight: 3 }).addTo(map); 
                          map.fitBounds(polygon.getBounds(), { padding: [5, 5] });
                      }

                      map.on('click', function(e) {
                          if (isEditing) {
                              addPoint(e.latlng.lat, e.latlng.lng);
                              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK', lat: e.latlng.lat, lon: e.latlng.lng }));
                          }
                      });

                      var roverIcon = L.divIcon({ className: 'rover-icon', html: '<div style="background: rgba(30, 255, 30, 0.3); border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: 2px solid #00E676;"><div style="background: #00E676; width: 6px; height: 6px; border-radius: 50%; border: 1px solid #fff;"></div></div>', iconAnchor: [11, 11] });
                      roverMarker = L.marker(${JSON.stringify(roverLocation)}, { icon: roverIcon }).addTo(map); 
                  }

                  function addPoint(lat, lon) {
                      editPoints.push([lat, lon]);
                      renderEdit();
                  }

                  function popLastPoint() {
                      editPoints.pop();
                      renderEdit();
                  }

                  function renderEdit() {
                      editLayer.clearLayers();
                      editPoints.forEach(p => L.circleMarker(p, { radius: 5, color: '#FFD54F', fillColor: '#fff', fillOpacity: 1, weight: 2 }).addTo(editLayer));
                      if (editPoints.length > 2) {
                          L.polygon(editPoints, { color: '#FFD54F', fillColor: '#FFD54F', fillOpacity: 0.4, weight: 3 }).addTo(editLayer);
                      } else if (editPoints.length > 1) {
                          L.polyline(editPoints, { color: '#FFD54F', weight: 4 }).addTo(editLayer);
                      }
                  }

                  function updateRoverPosition(lat, lon) { 
                      if (roverMarker) {
                          roverMarker.setLatLng([lat, lon]); 
                          if (!isEditing) map.panTo([lat, lon]); 
                      }
                  }

                  initMap();
                </script></body></html>` }} javaScriptEnabled={true} />
                    </View>
                </View>

                {/* STEERING SECTION: (Fits on same initial page) */}
                <View style={[styles.formCard, { marginTop: 12, padding: 12 }]}>
                    <View style={styles.navPadMedium}>
                        <TouchableOpacity style={styles.mediumNavBtn} onPressIn={() => handleTouchDown('BACKWARD')} onPressOut={handleTouchUp} delayPressIn={0}><Text style={styles.mediumNavBtnText}>▲</Text></TouchableOpacity>
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <TouchableOpacity style={styles.mediumNavBtn} onPressIn={() => handleTouchDown('RIGHT')} onPressOut={handleTouchUp} delayPressIn={0}><Text style={styles.mediumNavBtnText}>◀</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.mediumNavBtn, { backgroundColor: '#d32f2f', borderColor: '#d32f2f' }]} onPress={handleStopClick}><Text style={[styles.mediumNavBtnText, { color: '#fff' }]}>■</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.mediumNavBtn} onPressIn={() => handleTouchDown('LEFT')} onPressOut={handleTouchUp} delayPressIn={0}><Text style={styles.mediumNavBtnText}>▶</Text></TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.mediumNavBtn} onPressIn={() => handleTouchDown('FORWARD')} onPressOut={handleTouchUp} delayPressIn={0}><Text style={styles.mediumNavBtnText}>▼</Text></TouchableOpacity>
                    </View>
                </View>

                {/* BOTTOM SECTION: Hardware Actions (Scroll to reach) */}
                <View style={[styles.formCard, { marginTop: 12, marginBottom: 20 }]}>
                    <Text style={styles.sectionTitleSmall}>{t('Hardware Commands', language)}</Text>
                    <View style={styles.actionPadBig}>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity style={[styles.hugeActionBtn, relayState && styles.hugeActionBtnActive]} onPress={handleRelayToggle}>
                                <Text style={styles.hugeActionBtnText}>{relayState ? "CUTTER OFF" : "CUTTER ON"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.hugeActionBtn, picState && styles.hugeActionBtnActive]} onPress={handlePicToggle}>
                                <Text style={styles.hugeActionBtnText}>{picState ? "PIC SENSOR OFF" : "PIC SENSOR ON"}</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.hugeActionBtn} onPress={handleGetSensors}>
                            <Text style={styles.hugeActionBtnText}>{t('GET SENSOR VALUES', language)}</Text>
                        </TouchableOpacity>
                        <View style={styles.hugeLogBox}>
                            <Text style={styles.hugeLogText}>{connected ? "✓ CONNECTED" : "X OFFLINE"}</Text>
                            <Text style={[styles.hugeLogText, { color: '#B8860B', marginTop: 10, fontSize: 13 }]}>{replyText}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <Modal visible={boundaryModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('Configure Boundary', language)}</Text>
                        <Text style={styles.modalDesc}>{t('Paste the longitude,latitude,altitude coordinates from Google Earth or your rover log.', language)}</Text>

                        <TextInput
                            style={styles.textArea}
                            multiline
                            placeholder="76.678...,20.782...,0 ..."
                            value={tempBoundaryStr}
                            onChangeText={setTempBoundaryStr}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setBoundaryModalVisible(false)}
                            >
                                <Text style={[styles.modalBtnText, { color: '#666' }]}>{t('Cancel', language)}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={() => {
                                    if (tempBoundaryStr.trim().length < 20) {
                                        Alert.alert("Error", "Invalid coordinates format.");
                                        return;
                                    }
                                    setFarmBoundaryStr(tempBoundaryStr);
                                    setBoundaryModalVisible(false);
                                    Alert.alert("Success", "New boundary saved and applied to map.");
                                }}
                            >
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>{t('Save Bound', language)}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7F6', paddingTop: 20, marginTop: 30 },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
    menuBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginRight: 15 },
    menu: { fontSize: 20, color: '#333' },
    header: { fontSize: 24, fontWeight: '800', color: '#1B5E20', letterSpacing: -0.5 },
    scroll: { paddingHorizontal: 12, paddingBottom: 50 },
    formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    cardHeaderSmall: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    sectionTitleSmall: { fontSize: 13, fontWeight: '800', color: '#888', textTransform: 'uppercase' },
    statusBadgeTextSmall: { fontSize: 12, fontWeight: '800', color: '#2E7D32' },
    videoSectionCompact: { height: 230, backgroundColor: '#1B1B1B', borderRadius: 12, overflow: 'hidden' },
    videoImage: { width: '100%', height: '100%', position: 'absolute' },
    videoText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    webview: { flex: 1, backgroundColor: '#1B1B1B' },
    streamLoadingBox: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1B1B1B', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
    streamErrorBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    retryBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    mapSectionCompact: { height: 240, borderRadius: 12, overflow: 'hidden', backgroundColor: '#eee' },
    navPadMedium: { alignItems: 'center', gap: 8, marginVertical: 5 },
    mediumNavBtn: { backgroundColor: '#E8F5E9', width: 83, height: 63, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#C8E6C9' },
    mediumNavBtnText: { fontSize: 24, color: '#2E7D32' },
    actionPadBig: { flexDirection: 'column', gap: 12 },
    hugeActionBtn: { backgroundColor: '#E8F5E9', flex: 1, paddingVertical: 15, borderRadius: 15, alignItems: 'center', borderWidth: 2, borderColor: '#C8E6C9' },
    hugeActionBtnActive: { backgroundColor: '#f44336', borderColor: '#f44336' },
    hugeActionBtnText: { color: '#2E7D32', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
    hugeLogBox: { backgroundColor: '#FAFAFA', width: '100%', padding: 12, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
    hugeLogText: { fontSize: 12, color: '#666', fontWeight: '800' },
    editBtn: { padding: 5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '90%', borderRadius: 24, padding: 25, elevation: 10 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', marginBottom: 10 },
    modalDesc: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 20 },
    textArea: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 15, height: 150, fontSize: 12, color: '#333', textAlignVertical: 'top', borderWidth: 1, borderColor: '#EEE', marginBottom: 20 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    cancelBtn: { backgroundColor: '#F5F5F5' },
    saveBtn: { backgroundColor: '#1B5E20' },
    modalBtnText: { fontWeight: '700', fontSize: 14 },
    editBtnSmall: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#616161' },
    saveBtnSmall: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#2e7d32' },
    editBtnTextSmall: { color: '#fff', fontSize: 10, fontWeight: '800' },
    drawBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#eceff1', borderWidth: 1, borderColor: '#cfd8dc' },
    drawBtnActive: { backgroundColor: '#f44336', borderColor: '#d32f2f' },
    drawBtnText: { color: '#455a64', fontSize: 11, fontWeight: '900' },
});
