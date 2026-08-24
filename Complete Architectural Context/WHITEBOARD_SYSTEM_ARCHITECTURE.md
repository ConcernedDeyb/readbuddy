# READBUDDY — SYSTEM ARCHITECTURE SPECIFICATION
### Formatted Technical Architecture & Master Prompt (Derived from Institutional Whiteboard Model)

---

## 1. Complete Whiteboard Architecture Diagram (ASCII / Text Blueprint)

```
                                      ┌─────────────────────────────────────────────────────────────┐
                                      │                      DUAL ISP INGRESS                       │
                                      │  ┌───────────────────────┐     ┌─────────────────────────┐  │
                                      │  │    ISP (A) - PLDT     │     │     ISP (B) - GLOBE     │  │
                                      │  └───────────┬───────────┘     └────────────┬────────────┘  │
                                      └──────────────┼──────────────────────────────┼───────────────┘
                                                     │                              │
                                                     ▼                              ▼
                                      ┌──────────────────────────┐   ┌──────────────────────────┐
                                      │        ROUTER (A)        │   │        ROUTER (B)        │
                                      └──────────────┬───────────┘   └──────────────┬───────────┘
                                                     │                              │
                                                     └───────────────┬──────────────┘
                                                                     │
                                                                     ▼
                                                      ┌─────────────────────────────┐
                                                      │       pfSense FIREWALL      │
                                                      │  (Dual-WAN Failover/Gateway)│
                                                      └──────────────┬──────────────┘
                                                                     │
                      ┌──────────────────────────────────────────────┼─────────────────────────────────────────────┐
                      │                                              │                                             │
                      ▼                                              ▼                                             ▼
       ┌─────────────────────────────┐                ┌─────────────────────────────┐               ┌─────────────────────────────┐
       │   WIRELESS & SWITCH (X)     │                │   CENTRAL STORAGE ENGINE    │               │  SYSTEM MONITORING & AUDIT  │
       │ (Campus WiFi APs / Gigabit) │                ├─────────────────────────────┤               ├─────────────────────────────┤
       └──────────────┬──────────────┘                │ • Capacity (PostgreSQL 16)  │               │ 📊 Resource Telemetry (VRAM)│
                      │                               │ • Accessibility (Local LAN) │◄─────────────►│ 📋 Auth Logs & SSO Audit    │
                      ▼                               │ • Availability (On-Premise) │               │ 🕒 ISO Activity Timestamps  │
       ┌─────────────────────────────┐                │ • Scalability (Relational)  │               │ ⚠️ Hardware / Mic Warnings  │
       │      END DEVICES (Dev 1-4)  │                │ • Security (Minor Privacy)  │               └─────────────────────────────┘
       ├─────────────────────────────┤                └──────────────┬──────────────┘
       │ 💻 Dev 1: Student Laptops   │                               │
       │ 📱 Dev 2: Mobile / Tablets  │                               │
       │ 👩‍🏫 Dev 3: Teacher PC / OCR │                               │
       │ 👨‍💼 Dev 4: Admin ('readbuddy'│                               │
       └──────────────┬──────────────┘                               │
                      │                                              │
                      │ (16kHz PCM WebSocket Audio & REST API)       │
                      ▼                                              │
       ┌─────────────────────────────────────────────────────────────┴─────────────────────────────┐
       │                        READBUDDY APPLICATION SERVER (A SERVER)                            │
       ├───────────────────────────────────────────────────────────────────────────────────────────┤
       │ ┌──────────────────────────────────────┐     ┌──────────────────────────────────────────┐ │
       │ │  WEBSOCKET SUBSYSTEM (WS)            │     │  API & RBAC POLICY ENGINE                │ │
       │ │  • Web Audio API Ingestion (16kHz)   │     │  • Unified School ID Sign-In             │ │
       │ │  • Persistent Audio Streaming        │     │  • Role Dispatcher (Admin/Teacher/Student)│ │
       │ │  • Real-Time Sub-Second Color Push   │     │  • JWT httpOnly & bcrypt Security        │ │
       │ └──────────────────┬───────────────────┘     └────────────────────┬─────────────────────┘ │
       └────────────────────┼──────────────────────────────────────────────┼───────────────────────┘
                            │                                              │
                            ▼                                              ▼
       ┌───────────────────────────────────────────────────────────────────────────────────────────┐
       │                      INPUT / AI SERVICE & EVALUATION PIPELINE (AS)                        │
       ├───────────────────────────────────────────────────────────────────────────────────────────┤
       │ 📥 INPUT PIPELINE:                                                                        │
       │    • Raw Spoken Audio Chunks (Overlapping Sliding Window + RMS Silence Gate)              │
       │    • Reading Passages (Text Upload, PDF, Word Mammoth, EasyOCR Camera Photos)             │
       │                                                                                           │
       │ 🤖 LOCAL AI ENGINE (AS) — Sequential Phase VRAM Budget (RTX 4070 8GB):                    │
       │    • Phase 1 (Oral Reading): facebook/mms-1b-all (CTC Base) + Swapped eng/tgl Adapters   │
       │    • Memory Release Hook: gc.collect() + torch.cuda.empty_cache() (<0.3GB VRAM)           │
       │    • Phase 2 (Comprehension): Gemma 3 4B (Q4_K_M via Ollama) Bloom's Taxonomy Quizzes     │
       │                                                                                           │
       │ 📤 OUTPUT & SCORING:                                                                      │
       │    • Word Recognition % = ((Total Words - Miscues) / Total Words) * 100                   │
       │    • Comprehension % = (Correct Answers / Total Questions) * 100                          │
       │    • Miscue Breakdown: [Omission, Insertion, Substitution, Repetition, Mispronunciation]  │
       └─────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                                     │
                                                     ▼
                                      ┌─────────────────────────────┐
                                      │     POSTGRESQL DATABASE     │
                                      │  (DB / Account & Token Log) │
                                      └──────────────┬──────────────┘
                                                     │
                                                     ▼
                                      ┌─────────────────────────────┐
                                      │   PHIL-IRI DIAGNOSTIC DOC   │
                                      │    (Official Score Report)  │
                                      ├─────────────────────────────┤
                                      │ 📄 Independent Level        │
                                      │ 📄 Instructional Level      │
                                      │ 📄 Frustration Level        │
                                      │ 🖨️ CSV & Printable Rosters  │
                                      └─────────────────────────────┘
```

