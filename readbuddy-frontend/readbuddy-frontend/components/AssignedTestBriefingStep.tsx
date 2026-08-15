'use client';

import {
  Card,
  PrimaryButton,
  Badge,
  FONT_SANS,
  FONT_SERIF,
  FONT_MONO,
  CHALK_GREEN,
  MUTED,
  INK,
  TAN_BORDER,
  CREAM,
} from './dashboard/_shared';

export interface AssignedTestData {
  id: string;
  teacherName: string;
  passagePreview: string;
  passageText: string;
  sourceLanguage: 'en' | 'tl';
  wordCount: number;
  instructions?: string;
  assignedAt: string;
  customQuestions?: Array<{
    id: string;
    question_text: string;
    question_type: string;
    choices: string[];
    correct_choice_index: number;
    order_index: number;
  }>;
}

export default function AssignedTestBriefingStep({
  testData,
  onStart,
}: {
  testData: AssignedTestData;
  onStart: () => void;
}) {
  const langLabel = testData.sourceLanguage === 'tl' ? 'Tagalog' : 'English';

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 rb-fade-in-up">
      {/* Test Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge tone="accent">Assigned Test</Badge>
          <span
            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700"
            style={{ fontFamily: FONT_MONO }}
          >
            {langLabel}
          </span>
          <span className="text-xs" style={{ fontFamily: FONT_MONO, color: MUTED }}>
            Assigned {testData.assignedAt}
          </span>
        </div>

        <h1
          className="text-2xl sm:text-3xl mb-2"
          style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}
        >
          Reading & Comprehension Assessment
        </h1>
        <p className="text-sm" style={{ fontFamily: FONT_SANS, color: MUTED }}>
          Assigned by <strong style={{ color: INK }}>{testData.teacherName}</strong> for your class evaluation.
        </p>
      </div>

      {/* Teacher Note Card */}
      {testData.instructions && (
        <Card className="mb-6" style={{ borderColor: '#F0C99A', background: '#FFFAF5' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B4602E]" style={{ fontFamily: FONT_SANS }}>
              Teacher Instructions
            </span>
          </div>
          <p className="text-sm" style={{ fontFamily: FONT_SANS, color: INK, lineHeight: 1.6 }}>
            "{testData.instructions}"
          </p>
        </Card>
      )}

      {/* Passage Overview Card */}
      <Card className="mb-8">
        <h3 className="text-sm uppercase tracking-wide mb-3" style={{ fontFamily: FONT_SANS, fontWeight: 700, color: MUTED }}>
          Passage Overview
        </h3>
        <p
          className="text-base mb-4 line-clamp-3 italic"
          style={{ fontFamily: FONT_SERIF, color: INK, lineHeight: 1.7 }}
        >
          "{testData.passagePreview || testData.passageText.slice(0, 140)}..."
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t" style={{ borderColor: TAN_BORDER }}>
          <div>
            <span className="text-xs block" style={{ fontFamily: FONT_SANS, color: MUTED }}>Length</span>
            <span className="text-sm font-semibold font-mono" style={{ color: CHALK_GREEN }}>{testData.wordCount} words</span>
          </div>
          <div>
            <span className="text-xs block" style={{ fontFamily: FONT_SANS, color: MUTED }}>Language</span>
            <span className="text-sm font-semibold" style={{ fontFamily: FONT_SANS, color: INK }}>{langLabel}</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-xs block" style={{ fontFamily: FONT_SANS, color: MUTED }}>Assessment Steps</span>
            <span className="text-sm font-semibold" style={{ fontFamily: FONT_SANS, color: INK }}>2 Parts (Reading + Quiz)</span>
          </div>
        </div>
      </Card>

      {/* Test Guidelines */}
      <div className="rounded-xl p-4 mb-8" style={{ background: CREAM, border: `1px solid ${TAN_BORDER}` }}>
        <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ fontFamily: FONT_SANS, color: CHALK_GREEN }}>
          Test Guidelines:
        </h4>
        <ul className="text-xs flex flex-col gap-1.5" style={{ fontFamily: FONT_SANS, color: INK }}>
          <li>1. Read the passage aloud smoothly into your microphone.</li>
          <li>2. Answer the comprehension questions after reading.</li>
          <li>3. Your results will be sent directly to {testData.teacherName}.</li>
        </ul>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <PrimaryButton accent="#E8873A" onClick={onStart} className="w-full sm:w-auto px-8 py-3 text-base">
          Begin Test Now
        </PrimaryButton>
      </div>
    </div>
  );
}
