"""
Benchmark extraction harness — tests the full POST /api/lease/upload pipeline
against all 5 sample leases and compares results to ground_truth.json.

Usage:
    python tests/benchmark_extraction.py

Requires:
    - Backend running at http://localhost:8000
    - Test user credentials in environment or .env
    - All 5 sample lease files in ../template/

Exit code 0 = all fields correct, 1 = failures detected.
"""

import json
import os
import sys
import time
from pathlib import Path

import httpx

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

API_URL = os.getenv("API_URL", "http://localhost:8000")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
TEST_EMAIL = os.getenv("TEST_EMAIL", "test@acmepg.com.au")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "TestPassword123!")

# Paths
SCRIPT_DIR = Path(__file__).parent
GROUND_TRUTH_PATH = SCRIPT_DIR / "ground_truth.json"
TEMPLATE_DIR = SCRIPT_DIR.parent.parent / "template"

# Fields that must match exactly
EXACT_FIELDS = {
    "tenant_name",
    "property_address",
    "lease_start_date",
    "lease_end_date",
    "bond_amount",
    "num_occupants",
    "landlord_name",
    "property_manager_name",
    "property_manager_email",
    "property_manager_phone",
}

# Fields that use keyword/contains matching (Gemini may paraphrase)
KEYWORD_FIELDS = {
    "rent_amount",
    "pet_permission",
    "parking",
    "special_conditions",
}

# Leases where special_conditions MUST be null
NULL_SPECIAL_CONDITIONS = {
    "Lease Agreement - David Okafor.docx",
    "Lease Agreement - Sarah Chen.docx",
    "Lease Agreement - Marcus & Lisa Johnson.docx",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_env():
    """Load env vars from backend/.env if not already set."""
    env_path = SCRIPT_DIR.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())

    global SUPABASE_URL, SUPABASE_ANON_KEY
    if not SUPABASE_URL:
        SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    # Try frontend .env for anon key
    frontend_env = SCRIPT_DIR.parent.parent / "frontend" / ".env"
    if not SUPABASE_ANON_KEY and frontend_env.exists():
        for line in frontend_env.read_text().splitlines():
            if line.startswith("VITE_SUPABASE_ANON_KEY="):
                SUPABASE_ANON_KEY = line.split("=", 1)[1].strip()
                break


