'use client';

import {
  Card,
  PrimaryButton,
  PhilIRIBadge,
  MiniProgressBar,
  FONT_SANS,
  FONT_SERIF,
  FONT_MONO,
  CHALK_GREEN,
  MUTED,
  INK,
  TAN_BORDER,
  PhilIRILevel,
} from './dashboard/_shared';

import { overallTier } from '@/lib/scoring';

export default function AssignedTestSubmissionStep({
  wordPct,
  compPct,
  teacherName,
  onReturnHome,
}: {
  wordPct: number;
  compPct: number;
  teacherName: string;
  onReturnHome: () => void;
}) {
  const level = overallTier(wordPct, compPct);

  const scoreColor = (pct: number) => {
    if (pct >= 90) return '#2E7D4F';
    if (pct >= 70) return '#8A5A1E';
    return '#B4602E';
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 rb-fade-in-up">
      <Card className="text-center mb-6">
        <div
          className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white"
          style={{ background: '#2E7D4F' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1
          className="text-2xl sm:text-3xl mb-2"
          style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}
        >
          Assigned Test Submitted!
        </h1>
        <p className="text-sm max-w-md mx-auto mb-6" style={{ fontFamily: FONT_SANS, color: MUTED }}>
          Your test results have been recorded and sent to <strong style={{ color: INK }}>{teacherName}</strong> for evaluation.
        </p>

        {/* Calculated Level */}
        <div className="inline-flex flex-col items-center gap-1.5 p-4 rounded-xl border mb-6 bg-[#FAF7F0]" style={{ borderColor: TAN_BORDER }}>
          <span className="text-xs uppercase tracking-wider" style={{ fontFamily: FONT_SANS, color: MUTED, fontWeight: 600 }}>
            Calculated Phil-IRI Assessment Level
          </span>
          <PhilIRIBadge level={level} />
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4 border-t" style={{ borderColor: TAN_BORDER }}>
          <div className="p-3.5 rounded-xl border bg-white" style={{ borderColor: TAN_BORDER }}>
            <span className="text-xs block mb-1" style={{ fontFamily: FONT_SANS, color: MUTED }}>
              Word Recognition Accuracy
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold font-mono" style={{ color: scoreColor(wordPct) }}>
                {Math.round(wordPct)}%
              </span>
              <MiniProgressBar value={wordPct} color={scoreColor(wordPct)} width={90} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border bg-white" style={{ borderColor: TAN_BORDER }}>
            <span className="text-xs block mb-1" style={{ fontFamily: FONT_SANS, color: MUTED }}>
              Comprehension Score
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold font-mono" style={{ color: scoreColor(compPct) }}>
                {Math.round(compPct)}%
              </span>
              <MiniProgressBar value={compPct} color={scoreColor(compPct)} width={90} />
            </div>
          </div>
        </div>
      </Card>

      {/* Return to Dashboard Button */}
      <div className="flex justify-center">
        <PrimaryButton accent="#E8873A" onClick={onReturnHome} className="px-8 py-3 text-base">
          Back to Dashboard
        </PrimaryButton>
      </div>
    </div>
  );
}
