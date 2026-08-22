'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, Badge, EmptyState, Avatar, FONT_MONO, FONT_SERIF, FONT_SANS, MUTED, CHALK_GREEN, TAN_BORDER, CREAM } from '../_shared';

const ADMIN_ACCENT = '#7A4A6B';

interface Teacher {
  id: string;
  display_name: string;
  school_id: string;
  email: string;
  email_verified: boolean;
  student_count: number;
  test_count: number;
  admin_approved: boolean;
  created_at?: string;
}

export function AdminTeachers({ teachers: initialTeachers = [] }: { teachers?: Teacher[] }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Load registered teacher accounts from localStorage
  function loadTeachers() {
    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const allAccounts = Object.values(accountsMap) as any[];

      // Filter unique teachers by unique school_id or email
      const uniqueMap = new Map<string, Teacher>();

      allAccounts
        .filter((acc) => acc.role === 'teacher')
        .forEach((acc, idx) => {
          const key = (acc.school_id || acc.email || acc.username || `t-${idx}`).toLowerCase();
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, {
              id: `t-acc-${idx + 1}`,
              display_name: acc.display_name || 'Educator',
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

      const loadedList = Array.from(uniqueMap.values());
      setTeachers(loadedList);
      localStorage.setItem('readbuddy_admin_teachers', JSON.stringify(loadedList));
    } catch (e) {}
  }

  useEffect(() => {
    loadTeachers();
    window.addEventListener('readbuddy_accounts_updated', loadTeachers);
    return () => window.removeEventListener('readbuddy_accounts_updated', loadTeachers);
  }, []);

  function handleApproveTeacher(schoolIdOrEmail: string) {
    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const lowerKey = schoolIdOrEmail.toLowerCase().trim();

      // Update all matching account references in localStorage
      Object.keys(accountsMap).forEach((key) => {
        const acc = accountsMap[key];
        if (
          acc &&
          acc.role === 'teacher' &&
          (key.toLowerCase() === lowerKey ||
            acc.school_id?.toLowerCase() === lowerKey ||
            acc.email?.toLowerCase() === lowerKey ||
            acc.username?.toLowerCase() === lowerKey)
        ) {
          accountsMap[key] = {
            ...acc,
            admin_approved: true,
            email_verified: true,
          };
        }
      });

      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
      loadTeachers();
      window.dispatchEvent(new Event('readbuddy_accounts_updated'));

      setFeedback('✓ Teacher account has been approved and activated! The teacher can now sign in.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (e) {}
  }

  function handleRevokeTeacher(schoolIdOrEmail: string) {
    if (!window.confirm('Revoke access for this teacher account? They will not be able to log in until re-approved.')) return;

    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const lowerKey = schoolIdOrEmail.toLowerCase().trim();

      Object.keys(accountsMap).forEach((key) => {
        const acc = accountsMap[key];
        if (
          acc &&
          acc.role === 'teacher' &&
          (key.toLowerCase() === lowerKey ||
            acc.school_id?.toLowerCase() === lowerKey ||
            acc.email?.toLowerCase() === lowerKey ||
            acc.username?.toLowerCase() === lowerKey)
        ) {
          accountsMap[key] = {
            ...acc,
            admin_approved: false,
          };
        }
      });

      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
      loadTeachers();
      window.dispatchEvent(new Event('readbuddy_accounts_updated'));

      setFeedback('Teacher access revoked. The account is now pending administrator review.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (e) {}
  }

  function handleDeleteTeacher(schoolIdOrEmail: string) {
    if (!window.confirm('Are you sure you want to permanently delete/reject this teacher account request?')) return;

    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
      const lowerKey = schoolIdOrEmail.toLowerCase().trim();

      Object.keys(accountsMap).forEach((key) => {
        const acc = accountsMap[key];
        if (
          acc &&
          acc.role === 'teacher' &&
          (key.toLowerCase() === lowerKey ||
            acc.school_id?.toLowerCase() === lowerKey ||
            acc.email?.toLowerCase() === lowerKey ||
            acc.username?.toLowerCase() === lowerKey)
        ) {
          delete accountsMap[key];
          delete passwordsMap[key];
        }
      });

      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
      localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));
      loadTeachers();
      window.dispatchEvent(new Event('readbuddy_accounts_updated'));

      setFeedback('Teacher account request removed.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (e) {}
  }

  const pendingCount = teachers.filter((t) => !t.admin_approved).length;
  const approvedCount = teachers.filter((t) => t.admin_approved).length;

  const filteredTeachers = teachers.filter((t) => {
    if (filter === 'pending') return !t.admin_approved;
    if (filter === 'approved') return t.admin_approved;
    return true;
  });

  return (
    <div>
      <SectionHeader
        title="Teachers & Account Approvals"
        subtitle="Review, approve, and manage institutional educator access and credentials."
        accent={ADMIN_ACCENT}
      />

      {feedback && (
        <div className="mb-4 p-3.5 rounded-xl bg-[#EBF3F8] border border-[#A8C5DA] text-[#3D6B8A] text-xs font-sans font-semibold flex items-center justify-between rb-fade-in-up">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#DED2B444]">
        <button
          onClick={() => setFilter('all')}
          className="px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer"
          style={{
            background: filter === 'all' ? ADMIN_ACCENT : 'transparent',
            color: filter === 'all' ? '#FFFFFF' : MUTED,
          }}
        >
          All Teachers ({teachers.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className="px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5"
          style={{
            background: filter === 'pending' ? '#B4602E' : '#FDF2E9',
            color: filter === 'pending' ? '#FFFFFF' : '#B4602E',
            border: filter === 'pending' ? 'none' : '1px solid #F0C99A',
          }}
        >
          <span>Pending Approvals</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/25 font-mono">
            {pendingCount}
          </span>
        </button>
        <button
          onClick={() => setFilter('approved')}
          className="px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer"
          style={{
            background: filter === 'approved' ? '#2E7D4F' : 'transparent',
            color: filter === 'approved' ? '#FFFFFF' : MUTED,
          }}
        >
          Approved & Active ({approvedCount})
        </button>
      </div>

      {filteredTeachers.length === 0 ? (
        <EmptyState
          message={
            filter === 'pending'
              ? 'Great! There are no pending teacher registration requests awaiting review.'
              : filter === 'approved'
              ? 'No approved teacher accounts yet. Approve pending requests or register a new teacher.'
              : 'No teacher accounts found in the system registry.'
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTeachers.map((t) => {
            const isApproved = t.admin_approved;
            return (
              <Card key={t.id} hoverable className="flex flex-col md:flex-row md:items-center justify-between gap-4 rb-fade-in-up">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <Avatar name={t.display_name} accent={isApproved ? '#2E7D4F' : '#B4602E'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap" style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>
                      <span className="text-base truncate">{t.display_name}</span>
                      {!isApproved ? (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FDF2E9] text-[#B4602E] font-sans font-bold border border-[#F0C99A] shrink-0 flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>Pending Admin Approval</span>
                        </span>
                      ) : (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#EBF3F8] text-[#2E7D4F] font-sans font-bold border border-[#A8C5DA] shrink-0">
                          ✓ Verified & Approved
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-1 flex items-center gap-3 flex-wrap" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                      <span><strong>ID:</strong> {t.school_id}</span>
                      <span>•</span>
                      <span><strong>Email:</strong> {t.email}</span>
                      {t.created_at && (
                        <>
                          <span>•</span>
                          <span><strong>Registered:</strong> {t.created_at}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {!isApproved ? (
                    <>
                      <button
                        onClick={() => handleApproveTeacher(t.school_id || t.email)}
                        className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg, #2E7D4F, #1F4D3A)' }}
                      >
                        <span>✓</span>
                        <span>Approve & Verify Teacher</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(t.school_id || t.email)}
                        className="px-3 py-2 rounded-xl text-xs font-sans font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                      >
                        Reject Request
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRevokeTeacher(t.school_id || t.email)}
                        className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium text-amber-700 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
                      >
                        Revoke Access
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(t.school_id || t.email)}
                        className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default AdminTeachers;
