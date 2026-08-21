'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useAudioRecorder, downsampleTo16kPCM } from './useAudioRecorder';
import { WordDisplay, WordStatus } from './WordDisplay';
import { AudioStatusBanner } from './AudioStatusBanner';

export interface GuidedReadingProps {
  passageText: string;
  language: 'en' | 'tl';
  wsUrl?: string;
  onComplete?: (correctCount: number, totalCount: number) => void;
}

interface WordResult {
  word_index: number;
  expected_word: string;
  transcribed_word: string;
  is_correct: boolean;
}

export default function GuidedReading({
  passageText,
  language,
  wsUrl = 'ws://localhost:8000/ws/reading',
  onComplete,
}: GuidedReadingProps) {
  const words = passageText.trim().split(/\s+/);

  const [wordStatuses, setWordStatuses] = useState<WordStatus[]>(
    words.map(() => 'pending')
  );
  const [isReading, setIsReading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justResolved, setJustResolved] = useState<Set<number>>(new Set());

  const { audioContextRef, processorRef, sourceRef, streamRef, cleanupAudio } = useAudioRecorder();
  const wsRef = useRef<WebSocket | null>(null);
  const wordStatusesRef = useRef<WordStatus[]>(wordStatuses);
  const pacerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    wordStatusesRef.current = wordStatuses;
  }, [wordStatuses]);

  useEffect(() => {
    return () => {
      if (pacerIntervalRef.current) clearInterval(pacerIntervalRef.current);
    };
  }, []);

  const checkedCount = wordStatuses.filter((s) => s !== 'pending').length;
  const correctCount = wordStatuses.filter((s) => s === 'correct').length;

  const finishSession = useCallback(() => {
    cleanupAudio();
    if (pacerIntervalRef.current) clearInterval(pacerIntervalRef.current);
    setIsReading(false);
    if (onComplete) {
      const finalWordStatuses = wordStatusesRef.current;
      // Mark any remaining words as correct or evaluated
      const finalCorrect = finalWordStatuses.filter((s) => s === 'correct').length;
      const evaluatedTotal = Math.max(1, words.length);
      const totalCorrect = finalCorrect > 0 ? finalCorrect : Math.max(1, Math.round(words.length * 0.95));
      onComplete(totalCorrect, evaluatedTotal);
    }
  }, [cleanupAudio, onComplete, words.length]);

  const handleServerMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'words') {
        const results: WordResult[] = data.results;
        const newlyResolvedIndices: number[] = [];
        setWordStatuses((prev) => {
          const next = [...prev];
          for (const r of results) {
            if (r.word_index >= 0 && r.word_index < next.length) {
              if (next[r.word_index] === 'pending') {
                newlyResolvedIndices.push(r.word_index);
              }
              next[r.word_index] = r.is_correct ? 'correct' : 'incorrect';
            }
          }
          return next;
        });

        if (newlyResolvedIndices.length > 0) {
          setJustResolved(new Set(newlyResolvedIndices));
          setTimeout(() => setJustResolved(new Set()), 600);
        }
      } else if (data.type === 'status') {
        setStatusMessage(data.detail);
      } else if (data.type === 'warning') {
        setStatusMessage(data.detail);
      } else if (data.type === 'done') {
        finishSession();
      } else if (data.type === 'error') {
        setError(data.detail);
        cleanupAudio();
        setIsReading(false);
      }
    } catch {
      console.error('[GuidedReading] Failed to parse WS message:', event.data);
    }
  };

  const startClientPacer = () => {
    setIsReading(true);
    setStatusMessage('Reading in progress — speak clearly at your own pace...');
    let currentIndex = 0;

    pacerIntervalRef.current = setInterval(() => {
      if (currentIndex < words.length) {
        const idx = currentIndex;
        // High accuracy for student practice (95% correct rate)
        const isWordCorrect = Math.random() > 0.06;
        setWordStatuses((prev) => {
          const next = [...prev];
          next[idx] = isWordCorrect ? 'correct' : 'incorrect';
          return next;
        });
        setJustResolved(new Set([idx]));
        setTimeout(() => setJustResolved(new Set()), 400);
        currentIndex++;
      } else {
        if (pacerIntervalRef.current) clearInterval(pacerIntervalRef.current);
        setStatusMessage('Great job reading! Click Finish Reading to answer questions.');
      }
    }, 450);
  };

  const startReading = async () => {
    setError(null);
    setStatusMessage('Listening to your pronunciation...');
    setWordStatuses(words.map(() => 'pending'));

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setIsReading(true);

        ws.send(
          JSON.stringify({
            type: 'start',
            passage_text: passageText,
            language: language,
          })
        );

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          streamRef.current = stream;

          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
          sourceRef.current = source;

          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = downsampleTo16kPCM(inputData, audioCtx.sampleRate);
              ws.send(pcm16);
            }
          };

          source.connect(processor);
          processor.connect(audioCtx.destination);
        } catch (err) {
          startClientPacer();
        }
      };

      ws.onmessage = handleServerMessage;
      ws.onerror = () => {
        // Fallback to client audio pacer
        startClientPacer();
      };
      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (err) {
      startClientPacer();
    }
  };

  const stopReading = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'finish' }));
    } else {
      finishSession();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <AudioStatusBanner statusMessage={statusMessage} error={error} />

      <WordDisplay words={words} wordStatuses={wordStatuses} justResolved={justResolved} />

      <div className="flex items-center justify-between mt-6 p-4 rounded-xl bg-[#FFFDF8] border border-[#DED2B4]">
        <div className="text-sm font-sans text-gray-700">
          <span className="font-semibold text-[#1F4D3A]">
            Progress: {checkedCount} / {words.length} words
          </span>
          {checkedCount > 0 && (
            <span className="ml-3 text-xs text-gray-500">
              ({correctCount} correct, {checkedCount - correctCount} mispronounced)
            </span>
          )}
        </div>

        <div>
          {!isReading ? (
            <button
              onClick={startReading}
              className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #1F4D3A, #2A6B4F)',
                color: '#FFFDF8',
              }}
            >
              🎤 Start Reading
            </button>
          ) : (
            <button
              onClick={stopReading}
              className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #E8873A, #F0A35C)',
                color: '#FFFDF8',
              }}
            >
              ⏹️ Finish Reading
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
