"""Lease upload router — thin layer over LeaseService."""

import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.middleware.auth import get_current_user
from app.models.api import (
    LeaseUploadResponse,
    LeaseHistoryItem,
    LeaseDetailResponse,
    ErrorResponse,
)
from app.services.lease_service import lease_service, LeaseProcessingError
from app.services import supabase as db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/lease", tags=["lease"])


@router.post(
    "/upload",
    response_model=LeaseUploadResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Invalid file type"},
        413: {"model": ErrorResponse, "description": "File too large"},
        500: {"model": ErrorResponse, "description": "Processing failed"},
    },
)
async def upload_lease(
    file: UploadFile,
    user_id: str = Depends(get_current_user),
):
    """Upload a lease file and extract all 14 fields via the AI pipeline."""
    # Determine file type from extension
    file_name = file.filename or "unknown"
    extension = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""

    # Read file bytes
    file_bytes = await file.read()

    try:
        result = await lease_service.process_lease(
            user_id=user_id,
            file_name=file_name,
            file_bytes=file_bytes,
            file_type=extension,
        )
        return result

    except LeaseProcessingError as e:
        if e.stage == "validation" and "file type" in e.message.lower():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=e.message,
            )
        if e.stage == "validation" and "too large" in e.message.lower():
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=e.message,
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {e.message}",
        )


@router.get(
    "/history",
    response_model=list[LeaseHistoryItem],
)
async def get_lease_history(
    user_id: str = Depends(get_current_user),
):
    """List all lease uploads for the current user, most recent first."""
    uploads = db.list_lease_uploads(user_id)

    items = []
    for upload in uploads:
        ed = upload.get("extracted_data")  # dict or None (1:1 join)
        has_pack = bool(upload.get("welcome_packs"))  # dict or None (1:1 join)

        items.append(LeaseHistoryItem(
            upload_id=upload["id"],
            file_name=upload["file_name"],
            status=upload["status"],
            created_at=upload["created_at"],
            tenant_name=ed.get("tenant_name") if ed else None,
            property_address=ed.get("property_address") if ed else None,
            has_welcome_pack=has_pack,
        ))

    return items


@router.get(
    "/{upload_id}",
    response_model=LeaseDetailResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Not found"},
    },
)
async def get_lease_detail(
    upload_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get full details for a single lease upload."""
    lease = db.get_lease_upload(upload_id, user_id)
    if not lease:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lease upload not found",
        )

    # Fetch extracted data
    extracted = db.get_extracted_data(upload_id)
    extracted_dict = None
    if extracted:
        extracted_dict = {
            k: v for k, v in extracted.items()
            if k not in ("id", "lease_upload_id", "raw_ai_response", "created_at")
        }

    # Fetch welcome pack URL if available
    welcome_pack_url = None
    pack = db.get_welcome_pack(upload_id)
    if pack:
        welcome_pack_url = db.get_welcome_pack_download_url(pack["file_path"])

    return LeaseDetailResponse(
        upload_id=lease["id"],
        file_name=lease["file_name"],
        file_type=lease["file_type"],
        status=lease["status"],
        created_at=lease["created_at"],
        error_message=lease.get("error_message"),
        extracted_data=extracted_dict,
        welcome_pack_url=welcome_pack_url,
    )
