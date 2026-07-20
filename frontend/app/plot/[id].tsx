import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/src/firebase";

import { useAuth } from "@/src/auth";
import { theme } from "@/src/theme";
import { t } from "@/src/i18n";

const { width } = Dimensions.get("window");

export default function PlotDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plot, setPlot] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const plotDoc = await getDoc(doc(db, "plots", id as string));
        const p: any = plotDoc.exists() ? { id: plotDoc.id, ...plotDoc.data() } : null;
        
        let r: any[] = [];
        if (p) {
          const rq = query(collection(db, "readings"), where("plot_id", "==", id), orderBy("created_at", "asc"));
          const rSnap = await getDocs(rq);
          r = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          p.readings = r;
        }
        setPlot(p);
        setScans([]);
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.color.brandPrimary} size="large" /></View>;
  if (!plot) return <View style={styles.center}><Text>Plot not found</Text></View>;

  const readings = (plot.readings || []).slice().reverse(); // oldest first

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.surface }}>
      <View style={[styles.hdr, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} testID="back-btn" style={styles.iconBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.color.onSurface} />
        </Pressable>
        <Text style={styles.hdrTitle} numberOfLines={1}>{plot.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 100 }}>
        <View style={styles.metaCard}>
          <MetaItem icon="grain" label={plot.crop} />
          <MetaItem icon="ruler-square" label={`${plot.area_acres} ac`} />
          <MetaItem icon="map-marker" label={plot.village || "Anekal"} />
        </View>

        {readings.length === 0 ? (
          <View style={styles.emptyCard} testID="no-readings">
            <MaterialCommunityIcons name="test-tube" size={48} color={theme.color.borderStrong} />
            <Text style={styles.emptyText}>No soil readings yet.</Text>
            <Pressable style={styles.primary} onPress={() => router.push("/(tabs)/ai-scan")}>
              <Text style={styles.primaryLabel}>{t("aiScanTitle", language)}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{t("trend", language)}</Text>
            <View style={styles.chartCard}>
              <Chart data={readings.map((r: any) => ({ n: r.nitrogen, p: r.phosphorus, k: r.potassium, ph: r.ph }))} />
              <View style={styles.legendRow}>
                <LegendDot color={theme.color.brandPrimary} label="N" />
                <LegendDot color={theme.color.terracotta} label="P" />
                <LegendDot color={theme.color.warning} label="K" />
                <LegendDot color={theme.color.brandSecondary} label="pH×40" />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Readings</Text>
            {readings.slice().reverse().map((r: any) => (
              <View key={r.id} style={styles.readingCard}>
                <View style={styles.readingHeader}>
                  <Text style={styles.readingDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                  {r.health_score && (
                    <View style={[styles.scoreBadge, { backgroundColor: r.health_score >= 70 ? theme.color.success : r.health_score >= 55 ? theme.color.warning : theme.color.error }]}>
                      <Text style={styles.scoreBadgeText}>{r.health_score}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.grid}>
                  <Stat label={t("ph", language)} value={r.ph} status={r.status?.ph} />
                  <Stat label={t("nitrogen", language)} value={`${r.nitrogen}`} status={r.status?.nitrogen} />
                  <Stat label={t("phosphorus", language)} value={`${r.phosphorus}`} status={r.status?.phosphorus} />
                  <Stat label={t("potassium", language)} value={`${r.potassium}`} status={r.status?.potassium} />
                  <Stat label={t("organicCarbon", language)} value={`${r.organic_carbon}%`} status={r.status?.organic_carbon} />
                </View>
              </View>
            ))}
          </>
        )}

        {/* Vision History (AI Scans) */}
        {scans.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t("visionHistory", language)}</Text>
            {scans.map((s: any) => {
              const r = s.result || {};
              return (
                <View key={s.id} style={styles.scanCard} testID={`scan-${s.id}`}>
                  <View style={styles.scanHeader}>
                    <MaterialCommunityIcons name="creation" size={22} color={theme.color.brandPrimary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.readingDate}>{new Date(s.created_at).toLocaleDateString()} · {s.target_crop}</Text>
                      <Text style={styles.scanSub}>{r.soil_color} · {r.soil_type} · {r.moisture_pct}% moisture</Text>
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: theme.color.brandPrimary }]}>
                      <Text style={styles.scoreBadgeText}>{r.confidence || 0}%</Text>
                    </View>
                  </View>
                  <View style={styles.deficitRow}>
                    {(["nitrogen","phosphorus","potassium","zinc","iron"] as const).map((k) => {
                      const v = r.deficiencies?.[k] || 0;
                      const c = v >= 60 ? theme.color.error : v >= 35 ? theme.color.warning : theme.color.success;
                      return (
                        <View key={k} style={styles.deficitPill}>
                          <Text style={styles.deficitK}>{k[0].toUpperCase()}</Text>
                          <View style={[styles.deficitDot, { backgroundColor: c }]} />
                          <Text style={[styles.deficitV, { color: c }]}>{v}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const MetaItem: React.FC<{ icon: any; label: string }> = ({ icon, label }) => (
  <View style={styles.metaItem}>
    <MaterialCommunityIcons name={icon} size={22} color={theme.color.brandPrimary} />
    <Text style={styles.metaLabel}>{label}</Text>
  </View>
);

const Stat: React.FC<{ label: string; value: any; status?: string }> = ({ label, value, status }) => {
  const color = status === "low" ? theme.color.error : status === "high" ? theme.color.warning : status === "optimal" ? theme.color.success : theme.color.onSurface;
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
};

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
    <Text style={{ fontSize: 12, color: theme.color.onSurfaceTertiary, fontWeight: "600" }}>{label}</Text>
  </View>
);

const Chart: React.FC<{ data: any[] }> = ({ data }) => {
  const w = width - theme.spacing.xl * 2 - theme.spacing.lg * 2;
  const h = 160;
  if (data.length === 0) return null;
  const max = 600;
  const step = data.length > 1 ? w / (data.length - 1) : 0;

  const pointsFor = (key: string, scale = 1) =>
    data.map((d, i) => ({ x: i * step, y: h - Math.min(h, ((d[key] || 0) * scale / max) * h) }));

  const line = (points: {x:number;y:number}[]) => points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  // simple SVG-less rendering using absolute-positioned dots
  const series = [
    { key: "n", scale: 1, color: theme.color.brandPrimary },
    { key: "p", scale: 12, color: theme.color.terracotta },
    { key: "k", scale: 1.5, color: theme.color.warning },
    { key: "ph", scale: 40, color: theme.color.brandSecondary },
  ];
  return (
    <View style={{ width: w, height: h, position: "relative", alignSelf: "center" }}>
      {series.map((s) => {
        const pts = pointsFor(s.key, s.scale);
        return pts.map((p, i) => (
          <View key={`${s.key}-${i}`} style={{ position: "absolute", left: p.x - 5, top: p.y - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
        ));
      })}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, backgroundColor: theme.color.border }} />
    </View>
  );
  void line;
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.color.surface },
  hdr: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md, backgroundColor: theme.color.surface },
  hdrTitle: { flex: 1, textAlign: "center", fontSize: theme.font.xl, fontWeight: "700", color: theme.color.onSurface },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  metaCard: { flexDirection: "row", justifyContent: "space-around", backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.lg, padding: theme.spacing.lg, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.color.border },
  metaItem: { alignItems: "center", gap: 4 },
  metaLabel: { fontSize: theme.font.sm, fontWeight: "700", color: theme.color.onSurface },
  emptyCard: { alignItems: "center", padding: theme.spacing.xxl, gap: theme.spacing.md, backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.lg },
  emptyText: { color: theme.color.onSurfaceTertiary, fontSize: theme.font.lg },
  sectionTitle: { fontSize: theme.font.xl, fontWeight: "700", color: theme.color.onSurface, marginBottom: theme.spacing.md, marginTop: theme.spacing.md },
  chartCard: { backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.lg, padding: theme.spacing.lg, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.color.border },
  legendRow: { flexDirection: "row", justifyContent: "space-around", marginTop: theme.spacing.md },
  readingCard: { backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.color.border },
  readingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md },
  readingDate: { fontWeight: "700", fontSize: theme.font.base, color: theme.color.onSurface },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill },
  scoreBadgeText: { color: "#fff", fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { minWidth: (width - theme.spacing.xl * 2 - theme.spacing.lg * 2 - 24) / 2, padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.color.surface, borderWidth: 1, borderColor: theme.color.border },
  statLabel: { fontSize: theme.font.sm, color: theme.color.onSurfaceTertiary, fontWeight: "600" },
  statValue: { fontSize: theme.font.xl, fontWeight: "800", marginTop: 4 },
  primary: { minHeight: 56, borderRadius: theme.radius.md, backgroundColor: theme.color.brandPrimary, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.spacing.xl },
  primaryLabel: { color: "#fff", fontSize: theme.font.lg, fontWeight: "700" },
  scanCard: { backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.color.border, gap: theme.spacing.md },
  scanHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  scanSub: { fontSize: theme.font.sm, color: theme.color.onSurfaceTertiary, marginTop: 2 },
  deficitRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  deficitPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.color.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.color.border },
  deficitK: { fontSize: 12, fontWeight: "800", color: theme.color.onSurfaceTertiary },
  deficitDot: { width: 8, height: 8, borderRadius: 4 },
  deficitV: { fontSize: 12, fontWeight: "800" },
});
