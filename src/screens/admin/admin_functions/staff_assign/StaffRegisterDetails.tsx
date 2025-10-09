import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Image
} from 'react-native';

const StaffRegisterDetails = ({ navigation, route }: any) => {
  const { email } = route.params || {};
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordChange = (text: string) => {
    setContraseña(text);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleContinue = () => {
    if (nombre.trim() && apellido.trim() && contraseña.trim()) {
      // Aquí iría la lógica de registro
      console.log('Registrar staff:', { email, nombre, apellido, contraseña });
      // Navegar de vuelta o mostrar confirmación
      navigation.navigate('UsersMain');
    }
  };

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
          <View style={styles.headerSpacer} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder=""
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              value={apellido}
              onChangeText={setApellido}
              placeholder=""
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
                placeholder=""
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                keyboardType="default"
                importantForAutofill="no"
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
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
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
    marginBottom: 40,
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
    flex: 0.8
  },
  headerSpacer: {
    width: 40,
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
  eyeIcon: {
    fontSize: 18,
    color: '#5C5C60',
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
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StaffRegisterDetails;