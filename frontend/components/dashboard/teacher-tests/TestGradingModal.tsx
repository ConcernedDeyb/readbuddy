'use client';

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
  return (
    <DetailPanel
      open={!!gradingAssignment}
      onClose={onClose}
      title={gradingAssignment?.assignment.status === 'graded' ? 'Review Grade' : 'Grade Assignment'}
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

          {/* Scores */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wide mb-3" style={{ fontFamily: FONT_SANS, color: MUTED, letterSpacing: '0.05em' }}>
              Scores
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
              Phil-IRI Assessment
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

          {/* Phil-IRI Rubric Reference */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wide mb-3" style={{ fontFamily: FONT_SANS, color: MUTED, letterSpacing: '0.05em' }}>
              Phil-IRI Rubric Reference
            </h3>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${TAN_BORDER}` }}
            >
              <table className="rb-table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Word Recognition</th>
                    <th>Comprehension</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="rb-tier rb-tier-independent" style={{ fontSize: 10 }}>Independent</span></td>
                    <td style={{ fontFamily: FONT_MONO, fontSize: 12 }}>97–100%</td>
                    <td style={{ fontFamily: FONT_MONO, fontSize: 12 }}>80–100%</td>
                  </tr>
                  <tr>
                    <td><span className="rb-tier rb-tier-instructional" style={{ fontSize: 10 }}>Instructional</span></td>
                    <td style={{ fontFamily: FONT_MONO, fontSize: 12 }}>90–96%</td>
                    <td style={{ fontFamily: FONT_MONO, fontSize: 12 }}>59–79%</td>
                  </tr>
                  <tr>
                    <td><span className="rb-tier rb-tier-frustration" style={{ fontSize: 10 }}>Needs Practice</span></td>
                    <td style={{ fontFamily: FONT_MONO, fontSize: 12 }}>&lt; 90%</td>
                    <td style={{ fontFamily: FONT_MONO, fontSize: 12 }}>&lt; 59%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] mt-2" style={{ fontFamily: FONT_SANS, color: MUTED }}>
              Overall level = the lower of the two tiers (per Phil-IRI standard practice).
            </p>
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

          {/* Save */}
          <div className="flex gap-2">
            <PrimaryButton accent={TEACHER_ACCENT} onClick={handleSaveGrade}>
              {gradingAssignment.assignment.status === 'graded' ? 'Update Grade' : 'Save Grade'}
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
