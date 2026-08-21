import asyncio
from app.db import async_session_maker
from app.models import Admin
from app.auth.security import hash_password
from sqlalchemy import select

async def create_root_admin():
    async with async_session_maker() as session:
        existing = await session.scalar(select(Admin).where(Admin.username == "admin"))
        if existing:
            print("Admin account 'admin' already exists.")
            return

        admin = Admin(
            username="admin",
            password_hash=hash_password("admin123")
        )
        session.add(admin)
        await session.commit()
        print("Root admin created successfully. Username: 'admin', Password: 'admin123'")

if __name__ == "__main__":
    print("Creating root admin...")
    asyncio.run(create_root_admin())
