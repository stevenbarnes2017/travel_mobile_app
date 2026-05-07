🥾 Trail & Adventure Trip Planner
A full-stack AI-powered trip planning app for the Mountain West.
Stack

Frontend: Vite + React (PWA-ready)
Backend: Python + FastAPI
AI: Anthropic Claude API
Deploy: Vercel (frontend) + Railway (backend)

Project Structure
trail-planner/
├── frontend/         # Vite + React app
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Page-level components
│       ├── hooks/        # Custom React hooks
│       └── utils/        # Helper functions
└── backend/          # Python FastAPI server
Quick Start
Backend
bashcd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your ANTHROPIC_API_KEY
uvicorn main:app --reload
Frontend
bashcd frontend
npm install
cp .env.example .env      # Add your backend URL
npm run dev
App runs at http://localhost:5173
Environment Variables
Backend .env
ANTHROPIC_API_KEY=your_key_here
Frontend .env
VITE_API_URL=http://localhost:8000