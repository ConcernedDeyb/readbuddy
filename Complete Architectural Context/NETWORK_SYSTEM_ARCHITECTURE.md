# READBUDDY — PHYSICAL NETWORK & DEPLOYMENT SYSTEM ARCHITECTURE
### Network Topology, Hardware Infrastructure, and On-Premise Edge Deployment for Saint Michael College of Caraga (SMCC)

---

## 1. Visual Network & Hardware Architecture Diagram

```
                              ┌─────────────────────────┐
                              │     EXTERNAL INTERNET   │
                              │  (SMTP Email / SSO Auth)│
                              └────────────┬────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────┐
                              │  INSTITUTIONAL FIREWALL │
                              │ (SMCC Security Gateway) │
                              └────────────┬────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────┐
                              │       CORE ROUTER       │
                              │ (Cisco / Edge Gateway)  │
                              └────────────┬────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │                                     │
                        ▼                                     ▼
           ┌─────────────────────────┐           ┌─────────────────────────┐
           │     NETWORK SWITCHES    │           │    WIRELESS ACCESS      │
           │ (Layer 2/3 Managed PoE) │──────────►│      POINTS (WAP)       │
           └────────────┬────────────┘           │    (SMCC Campus WiFi)   │
                        │                        └────────────┬────────────┘
                        │                                     │
                        ▼                                     │
┌─────────────────────────────────────────────────┐           │
│           ON-PREMISE SERVERS & GPU NODE         │           │
├─────────────────────────────────────────────────┤           │
│ 🖥️ Web App Server (Next.js 14 Frontend)         │           │
│ ⚙️ API Backend Server (FastAPI Async Gateway)   │           │
│ 🤖 Local AI GPU Node (NVIDIA RTX 2070 8GB VRAM) │           │
│    • MMS-1B-All CTC Base + eng/tgl Adapters     │           │
│    • Gemma 3 4B (Q4_K_M via Local Ollama)       │           │
│    • EasyOCR / Document Extraction Pipeline     │           │
│ 🗄️ PostgreSQL Database Server                   │           │
│    (Encrypted Accounts, Rosters, Miscue Logs)   │           │
└───────────────────────┬─────────────────────────┘           │
                        │                                     │
                        ▼                                     ▼
═════════════════════════════════════════════════════════════════════════════════════
          SMCC CAMPUS LOCAL AREA NETWORK (LAN / 1Gbps ETHERNET & 5GHz WI-FI)
═════════════════════════════════════════════════════════════════════════════════════
         │                           │                          │
         ▼                           ▼                          ▼
┌─────────────────┐         ┌─────────────────┐        ┌─────────────────┐
│ STUDENT DEVICES │         │ TEACHER DEVICES │        │   MAIN ADMIN    │
│  (End Users)    │         │  (End Users)    │        │   WORKSTATION   │
├─────────────────┤         ├─────────────────┤        ├─────────────────┤
│ 💻 Laptops      │         │ 💻 Faculty PCs  │        │ 🖥️ Admin Terminal│
│ 📱 Smartphones  │         │ 📑 Tablets      │        │    ('readbuddy- │
│ 📲 Tablets      │         │ 📷 Camera / OCR │        │      admin')    │
│  • Oral Reading │         │  • Uploads      │        │  • User CRUD    │
│  • Live Feedback│         │  • Test Assign  │        │  • Auth Logs    │
│  • Quizzes      │         │  • IRI Reports  │        │  • SSO Config   │
└─────────────────┘         └─────────────────┘        └────────┬────────┘
                                                                │
                                                                ▼
                                                       ┌─────────────────┐
                                                       │ NETWORK PRINTER │
                                                       ├─────────────────┤
                                                       │ 🖨️ Laser Printer│
                                                       │  • Phil-IRI Logs│
                                                       │  • CSV Rosters  │
                                                       │  • Test Results │
                                                       └─────────────────┘
```

---

## 2. Component-by-Component Infrastructure Specification

### 1. External Internet Layer
- **Scope & Security**: Traffic to the public internet is restricted and non-essential for core reading execution.
- **Outbound Services**:
  - **SMTP Gateway**: Secure transactional emails for teacher account verification.
  - **Institutional SSO Federation**: Google Workspace / Microsoft 365 OAuth 2.0 and SAML 2.0 authentication handshakes for faculty.
- **Privacy for Minors (Zero Cloud Ingestion)**: No student voice recordings, audio streams, or raw biometric data ever leave the local campus network.

---

### 2. Network Perimeter & Traffic Routing
- **Institutional Firewall**:
  - Inspects incoming traffic, enforces SSL/TLS termination, and isolates the ReadBuddy server subnet.
  - Blocks unauthorized external probing to database and model serving ports (Ollama `11434`, PostgreSQL `5432`).
- **Core Router & Layer 2/3 Managed Switches**:
  - Routes high-bandwidth, full-duplex traffic across campus computer laboratories, faculty rooms, and classrooms.
  - Implements VLAN segregation for Student WiFi, Faculty Network, and Server Infrastructure.
