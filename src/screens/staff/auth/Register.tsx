import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "@/services/supabase";
import { useNavigation } from "@react-navigation/native";

export default function Register() {
  const nav = useNavigation<any>();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    try {
      setLoading(true);

      // crear el perfil con metadata y trigger de email
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;

      // pantalla de verificación
      nav.navigate("Verify", { email: email.trim() });
    } catch (e: any) {
      Alert.alert("No se pudo registrar", e.message ?? "Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>Crear cuenta</Text>

      <TextInput
        placeholder="Nombre completo"
        value={fullName}
        onChangeText={setFullName}
        style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}
      />
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
        onPress={onRegister}
        disabled={loading}
        style={{
          backgroundColor: "#2563eb",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "600" }}>Crear cuenta</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
