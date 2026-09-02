'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SectionHeader, Card, Badge, EmptyState, Avatar, PhilIRIBadge, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN, PhilIRILevel } from '../_shared';
import { recordAuthLog, recordActivity } from '@/utils/auditLogger';
import { Check, X } from 'lucide-react';

const ADMIN_ACCENT = '#7A4A6B';

const GRADE_COLORS: Record<string, string> = {
  low: '#3D6B8A',
  mid: '#2A6B4F',
  high: '#7A4A6B',
};

function gradeColor(level: number): string {
  if (level <= 2) return GRADE_COLORS.low;
  if (level <= 6) return GRADE_COLORS.mid;
  return GRADE_COLORS.high;
}

export interface Student {
  id: string;
  display_name: string;
  username: string;
  school_id?: string;
  email?: string;
  class_name?: string;
  section_name?: string;
  teacher_name?: string;
  grade_level: number;
  session_count: number;
  preferred_language?: 'en' | 'tl';
  latest_phil_iri?: PhilIRILevel;
}

function formatStudentEmail(displayName: string, username?: string, customEmail?: string): string {
  if (customEmail && customEmail.trim() && customEmail.includes('@')) {
    return customEmail.trim();
  }
  const cleanId = (username || displayName || 'student').trim().toLowerCase();
  return `${cleanId}@student.smccnasipit.edu.ph`;
}

