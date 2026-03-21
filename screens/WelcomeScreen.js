import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import CustomButton from '../components/CustomButton';
import { getTemperature } from '../services/api';

export default function WelcomeScreen({ onSuccess }) {

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Not checked yet");

  const verifyConnection = async () => {
    setLoading(true);
    setStatus("Checking connection...");

    try {
      const temp = await getTemperature();
      setStatus("✅ Connected");
      onSuccess(temp); // navigate to home
    } catch (err) {
      setStatus("❌ Not connected");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>🌾 Welcome to KrishiSetu</Text>

      <Text style={styles.subtitle}>
        Connect to "KrishiSetu Setup" WiFi and press verify
      </Text>

      <CustomButton title="Verify Connection" onPress={verifyConnection} />

      {loading && <ActivityIndicator size="large" color="#2E7D32" />}

      <Text style={styles.status}>{status}</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 20
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#555'
  },
  status: {
    marginTop: 10,
    color: '#777'
  }
});