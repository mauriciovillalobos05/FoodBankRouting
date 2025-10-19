import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Alert, 
  TouchableOpacity,
  ActivityIndicator,
  Image
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "@/services/supabase";

function OTP({
  value,
  onChange,
  onComplete,
}: {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => void;
}) {
  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 6);
    onChange(cleaned);
    if (cleaned.length === 6) {
      onComplete?.(cleaned);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="------"
        style={styles.input}
        textContentType="oneTimeCode"
        autoFocus
      />
      <Text style={styles.hint}>Ingresa el código de 6 dígitos</Text>
    </View>
  );
}

export default function Confirmacion({ navigation, route }: NativeStackScreenProps<any>) {
  const [email, setEmail] = useState<string | undefined>(route?.params?.email as string | undefined);
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleContinue = async () => {
    if (!email) {
      Alert.alert("Error", "No se encontró el email. Vuelve a iniciar sesión.");
      navigation.goBack();
      return;
    }
    
    if (codigo.length < 6) {
      Alert.alert("Error", "Debes ingresar los 6 dígitos del código.");
      return;
    }

    try {
      setLoading(true);
      console.log("🔐 Verificando código OTP para:", email);
      
      // Verificar el código OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: codigo,
        type: "email",
      });

      if (error) {
        console.error("❌ Error al verificar OTP:", error);
        throw error;
      }

      if (!data?.session) {
        throw new Error("No se pudo crear la sesión");
      }

      console.log("✅ Código verificado correctamente");
      
      // Obtener el rol del usuario
      const userId = data.session.user.id;
      console.log("🔍 Obteniendo rol del usuario:", userId);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError) {
        console.warn("⚠️ No se pudo obtener el rol:", userError);
        // Si no hay rol, ir a Root por defecto
        navigation.reset({
          index: 0,
          routes: [{ name: 'Root' }],
        });
        return;
      }

      const userRole = userData?.role;
      console.log("👤 Rol del usuario:", userRole);

      // Redirigir según el rol
      switch (userRole) {
        case 'admin':
          console.log("🔑 Redirigiendo a admin...");
          navigation.reset({
            index: 0,
            routes: [{ name: 'Root' }], // O la pantalla específica de admin
          });
          break;
        
        case 'staff':
          console.log("👨‍💼 Redirigiendo a staff...");
          navigation.reset({
            index: 0,
            routes: [{ name: 'Root' }],
          });
          break;
        
        case 'volunteer':
          console.log("🙋 Redirigiendo a volunteer...");
          navigation.reset({
            index: 0,
            routes: [{ name: 'Root' }],
          });
          break;
        
        default:
          console.log("📱 Redirigiendo a pantalla por defecto...");
          navigation.reset({
            index: 0,
            routes: [{ name: 'Root' }],
          });
      }

    } catch (err: any) {
      console.error("❌ Error en verificación:", err);
      const message = err?.message || String(err);
      if (message.toLowerCase().includes("invalid") || message.toLowerCase().includes("expired")) {
        Alert.alert(
          "Código inválido",
          "El código ingresado es inválido o ha expirado. Por favor solicita uno nuevo.",
          [
            { text: "Solicitar nuevo código", onPress: handleResend },
            { text: "Cancelar", style: "cancel" }
          ]
        );
      } else {
        Alert.alert("Error", message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert("Error", "No se encontró el email.");
      return;
    }

    try {
      setResendLoading(true);
      console.log("📧 Reenviando código OTP a:", email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) {
        throw error;
      }

      Alert.alert("Código enviado", "Se ha enviado un nuevo código a tu correo.");
      setCodigo(""); // Limpiar el código anterior
    } catch (err: any) {
      console.error("❌ Error al reenviar código:", err);
      Alert.alert("Error", err?.message ?? "No se pudo enviar el código.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/full_logo_bda.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Verificación de código</Text>
      <Text style={styles.subtitle}>
        Hemos enviado un código de 6 dígitos a:{'\n'}
        <Text style={styles.emailText}>{email}</Text>
      </Text>

      <OTP 
        value={codigo}
        onChange={setCodigo}
        onComplete={(val) => {
          console.log("✅ Código completo ingresado:", val);
        }}
      />

      <TouchableOpacity
        onPress={handleContinue}
        disabled={codigo.length < 6 || loading}
        style={[
          styles.continueButton,
          (codigo.length < 6 || loading) && styles.continueButtonDisabled
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.continueButtonText}>Verificar código</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleResend}
        disabled={resendLoading}
        style={styles.resendButton}
      >
        {resendLoading ? (
          <ActivityIndicator size="small" color="#CE0E2D" />
        ) : (
          <Text style={styles.resendText}>
            ¿No recibiste el código?{' '}
            <Text style={styles.resendLink}>Reenviar</Text>
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#222',
    marginTop: -2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 180,
    height: 120,
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginBottom: 12,
    color: '#CE0E2D',
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 15, 
    color: "#666", 
    marginBottom: 30, 
    textAlign: "center",
    lineHeight: 22,
  },
  emailText: {
    color: '#222',
    fontWeight: '600',
  },
  inputContainer: { 
    alignItems: "center", 
    marginBottom: 30,
  },
  input: {
    width: 240,
    fontSize: 32,
    letterSpacing: 16,
    textAlign: "center",
    padding: 16,
    borderWidth: 2,
    borderColor: '#5C5C60',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    color: '#222',
    fontWeight: '600',
  },
  hint: { 
    marginTop: 12, 
    color: "#999",
    fontSize: 13,
  },
  continueButton: {
    backgroundColor: '#00953B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00953B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  resendButton: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  resendLink: {
    color: '#CE0E2D',
    fontWeight: '600',
  },
});