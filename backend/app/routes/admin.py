import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db import get_db
from app.models import Teacher, Student, Passage, ComprehensionTest
from app.auth.security import require_role, generate_verification_token
from app.auth.email import send_verification_email

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/teachers")
async def get_teachers(
    admin_session: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Teacher))
    teachers = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "display_name": t.display_name,
            "school_id": t.school_id,
            "email": t.email,
            "is_approved": t.is_approved,
            "created_at": t.created_at.isoformat(),
        }
        for t in teachers
    ]

@router.post("/approve-teacher/{teacher_id}")
async def approve_teacher(
    teacher_id: uuid.UUID,
    admin_session: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    teacher = await db.scalar(select(Teacher).where(Teacher.id == teacher_id))
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")
    if teacher.is_approved:
        raise HTTPException(status_code=400, detail="Teacher is already approved.")

    teacher.is_approved = True
    token = generate_verification_token()
    teacher.email_verification_token = token
    await db.commit()

    send_verification_email(teacher.email, token)
    return {"detail": f"Teacher {teacher.display_name} approved. Verification email sent."}

@router.delete("/reject-teacher/{teacher_id}")
async def reject_teacher(
    teacher_id: uuid.UUID,
    admin_session: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    teacher = await db.scalar(select(Teacher).where(Teacher.id == teacher_id))
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")
    if teacher.is_approved:
        raise HTTPException(status_code=400, detail="Cannot reject an already approved teacher. You must delete the account instead.")

    await db.delete(teacher)
    await db.commit()
    return {"detail": f"Teacher {teacher.display_name} registration rejected."}


@router.get("/stats")
async def get_stats(
    admin_session: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    # Total counts
    teachers_count = await db.scalar(select(func.count(Teacher.id)))
    pending_teachers = await db.scalar(select(func.count(Teacher.id)).where(Teacher.is_approved == False))
    students_count = await db.scalar(select(func.count(Student.id)).where(Student.is_archived == False))
    passages_count = await db.scalar(select(func.count(Passage.id)).where(Passage.is_archived == False))
    tests_count = await db.scalar(select(func.count(ComprehensionTest.id)))
    
    return {
        "teacher_count": teachers_count or 0,
        "pending_teacher_count": pending_teachers or 0,
        "student_count": students_count or 0,
        "passage_count": passages_count or 0,
        "test_count": tests_count or 0,
        "vram_status": {
            "activePhase": "idle",
            "usedMb": 1024,
            "budgetMb": 8192
        },
        "recent_activity": []
    }

@router.get("/students")
async def get_students(
    admin_session: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Student).options(joinedload(Student.teacher)))
    students = result.scalars().all()
    
    return [
        {
            "id": str(s.id),
            "display_name": s.display_name,
            "username": s.username,
            "teacher_name": s.teacher.display_name if s.teacher else "Unknown",
            "grade_level": s.grade_level,
            "session_count": 0,
            "is_archived": s.is_archived,
        }
        for s in students
    ]

@router.patch("/students/{student_id}/archive")
async def archive_student(
    student_id: uuid.UUID,
    admin_session: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    student = await db.scalar(select(Student).where(Student.id == student_id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.is_archived = True
    await db.commit()
    return {"detail": "Student archived"}

@router.patch("/students/{student_id}/restore")
async def restore_student(
    student_id: uuid.UUID,
    admin_session: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    student = await db.scalar(select(Student).where(Student.id == student_id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.is_archived = False
    await db.commit()
    return {"detail": "Student restored"}


@router.get("/passages")
async def get_passages(
    admin_session: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Passage))
    passages = result.scalars().all()
    
    return [
        {
            "id": str(p.id),
            "source_language": p.source_language,
            "confirmed_text": p.confirmed_text,
            "word_count": p.word_count,
            "is_published": p.is_published,
            "is_archived": p.is_archived,
        }
        for p in passages
    ]

@router.patch("/passages/{passage_id}/publish")
async def toggle_publish_passage(
    passage_id: uuid.UUID,
    admin_session: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    passage = await db.scalar(select(Passage).where(Passage.id == passage_id))
    if not passage:
        raise HTTPException(status_code=404, detail="Passage not found")
    passage.is_published = not passage.is_published
    await db.commit()
    return {"detail": f"Passage {'published' if passage.is_published else 'unpublished'}"}

@router.patch("/passages/{passage_id}/archive")
async def archive_passage(
    passage_id: uuid.UUID,
    admin_session: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    passage = await db.scalar(select(Passage).where(Passage.id == passage_id))
    if not passage:
        raise HTTPException(status_code=404, detail="Passage not found")
    passage.is_archived = True
    await db.commit()
    return {"detail": "Passage archived"}

@router.patch("/passages/{passage_id}/restore")
async def restore_passage(
    passage_id: uuid.UUID,
    admin_session: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    passage = await db.scalar(select(Passage).where(Passage.id == passage_id))
    if not passage:
        raise HTTPException(status_code=404, detail="Passage not found")
    passage.is_archived = False
    await db.commit()
    return {"detail": "Passage restored"}
