"""Pydantic models for lease extraction data."""

from pydantic import BaseModel


class ExtractedLeaseData(BaseModel):
    tenant_name: str
    property_address: str
    lease_start_date: str
    lease_end_date: str
    rent_amount: str
    bond_amount: str
    num_occupants: str
    pet_permission: str
    parking: str
    special_conditions: str | None = None
    landlord_name: str
    property_manager_name: str
    property_manager_email: str
    property_manager_phone: str
