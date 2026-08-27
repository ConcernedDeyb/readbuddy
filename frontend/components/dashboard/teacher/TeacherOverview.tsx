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
      <SectionHeader
        title={teacherName ? `Welcome, ${teacherName}` : 'Educator Dashboard'}
        subtitle="Track class reading proficiency, author passages, and manage comprehension tests."
        accent={TEACHER_ACCENT}
      />

      {/* Metric Cards Row */}
      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Enrolled Students" value={studentCount} accent={TEACHER_ACCENT} onClick={() => onNavigate('students')} />
        <StatCard label="Authored Passages" value={passageCount} accent="#1F4D3A" onClick={() => onNavigate('passages')} />
        <StatCard label="Reading Tests" value={testCount} accent="#E8873A" onClick={() => onNavigate('tests')} />
        <StatCard label="Pending Grading" value={pendingGradingCount} accent={pendingGradingCount > 0 ? '#B4602E' : '#2E7D4F'} onClick={() => onNavigate('tests')} />
      </div>

      {/* Quick Actions Bar (Tactile Soft-Neobrutalism) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
        <button
          type="button"
          onClick={() => onNavigate('classes')}
          className="p-4 rounded-xl border-2 bg-[#FFFDF8] flex items-center gap-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(61,107,138,0.2)] cursor-pointer"
          style={{ borderColor: TAN_BORDER }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8F0F8] border border-[#A8C5DA] flex items-center justify-center text-lg shrink-0">
            🏫
          </div>
          <div>
            <span className="text-xs font-bold block text-[#1F4D3A]" style={{ fontFamily: FONT_SANS }}>Manage Sections</span>
            <span className="text-[11px] text-gray-500 font-sans">Class codes & rosters</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('passages')}
          className="p-4 rounded-xl border-2 bg-[#FFFDF8] flex items-center gap-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(31,77,58,0.2)] cursor-pointer"
          style={{ borderColor: TAN_BORDER }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] border border-[#BFE0CC] flex items-center justify-center text-lg shrink-0">
            ✍️
          </div>
          <div>
            <span className="text-xs font-bold block text-[#1F4D3A]" style={{ fontFamily: FONT_SANS }}>Author Passage</span>
            <span className="text-[11px] text-gray-500 font-sans">Create English/Tagalog texts</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tests')}
          className="p-4 rounded-xl border-2 bg-[#FFFDF8] flex items-center gap-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(232,135,58,0.2)] cursor-pointer"
          style={{ borderColor: TAN_BORDER }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#FCEDDE] border border-[#F0C99A] flex items-center justify-center text-lg shrink-0">
            📝
          </div>
          <div>
            <span className="text-xs font-bold block text-[#1F4D3A]" style={{ fontFamily: FONT_SANS }}>Assign Reading Test</span>
            <span className="text-[11px] text-gray-500 font-sans">Phil-IRI diagnostic tests</span>
          </div>
        </button>
      </div>

      {/* Activity Card */}
      <Card>
        <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: TAN_BORDER }}>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
            <span>📊</span>
            <span>Recent Student Reading Activity</span>
          </h2>
          <span className="text-xs font-mono text-gray-500">{students.length} Total Records</span>
        </div>

        {students.length === 0 ? (
          <p className="text-xs text-gray-500 font-sans py-4 text-center">
            No student activity recorded yet. Create a class section and enroll students to track their progress.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {students.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl border mb-2 bg-[#FFFDF8]"
                style={{ borderColor: `${TAN_BORDER}88` }}
              >
                <div>
                  <span className="text-xs font-bold block text-[#1F4D3A]" style={{ fontFamily: FONT_SANS }}>{s.name}</span>
                  <span className="text-[11px] font-mono text-gray-500">{s.sessions_completed} session{s.sessions_completed === 1 ? '' : 's'} completed</span>
                </div>
                {s.latest_level && <PhilIRIBadge level={s.latest_level} />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
export default TeacherOverview;
