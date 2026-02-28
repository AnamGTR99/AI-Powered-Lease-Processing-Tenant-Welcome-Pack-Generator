# INL-19: Welcome Pack Benchmark Results

**Ticket:** INL-19 — Test Welcome Pack output for all 5 leases
**Date:** 2026-02-28
**Status:** 33/34 automated checks passed — discrepancies identified for review

---

## 1. Automated Benchmark Results

| Lease | Checks | Result |
|-------|--------|--------|
| David Okafor | 7/7 | PASS |
| Sarah Chen | 6/6 | PASS |
| Emma Whitfield | 6/6 | PASS |
| Raj Patel | 7/8 | 1 failure (fortnightly rent check) |
| Marcus & Lisa Johnson | 7/7 | PASS |
| **Total** | **33/34** | |

**Latency:** Avg 10.6s | Min 6.9s | Max 14.2s

### What passed across all 5 leases
- No leftover `{{...}}` placeholders in any document
- `{{tenant_name}}` replaced in all 3 locations per document
- `{{property_address}}` replaced in all 4 locations per document
- Special Conditions correctly removed for Okafor, Chen, Johnson (null)
- Special Conditions correctly populated for Whitfield, Patel (has content)
- Joint tenancy "Marcus Johnson & Lisa Johnson" in all 3 locations
- Parking details with "Space #47" for Patel
- Pet conditions with "desexed" detail for Okafor
- Property manager name and email correct in all 5

### The 1 failure
Raj Patel's rent check looked for `$1,150.00 per fortnight` — the value IS present in the doc, but the check failed because Gemini returned `$1,150.00 AUD per fortnight`. This is not a docgen bug — the Gemini extraction added "AUD" which the check didn't account for. The value is factually correct.

---

## 2. Discrepancies — Rent Amount Display

The template label for Row 4 in the "Lease at a Glance" table is hardcoded as **"Monthly Rent"**. However, the extracted rent values vary in both format and frequency:

| Tenant | Template Label | Displayed Value | Issue |
|--------|---------------|-----------------|-------|
| David Okafor | Monthly Rent | $1,750.00 AUD per month | "AUD" added by Gemini — minor inconsistency |
| Sarah Chen | Monthly Rent | $2,200.00 per month | Clean — matches label |
| Emma Whitfield | Monthly Rent | $3,100.00 AUD per month | "AUD" added by Gemini — minor inconsistency |
| Raj Patel | Monthly Rent | $1,150.00 AUD per fortnight | **Label says "Monthly Rent" but value is fortnightly** |
| Marcus & Lisa Johnson | Monthly Rent | $2,650.00 AUD per calendar month | "AUD" and "calendar" added by Gemini — minor inconsistency |

### Issue 1: Fortnightly rent under "Monthly Rent" label
Raj Patel's lease specifies rent as $1,150.00 per fortnight. The template label is hardcoded as "Monthly Rent". Two options:
1. **Convert fortnightly to monthly** in the extraction/docgen layer (e.g. $1,150.00 x 26 / 12 = $2,491.67/month) — but this changes the lease-stated amount
2. **Change the template label** to "Rent Amount" instead of "Monthly Rent" — more accurate for all cases

**Awaiting confirmation from technical lead on which approach to take.**

### Issue 2: Gemini adding "AUD" inconsistently
3 out of 5 leases have "AUD" appended by Gemini. The ground truth expects just `$X,XXX.XX per month`. This is cosmetic but inconsistent — some say "$1,750.00 AUD per month", one says "$2,200.00 per month", another says "$2,650.00 AUD per calendar month".

Options:
- Add a prompt rule: "Do not include currency codes like AUD — the $ symbol is sufficient"
- Post-process in docgen: strip "AUD" and "calendar" from rent_amount before insertion

### Issue 3: "calendar month" phrasing
Marcus & Lisa Johnson's rent displays as "per calendar month" instead of "per month". This is how it's written in the lease, so Gemini is faithfully extracting the terminology (as we asked in INL-30). However, it creates inconsistency across Welcome Packs.

---

## 3. Generated Welcome Packs

All 5 .docx files saved to `docs/test_results/` for manual review:

| File | Size |
|------|------|
| Welcome_Pack_David_Okafor.docx | 9,375 bytes |
| Welcome_Pack_Sarah_Chen.docx | 9,084 bytes |
| Welcome_Pack_Emma_Whitfield.docx | 9,448 bytes |
| Welcome_Pack_Raj_Patel.docx | 9,346 bytes |
| Welcome_Pack_Marcus_Johnson_and_Lisa_Johnson.docx | 9,098 bytes |

**Manual review required:** Open each file to verify formatting, branding (#1B4F72 headers), fonts (Arial), table layouts, page breaks, and overall professional appearance.

---

## 4. Pending Decisions

| Decision | Blocker | Impact |
|----------|---------|--------|
| Fortnightly rent: convert to monthly or keep as-is? | Awaiting tech lead | Affects Patel Welcome Pack + possibly prompt/docgen logic |
| Strip "AUD" from rent display? | Can decide independently | Cosmetic consistency across all 5 packs |
| Normalize "calendar month" to "month"? | Can decide independently | Cosmetic consistency |
