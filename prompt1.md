You are Claude Code, acting as my senior AI pair programmer and project planner.

I am completing a 7‑day take‑home for **InLogic | AI Software Consulting**. The project is an AI‑powered document processing web app for a fictional client, **Acme Property Group** (200+ rentals in Melbourne).

The full brief is stored in this workspace as **`spec_sheet.pdf`**. That file is the **single source of truth** for all requirements, constraints, and evaluation criteria. You must load and reference `spec_sheet.pdf` throughout this session whenever you need details or clarification, instead of guessing.

In this session, your job is to:

1. **Deeply understand `spec_sheet.pdf`**
2. **Propose an architecture and directory structure**
3. **Draft a comprehensive, implementation‑ready PRD**
4. **Create a fully planned Linear board via MCP with detailed tickets**
5. **Plan how we’ll use AI + tools during implementation in a way that will look good in my exported AI chat logs**

---

## 0. Environment, stack & constraints

Facts about my setup (treat these as hard constraints unless they directly conflict with the brief):

- **Project management**
  - I am connected to **Linear** via MCP.
  - You can create and modify Linear issues/tickets directly via the Linear MCP.

- **Tech stack (use this unless the brief explicitly forbids something)**
  - **Backend**
    - Language: **Python**
    - Framework: **FastAPI**
    - Database: **Supabase** (Postgres) on free tier
    - Auth: **Supabase Auth**
    - Responsibilities: business logic, API surface, integration with Supabase and external AI APIs, document handling.
  - **Frontend**
    - Language: **TypeScript**
    - Framework: **React**
    - Styling: **Tailwind CSS**
    - Component library: **shadcn/ui**
    - Animation / polish: **Framer Motion**
    - For UI/UX planning and component design, use the **Claude Frontend Design plugin**.
  - **AI**
    - Use **free‑tier APIs only** (as required by the brief).
    - Primary models: **Gemini** and/or **Mistral OCR** for:
      - Lease PDF/DOCX ingestion
      - OCR / text extraction
      - Structured information extraction for the 14 required fields
      - Drafting content for the Tenant Welcome Pack if needed.
    - You should:
      - Decide which model to use where,
      - Justify choices briefly in the PRD,
      - Design prompts and validation strategies.
  - **Document output**
    - Must generate **Word (.docx)** Tenant Welcome Packs by filling the provided template’s `{{placeholder}}` markers.
  - **Database / storage**
    - Use **Supabase** (free tier) to store:
      - Extracted field data
      - Upload history
      - References/paths to generated Welcome Pack files.
  - **Hosting / infra**
    - App must be deployed at a **publicly accessible URL**.
    - Use **Vercel** for hosting the frontend and, if appropriate, the backend, or propose a sensible split that still respects “any free deployment service” from the brief.
  - **Source code**
    - Code will live in a **Git repository (GitHub)** with a meaningful commit history.

- **Process & evaluation (non‑technical but important)**
  - Duration: **7 days** from receipt of the brief.
  - They strongly care about:
    - **Extraction accuracy** for all **14 fields** across all **5 sample leases**, including variations like:
      - Joint tenancy with two tenant names
      - Different date formats
      - Monthly vs fortnightly rent
      - Pet clauses with conditions
      - Parking details
      - Presence/absence of special conditions
    - **Document generation quality**:
      - Correct replacement of all placeholders in the Tenant Welcome Pack template
      - Proper omission of the **Special Conditions** section when no special conditions exist (no “None”/“Nil” heading).
    - **Deployment reliability**: app must be working at the public URL.
    - **Supabase usage**: schema quality, how file storage is handled.
    - **Code quality**: clear structure, sensible naming, reasonable architecture.
    - **Communication**:
      - 3–4+ **daily progress updates** over the week via email, each with:
        - A short Loom video (2–5 minutes) demoing progress
        - A written summary.
    - **AI tool usage**:
      - They will read all exported chat logs from tools like Cursor, Claude Code, ChatGPT, etc.
      - They’re looking at how I prompt, break down problems, iterate, and catch/correct AI mistakes.

Design the plan, PRD, and tickets so they naturally support those evaluation criteria.

---

## 1. Load and interpret `spec_sheet.pdf`

Immediately:

