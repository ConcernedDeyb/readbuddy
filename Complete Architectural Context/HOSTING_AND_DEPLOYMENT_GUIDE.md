# ReadBuddy — Hosting & Cloud Deployment Guide

Comprehensive cloud architecture, VPS setup, GitHub Student Pack utilization, and multi-user concurrency deployment manual for the **ReadBuddy** AI Reading Comprehension Assistant.

---

## 1. Executive Summary & Deployment Topology

ReadBuddy uses a decoupled full-stack architecture optimized for high-performance real-time audio processing, local AI inference, and student data privacy:

```
                                [ Custom Domain: readbuddy.me ]
                         (Claimed Free via GitHub Student Developer Pack)
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
   [ Frontend: Vercel / Cloudflare ]                              [ Backend: Cloud GPU VPS ]
          (Free Global CDN)                                      (Azure T4 / RunPod RTX 3090)
     • Next.js 15 App Router                                        • Caddy / Nginx Reverse Proxy (SSL)
     • Web Audio API (16kHz PCM stream)                             • FastAPI (Uvicorn Async ASGI)
     • Role Dashboards (Student/Teacher/Admin)                      • PyTorch MMS-1B-All CTC (Resident)
     • Automatic HTTPS (Enables Mic Access)                         • Ollama Gemma 3 4B Q4_K_M (Resident)
                 │                                                  • EasyOCR & Document Parsers
                 │                                                             │
                 │                 Secure WebSocket (wss://)                   │
                 └─────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
                                [ Database: Managed PostgreSQL ]
                                 (Azure Flexible / Supabase)
                                  • Relational Schemas & Auth
                                  • Phil-IRI Session Logs
```

---

## 2. GitHub Student Developer Pack Resource Mapping

Leverage the free developer perks included in your GitHub Student Developer Pack to build a production-grade infrastructure at **$0 out-of-pocket cost**:

| Service | GitHub Student Perk | Role in ReadBuddy | Implementation Status |
|---|---|---|---|
| **Namecheap / Name.com** | 1 Free Domain (`.me`, `.live`, `.software`, `.app`) + 1 Free SSL | Primary Custom Domain (`readbuddy.me`) | **Recommended** |
| **Microsoft Azure** | $100 Student Credits + 12 Months Free Services | Cloud GPU VM (`NC4as_T4_v3`) & Managed PostgreSQL | **Recommended** |
| **Termius** | Free Termius Pro (SSH Client) | Remote SSH server management from mobile/laptop | **Recommended** |
| **Testmail.app** | Free Automated Email Mailboxes | Automated testing of Teacher Email Verification (Rule R-17) | **Optional (QA)** |
| **Vercel** | Free Hobby Tier (Unlimited Next.js Edge deployments) | Next.js Frontend Hosting | **Recommended** |
| **Clerk** | Free Pro Tier | *Authentication SaaS* | ❌ **Do Not Use** (Violates Rules R-15, R-16, & R-17 custom schema) |
| **Datadog** | 2 Years Free Pro Tier | *Enterprise APM* | ⚠️ **Optional** (Overkill for basic capstone demo) |

---

## 3. Frontend Deployment (Next.js 15 on Vercel)

Vercel provides native Next.js 15 edge hosting, automatic SSL certificates (required by browsers for microphone access), and continuous deployment from GitHub.

