# SMCC Capstone Project Manuscript Format Rule (Revised Format 2025 v2 & Approved Reference Standard)

This rule governs all capstone manuscript drafting, editing, and review tasks for the ReadBuddy project at Saint Michael College of Caraga (SMCC), College of Computing and Information Sciences (CCIS).

## Cardinal Rule: Put ONLY the Needed Requirements
Do NOT introduce unapproved chapters, speculative sub-sections, filler paragraphs, or unrequired appendices. Adhere strictly to the format issued by CCIS Research Coordinator (Marlon Juhn M. Timogan, MIT) and noted by CCIS Dean (Daisa O. Gupit, MIT), following the precedent established in the approved 2026 capstone manuscript (*E-Uniserv*).

---

## Word-by-Word Phrasing & Structural Invariants

### 1. Abstract
* Structured under 4 uppercase headings:
  - `I. OBJECTIVES`: *"The researchers’ study aims to develop... Specifically, it aims to: 1. ... 2. ... 3. ... 4. ... 5. ..."*
  - `II. METHODOLOGY`: *"This study used a descriptive–developmental approach to design and implement... The system flow was visualized through structured models such as the Conceptual Framework, Use Case Diagram, Activity Diagram, Sequence Diagram, and ERD... Developed using [Stack]... Ethical standards were observed throughout development..."*
  - `III. FINDINGS`: *"The system demonstrated a high acceptance across all three ISO 25010 evaluation criteria: Functional Suitability, Performance Efficiency, and Usability... With an overall Grand Mean of [Score], the system was rated '[Verbal Interpretation]'..."*
  - `IV. RECOMMENDATIONS`: *"To further sustain the [System], the institution should continue its development, maintenance, and improvement... Regular updates, monitoring, security checks, and backups are essential for stability. End-user training on [Functions] will promote confident use..."*
  - `KEYWORDS:` Comma-separated list ending with `ISO 25010 Evaluation`.

### 2. Chapter I – Introduction
* **Project Context**: Exactly **6 paragraphs**:
  - Par 1: Status quo in reading assessment (Phil-IRI, CRLA, ELLNA).
  - Par 2–3: Literature review on international and local scales citing studies (`According to [Author] [1]...`, `Additionally, [Author] [2] highlights that...`), contrasting manual paper disadvantages against digital automated benefits, and identifying the research gap.
  - Par 4: Institutional problem description at SMCC (`"Over the years, students at Saint Michael College of Caraga (SMCC) have mainly..."`).
  - Par 5: Proposed solution introduction (`"To address service challenges at [Context], a [web-based / offline AI platform] could be created that enables users to [key functions]... This approach will reduce manual effort, eliminate errors, and ensure [outcomes]..."`).
  - Par 6: Significance of the study and institutional necessity (`"The [Institution/Context] needs to implement and optimize a [System Type] to address existing inefficiencies... Implementing this system can improve [stakeholders'] productivity and performance..."`).
* **Literature Review**:
  - Begin with a listing of the subsections of the literature review.
  - Thematically arranged synthesis and analysis.
  - Aligned with the Literature Review Matrix.
  - **At least 30–50 related studies**, strictly from the **past 5 years (2021–2026)**. Older references are invalid.
  - Conclude each theme with: *"Conclusion: [Synthesized takeaway contrasting manual vs automated capability]."*
  - Conclude the section with an overall summary.
  - Citations must be strictly in **IEEE format** (`[1]`, `[2]`, ...).
* **Project Objectives**:
  - General Objective.
  - Specific Objectives (ReadBuddy has 5 specific objectives):
    - Objective 1: Bilingual speech-recognition module (CTC base + adapter, $\ge 85\%$ accuracy).
    - Objective 2: LLM comprehension test generator (`gemma3:4b`, validated by reading specialists).
    - Objective 3: Deterministic Phil-IRI scoring engine ($\ge 80\%$ agreement with teachers).
    - Objective 4: Teacher management module.
    - Objective 5: ISO 25010 Standards evaluation (functional suitability, performance efficiency, usability with SUS $\ge 68$).
* **Scope and Limitation**: Exactly **2 paragraphs**:
  - Par 1 (Scope): *"The [System Name] aims to design and develop an efficient [domain] platform for [Context], specifically implemented at Saint Michael College of Caraga, Nasipit, Agusan del Norte. The system is designed for use by [User Roles] to promote accessible, secure, and efficient [operations]..."*
  - Par 2 (Limitation): *"The system can only handle [domain scope] and cannot process [out-of-scope items]. It requires [prerequisite infrastructure], and its full capabilities rely on [specific local runtime/environment]."* (Covers 8GB VRAM single-session constraint, adult FLEURS baseline pending UP-DSP-PLD validation, offline local infra, no student self-registration).
