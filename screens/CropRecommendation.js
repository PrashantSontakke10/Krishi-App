import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { t } from '../utils/translations';

export default function CropRecommendation({ openMenu, globalNpk, language }) {
  const [inputs, setInputs] = useState({
    N: globalNpk ? String(Math.round(globalNpk.Nitrogen || globalNpk.N || 0)) : '',
    P: globalNpk ? String(Math.round(globalNpk.Phosphorus || globalNpk.Phosphorous || globalNpk.P || 0)) : '',
    K: globalNpk ? String(Math.round(globalNpk.Potassium || globalNpk.K || 0)) : '',
    temperature: '', humidity: '', ph: '', rainfall: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (name, value) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const predictCrop = async () => {
    // Basic validation
    for (const key in inputs) {
      if (!inputs[key]) {
        Alert.alert("Missing Input", `Please provide a value for ${key.toUpperCase()}`);
        return;
      }
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post('https://crop-recommendation-1-dkak.onrender.com/predict', {
        N: parseFloat(inputs.N),
        P: parseFloat(inputs.P),
        K: parseFloat(inputs.K),
        temperature: parseFloat(inputs.temperature),
        humidity: parseFloat(inputs.humidity),
        ph: parseFloat(inputs.ph),
        rainfall: parseFloat(inputs.rainfall)
      }, { headers: { 'Content-Type': 'application/json' } });

      // Handle actual specific response format `{ recommended_crop: '...' }`
      const predictedCrop = response.data.recommended_crop || response.data.prediction || response.data.crop || response.data;
      setResult(predictedCrop);
    } catch (error) {
      Alert.alert("Error", "Could not fetch recommendation. Please try again.");
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
        <Text style={styles.header}>{t("🌾 AI Crop Planner", language)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t("Enter soil metrics and weather condition to get real-time AI crop suggestions.", language)}</Text>

        <View style={styles.formCard}>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>{t("Nitrogen (N)", language)}</Text>
              <TextInput style={styles.input} placeholder={t("e.g. 90", language)} keyboardType="numeric" value={inputs.N} onChangeText={(val) => handleChange('N', val)} />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>{t("Phosphorus (P)", language)}</Text>
              <TextInput style={styles.input} placeholder={t("e.g. 40", language)} keyboardType="numeric" value={inputs.P} onChangeText={(val) => handleChange('P', val)} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>{t("Potassium (K)", language)}</Text>
              <TextInput style={styles.input} placeholder={t("e.g. 40", language)} keyboardType="numeric" value={inputs.K} onChangeText={(val) => handleChange('K', val)} />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>{t("Temp (°C)", language)}</Text>
              <TextInput style={styles.input} placeholder={t("e.g. 25", language)} keyboardType="numeric" value={inputs.temperature} onChangeText={(val) => handleChange('temperature', val)} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>{t("Humidity (%)", language)}</Text>
              <TextInput style={styles.input} placeholder={t("e.g. 80", language)} keyboardType="numeric" value={inputs.humidity} onChangeText={(val) => handleChange('humidity', val)} />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>{t("pH Level", language)}</Text>
              <TextInput style={styles.input} placeholder={t("e.g. 6.5", language)} keyboardType="numeric" value={inputs.ph} onChangeText={(val) => handleChange('ph', val)} />
            </View>
          </View>

          <View style={styles.fullInput}>
            <Text style={styles.label}>{t("Rainfall (mm)", language)}</Text>
            <TextInput style={styles.input} placeholder={t("e.g. 200", language)} keyboardType="numeric" value={inputs.rainfall} onChangeText={(val) => handleChange('rainfall', val)} />
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={predictCrop} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionButtonText}>{t("Analyze & Predict", language)}</Text>}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultBadge}>{t("AI MATCH", language)}</Text>
            <Text style={styles.resultTitle}>{t("Best Crop for You:", language)}</Text>
            {typeof result === 'string' ? (
              <Text style={styles.resultHighlight}>{result}</Text>
            ) : (
              <Text style={styles.resultText}>{JSON.stringify(result)}</Text>
            )}
            <Text style={styles.resultSubtext}>{t("Based on parameters inputted, this crop will yield the best growth rate and highest market returns.", language)}</Text>
          </View>
        )}
      </ScrollView>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '47%' },
  fullInput: { width: '100%', marginBottom: 25 },
  label: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, color: '#333', fontWeight: '500' },
  actionButton: { backgroundColor: '#2E7D32', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8, marginTop: 5 },
  actionButtonText: { color: '#fff', fontSize: 17, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  resultCard: { backgroundColor: '#1B5E20', borderRadius: 24, padding: 30, marginTop: 25, shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10, position: 'relative', overflow: 'hidden' },
  resultBadge: { position: 'absolute', top: 20, right: 25, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, color: '#fff', fontSize: 10, fontWeight: '800', overflow: 'hidden' },
  resultTitle: { fontSize: 15, color: '#fff', opacity: 0.8, fontWeight: '600', marginBottom: 5 },
  resultHighlight: { fontSize: 42, fontWeight: '900', color: '#A5D6A7', textTransform: 'capitalize', marginBottom: 15, letterSpacing: -1 },
  resultText: { fontSize: 18, color: '#A5D6A7', marginBottom: 15 },
  resultSubtext: { fontSize: 14, color: '#fff', opacity: 0.7, lineHeight: 20 }
});