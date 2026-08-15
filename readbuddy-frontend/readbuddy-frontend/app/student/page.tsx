'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell, StudentDashboard, AccountSettings } from '@/components/dashboard';
import {
  SectionHeader,
  Card,
  Badge,
  EmptyState,
  PrimaryButton,
  GhostButton,
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
} from '@/components/dashboard/_shared';

const STUDENT_ACCENT = '#E8873A';
const LANG_LABEL: Record<string, string> = { en: 'English', tl: 'Tagalog' };

// Mock Student Profile
const MOCK_STUDENT = {
  id: 's1',
  name: 'Maria Garcia',
  username: 'maria_g',
  gradeLevel: 4,
  teacherName: 'Ms. Santos',
  schoolName: 'St. Michael\'s College of Caraga',
};

// Mock Reading Sessions
const MOCK_SESSIONS = [
  {
    id: 's1',
    passage_preview: 'The sun was setting over the quiet village. Maria walked home from school...',
    source_language: 'en' as const,
    word_recognition_score: 98,
    comprehension_score: 85,
    phil_iri_level: 'independent' as const,
    date: '2026-08-08',
  },
  {
    id: 's2',
    passage_preview: 'Si Ana ay may alagang pusa na nagngangalang Puti. Tuwing hapon...',
    source_language: 'tl' as const,
    word_recognition_score: 92,
    comprehension_score: 70,
    phil_iri_level: 'instructional' as const,
    date: '2026-08-06',
  },
  {
    id: 's3',
    passage_preview: 'The forest was alive with the sound of birds singing their morning songs...',
    source_language: 'en' as const,
    word_recognition_score: 95,
    comprehension_score: 75,
    phil_iri_level: 'instructional' as const,
    date: '2026-08-04',
  },
  {
    id: 's4',
    passage_preview: 'Every morning, Lito would wake up early to help his grandmother sell bread...',
    source_language: 'en' as const,
    word_recognition_score: 88,
    comprehension_score: 55,
    phil_iri_level: 'frustration' as const,
    date: '2026-08-01',
  },
  {
    id: 's5',
    passage_preview: 'Ang dagat ay kulay bughaw na parang langit. Sa tabi ng dagat ay may...',
    source_language: 'tl' as const,
    word_recognition_score: 90,
    comprehension_score: 62,
    phil_iri_level: 'instructional' as const,
    date: '2026-07-29',
  },
  {
    id: 's6',
    passage_preview: 'Rain was falling softly on the tin roof. Inside, the family gathered...',
    source_language: 'en' as const,
    word_recognition_score: 86,
    comprehension_score: 48,
    phil_iri_level: 'frustration' as const,
    date: '2026-07-25',
  },
];

// Mock Assigned Tests
const MOCK_PENDING_TESTS = [
  {
    id: 'pt-1',
    passage_preview: 'Si Ana ay may alagang pusa na nagngangalang Puti. Tuwing hapon...',
    source_language: 'tl' as const,
    teacher_name: 'Ms. Santos',
    assigned_at: '2026-08-07',
    status: 'pending' as const,
    instructions: 'Read aloud cleanly and answer all 5 comprehension questions carefully.',
  },
  {
    id: 'pt-2',
    passage_preview: 'The quiet village of San Isidro was known for its tall mahogany trees...',
    source_language: 'en' as const,
    teacher_name: 'Ms. Santos',
    assigned_at: '2026-08-09',
    status: 'pending' as const,
    instructions: 'Take your time pronouncing each word clearly.',
  },
];

type StudentSection = 'overview' | 'tests' | 'history' | 'settings';