---

## 2. Whiteboard Entity Mapping & Technical Specifications

### A. Redundant Network Ingress & Perimeter Gateway (`ISP` $\rightarrow$ `Routers` $\rightarrow$ `pfSense`)
- **Dual ISP Load-Balancing & Failover**: Connected via `ISP (A) PLDT` and `ISP (B) Globe` for high institutional availability.
- **Dual Routers (`Router A` & `Router B`)**: Dedicated enterprise edge routers distributing traffic to the perimeter firewall.
- **pfSense Firewall Gateway**:
  - Acts as the primary security gateway, packet inspection firewall, and NAT router.
  - Implements strict subnet isolation: separates internal classroom LAN from external internet traffic.
  - Limits external traffic to transactional SMTP (for teacher email confirmation) and institutional SSO (Google/Microsoft Entra).

---

### B. Storage & System Monitoring Subsystem (`STORAGE` & `Monitoring`)
Matches the 5 key architectural non-functional requirements written on the whiteboard:
1. **Capacity**: High-capacity relational storage for academic year cohorts, reading passages, session histories, and token-level miscue records.
2. **Accessibility**: Sub-millisecond latency on-premise access for classroom computer laboratories and mobile devices over 5GHz campus Wi-Fi.
3. **Availability**: 99.9% on-premise uptime independent of external cloud connectivity or ISP outages.
4. **Scalability**: PostgreSQL 16 relational database with asynchronous connection pooling (`asyncpg`).
5. **Security (Privacy for Minors)**:
   - **Zero Cloud Voice Leakage**: Spoken audio is processed in-memory and permanently purged immediately after transcription.
   - **Encrypted Credentials**: Salted bcrypt hashing for passwords; JWT tokens restricted to `httpOnly`, `SameSite=Lax` cookies.
6. **System Monitoring**: Live telemetry for GPU VRAM utilization, real-time ISO activity timelines, and authentication security logs.

---

### C. End Devices & Wireless Flow (`END DEVICES` $\rightarrow$ `Wireless Flow` $\rightarrow$ `[X]`)
- **Wireless & Switch Gateway (`[X]`)**: Layer 2/3 managed switches and 802.11ac/ax dual-band Wireless Access Points.
- **End-Device Fleet (`Dev 1` to `Dev 4`)**:
  - **`Dev 1` (Student Laptop)**: Web-based independent oral reading and interactive quiz taking.
  - **`Dev 2` (Mobile / Tablet)**: Student touch devices capturing 16kHz audio via Web Audio API.
  - **`Dev 3` (Teacher Workstation)**: Faculty PC for camera OCR capture of book pages, PDF/Word passage creation, and class diagnostics.
  - **`Dev 4` (Main Admin Terminal `readbuddyadmin`)**: Institutional management console for faculty approval, student rosters, audit logs, and SSO configuration.

---

### D. Application Server (`A SERVER` / `Application Box`)
- **WebSocket Engine (`WS`)**:
  - Manages persistent full-duplex WebSocket connections (`/api/ws/reading`).
  - Receives 16kHz mono 16-bit PCM audio chunks from client microphones.
  - Emits sub-second color-coded acoustic alignment status back to the client UI (Green = Accurate, Orange = Miscue, Gray = Pending).
- **API & RBAC Policy Engine (`API & RBAC Policy`)**:
  - Unified Single Sign-In portal on `/` accepting **School ID Number**.
  - Automatic server-side role resolution and dispatch:
    - Admin $\rightarrow$ `/admin` (`readbuddyadmin`)
    - Faculty $\rightarrow$ `/teacher` (`@smccnasipit.edu.ph`)
    - Student $\rightarrow$ `/student` (`[name]@student.smccnasipit.edu.ph`)

