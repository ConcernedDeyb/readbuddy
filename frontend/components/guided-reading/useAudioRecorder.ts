'use client';

import { useRef, useCallback } from 'react';

export function downsampleTo16kPCM(
  buffer: Float32Array,
  inputSampleRate: number
): ArrayBuffer {
  const targetRate = 16000;
  const ratio = inputSampleRate / targetRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Int16Array(newLength);

  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    const sample = count > 0 ? accum / count : 0;
    const clamped = Math.max(-1, Math.min(1, sample));
    result[offsetResult] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }

  return result.buffer;
}

export function useAudioRecorder() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupAudio = useCallback(() => {
    try {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.warn('[useAudioRecorder] Audio cleanup warning:', err);
    } finally {
      processorRef.current = null;
      sourceRef.current = null;
      audioContextRef.current = null;
      streamRef.current = null;
    }
  }, []);

  return {
    audioContextRef,
    processorRef,
    sourceRef,
    streamRef,
    cleanupAudio,
    downsampleTo16kPCM,
  };
}
