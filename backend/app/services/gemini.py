"""
Gemini 2.0 Flash service for structured lease field extraction.

Sends extracted lease text to Gemini and returns validated JSON with all 14 fields.
Includes defensive JSON parsing, post-extraction validation, and retry with
correction prompt.
"""

import json
import logging
import re
from datetime import datetime

from google import genai

from app.config import settings
from app.models.lease import ExtractedLeaseData

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini client setup
# ---------------------------------------------------------------------------
_client = None


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

EXTRACTION_PROMPT = """You are a precise document extraction assistant specialising in Australian residential lease agreements.

Extract the following 14 fields from the lease agreement text provided. Return ONLY a valid JSON object — no markdown, no explanation, no extra text.

FIELDS TO EXTRACT:

{{
  "tenant_name": "Full name(s). If joint tenancy, format as 'Marcus Johnson & Lisa Johnson'. Never truncate.",
  "property_address": "Full address including unit/apartment number, street, suburb, state and postcode. E.g. '18 River Road, Unit 7, Abbotsford VIC 3067'",
  "lease_start_date": "Standardise to DD Month YYYY format. E.g. '15 April 2026'. Input may be '15/04/2026', '1 April 2026', 'April 1, 2026' — normalise all to this format.",
  "lease_end_date": "Same format as lease_start_date.",
  "rent_amount": "Include amount, currency and frequency. E.g. '$2,650.00 per month' or '$1,150.00 per fortnight'. Never strip the frequency.",
  "bond_amount": "Dollar amount only. E.g. '$5,300.00'",
  "num_occupants": "Integer as a string. E.g. '1' or '2'",
  "pet_permission": "One of two formats: (A) If pets are not permitted: 'Not permitted'. (B) If pets are permitted with conditions: list the pet type allowed and ALL conditions in a single sentence. Start with the pet type. E.g. 'One desexed and microchipped domestic cat is permitted, subject to: professional flea treatment every 3 months, liability for any pet-related damage, and the landlord's right to withdraw permission.' Use the exact terms from the lease — do not substitute synonyms.",
  "parking": "One of two formats: (A) If no parking: 'Not included'. (B) If parking is included: describe it fully including space number, level, and access method if stated.",
  "special_conditions": "CRITICAL RULE: If the lease states there are no special conditions (e.g. 'Nil', 'No special conditions apply', 'Nil. No special conditions apply.') — return null (JSON null, not the string 'null' or 'None'). Only return text here if REAL special conditions exist. If they do exist, list each special condition as a separate sentence. Use the exact terminology from the lease — do not paraphrase or substitute synonyms. Preserve key nouns exactly as written (e.g. 'short-term rental' must stay as 'short-term rental', not 'short-term rent').",
  "landlord_name": "Full name as listed in the parties section.",
  "property_manager_name": "The contact person's name only. E.g. 'Julia Torres'",
  "property_manager_email": "Email address. E.g. 'julia.torres@acmepg.com.au'",
  "property_manager_phone": "Phone number as listed. E.g. '+61 3 9555 0142'"
}}

CRITICAL RULES:
1. special_conditions must be JSON null if no real conditions exist. This controls whether the section appears in the output document at all.
2. For rent_amount, always include the payment frequency (per month / per fortnight). Never omit it.
3. For joint tenancies, include both full names joined with ' & '.
4. For pet_permission, if permitted, include ALL conditions listed — not just "Permitted".
5. For property_address, always include the unit/apartment/flat/studio number if present.
6. Do not invent or assume any data not present in the document.
7. For text-heavy fields (pet_permission, parking, special_conditions), use the exact terminology from the lease where possible. Do not substitute synonyms or paraphrase legal terms.
8. Return ONLY the JSON object. No markdown fences. No explanation.

LEASE AGREEMENT TEXT:
{lease_text}"""

CORRECTION_PROMPT = """Your previous extraction had the following issues:
{warnings}

Here is what you returned:
{previous_json}

Please fix only the problematic fields and return the corrected full JSON object.
Do not change fields that were correct.
Return ONLY the JSON object. No markdown fences. No explanation."""

# ---------------------------------------------------------------------------
# Required keys
# ---------------------------------------------------------------------------

