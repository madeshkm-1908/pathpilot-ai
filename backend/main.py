"""
PathPilot AI — FastAPI Backend
================================
Endpoints:
  GET    /health                     — liveness, database, and AI engine status
  POST   /api/auth/signup            — register new user account
  POST   /api/auth/login             — user authentication and JWT issue
  GET    /api/auth/me                — current authenticated user profile
  POST   /api/auth/logout            — session logout
  GET    /api/dashboard              — real user statistics, active paths, and activity
  GET    /api/paths                  — list user's saved learning paths
  GET    /api/paths/{path_id}        — get detailed learning path with modules
  POST   /api/paths                  — save a learning path to user account
  DELETE /api/paths/{path_id}        — delete user learning path
  PATCH  /api/modules/{id}/progress  — toggle module completion & record study hours
  GET    /api/resources              — live web search for educational resources (Tavily)
  POST   /api/paths/preview          — live personalized roadmap synthesis (Tavily + Gemini)
"""

from __future__ import annotations

from datetime import datetime, date
import json
import os
import re
from typing import Any
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
import httpx
from pydantic import BaseModel, Field

import auth
import database
from database import get_db, query_all, query_one, execute_insert, execute_update

load_dotenv()

# Initialize database schema on startup
try:
    database.init_db()
except Exception as e:
    print(f"[Startup] Database init error: {e}")

# ---------------------------------------------------------------------------
# App Setup & CORS
# ---------------------------------------------------------------------------
app = FastAPI(
    title="PathPilot AI API",
    description="Live AI-powered personalized learning platform with persistent roadmaps & progress",
    version="0.3.0",
)

cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
cors_regex = os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_origin_regex=cors_regex if cors_regex else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class UserSignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class UserLoginRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: Any = None


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LearnerProfile(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    target_skill: str = Field(..., min_length=2, max_length=200)
    current_level: str = Field(..., pattern="^(beginner|intermediate|advanced)$")
    learning_style: str = Field(
        ...,
        pattern="^(visual|reading|hands_on|auditory|mixed)$",
    )
    hours_per_week: int = Field(..., ge=1, le=80)
    deadline_weeks: int = Field(..., ge=1, le=104)
    budget: str = Field(..., pattern="^(free_only|some_paid|flexible)$")
    goal: str = Field(..., min_length=5, max_length=500)


class ResourceOut(BaseModel):
    id: str
    title: str
    provider: str
    type: str
    level: str
    topic: str
    duration_hours: int
    cost: str
    url: str
    rating: float
    tags: list[str]


class ModuleOut(BaseModel):
    id: int | None = None
    week: int
    title: str
    description: str
    resource_id: str | None = None
    resource_title: str | None = None
    resource_url: str | None = None
    hours: int
    type: str  # "learn" | "practice" | "project"
    is_completed: bool = False
    completed_at: Any = None


class ProjectOut(BaseModel):
    title: str
    difficulty: str
    hours: int


class PathPreviewOut(BaseModel):
    disclaimer: str
    learner_name: str
    target_skill: str
    total_weeks: int
    total_hours: int
    modules: list[ModuleOut]
    suggested_projects: list[ProjectOut]
    next_steps: list[str]


class SavePathRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    learning_goal: str | None = None
    current_level: str | None = None
    target_skill: str = Field(..., min_length=2, max_length=200)
    hours_per_week: int = Field(default=10, ge=1, le=80)
    total_weeks: int = Field(default=4, ge=1, le=52)
    total_hours: int = Field(default=40, ge=1)
    modules: list[ModuleOut]


class ModuleProgressUpdate(BaseModel):
    is_completed: bool


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def extract_provider(url: str) -> str:
    """Extract clean domain/provider name from a URL."""
    try:
        domain = urlparse(url).netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        return domain or "Web Resource"
    except Exception:
        return "Web Resource"


async def search_tavily(query: str, max_results: int = 6) -> list[dict[str, Any]]:
    """Execute live web search via Tavily API using actual URLs."""
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key or not api_key.strip():
        raise HTTPException(
            status_code=400,
            detail="TAVILY_API_KEY is missing from backend/.env. Please configure a valid Tavily API key.",
        )

    async with httpx.AsyncClient(timeout=25.0) as client:
        try:
            resp = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": api_key.strip(),
                    "query": query,
                    "search_depth": "basic",
                    "include_answer": False,
                    "max_results": max_results,
                },
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Network error connecting to Tavily search: {str(exc)}",
            )

        if resp.status_code in (401, 403):
            raise HTTPException(
                status_code=401,
                detail="TAVILY_API_KEY is invalid or unauthorized. Please verify your Tavily credentials in backend/.env.",
            )
        if resp.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Tavily API quota or rate limit exceeded. Please check your Tavily plan or retry later.",
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Tavily search API error (HTTP {resp.status_code}): {resp.text}",
            )

        data = resp.json()
        results = data.get("results", [])
        return results


