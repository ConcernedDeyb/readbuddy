'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, Badge, EmptyState, Avatar, FONT_MONO, FONT_SERIF, FONT_SANS, MUTED, CHALK_GREEN, TAN_BORDER, CREAM } from '../_shared';
import { apiFetch } from '@/lib/api';

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

  async function loadTeachers() {
    try {
      const data = await apiFetch('/admin/teachers');
      if (Array.isArray(data)) {
        const loadedList = data.map((t) => ({
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
        setTeachers(loadedList);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  async function handleApproveTeacher(id: string) {
    try {
      await apiFetch(`/admin/approve-teacher/${id}`, { method: 'POST' });
      setFeedback('✓ Teacher account has been approved and activated! An email has been sent.');
      setTimeout(() => setFeedback(null), 4000);
      loadTeachers();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
      setTimeout(() => setFeedback(null), 4000);
    }
  }

  function handleRevokeTeacher(id: string) {
    if (!window.confirm('Revoke access for this teacher account? They will not be able to log in until re-approved.')) return;
    // For now, backend doesn't have revoke endpoint, so skip or warn.
    setFeedback('Revoke not yet implemented on the backend.');
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleDeleteTeacher(id: string) {
    if (!window.confirm('Are you sure you want to permanently delete/reject this teacher account request?')) return;
    try {
      await apiFetch(`/admin/reject-teacher/${id}`, { method: 'DELETE' });
      setFeedback('Teacher account request removed.');
      setTimeout(() => setFeedback(null), 4000);
      loadTeachers();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
      setTimeout(() => setFeedback(null), 4000);
    }
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
                          <span>⏳</span>
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
                        onClick={() => handleApproveTeacher(t.id)}
                        className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg, #2E7D4F, #1F4D3A)' }}
                      >
                        <span>✓</span>
                        <span>Approve & Verify Teacher</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(t.id)}
                        className="px-3 py-2 rounded-xl text-xs font-sans font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                      >
                        Reject Request
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRevokeTeacher(t.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium text-amber-700 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
                      >
                        Revoke Access
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(t.id)}
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
