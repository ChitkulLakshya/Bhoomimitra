export const classifyNutrient = (name, value) => {
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

export const calculateHealthScore = (status) => {
  let lows = 0;
  Object.values(status).forEach(v => {
      if (v === "low" || v === "high") lows++;
  });
  return Math.max(20, 100 - lows * 18);
};

export const classifySoilReading = (name, value) => {
  if (value === '' || value === null || value === undefined || Number.isNaN(Number(value))) return 'not_read';
  return classifyNutrient(name, Number(value));
};