### Step 1: Repository Structure Preparation
ReadBuddy's Next.js application lives inside the `/frontend` subfolder. When configuring Vercel:
- **Framework Preset**: `Next.js`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Step 2: Environment Variables
Configure the following in **Vercel Dashboard → Settings → Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://api.readbuddy.me
NEXT_PUBLIC_WS_URL=wss://api.readbuddy.me/ws/reading
```

### Step 3: Custom Domain & DNS Configuration
1. In Vercel, navigate to **Settings → Domains** and enter `readbuddy.me` or `app.readbuddy.me`.
2. In your DNS manager (Namecheap / Cloudflare), add the `CNAME` record:
   - **Type**: `CNAME`
   - **Name**: `app` (or `@`)
   - **Value / Target**: `cname.vercel-dns.com`

---

## 4. Backend & AI Cloud Hosting (Multi-User Cloud GPU)

Serving multiple concurrent students reading aloud requires **dedicated GPU VRAM** and an async WebSocket server.

### Exact Development / Pilot Hardware Specifications (Researcher's Laptop):
- **Processor**: Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz (6 Cores, 12 Threads)
- **System Memory (RAM)**: 32.0 GB DDR4 (2667 MT/s)
- **Graphics Processing Unit (GPU)**: NVIDIA GeForce RTX 2070 (8GB GDDR6 VRAM, Mobile) + Intel UHD Graphics 630 (Dual GPU)
- **Local Storage**: 238 GB High-Speed NVMe SSD (204 GB used / ~34 GB free)
- **Role in Research**: Development baseline, adapter fine-tuning testbed, and local pilot edge host.

### Why a Single 8GB Laptop Host is Limited for Classroom Deployment:
- With an 8GB GPU, models require **phase-separated sequential loading** (Rule R-5: unloads ASR to load Ollama Gemma 3 4B), restricting concurrent usage to **1 active reading session system-wide**.
- Upgrading to a Cloud GPU VPS with **16GB–24GB VRAM** (or on-premise multi-gigabyte workstation) keeps **both MMS-1B and Gemma 3 4B simultaneously resident in VRAM**, supporting **15–30+ simultaneous student readers**.

---

### Option A: Microsoft Azure GPU VM *(Free using $100 Student Credits)*

#### VM Specification
- **Size**: `Standard_NC4as_T4_v3`
- **GPU**: 1x NVIDIA Tesla T4 (16 GB GDDR6 VRAM)
- **vCPU**: 4 AMD EPYC Cores
- **RAM**: 28 GB System RAM
- **OS**: Ubuntu 22.04 LTS
- **Cost**: ~$0.526/hr (Your $100 student credit yields **~190 hours** of active runtime).

#### Setup Runbook:

1. **Create VM in Azure Portal**:
   - Compute → Virtual Machines → Create → Azure Virtual Machine.
   - Region: `East US` or `Southeast Asia`.
   - Size: `Standard_NC4as_T4_v3`.
   - Inbound Ports: Allow `SSH (22)`, `HTTP (80)`, `HTTPS (443)`.

2. **Install NVIDIA Drivers & Docker** (Connect via Termius):
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y ubuntu-drivers-common
   sudo ubuntu-drivers autoinstall
   
   # Install Docker & Compose
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   
   # Install NVIDIA Container Toolkit
   sudo apt-get install -y nvidia-container-toolkit
   sudo nvidia-ctk runtime configure --runtime=docker
   sudo systemctl restart docker
   ```

3. **Install Ollama & Download Comprehension Model**:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   sudo systemctl enable ollama
   ollama pull gemma3:4b
   ```

4. **Launch Backend Service**:
   ```bash
   git clone https://github.com/<your-username>/readbuddy.git
   cd readbuddy/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r ../requirements.txt
   
   # Start FastAPI with multiple async ASGI workers
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
   ```

> [!TIP]
> **Credit Preservation**: In the Azure Portal, click **Stop (Deallocate)** on the VM when not in use. Only start it during pilot testing or defense presentations.

---

### Option B: RunPod Secure Cloud Pod *(Low-Cost Pay-As-You-Go 24/7 Hosting)*

For continuous 24/7 cloud availability at minimal cost:
- **GPU**: 1x NVIDIA RTX 3090 (24GB VRAM) or RTX 4000 Ada (16GB VRAM).
- **Cost**: **$0.20 – $0.34 / hour** (billed per second).
- **Template**: `RunPod PyTorch 2.1` (pre-installed CUDA 12.1, Python, PyTorch).
- **Benefit**: Zero driver installation needed; connect via Termius SSH in one click.

---

### Option C: School Intranet On-Premise Server *(SMCC Campus Target)*

For the long-term institutional deployment at SMCC:
- **Hardware**: Dedicated Lab PC / Server (Intel i5/i7, 32GB RAM, NVIDIA RTX 3060 12GB or RTX 4060 8GB).
- **Deployment**: Local Docker Compose network.
- **Routing**: Internal school DNS (e.g. `http://readbuddy.smcc.internal`) or local IP subnet routing.
- **Benefits**: Zero monthly cloud fees, ultra-low audio latency over local Wi-Fi, and complete data isolation within campus premises.

