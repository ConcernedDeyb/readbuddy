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

## 10. SMCC Capstone Project Manuscript Requirements (Revised Format 2025 v2 & Approved E-Uniserv Reference)

Institutional standard for CCIS (BSIT, BSIS, DIT), prepared by CCIS Research Coordinator (Marlon Juhn M. Timogan, MIT) and noted by Dean (Daisa O. Gupit, MIT), verified against the approved 2026 capstone manuscript (*E-Uniserv*). **Cardinal Rule: Put ONLY the needed requirements in the capstone manuscript — no bloat, filler, or unapproved sections.**

### Structural Checklist & Phrasing Formulas

1. **Front Matter:**
   - Title Page, Certificate of Research Approval, Abstract, Dedication, Acknowledgement, Table of Contents, List of Tables, List of Figures.
   - **Abstract Formula:**
     - Header: `TITLE:`, `AUTHOR:`, `DEGREE:`, `ADVISER:`, `PLACE OF PUBLICATION:`, `DATE:`, `PAGES:`, `DEVELOPMENTAL RESEARCH`
     - Sub-headers:
       - `I. OBJECTIVES`: *"The researchers’ study aims to develop... Specifically, it aims to: 1. ... 2. ... 3. ... 4. ... 5. ..."*
       - `II. METHODOLOGY`: *"This study used a descriptive–developmental approach to design and implement... The system flow was visualized through structured models such as the Conceptual Framework, Use Case Diagram, Activity Diagram, Sequence Diagram, and ERD... Developed using [Stack]... Security features included [Auth & Security]... Ethical standards were observed throughout development..."*
       - `III. FINDINGS`: *"The system demonstrated a high acceptance across all three ISO 25010 evaluation criteria: Functional Suitability, Performance Efficiency, and Usability... With an overall Grand Mean of [Score], the system was rated '[Verbal Interpretation]'..."*
       - `IV. RECOMMENDATIONS`: *"To further sustain the [System], the institution should continue its development, maintenance, and improvement... Regular updates, monitoring, security checks, and backups are essential for stability. End-user training on [functions] will promote confident use..."*
       - `KEYWORDS:` Comma-separated list.

2. **Chapter I – Introduction:**
   - **Project Context (Strict 6 paragraphs):**
     - *Par 1:* Topic and relevance to status quo (Phil-IRI reading assessment, CRLA, ELLNA literacy gaps).
     - *Par 2–3:* Literature review on international and local scales citing studies (`According to [Author] [1]...`, `Additionally, [Author] [2] highlights that...`), contrasting manual paper disadvantages against digital automated benefits, and identifying the research gap.
     - *Par 4:* Institutional problem description at SMCC (`"Over the years, students at Saint Michael College of Caraga (SMCC) have mainly..."`).
     - *Par 5:* Proposed solution introduction (`"To address service challenges at [Context], a [web-based / offline AI platform] could be created that enables users to [key functions]... This approach will reduce manual effort, eliminate errors, and ensure [outcomes]..."`).
     - *Par 6:* Significance of the study and institutional necessity (`"The [Institution/Context] needs to implement and optimize a [System Type] to address existing inefficiencies... Implementing this system can improve [stakeholders'] productivity and performance..."`).
   - **Literature Review:**
     - IEEE format citations (`[1]`, `[2]`, ...).
     - Begin with a listing of the subsections/themes.
     - Use frequent headings to guide thoughts.
     - Thematically arranged with critical RRL analysis; aligned with Literature Review Matrix.
     - At least 30–50 related studies, strictly from the **past 5 years (2021–2026)**.
     - Conclude each theme with a synthesis sentence (`"Conclusion: [Takeaway contrasting manual limitation against automated advantage]."`).
     - Conclude entire literature review with an overarching summary.
   - **Project Objectives:**
     - General Objective: Develop ReadBuddy (bilingual AI-powered reading comprehension assistant).
     - Specific Objectives (at least 3; ReadBuddy defines 5):
       1. Bilingual speech-recognition module (CTC facebook/mms-1b-all adapter, >=85% word accuracy).
       2. LLM comprehension test generator (gemma3:4b, recall/inference/application, reading specialist validation).
       3. Deterministic scoring engine (>=80% agreement with teacher Phil-IRI levels).
       4. Teacher management module (register, verify, manage students, assign passages, view results).
       5. System evaluation using ISO 25010 Standards (functional suitability, performance efficiency, usability with SUS >= 68).
   - **Scope and Limitation (Strict 2 paragraphs):**
     - *Par 1 (Scope):* *"The [System Name] aims to design and develop an efficient [domain] platform for [Context], specifically implemented at Saint Michael College of Caraga, Nasipit, Agusan del Norte. The system is designed for use by [User Roles] to promote accessible, secure, and efficient [operations]. The system includes [Module 1], [Module 2], [Module 3], and [Module 4]."*
     - *Par 2 (Limitation):* *"The system can only handle [domain scope] and cannot process [out-of-scope items]. It requires [prerequisite infrastructure], and its full capabilities rely on [specific local runtime/environment]."* (Covers 8GB VRAM single-session constraint, adult FLEURS baseline pending UP-DSP-PLD validation, offline local infra, no student self-registration).
   - **Definition of Terms:**
     - Introductory formula: *"The terms defined below explain the basic concepts and factors discussed during the conceptualization and development of the [System Name] as well as how the researchers apply these concepts in their study."*
     - Format: `[Term] – Refers to [operational description of how it is applied in this research].` Arranged alphabetically.

