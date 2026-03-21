import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList, TextInput } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { t } from '../utils/translations';

const ALL_CROPS = [
  "Arecanut", "Arhar/Tur", "Bajra", "Banana", "Barley", "Black pepper", "Cardamom", "Cashewnut", 
  "Castor seed", "Coconut", "Coriander", "Cotton(lint)", "Cowpea(Lobia)", "Dry chillies", "Garlic", 
  "Ginger", "Gram", "Groundnut", "Guar seed", "Horse-gram", "Jowar", "Jute", "Khesari", "Linseed", 
  "Maize", "Masoor", "Mesta", "Moong(Green Gram)", "Moth", "Niger seed", "Oilseeds total", "Onion", 
  "Other Rabi pulses", "Other Cereals", "Other Kharif pulses", "Other Summer Pulses", "Peas & beans (Pulses)", 
  "Potato", "Ragi", "Rapeseed &Mustard", "Rice", "Safflower", "Sannhamp", "Sesamum", "Small millets", 
  "Soyabean", "Sugarcane", "Sunflower", "Sweet potato", "Tapioca", "Tobacco", "Turmeric", "Urad", "Wheat", "other oilseeds"
];

// Offline Mock Price Generator for ALL 55 crops (if API totally fails)
const getOfflinePricesForRegion = (regionStr) => {
  const seed = regionStr ? regionStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  return ALL_CROPS.map(name => {
     const base = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
     const temp = 1200 + ((base * 15 + seed * 5) % 8500); 
     const price = Math.round(temp / 50) * 50;
     return { name, price, live: false };
  }).sort((a,b) => a.name.localeCompare(b.name));
};

