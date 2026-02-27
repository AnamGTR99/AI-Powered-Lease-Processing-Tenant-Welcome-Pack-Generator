# Extraction Test Results — Run 1

**Date:** 2026-02-27
**Model:** Gemini 2.5 Flash (google-genai 1.65.0)
**Pipeline:** Unified text extraction (XML body walking for DOCX) → Gemini structured extraction → validation + normalization

---

## Expected Results

Source: `epic_3_new_approach.md` expected extraction table + actual lease document content verified manually.

### David Okafor
| Field | Expected |
|-------|----------|
| tenant_name | David Okafor |
| property_address | 105 King Street, Studio 2, Melbourne VIC 3000 |
| lease_start_date | 1 May 2026 |
| lease_end_date | 31 October 2026 |
| rent_amount | $1,750.00 per month |
| bond_amount | $3,500.00 |
| num_occupants | 1 |
| pet_permission | Permitted with conditions (desexed, microchipped, damage liability, professional cleaning, flea treatment, revocable) |
| parking | Not included |
| special_conditions | null (lease states "Nil") |
| landlord_name | Fiona Marshall |
| property_manager_name | Julia Torres |
| property_manager_email | julia.torres@acmepg.com.au |
| property_manager_phone | +61 3 9555 0142 |

### Sarah Chen
| Field | Expected |
|-------|----------|
| tenant_name | Sarah Chen |
| property_address | 42 Oakwood Avenue, Apartment 3B, Richmond VIC 3121 |
| lease_start_date | 1 March 2026 |
| lease_end_date | 28 February 2027 |
| rent_amount | $2,200.00 per month |
| bond_amount | $4,400.00 |
| num_occupants | 1 |
| pet_permission | Not permitted |
| parking | Not included |
| special_conditions | null (lease states "No special conditions apply") |
| landlord_name | Robert Harmon |
| property_manager_name | Julia Torres |
| property_manager_email | julia.torres@acmepg.com.au |
| property_manager_phone | +61 3 9555 0142 |

### Emma Whitfield
| Field | Expected |
|-------|----------|
| tenant_name | Emma Whitfield |
| property_address | 7/220 Harbour View Boulevard, Docklands VIC 3008 |
| lease_start_date | 1 June 2026 |
| lease_end_date | 31 May 2027 |
| rent_amount | $3,100.00 per month |
| bond_amount | $6,200.00 |
| num_occupants | 1 |
| pet_permission | Not permitted |
| parking | Not included |
| special_conditions | Present — 2 conditions: (1) Airbnb/subletting prohibition (2) Building amenities access subject to body corporate rules |
| landlord_name | Gregory Tan |
| property_manager_name | Julia Torres |
| property_manager_email | julia.torres@acmepg.com.au |
| property_manager_phone | +61 3 9555 0142 |

### Raj Patel
| Field | Expected |
|-------|----------|
| tenant_name | Raj Patel |
| property_address | 33 Victoria Crescent, Flat 12A, St Kilda VIC 3182 |
| lease_start_date | 1 April 2026 |
| lease_end_date | 31 March 2027 |
| rent_amount | $1,150.00 per fortnight |
| bond_amount | $4,983.34 |
| num_occupants | 2 |
| pet_permission | Not permitted without prior written consent |
| parking | One designated car parking space, Basement Level 1, Space #47, access via remote-controlled gate |
| special_conditions | Present — 2 conditions: (1) Fob replacement fee $75 (2) Bin room on Basement Level 1 |
| landlord_name | Anita Desmond |
| property_manager_name | Julia Torres |
| property_manager_email | julia.torres@acmepg.com.au |
| property_manager_phone | +61 3 9555 0142 |

### Marcus & Lisa Johnson
| Field | Expected |
|-------|----------|
| tenant_name | Marcus Johnson & Lisa Johnson |
| property_address | 18 River Road, Unit 7, Abbotsford VIC 3067 |
| lease_start_date | 15 April 2026 |
| lease_end_date | 14 April 2027 |
| rent_amount | $2,650.00 per month |
| bond_amount | $5,300.00 |
| num_occupants | 2 |
| pet_permission | Not permitted |
| parking | Not included |
| special_conditions | null (lease states "No special conditions apply") |
| landlord_name | Catherine Webb |
| property_manager_name | Julia Torres |
| property_manager_email | julia.torres@acmepg.com.au |
| property_manager_phone | +61 3 9555 0142 |

---

## Actual Results

### David Okafor
| Field | Actual | Match |
|-------|--------|-------|
| tenant_name | David Okafor | EXACT |
| property_address | 105 King Street, Studio 2, Melbourne VIC 3000 | EXACT |
| lease_start_date | 1 May 2026 | EXACT |
| lease_end_date | 31 October 2026 | EXACT |
| rent_amount | $1,750.00 per month | EXACT |
| bond_amount | $3,500.00 | EXACT |
| num_occupants | 1 | EXACT |
| pet_permission | One domestic cat is permitted, provided it is desexed and microchipped in accordance with Victorian law. The tenant is responsible for any damage caused by the pet. The property must be professionally cleaned at the end of the tenancy, including a flea treatment, at the tenant's expense. The landlord reserves the right to withdraw pet permission if the pet causes repeated disturbance or damage. No additional pets may be kept without further written approval. | CORRECT — all conditions captured |
| parking | Not included | EXACT |
| special_conditions | null | EXACT |
| landlord_name | Fiona Marshall | EXACT |
| property_manager_name | Julia Torres | EXACT |
| property_manager_email | julia.torres@acmepg.com.au | EXACT |
| property_manager_phone | +61 3 9555 0142 | EXACT |

**Result: 14/14 CORRECT**

