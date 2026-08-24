# READBUDDY — COMPLETE SYSTEM ARCHITECTURE BLUEPRINT
### An AI-Powered Reading Comprehension Assistant with Phil-IRI Diagnostic Assessment for Basic Education Students

```
========================================================================================================================
                                                  SYSTEM ARCHITECTURE
        ReadBuddy: An AI-Powered Reading Comprehension Assistant with Phil-IRI Diagnostic Assessment
                                   Saint Michael College of Caraga (SMCC)
========================================================================================================================

┌─────────────────────────────────┐           ┌─────────────────────────────┐           ┌──────────────────────────────┐
│         CLIENT / USERS          │           │    LOCAL STORAGE & DB       │           │      ACTIONABLE INSIGHTS     │
├─────────────────────────────────┤           ├─────────────────────────────┤           ├──────────────────────────────┤
│ 👨‍🎓 STUDENTS (Learners)          │◄─────────►│ 🗄️ PostgreSQL 16 Database    │◄─────────►│ 📊 Phil-IRI Reading Tiers    │
│  • Oral Reading Practice        │           │  • Encrypted Credentials     │           │    (Independent/Inst./Frust.)│
│  • Real-Time Color Feedback     │           │  • Relational Schema         │           │ 📈 Word Accuracy & Comp Rate │
│  • Bloom's Taxonomy Quizzes     │           │  • Miscue Token Records      │           │ 🎯 Miscue Breakdown (O/I/S/R)│
│  • Phil-IRI Progress Badges     │           │  • Zero Voice Cloud Storage  │           │ ⏱️ Reading Speed (WPM)       │
│                                 │           └──────────────┬──────────────┘           │ 🏆 Class & Grade Analytics   │
│ 👩‍🏫 TEACHERS / FACULTY          │                          │                          │ 📄 Downloadable PDF Reports  │
│  • Upload Passages (OCR/Docx)   │                          │                          │ 🖨️ CSV & Printable Rosters  │
│  • Assign Reading Assessments   │                          ▼                          └──────────────▲───────────────┘
│  • Monitor Class Miscues & IRI  │           ┌─────────────────────────────┐                          │
│  • Export CSV Student Rosters   │           │ 1. CLIENT & AUDIO INGESTION │                          │
│                                 │           ├─────────────────────────────┤                          │
│ 👨‍💼 ADMIN / STAFF              │           │ 🌐 Next.js 14 Web Client    │                          │
│  • Approve / Revoke Teachers    │──────────►│  • Web Audio API (16kHz PCM)│                          │
│  • Unified Single Sign-In (ID)  │           │  • Persistent WebSockets    │                          │
│  • Authentication & Audit Logs  │           │  • Universal School ID Login│                          │
│  • SSO (Google/Microsoft SAML)  │           │  • Color-Coded Live Display │                          │
│                                 │           └──────────────┬──────────────┘                          │
│ 🏫 INSTITUTIONAL INPUTS         │                          │                                         │
│  • Book Page Photos (Camera)    │                          │ (16kHz 16-bit Mono PCM Stream)          │
│  • DepEd Phil-IRI Passages      │                          ▼                                         │
│  • School ID Cards (202612345)  │           ┌─────────────────────────────┐           ┌──────────────┴───────────────┐
└─────────────────────────────────┘           │ 2. FASTAPI GATEWAY & RBAC   │           │     NOTIFICATION SERVICE     │
                                              ├─────────────────────────────┤           ├──────────────────────────────┤
                                              │ 🛡️ FastAPI Async Gateway     │──────────►│ ✉️ Teacher Email Verification│
                                              │  • RBAC Dispatcher          │(Alert/Log)│ 🔔 Admin Account Approvals   │
                                              │  • JWT httpOnly Cookies     │           │ 📢 Reading Test Assignments  │
                                              │  • bcrypt Password Hashing  │           │ ⚠️ Mic/Silence Disconnect Warn│
                                              │  • Minor Privacy Guard      │           └──────────────▲───────────────┘
                                              └──────────────┬──────────────┘                          │
                                                             │                                         │
                                                             ▼                                         │
                                              ┌─────────────────────────────┐           ┌──────────────┴───────────────┐
                                              │ 3. AUDIO BUFFER & CTC ALIGN │           │        LOGGING SYSTEM        │
                                              ├─────────────────────────────┤           ├──────────────────────────────┤
                                              │ 🎙️ Rolling Acoustic Buffer  │           │ 📋 Authentication Audit Logs │
                                              │  • Overlapping Sliding Window│──────────►│ 🕒 Live Activity Stream (ISO)│
                                              │  • RMS Silence Detection    │           │ 📊 Miscue Token Detail Logs  │
                                              │  • Phonetic CTC Logit Match │           │ 🔒 SSO Security Audit Trail  │
                                              └──────────────┬──────────────┘           └──────────────▲───────────────┘
                                                             │                                         │
                                                             ▼                                         │
┌──────────────────────────────────────────────────────────────────────────────────────────┐           │
│ 4. LOCAL AI INFERENCE ENGINE (Phase-Separated Sequential 8GB VRAM Architecture)          │           │
├─────────────────────────────────────────────┬────────────────────────────────────────────┤           │
│ PHASE 1: ORAL READING & MISCUE ASR          │ PHASE 2: COMPREHENSION GENERATION (LLM)    │           │
│  🤖 facebook/mms-1b-all (CTC Base Model)    │  🧠 Gemma 3 4B (Q4_K_M via Ollama)         │           │
│  🔄 Hot-Swappable Language Adapters:        │  📝 Bloom's Taxonomy Multi-Level Questions:│           │
│     • English Adapter (eng)                 │     • Literal / Recall Questions           │           │
│     • Fine-Tuned Tagalog Adapter (FLEURS tgl)│    • Inferential & Context Questions      │           │
│  🔍 Word-Level CTC Acoustic Diffing         │     • Applied / Critical Real-World Quizzes│           │
│  🎯 Miscue Detection:                       │  🎯 Deterministic Answer Parsing & Grading │           │
│     [Omission, Insertion, Substitution,     │  💾 VRAM Footprint: ~2.5 GB                │           │
│      Repetition, Mispronunciation, Reversal]│                                            │           │
│  💾 VRAM Footprint: ~1.2 – 1.9 GB           │ ────────────────────────────────────────── │           │
│ ─────────────────────────────────────────── │ OPTIONAL: OCR & TEXT EXTRACTION PIPELINE   │           │
│ 🧹 GPU TRANSITION HOOK:                     │  📷 EasyOCR (Book Photos)                  │           │
│  • gc.collect() + torch.cuda.empty_cache()  │  📑 PyMuPDF (PDFs) + Mammoth (.docx)       │           │
│  • Releases VRAM before Phase 2 (<0.3GB)    │  👤 Human-in-the-Loop Teacher Review Step  │           │
└─────────────────────────────────────────────┴────────────────────────────────────────────┘           │
                                                             │                                         │
                                                             ▼                                         │
                                              ┌─────────────────────────────┐                          │
                                              │   DECISION & SCORING ENGINE │                          │
                                              ├─────────────────────────────┤                          │
                                              │ ⚖️ Phil-IRI Diagnostic Matrix│                          │
                                              │  • Word Recognition %       │                          │
                                              │  • Comprehension %          │                          │
                                              │  • Lowest Tier Selection    │                          │
                                              └──────────────┬──────────────┘                          │
                                                             │                                         │
                 ┌───────────────────────────────────────────┼─────────────────────────────────────────┘
                 ▼                                           ▼                                         ▼
   ┌───────────────────────────┐               ┌───────────────────────────┐             ┌───────────────────────────┐
   │        INDEPENDENT        │               │       INSTRUCTIONAL       │             │        FRUSTRATION        │
   │  Word Accuracy: 97–100%   │               │   Word Accuracy: 90–96%   │             │   Word Accuracy: < 90%    │
   │  Comprehension: 80–100%   │               │   Comprehension: 59–79%   │             │   Comprehension: < 59%    │
   │  Status: Fluent Reader    │               │   Status: Guided Practice │             │   Status: Needs Help      │
   └───────────────────────────┘               └───────────────────────────┘             └───────────────────────────┘
```

