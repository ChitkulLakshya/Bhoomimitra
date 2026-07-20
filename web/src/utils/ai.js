import { buildRagiPlan } from './ragiEngine';
const API_BASE = "http://localhost:8000/api";

export const analyzeCard = async (base64Image, onProgress = null) => {
  if (onProgress) {
    onProgress({ stage: 'uploading', progress: 0.3, message: 'Uploading to AI...' });
  }

  const res = await fetch(`${API_BASE}/ai/analyze-card`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: base64Image, mime: "image/jpeg" })
  });

  if (onProgress) {
    onProgress({ stage: 'parsing', progress: 0.8, message: 'Extracting Values...' });
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to analyze card");
  }

  return res.json();
};

export const scanSoil = async (base64Image, crop) => {
  const res = await fetch(`${API_BASE}/ai/scan-soil`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: base64Image, target_crop: crop, language: "en" })
  });
  if (!res.ok) throw new Error("Failed to scan soil");
  return res.json();
};

export const generatePrescription = async (plot, reading) => {
  return { raw_data: buildRagiPlan(plot, reading) };
};
