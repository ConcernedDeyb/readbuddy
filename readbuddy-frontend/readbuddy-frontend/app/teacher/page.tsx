'use client';

import { useState, useEffect } from 'react';
import { DashboardShell, TeacherOverview, TeacherClasses, TeacherStudents, TeacherPassages, TeacherAuthorPassage, TeacherTests, AccountSettings, type ReadingTest } from '@/components/dashboard';

const MOCK_TEACHER_NAME = 'Ms. Santos';
const MOCK_STUDENTS = [
  { id: '1', display_name: 'Maria', username: 'maria_g', grade_level: 7, class_name: 'St. Jude', preferred_language: 'en' as const },
  { id: '2', display_name: 'Jun', username: 'jun_r', grade_level: 3, class_name: 'St. Mark', preferred_language: 'tl' as const },
  { id: '3', display_name: 'Ana', username: 'ana_c', grade_level: 7, class_name: 'St. Jude', preferred_language: 'en' as const },
  { id: '4', display_name: 'Carlos', username: 'carlos_m', grade_level: 10, class_name: 'St. Luke', preferred_language: 'tl' as const },
];
const MOCK_PASSAGES = [
  {
    id: 'p1',
    confirmed_text: 'The sun was setting over the quiet village. Maria walked home from school, thinking about the science project due tomorrow.',
    source_language: 'en' as const,
    is_published: true,
    word_count: 42,
    created_at: '2026-07-20',
  },
  {
    id: 'p2',
    confirmed_text: 'Si Ana ay may alagang pusa na nagngangalang Puti. Tuwing hapon, pinapakain niya ito ng gatas at tuyong pagkain.',
    source_language: 'tl' as const,
    is_published: true,
    word_count: 38,
    created_at: '2026-07-22',
  },
];

const MOCK_TESTS: ReadingTest[] = [
  {
    id: 'test-1',
    passage_id: 'p1',
    passage_preview: 'The sun was setting over the quiet village. Maria walked home...',
    source_language: 'en',
    created_at: '2026-08-03',
    assignments: [
      {
        id: 'asn-1',
        student_id: '1',
        student_name: 'Maria',
        status: 'graded',
        word_recognition_score: 98,
        comprehension_score: 85,
        phil_iri_level: 'independent',
        teacher_grade: 'independent',
        completed_at: '2026-08-04',
      },
    ],
  },
];

const MOCK_TEACHER_PROFILE = {
  displayName: 'Prof. Maria Santos',
  email: 'teacher@smcc.edu.ph',
  username: 'teacher_santos',
  role: 'teacher' as const,
  schoolId: 'SMCC-2024-001',
};

const MOCK_CLASSES = [
  { id: 'c1', name: 'Section St. Jude', grade_level: 7, class_code: 'SMCC-G7-STJUDE', student_count: 24 },
  { id: 'c2', name: 'Section St. Mark', grade_level: 3, class_code: 'SMCC-G3-STMARK', student_count: 18 },
  { id: 'c3', name: 'Section St. Luke', grade_level: 10, class_code: 'SMCC-G10-STLUK', student_count: 20 },
];


type TeacherSection = 'overview' | 'classes' | 'students' | 'passages' | 'author' | 'tests' | 'settings';

export default function TeacherDashboardPage() {
  const [section, setSection] = useState<TeacherSection>('overview');
  const [teacherName, setTeacherName] = useState('Prof. Maria Santos');
  const [teacherEmail, setTeacherEmail] = useState('santos@smccnasipit.edu.ph');

  useEffect(() => {
    function loadUser() {
      try {
        const saved = localStorage.getItem('readbuddy_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.display_name && parsed.role === 'teacher') {
            setTeacherName(parsed.display_name);
          }
          if (parsed.email) {
            setTeacherEmail(parsed.email);
          }
        }
      } catch (e) {}
    }
    loadUser();
    window.addEventListener('readbuddy_user_updated', loadUser);
    return () => window.removeEventListener('readbuddy_user_updated', loadUser);
  }, []);

  const testAssignmentCount = MOCK_TESTS.reduce((sum, t) => sum + t.assignments.length, 0);

  return (
    <DashboardShell
      role="teacher"
      activeSection={section}
      onSectionChange={(s) => setSection(s as TeacherSection)}
      userName={teacherName}
      onLogout={() => {
        try { localStorage.removeItem('readbuddy_user'); } catch (e) {}
        window.location.href = '/';
      }}
    >
      {section === 'overview' && (
        <TeacherOverview
          teacherName={teacherName}
          studentCount={MOCK_STUDENTS.length}
          passageCount={MOCK_PASSAGES.length}
          publishedCount={MOCK_PASSAGES.filter((p) => p.is_published).length}
          testCount={testAssignmentCount}
          onNavigate={(s) => setSection(s as TeacherSection)}
        />
      )}

      {section === 'classes' && (
        <TeacherClasses
          initialClasses={MOCK_CLASSES}
          onSelectClass={() => setSection('students')}
        />
      )}

      {section === 'students' && <TeacherStudents initialStudents={MOCK_STUDENTS} />}

      {section === 'passages' && (
        <TeacherPassages
          passages={MOCK_PASSAGES}
          onAuthorNew={() => setSection('author')}
          onEdit={(id) => {
            console.log('edit passage', id);
            setSection('author');
          }}
        />
      )}

      {section === 'author' && <TeacherAuthorPassage onDone={() => setSection('passages')} />}

      {section === 'tests' && (
        <TeacherTests
          tests={MOCK_TESTS}
          passages={MOCK_PASSAGES}
          students={MOCK_STUDENTS.map((s) => ({ id: s.id, display_name: s.display_name }))}
        />
      )}

      {section === 'settings' && (
        <AccountSettings
          profile={{
            ...MOCK_TEACHER_PROFILE,
            displayName: teacherName,
            email: teacherEmail,
          }}
          accent="#3D6B8A"
        />
      )}
    </DashboardShell>
  );
}
