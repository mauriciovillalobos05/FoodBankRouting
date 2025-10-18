import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/services/AuthContext";

export default function Login() {
  const nav = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const onLogin = async () => {
    if (!email.trim()) return Alert.alert("Atención", "Ingresa tu correo");
    if (!password) return Alert.alert("Atención", "Ingresa tu contraseña");

    try {
      setLoading(true);
      console.log('🔐 Login: iniciando login para', email);
      
      // ✅ CRÍTICO: login() ya actualiza el rol en AuthContext
      await login(email, password);
      
      console.log('✅ Login: login exitoso, navegando a Root...');
      
      // ✅ Navegar inmediatamente después del login exitoso
      // No necesitas esperar porque AuthContext ya tiene el rol actualizado
      nav.reset({ 
        index: 0,
        routes: [{ name: "Root" }] 
      });

    } catch (e: any) {
      console.warn('❌ Login error:', e);
      const msg = e?.message?.toLowerCase() || '';
      
      if (msg.includes('invalid login') || msg.includes('invalid_grant')) {
        Alert.alert("Credenciales inválidas", "Revisa tu correo y contraseña.");
      } else if (msg.includes('confirm')) {
        Alert.alert(
          "Confirma tu correo",
          "Abre el enlace del email y luego vuelve a iniciar sesión."
        );
      } else {
        Alert.alert("Error al iniciar sesión", "Intenta de nuevo");
      }
    } finally {
      setLoading(false);
    }
  };

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
          textContentType="emailAddress" 
          autoComplete="email" 
        />

        <TextInput 
          placeholder="Contraseña" 
          placeholderTextColor={styles.placeholder.color} 
          secureTextEntry={!showPassword}
          value={password} 
          onChangeText={setPassword} 
          style={styles.input} 
          textContentType="password" 
          autoComplete="password" 
        />

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
    paddingHorizontal: 24 
  },
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  logoImage: { 
    width: 250, 
    height: 170, 
    shadowColor: '#5C5C60', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3.84, 
    elevation: 5 
  },
  formContainer: { 
    gap: 16 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#CE0E2D', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  input: { 
    borderWidth: 2, 
    borderColor: '#5C5C60', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    backgroundColor: '#FFFFFF', 
    color: '#5C5C60' 
  },
  placeholder: { 
    color: '#5C5C60' 
  },
  loginButton: { 
    backgroundColor: '#00953B', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 8, 
    shadowColor: '#00953B', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 3.84, 
    elevation: 5 
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontWeight: '600', 
    fontSize: 16 
  },
  forgotPasswordContainer: { 
    marginTop: 16 
  },
  forgotPasswordText: { 
    textAlign: 'center', 
    color: '#000000', 
    fontSize: 14, 
    lineHeight: 20 
  },
  contactAdminText: { 
    color: '#CE0E2D', 
    fontWeight: '600' 
  },
});