export function AdminStudents({ students: initialStudents = [] }: { students?: Student[] }) {
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>(initialStudents || []);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    displayName: '',
    schoolId: '',
    email: '',
    password: '',
    gradeLevel: '7',
    sectionName: 'St. Jude',
    preferredLanguage: 'en' as 'en' | 'tl',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  async function loadStudents() {
    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const savedSessions = JSON.parse(localStorage.getItem('readbuddy_student_sessions') || '[]');

      let backendStudents: any[] = [];
      try {
        const res = await fetch('/api/auth/students');
        if (res.ok) {
          backendStudents = await res.json();
        }
      } catch (err) {}

      const combinedMap = new Map<string, Student>();
      let accountsMapUpdated = false;

      // Process backend students
      if (Array.isArray(backendStudents)) {
        backendStudents.forEach((st) => {
          const sid = (st.school_id || '').toLowerCase().trim();
          const un = (st.username || '').toLowerCase().trim();
          const key = sid || un;
          if (!key) return;

          const matches = savedSessions.filter(
            (ses: any) =>
              (ses.student_name && ses.student_name.toLowerCase() === (st.display_name || '').toLowerCase()) ||
              (ses.student_id && (ses.student_id === st.school_id || ses.student_id === st.username))
          );

          const studentEmail = formatStudentEmail(st.display_name, st.username || st.school_id, st.email);

          combinedMap.set(key, {
            id: st.id,
            display_name: st.display_name || 'Student',
            username: st.username || sid,
            school_id: st.school_id || sid,
            email: studentEmail,
            class_name: st.section_name || 'Unassigned',
            section_name: st.section_name || 'Unassigned',
            teacher_name: st.teacher_name && st.teacher_name !== 'Faculty' ? st.teacher_name : undefined,
            grade_level: Number(st.grade_level) || 7,
            preferred_language: st.preferred_language || 'en',
            session_count: matches.length,
            latest_phil_iri: matches.length > 0 ? matches[0].phil_iri_level : undefined,
          });
        });
      }

      // Process localStorage accounts
      Object.keys(accountsMap).forEach((key) => {
        const acc = accountsMap[key];
        if (!acc || acc.role !== 'student') return;
        const sid = (acc.school_id || '').toLowerCase().trim();
        const un = (acc.username || '').toLowerCase().trim();
        const dn = (acc.display_name || '').toLowerCase().trim();
        const mapKey = sid || un || dn;
        if (!mapKey) return;

        const studentEmail = formatStudentEmail(acc.display_name, acc.username || acc.school_id, acc.email);
        if (acc.email !== studentEmail) {
          acc.email = studentEmail;
          accountsMapUpdated = true;
        }

        const matches = savedSessions.filter(
          (ses: any) =>
            (ses.student_name && ses.student_name.toLowerCase() === dn) ||
            (ses.student_id && (ses.student_id === acc.school_id || ses.student_id === acc.username))
        );

        const existing = combinedMap.get(mapKey) || combinedMap.get(sid) || combinedMap.get(un);
        combinedMap.set(mapKey, {
          id: existing?.id || `std-${mapKey}`,
          display_name: acc.display_name || existing?.display_name || 'Student',
          username: acc.username || existing?.username || sid,
          school_id: acc.school_id || existing?.school_id || sid,
          email: studentEmail,
          class_name: acc.section_name || acc.class_name || existing?.section_name || 'Unassigned',
          section_name: acc.section_name || acc.class_name || existing?.section_name || 'Unassigned',
          teacher_name: acc.teacher_name || existing?.teacher_name || undefined,
          grade_level: Number(acc.grade_level) || existing?.grade_level || 7,
          preferred_language: acc.preferred_language || existing?.preferred_language || 'en',
          session_count: matches.length || existing?.session_count || 0,
          latest_phil_iri: matches.length > 0 ? matches[0].phil_iri_level : existing?.latest_phil_iri,
        });
      });

      if (accountsMapUpdated) {
        localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
      }

      setStudents(Array.from(combinedMap.values()));
    } catch (e) {}
  }

  useEffect(() => {
    loadStudents();
    window.addEventListener('readbuddy_accounts_updated', loadStudents);
    window.addEventListener('readbuddy_students_updated', loadStudents);
    window.addEventListener('readbuddy_student_sessions_updated', loadStudents);
    return () => {
      window.removeEventListener('readbuddy_accounts_updated', loadStudents);
      window.removeEventListener('readbuddy_students_updated', loadStudents);
      window.removeEventListener('readbuddy_student_sessions_updated', loadStudents);
    };
  }, [initialStudents]);

  // ─── CRUD HANDLERS ───

  function handleSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    const { displayName, schoolId, email, password, gradeLevel, sectionName, preferredLanguage } = formData;

    const cleanName = displayName.trim();
    const cleanId = schoolId.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanId) {
      alert('Please fill in student name and School ID.');
      return;
    }

    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
      const lowerId = cleanId.toLowerCase();
      const formalUsername = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

      if (editingStudent && editingStudent.school_id && editingStudent.school_id.toLowerCase() !== lowerId) {
        delete accountsMap[editingStudent.school_id];
        delete accountsMap[editingStudent.school_id.toLowerCase()];
        delete passwordsMap[editingStudent.school_id];
      }

      const formattedEmail = formatStudentEmail(cleanName, formalUsername, cleanEmail);

      const accountData = {
        display_name: cleanName,
        username: formalUsername,
        school_id: cleanId,
        email: formattedEmail,
        password: password || passwordsMap[cleanId] || passwordsMap[lowerId] || 'smcc2026',
        role: 'student',
        grade_level: Number(gradeLevel),
        section_name: sectionName,
        class_name: sectionName,
        preferred_language: preferredLanguage,
        created_at: new Date().toISOString().split('T')[0],
      };

      accountsMap[cleanId] = accountData;
      accountsMap[lowerId] = accountData;
      accountsMap[formalUsername] = accountData;
      if (formattedEmail) accountsMap[formattedEmail] = accountData;

      if (password) {
        passwordsMap[cleanId] = password;
        passwordsMap[lowerId] = password;
        passwordsMap[formalUsername] = password;
        passwordsMap[formattedEmail] = password;
      }

      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
      localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));

      // Post to backend database
      try {
        fetch('/api/auth/student/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            display_name: cleanName,
            school_id: cleanId,
            username: formalUsername,
            email: formattedEmail,
            password: password || 'smcc2026',
            grade_level: Number(gradeLevel),
            preferred_language: preferredLanguage,
          }),
        });
      } catch (err) {}

      loadStudents();
      window.dispatchEvent(new Event('readbuddy_accounts_updated'));
      window.dispatchEvent(new Event('readbuddy_students_updated'));

      recordAuthLog({
        identifier: cleanId,
        display_name: cleanName,
        role: 'student',
        method: 'Local Password',
        status: editingStudent ? 'UPDATED' : 'CREATED',
        details: editingStudent ? `Student record modified by admin (${formattedEmail})` : `Student account created by admin (${formattedEmail})`,
      });

      recordActivity({
        user_name: 'System Admin',
        role: 'admin',
        action: editingStudent ? 'Updated Student Account' : 'Created Student Account',
        details: `${editingStudent ? 'Updated' : 'Created'} student profile for ${cleanName} (ID: ${cleanId})`,
      });

      setIsAddModalOpen(false);
      setEditingStudent(null);
      setFormData({
        displayName: '',
        schoolId: '',
        email: '',
        password: '',
        gradeLevel: '7',
        sectionName: 'St. Jude',
        preferredLanguage: 'en',
      });

      setNotification(editingStudent ? `✓ Student details updated for "${cleanName}".` : `✓ New student account "${cleanName}" created!`);
      setTimeout(() => setNotification(null), 4000);
    } catch (e) {}
  }

  function handleOpenEdit(s: Student) {
    setEditingStudent(s);
    setFormData({
      displayName: s.display_name,
      schoolId: s.school_id || s.username,
      email: s.email || '',
      password: '',
      gradeLevel: String(s.grade_level || 7),
      sectionName: s.section_name || s.class_name || 'St. Jude',
      preferredLanguage: s.preferred_language || 'en',
    });
    setIsAddModalOpen(true);
  }

  async function handleDeleteStudent(studentId: string, studentName: string) {
    if (!window.confirm(`PERMANENT DELETION (Admin):\nAre you sure you want to permanently delete the student account for "${studentName}"?`)) return;

    const studentObj = students.find((s) => s.id === studentId || s.school_id === studentId || s.username === studentId);
    const schoolId = studentObj?.school_id || studentObj?.username || studentId;
    const lowerSid = schoolId.toLowerCase();

    setStudents((prev) => prev.filter((s) => s.id !== studentId && s.school_id !== studentId && s.username !== studentId));

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

      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
      localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));

      // Remove from teacher students roster
      const savedTeacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
      const filteredTeacherStudents = savedTeacherStudents.filter(
        (s: any) => (s.school_id || s.username)?.toLowerCase() !== lowerSid && s.id !== studentId
      );
      localStorage.setItem('readbuddy_teacher_students', JSON.stringify(filteredTeacherStudents));

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

      recordAuthLog({
        identifier: schoolId,
        display_name: studentName,
        role: 'student',
        method: 'Local Password',
        status: 'DELETED',
        details: `Student account "${studentName}" permanently deleted by admin`,
      });

      recordActivity({
        user_name: 'System Admin',
        role: 'admin',
        action: 'Deleted Student Account',
        details: `Removed learner profile for ${studentName}`,
      });
    } catch (e) {}

    setNotification(`Student account "${studentName}" has been permanently deleted.`);
    setTimeout(() => setNotification(null), 5000);
    loadStudents();
  }

  async function handleUnassignStudent(studentId: string, studentName: string) {
    const studentObj = students.find((s) => s.id === studentId || s.school_id === studentId || s.username === studentId);
    const schoolId = studentObj?.school_id || studentObj?.username || studentId;
    const lowerSid = schoolId.toLowerCase();

    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      if (accountsMap[schoolId]) {
        accountsMap[schoolId].section_name = 'Unassigned';
        accountsMap[schoolId].class_name = 'Unassigned';
        accountsMap[schoolId].teacher_name = undefined;
      }
      if (accountsMap[lowerSid]) {
        accountsMap[lowerSid].section_name = 'Unassigned';
        accountsMap[lowerSid].class_name = 'Unassigned';
        accountsMap[lowerSid].teacher_name = undefined;
      }
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      window.dispatchEvent(new Event('readbuddy_accounts_updated'));
      window.dispatchEvent(new Event('readbuddy_students_updated'));

      recordActivity({
        user_name: 'System Admin',
        role: 'admin',
        action: 'Unassigned Student',
        details: `Detached ${studentName} from class section roster`,
      });
    } catch (e) {}

    setNotification(`"${studentName}" unassigned.`);
    setTimeout(() => setNotification(null), 3000);
    loadStudents();
  }

  // ─── CSV EXPORT & PRINT ───

  function handleExportCsv() {
    if (students.length === 0) {
      alert('No students to export.');
      return;
    }

    const headers = ['Student Full Name', 'School ID Number', 'Email Address', 'Grade Level', 'Class / Section', 'Teacher / Faculty', 'Reading Sessions Count', 'Latest Phil-IRI'];
    const rows = students.map((s) => [
      `"${s.display_name}"`,
      `"${s.school_id || s.username}"`,
      `"${s.email || ''}"`,
      `"Grade ${s.grade_level}"`,
      `"${s.class_name || s.section_name || 'Unassigned'}"`,
      `"${s.teacher_name || 'None'}"`,
      `"${s.session_count || 0}"`,
      `"${s.latest_phil_iri || 'Not Assessed'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smcc_students_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification('✓ Students roster exported to CSV successfully.');
    setTimeout(() => setNotification(null), 3000);
  }

  function handlePrintRoster() {
    window.print();
  }

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.display_name.toLowerCase().includes(q) ||
      (s.school_id && s.school_id.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.class_name && s.class_name.toLowerCase().includes(q));

    const matchesGrade = gradeFilter === 'all' || String(s.grade_level) === gradeFilter;

    return matchesSearch && matchesGrade;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <SectionHeader
          title="Students & Classroom Roster"
          subtitle="Manage student profiles, grade level assignments, reading assessment history, and roster export."
          accent={ADMIN_ACCENT}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setEditingStudent(null);
              setFormData({
                displayName: '',
                schoolId: '',
                email: '',
                password: '',
                gradeLevel: '7',
                sectionName: 'St. Jude',
                preferredLanguage: 'en',
              });
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #7A4A6B, #5C3650)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Student</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl text-xs font-sans font-semibold text-gray-700 bg-white border border-[#DED2B4] hover:bg-gray-50 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintRoster}
            className="px-3 py-2 rounded-xl text-xs font-sans font-semibold text-gray-700 bg-white border border-[#DED2B4] hover:bg-gray-50 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print</span>
          </button>
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#DED2B4]">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search students by name, ID, or section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-input text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-sans font-semibold">Grade:</span>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="rb-input text-xs py-1 px-2.5"
          >
            <option value="all">All Grades</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
              <option key={g} value={String(g)}>Grade {g}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No student accounts found in the database." />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((s) => {
            const isAssigned = Boolean(s.class_name && s.class_name !== 'Unassigned');
            const hasTeacher = Boolean(s.teacher_name && s.teacher_name !== 'Faculty');

            return (
              <Card key={s.id || s.school_id || s.username} hoverable className="flex items-center justify-between gap-4 flex-wrap rb-fade-in-up">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <Avatar name={s.display_name} accent={gradeColor(s.grade_level)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap" style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>
                      <span className="text-base">{s.display_name}</span>
                      {isAssigned ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F4F9FC] text-[#3D6B8A] font-sans font-semibold border border-[#D0E2EC]">
                          Section: {s.class_name}
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-sans font-medium border border-gray-200">
                          Unassigned
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-1 flex items-center gap-3 flex-wrap" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                      <span><strong>School ID:</strong> {s.school_id || s.username}</span>
                      {s.email && (
                        <>
                          <span>•</span>
                          <span className="truncate">{s.email}</span>
                        </>
                      )}
                      {hasTeacher && isAssigned && (
                        <>
                          <span>•</span>
                          <span><strong>Teacher:</strong> {s.teacher_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="info">Grade {s.grade_level}</Badge>
                  <Badge tone="neutral">
                    {s.session_count} session{s.session_count === 1 ? '' : 's'}
                  </Badge>
                  {s.latest_phil_iri && (
                    <PhilIRIBadge level={s.latest_phil_iri} showIcon={false} />
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(s)}
                    className="px-2.5 py-1 text-xs font-sans font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg cursor-pointer"
                  >
                    Edit
                  </button>

                  {isAssigned && (
                    <button
                      type="button"
                      onClick={() => handleUnassignStudent(s.id || s.school_id || s.username, s.display_name)}
                      className="px-2.5 py-1 text-xs font-sans font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 cursor-pointer"
                    >
                      Unassign
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(s.id || s.school_id || s.username, s.display_name)}
                    className="px-2.5 py-1 text-xs font-sans font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── ADD / EDIT STUDENT MODAL ─── */}
      {isAddModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md bg-[#FFFDF8] border border-[#DED2B4] rounded-2xl p-6 sm:p-7 shadow-2xl relative font-sans my-auto max-h-[90vh] overflow-y-auto flex flex-col rb-fade-in-up">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={2.25} />
            </button>

            <h3 className="text-lg font-serif font-bold text-[#1F4D3A] mb-1">
              {editingStudent ? 'Edit Student Account' : 'Add New Student'}
            </h3>
            <p className="text-xs text-gray-500 font-sans mb-4">
              {editingStudent ? 'Modify student information, grade, or section.' : 'Create an authenticated learner record.'}
            </p>

            <form onSubmit={handleSaveStudent} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 font-sans">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan dela Cruz"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="rb-input text-xs w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 font-sans">School ID Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 202612345"
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  className="rb-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 font-sans">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. jdelacruz@student.smccnasipit.edu.ph"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rb-input text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 font-sans">Grade Level</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="rb-input text-xs w-full"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={String(g)}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 font-sans">Section Name</label>
                  <input
                    type="text"
                    placeholder="e.g. St. Jude"
                    value={formData.sectionName}
                    onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })}
                    className="rb-input text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 font-sans">Preferred Language</label>
                  <select
                    value={formData.preferredLanguage}
                    onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value as 'en' | 'tl' })}
                    className="rb-input text-xs w-full"
                  >
                    <option value="en">English</option>
                    <option value="tl">Tagalog</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 font-sans">
                    {editingStudent ? 'Password (Optional)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    placeholder={editingStudent ? '••••••••' : 'Min. 6 chars'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="rb-input text-xs w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 mt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-sans font-bold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #7A4A6B, #5C3650)' }}
                >
                  {editingStudent ? 'Save Student' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminStudents;
