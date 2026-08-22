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
  status: 'pending' | 'completed';
  instructions?: string;
}

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
    id: '',
    name: 'Student',
    username: '',
    schoolId: '',
    gradeLevel: 1,
    sectionName: 'Unassigned',
    teacherName: '',
    schoolName: "St. Michael's College of Caraga",
  });

  const [studentEmail, setStudentEmail] = useState('');
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [pendingTests, setPendingTests] = useState<PendingTest[]>([]);

  useEffect(() => {
    function loadData() {
      try {
        const saved = localStorage.getItem('readbuddy_user');
        let currentUsername = '';
        let currentDisplayName = '';
        let currentSchoolId = '';

        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.role === 'student') {
            if (parsed.display_name) {
              currentDisplayName = parsed.display_name;
              setStudent((prev) => ({
                ...prev,
                name: parsed.display_name,
                username: parsed.username || prev.username,
                schoolId: parsed.school_id || prev.schoolId || parsed.username,
                gradeLevel: parsed.grade_level || prev.gradeLevel,
              }));
            }
            if (parsed.school_id) {
              currentSchoolId = parsed.school_id;
              setStudent((prev) => ({ ...prev, schoolId: parsed.school_id }));
            }
            if (parsed.username) {
              currentUsername = parsed.username;
              if (!currentSchoolId) currentSchoolId = parsed.username;
            }
            if (parsed.email) {
              setStudentEmail(parsed.email);
            } else if (parsed.username) {
              setStudentEmail(`${parsed.username}@smccnasipit.edu.ph`);
            }
          }
        }

        // Also check if account record was updated by teacher
        const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
        const liveAccount = accountsMap[currentSchoolId] || accountsMap[currentUsername] || accountsMap[currentDisplayName.toLowerCase()];
        if (liveAccount) {
          setStudent((prev) => ({
            ...prev,
            gradeLevel: liveAccount.grade_level || prev.gradeLevel,
            teacherName: liveAccount.teacher_name || prev.teacherName,
            sectionName: liveAccount.section_name || prev.sectionName,
          }));
        }

        // Load sessions from student history
        const savedSessions = localStorage.getItem('readbuddy_student_sessions');
        if (savedSessions) {
          const parsedSes = JSON.parse(savedSessions);
          if (Array.isArray(parsedSes)) {
            setSessions(parsedSes);
          }
        } else {
          setSessions([]);
        }

        // Load assigned tests from teacher tests for this specific student
        const teacherTests = localStorage.getItem('readbuddy_teacher_tests');
        if (teacherTests) {
          const parsedTests = JSON.parse(teacherTests);
          if (Array.isArray(parsedTests)) {
            const studentAssigned: PendingTest[] = [];
            parsedTests.forEach((t: any) => {
              (t.assignments || []).forEach((a: any) => {
                const cleanStudentId = currentSchoolId;
                const isMatch =
                  (currentDisplayName && a.student_name?.toLowerCase() === currentDisplayName.toLowerCase()) ||
                  (currentUsername && (a.student_id === currentUsername || a.student_name?.toLowerCase() === currentUsername.toLowerCase())) ||
                  (cleanStudentId && (a.student_id === cleanStudentId || a.school_id === cleanStudentId));

                if (isMatch && a.status === 'pending') {
                  studentAssigned.push({
                    id: a.id,
                    passage_preview: t.passage_preview || 'Assigned reading passage',
                    source_language: t.source_language || 'en',
                    teacher_name: t.teacher_name || 'Teacher',
                    assigned_at: t.created_at || 'Today',
                    status: 'pending',
                    instructions: 'Read clearly and answer all comprehension questions.',
                  });
                }
              });
            });

            setPendingTests(studentAssigned);
          }
        } else {
          setPendingTests([]);
        }
      } catch (e) {}
    }

    loadData();
    window.addEventListener('readbuddy_user_updated', loadData);
    window.addEventListener('readbuddy_accounts_updated', loadData);
    window.addEventListener('readbuddy_students_updated', loadData);
    window.addEventListener('readbuddy_tests_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('readbuddy_user_updated', loadData);
      window.removeEventListener('readbuddy_accounts_updated', loadData);
      window.removeEventListener('readbuddy_students_updated', loadData);
      window.removeEventListener('readbuddy_tests_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

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
          sectionName={(student as any).sectionName}
          gradeLevel={student.gradeLevel}
          teacherName={student.teacherName}
          sessions={sessions}
          pendingTests={pendingTests}
          onStartSession={() => router.push('/session')}
          onStartTest={(testId) => {
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

          {pendingTests.length === 0 ? (
            <EmptyState
              message="You have no assigned tests right now. You can start a practice reading session anytime!"
              actionLabel="Start Practice Session"
              onAction={() => router.push('/session')}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {pendingTests.map((test, i) => (
                <Card key={test.id} hoverable className="rb-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge tone="accent">Assigned Test</Badge>
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
                          Note: {test.instructions}
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

          {sessions.length === 0 ? (
            <EmptyState
              message="No reading sessions completed yet."
              actionLabel="Start First Session"
              onAction={() => router.push('/session')}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((session, i) => (
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
              email: studentEmail || (student.username ? `${student.username}@smccnasipit.edu.ph` : 'student@smccnasipit.edu.ph'),
              username: student.username || 'student',
              schoolId: student.schoolId || student.username,
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
