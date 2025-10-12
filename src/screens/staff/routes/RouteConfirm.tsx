import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import CryptoJS from 'crypto-js';
import { supabase } from '../../../lib/supabaseClient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  RouteConfirm: { id?: number; location?: string } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'RouteConfirm'>;

export default function RouteConfirm({ route, navigation }: Props) {
  const { id, location } = route.params || {};
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  // NOTE about security: For a secure production setup you should NOT hardcode a symmetric key
  // on the client. The recommended approach is to fetch the admin's public key from a secure
  // endpoint and encrypt a generated AES key with that public key (so only admin can decrypt it).
  // Below we use an env variable as a demo placeholder. Please implement proper key management.
  const CLIENT_SIDE_ENCRYPTION_KEY = process.env.EXPO_PUBLIC_CLIENT_ENCRYPTION_KEY || 'demo-client-key-please-change';

  const pickImageAndUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería para subir evidencias.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: false,
      });

      // Newer expo-image-picker returns { canceled: boolean, assets?: [{ uri, ... }] }
      if ('canceled' in result && result.canceled) return;
      const uri = Array.isArray((result as any).assets) ? (result as any).assets[0]?.uri : undefined;
      if (!uri) return;
      setSelectedImage(uri);
      // encrypt and upload
      await encryptAndUpload(uri);
    } catch (err) {
      console.error('pickImage error', err);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  async function encryptAndUpload(uri: string) {
    setUploading(true);
    try {
      // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

      // Encrypt the base64 string with AES (demo). See note above about key management.
      const cipherText = CryptoJS.AES.encrypt(base64, CLIENT_SIDE_ENCRYPTION_KEY).toString();

      // Create a blob from ciphertext for upload
      const blob = new Blob([cipherText], { type: 'text/plain' });

      // Upload to Supabase Storage (bucket must exist and allow uploads from client)
      const filePath = `evidences/route_${id}_${Date.now()}.enc`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(filePath, blob, { contentType: 'text/plain' });

      if (uploadError) {
        console.error('Supabase upload error', uploadError);
        Alert.alert('Error', 'No se pudo subir la evidencia.');
        setUploading(false);
        return;
      }

      // Save the uploaded path locally. Metadata (notes) will be posted when user finalizes the route.
      setUploadedPath(filePath);
      Alert.alert('Éxito', 'Evidencia subida (cifrada).');
    } catch (err) {
      console.error('encrypt/upload error', err);
      Alert.alert('Error', 'Ocurrió un error al cifrar/subir la imagen.');
    } finally {
      setUploading(false);
    }
  }

  async function finalizeRoute() {
    // Only post notes and metadata when user finalizes the route
    try {
      // If there's an uploaded file path, insert metadata linking it to the route along with notes
      if (!uploadedPath && !notes) {
        // nothing to save
        navigation.goBack();
        return;
      }

      const payload: any = {
        route_id: id,
        notes: notes || null,
        uploaded_at: new Date().toISOString(),
      };
      if (uploadedPath) payload.path = uploadedPath;

      const { error } = await supabase.from('evidences').insert([payload]);
      if (error) {
        console.warn('Could not insert evidence metadata', error);
        Alert.alert('Advertencia', 'No se pudo guardar la metadata, pero la evidencia puede estar subida.');
      } else {
        Alert.alert('Ruta finalizada', 'Notas y evidencias registradas.');
      }

      navigation.goBack();
    } catch (err) {
      console.error('finalizeRoute error', err);
      Alert.alert('Error', 'No se pudo finalizar la ruta.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ruta {location ? `[${location}]` : ''}</Text>

      <View style={styles.mapPlaceholder}>
        <Image
          source={require('../../../assets/map_stock_img.png')}
          style={styles.mapImage}
          resizeMode="cover"
        />
      </View>

      <Text style={styles.sectionTitle}>Evidencias</Text>
      <View style={styles.evidenceBox}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.evidenceImage} />
        ) : (
          <Image source={require('../../../assets/location_icon.png')} style={styles.photo} />
        )}
      </View>

      <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: '#CE0E2D' }]} onPress={pickImageAndUpload}>
        <Text style={styles.actionBtnText}>Subir evidencia</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Notas sobre tu ruta</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Escribe alguna observación sobre la ruta"
        style={styles.notesInput}
        multiline
      />
      {uploading && <ActivityIndicator style={{ marginTop: 12 }} />}

      <TouchableOpacity style={styles.finishButton} onPress={async () => {
        await finalizeRoute();
      }}>
        <Text style={styles.finishButtonText}>Finalizar ruta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

async function noop() { return; }

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
    padding: 10
  },
  mapPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    padding:8
  },
  evidenceBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 48,
    height: 48,
    tintColor: '#C0C0C0',
  },
  finishButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 'auto',
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 44,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  uploadBtn: {
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
});
