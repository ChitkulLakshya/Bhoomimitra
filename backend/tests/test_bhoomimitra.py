"""BhoomiMitra API test suite - covers auth, plots, readings, AI endpoints, directory, community."""
import os
import io
import base64
import time
import pytest
import requests
from PIL import Image, ImageDraw

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://ragi-soil-guide.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# Shared session + user across tests
_session = requests.Session()
_state = {}


def _make_test_jpeg_b64() -> str:
    """Create a small non-uniform JPEG with text so vision model has features."""
    img = Image.new("RGB", (400, 300), color=(230, 220, 190))
    d = ImageDraw.Draw(img)
    d.rectangle([10, 10, 390, 290], outline=(80, 60, 40), width=3)
    d.text((20, 30), "SOIL HEALTH CARD", fill=(20, 20, 20))
    d.text((20, 70), "pH: 6.3", fill=(0, 0, 0))
    d.text((20, 100), "N: 240 kg/ha", fill=(0, 0, 0))
    d.text((20, 130), "P: 12 kg/ha", fill=(0, 0, 0))
    d.text((20, 160), "K: 180 kg/ha", fill=(0, 0, 0))
    d.text((20, 190), "OC: 0.42 %", fill=(0, 0, 0))
    d.line([(20, 220), (380, 220)], fill=(150, 30, 30), width=2)
    d.ellipse([300, 40, 370, 110], outline=(30, 100, 30), width=3)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()


# ---------- Health ----------
def test_root():
    r = _session.get(f"{API}/")
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "ok"


