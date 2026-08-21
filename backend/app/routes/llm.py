from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.asr_service import asr_service
from app.services.llm_service import llm_service, LLMServiceError

router = APIRouter(prefix="/llm", tags=["llm"])


class ComprehensionTestRequest(BaseModel):
    passage_text: str = Field(..., min_length=1)
    num_questions: int = Field(default=5, ge=3, le=10)


@router.post("/comprehension-test")
async def generate_comprehension_test(body: ComprehensionTestRequest):
    """
    Generates a comprehension test for the given passage text.

    Per Rules.md R-1, this is the ONLY thing the LLM is used for in this
    project alongside answer parsing (not yet implemented here) - it is
    never involved in pronunciation scoring.

    Per Rules.md R-5, the ASR phase and LLM phase must never both hold VRAM
    at once within the 8GB budget. By the time a comprehension test is
    requested, the reading/pronunciation phase is over, so ASR models are
    released here before calling the LLM. This unload() call lives in the
    route (not in LLMService itself) specifically to avoid giving
    LLMService any import path to ASRService - keeping the R-1 separation
    structurally visible, not just documented.

    Returns a shape that maps directly onto Schema.md's `comprehension_tests`
    / `comprehension_questions` tables; persisting the result to the DB is a
    separate concern for whichever route/service owns saving sessions.
    """
    asr_service.unload()

    try:
        result = await llm_service.generate_comprehension_test(
            passage_text=body.passage_text,
            num_questions=body.num_questions,
        )
    except LLMServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return result