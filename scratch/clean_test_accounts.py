import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("."))

from sqlalchemy import delete
from app.db import async_session_maker
from app.models import Teacher, Student

async def cleanup_test_accounts():
    async with async_session_maker() as session:
        await session.execute(delete(Teacher).where(Teacher.school_id == "T-2026-999"))
        await session.execute(delete(Student).where(Student.school_id == "S-2026-888"))
        await session.commit()
        print("[DB Cleanup] Temporary test accounts removed cleanly.")

if __name__ == "__main__":
    asyncio.run(cleanup_test_accounts())
