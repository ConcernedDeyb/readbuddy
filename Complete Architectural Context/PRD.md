# ReadBuddy — Product Requirements Document

**Full title:** ReadBuddy: An Intelligent Reading Comprehensive Assistant for Basic Education Students
**Status:** Pre-development / Title Hearing stage
**Institution:** Saint Michael College of Caraga (SMCC), Butuan City

---

## 1. Problem Statement

Basic education students read assigned passages without any structured way to check, on their own, whether
they are pronouncing words correctly or have truly understood what they read — a teacher cannot
individually listen to and quiz every student within limited class time.

Two concrete gaps follow from this:

1. **No self-check loop.** Students who struggle with a passage typically don't find out until a
   formal, infrequent assessment (Phil-IRI) is administered — by which point gaps in word
   recognition and comprehension may have gone unnoticed for a long time.
2. **No practical way to scale individualized feedback.** Teachers who want to give every student
   oral-reading and comprehension feedback have no realistic way to do this at scale — manually
   listening to each student read aloud and preparing a comprehension quiz per passage is highly
   time-consuming.
3. **Material format friction.** Students often only have a passage as a printed textbook page, or
   as a digital file (PDF/Word), not as plain text they can bring into a reading tool — so there's
   no easy way to use these materials without retyping them by hand.

## 2. Goals

- Let a basic education student independently practice reading a passage aloud and get near-live feedback
  on pronunciation, word by word.
- Automatically generate a comprehension test from whatever passage the student just read.
- Score the combined result against the official Phil-IRI rubric (Frustration / Instructional /
  Independent) so the student — and their teacher — knows whether more support is needed.
- Accept reading material in whatever form the student actually has it: typed text, a photo of a
  printed page, or an uploaded PDF/Word document.
- Run entirely on local, offline infrastructure — no cloud AI calls — since this handles the voice
  and reading data of minors.
- Keep each student's account and results tied to the teacher responsible for them, without
  requiring the student to manage their own registration (see §5, Account Setup, and
  `architecture.md` §7).

## 3. Non-Goals (explicitly out of scope)

- **Not a remedial-only tool.** ReadBuddy is for the general basic education population, not
  exclusively students already flagged as Frustration-level readers.
- **Not a replacement for official Phil-IRI administration.** ReadBuddy is a self-directed practice
  and diagnostic-estimate tool between formal assessments, not a substitute for teacher-administered
  Phil-IRI testing.
- **No semantic/recommendation engine** (e.g. "suggest a similar passage") unless explicitly added
  later — this is why the database does not need a vector store (pgvector) in the current scope.
- **No native mobile app.** Web app only (see `architecture.md` for the Flutter-vs-web decision
  rationale) — avoids app-store distribution and review overhead entirely.
- **No student self-registration.** Students never create their own account or handle email
  verification — only their teacher does (see §5). This keeps the actual reading/practice
  experience true to the "no adult walking them through it" principle without pushing account
  setup onto the student instead.

## 4. Target Users

| User | Need |
|---|---|
| Basic education student | Log in with a username/password their teacher set up, then practice reading independently; know if they're understanding what they read |
| Subject/reading teacher | Register and verify their own account; create and manage accounts for their students; see which students need support without manually testing everyone |
| School coordinator (light touch) | Visibility into aggregate reading outcomes, if extended later |

## 5. Core User Flow

