import { buildRagiPlan } from './ragiEngine';
import { performLocalOCR } from './ocr';

const API_BASE = "http://localhost:8000/api";

export const analyzeCard = async (base64Image, onProgress = null, language = 'en') => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (apiKey) {
    const modelsToTry = [
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest'
    ];

    for (const modelName of modelsToTry) {
        let attempts = 0;
        let success = false;
        
        while (attempts < 2 && !success) {
          try {
            if (typeof onProgress === 'function') {
              onProgress({ stage: 'ai', progress: 0.2, message: `Extracting soil data with Gemini Vision... (Attempt ${attempts + 1})` });
            }

            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  generationConfig: { responseMimeType: "application/json" },
                  contents: [
                    {
                      parts: [
                        {
                          text: `Analyze this Soil Health Card image carefully. Extract all soil health values exactly. The image contains a table with "Soil Test Results". You must find the numbers for: "pH" -> map to "ph", "EC" -> map to "ec", "Organic Carbon (OC)" -> map to "organic_carbon", "Available Nitrogen (N)" -> map to "nitrogen", "Available Phosphorus (P)" -> map to "phosphorus", "Available Potassium (K)" -> map to "potassium". 
    Return ONLY a valid JSON object matching this schema:
    {
      "ph": number or null,
      "nitrogen": number or null,
      "phosphorus": number or null,
      "potassium": number or null,
      "organic_carbon": number or null,
      "ec": number or null
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
              const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
              const extractedValues = JSON.parse(rawText);
              success = true;

              if (typeof onProgress === 'function') {
                onProgress({ stage: 'ai', progress: 0.6, message: 'Generating deterministic advisory via Groq LLaMA3...' });
              }

              const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
              let groqData = { recommendations_en: [], recommendations_kn: [], detailed_daily_activities_en: [], detailed_daily_activities_kn: [] };
              
              try {
                const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    model: 'llama3-70b-8192',
                    response_format: { type: 'json_object' },
                    messages: [
                      {
                        role: 'system',
                        content: `You are an expert agronomist AI. Given soil numeric values, generate exact recommendations and deterministic daily activity plans.
CRITICAL INSTRUCTION: You MUST generate the exact same plan in BOTH English and Kannada simultaneously.
Return ONLY a valid JSON object matching this schema:
{
  "recommendations_en": ["short actionable advice 1", "short advice 2"],
  "recommendations_kn": ["ಕನ್ನಡದಲ್ಲಿ ಸಲಹೆ 1", "ಸಲಹೆ 2"],
  "detailed_daily_activities_en": [
    {
      "id": "act_1",
      "name": "Activity Name (e.g. Eco-Compost Boost or Urea Application)",
      "summary": "Short dosage summary",
      "img": "/compost_sack.png",
      "timing": "Recommended time of day",
      "quantity_per_acre": "Exact quantity (e.g. 50kg or 2 Liters)",
      "duration_days": "Number of days or frequency (e.g. 3 Days or Once every 15 days)",
      "dosageDetail": "Detailed instruction and dosage per acre",
      "steps": [
        { "id": "s1", "label": "Step 1 instruction" }
      ],
      "info": {
        "why": "Why this specific activity is required",
        "stageGuide": "Recommended growth stage",
        "diyRecipe": "DIY recipe or formulation info",
        "precautions": "Important safety or environmental precautions"
      }
    }
  ],
  "detailed_daily_activities_kn": [
    {
      "id": "act_1",
      "name": "ಕನ್ನಡದಲ್ಲಿ ಚಟುವಟಿಕೆಯ ಹೆಸರು",
      "summary": "ಕನ್ನಡದಲ್ಲಿ ಸಾರಾಂಶ",
      "img": "/compost_sack.png",
      "timing": "ಸಮಯ",
      "quantity_per_acre": "ಪ್ರಮಾಣ",
      "duration_days": "ಅವಧಿ",
      "dosageDetail": "ವಿವರವಾದ ಸೂಚನೆ",
      "steps": [
        { "id": "s1", "label": "ಹಂತ 1 ರ ಸೂಚನೆ" }
      ],
      "info": {
        "why": "ಏಕೆ ಬೇಕು",
        "stageGuide": "ಬೆಳವಣಿಗೆಯ ಹಂತ",
        "diyRecipe": "ಮಾಡುವ ವಿಧಾನ",
        "precautions": "ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು"
      }
    }
  ]
}`
                      },
                      {
                        role: 'user',
                        content: `Soil parameters: ${JSON.stringify(extractedValues)}`
                      }
                    ]
                  })
                });

                if (groqResponse.ok) {
                  const groqResData = await groqResponse.json();
                  groqData = JSON.parse(groqResData.choices[0].message.content);
                } else {
                  console.warn("Groq API failed, using empty recommendations", await groqResponse.text());
                }
              } catch (groqErr) {
                console.warn("Failed to reach Groq API:", groqErr);
              }

              if (typeof onProgress === 'function') {
                onProgress({ stage: 'complete', progress: 1.0, message: 'Two-Stage Analysis Complete!' });
              }

              return {
                ...extractedValues,
                ...groqData,
                confidence: {
                  ph: extractedValues.ph ? 0.98 : 0,
                  nitrogen: extractedValues.nitrogen ? 0.98 : 0,
                  phosphorus: extractedValues.phosphorus ? 0.98 : 0,
                  potassium: extractedValues.potassium ? 0.98 : 0
                },
                notes: `Data extracted by Gemini (${modelName}), analyzed by Groq LLaMA3-70b.`
              };
            } else if (response.status === 503 || response.status === 429) {
              console.warn(`Gemini API returned ${response.status}. Retrying in 2 seconds...`);
              await new Promise(r => setTimeout(r, 2000));
              attempts++;
            } else {
              console.warn(`Gemini API failed with status ${response.status}`);
              break; // Don't retry for 400 Bad Request, just try next model
            }
          } catch (e) {
            console.warn(`Gemini Flash model ${modelName} failed, trying next:`, e);
            break;
          }
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

