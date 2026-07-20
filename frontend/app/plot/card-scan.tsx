import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { theme } from "@/src/theme";
import { t } from "@/src/i18n";

export default function CardScanScreen() {
  const { language } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plotId } = useLocalSearchParams<{ plotId: string }>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please grant permission to scan cards.");
      return;
    }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    
    if (res.canceled) return;
    setImageUri(res.assets[0].uri);
  };

  const analyze = async () => {
    if (!imageUri) return;
    setBusy(true);
    try {
      router.push({
        pathname: "/plot/verify-reading",
        params: {
          plotId,
          scannedData: JSON.stringify({ notes: "Image remains on this device. Enter and verify card values manually; no LLM or server extraction is used." })
        }
      });
    } catch (e: any) {
      Alert.alert("Analysis failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.surface }}>
      <View style={[styles.hdr, { paddingTop: insets.top + 12 }]}>
        <Pressable testID="back-btn" style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.color.onSurface} />
        </Pressable>
        <Text style={styles.hdrTitle}>Scan Soil Card</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {!imageUri ? (
          <View style={styles.placeholderContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={80} color={theme.color.brandPrimary} />
            <Text style={styles.instructions}>
              Place your Soil Health Card on a flat surface and ensure good lighting.
            </Text>
            <View style={styles.actions}>
              <Pressable style={styles.primaryBtn} onPress={() => pickImage(true)}>
                <MaterialCommunityIcons name="camera" size={24} color="#fff" />
                <Text style={styles.primaryBtnLabel}>Take Photo</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => pickImage(false)}>
                <MaterialCommunityIcons name="image" size={24} color={theme.color.brandPrimary} />
                <Text style={styles.secondaryBtnLabel}>Upload from Gallery</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="contain" />
            {busy ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Opening verification…</Text>
              </View>
            ) : null}
            <View style={styles.actions}>
              <Pressable style={styles.secondaryBtn} onPress={() => setImageUri(null)} disabled={busy}>
                <Text style={styles.secondaryBtnLabel}>Retake</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={analyze} disabled={busy}>
                <Text style={styles.primaryBtnLabel}>Verify Card Values</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hdr: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md, backgroundColor: theme.color.surface },
  hdrTitle: { flex: 1, textAlign: "center", fontSize: theme.font.xl, fontWeight: "700", color: theme.color.onSurface },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, padding: theme.spacing.xl },
  placeholderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  instructions: { fontSize: theme.font.lg, textAlign: "center", marginTop: theme.spacing.xl, marginBottom: 40, color: theme.color.onSurfaceTertiary, lineHeight: 28 },
  actions: { width: "100%", gap: 16 },
  primaryBtn: { flexDirection: "row", gap: 8, backgroundColor: theme.color.brandPrimary, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.xl, borderRadius: theme.radius.md, justifyContent: "center", alignItems: "center", minHeight: 64 },
  primaryBtnLabel: { color: "#fff", fontWeight: "700", fontSize: theme.font.lg },
  secondaryBtn: { flexDirection: "row", gap: 8, backgroundColor: theme.color.surfaceSecondary, borderWidth: 2, borderColor: theme.color.brandPrimary, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.xl, borderRadius: theme.radius.md, justifyContent: "center", alignItems: "center", minHeight: 64 },
  secondaryBtnLabel: { color: theme.color.brandPrimary, fontWeight: "700", fontSize: theme.font.lg },
  previewContainer: { flex: 1, gap: theme.spacing.xl },
  previewImage: { flex: 1, borderRadius: theme.radius.md, backgroundColor: "#000" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", borderRadius: theme.radius.md },
  loadingText: { color: "#fff", fontSize: theme.font.lg, fontWeight: "600", marginTop: 16 },
});
