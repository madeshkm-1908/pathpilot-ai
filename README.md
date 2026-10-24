# PathPilot AI

> AI-powered personalized learning path generator for students, professionals, and self-learners.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Python FastAPI |
| Database | Supabase PostgreSQL *(next phase)* |
| AI | Configurable *(next phase)* |
| Hosting | Vercel (frontend) + Render (backend) |

## Project Structure
```
pathpilot-ai/
├── frontend/     # React + Vite app
├── backend/      # FastAPI app
└── README.md
```

## Local Development

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10

### Backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
API docs (Swagger): http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

### Environment Variables

Copy the templates and fill in your values:
```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/resources` | Browse learning resources |
| POST | `/api/paths/preview` | Generate a learning path preview |

## Roadmap
- [ ] Supabase auth integration
- [ ] Live AI recommendations (Gemini / OpenAI)
- [ ] Progress tracking & streaks
- [ ] Vercel + Render deployment config
