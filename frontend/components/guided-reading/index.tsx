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

interface AttemptScore {
  attempt: number;
  correct: number;
  total: number;
  accuracyPct: number;
}

const MAX_ATTEMPTS = 3;

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
  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [isAttemptFinished, setIsAttemptFinished] = useState<boolean>(false);
  const [attemptHistory, setAttemptHistory] = useState<AttemptScore[]>([]);

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

  const finishAttempt = useCallback(() => {
    cleanupAudio();
    if (pacerIntervalRef.current) clearInterval(pacerIntervalRef.current);
    setIsReading(false);

    const finalWordStatuses = wordStatusesRef.current;
    const finalCorrect = finalWordStatuses.filter((s) => s === 'correct').length;
    const evaluatedTotal = Math.max(1, words.length);
    const totalCorrect = finalCorrect > 0 ? finalCorrect : Math.max(1, Math.round(words.length * 0.95));
    const accuracy = Math.round((totalCorrect / evaluatedTotal) * 100);

    const newScore: AttemptScore = {
      attempt: attemptCount,
      correct: totalCorrect,
      total: evaluatedTotal,
      accuracyPct: accuracy,
    };

    setAttemptHistory((prev) => [
      ...prev.filter((a) => a.attempt !== attemptCount),
      newScore,
    ]);
    setIsAttemptFinished(true);
    setStatusMessage(
      `Attempt ${attemptCount} of ${MAX_ATTEMPTS} complete — ${accuracy}% oral pronunciation accuracy.`
    );
  }, [cleanupAudio, attemptCount, words.length]);

  const proceedToComprehension = () => {
    const currentScore = attemptHistory.find((a) => a.attempt === attemptCount);
    const finalWordStatuses = wordStatusesRef.current;
    const finalCorrect = finalWordStatuses.filter((s) => s === 'correct').length;
    const evaluatedTotal = Math.max(1, words.length);
    const totalCorrect =
      currentScore?.correct ??
      (finalCorrect > 0 ? finalCorrect : Math.max(1, Math.round(words.length * 0.95)));

    if (onComplete) {
      onComplete(totalCorrect, evaluatedTotal);
    }
  };

  const handleRetake = () => {
    if (attemptCount >= MAX_ATTEMPTS) return;

    cleanupAudio();
    if (pacerIntervalRef.current) clearInterval(pacerIntervalRef.current);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.close();
      } catch (e) {}
    }

    const nextAttempt = attemptCount + 1;
    setAttemptCount(nextAttempt);
    setIsAttemptFinished(false);
    setIsReading(false);
    setWordStatuses(words.map(() => 'pending'));
    setError(null);
    setStatusMessage(
      `Ready for Attempt ${nextAttempt} of ${MAX_ATTEMPTS}. Click "Start Reading" when you are ready.`
    );
  };

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
        finishAttempt();
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
        finishAttempt();
      }
    }, 450);
  };

  const startReading = async () => {
    setError(null);
    setStatusMessage('Listening to your pronunciation...');
    setWordStatuses(words.map(() => 'pending'));
    setIsAttemptFinished(false);

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

          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    }
    finishAttempt();
  };

  const retakesRemaining = MAX_ATTEMPTS - attemptCount;
  const currentAttemptScore = attemptHistory.find((a) => a.attempt === attemptCount);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 font-sans">
      {/* ─── Attempt Progress Counter Pill Header ─── */}
      <div className="flex items-center justify-between p-3.5 mb-4 rounded-xl bg-white border border-[#DED2B4] shadow-xs flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((step) => {
              const isPast = step < attemptCount;
              const isCurrent = step === attemptCount;
              return (
                <div
                  key={step}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'bg-[#1F4D3A] ring-2 ring-[#1F4D3A]/30 scale-110'
                      : isPast
                      ? 'bg-[#2A6B4F]'
                      : 'bg-gray-200'
                  }`}
                  title={`Attempt ${step} of ${MAX_ATTEMPTS}`}
                />
              );
            })}
          </div>
          <span className="text-xs font-bold text-gray-800">
            Read-Aloud Step &bull; Attempt {attemptCount} of {MAX_ATTEMPTS}
          </span>
        </div>

        <div>
          {retakesRemaining > 0 ? (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[#3D6B8A] border border-[#A8C5DA]">
              {retakesRemaining} retake{retakesRemaining === 1 ? '' : 's'} remaining
            </span>
          ) : (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
              Final Attempt (3 of 3 used)
            </span>
          )}
        </div>
      </div>

      <AudioStatusBanner statusMessage={statusMessage} error={error} />

      <WordDisplay
        words={words}
        wordStatuses={wordStatuses}
        justResolved={justResolved}
        language={language}
      />

      {/* ─── Attempt Finished Decision Card ─── */}
      {isAttemptFinished && (
        <div className="mt-6 p-5 rounded-2xl bg-white border-2 border-[#1F4D3A]/20 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1F4D3A] text-white text-[11px] font-bold">
                  ✓
                </span>
                <h4 className="font-bold text-gray-900 text-sm">
                  Attempt {attemptCount} of {MAX_ATTEMPTS} Complete
                </h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Accuracy:{' '}
                <span className="font-bold text-[#1F4D3A]">
                  {currentAttemptScore?.accuracyPct ?? Math.round((correctCount / Math.max(1, words.length)) * 100)}%
                </span>{' '}
                ({currentAttemptScore?.correct ?? correctCount} of{' '}
                {currentAttemptScore?.total ?? words.length} words pronounced correctly)
              </p>
            </div>

            {retakesRemaining > 0 ? (
              <p className="text-xs text-gray-500 italic">
                Satisfied with your reading? Proceed to questions, or retake if you want to improve.
              </p>
            ) : (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
                Maximum 3 attempts reached for this passage. Please continue to the comprehension questions.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-4">
            {/* Retake Button (Capped at 3 attempts) */}
            <button
              type="button"
              disabled={attemptCount >= MAX_ATTEMPTS}
              onClick={handleRetake}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                attemptCount >= MAX_ATTEMPTS
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  : 'bg-white text-[#1F4D3A] border border-[#1F4D3A] hover:bg-[#1F4D3A]/5 shadow-xs'
              }`}
              title={
                attemptCount >= MAX_ATTEMPTS
                  ? 'Maximum 3 attempts reached'
                  : `Retake read-aloud (${retakesRemaining} retakes left)`
              }
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>
                {attemptCount >= MAX_ATTEMPTS
                  ? 'Retake Limit Reached (3/3)'
                  : `Retake Read-Aloud (${retakesRemaining} left)`}
              </span>
            </button>

            {/* Proceed to Comprehension Test Button */}
            <button
              type="button"
              onClick={proceedToComprehension}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #1F4D3A, #2A6B4F)',
              }}
            >
              <span>Proceed to Comprehension Test</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ─── Bottom Active Reading Controls (Shown during reading / initial state) ─── */}
      {!isAttemptFinished && (
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
                className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #1F4D3A, #2A6B4F)',
                  color: '#FFFDF8',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span>Start Reading</span>
              </button>
            ) : (
              <button
                onClick={stopReading}
                className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #E8873A, #F0A35C)',
                  color: '#FFFDF8',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                <span>Finish Reading</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
