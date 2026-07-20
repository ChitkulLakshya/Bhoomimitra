import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { theme, IMAGES } from "@/src/theme";
import { t } from "@/src/i18n";
import { LanguageToggle } from "@/src/LanguageToggle";

export default function Login() {
  const router = useRouter();
  const { login, language, setLanguage } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await login(identifier.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.color.surface }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Image source={{ uri: IMAGES.authHero }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(45,51,42,0)", "rgba(45,51,42,0.85)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroContent, { paddingTop: insets.top + 24 }]}>
            <LanguageToggle language={language} onChange={setLanguage} />
            <View style={{ flex: 1 }} />
            <Text style={styles.heroTitle}>{t("appName", language)}</Text>
            <Text style={styles.heroSub}>{t("tagline", language)}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>{t("login", language)}</Text>

          <Text style={styles.label}>{t("emailOrPhone", language)}</Text>
          <TextInput
            testID="login-identifier"
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="ravi@farm.com"
            placeholderTextColor="#8B968B"
          />

          <Text style={styles.label}>{t("password", language)}</Text>
          <TextInput
            testID="login-password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••"
            placeholderTextColor="#8B968B"
          />

          {err && <Text style={styles.err} testID="login-error">{err}</Text>}

          <Pressable testID="login-submit" style={styles.primary} disabled={busy} onPress={submit}>
            <Text style={styles.primaryLabel}>{busy ? "..." : t("continue", language)}</Text>
          </Pressable>

          <Link href="/(auth)/signup" asChild>
            <Pressable testID="go-signup" style={styles.linkBtn}>
              <Text style={styles.linkLabel}>{t("noAccount", language)}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { height: 320, position: "relative" },
  heroContent: { flex: 1, padding: theme.spacing.lg, justifyContent: "flex-end" },
  heroTitle: { color: "#fff", fontSize: 40, fontWeight: "800", marginTop: theme.spacing.lg },
  heroSub: { color: "#fff", fontSize: theme.font.lg, marginTop: theme.spacing.xs, marginBottom: theme.spacing.xl },
  form: { padding: theme.spacing.xl, gap: theme.spacing.md, flex: 1 },
  formTitle: { fontSize: theme.font.xxl, fontWeight: "700", color: theme.color.onSurface, marginBottom: theme.spacing.md },
  label: { fontSize: theme.font.base, fontWeight: "600", color: theme.color.onSurfaceTertiary },
  input: {
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.color.surfaceSecondary,
    fontSize: theme.font.lg,
    color: theme.color.onSurface,
  },
  err: { color: theme.color.error, fontSize: theme.font.base, fontWeight: "600" },
  primary: {
    minHeight: 56,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.md,
  },
  primaryLabel: { color: "#fff", fontSize: theme.font.lg, fontWeight: "700" },
  linkBtn: { alignItems: "center", padding: theme.spacing.md, minHeight: 44, justifyContent: "center" },
  linkLabel: { color: theme.color.brandPrimary, fontSize: theme.font.base, fontWeight: "600" },
});
