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

const TEACHER_ACCENT = '#3D6B8A';
const DEFAULT_STUDENT_PASSWORD = 'smcc2026';

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
  sessions_completed?: number;
  latest_level?: PhilIRILevel;
}

interface SchoolClass {
  id: string;
  name: string;
  grade_level: number;
  class_code: string;
  student_count: number;
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
  const [showModal, setShowModal] = useState(false);
  const [addMode, setAddMode] = useState<'select_database' | 'single' | 'bulk'>('select_database');
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(initialSectionFilter || 'all');
  const [notification, setNotification] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Modal Selection Mode State ───
  const [dbTargetSection, setDbTargetSection] = useState('');
  const [dbCustomSection, setDbCustomSection] = useState('');
  const [dbTargetGrade, setDbTargetGrade] = useState('7');
  const [dbBrowseGradeFilter, setDbBrowseGradeFilter] = useState<string>('all'); // 'all' or '1'..'12'
  const [dbStudentSearch, setDbStudentSearch] = useState('');
  const [selectedDbStudentIds, setSelectedDbStudentIds] = useState<Set<string>>(new Set());
  const [allRegisteredStudents, setAllRegisteredStudents] = useState<Student[]>([]);

  // Single add draft
  const [draft, setDraft] = useState({
    display_name: '',
    school_id: '',
    grade_level: '7',
    section_name: '',
    custom_section_name: '',
    preferred_language: 'en' as 'en' | 'tl',
  });

