import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, addDoc } from "firebase/firestore";

import { useAuth } from "@/src/auth";
import { theme } from "@/src/theme";
import { t } from "@/src/i18n";
import { db } from "@/src/firebase";

export default function NewPlot() {
  const { language, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [area, setArea] = useState("1");
  const [village, setVillage] = useState("Anekal");
  const [lat, setLat] = useState("12.7089");
  const [lng, setLng] = useState("77.6968");
  const [busy, setBusy] = useState(false);
  const [waterRegime, setWaterRegime] = useState("Rainfed");
  const [sowingDate, setSowingDate] = useState("");
  const [variety, setVariety] = useState("");
  const [manureAvailable, setManureAvailable] = useState(false);

  const useLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Location permission is required. You can also enter coordinates manually.");
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({});
      setLat(String(pos.coords.latitude.toFixed(4)));
      setLng(String(pos.coords.longitude.toFixed(4)));
    } catch (e) {
      Alert.alert("Failed to fetch location", "Please enter manually.");
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Enter a plot name");
      return;
    }
    if (!user) return;
    setBusy(true);
    try {
      await addDoc(collection(db, "plots"), {
        owner_id: user.id,
        name: name.trim(),
        crop: "Ragi",
        area_acres: Number(area) || 1,
        latitude: Number(lat) || 12.7089,
        longitude: Number(lng) || 77.6968,
        village,
        water_regime: waterRegime,
        sowing_date: sowingDate || null,
        variety: variety || null,
        manure_available: manureAvailable,
        region: "Karnataka",
        created_at: new Date().toISOString(),
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: theme.color.surface }}>
      <View style={[styles.hdr, { paddingTop: insets.top + 12 }]}>
        <Pressable testID="close-btn" style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={26} color={theme.color.onSurface} />
        </Pressable>
        <Text style={styles.hdrTitle}>{t("addPlot", language)}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.md, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>{t("plotName", language)}</Text>
        <TextInput testID="plot-name" style={styles.input} value={name} onChangeText={setName} placeholder="North Ragi Field" placeholderTextColor="#8B968B" />

        <Text style={styles.label}>{t("area", language)}</Text>
        <TextInput testID="plot-area" style={styles.input} value={area} onChangeText={setArea} keyboardType="numeric" placeholderTextColor="#8B968B" />

        <Text style={styles.label}>{t("village", language)}</Text>
        <TextInput testID="plot-village" style={styles.input} value={village} onChangeText={setVillage} placeholderTextColor="#8B968B" />

        <Text style={styles.label}>Water regime</Text>
        <View style={{ flexDirection: "row", gap: 12 }}><Pressable style={[styles.choice, waterRegime === "Rainfed" && styles.choiceActive]} onPress={() => setWaterRegime("Rainfed")}><Text>Rainfed</Text></Pressable><Pressable style={[styles.choice, waterRegime === "Irrigated" && styles.choiceActive]} onPress={() => setWaterRegime("Irrigated")}><Text>Irrigated</Text></Pressable></View>
        <Text style={styles.label}>Sowing date (YYYY-MM-DD, optional)</Text>
        <TextInput style={styles.input} value={sowingDate} onChangeText={setSowingDate} placeholder="2026-07-20" placeholderTextColor="#8B968B" />
        <Text style={styles.label}>Ragi variety (optional)</Text>
        <TextInput style={styles.input} value={variety} onChangeText={setVariety} placeholder="e.g. GPU 28" placeholderTextColor="#8B968B" />
        <Pressable style={[styles.choice, manureAvailable && styles.choiceActive]} onPress={() => setManureAvailable(!manureAvailable)}><Text>FYM / compost available</Text></Pressable>

        <Text style={styles.label}>Latitude</Text>
        <TextInput testID="plot-lat" style={styles.input} value={lat} onChangeText={setLat} keyboardType="numeric" placeholderTextColor="#8B968B" />

        <Text style={styles.label}>Longitude</Text>
        <TextInput testID="plot-lng" style={styles.input} value={lng} onChangeText={setLng} keyboardType="numeric" placeholderTextColor="#8B968B" />

        <Pressable testID="use-location" style={styles.secondary} onPress={useLocation}>
          <MaterialCommunityIcons name="crosshairs-gps" size={22} color={theme.color.brandPrimary} />
          <Text style={styles.secondaryLabel}>{t("useMyLocation", language)}</Text>
        </Pressable>

        <Pressable testID="save-plot" style={styles.primary} disabled={busy} onPress={save}>
          <Text style={styles.primaryLabel}>{busy ? "..." : t("save", language)}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hdr: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md },
  hdrTitle: { flex: 1, textAlign: "center", fontSize: theme.font.xl, fontWeight: "700", color: theme.color.onSurface },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  label: { fontSize: theme.font.base, fontWeight: "600", color: theme.color.onSurfaceTertiary },
  input: { minHeight: 56, borderRadius: theme.radius.md, borderWidth: 1.5, borderColor: theme.color.border, backgroundColor: theme.color.surfaceSecondary, paddingHorizontal: theme.spacing.lg, fontSize: theme.font.lg, color: theme.color.onSurface },
  primary: { minHeight: 56, borderRadius: theme.radius.md, backgroundColor: theme.color.brandPrimary, alignItems: "center", justifyContent: "center", marginTop: theme.spacing.md },
  primaryLabel: { color: "#fff", fontSize: theme.font.lg, fontWeight: "700" },
  secondary: { minHeight: 56, borderRadius: theme.radius.md, borderWidth: 1.5, borderColor: theme.color.brandPrimary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  secondaryLabel: { color: theme.color.brandPrimary, fontSize: theme.font.lg, fontWeight: "700" },
  choice: { flex: 1, minHeight: 46, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.borderStrong, justifyContent: "center", alignItems: "center", backgroundColor: theme.color.surfaceSecondary },
  choiceActive: { borderColor: theme.color.brandPrimary, backgroundColor: theme.color.brandTertiary },
});
