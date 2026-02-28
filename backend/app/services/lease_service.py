"""
LeaseService — orchestrates the full lease processing pipeline.

Pipeline stages (status updated in Supabase at each step):
  uploaded → extracting → extracted → generating → complete

On failure at any stage, status is set to 'failed' with an error_message.
"""

import logging
import time

from app.services import supabase as db
from app.services.text_extraction import extract_text
from app.services.gemini import extract_fields
from app.services.docgen import generate_welcome_pack

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_TYPES = {"pdf", "docx"}


class LeaseProcessingError(Exception):
    """Raised when the pipeline fails at any stage."""

    def __init__(self, message: str, stage: str):
        self.message = message
        self.stage = stage
        super().__init__(message)


class LeaseService:
    """Orchestrates lease upload → extraction → docgen → complete pipeline."""

    async def process_lease(
        self,
        user_id: str,
        file_name: str,
        file_bytes: bytes,
        file_type: str,
    ) -> dict:
        """
        Run the full processing pipeline for a single lease.

        Returns a dict with upload_id, status, extracted_data, and welcome_pack_url.
        """
        upload_id: str | None = None
        pipeline_start = time.time()

        try:
            # ------------------------------------------------------------------
            # Stage 1: Validate
            # ------------------------------------------------------------------
            self._validate(file_name, file_bytes, file_type)

            # ------------------------------------------------------------------
            # Stage 2: Store file + create DB record → status: uploaded
            # ------------------------------------------------------------------
            logger.info("[%s] Stage 1/6: Storing file in Supabase Storage", file_name)
            stage_start = time.time()

            file_path_stub = f"{user_id}/pending/{file_name}"
            record = db.create_lease_upload(
                user_id=user_id,
                file_name=file_name,
                file_type=file_type,
                file_path=file_path_stub,
                file_size=len(file_bytes),
            )
            upload_id = record["id"]

            content_type = (
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                if file_type == "docx"
                else "application/pdf"
            )
            storage_path = db.upload_lease_file(
                user_id=user_id,
                upload_id=upload_id,
                file_name=file_name,
                file_bytes=file_bytes,
                content_type=content_type,
            )
            # Update the record with the real storage path
            db.get_client().table("lease_uploads").update(
                {"file_path": storage_path}
            ).eq("id", upload_id).execute()

            logger.info(
                "[%s] Stage 1/6 complete — stored at %s (%.1fs)",
                file_name, storage_path, time.time() - stage_start,
            )

            # ------------------------------------------------------------------
            # Stage 3: Text extraction + AI extraction → status: extracting
            # ------------------------------------------------------------------
            db.update_lease_status(upload_id, user_id, "extracting")
            logger.info("[%s] Stage 2/6: Extracting text from %s", file_name, file_type.upper())
            stage_start = time.time()

            lease_text = extract_text(file_bytes, file_type)
            logger.info(
                "[%s] Text extraction complete (%d chars, %.1fs)",
                file_name, len(lease_text), time.time() - stage_start,
            )

            logger.info("[%s] Stage 3/6: Sending to Gemini 2.5 Flash for field extraction", file_name)
            stage_start = time.time()

            extracted = await extract_fields(lease_text)
            logger.info(
                "[%s] AI extraction complete (%.1fs)",
                file_name, time.time() - stage_start,
            )

            # ------------------------------------------------------------------
            # Stage 4: Save extracted data → status: extracted
            # ------------------------------------------------------------------
            logger.info("[%s] Stage 4/6: Saving extracted data to DB", file_name)
            stage_start = time.time()

            raw_ai_response = extracted.pop("raw_ai_response", {})
            extracted_record = db.save_extracted_data(
                lease_upload_id=upload_id,
                fields=extracted,
                raw_ai_response=raw_ai_response,
            )

            db.update_lease_status(upload_id, user_id, "extracted")
            logger.info(
                "[%s] Stage 4/6 complete — data saved (%.1fs)",
                file_name, time.time() - stage_start,
            )

            # ------------------------------------------------------------------
            # Stage 5: Generate Welcome Pack → status: generating
            # ------------------------------------------------------------------
            db.update_lease_status(upload_id, user_id, "generating")
            logger.info("[%s] Stage 5/6: Generating Welcome Pack .docx", file_name)
            stage_start = time.time()

            pack_bytes = generate_welcome_pack(extracted)
            pack_file_name = f"Welcome_Pack_{extracted.get('tenant_name', 'Tenant').replace(' ', '_')}.docx"

            pack_storage_path = db.upload_welcome_pack_file(
                user_id=user_id,
                upload_id=upload_id,
                file_name=pack_file_name,
                file_bytes=pack_bytes,
            )
            db.save_welcome_pack(
                lease_upload_id=upload_id,
                file_path=pack_storage_path,
                file_name=pack_file_name,
            )

            logger.info(
                "[%s] Stage 5/6 complete — Welcome Pack stored at %s (%.1fs)",
                file_name, pack_storage_path, time.time() - stage_start,
            )

            # ------------------------------------------------------------------
            # Stage 6: Complete → status: complete
            # ------------------------------------------------------------------
            db.update_lease_status(upload_id, user_id, "complete")
            welcome_pack_url = db.get_welcome_pack_download_url(pack_storage_path)

            total_time = time.time() - pipeline_start
            logger.info(
                "[%s] Pipeline complete — status: complete (%.1fs total)",
                file_name, total_time,
            )

            return {
                "upload_id": upload_id,
                "status": "complete",
                "extracted_data": extracted,
                "welcome_pack_url": welcome_pack_url,
            }

        except LeaseProcessingError:
            raise
        except Exception as e:
            logger.exception("[%s] Pipeline failed: %s", file_name, e)
            if upload_id:
                try:
                    db.update_lease_status(upload_id, user_id, "failed", error_message=str(e))
                except Exception:
                    logger.exception("Failed to update status to 'failed'")
            raise LeaseProcessingError(
                message=str(e),
                stage="unknown",
            )

    def _validate(self, file_name: str, file_bytes: bytes, file_type: str) -> None:
        """Validate file type and size before processing."""
        if file_type not in ALLOWED_TYPES:
            raise LeaseProcessingError(
                message=f"Invalid file type '{file_type}'. Only PDF and DOCX are accepted.",
                stage="validation",
            )
        if len(file_bytes) > MAX_FILE_SIZE:
            size_mb = len(file_bytes) / (1024 * 1024)
            raise LeaseProcessingError(
                message=f"File too large ({size_mb:.1f}MB). Maximum size is 10MB.",
                stage="validation",
            )


lease_service = LeaseService()
