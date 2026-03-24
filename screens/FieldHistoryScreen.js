import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { t } from '../utils/translations';

export default function FieldHistoryScreen({ openMenu, language, fieldHistory }) {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{item.date}</Text>
        <Text style={styles.location}>{item.location}</Text>
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}><Text style={styles.statVal}>{item.n}</Text><Text style={styles.statLabel}>N</Text></View>
        <View style={styles.statItem}><Text style={styles.statVal}>{item.p}</Text><Text style={styles.statLabel}>P</Text></View>
        <View style={styles.statItem}><Text style={styles.statVal}>{item.k}</Text><Text style={styles.statLabel}>K</Text></View>
        <View style={styles.statItem}><Text style={styles.statVal}>{item.ph}</Text><Text style={styles.statLabel}>pH</Text></View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={openMenu}>
          <Text style={styles.menu}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.header}>{t("📜 Field History", language)}</Text>
      </View>

      <FlatList
        data={fieldHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t("No records found.", language)}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6', paddingTop: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menu: { fontSize: 24, marginRight: 15, color: '#1B5E20' },
  header: { fontSize: 22, fontWeight: '800', color: '#1B5E20' },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  date: { fontWeight: 'bold', color: '#666' },
  location: { color: '#2E7D32', fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#999' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});
