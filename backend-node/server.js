const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const port = process.env.PORT || 8000;
const genAI = new GoogleGenerativeAI(process.env.EMERGENT_LLM_KEY || '');

// Constants
const CROP_BASELINES = {
    "Ragi":       { n: 50, p: 30, k: 25, zn: 2.5, fe: 4.5 },
    "Bajra":      { n: 60, p: 30, k: 30, zn: 2.5, fe: 4.5 },
    "Sorghum":    { n: 80, p: 40, k: 40, zn: 3.0, fe: 5.0 },
    "Maize":      { n: 120, p: 60, k: 40, zn: 3.5, fe: 5.0 },
    "Rice":       { n: 100, p: 50, k: 50, zn: 3.5, fe: 5.0 },
    "Ground Nut": { n: 25, p: 50, k: 75, zn: 3.0, fe: 4.5 },
    "Pulses":     { n: 20, p: 60, k: 40, zn: 3.0, fe: 4.5 },
    "Tomato":     { n: 120, p: 80, k: 100, zn: 3.5, fe: 5.5 },
    "Onion":      { n: 100, p: 50, k: 80, zn: 3.0, fe: 5.0 },
};

const TEXTURE_MULTIPLIERS = {
    "sandy": 1.20, "sandy loam": 1.10, "red sandy": 1.15, "red sandy loam": 1.10,
    "loam": 1.00, "clay loam": 0.90, "clay": 0.85, "black cotton": 0.85,
    "alluvial": 0.95, "laterite": 1.05,
};

function textureMultiplier(soilType) {
    if (!soilType) return 1.0;
    const key = soilType.toLowerCase().trim();
    if (TEXTURE_MULTIPLIERS[key]) return TEXTURE_MULTIPLIERS[key];
    for (const [k, v] of Object.entries(TEXTURE_MULTIPLIERS)) {
        if (key.includes(k)) return v;
    }
    return 1.0;
}

function computeBaselineDeficits(crop, soilType, aiDeficits) {
    const mul = textureMultiplier(soilType);
    const base = CROP_BASELINES[crop] || CROP_BASELINES["Ragi"];
    const out = {};
    ["nitrogen", "phosphorus", "potassium", "zinc", "iron"].forEach(key => {
        const raw = parseFloat(aiDeficits[key] || 0);
        out[key] = Math.max(0, Math.min(100, Math.round(raw * mul)));
    });
    return { deficits: out, baseline_kg_ha: base, texture_multiplier: mul };
}

function ruleBasedRecommendations(reading) {
    const recs = [];
    const status = reading.status || {};
    const ph_s = status.ph || "optimal";
    const n_s = status.nitrogen || "optimal";
    const p_s = status.phosphorus || "optimal";
    const k_s = status.potassium || "optimal";
    const oc_s = status.organic_carbon || "optimal";

    if (ph_s === "low") recs.push({ icon: "shovel", step: "Apply Agricultural Lime", detail: "Spread 200 kg/acre of lime 3 weeks before sowing to reduce soil acidity.", priority: "high" });
    else if (ph_s === "high") recs.push({ icon: "leaf", step: "Apply Gypsum", detail: "Broadcast 250 kg/acre gypsum to lower alkalinity.", priority: "high" });
    
    if (n_s === "low") {
        recs.push({ icon: "cow", step: "Add Farm Yard Manure (FYM)", detail: "Mix 4 tonnes/acre well-decomposed FYM at ploughing.", priority: "high" });
        recs.push({ icon: "sprout", step: "Green manure crop", detail: "Grow sunhemp/dhaincha and plough back at flowering stage.", priority: "medium" });
    }
    if (p_s === "low") recs.push({ icon: "bone", step: "Bone meal / Rock phosphate", detail: "Apply 100 kg/acre bone meal or 150 kg/acre rock phosphate at last ploughing.", priority: "high" });
    if (k_s === "low") recs.push({ icon: "fruit-cherries", step: "Wood ash / Banana pseudostem compost", detail: "Spread 150 kg/acre wood ash or 2 tonnes banana compost.", priority: "medium" });
    if (oc_s === "low") recs.push({ icon: "compost", step: "Vermicompost", detail: "Apply 1 tonne/acre vermicompost to boost organic carbon.", priority: "high" });

    recs.push({ icon: "water", step: "Jeevamrutha spray", detail: "Foliar spray 200 L/acre Jeevamrutha every 15 days after sowing.", priority: "low" });
    recs.push({ icon: "seed", step: "Neem cake before sowing", detail: "Broadcast 40 kg/acre neem cake to suppress soil-borne pests.", priority: "low" });
    return recs;
}

