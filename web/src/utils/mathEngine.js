export const calculatePaths = (soilData) => {
  if (!soilData) {
    return {
      pathA: { yield: 0, cost: 0, labor: 0 },
      pathB: { yield: 0, cost: 0, labor: 0 },
      pathC: { yield: 0, cost: 0, labor: 0 }
    };
  }

  // Base parameters from soil test
  const n = soilData.nitrogen || 40;
  const p = soilData.phosphorus || 20;
  const k = soilData.potassium || 100;
  const ph = soilData.ph || 6.5;

  // Simple deterministic algorithm based on soil nutrient deficiencies
  // Ragi optimal: N=50, P=40, K=50, pH=6.5
  const nDeficit = Math.max(0, 50 - n);
  const pDeficit = Math.max(0, 40 - p);
  
  // Path A: Traditional (Organic, relies on existing soil + slow compost)
  // Low yield if deficient, very low cost, high labor
  const pathAYield = Math.min(100, Math.max(40, 70 - (nDeficit * 0.5) - (pDeficit * 0.5)));
  const pathACost = 20; 
  const pathALabor = 85;

  // Path B: Mixed (Balanced approach)
  // Good yield, medium cost, medium labor
  const pathBYield = Math.min(100, Math.max(60, 85 - (nDeficit * 0.2)));
  const pathBCost = 50 + (nDeficit * 0.3); // Cost goes up if you need more hybrid inputs
  const pathBLabor = 55;

  // Path C: Chemical (Synthetic inputs to guarantee yield regardless of starting soil)
  // High yield, high cost, low labor
  const pathCYield = Math.min(100, 95 - (Math.abs(6.5 - ph) * 2)); // Only pH heavily affects chemical yield
  const pathCCost = 80 + (nDeficit * 0.5) + (pDeficit * 0.5);
  const pathCLabor = 25;

  return {
    pathA: { yield: Math.round(pathAYield), cost: Math.round(pathACost), labor: Math.round(pathALabor) },
    pathB: { yield: Math.round(pathBYield), cost: Math.round(pathBCost), labor: Math.round(pathBLabor) },
    pathC: { yield: Math.round(pathCYield), cost: Math.round(pathCCost), labor: Math.round(pathCLabor) }
  };
};
