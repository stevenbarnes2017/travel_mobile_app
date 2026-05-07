from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
import os
from dotenv import load_dotenv
import httpx

load_dotenv()

app = FastAPI(title="Trail Adventure Planner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")


class TripRequest(BaseModel):
    start_city: str
    trip_length: str
    difficulty: str
    region: str
    vibes: List[str]
    season: Optional[str] = "summer"
    extra_notes: Optional[str] = ""


class TripResponse(BaseModel):
    overview: str
    destination: str
    itinerary: str
    lodging: str
    food: str
    gear: str
    pro_tips: str
    raw: str


def build_prompt(req: TripRequest) -> str:
    vibes_str = ", ".join(req.vibes) if req.vibes else "hiking, scenic drives"
    return f"""You are an expert outdoor adventure trip planner specializing in the Mountain West USA (Colorado, Utah, Wyoming, New Mexico).

Plan a {req.trip_length} trip for someone based in {req.start_city} who wants to explore {req.region}.
Season: {req.season}
Difficulty: {req.difficulty}
Interests/vibes: {vibes_str}
Additional notes: {req.extra_notes or "None"}

Return a detailed, enthusiastic, and practical trip plan in exactly this format with these section headers:

🏔️ TRIP OVERVIEW
A 2-3 sentence summary with a catchy trip name, the destination, and why it's perfect for them.

📍 DESTINATION & GETTING THERE
Specific destination(s), driving distance/time from their starting city, best route highlights.

🗺️ DAY-BY-DAY ITINERARY
A detailed day-by-day plan with specific trail names, landmarks, timing, and activities. Be specific with real place names.

🏕️ WHERE TO STAY
2-3 specific lodging recommendations (campgrounds, cabins, hotels) with a note on each. Include a range of options.

🍺 FOOD & DRINK STOPS
3-4 specific restaurant or brewery recommendations near the destination. Real place names only.

🎒 GEAR CHECKLIST
10-12 essential items for this specific trip. Be specific to the terrain and season.

💡 PRO TIPS
3-4 insider tips specific to this destination — permits, best times of day, hidden spots, what to avoid.

Keep each section concise but rich with specific, actionable details. Use real place names throughout."""


def parse_sections(text: str) -> dict:
    sections = {
        "overview": "",
        "destination": "",
        "itinerary": "",
        "lodging": "",
        "food": "",
        "gear": "",
        "pro_tips": "",
    }

    markers = [
        ("🏔️ TRIP OVERVIEW", "overview"),
        ("📍 DESTINATION & GETTING THERE", "destination"),
        ("🗺️ DAY-BY-DAY ITINERARY", "itinerary"),
        ("🏕️ WHERE TO STAY", "lodging"),
        ("🍺 FOOD & DRINK STOPS", "food"),
        ("🎒 GEAR CHECKLIST", "gear"),
        ("💡 PRO TIPS", "pro_tips"),
    ]

    for i, (marker, key) in enumerate(markers):
        start = text.find(marker)
        if start == -1:
            continue
        start += len(marker)
        end = len(text)
        if i + 1 < len(markers):
            next_marker = markers[i + 1][0]
            next_pos = text.find(next_marker)
            if next_pos != -1:
                end = next_pos
        sections[key] = text[start:end].strip()

    return sections


@app.get("/")
def root():
    return {"status": "Trail Planner API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/plan", response_model=TripResponse)
async def plan_trip(req: TripRequest):
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="API key not configured")

    try:
        response = model.generate_content(build_prompt(req))
        raw_text = response.text
        sections = parse_sections(raw_text)
        return TripResponse(**sections, raw=raw_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/places")
async def places_autocomplete(input: str):
    if not input or len(input) < 2:
        return {"predictions": []}
    
    key = os.getenv("VITE_GOOGLE_PLACES_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="Google Places key not configured")
    
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://maps.googleapis.com/maps/api/place/autocomplete/json",
            params={
                "input": input,
                "key": key,
                "types": "(cities)",
                "components": "country:us",
            }
        )
    return res.json()