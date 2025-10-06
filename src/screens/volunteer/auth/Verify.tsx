import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { supabase } from "@/services/supabase";

export default function Verify() {
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const email = params?.email as string;

  const resend = async () => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) Alert.alert("No se pudo reenviar", error.message);
    else Alert.alert("Enviado", "Revisa nuevamente tu correo.");
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Confirma tu cuenta</Text>
      <Text>
        Revisa el correo que enviamos a {email} y toca el enlace para confirmar.
      </Text>

      <TouchableOpacity onPress={() => nav.navigate("Login")}>
        <Text style={{ textAlign: "center", marginTop: 8 }}>
          Ya confirmé, ir a iniciar sesión
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={resend}>
        <Text style={{ textAlign: "center", marginTop: 8 }}>Reenviar correo</Text>
      </TouchableOpacity>
    </View>
  );
}
