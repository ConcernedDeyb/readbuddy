'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, Badge, EmptyState, Avatar, PhilIRIBadge, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN, PhilIRILevel } from '../_shared';

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

interface Student {
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
  latest_phil_iri?: PhilIRILevel;
}

export function AdminStudents({ students: initialStudents = [] }: { students?: Student[] }) {
  const [students, setStudents] = useState<Student[]>(initialStudents || []);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  async function loadStudents() {
    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const savedSessions = JSON.parse(localStorage.getItem('readbuddy_student_sessions') || '[]');

      // Fetch live from backend PostgreSQL database
      let backendStudents: any[] = [];
      try {
        const res = await fetch('/api/auth/students');
        if (res.ok) {
          backendStudents = await res.json();
        }
      } catch (err) {}

      const combinedMap = new Map<string, Student>();

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

          combinedMap.set(key, {
            id: st.id,
            display_name: st.display_name || 'Student',
            username: st.username || sid,
            school_id: st.school_id || sid,
            email: st.email || `${st.school_id}@smccnasipit.edu.ph`,
            class_name: st.section_name || 'Unassigned',
            section_name: st.section_name || 'Unassigned',
            teacher_name: st.teacher_name && st.teacher_name !== 'Faculty' ? st.teacher_name : undefined,
            grade_level: Number(st.grade_level) || 7,
            session_count: matches.length,
            latest_phil_iri: matches.length > 0 ? matches[0].phil_iri_level : undefined,
          });
        });
      }

      // Process localStorage accounts
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

        const existing = combinedMap.get(key) || combinedMap.get(sid) || combinedMap.get(un);
        combinedMap.set(key, {
          id: existing?.id || `std-${key}`,
          display_name: acc.display_name || existing?.display_name || 'Student',
          username: acc.username || existing?.username || sid,
          school_id: acc.school_id || existing?.school_id || sid,
          email: acc.email || existing?.email || `${acc.school_id}@smccnasipit.edu.ph`,
          class_name: acc.section_name || acc.class_name || existing?.section_name || 'Unassigned',
          section_name: acc.section_name || acc.class_name || existing?.section_name || 'Unassigned',
          teacher_name: acc.teacher_name || existing?.teacher_name || undefined,
          grade_level: Number(acc.grade_level) || existing?.grade_level || 7,
          session_count: matches.length || existing?.session_count || 0,
          latest_phil_iri: matches.length > 0 ? matches[0].phil_iri_level : existing?.latest_phil_iri,
        });
      });

      setStudents(Array.from(combinedMap.values()));
    } catch (e) {}
  }

  useEffect(() => {
    loadStudents();
    window.addEventListener('readbuddy_accounts_updated', loadStudents);
    window.addEventListener('readbuddy_students_updated', loadStudents);
    window.addEventListener('readbuddy_student_sessions_updated', loadStudents);
    window.addEventListener('storage', loadStudents);
    return () => {
      window.removeEventListener('readbuddy_accounts_updated', loadStudents);
      window.removeEventListener('readbuddy_students_updated', loadStudents);
      window.removeEventListener('readbuddy_student_sessions_updated', loadStudents);
      window.removeEventListener('storage', loadStudents);
    };
  }, [initialStudents]);

  async function handleDeleteStudent(studentId: string, studentName: string) {
    if (!window.confirm(`⚠️ PERMANENT DELETION (Admin):\nAre you sure you want to permanently delete the student account for "${studentName}"?\n\nThis will completely remove them from the PostgreSQL database and all class rosters.`)) return;

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
    loadStudents();
  }

  async function handleUnassignStudent(studentId: string, studentName: string) {
    if (!window.confirm(`Unassign "${studentName}" from their current section?`)) return;

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

      // Remove from teacher students roster
      const savedTeacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
      const filteredTeacherStudents = savedTeacherStudents.filter(
        (s: any) => (s.school_id || s.username)?.toLowerCase() !== lowerSid && s.id !== studentId
      );
      localStorage.setItem('readbuddy_teacher_students', JSON.stringify(filteredTeacherStudents));

      // Sync unassign with PostgreSQL database backend
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

    setNotification(`"${studentName}" has been unassigned.`);
    setTimeout(() => setNotification(null), 5000);
    loadStudents();
  }

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      s.display_name.toLowerCase().includes(q) ||
      (s.school_id && s.school_id.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.class_name && s.class_name.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <SectionHeader title="Students" subtitle="Every student account across all classrooms in the database." accent={ADMIN_ACCENT} />
        <div className="relative flex items-center max-w-xs w-full">
          <span className="absolute left-3 text-gray-400 pointer-events-none flex items-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-input text-xs w-full !pl-9 !pr-3"
          />
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

      {filtered.length === 0 ? (
        <EmptyState message="No student accounts found." />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((s) => {
            const isAssigned = Boolean(s.class_name && s.class_name !== 'Unassigned');
            const hasTeacher = Boolean(s.teacher_name && s.teacher_name !== 'Faculty');

            return (
              <Card key={s.id || s.school_id || s.username} hoverable className="flex items-center gap-4 flex-wrap rb-fade-in-up">
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
                <div className="flex items-center gap-2">
                  <Badge tone="info">Grade {s.grade_level}</Badge>
                  <Badge tone="neutral">
                    {s.session_count} session{s.session_count === 1 ? '' : 's'}
                  </Badge>
                  {s.latest_phil_iri && (
                    <PhilIRIBadge level={s.latest_phil_iri} showIcon={false} />
                  )}
                  {isAssigned && (
                    <button
                      type="button"
                      onClick={() => handleUnassignStudent(s.id || s.school_id || s.username, s.display_name)}
                      className="px-2 py-1 text-[11px] font-sans font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 cursor-pointer"
                    >
                      Unassign
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(s.id || s.school_id || s.username, s.display_name)}
                    className="px-2 py-1 text-[11px] font-sans font-semibold text-red-600 hover:bg-red-50 rounded cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminStudents;