async def generate_gemini_roadmap(
    profile: LearnerProfile,
    search_results: list[dict[str, Any]],
) -> PathPreviewOut:
    """Call Google Gemini API to construct a personalized roadmap grounded in real search results."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY is missing from backend/.env. Please configure a valid Gemini API key.",
        )

    preferred_model = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview").strip()
    candidate_models = [preferred_model]
    for m in ("gemini-3-flash-preview", "gemini-3.5-flash-lite", "gemini-2.5-flash"):
        if m not in candidate_models:
            candidate_models.append(m)

    # Build grounded resources context from actual live search results
    resources_blocks = []
    for i, res in enumerate(search_results, 1):
        title = res.get("title", f"Resource {i}")
        url = res.get("url", "")
        content = res.get("content", "")[:350]
        resources_blocks.append(f"[{i}] Title: {title}\n    URL: {url}\n    Summary: {content}")

    resources_text = "\n\n".join(resources_blocks)

    system_instruction = (
        "You are an expert personalized curriculum designer for PathPilot AI. "
        "Your mission is to create a realistic, high-quality, sequential learning roadmap "
        "tailored to the learner's profile, schedule, and goals.\n\n"
        "CRITICAL GROUNDING RULES:\n"
        "1. You MUST use the actual real URLs from the provided Search Results for the modules. Do NOT invent, modify, or hallucinate URLs.\n"
        "2. Each learning module that references an external resource must specify both 'resource_title' and 'resource_url' taken directly from the provided Search Results.\n"
        "3. Provide practice checkpoints and a capstone project.\n"
        "4. Output MUST be strictly valid JSON matching the requested schema."
    )

    user_prompt = (
        f"Learner Profile:\n"
        f"- Name: {profile.name}\n"
        f"- Target Skill: {profile.target_skill}\n"
        f"- Current Level: {profile.current_level}\n"
        f"- Preferred Learning Style: {profile.learning_style}\n"
        f"- Study Hours Per Week: {profile.hours_per_week}\n"
        f"- Target Deadline (Weeks): {profile.deadline_weeks}\n"
        f"- Budget: {profile.budget}\n"
        f"- Goal / Desired Outcome: {profile.goal}\n\n"
        f"Real Search Results (Curated Live Web Resources):\n"
        f"{resources_text}\n\n"
        f"Generate a personalized learning path JSON strictly matching this schema:\n"
        f"{{\n"
        f'  "disclaimer": "Live AI-powered roadmap generated with Gemini and real web search results via Tavily.",\n'
        f'  "learner_name": "{profile.name}",\n'
        f'  "target_skill": "{profile.target_skill}",\n'
        f'  "total_weeks": <integer number of weeks, <= {min(profile.deadline_weeks, 24)}>,\n'
        f'  "total_hours": <integer estimated total hours>,\n'
        f'  "modules": [\n'
        f'    {{\n'
        f'      "week": 1,\n'
        f'      "title": "<Concise module title>",\n'
        f'      "description": "<What the learner will master this week>",\n'
        f'      "resource_id": "r1",\n'
        f'      "resource_title": "<Real title from search results>",\n'
        f'      "resource_url": "<Exact real URL from search results>",\n'
        f'      "hours": <hours for this module>,\n'
        f'      "type": "learn" | "practice" | "project"\n'
        f'    }}\n'
        f'  ],\n'
        f'  "suggested_projects": [\n'
        f'    {{\n'
        f'      "title": "<Project title>",\n'
        f'      "difficulty": "beginner" | "intermediate" | "advanced",\n'
        f'      "hours": <integer>\n'
        f'    }}\n'
        f'  ],\n'
        f'  "next_steps": [\n'
        f'    "<Actionable next step 1>",\n'
        f'    "<Actionable next step 2>",\n'
        f'    "<Actionable next step 3>"\n'
        f'  ]\n'
        f"}}"
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_instruction}\n\n{user_prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.3,
        },
    }

    last_error = "No response generated"

    async with httpx.AsyncClient(timeout=45.0) as client:
        for model_name in candidate_models:
            gemini_endpoint = (
                f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key.strip()}"
            )
            try:
                resp = await client.post(gemini_endpoint, json=payload)
            except httpx.RequestError as exc:
                last_error = f"Network error communicating with Gemini ({model_name}): {str(exc)}"
                continue

            if resp.status_code in (401, 403):
                raise HTTPException(
                    status_code=401,
                    detail="GEMINI_API_KEY is invalid or unauthorized. Please check your Gemini API key in backend/.env.",
                )
            if resp.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="Gemini API rate limit or quota exceeded. Please wait a moment and try again.",
                )
            if resp.status_code in (503, 404):
                last_error = f"Gemini model {model_name} returned HTTP {resp.status_code}"
                continue
            if resp.status_code != 200:
                err_msg = resp.text
                try:
                    err_json = resp.json()
                    if "error" in err_json and "message" in err_json["error"]:
                        err_msg = err_json["error"]["message"]
                except Exception:
                    pass
                last_error = f"Gemini API returned error (HTTP {resp.status_code}): {err_msg}"
                continue

            gemini_data = resp.json()
            try:
                candidates = gemini_data.get("candidates", [])
                if not candidates:
                    continue
                text_response = candidates[0]["content"]["parts"][0]["text"]
                parsed = json.loads(text_response)

                parsed["learner_name"] = profile.name
                parsed["target_skill"] = profile.target_skill
                if not parsed.get("disclaimer"):
                    parsed["disclaimer"] = "Live AI roadmap generated with Gemini and web search via Tavily."

                return PathPreviewOut(**parsed)
            except Exception as exc:
                last_error = f"Failed to parse structured roadmap from Gemini ({model_name}): {str(exc)}"
                continue

        raise HTTPException(
            status_code=502,
            detail=f"All Gemini model candidates failed: {last_error}",
        )


def calculate_streak(activity_dates: list[str]) -> int:
    """Calculate the consecutive days streak ending today or yesterday."""
    if not activity_dates:
        return 0

    parsed_dates = set()
    for d in activity_dates:
        try:
            # Handle timestamps or simple dates
            clean_date = d.split("T")[0].split(" ")[0]
            parsed_dates.add(datetime.strptime(clean_date, "%Y-%m-%d").date())
        except Exception:
            continue

    if not parsed_dates:
        return 0

    today = date.today()
    current = today
    # If no activity recorded today, check if active yesterday
    if current not in parsed_dates:
        yesterday = today - datetime.resolution
        # timedelta 1 day
        from datetime import timedelta
        current = today - timedelta(days=1)
        if current not in parsed_dates:
            return 0

    streak = 0
    from datetime import timedelta
    while current in parsed_dates:
        streak += 1
        current -= timedelta(days=1)

    return streak


# ---------------------------------------------------------------------------
# Meta & Health Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["meta"])
def health() -> dict[str, Any]:
    gemini_key = bool(os.getenv("GEMINI_API_KEY", "").strip())
    tavily_key = bool(os.getenv("TAVILY_API_KEY", "").strip())
    
    db_status = "connected"
    try:
        with get_db() as conn:
            query_one(conn, "SELECT 1;")
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "service": "pathpilot-api",
        "version": "0.3.0",
        "database": db_status,
        "database_type": "postgresql" if database.IS_POSTGRES else "sqlite",
        "ai_engine": {
            "gemini_configured": gemini_key,
            "tavily_configured": tavily_key,
            "gemini_model": os.getenv("GEMINI_MODEL", "gemini-3-flash-preview"),
        },
    }


# ---------------------------------------------------------------------------
# Authentication Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/auth/signup", response_model=AuthTokenResponse, tags=["auth"])
def signup(req: UserSignupRequest):
    """Register a new user account with secure password hashing."""
    email = auth.normalize_email(req.email)

    with get_db() as conn:
        existing = query_one(conn, "SELECT id FROM users WHERE email = ?", (email,))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )

        hashed_pw = auth.hash_password(req.password)
        user_id = execute_insert(
            conn,
            "INSERT INTO users (name, email, hashed_password) VALUES (?, ?, ?)",
            (req.name.strip(), email, hashed_pw),
        )

        # Record activity
        execute_insert(
            conn,
            "INSERT INTO user_activities (user_id, activity_type, description, hours_spent) VALUES (?, ?, ?, ?)",
            (user_id, "signup", "Created PathPilot AI account", 0),
        )

        user_record = query_one(conn, "SELECT id, name, email, created_at FROM users WHERE id = ?", (user_id,))

    access_token = auth.create_access_token(user_id, email)
    return AuthTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user_record),
    )


@app.post("/api/auth/login", response_model=AuthTokenResponse, tags=["auth"])
def login(req: UserLoginRequest):
    """Authenticate existing user credentials and return a signed JWT."""
    email = auth.normalize_email(req.email)

    with get_db() as conn:
        user_record = query_one(conn, "SELECT * FROM users WHERE email = ?", (email,))
        if not user_record or not auth.verify_password(req.password, user_record["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = user_record["id"]
        # Record login activity
        execute_insert(
            conn,
            "INSERT INTO user_activities (user_id, activity_type, description, hours_spent) VALUES (?, ?, ?, ?)",
            (user_id, "login", "Logged in to PathPilot AI", 0),
        )

    access_token = auth.create_access_token(user_id, email)
    return AuthTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_record["id"],
            name=user_record["name"],
            email=user_record["email"],
            created_at=user_record.get("created_at"),
        ),
    )


@app.get("/api/auth/me", response_model=UserResponse, tags=["auth"])
def get_me(current_user: dict = Depends(auth.get_current_user)):
    """Retrieve the current authenticated user's profile."""
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user.get("created_at"),
    )


