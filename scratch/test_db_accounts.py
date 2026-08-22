import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("."))

from sqlalchemy import select
from app.db import async_session_maker
from app.models import Teacher, Student, Class

async def test_accounts_in_db():
    async with async_session_maker() as session:
        # Check current teachers
        teachers = (await session.execute(select(Teacher))).scalars().all()
        print(f"[PostgreSQL] Total Teachers in DB: {len(teachers)}")
        for t in teachers:
            print(f"  - Teacher: {t.display_name} (School ID: {t.school_id}, Email: {t.email})")

        # Check current students
        students = (await session.execute(select(Student))).scalars().all()
        print(f"[PostgreSQL] Total Students in DB: {len(students)}")
        for s in students:
            print(f"  - Student: {s.display_name} (School ID: {s.school_id}, Username: {s.username})")

if __name__ == "__main__":
    asyncio.run(test_accounts_in_db())
