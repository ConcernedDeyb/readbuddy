# ReadBuddy — Architecture

Companion to `PRD.md` (what/why) and `Schema.md` (data model). This document covers how the
system is built and deployed.

---

## 1. High-Level Component Diagram

```
[ Browser — Next.js (React) ]
        |
        |  (0) Login (teacher / student), role-based route access — see §7
        |  (1) Reading UI, text input/upload, camera capture
        |  (2) Persistent WebSocket: live 16kHz mono 16-bit PCM audio stream
        v
[ Backend — FastAPI (Python), async ]
        |
        |--- (0) Auth: registration, login, session issuance, role guards — see §7
        |
        |--- (a) Text extraction (on input)
        |       |-- EasyOCR              (photographed page -> text)
        |       |-- PyMuPDF              (uploaded PDF -> text)
        |       |-- mammoth              (uploaded .docx -> text)
        |
        |--- (b) Oral reading phase (student reading aloud)
        |       |-- facebook/mms-1b-all — single shared ~1B-param base model, with
        |       |   per-language adapters swapped in for EN (`eng`) and TL (`tgl`)
        |       |   (~1.2-1.9GB VRAM depending on precision — see §3)
        |       |   TL adapter is fine-tuned on google/fleurs (fil_ph) — see §2a
        |       |   Adapter swap is a small-tensor operation (~9MB), not a full model
        |       |   reload — fast enough for code-switched passages without the
        |       |   multi-second reload delay a full second model would need
        |       |-- word-level CTC diff against source passage -> per-word correct/incorrect
        |
        |--- (c) Comprehension test phase (after reading finishes)
        |       |-- ASR models released from VRAM (gc.collect() + torch.cuda.empty_cache())
        |       |-- Ollama: yxchia/seallms-v3-7b:Q4_K_M  (~4.7GB VRAM)
        |       |-- generates recall / inference / application questions from the passage
        |       |-- parses student's answers
        |
        |--- (d) Scoring engine (deterministic, NOT an AI call)
        |       |-- combines word-recognition % (b) + comprehension % (c)
        |       |-- maps to Phil-IRI tier: Frustration / Instructional / Independent
        v
[ Database — PostgreSQL ]
        |-- teacher & student accounts (auth), student profiles, passages, reading sessions,
        |   miscue tokens, quiz results, Phil-IRI tiers
```

## 2. Why Each Technology Was Chosen

### Frontend: Next.js, not Flutter
Flutter was considered for native Android/iOS/tablet deployment, but was rejected: this project
already committed to a **web app** specifically to avoid app-store distribution overhead (Google
Play's $25 fee is minor, but Apple's $99/year recurring fee and App Store review process are not
worth it for a capstone pilot). Next.js gives native WebSocket support (needed for the live audio
stream), server-side rendering, and works on any device with a browser — Android, iOS, laptop —
with a single deployment.

### Backend: FastAPI, not Node.js/Express
All the AI components (EasyOCR, wav2vec2 models, Ollama client) are Python-native. Using FastAPI
for the *entire* backend — not just an isolated AI microservice — avoids running two separate
backend languages. FastAPI's native `async`/WebSocket support is a better fit for streaming audio
than bolting Socket.io onto Express.

### Pronunciation checking: CTC-based `facebook/mms-1b-all`, not Whisper
Whisper (encoder-decoder) has a strong internal language-model prior — it can silently "autocorrect"
a mispronounced word to what it expected to hear, hiding the very errors this feature needs to
catch. CTC-based models predict phonemes/characters directly from audio with no decoder
smoothing, so they report what was actually said. This is standard practice in pronunciation-
assessment research, not just an engineering preference.

**Production model, updated from the original dual-wav2vec2 design:** a single shared
`facebook/mms-1b-all` (~1B-param) CTC base model is loaded once, with per-language adapters
(`eng`, `tgl`) swapped in as needed — not two separate wav2vec2 models (English + Tagalog) held
resident simultaneously, as earlier versions of this document described. The adapter swap is a
small-tensor operation (~9MB), fast enough to handle code-switched passages without the
multi-second reload delay a full second model would need, which was the original reason two full
models were kept loaded at once. `Khalsuu/filipino-wav2vec2-l-xls-r-300m-official` (previously
listed as the primary Tagalog model, with `mms-1b-all` as fallback) is **no longer used** in the
production path.

