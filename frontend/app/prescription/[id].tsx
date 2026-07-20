import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/src/firebase";
import { theme } from "@/src/theme";
import { buildRagiPlan } from "@/src/utils/ragi";

export default function Prescription() {
  const { id, plotId } = useLocalSearchParams<{ id: string; plotId: string }>(); const router = useRouter(); const insets = useSafeAreaInsets(); const [plan, setPlan] = useState<any>();
  useEffect(() => { (async () => { const [p, r] = await Promise.all([getDoc(doc(db, "plots", plotId)), getDoc(doc(db, "readings", id))]); if (p.exists()) setPlan(buildRagiPlan(p.data(), r.exists() ? r.data() : null)); })().catch(console.warn); }, [id, plotId]);
  if (!plan) return <View style={styles.center}><ActivityIndicator size="large" color={theme.color.brandPrimary} /></View>;
  return <View style={{ flex: 1, backgroundColor: theme.color.surface }}><View style={[styles.hdr, { paddingTop: insets.top + 12 }]}><Pressable style={styles.iconBtn} onPress={() => router.back()}><MaterialCommunityIcons name="chevron-left" size={28} color={theme.color.onSurface} /></Pressable><Text style={styles.hdrTitle}>Ragi action plan</Text><View style={{ width: 40 }} /></View><ScrollView contentContainerStyle={styles.body}>
    <View style={styles.notice}><Text style={styles.noticeTitle}>{plan.verified ? "Verified Karnataka category guidance" : "Regional baseline — not soil-test specific"}</Text><Text>{plan.ruleSetVersion}</Text>{plan.warnings.map((w: string) => <Text key={w} style={styles.note}>• {w}</Text>)}</View>
    <Text style={styles.section}>Nutrient requirement</Text><View style={styles.card}><Text style={styles.big}>N {plan.nutrients.n} · P₂O₅ {plan.nutrients.p2o5} · K₂O {plan.nutrients.k2o} kg/ha</Text></View>
    <Text style={styles.section}>What to use</Text>{plan.products.map((p: any) => <View style={styles.card} key={p.name}><Text style={styles.cardTitle}>{p.name}</Text><Text><Text style={styles.bold}>How much: </Text>{p.kgPerAcre} kg/acre · {p.kgPerHa} kg/ha · {p.bags50kg} × 50 kg bags</Text><Text><Text style={styles.bold}>When/how: </Text>{p.timing}</Text><Text><Text style={styles.bold}>Estimated cost: </Text>₹{p.estimatedCost.toLocaleString("en-IN")}</Text></View>)}
    <Text style={styles.section}>Crop protection</Text><View style={styles.card}>{plan.prevention.map((p: string) => <Text key={p} style={styles.note}>• {p}</Text>)}</View>
  </ScrollView></View>;
}
const styles = StyleSheet.create({ center:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:theme.color.surface}, hdr:{flexDirection:"row",alignItems:"center",paddingHorizontal:theme.spacing.lg,paddingBottom:theme.spacing.md},hdrTitle:{flex:1,textAlign:"center",fontSize:theme.font.xl,fontWeight:"700",color:theme.color.onSurface},iconBtn:{width:40,height:40,alignItems:"center",justifyContent:"center"},body:{padding:theme.spacing.xl,paddingBottom:100},notice:{backgroundColor:theme.color.brandTertiary,padding:theme.spacing.lg,borderRadius:theme.radius.md},noticeTitle:{fontWeight:"800",color:theme.color.brandPrimary,marginBottom:6},note:{color:theme.color.onSurfaceTertiary,lineHeight:21,marginTop:5},section:{fontSize:theme.font.xl,fontWeight:"800",color:theme.color.onSurface,marginTop:theme.spacing.xl,marginBottom:theme.spacing.md},card:{backgroundColor:theme.color.surfaceSecondary,padding:theme.spacing.lg,borderRadius:theme.radius.md,borderWidth:1,borderColor:theme.color.border,marginBottom:theme.spacing.md,gap:7},cardTitle:{fontWeight:"800",fontSize:theme.font.lg,color:theme.color.onSurface},big:{fontSize:theme.font.lg,fontWeight:"800",color:theme.color.onSurface},bold:{fontWeight:"800"} });
