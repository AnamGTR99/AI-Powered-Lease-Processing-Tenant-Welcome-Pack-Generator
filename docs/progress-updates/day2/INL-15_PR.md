# INL-15: Technical Review — Lease Upload + Extraction Endpoint

**Ticket:** INL-15 — Build lease upload + extraction endpoint (POST /api/lease/upload)
**Date:** 2026-02-28
**Status:** Implemented and manually verified

---

## 1. Service Pattern: Decoupling Business Logic from the Route

The core design decision for this endpoint was adopting a **Service Pattern** to separate HTTP concerns from pipeline orchestration.

### Router (`routers/lease.py`) — 60 lines
The router is intentionally thin. Its only responsibilities are:
- Accepting the `UploadFile` from the multipart/form-data request
- Extracting the file extension to determine file type
- Reading file bytes from the upload stream
- Delegating to `LeaseService.process_lease()`
- Mapping `LeaseProcessingError` exceptions to the correct HTTP status codes (422 for invalid type, 413 for size limit, 500 for pipeline failures)

The router knows nothing about Supabase, text extraction, Gemini, or the pipeline stages. It doesn't import any of those services.

### Service (`services/lease_service.py`) — 180 lines
`LeaseService` is a class with a single public method `process_lease(user_id, file_name, file_bytes, file_type)` that orchestrates the full pipeline end-to-end. It:
- Validates input (file type + size)
- Calls the Supabase service client for storage and DB operations
- Calls `extract_text()` for local text extraction
- Calls `extract_fields()` for Gemini AI extraction
- Manages status transitions at each stage
- Catches and wraps all exceptions with stage context

### Why this matters
- **Testability**: The service can be unit tested independently of FastAPI (no need to mock HTTP requests)
- **Extensibility**: When INL-17 (docgen) is implemented, it wires into the service — the router doesn't change at all
- **Readability**: The router reads like an API contract, the service reads like a pipeline specification

---

## 2. Atomic Status Updates

Every stage of the pipeline updates `lease_uploads.status` in Supabase before proceeding. This provides full observability into where a request is in the pipeline, and critically, where it failed.

### Status progression
```
[validation] → uploaded → extracting → extracted
                                         ↓
                              (future: generating → complete)
```

### Implementation detail
Each stage follows the same pattern:
1. Update status in Supabase via `db.update_lease_status(upload_id, user_id, new_status)`
2. Log the stage entry with `logger.info()`
3. Execute the stage work
4. Log completion with timing (`time.time()` delta)

### Failure handling
If any stage throws an exception:
1. The outer `try/except` catches it
2. If an `upload_id` exists (i.e., the DB record was created), status is set to `"failed"` with `error_message` containing the exception text
3. The status update itself is wrapped in a secondary `try/except` so a Supabase failure during error reporting doesn't mask the original error
4. A `LeaseProcessingError` is raised with the stage name, which the router maps to the appropriate HTTP response

### What this enables
- If a user reports a stuck upload, we can query `lease_uploads` to see exactly which stage it reached
- The `error_message` field contains the specific exception — e.g., "Gemini API returned invalid JSON" vs "Supabase Storage upload failed"
- The frontend can display stage-specific feedback (to be built in INL-21)

---

## 3. Changes from Initial Approach

### Pydantic upgrade (2.10.4 → 2.12.1)
Upgraded both `pydantic` and `pydantic-settings` to the latest v2.12 release. No breaking changes — our `ExtractedLeaseData` model and `Settings` class work identically. The upgrade was made to stay current on a new project.

### Terminal state: `extracted` instead of `complete`
The original ticket described the pipeline going all the way to `complete` with Welcome Pack generation. We decided to defer the docgen step to INL-17 and set `extracted` as the terminal state for now. This means:
- The response currently omits `welcome_pack_url`
- When INL-17 is implemented, the service gains two more stages (`generating → complete`) and the response adds `welcome_pack_url`
- No changes to the router will be needed — only the service

### Two-phase file path
The Supabase service client requires `upload_id` to construct the storage path (`{user_id}/{upload_id}/{filename}`), but we don't have the `upload_id` until after the DB record is created. Solution: create the record with a placeholder path, upload the file, then update the record with the real storage path. This avoids needing to predict the UUID.

---

## 4. Validation Results

### Happy path (Sarah Chen DOCX)
- **HTTP response**: 200 OK with all 14 fields
- **Pipeline time**: ~7 seconds
- **Supabase `lease_uploads`**: status = `'extracted'`, error_message = `None`
- **Supabase `extracted_data`**: all 14 fields populated, `special_conditions` is true JSON null (`NoneType`, not string `"null"` or `"None"`)
- **Storage**: file uploaded to correct path `{user_id}/{upload_id}/{filename}`

### Error paths
- **Invalid file type (.txt)**: 422 — `"Invalid file type 'txt'. Only PDF and DOCX are accepted."`
- **No auth token**: 403 — `"Not authenticated"`
- **Validation errors do not create DB records** (validation runs before the DB insert)

### Critical null check
`special_conditions` verified in the database as:
- `type(sc).__name__` = `NoneType`
- `sc is None` = `True`
- `sc == "null"` = `False`
- `sc == "None"` = `False`

This confirms the normalization chain (Gemini → `_parse_llm_response` → Pydantic → Supabase) preserves true null end-to-end, which is critical for the template section removal logic in INL-17.

---

## 5. Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `services/lease_service.py` | Created | LeaseService class — pipeline orchestration |
| `routers/lease.py` | Created | Thin router — HTTP layer only |
| `models/api.py` | Created | LeaseUploadResponse + ErrorResponse models |
| `main.py` | Modified | Registered lease router |
| `requirements.txt` | Modified | pydantic 2.10.4→2.12.1, pydantic-settings 2.7.1→2.8.1 |
