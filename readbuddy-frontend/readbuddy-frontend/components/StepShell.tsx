'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';


export type SessionStep = 'input' | 'review' | 'reading' | 'comprehension' | 'result' | 'briefing' | 'submission';

export interface StepItem {
  key: SessionStep;
  label: string;
  shortLabel: string;
}

const PRACTICE_STEPS: StepItem[] = [
  { key: 'input', label: 'Bring in text', shortLabel: 'Text' },
  { key: 'review', label: 'Check it', shortLabel: 'Check' },
  { key: 'reading', label: 'Read aloud', shortLabel: 'Read' },
  { key: 'comprehension', label: 'Quiz', shortLabel: 'Quiz' },
  { key: 'result', label: 'Result', shortLabel: 'Done' },
];

const ASSIGNED_TEST_STEPS: StepItem[] = [
  { key: 'briefing', label: 'Test Briefing', shortLabel: 'Briefing' },
  { key: 'reading', label: 'Read Aloud', shortLabel: 'Read' },
  { key: 'comprehension', label: 'Teacher Quiz', shortLabel: 'Quiz' },
  { key: 'submission', label: 'Submitted', shortLabel: 'Done' },
];

/**
 * Shared visual shell for every step in the reading session.
 */
export default function StepShell({
  activeStep,
  mode = 'practice',
  children,
}: {
  activeStep: SessionStep;
  mode?: 'practice' | 'test';
  children: ReactNode;
}) {
  const steps = mode === 'test' ? ASSIGNED_TEST_STEPS : PRACTICE_STEPS;
  const activeIndex = steps.findIndex((s) => s.key === activeStep);
  const prevIndexRef = useRef(activeIndex);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [justCompletedIndex, setJustCompletedIndex] = useState<number | null>(null);

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

  return (
    <div className="min-h-screen rb-notebook-bg">
      {/* Top bar */}
      <header className="rb-sidebar">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBF7EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span
              className="text-[#FBF7EE] text-lg tracking-tight"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
            >
              ReadBuddy
            </span>
          </div>
        </div>

        {/* Stepping-stone progress trail */}
        <div className="max-w-2xl mx-auto px-5 pb-3">
          <ol className="flex items-center gap-1">
            {steps.map((step, i) => {
              const done = i < activeIndex;
              const current = i === activeIndex;
              const popping = i === justCompletedIndex;
              return (
                <li key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] transition-all duration-300 ${popping ? 'rb-dot-pop' : ''}`}
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        background: done ? '#E8873A' : current ? '#FBF7EE' : 'rgba(251,247,238,0.2)',
                        color: done ? '#FBF7EE' : current ? '#1F4D3A' : 'rgba(251,247,238,0.5)',
                        boxShadow: current
                          ? '0 0 0 3px rgba(251,247,238,0.25), 0 2px 8px rgba(0,0,0,0.15)'
                          : 'none',
                        fontWeight: 700,
                      }}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    <span
                      className="text-[10px] whitespace-nowrap"
                      style={{
                        fontFamily: "'Figtree', sans-serif",
                        color: current ? '#FBF7EE' : 'rgba(251,247,238,0.45)',
                        fontWeight: current ? 600 : 400,
                      }}
                    >
                      {/* Show short labels on mobile, full on desktop */}
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

      {/* Page content */}
      <main className="max-w-2xl mx-auto px-5 py-8 sm:py-10 overflow-hidden">
        <div
          key={activeStep}
          className={direction === 'forward' ? 'rb-panel-forward' : 'rb-panel-backward'}
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '28px',
            border: '1px solid #E4DCC8',
            boxShadow: '0 1px 3px rgba(31,77,58,0.06), 0 8px 24px -12px rgba(31,77,58,0.12)',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}