# ReadBuddy — Design

Covers UX flow, screens, and interaction patterns. Pairs with `PRD.md` (why these screens exist)
and `architecture.md` (what powers them).

---

## 1. Design Principles

1. **The student is the primary user, not the teacher.** Every screen in the reading-session flow
   should be usable by a basic education student without an adult walking them through it. Account
   *creation* is the deliberate exception (see §2a) — a student's own screens start at "log in,"
   not "register."
2. **Feedback should feel close to live, but never punish uncertainty.** Pronunciation highlighting
   should read as encouraging practice, not a red-pen correction exercise — see color/tone notes
   below.
3. **No dead ends.** Every result screen (including a Frustration-level result) ends with a clear
   next action, never just a bare score.
4. **Local-first, offline-tolerant where possible.** OCR, audio capture, and text review can degrade
   gracefully; only the AI-processing steps require the backend to be reachable.

## 2. Screen Map

```
Teacher Register (school ID, email, password)
 └─ Email Verification (link opened from email)
     └─ Teacher Login
         └─ Teacher Dashboard
             ├─ Create Student Account
             └─ My Students (list)

Student Login (username + password, given by their teacher)
 └─ New Reading Session
     ├─ Step 1: Input Method
     │   ├─ Type / Paste Text
     │   ├─ Take a Photo
     │   └─ Upload a Document (PDF / Word)
     ├─ Step 2: Review Extracted Text  (skipped if typed directly)
     ├─ Step 3: Guided Reading (live pronunciation feedback)
     ├─ Step 4: Comprehension Test
     └─ Step 5: Result Screen (Phil-IRI level + guidance)
```

## 2a. Account Screens — Notes

These are new relative to earlier versions of this document, which had no login/account screens
at all (see `architecture.md` §7 for the mechanism behind them).

### Teacher Register
Standard form: display name, school-issued ID, school email, password. Copy should set
expectations plainly: "We'll email you a link to verify your account before you can log in" —
per design principle 3 (no dead ends), the confirmation screen after submitting tells the teacher
exactly what to do next (check email), not just "success."

### Email Verification
A simple, largely non-interactive confirmation screen reached by clicking the emailed link
("Your account is verified — you can now log in"), linking straight to Teacher Login. If the
link is invalid/already used, say so plainly and link back to Login or Register rather than
showing a bare error.

### Teacher Login
Standard school ID + password form. If the account isn't yet verified, the error message should
say so specifically ("Please verify your email first") rather than a generic "incorrect
credentials" — a teacher who just registered shouldn't be left guessing why login fails.

### Teacher Dashboard — Create Student Account / My Students
Deliberately minimal for v1 (matches `PRD.md`'s distinction between this basic account-management
screen and the separate, still-future "aggregate class results" dashboard): a form to create a
student (display name, username, password, grade level, language) and a simple list of students
the teacher has already created. No results/analytics here yet — that's the nice-to-have future
dashboard, not this one.

### Student Login
The most important UX constraint on this whole set of new screens: **this must be usable by a
young student with no adult present**, per design principle 1. Concretely:
- Just two fields (username, password) — no email, no "forgot password" flow to reason about
  (that flow doesn't exist yet; see `architecture.md` §6).
- Large, simple input fields and a single clear button, consistent with the rest of the
  student-facing flow's visual language (see Step 1 and elsewhere for the established style —
  warm colors, rounded cards, generous spacing).
- Error copy stays simple and non-technical: "That username or password doesn't look right — ask
  your teacher if you're not sure," rather than a generic auth-library error string.

## 3. Screen-by-Screen Notes (Reading Session Flow)

### Step 1 — Input Method
Three equal-weight options, not a hidden menu — a basic education student should immediately see all three
ways to bring in a passage. Camera capture should show a simple crop/alignment guide (book pages are
rarely perfectly flat); document upload accepts `.pdf` and `.docx` only, with a clear file-size
limit shown up front.

### Step 2 — Review Extracted Text
This step is **never skipped** for OCR or document-upload input — it exists specifically because
extraction (EasyOCR, PyMuPDF, mammoth) can introduce errors, and the student is scored against
whatever text is confirmed here. Design as an editable text area with the original image/document
shown side-by-side (or toggleable on narrow screens) so the student can compare.

