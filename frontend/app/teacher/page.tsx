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
  TeacherNotebook,
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

type TeacherSection = 'overview' | 'classes' | 'students' | 'passages' | 'author' | 'tests' | 'notebook' | 'settings';

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
        let currentTeacherId = '';
        let currentTeacherName = '';
        let currentTeacherEmail = '';

        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.role === 'teacher') {
            currentTeacherId = (parsed.school_id || parsed.username || '').toLowerCase();
            currentTeacherName = parsed.display_name || '';
            currentTeacherEmail = parsed.email || '';

            if (parsed.display_name) setTeacherName(parsed.display_name);
            if (parsed.username) setTeacherUsername(parsed.username);
            if (parsed.school_id) setSchoolId(parsed.school_id);
            if (parsed.email) setTeacherEmail(parsed.email);
            else if (parsed.username) setTeacherEmail(`${parsed.username}@smccnasipit.edu.ph`);
          }
        }

        const lowerTeacherName = currentTeacherName.toLowerCase();

        // 1. Classes: filter strictly to this teacher
        const savedClasses = localStorage.getItem('readbuddy_teacher_classes');
        let teacherClassesList: SchoolClass[] = [];
        if (savedClasses) {
          const c = JSON.parse(savedClasses);
          if (Array.isArray(c)) {
            teacherClassesList = c.filter((cls: any) => {
              if (cls.teacher_id && cls.teacher_id.toLowerCase() === currentTeacherId) return true;
              if (cls.teacher_school_id && cls.teacher_school_id.toLowerCase() === currentTeacherId) return true;
              if (cls.teacher_email && cls.teacher_email.toLowerCase() === currentTeacherEmail.toLowerCase()) return true;
              if (cls.teacher_name && cls.teacher_name.toLowerCase() === lowerTeacherName) return true;
              return false;
            });
          }
        }
        setClasses(teacherClassesList);

        const myClassNames = new Set(teacherClassesList.map((c) => c.name.toLowerCase()));

        // 2. Passages: filter to this teacher
        const savedPassages = localStorage.getItem('readbuddy_teacher_passages');
        if (savedPassages) {
          const p = JSON.parse(savedPassages);
          if (Array.isArray(p)) {
            const myPassages = p.filter((pass: any) => {
              if (pass.teacher_id && pass.teacher_id.toLowerCase() === currentTeacherId) return true;
              if (pass.teacher_name && pass.teacher_name.toLowerCase() === lowerTeacherName) return true;
              return false;
            });
            setPassages(myPassages);
          }
        } else {
          setPassages([]);
        }

        // 3. Students: filter to this teacher's enrolled students
        const savedSessions = JSON.parse(localStorage.getItem('readbuddy_student_sessions') || '[]');
        const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
        const savedStudents = localStorage.getItem('readbuddy_teacher_students');
        const allStudentsList: any[] = savedStudents ? JSON.parse(savedStudents) : [];

        // Also check accountsMap
        Object.values(accountsMap).forEach((acc: any) => {
          if (acc && acc.role === 'student' && !allStudentsList.some((s: any) => (s.school_id && s.school_id === acc.school_id) || (s.username && s.username === acc.username))) {
            allStudentsList.push(acc);
          }
        });

        const myStudents = allStudentsList
          .filter((st: any) => {
            const sec = (st.section_name || st.class_name || '').trim().toLowerCase();
            if (!sec || sec === 'unassigned') return false;
            if (st.teacher_id && st.teacher_id.toLowerCase() === currentTeacherId) return true;
            if (st.teacher_name && st.teacher_name.toLowerCase() === lowerTeacherName) return true;
            if (myClassNames.has(sec)) return true;
            return false;
          })
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

        setStudents(myStudents);

        // 4. Tests: filter to this teacher
        const savedTests = localStorage.getItem('readbuddy_teacher_tests');
        if (savedTests) {
          const t = JSON.parse(savedTests);
          if (Array.isArray(t)) {
            const myTests = t.filter((test: any) => {
              if (test.teacher_id && test.teacher_id.toLowerCase() === currentTeacherId) return true;
              if (test.teacher_name && test.teacher_name.toLowerCase() === lowerTeacherName) return true;
              return false;
            });
            setTests(myTests);
          }
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
    window.addEventListener('readbuddy_notebook_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('readbuddy_user_updated', loadData);
      window.removeEventListener('readbuddy_passages_updated', loadData);
      window.removeEventListener('readbuddy_tests_updated', loadData);
      window.removeEventListener('readbuddy_accounts_updated', loadData);
      window.removeEventListener('readbuddy_students_updated', loadData);
      window.removeEventListener('readbuddy_student_sessions_updated', loadData);
      window.removeEventListener('readbuddy_notebook_updated', loadData);
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

      {section === 'notebook' && (
        <TeacherNotebook
          students={students}
          classes={classes}
        />
      )}

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