function scoreColor(pct: number): string {
  if (pct >= 90) return '#2E7D4F';
  if (pct >= 70) return '#8A5A1E';
  return '#B4602E';
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [section, setSection] = useState<StudentSection>('overview');
  const [student, setStudent] = useState({
    id: 's1',
    name: 'Maria Garcia',
    username: 'maria_g',
    gradeLevel: 4,
    teacherName: 'Ms. Santos',
    schoolName: "St. Michael's College of Caraga",
  });

  const [studentEmail, setStudentEmail] = useState('');

  useEffect(() => {
    function loadUser() {
      try {
        const saved = localStorage.getItem('readbuddy_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.email) setStudentEmail(parsed.email);
          if (parsed.display_name) {
            setStudent((prev) => ({
              ...prev,
              name: parsed.display_name,
              username: parsed.username || prev.username,
            }));
          }
        }
      } catch (e) {}
    }
    loadUser();
    window.addEventListener('readbuddy_user_updated', loadUser);
    return () => window.removeEventListener('readbuddy_user_updated', loadUser);
  }, []);

  // Preferences State
  const [preferredLang, setPreferredLang] = useState<'en' | 'tl'>('en');
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [showPhonicsHint, setShowPhonicsHint] = useState<boolean>(true);

  return (
    <DashboardShell
      role="student"
      activeSection={section}
      onSectionChange={(s) => setSection(s as StudentSection)}
      userName={student.name}
      onLogout={() => {
        try { localStorage.removeItem('readbuddy_user'); } catch (e) {}
        window.location.href = '/';
      }}
    >
      {/* ─── Overview Section ─── */}
      {section === 'overview' && (
        <StudentDashboard
          studentName={student.name.split(' ')[0]}
          sessions={MOCK_SESSIONS}
          pendingTests={MOCK_PENDING_TESTS}
          onStartSession={() => router.push('/session')}
          onStartTest={(testId) => {
            console.log('Starting assigned test:', testId);
            router.push(`/session?testId=${testId}`);
          }}
        />
      )}

      {/* ─── Assigned Tests Section ─── */}
      {section === 'tests' && (
        <div className="rb-fade-in-up">
          <SectionHeader
            title="Assigned Reading Tests"
            subtitle="Tests set by your teacher to evaluate your reading and comprehension."
            accent={STUDENT_ACCENT}
          />

          {MOCK_PENDING_TESTS.length === 0 ? (
            <EmptyState
              message="You have no assigned tests right now. You can start a practice reading session anytime!"
              actionLabel="Start Practice Session"
              onAction={() => router.push('/session')}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {MOCK_PENDING_TESTS.map((test, i) => (
                <Card key={test.id} hoverable className="rb-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge tone="accent">From {test.teacher_name}</Badge>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-700" style={{ fontFamily: FONT_MONO }}>
                          {LANG_LABEL[test.source_language]}
                        </span>
                        <span className="text-xs" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                          Assigned {test.assigned_at}
                        </span>
                      </div>
                      <h3 className="text-base mb-1.5" style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>
                        {test.passage_preview}
                      </h3>
                      {test.instructions && (
                        <p className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                          Teacher note: {test.instructions}
                        </p>
                      )}
                    </div>
                    <PrimaryButton
                      accent={STUDENT_ACCENT}
                      onClick={() => router.push(`/session?testId=${test.id}`)}
                      className="shrink-0"
                    >
                      Start Test Now
                    </PrimaryButton>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Reading History Section ─── */}
      {section === 'history' && (
        <div className="rb-fade-in-up">
          <SectionHeader
            title="Reading History"
            subtitle="Your past reading sessions and assessment scores."
            accent={STUDENT_ACCENT}
          />

          {MOCK_SESSIONS.length === 0 ? (
            <EmptyState
              message="No reading sessions completed yet."
              actionLabel="Start First Session"
              onAction={() => router.push('/session')}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {MOCK_SESSIONS.map((session, i) => (
                <Card key={session.id} hoverable className="rb-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-700" style={{ fontFamily: FONT_MONO }}>
                          {LANG_LABEL[session.source_language]}
                        </span>
                        <span className="text-xs" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                          {session.date}
                        </span>
                      </div>
                      <p className="text-sm font-medium" style={{ fontFamily: FONT_SANS, color: INK }}>
                        {session.passage_preview}
                      </p>
                    </div>
                    <PhilIRIBadge level={session.phil_iri_level} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: TAN_BORDER }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>Word Recognition</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ fontFamily: FONT_MONO, fontWeight: 700, color: scoreColor(session.word_recognition_score) }}>
                          {session.word_recognition_score}%
                        </span>
                        <MiniProgressBar value={session.word_recognition_score} color={scoreColor(session.word_recognition_score)} width={80} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>Comprehension</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ fontFamily: FONT_MONO, fontWeight: 700, color: scoreColor(session.comprehension_score) }}>
                          {session.comprehension_score}%
                        </span>
                        <MiniProgressBar value={session.comprehension_score} color={scoreColor(session.comprehension_score)} width={80} />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Settings Section ─── */}
      {section === 'settings' && (
        <div className="rb-fade-in-up">
          <AccountSettings
            profile={{
              displayName: student.name,
              email: studentEmail || `${student.username}@smccnasipit.edu.ph`,
              username: student.username,
              role: 'student',
              gradeLevel: student.gradeLevel,
              teacherName: student.teacherName,
            }}
            accent={STUDENT_ACCENT}
          />
        </div>
      )}
    </DashboardShell>
  );
}