---

## Complete Layer-by-Layer Architecture Breakdown

### 1. Client / User Layer
- **Students (Learners)**:
  - Access oral reading modules using institutional School ID.
  - Receive real-time visual phonetic highlighting (green/amber) without teacher supervision.
  - Complete multi-tiered comprehension quizzes and track historical Phil-IRI progress badges.
- **Teachers / Faculty**:
  - Convert book images, PDFs, and Word documents into interactive passages via OCR.
  - Assign standardized reading tests to whole sections or individual learners.
  - Analyze student miscue patterns (e.g., frequent substitutions or omissions) and Phil-IRI diagnostic tiers.
- **Administrators / Staff**:
  - Institutional governance: approve/revoke faculty accounts, manage student profiles.
  - Monitor authentication security logs, live activity timestamps, and institutional SSO.
  - Generate and print comprehensive CSV rosters (`smcc_teachers_roster_*.csv`, `smcc_students_roster_*.csv`).

---

### 2. Client Application & Ingestion Layer (`Next.js 14 App Router`)
- **Web Audio Ingestion**: Captures microphone input at 16kHz 16-bit mono PCM via Web Audio API.
- **Persistent WebSocket Transport**: Full-duplex WebSocket connection streaming chunked audio packets directly to FastAPI.
- **Universal Sign-In Portal**: Single, role-agnostic input form on `/` accepting **School ID Number** with automatic server-side RBAC dispatch.

