import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { theme, IMAGES } from "@/src/theme";
import { t } from "@/src/i18n";

type Plot = {
  id: string;
  name: string;
  crop: string;
  area_acres: number;
  village?: string;
  latitude: number;
  longitude: number;
  latest_reading?: any;
};

const HEALTH_COLOR = (score: number) => {
  if (score >= 75) return theme.color.success;
  if (score >= 55) return theme.color.warning;
  return theme.color.error;
};

export default function Dashboard() {
  const { api, user, language } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api("/plots");
      setPlots(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalHealth =
    plots.length && plots.some((p) => p.latest_reading?.health_score)
      ? Math.round(
          plots.reduce((s, p) => s + (p.latest_reading?.health_score || 0), 0) /
            Math.max(1, plots.filter((p) => p.latest_reading).length)
        )
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.surface }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>{t("welcome", language)},</Text>
            <Text testID="user-name" style={styles.username}>{user?.name || "Farmer"}</Text>
          </View>
          <View style={styles.locChip}>
            <MaterialCommunityIcons name="map-marker" size={16} color={theme.color.brandPrimary} />
            <Text style={styles.locText}>Anekal</Text>
          </View>
        </View>

        {totalHealth !== null && (
          <View style={[styles.summaryCard, { borderColor: HEALTH_COLOR(totalHealth) }]} testID="overall-health">
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>{t("score", language)}</Text>
              <Text style={[styles.summaryValue, { color: HEALTH_COLOR(totalHealth) }]}>{totalHealth}<Text style={styles.summaryUnit}>/100</Text></Text>
              <Text style={styles.summarySub}>{plots.length} {plots.length === 1 ? "plot" : "plots"} tracked</Text>
            </View>
            <MaterialCommunityIcons name="sprout" size={64} color={HEALTH_COLOR(totalHealth)} />
          </View>
        )}

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>{t("yourPlots", language)}</Text>
          <Pressable
            testID="add-plot-btn"
            style={styles.addBtn}
            onPress={() => router.push("/plot/new")}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={styles.addBtnLabel}>{t("addPlot", language)}</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={theme.color.brandPrimary} size="large" />
        ) : plots.length === 0 ? (
          <View style={styles.empty} testID="empty-plots">
            <Image source={{ uri: IMAGES.emptySoil }} style={styles.emptyImg} contentFit="cover" />
            <Text style={styles.emptyText}>{t("noPlots", language)}</Text>
            <Pressable style={styles.primaryBtn} onPress={() => router.push("/plot/new")}>
              <Text style={styles.primaryBtnLabel}>{t("addFirst", language)}</Text>
            </Pressable>
          </View>
        ) : (
          plots.map((p) => (
            <Pressable
              key={p.id}
              testID={`plot-${p.id}`}
              onPress={() => router.push({ pathname: "/plot/[id]", params: { id: p.id } })}
              style={styles.plotCard}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.plotName}>{p.name}</Text>
                <Text style={styles.plotMeta}>{p.crop} · {p.area_acres} ac · {p.village}</Text>
                {p.latest_reading ? (
                  <View style={styles.plotChips}>
                    <Chip label={`pH ${p.latest_reading.ph}`} status={p.latest_reading.status?.ph} />
                    <Chip label={`N`} status={p.latest_reading.status?.nitrogen} />
                    <Chip label={`P`} status={p.latest_reading.status?.phosphorus} />
                    <Chip label={`K`} status={p.latest_reading.status?.potassium} />
                  </View>
                ) : (
                  <Text style={styles.noReading}>Tap scan to add first reading</Text>
                )}
              </View>
              <View style={styles.scoreBox}>
                {p.latest_reading?.health_score ? (
                  <>
                    <Text style={[styles.scoreValue, { color: HEALTH_COLOR(p.latest_reading.health_score) }]}>{p.latest_reading.health_score}</Text>
                    <Text style={styles.scoreLabel}>{t("score", language)}</Text>
                  </>
                ) : (
                  <MaterialCommunityIcons name="chevron-right" size={28} color={theme.color.borderStrong} />
                )}
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const Chip: React.FC<{ label: string; status?: string }> = ({ label, status }) => {
  const bg =
    status === "low" ? "#F8DBD5" : status === "high" ? "#FBE7C2" : status === "optimal" ? "#D5EAD9" : theme.color.surfaceTertiary;
  const fg =
    status === "low" ? theme.color.error : status === "high" ? theme.color.warning : status === "optimal" ? theme.color.success : theme.color.onSurface;
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipLabel, { color: fg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.lg },
  hello: { fontSize: theme.font.base, color: theme.color.onSurfaceTertiary },
  username: { fontSize: theme.font.xxl, fontWeight: "700", color: theme.color.onSurface },
  locChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.color.brandTertiary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radius.pill },
  locText: { color: theme.color.brandPrimary, fontWeight: "600", fontSize: theme.font.base },
  summaryCard: { flexDirection: "row", alignItems: "center", marginHorizontal: theme.spacing.xl, backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.lg, padding: theme.spacing.xl, borderLeftWidth: 6, marginBottom: theme.spacing.xl },
  summaryLabel: { fontSize: theme.font.base, color: theme.color.onSurfaceTertiary, fontWeight: "600" },
  summaryValue: { fontSize: 48, fontWeight: "800", marginTop: 4 },
  summaryUnit: { fontSize: theme.font.xl, fontWeight: "600", color: theme.color.onSurfaceTertiary },
  summarySub: { color: theme.color.onSurfaceTertiary, marginTop: 4 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.md },
  sectionTitle: { fontSize: theme.font.xl, fontWeight: "700", color: theme.color.onSurface },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.color.brandPrimary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radius.pill, minHeight: 40 },
  addBtnLabel: { color: "#fff", fontWeight: "700", fontSize: theme.font.base },
  empty: { alignItems: "center", padding: theme.spacing.xl, marginHorizontal: theme.spacing.xl, backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.lg },
  emptyImg: { width: 180, height: 130, borderRadius: theme.radius.md, marginBottom: theme.spacing.lg },
  emptyText: { textAlign: "center", color: theme.color.onSurfaceTertiary, marginBottom: theme.spacing.lg, fontSize: theme.font.lg },
  primaryBtn: { backgroundColor: theme.color.brandPrimary, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg, borderRadius: theme.radius.md, minHeight: 52, justifyContent: "center" },
  primaryBtnLabel: { color: "#fff", fontWeight: "700", fontSize: theme.font.lg },
  plotCard: { flexDirection: "row", alignItems: "center", marginHorizontal: theme.spacing.xl, marginBottom: theme.spacing.md, backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.color.border },
  plotName: { fontSize: theme.font.lg, fontWeight: "700", color: theme.color.onSurface },
  plotMeta: { fontSize: theme.font.sm, color: theme.color.onSurfaceTertiary, marginTop: 2 },
  plotChips: { flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill },
  chipLabel: { fontSize: theme.font.sm, fontWeight: "700" },
  noReading: { color: theme.color.onSurfaceTertiary, fontStyle: "italic", marginTop: 6 },
  scoreBox: { alignItems: "center", minWidth: 60 },
  scoreValue: { fontSize: 26, fontWeight: "800" },
  scoreLabel: { fontSize: 10, color: theme.color.onSurfaceTertiary, fontWeight: "600" },
  fab: { position: "absolute", left: theme.spacing.xl, right: theme.spacing.xl, backgroundColor: theme.color.brandPrimary, height: 60, borderRadius: theme.radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabLabel: { color: "#fff", fontSize: theme.font.lg, fontWeight: "700" },
});
