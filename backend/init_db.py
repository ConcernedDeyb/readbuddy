import asyncio
from sqlalchemy import select
from app.db import engine, Base, async_session_maker
from app.models import (
    Admin, Teacher, Student, Class, Passage,
    ReadingSession, MiscueToken, ComprehensionTest,
    ComprehensionQuestion, ComprehensionAnswer, TestAssignment, AdminSettings
)
from app.auth.security import hash_password


async def init_database():
    print("[DB Init] Synchronizing PostgreSQL database tables with updated Schema.md...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[DB Init] All 12 PostgreSQL tables created successfully.")

    async with async_session_maker() as session:
        # 1. Initialize Admin Settings
        existing_settings = await session.scalar(select(AdminSettings).where(AdminSettings.id == "default"))
        if not existing_settings:
            settings_obj = AdminSettings(
                id="default",
                asr_device="cuda",
                vram_budget_mb=8192,
                active_asr_model="facebook/mms-1b-all",
                active_llm_model="gemma3:4b",
            )
            session.add(settings_obj)

        # 2. Check if default admin exists
        existing_admin = await session.scalar(select(Admin).where(Admin.username == "admin"))
        if not existing_admin:
            admin = Admin(
                display_name="SMCC System Administrator",
                username="admin",
                email="admin@smccnasipit.edu.ph",
                password_hash=hash_password("AdminSecure2026!"),
                role="admin",
            )
            session.add(admin)

        await session.commit()
        print("[DB Init] PostgreSQL Database initialized cleanly with dynamic schema!")


if __name__ == "__main__":
    asyncio.run(init_database())
