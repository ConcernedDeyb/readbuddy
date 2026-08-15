'use client';

import { SectionHeader, StatCard, Card, PhilIRIBadge, FONT_SANS, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN, TAN_BORDER, PhilIRILevel } from '../_shared';

const TEACHER_ACCENT = '#3D6B8A';

interface StudentSummary {
  id: string;
  name: string;
  latest_level?: PhilIRILevel;
  sessions_completed: number;
}

export function TeacherOverview({
  teacherName,
  studentCount,
  passageCount,
  publishedCount,
  testCount,
  pendingGradingCount = 0,
  students = [],
  onNavigate,
}: {
  teacherName?: string;
  studentCount: number;
  passageCount: number;
  publishedCount?: number;
  testCount: number;
  pendingGradingCount?: number;
  students?: StudentSummary[];
  onNavigate: (section: string) => void;
}) {
  return (
    <div>
      <SectionHeader title={teacherName ? `Welcome, ${teacherName}` : 'Teacher Dashboard'} subtitle="Overview of your students' reading progress and assignments." accent={TEACHER_ACCENT} />

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="My Students" value={studentCount} accent={TEACHER_ACCENT} icon="🧒" onClick={() => onNavigate('students')} />
        <StatCard label="Passages" value={passageCount} accent={TEACHER_ACCENT} icon="📖" onClick={() => onNavigate('passages')} />
        <StatCard label="Reading Tests" value={testCount} accent={TEACHER_ACCENT} icon="📋" onClick={() => onNavigate('tests')} />
        <StatCard label="Pending Grading" value={pendingGradingCount} accent={TEACHER_ACCENT} icon="⏳" onClick={() => onNavigate('tests')} />
      </div>

      <Card>
        <h2 className="text-lg mb-3" style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>Recent Student Activity</h2>
        <div className="space-y-2.5 max-h-56 overflow-y-auto">
          {students.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: TAN_BORDER + '66' }}>
              <div>
                <span className="text-xs font-semibold block" style={{ fontFamily: FONT_SANS, color: CHALK_GREEN }}>{s.name}</span>
                <span className="text-[11px]" style={{ fontFamily: FONT_MONO, color: MUTED }}>{s.sessions_completed} session{s.sessions_completed === 1 ? '' : 's'} completed</span>
              </div>
              {s.latest_level && <PhilIRIBadge level={s.latest_level} />}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
export default TeacherOverview;