---

### 3. FastAPI Gateway & RBAC Security Layer
- **AsyncIO & High Concurrency**: Python 3.11+ async gateway coordinating WebSockets, REST endpoints, and ML inference.
- **Security & Privacy for Minors**:
  - JWT tokens stored strictly in `httpOnly`, `SameSite=Lax` cookies.
  - Passwords hashed with salted `bcrypt`.
  - **Zero Voice Retention**: Raw audio chunks are processed in-memory and permanently discarded immediately after acoustic alignment.
- **Institutional Domain Routing**:
  - Faculty & Admin: `@smccnasipit.edu.ph`
  - Students: `[firstname.lastname]@student.smccnasipit.edu.ph`

---

### 4. Audio Buffering & CTC Acoustic Alignment Module
- **Overlapping Acoustic Windowing**: Audio chunks are buffered with contextual overlaps (Wav2Vec2-Live pattern) to avoid chopped phonemes.
- **RMS Silence Detection**: Continuous root-mean-square energy checks automatically detect hardware disconnects or prolonged silence.
- **Dynamic Programming Alignment**: CTC logit emissions are aligned against canonical passage tokens via dynamic sequence alignment to compute exact acoustic miscue boundaries.

---

### 5. Phase-Separated Local AI Inference Engine (8GB VRAM Constraint)
- **Why CTC over Whisper**: Whisper's internal auto-regressive language model prior "autocorrects" student pronunciation mistakes; CTC models predict direct phonemes without bias, accurately reporting real student errors.
- **Phase 1 (Oral Reading ASR)**:
  - `facebook/mms-1b-all` (~1B parameters, CTC base).
  - Swappable 9MB language adapter tensors: `eng` for English, fine-tuned `tgl` on FLEURS (`fil_ph`) for Tagalog.
  - VRAM consumption: **1.2 – 1.9 GB**.
- **GPU Transition Memory Hook**:
  - Following oral reading, `gc.collect()` and `torch.cuda.empty_cache()` immediately release VRAM to **< 0.3 GB**.
- **Phase 2 (Comprehension LLM)**:
  - `gemma3:4b` (Q4_K_M quantized via local Ollama).
  - Formulates literal, inferential, and applied questions based on the passage text.
  - VRAM consumption: **~2.5 GB**.

---

### 6. Decision & Phil-IRI Scoring Engine
- **Deterministic Diagnostic Matrix**:
  $$\text{Word Recognition \%} = \left( \frac{\text{Total Words} - \text{Total Miscues}}{\text{Total Words}} \right) \times 100$$
  $$\text{Comprehension \%} = \left( \frac{\text{Correct Answers}}{\text{Total Questions}} \right) \times 100$$
- **Phil-IRI Tiers**:
  - **Independent**: $\ge 97\%$ Recognition AND $\ge 80\%$ Comprehension.
  - **Instructional**: $90–96\%$ Recognition OR $59–79\%$ Comprehension.
  - **Frustration**: $< 90\%$ Recognition OR $< 59\%$ Comprehension.
  - **Rule**: The overall Phil-IRI level is assigned to the **lower** of the two tiers.

---

### 7. Actionable Insights, Logging & Notification Service
- **Actionable Insights**: Visual reading level badges, miscue frequency radar/bar charts, WPM fluency meters, and historical trend lines.
- **Notification Service**: SMTP verification emails, pending faculty approval alerts, and audio stream disconnect warnings.
- **Logging & Security Audit**: Authentication audit logs with IP origins, live activity event timeline with ISO timestamps, and SSO configuration logs.
