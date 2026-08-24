# READBUDDY — MASTER SYSTEM ARCHITECTURE SPECIFICATION & SYSTEM PROMPT

> **System Prompt & Technical Architecture Directive**  
> *Project:* ReadBuddy: AI-Powered Reading Comprehension Assistant for Basic Education Students  
> *Institution:* Saint Michael College of Caraga (SMCC), Nasipit / Butuan City  
> *Target Deployment:* Local Edge Inference (RTX 4070 / 8GB VRAM Constraint)  
> *Primary Standards:* Philippine Informal Reading Inventory (Phil-IRI) & DepEd Basic Education Curriculum  

---

## 1. System Identity & Mission

**ReadBuddy** is a privacy-first, locally deployed AI-powered reading assessment and comprehension platform built for basic education students (Grades 1–12) at Saint Michael College of Caraga (SMCC). The platform enables learners to read passages aloud independently, receive near-live acoustic miscue feedback without teacher intervention, complete auto-generated multi-tiered comprehension assessments, and obtain an authentic Phil-IRI reading tier diagnosis (*Independent*, *Instructional*, or *Frustration*).

```
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                            READBUDDY CLIENT                             │
   │           Next.js 14 (React) · Web Audio API · WebSocket Client          │
   └────────────────────────────────────┬────────────────────────────────────┘
                                        │ (1) 16kHz PCM Audio Stream
                                        │ (2) REST API & Session Handshakes
                                        ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                         FASTAPI ASYNC BACKEND                           │
   │   RBAC Auth · Audio Buffer Pipeline · CTC Scoring · Phil-IRI Engine     │
   └───────────┬────────────────────────┬────────────────────────┬───────────┘
               │ (Phase 1)              │ (Phase 2)              │
               ▼                        ▼                        ▼
     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
     │   ASR PIPELINE   │     │   LLM PIPELINE   │     │  DATABASE LAYER  │
     │  facebook/mms-   │     │   Gemma 3 4B     │     │    PostgreSQL    │
     │     1b-all       │     │   (Q4_K_M via    │     │  SQLAlchemy 2.0  │
     │ + eng/tgl Adapter│     │     Ollama)      │     │     asyncpg      │
     │   (~1.4GB VRAM)  │     │   (~2.5GB VRAM)  │     │   (Relational)   │
     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## 2. Core Technology Stack

| Architectural Layer | Chosen Technology | Engineering Rationale & Constraints |
|---|---|---|
| **Web Frontend** | Next.js 14 (App Router, React, CSS Modules) | Zero app-store distribution friction; native Web Audio API & persistent WebSocket support across laptops, tablets, and mobile devices. |
| **Backend Framework** | FastAPI (Python 3.11+, AsyncIO, WebSockets) | Unified Python runtime for AI pipelines (ASR, LLM, OCR) eliminating multi-language IPC overhead. |
| **Speech Recognition (ASR)** | `facebook/mms-1b-all` (CTC Base + Language Adapters) | **CTC-based acoustic scoring (Not Whisper).** Whisper's decoder auto-corrects student miscues; CTC maps raw phonemes directly. |
| **Tagalog Adaptation** | Fine-tuned `tgl` Adapter on `google/fleurs (fil_ph)` | Parameter-efficient adapter fine-tuning (~2.26M trainable params). Fast ~9MB tensor hot-swap for code-switched passages. |
| **Comprehension Engine** | `gemma3:4b` (Q4_K_M) via Ollama | Local edge inference for generating recall, inferential, and applied questions (~2.5GB VRAM footprint). |
| **Document/OCR Engine** | EasyOCR, PyMuPDF, Mammoth (.docx) | Client/Server text extraction from photographed book pages, PDFs, and Word documents with teacher human-in-the-loop review. |
| **Database & ORM** | PostgreSQL 16 + SQLAlchemy 2.0 (asyncpg) | Fully relational persistence for accounts, class rosters, passages, miscue tokens, session logs, and Phil-IRI ratings. |
| **Authentication** | Unified RBAC, JWT in httpOnly Cookies, bcrypt | Single sign-in portal routing dynamically to Admin, Teacher, and Student portals; strict minor data security. |

---

## 3. VRAM Budget & Sequential Phase Architecture (8GB GPU Constraint)

ReadBuddy is engineered to execute fully on local edge workstations (e.g., NVIDIA RTX 4070 with 8GB VRAM). Models are **phase-separated** and never co-loaded in GPU memory.

```
       [ Phase 1: Oral Reading ] ─────────► [ Transition ] ─────────► [ Phase 2: Comprehension ]
     • MMS-1B Base + Adapter Loaded       • gc.collect()             • Ollama loads Gemma 3 4B
     • Real-time CTC Audio Diffing        • torch.cuda.empty_cache() • Multi-level Question Gen
     • VRAM Footprint: ~1.2 – 1.9 GB      • VRAM Released            • VRAM Footprint: ~2.5 GB
