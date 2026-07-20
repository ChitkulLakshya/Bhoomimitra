import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "./theme";
import { Lang, t } from "./i18n";

export const LanguageToggle: React.FC<{ language: Lang; onChange: (l: Lang) => void }> = ({ language, onChange }) => {
  return (
    <View style={s.wrap} testID="language-toggle">
      <Pressable
        testID="lang-en"
        onPress={() => onChange("en")}
        style={[s.pill, language === "en" && s.active]}
      >
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          style={[s.label, language === "en" && s.activeLabel]}
        >
          EN
        </Text>
      </Pressable>
      <Pressable
        testID="lang-kn"
        onPress={() => onChange("kn")}
        style={[s.pill, language === "kn" && s.active]}
      >
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          style={[s.label, language === "kn" && s.activeLabel]}
        >
          ಕನ್ನಡ
        </Text>
      </Pressable>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: theme.color.surfaceTertiary,
    borderRadius: theme.radius.pill,
    padding: 3,
    alignSelf: "flex-start",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    minHeight: 36,
    minWidth: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  active: { backgroundColor: theme.color.brandPrimary },
  label: {
    color: theme.color.onSurface,
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
    includeFontPadding: false,
  },
  activeLabel: { color: theme.color.onBrandPrimary },
});
