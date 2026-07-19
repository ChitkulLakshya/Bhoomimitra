import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { theme, IMAGES } from "@/src/theme";
import { t } from "@/src/i18n";

type Lab = { id: string; name: string; type?: string; specialty?: string; address: string; phone: string; latitude: number; longitude: number; hours: string; distance_km?: number };

const ANEKAL = { lat: 12.7089, lng: 77.6968 };

type Tab = "labs" | "shops";

export default function MapScreen() {
  const { api, language } = useAuth();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("labs");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (tab === "labs") {
          const data = await api(`/directory/labs?lat=${ANEKAL.lat}&lng=${ANEKAL.lng}`);
          setItems(data);
        } else {
          const data = await api(`/directory/shops?lat=${ANEKAL.lat}&lng=${ANEKAL.lng}`);
          setItems(data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [tab]);

  const openMap = (lat: number, lng: number, label: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}(${encodeURIComponent(label)})`;
    Linking.openURL(url).catch(() => {});
  };

  const call = (phone: string) => Linking.openURL(`tel:${phone}`).catch(() => {});

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.surface }}>
      <View style={[styles.mapArea, { paddingTop: insets.top }]}>
        <Image source={{ uri: IMAGES.mapAerial }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.mapOverlay}>
          <View style={styles.tabsRow}>
            <TabBtn testID="tab-labs" active={tab === "labs"} label={t("labs", language)} icon="flask" onPress={() => setTab("labs")} />
            <TabBtn testID="tab-shops" active={tab === "shops"} label={t("shops", language)} icon="storefront" onPress={() => setTab("shops")} />
          </View>
          <View style={styles.pinsWrap}>
            {items.slice(0, 6).map((it, i) => (
              <View key={i} style={[styles.pin, { top: 40 + (i % 3) * 40, left: 30 + i * 42 }]}>
                <MaterialCommunityIcons name="map-marker" size={32} color={theme.color.error} />
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.sheetGrip} />
        <Text style={styles.sheetTitle}>
          {tab === "labs" ? t("labs", language) : t("shops", language)}
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 30 }} color={theme.color.brandPrimary} />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {items.length === 0 && <Text style={styles.empty}>No results.</Text>}
            {items.map((it: Lab) => (
              <View key={it.id} style={styles.card} testID={`dir-${it.id}`}>
                <MaterialCommunityIcons name={tab === "labs" ? "flask" : "storefront"} size={32} color={theme.color.brandPrimary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  <Text style={styles.itemSub}>{it.address}</Text>
                  <Text style={styles.itemMeta}>{it.specialty || it.type} · {it.hours}</Text>
                  {it.distance_km !== undefined && (
                    <Text style={styles.distance}>{it.distance_km} {t("km", language)}</Text>
                  )}
                </View>
                <View style={{ gap: 6 }}>
                  <Pressable testID={`nav-${it.id}`} style={styles.iconBtn} onPress={() => openMap(it.latitude, it.longitude, it.name)}>
                    <MaterialCommunityIcons name="directions" size={22} color="#fff" />
                  </Pressable>
                  <Pressable testID={`call-${it.id}`} style={[styles.iconBtn, { backgroundColor: theme.color.brandSecondary }]} onPress={() => call(it.phone)}>
                    <MaterialCommunityIcons name="phone" size={22} color="#fff" />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const TabBtn: React.FC<{ active: boolean; label: string; icon: any; onPress: () => void; testID?: string }> = ({ active, label, icon, onPress, testID }) => (
  <Pressable testID={testID} onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
    <MaterialCommunityIcons name={icon} size={18} color={active ? "#fff" : theme.color.onSurface} />
    <Text style={[styles.tabLabel, active && { color: "#fff" }]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  mapArea: { height: 320, position: "relative" },
  mapOverlay: { flex: 1, backgroundColor: "rgba(45,51,42,0.25)", padding: theme.spacing.lg },
  tabsRow: { flexDirection: "row", gap: 6, backgroundColor: "rgba(255,255,255,0.95)", padding: 4, borderRadius: theme.radius.pill, alignSelf: "center" },
  tabBtn: { flexDirection: "row", gap: 4, alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.pill, minHeight: 40 },
  tabBtnActive: { backgroundColor: theme.color.brandPrimary },
  tabLabel: { color: theme.color.onSurface, fontWeight: "700", fontSize: 12 },
  pinsWrap: { flex: 1, position: "relative" },
  pin: { position: "absolute" },
  sheet: { flex: 1, backgroundColor: theme.color.surfaceSecondary, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.lg },
  sheetGrip: { width: 40, height: 4, backgroundColor: theme.color.borderStrong, borderRadius: 2, alignSelf: "center", marginBottom: theme.spacing.md },
  sheetTitle: { fontSize: theme.font.xl, fontWeight: "700", color: theme.color.onSurface, marginBottom: theme.spacing.md },
  empty: { color: theme.color.onSurfaceTertiary, textAlign: "center", marginTop: 20 },
  card: { flexDirection: "row", alignItems: "center", padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.color.surface, marginBottom: 10, borderWidth: 1, borderColor: theme.color.border },
  itemName: { fontSize: theme.font.lg, fontWeight: "700", color: theme.color.onSurface },
  itemSub: { fontSize: theme.font.sm, color: theme.color.onSurfaceTertiary, marginTop: 2 },
  itemMeta: { fontSize: 11, color: theme.color.onSurfaceTertiary, marginTop: 2 },
  distance: { fontSize: theme.font.sm, color: theme.color.brandPrimary, fontWeight: "700", marginTop: 4 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.color.brandPrimary, alignItems: "center", justifyContent: "center" },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: theme.font.lg },
});
