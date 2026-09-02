'use client';

import { useState } from 'react';
import { SearchCheck } from 'lucide-react';

interface ReviewTextStepProps {
  initialText: string;
  onConfirm: (confirmedText: string) => void;
}

/**
 * Per Rules.md R-7 and design.md Step 2: this step is never skipped for
 * OCR input, and the student is scored against exactly what's confirmed
 * here — so the copy is deliberately explicit that this text, not the
 * original photo, becomes the source of truth.
 */
export default function ReviewTextStep({ initialText, onConfirm }: ReviewTextStepProps) {
  const [text, setText] = useState(initialText);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div>
      <p
        className="text-xs tracking-wide uppercase mb-1"
        style={{ fontFamily: "'Space Mono', monospace", color: '#E8873A' }}
      >
        Step 2
      </p>
      <h1
        className="text-2xl mb-2 flex items-center gap-2"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: '#1F4D3A' }}
      >
        <SearchCheck className="w-6 h-6 text-[#1F4D3A]" strokeWidth={2.25} />
        <span>Check the text before you read</span>
      </h1>
      <p className="mb-4" style={{ fontFamily: "'Figtree', sans-serif", color: '#5B6B62' }}>
        Sometimes photos aren&apos;t read perfectly. Fix anything that looks wrong below —
        this is exactly what you&apos;ll be reading aloud.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        className="rb-input w-full !rounded-xl resize-none"
        style={{ lineHeight: 1.8 }}
      />
      <div className="flex items-center justify-between mt-2 mb-2">
        <span
          className="text-xs"
          style={{ fontFamily: "'Space Mono', monospace", color: 'rgba(43,38,33,0.5)' }}
        >
          {wordCount} word{wordCount !== 1 ? 's' : ''}
        </span>
      </div>
      <button
        onClick={() => onConfirm(text.trim())}
        disabled={!text.trim()}
        className="rb-action mt-2 px-5 py-2.5 rounded-full text-sm inline-flex items-center gap-1.5 transition-all duration-200 hover:shadow-md disabled:opacity-40 disabled:hover:shadow-none"
        style={{
          fontFamily: "'Figtree', sans-serif",
          fontWeight: 600,
          background: 'linear-gradient(135deg, #E8873A, #E8873ADD)',
          color: '#FFFDF8',
        }}
      >
        Looks good, continue <span aria-hidden>→</span>
      </button>
    </div>
  );
}