export default function MarketPrice({ openMenu, language }) {
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState(null);
  const [marketCrops, setMarketCrops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLocationAndCrops();
  }, []);

  const fetchLocationAndCrops = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t("Permission Denied", language), t("Allow location access to find local crop prices.", language));
        setLoading(false);
        return;
      }
      
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;
      
      // Reverse Geocode
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      let regionStr = "Unknown Region";
      let districtStr = "";
      let displayLoc = "Locating...";

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        regionStr = place.region || place.city || place.country || "Local";
        districtStr = place.district || place.subregion || place.city || "";
        
        displayLoc = `${districtStr}, ${place.region || ''}`.replace(/^, /, '').trim();
        if(!displayLoc) displayLoc = regionStr;
      }
      
      setLocationName(displayLoc);
      
      // LIVE DATA.GOV.IN API Integration
      const API_KEY = '579b464db66ec23bdd0000016048574c5b43497f55429d6e98e24230';
      const RESOURCE_ID = '35985678-0d79-46b4-9ed6-6f13308a1d24';
      
      let apiUrl = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&filters[state]=${encodeURIComponent(regionStr)}`;
      if (districtStr) {
        apiUrl += `&filters[district]=${encodeURIComponent(districtStr)}`;
      }
      apiUrl += `&limit=2000`; // large limit to get ALL crops natively sold in the API for this district/state

      try {
        const response = await axios.get(apiUrl, {
           headers: {
             'Accept': 'application/json',
             'User-Agent': 'Mozilla/5.0'
           }
        });
        const data = response.data;
        
        if (data && data.records && data.records.length > 0) {
          let cropMap = {};
          // Map the live Gov data API records
          data.records.forEach(record => {
             const name = record.commodity;
             if (!name) return;
             const price = record.modal_price || record.max_price || 0;
             if (price && Number(price) > 0 && !cropMap[name]) {
               // Store capitalized version to match easily
               cropMap[name.toUpperCase()] = { 
                 name: name, 
                 price: price, 
                 marketStr: record.market || record.district || regionStr,
                 live: true,
               };
             }
          });

          // Mix the API results with our ALL_CROPS list so *all* 55 crops are displayed
          let finalCrops = ALL_CROPS.map(cName => {
             // Find matching crop in API explicitly
             const foundKey = Object.keys(cropMap).find(k => k.includes(cName.toUpperCase()) || cName.toUpperCase().includes(k));
             
             if (foundKey) {
                return { 
                   name: cName, 
                   price: cropMap[foundKey].price, 
                   marketStr: cropMap[foundKey].marketStr,
                   live: true 
                };
             } else {
                // Return fallback N/A or offline price for crops not reported by Gov API today
                return { name: cName, price: "N/A", marketStr: "Offline", live: false };
             }
          });
          
          setMarketCrops(finalCrops.sort((a, b) => a.name.localeCompare(b.name)));
        } else {
           // No API records returned for this state/district combination -> Offline Fallback
           setMarketCrops(getOfflinePricesForRegion(regionStr));
        }

      } catch (apiError) {
        console.log("Gov API Error: ", apiError);
        setMarketCrops(getOfflinePricesForRegion(regionStr));
      }
      
    } catch (e) {
      console.log("Location Error: ", e);
      Alert.alert(t("Error", language), t("Failed to fetch location data.", language));
      setMarketCrops(getOfflinePricesForRegion("Default"));
      setLocationName("Default Market");
    } finally {
      setLoading(false);
    }
  };

  const renderCropItem = ({ item }) => (
    <View style={styles.cropCard}>
      <View style={styles.cropIconBox}>
        <Text style={styles.cropIcon}>🌾</Text>
      </View>
      <View style={styles.cropInfo}>
        <Text style={styles.cropName}>{t(item.name, language)}</Text>
        <Text style={[styles.cropSub, item.live && { color: '#2E7D32', fontWeight: 'bold' }]}>
          {item.live ? `📍 ${item.marketStr} ${t("Market", language)}` : t("Offline / No Current Data", language)}
        </Text>
      </View>
      <View style={styles.priceBox}>
        <Text style={[styles.priceVal, item.price === 'N/A' && { color: '#999', fontSize: 15 }]}>
          {item.price === 'N/A' ? 'N/A' : `₹${item.price}`}
        </Text>
        {item.price !== 'N/A' && (
          <Text style={styles.priceUnit}>{t("per Quintal", language)} (₹{Math.round(item.price/100)}/kg)</Text>
        )}
      </View>
    </View>
  );

  const filteredCrops = marketCrops.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={openMenu}>
          <Text style={styles.menu}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.header}>{t("💰 Market Price", language)}</Text>
      </View>

      <View style={styles.main}>
        {loading ? (
          <View style={styles.loaderArea}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>{t("Scanning local APMC mandis...", language)}</Text>
          </View>
        ) : (
          <>
            <View style={styles.locationCard}>
              <Text style={styles.locSub}>{t("Local Market Pricing For:", language)}</Text>
              <Text style={styles.locTitle}>📍 {locationName}</Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={fetchLocationAndCrops}>
                <Text style={styles.refreshBtnText}>↻ {t("Refresh", language)}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchBox}>
              <Text style={{fontSize: 16, marginRight: 10}}>🔍</Text>
              <TextInput 
                 style={styles.searchInput}
                 placeholder={t("Search inside 55 Crops...", language)}
                 value={searchQuery}
                 onChangeText={setSearchQuery}
                 placeholderTextColor="#999"
              />
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{filteredCrops.length} {t("Crops Displayed", language)}</Text>
            </View>

            <FlatList
              data={filteredCrops}
              keyExtractor={(item) => item.name}
              renderItem={renderCropItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 50 }}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6', paddingTop: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menu: { fontSize: 24, marginRight: 15, color: '#1B5E20' },
  header: { fontSize: 22, fontWeight: '800', color: '#1B5E20' },
  main: { flex: 1, padding: 20, paddingTop: 10 },
  
  loaderArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#666', fontSize: 16, fontWeight: '500' },

  locationCard: { backgroundColor: '#1B5E20', borderRadius: 16, padding: 20, marginBottom: 15, elevation: 5, shadowColor: '#1B5E20', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  locSub: { color: '#A5D6A7', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 5 },
  locTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  refreshBtn: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  refreshBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, height: 50, borderWidth: 1, borderColor: '#EAECF0' },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },

  listHeader: { marginBottom: 15, paddingHorizontal: 5 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  cropCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  cropIconBox: { width: 44, height: 44, backgroundColor: '#E8F5E9', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cropIcon: { fontSize: 22 },
  cropInfo: { flex: 1 },
  cropName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 3 },
  cropSub: { fontSize: 11, color: '#7f8c8d' },
  priceBox: { alignItems: 'flex-end', justifyContent: 'center' },
  priceVal: { fontSize: 18, fontWeight: 'bold', color: '#27ae60' },
  priceUnit: { fontSize: 10, color: '#95a5a6', marginTop: 2 }
});