REQUIRED_KEYS = [
    "tenant_name", "property_address", "lease_start_date",
    "lease_end_date", "rent_amount", "bond_amount", "num_occupants",
    "pet_permission", "parking", "special_conditions", "landlord_name",
    "property_manager_name", "property_manager_email", "property_manager_phone",
]


# ---------------------------------------------------------------------------
# Defensive JSON parser
# ---------------------------------------------------------------------------

def _parse_llm_response(raw: str) -> dict:
    """Strip markdown fences if present, then parse JSON."""
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw: {raw[:500]}")

    missing = [k for k in REQUIRED_KEYS if k not in data]
    if missing:
        raise ValueError(f"LLM response missing fields: {missing}")

    # Normalize special_conditions: string "None"/"Nil"/etc. → actual None
    sc = data.get("special_conditions")
    if isinstance(sc, str) and sc.strip().lower() in ("none", "nil", "null", "n/a", "no special conditions", "no special conditions apply"):
        data["special_conditions"] = None

    # Normalize dates: strip leading zeros (e.g., "01 June 2026" → "1 June 2026")
    for date_field in ("lease_start_date", "lease_end_date"):
        val = data.get(date_field, "")
        if val and val[0] == "0":
            data[date_field] = val.lstrip("0")

    return data


# ---------------------------------------------------------------------------
# Post-extraction validation
# ---------------------------------------------------------------------------

def _validate_fields(fields: dict) -> list[str]:
    """Run sanity checks on extracted fields. Returns list of warnings."""
    warnings: list[str] = []

    # Date format + sanity
    for date_field in ("lease_start_date", "lease_end_date"):
        val = fields.get(date_field)
        if val:
            try:
                datetime.strptime(val, "%d %B %Y")
            except ValueError:
                warnings.append(f"{date_field} '{val}' is not in 'DD Month YYYY' format")

    try:
        start = datetime.strptime(fields["lease_start_date"], "%d %B %Y")
        end = datetime.strptime(fields["lease_end_date"], "%d %B %Y")
        if end <= start:
            warnings.append("lease_end_date is before or equal to lease_start_date")
    except (ValueError, KeyError):
        pass

    # Rent frequency
    rent = fields.get("rent_amount", "")
    if "per" not in rent.lower():
        warnings.append(f"rent_amount '{rent}' may be missing frequency (per month/fortnight)")

    # Bond format
    bond = fields.get("bond_amount", "")
    if not bond.startswith("$"):
        warnings.append(f"bond_amount '{bond}' does not start with '$'")

    return warnings


# ---------------------------------------------------------------------------
# Main extraction function
# ---------------------------------------------------------------------------

async def extract_fields(lease_text: str) -> dict:
    """
    Send lease text to Gemini 2.0 Flash and return validated extracted fields.

    Returns a dict with all 14 fields + 'raw_ai_response' for auditability.
    """
    client = _get_client()

    # First attempt
    prompt = EXTRACTION_PROMPT.format(lease_text=lease_text)
    logger.info("Sending lease text to Gemini for extraction (%d chars)", len(lease_text))

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    raw_text = response.text
    logger.info("Gemini response received (%d chars)", len(raw_text))

    fields = _parse_llm_response(raw_text)

    # Validate
    warnings = _validate_fields(fields)

    # Retry once if validation fails
    if warnings:
        logger.warning("Extraction validation warnings: %s", warnings)
        correction = CORRECTION_PROMPT.format(
            warnings="\n".join(f"- {w}" for w in warnings),
            previous_json=json.dumps(fields, indent=2),
        )
        retry_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=correction,
        )
        retry_text = retry_response.text
        logger.info("Gemini retry response received (%d chars)", len(retry_text))

        try:
            retry_fields = _parse_llm_response(retry_text)
            fields.update(retry_fields)
            raw_text = retry_text
        except ValueError as e:
            logger.warning("Retry parse failed, using original: %s", e)

    # Pydantic validation
    validated = ExtractedLeaseData(**fields)

    # Log special_conditions decision
    if validated.special_conditions is None:
        logger.info("special_conditions is null — section will be omitted from Welcome Pack")
    else:
        logger.info("special_conditions present — section will be included")

    result = validated.model_dump()
    result["raw_ai_response"] = {"raw_text": raw_text, "parsed": fields}

    return result
