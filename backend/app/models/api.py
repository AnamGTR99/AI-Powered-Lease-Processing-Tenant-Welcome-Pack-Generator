"""Pydantic response models for API endpoints."""

from pydantic import BaseModel


class LeaseUploadResponse(BaseModel):
    upload_id: str
    status: str
    extracted_data: dict
    welcome_pack_url: str | None = None

    model_config = {"json_schema_extra": {
        "examples": [{
            "upload_id": "550e8400-e29b-41d4-a716-446655440000",
            "status": "complete",
            "extracted_data": {
                "tenant_name": "Sarah Chen",
                "property_address": "42 Oakwood Avenue, Apartment 3B, Richmond VIC 3121",
                "lease_start_date": "1 March 2026",
                "lease_end_date": "28 February 2027",
                "rent_amount": "$2,200.00 per month",
                "bond_amount": "$4,400.00",
                "num_occupants": "1",
                "pet_permission": "Not permitted",
                "parking": "Not included",
                "special_conditions": None,
                "landlord_name": "Robert Harmon",
                "property_manager_name": "Julia Torres",
                "property_manager_email": "julia.torres@acmepg.com.au",
                "property_manager_phone": "+61 3 9555 0142",
            },
            "welcome_pack_url": "https://xxx.supabase.co/storage/v1/object/sign/welcome-packs/...",
        }],
    }}


class ErrorResponse(BaseModel):
    detail: str
