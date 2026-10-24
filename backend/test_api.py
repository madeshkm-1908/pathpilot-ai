import os
from httpx import ASGITransport, AsyncClient
from main import app


async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["service"] == "pathpilot-api"
        assert "ai_engine" in data
        assert data["ai_engine"]["gemini_configured"] is True
        assert data["ai_engine"]["tavily_configured"] is True


async def test_resources_live_search():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/resources?q=python&level=beginner")
        assert res.status_code == 200
        items = res.json()
        assert len(items) > 0
        first = items[0]
        assert "url" in first and first["url"].startswith("http")
        assert "title" in first and len(first["title"]) > 0
        assert "provider" in first and len(first["provider"]) > 0


async def test_preview_path_live_gemini_and_tavily():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "name": "Alex Rivera",
            "target_skill": "Full Stack Web Development",
            "current_level": "beginner",
            "learning_style": "hands_on",
            "hours_per_week": 10,
            "deadline_weeks": 6,
            "budget": "free_only",
            "goal": "Build dynamic web applications with React and Python",
        }
        res = await client.post("/api/paths/preview", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["learner_name"] == "Alex Rivera"
        assert data["target_skill"] == "Full Stack Web Development"
        assert len(data["modules"]) > 0
        assert "suggested_projects" in data and len(data["suggested_projects"]) > 0
        assert "next_steps" in data and len(data["next_steps"]) > 0

        # Verify real URLs attached to modules
        urls = [m.get("resource_url") for m in data["modules"] if m.get("resource_url")]
        assert len(urls) > 0, "Modules must contain real resource URLs"
        for url in urls:
            assert url.startswith("http"), f"Invalid resource URL: {url}"


async def test_error_when_tavily_key_missing():
    transport = ASGITransport(app=app)
    original_key = os.environ.get("TAVILY_API_KEY", "")
    os.environ["TAVILY_API_KEY"] = ""
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/resources?q=javascript")
            assert res.status_code == 400
            assert "TAVILY_API_KEY is missing" in res.json()["detail"]
    finally:
        os.environ["TAVILY_API_KEY"] = original_key


async def test_error_when_gemini_key_missing():
    transport = ASGITransport(app=app)
    original_key = os.environ.get("GEMINI_API_KEY", "")
    os.environ["GEMINI_API_KEY"] = ""
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "name": "Test User",
                "target_skill": "Python",
                "current_level": "beginner",
                "learning_style": "visual",
                "hours_per_week": 5,
                "deadline_weeks": 4,
                "budget": "free_only",
                "goal": "Learn basic programming logic",
            }
            res = await client.post("/api/paths/preview", json=payload)
            assert res.status_code == 400
            assert "GEMINI_API_KEY is missing" in res.json()["detail"]
    finally:
        os.environ["GEMINI_API_KEY"] = original_key


async def run_all_tests():
    print("--- [1/5] Testing /health endpoint ---")
    await test_health_endpoint()
    print("[PASS] Health endpoint passed.")

    print("--- [2/5] Testing /api/resources (Live Tavily search) ---")
    await test_resources_live_search()
    print("[PASS] Resources live search passed.")

    print("--- [3/5] Testing /api/paths/preview (Live Tavily + Gemini) ---")
    await test_preview_path_live_gemini_and_tavily()
    print("[PASS] Path preview generation passed.")

    print("--- [4/5] Testing error on missing Tavily key ---")
    await test_error_when_tavily_key_missing()
    print("[PASS] Missing Tavily key handling passed.")

    print("--- [5/5] Testing error on missing Gemini key ---")
    await test_error_when_gemini_key_missing()
    print("[PASS] Missing Gemini key handling passed.")

    print("\nALL 5 TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_all_tests())