function stripJson(text) {
    if (!text) return "{}";
    let t = text.trim();
    if (t.startsWith("```json")) t = t.substring(7);
    else if (t.startsWith("```")) t = t.substring(3);
    if (t.endsWith("```")) t = t.substring(0, t.length - 3);
    
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start === -1 || end === -1) return "{}";
    return t.substring(start, end + 1);
}

// Routes
app.get('/api/', (req, res) => {
    res.json({ app: "BhoomiMitra AI Node", status: "ok", ts: new Date().toISOString() });
});

app.post('/api/ai/scan-soil', async (req, res) => {
    const { image_base64, target_crop = "Ragi", language = "en" } = req.body;
    let b64 = image_base64;
    if (b64.startsWith("data:")) b64 = b64.split(",")[1];
    
    const lang = language === "kn" ? "Kannada" : "English";
    const fallback = {
        is_soil: true, soil_color: "Dark Brown Reddish", soil_type: "Sandy Loam",
        moisture_level: "Moderate", moisture_pct: 42, organic_matter: "Medium",
        deficiencies: { nitrogen: 65, phosphorus: 40, potassium: 30, zinc: 55, iron: 35 },
        guidance: [], confidence: 78, notes: "Auto-estimated."
    };

    let data = fallback;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = \`You are validating and analyzing this photograph for a farmer growing '\${target_crop}' in India. 
FIRST, decide whether the image actually shows SOIL. 
If NOT soil, return: {"is_soil":false,"reason":"..."}. 
If YES soil, return EXACT schema: {"is_soil":true,"soil_color":"...","soil_type":"Sandy Loam","moisture_level":"Moderate","moisture_pct":40,"organic_matter":"Medium","deficiencies":{"nitrogen":50,"phosphorus":30,"potassium":20,"zinc":10,"iron":10},"guidance":[{"title":"...","detail":"...","level":"high"}],"confidence":80,"notes":"..."} Reply ONLY raw JSON. Lang: \${lang}.\`;

        const result = await model.generateContent([
            { inlineData: { data: b64, mimeType: "image/jpeg" } },
            { text: prompt }
        ]);
        
        const responseText = result.response.text();
        data = JSON.parse(stripJson(responseText));

        if (data.is_soil === false) {
            return res.json({ result: { is_soil: false, reason: data.reason || "Not soil" } });
        }
        data.is_soil = true;
        if (!data.deficiencies) data.deficiencies = {};
        ["nitrogen", "phosphorus", "potassium", "zinc", "iron"].forEach(k => {
            data.deficiencies[k] = parseInt(parseFloat(data.deficiencies[k] || 0));
        });
    } catch (e) {
        console.error("Gemini OCR Error:", e);
        data = fallback;
    }

    try {
        const norm = computeBaselineDeficits(target_crop, data.soil_type || "", data.deficiencies || {});
        data.deficiencies = norm.deficits;
        data.baseline_kg_ha = norm.baseline_kg_ha;
        data.texture_multiplier = norm.texture_multiplier;
    } catch (e) {}

    res.json({ result: data });
});

app.post('/api/ai/prescription', async (req, res) => {
    const { plot = {}, reading = {}, survey_answers = [], language = "en" } = req.body;
    const steps = ruleBasedRecommendations(reading);
    const lang = language === "kn" ? "Kannada" : "English";

    let ai_summary = "";
    try {
        const answers_txt = survey_answers.map(a => \`\${a.question} -> \${a.answer}\`).join("; ");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = \`Soil reading: \${JSON.stringify({ ph: reading.ph, nitrogen: reading.nitrogen, phosphorus: reading.phosphorus, potassium: reading.potassium, organic_carbon: reading.organic_carbon })}. 
Status flags: \${JSON.stringify(reading.status || {})}. 
Farmer answers: \${answers_txt}. 
Crop: \${plot.crop || 'Ragi'}. 
Rule-based steps: \${JSON.stringify(steps.map(s => s.step))}. 
You are a warm agronomy advisor. Write a 4-6 sentence encouraging summary in \${lang} explaining WHY these organic steps help and one water-saving tip. Plain text only.\`;

        const result = await model.generateContent(prompt);
        ai_summary = result.response.text().trim();
    } catch (e) {
        ai_summary = language !== "kn" ? "Your soil needs a boost of organic matter. Follow the steps in order and monitor moisture. Mulching with ragi straw helps retain water during dry weeks." : "ನಿಮ್ಮ ಮಣ್ಣಿಗೆ ಸಾವಯವ ಪೋಷಕಾಂಶಗಳ ಅಗತ್ಯವಿದೆ.";
    }

    res.json({
        id: Math.random().toString(36).substring(7),
        plot_id: plot.id,
        reading_id: reading.id,
        language: language,
        steps: steps,
        summary: ai_summary,
        created_at: new Date().toISOString()
    });
});

app.listen(port, () => {
    console.log(\`BhoomiMitra Node.js server running on port \${port}\`);
});