1. Load and carefully read **`spec_sheet.pdf`** in full.
2. Based strictly on the brief:
   - Summarize the **core product requirements**, especially:
     - End‑to‑end flow:
       1. Upload signed lease agreement (**PDF or DOCX**)
       2. Extract the required **14 fields** using AI
       3. Populate the Tenant Welcome Pack **.docx template** using placeholders
       4. Serve the generated document to the user (download and/or view)
   - List all **14 fields** and any notes/edge cases given in the brief (e.g., joint tenants, variable date formats, conditional special conditions section, etc.).
   - Identify all **explicit constraints** (backend required tech, database, AI limitations, hosting, submission requirements).
   - Identify any **implied requirements** (e.g., usability, simple UI for lease upload, some notion of history).
3. List any **ambiguities or missing details** from the brief and formulate clear, concise questions we would hypothetically send to InLogic to clarify them.

Do **not** create tickets or code yet. Stay in the understanding/clarification phase. Whenever you are unsure about behavior, you must re‑consult `spec_sheet.pdf` before proposing assumptions.

---

## 2. Propose architecture & directory structure

Once I confirm your understanding:

1. Propose a **high‑level architecture** that:
   - Satisfies all explicit requirements in `spec_sheet.pdf`.
   - Uses the stack specified in section 0.
   - Shows:
     - How the frontend (React/TS) interacts with the backend (FastAPI).
     - How the backend uses Supabase for:
       - Auth (Supabase Auth)
       - Data schema (tables for leases, extracted fields, welcome packs, upload history, etc.)
       - File storage for uploaded leases and generated .docx files.
     - How AI calls (Gemini/Mistral OCR) are orchestrated to:
       - Ingest PDF/DOCX leases
       - Extract the 14 fields robustly across formatting variations
       - Generate any natural language content needed for the Tenant Welcome Pack.
2. Define a **clear directory structure**, for example:

   - `/frontend` – React + TypeScript app (Tailwind, shadcn/ui, Framer Motion)
   - `/backend` – FastAPI app with routers, models, services, and integration clients
   - `/shared` – (optional) shared types/interfaces
   - `/infra` – deployment configs (e.g. Vercel, CI)
   - `/docs` – PRD, architecture notes, AI usage log, etc.

3. For each major component (frontend, backend, AI integration, DB), describe:
   - Responsibilities
   - Main data flows
   - Error handling and basic logging approach
   - How we keep things simple enough for a 7‑day take‑home while still looking professional.

Ensure this architecture is **explicitly tied back** to requirements from `spec_sheet.pdf` (e.g., why it supports DOCX output, how it ensures Special Conditions behavior is correct, etc.).

---

## 3. Draft a comprehensive PRD

Using `spec_sheet.pdf` as the authoritative reference and the agreed architecture, draft an **implementation‑ready PRD** with sections like:

1. **Overview**
   - Brief description of Acme’s problem and the target outcome.
   - Scope of this take‑home (what is in vs out of scope, given 7 days).

2. **User Roles & Stories**
   - Assume at minimum a “Property Manager/Operations staff” role.
   - For each role, define user stories grounded in the brief, such as:
     - Uploading a lease (PDF/DOCX) and receiving a correctly populated Tenant Welcome Pack.
     - Viewing upload history and extracted data.
   - Ensure flows explicitly include:
     - Handling multiple tenants
     - Different date formats
     - Different rent frequencies
     - Optional special conditions and parking/pet clauses.

3. **Functional Requirements**
   - Detailed requirements for:
     - File upload (PDF and DOCX)
     - AI‑based extraction of the 14 fields
     - Validation/review UI (if any) before generating the Welcome Pack
     - DOCX template population and download
     - Supabase‑backed storage of:
       - Leases
       - Extracted records
       - Generated packs
       - Basic history / audit trail.
   - Acceptance criteria in bullet form that can be turned directly into Linear ticket criteria.

4. **Non‑Functional Requirements**
   - Performance expectations reasonable for a small prototype (e.g., single user flows, not heavy concurrency).
   - Reliability and error handling (what happens when extraction fails, AI is unavailable, or the doc is malformed).
   - Security basics:
     - Auth with Supabase
     - Restricting access to a user’s data
     - Handling potentially sensitive personal information in leases.

5. **Data Model & Supabase Schema**
   - Entities and relationships (e.g., User, Lease, ExtractedLeaseData, TenantWelcomePack, maybe Property, etc.).
   - Fields for all 14 required items; design choices for representing frequencies, dates, etc.
   - Schema mapped to Supabase Postgres tables and storage buckets.

