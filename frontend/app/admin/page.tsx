'use client';

import { useState, useEffect } from 'react';
import { DashboardShell, AdminOverview, AdminTeachers, AdminStudents, AdminContent, AdminSettings, AccountSettings } from '@/components/dashboard';
import { apiFetch } from '@/lib/api';

type AdminSection = 'overview' | 'teachers' | 'students' | 'content' | 'settings' | 'account';

export default function AdminDashboardPage() {
  const [section, setSection] = useState<AdminSection>('overview');
  const [adminName, setAdminName] = useState('System Admin');
  const [adminEmail, setAdminEmail] = useState('admin@smccnasipit.edu.ph');
  const [adminUsername, setAdminUsername] = useState('admin');

  // Dynamic live lists
  const [teachers, setTeachers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const saved = localStorage.getItem('readbuddy_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.display_name) {
            setAdminName(parsed.display_name);
          }
          if (parsed.username) {
            setAdminUsername(parsed.username);
          }
          if (parsed.email) {
            setAdminEmail(parsed.email);
          } else if (parsed.username) {
            setAdminEmail(`${parsed.username}@smccnasipit.edu.ph`);
          }
        }

        // 1. Load registered teachers from API
        try {
          const tData = await apiFetch('/admin/teachers');
          if (Array.isArray(tData)) {
            const mappedTeachers = tData.map((t) => ({
              id: t.id,
              display_name: t.display_name,
              school_id: t.school_id,
              email: t.email,
              email_verified: false,
              student_count: 0,
              test_count: 0,
              admin_approved: t.is_approved,
              created_at: new Date(t.created_at).toLocaleDateString(),
            }));
            setTeachers(mappedTeachers);
          }
        } catch (e) {
          console.error('Error fetching teachers for dashboard:', e);
        }

        // 2. Load overview stats from API
        try {
          const statsData = await apiFetch('/admin/stats');
          if (statsData) {
            setStats(statsData);
          }
        } catch (e) {
          console.error('Error fetching stats:', e);
        }
      } catch (e) {}
    }

    loadData();
  }, []);

  return (
    <DashboardShell
      role="admin"
      activeSection={section}
      onSectionChange={(s) => setSection(s as AdminSection)}
      userName={adminName}
      onLogout={() => {
        try { localStorage.removeItem('readbuddy_user'); } catch (e) {}
        window.location.href = '/';
      }}
    >
      {section === 'overview' && (
        <AdminOverview
          teacherCount={stats?.teacher_count || 0}
          studentCount={stats?.student_count || 0}
          passageCount={stats?.passage_count || 0}
          testCount={stats?.test_count || 0}
          pendingTeacherCount={stats?.pending_teacher_count || 0}
          vramStatus={stats?.vram_status || { activePhase: 'idle', usedMb: 0, budgetMb: 8192 }}
          recentActivity={stats?.recent_activity || []}
          onNavigate={(s) => setSection(s as AdminSection)}
        />
      )}

      {section === 'teachers' && <AdminTeachers teachers={teachers} />}

      {section === 'students' && <AdminStudents />}

      {section === 'content' && <AdminContent />}

      {section === 'settings' && (
        <AdminSettings
          finetunedAdapterEnabled={true}
          finetunedAdapterBenchmark={{ fleursWer: 0, realAudioWerStock: 0, realAudioWerFinetuned: 0, sampleCount: 0 }}
        />
      )}

      {section === 'account' && (
        <AccountSettings
          profile={{
            displayName: adminName,
            email: adminEmail || 'admin@smccnasipit.edu.ph',
            username: adminUsername || 'admin',
            role: 'admin',
            schoolId: 'SMCC-ADMIN',
          }}
          accent="#7A4A6B"
        />
      )}
    </DashboardShell>
  );
}
