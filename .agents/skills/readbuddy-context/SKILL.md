---
name: ReadBuddy Project Context
description: >
  Complete architectural, design, product, rules, and schema context for the
  ReadBuddy capstone project — an AI-powered reading comprehension assistant
  for basic education students at SMCC, Butuan City. Automatically loaded
  when working in this workspace to ensure all code changes respect the
  project's tech stack, constraints, UX principles, and data model.
---

# ReadBuddy — Project Context

> **Source of truth:** The 5 files in `Complete Architectural Context/` (architecture.md,
> design.md, PRD.md, Rules.md, Schema.md). If anything below conflicts with those files,
> the originals win — re-read them.

---

## 1. What ReadBuddy Is

An AI-powered web app that lets basic education students (K–12, not remedial-only) at
SMCC independently practice reading a passage aloud, get near-live pronunciation feedback,
take an auto-generated comprehension test, and receive a Phil-IRI rubric score
(Independent / Instructional / Frustration).

**Full title:** ReadBuddy: An AI-Powered Reading Comprehension Assistant for Basic Education Students

---

## 2. Tech Stack

| Layer | Technology | Key Notes |
|---|---|---|
| **Frontend** | Next.js (React) | Web app only — no Flutter, no native app. WebSocket for live audio. |
| **Backend** | FastAPI (Python, async) | Single backend language — all AI components are Python-native. |
| **ASR** | `facebook/mms-1b-all` (CTC) | Single ~1B-param base model + per-language adapters (`eng`, `tgl`). **Not Whisper** — CTC avoids decoder "autocorrect" bias. License: CC-BY-NC 4.0 (non-commercial). |
| **Tagalog adapter** | Fine-tuned `tgl` adapter (FLEURS fil_ph) | WER 0.1244 on FLEURS validation. **Not yet validated on real student recordings** (Rules R-3). |
| **Comprehension LLM** | `gemma3:4b` (Q4_K_M) via Ollama | Replaced SeaLLM-v3-7B for VRAM (~2.5GB vs ~4.7GB). Tagalog quality at 4B size **not yet benchmarked** (Rules R-3). |
| **OCR** | EasyOCR | Photo → text extraction. |
| **Document parsing** | PyMuPDF (PDF), mammoth (.docx) | |
| **Database** | PostgreSQL (no pgvector) | SQLAlchemy async + asyncpg. |
| **Auth** | JWT (httpOnly cookies, SameSite=Lax), bcrypt (passlib), pyjwt | |
| **Email** | Plain SMTP (smtplib) | Teacher email verification only. |

---

## 3. VRAM Budget (8GB GPU target)

Models are **phase-separated, never all loaded at once** (Rules R-5):

| Phase | Model | VRAM |
|---|---|---|
| Reading (pronunciation) | mms-1b-all + adapter | ~1.2–1.9GB |
| Comprehension test | Gemma 3 4B (Q4_K_M) | ~2.5GB |
| Idle / text extraction | EasyOCR (CPU/light GPU) | ~1–2GB |

Release between phases: `gc.collect()` + `torch.cuda.empty_cache()`. Ollama handles its own idle-unload.

---

## 4. Binding Rules (R-1 through R-17)

Always respect these — reference by number when relevant:

### AI / Model Usage
- **R-1:** LLM is NEVER used for pronunciation scoring (CTC models only).
- **R-2:** No cloud AI APIs — all inference runs locally (privacy for minors' voice data). Plain SMTP is allowed.
- **R-3:** No unverified model cited as final without benchmark on real target-population data.
- **R-4:** Comprehension questions must span recall + inference + application levels.
- **R-5:** One heavy VRAM phase at a time (see §3 above).

### Data / Privacy
- **R-6:** Raw audio deleted after transcription — only derived text/scores stored.
- **R-7:** Extracted text always gets a human review step before scoring.
- **R-8:** No bare score without a next-step action on the result screen.

### Language / Framing
- **R-9:** Never use "remedial" in UI, product framing, or target-user definition.
- **R-10:** Scope is basic education (K–12), not a single grade. Don't let "Grade 7 only" creep back.

### Engineering
- **R-11:** Document all AI model choices + VRAM in architecture.md when changed.
- **R-12:** Manually verify all citations before reuse — fabricated citations have been caught before.
- **R-13:** Sequential model loading is backend-only concern; frontend never knows about VRAM state.

### Authentication & Access
- **R-14:** Passwords are NEVER stored in plaintext — bcrypt hash only.
- **R-15:** JWT in httpOnly cookies ONLY — never localStorage/sessionStorage. Non-negotiable for minors.
- **R-16:** Students do NOT self-register — only teachers create student accounts.
- **R-17:** Teachers must verify email before first login.

### Design & Visual Standards
- **R-18:** No raw unicode emojis or country flag icons in production UI components. Languages labeled explicitly as "English" and "Tagalog".
- **R-19:** Anti-Slop UI & Settings Sub-Navbars — active sidebar items rely on subtle background fill without left border lines. Settings sections use dedicated pill sub-navbars.
- **R-20:** Student Account Creation vs Teacher Registration Form Constraints — Student creation forms mirror teacher registration fields (Full Name, School ID Number `202612345`, Email Address `@smccnasipit.edu.ph`, Grade Level, Section Name, Preferred Language). Teachers input **2 password fields** (Password + Confirm Password) for registration, while student creation uses **1 single password field**.
- **R-21:** Profile Email Persistence & Verification Controls — Profile updates (name, email) persist to `localStorage` (`readbuddy_user`, `readbuddy_accounts`) and dispatch global window events (`readbuddy_user_updated`). Email inputs feature inline verification badges (`✓ Verified` / `Verify Email`) and status guidance.

---

## 5. User Flow & Screen Map

```
Admin Login → Admin Dashboard (/admin)
               ├─ Overview (Telemetry, VRAM monitor: RTX 2070 8GB GDDR6)
               ├─ Teachers & Students (Account management & approvals)
               ├─ Content (Platform passage audit)
               ├─ System Settings (ASR & LLM configurations, VRAM ceiling)
               └─ My Account

Teacher Register → Email Verification → Admin Approval → Teacher Dashboard (/teacher)
                                                          ├─ Overview (Class metrics & active assignments)
                                                          ├─ My Students (Roster management & student creation)
                                                          ├─ Classes (Section codes & grade levels)
                                                          ├─ My Passages (Passage authoring & publishing)
                                                          ├─ Reading Tests (Batch assignment & Phil-IRI grading)
                                                          └─ Settings (Profile & notification preferences)

Student Login → Student Dashboard (/student)
                 ├─ My Progress (trend charts, Phil-IRI level badge, recent sessions)
                 ├─ Assigned Tests (view teacher notes & launch assigned test flow)
                 ├─ Reading History (full session logs)
                 ├─ Settings (language preferences, speed, account info)
                 └─ New Reading Session (Self-directed: Step 1 -> Step 5)
```

### Key UX Principles
- Student is the primary user — every reading-session screen usable without an adult.
- Feedback feels encouraging, not punitive. Avoid harsh red; use amber/orange for mispronounced words.
- No dead ends — every result screen has a concrete next action.
- Error copy on student screens is simple and non-technical.
- Anti-slop visual standards — no raw emojis, no country flags, clean SVG icons, sub-navbars in settings.

---

## 6. Phil-IRI Rubric

| Level | Word Recognition | Comprehension |
|---|---|---|
| Independent | 97–100% | 80–100% |
| Instructional | 90–96% | 59–79% |
| Frustration | below 90% | below 59% |

Overall level = the **lower** of the two tiers.

---

## 7. Database Schema (PostgreSQL)

12 tables:

```
admins
admin_settings
teachers ──< classes ──< students ──< reading_sessions >── passages
   │                       │                │                  │
   │                       │                ├──< miscue_tokens ├──< test_assignments
   │                       │                └──< comp_answers  └──< comp_tests ──< comp_questions
   └───────────────────────┴───────────────────────────────────────┘
```

### Key table details:
- **admins**: id, display_name, username (unique), email (unique), password_hash, role ('admin'), created_at
- **teachers**: id, display_name, school_id (unique, login identifier), email (unique, verified), password_hash, role ('teacher'), admin_approved, email_verified, email_verification_token, password_reset_token, password_reset_expires_at, created_at
- **classes**: id, teacher_id (FK), name (e.g. "Section St. Jude"), grade_level (1-12), class_code (unique, e.g. "SMCC-G7-STJUDE"), created_at
- **students**: id, display_name, school_id (unique), username (unique), email, password_hash, role ('student'), teacher_id (FK), class_id (FK), section_name, grade_level (0–12), preferred_language ("en"/"tl"), password_reset_token, password_reset_expires_at, created_at
- **passages**: id, teacher_id (FK), student_id (FK), title, source_type ("typed"/"photo_ocr"/"document_upload"), source_language ("en"/"tl"), raw_extracted_text, confirmed_text, word_count, is_published, created_at
- **reading_sessions**: id, student_id, passage_id, passage_preview, source_language, started_at, finished_reading_at, word_recognition_score, comprehension_score, phil_iri_level, guidance_message, completed_at, created_at
- **miscue_tokens**: id, reading_session_id, word_index, expected_word, asr_transcribed_word, asr_model_used, is_correct, confidence_score
- **comprehension_tests**: id, passage_id, reading_session_id, generated_by_model, created_at
- **comprehension_questions**: id, test_id, question_text, question_type (recall/inference/application), choices (jsonb/text), correct_choice_index, order_index
- **comprehension_answers**: id, reading_session_id, question_id, selected_choice_index, is_correct, answered_at
- **test_assignments**: id, passage_id (FK), teacher_id (FK), student_id (FK), status ('pending'/'completed'/'graded'), word_recognition_score, comprehension_score, phil_iri_level, teacher_remarks, audio_recording_url, assigned_at, completed_at, graded_at
- **admin_settings**: id ('default'), asr_device ('cuda'/'cpu'), vram_budget_mb (8192), active_asr_model, active_llm_model, updated_at

### Indexes
- `students(school_id)`, `teachers(school_id)`, `students(teacher_id, class_id)`, `reading_sessions(student_id, completed_at DESC)`, `miscue_tokens(reading_session_id, word_index ASC)`, `test_assignments(teacher_id, status)`, `passages(teacher_id, created_at DESC)`

### Deliberately NOT included (yet)
- No pgvector / vector columns (relational only)
- No per-grade difficulty tables
- No aggregate class-results rollup tables

---

## 8. Audio Streaming Design

- Format: 16kHz, mono, 16-bit raw PCM
- Transport: persistent WebSocket (Web Audio API → FastAPI)
- Processing: buffered overlapping windows (not isolated fragments)
- Feedback: JSON over same WebSocket with per-word correct/incorrect, sub-second-to-few-seconds latency
- Rolling RMS silence detection → warning message, skips transcription for silent windows

---

## 9. Known Limitations & Open Items

- Single guided-reading session system-wide at a time (needs per-student lock for concurrent use)
- Single-device deployment during pilot (researcher's laptop)
- Auth not production-hardened: no rate-limiting, no password reset, no session revocation, no CSRF beyond SameSite=Lax, no Secure cookie flag
- Both production models (ASR adapter + Gemma 3 4B) unverified on real target-population data

---

## 10. Reference Files

When in doubt, re-read the originals:
- `Complete Architectural Context/architecture.md` — system design, VRAM, deployment, auth mechanism
- `Complete Architectural Context/design.md` — UX flow, screens, tone, responsive notes
- `Complete Architectural Context/PRD.md` — problem, goals, non-goals, features, metrics
- `Complete Architectural Context/Rules.md` — all 17 binding constraints
- `Complete Architectural Context/Schema.md` — PostgreSQL tables, indexes, exclusions
