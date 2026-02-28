"""Welcome Pack download router."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from app.middleware.auth import get_current_user
from app.models.api import ErrorResponse
from app.services import supabase as db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/welcome-pack", tags=["welcome-pack"])

DOCX_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)


@router.get(
    "/download/{upload_id}",
    responses={
        404: {"model": ErrorResponse, "description": "Not found"},
    },
)
async def download_welcome_pack(
    upload_id: str,
    user_id: str = Depends(get_current_user),
):
    """Download the generated Welcome Pack .docx for a lease upload."""
    # Check lease belongs to this user
    lease = db.get_lease_upload(upload_id, user_id)
    if not lease:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lease upload not found",
        )

    # Check welcome pack exists
    pack = db.get_welcome_pack(upload_id)
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Welcome Pack not yet generated for this upload",
        )

    # Download file bytes from Supabase Storage
    file_bytes = db.download_welcome_pack_file(pack["file_path"])
    file_name = pack["file_name"]

    return Response(
        content=file_bytes,
        media_type=DOCX_CONTENT_TYPE,
        headers={
            "Content-Disposition": f'attachment; filename="{file_name}"',
        },
    )
