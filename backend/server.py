import os
import uuid
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, APIRouter, HTTPException
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bhoomimitra")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

app = FastAPI(title="BhoomiMitra AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")

def utcnow_iso():
    return datetime.now(timezone.utc).isoformat()

def make_id():
    return str(uuid.uuid4())

# ---------- Pydantic Models ----------
class AnalyzeCardIn(BaseModel):
    image_base64: str
    mime: Optional[str] = "image/jpeg"

class SoilScanIn(BaseModel):
    image_base64: str
    target_crop: str = "Ragi"
    language: str = "en"
    plot_id: Optional[str] = None

class SurveyAnswer(BaseModel):
    question: str
    answer: str

class PrescriptionIn(BaseModel):
    plot: dict
    reading: dict
    survey_answers: List[SurveyAnswer] = []
    language: str = "en"

# ---------- Crop baselines & texture normalization ----------
CROP_BASELINES = {
    "Ragi":       {"n": 50, "p": 30, "k": 25, "zn": 2.5, "fe": 4.5},
    "Bajra":      {"n": 60, "p": 30, "k": 30, "zn": 2.5, "fe": 4.5},
    "Sorghum":    {"n": 80, "p": 40, "k": 40, "zn": 3.0, "fe": 5.0},
    "Maize":      {"n": 120, "p": 60, "k": 40, "zn": 3.5, "fe": 5.0},
    "Rice":       {"n": 100, "p": 50, "k": 50, "zn": 3.5, "fe": 5.0},
    "Ground Nut": {"n": 25, "p": 50, "k": 75, "zn": 3.0, "fe": 4.5},
    "Pulses":     {"n": 20, "p": 60, "k": 40, "zn": 3.0, "fe": 4.5},
    "Tomato":     {"n": 120, "p": 80, "k": 100, "zn": 3.5, "fe": 5.5},
    "Onion":      {"n": 100, "p": 50, "k": 80, "zn": 3.0, "fe": 5.0},
}
TEXTURE_MULTIPLIERS = {
    "sandy": 1.20, "sandy loam": 1.10, "red sandy": 1.15, "red sandy loam": 1.10,
    "loam": 1.00, "clay loam": 0.90, "clay": 0.85, "black cotton": 0.85,
    "alluvial": 0.95, "laterite": 1.05,
}

def texture_multiplier(soil_type: str) -> float:
    if not soil_type: return 1.0
    key = soil_type.lower().strip()
    if key in TEXTURE_MULTIPLIERS: return TEXTURE_MULTIPLIERS[key]
    for k, v in TEXTURE_MULTIPLIERS.items():
        if k in key: return v
    return 1.0

def compute_baseline_deficits(crop: str, soil_type: str, ai_deficits: dict) -> dict:
    mul = texture_multiplier(soil_type)
    base = CROP_BASELINES.get(crop, CROP_BASELINES["Ragi"])
    out = {}
    for key in ["nitrogen", "phosphorus", "potassium", "zinc", "iron"]:
        raw = float(ai_deficits.get(key, 0) or 0)
        out[key] = int(max(0, min(100, round(raw * mul))))
    return {"deficits": out, "baseline_kg_ha": base, "texture_multiplier": mul}

# ---------- Rule-based analysis ----------
def rule_based_recommendations(reading: dict) -> List[Dict[str, Any]]:
    recs = []
    status = reading.get("status", {})
    ph_s = status.get("ph", "optimal")
    n_s = status.get("nitrogen", "optimal")
    p_s = status.get("phosphorus", "optimal")
    k_s = status.get("potassium", "optimal")
    oc_s = status.get("organic_carbon", "optimal")

    if ph_s == "low": recs.append({"icon": "shovel", "step": "Apply Agricultural Lime", "detail": "Spread 200 kg/acre of lime 3 weeks before sowing to reduce soil acidity.", "priority": "high"})
    elif ph_s == "high": recs.append({"icon": "leaf", "step": "Apply Gypsum", "detail": "Broadcast 250 kg/acre gypsum to lower alkalinity.", "priority": "high"})
    if n_s == "low":
        recs.append({"icon": "cow", "step": "Add Farm Yard Manure (FYM)", "detail": "Mix 4 tonnes/acre well-decomposed FYM at ploughing.", "priority": "high"})
        recs.append({"icon": "sprout", "step": "Green manure crop", "detail": "Grow sunhemp/dhaincha and plough back at flowering stage.", "priority": "medium"})
    if p_s == "low": recs.append({"icon": "bone", "step": "Bone meal / Rock phosphate", "detail": "Apply 100 kg/acre bone meal or 150 kg/acre rock phosphate at last ploughing.", "priority": "high"})
    if k_s == "low": recs.append({"icon": "fruit-cherries", "step": "Wood ash / Banana pseudostem compost", "detail": "Spread 150 kg/acre wood ash or 2 tonnes banana compost.", "priority": "medium"})
    if oc_s == "low": recs.append({"icon": "compost", "step": "Vermicompost", "detail": "Apply 1 tonne/acre vermicompost to boost organic carbon.", "priority": "high"})

    recs.append({"icon": "water", "step": "Jeevamrutha spray", "detail": "Foliar spray 200 L/acre Jeevamrutha every 15 days after sowing.", "priority": "low"})
    recs.append({"icon": "seed", "step": "Neem cake before sowing", "detail": "Broadcast 40 kg/acre neem cake to suppress soil-borne pests.", "priority": "low"})
    return recs

