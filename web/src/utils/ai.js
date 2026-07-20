import { buildRagiPlan } from './ragiEngine';
import { performLocalOCR } from './ocr';

const API_BASE = "http://localhost:8000/api";

export const analyzeCard = async (base64Image, onProgress = null) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (apiKey) {
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-2.0-flash'
    ];

    for (const modelName of modelsToTry) {
      try {
        if (typeof onProgress === 'function') {
          onProgress({ stage: 'ai', progress: 0.3, message: `Analyzing Soil Card with ${modelName}...` });
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Analyze this Soil Health Card image carefully. Extract all soil health values and generate custom daily activity plans for the farmer based on the soil conditions.
Return ONLY a raw valid JSON object without markdown formatting:
{
  "ph": number or null,
  "nitrogen": number or null,
  "phosphorus": number or null,
  "potassium": number or null,
  "organic_carbon": number or null,
  "ec": number or null,
  "recommendations": ["short actionable advice 1", "short actionable advice 2"],
  "detailed_daily_activities": [
    {
      "id": "act_1",
      "name": "Activity Name (e.g. Eco-Compost Boost)",
      "summary": "Short dosage summary",
      "img": "/compost_sack.png",
      "timing": "Recommended timing window",
      "dosageDetail": "Detailed instruction and dosage per acre",
      "steps": [
        { "id": "s1", "label": "Step 1 instruction" },
        { "id": "s2", "label": "Step 2 instruction" }
      ],
      "info": {
        "why": "Why this specific activity is required for this soil condition",
        "stageGuide": "Recommended growth stage",
        "diyRecipe": "DIY natural recipe",
        "precautions": "Important safety or environmental precautions"
      }
    }
  ]
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
            onProgress({ stage: 'complete', progress: 1.0, message: 'Gemini Flash Analysis Complete!' });
          }

          return {
            ...parsed,
            confidence: {
              ph: parsed.ph ? 0.98 : 0,
              nitrogen: parsed.nitrogen ? 0.98 : 0,
              phosphorus: parsed.phosphorus ? 0.98 : 0,
              potassium: parsed.potassium ? 0.98 : 0
            },
            notes: `Analyzed using Gemini Flash Vision AI (${modelName}).`
          };
        }
      } catch (e) {
        console.warn(`Gemini Flash model ${modelName} failed, trying next:`, e);
      }
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
