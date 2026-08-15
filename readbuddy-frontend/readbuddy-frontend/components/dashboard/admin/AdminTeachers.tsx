'use client';

import { useState } from 'react';
import { SectionHeader, Card, Badge, EmptyState, Avatar, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN } from '../_shared';

const ADMIN_ACCENT = '#7A4A6B';

interface Teacher {
  id: string;
  display_name: string;
  school_id: string;
  email: string;
  email_verified: boolean;
  student_count: number;
  test_count: number;
  admin_approved?: boolean;
}

export function AdminTeachers({ teachers: initialTeachers }: { teachers: Teacher[] }) {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);

  function handleVerifyAndApprove(teacherId: string) {
    setTeachers((prev) =>
      prev.map((t) =>
        t.id === teacherId ? { ...t, email_verified: true, admin_approved: true } : t
      )
    );
  }

  return (
    <div>
      <SectionHeader
        title="Teachers & Account Approvals"
        subtitle="Review and approve institutional educator account creation requests."
        accent={ADMIN_ACCENT}
      />

      {teachers.length === 0 ? (
        <EmptyState message="No teacher account creation requests." />
      ) : (
        <div className="flex flex-col gap-3">
          {teachers.map((t) => {
            const isApproved = t.email_verified && (t.admin_approved ?? true);
            return (
              <Card key={t.id} hoverable className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rb-fade-in-up">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <Avatar name={t.display_name} accent={ADMIN_ACCENT} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap" style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>
                      <span className="truncate">{t.display_name}</span>
                      {!isApproved && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FDF2E9] text-[#B4602E] font-sans font-bold border border-[#F0C99A] shrink-0">
                          Needs Admin Approval
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5 truncate" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                      ID: {t.school_id} · Email: {t.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Badge tone="info">
                    {t.student_count} student{t.student_count === 1 ? '' : 's'}
                  </Badge>
                  <Badge tone="accent">
                    {t.test_count} test{t.test_count === 1 ? '' : 's'}
                  </Badge>

                  {isApproved ? (
                    <Badge tone="success">✓ Verified & Approved</Badge>
                  ) : (
                    <button
                      onClick={() => handleVerifyAndApprove(t.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-sans font-bold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #2E7D4F, #1F4D3A)' }}
                    >
                      Approve & Verify Teacher
                    </button>
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
