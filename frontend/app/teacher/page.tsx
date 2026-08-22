'use client';

import { useState, useEffect } from 'react';
import {
  DashboardShell,
  TeacherOverview,
  TeacherClasses,
  TeacherStudents,
  TeacherPassages,
  TeacherAuthorPassage,
  TeacherTests,
  AccountSettings,
} from '@/components/dashboard';

import { PhilIRILevel } from '@/components/dashboard/_shared';

interface Passage {
  id: string;
  confirmed_text: string;
  source_language: 'en' | 'tl';
  is_published: boolean;
  word_count: number;
  created_at: string;
}

interface Student {
  id: string;
  display_name: string;
  username: string;
  school_id?: string;
  email?: string;
  grade_level: number;
  class_name?: string;
  preferred_language: 'en' | 'tl';
  sessions_completed?: number;
  latest_level?: PhilIRILevel;
}

interface SchoolClass {
  id: string;
  name: string;
  grade_level: number;
  class_code: string;
  student_count: number;
  created_at?: string;
}

type TeacherSection = 'overview' | 'classes' | 'students' | 'passages' | 'author' | 'tests' | 'settings';

export default function TeacherDashboardPage() {
  const [section, setSection] = useState<TeacherSection>('overview');
  const [teacherName, setTeacherName] = useState('Teacher');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherUsername, setTeacherUsername] = useState('');
  const [schoolId, setSchoolId] = useState('');

  // Live state tracking
  const [passages, setPassages] = useState<Passage[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    function loadData() {
      try {
        const savedUser = localStorage.getItem('readbuddy_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.role === 'teacher') {
            if (parsed.display_name) {
              setTeacherName(parsed.display_name);
            }
            if (parsed.username) {
              setTeacherUsername(parsed.username);
            }
            if (parsed.school_id) {
              setSchoolId(parsed.school_id);
            }
            if (parsed.email) {
              setTeacherEmail(parsed.email);
            } else if (parsed.username) {
              setTeacherEmail(`${parsed.username}@smccnasipit.edu.ph`);
            }
          }
        }

        const savedPassages = localStorage.getItem('readbuddy_teacher_passages');
        if (savedPassages) {
          const p = JSON.parse(savedPassages);
          if (Array.isArray(p)) setPassages(p);
        } else {
          setPassages([]);
        }

        const savedSessions = JSON.parse(localStorage.getItem('readbuddy_student_sessions') || '[]');

        const savedStudents = localStorage.getItem('readbuddy_teacher_students');
        if (savedStudents) {
          const s = JSON.parse(savedStudents);
          if (Array.isArray(s)) {
            const enriched = s
              .filter((st: any) => st.section_name !== 'Unassigned' && st.class_name !== 'Unassigned')
              .map((st: any) => {
                const studentMatches = savedSessions.filter(
                  (ses: any) =>
                    (ses.student_name && ses.student_name.toLowerCase() === (st.display_name || '').toLowerCase()) ||
                    (ses.student_id && (ses.student_id === st.school_id || ses.student_id === st.username))
                );
                const latestLevel = studentMatches.length > 0 ? studentMatches[0].phil_iri_level : st.latest_level;
                return {
                  ...st,
                  sessions_completed: studentMatches.length || st.sessions_completed || 0,
                  latest_level: latestLevel,
                };
              });
            setStudents(enriched);
          }
        } else {
          setStudents([]);
        }

        const savedClasses = localStorage.getItem('readbuddy_teacher_classes');
        if (savedClasses) {
          const c = JSON.parse(savedClasses);
          if (Array.isArray(c)) setClasses(c);
        } else {
          setClasses([]);
        }

        const savedTests = localStorage.getItem('readbuddy_teacher_tests');
        if (savedTests) {
          const t = JSON.parse(savedTests);
          if (Array.isArray(t)) setTests(t);
        } else {
          setTests([]);
        }
      } catch (e) {}
    }

    loadData();
    window.addEventListener('readbuddy_user_updated', loadData);
    window.addEventListener('readbuddy_passages_updated', loadData);
    window.addEventListener('readbuddy_tests_updated', loadData);
    window.addEventListener('readbuddy_accounts_updated', loadData);
    window.addEventListener('readbuddy_students_updated', loadData);
    window.addEventListener('readbuddy_student_sessions_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('readbuddy_user_updated', loadData);
      window.removeEventListener('readbuddy_passages_updated', loadData);
      window.removeEventListener('readbuddy_tests_updated', loadData);
      window.removeEventListener('readbuddy_accounts_updated', loadData);
      window.removeEventListener('readbuddy_students_updated', loadData);
      window.removeEventListener('readbuddy_student_sessions_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const testAssignmentCount = tests.reduce((sum, t) => sum + (t.assignments ? t.assignments.length : 0), 0);
  const pendingGradingCount = tests.reduce(
    (sum, t) => sum + (t.assignments ? t.assignments.filter((a: any) => a.status === 'completed').length : 0),
    0
  );

  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

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
          studentCount={students.length}
          passageCount={passages.length}
          publishedCount={passages.filter((p) => p.is_published).length}
          testCount={testAssignmentCount}
          pendingGradingCount={pendingGradingCount}
          students={students.map((s) => ({
            id: s.id,
            name: s.display_name,
            latest_level: s.latest_level,
            sessions_completed: s.sessions_completed || 0,
          }))}
          onNavigate={(s) => setSection(s as TeacherSection)}
        />
      )}

      {section === 'classes' && (
        <TeacherClasses
          initialClasses={classes}
          onSelectClass={(classId) => {
            const foundClass = classes.find((c) => c.id === classId);
            if (foundClass) {
              setSelectedSectionFilter(foundClass.name);
            }
            setSection('students');
          }}
        />
      )}

      {section === 'students' && (
        <TeacherStudents
          initialStudents={students}
          teacherName={teacherName}
          initialSectionFilter={selectedSectionFilter}
        />
      )}

      {section === 'passages' && (
        <TeacherPassages
          passages={passages}
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
          tests={tests}
          passages={passages}
          students={students.map((s) => ({ id: s.id, display_name: s.display_name }))}
        />
      )}

      {section === 'settings' && (
        <AccountSettings
          profile={{
            displayName: teacherName,
            email: teacherEmail || (teacherUsername ? `${teacherUsername}@smccnasipit.edu.ph` : 'teacher@smccnasipit.edu.ph'),
            username: teacherUsername || 'teacher',
            role: 'teacher',
            schoolId: schoolId || 'SMCC-FACULTY',
          }}
          accent="#3D6B8A"
        />
      )}
    </DashboardShell>
  );
}
