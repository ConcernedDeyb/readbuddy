'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  SectionHeader,
  Card,
  Badge,
  EmptyState,
  PrimaryButton,
  GhostButton,
  Avatar,
  PhilIRIBadge,
  PhilIRILevel,
  FONT_SANS,
  FONT_MONO,
  FONT_SERIF,
  MUTED,
  CHALK_GREEN,
} from '../_shared';
import { Check, X, Users, Languages, BookOpen, Search, UserPlus } from 'lucide-react';
import StudentProgressChart from '../student/StudentProgressChart';
import DailyReadingHeatmap from '../student/DailyReadingHeatmap';

const TEACHER_ACCENT = '#3D6B8A';
const DEFAULT_STUDENT_PASSWORD = 'smcc2026';

interface StudentSessionLog {
  id: string;
  date: string;
  passage_title: string;
  source_language: string;
  word_recognition_score: number;
  comprehension_score: number;
  phil_iri_level: PhilIRILevel;
}

interface Student {
  id: string;
  display_name: string;
  username: string;
  school_id?: string;
  email?: string;
  password?: string;
  grade_level: number;
  class_id?: string;
  class_name?: string;
  section_name?: string;
  teacher_name?: string;
  preferred_language: 'en' | 'tl';
  phone_number?: string;
  phone_verified?: boolean;
  avatar_url?: string;
  sessions_completed?: number;
  latest_level?: PhilIRILevel;
  avg_word_recognition?: number;
  avg_comprehension?: number;
  session_history?: StudentSessionLog[];
}

interface SchoolClass {
  id: string;
  name: string;
  grade_level: number;
  class_code: string;
  student_count: number;
}

function formatStudentEmail(displayName: string, username?: string, customEmail?: string): string {
  if (customEmail && customEmail.trim() && customEmail.includes('@') && customEmail.trim().toLowerCase().endsWith('@smccnasipit.edu.ph')) {
    return customEmail.trim().toLowerCase();
  }
  const cleanId = (username || displayName || 'student').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  return `${cleanId}@smccnasipit.edu.ph`;
}

