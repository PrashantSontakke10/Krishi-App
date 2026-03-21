import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import { t } from '../utils/translations';

// 👉 Replace with your ESP IP
const API = "http://10.157.70.174/temp";

export default function HomeScreen({ openMenu, globalNpk, setGlobalNpk, homeInputs, setHomeInputs, language, setLanguage }) {

  const [temp, setTemp] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [loadingNpk, setLoadingNpk] = useState(false);
  const [loadingRain, setLoadingRain] = useState(false);
  const [phReadings, setPhReadings] = useState(["", "", ""]);
  const [avgPh, setAvgPh] = useState(null);

  const handleNpkChange = (name, value) => {
    if (setHomeInputs) setHomeInputs(prev => ({ ...prev, [name]: value }));
  };

  // 🔁 Fetch temperature every 3 sec
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(API);
        const fetchedTemp = res.data.temperature || 0;
        const fetchedHum = res.data.humidity;
        
        setTemp(fetchedTemp);
        if(fetchedHum !== undefined) setHumidity(fetchedHum);

        if (setHomeInputs) {
          setHomeInputs(prev => ({
            ...prev,
            liveTemp: String(fetchedTemp),
            liveHumidity: fetchedHum !== undefined ? String(fetchedHum) : prev.liveHumidity
          }));
        }
      } catch (err) {
        console.log("Error fetching temp or humidity");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const predictNpk = async () => {
    setLoadingNpk(true);
    if (setGlobalNpk) setGlobalNpk(null);
    try {
      const inputs = homeInputs || {};
      const response = await axios.post('https://npk-prediction-yrlu.onrender.com/predict', {
        temperature: parseFloat(inputs.temperature) || parseFloat(temp) || 25,
        humidity: parseFloat(inputs.humidity) || 100,
        ph: parseFloat(inputs.ph) || 6.5,
        rainfall: parseFloat(inputs.rainfall) || 200
      }, { headers: { 'Content-Type': 'application/json' } });
      
      const resData = response.data.prediction || response.data.npk || response.data;
      if (typeof resData === 'object' && setGlobalNpk) {
        setGlobalNpk(resData);
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not fetch NPK prediction. Please try again or check parameters.");
    } finally {
      setLoadingNpk(false);
    }
  };

  const fetchRainfall = async () => {
    setLoadingRain(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location access to auto-calculate rainfall.');
        setLoadingRain(false);
        return;
      }
      
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;
      
      const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum&timezone=auto&forecast_days=1`);
      
      if (response.data && response.data.daily && response.data.daily.precipitation_sum) {
        const rain = response.data.daily.precipitation_sum[0] || 0;
        if (setHomeInputs) {
          setHomeInputs(prev => ({ ...prev, rainfall: String(rain) }));
        }
        Alert.alert('Location Fetched!', `Calculated ${rain}mm of rainfall for your coordinates.`);
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Could not fetch rainfall data for your location.');
    } finally {
      setLoadingRain(false);
    }
  };

  const calculateAveragePh = () => {
    const validReadings = phReadings.map(Number).filter(n => !isNaN(n) && n > 0 && n <= 14);
    if (validReadings.length === 0) {
      Alert.alert("Error", "Please enter at least one valid pH reading between 1 and 14.");
      return;
    }
    const sum = validReadings.reduce((a, b) => a + b, 0);
    const avg = (sum / validReadings.length).toFixed(1);
    setAvgPh(avg);
    
    // Automatically auto-fill that pH into the NPK input so everything links nicely!
    if (setHomeInputs) {
      setHomeInputs(prev => ({ ...prev, ph: avg.toString() }));
    }
  };

  const phColors = [
    '#E30613', '#E25822', '#F28D00', '#F2A900', '#F9CA00', '#E2D024',
    '#A1C02A', '#4C9141', '#007A53', '#006363', '#005C8A', '#004F9F',
    '#302E7A', '#2F2059'
  ];

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={openMenu}>
          <Text style={styles.menu}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.header}>{t("🌱 KrishiSetu Dashboard", language)}</Text>
      </View>

      <View style={{flexDirection: 'row', justifyContent: 'center', marginBottom: 15, backgroundColor: '#E8F5E9', borderRadius: 8, padding: 4}}>
         <TouchableOpacity onPress={() => setLanguage && setLanguage('en')} style={[styles.langBtn, language === 'en' && styles.langBtnActive]}>
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setLanguage && setLanguage('hi')} style={[styles.langBtn, language === 'hi' && styles.langBtnActive]}>
            <Text style={[styles.langText, language === 'hi' && styles.langTextActive]}>हिन्दी</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setLanguage && setLanguage('mr')} style={[styles.langBtn, language === 'mr' && styles.langBtnActive]}>
            <Text style={[styles.langText, language === 'mr' && styles.langTextActive]}>मराठी</Text>
         </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>{t("Status: Connected to ESP", language)}</Text>

      {/* CARDS */}
      <View style={styles.rowWrap}>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("Temperature", language)}</Text>
          <Text style={styles.cardValue}>{temp} °C</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("Moisture", language)}</Text>
          <Text style={styles.cardValue}>100 %</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("Humidity (%)", language).replace(" (%)", "")}</Text>
          <Text style={styles.cardValue}>{humidity} %</Text>
        </View>

      </View>


      {/* NPK */}
      <Text style={styles.section}>{t("Predict NPK", language)}</Text>

      <View style={styles.box}>
        <View style={styles.inputRow}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{t("Temp (°C)", language)}</Text>
            <TextInput style={styles.input} placeholder={`${t("Auto", language)}: ${temp}`} keyboardType="numeric" value={homeInputs?.temperature} onChangeText={(val) => handleNpkChange('temperature', val)} />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{t("Humidity (%)", language)}</Text>
            <TextInput style={styles.input} placeholder={t("e.g. 100", language)} keyboardType="numeric" value={homeInputs?.humidity} onChangeText={(val) => handleNpkChange('humidity', val)} />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{t("pH Level", language)}</Text>
            <TextInput style={styles.input} placeholder={t("e.g. 6.5", language)} keyboardType="numeric" value={homeInputs?.ph} onChangeText={(val) => handleNpkChange('ph', val)} />
          </View>
          <View style={styles.halfInput}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={styles.label}>{t("Rainfall (mm)", language)}</Text>
              <TouchableOpacity onPress={fetchRainfall} disabled={loadingRain} style={styles.autoGpsBtn}>
                {loadingRain ? <ActivityIndicator size="small" color="#1B5E20" /> : <Text style={styles.autoGpsText}>{t("📍 AUTO", language)}</Text>}
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder={t("e.g. 200", language)} keyboardType="numeric" value={homeInputs?.rainfall} onChangeText={(val) => handleNpkChange('rainfall', val)} />
          </View>
        </View>

        <TouchableOpacity style={styles.darkButton} onPress={predictNpk} disabled={loadingNpk}>
          {loadingNpk ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>{t("Predict NPK", language)}</Text>}
        </TouchableOpacity>

        {globalNpk && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>{t("Optimal NPK Ratio:", language)}</Text>
            {typeof globalNpk === 'object' && (globalNpk.Nitrogen !== undefined || globalNpk.N !== undefined) ? (
              <View style={styles.npkRow}>
                <View style={styles.npkBadge}>
                  <Text style={styles.npkBadgeTitle}>N</Text>
                  <Text style={styles.npkBadgeValue}>{Math.round(globalNpk.Nitrogen || globalNpk.N || 0)}</Text>
                </View>
                <View style={[styles.npkBadge, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={[styles.npkBadgeTitle, { color: '#1565C0' }]}>P</Text>
                  <Text style={[styles.npkBadgeValue, { color: '#0D47A1' }]}>{Math.round(globalNpk.Phosphorus || globalNpk.Phosphorous || globalNpk.P || 0)}</Text>
                </View>
                <View style={[styles.npkBadge, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={[styles.npkBadgeTitle, { color: '#E65100' }]}>K</Text>
                  <Text style={[styles.npkBadgeValue, { color: '#BF360C' }]}>{Math.round(globalNpk.Potassium || globalNpk.K || 0)}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.resultData}>{typeof globalNpk === 'string' ? globalNpk : JSON.stringify(globalNpk)}</Text>
            )}
          </View>
        )}
      </View>

      {/* PH CALCULATOR */}
      <Text style={styles.section}>{t("pH Level Analyzer", language)}</Text>

      <View style={styles.box}>
        <Text style={{fontSize: 13, color: '#666', marginBottom: 15}}>{t("Enter up to 3 soil pH readings from your strips to find the average.", language)}</Text>
        
        {/* Beautiful pH Color Scale Array (Always Visible) */}
        <View style={{marginBottom: 20}}>
          <Text style={{fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 6, alignSelf: 'center'}}>{t("REFERENCE pH COLOR SCALE", language)}</Text>
          <View style={styles.phChartRow}>
            {phColors.map((color, idx) => {
              const currentPhNum = idx + 1;
              const isMatch = avgPh && Math.round(parseFloat(avgPh)) === currentPhNum;
              return (
                 <View key={idx} style={[
                    styles.phChartBlock, 
                    { backgroundColor: color },
                    isMatch && styles.phChartBlockActive
                 ]}>
                   <Text style={[styles.phChartText, isMatch && styles.phChartTextActive]}>{currentPhNum}</Text>
                 </View>
              );
            })}
          </View>
        </View>

        <View style={styles.inputRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.thirdInput}>
              <Text style={styles.label}>{t(`Read ${i + 1}`, language)}</Text>
              <TextInput 
                style={styles.input} 
                placeholder="0.0" 
                keyboardType="numeric" 
                value={phReadings[i]} 
                onChangeText={(val) => {
                  const r = [...phReadings];
                  r[i] = val;
                  setPhReadings(r);
                }} 
              />
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.darkButton} onPress={calculateAveragePh}>
          <Text style={styles.buttonText}>{t("Calculate Average", language)}</Text>
        </TouchableOpacity>

        {avgPh && (
          <View style={[styles.resultContainer, {marginTop: 20}]}>
            <Text style={styles.resultTitle}>{t("Average Soil pH: ", language)}<Text style={{fontSize: 22, color: '#1B5E20', fontWeight: 'bold'}}>{avgPh}</Text></Text>
            <Text style={{fontSize: 13, color: '#666', marginTop: 5}}>
              {parseFloat(avgPh) < 6 ? t('Highly Acidic! Needs lime.', language) : parseFloat(avgPh) > 7.5 ? t('Highly Alkaline! Needs sulfur or peat.', language) : t('Optimal Neutral Range for most crops.', language)} 
            </Text>
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 30
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },

  menu: {
    fontSize: 24,
    marginRight: 10
  },

  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
  },

  subHeader: {
    color: '#555',
    marginBottom: 20
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },

  rowWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 5
  },

  card: {
    backgroundColor: '#E8F5E9',
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'flex-start',
    marginBottom: 15
  },

  cardTitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    fontWeight: '600'
  },

  cardValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1B5E20'
  },

  section: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 10
  },

  button: {
    backgroundColor: '#2E7D32',
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15
  },

  darkButton: {
    backgroundColor: '#1B1B1B',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600'
  },

  box: {
    backgroundColor: '#F1F8E9',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15
  },

  boxText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500'
  },

  resultContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32'
  },

  resultTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 5
  },

  resultData: {
    fontSize: 16,
    color: '#1B5E20',
    fontWeight: '700',
    textTransform: 'capitalize'
  },

  inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '47%' },
  thirdInput: { width: '31%' },
  label: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 14, color: '#333' },
  autoGpsBtn: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  autoGpsText: { fontSize: 10, color: '#2E7D32', fontWeight: '800' },
  
  npkRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  npkBadge: { backgroundColor: '#E8F5E9', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, alignItems: 'center', width: '30%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  npkBadgeTitle: { fontSize: 16, fontWeight: '800', color: '#2E7D32', marginBottom: 4 },
  npkBadgeValue: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },

  phChartRow: { flexDirection: 'row', width: '100%', height: 35, borderRadius: 8, overflow: 'hidden' },
  phChartBlock: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  phChartBlockActive: { transform: [{ scaleY: 1.3 }], zIndex: 10, borderRadius: 4, borderWidth: 2, borderColor: '#000' },
  phChartText: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700' },
  phChartTextActive: { color: '#fff', fontSize: 12, fontWeight: '900' },

  langBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  langBtnActive: { backgroundColor: '#2E7D32' },
  langText: { fontSize: 13, fontWeight: '700', color: '#666' },
  langTextActive: { color: '#fff' }

});