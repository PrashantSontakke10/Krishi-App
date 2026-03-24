import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import { t } from '../utils/translations';

export default function WeatherScreen({ openMenu, language }) {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission Denied', language), t('Please grant location access to fetch smart weather.', language));
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      const response = await axios.get(`${process.env.EXPO_PUBLIC_WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast'}?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
      
      const daily = response.data.daily;
      if (daily) {
        setForecast(daily);
        generateAlerts(daily);
      }
    } catch (e) {
      console.log(e);
      Alert.alert(t('Error', language), t('Could not fetch weather data.', language));
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (daily) => {
    let newAlerts = [];
    
    // Check for Rain Warning
    const heavyRainDays = daily.time.filter((date, index) => daily.precipitation_sum[index] > 15);
    if (heavyRainDays.length > 0) {
      newAlerts.push({
        type: 'Rain',
        message: t("Heavy rain expected on", language) + " " + heavyRainDays.join(', '),
        color: '#1E88E5'
      });
    }

    // Check for Drought Warning
    const totalRain = daily.precipitation_sum.reduce((a, b) => a + b, 0);
    const avgMaxTemp = daily.temperature_2m_max.reduce((a, b) => a + b, 0) / daily.temperature_2m_max.length;
    
    if (totalRain < 2 && avgMaxTemp > 30) {
      newAlerts.push({
        type: 'Drought',
        message: t("Drought Warning: High temperatures with little to no rain in the next 7 days.", language),
        color: '#E53935'
      });
    }

    setAlerts(newAlerts);
  };

  const getDayName = (dateString) => {
    const days = [t("Sun", language), t("Mon", language), t("Tue", language), t("Wed", language), t("Thu", language), t("Fri", language), t("Sat", language)];
    const d = new Date(dateString);
    return days[d.getDay()];
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={openMenu}>
          <Text style={styles.menu}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.header}>{t("⛅ Smart Weather", language)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtext}>{t("7-Day Agricultural Forecast & Alerts", language)}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
        ) : forecast ? (
          <>
            {/* Alerts Section */}
            {alerts.length > 0 ? (
              <View style={styles.alertsContainer}>
                {alerts.map((alert, i) => (
                  <View key={i} style={[styles.alertCard, { borderColor: alert.color }]}>
                    <Text style={[styles.alertTitle, { color: alert.color }]}>
                      {alert.type === 'Rain' ? "🌧️" : "🏜️"} {t(alert.type + " Alert", language)}
                    </Text>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.alertCard, { borderColor: '#4CAF50' }]}>
                <Text style={[styles.alertTitle, { color: '#4CAF50' }]}>✅ {t("All Clear", language)}</Text>
                <Text style={styles.alertMessage}>{t("No severe weather warnings for the upcoming week.", language)}</Text>
              </View>
            )}

            {/* Interactive Rainfall Bar Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>🌧️ {t("Rainfall Trend", language) || "Rainfall Trend"} (mm)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barChartContainer}>
                {forecast.precipitation_sum.map((rain, i) => {
                  const maxRain = Math.max(...forecast.precipitation_sum, 10);
                  const barHeight = (rain / maxRain) * 100;
                  return (
                    <View key={`rain-${i}`} style={styles.barColumn}>
                      <Text style={styles.barValue}>{rain > 0 ? rain : ''}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { height: `${barHeight}%` }]} />
                      </View>
                      <Text style={styles.barLabel}>{getDayName(forecast.time[i])}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* 7-Day Temperature Forecast List (Apple Style) */}
            <Text style={styles.sectionTitle}>{t("7-Day Forecast", language)}</Text>
            <View style={styles.listCard}>
              <View style={[styles.forecastRow, { borderBottomWidth: 0, paddingVertical: 4, paddingBottom: 8 }]}>
                <View style={styles.dateCol} />
                <View style={styles.tempRangeCol}>
                  <Text style={[styles.tempMinText, { fontSize: 12, color: '#888', fontWeight: '500' }]}>{t("Min", language)}</Text>
                  <View style={{ flex: 1, marginHorizontal: 10 }} />
                  <Text style={[styles.tempMaxText, { fontSize: 12, color: '#888', fontWeight: '500' }]}>{t("Max", language)}</Text>
                </View>
              </View>
              {forecast.time.map((date, index) => {
                const dayMin = forecast.temperature_2m_min[index];
                const dayMax = forecast.temperature_2m_max[index];
                
                const weekMin = Math.min(...forecast.temperature_2m_min);
                const weekMax = Math.max(...forecast.temperature_2m_max);
                const range = weekMax - weekMin || 1;
                
                const leftPos = ((dayMin - weekMin) / range) * 100;
                const widthSz = ((dayMax - dayMin) / range) * 100;

                return (
                  <View key={`temp-${index}`} style={styles.forecastRow}>
                    <View style={styles.dateCol}>
                      <Text style={styles.dayText}>{getDayName(date)}</Text>
                    </View>
                    
                    <View style={styles.tempRangeCol}>
                      <Text style={styles.tempMinText}>{Math.round(dayMin)}°</Text>
                      
                      <View style={styles.tempTrack}>
                        <View style={[styles.tempBar, { left: `${leftPos}%`, width: `${widthSz}%` }]} />
                      </View>
                      
                      <Text style={styles.tempMaxText}>{Math.round(dayMax)}°</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 40 }}>{t("Could not load weather data.", language)}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 20, paddingTop: 40 },
  menu: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20', marginRight: 15 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20' },
  subtext: { fontSize: 14, color: '#666', marginBottom: 20 },
  
  alertsContainer: { marginBottom: 20 },
  alertCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }
  },
  alertTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  alertMessage: { fontSize: 14, color: '#444' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32', marginBottom: 15, marginTop: 10 },
  
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  chartTitle: { fontSize: 15, fontWeight: 'bold', color: '#1B5E20', marginBottom: 15 },
  barChartContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 120, paddingBottom: 5 },
  barColumn: { width: 40, alignItems: 'center', marginRight: 10 },
  barValue: { fontSize: 10, color: '#0288D1', marginBottom: 4, height: 14 },
  barTrack: { width: 12, height: 75, backgroundColor: '#E1F5FE', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#03A9F4', borderRadius: 6 },
  barLabel: { fontSize: 11, color: '#666', marginTop: 8 },

  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  dateCol: { width: '25%' },
  dayText: { fontSize: 16, fontWeight: '600', color: '#333' },
  
  tempRangeCol: { width: '70%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tempMinText: { fontSize: 14, color: '#1976D2', width: 30, textAlign: 'right' },
  tempTrack: { flex: 1, height: 6, backgroundColor: '#E0E0E0', borderRadius: 4, marginHorizontal: 10, position: 'relative' },
  tempBar: { position: 'absolute', height: '100%', backgroundColor: '#FF7043', borderRadius: 4 },
  tempMaxText: { fontSize: 14, fontWeight: '600', color: '#D32F2F', width: 30, textAlign: 'left' }
});
