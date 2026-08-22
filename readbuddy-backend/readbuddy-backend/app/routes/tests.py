import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models import TestAssignment, Passage, Teacher, Student
from app.auth.security import require_role, get_current_user

router = APIRouter(prefix="/tests", tags=["tests"])


class AssignTestRequest(BaseModel):
    passage_id: str
    student_ids: list[str]


class GradeTestRequest(BaseModel):
    word_recognition_score: float | None = None
    comprehension_score: float | None = None
    phil_iri_level: str | None = None
    teacher_remarks: str | None = None


@router.post("/assign", status_code=status.HTTP_201_CREATED)
async def assign_test_to_students(
    body: AssignTestRequest,
    teacher_session: dict = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    teacher_uuid = uuid.UUID(teacher_session["sub"])
    passage_uuid = uuid.UUID(body.passage_id)

    passage = await db.scalar(select(Passage).where(Passage.id == passage_uuid))
    if not passage:
        raise HTTPException(status_code=404, detail="Passage not found.")

    assignments_created = []
    for sid_str in body.student_ids:
        try:
            s_uuid = uuid.UUID(sid_str)
        except ValueError:
            student = await db.scalar(select(Student).where(Student.school_id == sid_str))
            if student:
                s_uuid = student.id
            else:
                continue

        assignment = TestAssignment(
            passage_id=passage_uuid,
            teacher_id=teacher_uuid,
            student_id=s_uuid,
            status="pending",
        )
        db.add(assignment)
        assignments_created.append(assignment)

    await db.commit()

    return {
        "detail": f"Assigned reading test to {len(assignments_created)} students.",
        "assigned_count": len(assignments_created),
    }


@router.get("/teacher")
async def list_teacher_tests(
    teacher_session: dict = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    teacher_uuid = uuid.UUID(teacher_session["sub"])
    result = await db.execute(
        select(TestAssignment)
        .options(selectinload(TestAssignment.passage), selectinload(TestAssignment.student))
        .where(TestAssignment.teacher_id == teacher_uuid)
        .order_by(TestAssignment.assigned_at.desc())
    )
    assignments = result.scalars().all()

    return [
        {
            "id": str(a.id),
            "passage_id": str(a.passage_id),
            "passage_preview": a.passage.confirmed_text[:60] + "..." if a.passage else "Reading Test",
            "source_language": a.passage.source_language if a.passage else "en",
            "student_id": str(a.student_id),
            "student_name": a.student.display_name if a.student else "Student",
            "status": a.status,
            "word_recognition_score": a.word_recognition_score,
            "comprehension_score": a.comprehension_score,
            "phil_iri_level": a.phil_iri_level,
            "teacher_remarks": a.teacher_remarks,
            "assigned_at": a.assigned_at.strftime("%Y-%m-%d") if a.assigned_at else "Today",
            "completed_at": a.completed_at.strftime("%Y-%m-%d") if a.completed_at else None,
        }
        for a in assignments
    ]


@router.patch("/{assignment_id}/grade")
async def grade_test_assignment(
    assignment_id: str,
    body: GradeTestRequest,
    teacher_session: dict = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    a_uuid = uuid.UUID(assignment_id)
    t_uuid = uuid.UUID(teacher_session["sub"])

    assignment = await db.scalar(select(TestAssignment).where(TestAssignment.id == a_uuid, TestAssignment.teacher_id == t_uuid))
    if not assignment:
        raise HTTPException(status_code=404, detail="Test assignment not found.")

    if body.word_recognition_score is not None:
        assignment.word_recognition_score = body.word_recognition_score
    if body.comprehension_score is not None:
        assignment.comprehension_score = body.comprehension_score
    if body.phil_iri_level is not None:
        assignment.phil_iri_level = body.phil_iri_level
    if body.teacher_remarks is not None:
        assignment.teacher_remarks = body.teacher_remarks

    assignment.status = "graded"
    assignment.graded_at = datetime.now(timezone.utc)

    await db.commit()

    return {
        "id": str(assignment.id),
        "status": assignment.status,
        "teacher_remarks": assignment.teacher_remarks,
        "detail": "Test assignment graded and remarks recorded.",
    }
