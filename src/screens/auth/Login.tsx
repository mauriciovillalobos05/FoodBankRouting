import { useEffect, useState, useRef } from "react";
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

// Variable global para controlar si ya se limpió la sesión
let sessionCleared = false;

export default function Login() {
  const nav = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [clearingSession, setClearingSession] = useState(false);
  const hasCleared = useRef(false);

  // Limpiar toda la memoria y sesión SOLO la primera vez que se monta
  useEffect(() => {
    const clearAllMemory = async () => {
      if (hasCleared.current || sessionCleared) {
        return;
      }

      try {
        setClearingSession(true);
        hasCleared.current = true;
        sessionCleared = true;
        
        await supabase.auth.signOut({ scope: 'global' });
        
        setEmail("");
        setPassword("");
        setShowPassword(false);
        
        console.log("✓ Memoria y sesión limpiadas completamente (primera vez)");
      } catch (error) {
        console.warn("Error limpiando memoria:", error);
      } finally {
        setClearingSession(false);
      }
    };

    clearAllMemory();
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onLogin = async () => {
    try {
      setLoading(true);
      
      // Validar campos
      if (!email.trim() || !password) {
        Alert.alert("Campos requeridos", "Por favor ingresa tu correo y contraseña.");
        setLoading(false);
        return;
      }

      console.log("🔐 Validando credenciales para:", email.trim());
      
      // Paso 1: Iniciar sesión para validar credenciales
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error("❌ Error de login:", error);
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("confirm")) {
          Alert.alert(
            "Confirma tu correo",
            "Abre el enlace del email y luego vuelve a iniciar sesión."
          );
          return;
        }
        if (msg.includes("invalid login") || msg.includes("invalid_grant") || msg.includes("invalid credentials")) {
          Alert.alert("Credenciales inválidas", "Revisa tu correo y contraseña.");
        } else {
          Alert.alert("Error al iniciar sesión", error.message ?? "Intenta de nuevo.");
        }
        return;
      }

      if (data?.user) {
        console.log("✅ Credenciales válidas para:", data.user.email);
        
        // Paso 2: Cerrar la sesión temporal
        await supabase.auth.signOut();
        
        // Paso 3: Solicitar OTP
        console.log("📧 Solicitando código OTP...");
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: false, // No crear usuario si no existe
          }
        });

        if (otpError) {
          console.error("❌ Error al enviar OTP:", otpError);
          Alert.alert("Error", "No se pudo enviar el código de verificación.");
          return;
        }

        console.log("✅ Código OTP enviado");
        Alert.alert(
          "Código enviado",
          "Revisa tu correo para obtener el código de verificación.",
          [
            {
              text: "OK",
              onPress: () => {
                // Navegar a la pantalla de confirmación OTP
                nav.navigate("Confirmacion", { email: email.trim() });
              }
            }
          ]
        );
      }
      
    } catch (e: any) {
      console.error("❌ Excepción en login:", e);
      Alert.alert("Error", e?.message ?? "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  // Mostrar indicador mientras se limpia la sesión
  if (clearingSession) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Image 
          source={require('../../assets/full_logo_bda.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#CE0E2D" style={{ marginTop: 20 }} />
        <Text style={styles.clearingText}>Iniciando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/full_logo_bda.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Inicia sesión</Text>

        <TextInput
          placeholder="Correo"
          placeholderTextColor={styles.placeholder.color}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          editable={!loading}
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor={styles.placeholder.color}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={styles.passwordInput}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            keyboardType="default"
            importantForAutofill="no"
            editable={!loading}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={togglePasswordVisibility}
            disabled={loading}
          >
            {showPassword ? 
              <Image 
                source={require("../../assets/logo_bda.png")}
                style={[styles.eyeImage, { opacity: 1 }]}
              /> : 
              <Image 
                source={require("../../assets/logo_off_bda.png")}
                style={[styles.eyeImage, { opacity: 0.5 }]}
              />
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onLogin}
          disabled={loading}
          style={styles.loginButton}
        >
          {loading ? (
            <ActivityIndicator color={styles.buttonText.color} />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>
            ¿Olvidaste tu contraseña?{' '}
            <Text style={styles.contactAdminText}>
              Ponte en contacto con un administrador.
            </Text>
          </Text>
        </TouchableOpacity>
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
  centerContent: {
    alignItems: 'center',
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
  clearingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#5C5C60',
    fontWeight: '500',
  },
});