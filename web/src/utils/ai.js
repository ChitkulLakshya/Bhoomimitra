import { buildRagiPlan } from './ragiEngine';
import { performLocalOCR } from './ocr';

const API_BASE = "http://localhost:8000/api";

export const analyzeCard = async (base64Image, onProgress = null) => {
  // Phase 3: Run OCR completely offline on the client side using Tesseract.js!
  return await performLocalOCR(base64Image, onProgress);
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
