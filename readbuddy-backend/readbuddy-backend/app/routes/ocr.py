from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.ocr_service import ocr_service

router = APIRouter(prefix="/ocr", tags=["ocr"])

MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    """
    Accepts a single photographed page and returns EasyOCR's raw extraction.

    Per Rules.md R-7 / design.md Step 2, this output is `raw_extracted_text`
    only - it is never treated as scoreable "source of truth" text.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}.",
        )

    image_bytes = await file.read()

    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image too large ({len(image_bytes)} bytes). "
            f"Max is {MAX_IMAGE_BYTES} bytes.",
        )

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        extracted_text = ocr_service.extract_text(image_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=422, detail=f"Could not process image: {exc}"
        ) from exc

    return {
        "raw_extracted_text": extracted_text,
        "word_count": len(extracted_text.split()),
    }