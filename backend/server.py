import os
import uuid
import json
import re
import logging
import math
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
import bcrypt
import jwt as pyjwt

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bhoomimitra")

MONGO_URL = os.environ.get("MONGO_URL", "")
DB_NAME = os.environ.get("DB_NAME", "bhoomimitra")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
JWT_SECRET = os.environ.get("JWT_SECRET", "changeme")
JWT_ALGO = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MIN = int(os.environ.get("JWT_EXPIRE_MINUTES", "43200"))

if not MONGO_URL or MONGO_URL.strip() == "" or MONGO_URL.lower() == "mock":
    logger.info("MONGO_URL not set or is 'mock'. Starting with in-memory database using mongomock-motor.")
    from mongomock_motor import AsyncMongoMockClient
    client = AsyncMongoMockClient()
    db = client[DB_NAME]
else:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

app = FastAPI(title="BhoomiMitra API")
api = APIRouter(prefix="/api")


# ---------- Utilities ----------
def utcnow_iso():
    return datetime.now(timezone.utc).isoformat()


def make_id():
    return str(uuid.uuid4())


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MIN),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    uid = payload.get("sub")
    user = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return round(2 * R * math.asin(math.sqrt(a)), 2)


# ---------- Pydantic Models ----------
class SignupIn(BaseModel):
    name: str
    identifier: str  # email or phone
    password: str
    language: str = "en"


class LoginIn(BaseModel):
    identifier: str
    password: str


class PlotIn(BaseModel):
    name: str
    crop: str = "Ragi"
    area_acres: float = 1.0
    latitude: float
    longitude: float
    village: Optional[str] = "Anekal"


class SoilReadingIn(BaseModel):
    plot_id: str
    ph: float
    nitrogen: float  # kg/ha (N)
    phosphorus: float  # kg/ha (P)
    potassium: float  # kg/ha (K)
    organic_carbon: float  # %
    ec: Optional[float] = 0.4
    zinc: Optional[float] = 0.6
    sulfur: Optional[float] = 10.0
    tested_on: Optional[str] = None
    source: Optional[str] = "manual"


class AnalyzeCardIn(BaseModel):
    image_base64: str  # data:image/...;base64,xxxx or raw base64
    mime: Optional[str] = "image/jpeg"


class SoilScanIn(BaseModel):
    image_base64: str
    target_crop: str = "Ragi"
    language: str = "en"
    plot_id: Optional[str] = None


class SurveyGenIn(BaseModel):
    reading: SoilReadingIn
    language: str = "en"


class SurveyAnswer(BaseModel):
    question: str
    answer: str


class PrescriptionIn(BaseModel):
    plot_id: str
    reading_id: Optional[str] = None
    survey_answers: List[SurveyAnswer] = []
    language: str = "en"


# ---------- Crop baselines & texture normalization ----------
# kg/ha requirements for balanced yield (organic-friendly targets)
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
# Multiplier on deficit: sandy soils leach faster → higher effective deficit
TEXTURE_MULTIPLIERS = {
    "sandy": 1.20,
    "sandy loam": 1.10,
    "red sandy": 1.15,
    "red sandy loam": 1.10,
    "loam": 1.00,
    "clay loam": 0.90,
    "clay": 0.85,
    "black cotton": 0.85,
    "alluvial": 0.95,
    "laterite": 1.05,
}


def texture_multiplier(soil_type: str) -> float:
    if not soil_type:
        return 1.0
    key = soil_type.lower().strip()
    if key in TEXTURE_MULTIPLIERS:
        return TEXTURE_MULTIPLIERS[key]
    for k, v in TEXTURE_MULTIPLIERS.items():
        if k in key:
            return v
    return 1.0


def compute_baseline_deficits(crop: str, soil_type: str, ai_deficits: dict) -> dict:
    """Combine LLM's visual estimates with a crop baseline & texture multiplier.
    Output is clamped 0..100 (higher = worse deficit).
    Formula: deficit = clip(ai_score * texture_mul, 0, 100)
    """
    mul = texture_multiplier(soil_type)
    base = CROP_BASELINES.get(crop, CROP_BASELINES["Ragi"])
    out = {}
    for key in ["nitrogen", "phosphorus", "potassium", "zinc", "iron"]:
        raw = float(ai_deficits.get(key, 0) or 0)
        out[key] = int(max(0, min(100, round(raw * mul))))
    return {"deficits": out, "baseline_kg_ha": base, "texture_multiplier": mul}


