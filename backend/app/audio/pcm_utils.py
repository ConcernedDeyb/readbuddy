import numpy as np

SAMPLE_RATE = 16000
BYTES_PER_SAMPLE = 2  # 16-bit PCM
PROCESS_INTERVAL_SECONDS = 1
PROCESS_INTERVAL_BYTES = SAMPLE_RATE * BYTES_PER_SAMPLE * PROCESS_INTERVAL_SECONDS

# RMS threshold for treating audio as silent vs active speech
SILENCE_RMS_THRESHOLD = 0.01

# Consecutive silent windows before warning frontend
CONSECUTIVE_SILENT_WINDOWS_FOR_WARNING = 3


def calculate_rms(pcm_bytes: bytes) -> float:
    """
    Calculate Root Mean Square (RMS) amplitude of 16-bit PCM audio samples.
    Used to filter out silence and hardware dropouts before running ASR inference.
    """
    if not pcm_bytes:
        return 0.0
    samples = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    if samples.size == 0:
        return 0.0
    return float(np.sqrt(np.mean(samples**2)))


def is_silent_window(pcm_bytes: bytes, threshold: float = SILENCE_RMS_THRESHOLD) -> bool:
    """Check whether a PCM audio window falls below the silence threshold."""
    return calculate_rms(pcm_bytes) < threshold
