import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Card({ title, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E8F5E9',
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center'
  },
  title: {
    fontSize: 14,
    color: '#555'
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B5E20'
  }
});