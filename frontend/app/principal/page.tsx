'use client';

import { useState, useEffect } from 'react';
import {
  DashboardShell,
  AdminOverview,
  AdminTeachers,
  AdminStudents,
  AdminAuthLogsSSO,
  AccountSettings,
  NotificationsSection,
} from '@/components/dashboard';
import { DashboardSkeleton } from '@/components/shared/SkeletonLoaders';
import { initializeRealisticSystemData } from '@/utils/seedData';
import { AdminSectionManager } from '@/components/dashboard/admin/AdminSectionManager';
import { ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

const PRINCIPAL_ACCENT = '#4A3D6B';

type PrincipalSection = 'overview' | 'sections' | 'teachers' | 'students' | 'logs' | 'notifications' | 'account';

export default function PrincipalDashboardPage() {
  const [section, setSection] = useState<PrincipalSection>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [principalName, setPrincipalName] = useState('Dr. Maria Elena Santos');
  const [principalEmail, setPrincipalEmail] = useState('principal@smccnasipit.edu.ph');
  const [principalUsername, setPrincipalUsername] = useState('readbuddyprincipal');
  const [principalSchoolId, setPrincipalSchoolId] = useState('SMCC-PRIN-001');

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
          if (parsed.display_name) setPrincipalName(parsed.display_name);
          if (parsed.username) setPrincipalUsername(parsed.username);
          if (parsed.email) setPrincipalEmail(parsed.email);
          if (parsed.school_id) setPrincipalSchoolId(parsed.school_id);
        }

        // 1. Load registered teachers from accounts map
        const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
        const allAccounts = Object.values(accountsMap) as any[];

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

        // 2. Load registered students
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
                teacher_name:
                  acc.teacher_name && acc.teacher_name !== 'Faculty'
                    ? acc.teacher_name
                    : acc.section_name
                    ? `Section ${acc.section_name}`
                    : 'SMCC Basic Ed',
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
                teacher_name:
                  ts.teacher_name && ts.teacher_name !== 'Faculty'
                    ? ts.teacher_name
                    : ts.class_name
                    ? `Section ${ts.class_name}`
                    : 'SMCC Basic Ed',
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
      role="principal"
      activeSection={section}
      onSectionChange={(s) => setSection(s as PrincipalSection)}
      userName={principalName}
      userId={principalSchoolId || principalUsername}
      onLogout={() => {
        try {
          localStorage.removeItem('readbuddy_user');
        } catch (e) {}
        window.location.href = '/';
      }}
    >
      {/* ─── Principal Institutional Authority Notice ─── */}
      <div className="mb-6 p-4 rounded-2xl bg-[#F6F2FC] border border-[#D5C7EA] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#4A3D6B] text-white flex items-center justify-center font-serif font-bold text-sm shrink-0 shadow-xs">
            SMCC
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#4A3D6B] font-serif">
              Office of the School Principal &bull; Saint Michael College of Caraga
            </h3>
            <p className="text-xs text-gray-600 font-sans">
              Executive faculty governance, student reading progress oversight, and institutional credentials administration.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-white border border-[#D5C7EA] text-[#4A3D6B]">
            {teachers.length} Faculty Members ({teachers.filter((t) => t.admin_approved).length} Active)
          </span>
        </div>
      </div>

      {/* ─── Executive Overview ─── */}
      {section === 'overview' &&
        (isLoading ? (
          <DashboardSkeleton role="admin" />
        ) : (
          <AdminOverview
            role="principal"
            teacherCount={teachers.length}
            studentCount={students.length}
            passageCount={passages.length}
            testCount={passages.filter((p) => p.is_published).length}
            pendingTeacherCount={pendingTeacherCount}
            recentActivity={recentActivity}
            onNavigate={(s) => setSection(s as PrincipalSection)}
          />
        ))}

      {/* ─── Official School Sections Catalog (Principal Governance) ─── */}
      {section === 'sections' && (
        <AdminSectionManager accent={PRINCIPAL_ACCENT} roleTitle="School Principal" />
      )}

      {/* ─── Faculty Management & Affiliation ─── */}
      {section === 'teachers' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-sans flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Faculty Affiliation Governance:</strong> If a teacher is no longer affiliated with SMCC, you can <strong>Revoke Access</strong> to immediately suspend their login permissions, or <strong>Delete</strong> the account permanently.
            </span>
          </div>
          <AdminTeachers teachers={teachers} />
        </div>
      )}

      {/* ─── Student Reading Progress Oversight ─── */}
      {section === 'students' && <AdminStudents students={students} />}

      {/* ─── School Activity & Audit Logs ─── */}
      {section === 'logs' && <AdminAuthLogsSSO hideSsoConfig={true} />}

      {/* ─── Principal Notification Center ─── */}
      {section === 'notifications' && (
        <div className="rb-fade-in-up">
          <NotificationsSection
            role="principal"
            onNavigate={(s) => setSection(s as PrincipalSection)}
            userId={principalSchoolId || principalUsername}
          />
        </div>
      )}

      {/* ─── Principal Account Settings ─── */}
      {section === 'account' && (
        <AccountSettings
          profile={{
            displayName: principalName,
            email: principalEmail || 'principal@smccnasipit.edu.ph',
            username: principalUsername || 'readbuddyprincipal',
            role: 'principal',
            schoolId: principalSchoolId || 'SMCC-PRIN-001',
            phoneNumber:
              (typeof window !== 'undefined'
                ? JSON.parse(localStorage.getItem('readbuddy_user') || '{}').phone_number
                : '') || '',
            isPhoneVerified:
              (typeof window !== 'undefined'
                ? JSON.parse(localStorage.getItem('readbuddy_user') || '{}').phone_verified
                : false) || false,
            twoFactorEnabled:
              (typeof window !== 'undefined'
                ? JSON.parse(localStorage.getItem('readbuddy_user') || '{}').two_factor_enabled
                : false) || false,
            avatarUrl:
              (typeof window !== 'undefined'
                ? JSON.parse(localStorage.getItem('readbuddy_user') || '{}').avatar_url
                : '') || '',
          }}
          accent={PRINCIPAL_ACCENT}
          onProfileUpdate={(updated) => {
            setPrincipalName(updated.displayName);
            setPrincipalEmail(updated.email);
          }}
        />
      )}
    </DashboardShell>
  );
}