@app.post("/api/auth/logout", tags=["auth"])
def logout():
    """Client-side session logout."""
    return {"message": "Successfully logged out."}


# ---------------------------------------------------------------------------
# Dashboard & Progress Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/dashboard", tags=["dashboard"])
def get_dashboard(current_user: dict = Depends(auth.get_current_user)):
    """
    Retrieve real personalized dashboard statistics, active learning paths,
    and historical learning activities for the authenticated user.
    """
    user_id = current_user["id"]

    with get_db() as conn:
        # 1. Fetch user's paths
        paths_raw = query_all(
            conn,
            "SELECT * FROM learning_paths WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        )

        formatted_paths = []
        for p in paths_raw:
            path_id = p["id"]
            # Fetch modules for this path
            modules = query_all(
                conn,
                "SELECT * FROM modules WHERE path_id = ? ORDER BY week ASC",
                (path_id,),
            )
            # Find next incomplete module
            next_mod = None
            for m in modules:
                if not m.get("is_completed"):
                    next_mod = m.get("title")
                    break

            formatted_paths.append({
                "id": p["id"],
                "title": p["title"],
                "description": p.get("description"),
                "learning_goal": p.get("learning_goal"),
                "current_level": p.get("current_level"),
                "target_skill": p["target_skill"],
                "hours_per_week": p["hours_per_week"],
                "total_weeks": p["total_weeks"],
                "total_hours": p["total_hours"],
                "progress_percentage": p["progress_percentage"],
                "next_module": next_mod or "All modules completed! 🎉",
                "completed_modules": sum(1 for m in modules if m.get("is_completed")),
                "total_modules": len(modules),
                "created_at": p.get("created_at"),
            })

        # 2. Total completed modules
        modules_done_row = query_one(
            conn,
            """
            SELECT COUNT(*) as count FROM modules
            JOIN learning_paths ON modules.path_id = learning_paths.id
            WHERE learning_paths.user_id = ? AND modules.is_completed = 1
            """,
            (user_id,),
        )
        modules_done = modules_done_row["count"] if modules_done_row else 0

        # 3. Actual study hours recorded
        hours_row = query_one(
            conn,
            "SELECT COALESCE(SUM(hours_spent), 0) as total FROM user_activities WHERE user_id = ?",
            (user_id,),
        )
        hours_studied = int(hours_row["total"]) if hours_row else 0

        # 4. Activity dates for streak calculation
        activity_dates_rows = query_all(
            conn,
            "SELECT DISTINCT created_at FROM user_activities WHERE user_id = ?",
            (user_id,),
        )
        dates_list = [str(r["created_at"]) for r in activity_dates_rows if r.get("created_at")]
        streak_days = calculate_streak(dates_list)

        # 5. Recent activity log
        activities_raw = query_all(
            conn,
            "SELECT id, activity_type, description, hours_spent, created_at FROM user_activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
            (user_id,),
        )

    return {
        "user": {
            "id": current_user["id"],
            "name": current_user["name"],
            "email": current_user["email"],
        },
        "stats": {
            "active_paths": len(formatted_paths),
            "modules_done": modules_done,
            "hours_studied": hours_studied,
            "streak_days": streak_days,
        },
        "paths": formatted_paths,
        "recent_activity": [
            {
                "id": a["id"],
                "date": str(a.get("created_at")),
                "action": a["description"],
                "type": a["activity_type"],
                "hours": a.get("hours_spent", 0),
            }
            for a in activities_raw
        ],
    }


# ---------------------------------------------------------------------------
# Learning Paths Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/paths", tags=["paths"])
def list_paths(current_user: dict = Depends(auth.get_current_user)):
    """List all saved learning paths for the authenticated user."""
    user_id = current_user["id"]
    with get_db() as conn:
        paths = query_all(
            conn,
            "SELECT * FROM learning_paths WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        )
        for p in paths:
            modules = query_all(conn, "SELECT * FROM modules WHERE path_id = ? ORDER BY week ASC", (p["id"],))
            p["modules"] = modules
    return paths


@app.get("/api/paths/{path_id}", tags=["paths"])
def get_path_by_id(path_id: int, current_user: dict = Depends(auth.get_current_user)):
    """Get a specific learning path with all associated modules and resources."""
    user_id = current_user["id"]
    with get_db() as conn:
        path = query_one(
            conn,
            "SELECT * FROM learning_paths WHERE id = ? AND user_id = ?",
            (path_id, user_id),
        )
        if not path:
            raise HTTPException(status_code=404, detail="Learning path not found.")

        modules = query_all(conn, "SELECT * FROM modules WHERE path_id = ? ORDER BY week ASC", (path_id,))
        resources = query_all(conn, "SELECT * FROM saved_resources WHERE path_id = ?", (path_id,))

        path["modules"] = modules
        path["resources"] = resources
        return path


@app.post("/api/paths", tags=["paths"])
def save_path(req: SavePathRequest, current_user: dict = Depends(auth.get_current_user)):
    """Save a generated learning path and its modules to the user's persistent account."""
    user_id = current_user["id"]

    with get_db() as conn:
        path_id = execute_insert(
            conn,
            """
            INSERT INTO learning_paths
            (user_id, title, description, learning_goal, current_level, target_skill, hours_per_week, total_weeks, total_hours, progress_percentage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            """,
            (
                user_id,
                req.title,
                req.description or f"Roadmap for {req.target_skill}",
                req.learning_goal,
                req.current_level,
                req.target_skill,
                req.hours_per_week,
                req.total_weeks,
                req.total_hours,
            ),
        )

        for m in req.modules:
            mod_id = execute_insert(
                conn,
                """
                INSERT INTO modules
                (path_id, week, title, description, hours, type, resource_id, resource_title, resource_url, is_completed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                """,
                (
                    path_id,
                    m.week,
                    m.title,
                    m.description,
                    m.hours,
                    m.type,
                    m.resource_id,
                    m.resource_title,
                    m.resource_url,
                ),
            )
            # Save associated resource if URL is present
            if m.resource_url:
                execute_insert(
                    conn,
                    """
                    INSERT INTO saved_resources
                    (user_id, path_id, title, url, provider, resource_type, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        path_id,
                        m.resource_title or m.title,
                        m.resource_url,
                        extract_provider(m.resource_url),
                        m.type,
                        m.description,
                    ),
                )

        # Record activity
        execute_insert(
            conn,
            "INSERT INTO user_activities (user_id, path_id, activity_type, description, hours_spent) VALUES (?, ?, ?, ?, ?)",
            (user_id, path_id, "create_path", f"Created learning roadmap: {req.title}", 0),
        )

        saved_path = query_one(conn, "SELECT * FROM learning_paths WHERE id = ?", (path_id,))
        saved_modules = query_all(conn, "SELECT * FROM modules WHERE path_id = ? ORDER BY week ASC", (path_id,))
        saved_path["modules"] = saved_modules

        return saved_path


@app.delete("/api/paths/{path_id}", tags=["paths"])
def delete_path(path_id: int, current_user: dict = Depends(auth.get_current_user)):
    """Delete a user's learning path and cascade-delete its modules."""
    user_id = current_user["id"]
    with get_db() as conn:
        path = query_one(conn, "SELECT id, title FROM learning_paths WHERE id = ? AND user_id = ?", (path_id, user_id))
        if not path:
            raise HTTPException(status_code=404, detail="Learning path not found.")

        execute_update(conn, "DELETE FROM learning_paths WHERE id = ?", (path_id,))

        execute_insert(
            conn,
            "INSERT INTO user_activities (user_id, activity_type, description, hours_spent) VALUES (?, ?, ?, ?)",
            (user_id, "delete_path", f"Deleted learning path: {path['title']}", 0),
        )

    return {"message": "Learning path deleted successfully."}


@app.patch("/api/modules/{module_id}/progress", tags=["paths"])
def update_module_progress(
    module_id: int,
    req: ModuleProgressUpdate,
    current_user: dict = Depends(auth.get_current_user),
):
    """
    Mark a module complete or incomplete, update path progress percentage,
    and log study hours to activity history.
    """
    user_id = current_user["id"]

    with get_db() as conn:
        # Verify module belongs to current user's path
        module_row = query_one(
            conn,
            """
            SELECT m.*, lp.user_id, lp.title as path_title
            FROM modules m
            JOIN learning_paths lp ON m.path_id = lp.id
            WHERE m.id = ? AND lp.user_id = ?
            """,
            (module_id, user_id),
        )
        if not module_row:
            raise HTTPException(status_code=404, detail="Module not found or unauthorized.")

        path_id = module_row["path_id"]
        is_completed_val = 1 if req.is_completed else 0
        completed_at_val = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S") if req.is_completed else None

        execute_update(
            conn,
            "UPDATE modules SET is_completed = ?, completed_at = ? WHERE id = ?",
            (is_completed_val, completed_at_val, module_id),
        )

        # Record activity and study hours when completed
        if req.is_completed:
            execute_insert(
                conn,
                """
                INSERT INTO user_activities
                (user_id, path_id, module_id, activity_type, description, hours_spent)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    path_id,
                    module_id,
                    "complete_module",
                    f"Completed: {module_row['title']} (Week {module_row['week']})",
                    module_row.get("hours", 0),
                ),
            )

        # Recalculate path progress percentage
        all_modules = query_all(conn, "SELECT is_completed FROM modules WHERE path_id = ?", (path_id,))
        total = len(all_modules)
        completed_count = sum(1 for m in all_modules if m.get("is_completed"))
        new_progress = int((completed_count / total) * 100) if total > 0 else 0

        execute_update(
            conn,
            "UPDATE learning_paths SET progress_percentage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_progress, path_id),
        )

    return {
        "module_id": module_id,
        "is_completed": req.is_completed,
        "path_id": path_id,
        "progress_percentage": new_progress,
    }


# ---------------------------------------------------------------------------
# Route: Resources (Live Tavily Search — PRESERVED)
# ---------------------------------------------------------------------------

@app.get("/api/resources", response_model=list[ResourceOut], tags=["resources"])
async def get_resources(
    topic: str | None = Query(None, description="Filter by topic keyword"),
    level: str | None = Query(None, description="beginner | intermediate | advanced"),
    cost: str | None = Query(None, description="free | free_audit | paid"),
    q: str | None = Query(None, description="Full-text search in title/tags"),
) -> list[ResourceOut]:
    """
    Search the live web for real educational resources using Tavily Search.
    Returns actual URLs, titles, and extracted providers.
    """
    query_parts: list[str] = []
    if q and q.strip():
        query_parts.append(q.strip())
    if topic and topic.strip():
        query_parts.append(topic.strip())
    if level and level.strip():
        query_parts.append(f"{level.strip()} level")
    if cost and cost.strip():
        query_parts.append(cost.strip())

    if not query_parts:
        search_query = "best free programming web development data science tutorials and courses"
    else:
        search_query = " ".join(query_parts) + " tutorial course documentation curriculum"

    search_results = await search_tavily(search_query, max_results=10)

    resources: list[ResourceOut] = []
    for idx, res in enumerate(search_results, 1):
        url = res.get("url", "")
        title = res.get("title", f"Learning Resource {idx}")
        provider = extract_provider(url)

        # Infer resource type
        url_lower = url.lower()
        if any(c in url_lower for c in ("coursera", "edx", "udemy", "course")):
            res_type = "course"
        elif any(d in url_lower for d in ("docs", "documentation", "handbook", "github.io")):
            res_type = "documentation"
        elif "youtube" in url_lower:
            res_type = "video"
        else:
            res_type = "curriculum"

        # Determine cost tag
        text_content = (title + " " + res.get("content", "")).lower()
        if "free" in text_content:
            res_cost = "free"
        elif cost:
            res_cost = cost
        else:
            res_cost = "free_audit"

        res_level = level if level in ("beginner", "intermediate", "advanced") else "beginner"
        res_topic = topic or "Technology"

        resources.append(
            ResourceOut(
                id=f"tavily-{idx}",
                title=title,
                provider=provider,
                type=res_type,
                level=res_level,
                topic=res_topic,
                duration_hours=15,
                cost=res_cost,
                url=url,
                rating=4.8,
                tags=[provider, res_level, res_topic.lower()],
            )
        )

    return resources


# ---------------------------------------------------------------------------
# Route: Path Preview (Live Tavily Search + Gemini AI Generation — PRESERVED)
# ---------------------------------------------------------------------------

@app.post("/api/paths/preview", response_model=PathPreviewOut, tags=["paths"])
async def preview_path(profile: LearnerProfile) -> PathPreviewOut:
    """
    Search the live web with Tavily for educational resources matching the user's
    target skill, level, and budget, then call Gemini to architect a personalized
    sequential roadmap with actual, real resource URLs.
    """
    tavily_query = (
        f"{profile.target_skill} {profile.current_level} tutorial course curriculum learning resources {profile.budget}"
    )
    search_results = await search_tavily(tavily_query, max_results=8)

    if not search_results:
        fallback_query = f"{profile.target_skill} tutorial course curriculum documentation"
        search_results = await search_tavily(fallback_query, max_results=8)

    if not search_results:
        raise HTTPException(
            status_code=502,
            detail=f"No web search results found for '{profile.target_skill}'. Please try a more common skill keyword.",
        )

    roadmap = await generate_gemini_roadmap(profile, search_results)
    return roadmap
