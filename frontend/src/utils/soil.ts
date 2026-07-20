export const classifyNutrient = (name: string, value: number): string => {
  if (name === "ph") {
      if (value < 6.0) return "low";
      if (value > 7.5) return "high";
      return "optimal";
  }
  if (name === "nitrogen") {
      if (value < 280) return "low";
      if (value > 560) return "high";
      return "optimal";
  }
  if (name === "phosphorus") {
      if (value < 10) return "low";
      if (value > 25) return "high";
      return "optimal";
  }
  if (name === "potassium") {
      if (value < 120) return "low";
      if (value > 280) return "high";
      return "optimal";
  }
  if (name === "organic_carbon") {
      if (value < 0.5) return "low";
      if (value > 0.75) return "high";
      return "optimal";
  }
  return "optimal";
};

export const calculateHealthScore = (status: Record<string, string>) => {
  let lows = 0;
  Object.values(status).forEach(v => {
      if (v === "low") lows++;
  });
  return Math.max(20, 100 - lows * 18);
};