> **License note:** `facebook/mms-1b-all` is distributed under **CC-BY-NC 4.0** (non-commercial).
> Acceptable for this capstone/pilot context; would need reassessment before any commercial
> deployment.

### 2a. Fine-tuned `mms-1b-all` Tagalog adapter — now the production Tagalog adapter

`facebook/mms-1b-all`'s existing `tgl` adapter was further fine-tuned on `google/fleurs`
(`fil_ph` config, full train/validation splits). Training used Hugging Face `Trainer` with only
the adapter layers unfrozen (~2.26M trainable params; the ~1B-param base model stays frozen),
warm-started from the existing released `tgl` adapter rather than training from scratch.

**Result:** best checkpoint (selected via `load_best_model_at_end` on eval WER, not a fixed
epoch count) achieved **WER 0.1244** on the full 418-sample FLEURS `fil_ph` validation split.
Across four independent training runs (varying epoch count and eval granularity), WER
consistently bottomed out within the first epoch (~step 30) and *increased* monotonically
with further training — the model does not benefit from extended fine-tuning on this dataset,
and the best result is closer to a lightly-adapted checkpoint than a fully re-trained one.

**Status:** this fine-tuned adapter is now the model the backend loads for the `tgl` language
path. Per `Rules.md` R-3, this FLEURS-only result is still **not sufficient evidence on its own**
— it has not yet been benchmarked against real basic-education student recordings, and remains
an open validation item, not a settled result, despite now being the production default.

**VRAM:** ~1.2–1.9GB depending on precision, for the base model plus whichever adapter(s) are
active — see the updated §3 budget table below.

### Comprehension test generation: Gemma 3 4B via Ollama (updated from SeaLLM-v3-7B)
`gemma3:4b` (Q4_K_M) is now the production comprehension-generation model, replacing
`yxchia/seallms-v3-7b:Q4_K_M`. The change was made for VRAM efficiency — roughly 2.5GB vs. 4.7GB
at Q4_K_M, about 45% less — freeing headroom on the 8GB target deployment. It runs through the
same local Ollama setup used throughout this project — no new serving infrastructure needed.

**Trade-off, stated plainly:** SeaLLM-v3-7B was originally chosen specifically for its explicit
Southeast Asian language training. Gemma 3's broader 140+-language coverage includes Tagalog, but
its Tagalog quality *specifically at the 4B size* has not been directly benchmarked in available
literature — strong Filipino-language results exist for larger Gemma 3 variants (27B) and for
region-tuned models, not this checkpoint. Per `Rules.md` R-3, this is treated as an **open
validation item, not an assumed win** — the same rigor already applied to the ASR model above.

> **License note:** Gemma 3 is distributed under Google's Gemma Terms of Use (source-available;
> permits commercial use with acceptable-use restrictions) — less restrictive than mms-1b-all's
> CC-BY-NC 4.0, worth noting since it's a different license family than the ASR model above.

The LLM is used **only** for comprehension question generation and answer parsing — never for
pronunciation scoring (see `Rules.md`, rule R-1) — because its strength (fluent, likely-next-word
prediction) is precisely the weakness we need to avoid in the pronunciation-checking path.

### Database: PostgreSQL, no pgvector (for now)
Every entity in scope (teacher/student accounts, passages, reading sessions, miscue tokens, quiz
results, Phil-IRI tiers) is plain relational data — see `Schema.md`. pgvector is not enabled unless
a similarity-search feature (e.g. "recommend a similar-difficulty passage") is added to scope.