  // Bulk add draft
  const [bulkText, setBulkText] = useState('');
  const [bulkGrade, setBulkGrade] = useState('7');
  const [bulkSection, setBulkSection] = useState('');
  const [bulkCustomSection, setBulkCustomSection] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load classes dynamically from localStorage
  function loadClasses() {
    try {
      const saved = localStorage.getItem('readbuddy_teacher_classes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAvailableClasses(parsed);
          if (!dbTargetSection) {
            setDbTargetSection(parsed[0].name);
            setDbTargetGrade(String(parsed[0].grade_level || '7'));
          }
          if (!draft.section_name) {
            setDraft((d) => ({
              ...d,
              section_name: parsed[0].name,
              grade_level: String(parsed[0].grade_level || d.grade_level),
            }));
          }
          if (!bulkSection) {
            setBulkSection(parsed[0].name);
            setBulkGrade(String(parsed[0].grade_level || '7'));
          }
          return;
        }
      }
      setAvailableClasses([]);
      if (!dbTargetSection) setDbTargetSection('__custom__');
      if (!draft.section_name) setDraft((d) => ({ ...d, section_name: '__custom__' }));
      if (!bulkSection) setBulkSection('__custom__');
    } catch (e) {}
  }

  // Load all registered database students and calculate active enrolled teacher roster
  async function loadRoster() {
    try {
      const savedSessions = JSON.parse(localStorage.getItem('readbuddy_student_sessions') || '[]');
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const savedRoster = localStorage.getItem('readbuddy_teacher_students');
      const teacherStudentsRoster: Student[] = savedRoster ? JSON.parse(savedRoster) : [];
      const savedClasses: SchoolClass[] = JSON.parse(localStorage.getItem('readbuddy_teacher_classes') || '[]');
      const teacherClassNames = new Set(savedClasses.map((c) => c.name.toLowerCase()));

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

          globalStudentsMap.set(key, {
            id: st.id || `std-${key}`,
            display_name: st.display_name || 'Student',
            username: st.username || sid,
            school_id: st.school_id || sid,
            email: st.email || `${st.school_id}@smccnasipit.edu.ph`,
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
          email: acc.email || existing?.email || `${acc.school_id}@smccnasipit.edu.ph`,
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
      teacherStudentsRoster.forEach((st) => {
        const sid = (st.school_id || '').toLowerCase().trim();
        const un = (st.username || '').toLowerCase().trim();
        const key = sid || un;
        if (!key) return;

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
      });

      const allRegistered = Array.from(globalStudentsMap.values());
      setAllRegisteredStudents(allRegistered);

      // ─── ONLY ENROLLED STUDENTS IN THIS TEACHER'S SECTIONS APPEAR IN ACTIVE ROSTER ───
      const enrolledInTeacher = allRegistered.filter((st) => {
        const sec = (st.section_name || st.class_name || '').trim().toLowerCase();
        if (!sec || sec === 'unassigned') return false;

        // Is explicitly on the teacher's roster
        const key = (st.school_id || st.username || '').toLowerCase().trim();
        if (explicitRosterMap.has(key)) return true;

        // Matches teacher's name or one of the teacher's created class sections
        if (st.teacher_name && st.teacher_name.toLowerCase() === teacherName.toLowerCase()) return true;
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

  function handleBulkSectionChange(newSection: string) {
    const foundClass = availableClasses.find((c) => c.name.toLowerCase() === newSection.toLowerCase());
    setBulkSection(newSection);
    if (foundClass) {
      setBulkGrade(String(foundClass.grade_level));
    }
  }

  // ─── HANDLER: Add Selected Database Students into Class Section ───
  async function handleAddSelectedDbStudents(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const chosenSection = dbTargetSection === '__custom__'
      ? (dbCustomSection.trim() || 'General')
      : (dbTargetSection || 'General');

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

    const chosenSection = draft.section_name === '__custom__'
      ? (draft.custom_section_name.trim() || 'General')
      : (draft.section_name || 'General');

    const chosenGrade = Number(draft.grade_level) || 7;
    const formalUsername = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const studentEmail = existingAcc?.email || `${cleanId}@smccnasipit.edu.ph`;
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
      grade_level: '7',
      section_name: availableClasses[0]?.name || '',
      custom_section_name: '',
      preferred_language: 'en',
    });
    setNotification(`Successfully registered "${cleanName}" (ID: ${cleanId}) into Section ${chosenSection}!`);
    setTimeout(() => setNotification(null), 7000);
    setShowModal(false);
    loadRoster();
  }

  async function handleBulkImport(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const chosenSection = bulkSection === '__custom__'
      ? (bulkCustomSection.trim() || 'General')
      : (bulkSection || 'General');

    const chosenGrade = Number(bulkGrade) || 7;

    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setFormError('Please enter at least one student line.');
      return;
    }

    const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
    const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');

    const newEntries: Student[] = [];
    let addedCount = 0;
    const seenBatchIds = new Map<string, string>();

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      let idPart = '';
      let namePart = '';

      if (line.includes(',') || line.includes('\t') || line.includes(' - ') || line.includes(';')) {
        const separator = line.includes(',') ? ',' : line.includes('\t') ? '\t' : line.includes(';') ? ';' : ' - ';
        const parts = line.split(separator).map((p) => p.trim());
        if (parts.length >= 2) {
          if (/\d/.test(parts[0]) && !/\d/.test(parts[1])) {
            idPart = parts[0];
            namePart = parts[1];
          } else if (/\d/.test(parts[1]) && !/\d/.test(parts[0])) {
            namePart = parts[0];
            idPart = parts[1];
          } else {
            idPart = parts[0];
            namePart = parts[1];
          }
        }
      } else {
        const match = line.match(/^(\d+)\s+(.+)$/);
        if (match) {
          idPart = match[1];
          namePart = match[2];
        } else {
          namePart = line;
          idPart = `2026${1000 + allRegisteredStudents.length + index}`;
        }
      }

      if (!namePart) continue;
      if (!idPart) idPart = `2026${1000 + allRegisteredStudents.length + index}`;

      const lowerId = idPart.toLowerCase();
      if (seenBatchIds.has(lowerId)) {
        setFormError(`Duplicate School ID "${idPart}" found in roster text for "${namePart}". Every student must have a unique School ID Number.`);
        return;
      }
      seenBatchIds.set(lowerId, namePart);

      const existingAcc = accountsMap[idPart] || accountsMap[lowerId];
      const existingStudent = allRegisteredStudents.find((s) => s.school_id?.toLowerCase() === lowerId);
      if (existingStudent || (existingAcc && existingAcc.display_name?.toLowerCase() !== namePart.toLowerCase())) {
        const conflict = existingStudent?.display_name || existingAcc?.display_name || 'another account';
        setFormError(`School ID "${idPart}" is already assigned to "${conflict}". Every student must have a unique School ID Number.`);
        return;
      }

      const formalUsername = namePart.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const studentEmail = existingAcc?.email || `${idPart}@smccnasipit.edu.ph`;
      const studentPassword = existingAcc?.password || DEFAULT_STUDENT_PASSWORD;

      const studentObj: Student = {
        id: `std-${idPart}`,
        display_name: namePart,
        username: formalUsername,
        school_id: idPart,
        email: studentEmail,
        password: studentPassword,
        grade_level: chosenGrade,
        class_name: chosenSection,
        section_name: chosenSection,
        teacher_name: teacherName,
        preferred_language: 'en',
        sessions_completed: 0,
      };

      newEntries.push(studentObj);

      const accountData = {
        display_name: namePart,
        username: formalUsername,
        school_id: idPart,
        email: studentEmail,
        password: studentPassword,
        role: 'student',
        grade_level: chosenGrade,
        section_name: chosenSection,
        class_name: chosenSection,
        teacher_name: teacherName,
        created_at: new Date().toISOString().split('T')[0],
      };

      accountsMap[idPart] = accountData;
      accountsMap[idPart.toLowerCase()] = accountData;
      accountsMap[formalUsername] = accountData;
      accountsMap[studentEmail] = accountData;
      accountsMap[studentEmail.toLowerCase()] = accountData;

      passwordsMap[idPart] = studentPassword;
      passwordsMap[idPart.toLowerCase()] = studentPassword;
      passwordsMap[formalUsername] = studentPassword;
      passwordsMap[studentEmail] = studentPassword;
      passwordsMap[studentEmail.toLowerCase()] = studentPassword;

      // Record student to PostgreSQL Database
      try {
        fetch('/api/auth/student/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            display_name: namePart,
            school_id: idPart,
            username: formalUsername,
            email: studentEmail,
            password: studentPassword,
            grade_level: chosenGrade,
            section_name: chosenSection,
            preferred_language: 'en',
          }),
        });
      } catch (e) {}

      addedCount++;
    }

    if (addedCount === 0) return;

    try {
      const savedTeacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
      const newSchoolIds = new Set(newEntries.map((ne) => ne.school_id?.toLowerCase()));
      const updatedTeacherRoster = [...newEntries, ...savedTeacherStudents.filter((s: any) => !newSchoolIds.has((s.school_id || s.username)?.toLowerCase()))];
      
      localStorage.setItem('readbuddy_teacher_students', JSON.stringify(updatedTeacherRoster));
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
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
            student_count: addedCount,
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

    setNotification(`Successfully imported ${addedCount} student(s) into Section ${chosenSection} (Grade ${chosenGrade})!`);
    setTimeout(() => setNotification(null), 7000);

    setBulkText('');
    setShowModal(false);
    loadRoster();
  }

  // ─── ACTION 1: Unenroll Student from Section (Status -> Unassigned) ───
  async function handleUnenrollFromSection(studentId: string, studentName: string) {
    if (!window.confirm(`Unenroll "${studentName}" from this class section? The student will be removed from your active roster and marked as Unassigned in the database.`)) return;

    const studentObj = allRegisteredStudents.find((s) => s.id === studentId || s.school_id === studentId || s.username === studentId);
    const schoolId = studentObj?.school_id || studentObj?.username || studentId;
    const lowerSid = schoolId.toLowerCase();

    // 1. Instantly remove from active teacher roster view
    setStudents((prev) => prev.filter((s) => s.id !== studentId && s.school_id !== studentId && s.username !== studentId));

    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      if (accountsMap[schoolId]) {
        accountsMap[schoolId] = {
          ...accountsMap[schoolId],
          section_name: 'Unassigned',
          class_name: 'Unassigned',
          teacher_name: undefined,
        };
      }
      if (accountsMap[lowerSid]) {
        accountsMap[lowerSid] = {
          ...accountsMap[lowerSid],
          section_name: 'Unassigned',
          class_name: 'Unassigned',
          teacher_name: undefined,
        };
      }
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      // Remove from teacher students roster
      const savedTeacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
      const filteredTeacherStudents = savedTeacherStudents.filter(
        (s: any) => (s.school_id || s.username)?.toLowerCase() !== lowerSid && s.id !== studentId
      );
      localStorage.setItem('readbuddy_teacher_students', JSON.stringify(filteredTeacherStudents));

      // Live sync with PostgreSQL database backend
      try {
        await fetch('/api/auth/students/unassign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: schoolId }),
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

  // ─── ACTION 2: Permanently Delete Student Account from System & Database ───
  async function handlePermanentDeleteStudent(studentId: string, studentName: string) {
    if (!window.confirm(`⚠️ PERMANENT DELETION:\nAre you sure you want to completely delete the student account for "${studentName}"?\n\nThis will permanently delete their account from the PostgreSQL database and all class rosters.`)) return;

    const studentObj = allRegisteredStudents.find((s) => s.id === studentId || s.school_id === studentId || s.username === studentId);
    const schoolId = studentObj?.school_id || studentObj?.username || studentId;
    const lowerSid = schoolId.toLowerCase();

    // Remove from UI immediately
    setStudents((prev) => prev.filter((s) => s.id !== studentId && s.school_id !== studentId && s.username !== studentId));
    setAllRegisteredStudents((prev) => prev.filter((s) => s.id !== studentId && s.school_id !== studentId && s.username !== studentId));

    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
      
      delete accountsMap[schoolId];
      delete accountsMap[lowerSid];
      if (studentObj?.username) {
        delete accountsMap[studentObj.username];
        delete accountsMap[studentObj.username.toLowerCase()];
      }
      if (studentObj?.email) {
        delete accountsMap[studentObj.email];
        delete accountsMap[studentObj.email.toLowerCase()];
      }

      delete passwordsMap[schoolId];
      delete passwordsMap[lowerSid];
      if (studentObj?.username) {
        delete passwordsMap[studentObj.username];
        delete passwordsMap[studentObj.username.toLowerCase()];
      }
      if (studentObj?.email) {
        delete passwordsMap[studentObj.email];
        delete passwordsMap[studentObj.email.toLowerCase()];
      }

      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
      localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));

      // Remove from teacher students roster
      const savedTeacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
      const filteredTeacherStudents = savedTeacherStudents.filter(
        (s: any) => (s.school_id || s.username)?.toLowerCase() !== lowerSid && s.id !== studentId
      );
      localStorage.setItem('readbuddy_teacher_students', JSON.stringify(filteredTeacherStudents));

      // Delete from PostgreSQL database backend
      try {
        await fetch('/api/auth/students/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: schoolId }),
        });
      } catch (err) {}

      window.dispatchEvent(new Event('readbuddy_accounts_updated'));
      window.dispatchEvent(new Event('readbuddy_students_updated'));
      window.dispatchEvent(new Event('readbuddy_classes_updated'));
    } catch (e) {}

    setNotification(`Student account "${studentName}" has been permanently deleted.`);
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

  // ─── Filter registered students shown in Database Search & Browse Mode ───
  const filteredDbStudents = allRegisteredStudents.filter((s) => {
    const matchesGrade = dbBrowseGradeFilter === 'all' || Number(s.grade_level) === Number(dbBrowseGradeFilter);
    const query = dbStudentSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      s.display_name.toLowerCase().includes(query) ||
      (s.school_id && s.school_id.toLowerCase().includes(query)) ||
      (s.username && s.username.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.section_name && s.section_name.toLowerCase().includes(query));
    return matchesGrade && matchesSearch;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <SectionHeader
          title="Student Roster"
          subtitle="Manage enrolled students across your class sections."
          accent={TEACHER_ACCENT}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <PrimaryButton
            accent={TEACHER_ACCENT}
            onClick={() => {
              setFormError(null);
              setAddMode('select_database');
              setDbStudentSearch('');
              setDbBrowseGradeFilter('all');
              loadRoster();
              setShowModal(true);
            }}
          >
            <span className="flex items-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>+ Add / Enroll Students</span>
            </span>
          </PrimaryButton>
          <GhostButton onClick={() => { setFormError(null); setAddMode('single'); setShowModal(true); }}>
            + Register New Student
          </GhostButton>
        </div>
      </div>

      {notification && (
        <div className="mb-4 p-3.5 rounded-xl bg-[#E6F4EA] border border-[#BFE0CC] text-[#2E7D4F] text-xs font-sans font-semibold flex items-center justify-between shadow-sm rb-fade-in-up">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-gray-700 cursor-pointer">✕</button>
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
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-600 font-sans shrink-0">
            Filter Section:
          </label>
          <select
            value={selectedClassFilter}
            onChange={(e) => { setSelectedClassFilter(e.target.value); setSearch(''); }}
            className="rb-input py-1.5 px-3 text-xs font-bold bg-white text-gray-800 border border-[#DED2B4] rounded-xl cursor-pointer min-w-[180px]"
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
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">School ID</th>
                <th className="py-3 px-4">Grade & Section</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Sessions Completed</th>
                <th className="py-3 px-4">Phil-IRI Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr key={s.id || s.school_id || s.username} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={s.display_name} accent={TEACHER_ACCENT} size={32} />
                      <div>
                        <div className="font-bold text-gray-900">{s.display_name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{s.email || `${s.school_id}@smccnasipit.edu.ph`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-gray-700">
                    {s.school_id || s.username}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-gray-800">Grade {s.grade_level}</span>
                      <span className="text-gray-400">·</span>
                      <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] border bg-[#EBF3F8] text-[#3D6B8A] border-[#A8C5DA]">
                        Section: {s.class_name || s.section_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 uppercase font-mono text-[10px] text-gray-600">
                    {s.preferred_language === 'tl' ? 'Tagalog' : 'English'}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-gray-700">
                    {s.sessions_completed || 0} session{(s.sessions_completed || 0) === 1 ? '' : 's'}
                  </td>
                  <td className="py-3 px-4">
                    {s.latest_level ? (
                      <PhilIRIBadge level={s.latest_level} />
                    ) : (
                      <span className="text-gray-400 italic text-[11px]">Not Assessed</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUnenrollFromSection(s.id || s.school_id || s.username, s.display_name)}
                        className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold cursor-pointer transition-colors border border-amber-200"
                        title="Remove from this class section (Student remains in system as Unassigned)"
                      >
                        Remove from Class
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermanentDeleteStudent(s.id || s.school_id || s.username, s.display_name)}
                        className="px-2 py-1 rounded hover:bg-red-50 text-red-600 text-[11px] font-semibold cursor-pointer transition-colors"
                        title="Permanently delete student account from database"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── DEDICATED ADD / ENROLL STUDENT MODAL DIALOG ─── */}
      {showModal && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto rb-fade-in-up">
          <div className="w-full max-w-3xl bg-[#FFFDF8] border border-[#DED2B4] rounded-2xl p-6 sm:p-8 shadow-2xl relative font-sans my-auto max-h-[90vh] overflow-y-auto flex flex-col">
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
                ✕
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Search & Select System Students</span>
              </button>
              <button
                type="button"
                onClick={() => { setFormError(null); setAddMode('single'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                  addMode === 'single' ? 'bg-[#3D6B8A] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                + Register New Student
              </button>
              <button
                type="button"
                onClick={() => { setFormError(null); setAddMode('bulk'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  addMode === 'bulk' ? 'bg-[#3D6B8A] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Paste Roster (Bulk)</span>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E] text-xs font-sans font-medium flex items-center justify-between">
                <span>{formError}</span>
                <button onClick={() => setFormError(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer ml-2">✕</button>
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
                    >
                      {sectionOptions.map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Section...</option>
                    </select>
                  </label>

                  {dbTargetSection === '__custom__' && (
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-xs font-bold font-sans text-gray-700">
                        New Custom Section Name
                      </span>
                      <input
                        required
                        value={dbCustomSection}
                        onChange={(e) => setDbCustomSection(e.target.value)}
                        className="rb-input text-xs"
                        placeholder="e.g. St. Mark"
                      />
                    </label>
                  )}

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
                      const targetSecClean = (dbTargetSection === '__custom__' ? dbCustomSection.trim() : dbTargetSection).toLowerCase();
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
                            <Avatar name={s.display_name} accent={TEACHER_ACCENT} size={32} />
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
                        <span>✓</span>
                        <span>
                          Enroll {selectedDbStudentIds.size > 0 ? selectedDbStudentIds.size : ''} Student{selectedDbStudentIds.size === 1 ? '' : 's'} to Section {dbTargetSection === '__custom__' ? (dbCustomSection || 'Custom') : dbTargetSection}
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
                    >
                      {sectionOptions.map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Section...</option>
                    </select>
                  </label>

                  {draft.section_name === '__custom__' && (
                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                      <span className="text-xs font-medium font-sans" style={{ color: MUTED }}>
                        Custom Section Name
                      </span>
                      <input
                        required
                        placeholder="e.g. St. Mark"
                        value={draft.custom_section_name}
                        onChange={(e) => setDraft((d) => ({ ...d, custom_section_name: e.target.value }))}
                        className="rb-input"
                      />
                    </label>
                  )}

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

            {/* ─── MODE 3: BULK IMPORT ─── */}
            {addMode === 'bulk' && (
              <form onSubmit={handleBulkImport} className="flex flex-col gap-3.5">
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium font-sans" style={{ color: MUTED }}>
                      Target Class / Section <span className="text-red-500">*</span>
                    </span>
                    <select
                      value={bulkSection}
                      onChange={(e) => handleBulkSectionChange(e.target.value)}
                      className="rb-input"
                    >
                      {sectionOptions.map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Section...</option>
                    </select>
                  </label>

                  {bulkSection === '__custom__' && (
                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                      <span className="text-xs font-medium font-sans" style={{ color: MUTED }}>
                        Custom Section Name
                      </span>
                      <input
                        required
                        placeholder="e.g. St. Mark"
                        value={bulkCustomSection}
                        onChange={(e) => setBulkCustomSection(e.target.value)}
                        className="rb-input"
                      />
                    </label>
                  )}

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium font-sans" style={{ color: MUTED }}>
                      Grade Level
                    </span>
                    <select
                      value={bulkGrade}
                      onChange={(e) => setBulkGrade(e.target.value)}
                      className="rb-input"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <option key={g} value={g}>
                          Grade {g}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium font-sans" style={{ color: MUTED }}>
                    Paste Roster List (One student per line)
                  </span>
                  <textarea
                    rows={6}
                    placeholder={`20261001, Juan dela Cruz\n20261002, Maria Clara\n20261003, Crisostomo Ibarra`}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="rb-input font-mono text-xs"
                  />
                  <span className="text-[11px] text-gray-500 font-sans">
                    Supported formats: <code>ID, Full Name</code> or <code>ID - Full Name</code> or <code>ID   Full Name</code>.
                  </span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DED2B4]">
                  <GhostButton onClick={() => setShowModal(false)}>Cancel</GhostButton>
                  <PrimaryButton type="submit" accent={TEACHER_ACCENT}>
                    Import All Students
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