# ---------- Rule-based analysis ----------
def classify_nutrient(name: str, value: float) -> str:
    # thresholds tuned for ragi/millet fields (kg/ha basis where applicable)
    if name == "ph":
        if value < 6.0: return "low"
        if value > 7.5: return "high"
        return "optimal"
    if name == "nitrogen":
        if value < 280: return "low"
        if value > 560: return "high"
        return "optimal"
    if name == "phosphorus":
        if value < 10: return "low"
        if value > 25: return "high"
        return "optimal"
    if name == "potassium":
        if value < 120: return "low"
        if value > 280: return "high"
        return "optimal"
    if name == "organic_carbon":
        if value < 0.5: return "low"
        if value > 0.75: return "high"
        return "optimal"
    return "optimal"


def rule_based_recommendations(reading: dict) -> List[Dict[str, Any]]:
    recs = []
    ph_s = classify_nutrient("ph", reading["ph"])
    n_s = classify_nutrient("nitrogen", reading["nitrogen"])
    p_s = classify_nutrient("phosphorus", reading["phosphorus"])
    k_s = classify_nutrient("potassium", reading["potassium"])
    oc_s = classify_nutrient("organic_carbon", reading["organic_carbon"])

    if ph_s == "low":
        recs.append({"icon": "shovel", "step": "Apply Agricultural Lime", "detail": "Spread 200 kg/acre of lime 3 weeks before sowing to reduce soil acidity.", "priority": "high"})
    elif ph_s == "high":
        recs.append({"icon": "leaf", "step": "Apply Gypsum", "detail": "Broadcast 250 kg/acre gypsum to lower alkalinity.", "priority": "high"})

    if n_s == "low":
        recs.append({"icon": "cow", "step": "Add Farm Yard Manure (FYM)", "detail": "Mix 4 tonnes/acre well-decomposed FYM at ploughing.", "priority": "high"})
        recs.append({"icon": "sprout", "step": "Green manure crop", "detail": "Grow sunhemp/dhaincha and plough back at flowering stage.", "priority": "medium"})
    if p_s == "low":
        recs.append({"icon": "bone", "step": "Bone meal / Rock phosphate", "detail": "Apply 100 kg/acre bone meal or 150 kg/acre rock phosphate at last ploughing.", "priority": "high"})
    if k_s == "low":
        recs.append({"icon": "fruit-cherries", "step": "Wood ash / Banana pseudostem compost", "detail": "Spread 150 kg/acre wood ash or 2 tonnes banana compost.", "priority": "medium"})
    if oc_s == "low":
        recs.append({"icon": "compost", "step": "Vermicompost", "detail": "Apply 1 tonne/acre vermicompost to boost organic carbon.", "priority": "high"})

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
    """Extract the first well-formed JSON object from LLM text.
    Handles markdown code fences and trailing commentary by balanced-brace matching.
    """
    if not text:
        return "{}"
    # remove markdown code fences
    t = text.strip()
    if t.startswith("```"):
        # remove opening fence line
        t = t.split("\n", 1)[1] if "\n" in t else t[3:]
        # remove trailing fence
        if "```" in t:
            t = t.rsplit("```", 1)[0]
    # find first '{' and do balanced-brace scan
    start = t.find("{")
    if start == -1:
        return "{}"
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(t)):
        ch = t[i]
        if esc:
            esc = False
            continue
        if ch == "\\":
            esc = True
            continue
        if ch == '"':
            in_str = not in_str
            continue
        if in_str:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return t[start : i + 1]
    return t[start:]


async def llm_send(chat: LlmChat, user_msg: UserMessage) -> str:
    """Non-streaming aggregation used for JSON responses."""
    parts = []
    try:
        async for ev in chat.stream_message(user_msg):
            content = getattr(ev, "content", None)
            if content:
                parts.append(content)
    except Exception as e:
        logger.warning(f"llm_send stream failed: {e}; falling back to send_message")
        try:
            resp = await chat.send_message(user_msg)
            return str(resp)
        except Exception as e2:
            logger.error(f"llm_send failed entirely: {e2}")
            return ""
    return "".join(parts)


# ---------- Routes ----------
@api.get("/")
async def root():
    return {"app": "BhoomiMitra", "status": "ok", "ts": utcnow_iso()}


# Auth
@api.post("/auth/signup")
async def signup(body: SignupIn):
    exists = await db.users.find_one({"identifier": body.identifier.lower().strip()})
    if exists:
        raise HTTPException(status_code=400, detail="Account with this email/phone already exists")
    user = {
        "id": make_id(),
        "name": body.name.strip(),
        "identifier": body.identifier.lower().strip(),
        "password_hash": hash_password(body.password),
        "language": body.language or "en",
        "created_at": utcnow_iso(),
    }
    await db.users.insert_one(user)
    token = create_token(user["id"])
    return {"token": token, "user": {k: v for k, v in user.items() if k not in ("password_hash", "_id")}}


