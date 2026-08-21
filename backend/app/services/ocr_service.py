import easyocr


class OCRService:
    """
    Wraps EasyOCR for photographed-page text extraction (architecture.md §1a).

    Runs CPU-only, deliberately: EasyOCR is not part of the phase-managed VRAM
    rotation (ASR <-> LLM, see Rules.md R-5 / architecture.md §3) and keeping
    it off the GPU avoids any contention with those phases.

    This is NOT the source of truth for scoring - output here is
    `raw_extracted_text` only. The student must review/correct it before it
    becomes `confirmed_text` (Rules.md R-7, design.md Step 2). This service
    has no opinion about that review step; it only extracts.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._reader = None
        return cls._instance

    def _get_reader(self) -> easyocr.Reader:
        if self._reader is None:
            print("[OCRService] Initializing EasyOCR reader (en, tl) on CPU...")
            self._reader = easyocr.Reader(["en", "tl"], gpu=False)
            print("[OCRService] Reader ready.")
        return self._reader

    def extract_text(self, image_bytes: bytes) -> str:
        reader = self._get_reader()
        results = reader.readtext(image_bytes, paragraph=True, detail=0)
        return "\n".join(results).strip()


ocr_service = OCRService()