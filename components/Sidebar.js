import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Sidebar({ onClose, navigate }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.menu}>

        <Text style={styles.title}>🌱 KrishiSetu</Text>

        <TouchableOpacity onPress={() => navigate("home")}>
          <Text style={styles.item}>🏠 Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("crop")}>
          <Text style={styles.item}>🌾 Crop Recommendation</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("fertilizer")}>
          <Text style={styles.item}>🌿 Fertilizer Recommendation</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("disease")}>
          <Text style={styles.item}>🦠 Disease Detection</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("yield")}>
          <Text style={styles.item}>📊 Yield Prediction</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("market")}>
          <Text style={styles.item}>💰 Market Price</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>Close</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: 30
  },

  menu: {
    width: 260,
    height: '100%',
    backgroundColor: '#fff',
    padding: 20,
    
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1B5E20'
  },

  item: {
    fontSize: 16,
    marginVertical: 12
  },

  close: {
    marginTop: 30,
    color: 'red'
  }

});