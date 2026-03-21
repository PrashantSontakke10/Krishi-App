import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function MarketPrice({ openMenu }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={openMenu}>
          <Text style={styles.menu}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.header}>💰 Market Price</Text>
      </View>
      <View style={styles.content}>
        <Text>Current market prices will be shown here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, marginTop: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  menu: { fontSize: 24, marginRight: 10 },
  header: { fontSize: 22, fontWeight: '700', color: '#1B5E20' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});