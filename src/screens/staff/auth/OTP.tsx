import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, TextInput, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../../../lib/supabaseClient";


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
    // permitir solo números y hasta 6 dígitos
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
    </View>
  );
}

export default function Confirmacion({ navigation, route }: NativeStackScreenProps<any>) {
  // fallback a route.params.email si existe
  const [email, setEmail] = useState<string | undefined>(route?.params?.email as string | undefined);
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    // Solo chequeamos si existe una sesión activa (no obliga al flujo OTP)
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.log("supabase.auth.getSession error:", error);
        }
        const session = data?.session;
        if (session?.user?.email) {
          setEmail(session.user.email);
          console.log("Email desde sesión:", session.user.email);
        } else {
          console.log("Sin sesión activa, usando route.params.email:", route?.params?.email);
        }
      } catch (err) {
        console.log("Error checking session:", err);
      }
    };
    checkSession();
  }, [route?.params]);

  const handleContinue = async () => {
    if (!email) {
      Alert.alert("Error", "No se encontró el email. Vuelve a intentar o inicia sesión.");
      return;
    }
    if (codigo.length < 6) {
      Alert.alert("Error", "Debes ingresar los 6 dígitos del código.");
      return;
    }
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: codigo,
        type: "email",
      });
      console.log("verifyOtp result:", { data, error });
      if (error) throw error;
      // data.session debe existir ahora
      console.log("Sesión creada:", data?.session ?? null);
      Alert.alert("Éxito", "Código verificado correctamente");
      navigation.navigate("Root");
    } catch (err: any) {
      console.log("verifyOtp error:", err);
      Alert.alert("Error", err?.message ?? String(err));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Número de confirmación</Text>
      <Text style={styles.subtitle}>{email ? `Email: ${email}` : "No se recibió email"}</Text>
      <OTP 
        value={codigo}
        onChange={setCodigo}
        onComplete={(val) => {console.log("Código completo:", val);}}
      />
      <Button title="Continuar" onPress={handleContinue} disabled={codigo.length < 6} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20, textAlign: "center" },
  inputContainer: { alignItems: "center", marginBottom: 20 },
  input: {
    width: 220,
    fontSize: 28,
    letterSpacing: 10,
    textAlign: "center",
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  hint: { marginTop: 8, color: "#666" },
});