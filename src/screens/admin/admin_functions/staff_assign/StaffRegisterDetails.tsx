import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/services/supabase';
import { createClient } from '@supabase/supabase-js';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';

// Cliente de administrador para operaciones en auth.users
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseServiceKey = Constants.expoConfig?.extra?.supabaseServiceRoleKey;

const supabaseAdmin = createClient(
  supabaseUrl!,
  supabaseServiceKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

type RootStackParamList = {
  StaffRegisterDetails: { selectedStaffId: string };
  UsersMain: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'StaffRegisterDetails'>;

interface StaffData {
  id: string;
  full_name: string;
  role: string;
}

const StaffRegisterDetails = ({ navigation, route }: Props) => {
  const { selectedStaffId } = route.params;
  
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffData, setStaffData] = useState<StaffData | null>(null);

  useEffect(() => {
    loadStaffData();
  }, [selectedStaffId]);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role')
        .eq('id', selectedStaffId)
        .single();
      
      if (error) throw error;
      
      setStaffData(data);
      
      // Dividir el nombre si contiene espacios
      if (data.full_name) {
        const nameParts = data.full_name.trim().split(' ');
        if (nameParts.length >= 2) {
          setNombre(nameParts[0]);
          setApellido(nameParts.slice(1).join(' '));
        } else {
          setNombre(data.full_name);
          setApellido('');
        }
      }
    } catch (error) {
      console.error('Error loading staff data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del staff');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (text: string) => {
    setContraseña(text);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleContinue = async () => {
    if (!nombre.trim()) {
      Alert.alert('Atención', 'Por favor ingresa el nombre');
      return;
    }

    if (!contraseña.trim()) {
      Alert.alert('Atención', 'Por favor ingresa una contraseña');
      return;
    }

    if (contraseña.length < 6) {
      Alert.alert('Atención', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setSaving(true);

      // Combinar nombre y apellido
      const fullName = apellido.trim() 
        ? `${nombre.trim()} ${apellido.trim()}` 
        : nombre.trim();

      // 1. Actualizar la tabla users
      const { error: usersError } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', selectedStaffId);

      if (usersError) throw usersError;

      // 2. Actualizar auth.users - contraseña
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        selectedStaffId,
        { password: contraseña }
      );

      if (passwordError) {
        console.error('Error updating password:', passwordError);
        throw passwordError;
      }

      // 3. Actualizar auth.users - metadata (full_name)
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        selectedStaffId,
        { 
          user_metadata: { full_name: fullName }
        }
      );

      if (metadataError) {
        console.error('Error updating metadata:', metadataError);
        throw metadataError;
      }

      Alert.alert(
        'Éxito',
        'Los datos del staff han sido actualizados correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('UsersMain')
          }
        ]
      );

    } catch (error) {
      console.error('Error updating staff:', error);
      Alert.alert('Error', 'No se pudieron actualizar los datos del staff');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5050FF" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalles del Staff</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Staff Info */}
        {staffData && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Editando: <Text style={styles.infoTextBold}>{staffData.full_name}</Text>
            </Text>
            <Text style={styles.roleText}>{staffData.role}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder={nombre || 'Ingresa el nombre'}
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              value={apellido}
              onChangeText={setApellido}
              placeholder={apellido || 'Ingresa el apellido'}
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={contraseña}
                onChangeText={handlePasswordChange}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                keyboardType="default"
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={togglePasswordVisibility}
              >
                {showPassword ? 
                  <Image 
                    source={require("../../../../assets/logo_bda.png")}
                    style={[styles.eyeImage, { opacity: 1 }]}
                  /> : 
                  <Image 
                    source={require("../../../../assets/logo_off_bda.png")}
                    style={[styles.eyeImage, { opacity: 0.5 }]}
                  />
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.continueButton,
              saving && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>Continuar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 40,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: '#5C5C60',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#5C5C60',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#5C5C60',
  },
  infoContainer: {
    backgroundColor: '#E8E3FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#5C5C60',
    marginBottom: 4,
  },
  infoTextBold: {
    fontWeight: '600',
    color: '#5050FF',
  },
  roleText: {
    fontSize: 13,
    color: '#999',
  },
  formContainer: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#5C5C60',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#5C5C60',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#5C5C60',
  },
  eyeButton: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StaffRegisterDetails;