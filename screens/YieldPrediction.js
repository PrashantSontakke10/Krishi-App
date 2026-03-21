import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import axios from 'axios';

const CROPS = ["Arecanut", "Arhar/Tur", "Bajra", "Banana", "Barley", "Black pepper", "Cardamom", "Cashewnut", "Castor seed", "Coconut", "Coriander", "Cotton(lint)", "Cowpea(Lobia)", "Dry chillies", "Garlic", "Ginger", "Gram", "Groundnut", "Guar seed", "Horse-gram", "Jowar", "Jute", "Khesari", "Linseed", "Maize", "Masoor", "Mesta", "Moong(Green Gram)", "Moth", "Niger seed", "Oilseeds total", "Onion", "Other  Rabi pulses", "Other Cereals", "Other Kharif pulses", "Other Summer Pulses", "Peas & beans (Pulses)", "Potato", "Ragi", "Rapeseed &Mustard", "Rice", "Safflower", "Sannhamp", "Sesamum", "Small millets", "Soyabean", "Sugarcane", "Sunflower", "Sweet potato", "Tapioca", "Tobacco", "Turmeric", "Urad", "Wheat", "other oilseeds"];
const SEASONS = ["Autumn", "Kharif", "Rabi", "Summer", "Whole Year", "Winter"];
const STATES = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

export default function YieldPrediction({ openMenu }) {
  const [inputs, setInputs] = useState({
    crop: '', season: '', state: '', area: '', rainfall: '', fertilizer: '', pesticide: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [activeField, setActiveField] = useState(null);

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

  const predictYield = async () => {
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
      const response = await axios.post('https://crop-yield-prediction-p3b5.onrender.com/predict', {
        crop: inputs.crop,
        season: inputs.season,
        state: inputs.state,
        area: parseFloat(inputs.area),
        rainfall: parseFloat(inputs.rainfall),
        fertilizer: parseFloat(inputs.fertilizer),
        pesticide: parseFloat(inputs.pesticide)
      }, { headers: { 'Content-Type': 'application/json' } });

      const predictedYield = response.data.prediction || response.data.yield || response.data;
      setResult(predictedYield);
    } catch (error) {
      Alert.alert("Error", "Could not fetch prediction. Please try again.");
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
        <Text style={styles.header}>📊 Yield Prediction</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Enter crop details and environmental conditions to predict yield.</Text>

        <View style={styles.formCard}>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Crop</Text>
              <TouchableOpacity style={styles.inputDropdown} onPress={() => openDropdown('crop', CROPS)}>
                <Text style={[styles.inputText, !inputs.crop && styles.placeholderText]} numberOfLines={1}>
                  {inputs.crop || 'Select Crop'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Season</Text>
              <TouchableOpacity style={styles.inputDropdown} onPress={() => openDropdown('season', SEASONS)}>
                <Text style={[styles.inputText, !inputs.season && styles.placeholderText]} numberOfLines={1}>
                  {inputs.season || 'Select Season'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>State</Text>
              <TouchableOpacity style={styles.inputDropdown} onPress={() => openDropdown('state', STATES)}>
                <Text style={[styles.inputText, !inputs.state && styles.placeholderText]} numberOfLines={1}>
                  {inputs.state || 'Select State'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Area (acres)</Text>
              <TextInput style={styles.input} placeholder="e.g. 10" keyboardType="numeric" value={inputs.area} onChangeText={(val) => handleChange('area', val)} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Rainfall (mm)</Text>
              <TextInput style={styles.input} placeholder="e.g. 1000" keyboardType="numeric" value={inputs.rainfall} onChangeText={(val) => handleChange('rainfall', val)} />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Fertilizer</Text>
              <TextInput style={styles.input} placeholder="e.g. 250000" keyboardType="numeric" value={inputs.fertilizer} onChangeText={(val) => handleChange('fertilizer', val)} />
            </View>
          </View>

          <View style={styles.fullInput}>
            <Text style={styles.label}>Pesticide</Text>
            <TextInput style={styles.input} placeholder="e.g. 1500" keyboardType="numeric" value={inputs.pesticide} onChangeText={(val) => handleChange('pesticide', val)} />
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={predictYield} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionButtonText}>Predict Yield</Text>}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultBadge}>PREDICTION</Text>
            <Text style={styles.resultTitle}>Estimated Yield:</Text>
            
            {result.yield_per_acre_tonnes !== undefined ? (
              <View style={styles.resultDataBox}>
                <Text style={styles.resultText}>Yield per Acre: <Text style={styles.resultValue}>{result.yield_per_acre_tonnes} Tonnes</Text></Text>
                <Text style={styles.resultText}>Yield per Hectare: <Text style={styles.resultValue}>{result.yield_per_hectare_tonnes} Tonnes</Text></Text>
                <Text style={styles.resultText}>Total Yield: <Text style={styles.resultValue}>{result.total_yield_tonnes} Tonnes</Text></Text>
              </View>
            ) : typeof result === 'string' || typeof result === 'number' ? (
              <Text style={styles.resultHighlight}>{result}</Text>
            ) : (
              <Text style={styles.resultText}>Could not parse prediction.</Text>
            )}
            
            <Text style={[styles.resultSubtext, {marginTop: 10}]}>Based on the provided parameters, this is the expected yield.</Text>
          </View>
        )}
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {activeField === 'crop' ? 'Crop' : activeField === 'season' ? 'Season' : 'State'}
            </Text>
            <FlatList
              data={modalData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => selectItem(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '47%' },
  fullInput: { width: '100%', marginBottom: 25 },
  label: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, color: '#333', fontWeight: '500' },
  inputDropdown: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, justifyContent: 'center' },
  inputText: { fontSize: 16, color: '#333', fontWeight: '500' },
  placeholderText: { color: '#999' },
  actionButton: { backgroundColor: '#2E7D32', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8, marginTop: 5 },
  actionButtonText: { color: '#fff', fontSize: 17, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  resultCard: { backgroundColor: '#1B5E20', borderRadius: 24, padding: 30, marginTop: 25, shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10, position: 'relative', overflow: 'hidden' },
  resultBadge: { position: 'absolute', top: 20, right: 25, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, color: '#fff', fontSize: 10, fontWeight: '800', overflow: 'hidden' },
  resultTitle: { fontSize: 15, color: '#fff', opacity: 0.8, fontWeight: '600', marginBottom: 10 },
  resultHighlight: { fontSize: 42, fontWeight: '900', color: '#A5D6A7', textTransform: 'capitalize', marginBottom: 15, letterSpacing: -1 },
  resultDataBox: { marginVertical: 8 },
  resultText: { fontSize: 16, color: '#A5D6A7', marginBottom: 8 },
  resultValue: { fontSize: 17, color: '#FFF', fontWeight: 'bold' },
  resultSubtext: { fontSize: 14, color: '#fff', opacity: 0.7, lineHeight: 20 },

  /* Modal Styles */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', maxHeight: '80%', borderRadius: 16, overflow: 'hidden', paddingBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center', paddingVertical: 15, backgroundColor: '#F4F7F6', borderBottomWidth: 1, borderColor: '#EAECF0' },
  modalItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#EAECF0' },
  modalItemText: { fontSize: 16, color: '#333' },
  modalCloseBtn: { marginTop: 15, marginHorizontal: 20, backgroundColor: '#2E7D32', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  modalCloseText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});