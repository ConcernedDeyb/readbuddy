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
  vramStatus,
  recentActivity,
  onNavigate,
}: {
  teacherCount: number;
  studentCount: number;
  passageCount: number;
  testCount: number;
  vramStatus: VramStatus;
  recentActivity: RecentActivity[];
  onNavigate: (section: string) => void;
}) {
  return (
    <div>
      <SectionHeader title="System Overview" subtitle="ReadBuddy at a glance across every classroom." accent={ADMIN_ACCENT} />

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Teachers" value={teacherCount} accent={ADMIN_ACCENT} icon="🧑‍🏫" onClick={() => onNavigate('teachers')} />
        <StatCard label="Students" value={studentCount} accent={ADMIN_ACCENT} icon="🧒" onClick={() => onNavigate('students')} />
        <StatCard label="Passages" value={passageCount} accent={ADMIN_ACCENT} icon="📖" onClick={() => onNavigate('content')} />
        <StatCard label="Tests" value={testCount} accent={ADMIN_ACCENT} icon="📋" onClick={() => onNavigate('content')} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="shrink-0">
              <ProgressRing
                value={vramStatus.usedMb}
                max={vramStatus.budgetMb}
                size={100}
                strokeWidth={8}
                color={ADMIN_ACCENT}
                label="VRAM"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-2">
                <h2 className="text-lg" style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>
                  VRAM Status
                </h2>
                <span
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  style={{ fontFamily: FONT_MONO, fontWeight: 700, background: '#F3EAF0', color: ADMIN_ACCENT }}
                >
                  <span aria-hidden>{PHASE_ICON[vramStatus.activePhase]}</span>
                  {PHASE_LABEL[vramStatus.activePhase]}
                </span>
              </div>
              <p className="text-xs mb-3" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                Per Rules.md R-5, ASR and LLM models never hold VRAM simultaneously.
              </p>

              <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: TAN_BORDER }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, Math.round((vramStatus.usedMb / vramStatus.budgetMb) * 100))}%`,
                    background: `linear-gradient(90deg, ${ADMIN_ACCENT}, ${ADMIN_ACCENT}BB)`,
                  }}
                />
              </div>

              <div className="flex justify-between text-[11px]" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                <span>{vramStatus.usedMb} MB used</span>
                <span>Budget: {vramStatus.budgetMb} MB (8GB target)</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg mb-3" style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>
            Recent Activity
          </h2>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: TAN_BORDER + '66' }}>
                <div>
                  <span className="text-xs font-semibold block" style={{ fontFamily: FONT_SANS, color: CHALK_GREEN }}>
                    {act.student_name}
                  </span>
                  <span className="text-[11px]" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                    {act.action} by {act.teacher_name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <PhilIRIBadge level={act.phil_iri_level} />
                  <span className="text-[10px] block mt-0.5" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                    {act.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
export default AdminOverview;
