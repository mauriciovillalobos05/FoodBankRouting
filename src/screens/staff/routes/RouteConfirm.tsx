import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';
import { supabase, safeLogError } from '@/services/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Status = 'Pendiente' | 'En curso' | 'Finalizada' | undefined;

type RootStackParamList = {
  RouteConfirm: { id?: string; location?: string; status?: Status; participant_id?: string } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'RouteConfirm'>;

interface Evidence {
  id: string;
  path: string | null;
  notes: string | null;
  uploaded_at: string | null;
}

export default function RouteConfirm({ route, navigation }: Props) {
  const { id, location } = route.params || {};
  const status = (route.params as any)?.status as Status;
  const participantIdParam = (route.params as any)?.participant_id as string | undefined;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [routeName, setRouteName] = useState<string | undefined>(location);
  const [routeDescription, setRouteDescription] = useState<string | undefined>(undefined);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(participantIdParam ?? null);
  const [routeDetails, setRouteDetails] = useState<{ route_date?: string; start_time?: string | null; end_time?: string | null } | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loadingEvidences, setLoadingEvidences] = useState(false);
  const [evidenceImages, setEvidenceImages] = useState<{ [key: string]: string }>({});

  const CLIENT_SIDE_ENCRYPTION_KEY = process.env.EXPO_PUBLIC_CLIENT_ENCRYPTION_KEY || 'demo-client-key-please-change';

  // Load evidences for finalized routes
  const loadEvidences = React.useCallback(async () => {
    if (!id || status !== 'Finalizada') return;
    
    try {
      setLoadingEvidences(true);
      const { data, error } = await supabase
        .from('evidences')
        .select('id, path, notes, uploaded_at')
        .eq('route_id', String(id))
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.warn('Error loading evidences:', error);
        return;
      }

      setEvidences(data || []);

      // Load images from storage
      if (data && data.length > 0) {
        const imageUrls: { [key: string]: string } = {};
        
        for (const evidence of data) {
          if (evidence.path) {
            try {
              const { data: fileData, error: downloadError } = await supabase.storage
                .from('evidences')
                .download(evidence.path);

              if (downloadError) {
                console.warn('Error downloading evidence:', downloadError);
                continue;
              }

              const encryptedText = await new Response(fileData).text();
              const decryptedBytes = CryptoJS.AES.decrypt(encryptedText, CLIENT_SIDE_ENCRYPTION_KEY);
              const decryptedBase64 = decryptedBytes.toString(CryptoJS.enc.Utf8);

              if (decryptedBase64) {
                const imageUri = `data:image/jpeg;base64,${decryptedBase64}`;
                imageUrls[evidence.id] = imageUri;
              }
            } catch (err) {
              console.warn('Error processing evidence image:', err);
            }
          }
        }
        
        setEvidenceImages(imageUrls);
      }
    } catch (err) {
      console.error('Error loading evidences:', err);
    } finally {
      setLoadingEvidences(false);
    }
  }, [id, status, CLIENT_SIDE_ENCRYPTION_KEY]);

  const pickImageAndUpload = async () => {
    if (status === 'Finalizada') {
      Alert.alert('Ruta finalizada', 'No se pueden subir evidencias a rutas finalizadas.');
      return;
    }
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería para subir evidencias.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: false,
      });

      if ('canceled' in result && result.canceled) return;
      const uri = Array.isArray((result as any).assets) ? (result as any).assets[0]?.uri : undefined;
      if (!uri) return;
      setSelectedImage(uri);
      await encryptAndUpload(uri);
    } catch (err) {
      console.error('pickImage error', err);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  async function encryptAndUpload(uri: string) {
    setUploading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const cipherText = CryptoJS.AES.encrypt(base64, CLIENT_SIDE_ENCRYPTION_KEY).toString();
      const fileData = Buffer.from(cipherText, 'utf8');

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
    try {
      if (status === 'Finalizada') {
        (navigation as any).navigate('HomeMain');
        return;
      }
      
      if (!uploadedPath && !notes) {
        (navigation as any).navigate('HomeMain');
        return;
      }

      const payload: any = {
        route_id: id ? String(id) : null,
        notes: notes || null,
        uploaded_at: new Date().toISOString(),
      };
      if (uploadedPath) payload.path = uploadedPath;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          payload.created_by = user.id;

          if (participantId) {
            try {
              const { data: rpCheck } = await supabase.from('route_participants').select('id, route_id, user_id').eq('id', participantId).maybeSingle();
              if (!rpCheck || String(rpCheck.route_id) !== String(id)) {
                const { data: foundParticipant } = await supabase.from('route_participants').select('id').eq('route_id', id).eq('user_id', user.id).limit(1).maybeSingle();
                if (foundParticipant && (foundParticipant as any).id) payload.participant_id = (foundParticipant as any).id;
                else {
                  delete payload.participant_id;
                }
              } else {
                payload.participant_id = participantId;
              }
            } catch (e) {
              const { data: foundParticipant } = await supabase.from('route_participants').select('id').eq('route_id', id).eq('user_id', user.id).limit(1).maybeSingle();
              if (foundParticipant && (foundParticipant as any).id) payload.participant_id = (foundParticipant as any).id;
            }
          } else if (id) {
            const { data: foundParticipant } = await supabase.from('route_participants').select('id').eq('route_id', id).eq('user_id', user.id).limit(1).maybeSingle();
            if (foundParticipant && (foundParticipant as any).id) payload.participant_id = (foundParticipant as any).id;
          }
        }
      } catch (e) {
        console.warn('Could not resolve current user for evidence metadata', e);
      }

      try {
        const { error } = await supabase.from('evidences').insert([payload]);
        if (error) {
          console.warn('Could not insert evidence metadata', error);
          Alert.alert(
            'Advertencia', 
            'No se pudo guardar la metadata, pero la evidencia puede estar subida. Se procederá a finalizar la ruta.',
            [
              {
                text: 'OK',
                onPress: () => {
                  (navigation as any).navigate('HomeMain', { refresh: Date.now() });
                }
              }
            ]
          );
          return;
        } else {
          Alert.alert(
            'Ruta finalizada', 
            'Notas y evidencias registradas.',
            [
              {
                text: 'OK',
                onPress: () => {
                  (navigation as any).navigate('HomeMain', { refresh: Date.now() });
                }
              }
            ]
          );
        }
      } catch (e) {
        console.warn('evidences insert exception, continuing to finalize', e);
      }

      try {
        if (id) {
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
    } catch (err) {
      console.error('finalizeRoute error', err);
      Alert.alert('Error', 'No se pudo finalizar la ruta.');
    }
  }

  // Load route details
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      
      try {
        setLoadingRoute(true);
        console.log('Fetching route details for ID:', id);
        
        const { data, error } = await supabase
          .from('routes')
          .select('name, description, route_date, start_time, end_time')
          .eq('id', String(id))
          .single();
        
        if (error) {
          console.warn('Could not fetch route details', error);
        } else if (mounted) {
          console.log('Route data fetched:', data);
          setRouteName(data?.name ?? undefined);
          setRouteDescription(data?.description ?? undefined);
          setRouteDetails({ 
            route_date: data?.route_date, 
            start_time: data?.start_time ?? null, 
            end_time: data?.end_time ?? null 
          });
        }
      } catch (e) {
        console.warn('Exception fetching route', e);
      } finally {
        if (mounted) setLoadingRoute(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Load evidences when route is finalized
  React.useEffect(() => {
    if (status === 'Finalizada') {
      loadEvidences();
    }
  }, [status, loadEvidences]);

  // Check registration status
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          if (mounted) setIsRegistered(false);
          return;
        }

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
      {/* Botón universal: flecha atrás -> Tab Home */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        {routeName 
          ? `${routeName}` 
          : location 
            ? `${location}` 
            : id 
              ? `Ruta [${id}]` 
              : 'Ruta'}
      </Text>

      {/* Descripción de la ruta */}
      {routeDescription && (
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionLabel}>Descripción</Text>
          <Text style={styles.descriptionText}>{routeDescription}</Text>
        </View>
      )}

      {/* Detalles de fecha y hora */}
      {routeDetails && (
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Fecha:</Text>
            <Text style={styles.detailValue}>
              {routeDetails.route_date 
                ? new Date(routeDetails.route_date).toLocaleDateString('es-MX', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : '-'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🕐 Horario:</Text>
            <Text style={styles.detailValue}>
              {routeDetails.start_time 
                ? `${routeDetails.start_time.slice(0,5)}${routeDetails.end_time ? ` - ${routeDetails.end_time.slice(0,5)}` : ''}` 
                : 'Por iniciar'}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Evidencias</Text>
      
      {status === 'Finalizada' ? (
        loadingEvidences ? (
          <ActivityIndicator style={{ marginVertical: 20 }} />
        ) : evidences.length > 0 ? (
          <View style={styles.evidencesContainer}>
            {evidences.map((evidence) => (
              <View key={evidence.id} style={styles.evidenceCard}>
                {evidenceImages[evidence.id] ? (
                  <Image 
                    source={{ uri: evidenceImages[evidence.id] }} 
                    style={styles.evidenceImageLarge}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.evidenceBox}>
                    <ActivityIndicator />
                  </View>
                )}
                {evidence.uploaded_at && (
                  <Text style={styles.evidenceDate}>
                    Subida: {new Date(evidence.uploaded_at).toLocaleString('es-MX')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.evidenceBox}>
            <Image source={require('../../../assets/location_icon.png')} style={styles.photo} />
            <Text style={styles.noEvidenceText}>No hay evidencias</Text>
          </View>
        )
      ) : (
        <View style={styles.evidenceBox}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.evidenceImage} />
          ) : (
            <Image source={require('../../../assets/location_icon.png')} style={styles.photo} />
          )}
        </View>
      )}

      {status !== 'Finalizada' && (
        (isRegistered === null) ? null : (!isRegistered ? (
          <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: '#5050FF' }]} onPress={handleRegisterForRoute}>
            <Text style={styles.actionBtnText}>Registrarse para ruta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: '#CE0E2D' }]} onPress={pickImageAndUpload}>
            <Text style={styles.actionBtnText}>Subir Foto</Text>
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.sectionTitle}>Notas sobre tu ruta</Text>
      
      {status === 'Finalizada' ? (
        evidences.length > 0 ? (
          <View style={styles.notesContainer}>
            {evidences.map((evidence) => (
              evidence.notes ? (
                <View key={evidence.id} style={styles.noteCard}>
                  <Text style={styles.noteText}>{evidence.notes}</Text>
                  {evidence.uploaded_at && (
                    <Text style={styles.noteDate}>
                      {new Date(evidence.uploaded_at).toLocaleDateString('es-MX')}
                    </Text>
                  )}
                </View>
              ) : null
            ))}
            {evidences.every(e => !e.notes) && (
              <View style={styles.noteCard}>
                <Text style={styles.noNotesText}>No hay notas registradas</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noteCard}>
            <Text style={styles.noNotesText}>No hay notas registradas</Text>
          </View>
        )
      ) : (
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Escribe alguna observación sobre la ruta"
          style={styles.notesInput}
          multiline
          editable={(status as string) !== 'Finalizada'}
        />
      )}

      {status === 'Finalizada' && (
        <View style={styles.finalizedBanner}>
          <Text style={styles.finalizedText}>✓ Ruta finalizada — solo se permiten ver detalles.</Text>
        </View>
      )}

      {uploading && <ActivityIndicator style={{ marginTop: 12 }} />}

      {status !== 'Finalizada' ? (
        (isRegistered === null) ? null : (!isRegistered ? (
          <TouchableOpacity 
            style={[styles.finishButton, { backgroundColor: '#999' }]} 
            onPress={() => Alert.alert('Registro requerido', 'Regístrate en la ruta para poder finalizarla.')}
          >
            <Text style={styles.finishButtonText}>Subir Evidencia & Finalizar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.finishButton} onPress={async () => {
            await finalizeRoute();
          }}>
            <Text style={styles.finishButtonText}>Subir Evidencia & Finalizar</Text>
          </TouchableOpacity>
        ))
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    flexGrow: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 16,
    marginBottom: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#222',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5050FF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#222',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
    paddingHorizontal: 4,
    color: '#222',
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
    marginTop: 16,
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
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
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
  evidencesContainer: {
    gap: 16,
    marginBottom: 16,
  },
  evidenceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  evidenceImageLarge: {
    width: '100%',
    height: 250,
  },
  evidenceDate: {
    padding: 12,
    fontSize: 12,
    color: '#666',
  },
  noEvidenceText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  notesContainer: {
    gap: 12,
    marginBottom: 16,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
  noNotesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  finalizedBanner: {
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#00953B',
  },
  finalizedText: {
    color: '#00953B',
    fontSize: 14,
    fontWeight: '500',
  },
});