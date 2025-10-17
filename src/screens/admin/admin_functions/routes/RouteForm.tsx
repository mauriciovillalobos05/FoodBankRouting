import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,    
  ActivityIndicator,
  Image,
  StyleSheet
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/services/supabase";
import * as Linking from "expo-linking";


export default function RouteForm({ navigation }: any) {
  const nav = useNavigation<any>();
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


  // Login dummy para desarrollo
  const onDummyLogin = async () => {
    setLoading(true);
    // Simular delay de red
    setTimeout(() => {
      setLoading(false);
      nav.navigate("Root");
    }, 1000);
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Registrar parada de ruta</Text>
        <Text>Fecha</Text>
        <TextInput
          placeholder="Fecha"
          placeholderTextColor={styles.placeholder.color}
          autoCapitalize="none"
          keyboardType="default"
          value={fecha}
          onChangeText={setFecha}
          style={styles.input}
        />
        
        <Text>Hora</Text>
        <TextInput
            placeholder="Hora"
            placeholderTextColor={styles.placeholder.color}
            value={hora}
            onChangeText={setHora}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="default"
            importantForAutofill="no"
        />

        <Text>Ubicación</Text>
        <TextInput
            placeholder="Ubicación"
            placeholderTextColor={styles.placeholder.color}
            value={ubicacion}
            onChangeText={setUbicacion}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="default"
            importantForAutofill="no"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 250,
    height: 170,
    shadowColor: '#5C5C60',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formContainer: {
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#CE0E2D',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#5C5C60',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#5C5C60',
  },
  placeholder: {
    color: '#5C5C60',
  },
  loginButton: {
    backgroundColor: '#00953B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#00953B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  forgotPasswordContainer: {
    marginTop: 16,
  },
  forgotPasswordText: {
    textAlign: 'center',
    color: '#000000',
    fontSize: 14,
    lineHeight: 20,
  },
  contactAdminText: {
    color: '#CE0E2D',
    fontWeight: '600',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5C5C60',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#5C5C60',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 40,
    marginBottom: 30,
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
});
