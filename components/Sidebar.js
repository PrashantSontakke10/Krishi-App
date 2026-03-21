import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { t } from '../utils/translations';

export default function Sidebar({ onClose, navigate, language }) {

  return (
    <View style={styles.overlay}>
      <ScrollView style={styles.menu} contentContainerStyle={styles.menuContent}>

        <Text style={styles.title}>{t("🌱 KrishiSetu", language)}</Text>

        <TouchableOpacity onPress={() => navigate("home")}>
          <Text style={styles.item}>{t("🏠 Dashboard", language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("rcControl")}>
          <Text style={styles.item}>{t("🏎️ RC Remote", language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("crop")}>
          <Text style={styles.item}>{t("🌾 Crop Recommendation", language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("fertilizer")}>
          <Text style={styles.item}>{t("🌿 Fertilizer Recommendation", language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("disease")}>
          <Text style={styles.item}>{t("🦠 Disease Detection", language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("yield")}>
          <Text style={styles.item}>{t("📊 Yield Prediction", language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("market")}>
          <Text style={styles.item}>{t("💰 Market Price", language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("weather")}>
          <Text style={styles.item}>{t("⛅ Smart Weather", language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>{t("Close", language)}</Text>
        </TouchableOpacity>

      </ScrollView>
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
  },

  menuContent: {
    padding: 20,
    paddingBottom: 40,
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
    marginVertical: 20,
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold'
  }

});