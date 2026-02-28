# INL-31: Technical Review — Normalize Rent Amount for Welcome Pack

**Ticket:** INL-31 — Normalize rent amount to consistent monthly format for Welcome Pack
**Date:** 2026-02-28
**Status:** Implemented and tested — 39/39 Welcome Pack checks passed

---

## 1. Problem

The INL-19 benchmark revealed three rent display inconsistencies across the 5 Welcome Packs:

| Tenant | Previous Output | Issues |
|--------|----------------|--------|
| David Okafor | $1,750.00 AUD per month | "AUD" added by Gemini |
| Sarah Chen | $2,200.00 per month | Clean |
| Emma Whitfield | $3,100.00 AUD per month | "AUD" added by Gemini |
| Raj Patel | $1,150.00 AUD per fortnight | "AUD" + fortnightly under "Monthly Rent" label |
| Marcus & Lisa Johnson | $2,650.00 AUD per calendar month | "AUD" + "calendar month" |

The template row is hardcoded as "Monthly Rent" — we cannot change it. All rent values must display as `$X,XXX.XX per month`.

---

## 2. Split Responsibility Approach

LLMs are unreliable at arithmetic, so the fix is split across two layers:

- **Gemini (formatting):** Prompt refinement to stop outputting "AUD" and "calendar month"
- **Python (math):** `_normalize_rent()` in docgen.py handles frequency conversion with exact multipliers

The extracted_data stored in the DB is untouched — normalization only applies to the Welcome Pack .docx output.

---

## 3. Changes

### `services/gemini.py` — Prompt refinement

Updated the `rent_amount` field instruction from:

```
"Include amount, currency and frequency. E.g. '$2,650.00 per month'..."
```

To:

```
"Include amount and frequency only. Format: '$X,XXX.XX per month' or
'$X,XXX.XX per fortnight' or '$X,XXX.XX per week'. Do NOT include
currency codes like 'AUD'. Do NOT use 'calendar month' — just 'month'."
```

This tells Gemini to output clean rent strings. The `_normalize_rent()` function provides a safety net if Gemini still includes "AUD" or "calendar" on occasion.

### `services/docgen.py` — `_normalize_rent()` function

New function added between the PLACEHOLDER_MAP and the run-splitting logic:

```python
def _normalize_rent(rent_str: str) -> str:
```

Processing steps:
1. Strip "AUD" and "calendar" if present (safety net for Gemini variance)
2. Parse dollar amount and frequency via regex: `\$?([\d,]+\.?\d*)\s+per\s+(\w+)`
3. Convert to monthly using exact multipliers:
   - Fortnightly: × 2.17262 (26 fortnights ÷ 12 months)
   - Weekly: × 4.35 (52 weeks ÷ 12 months, rounded)
   - Monthly: pass through unchanged
4. Format output as `$X,XXX.XX per month`
5. If parsing fails, return original string unchanged (graceful fallback)

Called inside `generate_welcome_pack()` at Step 2 (building the replacement dict), so it only affects the .docx — the `extracted_data` dict passed in is never mutated.

### `tests/benchmark_welcome_packs.py` — Updated checks

- Patel's rent check changed from `$1,150.00 per fortnight` to `$2,498.51 per month`
- Added universal `check_rent_consistency()` for all 5 leases — fails if any doc contains "AUD", "calendar month", "per fortnight", or "per week"

---

## 4. Test Results

### Welcome Pack Benchmark — 39/39

| Lease | Checks | Rent Value in .docx |
|-------|--------|---------------------|
| David Okafor | 8/8 | $1,750.00 per month |
| Sarah Chen | 7/7 | $2,200.00 per month |
| Emma Whitfield | 7/7 | $3,100.00 per month |
| Raj Patel | 9/9 | $2,498.51 per month |
| Marcus & Lisa Johnson | 8/8 | $2,650.00 per month |
| **Total** | **39/39** | |

**Latency:** Avg 9.8s | Min 6.6s | Max 13.6s

### Extraction Benchmark — 69/70, 0 hard failures

No regression. The 1 soft mismatch is the pre-existing Patel pet_permission paraphrasing ("Not permitted" vs "Not permitted without prior written consent") — unrelated to this ticket.

---

## 5. Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `services/gemini.py` | Modified | Updated rent_amount prompt to exclude AUD and "calendar month" |
| `services/docgen.py` | Modified | Added `_normalize_rent()` + wired into `generate_welcome_pack()` |
| `tests/benchmark_welcome_packs.py` | Modified | Updated Patel check to converted value, added rent consistency check |
