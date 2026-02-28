"""Lease upload router — thin layer over LeaseService."""

import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.middleware.auth import get_current_user
from app.models.api import LeaseUploadResponse, ErrorResponse
from app.services.lease_service import lease_service, LeaseProcessingError

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