---

### E. AI Service, Scoring & Diagnostic Pipeline (`AS` $\rightarrow$ `DB` $\rightarrow$ `Phil-IRI Output`)
- **Input Pre-Processing (`INPUT`)**:
  - Overlapping sliding acoustic window buffer (matching Wav2Vec2-Live) + RMS silence energy gating.
  - Passage corpus processing via EasyOCR, PyMuPDF, and Mammoth with human-in-the-loop teacher review.
- **Application AI Service (`AS`)**:
  - **Phase 1 (Oral Reading ASR)**: `facebook/mms-1b-all` (CTC Base) with dynamically swapped English (`eng`) and fine-tuned FLEURS Tagalog (`tgl`) adapters. CTC avoids Whisper's decoder autocorrect bias.
  - **GPU Memory Transition Hook**: Invokes `gc.collect()` + `torch.cuda.empty_cache()` to drop VRAM from ~1.4GB to <0.3GB before Phase 2.
  - **Phase 2 (Comprehension LLM)**: `gemma3:4b` (Q4_K_M via Ollama, ~2.5GB VRAM) generating Literal/Recall, Inferential, and Applied/Critical questions.
- **Scoring & Decision Matrix**:
  - $\text{Word Recognition \%} = \frac{\text{Total Words} - \text{Total Miscues}}{\text{Total Words}} \times 100$
  - $\text{Comprehension \%} = \frac{\text{Correct Answers}}{\text{Total Questions}} \times 100$
- **Phil-IRI Diagnostic Document (`Phil-IRI Doc / Paper`)**:
  - Generates official DepEd Phil-IRI Diagnostic Tier (**Independent**, **Instructional**, or **Frustration** based on the lower tier).
  - Produces exportable CSV rosters and physical printouts via network laser printers.

---

## 3. Master Text Prompt for Diagram Generation & Defense

```text
Generate a clean, high-resolution System Architecture Diagram for "ReadBuddy: AI-Powered Reading Comprehension Assistant for Basic Education Students at Saint Michael College of Caraga (SMCC)" based on the institutional network whiteboard model.

DIAGRAM LAYOUT & ARTIFACTS:

1. TOP NETWORK INGRESS:
   - Dual ISPs: "ISP (A) - PLDT" and "ISP (B) - GLOBE" connected to "Router (A)" and "Router (B)".
   - Both routers feed into "pfSense Firewall" (Dual-WAN Failover & Security Gateway).

2. STORAGE & MONITORING BLOCK (Top Right):
   - "Central Storage (PostgreSQL 16)" with 5 labeled quality attributes:
     [Capacity, Accessibility, Availability, Scalability, Security].
   - Connected to "System Monitoring & Audit" box (Telemetry, Auth Logs, ISO Activity Timestamps).

3. DISTRIBUTION & END-DEVICES (Left Side):
   - pfSense feeds into "Wireless Flow & Managed Switch [X]".
   - Distributes connectivity to "END DEVICES (Dev 1 - Dev 4)":
     • Dev 1: Student Laptops (Oral Reading)
     • Dev 2: Mobile / Tablets (Touch Web Audio)
     • Dev 3: Teacher PC (Passages & OCR)
     • Dev 4: Admin PC ('readbuddyadmin')

4. CORE APPLICATION SERVER (Center):
   - "Application Server (A Server)" containing two internal sub-blocks:
     • [WS]: WebSocket Subsystem (16kHz PCM Live Streaming & Color Feedback)
     • [API & RBAC Policy]: Unified School ID Authentication & Role-Based Access Control

5. INPUT / AI ENGINE / SCORING PIPELINE (Center Bottom):
   - "INPUT": Audio buffer + Passage OCR/Docx ingestion.
   - "AS" (Application AI Service):
     • Phase 1: facebook/mms-1b-all CTC ASR + Swappable eng/tgl Adapters (~1.4GB VRAM)
     • Transition: gc.collect() + cuda.empty_cache()
     • Phase 2: Gemma 3 4B via Ollama (~2.5GB VRAM) for Bloom's Taxonomy Quizzes
   - "DB": PostgreSQL Relational Database for accounts, rosters, and token-level miscue logs.

6. FINAL DIAGNOSTIC OUTPUT (Bottom Right):
   - "Phil-IRI Diagnostic Document" (DepEd Assessment Report):
     • Independent Level (>=97% Rec, >=80% Comp)
     • Instructional Level (90-96% Rec, 59-79% Comp)
     • Frustration Level (<90% Rec, <59% Comp)
     • Printable Rosters & CSV Exports

VISUAL STYLE:
- Professional enterprise whiteboard/technical schematic with clear directional arrows, dark emerald green (#1F4D3A) and ochre orange (#E8873A) accents, and clean labeled component boxes.
```