- **Wireless Access Points (WAPs)**:
  - Dual-band 802.11ac/ax (5GHz) high-density wireless access points distributed across SMCC classrooms and reading centers.
  - Ensures low-latency, uninterrupted 16kHz WebSocket audio streaming from mobile and tablet clients.

---

### 3. On-Premise Server & Local AI GPU Workstation
All computational, database, and AI workloads execute locally on dedicated institutional hardware (e.g., an on-premise workstation equipped with an **NVIDIA RTX 4070 8GB VRAM**):

1. **Next.js 14 Web Frontend Server**:
   - Serves modern responsive web clients to student phones, tablets, Chromebooks, and PCs without requiring native app installations.
2. **FastAPI Async Application Gateway**:
   - Python 3.11+ asynchronous gateway orchestrating REST endpoints and persistent WebSockets (`/api/ws/reading`).
   - Handles unified single sign-in routing, role-based access control (RBAC), and session issuance via `httpOnly` cookies.
3. **Local AI Inference Node (Sequential Phase Execution)**:
   - **Speech ASR Node**: `facebook/mms-1b-all` CTC base model with hot-swappable English (`eng`) and fine-tuned FLEURS Tagalog (`tgl`) adapters (~1.4GB VRAM). Performs zero-decoder-bias acoustic miscue diffing.
   - **Memory Management Hook**: Executes `gc.collect()` and `torch.cuda.empty_cache()` to release VRAM before phase 2.
   - **Comprehension LLM Node**: `gemma3:4b` (Q4_K_M) served via local Ollama instance (~2.5GB VRAM) for Bloom's Taxonomy question generation and deterministic answer grading.
   - **Document OCR Node**: EasyOCR, PyMuPDF, and Mammoth for converting book photos, PDFs, and Word documents into standardized reading passages.
4. **PostgreSQL 16 Relational Database Server**:
   - Stores user accounts, classroom sections, passages, miscue tokens, session logs, and Phil-IRI diagnostic records with encrypted credentials and relational integrity.

---

### 4. SMCC Campus Local Area Network (LAN & WiFi)
Connects all internal client nodes and peripheral devices via high-speed gigabit Ethernet and low-latency wireless intranet:

- **Student End-User Devices (Learners)**:
  - Students connect using laptops, smartphones, or school tablets.
  - Features: Real-time oral reading practice, color-coded pronunciation highlights over WebSockets, comprehension quizzes, and Phil-IRI badges.
- **Teacher End-User Devices (Faculty)**:
  - Educators access the web portal via faculty desktop PCs and laptops.
  - Features: Passage creation (via camera photo OCR or file upload), class section management, reading test assignments, and Phil-IRI diagnostic analytics.
- **Main Administrator Workstation (`readbuddyadmin`)**:
  - Dedicated institutional desktop terminal for administrative staff.
  - Features: Faculty approvals/revocations, student roster management, authentication security logs, live ISO activity stream, and SSO configuration.
- **Institutional Hardware Peripheral (Printer)**:
  - Network-attached laser printer connected to the LAN for printing physical Phil-IRI diagnostic reports, student reading level summaries, and CSV rosters.

---

## 3. Master Text Prompt for Diagram Generation & Documentation

```text
Create a clean, professional Physical Network & Deployment System Architecture diagram for "ReadBuddy: AI-Powered Reading Comprehension Assistant at Saint Michael College of Caraga (SMCC)".

Layout and Flow:
1. TOP PERIMETER:
   - "Internet" connected to "Institutional Firewall" -> "Core Router" -> "Managed Switches" -> "Wireless Access Points (Campus WiFi)".

2. CENTRAL ON-PREMISE SERVERS (Connected to Switch):
   - "Servers & Local AI Workstation":
     • Next.js 14 Web Frontend Server
     • FastAPI Async Application Gateway
     • Local AI GPU Node (NVIDIA RTX 2070 8GB) running MMS-1B-All CTC ASR + Gemma 3 4B LLM via Ollama + EasyOCR
     • PostgreSQL 16 Relational Database Server

3. LOCAL AREA NETWORK (LAN BUS):
   - A vertical/horizontal "Campus LAN (Ethernet & WiFi)" bus distributing connectivity to:
     • Student Devices (Laptops, Smartphones, Tablets) performing oral reading & quizzes
     • Teacher Devices (Faculty PCs, Tablets) uploading passages & managing class Phil-IRI tests
     • Main Admin Workstation ('readbuddyadmin') monitoring audit logs & managing accounts
     • Network Printer connected to Admin/Faculty for physical printing of Phil-IRI rosters and reports.

Visual Style:
- Clean enterprise network topology diagram with professional hardware icons, labeled nodes, clear directional connection lines, and institutional coloring (Dark Emerald Green, Ochre Orange, and Slate Blue).
```
