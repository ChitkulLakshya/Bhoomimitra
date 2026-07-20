import { RAGI_RULESET_VERSION, inputCatalog, nutrientRules, soilThresholds, cropCalendar, cropProtectionRules } from './ragiRules.js';

const round = (value, digits = 1) => Number(value.toFixed(digits));
const category = (value, thresholds) => value < thresholds.low ? 'low' : value > thresholds.high ? 'high' : 'medium';
const isNumber = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;

export const hasVerifiedSoilNpk = (reading) => {
  const safeReading = reading || {};
  return safeReading.verified === true && ['nitrogen', 'phosphorus', 'potassium'].every((key) => isNumber(safeReading[key]));
};

export const buildRagiPlan = (profile = {}, reading = null) => {
  const areaAcres = Number(profile.area_acres || profile.areaAcres || 1);
  const hectares = areaAcres * 0.404686;
  const water = String(profile.water_regime || profile.irrigation || 'rainfed').toLowerCase().includes('irrig') ? 'irrigated' : 'rainfed';
  const soilSpecific = hasVerifiedSoilNpk(reading);
  const baseline = nutrientRules.regionalBaseline[water];
  const nutrients = { ...baseline };
  const warnings = [];

  if (!soilSpecific) warnings.push('Regional baseline, not soil-test specific. Scan a Soil Health Card and verify N, P and K for soil-specific guidance.');
  if (nutrientRules.stcr.validatedForRegion === false) warnings.push('STCR target-yield equations are disabled until locally validated coefficients are approved.');
  if (soilSpecific) {
    const n = category(Number(reading.nitrogen), soilThresholds.nitrogen);
    const p = category(Number(reading.phosphorus), soilThresholds.phosphorus);
    const k = category(Number(reading.potassium), soilThresholds.potassium);
    // Category adjustments are deliberately transparent rather than unvalidated STCR math.
    nutrients.n = round(baseline.n * (n === 'low' ? 1.25 : n === 'high' ? 0.75 : 1));
    nutrients.p2o5 = round(baseline.p2o5 * (p === 'low' ? 1.25 : p === 'high' ? 0.75 : 1));
    nutrients.k2o = round(baseline.k2o * (k === 'low' ? 1.25 : k === 'high' ? 0.75 : 1));
    warnings.push(`Verified soil categories: N ${n}, P ${p}, K ${k}. Category-rule guidance must be locally reviewed before farmer release.`);
  }

  const dapKgHa = nutrients.p2o5 / inputCatalog.dap.nutrients.p2o5;
  const ureaKgHa = Math.max(0, (nutrients.n - dapKgHa * inputCatalog.dap.nutrients.n) / inputCatalog.urea.nutrients.n);
  const mopKgHa = nutrients.k2o / inputCatalog.mop.nutrients.k2o;
  const products = [
    ['dap', dapKgHa, 'Basal at sowing; band/place away from seed.'],
    ['urea', ureaKgHa, water === 'irrigated' ? 'Split: half basal, half at 25–30 DAS after irrigation.' : 'Split only with adequate soil moisture; do not apply to dry stressed crop.'],
    ['mop', mopKgHa, 'Apply basal and incorporate into soil.'],
  ].map(([id, kgHa, timing]) => {
    const item = inputCatalog[id]; const kgAcre = kgHa * 0.404686; const totalKg = kgAcre * areaAcres;
    return { id, name: item.name, kgPerHa: round(kgHa), kgPerAcre: round(kgAcre), totalKg: round(totalKg), bags50kg: round(totalKg / item.packKg, 2), estimatedCost: item.pricePerKg ? Math.round(totalKg * item.pricePerKg) : null, timing };
  });

  const amendments = [];
  if (isNumber(reading?.ph) && Number(reading.ph) < soilThresholds.ph.acidic) amendments.push('Acidic pH: discuss lime source and dose with the local agriculture officer; do not infer a dose from pH alone.');
  if (isNumber(reading?.ph) && Number(reading.ph) > soilThresholds.ph.alkaline) amendments.push('Alkaline pH: avoid blind amendment doses; seek local soil-test advice.');
  if (isNumber(reading?.ec) && Number(reading.ec) > soilThresholds.ec.saline) amendments.push('High EC: improve drainage and consult a local agriculture officer before fertilizer application.');
  if (profile.manure_available) amendments.push('FYM/compost: incorporate before sowing. Its nutrient credit is not subtracted unless a verified nutrient analysis is selected.');

  const sowing = profile.sowing_date ? new Date(profile.sowing_date) : null;
  const tasks = cropCalendar.map((stage) => ({ ...stage, instruction: stage[water], dueDate: sowing ? new Date(sowing.getTime() + stage.days[0] * 86400000).toISOString().slice(0, 10) : null }));
  return { ruleSetVersion: RAGI_RULESET_VERSION, sourceMode: soilSpecific ? 'verified-karnataka-category-rules' : 'regional-baseline-no-card', waterRegime: water, areaAcres, hectares: round(hectares, 3), nutrientsKgHa: nutrients, products, amendments, tasks, cropProtection: cropProtectionRules.prevention, warnings, soilSpecific };
};
