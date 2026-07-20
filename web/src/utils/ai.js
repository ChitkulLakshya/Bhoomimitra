import { buildRagiPlan } from './ragiEngine';
import { performLocalOCR } from './ocr';

const API_BASE = "http://localhost:8000/api";

export const analyzeCard = async (base64Image, onProgress = null) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (apiKey) {
    try {
      if (typeof onProgress === 'function') {
        onProgress({ stage: 'ai', progress: 0.3, message: 'Analyzing Soil Card with Gemini Flash...' });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this Soil Health Card image carefully. Extract the numeric values for soil metrics and provide recommendations for the farmer.
Return ONLY a valid JSON object matching this exact schema without markdown formatting:
{
  "ph": number or null,
  "nitrogen": number or null,
  "phosphorus": number or null,
  "potassium": number or null,
  "organic_carbon": number or null,
  "ec": number or null,
  "recommendations": ["short actionable advice item 1", "short advice item 2"]
}`
                  },
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: base64Image
                    }
                  }
                ]
              }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanedText = rawText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        if (typeof onProgress === 'function') {
          onProgress({ stage: 'complete', progress: 1.0, message: 'AI Analysis Complete!' });
        }

        return {
          ...parsed,
          confidence: {
            ph: parsed.ph ? 0.95 : 0,
            nitrogen: parsed.nitrogen ? 0.95 : 0,
            phosphorus: parsed.phosphorus ? 0.95 : 0,
            potassium: parsed.potassium ? 0.95 : 0
          },
          notes: 'Analyzed using Gemini 1.5 Flash Vision AI.'
        };
      }
    } catch (e) {
      console.warn("Gemini Flash Vision failed or timed out, falling back to Local OCR:", e);
    }
  }

  // Fallback to client-side offline OCR
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
