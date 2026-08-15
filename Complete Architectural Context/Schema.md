# ReadBuddy — Database Schema

PostgreSQL. No pgvector extension enabled (see `PRD.md` / `architecture.md` — no feature in current
scope needs vector similarity search). Raw audio is never stored (see `Rules.md`, R-6) — only
derived text and scores.

---

## Entity Overview

```
teachers ──< students ──< reading_sessions >── passages
                              │
                              ├──< miscue_tokens              (per-word pronunciation results)
                              │
                              └──< comprehension_tests ──< comprehension_questions ──< comprehension_answers
                                           │
                                           └── (feeds into reading_sessions.comprehension_score)
```

`teachers ──< students` is new (see `architecture.md` §7, Authentication & Authorization):
student accounts are created only by their teacher, not self-registered — each student row
belongs to exactly one teacher.

## Tables

### `students`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `display_name` | text | full name or nickname — e.g. "Juan dela Cruz" |
| `school_id` | text | institutional student ID number (e.g. `"202612345"`) |
| `email` | text | student email address (e.g. `"student@smccnasipit.edu.ph"`) |
| `username` | text, unique | login identifier; chosen/assigned by the teacher who creates the account (see `Rules.md` R-16) |
| `password_hash` | text | bcrypt hash via `passlib` — 1 single password field at creation |
| `teacher_id` | uuid, FK → `teachers.id` | the teacher who created/owns this student account |
| `grade_level` | smallint | student's actual grade, range: Kindergarten (`0`) through `12` — no longer fixed to a single grade (`Rules.md` R-10) |
| `section` | text | e.g. "St. Jude" / "Grade 7 - Faith" |
| `preferred_language` | text | `"en"` / `"tl"` — default reading-passage language preference |
| `created_at` | timestamptz | |

### `teachers`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `display_name` | text | |
| `school_id` | text, unique | school-issued ID, used as the teacher's login identifier |
| `email` | text, unique | school email; must be verified before login (see `Rules.md` R-17) |
| `password_hash` | text | bcrypt hash via `passlib` — never store plaintext (`Rules.md` R-14) |
| `email_verified` | boolean | default `false`; login is rejected until this is `true` |
| `email_verification_token` | text, nullable | single-use token emailed at registration; cleared once verified |
| `created_at` | timestamptz | |

> Teachers now do more than result-visibility (see `architecture.md` §7): they self-register
> (school ID + email + password, email-verified before first login) and create/manage their own
> students' accounts. A full aggregate class-results dashboard is still **not** in scope — see
> "Deliberately Not Included" below.

### `passages`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `student_id` | uuid, FK → `students.id` | passage is owned by the student who input it |
| `source_type` | text | `"typed"` \| `"photo_ocr"` \| `"document_upload"` |
| `source_language` | text | `"en"` \| `"tl"` \| `"mixed"` |
| `raw_extracted_text` | text | output straight from EasyOCR / PyMuPDF / mammoth, before review |
| `confirmed_text` | text | the text after the student's review/correction step (see `Rules.md` R-7) — this is what the student is actually scored against |
| `word_count` | int | derived from `confirmed_text` |
| `created_at` | timestamptz | |

### `reading_sessions`
One row per full attempt at reading a passage aloud and completing its comprehension test.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `student_id` | uuid, FK → `students.id` | |
| `passage_id` | uuid, FK → `passages.id` | |
| `started_at` | timestamptz | |
| `finished_reading_at` | timestamptz | nullable until reading phase completes |
| `word_recognition_score` | numeric(5,2) | percentage, computed from `miscue_tokens` |
| `comprehension_score` | numeric(5,2) | percentage, computed from `comprehension_answers` |
| `phil_iri_level` | text | `"independent"` \| `"instructional"` \| `"frustration"` — computed as the **lower** of the two tiers implied by the two scores above (see `PRD.md` §8) |
| `guidance_message` | text | the specific next-step message shown on the result screen |
| `completed_at` | timestamptz | nullable until the full flow (reading + test) is done |

### `miscue_tokens`
One row per word in the passage, capturing the pronunciation-check result for that word in a
specific session. This is the audit trail behind `reading_sessions.word_recognition_score`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `reading_session_id` | uuid, FK → `reading_sessions.id` | |
| `word_index` | int | position of the word within the passage |
| `expected_word` | text | the word as it appears in `passages.confirmed_text` |
| `asr_transcribed_word` | text | what the CTC model actually heard |
| `asr_model_used` | text | `"wav2vec2-en"` \| `"wav2vec2-tl"` — which of the two always-loaded models processed this word (see `architecture.md` §2) |
| `is_correct` | boolean | |
| `confidence_score` | numeric(5,4) | raw CTC confidence, kept for later analysis/debugging even though it's not directly shown to the student |

> Raw audio for this session is **not** stored anywhere in this schema — see `Rules.md` R-6.

### `comprehension_tests`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `reading_session_id` | uuid, FK → `reading_sessions.id` | one test per session |
| `generated_by_model` | text | e.g. `"yxchia/seallms-v3-7b:Q4_K_M"` — record which model/version generated it, for reproducibility |
| `generated_at` | timestamptz | |

### `comprehension_questions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `comprehension_test_id` | uuid, FK → `comprehension_tests.id` | |
| `question_text` | text | |
| `question_type` | text | `"recall"` \| `"inference"` \| `"application"` (see `Rules.md` R-4 — a test must include all three) |
| `choices` | jsonb | array of option strings, for multiple-choice format |
| `correct_choice_index` | smallint | |
| `order_index` | smallint | display order |

### `comprehension_answers`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `comprehension_question_id` | uuid, FK → `comprehension_questions.id` | |
| `selected_choice_index` | smallint | |
| `is_correct` | boolean | |
| `answered_at` | timestamptz | |

## Indexing Notes

- `students(teacher_id)` — for a teacher listing/managing the student accounts they created.
- `reading_sessions(student_id, started_at)` — for pulling a student's session history in
  chronological order.
- `miscue_tokens(reading_session_id, word_index)` — for reconstructing the highlighted passage view
  in order.
- `passages(student_id, created_at)` — for a student's passage library view.

## Deliberately Not Included (yet)

- **No `vector` columns / pgvector extension.** Add only if a passage-recommendation feature is
  scoped in (see `PRD.md` §6, "Nice-to-have").
- **No per-grade config/difficulty tables.** `grade_level` on `students` records each student's
  grade for reference, but there's no separate grade-banded content-difficulty system in this
  schema — passage difficulty is handled at the passage/session level, not a grade lookup table.
- **No aggregate class-results rollup tables.** Basic teacher account management (creating/listing
  their own students — see `teachers` table above) is now in scope, but class-wide result
  aggregation/reporting is still future work, matching current `PRD.md` scope.
- **No password-reset or session-revocation tables yet.** Forgot-password flow and the ability to
  invalidate an issued session before its JWT expiry are not implemented — see `architecture.md`
  §6 for this and other auth-related gaps stated explicitly as known limitations.