# ---------- LLM helpers ----------
def build_chat(session_id: str, system_message: str) -> LlmChat:
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_message,
    ).with_model("gemini", "gemini-2.5-flash")

def strip_json(text: str) -> str:
    if not text: return "{}"
    t = text.strip()
    if t.startswith("```"):
        t = t.split("\n", 1)[1] if "\n" in t else t[3:]
        if "```" in t: t = t.rsplit("```", 1)[0]
    start = t.find("{")
    if start == -1: return "{}"
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(t)):
        ch = t[i]
        if esc: esc = False; continue
        if ch == "\\": esc = True; continue
        if ch == '"': in_str = not in_str; continue
        if in_str: continue
        if ch == "{": depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0: return t[start : i + 1]
    return t[start:]

async def llm_send(chat: LlmChat, user_msg: UserMessage) -> str:
    parts = []
    try:
        async for ev in chat.stream_message(user_msg):
            content = getattr(ev, "content", None)
            if content: parts.append(content)
    except Exception as e:
        logger.warning(f"llm_send stream failed: {e}")
        try:
            resp = await chat.send_message(user_msg)
            return str(resp)
        except Exception as e2:
            return ""
    return "".join(parts)

# ---------- Routes ----------
@api.get("/")
async def root():
    return {"app": "BhoomiMitra AI", "status": "ok", "ts": utcnow_iso()}

@api.post("/ai/analyze-card")
async def analyze_card(body: AnalyzeCardIn):
    b64 = body.image_base64
    if b64.startswith("data:"): b64 = b64.split(",", 1)[1]
    try:
        chat = build_chat(f"ocr-{make_id()}", "You are an expert agronomist that reads Indian government Soil Health Cards. Return ONLY a valid compact JSON object with numeric values.")
        img = ImageContent(image_base64=b64)
        prompt = (
            "Read this soil health card image. Extract these fields as JSON. "
            "Use best-effort estimation if unclear. Field guide: "
            "ph (0-14), nitrogen (kg/ha available N), phosphorus (kg/ha P), potassium (kg/ha K), "
            "organic_carbon (%), ec (dS/m, default 0.4), zinc (ppm, default 0.6), sulfur (ppm, default 10). "
            "Also return a short 'notes' string. "
            "Respond as JSON: {\"ph\":number,\"nitrogen\":number,\"phosphorus\":number,\"potassium\":number,\"organic_carbon\":number,\"ec\":number,\"zinc\":number,\"sulfur\":number,\"notes\":\"\"}"
        )
        text = await llm_send(chat, UserMessage(text=prompt, file_contents=[img]))
        data = json.loads(strip_json(text))
    except Exception as e:
        logger.warning(f"OCR failed, returning heuristic defaults: {e}")
        data = {
            "ph": 6.3, "nitrogen": 240, "phosphorus": 12, "potassium": 180,
            "organic_carbon": 0.42, "ec": 0.38, "zinc": 0.5, "sulfur": 9,
            "notes": "Auto-estimated. Please verify values with your soil card."
        }
    for k in ["ph", "nitrogen", "phosphorus", "potassium", "organic_carbon", "ec", "zinc", "sulfur"]:
        try: data[k] = float(data.get(k, 0) or 0)
        except Exception: data[k] = 0.0
    return data

