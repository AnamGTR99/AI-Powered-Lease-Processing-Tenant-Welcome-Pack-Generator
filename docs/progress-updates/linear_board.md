 Linear Board: Acme Property Group - Lease Processor                                                                                                       
   
  Epic 1: Project Setup & Environment                                                                                                                       
                                                            
  ┌────────┬──────────────────────────────────────────────────────────────────┬──────────┐
  │ Ticket │                              Title                               │ Priority │
  ├────────┼──────────────────────────────────────────────────────────────────┼──────────┤
  │ INL-5  │ Initialize Git repo and monorepo structure                       │ Urgent   │
  ├────────┼──────────────────────────────────────────────────────────────────┼──────────┤
  │ INL-6  │ Scaffold frontend app (Vite + React + TS + Tailwind + shadcn/ui) │ Urgent   │
  ├────────┼──────────────────────────────────────────────────────────────────┼──────────┤
  │ INL-7  │ Scaffold backend app (FastAPI + project structure)               │ Urgent   │
  └────────┴──────────────────────────────────────────────────────────────────┴──────────┘

  Epic 2: Supabase Schema & Auth

  ┌────────┬────────────────────────────────────────────────────────────────────┬──────────┐
  │ Ticket │                               Title                                │ Priority │
  ├────────┼────────────────────────────────────────────────────────────────────┼──────────┤
  │ INL-8  │ Set up Supabase project, database schema, and storage buckets      │ Urgent   │
  ├────────┼────────────────────────────────────────────────────────────────────┼──────────┤
  │ INL-9  │ Implement backend auth middleware (JWT verification)               │ Urgent   │
  ├────────┼────────────────────────────────────────────────────────────────────┼──────────┤
  │ INL-10 │ Implement Supabase service client (DB + Storage operations)        │ High     │
  ├────────┼────────────────────────────────────────────────────────────────────┼──────────┤
  │ INL-11 │ Implement frontend auth (login, signup, session, protected routes) │ High     │
  └────────┴────────────────────────────────────────────────────────────────────┴──────────┘

  Epic 3: AI-Powered Lease Extraction

  ┌────────┬───────────────────────────────────────────────────────────────────┬──────────┐
  │ Ticket │                               Title                               │ Priority │
  ├────────┼───────────────────────────────────────────────────────────────────┼──────────┤
  │ INL-12 │ Implement DOCX text extraction service (python-docx)              │ Urgent   │
  ├────────┼───────────────────────────────────────────────────────────────────┼──────────┤
  │ INL-13 │ Implement PDF text extraction service (Mistral OCR)               │ Urgent   │
  ├────────┼───────────────────────────────────────────────────────────────────┼──────────┤
  │ INL-14 │ Implement Gemini structured field extraction (14 fields)          │ Urgent   │
  ├────────┼───────────────────────────────────────────────────────────────────┼──────────┤
  │ INL-15 │ Build lease upload + extraction endpoint (POST /api/lease/upload) │ Urgent   │
  ├────────┼───────────────────────────────────────────────────────────────────┼──────────┤
  │ INL-16 │ Test extraction accuracy against all 5 sample leases              │ Urgent   │
  └────────┴───────────────────────────────────────────────────────────────────┴──────────┘

  Epic 4: Welcome Pack Generation

  ┌────────┬───────────────────────────────────────────────────────────────┬──────────┐
  │ Ticket │                             Title                             │ Priority │
  ├────────┼───────────────────────────────────────────────────────────────┼──────────┤
  │ INL-17 │ Implement Welcome Pack .docx generation service (python-docx) │ Urgent   │
  ├────────┼───────────────────────────────────────────────────────────────┼──────────┤
  │ INL-18 │ Build Welcome Pack download endpoint                          │ High     │
  ├────────┼───────────────────────────────────────────────────────────────┼──────────┤
  │ INL-19 │ Test Welcome Pack output for all 5 leases                     │ Urgent   │
  └────────┴───────────────────────────────────────────────────────────────┴──────────┘

  Epic 5: Frontend UX & Polish

  ┌────────┬─────────────────────────────────────────────────────────────┬──────────┐
  │ Ticket │                            Title                            │ Priority │
  ├────────┼─────────────────────────────────────────────────────────────┼──────────┤
  │ INL-20 │ Build Dashboard page (home, stats, recent uploads)          │ High     │
  ├────────┼─────────────────────────────────────────────────────────────┼──────────┤
  │ INL-21 │ Build Upload page (drag-drop, processing feedback, results) │ Urgent   │
  ├────────┼─────────────────────────────────────────────────────────────┼──────────┤
  │ INL-22 │ Build History page (upload list, download links)            │ High     │
  ├────────┼─────────────────────────────────────────────────────────────┼──────────┤
  │ INL-23 │ Build app layout (header, navigation, responsive shell)     │ High     │
  ├────────┼─────────────────────────────────────────────────────────────┼──────────┤
  │ INL-24 │ Add Framer Motion animations and final UI polish            │ Medium   │
  └────────┴─────────────────────────────────────────────────────────────┴──────────┘

  Epic 6: Deployment, Testing & Submission

  ┌────────┬───────────────────────────────────────────────────────────┬──────────┐
  │ Ticket │                           Title                           │ Priority │
  ├────────┼───────────────────────────────────────────────────────────┼──────────┤
  │ INL-25 │ Deploy backend to Railway                                 │ Urgent   │
  ├────────┼───────────────────────────────────────────────────────────┼──────────┤
  │ INL-26 │ Deploy frontend to Vercel                                 │ Urgent   │
  ├────────┼───────────────────────────────────────────────────────────┼──────────┤
  │ INL-27 │ End-to-end smoke test on deployed app                     │ Urgent   │
  ├────────┼───────────────────────────────────────────────────────────┼──────────┤
  │ INL-28 │ Set up daily progress update structure and AI log         │ High     │
  ├────────┼───────────────────────────────────────────────────────────┼──────────┤
  │ INL-29 │ Final write-up, chat log export, and submission checklist │ Urgent   │
  └────────┴───────────────────────────────────────────────────────────┴──────────┘

  Execution Order (dependency chain)

  INL-5 (repo init)
    ├→ INL-6 (frontend scaffold) ──→ INL-11 (frontend auth)
    └→ INL-7 (backend scaffold) ──┐
                                   ├→ INL-9 (auth middleware)
       INL-8 (Supabase setup) ────┤
                                   └→ INL-10 (Supabase client)
                                          │
       INL-12 (DOCX extraction) ──────────┤
       INL-13 (PDF extraction) ───────────┤
       INL-14 (Gemini extraction) ────────┤
                                          ▼
                                   INL-15 (upload endpoint)
                                          │
                                   INL-17 (docgen service)
                                          │
                                   INL-16 + INL-19 (testing)
                                          │
                           INL-20-24 (frontend pages + polish)
                                          │
                                INL-25 + INL-26 (deploy)
                                          │
                                   INL-27 (E2E test)
                                          │
                                INL-28 + INL-29 (submission)

  25 tickets across 6 epics. That completes Step 4.

  Steps 1-4 from prompt1.md are now done — understanding, architecture, PRD, and Linear board. Step 5 (AI usage logging strategy) is covered in PRD Section
  10 and ticket INL-28.

  Ready to start implementation when you are.