* **Definition of Terms**:
  - Introductory formula: *"The terms defined below explain the basic concepts and factors discussed during the conceptualization and development of the [System Name] as well as how the researchers apply these concepts in their study."*
  - Format: `[Term] – Refers to [operational definition].` Arranged alphabetically.

### 3. Chapter II – Methodology
* **2.1 Research Design:** *"This study will use a Design and Development Research (DDR) approach, focusing on the creation and evaluation of the [System Name] as a technology-based solution to improve [Domain] operations."*
* **2.2 SDLC:** Agile sprint loop diagram + iterative sprint methodology narrative.
* **2.3 System Architecture:** Architecture diagram + end-to-end user-to-database narrative.
* **2.4 Conceptual Framework (IPO):** Input-Process-Output diagram + 3-stage narrative.
* **2.5 Use Case Diagram:** Actors and use case associations narrative.
* **2.6 Activity Diagram:** Must be split into **two distinct figures**: `Activity Diagram - User` and `Activity Diagram - Admin`.
* **2.7 Sequence Diagram:** Must be split into **two distinct figures**: `Sequence Diagram - Student/Teacher` and `Sequence Diagram - Admin`.
* **2.8 ERD:** Normalized database design (12 tables) with primary/foreign keys narrative.
* **2.9 Prototypes:** Every screen must have a dedicated figure and caption (`"Figure X depicts the [Screen Name] interface of [System Name]. The user may [actions]..."`).
* **2.10 & 2.11 HW/SW Specifications:** Standard 3-column tables (`Components`, `Specification`, `Usage`).
* **2.12 Evaluation Likert Scale Standards:**
  - 4-point scale:
    - `4` (3.50 – 4.0): *Very Functional / Very Efficient / Very Usable / Strongly Acceptable*
    - `3` (2.50 – 3.49): *Functional / Efficient / Usable / Acceptable*
    - `2` (1.50 – 2.49): *Moderately Functional / Moderately Efficient / Moderately Usable / Unacceptable*
    - `1` (1.0 – 1.49): *Poor Functional / Poor Efficient / Poor Usable / Strongly Unacceptable*
* **2.13 Research Ethical Standards:** 13-part framework (A through M) citing RA 8293, RA 10173, informed consent, AI usage transparency, and SMCC IRB clearance.

### 4. Chapter III – Results and Discussion (The UI + Code Snippet Pairing Mandate)
* **Objective Alignment:** Sub-sections 3.1 to 3.5 strictly map 1-to-1 to Specific Objectives 1 to 5.
* **Feature Presentation Rule:** For EVERY major feature developed:
  1. `Figure X: [Feature Name]` (UI screenshot) + descriptive narrative of inputs and controls.
  2. `Figure X+1: Snippet Code - [Feature Name]` (Code snippet screenshot) + line-by-line narrative:
     > *"Figure X+1 shows the [Language/Framework] code that controls the display and functionality of [Feature Name]. Lines X to Y [logic 1]... Lines A to B [logic 2]... Lines C to D [logic 3]... Overall, this code [purpose summary]."*
* **Objective 5 Evaluation Results:** Tables 7 (Functional Suitability), 8 (Performance Efficiency), 9 (Usability), and 10 (Summary Table of Grand Mean & Rating) with descriptive narrative analyzing highest and lowest indicators.

### 5. Chapter IV – Summary, Conclusion, and Recommendation (Strict 3-Paragraph Caps)
* **4.1 Summary of Findings:** Grounded in ISO 25010 grand mean and criteria results.
* **4.2 Conclusion (Strictly Max 3 Paragraphs):**
  - *Par 1:* Core purpose fulfillment and functional suitability achievements.
  - *Par 2:* Overall acceptability rating (*Strongly Acceptable*) and operational benefits.
  - *Par 3:* Maintenance and ongoing refinement requirements.
* **4.3 Recommendations (Strictly Max 3 Paragraphs):**
  - *Par 1:* For Institution / Operational sustenance & backups.
  - *Par 2:* For End-User Training and orientation.
  - *Par 3:* For Future Researchers and Developers, citing literature references for subsequent enhancements.

### 6. Appendices Standards
* **Appendix A:** Relevant Source Code
* **Appendix B:** User's Manual (Detailed, with circled red numbers 1, 2, 3... and step-by-step numbered bullets)
* **Appendix C:** Letter of Permission / Permit to Conduct Study
* **Appendix D:** Evaluation Instrument with Informed Consent (SMCC-REC Form 4)
* **Appendix E:** Instrument with Informed Consent (ISO 25010 4-point questionnaire)
* **Appendix F:** Map of Research Locale (Satellite map with coordinates $8.969^\circ\text{ N, } 125.294^\circ\text{ E}$)
* **Appendix G:** Narrative and Photo Documentation (Chronological: Title Hearing, Proposal Defense, Routing, Development/Coding, Pilot Testing, Final Defense, Deployment)
