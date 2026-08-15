import gc

import numpy as np
import torch
from transformers import AutoProcessor, Wav2Vec2ForCTC

from app.config import settings

# Internal project language codes ("en"/"tl", matching Schema.md's
# source_language values) mapped to MMS's ISO 639-3 adapter codes.
_LANG_CODE_MAP = {"en": "eng", "tl": "tgl"}


class ASRService:
    """
    Loads ONE shared facebook/mms-1b-all base model and swaps its small
    per-language adapter (~2M params - HF's own docs describe these as
    "efficiently loaded on the fly") rather than keeping two separate
    ~300M wav2vec2 models resident (the original English/Tagalog setup).

    Replaced after real-world testing (see conversation history / R-3
    benchmarking) showed Khalsuu/filipino-wav2vec2-l-xls-r-300m-official
    meaningfully underperforming facebook/mms-1b-all on natural connected
    Tagalog speech under identical clean-audio conditions - this is the
    documented fallback from architecture.md's Open Decisions / PRD.md,
    now promoted to the actual production model per Rules.md R-3.

    Adapter swapping is cheap enough to happen per-transcribe-call if the
    requested language differs from whatever's currently loaded - this
    is NOT the same as the old "keep both fully loaded simultaneously"
    approach, but achieves the same practical goal (no expensive reload
    delay when the language changes) more cheaply, and opens a path to
    real per-word code-switch detection later (not implemented yet - the
    caller still picks one language for the whole session, per
    ws_reading.py's protocol).

    Singleton: instantiated once, shared across requests. Do not construct
    this directly elsewhere - import the `asr_service` instance below.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def load(self):
        if self._loaded:
            return

        self.device = torch.device(
            settings.device if torch.cuda.is_available() else "cpu"
        )
        print(f"[ASRService] Loading MMS-1b-all on {self.device}...")

        self.processor = AutoProcessor.from_pretrained(settings.asr_model)
        self.model = Wav2Vec2ForCTC.from_pretrained(settings.asr_model).to(
            self.device
        )
        self.model.eval()

        # MMS loads the English adapter by default on from_pretrained, but
        # set it explicitly rather than relying on that default, so
        # self._current_lang always accurately reflects what's actually
        # loaded.
        self.processor.tokenizer.set_target_lang("eng")
        self.model.load_adapter("eng")
        self._current_lang = "eng"

        self._loaded = True
        print("[ASRService] MMS-1b-all loaded (eng adapter active).")

    def unload(self):
        """
        Release VRAM. Call this before loading the LLM phase - see
        Rules.md R-5 (one heavy phase at a time in the 8GB VRAM budget).
        """
        if not self._loaded:
            return
        del self.model
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        self._loaded = False
        print("[ASRService] Model unloaded, VRAM released.")

    def _ensure_adapter(self, language: str) -> None:
        """
        Swaps the active language adapter if the request needs a different
        one than what's currently loaded. Skipped when unchanged, since
        even a cheap adapter swap is still wasted work on every ~1s poll
        during a live reading session if the language never actually
        changes (which, per the current one-language-per-session protocol,
        it never does mid-session yet).
        """
        target = _LANG_CODE_MAP.get(language, language)
        if target == self._current_lang:
            return
        print(f"[ASRService] Swapping adapter: {self._current_lang} -> {target}")
        self.processor.tokenizer.set_target_lang(target)
        self.model.load_adapter(target)
        self._current_lang = target

    def transcribe(self, audio_array, sample_rate: int, language: str = "en") -> str:
        if not self._loaded:
            raise RuntimeError("ASR model not loaded - call load() first.")

        self._ensure_adapter(language)

        inputs = self.processor(
            audio_array, sampling_rate=sample_rate, return_tensors="pt"
        )
        input_values = inputs.input_values.to(self.device)

        with torch.no_grad():
            logits = self.model(input_values).logits

        predicted_ids = torch.argmax(logits, dim=-1)[0]
        transcription = self.processor.decode(predicted_ids)

        # Same reasoning as before: ws_reading.py re-transcribes the FULL
        # session buffer on every pass, so each pass allocates a larger
        # input tensor than the last. Without empty_cache() the CUDA
        # caching allocator holds onto the high-water-mark reservation for
        # the rest of the session instead of releasing it between passes.
        del inputs, input_values, logits, predicted_ids
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        return transcription

    def transcribe_pcm16(
        self, pcm_bytes: bytes, sample_rate: int = 16000, language: str = "en"
    ) -> str:
        """
        Convenience wrapper for the live WebSocket reading pipeline
        (architecture.md §4), which streams raw 16-bit signed PCM audio
        rather than pre-loaded float arrays. Converts to the normalized
        float32 range wav2vec2's processor expects ([-1.0, 1.0]) before
        delegating to transcribe().
        """
        audio_array = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0

        # TEMP DIAGNOSTIC - remove once audio path is confirmed.
        print(
            f"[AUDIO CHECK] samples={len(audio_array)} "
            f"min={audio_array.min():.4f} max={audio_array.max():.4f} "
            f"rms={np.sqrt(np.mean(audio_array**2)):.6f}"
        )

        return self.transcribe(audio_array, sample_rate=sample_rate, language=language)


# Shared singleton - import this, don't instantiate ASRService() elsewhere.
asr_service = ASRService()