3. **Chapter II – Methodology:**
   - **2.1 Research Design:** *"This study will use a Design and Development Research (DDR) approach, focusing on the creation and evaluation of the [System Name] as a technology-based solution to improve [Domain] operations."*
   - **2.2 SDLC:** Agile Software Development Life Cycle (Figure depicting sprint loop + narrative of iterative cycles, user feedback, and testing).
   - **2.3 System Architecture:** Figure showing end-to-end component flow + narrative explaining user interaction, backend processing, local AI inference, and database persistence.
   - **2.4 Conceptual Framework (IPO Diagram):** Standard 3-stage narrative: *Input stage*, *Process stage*, and *Output stage* (followed by ISO 25010 evaluation).
   - **2.5 Use Case Diagram:** Figure + narrative of actors (Student, Teacher, Admin) and use case functions.
   - **2.6 Activity Diagram:** Split into **two distinct figures**: `Activity Diagram - User` and `Activity Diagram - Admin`, each with narrative tracing workflow from login to logout.
   - **2.7 Sequence Diagram:** Split into **two distinct figures**: `Sequence Diagram - Student/Teacher` and `Sequence Diagram - Admin`, tracing module calls, data validation, and database returns.
   - **2.8 ERD (Database Design):** Figure + narrative detailing normalized tables, primary/foreign keys, and relational integrity.
   - **2.9 User Interface Design (Prototype):** Every single prototype screen must have its own figure and caption (`"Figure X depicts the [Screen Name] interface of [System Name]. The user may [actions]..."`).
   - **2.10 Software Platforms, Development Environments, and Tools:** Table 1 (`Components`, `Specification`, `Usage`) grouped into Front-End, Back-End, AI Runtimes, Database/Server, Security.
   - **2.11 Hardware Requirements:** Table 2 (`Components`, `Specification`, `Usage`) for Device RAM (Min 8GB, Rec 16GB), Processor, Dedicated GPU (NVIDIA >=8GB VRAM), Storage (SSD >=256GB), Audio Input Device (16kHz microphone).
   - **2.12 System Evaluation:**
     - 4-point Likert Scale:
       - `4 (3.50 – 4.0)`: *Very Functional / Very Efficient / Very Usable / Strongly Acceptable*
       - `3 (2.50 – 3.49)`: *Functional / Efficient / Usable / Acceptable*
       - `2 (1.50 – 2.49)`: *Moderately Functional / Moderately Efficient / Moderately Usable / Unacceptable*
       - `1 (1.0 – 1.49)`: *Poor Functional / Poor Efficient / Poor Usable / Strongly Unacceptable*
     - Table 3 (Functional Suitability), Table 4 (Performance Efficiency), Table 5 (Usability), Table 6 (Respondent's Distribution).
   - **2.13 Research Ethical Standards (Parts A through M):**
     - A. Protection of IPR (RA 8293)
     - B. Informed Consent (Voluntary participation, written consent)
     - C. Data Privacy and Confidentiality (RA 10173, local storage of minor data)
     - D. Voluntary Participation and Freedom to Withdraw
     - E. Minimization of Harm and Risk Management
     - F. Beneficence and Contribution to Knowledge
     - G. Justice and Fair Participant Selection
     - H. Data Integrity and Accuracy
     - I. Transparency and Honesty in Reporting
     - J. Use of Patented or Copyrighted Materials (Open-source license compliance)
     - K. Ethical Considerations for Animal and Human Trials (Non-applicable)
     - L. Responsible Use of AI and Other Related Technologies (Disclosure of assistive AI tools, human-led verification, no raw data leaks)
     - M. Ethical Clearance and Institutional Approval (SMCC Institutional Review Board - IRB)

4. **Chapter III – Results and Discussion (The UI + Code Snippet Pairing Mandate):**
   - **Strict 1-to-1 Mapping:** Sub-sections 3.1 to 3.5 directly align with Specific Objectives 1 to 5.
   - **The Defining SMCC Pattern:** For EVERY major feature module:
     1. `Figure X: [Feature Name]` (UI screenshot) + narrative describing user interaction and input fields.
     2. `Figure X+1: Snippet Code - [Feature Name]` (Source code screenshot) + line-by-line narrative:
        > *"Figure X+1 shows the [Language/Framework] code that controls the display and functionality of [Feature Name]. Lines X to Y [logic 1]... Lines A to B [logic 2]... Lines C to D [logic 3]... Overall, this code [purpose summary]."*
   - **3.5 System Evaluation Results:**
     - Table 7: Functional Suitability Evaluation Results (Items, Mean, Interpretation VF, Weighted Mean) + narrative.
     - Table 8: Performance Efficiency Evaluation Results (Items, Mean, Interpretation E/VE, Weighted Mean) + narrative.
     - Table 9: Usability Evaluation Results (Items, Mean, Interpretation VU/U, Weighted Mean) + narrative.
     - Table 10: Summary Table of the Over-all Mean and Grand Distribution of the Acceptability Level (Grand Mean, Rating SA) + narrative.

5. **Chapter IV – Summary, Conclusion, and Recommendation (Strict 3-Paragraph Caps):**
   - **4.1 Summary of Findings:** Synthesizes grand mean and scores per ISO characteristic.
   - **4.2 Conclusion (Maximum 3 Paragraphs):**
     - *Par 1:* Core purpose fulfillment and functional suitability achievements.
     - *Par 2:* Overall acceptability rating (*Strongly Acceptable*) and operational benefits.
     - *Par 3:* Maintenance and ongoing refinement requirements.
   - **4.3 Recommendations (Maximum 3 Paragraphs):**
     - *Par 1:* Institutional sustenance, regular updates, database monitoring, and backups.
     - *Par 2:* End-user training and orientation for teachers and students.
     - *Par 3:* Future researchers and developers, citing specific literature references for subsequent enhancements.

6. **References:** IEEE format only.

7. **Appendices (Strictly A through G + Institutional Forms):**
   - Appendix A: Relevant Source Code
   - Appendix B: User's Manual (Detailed, step-by-step with circled red numbers 1, 2, 3... on screenshots)
   - Appendix C: Letter of Approval / Permit to Conduct Study
   - Appendix D: Evaluation Instrument with Informed Consent (SMCC-REC Form 4)
   - Appendix E: Instrument with Informed Consent (ISO 25010 4-point questionnaire)
   - Appendix F: Map of Research Locale (Satellite image with coordinates $8.969^\circ\text{ N, } 125.294^\circ\text{ E}$)
   - Appendix G: Narrative and Photo Documentation (Chronological: Title Hearing, Proposal Defense, Routing, Coding/Debugging, Pilot Testing, Final Defense, Deployment)
   - Institutional Certifications: Certificate of Technology-Based Assessment (Grammarly/AI/Plagiarism test report), Protocol Evaluation Form (SMCC-REC Form 3).


---

## 11. Reference Files

When in doubt, re-read the originals:
- `Complete Architectural Context/architecture.md` — system design, VRAM, deployment, auth mechanism
- `Complete Architectural Context/design.md` — UX flow, screens, tone, responsive notes
- `Complete Architectural Context/PRD.md` — problem, goals, non-goals, features, metrics
- `Complete Architectural Context/Rules.md` — all 17 binding constraints
- `Complete Architectural Context/Schema.md` — PostgreSQL tables, indexes, exclusions

