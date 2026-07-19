import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { theme } from "@/src/theme";
import { t } from "@/src/i18n";

type Step = { icon: string; step: string; detail: string; priority: string };

export default function Prescription() {
  const { id, plotId } = useLocalSearchParams<{ id: string; plotId: string }>();
  const { api, language } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rx, setRx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch prescriptions from plot -> filter by id. Simpler: refetch via a dedicated call.
    (async () => {
      try {
        const plot = await api(`/plots/${plotId}`);
        // regenerate quickly if session doesn't have it; instead try to fetch via listing
        const plotWithRx = await api(`/plots/${plotId}`);
        setRx({ plot: plotWithRx });
        // load recent prescriptions from server via /ai/prescription retrieval — we don't have list endpoint; simulate by regeneration
        const generated = await api("/ai/prescription", {
          method: "POST",
          body: JSON.stringify({ plot_id: plotId, language }),
        });
        setRx({ ...generated, plot: plotWithRx });
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, plotId]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={theme.color.brandPrimary} /></View>;
  if (!rx) return <View style={styles.center}><Text>Not found</Text></View>;

  const priorityGroups: { key: string; label: string; color: string; steps: Step[] }[] = [
    { key: "high", label: t("priorityHigh", language), color: theme.color.error, steps: rx.steps.filter((s: Step) => s.priority === "high") },
    { key: "medium", label: t("priorityMedium", language), color: theme.color.warning, steps: rx.steps.filter((s: Step) => s.priority === "medium") },
    { key: "low", label: t("priorityLow", language), color: theme.color.brandSecondary, steps: rx.steps.filter((s: Step) => s.priority === "low") },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.surface }}>
      <View style={[styles.hdr, { paddingTop: insets.top + 12 }]}>
        <Pressable testID="back-btn" style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.color.onSurface} />
        </Pressable>
        <Text style={styles.hdrTitle}>{t("yourPrescription", language)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 100 }}>
        <View style={styles.summaryCard} testID="ai-summary">
          <MaterialCommunityIcons name="creation" size={28} color={theme.color.brandPrimary} />
          <Text style={styles.summaryText}>{rx.summary}</Text>
        </View>

        {priorityGroups.map((g) =>
          g.steps.length > 0 ? (
            <View key={g.key} style={{ marginTop: theme.spacing.lg }}>
              <View style={styles.priorityHeader}>
                <View style={[styles.priorityDot, { backgroundColor: g.color }]} />
                <Text style={styles.priorityLabel}>{g.label}</Text>
              </View>
              {g.steps.map((s: Step, idx: number) => (
                <View key={idx} style={styles.stepCard} testID={`step-${g.key}-${idx}`}>
                  <View style={[styles.stepIconWrap, { backgroundColor: g.color + "22" }]}>
                    <MaterialCommunityIcons name={(s.icon as any) || "leaf"} size={28} color={g.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{t("step", language)} {idx + 1}. {s.step}</Text>
                    <Text style={styles.stepDetail}>{s.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null
        )}

        <Pressable style={styles.primary} onPress={() => router.push({ pathname: "/plot/[id]", params: { id: plotId } })}>
          <MaterialCommunityIcons name="chart-line" size={22} color="#fff" />
          <Text style={styles.primaryLabel}>{t("trend", language)}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.color.surface },
  hdr: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md, backgroundColor: theme.color.surface },
  hdrTitle: { flex: 1, textAlign: "center", fontSize: theme.font.xl, fontWeight: "700", color: theme.color.onSurface },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  summaryCard: { flexDirection: "row", gap: 12, padding: theme.spacing.lg, backgroundColor: theme.color.brandTertiary, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.color.brandPrimary },
  summaryText: { flex: 1, fontSize: theme.font.base, color: theme.color.onBrandTertiary, lineHeight: 22, fontWeight: "500" },
  priorityHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: theme.spacing.md },
  priorityDot: { width: 12, height: 12, borderRadius: 6 },
  priorityLabel: { fontSize: theme.font.lg, fontWeight: "800", color: theme.color.onSurface, textTransform: "uppercase" },
  stepCard: { flexDirection: "row", gap: 12, backgroundColor: theme.color.surfaceSecondary, padding: theme.spacing.lg, borderRadius: theme.radius.md, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.color.border },
  stepIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  stepTitle: { fontSize: theme.font.lg, fontWeight: "700", color: theme.color.onSurface },
  stepDetail: { fontSize: theme.font.base, color: theme.color.onSurfaceTertiary, marginTop: 4, lineHeight: 20 },
  primary: { flexDirection: "row", gap: 8, minHeight: 56, borderRadius: theme.radius.md, backgroundColor: theme.color.brandPrimary, alignItems: "center", justifyContent: "center", marginTop: theme.spacing.xl },
  primaryLabel: { color: "#fff", fontSize: theme.font.lg, fontWeight: "700" },
});
