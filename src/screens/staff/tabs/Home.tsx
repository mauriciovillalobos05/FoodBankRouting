import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase, safeLogError } from "@/services/supabase";
import { 
  cacheRoutesData, 
  getCachedRoutesData,
  RouteWithStatus 
} from "@/services/routesCache";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type HomeStackParamList = {
  HomeMain: undefined;
  RouteConfirm:
    | {
        id?: string;
        location?: string;
        status?: "Pendiente" | "En curso" | "Finalizada";
        participant_id?: string;
      }
    | undefined;
};

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, "HomeMain">;

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allRoutes, setAllRoutes] = useState<RouteWithStatus[]>([]);
  const [stats, setStats] = useState({
    totalRutasHoy: 0,
    rutasCompletadas: 0,
    rutasSinFinalizar: 0,
  });

  const navigation = useNavigation<NavigationProp>();

  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0]; // Returns HH:MM:SS
  };

  useEffect(() => {
    loadRoutesData();
  }, []);

  const loadRoutesData = async () => {
    try {
      const cached = await getCachedRoutesData();
      if (cached) {
        console.log("Loading from cache:", cached.routes.length, "routes");
        setAllRoutes(cached.routes || []);
        setStats(cached.stats);
        setLoading(false);
        // Fetch fresh data in background
        fetchRoutesData(false);
        return;
      }
      await fetchRoutesData(true);
    } catch (error) {
      safeLogError("Error loading routes data", error);
      setLoading(false);
    }
  };

  const fetchRoutesData = async (showLoading: boolean = true) => {
    try {
      if (showLoading) setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw userError;
      }

      const today = getTodayDate();
      const currentTime = getCurrentTime();

      console.log("Fetching routes for:", today, "current time:", currentTime);

      // 1. Fetch FINALIZADAS (any date, with end_time < current time)
      const { data: finalizadasData, error: finalizadasError } = await supabase
        .from("routes")
        .select(
          `
          id, 
          name, 
          description, 
          route_date, 
          start_time, 
          end_time,
          route_participants (
            id,
            user_id,
            assigned_at
          )
        `
        )
        .not("end_time", "is", null)
        .order("route_date", { ascending: false })
        .order("end_time", { ascending: false })
        .limit(20);

      if (finalizadasError) {
        console.error("Error fetching finalizadas:", finalizadasError);
      }

      console.log("Finalizadas raw data:", finalizadasData?.length || 0);

      // 2. Fetch EN CURSO (today's routes with start_time set, no end_time)
      const { data: enCursoData, error: enCursoError } = await supabase
        .from("routes")
        .select(
          `
          id, 
          name, 
          description, 
          route_date, 
          start_time, 
          end_time,
          route_participants (
            id,
            user_id,
            assigned_at
          )
        `
        )
        .eq("route_date", today)
        .not("start_time", "is", null)
        .is("end_time", null);

      if (enCursoError) {
        console.error("Error fetching en curso:", enCursoError);
      }

      console.log("En curso raw data:", enCursoData?.length || 0);

      // 3. Fetch PENDIENTES (today's routes with available slots)
      const { data: pendientesData, error: pendientesError } = await supabase
        .from("routes")
        .select(
          `
          id, 
          name, 
          description, 
          route_date, 
          start_time, 
          end_time,
          route_participants (
            id,
            user_id,
            assigned_at
          )
        `
        )
        .eq("route_date", today)
        .is("start_time", null)
        .is("end_time", null);

      if (pendientesError) {
        console.error("Error fetching pendientes:", pendientesError);
      }

      console.log("Pendientes raw data:", pendientesData?.length || 0);

      const processed: RouteWithStatus[] = [];

      // Process FINALIZADAS
      (finalizadasData || []).forEach((route: any) => {
        const participants = Array.isArray(route.route_participants)
          ? route.route_participants
          : [];

        const userParticipant = participants.find(
          (p: any) => p.user_id === user.id
        );

        if (userParticipant && route.end_time) {
          processed.push({
            id: route.id,
            name: route.name,
            description: route.description,
            route_date: route.route_date,
            start_time: route.start_time || undefined,
            end_time: route.end_time || undefined,
            status: "Finalizada",
            participants: participants.map((p: any) => ({
              id: p.id,
              user_id: p.user_id,
              assigned_at: p.assigned_at,
            })),
          });
        }
      });

      // Process EN CURSO
      (enCursoData || []).forEach((route: any) => {
        const participants = Array.isArray(route.route_participants)
          ? route.route_participants
          : [];

        const userParticipant = participants.find(
          (p: any) => p.user_id === user.id
        );

        if (userParticipant) {
          processed.push({
            id: route.id,
            name: route.name,
            description: route.description,
            route_date: route.route_date,
            start_time: route.start_time || undefined,
            end_time: route.end_time || undefined,
            status: "En curso",
            participants: participants.map((p: any) => ({
              id: p.id,
              user_id: p.user_id,
              assigned_at: p.assigned_at,
            })),
          });
        }
      });

      // Process PENDIENTES
      (pendientesData || []).forEach((route: any) => {
        const participants = Array.isArray(route.route_participants)
          ? route.route_participants
          : [];

        const userParticipant = participants.find(
          (p: any) => p.user_id === user.id
        );

        const availableSlots = participants.filter(
          (p: any) => p.user_id === null
        );

        // Show if user has available slot OR if user is already assigned but route hasn't started
        if (availableSlots.length > 0 || (userParticipant && !route.start_time)) {
          processed.push({
            id: route.id,
            name: route.name,
            description: route.description,
            route_date: route.route_date,
            start_time: route.start_time || undefined,
            end_time: route.end_time || undefined,
            status: "Pendiente",
            participants: participants.map((p: any) => ({
              id: p.id,
              user_id: p.user_id,
              assigned_at: p.assigned_at,
            })),
          });
        }
      });

      console.log("Processed routes total:", processed.length);
      console.log("Finalizadas:", processed.filter(r => r.status === "Finalizada").length);
      console.log("En curso:", processed.filter(r => r.status === "En curso").length);
      console.log("Pendientes:", processed.filter(r => r.status === "Pendiente").length);

      // Calculate stats - include ALL finalizadas (any date), but only today's en curso
      const rutasCompletadas = processed.filter(
        (r) => r.status === "Finalizada"
      ).length;
      const rutasSinFinalizar = processed.filter(
        (r) => r.status === "En curso"
      ).length;
      
      // Total rutas hoy = only today's routes that are en curso or finalizada
      const todayRoutes = processed.filter(r => r.route_date === today);
      const totalRutasHoy = todayRoutes.filter(
        (r) => r.status === "En curso" || r.status === "Finalizada"
      ).length;

      const newStats = {
        totalRutasHoy,
        rutasCompletadas,
        rutasSinFinalizar,
      };

      console.log("Stats calculated:");
      console.log("- Total rutas hoy:", totalRutasHoy);
      console.log("- Rutas completadas (all time):", rutasCompletadas);
      console.log("- Rutas sin finalizar (today):", rutasSinFinalizar);

      setAllRoutes(processed);
      setStats(newStats);

      // Cache the results
      await cacheRoutesData({
        routes: processed,
        stats: newStats,
        timestamp: Date.now(),
      });
    } catch (error) {
      safeLogError("Error in fetchRoutesData", error);
      console.error("Full error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutesData(false);
  };

  const handleRegistrarseRuta = async (route: RouteWithStatus) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      
      if (userError || !user) throw userError;

      // Find an available participant slot
      const availableSlot = route.participants?.find(
        (p) => p.user_id === null
      );

      if (!availableSlot) {
        console.error("No available slots for this route");
        return;
      }

      const { error } = await supabase
        .from("route_participants")
        .update({ user_id: user.id })
        .eq("id", availableSlot.id);

      if (error) throw error;
      
      console.log("Successfully registered for route");
      // Refresh data after registration
      fetchRoutesData(false);
    } catch (error) {
      safeLogError("Error registering for route", error);
    }
  };

  const renderStatsCard = (title: string, value: number, color: string) => (
    <View style={[styles.statsCard, { backgroundColor: color }]}>
      <Text style={styles.statsTitle}>{title}</Text>
      <Text style={styles.statsValue}>{value}</Text>
    </View>
  );

  const renderRouteItem = (ruta: RouteWithStatus) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "Pendiente":
          return "#5C5C60";
        case "En curso":
          return "#F5A800";
        case "Finalizada":
          return "#00953B";
        default:
          return "#5C5C60";
      }
    };

    const getActionButton = () => {
      if (ruta.status === "Pendiente") {
        const userParticipant = ruta.participants?.find(
          (p) => p.user_id !== null
        );
        
      }
      return null;
    };

    // Get participant_id for navigation
    const participantId = ruta.participants?.find(
      (p) => p.user_id !== null
    )?.id || ruta.participants?.[0]?.id;

    return (
      <View key={ruta.id} style={styles.routeItem}>
        <Text
          style={[styles.routeStatus, { color: getStatusColor(ruta.status) }]}
        >
          {ruta.status}
        </Text>
        <View style={styles.routeLocationContainer}>
          <Image
            source={require("../../../assets/location_icon.png")}
            style={styles.locationIcon}
          />
          <Text style={styles.routeLocation}>{ruta.name}</Text>
        </View>
        {ruta.description && (
          <Text style={styles.routeDescription}>{ruta.description}</Text>
        )}
        {ruta.start_time && (
          <Text style={styles.routeTime}>
            🕐 {ruta.start_time.slice(0, 5)}
            {ruta.end_time && ` - ${ruta.end_time.slice(0, 5)}`}
          </Text>
        )}
        <View style={styles.routeActions}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() =>
              navigation.navigate("RouteConfirm", {
                id: String(ruta.id),
                location: ruta.name,
                status: ruta.status,
                participant_id: participantId,
              })
            }
          >
            <Text style={styles.detailsButtonText}>ver detalles</Text>
          </TouchableOpacity>
          {getActionButton()}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5050FF" />
          <Text style={styles.loadingText}>Cargando rutas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Panel Staff - Banco de Alimentos
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.mainStatsCard}>
            <Text style={styles.mainStatsTitle}>Total de rutas hoy</Text>
            <Text style={styles.mainStatsValue}>{stats.totalRutasHoy}</Text>
          </View>

          <View style={styles.statsRow}>
            {renderStatsCard(
              "Rutas completadas",
              stats.rutasCompletadas,
              "#E8F5E8"
            )}
            {renderStatsCard(
              "Rutas sin finalizar",
              stats.rutasSinFinalizar,
              "#FFF3E0"
            )}
          </View>
        </View>

        <View style={styles.routesContainer}>
          {allRoutes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay rutas disponibles</Text>
            </View>
          ) : (
            allRoutes.map(renderRouteItem)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#5C5C60" },
  header: { paddingVertical: 20, paddingHorizontal: 4, paddingTop: 40 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5C5C60",
    textAlign: "left",
  },
  statsContainer: { marginBottom: 24 },
  mainStatsCard: {
    backgroundColor: "#E8E3FF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  mainStatsTitle: {
    fontSize: 14,
    color: "#5050FF",
    marginBottom: 8,
    fontWeight: "500",
  },
  mainStatsValue: { fontSize: 48, fontWeight: "bold", color: "#000000" },
  statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  statsCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: "center" },
  statsTitle: {
    fontSize: 12,
    color: "#5050FF",
    marginBottom: 8,
    fontWeight: "500",
    textAlign: "center",
  },
  statsValue: { fontSize: 32, fontWeight: "bold", color: "#000000" },
  routesContainer: { marginBottom: 20 },
  routeItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routeStatus: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  routeLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationIcon: { width: 16, height: 16, marginRight: 6 },
  routeLocation: { fontSize: 14, color: "#000000", fontWeight: "500" },
  routeDescription: { fontSize: 13, color: "#5C5C60", marginBottom: 8 },
  routeTime: { fontSize: 12, color: "#666666", marginBottom: 12 },
  routeActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 8,
  },
  detailsButton: {
    backgroundColor: "#5050FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  detailsButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "500" },
  actionButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  actionButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "500" },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 16, color: "#5C5C60", textAlign: "center" },
});

export default Home;