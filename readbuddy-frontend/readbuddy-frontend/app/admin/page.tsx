'use client';

import { useState } from 'react';
import { DashboardShell, AdminOverview, AdminTeachers, AdminStudents, AdminContent, AdminSettings, AccountSettings } from '@/components/dashboard';

// TODO(backend): all mock data below - replace once /admin/* routes exist.
const MOCK_ADMIN_NAME = 'System Admin';
const MOCK_TEACHERS = [
  { id: 't1', display_name: 'Ms. Santos', school_id: 'SMCC-0142', email: 'santos@smcc.edu.ph', email_verified: true, student_count: 4, test_count: 3 },
  { id: 't2', display_name: 'Mr. Cruz', school_id: 'SMCC-0198', email: 'cruz@smcc.edu.ph', email_verified: false, student_count: 0, test_count: 0 },
  { id: 't3', display_name: 'Ms. Reyes', school_id: 'SMCC-0215', email: 'reyes@smcc.edu.ph', email_verified: true, student_count: 3, test_count: 2 },
];
const MOCK_STUDENTS = [
  { id: 's1', display_name: 'Maria', username: 'maria_g', teacher_name: 'Ms. Santos', grade_level: 4, session_count: 6, latest_phil_iri: 'independent' as const },
  { id: 's2', display_name: 'Jun', username: 'jun_r', teacher_name: 'Ms. Santos', grade_level: 3, session_count: 4, latest_phil_iri: 'instructional' as const },
  { id: 's3', display_name: 'Ana', username: 'ana_c', teacher_name: 'Ms. Santos', grade_level: 4, session_count: 2, latest_phil_iri: 'instructional' as const },
  { id: 's4', display_name: 'Carlos', username: 'carlos_m', teacher_name: 'Ms. Santos', grade_level: 5, session_count: 3, latest_phil_iri: 'frustration' as const },
  { id: 's5', display_name: 'Lea', username: 'lea_t', teacher_name: 'Ms. Reyes', grade_level: 2, session_count: 1 },
];
const MOCK_CONTENT = [
  {
    id: 'p1',
    confirmed_text: 'The sun was setting over the quiet village...',
    owner_label: 'Teacher: Ms. Santos',
    is_published: true,
    source_language: 'en' as const,
  },
  {
    id: 'p2',
    confirmed_text: 'Si Ana ay may alagang pusa...',
    owner_label: 'Student: Maria',
    is_published: null,
    source_language: 'tl' as const,
  },
];
const MOCK_RECENT_ACTIVITY = [
  { id: 'a1', student_name: 'Maria', teacher_name: 'Ms. Santos', phil_iri_level: 'independent' as const, date: '2026-08-08', action: 'Completed test' },
  { id: 'a2', student_name: 'Jun', teacher_name: 'Ms. Santos', phil_iri_level: 'instructional' as const, date: '2026-08-07', action: 'Completed test' },
  { id: 'a3', student_name: 'Carlos', teacher_name: 'Ms. Santos', phil_iri_level: 'frustration' as const, date: '2026-08-06', action: 'Completed session' },
  { id: 'a4', student_name: 'Lea', teacher_name: 'Ms. Reyes', phil_iri_level: 'instructional' as const, date: '2026-08-05', action: 'Completed session' },
];
// Real numbers from the actual FLEURS/real-audio benchmarking work done earlier -
// see architecture.md §2a and Rules.md R-3's note on the fine-tuned tgl adapter.
const MOCK_ADAPTER_BENCHMARK = {
  fleursWer: 0.1244,
  realAudioWerStock: 0.1507,
  realAudioWerFinetuned: 0.1471,
  sampleCount: 8,
};
const MOCK_VRAM_STATUS = { activePhase: 'idle' as const, usedMb: 1400, budgetMb: 8192 };
const MOCK_ADMIN_PROFILE = {
  displayName: 'System Admin',
  email: 'admin@smcc.edu.ph',
  username: 'admin',
  role: 'admin' as const,
  schoolId: 'SMCC-ADMIN',
};

type AdminSection = 'overview' | 'teachers' | 'students' | 'content' | 'settings' | 'account';

export default function AdminDashboardPage() {
  const [section, setSection] = useState<AdminSection>('overview');

  return (
    <DashboardShell
      role="admin"
      activeSection={section}
      onSectionChange={(s) => setSection(s as AdminSection)}
      userName={MOCK_ADMIN_NAME}
      onLogout={() => {
        window.location.href = '/';
      }}
    >
      {section === 'overview' && (
        <AdminOverview
          teacherCount={MOCK_TEACHERS.length}
          studentCount={MOCK_STUDENTS.length}
          passageCount={MOCK_CONTENT.length}
          testCount={5}
          vramStatus={MOCK_VRAM_STATUS}
          recentActivity={MOCK_RECENT_ACTIVITY}
          onNavigate={(s) => setSection(s as AdminSection)}
        />
      )}

      {section === 'teachers' && <AdminTeachers teachers={MOCK_TEACHERS} />}

      {section === 'students' && <AdminStudents students={MOCK_STUDENTS} />}

      {section === 'content' && (
        <AdminContent
          passages={MOCK_CONTENT}
          onUnpublish={(id) => {
            // TODO(backend): PATCH /admin/passages/{id} { is_published: false }
            console.log('unpublish', id);
          }}
        />
      )}

      {section === 'settings' && (
        <AdminSettings
          finetunedAdapterEnabled={false}
          finetunedAdapterBenchmark={MOCK_ADAPTER_BENCHMARK}
        />
      )}

      {section === 'account' && (
        <AccountSettings profile={MOCK_ADMIN_PROFILE} accent="#7A4A6B" />
      )}
    </DashboardShell>
  );
}
