Day 2 – 2026-02-28

What I completed:
- Completed Epic 3 (AI Extraction Pipeline): INL-15 (upload endpoint), INL-16 (extraction benchmark — 69/70 initially), INL-30 (prompt refinement — 70/70 perfect score)
- Completed Epic 4 (Welcome Pack): INL-17 (docgen service with run-splitting-safe replacement), INL-18 (download + history + detail endpoints), INL-19 (Welcome Pack benchmark — 39/39 checks), INL-31 (rent normalization — fortnightly ×2.17262, weekly ×4.35 to monthly)
- Completed Epic 5 (Frontend UX & Polish): INL-32 (scaffold + design system + Paper.design MCP), INL-33 (auth pages with particle background, spring-physics cursor trail, liquid glass card), INL-23 (app shell with glass navbar, layoutId nav indicator, route transitions), INL-21 (upload page — drag-drop, 4-stage processing, 14-field results grid), INL-20 (dashboard — live API stats, recent uploads, empty state), INL-22 (history page — animated table, status badges, downloads)
- Completed Epic 6 (Deployment): INL-35 (lease detail page at /history/:uploadId), INL-34 (closed — absorbed into INL-20/22), INL-25 (Railway backend deployment with Dockerfile, configurable template path, multi-origin CORS), INL-26 (Vercel frontend deployment with SPA routing fix), INL-27 (full E2E smoke test passed on deployed app)
- Design-first workflow: created 8 Paper.design artboards (Login, Sign Up, App Shell, Upload ×3, History, Lease Detail) before writing any frontend code

Challenges:
- AnimatePresence mode="wait" conflicted with React Router's Outlet pattern — caused double render flash on navigation. Fixed by removing AnimatePresence from the shell and letting each page handle its own entrance animation via motion.div
- Dockerfile multi-stage venv shebang mismatch — venv scripts had hardcoded #!/build/venv/bin/python shebangs that broke when copied to /app/venv in the production stage. Fixed by dropping the venv entirely and installing deps globally (container IS the isolation)
- Docker COPY with spaces in filename — backslash escaping failed on Railway's builder. Fixed by using JSON array form: COPY ["src with spaces", "dest"]
- Vercel 404 on page refresh — SPA client-side routing needs all paths to serve index.html. Fixed with vercel.json rewrites
- Template path hardcoded as ../../../../ relative chain — fragile across local vs Docker environments. Fixed with TEMPLATE_PATH env var and sensible local default via pydantic-settings
- Gemini occasionally paraphrased special conditions text — refined prompt with explicit "copy verbatim" instruction to achieve 70/70 extraction accuracy

How I used AI:
- Claude Code (Opus 4.6) for the entire session: all implementation, debugging, deployment, and documentation
- Paper.design MCP integration for design-first UI workflow — created mockups, reviewed via screenshots, iterated before writing code
- Linear MCP for real-time ticket management — status updates, description edits, ticket creation all from the CLI
- Key workflow: read ticket → present plan → user approval → design in Paper.design → user review → implement in codebase → build verification → create PR doc → user approval → commit with [INL-XX] prefix → push → mark Done on Linear
- Claude handled: particle system with cursor attraction (rAF + 80 particles), spring-physics cursor trail (10 segments), liquid glass card (iOS 26-inspired), glassmorphism app shell, all 4 page implementations, Dockerfile creation and debugging, Vercel/Railway deployment config
- I directed: design aesthetic decisions, approval gates at every commit, deployment platform setup (Railway/Vercel/Supabase dashboards), E2E manual testing

Day 2 summary: 18 tickets completed + 1 closed across 4 epics. Full backend pipeline tested and benchmarked (70/70 extraction, 39/39 Welcome Packs). Complete frontend with 5 pages (auth, dashboard, upload, history, detail), animated particle backgrounds, glassmorphism UI, and Framer Motion throughout. Deployed to Railway (backend) + Vercel (frontend) with E2E smoke test passed.

Remaining steps:
- INL-28: Finalize progress updates and AI usage log
- INL-29: Final write-up (approach, trade-offs, what I'd do differently), chat log export, submission checklist verification
- Record Loom walkthrough video
- Final submission
