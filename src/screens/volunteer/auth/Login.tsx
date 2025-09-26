import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/services/supabase";
import * as Linking from "expo-linking";

export default function Login() {
  const nav = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (!error) {
        nav.replace("Profile");
        return;
      }
      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("confirm")) {
          Alert.alert(
            "Confirma tu correo",
            "Abre el enlace del email y luego vuelve a iniciar sesión."
          );
          return;
        }
        throw error;
      }
      // redirect con onAuthStateChange
    } catch (e: any) {
      const msg = (e?.message || "").toLowerCase();
      if (msg.includes("invalid login") || msg.includes("invalid_grant")) {
        Alert.alert("Credenciales inválidas", "Revisa tu correo y contraseña.");
      } else {
        Alert.alert("Error al iniciar sesión", e?.message ?? "Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // reset password (incoming)
  // const onForgot = async () => {
  //   if (!email) return Alert.alert("Recuperar contraseña", "Ingresa tu correo primero.");
  //   const redirectTo = Linking.createURL("/auth-callback");
  //   const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
  //     redirectTo,
  //   });
  //   if (error) {
  //     Alert.alert("No se pudo enviar el correo", error.message);
  //   } else {
  //     Alert.alert(
  //       "Revisa tu correo",
  //       "Te enviamos un enlace para restablecer tu contraseña."
  //     );
  //   }
  // };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Bienvenido</Text>
      <Text style={{ opacity: 0.7 }}>Inicia sesión para continuar</Text>

      <TextInput
        placeholder="Correo"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}
      />
      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}
      />

      <TouchableOpacity
        onPress={onLogin}
        disabled={loading}
        style={{
          backgroundColor: "#16a34a",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "600" }}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => nav.navigate("Register")}>
        <Text style={{ textAlign: "center" }}>
          ¿No tienes cuenta? <Text style={{ fontWeight: "700" }}>Regístrate</Text>
        </Text>
      </TouchableOpacity>

      {/* <TouchableOpacity onPress={onForgot}> */}
        <Text style={{ textAlign: "center", marginTop: 8 }}>
          ¿Olvidaste tu contraseña?
        </Text>
      {/* </TouchableOpacity> */}
    </View>
  );
}
