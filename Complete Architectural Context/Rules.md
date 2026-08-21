# ReadBuddy — Rules

Binding constraints for anyone (human or AI-assisted) building on this project. Numbered so other
docs can reference them (e.g. `architecture.md` cites R-1, R-3).

---

## AI / Model Usage Rules

**R-1. The LLM is never used for pronunciation scoring.**
`SeaLLM-v3-7B` (or any future LLM in this stack) is used only for comprehension-question generation
and free-text answer parsing. Pronunciation checking is the CTC ASR models' job exclusively. This
is a deliberate, non-negotiable separation — see `architecture.md` for the reasoning (LLM decoder
bias can silently "correct" mispronunciations, which would corrupt the Phil-IRI word-recognition
score).

**R-2. No cloud AI APIs.** All inference (OCR, ASR, LLM) runs on locally hosted, offline models.
This is a project requirement tied to the data-privacy stance around minors' voice recordings, not
just a cost optimization — do not substitute a cloud API "temporarily" for convenience. (This does
not cover plain transactional infrastructure like outbound SMTP for account email verification —
see R-17 — since that's not an AI inference call.)

**R-3. No unverified model gets cited as final without benchmark validation.**
Before any specific ASR or LLM model is named as the committed choice in the thesis paper, it must
be tested against real sample data from the target population (basic education student recordings for ASR;
sample passages for the LLM). A model's published benchmark number (e.g. a WER from its model card)
is a starting signal, not sufficient evidence on its own — published metrics come from different
datasets and may not reflect real-world performance on this project's actual users.
  - **Currently unverified (ASR, production model):** the fine-tuned `facebook/mms-1b-all` `tgl`
    adapter (further trained on `google/fleurs` fil_ph — see `architecture.md` §2a) is now the
    model the backend actually loads. It achieved WER 0.1244 on FLEURS validation data, but
    FLEURS is read speech from adult contributors, not basic education students — this number is
    not sufficient evidence under R-3 on its own, even though it's the production default. Must
    be benchmarked against real target-population recordings before being named as final.
    `Khalsuu/filipino-wav2vec2-l-xls-r-300m-official` is no longer used in the production path
    (previously listed here as primary, with `mms-1b-all` as fallback — that has been reversed).
  - **Currently unverified (comprehension LLM, production model):** `gemma3:4b` (Q4_K_M),
    replacing `yxchia/seallms-v3-7b:Q4_K_M` for VRAM efficiency (see `architecture.md`, §2
    Comprehension test generation). SeaLLM-v3-7B was originally chosen specifically for
    Southeast Asian language training; Gemma 3 4B's Tagalog quality at this model size has not
    been directly benchmarked in available literature. Must be validated against real target-
    population passages/comprehension items before being named as final, same standard as the
    ASR model above.

**R-4. Comprehension questions must span multiple cognitive levels.**
Each generated test should include at least one recall, one inference, and one application-level
question — not all four questions testing the same shallow recall skill. Enforce this in the LLM
prompt template, not just hope the model does it unprompted.

**R-5. VRAM discipline: one heavy phase at a time.**
Never hold both the ASR models and the LLM resident in VRAM simultaneously in the 8GB deployment
target. Release the ASR models (`gc.collect()` + `torch.cuda.empty_cache()`) before loading the LLM
for the comprehension phase, and vice versa. See `architecture.md` §3 for the budget this protects.

## Data / Privacy Rules

**R-6. Audio recordings are not retained after transcription.**
Once the ASR pipeline has produced its word-level correctness output for a reading session, the raw
audio file is deleted from the server. Only the derived text/score data is stored (see
`Schema.md`) — this is both a privacy protection for minors and a storage-management rule.

**R-7. Extracted text always gets a human review step before it's scored against.**
OCR and document-parsing output must be shown to the student for review/correction (see
`design.md` Step 2) before it's used as the "source of truth" passage the student is scored
against. Never silently trust extraction output.

**R-8. No student is shown a bare score with no next step.**
Every result screen must pair the Phil-IRI tier with a concrete next action (see `design.md` §3,
Step 5). This is a UX rule but is listed here because it's treated as a hard requirement, not a
nice-to-have.

## Language / Framing Rules

**R-9. "Remedial" is not used anywhere in product framing, UI copy, or the target-user
definition.** ReadBuddy serves the general basic education population. If a future iteration wants
to target remedial-specific students again, that's a scope change requiring an update to `PRD.md`
Non-Goals, not a casual wording choice.

**R-10. Scope stays basic education (not narrowed to a single grade) unless `PRD.md` is explicitly
updated.**
Don't let "Grade 7 only" language creep back into problem statements, objectives, or methods
sections — that was the prior scope before it was broadened to basic education generally.

## Engineering Conventions

**R-11. All AI model choices and their VRAM footprint must be documented in `architecture.md`
when changed.** Keep the VRAM budget table current — it's the thing that determines whether the
whole pipeline fits on the target hardware.

**R-12. Citations in any generated documentation must be manually verified before reuse.**
This project has already caught fabricated/irrelevant citations from AI-assisted drafting (e.g. a
backup-software article cited to support a PostgreSQL claim). Any citation in a document destined
for the actual thesis paper must be checked by opening the source and confirming it says what it's
cited for — no exceptions.

**R-13. Sequential/phased model loading is a backend responsibility, not a frontend concern.**
The frontend should never need to know which AI model is currently resident in VRAM — that's
encapsulated entirely in the FastAPI backend's phase management (see `architecture.md` §1).

## Authentication & Access Rules

**R-14. Passwords are never stored in plaintext.**
Every password (teacher or student account) is bcrypt-hashed via `passlib` before it touches the
database. No route, script, migration, or debug log may ever write, print, or persist a raw
password — this includes temporary/example passwords used during development or testing.

**R-15. Session tokens live in httpOnly cookies, never in `localStorage`/`sessionStorage`.**
The JWT issued at login is set as an httpOnly, `SameSite=Lax` cookie specifically so it's not
readable by JavaScript. Given the accounts involved include minors, this is treated as
non-negotiable, not a convenience trade-off to revisit later — do not "simplify" auth by having
the frontend read/store the token itself.

**R-16. Students do not self-register.** Student accounts are created only by an authenticated
teacher (username, password, and basic profile info set by the teacher) — see `PRD.md` §3
(Non-Goals) and §5 (Account Setup). This is both a security boundary (no anonymous account
creation for accounts tied to minors) and a UX choice consistent with `design.md`'s principle
that a student shouldn't need to navigate registration/verification on their own.

**R-17. Teacher accounts require email verification before first login.**
A newly registered teacher account is created but cannot log in
(`email_verified = false`) until the emailed verification link is used. This reduces the risk of a
mistyped or fraudulent teacher account gaining access to create/manage real students' data. See
`architecture.md` §7 for the mechanism; note R-2 does not apply to the plain transactional SMTP
this requires, since it's not an AI inference call.

**R-22. Portal login is role-locked — no cross-portal sign-in.**
A teacher account must not authenticate through the Student portal, and a student account must not
authenticate through the Teacher portal. Wrong-portal attempts fail with an explicit error (switch
to the matching tab); they must not silently succeed, auto-redirect into the other portal, or
create a session under the selected tab's role. Enforce this in the login API, the login form, and
dashboard route guards.

## Design & UI/UX Rules

**R-18. No raw unicode emojis or country flag icons in production UI components.**
Production dashboards, headers, buttons, and navigation must use SVG icons or clean typography badges. Language selection controls must be labeled as "English" and "Tagalog" without country flags (e.g. `🇺🇸`/`🇵🇭` or `US`/`PH`).

**R-19. Anti-Slop Navigation & Settings Sub-Navbars.**
Sidebar active navigation items must rely on typography weight and subtle background fill transitions (`rgba(251,247,238,0.14)`), avoiding left-side vertical accent border lines. Settings sections must use dedicated pill sub-navbars rather than unorganized stacked cards.

**R-20. Student Account Creation vs Teacher Registration Form Constraints.**
Student creation forms (`StudentRegisterModal.tsx` & `TeacherStudents.tsx`) must mirror teacher registration fields (Full Name, School ID Number `202612345`, Email Address `@smccnasipit.edu.ph`, Grade Level, Section Name, Preferred Language). Teachers input **2 password fields** (Password + Confirm Password) for registration verification, while student account creation uses **1 single password field**.

**R-21. Profile Email Persistence & Verification Status Controls.**
Profile updates (display name, email) in `AccountSettings` must persist to `localStorage` (`readbuddy_user`, `readbuddy_accounts`) and dispatch global window events (`readbuddy_user_updated`). Email inputs must feature inline verification status badges (`✓ Verified` / `Verify Email`) and contextual status guidance.
