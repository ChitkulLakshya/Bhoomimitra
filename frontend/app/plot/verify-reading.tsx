import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, addDoc } from "firebase/firestore";

import { useAuth } from "@/src/auth";
import { theme } from "@/src/theme";
import { t } from "@/src/i18n";
import { db } from "@/src/firebase";
import { classifyNutrient, calculateHealthScore } from "@/src/utils/soil";

export default function VerifyReadingScreen() {
  const { user, language } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plotId, scannedData } = useLocalSearchParams<{ plotId: string, scannedData: string }>();

  const initialData = scannedData ? JSON.parse(scannedData) : {};

  const [form, setForm] = useState({
    ph: initialData.ph?.toString() || "",
    nitrogen: initialData.nitrogen?.toString() || "",
    phosphorus: initialData.phosphorus?.toString() || "",
    potassium: initialData.potassium?.toString() || "",
    organic_carbon: initialData.organic_carbon?.toString() || ""
  });

  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    if (!user) return;
    try {
      const ph = parseFloat(form.ph);
      const nitrogen = parseFloat(form.nitrogen);
      const phosphorus = parseFloat(form.phosphorus);
      const potassium = parseFloat(form.potassium);
      const organic_carbon = parseFloat(form.organic_carbon);
      if (![nitrogen, phosphorus, potassium].every(v => Number.isFinite(v) && v >= 0)) { Alert.alert("Enter verified values", "N, P and K must be entered from the Soil Health Card."); return; }
      
      const status = {
        ph: classifyNutrient("ph", ph),
        nitrogen: classifyNutrient("nitrogen", nitrogen),
        phosphorus: classifyNutrient("phosphorus", phosphorus),
        potassium: classifyNutrient("potassium", potassium),
        organic_carbon: classifyNutrient("organic_carbon", organic_carbon),
      };
      
      const health_score = calculateHealthScore(status);

      const payload = {
        plot_id: plotId,
        owner_id: user.id,
        ph,
        nitrogen,
        phosphorus,
        potassium,
        organic_carbon,
        source: "card_scan",
        verified: true,
        ocr_confidence: initialData.confidence || {},
        created_at: new Date().toISOString(),
        tested_on: new Date().toISOString(),
        status,
        health_score
      };
      
      const readingRef = await addDoc(collection(db, "readings"), payload);
      
      router.replace({ pathname: "/prescription/[id]", params: { id: readingRef.id, plotId } });
    } catch (e: any) {
      Alert.alert("Error saving reading", e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.surface }}>
      <View style={[styles.hdr, { paddingTop: insets.top + 12 }]}>
        <Pressable testID="back-btn" style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.color.onSurface} />
        </Pressable>
        <Text style={styles.hdrTitle}>Verify Data</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 120 }}>
        <Text style={styles.instructions}>
          Please confirm the values extracted from your card. Tap any box to correct errors.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>pH Level</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={form.ph}
            onChangeText={(v) => updateField("ph", v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nitrogen (N) kg/ha</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={form.nitrogen}
            onChangeText={(v) => updateField("nitrogen", v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phosphorus (P) kg/ha</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={form.phosphorus}
            onChangeText={(v) => updateField("phosphorus", v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Potassium (K) kg/ha</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={form.potassium}
            onChangeText={(v) => updateField("potassium", v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Organic Carbon (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={form.organic_carbon}
            onChangeText={(v) => updateField("organic_carbon", v)}
          />
        </View>

      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={styles.primaryBtn} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnLabel}>Save & Get Prescription</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hdr: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md, backgroundColor: theme.color.surface },
  hdrTitle: { flex: 1, textAlign: "center", fontSize: theme.font.xl, fontWeight: "700", color: theme.color.onSurface },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  instructions: { fontSize: theme.font.base, color: theme.color.onSurfaceTertiary, marginBottom: theme.spacing.xl, lineHeight: 22 },
  inputGroup: { marginBottom: theme.spacing.lg },
  label: { fontSize: theme.font.lg, fontWeight: "600", color: theme.color.onSurface, marginBottom: 8 },
  input: { backgroundColor: theme.color.surfaceSecondary, borderWidth: 1, borderColor: theme.color.borderStrong, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.lg, fontSize: 24, fontWeight: "700", color: theme.color.onSurface },
  footer: { padding: theme.spacing.xl, backgroundColor: theme.color.surface, borderTopWidth: 1, borderColor: theme.color.border },
  primaryBtn: { backgroundColor: theme.color.brandPrimary, paddingVertical: theme.spacing.xl, borderRadius: theme.radius.md, justifyContent: "center", alignItems: "center", minHeight: 64 },
  primaryBtnLabel: { color: "#fff", fontWeight: "700", fontSize: theme.font.lg },
});
