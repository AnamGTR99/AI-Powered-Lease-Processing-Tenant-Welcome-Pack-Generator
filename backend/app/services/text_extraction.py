"""
Unified text extraction service for lease files (DOCX + PDF).

Extracts all text locally — no external API calls needed.
- DOCX: walks the raw XML body in document order (paragraphs + tables interleaved)
- PDF: extracts text page-by-page using PyMuPDF
"""

import io

import fitz  # PyMuPDF
from docx import Document
from docx.oxml.ns import qn


def extract_text(file_bytes: bytes, file_type: str) -> str:
    """
    Extract raw text from a PDF or DOCX file.

    Args:
        file_bytes: Raw file content
        file_type: 'pdf' or 'docx'

    Returns:
        Clean text string suitable for sending to an AI model.
    """
    if file_type == "docx":
        return _extract_docx(file_bytes)
    elif file_type == "pdf":
        return _extract_pdf(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def _extract_docx(file_bytes: bytes) -> str:
    """
    Walk the raw XML body in document order so paragraphs and tables
    are captured in their natural reading order. python-docx's
    .paragraphs alone skips table content entirely.
    """
    doc = Document(io.BytesIO(file_bytes))
    chunks: list[str] = []

    for block in doc.element.body:
        # Paragraph
        if block.tag == qn("w:p"):
            text = "".join(
                node.text for node in block.iter(qn("w:t")) if node.text
            )
            if text.strip():
                chunks.append(text.strip())

        # Table — read row by row, cell by cell
        elif block.tag == qn("w:tbl"):
            for row in block.iter(qn("w:tr")):
                row_cells: list[str] = []
                for cell in row.iter(qn("w:tc")):
                    cell_text = "".join(
                        node.text for node in cell.iter(qn("w:t")) if node.text
                    ).strip()
                    if cell_text:
                        row_cells.append(cell_text)
                if row_cells:
                    chunks.append(" | ".join(row_cells))

    return "\n".join(chunks)


def _extract_pdf(file_bytes: bytes) -> str:
    """
    Extract text page-by-page using PyMuPDF.
    'text' mode preserves reading order.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages: list[str] = []
    for i, page in enumerate(doc):
        text = page.get_text("text")
        if text.strip():
            pages.append(f"--- Page {i + 1} ---\n{text.strip()}")
    return "\n\n".join(pages)
