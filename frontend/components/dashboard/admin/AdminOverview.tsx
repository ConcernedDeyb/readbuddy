'use client';

import { SectionHeader, StatCard, Card, ProgressRing, PhilIRIBadge, FONT_SANS, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN, TAN_BORDER, PhilIRILevel } from '../_shared';

const ADMIN_ACCENT = '#7A4A6B';

interface VramStatus {
  activePhase: 'idle' | 'asr' | 'llm';
  usedMb: number;
  budgetMb: number;
}

interface RecentActivity {
  id: string;
  student_name: string;
  teacher_name: string;
  phil_iri_level: PhilIRILevel;
  date: string;
  action: string;
}

const PHASE_LABEL: Record<VramStatus['activePhase'], string> = {
  idle: 'Idle',
  asr: 'ASR (reading phase)',
  llm: 'LLM (comprehension phase)',
};

const PHASE_ICON: Record<VramStatus['activePhase'], string> = {
  idle: '💤',
  asr: '🎙️',
  llm: '🧠',
};

export function AdminOverview({
  teacherCount,
  studentCount,
  passageCount,
  testCount,
  pendingTeacherCount = 0,
  vramStatus,
  recentActivity,
  onNavigate,
}: {
  teacherCount: number;
  studentCount: number;
  passageCount: number;
  testCount: number;
  pendingTeacherCount?: number;
  vramStatus: VramStatus;
  recentActivity: RecentActivity[];
  onNavigate: (section: string) => void;
}) {
  return (
    <div>
      <SectionHeader title="System Overview" subtitle="ReadBuddy at a glance across every classroom." accent={ADMIN_ACCENT} />

      {pendingTeacherCount > 0 && (
        <div
          onClick={() => onNavigate('teachers')}
          className="mb-6 p-4 rounded-2xl border border-[#F0C99A] bg-[#FFF8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#FFF3E6] transition-all rb-fade-in-up"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <div className="text-sm font-bold text-[#B4602E] font-sans">
                {pendingTeacherCount} Teacher Account Creation Request{pendingTeacherCount === 1 ? '' : 's'} Pending Approval
              </div>
              <p className="text-xs text-[#8A5A1E] font-sans">
                Institutional educator registrations require verification before access is granted.
              </p>
            </div>
          </div>
          <button
            className="px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold text-white shrink-0 self-start sm:self-auto cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #B4602E, #8A5A1E)' }}
          >
            Review & Approve →
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Teachers" value={teacherCount} accent={ADMIN_ACCENT} icon="🧑‍🏫" onClick={() => onNavigate('teachers')} />
        <StatCard label="Students" value={studentCount} accent={ADMIN_ACCENT} icon="🧒" onClick={() => onNavigate('students')} />
        <StatCard label="Passages" value={passageCount} accent={ADMIN_ACCENT} icon="📖" onClick={() => onNavigate('content')} />
        <StatCard label="Tests" value={testCount} accent={ADMIN_ACCENT} icon="📋" onClick={() => onNavigate('content')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VRAM / Model State Card */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
              GPU Memory Budget
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full font-mono font-medium border" style={{ background: '#FAF7F2', borderColor: TAN_BORDER, color: MUTED }}>
              RTX 4070 · 8GB
            </span>
          </div>

          <div className="flex items-center gap-6 my-2">
            <ProgressRing
              value={Math.round((vramStatus.usedMb / vramStatus.budgetMb) * 100)}
              size={88}
              strokeWidth={8}
              color={ADMIN_ACCENT}
            />
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold" style={{ fontFamily: FONT_MONO, color: CHALK_GREEN }}>
                {(vramStatus.usedMb / 1024).toFixed(1)} GB
              </div>
              <div className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                of {(vramStatus.budgetMb / 1024).toFixed(0)} GB VRAM used
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium mt-1" style={{ color: CHALK_GREEN }}>
                <span>{PHASE_ICON[vramStatus.activePhase]}</span>
                <span>{PHASE_LABEL[vramStatus.activePhase]}</span>
              </div>
            </div>
          </div>

          <div className="text-xs pt-3 border-t flex items-center justify-between" style={{ borderColor: TAN_BORDER, color: MUTED, fontFamily: FONT_SANS }}>
            <span>Tagalog ASR Model: MMS-1B-All (FLEURS Fine-tuned)</span>
            <span className="font-mono text-[11px] text-[#2E7D4F] font-bold">Active</span>
          </div>
        </Card>

        {/* Recent Session Activity */}
        <Card className="flex flex-col gap-3">
          <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
            Recent Activity
          </h3>

          {recentActivity.length === 0 ? (
            <div className="text-xs py-8 text-center" style={{ fontFamily: FONT_SANS, color: MUTED }}>
              No reading sessions or assessment activity recorded yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentActivity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2 border-b last:border-0 text-xs"
                  style={{ borderColor: TAN_BORDER }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold" style={{ fontFamily: FONT_SANS, color: CHALK_GREEN }}>
                      {a.student_name} ({a.action})
                    </span>
                    <span style={{ fontFamily: FONT_MONO, color: MUTED, fontSize: '10px' }}>
                      Teacher: {a.teacher_name} · {a.date}
                    </span>
                  </div>
                  <PhilIRIBadge level={a.phil_iri_level} showIcon={false} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
export default AdminOverview;
