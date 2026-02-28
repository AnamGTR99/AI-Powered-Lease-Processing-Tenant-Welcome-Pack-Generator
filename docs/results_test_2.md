# Extraction Benchmark Results — Test 2

**Date:** 2026-02-28 15:20 AEDT
**Endpoint:** POST /api/lease/upload (localhost:8000)
**Harness:** tests/benchmark_extraction.py
**Ground Truth:** tests/ground_truth.json

---

## Summary

| Metric | Value |
|--------|-------|
| Total fields | 70 (14 fields x 5 leases) |
| Exact/keyword match | 69/70 |
| Accuracy | 98.6% |
| Hard failures | 0 |
| Soft mismatches | 1 |
| Exit code | 0 (PASS) |

---

## Latency

| Lease | Latency |
|-------|---------|
| David Okafor | 9.2s |
| Sarah Chen | 7.1s |
| Emma Whitfield | 9.2s |
| Raj Patel | 9.8s |
| Marcus & Lisa Johnson | 7.5s |
| **Average** | **8.6s** |

---

## Per-Lease Results

### Lease Agreement - David Okafor.docx — 14/14

| Field | Result |
|-------|--------|
| tenant_name | PASS (exact) |
| property_address | PASS (exact) |
| lease_start_date | PASS (exact) |
| lease_end_date | PASS (exact) |
| rent_amount | PASS (keyword) |
| bond_amount | PASS (exact) |
| num_occupants | PASS (exact) |
| pet_permission | PASS (keyword) |
| parking | PASS (keyword) |
| special_conditions | PASS — correctly null |
| landlord_name | PASS (exact) |
| property_manager_name | PASS (exact) |
| property_manager_email | PASS (exact) |
| property_manager_phone | PASS (exact) |

### Lease Agreement - Sarah Chen.docx — 14/14

| Field | Result |
|-------|--------|
| tenant_name | PASS (exact) |
| property_address | PASS (exact) |
| lease_start_date | PASS (exact) |
| lease_end_date | PASS (exact) |
| rent_amount | PASS (keyword) |
| bond_amount | PASS (exact) |
| num_occupants | PASS (exact) |
| pet_permission | PASS (keyword) |
| parking | PASS (keyword) |
| special_conditions | PASS — correctly null |
| landlord_name | PASS (exact) |
| property_manager_name | PASS (exact) |
| property_manager_email | PASS (exact) |
| property_manager_phone | PASS (exact) |

### Lease Agreement - Emma Whitfield.docx — 13/14

| Field | Result |
|-------|--------|
| tenant_name | PASS (exact) |
| property_address | PASS (exact) |
| lease_start_date | PASS (exact) |
| lease_end_date | PASS (exact) |
| rent_amount | PASS (keyword) |
| bond_amount | PASS (exact) |
| num_occupants | PASS (exact) |
| pet_permission | PASS (keyword) |
| parking | PASS (keyword) |
| special_conditions | SOFT MISMATCH — keyword paraphrasing ("short-term rent" vs "short-term rental") |
| landlord_name | PASS (exact) |
| property_manager_name | PASS (exact) |
| property_manager_email | PASS (exact) |
| property_manager_phone | PASS (exact) |

### Lease Agreement - Raj Patel.docx — 14/14

| Field | Result |
|-------|--------|
| tenant_name | PASS (exact) |
| property_address | PASS (exact) |
| lease_start_date | PASS (exact) |
| lease_end_date | PASS (exact) |
| rent_amount | PASS (keyword) |
| bond_amount | PASS (exact) |
| num_occupants | PASS (exact) |
| pet_permission | PASS (keyword) |
| parking | PASS (keyword) |
| special_conditions | PASS (keyword) |
| landlord_name | PASS (exact) |
| property_manager_name | PASS (exact) |
| property_manager_email | PASS (exact) |
| property_manager_phone | PASS (exact) |

### Lease Agreement - Marcus & Lisa Johnson.docx — 14/14

| Field | Result |
|-------|--------|
| tenant_name | PASS (exact) |
| property_address | PASS (exact) |
| lease_start_date | PASS (exact) |
| lease_end_date | PASS (exact) |
| rent_amount | PASS (keyword) |
| bond_amount | PASS (exact) |
| num_occupants | PASS (exact) |
| pet_permission | PASS (keyword) |
| parking | PASS (keyword) |
| special_conditions | PASS — correctly null |
| landlord_name | PASS (exact) |
| property_manager_name | PASS (exact) |
| property_manager_email | PASS (exact) |
| property_manager_phone | PASS (exact) |

---

## Null Check Verification

| Lease | special_conditions | Result |
|-------|-------------------|--------|
| David Okafor | null | PASS |
| Sarah Chen | null | PASS |
| Marcus & Lisa Johnson | null | PASS |

All three leases with no special conditions correctly return JSON `null` (not string `"null"` or `"None"`).

---

## Soft Mismatch Detail

**Whitfield special_conditions**: Ground truth expects keywords `short-term rental subletting gym swimming pool rooftop body corporate`. Gemini returned prose containing "short-term rent" (missing the "al" suffix). All other keywords present. Content is factually correct — this is a paraphrasing variance, not a data error.

---

## Verdict

**PASS** — 0 hard failures. All exact fields, null checks, and critical data points correct across all 5 leases. The 1 soft mismatch is a known Gemini paraphrasing variance that will be addressed via prompt refinement.
