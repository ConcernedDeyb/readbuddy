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
import { ReadBuddyMascot } from '@/components/brand';
import { useState, useEffect } from 'react';
import { BookOpen, FileText, BarChart2, BookMarked } from 'lucide-react';

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
      {/* ─── Student Welcome Hero with Animated Mascot ─── */}
      <div className="mb-6 p-5 rounded-2xl bg-[#FFFDF8] border-2 border-[#1F4D3A] shadow-[4px_4px_0px_#1F4D3A] flex flex-col sm:flex-row items-center justify-between gap-5 relative">
        <div className="flex items-center gap-4">
          <ReadBuddyMascot
            mood={avgWordRecognition >= 85 ? 'cheering' : 'happy'}
            size={76}
          />
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8873A] bg-[#FCEDDE] px-2 py-0.5 rounded-md border border-[#F0C99A] inline-block mb-1">
              Basic Education Reading Studio
            </span>
            <h1 className="text-2xl font-bold font-serif text-[#1F4D3A]" style={{ fontFamily: FONT_SERIF }}>
              Hello, {studentName}!
            </h1>
            <p className="text-xs text-gray-600 font-sans mt-0.5">
              {isAssigned
                ? `Section ${sectionName} (Grade ${gradeLevel || 7})${teacherName ? ` · Teacher: ${teacherName}` : ''}`
                : 'Account Status: Unassigned (Not yet enrolled in a section)'}
            </p>
          </div>
        </div>

        <PrimaryButton accent={STUDENT_ACCENT} onClick={onStartSession} className="shrink-0">
          + Start Practice Session
        </PrimaryButton>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Total Sessions" value={totalSessions} accent={STUDENT_ACCENT} />
        <StatCard label="Avg. Recognition" value={`${avgWordRecognition}%`} accent={STUDENT_ACCENT} />
        <Card className="flex-1 min-w-[180px] flex items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider block mb-1 text-gray-500 font-mono">Current Reading Tier</span>
            <PhilIRIBadge level={currentLevel} />
          </div>
          <BookOpen className="w-6 h-6 text-[#1F4D3A]" strokeWidth={2.25} />
        </Card>
      </div>

      <StudentProgressChart sessions={sessions as any} />

      {pendingTests.length > 0 && (
        <Card className="mb-6 border-2 border-[#E8873A] shadow-[4px_4px_0px_rgba(232,135,58,0.2)]">
          <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: TAN_BORDER }}>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
              <FileText className="w-4 h-4 text-[#E8873A]" strokeWidth={2.25} />
              <span>Assigned Tests ({pendingTests.length})</span>
            </h2>
            <span className="text-xs font-mono text-[#E8873A] font-bold">Action Required</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {pendingTests.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3.5 rounded-xl border-2 transition-all hover:translate-x-1"
                style={{ background: '#FFFDF8', borderColor: TAN_BORDER }}
              >
                <div>
                  <span className="text-xs font-bold block mb-1" style={{ fontFamily: FONT_SANS, color: INK }}>
                    {t.passage_preview}
                  </span>
                  <div className="flex items-center gap-2 text-[11px]" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                    <span>Assigned by {t.teacher_name}</span>
                    <span>•</span>
                    <span className="font-bold text-[#3D6B8A]">{LANG_LABEL[t.source_language]}</span>
                  </div>
                </div>
                <PrimaryButton accent={STUDENT_ACCENT} onClick={() => onStartTest(t.id)}>
                  Take Test ›
                </PrimaryButton>
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
          <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: TAN_BORDER }}>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
              <BarChart2 className="w-4 h-4 text-[#1F4D3A]" strokeWidth={2.25} />
              <span>Recent Reading History</span>
            </h2>
          </div>
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl border mb-2 bg-[#FFFDF8]"
                style={{ borderColor: `${TAN_BORDER}88` }}
              >
                <div>
                  <span className="text-xs font-bold block" style={{ fontFamily: FONT_SANS, color: INK }}>{s.passage_preview}</span>
                  <span className="text-[11px] font-mono text-gray-500">{s.date} · {LANG_LABEL[s.source_language]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-gray-100" style={{ color: scoreColor(s.word_recognition_score) }}>
                    {s.word_recognition_score}% WR
                  </span>
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
            setEntries(myEntries.slice(0, 5));
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
    <Card className="mb-6 border-2 border-[#3D6B8A] shadow-[4px_4px_0px_rgba(61,107,138,0.18)]">
      <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: TAN_BORDER }}>
        <div className="flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-[#3D6B8A]" strokeWidth={2.25} />
          <h2 className="text-base font-bold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
            My Course Handouts & Notebook
          </h2>
          {newCount > 0 && (
            <span
              className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#9C4B0E]"
              style={{ background: '#E8873A', color: '#FFFDF8', fontFamily: FONT_MONO }}
            >
              {newCount} NEW
            </span>
          )}
        </div>
        {onGoToNotebook && (
          <button
            onClick={onGoToNotebook}
            className="text-xs font-bold transition-colors hover:underline cursor-pointer text-[#3D6B8A]"
            style={{ fontFamily: FONT_SANS }}
          >
            Open Notebook ›
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
              className="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all hover:translate-x-1"
              style={{ background: '#FFFDF8', borderColor: TAN_BORDER }}
              onClick={onGoToNotebook}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold truncate" style={{ fontFamily: FONT_SANS, color: INK }}>
                    {entry.title}
                  </span>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>
                <span className="text-[11px]" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                  From {entry.teacher_name} · {entry.created_at}
                  {entry.files.length > 0 ? ` · ${entry.files.length} attachment${entry.files.length !== 1 ? 's' : ''}` : ''}
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 ml-2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
