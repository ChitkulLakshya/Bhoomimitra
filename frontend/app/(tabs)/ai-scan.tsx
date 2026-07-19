import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { theme } from "@/src/theme";
import { t } from "@/src/i18n";

const CROPS = ["Ragi", "Bajra", "Sorghum", "Maize", "Rice", "Ground Nut", "Tomato", "Onion", "Pulses"];

type Deficiency = { nitrogen: number; phosphorus: number; potassium: number; zinc: number; iron: number };
type Guidance = { title: string; detail: string; level: "high" | "medium" | "low" };
type FertItem = { nutrient: string; deficit_pct: number; chemical: { name: string; qty_kg_per_acre: number }; organic: { name: string; qty_kg_per_acre: number } };
type Diagnosis = {
  is_soil?: boolean;
  reason?: string;
  soil_color: string;
  soil_type: string;
  moisture_level: string;
  moisture_pct: number;
  organic_matter: string;
  deficiencies: Deficiency;
  guidance: Guidance[];
  confidence: number;
  notes?: string;
  health_score?: number;
  fertilizer_plan?: FertItem[];
};

const LEVEL_COLOR = (v: number) => {
  if (v >= 60) return theme.color.error;
  if (v >= 35) return theme.color.warning;
  return theme.color.success;
};

const LEVEL_LABEL = (v: number, language: any) => {
  if (v >= 60) return language === "kn" ? "ಹೆಚ್ಚು" : "High";
  if (v >= 35) return language === "kn" ? "ಮಧ್ಯಮ" : "Medium";
  return language === "kn" ? "ಕಡಿಮೆ" : "Low";
};

