import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// Use the legacy API to keep readAsStringAsync available until we migrate to the new File/Directory API
import * as FileSystem from 'expo-file-system/legacy';
import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';
import { supabase, safeLogError } from '@/services/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  RouteConfirm: { id?: string; location?: string; status?: 'Pendiente' | 'En curso' | 'Finalizada'; participant_id?: string } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'RouteConfirm'>;

export default function RouteConfirm({ route, navigation }: Props) {
  const { id, location } = route.params || {};
  const status = (route.params as any)?.status as 'Pendiente' | 'En curso' | 'Finalizada' | undefined;
  const participantIdParam = (route.params as any)?.participant_id as string | undefined;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [routeName, setRouteName] = useState<string | undefined>(location);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null); // null = unknown
  const [participantId, setParticipantId] = useState<string | null>(participantIdParam ?? null);
  const [routeDetails, setRouteDetails] = useState<{ route_date?: string; start_time?: string | null; end_time?: string | null } | null>(null);

  // NOTE about security: For a secure production setup you should NOT hardcode a symmetric key
  // on the client. The recommended approach is to fetch the admin's public key from a secure
  // endpoint and encrypt a generated AES key with that public key (so only admin can decrypt it).
  // Below we use an env variable as a demo placeholder. Please implement proper key management.
  const CLIENT_SIDE_ENCRYPTION_KEY = process.env.EXPO_PUBLIC_CLIENT_ENCRYPTION_KEY || 'demo-client-key-please-change';

  const pickImageAndUpload = async () => {
    if (status === 'Finalizada') {
      Alert.alert('Ruta finalizada', 'No se pueden subir evidencias a rutas finalizadas.');
      return;
    }
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

      // Create a Buffer from the ciphertext for upload (React Native environment)
      // Buffer is installed as dependency and works as a binary container for supabase-js
      const fileData = Buffer.from(cipherText, 'utf8');

      // Upload to Supabase Storage (bucket must exist and allow uploads from client)
      const safeId = id ? String(id) : 'unknown';
      const filePath = `evidences/route_${safeId}_${Date.now()}.enc`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(filePath, fileData, { contentType: 'text/plain' });

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
      if (status === 'Finalizada') {
        // already finalized; nothing to do
        navigation.goBack();
        return;
      }
      // If there's an uploaded file path, insert metadata linking it to the route along with notes
      if (!uploadedPath && !notes) {
        // nothing to save
        navigation.goBack();
        return;
      }

      const payload: any = {
        route_id: id ? String(id) : null,
        notes: notes || null,
        uploaded_at: new Date().toISOString(),
      };
      if (uploadedPath) payload.path = uploadedPath;

      // Attach participant_id and created_by when possible
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // store uploader's user id in `created_by` for audit (table does not have `user_id` column)
          payload.created_by = user.id;

          // If we already have a participantId, verify it refers to a participant row for this route.
          if (participantId) {
            try {
              const { data: rpCheck } = await supabase.from('route_participants').select('id, route_id, user_id').eq('id', participantId).maybeSingle();
              // If rpCheck exists and route_id matches current route, keep it. Otherwise try to lookup by route_id+user
              if (!rpCheck || String(rpCheck.route_id) !== String(id)) {
                const { data: foundParticipant } = await supabase.from('route_participants').select('id').eq('route_id', id).eq('user_id', user.id).limit(1).maybeSingle();
                if (foundParticipant && (foundParticipant as any).id) payload.participant_id = (foundParticipant as any).id;
                else {
                  // participantId appears invalid for this route; drop it so we don't store a route id mistakenly
                  delete payload.participant_id;
                }
              } else {
                payload.participant_id = participantId;
              }
            } catch (e) {
              // fallback: try to find participant row by route+user
              const { data: foundParticipant } = await supabase.from('route_participants').select('id').eq('route_id', id).eq('user_id', user.id).limit(1).maybeSingle();
              if (foundParticipant && (foundParticipant as any).id) payload.participant_id = (foundParticipant as any).id;
            }
          } else if (id) {
            // try to find participant row for this user and route
            const { data: foundParticipant } = await supabase.from('route_participants').select('id').eq('route_id', id).eq('user_id', user.id).limit(1).maybeSingle();
            if (foundParticipant && (foundParticipant as any).id) payload.participant_id = (foundParticipant as any).id;
          }
        }
      } catch (e) {
        // don't block on this failing; metadata is optional
        console.warn('Could not resolve current user for evidence metadata', e);
      }

      // Try to insert evidence metadata if the table exists. If it doesn't, continue to finalize the route anyways.
      try {
        const { error } = await supabase.from('evidences').insert([payload]);
        if (error) {
          console.warn('Could not insert evidence metadata', error);
          // don't block finalization on metadata insert failure
          Alert.alert('Advertencia', 'No se pudo guardar la metadata, pero la evidencia puede estar subida. Se procederá a finalizar la ruta.');
        } else {
          Alert.alert('Ruta finalizada', 'Notas y evidencias registradas.');
        }
      } catch (e) {
        console.warn('evidences insert exception, continuing to finalize', e);
      }

      // Mark route as finalized by setting end_time to current time (server/local formatted HH:MM:SS)
      try {
        if (id) {
          // format time as HH:MM:SS
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          const ss = String(now.getSeconds()).padStart(2, '0');
          const nowTime = `${hh}:${mm}:${ss}`;
          const { error: updateError } = await supabase.from('routes').update({ end_time: nowTime }).eq('id', String(id));
          if (updateError) {
            console.warn('Could not update route end_time', updateError);
          }
        }
      } catch (e) {
        console.warn('Error setting route end_time', e);
      }

      navigation.goBack();
    } catch (err) {
      console.error('finalizeRoute error', err);
      Alert.alert('Error', 'No se pudo finalizar la ruta.');
    }
  }

  // Load route name from DB if we don't have it in params
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id || location) return; // already have name or no id
      try {
        setLoadingRoute(true);
        const { data, error } = await supabase.from('routes').select('name, route_date, start_time, end_time').eq('id', String(id)).single();
        if (error) {
          console.warn('Could not fetch route name', error);
        } else if (mounted) {
          setRouteName(data?.name ?? undefined);
          setRouteDetails({ route_date: data?.route_date, start_time: data?.start_time ?? null, end_time: data?.end_time ?? null });
        }
      } catch (e) {
        console.warn('Exception fetching route', e);
      } finally {
        if (mounted) setLoadingRoute(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, location]);

  // Check whether current user is registered for this route
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          if (mounted) setIsRegistered(false);
          return;
        }

        // If participant id was passed, inspect that row
        if (participantIdParam) {
          const { data: rp, error: rpError } = await supabase.from('route_participants').select('id, user_id').eq('id', participantIdParam).single();
          if (!rp || rpError) {
            if (mounted) setIsRegistered(false);
            return;
          }
          if (mounted) {
            setParticipantId(rp.id ?? null);
            setIsRegistered(Boolean(rp.user_id === user.id));
          }
          return;
        }

        // Otherwise, look for a participant row for this user and route
        const { data: found, error: findError } = await supabase.from('route_participants').select('id, user_id').eq('route_id', id).eq('user_id', user.id).single();
        if (found && !findError) {
          if (mounted) {
            setParticipantId(found.id);
            setIsRegistered(true);
          }
        } else if (mounted) {
          setIsRegistered(false);
        }
      } catch (e) {
        console.warn('Error checking registration', e);
        if (mounted) setIsRegistered(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, participantIdParam]);

  // Handler to register the current user for the route
  const handleRegisterForRoute = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { Alert.alert('Error', 'No se pudo identificar al usuario.'); return; }

      if (participantId) {
        const { error } = await supabase.from('route_participants').update({ user_id: user.id }).eq('id', participantId);
        if (error) { safeLogError('Error updating participant', error); Alert.alert('Error', 'No se pudo registrar en la ruta.'); return; }
        setIsRegistered(true);
        Alert.alert('Registro', 'Te has registrado en la ruta.');
        return;
      }

      const { data, error } = await supabase.from('route_participants').insert([{ route_id: id, user_id: user.id, role: 'volunteer' }]).select();
      if (error) { safeLogError('Error creating participant', error); Alert.alert('Error', 'No se pudo registrar.'); return; }
      setParticipantId(data?.[0]?.id ?? null);
      setIsRegistered(true);
      Alert.alert('Registro', 'Te has registrado en la ruta.');
    } catch (e) {
      console.warn('register error', e);
      Alert.alert('Error', 'No se pudo registrar en la ruta.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ruta {routeName ? `[${routeName}]` : (location ? `[${location}]` : (id ? `[${id}]` : ''))}</Text>

      <View style={styles.mapPlaceholder}>
        <Image
          source={require('../../../assets/map_stock_img.png')}
          style={styles.mapImage}
          resizeMode="cover"
        />
      </View>
      {routeDetails && (
        <View style={{ paddingVertical: 8 }}>
          <Text>Fecha: {routeDetails.route_date ?? '-'}</Text>
          <Text>Hora: {routeDetails.start_time ? `${routeDetails.start_time?.slice(0,5)}${routeDetails.end_time ? ` - ${routeDetails.end_time?.slice(0,5)}` : ''}` : '-'}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Evidencias</Text>
      <View style={styles.evidenceBox}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.evidenceImage} />
        ) : (
          <Image source={require('../../../assets/location_icon.png')} style={styles.photo} />
        )}
      </View>

      {status === 'Finalizada' ? (
        <View style={{ padding: 12, backgroundColor: '#FFF', borderRadius: 8, marginTop: 8 }}>
          <Text>Ruta finalizada — solo se permiten ver detalles.</Text>
        </View>
      ) : (
        // If registration status unknown, show nothing; if not registered, show register button; otherwise show upload
        (isRegistered === null) ? null : (!isRegistered ? (
          <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: '#5050FF' }]} onPress={handleRegisterForRoute}>
            <Text style={styles.actionBtnText}>Registrarse para ruta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: '#CE0E2D' }]} onPress={pickImageAndUpload}>
            <Text style={styles.actionBtnText}>Subir evidencia</Text>
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.sectionTitle}>Notas sobre tu ruta</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Escribe alguna observación sobre la ruta"
        style={[styles.notesInput, status === 'Finalizada' ? styles.notesInputDisabled : undefined]}
        multiline
        editable={status !== 'Finalizada'}
      />
      {status !== 'Finalizada' && uploading && <ActivityIndicator style={{ marginTop: 12 }} />}

      {status !== 'Finalizada' ? (
        (isRegistered === null) ? null : (!isRegistered ? (
          <TouchableOpacity style={[styles.finishButton, { backgroundColor: '#999' }]} onPress={() => Alert.alert('Registro requerido', 'Regístrate en la ruta para poder finalizarla.') }>
            <Text style={styles.finishButtonText}>Finalizar ruta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.finishButton} onPress={async () => {
            await finalizeRoute();
          }}>
            <Text style={styles.finishButtonText}>Finalizar ruta</Text>
          </TouchableOpacity>
        ))
      ) : (
        <TouchableOpacity style={[styles.finishButton, { backgroundColor: '#999' }]} onPress={() => navigation.goBack()}>
          <Text style={styles.finishButtonText}>Cerrar</Text>
        </TouchableOpacity>
      )}
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
  notesInputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#8a8a8a',
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