```

| Operating Phase | Resident AI Models | Peak VRAM Footprint | Available GPU Headroom |
|---|---|---|---|
| **Phase 1: Oral Reading** | `facebook/mms-1b-all` + `eng`/`tgl` adapter | **1.2 – 1.9 GB** | ~6.1 – 6.8 GB Free |
| **Transition Hook** | In-flight tensors collected (`gc.collect()`, `cuda.empty_cache()`) | **< 0.3 GB** | ~7.7 GB Free |
| **Phase 2: Comprehension** | `gemma3:4b` (Q4_K_M) via Ollama | **~2.5 GB** | ~5.5 GB Free |
| **Idle / Text Extraction** | EasyOCR (CPU or transient GPU) | **1.0 – 2.0 GB** | ~6.0 GB Free |

---

## 4. End-to-End AI Pipelines

### A. Oral Reading & Acoustic Miscue Engine
1. **Audio Ingestion**: Client captures 16kHz mono 16-bit raw PCM audio via Web Audio API, streaming chunked packets over a dedicated WebSocket (`/api/ws/reading`).
2. **Rolling Acoustic Buffering**: Audio is structured into overlapping windows to preserve phonetic context (matching `Wav2Vec2-Live` methodology).
3. **CTC Token Alignment**: Acoustic logits are mapped directly against canonical passage tokens using dynamic programming (Needleman-Wunsch / Levenshtein alignment).
4. **Miscue Taxonomy**: Detects and logs authentic reading miscues:
   - **Omission**: Expected token missed in utterance stream.
   - **Insertion**: Extraneous token spoken by learner.
   - **Substitution**: Mispronounced or replaced word.
   - **Repetition / Hesitation**: Repeated token or significant acoustic pause.
   - **Reversal**: Spoken word order inverted.
5. **Real-Time Client Feedback**: WebSocket pushes sub-second JSON status payloads back to the client to render visual color highlights (Green = accurate, Orange = mispronounced, Gray = pending).

### B. Automated Comprehension Engine (Bloom's Taxonomy)
1. **Context Formulation**: Following oral reading, the passage text and student miscue summary are fed into `gemma3:4b`.
2. **Tiered Question Generation**: Generates 3 mandatory question levels:
   - **Literal / Recall**: Explicit facts, characters, and direct chronology.
   - **Inferential**: Cause-and-effect, character motivation, and implicit themes.
   - **Applied / Critical**: Evaluative real-world judgment and personal application.
3. **Deterministic Scoring Engine**: Answers are evaluated deterministically against rubric answer keys, computing exact percentage comprehension scores.

### C. Phil-IRI Diagnostic Matrix
Overall reading performance is diagnosed by mapping word recognition and comprehension percentages to DepEd Phil-IRI criteria:

$$\text{Word Recognition \%} = \left( \frac{\text{Total Words} - \text{Total Miscues}}{\text{Total Words}} \right) \times 100$$

$$\text{Comprehension \%} = \left( \frac{\text{Correct Comprehension Answers}}{\text{Total Questions}} \right) \times 100$$

| Phil-IRI Tier | Word Recognition Accuracy | Comprehension Accuracy |
|:---|:---:|:---:|
| **Independent** | $97\% - 100\%$ | $80\% - 100\%$ |
| **Instructional** | $90\% - 96\%$ | $59\% - 79\%$ |
| **Frustration** | $< 90\%$ | $< 59\%$ |

> **Diagnostic Rule:** The final overall Phil-IRI level is assigned to the **lower** of the two individual tiers (e.g., Independent Recognition + Instructional Comprehension = **Instructional Level**).

---

## 5. Security, RBAC & Institutional Domain Architecture

### A. Role-Agnostic Single Sign-In
- **Unified Landing Page (`/`)**: A single input form accepting **School ID Number** and **Password**.
- **Server-Side RBAC Routing**: The backend dynamically inspects administrator, educator, and student records, setting an `httpOnly`, `SameSite=Lax` session cookie and routing to:
  - `/admin` $\rightarrow$ System Administrator (`readbuddyadmin`)
  - `/teacher` $\rightarrow$ Faculty & Educators
  - `/student` $\rightarrow$ Basic Education Learners

### B. Institutional Email Domain Hierarchy
- **Administrators & Faculty**: Domain restricted to `@smccnasipit.edu.ph`.
- **Students (Learners)**: Structured institutional domain formatted as:
  $$\text{Email} = \texttt{[firstname.lastname]@student.smccnasipit.edu.ph}$$
- **Minor Data Protection**: Zero raw voice recordings are retained on disk after transcription. Passwords use salted bcrypt hashes (`passlib`). Authentication tokens are inaccessible via client-side JavaScript (`httpOnly`).

---

## 6. Relational Database Schema Graph

```
┌─────────────────────────┐
│        TEACHERS         │
├─────────────────────────┤       ┌─────────────────────────┐
│ id (UUID, PK)           │───┐   │         CLASSES         │
│ school_id (Unique)      │   │   ├─────────────────────────┤
│ display_name            │   └──►│ id (UUID, PK)           │
│ email (@smccnasipit...) │       │ teacher_id (FK)         │
│ password_hash (bcrypt)  │       │ name, grade_level       │
│ admin_approved (Bool)   │       └───────────┬─────────────┘
│ email_verified (Bool)   │                   │
└─────────────────────────┘                   │
                                              ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│        STUDENTS         │       │        PASSAGES         │
