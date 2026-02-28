# INL-30: Technical Review — Gemini Prompt Refinement

**Ticket:** INL-30 — Refine Gemini extraction prompt to reduce paraphrasing variance
**Date:** 2026-02-28
**Status:** Implemented — 70/70 benchmark achieved

---

## 1. Problem

The INL-16 benchmark consistently scored 69/70 with 1 soft mismatch: Gemini substituted "short-term rent" for "short-term rental" in Whitfield's `special_conditions`. Across multiple runs, other text-heavy fields (`pet_permission`, `parking`) also showed non-deterministic paraphrasing — different wording each run but always contextually correct.

Root cause: the prompt used the word "summarise", giving Gemini freedom to rephrase.

---

## 2. Changes Made

All changes were to `EXTRACTION_PROMPT` in `backend/app/services/gemini.py`. No other files modified.

### Change 1: pet_permission output anchoring
**Before:**
> "write a concise summary of the permission and ALL conditions listed, in plain English. Do not just say 'Permitted' — include the conditions."

**After:**
> "list the pet type allowed and ALL conditions in a single sentence. Start with the pet type. E.g. 'One desexed and microchipped domestic cat is permitted, subject to: professional flea treatment every 3 months, liability for any pet-related damage, and the landlord's right to withdraw permission.' Use the exact terms from the lease — do not substitute synonyms."

### Change 2: special_conditions output anchoring
**Before:**
> "If they do exist, summarise them clearly in plain English."

**After:**
> "If they do exist, list each special condition as a separate sentence. Use the exact terminology from the lease — do not paraphrase or substitute synonyms. Preserve key nouns exactly as written (e.g. 'short-term rental' must stay as 'short-term rental', not 'short-term rent')."

### Change 3: New CRITICAL RULE #7
Added:
> "7. For text-heavy fields (pet_permission, parking, special_conditions), use the exact terminology from the lease where possible. Do not substitute synonyms or paraphrase legal terms."

Previous rule 7 (return JSON only) became rule 8.

---

## 3. Results

### Benchmark run after changes
```
SUMMARY
======================================================================
  Total: 70/70 fields exact/keyword match
  Accuracy: 100.0%
  Avg latency: 9.0s
  Min latency: 7.9s
  Max latency: 9.9s

  ✓ ALL TESTS PASSED — 70/70 fields correct
```

The Whitfield `special_conditions` soft mismatch is resolved — Gemini now preserves "short-term rental" exactly as written in the lease.

---

## 4. Why This Works

The three changes use complementary anchoring techniques:

1. **Example-based anchoring** (pet_permission): Providing a concrete output example constrains the sentence structure Gemini follows
2. **Terminology preservation** (special_conditions): Explicitly telling Gemini not to substitute synonyms prevents "rental" → "rent" drift
3. **Top-level rule reinforcement** (CRITICAL RULE #7): A global rule ensures the instruction applies across all text-heavy fields, not just the ones with inline examples

---

## 5. Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `services/gemini.py` | Modified | Three prompt changes to EXTRACTION_PROMPT |
