import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { theme } from "@/src/theme";
import { t } from "@/src/i18n";
import { LanguageToggle } from "@/src/LanguageToggle";

export default function Profile() {
  const { user, logout, language, setLanguage, api } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const changeLang = async (l: any) => {
    setLanguage(l);
    try {
      await api("/auth/language", { method: "PUT", body: JSON.stringify({ language: l }) });
    } catch {}
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.color.surface }} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 120 }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={48} color={theme.color.brandPrimary} />
        </View>
        <Text style={styles.name} testID="profile-name">{user?.name}</Text>
        <Text style={styles.identifier}>{user?.identifier}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("language", language)}</Text>
        <LanguageToggle language={language} onChange={changeLang} />
      </View>

      <View style={styles.section}>
        <Pressable
          style={styles.row}
          onPress={() => router.push("/(tabs)/map")}
        >
          <MaterialCommunityIcons name="map-marker-radius" size={26} color={theme.color.brandPrimary} />
          <Text style={styles.rowLabel}>{t("labs", language)} & {t("shops", language)}</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.color.borderStrong} />
        </Pressable>
      </View>

      <Pressable style={styles.logout} onPress={async () => { await logout(); router.replace("/(auth)/welcome"); }} testID="logout-btn">
        <MaterialCommunityIcons name="logout" size={22} color={theme.color.error} />
        <Text style={styles.logoutLabel}>{t("logout", language)}</Text>
      </Pressable>

      <Text style={styles.footer}>BhoomiMitra · SDG 2 · Zero Hunger</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", padding: theme.spacing.xl },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: theme.color.brandTertiary, alignItems: "center", justifyContent: "center" },
  name: { fontSize: theme.font.xxl, fontWeight: "700", color: theme.color.onSurface, marginTop: theme.spacing.md },
  identifier: { fontSize: theme.font.base, color: theme.color.onSurfaceTertiary, marginTop: 4 },
  section: { padding: theme.spacing.lg, marginHorizontal: theme.spacing.xl, marginBottom: theme.spacing.md, backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.lg, alignItems: "center", gap: theme.spacing.md },
  sectionTitle: { fontSize: theme.font.base, fontWeight: "700", color: theme.color.onSurfaceTertiary, alignSelf: "flex-start" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, alignSelf: "stretch" },
  rowLabel: { flex: 1, fontSize: theme.font.lg, fontWeight: "600", color: theme.color.onSurface },
  logout: { flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "center", padding: theme.spacing.lg, minHeight: 56 },
  logoutLabel: { color: theme.color.error, fontWeight: "700", fontSize: theme.font.lg },
  footer: { textAlign: "center", color: theme.color.onSurfaceTertiary, marginTop: 30, fontSize: theme.font.sm },
});
