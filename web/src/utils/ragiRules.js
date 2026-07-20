// Versioned, reviewable Karnataka ragi rules. Values are a regional baseline only
// until signed off by a local UAS Bengaluru/KVK agronomist.
export const RAGI_RULESET_VERSION = 'karnataka-ragi-2026.1-draft';

export const inputCatalog = {
  urea: { name: 'Urea', nutrients: { n: 0.46 }, packKg: 50, pricePerKg: 5.32 },
  dap: { name: 'DAP', nutrients: { n: 0.18, p2o5: 0.46 }, packKg: 50, pricePerKg: 27 },
  mop: { name: 'MOP', nutrients: { k2o: 0.60 }, packKg: 50, pricePerKg: 34 },
  fym: { name: 'Farmyard manure / compost', nutrients: null, packKg: null, pricePerKg: null },
};

export const nutrientRules = {
  regionalBaseline: {
    label: 'Karnataka ragi regional baseline — not soil-test specific',
    rainfed: { n: 40, p2o5: 20, k2o: 20 },
    irrigated: { n: 60, p2o5: 30, k2o: 30 },
  },
  stcr: { validatedForRegion: false, coefficients: null },
};

export const soilThresholds = {
  nitrogen: { low: 280, high: 560 },
  phosphorus: { low: 10, high: 25 },
  potassium: { low: 120, high: 280 },
  ph: { acidic: 6, alkaline: 7.5 },
  ec: { saline: 4 },
};

export const cropCalendar = [
  { days: [0, 7], title: 'Land preparation and sowing', rainfed: 'Sow with dependable rains; place basal inputs away from seed.', irrigated: 'Prepare a fine seedbed and irrigate lightly after sowing.' },
  { days: [8, 20], title: 'Emergence and establishment', rainfed: 'Check emergence and conserve moisture; avoid waterlogging.', irrigated: 'Check emergence and irrigate only if the root zone is dry.' },
  { days: [21, 35], title: 'Weeding and tillering', rainfed: 'Weed and thin; top-dress nitrogen only when soil has adequate moisture.', irrigated: 'Weed and thin; split nitrogen top-dressing after irrigation.' },
  { days: [36, 60], title: 'Flowering', rainfed: 'Keep drainage open and scout for pests and diseases.', irrigated: 'Avoid moisture stress at flowering; maintain drainage.' },
  { days: [61, 120], title: 'Grain filling and harvest', rainfed: 'Monitor moisture and harvest when ears are mature.', irrigated: 'Avoid standing water; harvest after physiological maturity.' },
];

export const cropProtectionRules = {
  prevention: ['Scout twice weekly for leaf spots, blast symptoms, insects and waterlogging.', 'Use clean seed, field sanitation and drainage. Do not spray on a calendar.'],
  chemicals: [], // Chemical records must be approved locally and include crop, formulation, dose, PPE and waiting period.
};
