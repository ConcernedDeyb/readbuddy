'use client';

import { SectionHeader, StatCard, Card, ProgressRing, PhilIRIBadge, FONT_SANS, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN, TAN_BORDER, PhilIRILevel } from '../_shared';
import { AlertTriangle, UserPlus, ShieldCheck, Settings, Cpu, History, BookOpen, Award } from 'lucide-react';

const ADMIN_ACCENT = '#7A4A6B';
const PRINCIPAL_ACCENT = '#4A3D6B';

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
  idle: 'Idle (Awaiting Student Audio)',
  asr: 'Active: ASR (Wav2Vec2 / MMS)',
  llm: 'Active: LLM (Gemma Comprehension)',
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
  role = 'admin',
}: {
  teacherCount: number;
  studentCount: number;
  passageCount: number;
  testCount: number;
  pendingTeacherCount?: number;
  vramStatus?: VramStatus;
  recentActivity: RecentActivity[];
  onNavigate: (section: string) => void;
  role?: 'admin' | 'principal';
}) {
  // Derive school-wide reading health for Principal
  const indCount = recentActivity.filter((a) => a.phil_iri_level === 'independent').length;
  const instCount = recentActivity.filter((a) => a.phil_iri_level === 'instructional').length;
  const frustCount = recentActivity.filter((a) => a.phil_iri_level === 'frustration').length;
  const totalAssessed = indCount + instCount + frustCount || (recentActivity.length > 0 ? recentActivity.length : 1);
  const masteryPct = Math.round(((indCount + instCount) / totalAssessed) * 100);

  return (
    <div>
      <SectionHeader
        title={role === 'principal' ? "Executive Reading Overview" : "Institutional System Overview"}
        subtitle={
          role === 'principal'
            ? "Saint Michael College of Caraga (SMCC) Basic Education Reading Comprehension Oversight."
            : "Saint Michael College of Caraga (SMCC) ReadBuddy Administrative Telemetry."
        }
        accent={role === 'principal' ? PRINCIPAL_ACCENT : ADMIN_ACCENT}
      />

      {pendingTeacherCount > 0 && (
        <div
          onClick={() => onNavigate('teachers')}
          className="mb-6 p-4 rounded-2xl border-2 border-[#E8873A] bg-[#FFF8F0] shadow-[4px_4px_0px_rgba(232,135,58,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:-translate-y-0.5 transition-all rb-fade-in-up"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FCEDDE] border border-[#F0C99A] text-[#B4602E] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#B4602E]" strokeWidth={2.25} />
            </div>
            <div>
              <div className="text-sm font-bold text-[#B4602E] font-sans">
                {pendingTeacherCount} Teacher Registration Request{pendingTeacherCount === 1 ? '' : 's'} Pending Approval
              </div>
              <p className="text-xs text-[#8A5A1E] font-sans">
                Educator registrations must be authorized before access to classroom rosters is granted.
              </p>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-xl text-xs font-sans font-bold text-white shrink-0 self-start sm:self-auto cursor-pointer border-2 border-[#8A5A1E] shadow-[2px_2px_0px_#8A5A1E]"
            style={{ background: 'linear-gradient(135deg, #B4602E, #8A5A1E)' }}
          >
            Review & Approve →
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Active Educators" value={teacherCount} accent={role === 'principal' ? PRINCIPAL_ACCENT : ADMIN_ACCENT} onClick={() => onNavigate('teachers')} />
        <StatCard label="Enrolled Students" value={studentCount} accent="#1F4D3A" onClick={() => onNavigate('students')} />
        <StatCard label="Published Passages" value={passageCount} accent="#3D6B8A" onClick={() => onNavigate(role === 'principal' ? 'students' : 'content')} />
        <StatCard label="Active Tests" value={testCount} accent="#E8873A" onClick={() => onNavigate(role === 'principal' ? 'students' : 'content')} />
      </div>

      {/* Quick Actions Panel (Tactile Soft-Neobrutalism) */}
      <div id="tour-admin-fast-actions" className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-[#FFFDF8] border-2 border-[#DED2B4] shadow-[3px_3px_0px_rgba(31,77,58,0.08)] flex-wrap">
        <span className="text-xs font-bold font-serif text-[#1F4D3A] mr-1">
          {role === 'principal' ? 'Executive Actions:' : 'Admin Fast Actions:'}
        </span>
        <button
          onClick={() => onNavigate('teachers')}
          className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold bg-[#FFFDF8] border-2 border-[#DED2B4] text-[#2B2621] shadow-[2px_2px_0px_#DED2B4] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5 text-[#2B2621]" strokeWidth={2.25} />
          <span>Add Teacher</span>
        </button>
        <button
          onClick={() => onNavigate('students')}
          className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold bg-[#FFFDF8] border-2 border-[#DED2B4] text-[#2B2621] shadow-[2px_2px_0px_#DED2B4] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5 text-[#2B2621]" strokeWidth={2.25} />
          <span>Add Student</span>
        </button>
        <button
          onClick={() => onNavigate('logs')}
          className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold bg-[#FFFDF8] border-2 border-[#DED2B4] text-[#2B2621] shadow-[2px_2px_0px_#DED2B4] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#2B2621]" strokeWidth={2.25} />
          <span>School Activity Logs</span>
        </button>
        {role === 'principal' ? (
          <button
            onClick={() => onNavigate('students')}
            className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold bg-[#FFFDF8] border-2 border-[#DED2B4] text-[#2B2621] shadow-[2px_2px_0px_#DED2B4] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#4A3D6B]" strokeWidth={2.25} />
            <span>Student Reading Progress</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('settings')}
            className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold bg-[#FFFDF8] border-2 border-[#DED2B4] text-[#2B2621] shadow-[2px_2px_0px_#DED2B4] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-[#2B2621]" strokeWidth={2.25} />
            <span>System Settings</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: GPU VRAM Telemetry (Admin Only) OR School Literacy & Phil-IRI Overview (Principal) */}
        {role === 'principal' ? (
          <div id="tour-principal-phil-iri">
            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: TAN_BORDER }}>
                <h3 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: FONT_SERIF, color: PRINCIPAL_ACCENT }}>
                  <BookOpen className="w-4 h-4 text-[#4A3D6B]" strokeWidth={2.25} />
                  <span>School Reading & Phil-IRI Overview</span>
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold border border-[#D5C7EA] bg-[#F6F2FC] text-[#4A3D6B]">
                  SMCC Basic Education
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 my-2">
                <ProgressRing
                  value={masteryPct}
                  max={100}
                  size={88}
                  strokeWidth={8}
                  color={PRINCIPAL_ACCENT}
                />
                <div className="flex flex-col gap-1">
                  <div className="text-2xl font-bold font-mono text-[#1F4D3A]">
                    {masteryPct}%
                  </div>
                  <div className="text-xs font-semibold text-gray-500 font-sans">
                    Independent & Instructional Mastery
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold mt-1 text-[#2E7D4F]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D4F]" />
                    <span>Phil-IRI Assessment Active</span>
                  </div>
                </div>
              </div>

              {/* Tier Distribution Pills */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2 rounded-xl bg-[#E6F4EA] border border-[#BFE0CC] text-center">
                  <div className="text-[10px] uppercase font-bold text-[#2E7D4F] font-mono">Independent</div>
                  <div className="text-sm font-bold font-mono text-[#1F4D3A]">{indCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-[#EBF3F8] border border-[#A8C5DA] text-center">
                  <div className="text-[10px] uppercase font-bold text-[#3D6B8A] font-mono">Instructional</div>
                  <div className="text-sm font-bold font-mono text-[#2B4C63]">{instCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-center">
                  <div className="text-[10px] uppercase font-bold text-[#B4602E] font-mono">Intervention</div>
                  <div className="text-sm font-bold font-mono text-[#8A451A]">{frustCount}</div>
                </div>
              </div>

              <div className="text-xs pt-3 border-t flex flex-wrap items-center justify-between gap-2 font-sans" style={{ borderColor: TAN_BORDER, color: MUTED }}>
                <span>Official DepEd Phil-IRI Framework</span>
                <span className="font-mono text-[11px] text-[#4A3D6B] font-bold">Standard Met</span>
              </div>
            </Card>
          </div>
        ) : (
          /* VRAM / Model State Card (Admin Only) */
          vramStatus && (
            <div id="tour-admin-vram">
              <Card className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: TAN_BORDER }}>
                  <h3 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
                    <Cpu className="w-4 h-4 text-emerald-700" strokeWidth={2.25} />
                    <span>GPU VRAM Telemetry</span>
                  </h3>
                  <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold border border-[#DED2B4] bg-[#FFFDF8] text-gray-600">
                    RTX 2070 · 8GB GDDR6
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 my-2">
                  <ProgressRing
                    value={Math.round((vramStatus.usedMb / vramStatus.budgetMb) * 100)}
                    max={100}
                    size={88}
                    strokeWidth={8}
                    color={ADMIN_ACCENT}
                  />
                  <div className="flex flex-col gap-1">
                    <div className="text-2xl font-bold font-mono text-[#1F4D3A]">
                      {(vramStatus.usedMb / 1024).toFixed(1)} GB
                    </div>
                    <div className="text-xs font-semibold text-gray-500 font-sans">
                      of {(vramStatus.budgetMb / 1024).toFixed(0)} GB VRAM Allocated
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold mt-1 text-[#2E7D4F]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D4F] animate-pulse" />
                      <span>{PHASE_LABEL[vramStatus.activePhase]}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs pt-3 border-t flex flex-wrap items-center justify-between gap-2 font-sans" style={{ borderColor: TAN_BORDER, color: MUTED }}>
                  <span>Dual-Pipeline Model Cache (Wav2Vec2 + Gemma 2B)</span>
                  <span className="font-mono text-[11px] text-[#2E7D4F] font-bold">Optimal</span>
                </div>
              </Card>
            </div>
          )
        )}

        {/* Activity Card */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: TAN_BORDER }}>
            <h3 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
              <History className="w-4 h-4 text-[#1F4D3A]" strokeWidth={2.25} />
              <span>Platform Activity Stream</span>
            </h3>
            <span className="text-xs font-mono text-gray-500">{recentActivity.length} Events</span>
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-xs text-gray-500 font-sans py-4 text-center">
              No recent activity recorded yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border bg-[#FFFDF8]"
                  style={{ borderColor: `${TAN_BORDER}88` }}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold block text-[#1F4D3A] truncate">{act.student_name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{act.action} · {act.date}</span>
                  </div>
                  <PhilIRIBadge level={act.phil_iri_level} />
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