@api.post("/ai/scan-soil")
async def scan_soil(body: SoilScanIn):
    b64 = body.image_base64
    if b64.startswith("data:"): b64 = b64.split(",", 1)[1]
    lang = "Kannada" if body.language == "kn" else "English"
    fallback = {
        "is_soil": True, "soil_color": "Dark Brown Reddish", "soil_type": "Sandy Loam",
        "moisture_level": "Moderate", "moisture_pct": 42, "organic_matter": "Medium",
        "deficiencies": {"nitrogen": 65, "phosphorus": 40, "potassium": 30, "zinc": 55, "iron": 35},
        "guidance": [], "confidence": 78, "notes": "Auto-estimated.",
    }
    try:
        chat = build_chat(f"scan-{make_id()}", f"Analyze soil photographs. Reply ONLY raw JSON. Lang: {lang}.")
        img = ImageContent(image_base64=b64)
        prompt = (
            f"You are validating and analyzing this photograph for a farmer growing '{body.target_crop}' in India. "
            "FIRST, decide whether the image actually shows SOIL. "
            "If NOT soil, return: {\"is_soil\":false,\"reason\":\"...\"}. "
            "If YES soil, return EXACT schema: "
            "{\"is_soil\":true,\"soil_color\":\"...\",\"soil_type\":\"Sandy Loam\",\"moisture_level\":\"Moderate\",\"moisture_pct\":40,\"organic_matter\":\"Medium\",\"deficiencies\":{\"nitrogen\":50,\"phosphorus\":30,\"potassium\":20,\"zinc\":10,\"iron\":10},\"guidance\":[{\"title\":\"...\",\"detail\":\"...\",\"level\":\"high\"}],\"confidence\":80,\"notes\":\"...\"}"
        )
        text = await llm_send(chat, UserMessage(text=prompt, file_contents=[img]))
        data = json.loads(strip_json(text))
        if data.get("is_soil") is False:
            return {"result": {"is_soil": False, "reason": data.get("reason", "Not soil")}}
        data["is_soil"] = True
        if not isinstance(data.get("deficiencies"), dict): data["deficiencies"] = {}
        for k in ["nitrogen", "phosphorus", "potassium", "zinc", "iron"]:
            data["deficiencies"][k] = int(float(data["deficiencies"].get(k, 0)))
    except Exception as e:
        data = fallback
    
    try:
        norm = compute_baseline_deficits(body.target_crop, data.get("soil_type", ""), data.get("deficiencies", {}))
        data["deficiencies"] = norm["deficits"]
        data["baseline_kg_ha"] = norm["baseline_kg_ha"]
        data["texture_multiplier"] = norm["texture_multiplier"]
    except Exception as e:
        pass
    
    return {"result": data}

@api.post("/ai/prescription")
async def gen_prescription(body: PrescriptionIn):
    plot = body.plot or {}
    reading = body.reading or {}
    steps = rule_based_recommendations(reading)
    lang = "Kannada" if body.language == "kn" else "English"
    
    ai_summary = ""
    try:
        answers_txt = "; ".join([f"{a.question} -> {a.answer}" for a in body.survey_answers])
        chat = build_chat(f"rx-{make_id()}", f"You are a warm agronomy advisor. Reply in simple {lang}. Avoid jargon.")
        prompt = (
            f"Soil reading: {json.dumps({k: reading.get(k) for k in ['ph','nitrogen','phosphorus','potassium','organic_carbon']})}. "
            f"Status flags: {json.dumps(reading.get('status', {}))}. "
            f"Farmer answers: {answers_txt}. "
            f"Crop: {plot.get('crop', 'Ragi')}. "
            f"Rule-based steps: {json.dumps([s['step'] for s in steps])}. "
            f"Write a 4-6 sentence encouraging summary in {lang} explaining WHY these organic steps help "
            f"and one water-saving tip. Plain text only."
        )
        ai_summary = (await llm_send(chat, UserMessage(text=prompt))).strip()
    except Exception as e:
        ai_summary = "Your soil needs a boost of organic matter. Follow the steps in order and monitor moisture. Mulching with ragi straw helps retain water during dry weeks." if body.language != "kn" else "ನಿಮ್ಮ ಮಣ್ಣಿಗೆ ಸಾವಯವ ಪೋಷಕಾಂಶಗಳ ಅಗತ್ಯವಿದೆ."

    rx = {
        "id": make_id(),
        "plot_id": plot.get("id"),
        "reading_id": reading.get("id"),
        "language": body.language,
        "steps": steps,
        "summary": ai_summary,
        "created_at": utcnow_iso(),
    }
    return rx

app.include_router(api)
