'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, Badge, EmptyState, Avatar, PhilIRIBadge, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN, PhilIRILevel } from '../_shared';
import { apiFetch } from '@/lib/api';

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
  is_archived?: boolean;
  latest_phil_iri?: PhilIRILevel;
}

export function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadStudents() {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/students');
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch (e) {
      console.error('Failed to load students', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function handleToggleArchive(student: Student) {
    if (!window.confirm(`Are you sure you want to ${student.is_archived ? 'restore' : 'archive'} this student?`)) return;
    try {
      await apiFetch(`/admin/students/${student.id}/${student.is_archived ? 'restore' : 'archive'}`, {
        method: 'PATCH',
      });
      loadStudents();
    } catch (e) {
      alert(`Failed to update student: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  return (
    <div>
      <SectionHeader title="Students" subtitle="Manage all student accounts across all classrooms." accent={ADMIN_ACCENT} />

      {loading ? (
        <div style={{ color: MUTED, fontFamily: FONT_MONO, textAlign: 'center', padding: '2rem' }}>
          Loading students...
        </div>
      ) : students.length === 0 ? (
        <EmptyState message="No student accounts registered yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {students.map((s) => (
            <Card key={s.id} hoverable className={`flex items-center gap-4 flex-wrap rb-fade-in-up ${s.is_archived ? 'opacity-50 grayscale' : ''}`}>
              <Avatar name={s.display_name} accent={gradeColor(s.grade_level)} />
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>
                  {s.display_name}
                  {s.is_archived && <span className="ml-2 text-xs font-normal" style={{ color: MUTED }}>(Archived)</span>}
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
                <button
                  onClick={() => handleToggleArchive(s)}
                  className="px-3 py-1.5 ml-4 rounded-md text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: s.is_archived ? 'transparent' : 'rgba(239,68,68,0.1)',
                    color: s.is_archived ? MUTED : '#EF4444',
                    border: `1px solid ${s.is_archived ? MUTED : '#EF4444'}`,
                  }}
                >
                  {s.is_archived ? 'Restore' : 'Archive'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
export default AdminStudents;