`SQLAlchemy` (async, via `sqlalchemy[asyncio]` + `asyncpg`) is the first ORM/DB-access layer
actually wired into the backend — earlier product routes (`/asr/test`, `/ocr/extract`,
`/ws/reading`) deliberately proved their AI pipelines in isolation first, without DB persistence
(see each route's own docstring). Authentication (§7) is the first feature that requires real,
persistent accounts, so it's also the point at which the DB layer was actually connected.

## 3. VRAM Budget (8GB GPU — RTX 2070 / RTX 3050 Ti class)

Models are **phase-separated**, never all loaded at once:

| Phase | Models loaded | VRAM used | Headroom |
|---|---|---|---|
| Reading (pronunciation check) | `mms-1b-all` base + active adapter(s) (`eng`/`tgl`) | ~1.2–1.9GB | ~6.1–6.8GB free |
| Comprehension test + scoring | Gemma 3 4B (Q4_K_M) | ~2.5GB | ~5.5GB free |
| Idle / text extraction only | EasyOCR (CPU or light GPU) | ~1–2GB | plenty |

Both phases now use meaningfully less VRAM than the original wav2vec2-dual-model + SeaLLM-v3-7B
design (~2.4GB and ~4.7GB respectively) — see the model-choice updates above for the reasoning
and the open validation gaps this change introduces.

VRAM is released between phases with `gc.collect()` and `torch.cuda.empty_cache()` in the FastAPI
process. Ollama handles its own idle-unload automatically. Authentication (§7) runs entirely on
CPU (password hashing, JWT signing) and adds no VRAM cost to this budget.

## 4. Audio Streaming Design

- Format: 16kHz, mono, 16-bit raw PCM
- Transport: persistent WebSocket connection from the browser (Web Audio API) to FastAPI
- Processing: audio is buffered into short overlapping windows (not transcribed as isolated
  fragments) before being passed to the CTC models — naive per-chunk transcription with no
  buffering produces poor results, since even CTC models need some minimum audio context. This is
  the same technique used by the community `Wav2Vec2-Live` project.
- Feedback loop: as each buffered window resolves, the backend pushes a JSON message back over the
  same WebSocket with per-word correct/incorrect status, and the frontend colors words accordingly
  (green = correct, red = mispronounced) with sub-second-to-a-few-seconds latency, not literal
  word-by-word instant correction.
- A rolling RMS check flags several consecutive near-silent windows (mic/hardware disconnect
  signature) with a one-time `{"type": "warning"}` message to the frontend, and skips
  transcription for those windows entirely rather than feeding silence to the model or polluting
  the accuracy log.

**Known limitation, not yet addressed by §7:** the guided-reading WebSocket route currently allows
only one active session at a time, system-wide (a single in-process flag), not one per student.
This predates the account system in this section and will need revisiting — either a per-student
lock or a queue — before multiple students can read concurrently, which real classroom use
requires.

## 5. Deployment Topology

| Stage | Machine | Notes |
|---|---|---|
| Development + pilot | Researcher's personal laptop (i7-9750H, RTX 2070 8GB VRAM, 32GB RAM) | No dedicated server. If the laptop is off or off the WiFi, the app is unavailable — stated as a known limitation, not hidden. |
| Recommended production | SMCC-owned server | Any machine matching or exceeding the 8GB VRAM budget above removes the need for phase-separated model loading — all models could stay resident simultaneously with more VRAM headroom. |

Student devices (phones/tablets/PCs) connect to whichever machine is hosting FastAPI over the local
WiFi network — same mechanism regardless of which machine is currently the host.

## 6. Known Limitations (stated explicitly, not glossed over)

- Single point of failure during pilot (no server redundancy).
- Tagalog ASR accuracy unverified until benchmarked against real student data.
- Only one guided-reading session can be active system-wide at a time (see §4) — a real gap now
  that distinct student accounts exist and multiple students may want to read concurrently.
- **Authentication is now implemented, but not yet production-hardened.** As of this update:
  JWT-based sessions (httpOnly, `SameSite=Lax` cookies — never `localStorage`, to reduce
  XSS exposure for minors' accounts), bcrypt-hashed passwords (`passlib`), and role-based route
  guards on both the FastAPI backend and the Next.js frontend (see §7) are in place. Still
  missing before any real deployment beyond a controlled pilot:
  - No rate-limiting on login/registration endpoints (brute-force/credential-stuffing exposure).
  - No password-reset ("forgot password") flow for either role.
  - No server-side session revocation — an issued JWT remains valid until it expires, even if a
    password is later changed or an account is deactivated.
  - No CSRF defense beyond the cookie's `SameSite=Lax` setting.
  - Cookies are not yet marked `Secure` (HTTPS-only) — acceptable for the current local-network
    pilot topology (§5), not for any deployment reachable over the open internet.

## 7. Authentication, Authorization, and Account Management

### Account Setup & Form Field Standards
- **Teacher Registration**:
  - Fields: Full Name, School ID Number (`202612345`), Institutional Email (`@smccnasipit.edu.ph`), and **2 Password Fields** (Password + Confirm Password).
  - Requires email verification (`email_verified = false`) before first login.
- **Student Account Creation**:
  - Fields: Student Full Name, Student School ID Number (`202612345`), Student Email Address (`@smccnasipit.edu.ph`), **1 Single Password Field** (distinct from teacher registration), Grade Level, Section Name, and Preferred Reading Language (English / Tagalog).
  - Created by teachers or system administrators (`TeacherStudents.tsx` / `StudentRegisterModal.tsx`).

### Profile Details Persistence & Email Verification
- **Profile Updates & Persistence**:
  - Updating Display Name or Email Address in `AccountSettings` (`ProfileTab`) immediately updates local storage (`readbuddy_user` & `readbuddy_accounts`) and dispatches a global `readbuddy_user_updated` window event.
  - Changes persist across page reloads (`F5`), automatically updating dashboard sidebar headers and profile cards.
- **Email Verification Controls**:
  - **Verified State**: Displays an inline green `✓ Verified` badge next to the email field.
  - **Modified / Unverified State**: Editing an email address transitions the badge to an amber **Verify Email** button and displays status guidance below the input field.
  - **Action**: Clicking **Verify Email** triggers a confirmation link notification (`✓ Verification link sent to {email}! Check your inbox to confirm.`).

### Roles and account creation
- **Teacher accounts self-register**: school-issued ID + school email + password. The account is
  created immediately but `email_verified = false`; a verification link is emailed via SMTP, and
  login is rejected until the teacher clicks it (`Rules.md` R-17).
- **Student accounts are created only by an authenticated teacher** — never self-registered
  (`Rules.md` R-16). This is a deliberate UX choice, not just a security one: `design.md` §1's
  principle that a student should never need an adult walking them through the *product* still
  holds, but account creation (something a student would otherwise have to navigate largely
  unsupervised — email, verification links, password rules) is exactly the kind of step better
  handled by the teacher up front. A student's day-to-day login is just a username and password
  their teacher gave them.

### Session mechanism
- On successful login (either role), the backend issues a JWT (`pyjwt`, `HS256`, configurable
  expiry via `settings.jwt_expire_minutes`) containing the user's id and role.
- The token is set as an **httpOnly, `SameSite=Lax` cookie** — deliberately not stored in
  `localStorage`/`sessionStorage` or returned in a JSON body for the frontend to store itself,
  since httpOnly cookies aren't readable by JavaScript and are meaningfully more resistant to
  XSS-based token theft. Given the accounts involved include minors, this was treated as a
  non-negotiable default rather than an optimization.

### Enforcement — both sides, matching `Rules.md` R-13's spirit of clear separation of concerns
- **Backend (FastAPI):** a `require_role(role)` dependency guards routes — e.g. student-account
  creation/listing (`/auth/teacher/students`) is teacher-only; the guided-reading and
  comprehension endpoints are student-only. This is the layer that's actually authoritative —
  the frontend check below is a UX convenience, not the security boundary.
- **Frontend (Next.js):** middleware inspects the session cookie and role before allowing access
  to role-specific routes (a teacher dashboard vs. the student reading-session flow), redirecting
  to the appropriate login page otherwise. This prevents a logged-in student from even seeing a
  teacher-only page render, but is not relied upon for actual access control — see backend above.

### New backend dependencies introduced
- `sqlalchemy[asyncio]` + `asyncpg` — the first real ORM/DB-access layer wired into the backend
  (see §2's database note above).
- `passlib[bcrypt]` — password hashing.
- `pyjwt` — session token issuance/verification.
- Outbound SMTP (plain `smtplib`, configurable host/credentials in `.env`) for teacher email
  verification. This is plain transactional email, not an AI inference call, so it does not
  conflict with `Rules.md` R-2's "no cloud AI APIs" rule — that rule is scoped to AI inference
  (OCR/ASR/LLM), not general infrastructure like sending an email.

## 8. Dashboard Shell & Reading Test Architecture

Added to support multi-role, professional institutional workflows across Students, Teachers, and System Administrators.

### Role-Based Dashboard Shell (`DashboardShell.tsx`)
- Unified shell wrapper serving all three application roles: `student`, `teacher`, and `admin`.
- Role-scoped themes and accent color tokens (`#E8873A` Marigold for Student, `#3D6B8A` Denim for Teacher, `#7A4A6B` Plum for Admin).
- **Navigation Structure**:
  - **Student Dashboard (`/student`)**: My Progress (`overview`), Assigned Tests (`tests`), Reading History (`history`), and Settings (`settings`).
  - **Teacher Dashboard (`/teacher`)**: Overview (`overview`), My Students (`students`), My Passages (`passages`), Reading Tests (`tests`), and Settings (`settings`).
  - **Admin Dashboard (`/admin`)**: Overview (`overview`), Teachers (`teachers`), Students (`students`), Content (`content`), System Settings (`settings`), and My Account (`account`).
- **Clean Aesthetic Rules**: Nav items use subtle background fill transitions (`rgba(251,247,238,0.14)`) without left accent bar lines or raw emojis.

### Reading Test & Phil-IRI Grading Engine (`TeacherTests.tsx` & `/session?testId=...`)
- Allows teachers to convert authored/published passages into formal reading tests.
- Batch assignment engine supporting one-click student selection/deselection.
- Assignment lifecycle management across four states: `All`, `Pending`, `Completed`, and `Graded`.
- **Distinct Assigned Test Flow (`/session?testId=...`)**:
  - Unlike self-directed practice sessions (which use 5 steps: Input -> Review -> Read -> Quiz -> Result), assigned tests bypass text input and extraction review because the passage is pre-confirmed by the teacher.
  - **4-Step Sequence**:
    1. `Briefing`: Teacher instructions, test metadata, passage overview, and "Begin Test" trigger.
    2. `Read Aloud`: Oral reading with real-time ASR feedback.
    3. `Teacher Quiz`: Comprehension questions specifically set by the teacher for this test (whether authored manually or AI-generated & confirmed via `ComprehensionTestEditor.tsx`). Phil-IRI taxonomy categories (Literal, Inferential, Critical) are preserved.
    4. `Submitted`: Submission confirmation, calculated Phil-IRI tier, score breakdown, and direct submission to the teacher's grading queue.
- **Slide-in Grading Detail Panel (`DetailPanel`)**:
  - Displays word recognition % and comprehension % with inline progress bars (`MiniProgressBar`).
  - Auto-calculates Phil-IRI assessment level (Independent / Instructional / Needs Practice).
  - Includes a reference rubric table and teacher grade confirm/override selector.

## 9. Account & Security Settings Architecture (`AccountSettings.tsx`)

Shared component serving all roles with individual sub-navigation tabs:
- **Profile Details**: Display name, email updates, and read-only role/school/grade metadata.
- **Security & Password**: Current password authorization, new password entry with real-time strength evaluation, and matching validation.
- **Notification Preferences**: Email notification toggles and weekly digest preferences.
- **System Settings (`AdminSettings.tsx`)**: Dedicated sub-navigation tabs for AI & ASR Model Configuration (Tagalog fine-tuned adapter WER benchmarks), VRAM Ceiling Limits (8GB GPU budget), and System Maintenance (cache purging).
