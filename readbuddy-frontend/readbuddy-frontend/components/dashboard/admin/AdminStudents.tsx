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
  teacher_name: string;
  grade_level: number;
  session_count: number;
  latest_phil_iri?: PhilIRILevel;
}

export function AdminStudents({ students: initialStudents = [] }: { students?: Student[] }) {
  const [students, setStudents] = useState<Student[]>(initialStudents);

  useEffect(() => {
    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const allAccounts = Object.values(accountsMap) as any[];
      const registeredStudents = allAccounts
        .filter((acc) => acc.role === 'student')
        .map((acc, idx) => ({
          id: `std-reg-${idx + 1}`,
          display_name: acc.display_name,
          username: acc.username,
          teacher_name: 'Faculty',
          grade_level: acc.grade_level || 4,
          session_count: 0,
        }));

      const teacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
      const teacherStudentList = teacherStudents.map((s: any) => ({
        id: s.id,
        display_name: s.display_name,
        username: s.username,
        teacher_name: 'Faculty',
        grade_level: s.grade_level || 4,
        session_count: 0,
      }));

      const combined: Student[] = [];
      [...registeredStudents, ...teacherStudentList].forEach((st) => {
        if (!combined.some((s) => s.username === st.username || s.display_name === st.display_name)) {
          combined.push(st);
        }
      });

      setStudents(combined);
    } catch (e) {}
  }, [initialStudents]);

  return (
    <div>
      <SectionHeader title="Students" subtitle="Every student account across all classrooms." accent={ADMIN_ACCENT} />

      {students.length === 0 ? (
        <EmptyState message="No student accounts registered yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {students.map((s) => (
            <Card key={s.id} hoverable className="flex items-center gap-4 flex-wrap rb-fade-in-up">
              <Avatar name={s.display_name} accent={gradeColor(s.grade_level)} />
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>
                  {s.display_name}
                </div>
                <div className="text-xs mt-0.5 truncate" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                  @{s.username} · Teacher: {s.teacher_name}
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
export default AdminStudents;
