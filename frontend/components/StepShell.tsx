'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReadBuddyLogo } from './brand';
import { AlertTriangle, Check } from 'lucide-react';

export type SessionStep = 'input' | 'review' | 'reading' | 'comprehension' | 'result' | 'briefing' | 'submission';

export interface StepItem {
  key: SessionStep;
  label: string;
  shortLabel: string;
}

const PRACTICE_STEPS: StepItem[] = [
  { key: 'input', label: 'Choose Text', shortLabel: 'Text' },
  { key: 'review', label: 'Verify', shortLabel: 'Check' },
  { key: 'reading', label: 'Read Aloud', shortLabel: 'Read' },
  { key: 'comprehension', label: 'Quiz', shortLabel: 'Quiz' },
  { key: 'result', label: 'Results', shortLabel: 'Done' },
];

const ASSIGNED_TEST_STEPS: StepItem[] = [
  { key: 'briefing', label: 'Test Briefing', shortLabel: 'Briefing' },
  { key: 'reading', label: 'Read Aloud', shortLabel: 'Read' },
  { key: 'comprehension', label: 'Teacher Quiz', shortLabel: 'Quiz' },
  { key: 'submission', label: 'Submitted', shortLabel: 'Done' },
];

/**
 * Shared Soft-Neobrutalist visual shell for every step in the reading session.
 * Features:
 * - Direct exit button navigating cleanly to the student dashboard
 * - Confirmation modal if attempting to exit during active reading or quiz
 * - Step progress indicator
 * - Official Brand Logo link
 */
export default function StepShell({
  activeStep,
  mode = 'practice',
  onExit,
  children,
}: {
  activeStep: SessionStep;
  mode?: 'practice' | 'test';
  onExit?: () => void;
  children: ReactNode;
}) {
  const router = useRouter();
  const steps = mode === 'test' ? ASSIGNED_TEST_STEPS : PRACTICE_STEPS;
  const activeIndex = steps.findIndex((s) => s.key === activeStep);
  const prevIndexRef = useRef(activeIndex);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [justCompletedIndex, setJustCompletedIndex] = useState<number | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (activeIndex !== prevIndexRef.current) {
      setDirection(activeIndex > prevIndexRef.current ? 'forward' : 'backward');
      if (activeIndex > prevIndexRef.current) {
        setJustCompletedIndex(prevIndexRef.current);
        const t = setTimeout(() => setJustCompletedIndex(null), 450);
        prevIndexRef.current = activeIndex;
        return () => clearTimeout(t);
      }
      prevIndexRef.current = activeIndex;
    }
  }, [activeIndex]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStep]);

  function handleExitClick() {
    // If during active reading or comprehension, prompt confirmation
    if (activeStep === 'reading' || activeStep === 'comprehension') {
      setShowExitConfirm(true);
    } else {
      performExit();
    }
  }

  function performExit() {
    if (onExit) {
      onExit();
    } else {
      router.push('/student');
    }
  }

  return (
    <div className="min-h-screen rb-notebook-bg flex flex-col">
      {/* ─── Top Bar with Soft-Neobrutalism Header & Exit Button ─── */}
      <header className="rb-sidebar border-b-2 border-[#133326]">
        <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          {/* Logo Brand Link */}
          <div
            onClick={handleExitClick}
            className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
            title="Return to Student Dashboard"
          >
            <ReadBuddyLogo variant="header" size="sm" />
          </div>

          {/* Right Actions: Mode Badge & Tactile Exit Button */}
          <div className="flex items-center gap-3">
            <span
              className="hidden sm:inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border border-[#133326]"
              style={{
                background: mode === 'test' ? '#FCEDDE' : '#E8F0F8',
                color: mode === 'test' ? '#B4602E' : '#2C4E66',
              }}
            >
              {mode === 'test' ? 'Assigned Reading Test' : 'Practice Session'}
            </span>

            {/* Tactile Exit Button */}
            <button
              onClick={handleExitClick}
              className="px-3 py-1.5 rounded-xl bg-[#FFFDF8] text-[#1F4D3A] font-bold text-xs font-sans border-2 border-[#133326] shadow-[2.5px_2.5px_0px_#133326] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#133326] transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Return to Student Dashboard"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Exit to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Stepping-Stone Progress Trail */}
        <div className="max-w-3xl mx-auto px-5 pb-3">
          <ol className="flex items-center gap-1">
            {steps.map((step, i) => {
              const done = i < activeIndex;
              const current = i === activeIndex;
              const popping = i === justCompletedIndex;
              return (
                <li key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] transition-all duration-300 border border-[#133326] ${
                        popping ? 'rb-dot-pop' : ''
                      }`}
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        background: done ? '#E8873A' : current ? '#FFFDF8' : 'rgba(251,247,238,0.2)',
                        color: done ? '#FFFDF8' : current ? '#1F4D3A' : 'rgba(251,247,238,0.5)',
                        boxShadow: current ? '2px 2px 0px #133326' : 'none',
                        fontWeight: 700,
                      }}
                    >
                      {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                    </div>
                    <span
                      className="text-[10px] whitespace-nowrap"
                      style={{
                        fontFamily: "'Figtree', sans-serif",
                        color: current ? '#FFFDF8' : 'rgba(251,247,238,0.55)',
                        fontWeight: current ? 700 : 500,
                      }}
                    >
                      <span className="sm:hidden">{step.shortLabel}</span>
                      <span className="hidden sm:inline">{step.label}</span>
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="flex-1 h-px mx-1 mb-4 transition-all duration-500"
                      style={{
                        borderTop: `2px ${done ? 'solid' : 'dashed'} ${done ? '#E8873A' : 'rgba(251,247,238,0.2)'}`,
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      {/* ─── Page Content Canvas ─── */}
      <main className="max-w-3xl mx-auto px-5 py-6 sm:py-8 w-full flex-1">
        <div
          key={activeStep}
          className={direction === 'forward' ? 'rb-panel-forward' : 'rb-panel-backward'}
        >
          {children}
        </div>
      </main>

      {/* ─── Soft-Neobrutalism Exit Confirmation Modal ─── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#FFFDF8] border-2 border-[#1F4D3A] shadow-[6px_6px_0px_#1F4D3A] rb-fade-in-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FCEDDE] text-[#B4602E] border-2 border-[#1F4D3A] flex items-center justify-center font-bold text-lg">
                <AlertTriangle className="w-5 h-5 text-[#B4602E]" strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1F4D3A]">
                  Exit Reading Session?
                </h3>
                <span className="text-xs font-sans text-gray-500">
                  {mode === 'test' ? 'Assigned Reading Assessment' : 'Practice Mode'}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#2B2621]/80 font-sans leading-relaxed mb-6">
              Are you sure you want to exit to the Student Dashboard? Any unsaved reading or quiz progress for this session will be discarded.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl bg-transparent hover:bg-black/5 text-[#1F4D3A] font-bold text-xs border border-gray-300 cursor-pointer"
              >
                Keep Reading
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  performExit();
                }}
                className="px-4 py-2 rounded-xl bg-[#E84A5F] hover:bg-[#D12C42] text-white font-bold text-xs border-2 border-[#133326] shadow-[2.5px_2.5px_0px_#133326] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