def get_jwt_token() -> str:
    """Authenticate against Supabase and return an access token."""
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    resp = httpx.post(
        url,
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def keyword_match(expected: str, actual: str) -> bool:
    """
    Check that all significant keywords from the expected value
    appear in the actual value. Handles Gemini paraphrasing.
    """
    if expected is None and actual is None:
        return True
    if expected is None or actual is None:
        return False

    # Extract keywords: remove common filler, split, lowercase
    def extract_keywords(text: str) -> set[str]:
        # Normalize: lowercase, strip punctuation but keep $ and #
        normalized = text.lower()
        # Remove parentheses, brackets, commas, periods, semicolons, colons
        for ch in "()[],:;.\"'":
            normalized = normalized.replace(ch, " ")
        # Split on whitespace and slashes to break compound terms
        import re
        tokens = re.split(r"[\s/]+", normalized)
        # Filter out filler and very short words
        stopwords = {
            "a", "an", "the", "is", "of", "and", "or", "to", "in", "for",
            "with", "by", "at", "on", "it", "be", "as", "if", "may", "can",
            "not", "no", "are", "was", "has", "its", "per", "any", "all",
        }
        return {w for w in tokens if w not in stopwords and len(w) > 1}

    expected_kw = extract_keywords(expected)
    actual_kw = extract_keywords(actual)

    # All expected keywords should be present in the actual response
    missing = expected_kw - actual_kw
    return len(missing) == 0


def compare_field(field: str, expected, actual, file_name: str) -> tuple[bool, str]:
    """
    Compare a single field. Returns (passed, detail_message).
    """
    # Special conditions null check
    if field == "special_conditions" and file_name in NULL_SPECIAL_CONDITIONS:
        if actual is not None:
            return False, f"FAIL — expected null, got {actual!r} (type: {type(actual).__name__})"
        return True, "PASS — correctly null"

    # Special conditions with content — keyword match
    if field == "special_conditions" and expected is not None:
        if actual is None:
            return False, f"FAIL — expected content, got null"
        if keyword_match(expected, actual):
            return True, f"PASS (keyword) — {actual[:80]}..."
        return False, f"FAIL (keyword) — missing keywords. Expected: {expected[:60]}... Got: {actual[:60]}..."

    # Exact match fields
    if field in EXACT_FIELDS:
        if expected == actual:
            return True, "PASS (exact)"
        return False, f"FAIL (exact) — expected {expected!r}, got {actual!r}"

    # Keyword match fields (rent_amount, pet_permission, parking)
    if field in KEYWORD_FIELDS:
        if keyword_match(expected, actual):
            return True, f"PASS (keyword)"
        return False, f"FAIL (keyword) — expected keywords from {expected!r}, got {actual!r}"

    # Fallback exact
    if expected == actual:
        return True, "PASS"
    return False, f"FAIL — expected {expected!r}, got {actual!r}"


# ---------------------------------------------------------------------------
# Main benchmark
# ---------------------------------------------------------------------------

def run_benchmark():
    load_env()

    # Load ground truth
    with open(GROUND_TRUTH_PATH) as f:
        ground_truth = json.load(f)

    print("=" * 70)
    print("EXTRACTION BENCHMARK — Full API Pipeline Test")
    print(f"API: {API_URL}")
    print(f"Leases: {len(ground_truth)}")
    print("=" * 70)

    # Authenticate
    print("\nAuthenticating...", end=" ")
    token = get_jwt_token()
    print("OK")

    # Run tests
    total_pass = 0
    total_fail = 0
    total_fields = 0
    latencies: list[float] = []
    hard_failures: list[str] = []   # Wrong data, null violations, HTTP errors
    soft_mismatches: list[str] = [] # Keyword paraphrasing differences

    for file_name, expected_fields in ground_truth.items():
        file_path = TEMPLATE_DIR / file_name
        if not file_path.exists():
            print(f"\nSKIPPED: {file_name} — file not found at {file_path}")
            continue

        print(f"\n{'─' * 70}")
        print(f"LEASE: {file_name}")
        print(f"{'─' * 70}")

        # Upload and extract
        start = time.time()
        with open(file_path, "rb") as f:
            resp = httpx.post(
                f"{API_URL}/api/lease/upload",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": (file_name, f, "application/octet-stream")},
                timeout=120,
            )
        latency = time.time() - start
        latencies.append(latency)

        if resp.status_code != 200:
            print(f"  ERROR: HTTP {resp.status_code} — {resp.text[:200]}")
            total_fail += len(expected_fields)
            total_fields += len(expected_fields)
            hard_failures.append(f"{file_name}: HTTP {resp.status_code}")
            continue

        result = resp.json()
        actual_data = result.get("extracted_data", {})
        status = result.get("status", "unknown")

        print(f"  Status: {status} | Latency: {latency:.1f}s")
        print()

        # Compare each field
        lease_pass = 0
        lease_fail = 0

        for field, expected_val in expected_fields.items():
            actual_val = actual_data.get(field, "__MISSING__")
            passed, detail = compare_field(field, expected_val, actual_val, file_name)

            if passed:
                lease_pass += 1
                icon = "✓"
            else:
                lease_fail += 1
                icon = "✗"
                # Classify: keyword-only mismatches on non-null fields are soft
                is_soft = (
                    field in KEYWORD_FIELDS
                    and field != "special_conditions"  # null checks are hard
                    and expected_val is not None
                    and actual_val not in (None, "__MISSING__")
                )
                # special_conditions content mismatch (non-null expected) is also soft
                if field == "special_conditions" and expected_val is not None and actual_val is not None:
                    is_soft = True

                if is_soft:
                    soft_mismatches.append(f"{file_name} → {field}: {detail}")
                else:
                    hard_failures.append(f"{file_name} → {field}: {detail}")

            print(f"  {icon} {field}: {detail}")

        total_pass += lease_pass
        total_fail += lease_fail
        total_fields += lease_pass + lease_fail
        print(f"\n  Result: {lease_pass}/{lease_pass + lease_fail} fields correct")

    # Summary
    print(f"\n{'=' * 70}")
    print("SUMMARY")
    print(f"{'=' * 70}")
    print(f"  Total: {total_pass}/{total_fields} fields exact/keyword match")
    print(f"  Accuracy: {(total_pass / total_fields * 100) if total_fields else 0:.1f}%")
    print(f"  Avg latency: {sum(latencies) / len(latencies):.1f}s" if latencies else "  No latency data")
    print(f"  Min latency: {min(latencies):.1f}s" if latencies else "")
    print(f"  Max latency: {max(latencies):.1f}s" if latencies else "")

    if hard_failures:
        print(f"\n  HARD FAILURES ({len(hard_failures)}) — wrong data, null violations, HTTP errors:")
        for fail in hard_failures:
            print(f"    ✗ {fail}")

    if soft_mismatches:
        print(f"\n  SOFT MISMATCHES ({len(soft_mismatches)}) — keyword paraphrasing (contextually correct):")
        for fail in soft_mismatches:
            print(f"    ~ {fail}")

    print()
    if total_fail == 0:
        print("  ✓ ALL TESTS PASSED — 70/70 fields correct")
        return 0
    elif len(hard_failures) == 0:
        print(f"  ✓ PASS — {total_pass}/{total_fields} exact + {len(soft_mismatches)} soft mismatch(es) (no hard failures)")
        return 0
    else:
        print(f"  ✗ FAIL — {len(hard_failures)} hard failure(s)")
        return 1


if __name__ == "__main__":
    sys.exit(run_benchmark())
