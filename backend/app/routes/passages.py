import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Passage, ComprehensionTest, ComprehensionQuestion
from app.auth.security import require_role

router = APIRouter(prefix="/passages", tags=["passages"])


class QuestionSchema(BaseModel):
    question_text: str = Field(..., min_length=1)
    question_type: str = Field(default="recall")  # recall, inference, application
    choices: list[str] = Field(..., min_items=4, max_items=4)
    correct_choice_index: int = Field(default=0, ge=0, le=3)


class CreatePassageRequest(BaseModel):
    confirmed_text: str = Field(..., min_length=10)
    source_language: str = Field(default="en")  # en / tl
    questions: list[QuestionSchema] = Field(default=[], min_items=1)


@router.post("/teacher", status_code=status.HTTP_201_CREATED)
async def create_teacher_passage(
    body: CreatePassageRequest,
    teacher_session: dict = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    teacher_id = uuid.UUID(teacher_session["sub"])
    word_count = len(body.confirmed_text.strip().split())

    passage = Passage(
        teacher_id=teacher_id,
        source_type="typed",
        source_language=body.source_language,
        confirmed_text=body.confirmed_text.strip(),
        word_count=word_count,
        is_published=True,
    )
    db.add(passage)
    await db.flush()

    # Create associated comprehension test
    comp_test = ComprehensionTest(
        passage_id=passage.id,
        generated_by_model="gemma3:4b",
    )
    db.add(comp_test)
    await db.flush()

    # Add questions
    for idx, q in enumerate(body.questions):
        q_obj = ComprehensionQuestion(
            test_id=comp_test.id,
            question_text=q.question_text,
            question_type=q.question_type,
            choices=json.dumps(q.choices),
            correct_choice_index=q.correct_choice_index,
            order_index=idx,
        )
        db.add(q_obj)

    await db.commit()

    return {
        "id": str(passage.id),
        "confirmed_text": passage.confirmed_text,
        "source_language": passage.source_language,
        "word_count": passage.word_count,
        "questions_count": len(body.questions),
        "detail": "Passage and comprehension test created successfully.",
    }


@router.get("/teacher")
async def list_teacher_passages(
    teacher_session: dict = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    teacher_id = uuid.UUID(teacher_session["sub"])
    result = await db.execute(
        select(Passage)
        .where(Passage.teacher_id == teacher_id)
        .order_by(Passage.created_at.desc())
    )
    passages = result.scalars().all()

    return [
        {
            "id": str(p.id),
            "confirmed_text": p.confirmed_text,
            "source_language": p.source_language,
            "word_count": p.word_count,
            "is_published": p.is_published,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in passages
    ]
