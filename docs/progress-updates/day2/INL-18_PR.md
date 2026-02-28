# INL-18: Technical Review — Welcome Pack Download + Lease Read Endpoints

**Ticket:** INL-18 — Build Welcome Pack download endpoint (GET /api/welcome-pack/download)
**Date:** 2026-02-28
**Status:** Implemented and tested

---

## 1. Three New Endpoints

This ticket adds the read layer the frontend needs — download a Welcome Pack, browse upload history, and view a single upload's details.

### `GET /api/welcome-pack/download/{upload_id}`
New router in `routers/welcome_pack.py`. Security uses a double-check pattern:
1. Look up `lease_uploads` by `upload_id` + `user_id` from JWT — 404 if the lease doesn't exist or belongs to another user
2. Look up `welcome_packs` by `lease_upload_id` — 404 if no pack has been generated yet
3. Download file bytes from Supabase Storage `welcome-packs` bucket
4. Return a `Response` with the correct Content-Type and Content-Disposition headers

The endpoint uses `upload_id` as the path parameter (not `pack_id`) because that's what the frontend receives from the upload response and stores in state. The `welcome_packs` table is an internal lookup.

### `GET /api/lease/history`
Added to the existing `routers/lease.py`. Calls `db.list_lease_uploads(user_id)` which already performs a Supabase join across `lease_uploads`, `extracted_data`, and `welcome_packs`. Returns a list of `LeaseHistoryItem` objects with:
- `upload_id`, `file_name`, `status`, `created_at`
- `tenant_name` and `property_address` (pulled from the joined `extracted_data`)
- `has_welcome_pack` boolean (for conditional download button in the UI)

Results are ordered most-recent-first (handled by the existing `list_lease_uploads` query).

### `GET /api/lease/{upload_id}`
Added to `routers/lease.py`. Returns a `LeaseDetailResponse` with full upload metadata, all extracted fields, and a **fresh signed download URL** for the Welcome Pack (5-minute expiry). This endpoint is what the frontend will call after a successful upload to display results.

---

## 2. Bug Found and Fixed: Supabase 1:1 Join Shape

During testing, `has_welcome_pack` was always `False` even for uploads with a Welcome Pack.

**Root cause:** The `welcome_packs` table has a UNIQUE constraint on `lease_upload_id`, making it a 1:1 relationship. Supabase returns 1:1 joins as a **dict** (or `None`), not a list. The original code checked `isinstance(welcome_packs, list)`, which was always `False`.

**Fix:** Simplified to `bool(upload.get("welcome_packs"))` — truthy if dict exists, falsy if `None`. Same fix applied to the `extracted_data` join which had the same incorrect assumption but was accidentally working.

---

## 3. Response Models

Two new Pydantic models in `models/api.py`:

**`LeaseHistoryItem`** — lightweight model for the history list:
- `upload_id`, `file_name`, `status`, `created_at`
- `tenant_name: str | None` and `property_address: str | None` (may not exist if extraction failed)
- `has_welcome_pack: bool`

**`LeaseDetailResponse`** — full model for single upload view:
- All upload fields + `error_message` (for failed uploads)
- `extracted_data: dict | None` (all 14 fields, excluding internal fields like `raw_ai_response`)
- `welcome_pack_url: str | None` (fresh signed URL)

---

## 4. Supabase Service Addition

One new helper in `services/supabase.py`:

```python
def download_welcome_pack_file(file_path: str) -> bytes
```

Mirrors the existing `download_lease_file()` but reads from the `welcome-packs` bucket instead of `leases`.

---

## 5. Test Results

| Test | Endpoint | Result |
|------|----------|--------|
| History list | `GET /api/lease/history` | 200 — 39 items, `has_welcome_pack=True` for completed uploads |
| Single detail | `GET /api/lease/{upload_id}` | 200 — full extracted data + signed Welcome Pack URL |
| Download | `GET /api/welcome-pack/download/{upload_id}` | 200 — 9,375 bytes, correct Content-Type and Content-Disposition |
| Bad upload_id | `GET /api/lease/{bad_id}` | 404 — as expected |
| No auth | `GET /api/lease/history` (no token) | 403 — as expected |

---

## 6. Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `routers/welcome_pack.py` | Created | Download endpoint with auth + ownership check |
| `routers/lease.py` | Modified | Added history + detail endpoints, fixed 1:1 join handling |
| `models/api.py` | Modified | Added LeaseHistoryItem + LeaseDetailResponse |
| `services/supabase.py` | Modified | Added download_welcome_pack_file() |
| `main.py` | Modified | Registered welcome_pack router |
