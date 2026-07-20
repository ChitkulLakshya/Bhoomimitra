export const RAGI_RULESET_VERSION = "karnataka-ragi-2026.1-draft";
const baseline = { rainfed: { n: 40, p2o5: 20, k2o: 20 }, irrigated: { n: 60, p2o5: 30, k2o: 30 } };
const category = (value: number, low: number, high: number) => value < low ? "low" : value > high ? "high" : "medium";
const r = (n: number, d = 1) => Number(n.toFixed(d));

export function buildRagiPlan(profile: any = {}, reading: any = null) {
  const water = String(profile.water_regime || "rainfed").toLowerCase().includes("irrig") ? "irrigated" : "rainfed";
  const verified = reading?.verified === true && ["nitrogen", "phosphorus", "potassium"].every(k => Number.isFinite(Number(reading[k])) && Number(reading[k]) >= 0);
  const nutrients = { ...baseline[water] };
  const warnings = ["STCR target-yield equations are disabled until locally validated coefficients are approved."];
  if (verified) {
    const n = category(Number(reading.nitrogen), 280, 560), p = category(Number(reading.phosphorus), 10, 25), k = category(Number(reading.potassium), 120, 280);
    nutrients.n = r(nutrients.n * (n === "low" ? 1.25 : n === "high" ? .75 : 1)); nutrients.p2o5 = r(nutrients.p2o5 * (p === "low" ? 1.25 : p === "high" ? .75 : 1)); nutrients.k2o = r(nutrients.k2o * (k === "low" ? 1.25 : k === "high" ? .75 : 1));
    warnings.unshift(`Verified soil categories: N ${n}, P ${p}, K ${k}. Category rules require local agronomist review before release.`);
  } else warnings.unshift("Regional baseline, not soil-test specific. Verify N, P and K from a Soil Health Card for soil-specific guidance.");
  const area = Number(profile.area_acres || 1); const dap = nutrients.p2o5 / .46, urea = Math.max(0, (nutrients.n - dap * .18) / .46), mop = nutrients.k2o / .60;
  const products = [["DAP", dap, 27, "Basal at sowing; place away from seed."], ["Urea", urea, 5.32, water === "irrigated" ? "Half basal; half at 25–30 DAS after irrigation." : "Split only when soil has adequate moisture."], ["MOP", mop, 34, "Apply basal and incorporate into soil."]].map(([name, perHa, price, timing]: any) => { const perAcre = perHa * .404686, total = perAcre * area; return { name, kgPerHa: r(perHa), kgPerAcre: r(perAcre), totalKg: r(total), bags50kg: r(total / 50, 2), estimatedCost: Math.round(total * price), timing }; });
  return { ruleSetVersion: RAGI_RULESET_VERSION, verified, nutrients, products, warnings, prevention: ["Scout twice weekly; keep field sanitation and drainage.", "No automatic pesticide spray is recommended. Consult a local agriculture officer for symptoms." ] };
}