export default function AIScanScreen() {
  const { api, language } = useAuth();
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [crop, setCrop] = useState("Ragi");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [notSoil, setNotSoil] = useState<string | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [plots, setPlots] = useState<any[]>([]);
  const [plotId, setPlotId] = useState<string | null>(null);

  useEffect(() => {
    api("/plots").then((data) => {
      setPlots(data);
      if (data?.length) setPlotId(data[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (busy) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      const id = setInterval(() => setProgress((p) => Math.min(p + 4, 92)), 200);
      return () => clearInterval(id);
    } else {
      setProgress(0);
    }
  }, [busy]);

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please grant permission.");
      return;
    }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (res.canceled) return;
    setImageUri(res.assets[0].uri);
    setResult(null);
    setNotSoil(null);
  };

  const analyze = async () => {
    if (!imageUri) {
      Alert.alert("Upload a soil photo first");
      return;
    }
    setBusy(true);
    setNotSoil(null);
    try {
      const b64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
      const res = await api("/ai/scan-soil", {
        method: "POST",
        body: JSON.stringify({ image_base64: b64, target_crop: crop, language, plot_id: plotId }),
      });
      const r = res.result;
      if (r?.is_soil === false) {
        setNotSoil(r.reason || t("notSoilBody", language));
        setResult(null);
      } else {
        setResult(r);
        setProgress(100);
      }
    } catch (e: any) {
      Alert.alert("Analysis failed", e.message);
    } finally {
      setTimeout(() => setBusy(false), 300);
    }
  };

  const reset = () => {
    setResult(null);
    setNotSoil(null);
    setImageUri(null);
    setProgress(0);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.surface }}>
      <View style={[styles.hdr, { paddingTop: insets.top + 12 }]}>
        <MaterialCommunityIcons name="creation" size={26} color={theme.color.brandPrimary} />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={styles.hdrTitle}>{t("aiScanTitle", language)}</Text>
          <Text style={styles.hdrSub}>{t("aiScanSub", language)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Dropzone / Image preview */}
        <Pressable
          testID="soil-dropzone"
          style={[styles.dropzone, imageUri && styles.dropzoneWithImage]}
          onPress={() => pickImage(false)}
          disabled={busy}
        >
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              {result && (
                <View style={styles.bbox} pointerEvents="none">
                  <View style={styles.bboxTag}>
                    <Text style={styles.bboxTagLabel}>{result.soil_type} · {result.confidence}%</Text>
                  </View>
                </View>
              )}
              {busy && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.analyzingText}>{t("analyzingSoil", language)}</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.progressPct}>{progress}%</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.dropzoneInner}>
              <MaterialCommunityIcons name="cloud-upload-outline" size={64} color={theme.color.brandPrimary} />
              <Text style={styles.dropzoneTitle}>{t("uploadSoil", language)}</Text>
              <Text style={styles.dropzoneHint}>PNG / JPG · Tap here or camera below</Text>
            </View>
          )}
        </Pressable>

        {/* Not-soil error card */}
        {notSoil && !result && (
          <View style={styles.errorCard} testID="not-soil-card">
            <View style={styles.errorHeaderRow}>
              <MaterialCommunityIcons name="alert-octagon" size={28} color={theme.color.error} />
              <Text style={styles.errorTitle}>{t("notSoilTitle", language)}</Text>
            </View>
            <Text style={styles.errorBody}>{t("notSoilBody", language)}</Text>
            {notSoil !== t("notSoilBody", language) && (
              <Text style={styles.errorReason}>AI: {notSoil}</Text>
            )}
            <Pressable testID="try-again-btn" style={styles.errorBtn} onPress={reset}>
              <MaterialCommunityIcons name="camera-retake" size={20} color="#fff" />
              <Text style={styles.errorBtnLabel}>{t("tryAgain", language)}</Text>
            </Pressable>
          </View>
        )}

        {!result && !notSoil && (
          <View style={styles.actionRow}>
            <Pressable testID="ai-take-photo" style={styles.actionBtn} onPress={() => pickImage(true)} disabled={busy}>
              <MaterialCommunityIcons name="camera" size={22} color={theme.color.brandPrimary} />
              <Text style={styles.actionLabel}>{t("takePhoto", language)}</Text>
            </Pressable>
            <Pressable testID="ai-gallery" style={styles.actionBtn} onPress={() => pickImage(false)} disabled={busy}>
              <MaterialCommunityIcons name="image-multiple" size={22} color={theme.color.brandPrimary} />
              <Text style={styles.actionLabel}>{t("chooseGallery", language)}</Text>
            </Pressable>
          </View>
        )}

        {!result && !notSoil && (
          <>
            {plots.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>{t("linkedToPlot", language)}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  <Pressable
                    testID="scan-plot-none"
                    onPress={() => setPlotId(null)}
                    style={[styles.cropChip, plotId === null && styles.cropChipActive]}
                  >
                    <Text style={[styles.cropChipLabel, plotId === null && { color: "#fff" }]}>—</Text>
                  </Pressable>
                  {plots.map((p) => (
                    <Pressable
                      key={p.id}
                      testID={`scan-plot-${p.id}`}
                      onPress={() => setPlotId(p.id)}
                      style={[styles.cropChip, plotId === p.id && styles.cropChipActive]}
                    >
                      <Text style={[styles.cropChipLabel, plotId === p.id && { color: "#fff" }]}>{p.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.sectionLabel}>{t("targetCrop", language)}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {CROPS.map((c) => (
                <Pressable
                  key={c}
                  testID={`crop-${c}`}
                  onPress={() => setCrop(c)}
                  style={[styles.cropChip, crop === c && styles.cropChipActive]}
                >
                  <Text style={[styles.cropChipLabel, crop === c && { color: "#fff" }]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              testID="analyze-soil-btn"
              style={[styles.primary, (!imageUri || busy) && { opacity: 0.6 }]}
              disabled={!imageUri || busy}
              onPress={analyze}
            >
              <MaterialCommunityIcons name="creation" size={22} color="#fff" />
              <Text style={styles.primaryLabel}>{busy ? `${progress}%` : t("analyzeSoil", language)}</Text>
            </Pressable>
          </>
        )}

        {/* Diagnosis report */}
        {result && (
          <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.lg }} testID="ai-diagnosis-report">
            <View style={styles.reportHeader}>
              <MaterialCommunityIcons name="clipboard-pulse" size={28} color={theme.color.brandPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reportTitle}>{t("diagnosisReport", language)}</Text>
                <Text style={styles.reportSub}>{crop} · {t("confidence", language)} {result.confidence}%</Text>
              </View>
              <View style={styles.greenBadge}>
                <Text style={styles.greenBadgeLabel}>AI</Text>
              </View>
            </View>

            {/* Health Score */}
            {typeof result.health_score === "number" && (
              <View style={styles.healthCard} testID="health-score-card">
                <View style={{ flex: 1 }}>
                  <Text style={styles.healthLabel}>{t("healthScore", language)}</Text>
                  <Text style={[styles.healthValue, { color: result.health_score >= 70 ? theme.color.success : result.health_score >= 45 ? theme.color.warning : theme.color.error }]}>{result.health_score}<Text style={styles.healthUnit}>/100</Text></Text>
                </View>
                <MaterialCommunityIcons
                  name={result.health_score >= 70 ? "emoticon-happy-outline" : result.health_score >= 45 ? "emoticon-neutral-outline" : "emoticon-sad-outline"}
                  size={64}
                  color={result.health_score >= 70 ? theme.color.success : result.health_score >= 45 ? theme.color.warning : theme.color.error}
                />
              </View>
            )}

            {/* Profile */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("soilProfile", language)}</Text>
              <ProfileRow icon="palette" label={t("soilColor", language)} value={result.soil_color} />
              <ProfileRow icon="layers-triple" label={t("soilType", language)} value={result.soil_type} />
              <ProfileRow icon="water-percent" label={t("moisture", language)} value={`${result.moisture_level} · ${result.moisture_pct}%`} />
              <ProfileRow icon="sprout" label={t("organicMatter", language)} value={result.organic_matter} />
            </View>

            {/* Deficiencies */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("deficiencies", language)}</Text>
              {(["nitrogen", "phosphorus", "potassium", "zinc", "iron"] as const).map((k) => (
                <NutrientBar
                  key={k}
                  label={k.charAt(0).toUpperCase() + k.slice(1)}
                  value={result.deficiencies[k] || 0}
                  language={language}
                />
              ))}
            </View>

            {/* Exact Fertilizer Quantities */}
            {result.fertilizer_plan && result.fertilizer_plan.length > 0 && (
              <View style={styles.card} testID="fertilizer-plan-card">
                <Text style={styles.cardTitle}>{t("fertilizerPlan", language)}</Text>
                <Text style={styles.fpSub}>{crop} · {t("perAcre", language)}</Text>
                {result.fertilizer_plan.filter((f) => f.deficit_pct > 5).map((f, i) => (
                  <View key={i} style={styles.fpRow} testID={`fert-${f.nutrient}`}>
                    <View style={styles.fpHead}>
                      <Text style={styles.fpNutrient}>{f.nutrient}</Text>
                      <Text style={styles.fpDeficit}>{f.deficit_pct}% deficit</Text>
                    </View>
                    <View style={styles.fpOptions}>
                      <View style={[styles.fpOption, styles.fpOptOrganic]}>
                        <Text style={styles.fpBadge}>{t("organic", language)}</Text>
                        <Text style={styles.fpAmount}>{f.organic.qty_kg_per_acre} kg</Text>
                        <Text style={styles.fpName}>{f.organic.name}</Text>
                      </View>
                      <View style={[styles.fpOption, styles.fpOptChemical]}>
                        <Text style={styles.fpBadge}>{t("chemical", language)}</Text>
                        <Text style={styles.fpAmount}>{f.chemical.qty_kg_per_acre} kg</Text>
                        <Text style={styles.fpName}>{f.chemical.name}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Guidance */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("restorationSteps", language)}</Text>
              {result.guidance.map((g, i) => {
                const color = g.level === "high" ? theme.color.error : g.level === "medium" ? theme.color.warning : theme.color.success;
                return (
                  <View key={i} style={styles.guideRow} testID={`guidance-${i}`}>
                    <View style={[styles.guideDot, { backgroundColor: color }]}>
                      <Text style={styles.guideDotText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guideTitle}>{g.title}</Text>
                      <Text style={styles.guideDetail}>{g.detail}</Text>
                      <View style={[styles.levelBadge, { backgroundColor: color + "22", borderColor: color }]}>
                        <Text style={[styles.levelBadgeLabel, { color }]}>{g.level.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {result.notes && (
              <Text style={styles.notes}>{result.notes}</Text>
            )}

            <Pressable testID="scan-again" style={styles.secondary} onPress={reset}>
              <MaterialCommunityIcons name="camera-retake" size={22} color={theme.color.brandPrimary} />
              <Text style={styles.secondaryLabel}>{t("scanAgain", language)}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const ProfileRow: React.FC<{ icon: any; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.profileRow}>
    <MaterialCommunityIcons name={icon} size={22} color={theme.color.brandSecondary} />
    <Text style={styles.profileLabel}>{label}</Text>
    <Text style={styles.profileValue}>{value}</Text>
  </View>
);

const NutrientBar: React.FC<{ label: string; value: number; language: any }> = ({ label, value, language }) => {
  const color = LEVEL_COLOR(value);
  return (
    <View style={styles.nutrRow} testID={`nutr-${label.toLowerCase()}`}>
      <View style={styles.nutrHeader}>
        <Text style={styles.nutrLabel}>{label}</Text>
        <View style={[styles.nutrBadge, { backgroundColor: color + "22", borderColor: color }]}>
          <Text style={[styles.nutrBadgeLabel, { color }]}>{LEVEL_LABEL(value, language)} · {value}%</Text>
        </View>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hdr: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.md },
  hdrTitle: { fontSize: theme.font.xxl, fontWeight: "800", color: theme.color.onSurface },
  hdrSub: { fontSize: theme.font.sm, color: theme.color.onSurfaceTertiary, marginTop: 2 },
  dropzone: {
    height: 240,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surfaceTertiary,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.color.brandSecondary,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  dropzoneWithImage: { borderStyle: "solid", borderColor: theme.color.brandPrimary },
  dropzoneInner: { alignItems: "center", gap: 8, padding: theme.spacing.lg },
  dropzoneTitle: { fontSize: theme.font.lg, fontWeight: "700", color: theme.color.onSurface },
  dropzoneHint: { fontSize: theme.font.sm, color: theme.color.onSurfaceTertiary },
  analyzingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", gap: 12, padding: theme.spacing.xl },
  analyzingText: { color: "#fff", fontSize: theme.font.base, fontWeight: "600", textAlign: "center" },
  progressTrack: { width: "80%", height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: theme.color.success },
  progressPct: { color: "#fff", fontWeight: "800", fontSize: theme.font.lg },
  bbox: { position: "absolute", top: 20, left: 20, right: 20, bottom: 20, borderWidth: 3, borderColor: theme.color.success, borderRadius: 12 },
  bboxTag: { position: "absolute", top: -12, left: 8, backgroundColor: theme.color.success, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  bboxTagLabel: { color: "#fff", fontWeight: "800", fontSize: 11 },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: theme.spacing.md },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 48, borderRadius: theme.radius.md, backgroundColor: theme.color.surfaceSecondary, borderWidth: 1.5, borderColor: theme.color.brandTertiary },
  actionLabel: { color: theme.color.brandPrimary, fontWeight: "700", fontSize: theme.font.base },
  sectionLabel: { fontSize: theme.font.base, fontWeight: "700", color: theme.color.onSurfaceTertiary, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  cropChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.pill, backgroundColor: theme.color.surfaceSecondary, borderWidth: 1, borderColor: theme.color.border, flexShrink: 0, minHeight: 40, justifyContent: "center" },
  cropChipActive: { backgroundColor: theme.color.brandPrimary, borderColor: theme.color.brandPrimary },
  cropChipLabel: { fontWeight: "700", color: theme.color.onSurface, fontSize: theme.font.base },
  primary: { flexDirection: "row", gap: 8, minHeight: 56, borderRadius: theme.radius.md, backgroundColor: theme.color.brandPrimary, alignItems: "center", justifyContent: "center", marginTop: theme.spacing.lg },
  primaryLabel: { color: "#fff", fontSize: theme.font.lg, fontWeight: "800" },
  reportHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  reportTitle: { fontSize: theme.font.xl, fontWeight: "800", color: theme.color.onSurface },
  reportSub: { fontSize: theme.font.sm, color: theme.color.onSurfaceTertiary },
  greenBadge: { backgroundColor: theme.color.success, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill },
  greenBadgeLabel: { color: "#fff", fontWeight: "800", fontSize: 12 },
  card: { backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.color.border, gap: theme.spacing.md },
  cardTitle: { fontSize: theme.font.lg, fontWeight: "800", color: theme.color.onSurface, marginBottom: 4 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileLabel: { flex: 1, fontSize: theme.font.base, color: theme.color.onSurfaceTertiary, fontWeight: "600" },
  profileValue: { fontSize: theme.font.base, fontWeight: "800", color: theme.color.onSurface },
  nutrRow: { gap: 6 },
  nutrHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nutrLabel: { fontSize: theme.font.base, fontWeight: "700", color: theme.color.onSurface },
  nutrBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.pill, borderWidth: 1 },
  nutrBadgeLabel: { fontSize: 11, fontWeight: "800" },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: theme.color.surface, overflow: "hidden", borderWidth: 1, borderColor: theme.color.border },
  barFill: { height: "100%", borderRadius: 5 },
  guideRow: { flexDirection: "row", gap: 12, paddingVertical: 6 },
  guideDot: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  guideDotText: { color: "#fff", fontWeight: "800" },
  guideTitle: { fontSize: theme.font.base, fontWeight: "800", color: theme.color.onSurface },
  guideDetail: { fontSize: theme.font.sm, color: theme.color.onSurfaceTertiary, marginTop: 2, lineHeight: 18 },
  levelBadge: { alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  levelBadgeLabel: { fontSize: 10, fontWeight: "800" },
  notes: { fontSize: theme.font.sm, fontStyle: "italic", color: theme.color.onSurfaceTertiary, textAlign: "center" },
  secondary: { flexDirection: "row", gap: 8, minHeight: 56, borderRadius: theme.radius.md, backgroundColor: theme.color.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: theme.color.brandPrimary },
  secondaryLabel: { color: theme.color.brandPrimary, fontSize: theme.font.lg, fontWeight: "800" },

  // Not-soil error card
  errorCard: {
    borderWidth: 2, borderColor: theme.color.error,
    backgroundColor: "#FDECEA",
    borderRadius: theme.radius.lg, padding: theme.spacing.lg,
    gap: theme.spacing.md, marginBottom: theme.spacing.md,
  },
  errorHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  errorTitle: { fontSize: theme.font.xl, fontWeight: "800", color: theme.color.error, flex: 1 },
  errorBody: { fontSize: theme.font.base, color: theme.color.onSurface, lineHeight: 20 },
  errorReason: { fontSize: theme.font.sm, fontStyle: "italic", color: theme.color.onSurfaceTertiary },
  errorBtn: {
    minHeight: 48, borderRadius: theme.radius.md, backgroundColor: theme.color.error,
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 4,
  },
  errorBtnLabel: { color: "#fff", fontSize: theme.font.base, fontWeight: "800" },

  // Health score card
  healthCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: theme.color.surfaceSecondary,
    borderRadius: theme.radius.lg, padding: theme.spacing.xl,
    borderWidth: 1, borderColor: theme.color.border,
  },
  healthLabel: { fontSize: theme.font.base, fontWeight: "700", color: theme.color.onSurfaceTertiary },
  healthValue: { fontSize: 52, fontWeight: "800", marginTop: 2 },
  healthUnit: { fontSize: theme.font.lg, fontWeight: "600", color: theme.color.onSurfaceTertiary },

  // Fertilizer plan
  fpSub: { fontSize: theme.font.sm, color: theme.color.onSurfaceTertiary, marginTop: -6 },
  fpRow: { gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: theme.color.border },
  fpHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fpNutrient: { fontSize: theme.font.base, fontWeight: "800", color: theme.color.onSurface },
  fpDeficit: { fontSize: 12, fontWeight: "700", color: theme.color.error },
  fpOptions: { flexDirection: "row", gap: 8 },
  fpOption: { flex: 1, padding: 10, borderRadius: theme.radius.md, borderWidth: 1 },
  fpOptOrganic: { backgroundColor: "#E9F3EA", borderColor: theme.color.success },
  fpOptChemical: { backgroundColor: "#FDF3E0", borderColor: theme.color.warning },
  fpBadge: { fontSize: 10, fontWeight: "800", color: theme.color.onSurfaceTertiary, textTransform: "uppercase", marginBottom: 4 },
  fpAmount: { fontSize: theme.font.xl, fontWeight: "800", color: theme.color.onSurface },
  fpName: { fontSize: 11, color: theme.color.onSurfaceTertiary, marginTop: 2 },
});