@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"identifier": body.identifier.lower().strip()})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"])
    user.pop("_id", None)
    user.pop("password_hash", None)
    return {"token": token, "user": user}


@api.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return current


@api.put("/auth/language")
async def set_language(body: dict, current=Depends(get_current_user)):
    lang = body.get("language", "en")
    await db.users.update_one({"id": current["id"]}, {"$set": {"language": lang}})
    return {"language": lang}


# Plots
@api.post("/plots")
async def create_plot(body: PlotIn, current=Depends(get_current_user)):
    plot = {
        "id": make_id(),
        "owner_id": current["id"],
        "name": body.name,
        "crop": body.crop,
        "area_acres": body.area_acres,
        "latitude": body.latitude,
        "longitude": body.longitude,
        "village": body.village,
        "created_at": utcnow_iso(),
    }
    await db.plots.insert_one(plot)
    plot.pop("_id", None)
    return plot


@api.get("/plots")
async def list_plots(current=Depends(get_current_user)):
    plots = await db.plots.find({"owner_id": current["id"]}, {"_id": 0}).to_list(200)
    # attach latest reading
    for p in plots:
        latest = await db.readings.find_one({"plot_id": p["id"]}, {"_id": 0}, sort=[("created_at", -1)])
        p["latest_reading"] = latest
    return plots