### Step 3 — Guided Reading
- Passage displayed as flowing text, word-tokenized.
- As the student reads aloud, each word updates from a neutral state to either:
  - **Correct** — a calm affirming color (e.g. soft green), no animation that implies "you passed a
    test," just quiet confirmation.
  - **Mispronounced** — a warm, non-alarming color (avoid harsh red; amber/orange reads as "try
    this one again," not "you failed"), with a tap-to-hear-it-correctly affordance.
- A visible mic/recording indicator so the student always knows the system is listening.
- A "finish reading" action that's explicit (student taps when done) rather than silently
  auto-detecting end-of-passage — keeps the student in control of pacing.

### Step 4 — Comprehension Test
Standard multiple-choice UI. Mix of recall, inference, and application-level questions (see
`Rules.md`, rule R-4, for question-generation constraints). No time pressure/timer — this measures
understanding, not speed.

### Step 5 — Result Screen
- Leads with the Phil-IRI tier (Independent / Instructional / Frustration) in plain, non-clinical
  language a basic education student and a teacher can both understand at a glance.
- Shows the two contributing scores (pronunciation accuracy %, comprehension %) separately, not just
  the combined tier — a student who read perfectly but struggled with comprehension (or vice versa)
  should be able to see *which* part needs work.
- Always ends with a concrete next action: "Try another passage," "Review the words you missed," or
  a note to check in with your teacher — never just a number with nothing to do next.

## 4. Tone and Language

- Avoid clinical/deficit language ("you failed," "below grade level"). Use growth-oriented phrasing
  ("this word needs more practice," "you're getting closer to Independent level").
- Never use the word "remedial" anywhere in the student-facing UI — this product is for the general
  basic education population (see `PRD.md`, Non-Goals).
- Keep sentence length and vocabulary in the UI itself (buttons, instructions, result messaging)
  simple regardless of which grade is using it — the tool that assesses reading level shouldn't
  itself be hard to read, whether the student is in the earlier or later basic education grades.
- This now extends to auth-related copy too (§2a) — login/error messages on student-facing screens
  follow the same plain-language standard as the rest of the flow, not generic auth-library text.

## 5. Responsive/Device Notes

- Primary target: mobile browser (phone), since that's the most likely device a basic education
  student has personal access to; secondary target: school lab desktop/laptop browsers.
- Camera capture UI only renders on devices that expose `getUserMedia` camera access; document
  upload and typed input remain available everywhere as fallbacks.
- The live pronunciation-feedback view needs a stable WebSocket connection indicator — if the
  connection drops mid-reading, the UI should clearly pause and prompt reconnect rather than fail
  silently (ties to `architecture.md` §6, known limitations around single-device hosting).

## 6. Dashboard Architecture & Visual Design Standards

Added to support institutional, school-professional workflows across Students, Teachers, and System Administrators.

### Role-Based Dashboard Navigation
- **Unified `DashboardShell`**: Serves all three roles (`student`, `teacher`, `admin`) with distinct role accent schemes (Marigold `#E8873A`, Denim `#3D6B8A`, Plum `#7A4A6B`).
- **Student Dashboard (`/student`)**:
  - `My Progress`: Reading sessions summary, Phil-IRI level badge, trend chart, and pending test notifications.
  - `Assigned Tests`: Browse tests set by teacher, view instructions, and launch tests directly.
  - `Reading History`: Detailed past session logs with score breakdowns and Phil-IRI tier badges.
  - `Settings`: Student learning preferences (language selection, speech assistance speed, phonics hints) and account settings.
- **Teacher Dashboard (`/teacher`)**:
  - `Overview`: Class metrics, active passages, and assigned tests summary.
  - `My Students`: Student account roster management and student creation.
  - `My Passages`: Passage authoring, text editing, and publishing controls.
  - `Reading Tests`: Batch test creation, assignment tracking, and slide-in Phil-IRI rubric grading panel (`DetailPanel`).
  - `Settings`: Account profile, password change, and notification preferences.
- **Admin Dashboard (`/admin`)**:
  - `Overview`: System-wide stats, active VRAM status, and recent activity feed.
  - `Teachers & Students`: Institutional account lists.
  - `Content`: Platform-wide passage audit.
  - `System Settings`: ASR & LLM model configuration, VRAM limits, and maintenance.
  - `My Account`: Admin profile and password management.

### Left-Side Vertical Settings Sub-Navbar & Dashboard Layout Stability
- **Sidebar Viewport Anchoring (`DashboardShell.tsx`)**:
  - The main dashboard sidebar is anchored as a fixed 100vh column (`sticky top-0 h-screen flex flex-col justify-between`).
  - The bottom-left user section (User avatar, display name, and Log Out button) is locked in place at the bottom of the viewport sidebar, preventing any vertical shifts or adjustments when changing tabs or dynamically resizing section content.
- **Settings Sub-Navbar Container (`AccountSettings.tsx` & `AdminSettings.tsx`)**:
  - Settings sub-navbars feature a dedicated left panel (`grid grid-cols-1 md:grid-cols-4 gap-6 items-start`).
  - `items-start` prevents column stretching and reflow when navigating between settings sections (e.g. Reading & Speech Preferences).

### Account Creation & Profile Details UI
- **Teacher Registration (`TeacherRegisterModal.tsx`)**:
  - Fields: Full Name, School ID Number (`202612345`), Institutional Email (`teacher@smccnasipit.edu.ph`), **2 Password Fields** (Password + Confirm Password).
- **Student Account Creation (`StudentRegisterModal.tsx` & `TeacherStudents.tsx`)**:
  - Fields: Student Full Name, Student School ID Number (`202612345`), Student Email Address (`student@smccnasipit.edu.ph`), **1 Single Password Field** (clearly distinguished from Teacher), Grade Level, Section Name, and Preferred Reading Language (English / Tagalog).
- **Profile Email Verification & Persistence (`ProfileTab`)**:
  - **Inline Status Badge**: Positioned directly next to the Email Address input field (`✓ Verified` green badge if confirmed; `Verify Email` amber button if modified or unverified).
  - **Status Guidance**: Rendered directly below the email input field (`⚠️ Email address is pending verification. Click Verify Email to send a confirmation link.`).
  - **Persistence**: Saving profile changes updates `localStorage` (`readbuddy_user`, `readbuddy_accounts`) and dispatches `readbuddy_user_updated`, ensuring changed emails persist across page reloads (`F5`).
- **No Left Accent Line in Navigation**: Sidebar active nav items use clean, subtle background fill transitions (`rgba(251,247,238,0.14)`) and font weight distinction rather than vertical left bar lines.
- **Explicit Language Labels**: Languages are cleanly labeled as **English** and **Tagalog** without country flags.
- **Tactile Paper Aesthetics**: Warm cream background (`#FBF7EE`), Fraunces serif headings, Figtree sans body text, and Space Mono for technical metrics.

## 7. Out of Scope for v1 Design

- Multi-tenant multi-school deployment (currently tailored for SMCC pilot).
- Automated SMS notifications (plain email notifications only).
- Password-reset / forgot-password self-service screens (teacher-managed for students; manual admin override for teachers).
