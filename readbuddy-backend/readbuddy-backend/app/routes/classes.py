import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models import Class, Student
from app.auth.security import require_role, hash_password

router = APIRouter(prefix="/classes", tags=["classes"])


class CreateClassRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Section or class name, e.g. St. Jude")
    grade_level: int = Field(..., ge=0, le=12, description="Grade level (0 to 12)")
    class_code: str | None = Field(default=None, description="Optional custom class code")


class AddStudentToClassRequest(BaseModel):
    display_name: str = Field(..., min_length=1)
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=4)
    preferred_language: str = Field(default="en")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_class(
    body: CreateClassRequest,
    teacher_session: dict = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    teacher_id = uuid.UUID(teacher_session["sub"])
    clean_name = body.name.strip().upper().replace(" ", "")

    # Auto-generate class code if not supplied
    if body.class_code and body.class_code.strip():
        code = body.class_code.strip().upper()
    else:
        suffix = str(uuid.uuid4())[:4].upper()
        code = f"SMCC-G{body.grade_level}-{clean_name[:6]}-{suffix}"

    existing_code = await db.scalar(select(Class).where(Class.class_code == code))
    if existing_code:
        raise HTTPException(status_code=400, detail="A class with this Class Code already exists.")

    new_class = Class(
        teacher_id=teacher_id,
        name=body.name.strip(),
        grade_level=body.grade_level,
        class_code=code,
    )
    db.add(new_class)
    await db.commit()

    return {
        "id": str(new_class.id),
        "name": new_class.name,
        "grade_level": new_class.grade_level,
        "class_code": new_class.class_code,
        "student_count": 0,
        "detail": "Class section created successfully.",
    }


@router.get("")
async def list_teacher_classes(
    teacher_session: dict = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    teacher_id = uuid.UUID(teacher_session["sub"])

    # Query classes with student count
    query = (
        select(Class, func.count(Student.id).label("student_count"))
        .outerjoin(Student, Student.class_id == Class.id)
        .where(Class.teacher_id == teacher_id)
        .group_by(Class.id)
        .order_by(Class.grade_level.asc(), Class.name.asc())
    )

    result = await db.execute(query)
    classes = result.all()

    return [
        {
            "id": str(cls.id),
            "name": cls.name,
            "grade_level": cls.grade_level,
            "class_code": cls.class_code,
            "student_count": count,
            "created_at": cls.created_at.isoformat() if cls.created_at else None,
        }
        for cls, count in classes
    ]


@router.get("/{class_id}/students")
async def list_class_students(
    class_id: str,
    teacher_session: dict = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    c_uuid = uuid.UUID(class_id)
    t_uuid = uuid.UUID(teacher_session["sub"])

    # Verify teacher owns class
    cls = await db.scalar(select(Class).where(Class.id == c_uuid, Class.teacher_id == t_uuid))
    if not cls:
        raise HTTPException(status_code=404, detail="Class section not found or unauthorized.")

    result = await db.execute(select(Student).where(Student.class_id == c_uuid))
    students = result.scalars().all()

    return [
        {
            "id": str(s.id),
            "display_name": s.display_name,
            "username": s.username,
            "grade_level": s.grade_level,
            "preferred_language": s.preferred_language,
        }
        for s in students
    ]


@router.post("/{class_id}/students", status_code=status.HTTP_201_CREATED)
async def add_student_to_class(
    class_id: str,
    body: AddStudentToClassRequest,
    teacher_session: dict = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    c_uuid = uuid.UUID(class_id)
    t_uuid = uuid.UUID(teacher_session["sub"])

    cls = await db.scalar(select(Class).where(Class.id == c_uuid, Class.teacher_id == t_uuid))
    if not cls:
        raise HTTPException(status_code=404, detail="Class section not found or unauthorized.")

    existing_user = await db.scalar(select(Student).where(Student.username == body.username))
    if existing_user:
        raise HTTPException(status_code=400, detail="That student username is already taken.")

    student = Student(
        display_name=body.display_name,
        username=body.username,
        password_hash=hash_password(body.password),
        teacher_id=t_uuid,
        class_id=c_uuid,
        grade_level=cls.grade_level,
        preferred_language=body.preferred_language,
    )
    db.add(student)
    await db.commit()

    return {
        "id": str(student.id),
        "display_name": student.display_name,
        "username": student.username,
        "class_id": str(cls.id),
        "class_name": cls.name,
        "grade_level": cls.grade_level,
    }
