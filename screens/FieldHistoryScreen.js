import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { t } from '../utils/translations';

export default function FieldHistoryScreen({ openMenu, language, homeInputs, globalNpk, fieldHistory, setFieldHistory }) {
  const [fieldName, setFieldName] = useState('');

  const saveReading = () => {
    if (!fieldName.trim()) {
      Alert.alert(t("Required", language), t("Please enter a Field or Location Name.", language));
      return;
    }

    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      location: fieldName,
      n: globalNpk ? Math.round(globalNpk.Nitrogen || globalNpk.N || 0) : 0,
      p: globalNpk ? Math.round(globalNpk.Phosphorus || globalNpk.Phosphorous || globalNpk.P || 0) : 0,
      k: globalNpk ? Math.round(globalNpk.Potassium || globalNpk.K || 0) : 0,
      ph: homeInputs?.ph || 'N/A',
      temp: homeInputs?.temperature || 'N/A',
      rainfall: homeInputs?.rainfall || 'N/A'
    };

    setFieldHistory([newRecord, ...fieldHistory]);
    setFieldName('');
    Alert.alert(t("Success", language), t("Saved current reading to history!", language));
  };

  const deleteReading = (id) => {
    setFieldHistory(prev => prev.filter(r => r.id !== id));
  };

  // Find the exact previous reading for the currently typed field
  const pastReading = fieldHistory.find(r => r.location.toLowerCase() === fieldName.toLowerCase());

  const currentN = globalNpk ? Math.round(globalNpk.Nitrogen || globalNpk.N || 0) : 0;
  const currentP = globalNpk ? Math.round(globalNpk.Phosphorus || globalNpk.Phosphorous || globalNpk.P || 0) : 0;
  const currentK = globalNpk ? Math.round(globalNpk.Potassium || globalNpk.K || 0) : 0;
  const currentPh = homeInputs?.ph || 'N/A';

  const getDiffArrow = (past, current) => {
    if(!past || isNaN(past) || isNaN(current)) return '—';
    const p = parseFloat(past);
    const c = parseFloat(current);
    if(c > p) return '⬆️';
    if(c < p) return '⬇️';
    return '➖';
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={openMenu}>
          <Text style={styles.menu}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.header}>{t("📜 Field History", language)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.recordCard}>
          <Text style={styles.sectionTitle}>{t("Save Current Soil Condition", language)}</Text>
          <Text style={styles.subtext}>{t("Record your currently predicted NPK and pH readings against a specific field location.", language)}</Text>
          
          <TextInput 
            style={styles.input} 
            placeholder={t("e.g., North Plot, Farm A", language)} 
            value={fieldName} 
            onChangeText={setFieldName} 
          />

          {fieldName.length > 0 && (
            <View style={styles.compareBox}>
              <Text style={styles.compareTitle}>{t("Current vs Past", language)} ({fieldName})</Text>
              <View style={styles.compareGrid}>
                <View style={styles.col}><Text style={styles.colHeader}>Param</Text></View>
                <View style={styles.col}><Text style={styles.colHeader}>Last</Text></View>
                <View style={styles.col}><Text style={styles.colHeader}>Now</Text></View>
                <View style={styles.col}><Text style={styles.colHeader}>Diff</Text></View>
              </View>
              
              <View style={styles.compareRow}>
                <View style={styles.col}><Text style={styles.cLabel}>N</Text></View>
                <View style={styles.col}><Text style={styles.cVal}>{pastReading ? pastReading.n : '—'}</Text></View>
                <View style={styles.col}><Text style={styles.cValActive}>{currentN}</Text></View>
                <View style={styles.col}><Text>{getDiffArrow(pastReading?.n, currentN)}</Text></View>
              </View>
              <View style={styles.compareRow}>
                <View style={styles.col}><Text style={styles.cLabel}>P</Text></View>
                <View style={styles.col}><Text style={styles.cVal}>{pastReading ? pastReading.p : '—'}</Text></View>
                <View style={styles.col}><Text style={styles.cValActive}>{currentP}</Text></View>
                <View style={styles.col}><Text>{getDiffArrow(pastReading?.p, currentP)}</Text></View>
              </View>
              <View style={styles.compareRow}>
                <View style={styles.col}><Text style={styles.cLabel}>pH</Text></View>
                <View style={styles.col}><Text style={styles.cVal}>{pastReading ? pastReading.ph : '—'}</Text></View>
                <View style={styles.col}><Text style={styles.cValActive}>{currentPh}</Text></View>
                <View style={styles.col}><Text>{getDiffArrow(pastReading?.ph, currentPh)}</Text></View>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={saveReading}>
            <Text style={styles.saveBtnText}>{t("💾 Commit to History", language)}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 25, marginLeft: 5 }]}>{t("Stored Records map", language)}</Text>

        {fieldHistory.length === 0 ? (
          <Text style={styles.emptyText}>{t("No records found. Start saving your soil conditions above!", language)}</Text>
        ) : (
          fieldHistory.map((record) => (
            <View key={record.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.recordLocation}>📍 {record.location}</Text>
                  <Text style={styles.recordDate}>🕒 {record.date}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteReading(record.id)}>
                  <Text style={{ fontSize: 20, color: '#F44336', padding: 5 }}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tagWrap}>
                <View style={styles.tag}><Text style={styles.tagText}>N: {record.n}</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>P: {record.p}</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>K: {record.k}</Text></View>
                <View style={[styles.tag, {backgroundColor: '#FFF9C4'}]}><Text style={[styles.tagText, {color: '#F57F17'}]}>pH: {record.ph}</Text></View>
                <View style={[styles.tag, {backgroundColor: '#E1F5FE'}]}><Text style={[styles.tagText, {color: '#0288D1'}]}>🌧️ {record.rainfall}mm</Text></View>
              </View>

            </View>
          ))
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', marginTop: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 20 },
  menu: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20', marginRight: 15 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20' },
  scroll: { padding: 20, paddingBottom: 50 },

  recordCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  subtext: { fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: '#EAECF0', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#FAFAFA', marginBottom: 15 },

  compareBox: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 15, marginBottom: 20 },
  compareTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 8 },
  compareGrid: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#D1D5DB', paddingBottom: 6, marginBottom: 6 },
  compareRow: { flexDirection: 'row', paddingVertical: 4 },
  col: { flex: 1, alignItems: 'center' },
  colHeader: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  cLabel: { fontSize: 14, fontWeight: '700', color: '#4B5563' },
  cVal: { fontSize: 14, color: '#6B7280' },
  cValActive: { fontSize: 14, fontWeight: '700', color: '#059669' },

  saveBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  emptyText: { textAlign: 'center', marginTop: 30, color: '#9CA3AF', fontSize: 15 },

  historyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EAECF0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  recordLocation: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  recordDate: { fontSize: 12, color: '#6B7280' },
  
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  tagText: { color: '#2E7D32', fontSize: 12, fontWeight: '600' }
});
