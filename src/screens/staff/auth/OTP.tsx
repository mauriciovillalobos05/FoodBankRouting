import React, { useState } from "react";
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
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    onChange(cleaned);
    if (cleaned.length === 4) {
      onComplete?.(cleaned);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={4}
        placeholder="----"
        style={styles.input}
        textContentType="oneTimeCode"
        autoFocus
      />
    </View>
  );
}

export default function Confirmacion({ navigation, route }: NativeStackScreenProps<any>) {
  // obtener email pasado desde la pantalla anterior: navigation.navigate('Confirmacion', { email })
  const email = route?.params?.email as string | undefined;
  const [codigo, setCodigo] = useState("");

  const handleContinue = async () => {
    if (!email) {
      Alert.alert("Error", "No se encontró el email. Vuelve a intentarlo.");
      return;
    }

    if (codigo.length < 4) {
      Alert.alert("Error", "Debes ingresar los 4 dígitos.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email, // email inicializado desde route.params
        token: codigo,
        type: "email",
      });

      if (error) throw error;

      Alert.alert("Éxito", "Código verificado correctamente ✅");
      console.log("Sesión:", data.session);
      navigation.navigate("Root");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Número de confirmación</Text>
      <OTP 
        value={codigo}
        onChange={setCodigo}
        onComplete={(val) => {console.log("Código completo:", val);}}
      />
      <Button title="Continuar" onPress={handleContinue} disabled={codigo.length < 4} />
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
    width: 180,
    fontSize: 28,
    letterSpacing: 12,
    textAlign: "center",
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  hint: { marginTop: 8, color: "#666" },
});