### Sarah Chen
| Field | Actual | Match |
|-------|--------|-------|
| tenant_name | Sarah Chen | EXACT |
| property_address | 42 Oakwood Avenue, Apartment 3B, Richmond VIC 3121 | EXACT |
| lease_start_date | 1 March 2026 | EXACT |
| lease_end_date | 28 February 2027 | EXACT |
| rent_amount | $2,200.00 per month | EXACT |
| bond_amount | $4,400.00 | EXACT |
| num_occupants | 1 | EXACT |
| pet_permission | Not permitted | EXACT |
| parking | Not included | EXACT |
| special_conditions | null | EXACT |
| landlord_name | Robert Harmon | EXACT |
| property_manager_name | Julia Torres | EXACT |
| property_manager_email | julia.torres@acmepg.com.au | EXACT |
| property_manager_phone | +61 3 9555 0142 | EXACT |

**Result: 14/14 CORRECT**

### Emma Whitfield
| Field | Actual | Match |
|-------|--------|-------|
| tenant_name | Emma Whitfield | EXACT |
| property_address | 7/220 Harbour View Boulevard, Docklands VIC 3008 | EXACT |
| lease_start_date | 1 June 2026 | EXACT |
| lease_end_date | 31 May 2027 | EXACT |
| rent_amount | $3,100.00 AUD per month | CORRECT — includes "AUD", functionally equivalent |
| bond_amount | $6,200.00 | EXACT |
| num_occupants | 1 | EXACT |
| pet_permission | Not permitted | EXACT |
| parking | Not included | EXACT |
| special_conditions | Tenant must not use the premises for short-term rental or subletting (e.g., Airbnb, Stayz). Tenant may use building amenities (gym, swimming pool, rooftop terrace) subject to body corporate rules; access is free but can be restricted or revoked. | CORRECT — both conditions captured |
| landlord_name | Gregory Tan | EXACT |
| property_manager_name | Julia Torres | EXACT |
| property_manager_email | julia.torres@acmepg.com.au | EXACT |
| property_manager_phone | +61 3 9555 0142 | EXACT |

**Result: 14/14 CORRECT**

### Raj Patel
| Field | Actual | Match |
|-------|--------|-------|
| tenant_name | Raj Patel | EXACT |
| property_address | 33 Victoria Crescent, Flat 12A, St Kilda VIC 3182 | EXACT |
| lease_start_date | 1 April 2026 | EXACT |
| lease_end_date | 31 March 2027 | EXACT |
| rent_amount | $1,150.00 AUD per fortnight | CORRECT — includes "AUD", functionally equivalent |
| bond_amount | $4,983.34 | EXACT |
| num_occupants | 2 | EXACT |
| pet_permission | Not permitted without prior written consent of the landlord. If consent is granted, it may be subject to additional conditions, including requirements for professional cleaning at the end of the tenancy. | CORRECT — full conditions captured |
| parking | One designated car parking space, Basement Level 1, Space #47. Access via remote-controlled gate. One parking fob provided. | CORRECT — all details captured |
| special_conditions | Tenant is issued one building access fob for the main entrance and parking gate; replacement fobs incur a $75 fee payable to the body corporate. Rubbish collection is managed by the body corporate, and the tenant must use the designated bin room on Basement Level 1. | CORRECT — both conditions captured |
| landlord_name | Anita Desmond | EXACT |
| property_manager_name | Julia Torres | EXACT |
| property_manager_email | julia.torres@acmepg.com.au | EXACT |
| property_manager_phone | +61 3 9555 0142 | EXACT |

**Result: 14/14 CORRECT**

### Marcus & Lisa Johnson
| Field | Actual | Match |
|-------|--------|-------|
| tenant_name | Marcus Johnson & Lisa Johnson | EXACT |
| property_address | 18 River Road, Unit 7, Abbotsford VIC 3067 | EXACT |
| lease_start_date | 15 April 2026 | EXACT |
| lease_end_date | 14 April 2027 | EXACT |
| rent_amount | $2,650.00 AUD per calendar month | CORRECT — includes "AUD" and "calendar", functionally equivalent |
| bond_amount | $5,300.00 | EXACT |
| num_occupants | 2 | EXACT |
| pet_permission | Not permitted | EXACT |
| parking | Not included | EXACT |
| special_conditions | null | EXACT |
| landlord_name | Catherine Webb | EXACT |
| property_manager_name | Julia Torres | EXACT |
| property_manager_email | julia.torres@acmepg.com.au | EXACT |
| property_manager_phone | +61 3 9555 0142 | EXACT |

**Result: 14/14 CORRECT**

---

## Summary

| Lease | Fields Correct | Edge Cases Handled |
|-------|---------------|-------------------|
| David Okafor | 14/14 | Pet permitted WITH conditions (all 5 clauses captured), special_conditions = null ("Nil") |
| Sarah Chen | 14/14 | Clean/simple lease, special_conditions = null |
| Emma Whitfield | 14/14 | Prose-heavy format (no tables), special_conditions present (2 conditions), furnished property |
| Raj Patel | 14/14 | Fortnightly rent correctly preserved, parking with full details (Space #47), special_conditions present (2 conditions), 3-column Part A table |
| Marcus & Lisa Johnson | 14/14 | Joint tenancy names ("Marcus Johnson & Lisa Johnson"), DD/MM/YYYY date normalized to "15 April 2026", special_conditions = null |

**Overall: 70/70 fields correct across all 5 leases (100% accuracy)**

### Minor Wording Variations (functionally correct, not errors)
- `rent_amount` sometimes includes "AUD" (e.g., "$2,200.00 AUD per month") — this is accurate to the lease text and acceptable in the Welcome Pack
- `rent_amount` for Johnson uses "per calendar month" instead of "per month" — matches the lease wording exactly
