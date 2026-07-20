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
import { useRouter, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { theme } from "@/src/theme";
import { t } from "@/src/i18n";
import { LanguageToggle } from "@/src/LanguageToggle";

export default function Signup() {
  const router = useRouter();
  const { signup, language, setLanguage } = useAuth();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await signup(name.trim(), identifier.trim(), password);
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
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ padding: theme.spacing.xl, alignItems: "center" }}>
          <LanguageToggle language={language} onChange={setLanguage} />
        </View>
        <View style={styles.form}>
          <Text style={styles.title}>{t("createAccount", language)}</Text>

          <Text style={styles.label}>{t("name", language)}</Text>
          <TextInput
            testID="signup-name"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ravi Kumar"
            placeholderTextColor="#8B968B"
          />

          <Text style={styles.label}>{t("emailOrPhone", language)}</Text>
          <TextInput
            testID="signup-identifier"
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
            testID="signup-password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Min 6 chars"
            placeholderTextColor="#8B968B"
          />

          {err && <Text style={styles.err} testID="signup-error">{err}</Text>}

          <Pressable testID="signup-submit" style={styles.primary} disabled={busy} onPress={submit}>
            <Text style={styles.primaryLabel}>{busy ? "..." : t("createAccount", language)}</Text>
          </Pressable>

          <Link href="/(auth)/login" asChild>
            <Pressable testID="go-login" style={styles.linkBtn}>
              <Text style={styles.linkLabel}>{t("haveAccount", language)}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { padding: theme.spacing.xl, gap: theme.spacing.md, flex: 1 },
  title: { fontSize: theme.font.xxl, fontWeight: "700", color: theme.color.onSurface, marginBottom: theme.spacing.md },
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
