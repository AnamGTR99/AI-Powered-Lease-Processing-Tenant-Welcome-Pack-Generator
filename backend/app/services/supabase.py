"""
Supabase service client — wraps all DB and Storage operations.

Uses the service role key (bypasses RLS) but still filters by user_id
in every query for defense-in-depth.
"""

import logging
from uuid import UUID

from supabase import Client, create_client

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Singleton client
# ---------------------------------------------------------------------------
_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _client


# ---------------------------------------------------------------------------
# lease_uploads
# ---------------------------------------------------------------------------

def create_lease_upload(
    user_id: str,
    file_name: str,
    file_type: str,
    file_path: str,
    file_size: int,
) -> dict:
    data = {
        "user_id": user_id,
        "file_name": file_name,
        "file_type": file_type,
        "file_path": file_path,
        "file_size": file_size,
        "status": "uploaded",
    }
    result = get_client().table("lease_uploads").insert(data).execute()
    return result.data[0]


def get_lease_upload(upload_id: str, user_id: str) -> dict | None:
    result = (
        get_client()
        .table("lease_uploads")
        .select("*")
        .eq("id", upload_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result.data else None


def list_lease_uploads(user_id: str) -> list[dict]:
    result = (
        get_client()
        .table("lease_uploads")
        .select("*, extracted_data(*), welcome_packs(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def update_lease_status(
    upload_id: str, user_id: str, status: str, error_message: str | None = None
) -> dict:
    data: dict = {"status": status}
    if error_message is not None:
        data["error_message"] = error_message
    result = (
        get_client()
        .table("lease_uploads")
        .update(data)
        .eq("id", upload_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0]


# ---------------------------------------------------------------------------
# extracted_data
# ---------------------------------------------------------------------------

def save_extracted_data(lease_upload_id: str, fields: dict, raw_ai_response: dict) -> dict:
    data = {
        "lease_upload_id": lease_upload_id,
        "tenant_name": fields.get("tenant_name"),
        "property_address": fields.get("property_address"),
        "lease_start_date": fields.get("lease_start_date"),
        "lease_end_date": fields.get("lease_end_date"),
        "rent_amount": fields.get("rent_amount"),
        "bond_amount": fields.get("bond_amount"),
        "num_occupants": fields.get("num_occupants"),
        "pet_permission": fields.get("pet_permission"),
        "parking": fields.get("parking"),
        "special_conditions": fields.get("special_conditions"),
        "landlord_name": fields.get("landlord_name"),
        "property_manager_name": fields.get("property_manager_name"),
        "property_manager_email": fields.get("property_manager_email"),
        "property_manager_phone": fields.get("property_manager_phone"),
        "raw_ai_response": raw_ai_response,
    }
    result = get_client().table("extracted_data").insert(data).execute()
    return result.data[0]


def get_extracted_data(lease_upload_id: str) -> dict | None:
    result = (
        get_client()
        .table("extracted_data")
        .select("*")
        .eq("lease_upload_id", lease_upload_id)
        .execute()
    )
    return result.data[0] if result.data else None


# ---------------------------------------------------------------------------
# welcome_packs
# ---------------------------------------------------------------------------

def save_welcome_pack(lease_upload_id: str, file_path: str, file_name: str) -> dict:
    data = {
        "lease_upload_id": lease_upload_id,
        "file_path": file_path,
        "file_name": file_name,
    }
    result = get_client().table("welcome_packs").insert(data).execute()
    return result.data[0]


def get_welcome_pack(lease_upload_id: str) -> dict | None:
    result = (
        get_client()
        .table("welcome_packs")
        .select("*")
        .eq("lease_upload_id", lease_upload_id)
        .execute()
    )
    return result.data[0] if result.data else None


# ---------------------------------------------------------------------------
# Storage — leases bucket
# ---------------------------------------------------------------------------

def upload_lease_file(
    user_id: str, upload_id: str, file_name: str, file_bytes: bytes, content_type: str
) -> str:
    """Upload a lease file and return the storage path."""
    path = f"{user_id}/{upload_id}/{file_name}"
    get_client().storage.from_("leases").upload(
        path=path,
        file=file_bytes,
        file_options={"content-type": content_type},
    )
    return path


def download_lease_file(file_path: str) -> bytes:
    """Download a lease file by its storage path."""
    return get_client().storage.from_("leases").download(file_path)


# ---------------------------------------------------------------------------
# Storage — welcome-packs bucket
# ---------------------------------------------------------------------------

def upload_welcome_pack_file(
    user_id: str, upload_id: str, file_name: str, file_bytes: bytes
) -> str:
    """Upload a welcome pack .docx and return the storage path."""
    path = f"{user_id}/{upload_id}/{file_name}"
    get_client().storage.from_("welcome-packs").upload(
        path=path,
        file=file_bytes,
        file_options={"content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    )
    return path


def get_welcome_pack_download_url(file_path: str, expires_in: int = 300) -> str:
    """Generate a signed download URL for a welcome pack (default 5 min expiry)."""
    result = get_client().storage.from_("welcome-packs").create_signed_url(
        file_path, expires_in
    )
    return result["signedURL"]
