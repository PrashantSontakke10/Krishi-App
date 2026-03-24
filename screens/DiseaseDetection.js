import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { t } from '../utils/translations';

export default function DiseaseDetection({ openMenu, language }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setResult(null);
      }
    } catch (error) {
      Alert.alert(t("Permission Required", language), t("Please allow gallery access to pick an image.", language));
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t("Permission Denied", language), t("We need camera access to take a photo of the leaf.", language));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setResult(null);
      }
    } catch (error) {
      Alert.alert(t("Error", language), t("Could not open camera.", language));
    }
  };

  const uploadAndPredict = async () => {
    if (!image) {
      Alert.alert("No Image Selected", "Please select a photo of the plant leaf first.");
      return;
    }

    setLoading(true);
    setResult(null);

    // Prepare multipart form data
    const formData = new FormData();
    const uriParts = image.split('.');
    const fileType = uriParts[uriParts.length - 1];

    formData.append('image', {
      uri: image,
      name: `leaf_photo.${fileType}`,
      type: `image/${fileType}`,
    });

    try {
      const response = await fetch(process.env.EXPO_PUBLIC_DISEASE_API_URL || 'https://plant-disease-prediction-3-ks6n.onrender.com/predict', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          // NO Content-Type header here for fetch + FormData
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response Data:", data);

      // Extract result more robustly
      const predictedDisease = data.disease || data.prediction || data.class || (typeof data === 'string' ? data : null);
      
      // If we have confidence, maybe append it for better UX
      if (predictedDisease && data.confidence) {
        setResult({
          disease: predictedDisease,
          confidence: (data.confidence * 100).toFixed(2)
        });
      } else {
        setResult(predictedDisease || JSON.stringify(data));
      }
    } catch (error) {
      console.log("Upload Error: ", error);
      Alert.alert("Upload Failed", "Could not analyze the image. Check your network or the API status (Render apps can take 1 minute to boot).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Premium Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.menuBtn} onPress={openMenu}>
          <Text style={styles.menu}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.header}>{t("🦠 AI Disease Scanner", language)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t("Upload a clear image of a plant leaf to automatically detect potential diseases and health issues.", language)}</Text>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>{t("Image Upload", language)}</Text>

          <View style={styles.imagePickerArea}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderIcon}>🌿</Text>
                <Text style={styles.placeholderText}>{t("No Image Selected", language)}</Text>
              </View>
            )}
          </View>

          <View style={styles.selectionRow}>
            <TouchableOpacity style={styles.selectionBtn} onPress={pickImage}>
              <Text style={styles.selectionBtnIcon}>🖼️</Text>
              <Text style={styles.selectionBtnText}>{t("Gallery", language)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectionBtn} onPress={takePhoto}>
              <Text style={styles.selectionBtnIcon}>📸</Text>
              <Text style={styles.selectionBtnText}>{t("Camera", language)}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.actionButton, !image && styles.actionButtonDisabled]} onPress={uploadAndPredict} disabled={loading || !image}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionButtonText}>{t("Scan Disease", language)}</Text>}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultBadge}>{t("DETECTION COMPLETE", language)}</Text>
            <Text style={styles.resultTitle}>{t("Diagnosis:", language)}</Text>
            {typeof result === 'object' ? (
              <View>
                <Text style={styles.resultHighlight}>{result.disease.replace(/_/g, ' ')}</Text>
                {/* {result.confidence && (
                  <Text style={{ color: '#A5D6A7', fontSize: 16, marginTop: -5, marginBottom: 10 }}>
                    Confidence: {result.confidence}%
                  </Text>
                )} */}
              </View>
            ) : (
              <Text style={styles.resultHighlight}>{String(result).replace(/_/g, ' ')}</Text>
            )}
            <Text style={styles.resultSubtext}>{t("This result is predicted by our AI model. For advanced agricultural damage, consult a local botanist.", language)}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6', paddingTop: 20, marginTop: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  menuBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginRight: 15 },
  menu: { fontSize: 20, color: '#333' },
  header: { fontSize: 24, fontWeight: '800', color: '#1B5E20', letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 20, paddingBottom: 50 },
  subtitle: { fontSize: 15, color: '#666', lineHeight: 22, paddingBottom: 20, paddingLeft: 5 },
  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1B5E20', marginBottom: 15, marginTop: 5 },

  imagePickerArea: { backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#EAECF0', borderStyle: 'dashed', borderRadius: 16, height: 220, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 20 },
  placeholderBox: { alignItems: 'center' },
  placeholderIcon: { fontSize: 40, marginBottom: 10 },
  placeholderText: { fontSize: 15, fontWeight: '600', color: '#888' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  selectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  selectionBtn: { flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4F2', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0' },
  selectionBtnIcon: { fontSize: 18, marginRight: 8 },
  selectionBtnText: { fontSize: 14, fontWeight: '700', color: '#1B5E20' },

  actionButton: { backgroundColor: '#2E7D32', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8, marginTop: 5 },
  actionButtonDisabled: { backgroundColor: '#A5D6A7', shadowOpacity: 0 },
  actionButtonText: { color: '#fff', fontSize: 17, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  resultCard: { backgroundColor: '#1B5E20', borderRadius: 24, padding: 30, marginTop: 25, shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10, position: 'relative', overflow: 'hidden' },
  resultBadge: { position: 'absolute', top: 20, right: 25, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, color: '#fff', fontSize: 10, fontWeight: '800', overflow: 'hidden' },
  resultTitle: { fontSize: 15, color: '#fff', opacity: 0.8, fontWeight: '600', marginBottom: 5 },
  resultHighlight: { fontSize: 32, fontWeight: '900', color: '#A5D6A7', textTransform: 'capitalize', marginBottom: 15, letterSpacing: -0.5 },
  resultText: { fontSize: 18, color: '#A5D6A7', marginBottom: 15 },
  resultSubtext: { fontSize: 14, color: '#fff', opacity: 0.7, lineHeight: 20 }
});