export function TeacherStudents({
  initialStudents = [],
  teacherName = 'Teacher',
  initialSectionFilter = 'all',
}: {
  initialStudents?: Student[];
  teacherName?: string;
  initialSectionFilter?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableClasses, setAvailableClasses] = useState<SchoolClass[]>([]);
  const [allRegisteredStudents, setAllRegisteredStudents] = useState<Student[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [addMode, setAddMode] = useState<'select_database' | 'single'>('select_database');
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(initialSectionFilter || 'all');
  const [notification, setNotification] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedStudentProgress, setSelectedStudentProgress] = useState<Student | null>(null);

  // ─── Modal Selection Mode State ───
  const [dbTargetSection, setDbTargetSection] = useState('');
  const [dbTargetGrade, setDbTargetGrade] = useState('7');
  const [dbBrowseGradeFilter, setDbBrowseGradeFilter] = useState<string>('all'); // 'all' or '1'..'12'
  const [dbBrowseSectionFilter, setDbBrowseSectionFilter] = useState<string>('all'); // 'all', 'Unassigned', or specific section
  const [dbStudentSearch, setDbStudentSearch] = useState('');
  const [selectedDbStudentIds, setSelectedDbStudentIds] = useState<Set<string>>(new Set());

  // Single add draft
  const [draft, setDraft] = useState({
    display_name: '',
    school_id: '',
    phone_number: '',
    grade_level: '7',
    section_name: '',
    preferred_language: 'en' as 'en' | 'tl',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load classes dynamically from localStorage (scoped to this teacher)
  function loadClasses() {
    try {
      const savedUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
      const currentTeacherId = (savedUser.school_id || savedUser.username || '').toLowerCase();
      const currentTeacherDisplayName = (savedUser.display_name || teacherName || '').toLowerCase();
      const currentTeacherEmail = (savedUser.email || '').toLowerCase();

      const saved = localStorage.getItem('readbuddy_teacher_classes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const myClasses = parsed.filter((c: any) => {
            if (c.teacher_id && c.teacher_id.toLowerCase() === currentTeacherId) return true;
            if (c.teacher_school_id && c.teacher_school_id.toLowerCase() === currentTeacherId) return true;
            if (c.teacher_email && c.teacher_email.toLowerCase() === currentTeacherEmail) return true;
            if (c.teacher_name && c.teacher_name.toLowerCase() === currentTeacherDisplayName) return true;
            return false;
          });

          setAvailableClasses(myClasses);
          if (myClasses.length > 0) {
            if (!dbTargetSection || !myClasses.some((c) => c.name === dbTargetSection)) {
              setDbTargetSection(myClasses[0].name);
              setDbTargetGrade(String(myClasses[0].grade_level || '7'));
            }
            if (!draft.section_name || !myClasses.some((c) => c.name === draft.section_name)) {
              setDraft((d) => ({
                ...d,
                section_name: myClasses[0].name,
                grade_level: String(myClasses[0].grade_level || d.grade_level),
              }));
            }
          } else {
            if (!dbTargetSection) setDbTargetSection('');
            if (!draft.section_name) setDraft((d) => ({ ...d, section_name: '' }));
          }
          return;
        }
      }
      setAvailableClasses([]);
      if (!dbTargetSection) setDbTargetSection('');
      if (!draft.section_name) setDraft((d) => ({ ...d, section_name: '' }));
    } catch (e) {}
  }

  // Load all registered database students and calculate active enrolled teacher roster
  async function loadRoster() {
    try {
      const savedUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
      const currentTeacherId = (savedUser.school_id || savedUser.username || '').toLowerCase();
      const currentTeacherDisplayName = (savedUser.display_name || teacherName || '').toLowerCase();
      const currentTeacherEmail = (savedUser.email || '').toLowerCase();

      const savedSessions = JSON.parse(localStorage.getItem('readbuddy_student_sessions') || '[]');
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const savedRoster = localStorage.getItem('readbuddy_teacher_students');
      const teacherStudentsRoster: Student[] = savedRoster ? JSON.parse(savedRoster) : [];
      const savedClasses: SchoolClass[] = JSON.parse(localStorage.getItem('readbuddy_teacher_classes') || '[]');

      const myClasses = savedClasses.filter((c: any) => {
        if (c.teacher_id && c.teacher_id.toLowerCase() === currentTeacherId) return true;
        if (c.teacher_school_id && c.teacher_school_id.toLowerCase() === currentTeacherId) return true;
        if (c.teacher_email && c.teacher_email.toLowerCase() === currentTeacherEmail) return true;
        if (c.teacher_name && c.teacher_name.toLowerCase() === currentTeacherDisplayName) return true;
        return false;
      });
      const teacherClassNames = new Set(myClasses.map((c) => c.name.toLowerCase()));

      // 1. Fetch live from PostgreSQL backend endpoint
      let backendStudents: any[] = [];
      try {
        const res = await fetch('/api/auth/students');
        if (res.ok) {
          backendStudents = await res.json();
        }
      } catch (err) {}

      // Build unified student registry
      const globalStudentsMap = new Map<string, Student>();

      // A. Process backend students
      if (Array.isArray(backendStudents)) {
        backendStudents.forEach((st) => {
          const sid = (st.school_id || '').toLowerCase().trim();
          const un = (st.username || '').toLowerCase().trim();
          const key = sid || un;
          if (!key) return;

          const studentEmail = formatStudentEmail(st.display_name, st.username || st.school_id, st.email);

          globalStudentsMap.set(key, {
            id: st.id || `std-${key}`,
            display_name: st.display_name || 'Student',
            username: st.username || sid,
            school_id: st.school_id || sid,
            email: studentEmail,
            grade_level: Number(st.grade_level) || 7,
            section_name: st.section_name || 'Unassigned',
            class_name: st.section_name || 'Unassigned',
            teacher_name: st.teacher_name || undefined,
            preferred_language: (st.preferred_language || 'en') as 'en' | 'tl',
            sessions_completed: 0,
          });
        });
      }

      // B. Process localStorage accounts
      Object.values(accountsMap).forEach((acc: any) => {
        if (!acc || acc.role !== 'student') return;
        const sid = (acc.school_id || '').toLowerCase().trim();
        const un = (acc.username || '').toLowerCase().trim();
        const dn = (acc.display_name || '').toLowerCase().trim();
        const key = sid || un || dn;
        if (!key) return;

        const studentEmail = formatStudentEmail(acc.display_name, acc.username || acc.school_id, acc.email);

        const matches = savedSessions.filter(
          (ses: any) =>
            (ses.student_name && ses.student_name.toLowerCase() === dn) ||
            (ses.student_id && (ses.student_id === acc.school_id || ses.student_id === acc.username))
        );

        const existing = globalStudentsMap.get(key) || globalStudentsMap.get(sid) || globalStudentsMap.get(un);
        globalStudentsMap.set(key, {
          id: existing?.id || `std-${key}`,
          display_name: acc.display_name || existing?.display_name || 'Student',
          username: acc.username || existing?.username || sid,
          school_id: acc.school_id || existing?.school_id || sid,
          email: studentEmail,
          password: acc.password || DEFAULT_STUDENT_PASSWORD,
          grade_level: Number(acc.grade_level) || existing?.grade_level || 7,
          section_name: acc.section_name || acc.class_name || existing?.section_name || 'Unassigned',
          class_name: acc.section_name || acc.class_name || existing?.class_name || 'Unassigned',
          teacher_name: acc.teacher_name || existing?.teacher_name || undefined,
          preferred_language: (acc.preferred_language || existing?.preferred_language || 'en') as 'en' | 'tl',
          sessions_completed: matches.length || existing?.sessions_completed || 0,
          latest_level: matches.length > 0 ? matches[0].phil_iri_level : existing?.latest_level,
        });
      });

      // C. Process teacher's explicitly enrolled students roster
      const explicitRosterMap = new Map<string, Student>();
      teacherStudentsRoster.forEach((st: any) => {
        const sid = (st.school_id || '').toLowerCase().trim();
        const un = (st.username || '').toLowerCase().trim();
        const key = sid || un;
        if (!key) return;

        // Check if student belongs to this teacher
        const isMyStudent =
          (st.teacher_id && st.teacher_id.toLowerCase() === currentTeacherId) ||
          (st.teacher_name && st.teacher_name.toLowerCase() === currentTeacherDisplayName) ||
          (st.section_name && teacherClassNames.has(st.section_name.toLowerCase()));

        if (isMyStudent) {
          const existing = globalStudentsMap.get(key);
          const finalStudent: Student = {
            ...st,
            id: existing?.id || st.id || `std-${key}`,
            display_name: st.display_name || existing?.display_name || 'Student',
            username: st.username || existing?.username || sid,
            school_id: st.school_id || existing?.school_id || sid,
            email: st.email || existing?.email,
            grade_level: Number(st.grade_level) || existing?.grade_level || 7,
            section_name: st.section_name || st.class_name || existing?.section_name || 'Unassigned',
            class_name: st.class_name || st.section_name || existing?.class_name || 'Unassigned',
            teacher_name: st.teacher_name || teacherName,
          };

          if (finalStudent.section_name !== 'Unassigned' && finalStudent.class_name !== 'Unassigned') {
            explicitRosterMap.set(key, finalStudent);
            globalStudentsMap.set(key, finalStudent);
          }
        }
      });

      // Compute comprehensive reading progress & Phil-IRI diagnostics for each student
      const teacherTests = JSON.parse(localStorage.getItem('readbuddy_teacher_tests') || '[]');

      function computeStudentReadingStats(schoolId?: string, username?: string, displayName?: string) {
        const sid = (schoolId || '').toLowerCase().trim();
        const un = (username || '').toLowerCase().trim();
        const dn = (displayName || '').toLowerCase().trim();

        // 1. Matches from readbuddy_student_sessions
        const sessionMatches: StudentSessionLog[] = savedSessions
          .filter((ses: any) => {
            const sName = (ses.student_name || '').toLowerCase().trim();
            const sId = (ses.student_id || '').toLowerCase().trim();
            return (
              (sid && (sId === sid || sName === sid)) ||
              (un && (sId === un || sName === un)) ||
              (dn && (sName === dn || sId === dn))
            );
          })
          .map((ses: any, idx: number) => ({
            id: ses.id || `ses-${idx}`,
            date: ses.date || 'Recent',
            passage_title: ses.passage_preview || 'Reading Passage Practice',
            source_language: ses.source_language || 'en',
            word_recognition_score: Number(ses.word_recognition_score) || 90,
            comprehension_score: Number(ses.comprehension_score) || 80,
            phil_iri_level: (ses.phil_iri_level || 'independent') as PhilIRILevel,
          }));

        // 2. Matches from readbuddy_teacher_tests (assigned tests completed by student)
        const testMatches: StudentSessionLog[] = [];
        teacherTests.forEach((t: any) => {
          (t.assignments || []).forEach((a: any, aIdx: number) => {
            if (a.status === 'completed' || a.phil_iri_level) {
              const aId = (a.student_id || '').toLowerCase().trim();
              const aName = (a.student_name || '').toLowerCase().trim();
              if (
                (sid && (aId === sid || aName === sid)) ||
                (un && (aId === un || aName === un)) ||
                (dn && (aName === dn || aId === dn))
              ) {
                testMatches.push({
                  id: a.id || `test-${aIdx}`,
                  date: a.completed_at ? a.completed_at.split('T')[0] : (t.created_at || 'Recent'),
                  passage_title: t.passage_preview || t.title || 'Assigned Reading Assessment',
                  source_language: t.source_language || 'en',
                  word_recognition_score: Number(a.word_recognition_score) || 92,
                  comprehension_score: Number(a.comprehension_score) || 80,
                  phil_iri_level: (a.phil_iri_level || 'independent') as PhilIRILevel,
                });
              }
            }
          });
        });

        const allLogs = [...sessionMatches, ...testMatches].sort((a, b) => b.date.localeCompare(a.date));
        const count = allLogs.length;
        const avgWord = count > 0 ? Math.round(allLogs.reduce((sum, s) => sum + s.word_recognition_score, 0) / count) : undefined;
        const avgComp = count > 0 ? Math.round(allLogs.reduce((sum, s) => sum + s.comprehension_score, 0) / count) : undefined;
        const latestLvl = count > 0 ? allLogs[0].phil_iri_level : undefined;

        return {
          sessions_completed: count,
          latest_level: latestLvl,
          avg_word_recognition: avgWord,
          avg_comprehension: avgComp,
          session_history: allLogs,
        };
      }

      const allRegistered = Array.from(globalStudentsMap.values()).map((st) => {
        const stats = computeStudentReadingStats(st.school_id, st.username, st.display_name);
        return {
          ...st,
          ...stats,
        };
      });
      setAllRegisteredStudents(allRegistered);

      // ─── ONLY ENROLLED STUDENTS IN THIS TEACHER'S SECTIONS APPEAR IN ACTIVE ROSTER ───
      const enrolledInTeacher = allRegistered.filter((st) => {
        const sec = (st.section_name || st.class_name || '').trim().toLowerCase();
        if (!sec || sec === 'unassigned') return false;

        // Is explicitly on the teacher's roster
        const key = (st.school_id || st.username || '').toLowerCase().trim();
        if (explicitRosterMap.has(key)) return true;

        // Matches teacher's ID/name or one of the teacher's created class sections
        if (st.teacher_name && st.teacher_name.toLowerCase() === currentTeacherDisplayName) return true;
        if (teacherClassNames.has(sec)) return true;

        return false;
      });

      setStudents(enrolledInTeacher);
    } catch (e) {}
  }

  useEffect(() => {
    loadClasses();
    loadRoster();
    window.addEventListener('readbuddy_classes_updated', loadClasses);
    window.addEventListener('readbuddy_students_updated', loadRoster);
    window.addEventListener('readbuddy_accounts_updated', loadRoster);
    window.addEventListener('readbuddy_student_sessions_updated', loadRoster);
    window.addEventListener('storage', loadRoster);
    return () => {
      window.removeEventListener('readbuddy_classes_updated', loadClasses);
      window.removeEventListener('readbuddy_students_updated', loadRoster);
      window.removeEventListener('readbuddy_accounts_updated', loadRoster);
      window.removeEventListener('readbuddy_student_sessions_updated', loadRoster);
      window.removeEventListener('storage', loadRoster);
    };
  }, [teacherName]);

  // Update filter when initialSectionFilter changes
  useEffect(() => {
    if (initialSectionFilter && initialSectionFilter !== 'all') {
      setSelectedClassFilter(initialSectionFilter);
    }
  }, [initialSectionFilter]);

  // Handle section selection in Database Add modal
  function handleDbSectionChange(newSection: string) {
    const foundClass = availableClasses.find((c) => c.name.toLowerCase() === newSection.toLowerCase());
    setDbTargetSection(newSection);
    if (foundClass) {
      setDbTargetGrade(String(foundClass.grade_level));
    }
  }

  function handleSectionChange(newSection: string) {
    const foundClass = availableClasses.find((c) => c.name.toLowerCase() === newSection.toLowerCase());
    setDraft((d) => ({
      ...d,
      section_name: newSection,
      grade_level: foundClass ? String(foundClass.grade_level) : d.grade_level,
    }));
  }



  // ─── HANDLER: Add Selected Database Students into Class Section ───
  async function handleAddSelectedDbStudents(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const chosenSection = dbTargetSection || (sectionOptions.length > 0 ? sectionOptions[0] : 'General');
    const chosenGrade = Number(dbTargetGrade) || 7;

    if (selectedDbStudentIds.size === 0) {
      setFormError('Please check at least one student to add to this section.');
      return;
    }

    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
      let teacherStudentsList = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');

      let modifiedCount = 0;
      const enrolledStudentIds: string[] = [];

      selectedDbStudentIds.forEach((studentId) => {
        const studentObj = allRegisteredStudents.find(
          (s) => (s.school_id && s.school_id.toLowerCase() === studentId.toLowerCase()) ||
                 (s.username && s.username.toLowerCase() === studentId.toLowerCase()) ||
                 (s.id && s.id === studentId)
        );
        if (!studentObj) return;

        const schoolId = studentObj.school_id || studentObj.username;
        const lowerSid = schoolId.toLowerCase();
        const formalUsername = studentObj.username || schoolId;
        enrolledStudentIds.push(schoolId);

        // Update student account record
        const existingAcc = accountsMap[schoolId] || accountsMap[lowerSid] || accountsMap[formalUsername];
        const studentPassword = existingAcc?.password || passwordsMap[schoolId] || passwordsMap[lowerSid] || DEFAULT_STUDENT_PASSWORD;

        const updatedAccount = {
          ...existingAcc,
          display_name: studentObj.display_name,
          username: formalUsername,
          school_id: schoolId,
          email: studentObj.email || existingAcc?.email || `${schoolId}@smccnasipit.edu.ph`,
          password: studentPassword,
          role: 'student',
          grade_level: chosenGrade,
          section_name: chosenSection,
          class_name: chosenSection,
          teacher_name: teacherName,
        };

        accountsMap[schoolId] = updatedAccount;
        accountsMap[lowerSid] = updatedAccount;
        accountsMap[formalUsername] = updatedAccount;

        // Update teacher students roster
        const studentEntry: Student = {
          id: studentObj.id || `std-${schoolId}`,
          display_name: studentObj.display_name,
          username: formalUsername,
          school_id: schoolId,
          email: updatedAccount.email,
          password: studentPassword,
          grade_level: chosenGrade,
          class_name: chosenSection,
          section_name: chosenSection,
          teacher_name: teacherName,
          preferred_language: studentObj.preferred_language || 'en',
          sessions_completed: studentObj.sessions_completed || 0,
        };

        teacherStudentsList = [
          studentEntry,
          ...teacherStudentsList.filter((s: any) => (s.school_id || s.username)?.toLowerCase() !== lowerSid),
        ];

        modifiedCount++;
      });

      // Post section assignment to PostgreSQL database
      try {
        await fetch('/api/auth/students/assign-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_ids: enrolledStudentIds,
            section_name: chosenSection,
            grade_level: chosenGrade,
            teacher_name: teacherName,
          }),
        });
      } catch (err) {}

      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
      localStorage.setItem('readbuddy_teacher_students', JSON.stringify(teacherStudentsList));

      // Also ensure section exists in classes
      const savedClasses = JSON.parse(localStorage.getItem('readbuddy_teacher_classes') || '[]');
      const classExists = savedClasses.some((c: any) => c.name.toLowerCase() === chosenSection.toLowerCase());
      if (!classExists) {
        const updatedClasses = [
          ...savedClasses,
          {
            id: `cls-${Date.now()}`,
            name: chosenSection,
            grade_level: chosenGrade,
            class_code: `SMCC-G${chosenGrade}-${chosenSection.toUpperCase().replace(/\s+/g, '')}`,
            student_count: modifiedCount,
          }
        ];
        localStorage.setItem('readbuddy_teacher_classes', JSON.stringify(updatedClasses));
      }

      // Set class filter to 'all' so the newly added students are IMMEDIATELY VISIBLE in the roster
      setSelectedClassFilter('all');
      setSearch('');

      window.dispatchEvent(new Event('readbuddy_accounts_updated'));
      window.dispatchEvent(new Event('readbuddy_students_updated'));
      window.dispatchEvent(new Event('readbuddy_classes_updated'));

      setNotification(`Successfully enrolled ${modifiedCount} student(s) into Section ${chosenSection} (Grade ${chosenGrade})!`);
      setTimeout(() => setNotification(null), 7000);

      setSelectedDbStudentIds(new Set());
      setShowModal(false);
      loadRoster();
    } catch (e) {
      setFormError('Failed to save student section assignments. Please try again.');
    }
  }

  async function handleSingleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const cleanName = draft.display_name.trim();
    const cleanId = draft.school_id.trim();

    if (!cleanName || !cleanId) {
      setFormError('Please provide both the student name and School ID Number.');
      return;
    }

    const lowerCleanId = cleanId.toLowerCase();

    // ─── UNIQUE SCHOOL ID CHECK ───
    const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
    const existingAcc = accountsMap[cleanId] || accountsMap[lowerCleanId];
    const existingStudent = allRegisteredStudents.find((s) => s.school_id?.toLowerCase() === lowerCleanId);

    if (existingStudent || (existingAcc && existingAcc.display_name?.toLowerCase() !== cleanName.toLowerCase())) {
      const conflictName = existingStudent?.display_name || existingAcc?.display_name || 'another student';
      setFormError(`School ID "${cleanId}" is already assigned to "${conflictName}". Each student must have a unique School ID Number.`);
      return;
    }

    const chosenSection = draft.section_name || (sectionOptions.length > 0 ? sectionOptions[0] : 'General');
    const chosenGrade = Number(draft.grade_level) || 7;
    const formalUsername = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const studentEmail = formatStudentEmail(cleanName, formalUsername, existingAcc?.email);
    const studentPassword = existingAcc?.password || DEFAULT_STUDENT_PASSWORD;

    const newStudent: Student = {
      id: `std-${cleanId}`,
      display_name: cleanName,
      username: formalUsername,
      school_id: cleanId,
      email: studentEmail,
      password: studentPassword,
      grade_level: chosenGrade,
      class_name: chosenSection,
      section_name: chosenSection,
      teacher_name: teacherName,
      preferred_language: draft.preferred_language,
      phone_number: draft.phone_number.trim(),
      phone_verified: false,
      sessions_completed: 0,
    };

    // Record student to PostgreSQL Database
    try {
      await fetch('/api/auth/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: cleanName,
          school_id: cleanId,
          username: formalUsername,
          email: studentEmail,
          password: studentPassword,
          grade_level: chosenGrade,
          section_name: chosenSection,
          preferred_language: draft.preferred_language,
        }),
      });
    } catch (e) {}

    try {
      const teacherStudentsList = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
      const updatedTeacherRoster = [
        newStudent,
        ...teacherStudentsList.filter((s: any) => (s.school_id || s.username)?.toLowerCase() !== lowerCleanId),
      ];
      localStorage.setItem('readbuddy_teacher_students', JSON.stringify(updatedTeacherRoster));

      const accountData = {
        display_name: cleanName,
        username: formalUsername,
        school_id: cleanId,
        email: studentEmail,
        password: studentPassword,
        role: 'student',
        grade_level: chosenGrade,
        section_name: chosenSection,
        class_name: chosenSection,
        teacher_name: teacherName,
        phone_number: draft.phone_number.trim(),
        phone_verified: false,
        created_at: new Date().toISOString().split('T')[0],
      };

      accountsMap[cleanId] = accountData;
      accountsMap[lowerCleanId] = accountData;
      accountsMap[formalUsername] = accountData;
      accountsMap[studentEmail] = accountData;
      accountsMap[studentEmail.toLowerCase()] = accountData;
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
      passwordsMap[cleanId] = studentPassword;
      passwordsMap[lowerCleanId] = studentPassword;
      passwordsMap[formalUsername] = studentPassword;
      passwordsMap[studentEmail] = studentPassword;
      passwordsMap[studentEmail.toLowerCase()] = studentPassword;
      localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));

      // Ensure class exists
      const savedClasses = JSON.parse(localStorage.getItem('readbuddy_teacher_classes') || '[]');
      const classExists = savedClasses.some((c: any) => c.name.toLowerCase() === chosenSection.toLowerCase());
      if (!classExists) {
        const updatedClasses = [
          ...savedClasses,
          {
            id: `cls-${Date.now()}`,
            name: chosenSection,
            grade_level: chosenGrade,
            class_code: `SMCC-G${chosenGrade}-${chosenSection.toUpperCase().replace(/\s+/g, '')}`,
            student_count: 1,
          }
        ];
        localStorage.setItem('readbuddy_teacher_classes', JSON.stringify(updatedClasses));
      }

      setSelectedClassFilter('all');
      setSearch('');

      window.dispatchEvent(new Event('readbuddy_accounts_updated'));
      window.dispatchEvent(new Event('readbuddy_students_updated'));
      window.dispatchEvent(new Event('readbuddy_classes_updated'));
    } catch (e) {}

    setDraft({
      display_name: '',
      school_id: '',
      phone_number: '',
      grade_level: '7',
      section_name: availableClasses[0]?.name || '',
      preferred_language: 'en',
    });
    setNotification(`Successfully registered "${cleanName}" (ID: ${cleanId}) into Section ${chosenSection}!`);
    setTimeout(() => setNotification(null), 7000);
    setShowModal(false);
    loadRoster();
  }


  // ─── ACTION: Remove Student from Class Section (Status -> Unassigned) ───
  async function handleUnenrollFromSection(studentId: string, studentName: string) {
    if (!window.confirm(`Remove "${studentName}" from this class section?\n\nThe student will be unassigned from your class roster and can be re-enrolled into another section. Their student account and Phil-IRI diagnostic history will remain intact.`)) return;

    const studentObj = allRegisteredStudents.find((s) => s.id === studentId || s.school_id === studentId || s.username === studentId);
    const schoolId = studentObj?.school_id || studentObj?.username || studentId;
    const lowerSid = (schoolId || '').toLowerCase().trim();
    const lowerUn = (studentObj?.username || '').toLowerCase().trim();
    const lowerEmail = (studentObj?.email || '').toLowerCase().trim();
    const lowerId = (studentId || '').toLowerCase().trim();
    const objId = (studentObj?.id || '').toLowerCase().trim();

    // 1. Instantly remove from active teacher roster view
    setStudents((prev) => prev.filter((s) => {
      const sId = (s.id || '').toLowerCase().trim();
      const sSid = (s.school_id || '').toLowerCase().trim();
      const sUn = (s.username || '').toLowerCase().trim();
      const sEmail = (s.email || '').toLowerCase().trim();

      if (lowerId && sId === lowerId) return false;
      if (objId && sId === objId) return false;
      if (lowerSid && (sSid === lowerSid || sUn === lowerSid)) return false;
      if (lowerUn && (sUn === lowerUn || sSid === lowerUn)) return false;
      if (lowerEmail && sEmail === lowerEmail) return false;
      return true;
    }));

    // 2. Mark as Unassigned in allRegisteredStudents local state
    setAllRegisteredStudents((prev) => prev.map((s) => {
      const sId = (s.id || '').toLowerCase().trim();
      const sSid = (s.school_id || '').toLowerCase().trim();
      const sUn = (s.username || '').toLowerCase().trim();
      const sEmail = (s.email || '').toLowerCase().trim();

      const matches =
        (lowerId && sId === lowerId) ||
        (objId && sId === objId) ||
        (lowerSid && (sSid === lowerSid || sUn === lowerSid)) ||
        (lowerUn && (sUn === lowerUn || sSid === lowerUn)) ||
        (lowerEmail && sEmail === lowerEmail);

      if (matches) {
        return {
          ...s,
          section_name: 'Unassigned',
          class_name: 'Unassigned',
          teacher_name: undefined,
        };
      }
      return s;
    }));

    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      
      // Update ALL aliases in accountsMap matching this student
      Object.keys(accountsMap).forEach((key) => {
        const acc = accountsMap[key];
        if (!acc) return;
        const kLower = key.toLowerCase().trim();
        const accSid = (acc.school_id || '').toLowerCase().trim();
        const accUn = (acc.username || '').toLowerCase().trim();
        const accEmail = (acc.email || '').toLowerCase().trim();
        const accId = (acc.id || '').toLowerCase().trim();

        const matches =
          (lowerSid && (accSid === lowerSid || kLower === lowerSid)) ||
          (lowerUn && (accUn === lowerUn || kLower === lowerUn)) ||
          (lowerEmail && (accEmail === lowerEmail || kLower === lowerEmail)) ||
          (lowerId && (accId === lowerId || kLower === lowerId)) ||
          (objId && accId === objId);

        if (matches) {
          accountsMap[key] = {
            ...acc,
            section_name: 'Unassigned',
            class_name: 'Unassigned',
            teacher_name: undefined,
            teacher_id: undefined,
          };
        }
      });
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      // Remove from teacher students roster in localStorage
      const savedTeacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
      const filteredTeacherStudents = savedTeacherStudents.filter((s: any) => {
        const sSid = (s.school_id || '').toLowerCase().trim();
        const sUn = (s.username || '').toLowerCase().trim();
        const sEmail = (s.email || '').toLowerCase().trim();
        const sId = (s.id || '').toLowerCase().trim();

        if (lowerSid && (sSid === lowerSid || sUn === lowerSid)) return false;
        if (lowerUn && (sUn === lowerUn || sSid === lowerUn)) return false;
        if (lowerEmail && sEmail === lowerEmail) return false;
        if (lowerId && sId === lowerId) return false;
        if (objId && sId === objId) return false;
        return true;
      });
      localStorage.setItem('readbuddy_teacher_students', JSON.stringify(filteredTeacherStudents));

      // Live sync with PostgreSQL database backend
      try {
        await fetch('/api/auth/students/unassign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: schoolId || studentId }),
        });
      } catch (err) {}

      window.dispatchEvent(new Event('readbuddy_accounts_updated'));
      window.dispatchEvent(new Event('readbuddy_students_updated'));
      window.dispatchEvent(new Event('readbuddy_classes_updated'));
    } catch (e) {}

    setNotification(`"${studentName}" has been removed from class and is now Unassigned.`);
    setTimeout(() => setNotification(null), 5000);
    loadRoster();
  }

  const sectionOptions = Array.from(
    new Set([
      ...availableClasses.map((c) => c.name),
      ...students
        .map((s) => s.class_name || s.section_name)
        .filter((sec) => sec && sec !== 'Unassigned') as string[],
    ])
  );

  const allRegisteredSections = Array.from(
    new Set(
      allRegisteredStudents
        .map((s) => (s.section_name || s.class_name || '').trim())
        .filter((sec) => sec && sec.toLowerCase() !== 'unassigned' && sec.toLowerCase() !== 'general')
    )
  ).sort((a, b) => a.localeCompare(b));

  // ─── Filter registered students shown in Database Search & Browse Mode ───
  const filteredDbStudents = allRegisteredStudents.filter((s) => {
    const matchesGrade = dbBrowseGradeFilter === 'all' || Number(s.grade_level) === Number(dbBrowseGradeFilter);

    const studentSec = (s.section_name || s.class_name || 'Unassigned').trim();
    const isUnassigned = !studentSec || studentSec.toLowerCase() === 'unassigned' || studentSec.toLowerCase() === 'general';
    let matchesSection = true;
    if (dbBrowseSectionFilter === 'unassigned') {
      matchesSection = isUnassigned;
    } else if (dbBrowseSectionFilter !== 'all') {
      matchesSection = studentSec.toLowerCase() === dbBrowseSectionFilter.toLowerCase();
    }

    const query = dbStudentSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      s.display_name.toLowerCase().includes(query) ||
      (s.school_id && s.school_id.toLowerCase().includes(query)) ||
      (s.username && s.username.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.section_name && s.section_name.toLowerCase().includes(query)) ||
      (s.class_name && s.class_name.toLowerCase().includes(query));

    return matchesGrade && matchesSection && matchesSearch;
  });

  // Toggle single database student checkbox
  function toggleDbStudent(studentId: string) {
    setSelectedDbStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  // Toggle select all database students in current grade / search filter
  function toggleSelectAllDbStudents() {
    const visibleIds = filteredDbStudents.map((s) => s.school_id || s.username || s.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedDbStudentIds.has(id));

    if (allVisibleSelected) {
      setSelectedDbStudentIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedDbStudentIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  // Roster list filtered display: If user searches in roster search, search ALL sections!
  const filtered = students.filter((s) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      s.display_name.toLowerCase().includes(query) ||
      (s.school_id && s.school_id.toLowerCase().includes(query)) ||
      (s.username && s.username.toLowerCase().includes(query)) ||
      (s.class_name && s.class_name.toLowerCase().includes(query)) ||
      (s.section_name && s.section_name.toLowerCase().includes(query));

    const studentSec = (s.class_name || s.section_name || 'Unassigned').toLowerCase();
    const matchesClass = query ? true : (selectedClassFilter === 'all' || studentSec === selectedClassFilter.toLowerCase());

    return matchesSearch && matchesClass;
  });

  return (
    <div className="rb-fade-in-up">
      {/* ─── Top Header & Primary Add Actions ─── */}
      <div id="tour-teacher-students-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <SectionHeader
          title="Student Roster"
          subtitle="Manage enrolled students across your class sections."
          accent={TEACHER_ACCENT}
        />
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <PrimaryButton
            accent={TEACHER_ACCENT}
            onClick={() => {
              setFormError(null);
              setAddMode('select_database');
              setDbStudentSearch('');
              setDbBrowseGradeFilter('all');
              setDbBrowseSectionFilter('all');
              loadRoster();
              setShowModal(true);
            }}
            className="w-full sm:w-auto"
          >
            <span className="flex items-center justify-center gap-1.5">
              <UserPlus className="w-4 h-4" strokeWidth={2.25} />
              <span>+ Add Students</span>
            </span>
          </PrimaryButton>
        </div>
      </div>

      {notification && (
        <div className="mb-4 p-3.5 rounded-xl bg-[#E6F4EA] border border-[#BFE0CC] text-[#2E7D4F] text-xs font-sans font-semibold flex items-center justify-between shadow-sm rb-fade-in-up">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#2E7D4F]" strokeWidth={2.5} />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-gray-700 cursor-pointer flex items-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── Search & Section Dropdown Filter Bar ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        {/* Main Search Input with Clean SVG Icon */}
        <div className="flex-1 max-w-md relative flex items-center">
          <span className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search roster by student name, ID, or section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-input w-full text-xs !pl-10 !pr-3"
          />
        </div>

        {/* Section Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-gray-600 font-sans shrink-0">
            Filter Section:
          </label>
          <select
            value={selectedClassFilter}
            onChange={(e) => { setSelectedClassFilter(e.target.value); setSearch(''); }}
            className="rb-input py-1.5 px-3 text-xs font-bold bg-white text-gray-800 border border-[#DED2B4] rounded-xl cursor-pointer w-full sm:min-w-[180px]"
          >
            <option value="all">All Sections ({students.length})</option>
            {sectionOptions.map((sec) => {
              const count = students.filter(
                (s) => (s.class_name || s.section_name || '').toLowerCase() === sec.toLowerCase()
              ).length;
              return (
                <option key={sec} value={sec}>
                  Section {sec} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* ─── Student Roster Display Table ─── */}
      {filtered.length === 0 ? (
        <EmptyState
          message={
            search || selectedClassFilter !== 'all'
              ? 'No students matched your search query or section filter. Choose "All Sections" in the dropdown above to view everyone.'
              : 'Your class roster is currently empty. Click "+ Add / Enroll Students" above to enroll students into your class sections.'
          }
          actionLabel="+ Add / Enroll Students"
          onAction={() => {
            setFormError(null);
            setAddMode('select_database');
            setDbStudentSearch('');
            setDbBrowseGradeFilter('all');
            loadRoster();
            setShowModal(true);
          }}
        />
      ) : (
        <div className="overflow-x-auto border border-[#DED2B4] rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#FAF7F2] border-b border-[#DED2B4] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Student</th>
                <th className="py-3 px-4 whitespace-nowrap">School ID</th>
                <th className="py-3 px-4 whitespace-nowrap">Grade & Section</th>
                <th className="py-3 px-4 whitespace-nowrap">Language</th>
                <th className="py-3 px-4 whitespace-nowrap">Reading Progress & Phil-IRI</th>
                <th className="py-3 px-4 whitespace-nowrap">Sessions</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr key={s.id || s.school_id || s.username} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={s.display_name} accent={TEACHER_ACCENT} size={32} src={(s as any).avatar_url || (s as any).avatarUrl} />
                      <div>
                        <div className="font-bold text-gray-900">{s.display_name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{s.email || `${s.school_id}@smccnasipit.edu.ph`}{(s as any).phone_number ? ` · ${(s as any).phone_number}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-gray-700 whitespace-nowrap">
                    {s.school_id || s.username}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-xs font-bold text-gray-900 font-sans tracking-tight">
                        Grade {s.grade_level}
                      </span>
                      {s.class_name && s.class_name !== 'Unassigned' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-[#EBF3F8] text-[#3D6B8A] border border-[#BBD5E8] shadow-2xs">
                          <Users className="w-3 h-3 text-[#3D6B8A] shrink-0" strokeWidth={2.25} />
                          <span>{s.class_name || s.section_name}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-gray-100 text-gray-500 border border-gray-200">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-[#FAF7F2] text-gray-700 border border-[#DED2B4] shadow-2xs uppercase tracking-wide">
                      <Languages className="w-3 h-3 text-[#1F4D3A] shrink-0" strokeWidth={2.25} />
                      <span>{s.preferred_language === 'tl' ? 'Tagalog' : 'English'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {s.latest_level ? (
                      <div className="flex flex-col gap-1 items-start">
                        <PhilIRIBadge level={s.latest_level} />
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
                          {s.avg_word_recognition !== undefined && (
                            <span className="px-1.5 py-0.5 rounded bg-[#EBF7EE] text-[#2E7D4F] border border-[#A3D9B1] whitespace-nowrap shadow-2xs">
                              {s.avg_word_recognition}% Word
                            </span>
                          )}
                          {s.avg_comprehension !== undefined && (
                            <span className="px-1.5 py-0.5 rounded bg-[#EBF3F8] text-[#3D6B8A] border border-[#BBD5E8] whitespace-nowrap shadow-2xs">
                              {s.avg_comprehension}% Comp
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-mono text-gray-400 bg-gray-50 border border-gray-200 italic">
                        Not Assessed
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono font-medium text-gray-700">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#FAF7F2] text-gray-800 border border-[#DED2B4] shadow-2xs whitespace-nowrap">
                      <BookOpen className="w-3.5 h-3.5 text-[#1F4D3A] shrink-0" strokeWidth={2.25} />
                      <span>{s.sessions_completed || 0} {(s.sessions_completed || 0) === 1 ? 'session' : 'sessions'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentProgress(s)}
                        className="px-2.5 py-1 rounded bg-[#EBF3F8] hover:bg-[#D9EAF5] text-[#3D6B8A] text-[11px] font-bold cursor-pointer transition-colors border border-[#A8C5DA] flex items-center gap-1"
                        title="View comprehensive reading progress, Phil-IRI diagnostic history, and session logs"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>View Progress</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnenrollFromSection(s.id || s.school_id || s.username, s.display_name)}
                        className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold cursor-pointer transition-colors border border-amber-200"
                        title="Remove from this class section (Student remains in system as Unassigned)"
                      >
                        Remove from Class
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── STUDENT READING PROGRESS & DIAGNOSTICS MODAL DIALOG ─── */}
      {selectedStudentProgress && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto rb-fade-in-up">
          <div className="w-full max-w-3xl bg-[#FFFDF8] border border-[#DED2B4] rounded-2xl p-4 sm:p-7 shadow-2xl relative font-sans my-auto max-h-[92vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#DED2B4]">
              <div className="flex items-center gap-3">
                <Avatar name={selectedStudentProgress.display_name} accent={TEACHER_ACCENT} size={42} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-serif font-bold text-gray-900">
                      {selectedStudentProgress.display_name}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-white text-[#1F4D3A] border border-[#DED2B4] shadow-2xs">
                        Grade {selectedStudentProgress.grade_level}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-[#EBF3F8] text-[#3D6B8A] border border-[#BBD5E8] shadow-2xs whitespace-nowrap">
                        <Users className="w-3 h-3 text-[#3D6B8A] shrink-0" strokeWidth={2.25} />
                        <span>{selectedStudentProgress.class_name || selectedStudentProgress.section_name || 'Unassigned'}</span>
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    School ID: {selectedStudentProgress.school_id || selectedStudentProgress.username} &bull; {selectedStudentProgress.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentProgress(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-black/5 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                title="Close progress record"
              >
                <X className="w-4 h-4" strokeWidth={2.25} />
              </button>
            </div>

            {/* Diagnostic KPI Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3.5 rounded-xl bg-white border border-[#DED2B4] shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">
                  Phil-IRI Tier
                </div>
                <div className="mt-1">
                  {selectedStudentProgress.latest_level ? (
                    <PhilIRIBadge level={selectedStudentProgress.latest_level} />
                  ) : (
                    <span className="text-xs text-gray-400 italic">Not Assessed</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#DED2B4] shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">
                  Total Sessions
                </div>
                <div className="text-lg font-bold text-gray-900 font-mono mt-0.5">
                  {selectedStudentProgress.sessions_completed || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#DED2B4] shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">
                  Oral Accuracy
                </div>
                <div className="text-lg font-bold text-[#1F4D3A] font-mono mt-0.5">
                  {selectedStudentProgress.avg_word_recognition !== undefined ? `${selectedStudentProgress.avg_word_recognition}%` : '—'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#DED2B4] shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">
                  Comprehension
                </div>
                <div className="text-lg font-bold text-[#3D6B8A] font-mono mt-0.5">
                  {selectedStudentProgress.avg_comprehension !== undefined ? `${selectedStudentProgress.avg_comprehension}%` : '—'}
                </div>
              </div>
            </div>

            {/* Phil-IRI Diagnostic Standard Notice */}
            <div className="p-3 mb-4 rounded-xl bg-[#FAF7F2] border border-[#EADBCE] text-[11px] text-gray-600 flex items-center gap-2">
              <span className="font-bold text-[#1F4D3A] font-mono shrink-0">Phil-IRI Rubric:</span>
              <span>Independent: 97–100% Word & 80–100% Comp &bull; Instructional: 90–96% Word & 59–79% Comp &bull; Frustration: &lt;90% Word or &lt;58% Comp</span>
            </div>

            {/* Visual Phil-IRI Score Trend & Longitudinal Trajectory */}
            <div className="mb-4">
              <StudentProgressChart
                sessions={selectedStudentProgress.session_history || []}
                title="Phil-IRI Reading Trajectory & Score Trend"
                subtitle={`Longitudinal oral accuracy and comprehension tracking for ${selectedStudentProgress.display_name}`}
                accentColor={TEACHER_ACCENT}
              />
            </div>

            {/* GitHub-Style Daily Reading Activity Heatmap */}
            <div className="mb-4">
              <DailyReadingHeatmap
                sessions={(selectedStudentProgress.session_history || []) as any}
                title="Daily Reading Activity & Consistency"
                subtitle={`Day-by-day practice frequency, streaks, and inactivity telemetry for ${selectedStudentProgress.display_name}`}
                studentName={selectedStudentProgress.display_name}
                accentColor={TEACHER_ACCENT}
              />
            </div>

            {/* Session History Table Header */}
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">
                Completed Session Records ({(selectedStudentProgress.session_history || []).length})
              </h4>
            </div>

            {(!selectedStudentProgress.session_history || selectedStudentProgress.session_history.length === 0) ? (
              <div className="p-8 text-center bg-white border border-[#DED2B4] rounded-xl my-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2 font-bold text-sm">
                  0
                </div>
                <p className="text-xs font-semibold text-gray-700">No reading sessions completed yet</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                  When {selectedStudentProgress.display_name} practices oral reading aloud or submits assigned teacher tests, detailed Phil-IRI diagnostics and word pronunciation history will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#DED2B4] rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#FAF7F2] border-b border-[#DED2B4] text-gray-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Passage</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Language</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Word Accuracy</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Comprehension</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Phil-IRI Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedStudentProgress.session_history.map((ses, idx) => (
                      <tr key={ses.id || idx} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600 whitespace-nowrap">{ses.date}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-800 max-w-[200px] truncate" title={ses.passage_title}>
                          {ses.passage_title}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[#FAF7F2] text-gray-700 border border-[#DED2B4] shadow-2xs uppercase">
                            <Languages className="w-2.5 h-2.5 text-[#1F4D3A] shrink-0" strokeWidth={2.25} />
                            <span>{ses.source_language === 'tl' ? 'Tagalog' : 'English'}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1F4D3A] whitespace-nowrap">
                          {ses.word_recognition_score}%
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#3D6B8A] whitespace-nowrap">
                          {ses.comprehension_score}%
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <PhilIRIBadge level={ses.phil_iri_level} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-5 pt-3 border-t border-[#DED2B4] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentProgress(null)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── DEDICATED ADD / ENROLL STUDENT MODAL DIALOG ─── */}
      {showModal && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto rb-fade-in-up">
          <div className="w-full max-w-3xl bg-[#FFFDF8] border border-[#DED2B4] rounded-2xl p-4 sm:p-8 shadow-2xl relative font-sans my-auto max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DED2B4]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#3D6B8A15] text-[#3D6B8A] flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-[#3D6B8A]">
                    Enroll & Register Students
                  </h3>
                  <p className="text-xs text-gray-500 font-sans">
                    Search all students recorded in the database or register a new student.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-black/5 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors font-sans"
              >
                <X className="w-4 h-4" strokeWidth={2.25} />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 mb-4 flex-wrap pb-2 border-b border-[#DED2B433]">
              <button
                type="button"
                onClick={() => { setFormError(null); setAddMode('select_database'); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  addMode === 'select_database' ? 'bg-[#3D6B8A] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Search className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Search & Enroll Students</span>
              </button>
              <button
                type="button"
                onClick={() => { setFormError(null); setAddMode('single'); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  addMode === 'single' ? 'bg-[#3D6B8A] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Register New Student</span>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E] text-xs font-sans font-medium flex items-center justify-between">
                <span>{formError}</span>
                <button onClick={() => setFormError(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer ml-2 flex items-center">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ─── MODE 1: SEARCH & SELECT REGISTERED STUDENTS (ALL GRADES) ─── */}
            {addMode === 'select_database' && (
              <form onSubmit={handleAddSelectedDbStudents} className="flex flex-col gap-4">
                {/* Target Section Controls */}
                <div className="grid sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-[#DED2B4]">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold font-sans text-gray-700">
                      Enroll Into Class / Section <span className="text-red-500">*</span>
                    </span>
                    <select
                      value={dbTargetSection}
                      onChange={(e) => handleDbSectionChange(e.target.value)}
                      className="rb-input font-medium text-xs"
                      required
                    >
                      {sectionOptions.length === 0 ? (
                        <option value="">No classes created yet (Please add a class first)</option>
                      ) : (
                        sectionOptions.map((sec) => (
                          <option key={sec} value={sec}>
                            Section {sec}
                          </option>
                        ))
                      )}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold font-sans text-gray-700">
                      Section Grade Level
                    </span>
                    <select
                      value={dbTargetGrade}
                      onChange={(e) => setDbTargetGrade(e.target.value)}
                      className="rb-input font-medium text-xs"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <option key={g} value={g}>
                          Grade {g}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Search & Filter Bar inside Modal */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
                  <div className="flex-1 relative flex items-center">
                    <span className="absolute left-3 text-gray-400 pointer-events-none flex items-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search registered students by name, School ID, email..."
                      value={dbStudentSearch}
                      onChange={(e) => setDbStudentSearch(e.target.value)}
                      className="rb-input text-xs w-full !pl-9 !pr-3"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={dbBrowseGradeFilter}
                      onChange={(e) => setDbBrowseGradeFilter(e.target.value)}
                      className="rb-input py-1 px-2.5 text-xs font-bold"
                    >
                      <option value="all">All Grades (1–12)</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <option key={g} value={String(g)}>
                          Grade {g}
                        </option>
                      ))}
                    </select>

                    <select
                      value={dbBrowseSectionFilter}
                      onChange={(e) => setDbBrowseSectionFilter(e.target.value)}
                      className="rb-input py-1 px-2.5 text-xs font-bold"
                    >
                      <option value="all">All Sections</option>
                      <option value="unassigned">Unassigned Only</option>
                      {allRegisteredSections.map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                    </select>

                    {filteredDbStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleSelectAllDbStudents}
                        className="px-2.5 py-1 rounded border border-[#3D6B8A] text-xs font-sans font-bold text-[#3D6B8A] hover:bg-[#3D6B8A10] cursor-pointer"
                      >
                        {filteredDbStudents.every((s) => selectedDbStudentIds.has(s.school_id || s.username || s.id))
                          ? 'Deselect All'
                          : `Select All (${filteredDbStudents.length})`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Registered Students Checkbox Table */}
                {filteredDbStudents.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-white/50">
                    <p className="text-xs text-gray-600 font-sans font-medium">
                      No registered students found matching your search.
                    </p>
                    <p className="text-xs text-gray-400 font-sans mt-1">
                      Try searching with a different term, or register a new student using the tab above.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border border-[#DED2B4] rounded-xl bg-white divide-y divide-gray-100 shadow-inner">
                    {filteredDbStudents.map((s) => {
                      const studentId = s.school_id || s.username || s.id;
                      const isChecked = selectedDbStudentIds.has(studentId);
                      const currentSection = s.section_name || s.class_name || 'Unassigned';
                      const targetSecClean = dbTargetSection.trim().toLowerCase();
                      const isAlreadyInTarget = currentSection.toLowerCase() === targetSecClean && targetSecClean !== '' && targetSecClean !== 'unassigned';

                      return (
                        <label
                          key={studentId}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                            isChecked ? 'bg-[#EBF3F8]' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleDbStudent(studentId)}
                              className="w-4 h-4 text-[#3D6B8A] rounded border-gray-300 focus:ring-[#3D6B8A] cursor-pointer shrink-0"
                            />
                            <Avatar name={s.display_name} accent={TEACHER_ACCENT} size={32} src={(s as any).avatar_url || (s as any).avatarUrl} />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-gray-900 truncate">
                                {s.display_name}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
                                <span>ID: <strong>{s.school_id || s.username}</strong></span>
                                {s.email && <span className="hidden sm:inline text-gray-400">· {s.email}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#EBF3F8] text-[#1E3A5F] border border-[#A8C5DA]">
                              Grade {s.grade_level}
                            </span>
                            {isAlreadyInTarget ? (
                              <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#2E7D4F] border border-[#BFE0CC]">
                                In Section {currentSection}
                              </span>
                            ) : (
                              <span className={`text-[10px] font-sans font-medium px-2 py-0.5 rounded-full ${
                                currentSection === 'Unassigned'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {currentSection === 'Unassigned' ? 'Unassigned' : `Section: ${currentSection}`}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#DED2B4]">
                  <span className="text-xs font-mono text-gray-600 font-medium">
                    {selectedDbStudentIds.size} student{selectedDbStudentIds.size === 1 ? '' : 's'} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <GhostButton onClick={() => setShowModal(false)}>Cancel</GhostButton>
                    <PrimaryButton type="submit" accent={TEACHER_ACCENT} disabled={selectedDbStudentIds.size === 0}>
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        <span>
                          Enroll {selectedDbStudentIds.size > 0 ? selectedDbStudentIds.size : ''} Student{selectedDbStudentIds.size === 1 ? '' : 's'} to Section {dbTargetSection || 'Section'}
                        </span>
                      </span>
                    </PrimaryButton>
                  </div>
                </div>
              </form>
            )}

            {/* ─── MODE 2: SINGLE STUDENT REGISTRATION ─── */}
            {addMode === 'single' && (
              <form onSubmit={handleSingleAdd} className="flex flex-col gap-3.5">
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium font-sans" style={{ color: MUTED }}>
                      Student Full Name <span className="text-red-500">*</span>
                    </span>
                    <input
                      required
                      placeholder="e.g. Juan dela Cruz"
                      value={draft.display_name}
                      onChange={(e) => setDraft((d) => ({ ...d, display_name: e.target.value }))}
                      className="rb-input"
                      autoFocus
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium font-sans" style={{ color: MUTED }}>
                      Student School ID Number <span className="text-red-500">*</span>
                    </span>
                    <input
                      required
                      placeholder="e.g. 20261001"
                      value={draft.school_id}
                      onChange={(e) => setDraft((d) => ({ ...d, school_id: e.target.value }))}
                      className="rb-input"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-xs font-medium font-sans" style={{ color: MUTED }}>
                      Mobile Phone Number <span className="text-gray-400 font-normal">(for 2FA & SMS verification)</span>
                    </span>
                    <input
                      type="tel"
                      placeholder="e.g. 0917 123 4567 or +63 917 123 4567"
                      value={draft.phone_number}
                      onChange={(e) => setDraft((d) => ({ ...d, phone_number: e.target.value }))}
                      className="rb-input"
                    />
                  </label>
                </div>

                <div className="grid sm:grid-cols-3 gap-3.5">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium font-sans" style={{ color: MUTED }}>
                      Class / Section <span className="text-red-500">*</span>
                    </span>
                    <select
                      value={draft.section_name}
                      onChange={(e) => handleSectionChange(e.target.value)}
                      className="rb-input"
                      required
                    >
                      {sectionOptions.length === 0 ? (
                        <option value="">No classes created yet (Please add a class first)</option>
                      ) : (
                        sectionOptions.map((sec) => (
                          <option key={sec} value={sec}>
                            Section {sec}
                          </option>
                        ))
                      )}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium font-sans" style={{ color: MUTED }}>
                      Grade Level
                    </span>
                    <select
                      value={draft.grade_level}
                      onChange={(e) => setDraft((d) => ({ ...d, grade_level: e.target.value }))}
                      className="rb-input"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <option key={g} value={g}>
                          Grade {g}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium font-sans" style={{ color: MUTED }}>
                      Language
                    </span>
                    <select
                      value={draft.preferred_language}
                      onChange={(e) => setDraft((d) => ({ ...d, preferred_language: e.target.value as 'en' | 'tl' }))}
                      className="rb-input"
                    >
                      <option value="en">English</option>
                      <option value="tl">Tagalog (Filipino)</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DED2B4]">
                  <GhostButton onClick={() => setShowModal(false)}>Cancel</GhostButton>
                  <PrimaryButton type="submit" accent={TEACHER_ACCENT}>
                    Save & Add Student
                  </PrimaryButton>
                </div>
              </form>
            )}

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default TeacherStudents;
