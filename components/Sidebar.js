import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { t } from '../utils/translations';

export default function Sidebar({ onClose, navigate, language }) {

  const menuItems = [
    { id: 'home', icon: '🏠', label: "Dashboard" },
    { id: 'rcControl', icon: '🏎️', label: "RC Remote" },
    { id: 'crop', icon: '🌾', label: "Crop Recommendation" },
    { id: 'fertilizer', icon: '🌿', label: "Fertilizer Recommendation" },
    { id: 'disease', icon: '🦠', label: "Disease Detection" },
    { id: 'yield', icon: '📊', label: "Yield Prediction" },
    { id: 'market', icon: '💰', label: "Market Price" },
    { id: 'weather', icon: '⛅', label: "Smart Weather" },
    { id: 'analytics', icon: '📈', label: "Farm Analytics" },
  ];

  const handleNav = (id) => {
     navigate(id);
     onClose();
  };

  return (
    <View style={styles.overlay}>
      {/* Invisible backdrop to dismiss sidebar when clicking outside */}
      <TouchableOpacity 
        style={styles.backdrop} 
        onPress={onClose} 
        activeOpacity={1} 
      />

      <View style={styles.menuWrapper}>
        <View style={styles.menuHeader}>
           <Text style={styles.titleLogo}>🌱</Text>
           <Text style={styles.titleText}>{t("KrishiSetu", language)}</Text>
           <Text style={styles.versionText}>v1.0.0 PRO EDITION</Text>
        </View>

        <ScrollView style={styles.menu} contentContainerStyle={styles.menuContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeader}>{t("MAIN MENU", language)}</Text>
          
          {menuItems.map((item) => (
             <TouchableOpacity 
               key={item.id} 
               style={styles.menuItemBtn} 
               onPress={() => handleNav(item.id)}
               activeOpacity={0.7}
             >
               <View style={styles.iconBox}>
                 <Text style={styles.icon}>{item.icon}</Text>
               </View>
               <Text style={styles.menuText}>{t(item.label, language)}</Text>
               <Text style={styles.arrowIcon}>›</Text>
             </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginTop: 30, // Status bar offset
    zIndex: 100,
    elevation: 100
  },

  backdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  menuWrapper: {
    width: 290,
    height: '100%',
    backgroundColor: '#F4F7F6',
    elevation: 100,
    zIndex: 100,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },

  menuHeader: {
    backgroundColor: '#1B5E20',
    paddingTop: 35,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  
  titleLogo: { fontSize: 36, marginBottom: 8 },
  titleText: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  versionText: { color: '#A5D6A7', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 6, letterSpacing: 2 },
  
  menu: {
    flex: 1,
  },

  menuContent: {
    padding: 15,
    paddingBottom: 30
  },

  sectionHeader: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#9E9E9E', 
    letterSpacing: 1.5, 
    marginLeft: 5, 
    marginBottom: 15, 
    marginTop: 10 
  },

  menuItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2
  },

  iconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: '#E8F5E9', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },

  icon: { fontSize: 20 },
  
  menuText: { 
    flex: 1, 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#374151' 
  },
  
  arrowIcon: { 
    fontSize: 22, 
    color: '#D1D5DB', 
    fontWeight: '400' 
  },

  closeFooterBtn: { 
    backgroundColor: '#E53935', 
    paddingVertical: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -3 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 5, 
    elevation: 15 
  },

  closeFooterText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 1.5 
  }

});