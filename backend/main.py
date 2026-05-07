from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
import httpx
import os
import traceback
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Travel Adventure Planner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class TripRequest(BaseModel):
    start_city: str
    trip_length: str
    difficulty: Optional[str] = "moderate"
    region: str
    season: Optional[str] = "summer"
    vibes: List[str]
    extra_notes: Optional[str] = ""


class Location(BaseModel):
    name: str
    type: str  # destination, food, lodging


class TripResponse(BaseModel):
    overview: str
    destination: str
    itinerary: str
    lodging: str
    food: str
    gear: str
    pro_tips: str
    locations: List[Location]
    raw: str


def build_prompt(req: TripRequest) -> str:
    vibes_str = ", ".join(req.vibes) if req.vibes else "scenic drives, great food"
    return f"""You are an expert travel and adventure trip planner specializing in the Mountain West USA (Colorado, Utah, Wyoming, New Mexico).

Plan a {req.trip_length} trip for someone based in {req.start_city} who wants to explore {req.region}.
Season: {req.season}
Difficulty (if hiking): {req.difficulty}
Interests/vibes: {vibes_str}
Additional notes: {req.extra_notes or "None"}

Return a detailed, enthusiastic, and practical trip plan in exactly this format:

🏔️ TRIP OVERVIEW
A 2-3 sentence summary with a catchy trip name, the destination, and why it's perfect for them.

📍 DESTINATION & GETTING THERE
Specific destination(s), driving distance/time from their starting city, best route highlights.

🗺️ DAY-BY-DAY ITINERARY
A detailed day-by-day plan with specific place names, landmarks, timing, and activities.

🏕️ WHERE TO STAY
2-3 specific lodging recommendations with a note on each.

🍺 FOOD & DRINK STOPS
3-4 specific restaurant or brewery recommendations. Real place names only.

🎒 GEAR CHECKLIST
10-12 essential items for this specific trip.

💡 PRO TIPS
3-4 insider tips specific to this destination.

📌 KEY LOCATIONS
DESTINATION: [main destination town only, e.g. Salida, CO]
FOOD: [exact restaurant name only, e.g. The Fritz]
FOOD: [exact restaurant name only]
FOOD: [exact restaurant name only]
LODGING: [exact lodging name only, e.g. Mount Princeton Hot Springs Resort]
LODGING: [exact lodging name only]

Important: The KEY LOCATIONS section must use exactly those labels. One name per line. No descriptions."""


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


def parse_locations(text: str) -> List[Location]:
    locations = []
    marker = "📌 KEY LOCATIONS"
    start = text.find(marker)
    if start == -1:
        return locations

    location_text = text[start + len(marker):]
    for line in location_text.strip().split('\n'):
        line = line.strip()
        for loc_type in ['DESTINATION', 'FOOD', 'LODGING']:
            if line.startswith(f"{loc_type}:"):
                name = line[len(loc_type)+1:].strip()
                # Clean brackets if AI included them
                name = name.replace('[', '').replace(']', '').strip()
                if name and len(name) > 2:
                    locations.append(Location(name=name, type=loc_type.lower()))
    return locations


@app.get("/")
def root():
    return {"status": "Travel Adventure Planner API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/places")
async def places_autocomplete(input: str):
    if not input or len(input) < 2:
        return {"predictions": []}

    key = os.getenv("GOOGLE_PLACES_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="Google Places key not configured")

    async with httpx.AsyncClient() as http_client:
        res = await http_client.get(
            "https://maps.googleapis.com/maps/api/place/autocomplete/json",
            params={
                "input": input,
                "key": key,
                "types": "(cities)",
                "components": "country:us",
            }
        )
    return res.json()


@app.post("/api/plan", response_model=TripResponse)
async def plan_trip(req: TripRequest):
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert travel and adventure planner for the Mountain West USA. You give specific, detailed, enthusiastic trip recommendations with real place names. Always follow the exact format requested."
                },
                {
                    "role": "user",
                    "content": build_prompt(req)
                }
            ],
            temperature=0.7,
            max_tokens=2000,
        )

        raw_text = completion.choices[0].message.content
        print("=== GROQ RESPONSE ===")
        print(raw_text)

        clean_text = raw_text.replace("**", "")
        sections = parse_sections(clean_text)
        locations = parse_locations(raw_text)
        print("=== LOCATIONS ===", locations)

        return TripResponse(**sections, locations=locations, raw=raw_text)

    except Exception as e:
        print("=== ERROR ===")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))