import json

import httpx

from app.config import settings

REQUIRED_QUESTION_TYPES = ["recall", "inference", "application"]

PROMPT_TEMPLATE = """You are generating a reading comprehension test for a basic education student, based ONLY on the passage below. Do not use outside knowledge or invent details not supported by the passage.

Passage:
\"\"\"
{passage_text}
\"\"\"

Generate exactly {num_questions} multiple-choice questions about this passage, with exactly this breakdown of question types:
{type_breakdown}

Each question must have exactly 4 answer choices, with exactly one correct answer.

Definitions - follow these precisely, they are NOT interchangeable:
- "recall": the answer is stated directly in the passage. The student just needs to find it.
- "inference": the answer is NOT stated word-for-word. The student must connect two or more details in the passage, or read between the lines, to reach it.
- "application": the question describes a NEW situation, not found in the passage, and asks the student to use an idea, rule, or lesson from the passage to reason about that new situation. This is the hardest type - it must NOT be answerable by just remembering a fact from the text. If your question could be answered by quoting the passage, it is NOT an application question, rewrite it.

Example of a WEAK application question (do not do this): "What do plants need to grow?" - this is just recall, since the passage states it directly.

Example of a GOOD application question (do this instead): "Maria's classmate kept his plant in a dark closet and never watered it. Based on what Maria learned, what would you predict happens to that plant, and why?" - this requires applying the passage's stated rule (plants need sunlight, water, soil) to a new, unstated scenario.

Respond with ONLY valid JSON, no other text, in exactly this shape:
{{
  "questions": [
    {{
      "question_text": "...",
      "question_type": "recall" | "inference" | "application",
      "choices": ["...", "...", "...", "..."],
      "correct_choice_index": 0
    }}
  ]
}}
"""

MAX_GENERATION_ATTEMPTS = 3


class LLMServiceError(Exception):
    """
    Raised when the LLM response is unusable after all retry attempts are
    exhausted (bad JSON, miscounted question types, malformed questions).
    """


def _compute_type_counts(num_questions: int) -> dict:
    """
    Splits num_questions across recall/inference/application as evenly as
    possible, guaranteeing at least 1 of each (Rules.md R-4). Any remainder
    from uneven division is given to recall first, then inference - keeps
    application (the hardest, most failure-prone type) from being
    over-assigned, since asking for more of it than the model can reliably
    produce increases the chance of shallow "fake" application questions.
    """
    base = num_questions // 3
    remainder = num_questions % 3
    counts = {t: base for t in REQUIRED_QUESTION_TYPES}
    for t in ["recall", "inference", "application"][:remainder]:
        counts[t] += 1
    for t in REQUIRED_QUESTION_TYPES:
        counts[t] = max(counts[t], 1)
    return counts


class LLMService:
    """
    Generates comprehension tests via a locally hosted LLM through Ollama.

    Per Rules.md R-1, this service is used ONLY for comprehension-question
    generation and answer parsing - never pronunciation scoring. That
    separation lives structurally in the codebase: this service has no path
    to ASRService and never touches transcription/miscue data.

    Per Rules.md R-4, every generated test must include at least one recall,
    one inference, and one application question. Enforced three ways: exact
    per-type counts are computed and stated explicitly in the prompt, the
    prompt defines each type precisely (with a worked good/bad example for
    "application", the type most prone to being generated as disguised
    recall), and the response is validated against those exact counts before
    being returned - the prompt alone is not trusted to guarantee compliance.

    Retry behavior: in real-world testing, SeaLLM-v3-7B (Q4_K_M) does not
    reliably hit the exact requested type breakdown on every single attempt
    - it can undercount or overcount a type even with a correct prompt. This
    is a real property of the model, worth noting for Rules.md R-3 benchmark
    validation, not just an engineering annoyance. Rather than surface a
    single flaky generation as a hard failure, this service retries silently
    up to MAX_GENERATION_ATTEMPTS times before raising LLMServiceError. Only
    the flaky failure modes (bad JSON, count mismatch, malformed question
    shape) are retried - a caller error (num_questions < 3) is not, since
    retrying would never fix it.

    No load()/unload() lifecycle here, unlike ASRService: each request to
    Ollama passes keep_alive: 0, so Ollama releases the model from VRAM
    immediately after responding rather than relying on its own idle-unload
    timer (Rules.md R-5) - this service still doesn't own model residency
    itself, it just tells Ollama not to hold onto it between calls.
    """

    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model

    async def _generate_once(
        self, passage_text: str, num_questions: int, type_counts: dict
    ) -> dict:
        """
        A single generation + validation attempt. Raises LLMServiceError on
        any failure - the caller (generate_comprehension_test) decides
        whether to retry.
        """
        type_breakdown = "\n".join(
            f"- {count} {qtype} question(s)" for qtype, count in type_counts.items()
        )

        prompt = PROMPT_TEMPLATE.format(
            passage_text=passage_text,
            num_questions=num_questions,
            type_breakdown=type_breakdown,
        )

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "keep_alive": 0,
                },
            )
            response.raise_for_status()
            raw_output = response.json()["response"]

        try:
            parsed = json.loads(raw_output)
        except json.JSONDecodeError as exc:
            raise LLMServiceError(f"Model did not return valid JSON: {exc}") from exc

        questions = parsed.get("questions")
        if not isinstance(questions, list) or not questions:
            raise LLMServiceError("Response JSON missing a non-empty 'questions' list.")

        actual_counts = {t: 0 for t in REQUIRED_QUESTION_TYPES}
        for q in questions:
            qtype = q.get("question_type")
            if qtype in actual_counts:
                actual_counts[qtype] += 1

        mismatches = {
            t: (type_counts[t], actual_counts[t])
            for t in REQUIRED_QUESTION_TYPES
            if actual_counts[t] != type_counts[t]
        }
        if mismatches:
            detail = ", ".join(
                f"{t}: expected {exp}, got {got}" for t, (exp, got) in mismatches.items()
            )
            raise LLMServiceError(
                f"Generated test does not match required question-type "
                f"breakdown (Rules.md R-4): {detail}"
            )

        for i, q in enumerate(questions):
            if not isinstance(q.get("choices"), list) or len(q["choices"]) != 4:
                raise LLMServiceError(f"Question {i} does not have exactly 4 choices.")
            idx = q.get("correct_choice_index")
            if not isinstance(idx, int) or not (0 <= idx < 4):
                raise LLMServiceError(f"Question {i} has an invalid correct_choice_index.")
            q["order_index"] = i

        return {
            "generated_by_model": self.model,
            "questions": questions,
        }

    async def generate_comprehension_test(
        self, passage_text: str, num_questions: int = 5
    ) -> dict:
        if num_questions < 3:
            raise ValueError(
                "num_questions must be >= 3 to allow one of each required "
                "question type (Rules.md R-4)."
            )

        type_counts = _compute_type_counts(num_questions)

        last_error: LLMServiceError | None = None
        for attempt in range(1, MAX_GENERATION_ATTEMPTS + 1):
            try:
                return await self._generate_once(
                    passage_text, num_questions, type_counts
                )
            except LLMServiceError as exc:
                last_error = exc
                print(
                    f"[LLMService] Generation attempt {attempt}/"
                    f"{MAX_GENERATION_ATTEMPTS} failed: {exc}"
                )

        raise LLMServiceError(
            f"Failed to generate a valid comprehension test after "
            f"{MAX_GENERATION_ATTEMPTS} attempts. Last error: {last_error}"
        )


# Shared singleton - import this, don't instantiate LLMService() elsewhere.
llm_service = LLMService()