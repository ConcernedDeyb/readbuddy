'use client';

import { useState, useEffect } from 'react';
import { DashboardShell, AdminOverview, AdminTeachers, AdminStudents, AdminContent, AdminAuthLogsSSO, AdminSettings, AccountSettings } from '@/components/dashboard';
import { DashboardSkeleton } from '@/components/shared/SkeletonLoaders';
import { initializeRealisticSystemData } from '@/utils/seedData';

const MOCK_ADAPTER_BENCHMARK = {
  fleursWer: 0.1244,
  realAudioWerStock: 0.1507,
  realAudioWerFinetuned: 0.1471,
  sampleCount: 8,
};

const MOCK_VRAM_STATUS = { activePhase: 'idle' as const, usedMb: 1400, budgetMb: 8192 };

type AdminSection = 'overview' | 'teachers' | 'students' | 'content' | 'logs' | 'settings' | 'account';

export default function AdminDashboardPage() {
  const [section, setSection] = useState<AdminSection>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [adminName, setAdminName] = useState('System Admin');
  const [adminEmail, setAdminEmail] = useState('admin@smccnasipit.edu.ph');
  const [adminUsername, setAdminUsername] = useState('readbuddyadmin');

  // Dynamic live lists
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [passages, setPassages] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    function loadData() {
      try {
        initializeRealisticSystemData();
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

        // 1. Load registered teachers from accounts map
        const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
        const allAccounts = Object.values(accountsMap) as any[];

        // Filter unique teachers
        const uniqueTeacherMap = new Map<string, any>();

        allAccounts
          .filter((acc) => acc.role === 'teacher')
          .forEach((acc, idx) => {
            const key = (acc.school_id || acc.email || acc.username || `t-${idx}`).toLowerCase();
            if (!uniqueTeacherMap.has(key)) {
              uniqueTeacherMap.set(key, {
                id: `t-${idx + 1}`,
                display_name: acc.display_name,
                school_id: acc.school_id || acc.username || '',
                email: acc.email || `${acc.username}@smccnasipit.edu.ph`,
                email_verified: Boolean(acc.email_verified),
                student_count: Number(acc.student_count) || 0,
                test_count: Number(acc.test_count) || 0,
                admin_approved: Boolean(acc.admin_approved),
                created_at: acc.created_at || 'Recently',
              });
            }
          });

        const teacherList = Array.from(uniqueTeacherMap.values());
        setTeachers(teacherList);

        // 2. Load registered students from accounts map & teacher roster
        const deletedIds = new Set(
          (JSON.parse(localStorage.getItem('readbuddy_deleted_student_ids') || '[]') as string[]).map((x) =>
            x.toLowerCase().trim()
          )
        );

        const uniqueStudentMap = new Map<string, any>();
        allAccounts
          .filter((acc: any) => {
            if (acc.role !== 'student') return false;
            const sid = (acc.school_id || '').toLowerCase();
            const un = (acc.username || '').toLowerCase();
            const dn = (acc.display_name || '').toLowerCase();
            return !deletedIds.has(sid) && !deletedIds.has(un) && !deletedIds.has(dn);
          })
          .forEach((acc: any, idx: number) => {
            const key = (acc.school_id || acc.username || acc.display_name).toLowerCase();
            if (key && !deletedIds.has(key) && !uniqueStudentMap.has(key)) {
              uniqueStudentMap.set(key, {
                id: `std-${idx + 1}`,
                display_name: acc.display_name,
                username: acc.username,
                school_id: acc.school_id || acc.username,
                class_name: acc.section_name || acc.class_name,
                teacher_name: acc.teacher_name && acc.teacher_name !== 'Faculty' ? acc.teacher_name : (acc.section_name ? `Section ${acc.section_name}` : 'SMCC Basic Ed'),
                grade_level: Number(acc.grade_level) || 7,
                session_count: 0,
              });
            }
          });

        const teacherRoster = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
        teacherRoster
          .filter((ts: any) => {
            const sid = (ts.school_id || '').toLowerCase();
            const un = (ts.username || '').toLowerCase();
            const dn = (ts.display_name || '').toLowerCase();
            return !deletedIds.has(ts.id) && !deletedIds.has(sid) && !deletedIds.has(un) && !deletedIds.has(dn);
          })
          .forEach((ts: any) => {
            const key = (ts.school_id || ts.username || ts.display_name).toLowerCase();
            if (key && !deletedIds.has(key) && !uniqueStudentMap.has(key)) {
              uniqueStudentMap.set(key, {
                id: ts.id,
                display_name: ts.display_name,
                username: ts.username,
                school_id: ts.school_id || ts.username,
                class_name: ts.class_name || ts.section_name,
                teacher_name: ts.teacher_name && ts.teacher_name !== 'Faculty' ? ts.teacher_name : (ts.class_name ? `Section ${ts.class_name}` : 'SMCC Basic Ed'),
                grade_level: Number(ts.grade_level) || 7,
                session_count: 0,
              });
            }
          });
        setStudents(Array.from(uniqueStudentMap.values()));

        // 3. Load passages
        const savedPassages = JSON.parse(localStorage.getItem('readbuddy_teacher_passages') || '[]');
        setPassages(savedPassages);

        // 4. Load recent session activities
        const studentSessions = JSON.parse(localStorage.getItem('readbuddy_student_sessions') || '[]');
        const activityList = studentSessions.slice(0, 5).map((ses: any, i: number) => ({
          id: `act-${i + 1}`,
          student_name: ses.student_name || 'Student',
          teacher_name: ses.teacher_name || 'Teacher',
          phil_iri_level: ses.phil_iri_level,
          date: ses.date,
          action: 'Completed session',
        }));
        setRecentActivity(activityList);
      } catch (e) {} finally {
        setTimeout(() => setIsLoading(false), 200);
      }
    }

    loadData();
    window.addEventListener('readbuddy_user_updated', loadData);
    window.addEventListener('readbuddy_passages_updated', loadData);
    window.addEventListener('readbuddy_tests_updated', loadData);
    window.addEventListener('readbuddy_accounts_updated', loadData);
    window.addEventListener('readbuddy_students_updated', loadData);
    window.addEventListener('readbuddy_student_sessions_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('readbuddy_user_updated', loadData);
      window.removeEventListener('readbuddy_passages_updated', loadData);
      window.removeEventListener('readbuddy_tests_updated', loadData);
      window.removeEventListener('readbuddy_accounts_updated', loadData);
      window.removeEventListener('readbuddy_students_updated', loadData);
      window.removeEventListener('readbuddy_student_sessions_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const pendingTeacherCount = teachers.filter((t) => !t.admin_approved).length;

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
        isLoading ? (
          <DashboardSkeleton role="admin" />
        ) : (
          <AdminOverview
            teacherCount={teachers.length}
            studentCount={students.length}
            passageCount={passages.length}
            testCount={passages.filter((p) => p.is_published).length}
            pendingTeacherCount={pendingTeacherCount}
            vramStatus={MOCK_VRAM_STATUS}
            recentActivity={recentActivity}
            onNavigate={(s) => setSection(s as AdminSection)}
          />
        )
      )}

      {section === 'teachers' && <AdminTeachers teachers={teachers} />}

      {section === 'students' && <AdminStudents students={students} />}

      {section === 'content' && (
        <AdminContent
          passages={passages}
          onUnpublish={() => {
            const saved = JSON.parse(localStorage.getItem('readbuddy_teacher_passages') || '[]');
            setPassages(saved);
          }}
        />
      )}

      {section === 'logs' && <AdminAuthLogsSSO />}

      {section === 'settings' && (
        <AdminSettings
          finetunedAdapterEnabled={true}
          finetunedAdapterBenchmark={MOCK_ADAPTER_BENCHMARK}
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