6. **API Design (FastAPI)**
   - List key endpoints with:
     - Method, path, summary
     - High‑level request/response shapes
     - Where authentication is required.
   - Mark endpoints that:
     - Handle file upload
     - Trigger AI extraction
     - Create or fetch generated Welcome Packs.

7. **AI Design**
   - For each AI‑related task, specify:
     - Which model (Gemini vs Mistral OCR, possibly in combination).
     - Prompting approach, including:
       - Asking for robust JSON that maps directly to the 14 fields.
       - Handling missing sections (especially Special Conditions: omit the section in the output template when none exist).
     - Strategies for:
       - Detecting uncertainty or partial extraction
       - Allowing user correction if time permits.

8. **Frontend UX / UI**
   - Key screens:
     - Sign in / basic auth
     - Dashboard/home
     - Lease upload + progress/feedback
     - Extraction results and confirmation (if implemented)
     - Download/view Welcome Pack, and minimal history.
   - For UI tickets, specify that we’ll later use the **Claude Frontend Design plugin** to:
     - Sketch layouts, component structures
     - Suggest shadcn components and Tailwind classes
     - Add subtle Framer Motion animations to make the app feel polished without over‑engineering.

9. **Deployment & Ops**
   - Plan for hosting on Vercel (frontend + possibly backend) while satisfying the brief’s “any free deployment service” requirement.
   - Handling environment variables (AI keys, Supabase keys).
   - Basic checks to ensure the deployed URL will be working when InLogic tests it.

---

## 4. Translate PRD into Linear tickets via MCP

After the PRD is drafted and I approve it:

1. Define an **epic/milestone structure** in Linear, for example:
   - EPIC: Project setup & environment
   - EPIC: Supabase schema & auth
   - EPIC: AI‑powered lease extraction
   - EPIC: Tenant Welcome Pack generation (.docx)
   - EPIC: Frontend UX & polish
   - EPIC: Deployment, testing & submission materials

2. For each epic, use the **Linear MCP** to create issues/tickets with:

   - **Title**
   - **Description** including:
     - Direct references to relevant PRD sections
     - Stack constraints (FastAPI, Supabase, React/TS, Tailwind, shadcn, Framer Motion)
     - AI and template requirements taken from `spec_sheet.pdf`.
   - **Acceptance criteria** written in bullet points, concrete and testable.
   - **Implementation notes**, such as:
     - Suggested files/directories to create or modify
     - When to call AI models
     - For frontend tickets: reminders to use the Claude Frontend Design plugin.

3. Order tickets into a **sensible execution sequence**, such as:

   1. Repo + basic tooling + skeleton apps
   2. Supabase setup (schema, storage, auth)
   3. Backend endpoints for upload + AI extraction
   4. DOCX generation pipeline using the provided template
   5. Frontend integration and UX
   6. Polishing extraction accuracy and handling edge cases from the 5 sample leases
   7. Deployment to Vercel and smoke testing
   8. Work items related to communication / submission materials (e.g., daily update structure, final write‑up checklist).

When creating tickets, **actually call the Linear MCP** instead of only describing hypothetical tickets. Also output a human‑readable list of the tickets you created so I can quickly review the structure.

---

## 5. AI usage logging & submission‑specific planning

Because the brief requires **exported AI chat logs** and multiple **daily progress updates**, also:

1. Propose a simple **logging/documentation strategy**, e.g.:
   - `/docs/ai-log.md` to summarize:
     - Which tools were used on which tickets
     - Key prompts and iterations
     - Notable mistakes and how they were caught/fixed.
   - `/docs/progress-updates/` folder with template notes for:
     - “Day X – Date”
     - What I completed
     - Challenges
     - How I used AI
     - Next steps
2. Suggest how to structure my future prompts to you during implementation so that:
   - The logs look thoughtful and systematic when InLogic reads them.
   - It’s clear that I understand the stack and I’m using AI as leverage, not as a crutch.

---

## 6. How to respond in this session

In this planning session:

1. Step 1: **Read `spec_sheet.pdf`**, then:
   - Summarize the brief and list clarifying questions.
2. Step 2: After I respond to/accept your assumptions, propose the **architecture & directory structure**.
3. Step 3: Draft the **full PRD**.
4. Step 4: Once I approve, create the **Linear epics and issues via MCP** and show me:
   - The epic structure
   - The tickets with titles and acceptance criteria.

Do **not** start writing project code in this session. Focus on planning, PRD, and ticket creation, while continuously referring back to `spec_sheet.pdf` to stay aligned with the brief.