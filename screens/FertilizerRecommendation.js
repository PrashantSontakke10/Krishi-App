import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import axios from 'axios';
import { t } from '../utils/translations';

const SOIL_TYPES = ["Black", "Clayey", "Loamy", "Red", "Sandy"];
const CROP_TYPES = ["Barley", "Cotton", "Ground Nuts", "Maize", "Millets", "Oil seeds", "Paddy", "Pulses", "Sugarcane", "Tobacco", "Wheat"];

// Get ESP IP from environment or use fallback
const SENSOR_API = process.env.EXPO_PUBLIC_SENSOR_API_URL || "http://10.157.70.174/temp";

export default function FertilizerRecommendation({ openMenu, globalNpk, language, homeInputs }) {
  const [inputs, setInputs] = useState({
    Temperature: homeInputs?.temperature || homeInputs?.liveTemp || '',
    Humidity: homeInputs?.humidity || homeInputs?.liveHumidity || '',
    Moisture: '100',
    Soil_Type: '', Crop_Type: '',
    Nitrogen: globalNpk ? String(Math.round(globalNpk.Nitrogen || globalNpk.N || 0)) : '',
    Potassium: globalNpk ? String(Math.round(globalNpk.Potassium || globalNpk.K || 0)) : '',
    Phosphorous: globalNpk ? String(Math.round(globalNpk.Phosphorus || globalNpk.Phosphorous || globalNpk.P || 0)) : ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [sensorStatus, setSensorStatus] = useState("Connecting...");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [activeField, setActiveField] = useState(null);

  // Auto-fetch temperature from ESP32
  useEffect(() => {
    const fetchTemp = async () => {
      try {
        const res = await axios.get(SENSOR_API);
        if (res.data && res.data.temperature) {
          setInputs(prev => ({ ...prev, Temperature: res.data.temperature.toString() }));
          setSensorStatus("Live (Connected)");
        }
      } catch (err) {
        setSensorStatus("Manual input fallback (Disconnected)");
      }
    };

    fetchTemp(); // initial fetch
    const interval = setInterval(fetchTemp, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (name, value) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const openDropdown = (field, data) => {
    setActiveField(field);
    setModalData(data);
    setModalVisible(true);
  };

  const selectItem = (item) => {
    handleChange(activeField, item);
    setModalVisible(false);
  };

  const predictFertilizer = async () => {
    // Validate inputs
    for (const key in inputs) {
      if (!inputs[key]) {
        Alert.alert("Missing Input", `Please provide a value for ${key.replace('_', ' ').toUpperCase()}`);
        return;
      }
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(process.env.EXPO_PUBLIC_FERTILIZER_API_URL || 'https://fertilizer-recommendation-wzmd.onrender.com/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          Temperature: parseFloat(inputs.Temperature),
          Humidity: parseFloat(inputs.Humidity),
          Moisture: parseFloat(inputs.Moisture),
          Soil_Type: inputs.Soil_Type.toLowerCase(),
          Crop_Type: inputs.Crop_Type.toLowerCase(),
          Nitrogen: parseFloat(inputs.Nitrogen),
          Potassium: parseFloat(inputs.Potassium),
          Phosphorous: parseFloat(inputs.Phosphorous)
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      const recommendedFertilizer = data.prediction || data.fertilizer || data.recommended_fertilizer || data.Fertilizer || data;
      setResult(recommendedFertilizer);
    } catch (error) {
      Alert.alert("Error", "Could not fetch recommendation. Check your connection or API status (Render apps wake up in 1min).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Premium Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.menuBtn} onPress={openMenu}>
          <Text style={styles.menu}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.header}>{t("🧪 Smart Fertilizer Planner", language)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t("Enter soil metrics and crop details to get precise fertilizer suggestions.", language)}</Text>

        <View style={styles.formCard}>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("Sensor Data", language)}</Text>
            <Text style={[styles.sensorBadge, sensorStatus.includes("Live") ? styles.sensorLive : styles.sensorDead]}>
              {sensorStatus.includes("Live") ? "O" : "X"} {sensorStatus}
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>{t("Temp (°C)", language)}</Text>
              <TextInput style={[styles.input, sensorStatus.includes("Live") && styles.inputDisabled]} placeholder={t("Auto", language)} keyboardType="numeric" value={inputs.Temperature} onChangeText={(val) => handleChange('Temperature', val)} editable={!sensorStatus.includes("Live")} />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>{t("Humidity (%)", language)}</Text>
              <TextInput style={styles.input} placeholder={t("e.g. 60", language)} keyboardType="numeric" value={inputs.Humidity} onChangeText={(val) => handleChange('Humidity', val)} />
            </View>
          </View>

          <View style={styles.fullInput}>
            <Text style={styles.label}>{t("Soil Moisture", language)}</Text>
            <TextInput style={styles.input} placeholder={t("e.g. 40", language)} keyboardType="numeric" value={inputs.Moisture} onChangeText={(val) => handleChange('Moisture', val)} />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("Context & Nutrients", language)}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>{t("Soil Type", language)}</Text>
              <TouchableOpacity style={styles.inputDropdown} onPress={() => openDropdown('Soil_Type', SOIL_TYPES)}>
                <Text style={[styles.inputText, !inputs.Soil_Type && styles.placeholderText]} numberOfLines={1}>
                  {inputs.Soil_Type ? t(inputs.Soil_Type, language) : t("Soil Type", language)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>{t("Crop Type", language)}</Text>
              <TouchableOpacity style={styles.inputDropdown} onPress={() => openDropdown('Crop_Type', CROP_TYPES)}>
                <Text style={[styles.inputText, !inputs.Crop_Type && styles.placeholderText]} numberOfLines={1}>
                  {inputs.Crop_Type ? t(inputs.Crop_Type, language) : t("Crop Type", language)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>N</Text>
              <TextInput style={styles.input} placeholder={t("e.g. 10", language)} keyboardType="numeric" value={inputs.Nitrogen} onChangeText={(val) => handleChange('Nitrogen', val)} />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>P</Text>
              <TextInput style={styles.input} placeholder={t("e.g. 6", language)} keyboardType="numeric" value={inputs.Phosphorous} onChangeText={(val) => handleChange('Phosphorous', val)} />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>K</Text>
              <TextInput style={styles.input} placeholder={t("e.g. 5", language)} keyboardType="numeric" value={inputs.Potassium} onChangeText={(val) => handleChange('Potassium', val)} />
            </View>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={predictFertilizer} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionButtonText}>{t("Analyze & Predict", language)}</Text>}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultBadge}>{t("AI MATCH", language)}</Text>
            <Text style={styles.resultTitle}>{t("Best Fertilizer for You:", language)}</Text>
            {typeof result === 'string' ? (
              <Text style={styles.resultHighlight}>{result}</Text>
            ) : (
              <Text style={styles.resultText}>{JSON.stringify(result)}</Text>
            )}
            <Text style={styles.resultSubtext}>{t("Based on the current environmental metrics, this fertilizer brings maximum efficiency to your field.", language)}</Text>
          </View>
        )}
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t("Select ", language)}{activeField === 'Soil_Type' ? t('Soil Type', language) : t('Crop Type', language)}
            </Text>
            <FlatList
              data={modalData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => selectItem(item)}>
                  <Text style={styles.modalItemText}>{t(item, language)}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>{t("Close", language)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6', paddingTop: 20, marginTop: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  menuBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginRight: 15 },
  menu: { fontSize: 20, color: '#333' },
  header: { fontSize: 24, fontWeight: '800', color: '#1B5E20', letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 20, paddingBottom: 50 },
  subtitle: { fontSize: 15, color: '#666', lineHeight: 22, paddingBottom: 20, paddingLeft: 5 },
  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1B5E20' },
  sensorBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  sensorLive: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  sensorDead: { backgroundColor: '#FFEBEE', color: '#C62828' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '47%' },
  thirdInput: { width: '31%' },
  fullInput: { width: '100%', marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, color: '#333', fontWeight: '500' },
  inputDisabled: { backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: '700', borderColor: '#C8E6C9' },
  actionButton: { backgroundColor: '#2E7D32', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8, marginTop: 15 },
  actionButtonText: { color: '#fff', fontSize: 17, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  resultCard: { backgroundColor: '#1B5E20', borderRadius: 24, padding: 30, marginTop: 25, shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10, position: 'relative', overflow: 'hidden' },
  resultBadge: { position: 'absolute', top: 20, right: 25, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, color: '#fff', fontSize: 10, fontWeight: '800', overflow: 'hidden' },
  resultTitle: { fontSize: 15, color: '#fff', opacity: 0.8, fontWeight: '600', marginBottom: 5 },
  resultHighlight: { fontSize: 42, fontWeight: '900', color: '#A5D6A7', textTransform: 'capitalize', marginBottom: 15, letterSpacing: -1 },
  resultText: { fontSize: 18, color: '#A5D6A7', marginBottom: 15 },
  resultSubtext: { fontSize: 14, color: '#fff', opacity: 0.7, lineHeight: 20 },

  /* Modal & Dropdown Styles */
  inputDropdown: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, justifyContent: 'center' },
  inputText: { fontSize: 16, color: '#333', fontWeight: '500' },
  placeholderText: { color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', maxHeight: '80%', borderRadius: 16, overflow: 'hidden', paddingBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center', paddingVertical: 15, backgroundColor: '#F4F7F6', borderBottomWidth: 1, borderColor: '#EAECF0' },
  modalItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#EAECF0' },
  modalItemText: { fontSize: 16, color: '#333' },
  modalCloseBtn: { marginTop: 15, marginHorizontal: 20, backgroundColor: '#2E7D32', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  modalCloseText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});