# ---------- Auth ----------
def test_signup_new_user():
    ident = f"test_{int(time.time())}@bhoomi.com"
    r = _session.post(f"{API}/auth/signup", json={
        "name": "Test Ravi", "identifier": ident, "password": "pass123", "language": "en"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "user" in data
    assert data["user"]["identifier"] == ident
    assert data["user"]["language"] == "en"
    _state["token"] = data["token"]
    _state["user"] = data["user"]
    _state["identifier"] = ident


def test_signup_duplicate_rejected():
    r = _session.post(f"{API}/auth/signup", json={
        "name": "Dup", "identifier": _state["identifier"], "password": "pass123"
    })
    assert r.status_code == 400


def test_login_success():
    r = _session.post(f"{API}/auth/login", json={
        "identifier": _state["identifier"], "password": "pass123"
    })
    assert r.status_code == 200
    body = r.json()
    assert "token" in body
    _state["token"] = body["token"]


def test_login_wrong_password():
    r = _session.post(f"{API}/auth/login", json={
        "identifier": _state["identifier"], "password": "wrong"
    })
    assert r.status_code == 401


def _auth_headers():
    return {"Authorization": f"Bearer {_state['token']}"}


def test_auth_me():
    r = _session.get(f"{API}/auth/me", headers=_auth_headers())
    assert r.status_code == 200
    assert r.json()["identifier"] == _state["identifier"]


def test_auth_language_toggle():
    r = _session.put(f"{API}/auth/language", json={"language": "kn"}, headers=_auth_headers())
    assert r.status_code == 200
    assert r.json()["language"] == "kn"
    # verify persistence
    me = _session.get(f"{API}/auth/me", headers=_auth_headers()).json()
    assert me["language"] == "kn"


def test_auth_me_requires_token():
    r = _session.get(f"{API}/auth/me")
    assert r.status_code == 401


# ---------- Plots ----------
def test_create_plot():
    r = _session.post(f"{API}/plots", json={
        "name": "TEST_Plot1", "crop": "Ragi", "area_acres": 1.5,
        "latitude": 12.7089, "longitude": 77.6968, "village": "Anekal"
    }, headers=_auth_headers())
    assert r.status_code == 200, r.text
    p = r.json()
    assert p["name"] == "TEST_Plot1"
    assert p["owner_id"] == _state["user"]["id"]
    _state["plot_id"] = p["id"]


def test_list_plots_attaches_latest_reading():
    r = _session.get(f"{API}/plots", headers=_auth_headers())
    assert r.status_code == 200
    plots = r.json()
    assert any(p["id"] == _state["plot_id"] for p in plots)
    for p in plots:
        assert "latest_reading" in p


# ---------- Readings ----------
def test_create_reading_with_status_and_health_score():
    r = _session.post(f"{API}/readings", json={
        "plot_id": _state["plot_id"],
        "ph": 5.7, "nitrogen": 220, "phosphorus": 8,
        "potassium": 110, "organic_carbon": 0.35
    }, headers=_auth_headers())
    assert r.status_code == 200, r.text
    reading = r.json()
    assert reading["status"]["ph"] == "low"
    assert reading["status"]["nitrogen"] == "low"
    assert reading["status"]["phosphorus"] == "low"
    assert reading["status"]["potassium"] == "low"
    assert reading["status"]["organic_carbon"] == "low"
    # 5 lows -> 100 - 90 = 10 -> clamped to 20
    assert reading["health_score"] == 20
    _state["reading_id"] = reading["id"]


def test_get_plot_returns_readings():
    r = _session.get(f"{API}/plots/{_state['plot_id']}", headers=_auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data.get("readings"), list) and len(data["readings"]) >= 1


# ---------- AI: Analyze card ----------
def test_ai_analyze_card_returns_numeric():
    b64 = _make_test_jpeg_b64()
    r = _session.post(f"{API}/ai/analyze-card", json={"image_base64": b64, "mime": "image/jpeg"},
                      headers=_auth_headers(), timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    for k in ["ph", "nitrogen", "phosphorus", "potassium", "organic_carbon"]:
        assert k in data
        assert isinstance(data[k], (int, float))


# ---------- AI: Survey ----------
def test_ai_survey_en():
    r = _session.post(f"{API}/ai/survey", json={
        "reading": {
            "plot_id": _state["plot_id"],
            "ph": 6.2, "nitrogen": 260, "phosphorus": 11,
            "potassium": 190, "organic_carbon": 0.48
        },
        "language": "en"
    }, headers=_auth_headers(), timeout=90)
    assert r.status_code == 200, r.text
    qs = r.json().get("questions", [])
    assert len(qs) == 4
    for q in qs:
        assert "question" in q and isinstance(q.get("options"), list)
        assert len(q["options"]) == 3


def test_ai_survey_kn():
    r = _session.post(f"{API}/ai/survey", json={
        "reading": {
            "plot_id": _state["plot_id"],
            "ph": 6.2, "nitrogen": 260, "phosphorus": 11,
            "potassium": 190, "organic_carbon": 0.48
        },
        "language": "kn"
    }, headers=_auth_headers(), timeout=90)
    assert r.status_code == 200
    qs = r.json().get("questions", [])
    assert len(qs) == 4


# ---------- AI: Prescription ----------
def test_ai_prescription():
    r = _session.post(f"{API}/ai/prescription", json={
        "plot_id": _state["plot_id"],
        "reading_id": _state["reading_id"],
        "survey_answers": [
            {"question": "Irrigation", "answer": "Rain-fed"},
            {"question": "FYM", "answer": "Limited"}
        ],
        "language": "en"
    }, headers=_auth_headers(), timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "steps" in data and len(data["steps"]) > 0
    for s in data["steps"]:
        for key in ("icon", "step", "detail", "priority"):
            assert key in s
    assert isinstance(data.get("summary"), str) and len(data["summary"]) > 0


# ---------- Directory ----------
def test_directory_labs_with_distance():
    r = _session.get(f"{API}/directory/labs", params={"lat": 12.7089, "lng": 77.6968})
    assert r.status_code == 200
    labs = r.json()
    assert len(labs) >= 5
    assert all("distance_km" in l for l in labs)
    dists = [l["distance_km"] for l in labs]
    assert dists == sorted(dists)


def test_directory_shops_with_distance():
    r = _session.get(f"{API}/directory/shops", params={"lat": 12.7089, "lng": 77.6968})
    assert r.status_code == 200
    shops = r.json()
    assert len(shops) >= 5
    assert all("distance_km" in s for s in shops)


# ---------- Community ----------
def test_community_nearby_includes_seed():
    r = _session.get(f"{API}/community/nearby",
                     params={"lat": 12.75, "lng": 77.68, "radius_km": 30},
                     headers=_auth_headers())
    assert r.status_code == 200
    plots = r.json().get("plots", [])
    # should include the 4 seeded demo_community plots (all within 30km)
    assert len(plots) >= 4
    for p in plots:
        assert "distance_km" in p and "health_score" in p


# ---------- Delete cascades ----------
def test_delete_plot_cascades_readings():
    r = _session.delete(f"{API}/plots/{_state['plot_id']}", headers=_auth_headers())
    assert r.status_code == 200
    # verify plot is gone
    r2 = _session.get(f"{API}/plots/{_state['plot_id']}", headers=_auth_headers())
    assert r2.status_code == 404
