import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models import ReadingSession, MiscueToken, ComprehensionAnswer, Student, Passage
from app.auth.security import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


class MiscueTokenInput(BaseModel):
    word_index: int
    expected_word: str
    asr_transcribed_word: str | None = None
    asr_model_used: str = "facebook/mms-1b-all"
    is_correct: bool = True
    confidence_score: float | None = None


class ComprehensionAnswerInput(BaseModel):
    question_id: str
    selected_choice_index: int
    is_correct: bool


class SaveSessionRequest(BaseModel):
    student_id: str | None = None
    passage_id: str | None = None
    passage_preview: str | None = None
    source_language: str = "en"
    word_recognition_score: float = Field(..., ge=0, le=100)
    comprehension_score: float = Field(..., ge=0, le=100)
    phil_iri_level: str = "instructional"
    guidance_message: str | None = None
    miscue_tokens: list[MiscueTokenInput] = []
    comprehension_answers: list[ComprehensionAnswerInput] = []


@router.post("", status_code=status.HTTP_201_CREATED)
async def save_reading_session(
    body: SaveSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    student_uuid = None
    if body.student_id:
        try:
            student_uuid = uuid.UUID(body.student_id)
        except ValueError:
            pass

    if not student_uuid and current_user.get("role") == "student":
        student_uuid = uuid.UUID(current_user["sub"])

    if not student_uuid:
        # Fallback to finding first student or creating session
        first_student = await db.scalar(select(Student).limit(1))
        if first_student:
            student_uuid = first_student.id
        else:
            raise HTTPException(status_code=400, detail="Student account required for session recording.")

    passage_uuid = None
    if body.passage_id:
        try:
            passage_uuid = uuid.UUID(body.passage_id)
        except ValueError:
            pass

    new_session = ReadingSession(
        student_id=student_uuid,
        passage_id=passage_uuid,
        passage_preview=body.passage_preview,
        source_language=body.source_language,
        word_recognition_score=body.word_recognition_score,
        comprehension_score=body.comprehension_score,
        phil_iri_level=body.phil_iri_level,
        guidance_message=body.guidance_message,
        started_at=datetime.now(timezone.utc),
        finished_reading_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
    )
    db.add(new_session)
    await db.flush()

    # Add miscue tokens
    for mt in body.miscue_tokens:
        token = MiscueToken(
            reading_session_id=new_session.id,
            word_index=mt.word_index,
            expected_word=mt.expected_word,
            asr_transcribed_word=mt.asr_transcribed_word,
            asr_model_used=mt.asr_model_used,
            is_correct=mt.is_correct,
            confidence_score=mt.confidence_score,
        )
        db.add(token)

    # Add comprehension answers
    for ca in body.comprehension_answers:
        try:
            q_uuid = uuid.UUID(ca.question_id)
            ans = ComprehensionAnswer(
                reading_session_id=new_session.id,
                question_id=q_uuid,
                selected_choice_index=ca.selected_choice_index,
                is_correct=ca.is_correct,
            )
            db.add(ans)
        except ValueError:
            pass

    await db.commit()

    return {
        "id": str(new_session.id),
        "word_recognition_score": new_session.word_recognition_score,
        "comprehension_score": new_session.comprehension_score,
        "phil_iri_level": new_session.phil_iri_level,
        "completed_at": new_session.completed_at.isoformat() if new_session.completed_at else None,
        "detail": "Reading session persisted to PostgreSQL.",
    }


@router.get("/student/{student_id}")
async def get_student_session_history(
    student_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        s_uuid = uuid.UUID(student_id)
    except ValueError:
        # Search by username or school_id
        student = await db.scalar(select(Student).where(Student.school_id == student_id))
        if not student:
            return []
        s_uuid = student.id

    result = await db.execute(
        select(ReadingSession)
        .where(ReadingSession.student_id == s_uuid)
        .order_by(ReadingSession.completed_at.desc())
    )
    sessions = result.scalars().all()

    return [
        {
            "id": str(ses.id),
            "passage_preview": ses.passage_preview,
            "source_language": ses.source_language,
            "word_recognition_score": ses.word_recognition_score,
            "comprehension_score": ses.comprehension_score,
            "phil_iri_level": ses.phil_iri_level,
            "date": ses.completed_at.strftime("%Y-%m-%d") if ses.completed_at else "Today",
        }
        for ses in sessions
    ]
