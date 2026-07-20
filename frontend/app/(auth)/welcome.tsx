import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { theme, CAROUSEL } from "@/src/theme";
import { t } from "@/src/i18n";
import { LanguageToggle } from "@/src/LanguageToggle";

const { width: SW, height: SH } = Dimensions.get("window");

type ModalMode = null | "login" | "signup";

export default function Welcome() {
  const { language, setLanguage, login, signup } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ---------- Auto-scrolling backdrop carousel ----------
  const [active, setActive] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start(() => {
        setActive((a) => (a + 1) % CAROUSEL.length);
        Animated.timing(fade, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
      });
    }, 4200);
    return () => clearInterval(id);
  }, []);

  // ---------- Modal ----------
  const [mode, setMode] = useState<ModalMode>(null);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const closeModal = () => {
    setMode(null);
    setErr(null);
    setName("");
    setIdentifier("");
    setPassword("");
  };

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await signup(name.trim(), identifier.trim(), password);
      } else {
        await login(identifier.trim(), password);
      }
      closeModal();
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Backdrop carousel */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <Image source={{ uri: CAROUSEL[active].url }} style={StyleSheet.absoluteFill} contentFit="cover" />
      </Animated.View>
      <LinearGradient
        colors={["rgba(45,51,42,0.15)", "rgba(45,51,42,0.55)", "rgba(20,25,20,0.95)"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Sticky header — brand banner + language toggle side by side */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.brandRow}>
          <MaterialCommunityIcons name="sprout" size={20} color="#fff" />
          <Text style={styles.brand} numberOfLines={1}>BhoomiMitra</Text>
        </View>
        <View style={styles.toggleWrap}>
          <LanguageToggle language={language} onChange={setLanguage} />
        </View>
      </View>

      {/* Bottom content */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Text testID="welcome-headline" style={styles.headline}>{t("welcomeHeadline", language)}</Text>
        <Text style={styles.sub}>{t("welcomeSub", language)}</Text>

        <View style={styles.featureList}>
          <FeatureRow icon="card-search" text={t("feature1", language)} />
          <FeatureRow icon="creation" text={t("feature2", language)} />
          <FeatureRow icon="map-marker-radius" text={t("feature3", language)} />
        </View>

        {/* Carousel dots */}
        <View style={styles.dots}>
          {CAROUSEL.map((_, i) => (
            <View key={i} style={[styles.dot, active === i && styles.dotActive]} />
          ))}
        </View>

        <Pressable testID="get-started-btn" style={styles.primary} onPress={() => setMode("signup")}>
          <Text style={styles.primaryLabel}>{t("getStarted", language)}</Text>
          <MaterialCommunityIcons name="arrow-right" size={22} color="#fff" />
        </Pressable>
        <Pressable testID="already-member-btn" style={styles.ghost} onPress={() => setMode("login")}>
          <Text style={styles.ghostLabel}>{t("alreadyMember", language)}</Text>
        </Pressable>
      </View>

      {/* Auth modal */}
      <Modal
        visible={mode !== null}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.modalCard} testID="auth-modal">
            <View style={styles.modalGrip} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{mode === "signup" ? t("createAccount", language) : t("login", language)}</Text>
              <Pressable testID="close-modal" onPress={closeModal} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color={theme.color.onSurface} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
              {mode === "signup" && (
                <>
                  <Text style={styles.label}>{t("name", language)}</Text>
                  <TextInput testID="modal-name" style={styles.input} value={name} onChangeText={setName} placeholder="Ravi Kumar" placeholderTextColor="#8B968B" />
                </>
              )}
              <Text style={styles.label}>{t("emailOrPhone", language)}</Text>
              <TextInput
                testID="modal-identifier"
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
                testID="modal-password"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••"
                placeholderTextColor="#8B968B"
              />
              {err && <Text style={styles.err} testID="modal-error">{err}</Text>}

              <Pressable testID="modal-submit" style={styles.modalPrimary} disabled={busy} onPress={submit}>
                <Text style={styles.modalPrimaryLabel}>{busy ? "..." : (mode === "signup" ? t("createAccount", language) : t("continue", language))}</Text>
              </Pressable>

              <Pressable
                testID="modal-swap"
                onPress={() => { setErr(null); setMode(mode === "signup" ? "login" : "signup"); }}
                style={styles.swapBtn}
              >
                <Text style={styles.swapLabel}>
                  {mode === "signup" ? t("haveAccount", language) : t("noAccount", language)}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const FeatureRow: React.FC<{ icon: any; text: string }> = ({ icon, text }) => (
  <View style={styles.featureRow}>
    <View style={styles.featureIcon}>
      <MaterialCommunityIcons name={icon} size={18} color="#fff" />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 2,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1, maxWidth: "55%" },
  brand: { color: "#fff", fontWeight: "800", fontSize: theme.font.base },
  toggleWrap: { flexShrink: 0 },
  bottom: {
    marginTop: "auto", paddingHorizontal: theme.spacing.xl, gap: theme.spacing.md,
  },
  headline: { color: "#fff", fontSize: 34, fontWeight: "800", lineHeight: 40 },
  sub: { color: "rgba(255,255,255,0.85)", fontSize: theme.font.lg, marginBottom: theme.spacing.md },
  featureList: { gap: 10, marginBottom: theme.spacing.md },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.color.brandPrimary, alignItems: "center", justifyContent: "center" },
  featureText: { color: "#fff", fontWeight: "600", fontSize: theme.font.base, flex: 1 },
  dots: { flexDirection: "row", gap: 6, marginVertical: theme.spacing.md, justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.35)" },
  dotActive: { backgroundColor: "#fff", width: 22 },
  primary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    minHeight: 58, borderRadius: theme.radius.pill, backgroundColor: theme.color.brandPrimary,
  },
  primaryLabel: { color: "#fff", fontSize: theme.font.lg, fontWeight: "800" },
  ghost: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  ghostLabel: { color: "#fff", fontWeight: "700", fontSize: theme.font.base, textDecorationLine: "underline" },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: theme.color.surfaceSecondary,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.xl,
    maxHeight: SH * 0.85,
  },
  modalGrip: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.color.borderStrong, alignSelf: "center", marginBottom: theme.spacing.md },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.md },
  modalTitle: { fontSize: theme.font.xl, fontWeight: "800", color: theme.color.onSurface },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.color.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  label: { fontSize: theme.font.base, fontWeight: "600", color: theme.color.onSurfaceTertiary },
  input: {
    minHeight: 54, borderWidth: 1.5, borderColor: theme.color.border, borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg, backgroundColor: theme.color.surface,
    fontSize: theme.font.lg, color: theme.color.onSurface,
  },
  err: { color: theme.color.error, fontWeight: "700" },
  modalPrimary: {
    minHeight: 56, borderRadius: theme.radius.md, backgroundColor: theme.color.brandPrimary,
    alignItems: "center", justifyContent: "center", marginTop: theme.spacing.sm,
  },
  modalPrimaryLabel: { color: "#fff", fontSize: theme.font.lg, fontWeight: "800" },
  swapBtn: { alignItems: "center", padding: theme.spacing.md, minHeight: 44, justifyContent: "center" },
  swapLabel: { color: theme.color.brandPrimary, fontWeight: "700" },
});