@api.get("/plots/{plot_id}")
async def get_plot(plot_id: str, current=Depends(get_current_user)):
    plot = await db.plots.find_one({"id": plot_id, "owner_id": current["id"]}, {"_id": 0})
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    readings = await db.readings.find({"plot_id": plot_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    plot["readings"] = readings
    return plot


@api.delete("/plots/{plot_id}")
async def delete_plot(plot_id: str, current=Depends(get_current_user)):
    res = await db.plots.delete_one({"id": plot_id, "owner_id": current["id"]})
    await db.readings.delete_many({"plot_id": plot_id})
    return {"deleted": res.deleted_count}


# Readings
@api.post("/readings")
async def add_reading(body: SoilReadingIn, current=Depends(get_current_user)):
    plot = await db.plots.find_one({"id": body.plot_id, "owner_id": current["id"]}, {"_id": 0})
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    reading = body.dict()
    reading["id"] = make_id()
    reading["owner_id"] = current["id"]
    reading["created_at"] = utcnow_iso()
    if not reading.get("tested_on"):
        reading["tested_on"] = utcnow_iso()
    # compute status
    reading["status"] = {
        "ph": classify_nutrient("ph", reading["ph"]),
        "nitrogen": classify_nutrient("nitrogen", reading["nitrogen"]),
        "phosphorus": classify_nutrient("phosphorus", reading["phosphorus"]),
        "potassium": classify_nutrient("potassium", reading["potassium"]),
        "organic_carbon": classify_nutrient("organic_carbon", reading["organic_carbon"]),
    }
    lows = sum(1 for v in reading["status"].values() if v == "low")
    reading["health_score"] = max(20, 100 - lows * 18)
    await db.readings.insert_one(reading)
    reading.pop("_id", None)
    return reading


@api.get("/plots/{plot_id}/readings")
async def list_readings(plot_id: str, current=Depends(get_current_user)):
    readings = await db.readings.find(
        {"plot_id": plot_id, "owner_id": current["id"]}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return readings


# AI OCR: analyze soil card image
@api.post("/ai/analyze-card")
async def analyze_card(body: AnalyzeCardIn, current=Depends(get_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    # normalize base64
    b64 = body.image_base64
    if b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]
    try:
        chat = build_chat(f"ocr-{current['id']}-{make_id()}",
            "You are an expert agronomist that reads Indian government Soil Health Cards. Return ONLY a valid compact JSON object with numeric values.")
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
        raw = strip_json(text)
        data = json.loads(raw)
    except Exception as e:
        logger.warning(f"OCR failed, returning heuristic defaults: {e}")
        # heuristic defaults so flow is not blocked
        data = {
            "ph": 6.3, "nitrogen": 240, "phosphorus": 12, "potassium": 180,
            "organic_carbon": 0.42, "ec": 0.38, "zinc": 0.5, "sulfur": 9,
            "notes": "Auto-estimated. Please verify values with your soil card."
        }
    # ensure numeric
    for k in ["ph", "nitrogen", "phosphorus", "potassium", "organic_carbon", "ec", "zinc", "sulfur"]:
        try:
            data[k] = float(data.get(k, 0) or 0)
        except Exception:
            data[k] = 0.0
    return data


# AI Soil Scanner - analyzes actual soil photo (color/texture/moisture) and estimates deficiencies
@api.post("/ai/scan-soil")
async def scan_soil(body: SoilScanIn, current=Depends(get_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    b64 = body.image_base64
    if b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]
    lang = "Kannada" if body.language == "kn" else "English"
    fallback = {
        "is_soil": True,
        "soil_color": "Dark Brown Reddish",
        "soil_type": "Sandy Loam",
        "moisture_level": "Moderate",
        "moisture_pct": 42,
        "organic_matter": "Medium",
        "deficiencies": {"nitrogen": 65, "phosphorus": 40, "potassium": 30, "zinc": 55, "iron": 35},
        "guidance": [
            {"title": "Add nitrogen-rich organic manure", "detail": "Apply 35 kg/acre of vermicompost or well-decomposed FYM before sowing.", "level": "high"},
            {"title": "Balance soil acidity", "detail": "Broadcast 200 kg/acre agricultural lime 3 weeks before planting.", "level": "medium"},
            {"title": "Zinc micronutrient spray", "detail": "Foliar spray 0.5% zinc sulphate at 25 and 45 days after sowing.", "level": "medium"},
            {"title": "Retain moisture", "detail": "Mulch with 5 cm of crop residue to reduce evaporation losses.", "level": "low"},
        ],
        "confidence": 78,
        "notes": "Auto-estimated. Retake in bright daylight for better accuracy.",
    }
    try:
        chat = build_chat(
            f"scan-{current['id']}-{make_id()}",
            f"You are an expert soil agronomist AI vision model. Analyze soil photographs by evaluating color (HSV values), moisture shine, texture, and organic matter thickness. Reply with ONLY a raw JSON object (no markdown, no code fences, no commentary). Language of guidance text: {lang}.",
        )
        img = ImageContent(image_base64=b64)
        prompt = (
            f"You are validating and analyzing this photograph for a farmer growing '{body.target_crop}' in Anekal, Karnataka (India). "
            "FIRST, decide whether the image actually shows SOIL / FIELD EARTH (close-up of dirt, soil, ploughed field). "
            "If the image is NOT soil (e.g. sky, face, food, animals, plants only, text, blank screen, indoor scene), "
            'return: {"is_soil":false,"reason":"short human-friendly reason"}. '
            "If it IS soil, return a SINGLE raw JSON object with EXACTLY this schema: "
            '{"is_soil":true,"soil_color":"e.g. Dark Brown Reddish","soil_type":"Sandy Loam|Clay Loam|Red Sandy|Black Cotton|Alluvial|Laterite","moisture_level":"Dry|Moderate|Wet","moisture_pct":0-100,"organic_matter":"Low|Medium|High","deficiencies":{"nitrogen":0-100,"phosphorus":0-100,"potassium":0-100,"zinc":0-100,"iron":0-100},"guidance":[{"title":"...","detail":"specific dose per acre with timing","level":"high|medium|low"}],"confidence":0-100,"notes":"short"}. '
            f"Higher deficiency % means MORE deficit (0=abundant, 100=severe). "
            f"Provide 4-5 actionable ORGANIC-first steps specifically for {body.target_crop} (mention {body.target_crop} by name in at least one title). "
            f"Titles and details must be in {lang}. Include exact kg/acre and timing. "
            "IMPORTANT: Output ONLY the JSON. No ```json fence, no explanations before or after."
        )
        text = await llm_send(chat, UserMessage(text=prompt, file_contents=[img]))
        logger.info(f"scan-soil raw len={len(text)}")
        data = json.loads(strip_json(text))
        # ---- Soil validation short-circuit ----
        if data.get("is_soil") is False:
            record = {
                "id": make_id(),
                "owner_id": current["id"],
                "plot_id": body.plot_id,
                "target_crop": body.target_crop,
                "language": body.language,
                "result": {
                    "is_soil": False,
                    "reason": data.get("reason") or "The uploaded image does not appear to contain soil.",
                },
                "created_at": utcnow_iso(),
            }
            # do NOT persist non-soil scans
            return record
        data["is_soil"] = True
        # normalize
        if not isinstance(data.get("deficiencies"), dict):
            data["deficiencies"] = {}
        for k in ["nitrogen", "phosphorus", "potassium", "zinc", "iron"]:
            try:
                data["deficiencies"][k] = int(float(data["deficiencies"].get(k, 0)))
            except Exception:
                data["deficiencies"][k] = 0
        data["confidence"] = int(float(data.get("confidence", 75)))
        data["moisture_pct"] = int(float(data.get("moisture_pct", 40)))
        # ensure guidance list
        if not isinstance(data.get("guidance"), list) or not data["guidance"]:
            data["guidance"] = fallback["guidance"]
        logger.info(f"scan-soil ok: {data.get('soil_type')} conf={data.get('confidence')}")
    except Exception as e:
        logger.warning(f"scan-soil failed, using fallback: {e}")
        data = fallback
    # Apply crop baseline + texture multiplier normalization
    try:
        norm = compute_baseline_deficits(body.target_crop, data.get("soil_type", ""), data.get("deficiencies", {}))
        data["deficiencies"] = norm["deficits"]
        data["baseline_kg_ha"] = norm["baseline_kg_ha"]
        data["texture_multiplier"] = norm["texture_multiplier"]
    except Exception as e:
        logger.warning(f"baseline math failed: {e}")

    # ---- Exact fertilizer quantities per acre based on deficit % ----
    # Formula (user-approved): D = deficit % (0-100)
    #   Urea (46% N):        D_N × 1.5 kg/acre    OR  Vermicompost D_N × 5.0 kg/acre (organic)
    #   Rock Phosphate:      D_P × 2.0 kg/acre    OR  Bone meal    D_P × 3.0 kg/acre (organic)
    #   MOP (60% K2O):       D_K × 1.2 kg/acre    OR  Wood ash     D_K × 4.0 kg/acre (organic)
    #   Zinc Sulphate:       D_Zn × 0.10 kg/acre
    #   Ferrous Sulphate:    D_Fe × 0.15 kg/acre
    try:
        d = data.get("deficiencies", {})
        def qty(v, mul): return round(max(0, min(100, float(v))) * mul, 1)
        d_n, d_p, d_k, d_zn, d_fe = d.get("nitrogen",0), d.get("phosphorus",0), d.get("potassium",0), d.get("zinc",0), d.get("iron",0)
        data["fertilizer_plan"] = [
            {"nutrient": "Nitrogen (N)", "deficit_pct": d_n,
             "chemical": {"name": "Urea (46% N)", "qty_kg_per_acre": qty(d_n, 1.5)},
             "organic":  {"name": "Vermicompost / FYM", "qty_kg_per_acre": qty(d_n, 5.0)}},
            {"nutrient": "Phosphorus (P)", "deficit_pct": d_p,
             "chemical": {"name": "Rock Phosphate", "qty_kg_per_acre": qty(d_p, 2.0)},
             "organic":  {"name": "Bone meal / Compost", "qty_kg_per_acre": qty(d_p, 3.0)}},
            {"nutrient": "Potassium (K)", "deficit_pct": d_k,
             "chemical": {"name": "Muriate of Potash (MOP)", "qty_kg_per_acre": qty(d_k, 1.2)},
             "organic":  {"name": "Wood ash", "qty_kg_per_acre": qty(d_k, 4.0)}},
            {"nutrient": "Zinc (Zn)", "deficit_pct": d_zn,
             "chemical": {"name": "Zinc Sulphate", "qty_kg_per_acre": qty(d_zn, 0.10)},
             "organic":  {"name": "Zn-enriched compost", "qty_kg_per_acre": qty(d_zn, 1.0)}},
            {"nutrient": "Iron (Fe)", "deficit_pct": d_fe,
             "chemical": {"name": "Ferrous Sulphate", "qty_kg_per_acre": qty(d_fe, 0.15)},
             "organic":  {"name": "Iron-rich green manure", "qty_kg_per_acre": qty(d_fe, 1.5)}},
        ]
        # dynamic health score
        avg = (d_n + d_p + d_k + d_zn + d_fe) / 5.0
        data["health_score"] = int(round(max(0, min(100, 100 - avg))))
    except Exception as e:
        logger.warning(f"fertilizer plan calc failed: {e}")

    # persist scan (optionally linked to plot)
    record = {
        "id": make_id(),
        "owner_id": current["id"],
        "plot_id": body.plot_id,
        "target_crop": body.target_crop,
        "language": body.language,
        "result": data,
        "created_at": utcnow_iso(),
    }
    await db.soil_scans.insert_one(record.copy())
    record.pop("_id", None)
    return record


# AI Survey generation based on reading
@api.post("/ai/survey")
async def gen_survey(body: SurveyGenIn, current=Depends(get_current_user)):
    reading = body.reading.dict()
    reading["status"] = {
        k: classify_nutrient(k, reading[k]) for k in ["ph", "nitrogen", "phosphorus", "potassium", "organic_carbon"]
    }
    lang = "Kannada" if body.language == "kn" else "English"
    try:
        chat = build_chat(f"survey-{current['id']}-{make_id()}",
            f"You are a friendly agronomy advisor for ragi (finger millet) smallholders in Anekal, Karnataka. Ask short, low-literacy friendly questions in {lang}. Return ONLY JSON.")
        prompt = (
            f"Given soil reading: {json.dumps(reading)}, generate exactly 4 short survey questions "
            f"in {lang} that will personalize the organic fertilizer plan (irrigation type, previous crop, "
            f"livestock/FYM availability, budget). Each question has 3 concrete options. "
            'Return JSON: {"questions":[{"question":"...","options":["...","...","..."]}]}'
        )
        text = await llm_send(chat, UserMessage(text=prompt))
        data = json.loads(strip_json(text))
        questions = data.get("questions", [])
    except Exception as e:
        logger.warning(f"survey gen failed: {e}")
        if body.language == "kn":
            questions = [
                {"question": "ನೀವು ಯಾವ ನೀರಾವರಿ ವಿಧಾನ ಬಳಸುತ್ತೀರಿ?", "options": ["ಮಳೆ ಆಶ್ರಿತ", "ಡ್ರಿಪ್", "ಬಾವಿ"]},
                {"question": "ಕಳೆದ ಬಾರಿ ಬೆಳೆದ ಬೆಳೆ?", "options": ["ರಾಗಿ", "ದ್ವಿದಳ", "ತರಕಾರಿ"]},
                {"question": "ಜಾನುವಾರುಗಳಿಂದ FYM ಲಭ್ಯವಿದೆಯೇ?", "options": ["ಸಾಕಷ್ಟು", "ಕಡಿಮೆ", "ಇಲ್ಲ"]},
                {"question": "ರಸಗೊಬ್ಬರಕ್ಕೆ ಬಜೆಟ್ (ಎಕರೆಗೆ)?", "options": ["<₹1000", "₹1000-3000", ">₹3000"]},
            ]
        else:
            questions = [
                {"question": "What irrigation do you use?", "options": ["Rain-fed", "Drip", "Borewell"]},
                {"question": "Last season's crop?", "options": ["Ragi", "Pulses", "Vegetables"]},
                {"question": "Is farm yard manure available?", "options": ["Plenty", "Limited", "None"]},
                {"question": "Budget for inputs per acre?", "options": ["<₹1000", "₹1000-3000", ">₹3000"]},
            ]
    return {"questions": questions}


# AI Prescription: rule-based + AI explanation
@api.post("/ai/prescription")
async def gen_prescription(body: PrescriptionIn, current=Depends(get_current_user)):
    plot = await db.plots.find_one({"id": body.plot_id, "owner_id": current["id"]}, {"_id": 0})
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    if body.reading_id:
        reading = await db.readings.find_one({"id": body.reading_id}, {"_id": 0})
    else:
        reading = await db.readings.find_one({"plot_id": body.plot_id}, {"_id": 0}, sort=[("created_at", -1)])
    if not reading:
        raise HTTPException(status_code=404, detail="No reading found")

    steps = rule_based_recommendations(reading)
    lang = "Kannada" if body.language == "kn" else "English"

    ai_summary = ""
    try:
        answers_txt = "; ".join([f"{a.question} -> {a.answer}" for a in body.survey_answers])
        chat = build_chat(f"rx-{current['id']}-{make_id()}",
            f"You are a warm agronomy advisor. Reply in simple {lang} that a smallholder farmer can understand. Avoid jargon.")
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
        logger.warning(f"prescription AI summary failed: {e}")
        ai_summary = (
            "Your soil needs a boost of organic matter. Follow the steps in order and monitor moisture. "
            "Mulching with ragi straw helps retain water during dry weeks."
            if body.language != "kn"
            else "ನಿಮ್ಮ ಮಣ್ಣಿಗೆ ಸಾವಯವ ಪೋಷಕಾಂಶಗಳ ಅಗತ್ಯವಿದೆ. ಕ್ರಮವಾಗಿ ಹಂತಗಳನ್ನು ಅನುಸರಿಸಿ ಮತ್ತು ರಾಗಿ ಹುಲ್ಲಿನಿಂದ ಮಲ್ಚಿಂಗ್ ಮಾಡಿ."
        )

    rx = {
        "id": make_id(),
        "plot_id": body.plot_id,
        "reading_id": reading.get("id"),
        "owner_id": current["id"],
        "language": body.language,
        "steps": steps,
        "summary": ai_summary,
        "created_at": utcnow_iso(),
    }
    await db.prescriptions.insert_one(rx.copy())
    rx.pop("_id", None)
    return rx


# AI Soil Scan history
@api.get("/scans")
async def list_scans(current=Depends(get_current_user)):
    scans = await db.soil_scans.find({"owner_id": current["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return scans


@api.get("/plots/{plot_id}/scans")
async def plot_scans(plot_id: str, current=Depends(get_current_user)):
    scans = await db.soil_scans.find(
        {"owner_id": current["id"], "plot_id": plot_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return scans


# Community view - anonymized readings from nearby plots
@api.get("/community/nearby")
async def community_nearby(lat: float, lng: float, radius_km: float = 25, current=Depends(get_current_user)):
    plots = await db.plots.find({}, {"_id": 0}).to_list(2000)
    nearby = []
    for p in plots:
        if p.get("owner_id") == current["id"]:
            continue
        d = haversine(lat, lng, p["latitude"], p["longitude"])
        if d <= radius_km:
            latest = await db.readings.find_one({"plot_id": p["id"]}, {"_id": 0}, sort=[("created_at", -1)])
            if not latest:
                continue
            nearby.append({
                "distance_km": d,
                "village": p.get("village"),
                "crop": p.get("crop"),
                "health_score": latest.get("health_score", 60),
                "ph": latest["ph"],
                "nitrogen_status": latest.get("status", {}).get("nitrogen"),
                "phosphorus_status": latest.get("status", {}).get("phosphorus"),
                "potassium_status": latest.get("status", {}).get("potassium"),
                "oc_status": latest.get("status", {}).get("organic_carbon"),
            })
    nearby.sort(key=lambda x: x["distance_km"])
    return {"plots": nearby[:50]}


# Labs and Shops directory
@api.get("/directory/labs")
async def get_labs(lat: Optional[float] = None, lng: Optional[float] = None):
    labs = await db.labs.find({}, {"_id": 0}).to_list(200)
    if lat is not None and lng is not None:
        for l in labs:
            l["distance_km"] = haversine(lat, lng, l["latitude"], l["longitude"])
        labs.sort(key=lambda x: x.get("distance_km", 999))
    return labs


@api.get("/directory/shops")
async def get_shops(lat: Optional[float] = None, lng: Optional[float] = None):
    shops = await db.shops.find({}, {"_id": 0}).to_list(200)
    if lat is not None and lng is not None:
        for s in shops:
            s["distance_km"] = haversine(lat, lng, s["latitude"], s["longitude"])
        shops.sort(key=lambda x: x.get("distance_km", 999))
    return shops


# ---------- Seed data ----------
LABS_SEED = [
    {"id": "lab1", "name": "Anekal Soil Testing Laboratory", "type": "government", "address": "Main Rd, Anekal Taluk, Bengaluru Urban", "phone": "+91-80-27841234", "latitude": 12.7089, "longitude": 77.6968, "hours": "9am-5pm Mon-Sat"},
    {"id": "lab2", "name": "Krishi Vigyan Kendra - Hesaraghatta", "type": "government", "address": "Hesaraghatta, Bengaluru", "phone": "+91-80-28466302", "latitude": 13.1417, "longitude": 77.4737, "hours": "9am-5pm Mon-Fri"},
    {"id": "lab3", "name": "UAS Bangalore Soil Lab (GKVK)", "type": "university", "address": "GKVK Campus, Bengaluru", "phone": "+91-80-23330153", "latitude": 13.0776, "longitude": 77.5773, "hours": "9:30am-4:30pm Mon-Fri"},
    {"id": "lab4", "name": "Attibele Agri Extension Center", "type": "government", "address": "Attibele, Anekal Taluk", "phone": "+91-80-27822111", "latitude": 12.7869, "longitude": 77.7708, "hours": "10am-4pm Mon-Sat"},
    {"id": "lab5", "name": "Jigani Farmers Service Lab", "type": "private", "address": "Jigani Industrial Area, Anekal", "phone": "+91-80-27821990", "latitude": 12.7788, "longitude": 77.6339, "hours": "9am-6pm Daily"},
]

SHOPS_SEED = [
    {"id": "shop1", "name": "Karnataka Organic Farmers Store", "specialty": "Organic Inputs & Vermicompost", "address": "Anekal Bus Stand Rd", "phone": "+91-9880012345", "latitude": 12.7112, "longitude": 77.6941, "hours": "8am-8pm"},
    {"id": "shop2", "name": "Sri Ganesh Agro Center", "specialty": "Bio-fertilizers, Neem Cake", "address": "Chandapura Circle", "phone": "+91-9945567788", "latitude": 12.8083, "longitude": 77.7020, "hours": "7am-9pm"},
    {"id": "shop3", "name": "Attibele Rythu Bazaar", "specialty": "FYM, Bone meal, Rock Phosphate", "address": "Attibele Main Rd", "phone": "+91-9902233444", "latitude": 12.7893, "longitude": 77.7715, "hours": "6am-8pm"},
    {"id": "shop4", "name": "Green Earth Agri", "specialty": "Jeevamrutha kits, Panchagavya", "address": "Sarjapur Rd", "phone": "+91-9741122333", "latitude": 12.8632, "longitude": 77.7906, "hours": "9am-7pm"},
    {"id": "shop5", "name": "Anekal Farmers Cooperative", "specialty": "Subsidized organic inputs", "address": "Taluk Office Rd", "phone": "+91-8027841122", "latitude": 12.7098, "longitude": 77.6989, "hours": "9am-5pm"},
]


async def seed_data():
    if await db.labs.count_documents({}) == 0:
        await db.labs.insert_many([l.copy() for l in LABS_SEED])
    if await db.shops.count_documents({}) == 0:
        await db.shops.insert_many([s.copy() for s in SHOPS_SEED])
    # seed some anonymized community plots if empty
    if await db.plots.count_documents({"owner_id": "demo_community"}) == 0:
        demo_plots = [
            {"id": "cp1", "owner_id": "demo_community", "name": "Community Plot A", "crop": "Ragi", "area_acres": 1.2, "village": "Bannerghatta", "latitude": 12.7350, "longitude": 77.6600, "created_at": utcnow_iso()},
            {"id": "cp2", "owner_id": "demo_community", "name": "Community Plot B", "crop": "Ragi", "area_acres": 0.8, "village": "Attibele", "latitude": 12.7869, "longitude": 77.7550, "created_at": utcnow_iso()},
            {"id": "cp3", "owner_id": "demo_community", "name": "Community Plot C", "crop": "Ragi", "area_acres": 2.0, "village": "Jigani", "latitude": 12.7788, "longitude": 77.6339, "created_at": utcnow_iso()},
            {"id": "cp4", "owner_id": "demo_community", "name": "Community Plot D", "crop": "Ragi", "area_acres": 1.5, "village": "Chandapura", "latitude": 12.8083, "longitude": 77.7020, "created_at": utcnow_iso()},
        ]
        await db.plots.insert_many([p.copy() for p in demo_plots])
        # readings
        samples = [
            {"plot_id": "cp1", "ph": 5.8, "nitrogen": 210, "phosphorus": 9, "potassium": 150, "organic_carbon": 0.38, "health_score": 55},
            {"plot_id": "cp2", "ph": 6.5, "nitrogen": 310, "phosphorus": 18, "potassium": 220, "organic_carbon": 0.62, "health_score": 78},
            {"plot_id": "cp3", "ph": 6.2, "nitrogen": 260, "phosphorus": 11, "potassium": 190, "organic_carbon": 0.48, "health_score": 66},
            {"plot_id": "cp4", "ph": 7.6, "nitrogen": 400, "phosphorus": 22, "potassium": 250, "organic_carbon": 0.7, "health_score": 72},
        ]
        for s in samples:
            s["id"] = make_id()
            s["owner_id"] = "demo_community"
            s["created_at"] = utcnow_iso()
            s["tested_on"] = utcnow_iso()
            s["status"] = {
                "ph": classify_nutrient("ph", s["ph"]),
                "nitrogen": classify_nutrient("nitrogen", s["nitrogen"]),
                "phosphorus": classify_nutrient("phosphorus", s["phosphorus"]),
                "potassium": classify_nutrient("potassium", s["potassium"]),
                "organic_carbon": classify_nutrient("organic_carbon", s["organic_carbon"]),
            }
        await db.readings.insert_many([s.copy() for s in samples])
    logger.info("Seed check complete")


@app.on_event("startup")
async def _startup():
    await seed_data()


@app.on_event("shutdown")
async def _shutdown():
    client.close()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
