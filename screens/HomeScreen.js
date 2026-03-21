import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import axios from 'axios';

// 👉 Replace with your ESP IP
const API = "http://10.157.70.174/temp";

export default function HomeScreen({ openMenu }) {

  const [temp, setTemp] = useState(0);

  // 🔁 Fetch temperature every 3 sec
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(API);
        setTemp(res.data.temperature);
      } catch (err) {
        console.log("Error fetching temp");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={openMenu}>
          <Text style={styles.menu}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.header}>🌱 KrishiSetu Dashboard</Text>
      </View>

      <Text style={styles.subHeader}>Status: Connected to ESP</Text>

      {/* CARDS */}
      <View style={styles.row}>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Soil Moisture</Text>
          <Text style={styles.cardValue}>100 %</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Soil Temperature</Text>
          <Text style={styles.cardValue}>{temp} °C</Text>
        </View>

      </View>

      {/* SOIL IMAGE */}
      <Text style={styles.section}>Soil Color (Upload soil photo)</Text>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Upload Soil Image</Text>
      </TouchableOpacity>

      {/* NPK */}
      <Text style={styles.section}>Predict NPK & Best Crops</Text>

      <View style={styles.box}>
        <Text>Temp: {temp}</Text>
        <Text>Moisture: 100</Text>

        <TouchableOpacity style={styles.darkButton}>
          <Text style={styles.buttonText}>Predict NPK & Crops</Text>
        </TouchableOpacity>
      </View>

      {/* PH */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Upload pH Paper Image</Text>
      </TouchableOpacity>

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

  card: {
    backgroundColor: '#E8F5E9',
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center'
  },

  cardTitle: {
    fontSize: 14,
    color: '#555'
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
  }

});