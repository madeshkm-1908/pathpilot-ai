"""
PathPilot AI — FastAPI Backend
================================
Endpoints:
  GET  /health            — liveness and AI engine status
  GET  /api/resources     — live web search for educational resources (Tavily)
  POST /api/paths/preview — live personalized learning roadmap (Tavily + Gemini)

NOTE:
  - Web search is powered live by Tavily API.
  - Roadmap curriculum generation is powered by Google Gemini API.
  - API keys are securely read from backend/.env and never exposed.
"""

from __future__ import annotations

import json
import os
from typing import Any
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from pydantic import BaseModel, Field

load_dotenv()

# ---------------------------------------------------------------------------
# App Setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="PathPilot AI API",
    description="Live AI-powered personalized learning path generator",
    version="0.2.0",
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
    week: int
    title: str
    description: str
    resource_id: str | None = None
    resource_title: str | None = None
    resource_url: str | None = None
    hours: int
    type: str  # "learn" | "practice" | "project"


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
                # Temporary high demand or deprecation: fallback to next candidate model
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


# ---------------------------------------------------------------------------
# Route: Health
# ---------------------------------------------------------------------------

@app.get("/health", tags=["meta"])
def health() -> dict[str, Any]:
    gemini_key = bool(os.getenv("GEMINI_API_KEY", "").strip())
    tavily_key = bool(os.getenv("TAVILY_API_KEY", "").strip())
    return {
        "status": "ok",
        "service": "pathpilot-api",
        "version": "0.2.0",
        "ai_engine": {
            "gemini_configured": gemini_key,
            "tavily_configured": tavily_key,
            "gemini_model": os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
        },
    }


# ---------------------------------------------------------------------------
# Route: Resources (Live Tavily Search)
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
# Route: Path Preview (Live Tavily Search + Gemini AI Generation)
# ---------------------------------------------------------------------------

@app.post("/api/paths/preview", response_model=PathPreviewOut, tags=["paths"])
async def preview_path(profile: LearnerProfile) -> PathPreviewOut:
    """
    Search the live web with Tavily for educational resources matching the user's
    target skill, level, and budget, then call Gemini to architect a personalized
    sequential roadmap with actual, real resource URLs.
    """
    # 1. Search Tavily for high-quality real resources
    tavily_query = (
        f"{profile.target_skill} {profile.current_level} tutorial course curriculum learning resources {profile.budget}"
    )
    search_results = await search_tavily(tavily_query, max_results=8)

    if not search_results:
        # Fallback query if overly specific
        fallback_query = f"{profile.target_skill} tutorial course curriculum documentation"
        search_results = await search_tavily(fallback_query, max_results=8)

    if not search_results:
        raise HTTPException(
            status_code=502,
            detail=f"No web search results found for '{profile.target_skill}'. Please try a more common skill keyword.",
        )

    # 2. Generate roadmap with Gemini grounded in search results
    roadmap = await generate_gemini_roadmap(profile, search_results)
    return roadmap
