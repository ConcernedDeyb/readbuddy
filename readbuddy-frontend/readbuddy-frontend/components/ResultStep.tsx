'use client';

import { useEffect, useState } from 'react';
import { overallTier, guidanceMessage, PhilIRILevel } from '@/lib/scoring';


interface ResultStepProps {
  wordPct: number;
  compPct: number;
  onRestart: () => void;
  onReturnHome?: () => void;
}

const TIER_LABEL: Record<PhilIRILevel, string> = {
  independent: 'Independent',
  instructional: 'Instructional',
  frustration: 'Needs More Practice',
};

const TIER_COLOR: Record<PhilIRILevel, { text: string; bg: string; border: string; gradient: string }> = {
  independent: { text: '#2F6B4F', bg: '#EAF4EE', border: '#BFE0CC', gradient: 'linear-gradient(135deg, #EAF4EE, #D4ECD9)' },
  instructional: { text: '#8A5A1E', bg: '#FCF1DD', border: '#EFD9AC', gradient: 'linear-gradient(135deg, #FCF1DD, #F5E3C4)' },
  frustration: { text: '#B4602E', bg: '#FCEDDE', border: '#F0C99A', gradient: 'linear-gradient(135deg, #FCEDDE, #F5DFC8)' },
};

function AnimatedScore({ value, label }: { value: number; label: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Math.round(value);
    if (target === 0) { setDisplay(0); return; }
    const duration = 800;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className="rb-score-reveal">
      <div
        className="text-4xl mb-1"
        style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: '#1F4D3A' }}
      >
        {display}%
      </div>
      <div className="text-xs" style={{ fontFamily: "'Figtree', sans-serif", color: '#8A9089' }}>
        {label}
      </div>
      {/* Score bar */}
      <div className="w-20 h-1.5 rounded-full mt-2 mx-auto overflow-hidden" style={{ background: '#E4DCC8' }}>
        <div
          className="h-full rounded-full rb-progress-fill"
          style={{
            width: `${value}%`,
            background: value >= 80 ? '#4E9270' : value >= 59 ? '#D98E2B' : '#C97C1F',
          }}
        />
      </div>
    </div>
  );
}

export default function ResultStep({ wordPct, compPct, onRestart, onReturnHome }: ResultStepProps) {
  const level = overallTier(wordPct, compPct);
  const message = guidanceMessage(level, wordPct, compPct);
  const colors = TIER_COLOR[level];
  const celebrate = level === 'independent';

  return (
    <div className="text-center">
      <p
        className="text-xs tracking-wide uppercase mb-1"
        style={{ fontFamily: "'Space Mono', monospace", color: '#E8873A' }}
      >
        Step 5 · Reading Assessment Summary
      </p>

      {/* Stamped tier badge */}
      <div className="relative inline-block mb-6 mt-2">
        <div
          className={`rb-stamp inline-flex items-center justify-center mx-auto rounded-full ${celebrate ? 'rb-glow-pulse' : ''}`}
          style={{
            width: 130,
            height: 130,
            border: `3px solid ${colors.border}`,
            background: colors.gradient,
            transform: 'rotate(-3deg)',
            boxShadow: `0 4px 20px ${colors.border}66`,
          }}
        >
          <span
            className="text-sm tracking-tight text-center px-2"
            style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: colors.text }}
          >
            {TIER_LABEL[level]}
          </span>
        </div>
      </div>

      <p
        className="mb-8 max-w-sm mx-auto rb-fade-in-up"
        style={{ fontFamily: "'Figtree', sans-serif", color: '#5B6B62', lineHeight: 1.6 }}
      >
        {message}
      </p>

      <div className="flex justify-center gap-12 mb-10">
        <AnimatedScore value={wordPct} label="Pronunciation" />
        <AnimatedScore value={compPct} label="Comprehension" />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onRestart}
          className="px-6 py-2.5 rounded-full text-sm inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:shadow-md cursor-pointer"
          style={{
            fontFamily: "'Figtree', sans-serif",
            fontWeight: 600,
            background: 'linear-gradient(135deg, #E8873A, #E8873ADD)',
            color: '#FFFDF8',
          }}
        >
          Start Another Passage
        </button>

        {onReturnHome && (
          <button
            onClick={onReturnHome}
            className="px-6 py-2.5 rounded-full text-sm inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] cursor-pointer"
            style={{
              fontFamily: "'Figtree', sans-serif",
              fontWeight: 600,
              color: '#1F4D3A',
              border: '1.5px solid #DED2B4',
              background: '#FFFDF8',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Return to Main Dashboard
          </button>
        )}
      </div>
    </div>
  );
}