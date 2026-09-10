import asyncio
from sqlalchemy import select, or_
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
        existing_admin = await session.scalar(
            select(Admin).where(
                or_(
                    Admin.username == "readbuddyadmin",
                    Admin.username == "admin"
                )
            )
        )
        if not existing_admin:
            admin = Admin(
                display_name="SMCC System Administrator",
                username="readbuddyadmin",
                email="admin@smccnasipit.edu.ph",
                password_hash=hash_password("smcc2026"),
                role="admin",
            )
            session.add(admin)
        else:
            existing_admin.username = "readbuddyadmin"
            existing_admin.password_hash = hash_password("smcc2026")
            session.add(existing_admin)

        # 3. Check if Principal account exists
        existing_principal = await session.scalar(
            select(Admin).where(
                or_(
                    Admin.username == "readbuddyprincipal",
                    Admin.username == "principal",
                    Admin.email == "principal@smccnasipit.edu.ph"
                )
            )
        )
        if not existing_principal:
            principal = Admin(
                display_name="Dr. Maria Elena Santos",
                username="readbuddyprincipal",
                email="principal@smccnasipit.edu.ph",
                password_hash=hash_password("smcc2026"),
                role="principal",
            )
            session.add(principal)
        else:
            existing_principal.username = "readbuddyprincipal"
            existing_principal.password_hash = hash_password("smcc2026")
            existing_principal.role = "principal"
            session.add(existing_principal)

        await session.commit()
        print("[DB Init] PostgreSQL Database initialized cleanly with dynamic schema!")


if __name__ == "__main__":
    asyncio.run(init_database())
