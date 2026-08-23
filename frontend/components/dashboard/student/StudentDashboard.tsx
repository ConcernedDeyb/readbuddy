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
  NotebookEntry,
} from '../_shared';
import StudentProgressChart from './StudentProgressChart';
import { useState, useEffect } from 'react';

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
  sectionName,
  gradeLevel,
  teacherName,
  sessions,
  pendingTests,
  onStartSession,
  onStartTest,
  onGoToNotebook,
}: {
  studentName: string;
  sectionName?: string;
  gradeLevel?: number;
  teacherName?: string;
  sessions: ReadingSession[];
  pendingTests: PendingTest[];
  onStartSession: () => void;
  onStartTest: (testId: string) => void;
  onGoToNotebook?: () => void;
}) {
  const totalSessions = sessions.length;
  const avgWordRecognition = totalSessions > 0
    ? Math.round(sessions.reduce((s, r) => s + r.word_recognition_score, 0) / totalSessions)
    : 0;

  const currentLevel: PhilIRILevel = sessions.length > 0 ? sessions[0].phil_iri_level : 'instructional';
  const isAssigned = sectionName && sectionName !== 'Unassigned';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <SectionHeader
            title={`Hello, ${studentName}!`}
            subtitle={
              isAssigned
                ? `Section ${sectionName} (Grade ${gradeLevel || 7})${teacherName ? ` · Teacher: ${teacherName}` : ''}`
                : 'Account Status: Unassigned (Not yet enrolled in a section)'
            }
            accent={STUDENT_ACCENT}
          />
        </div>
        <PrimaryButton accent={STUDENT_ACCENT} onClick={onStartSession}>
          + Start Practice
        </PrimaryButton>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Total Sessions" value={totalSessions} accent={STUDENT_ACCENT} />
        <StatCard label="Avg. Recognition" value={`${avgWordRecognition}%`} accent={STUDENT_ACCENT} />
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

      {/* ─── My Notebook Widget ─── */}
      <NotebookWidget studentName={studentName} onGoToNotebook={onGoToNotebook} />

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

/* ─── Notebook Widget for Student Homepage ─── */

function NotebookWidget({
  studentName,
  onGoToNotebook,
}: {
  studentName: string;
  onGoToNotebook?: () => void;
}) {
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    function load() {
      try {
        const saved = localStorage.getItem('readbuddy_teacher_notebook');
        const currentUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
        const currentName = (currentUser.display_name || studentName || '').toLowerCase();
        const currentUsername = (currentUser.username || '').toLowerCase();
        const currentSchoolId = (currentUser.school_id || '').toLowerCase();

        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const myEntries = parsed.filter((entry: NotebookEntry) =>
              entry.assigned_student_names.some((n) => n.toLowerCase() === currentName) ||
              entry.assigned_student_ids.some((id) => id.toLowerCase() === currentUsername || id.toLowerCase() === currentSchoolId || id === currentUser.id)
            );
            setEntries(myEntries.slice(0, 5)); // Show latest 5
          }
        }

        const savedStatuses = localStorage.getItem('readbuddy_student_notebook_status');
        if (savedStatuses) setStatuses(JSON.parse(savedStatuses));
      } catch (e) {}
    }
    load();
    window.addEventListener('readbuddy_notebook_updated', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('readbuddy_notebook_updated', load);
      window.removeEventListener('storage', load);
    };
  }, [studentName]);

  function getStatus(entryId: string): string {
    try {
      const currentUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
      const name = (currentUser.display_name || studentName || '').toLowerCase();
      return statuses[`${entryId}::${name}`] || 'new';
    } catch { return 'new'; }
  }

  const STATUS_BADGE: Record<string, { tone: 'accent' | 'info' | 'success'; label: string }> = {
    new: { tone: 'accent', label: 'New' },
    reviewed: { tone: 'info', label: 'Reviewed' },
    studied: { tone: 'success', label: 'Studied' },
  };

  if (entries.length === 0) return null;

  const newCount = entries.filter((e) => getStatus(e.id) === 'new').length;

  return (
    <Card className="mb-6 border-l-4" style={{ borderLeftColor: '#3D6B8A' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={CHALK_GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6s1.5-2 5-2 5 2 5 2v14s-1.5-1-5-1-5 1-5 1V6z" />
            <path d="M12 6s1.5-2 5-2 5 2 5 2v14s-1.5-1-5-1-5 1-5 1V6z" />
          </svg>
          <h2 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
            My Notebook
          </h2>
          {newCount > 0 && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
              style={{ background: '#E8873A', color: '#FFFDF8', fontFamily: FONT_MONO }}
            >
              {newCount}
            </span>
          )}
        </div>
        {onGoToNotebook && (
          <button
            onClick={onGoToNotebook}
            className="text-xs font-semibold transition-colors hover:underline cursor-pointer"
            style={{ fontFamily: FONT_SANS, color: '#3D6B8A' }}
          >
            View All
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {entries.map((entry) => {
          const status = getStatus(entry.id);
          const badge = STATUS_BADGE[status] || STATUS_BADGE.new;
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:bg-[#1F4D3A03]"
              style={{ background: CREAM, borderColor: TAN_BORDER }}
              onClick={onGoToNotebook}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold truncate" style={{ fontFamily: FONT_SANS, color: INK }}>
                    {entry.title}
                  </span>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>
                <span className="text-[11px]" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                  From {entry.teacher_name} · {entry.created_at}
                  {entry.files.length > 0 ? ` · ${entry.files.length} file${entry.files.length !== 1 ? 's' : ''}` : ''}
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 ml-2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
