'use client';

import {
  SectionHeader,
  Card,
  StatCard,
  Badge,
  EmptyState,
  PrimaryButton,
  PhilIRIBadge,
  MiniProgressBar,
  FONT_SANS,
  FONT_MONO,
  FONT_SERIF,
  MUTED,
  CHALK_GREEN,
  TAN_BORDER,
  CREAM,
  INK,
  PhilIRILevel,
} from '../_shared';
import StudentProgressChart from './StudentProgressChart';

const STUDENT_ACCENT = '#E8873A';
const LANG_LABEL: Record<string, string> = { en: 'English', tl: 'Tagalog' };

interface ReadingSession {
  id: string;
  passage_preview: string;
  source_language: 'en' | 'tl';
  word_recognition_score: number;
  comprehension_score: number;
  phil_iri_level: PhilIRILevel;
  date: string;
}

interface PendingTest {
  id: string;
  passage_preview: string;
  source_language: 'en' | 'tl';
  teacher_name: string;
  assigned_at: string;
}

function scoreColor(pct: number): string {
  if (pct >= 90) return '#2E7D4F';
  if (pct >= 70) return '#8A5A1E';
  return '#B4602E';
}

export function StudentDashboard({
  studentName,
  sessions,
  pendingTests,
  onStartSession,
  onStartTest,
}: {
  studentName: string;
  sessions: ReadingSession[];
  pendingTests: PendingTest[];
  onStartSession: () => void;
  onStartTest: (testId: string) => void;
}) {
  const totalSessions = sessions.length;
  const avgWordRecognition = totalSessions > 0
    ? Math.round(sessions.reduce((s, r) => s + r.word_recognition_score, 0) / totalSessions)
    : 0;

  const currentLevel: PhilIRILevel = sessions.length > 0 ? sessions[0].phil_iri_level : 'instructional';

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <SectionHeader title={`Hello, ${studentName}!`} subtitle="Ready to practice reading today?" accent={STUDENT_ACCENT} />
        <PrimaryButton accent={STUDENT_ACCENT} onClick={onStartSession}>
          + Start Practice
        </PrimaryButton>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Total Sessions" value={totalSessions} accent={STUDENT_ACCENT} icon="📖" />
        <StatCard label="Avg. Recognition" value={`${avgWordRecognition}%`} accent={STUDENT_ACCENT} icon="🎯" />
        <Card className="flex-1 min-w-[180px] flex items-center gap-3">
          <div>
            <span className="text-xs uppercase tracking-wide block mb-1" style={{ fontFamily: FONT_SANS, color: MUTED }}>Current Level</span>
            <PhilIRIBadge level={currentLevel} />
          </div>
        </Card>
      </div>

      <StudentProgressChart sessions={sessions as any} />

      {pendingTests.length > 0 && (
        <Card className="mb-6 border-l-4" style={{ borderLeftColor: STUDENT_ACCENT }}>
          <h2 className="text-base font-semibold mb-3" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
            Assigned Tests ({pendingTests.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingTests.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ background: CREAM, borderColor: TAN_BORDER }}>
                <div>
                  <span className="text-xs font-semibold block" style={{ fontFamily: FONT_SANS, color: INK }}>{t.passage_preview}</span>
                  <span className="text-[11px]" style={{ fontFamily: FONT_MONO, color: MUTED }}>Assigned by {t.teacher_name} · {LANG_LABEL[t.source_language]}</span>
                </div>
                <PrimaryButton accent={STUDENT_ACCENT} onClick={() => onStartTest(t.id)}>Take Test</PrimaryButton>
              </div>
            ))}
          </div>
        </Card>
      )}

      {sessions.length === 0 ? (
        <EmptyState message="No reading sessions completed yet." actionLabel="Start your first session" onAction={onStartSession} />
      ) : (
        <Card>
          <h2 className="text-base font-semibold mb-3" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>Reading History</h2>
          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: TAN_BORDER + '66' }}>
                <div>
                  <span className="text-xs font-semibold block" style={{ fontFamily: FONT_SANS, color: INK }}>{s.passage_preview}</span>
                  <span className="text-[11px]" style={{ fontFamily: FONT_MONO, color: MUTED }}>{s.date} · {LANG_LABEL[s.source_language]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold" style={{ color: scoreColor(s.word_recognition_score) }}>{s.word_recognition_score}%</span>
                  <PhilIRIBadge level={s.phil_iri_level} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
export default StudentDashboard;
