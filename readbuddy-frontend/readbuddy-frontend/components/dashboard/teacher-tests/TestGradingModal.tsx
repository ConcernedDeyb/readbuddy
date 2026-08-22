'use client';

import { useState } from 'react';
import {
  DetailPanel,
  Avatar,
  MiniProgressBar,
  PhilIRIBadge,
  PrimaryButton,
  GhostButton,
  PhilIRILevel,
  ReadingTest,
  TestAssignment,
  FONT_SERIF,
  FONT_SANS,
  FONT_MONO,
  CHALK_GREEN,
  TAN_BORDER,
  CREAM,
  INK,
  MUTED,
} from '../_shared';

const TEACHER_ACCENT = '#3D6B8A';
const LANG_LABEL: Record<string, string> = { en: 'English', tl: 'Tagalog' };

function relativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return dateStr;
  } catch {
    return dateStr;
  }
}

function scoreColor(pct: number): string {
  if (pct >= 90) return '#2E7D4F';
  if (pct >= 70) return '#8A5A1E';
  return '#B4602E';
}

export function TestGradingModal({
  gradingAssignment,
  gradeOverride,
  setGradeOverride,
  handleSaveGrade,
  onClose,
}: {
  gradingAssignment: { test: ReadingTest; assignment: TestAssignment } | null;
  gradeOverride: PhilIRILevel | '';
  setGradeOverride: (g: PhilIRILevel | '') => void;
  handleSaveGrade: () => void;
  onClose: () => void;
}) {
  const [remarks, setRemarks] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  function playSampleAudio() {
    setIsPlayingAudio(true);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 4000);
  }

  return (
    <DetailPanel
      open={!!gradingAssignment}
      onClose={onClose}
      title={gradingAssignment?.assignment.status === 'graded' ? 'Review Grade & Remarks' : 'Grade Assignment'}
    >
      {gradingAssignment && (
        <div>
          {/* Student & Passage Info */}
          <div className="flex items-center gap-3 mb-5">
            <Avatar name={gradingAssignment.assignment.student_name} accent={TEACHER_ACCENT} size={44} />
            <div>
              <div style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN, fontSize: 16 }}>
                {gradingAssignment.assignment.student_name}
              </div>
              <div className="text-xs mt-0.5" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                {gradingAssignment.assignment.completed_at
                  ? `Completed ${relativeDate(gradingAssignment.assignment.completed_at)}`
                  : 'Completed'}
              </div>
            </div>
          </div>

          <div
            className="rounded-xl px-4 py-3 mb-5 text-sm"
            style={{ background: CREAM, border: `1px solid ${TAN_BORDER}`, fontFamily: FONT_SANS, color: INK, lineHeight: 1.6 }}
          >
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700 mr-2" style={{ fontFamily: FONT_MONO }}>
              {LANG_LABEL[gradingAssignment.test.source_language]}
            </span>
            {gradingAssignment.test.passage_preview}
          </div>

          {/* Audio Review Section */}
          <div className="mb-5 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCC8] flex items-center justify-between">
            <div>
              <span className="text-xs font-serif font-bold text-[#1F4D3A] block">Student Audio Recording</span>
              <span className="text-[11px] text-gray-500 font-sans">Recorded during live reading assessment</span>
            </div>
            <button
              type="button"
              onClick={playSampleAudio}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#3D6B8A] text-white hover:bg-[#2C4E66] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{isPlayingAudio ? 'Playing...' : 'Listen Audio'}</span>
            </button>
          </div>

          {/* Scores */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wide mb-3" style={{ fontFamily: FONT_SANS, color: MUTED, letterSpacing: '0.05em' }}>
              Automated Phil-IRI Scores
            </h3>
            <div className="flex flex-col gap-4">
              <div
                className="rounded-xl px-4 py-3.5"
                style={{ background: '#FFFDF8', border: `1px solid ${TAN_BORDER}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ fontFamily: FONT_SANS, fontWeight: 500, color: INK }}>
                    Word Recognition
                  </span>
                  <span
                    className="text-lg"
                    style={{ fontFamily: FONT_MONO, fontWeight: 700, color: scoreColor(gradingAssignment.assignment.word_recognition_score || 0) }}
                  >
                    {Math.round(gradingAssignment.assignment.word_recognition_score || 0)}%
                  </span>
                </div>
                <MiniProgressBar
                  value={gradingAssignment.assignment.word_recognition_score || 0}
                  color={scoreColor(gradingAssignment.assignment.word_recognition_score || 0)}
                  width="100%"
                />
              </div>
              <div
                className="rounded-xl px-4 py-3.5"
                style={{ background: '#FFFDF8', border: `1px solid ${TAN_BORDER}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ fontFamily: FONT_SANS, fontWeight: 500, color: INK }}>
                    Comprehension
                  </span>
                  <span
                    className="text-lg"
                    style={{ fontFamily: FONT_MONO, fontWeight: 700, color: scoreColor(gradingAssignment.assignment.comprehension_score || 0) }}
                  >
                    {Math.round(gradingAssignment.assignment.comprehension_score || 0)}%
                  </span>
                </div>
                <MiniProgressBar
                  value={gradingAssignment.assignment.comprehension_score || 0}
                  color={scoreColor(gradingAssignment.assignment.comprehension_score || 0)}
                  width="100%"
                />
              </div>
            </div>
          </div>

          {/* Auto-calculated Phil-IRI Level */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wide mb-3" style={{ fontFamily: FONT_SANS, color: MUTED, letterSpacing: '0.05em' }}>
              Phil-IRI Assessment Level
            </h3>
            <div
              className="rounded-xl px-4 py-3.5 flex items-center justify-between"
              style={{ background: '#FFFDF8', border: `1px solid ${TAN_BORDER}` }}
            >
              <span className="text-sm" style={{ fontFamily: FONT_SANS, color: INK }}>
                Calculated Level
              </span>
              {gradingAssignment.assignment.phil_iri_level && (
                <PhilIRIBadge level={gradingAssignment.assignment.phil_iri_level} />
              )}
            </div>
          </div>

          {/* Grade Override */}
          <div className="mb-6">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED, fontWeight: 500 }}>
                Confirm or override grade
              </span>
              <select
                value={gradeOverride || gradingAssignment.assignment.phil_iri_level || ''}
                onChange={(e) => setGradeOverride(e.target.value as PhilIRILevel)}
                className="rb-input"
              >
                <option value="independent">Independent</option>
                <option value="instructional">Instructional</option>
                <option value="frustration">Needs Practice</option>
              </select>
            </label>
          </div>

          {/* Teacher Remarks & Qualitative Feedback */}
          <div className="mb-6">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED, fontWeight: 500 }}>
                Teacher Remarks & Qualitative Notes
              </span>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Excellent pace and expression. Keep practicing multi-syllable Tagalog words."
                className="rb-input text-xs leading-relaxed"
              />
            </label>
          </div>

          {/* Save */}
          <div className="flex gap-2">
            <PrimaryButton accent={TEACHER_ACCENT} onClick={handleSaveGrade}>
              {gradingAssignment.assignment.status === 'graded' ? 'Update Grade' : 'Save Grade & Remarks'}
            </PrimaryButton>
            <GhostButton onClick={onClose}>
              Cancel
            </GhostButton>
          </div>
        </div>
      )}
    </DetailPanel>
  );
}
export default TestGradingModal;
