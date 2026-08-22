import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("."))

import httpx

async def test_registration_flow():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # 1. Register teacher
        t_res = await client.post("/auth/teacher/register", json={
            "display_name": "Mr. Mark Reyes",
            "school_id": "T-2026-999",
            "email": "mark.reyes@smccnasipit.edu.ph",
            "password": "Password123!"
        })
        print(f"[Teacher Register Status]: {t_res.status_code} -> {t_res.json()}")

        # 2. Register student
        s_res = await client.post("/auth/student/register", json={
            "display_name": "Ana Marie Ramos",
            "school_id": "S-2026-888",
            "username": "ana_ramos",
            "email": "ana.ramos@student.smccnasipit.edu.ph",
            "password": "Password123!",
            "grade_level": 8,
            "section_name": "St. Jude"
        })
        print(f"[Student Register Status]: {s_res.status_code} -> {s_res.json()}")

if __name__ == "__main__":
    asyncio.run(test_registration_flow())