---

## 5. Reverse Proxy & SSL Setup (Caddy / Nginx)

Modern web browsers enforce strict security: **Microphone access is blocked unless served over secure HTTPS/WSS**.

Install **Caddy** on your backend VPS for automated, zero-configuration SSL:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

### Configure `/etc/caddy/Caddyfile`:
```caddy
api.readbuddy.me {
    # Reverse proxy HTTP and WebSocket traffic to FastAPI
    reverse_proxy localhost:8000
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```
Caddy will automatically obtain and renew Let's Encrypt SSL certificates for `api.readbuddy.me`.

---

## 6. Multi-User Concurrency & Architecture Adjustments

To enable multiple students to read simultaneously in a classroom:

### 1. Multi-Session WebSocket Management
Ensure `backend/app/routes/reading.py` manages connections per session identifier instead of a single global lock:

```python
# Active WebSocket session registry
active_reading_sessions: dict[str, ReadingSessionState] = {}

@router.websocket("/ws/reading/{session_id}")
async def reading_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session_state = ReadingSessionState(session_id=session_id)
    active_reading_sessions[session_id] = session_state
    try:
        while True:
            data = await websocket.receive_bytes()
            # Process buffered audio chunk for this specific student
            await session_state.process_audio(data, websocket)
    finally:
        active_reading_sessions.pop(session_id, None)
```

### 2. GPU VRAM Allocation with 16GB+ VRAM

With a 16GB+ GPU in the cloud, models do not need to be evicted between phases:

| Model / Service | Resident VRAM | Role |
|---|---|---|
| `facebook/mms-1b-all` (CTC Base) | ~1.5 GB | Real-time speech-to-text |
| `eng` / `tgl` Language Adapters | ~18 MB | Swappable language weights |
| `EasyOCR` (CRAFT + CRNN) | ~1.0 GB | Photo passage extraction |
| `gemma3:4b` (Q4_K_M via Ollama) | ~2.5 GB | Comprehension quiz generation |
| **Total Resident Footprint** | **~5.1 GB** | **Leaves ~10.9 GB VRAM free for batched inference** |

---

## 7. Security, CORS & Authentication Verification

1. **CORS Configuration (`backend/app/main.py`)**:
   ```python
   origins = [
       "https://readbuddy.me",
       "https://app.readbuddy.me",
       "https://readbuddy-frontend.vercel.app",
       "http://localhost:3000",
   ]
   app.add_middleware(
       CORSMiddleware,
       allow_origins=origins,
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **JWT Cookie Policy (Rule R-15)**:
   - In production (`https://`), set `secure=True`, `httponly=True`, and `samesite="lax"` on authentication cookies.

3. **Rule R-2 Compliance**:
   - All transcription (MMS-1B) and comprehension questions (Gemma 3 4B) execute inside your dedicated cloud VPS / local instance. No audio or student text is transmitted to commercial cloud AI APIs.

---

## 8. Pre-Defense Deployment Checklist

- [ ] **Custom Domain**: Domain registered on Namecheap/Name.com and nameservers pointed to DNS manager.
- [ ] **Frontend Deployed**: Vercel project successfully building from `/frontend` directory.
- [ ] **Microphone Permission Verified**: Test reading flow on mobile Safari/Chrome to confirm HTTPS mic permissions.
- [ ] **Backend GPU Running**: `nvidia-smi` confirms GPU recognition and `ollama list` confirms `gemma3:4b`.
- [ ] **WebSocket Connectivity**: Verify real-time word-by-word CTC coloring connects over `wss://api.readbuddy.me/ws/reading`.
- [ ] **PostgreSQL Connected**: Database tables migrated via Alembic / SQLAlchemy async engine.
- [ ] **Teacher Email Verification**: SMTP credentials configured in `.env` for transactional teacher registration emails.