### Account Setup (one-time, per role)
0. **Teacher registration.** A teacher registers with their school-issued ID (`202612345`), institutional school email (`@smccnasipit.edu.ph`), display name, and **2 password fields** (Password + Confirm Password), then verifies their account via an emailed link before they can log in (`architecture.md` §7).
0a. **Student account creation.** A logged-in teacher (or admin) creates an account for each student with matching form fields: Full Name, Student School ID Number (`202612345`), Student Email (`@smccnasipit.edu.ph`), **1 single password field** (distinct from the teacher's 2 password fields), Grade Level, Section Name, and Preferred Language (English / Tagalog). Students do not self-register (see §3, Non-Goals).

### Reading Session Flow (repeats per passage)
1. **Input.** Student logs in with the username/password their teacher gave them, then provides the
   reading passage by typing/pasting it, taking a photo of a printed page, or uploading a PDF/Word
   document.
2. **Extraction.** If a photo was used, EasyOCR extracts the text locally. If a document was
   uploaded, a local document-parsing library (PyMuPDF for PDF, mammoth for Word) extracts the text.
   The student reviews and corrects the extracted text before continuing.
3. **Guided reading.** The student reads the passage aloud. A locally hosted, CTC-based speech
   model checks pronunciation in near real time and highlights each word (correct / mispronounced)
   as the student reads.
4. **Comprehension test.** Once the student finishes the passage, a locally hosted LLM generates a
   comprehension test (recall, inference, and application-level questions) based on that exact
   passage.
5. **Answering.** The student answers the test.
6. **Scoring.** The system combines the pronunciation accuracy score (step 3) with the comprehension
   score (step 5) and maps the result to the Phil-IRI rubric.
7. **Result.** The student sees their reading level (Frustration / Instructional / Independent) and
   guidance on whether they need further practice or teacher support.

## 6. Features

### Must-have (v1)
- Teacher self-registration with school ID + email verification; teacher login.
- Teacher-managed student accounts (create/list students they're responsible for); student login.
- Role-based access enforced on both frontend routes and backend API endpoints
  (`architecture.md` §7).
- Three input methods: type/paste, photo + OCR, document upload + parsing
- Extracted-text review/correction step
- Near-live pronunciation checking, bilingual (English + Filipino/Tagalog)
- Auto-generated comprehension test per passage
- Phil-IRI rubric scoring and result screen with guidance messaging

### Nice-to-have (future)
- Teacher-facing dashboard for **aggregate class results** (distinct from the basic
  student-account-management screen above, which is now in v1 scope — this is specifically about
  rollup/reporting views across a whole class's reading outcomes).
- Passage recommendation based on reading history (would justify adding pgvector).
- Progress tracking across multiple sessions/weeks.
- Password-reset flow and session revocation for both roles (see `architecture.md` §6 — stated
  as a known auth gap, not yet built).

## 7. Success Metrics

- **Accuracy:** AI-estimated Phil-IRI level agreement rate against teacher-assessed reading levels
  for the same students (pilot validation).
- **Usability:** System Usability Scale (SUS) score from students and teachers after pilot use.
- **Adoption:** Number of passages completed per student during the pilot period.

## 8. Assessment Rubric Reference — Phil-IRI

| Level | Word Recognition Accuracy | Comprehension Score |
|---|---|---|
| Independent | 97–100% | 80–100% |
| Instructional | 90–96% | 59–79% |
| Frustration | below 90% | below 59% |

Overall reported level = the **lower** of the two tiers (standard Phil-IRI practice), which is what
drives the "needs improvement/guidance" messaging shown to the student.

## 9. Open Decisions / Risks

- **Bilingual ASR accuracy is not yet validated.** The production Tagalog pronunciation model is
  now a fine-tuned `facebook/mms-1b-all` adapter (FLEURS-validation WER 0.1244), replacing the
  earlier `Khalsuu/filipino-wav2vec2-l-xls-r-300m-official` choice. FLEURS is adult read speech,
  not basic education student recordings — this result must still be benchmarked against real
  target-population recordings before being cited as final in the paper. See `Rules.md` R-3.
- **Comprehension LLM changed for VRAM efficiency, also not yet validated.** `gemma3:4b` replaced
  `SeaLLM-v3-7B` (~2.5GB vs. ~4.7GB). SeaLLM was originally chosen for explicit Southeast Asian
  language training; Gemma 3 4B's Tagalog quality at this size has no confirmed benchmark. Same
  validation requirement applies before this is treated as settled. See `Rules.md` R-3.
- **Single-device deployment during pilot.** No dedicated always-on server during development —
  the researcher's personal laptop hosts everything. If it's offline, the app is unavailable. Stated
  plainly as a known limitation; production deployment is recommended on an SMCC-owned server.
- **pgvector is currently unused.** Only add it if the recommendation-engine feature above is
  greenlit — don't carry the complexity for a feature that doesn't exist yet.
- **Auth is functional but not production-hardened.** Rate-limiting, password reset, session
  revocation, and HTTPS-only cookies are not yet implemented — acceptable for a controlled pilot
  on a local network, not for open deployment (see `architecture.md` §6).
- **Only one guided-reading session can run system-wide at a time** (see `architecture.md` §4) —
  now that real, distinct student accounts exist, this needs revisiting before a full class can
  read concurrently.
