import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/services/supabase';

const StaffRegisterEmail = ({ navigation }: any) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const validateForm = () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el primer nombre');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el primer apellido');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa el correo electrónico');
      return false;
    }
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Por favor ingresa una contraseña');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (!confirmPassword.trim()) {
      Alert.alert('Error', 'Por favor confirma la contraseña');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  // Validar si la contraseña cumple con los requisitos
  const isPasswordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const showPasswordError = passwordTouched && password.length > 0 && !isPasswordValid;

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      // 1. Crear usuario en auth.users usando signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName,
            email: email.trim().toLowerCase(),
          },
        },
      });

      if (authError) {
        console.error('Error creando usuario en auth:', authError);
        Alert.alert('Error', authError.message || 'No se pudo crear el usuario');
        return;
      }

      if (!authData.user) {
        Alert.alert('Error', 'No se pudo crear el usuario');
        return;
      }

      // 2. Crear registro en la tabla users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          role: 'staff',
          phone: null,
          location: null,
          latitude: null,
          longitude: null,
        });

      if (userError) {
        console.error('Error creando usuario en tabla users:', userError);
        Alert.alert('Error', 'Usuario creado en auth pero falló en tabla users');
        return;
      }

      // Éxito
      Alert.alert(
        'Éxito',
        'Staff registrado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

      // Limpiar formulario
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPasswordTouched(false);

    } catch (error) {
      console.error('Excepción al registrar staff:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registrar Staff</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Primer Nombre</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Ej: Juan"
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Primer Apellido</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Ej: Pérez"
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ejemplo@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={[
                styles.input,
                showPasswordError && styles.inputError
              ]}
              value={password}
              onChangeText={setPassword}
              onBlur={() => setPasswordTouched(true)}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
            {showPasswordError && (
              <Text style={styles.errorText}>
                La contraseña debe tener al menos 6 caracteres
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar Contraseña</Text>
            <TextInput
              style={[
                styles.input,
                confirmPassword.length > 0 && !passwordsMatch && styles.inputError
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirma tu contraseña"
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={styles.errorText}>
                Las contraseñas no coinciden
              </Text>
            )}
            {passwordsMatch && (
              <Text style={styles.successText}>
                ✓ Las contraseñas coinciden
              </Text>
            )}
          </View>
        </View>

        {/* Register Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.registerButton, 
              (loading || showPasswordError || !isPasswordValid) && styles.buttonDisabled
            ]}
            onPress={handleRegister}
            disabled={loading || showPasswordError || !isPasswordValid}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Registrar Staff</Text>
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
  scrollView: {
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
  formContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
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
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  successText: {
    color: '#00953B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  registerButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StaffRegisterEmail;