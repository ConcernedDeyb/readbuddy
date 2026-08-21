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

        const savedPassages = localStorage.getItem('readbuddy_teacher_passages');
        if (savedPassages) {
          const p = JSON.parse(savedPassages);
          if (Array.isArray(p)) setPassages(p);
        } else {
          setPassages([]);
        }

        const savedStudents = localStorage.getItem('readbuddy_teacher_students');
        if (savedStudents) {
          const s = JSON.parse(savedStudents);
          if (Array.isArray(s)) setStudents(s);
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
    return () => {
      window.removeEventListener('readbuddy_user_updated', loadData);
      window.removeEventListener('readbuddy_passages_updated', loadData);
      window.removeEventListener('readbuddy_tests_updated', loadData);
    };
  }, []);

  const testAssignmentCount = tests.reduce((sum, t) => sum + (t.assignments ? t.assignments.length : 0), 0);

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
          onNavigate={(s) => setSection(s as TeacherSection)}
        />
      )}

      {section === 'classes' && (
        <TeacherClasses
          initialClasses={classes}
          onSelectClass={() => setSection('students')}
        />
      )}

      {section === 'students' && <TeacherStudents initialStudents={students} />}

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
