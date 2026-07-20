import React from "react";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useAuth } from "@/src/auth";
import { t } from "@/src/i18n";

export default function TabLayout() {
  const { language } = useAuth();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.brandPrimary,
        tabBarInactiveTintColor: "#8B968B",
        tabBarStyle: {
          backgroundColor: theme.color.surfaceSecondary,
          borderTopColor: theme.color.border,
          height: 68,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabHome", language),
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-variant" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-scan"
        options={{
          title: t("tabAI", language),
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="creation" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t("tabMap", language),
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="map-marker-radius" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabProfile", language),
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
