import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,  
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase, safeLogError } from "@/services/supabase";
import { cacheUserProfile, getCachedUserProfile } from "@/services/userCache";
import { useNavigation } from "@react-navigation/native";

type Route = {
  id: string;
  name?: string;
  description?: string;
  route_date?: string;
  start_time?: string | null;
  end_time?: string | null;
  status?: "Pendiente" | "En curso" | "Finalizada";
  participant_id?: string | null;
};

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Usuario");
  const [userRoutes, setUserRoutes] = useState<Route[]>([]);
  // Uso tipado relajado para evitar problemas con navegación anidada
  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Primero intenta leer del caché
      const cached = await getCachedUserProfile();
      if (cached) setUserName(cached.full_name || "Usuario");

      // Obtener usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw userError;

      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      setUserName(profile.full_name || "Usuario");

      await cacheUserProfile({
        id: profile.id,
        full_name: profile.full_name,
        email: user.email || "",
      });

      // Obtener rutas asignadas
      const { data: routeParticipants, error: routesError } = await supabase
        .from("route_participants")
        .select(
          `
          id,
          user_id,
          assigned_at,
          routes (
            id,
            name,
            description,
            route_date,
            start_time,
            end_time
          )
        `
        )
        .eq("user_id", user.id);

      if (routesError) throw routesError;

      const processedRoutes: Route[] =
        routeParticipants?.flatMap((rp: any) => {
          const route = rp.routes;
          if (!route) return [];
          let status: Route["status"] = "Pendiente";
          if (route.end_time) status = "Finalizada";
          else if (route.start_time) status = "En curso";

          return [
            {
              id: route.id,
              name: route.name,
              description: route.description,
              route_date: route.route_date,
              start_time: route.start_time,
              end_time: route.end_time,
              status,
              participant_id: rp.id,
            },
          ];
        }) || [];

      setUserRoutes(processedRoutes);
    } catch (error) {
      safeLogError("Error fetching user profile or routes", error);
    } finally {
      setLoading(false);
    }
  };

  // Maneja navegación a RouteConfirm dentro del HomeStack (anidado en la tab "Home")
  const goToRouteConfirm = (route: Route) => {
    // Navegación hacia el stack anidado: Tab 'Home' -> HomeStack -> RouteConfirm
    // Si Profile se muestra desde HomeStack directamente, esto también funcionará porque
    // React Navigation resolverá la ruta anidada. Hacemos cast a any para evitar error TS en la llamada.
    (navigation as any).navigate("Home", {
      screen: "RouteConfirm",
      params: {
        id: route.id,
        location: route.name,
        status: route.status,
        participant_id: route.participant_id || undefined,
      },
    });
  };

  const renderRoutes = () => {
    if (loading) {
      return (
        <View style={styles.servicesCard}>
          <ActivityIndicator size="large" color="#5050FF" />
        </View>
      );
    }

    if (userRoutes.length === 0) {
      return (
        <View style={styles.servicesCard}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No tienes rutas asignadas</Text>
        </View>
      );
    }

    return (
      <View style={styles.routesContainer}>
        {userRoutes.map((route) => (
          <TouchableOpacity
            key={route.id}
            style={styles.routeCard}
            onPress={() => goToRouteConfirm(route)}
          >
            <View style={styles.routeIconContainer}>
              <Text style={styles.routeIcon}>🚐</Text>
            </View>

            <View style={styles.routeInfo}>
              <Text style={styles.routeName}>
                {route.name || "Ruta sin nombre"}
              </Text>

              {route.route_date && (
                <Text style={styles.routeDate}>
                  {new Date(route.route_date).toLocaleDateString("es-MX")}
                </Text>
              )}

              {route.status && (
                <Text
                  style={[
                    styles.routeStatus,
                    route.status === "Finalizada"
                      ? { color: "#00953B" }
                      : route.status === "En curso"
                      ? { color: "#F5A800" }
                      : { color: "#5C5C60" },
                  ]}
                >
                  {route.status}
                </Text>
              )}
            </View>

            <Text style={styles.routeArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header con avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>
                  <Image
                    source={require("../../../assets/profile_off_icon.png")}
                    style={styles.avatar}
                  />
                </Text>
              </View>
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#5050FF"
                  style={styles.nameLoader}
                />
              ) : (
                <Text style={styles.userName}>{userName}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Image
              source={require("../../../assets/conf_icon.png")}
              style={styles.confIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Sección de rutas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis rutas asignadas</Text>
          {renderRoutes()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 🎨 ESTILOS (idénticos a los tuyos)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 30,
    paddingBottom: 30,
  },
  avatarContainer: { flex: 1 },
  avatarWrapper: { alignItems: "flex-start" },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8E3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 36,
  },
  userName: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  nameLoader: { marginTop: 12 },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  confIcon: { width: 22, height: 22, tintColor: "#5050FF" },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
    textAlign: "left",
  },
  servicesCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    minHeight: 120,
  },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 14, color: "#666666", marginTop: 8 },
  routesContainer: { gap: 12 },
  routeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  routeIcon: { fontSize: 22 },
  routeInfo: { flex: 1 },
  routeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  routeDate: { fontSize: 12, color: "#666" },
  routeStatus: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  routeArrow: { fontSize: 22, color: "#999" },
});

export default Profile;