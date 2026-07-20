export const calculateRagiFertilizer = (soilReading, isIrrigated = false, fymTonsPerHa = 10) => {
  // Constants for STCR Equations (Bengaluru Red Soils / Alfisols)
  const T = isIrrigated ? 40 : 30; // Target Yield in quintals/ha (q/ha)
  
  // Nutrient contribution from Farm Yard Manure (FYM)
  // FYM contains approx 0.5% N, 0.2% P, 0.5% K
  const fymKg = fymTonsPerHa * 1000;
  const ON = fymKg * 0.005;
  const OP = fymKg * 0.002;
  const OK = fymKg * 0.005;

  // Extract soil test values (defaulting to safe averages if missing)
  const SN = soilReading.nitrogen || 250;
  const SP = soilReading.phosphorus || 25;
  const SK = soilReading.potassium || 140;

  // Calculate required Fertilizer (kg/ha) using ICAR UAS Bangalore equations
  let FN = (5.25 * T) - (0.45 * SN) - (0.70 * ON);
  let FP = (3.65 * T) - (1.15 * SP) - (0.80 * OP);
  let FK = (3.15 * T) - (0.15 * SK) - (0.65 * OK);

  // Floor at 0 (can't have negative fertilizer)
  FN = Math.max(0, FN);
  FP = Math.max(0, FP);
  FK = Math.max(0, FK);

  // Convert pure nutrients to commercial bags
  // Urea = 46% N (so 100kg Urea = 46kg N)
  // DAP = 18% N, 46% P2O5 (100kg DAP = 18kg N, 46kg P)
  // MOP = 60% K2O (100kg MOP = 60kg K)
  
  // 1. Calculate DAP needed to fulfill Phosphorus (FP)
  const dapNeededKg = (FP / 0.46);
  // DAP also provides Nitrogen
  const nFromDap = dapNeededKg * 0.18;
  
  // 2. Calculate remaining Nitrogen needed from Urea
  const remainingN = Math.max(0, FN - nFromDap);
  const ureaNeededKg = (remainingN / 0.46);
  
  // 3. Calculate MOP needed to fulfill Potassium (FK)
  const mopNeededKg = (FK / 0.60);

  // Calculate Bags (50kg bags)
  const bags = {
    urea: Math.ceil(ureaNeededKg / 50),
    dap: Math.ceil(dapNeededKg / 50),
    mop: Math.ceil(mopNeededKg / 50)
  };

  return {
    soil_values: { N: SN, P: SP, K: SK },
    requirements_kg_ha: { N: Math.round(FN), P: Math.round(FP), K: Math.round(FK) },
    bags_needed: bags,
    cost_estimate: (bags.urea * 266) + (bags.dap * 1350) + (bags.mop * 1700), // Rough INR prices
    is_irrigated: isIrrigated,
    target_yield: T,
    fym_tons: fymTonsPerHa
  };
};
