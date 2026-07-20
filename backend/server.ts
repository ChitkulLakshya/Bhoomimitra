import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
// Increase JSON payload limit for base64 images
app.use(express.json({ limit: '10mb' }));

const port = process.env.PORT || 8000;

// Initialize the Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.EMERGENT_LLM_KEY });

// Health check
app.get('/api/', (req, res) => {
  res.json({ app: "BhoomiMitra AI", status: "ok", ts: new Date().toISOString() });
});

// Single-Pass Gemini Extraction Route
app.post('/api/ai/analyze-card', async (req, res) => {
  try {
    const { image_base64, mime = "image/jpeg" } = req.body;

    if (!image_base64) {
      return res.status(400).json({ detail: "Missing image_base64 in request" });
    }

    // Clean data URI prefix if present
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
      You are an expert agronomist that reads Indian government Soil Health Cards. 
      Look at this image. If it is NOT a legible Soil Health Card, immediately return is_valid as false and stop. 
      If it IS valid, extract the following values:
      ph, nitrogen (available N in kg/ha), phosphorus (P in kg/ha), potassium (K in kg/ha), organic_carbon (%), ec (dS/m), zinc (Zn in ppm), sulfur (S in ppm).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mime,
          }
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_valid: { type: Type.BOOLEAN, description: "True if this is a readable soil health card" },
            error_message: { type: Type.STRING, description: "Reason if not valid" },
            data: {
              type: Type.OBJECT,
              properties: {
                ph: { type: Type.NUMBER },
                nitrogen: { type: Type.NUMBER },
                phosphorus: { type: Type.NUMBER },
                potassium: { type: Type.NUMBER },
                organic_carbon: { type: Type.NUMBER },
                ec: { type: Type.NUMBER },
                zinc: { type: Type.NUMBER },
                sulfur: { type: Type.NUMBER },
              }
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    const output = JSON.parse(response.text);
    
    if (!output.is_valid) {
      return res.status(400).json({ detail: output.error_message || "Invalid Soil Health Card image" });
    }

    res.json(output.data || {});

  } catch (error: any) {
    console.error("AI Analysis Failed:", error);
    res.status(500).json({ detail: error.message || "Failed to analyze image" });
  }
});

app.listen(port, () => {
  console.log(`BhoomiMitra TS backend listening on port ${port}`);
});
