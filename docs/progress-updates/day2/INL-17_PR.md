# INL-17: Technical Review — Welcome Pack .docx Generation Service

**Ticket:** INL-17 — Implement Welcome Pack .docx generation service (python-docx)
**Date:** 2026-02-28
**Status:** Implemented and smoke tested

---

## 1. Document Generation Service (`services/docgen.py`)

### PLACEHOLDER_MAP
A clean dictionary at the top of the file maps extracted field names to template placeholder strings. This is the single source of truth for the field-to-placeholder mapping and cleanly handles the naming discrepancy where our DB field `parking` maps to the template's `{{parking_included}}`.

```python
PLACEHOLDER_MAP = {
    "tenant_name": "{{tenant_name}}",
    "parking": "{{parking_included}}",  # template uses different name
    ...
}
```

### Run-Splitting-Safe Replacement
python-docx stores text in XML "runs" within a paragraph. A single placeholder like `{{tenant_name}}` can be split across multiple runs (e.g. `{{`, `tenant_name`, `}}`), making naive `run.text.replace()` fail silently.

The replacement function (`_replace_in_paragraph`) handles this:
1. Concatenates all run text in the paragraph to get the full string
2. Finds the placeholder in the concatenated text
3. Maps the character positions back to the individual runs
4. Puts the replacement text in the first affected run
5. Clears the placeholder portions from remaining affected runs

Formatting is preserved because the replacement text inherits the font, color, size, and bold properties of the first run containing the placeholder. This means:
- Placeholders in paragraphs (bold #C0392B) get replaced with text that keeps the same run formatting
- Placeholders in table cells (no special formatting) get replaced cleanly
- The template's branding colors (#1B4F72 headings, #C0392B placeholders) are never disrupted

### Table Cell Replacement
The same `_replace_in_paragraph` function is reused for table cells by iterating: `table → row → cell → paragraph → runs`. This covers all 3 tables in the template:
- Table 0: Lease at a Glance (9 placeholders)
- Table 1: Key Contacts (3 placeholders)
- Table 2: Rent Payment (1 compound placeholder: `{{tenant_name}} — {{property_address}}`)

---

## 2. Special Conditions Section Removal

When `special_conditions` is `None`, the service removes both paragraphs from the document XML in reverse order:
- P[12] (the `{{special_conditions}}` placeholder) — removed first
- P[11] (the "Special Conditions" heading) — removed second

Reverse order is critical: removing P[11] first would shift P[12] to index 11, causing the wrong paragraph to be removed.

This removal happens **before** any placeholder replacement, so paragraph indices are still at their original template positions.

The removal is physical — the XML elements are removed from the tree via `para._element.getparent().remove(para._element)`. The paragraphs are not just emptied or hidden.

---

## 3. Pipeline Integration (`services/lease_service.py`)

The LeaseService pipeline was extended from 4 stages to 6:

```
uploaded → extracting → extracted → generating → complete
```

### New stages
- **Stage 5 (generating)**: Calls `generate_welcome_pack(extracted)`, uploads the .docx bytes to Supabase Storage via `db.upload_welcome_pack_file()`, saves a `welcome_packs` DB record via `db.save_welcome_pack()`
- **Stage 6 (complete)**: Sets terminal status, generates a signed download URL via `db.get_welcome_pack_download_url()`

### File naming
Generated files are named `Welcome_Pack_{tenant_name}.docx` with spaces replaced by underscores. E.g. `Welcome_Pack_David_Okafor.docx`.

### Response update
The API response now includes `welcome_pack_url` — a signed Supabase Storage URL (5-minute expiry). The `LeaseUploadResponse` model was updated to include `welcome_pack_url: str | None = None`.

---

## 4. Service Pattern Payoff

As designed in INL-15, `routers/lease.py` required **zero changes** for this ticket. The router doesn't know about docgen, storage, or the Welcome Pack — it just calls `lease_service.process_lease()` and returns the result. All new logic was added to the service layer only.

---

## 5. Smoke Test Results (David Okafor — null special_conditions)

| Check | Result |
|-------|--------|
| Pipeline status | `complete` |
| Welcome Pack URL | Present (signed URL) |
| Special Conditions heading (P[11]) | Physically removed from XML |
| Special Conditions placeholder (P[12]) | Physically removed from XML |
| Leftover `{{...}}` placeholders | 0 — all replaced |
| "David Okafor" in document | Found |
| "105 King Street" in document | Found |
| "1 May 2026" in document | Found |
| "Fiona Marshall" in document | Found |
| "Julia Torres" in document | Found |

---

## 6. Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `services/docgen.py` | Created | Welcome Pack generation with PLACEHOLDER_MAP, run-splitting-safe replacement, section removal |
| `services/lease_service.py` | Modified | Wired docgen into pipeline — stages 5 (generating) and 6 (complete) |
| `models/api.py` | Modified | Added `welcome_pack_url` to LeaseUploadResponse |