├─────────────────────────┤       ├─────────────────────────┤
│ id (UUID, PK)           │◄──────│ id (UUID, PK)           │
│ school_id (Unique)      │       │ teacher_id (FK)         │
│ username (Unique)       │       │ title, content, language│
│ email (@student.smcc...)│       │ word_count, grade_level │
│ password_hash (bcrypt)  │       │ is_published (Bool)     │
│ class_id (FK)           │       └───────────┬─────────────┘
│ grade_level (1-12)      │                   │
│ preferred_lang ('en'/'tl│                   │
└───────────┬─────────────┘                   │
            │                                 │
            ▼                                 ▼
┌───────────────────────────────────────────────────────────┐
│                     READING_SESSIONS                      │
├───────────────────────────────────────────────────────────┤
│ id (UUID, PK) · student_id (FK) · passage_id (FK)         │
│ total_words · total_miscues · word_accuracy_score         │
│ comprehension_score · phil_iri_tier · completed_at        │
└───────────┬─────────────────────────────────┬─────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│      MISCUE_TOKENS      │       │   COMPREHENSION_TESTS   │
├─────────────────────────┤       ├─────────────────────────┤
│ id (UUID, PK)           │       │ id (UUID, PK)           │
│ session_id (FK)         │       │ session_id (FK)         │
│ token_index, word       │       │ questions (JSONB)       │
│ miscue_type (O/I/S/R/M) │       │ answers, final_score    │
└─────────────────────────┘       └─────────────────────────┘
```

---

## 7. Administrative & Audit Capabilities

1. **Faculty Management (CRUD)**:
   - Add, edit, approve, revoke, or permanently delete educator records.
   - One-click approval flow for institutional faculty registration requests.
2. **Student & Classroom Roster (CRUD)**:
   - Add, modify, grade-assign, unassign, or delete student accounts.
   - Automatic format enforcement for `@student.smccnasipit.edu.ph`.
3. **Audit Trails & Security Logs**:
   - Comprehensive audit logging of authentication events (`SUCCESS`, `FAILED`, `APPROVED`, `PASSWORD_RESET`), IP origins, and user agents.
   - Live activity stream capturing reading session completions, passage publishing, and test grading with exact ISO timestamps.
4. **Institutional Single Sign-On (SSO)**:
   - Integrated Google Workspace OAuth 2.0 configuration with `@smccnasipit.edu.ph` domain locking.
   - Microsoft 365 / Entra ID SAML 2.0 enterprise identity compatibility.
5. **Roster Exporting**:
   - One-click CSV export generating standard compliant datasets (`smcc_teachers_roster_*.csv` and `smcc_students_roster_*.csv`).
   - Clean tabular browser print stylesheet support.

---

## 8. Master System Prompt for Coding & Architectural Extension

```text
You are an expert full-stack AI system architect working on ReadBuddy — an AI-powered reading comprehension assistant for basic education students (Grades 1-12) at Saint Michael College of Caraga (SMCC).

When generating, modifying, or refactoring code in this repository, you MUST strictly adhere to the following architectural laws:

1. LOCAL-ONLY EDGE INFERENCE: All AI inference (ASR, LLM, OCR) must run locally on the edge target (RTX 4070 8GB VRAM). Never make external cloud API calls for inference.
2. CTC ACOUSTIC SCORING ONLY (NO WHISPER): Speech scoring must use CTC-based models (facebook/mms-1b-all + per-language adapters). Never use LLMs or Whisper decoder models for pronunciation evaluation to avoid decoder auto-correction bias.
3. PHASE-SEPARATED VRAM BUDGET: Never load ASR (MMS-1B) and LLM (Gemma 3 4B) models simultaneously in GPU memory. Tensors must be cleared with gc.collect() and torch.cuda.empty_cache() between reading and comprehension phases.
4. PHIL-IRI SCORING INTEGRITY: Word recognition and comprehension percentages must strictly follow the DepEd Phil-IRI criteria (Independent >=97%/80%, Instructional 90-96%/59-79%, Frustration <90%/<59%). The overall tier is always the lower of the two.
5. RBAC & IDENTIFIER CONVENTIONS:
   - Admin account identifier is 'readbuddyadmin'.
   - Faculty emails belong to '@smccnasipit.edu.ph'.
   - Student emails must strictly follow '[firstname.lastname]@student.smccnasipit.edu.ph' (never [school_id]@smccnasipit.edu.ph).
   - Sign-in UI accepts School ID Number and routes dynamically without role switcher toggles.
6. DATA PRIVACY FOR MINORS: Audio streams are processed in-memory and discarded immediately after transcription. Passwords must be hashed with bcrypt. Session tokens must be stored exclusively in httpOnly cookies.
7. ANTI-SLOP VISUAL DESIGN: UI must adhere to SMCC palette tokens (Chalkboard Green #1F4D3A, Warm Ochre #E8873A, Cream #FBF6EB). Never render raw unicode emojis or flag icons in production components; always use clean SVG vector icons.
```
