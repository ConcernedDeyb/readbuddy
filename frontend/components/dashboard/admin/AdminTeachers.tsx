'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SectionHeader, Card, Badge, EmptyState, Avatar, FONT_MONO, FONT_SERIF, FONT_SANS, MUTED, CHALK_GREEN, TAN_BORDER, CREAM } from '../_shared';
import { recordAuthLog, recordActivity } from '@/utils/auditLogger';
import { ShieldCheck, Check, X } from 'lucide-react';

const ADMIN_ACCENT = '#7A4A6B';

export interface Teacher {
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
  const [mounted, setMounted] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    displayName: '',
    schoolId: '',
    email: '',
    password: '',
    adminApproved: true,
  });

  const [teacherQuotaLimit, setTeacherQuotaLimit] = useState(10);
  const [customQuotaInput, setCustomQuotaInput] = useState('10');

  useEffect(() => {
    setMounted(true);
    try {
      const savedLimit = localStorage.getItem('readbuddy_teacher_creation_limit');
      if (savedLimit) {
        const val = Number(savedLimit);
        if (!isNaN(val) && val > 0) {
          setTeacherQuotaLimit(val);
          setCustomQuotaInput(String(val));
        }
      }
    } catch (e) {}
  }, []);

  function handleUpdateTeacherQuota(newLimit: number) {
    if (newLimit < 1) return;
    setTeacherQuotaLimit(newLimit);
    setCustomQuotaInput(String(newLimit));
    try {
      localStorage.setItem('readbuddy_teacher_creation_limit', String(newLimit));
      window.dispatchEvent(new Event('readbuddy_settings_updated'));
      setFeedback(`✓ Educator creation quota updated to ${newLimit} accounts.`);
      setTimeout(() => setFeedback(null), 3000);

      recordActivity({
        user_name: 'System Admin',
        role: 'admin',
        action: 'Quota Adjusted',
        details: `Teacher account creation limit updated to ${newLimit} accounts`,
      });
    } catch (e) {}
  }

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

  // ─── CRUD HANDLERS ───

  function handleSaveTeacher(e: React.FormEvent) {
    e.preventDefault();
    const { displayName, schoolId, email, password, adminApproved } = formData;

    const cleanName = displayName.trim();
    const cleanId = schoolId.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanId || !cleanEmail) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!cleanEmail.endsWith('@smccnasipit.edu.ph')) {
      alert('Only official @smccnasipit.edu.ph institutional email addresses are permitted.');
      return;
    }

    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
      const lowerId = cleanId.toLowerCase();

      // If editing and ID changed, clean old key
      if (editingTeacher && editingTeacher.school_id && editingTeacher.school_id.toLowerCase() !== lowerId) {
        delete accountsMap[editingTeacher.school_id];
        delete accountsMap[editingTeacher.school_id.toLowerCase()];
        delete passwordsMap[editingTeacher.school_id];
        delete passwordsMap[editingTeacher.school_id.toLowerCase()];
      }

      const activePassword = password.trim() || passwordsMap[cleanId] || passwordsMap[lowerId] || 'smcc2026';

      const accountData = {
        display_name: cleanName,
        username: cleanId,
        school_id: cleanId,
        email: cleanEmail,
        password: activePassword,
        role: 'teacher',
        admin_approved: adminApproved,
        email_verified: true,
        created_at: editingTeacher?.created_at || new Date().toISOString().split('T')[0],
      };

      accountsMap[cleanId] = accountData;
      accountsMap[lowerId] = accountData;
      accountsMap[cleanEmail] = accountData;
      accountsMap[cleanEmail.toLowerCase()] = accountData;

      passwordsMap[cleanId] = activePassword;
      passwordsMap[lowerId] = activePassword;
      passwordsMap[cleanEmail] = activePassword;
      passwordsMap[cleanEmail.toLowerCase()] = activePassword;

      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
      localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));

      // Post to backend database
      try {
        fetch('/api/auth/teacher/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            display_name: cleanName,
            school_id: cleanId,
            email: cleanEmail,
            password: activePassword,
          }),
        });
      } catch (err) {}

      loadTeachers();
      window.dispatchEvent(new Event('readbuddy_accounts_updated'));

      recordAuthLog({
        identifier: cleanId,
        display_name: cleanName,
        role: 'teacher',
        method: 'Local Password',
        status: editingTeacher ? 'UPDATED' : 'CREATED',
        details: editingTeacher ? `Teacher record updated by admin (${cleanEmail})` : `New teacher account created by admin (${cleanEmail})`,
      });

      recordActivity({
        user_name: 'System Admin',
        role: 'admin',
        action: editingTeacher ? 'Updated Teacher Account' : 'Created Teacher Account',
        details: `${editingTeacher ? 'Modified' : 'Added'} faculty profile for ${cleanName} (ID: ${cleanId})`,
      });

      setIsAddModalOpen(false);
      setEditingTeacher(null);
      setFormData({ displayName: '', schoolId: '', email: '', password: '', adminApproved: true });

      setFeedback(editingTeacher ? `✓ Teacher details updated for "${cleanName}".` : `✓ New teacher "${cleanName}" created successfully!`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (e) {}
  }

  function handleOpenEdit(t: Teacher) {
    setEditingTeacher(t);
    setFormData({
      displayName: t.display_name,
      schoolId: t.school_id,
      email: t.email,
      password: '',
      adminApproved: t.admin_approved,
    });
    setIsAddModalOpen(true);
  }

  function handleApproveTeacher(schoolIdOrEmail: string) {
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
            admin_approved: true,
            email_verified: true,
          };
        }
      });

      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
      loadTeachers();
      window.dispatchEvent(new Event('readbuddy_accounts_updated'));

      recordAuthLog({
        identifier: schoolIdOrEmail,
        display_name: schoolIdOrEmail,
        role: 'teacher',
        method: 'Local Password',
        status: 'APPROVED',
        details: `Teacher account approved and authorized by System Admin`,
      });

      recordActivity({
        user_name: 'System Admin',
        role: 'admin',
        action: 'Approved Teacher Access',
        details: `Granted active login authorization to educator (${schoolIdOrEmail})`,
      });

      setFeedback('✓ Teacher account approved and activated.');
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

      recordAuthLog({
        identifier: schoolIdOrEmail,
        display_name: schoolIdOrEmail,
        role: 'teacher',
        method: 'Local Password',
        status: 'REVOKED',
        details: `Teacher access revoked by System Admin`,
      });

      recordActivity({
        user_name: 'System Admin',
        role: 'admin',
        action: 'Revoked Teacher Access',
        details: `Suspended login permissions for educator (${schoolIdOrEmail})`,
      });

      setFeedback('Teacher access revoked.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (e) {}
  }

  function handleDeleteTeacher(schoolIdOrEmail: string, name: string) {
    if (!window.confirm(`Are you sure you want to permanently delete teacher account "${name}"?`)) return;

    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
      const lowerKey = schoolIdOrEmail.toLowerCase().trim();

      Object.keys(accountsMap).forEach((key) => {
        const acc = accountsMap[key];
        if (
          acc &&
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

      recordAuthLog({
        identifier: schoolIdOrEmail,
        display_name: name,
        role: 'teacher',
        method: 'Local Password',
        status: 'DELETED',
        details: `Teacher account "${name}" permanently deleted by admin`,
      });

      recordActivity({
        user_name: 'System Admin',
        role: 'admin',
        action: 'Deleted Teacher Account',
        details: `Permanently removed educator profile for ${name}`,
      });

      setFeedback(`Teacher "${name}" has been permanently deleted.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (e) {}
  }

  // ─── CSV EXPORT & PRINT HANDLERS ───

  function handleExportCsv() {
    if (teachers.length === 0) {
      alert('No teachers to export.');
      return;
    }

    const headers = ['Teacher Full Name', 'School ID Number', 'Institutional Email', 'Approval Status', 'Email Verified', 'Registration Date'];
    const rows = teachers.map((t) => [
      `"${t.display_name}"`,
      `"${t.school_id}"`,
      `"${t.email}"`,
      `"${t.admin_approved ? 'Approved' : 'Pending'}"`,
      `"${t.email_verified ? 'Verified' : 'Unverified'}"`,
      `"${t.created_at || 'N/A'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smcc_teachers_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback('✓ Teachers roster exported to CSV successfully.');
    setTimeout(() => setFeedback(null), 3000);
  }

  function handlePrintRoster() {
    window.print();
  }

  const pendingCount = teachers.filter((t) => !t.admin_approved).length;
  const approvedCount = teachers.filter((t) => t.admin_approved).length;

  const filteredTeachers = teachers.filter((t) => {
    const q = search.trim().toLowerCase();
    const matchesQuery = !q || t.display_name.toLowerCase().includes(q) || t.school_id.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
    if (!matchesQuery) return false;

    if (filter === 'pending') return !t.admin_approved;
    if (filter === 'approved') return t.admin_approved;
    return true;
  });

  return (
    <div>
      <div id="tour-admin-teachers-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <SectionHeader
          title="Teachers & Faculty Management"
          subtitle="Add, edit, review, approve, and export educator credentials across SMCC."
          accent={ADMIN_ACCENT}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setEditingTeacher(null);
              setFormData({ displayName: '', schoolId: '', email: '', password: '', adminApproved: true });
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #7A4A6B, #5C3650)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Teacher</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl text-xs font-sans font-semibold text-gray-700 bg-white border border-[#DED2B4] hover:bg-gray-50 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintRoster}
            className="px-3 py-2 rounded-xl text-xs font-sans font-semibold text-gray-700 bg-white border border-[#DED2B4] hover:bg-gray-50 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 p-3.5 rounded-xl bg-[#EBF3F8] border border-[#A8C5DA] text-[#3D6B8A] text-xs font-sans font-semibold flex items-center justify-between rb-fade-in-up">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer flex items-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── EDUCATOR ACCOUNT CREATION LIMITER & ANTI-IMPERSONATION CONTROL CARD ─── */}
      <div className="mb-6 p-4 rounded-2xl bg-[#FFFDF8] border-2 rb-fade-in-up" style={{ borderColor: `${ADMIN_ACCENT}33` }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <ShieldCheck className="w-5 h-5 text-[#7A4A6B]" strokeWidth={2.25} />
              <h3 className="text-sm font-bold uppercase tracking-wide font-mono" style={{ color: ADMIN_ACCENT }}>
                Teacher Account Creation Limiter & Anti-Impersonation Control
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-[#EBF3F8] text-[#3D6B8A] border border-[#A8C5DA]">
                {teachers.length} / {teacherQuotaLimit} Accounts Allocated
              </span>
            </div>
            <p className="text-xs text-gray-600 font-sans leading-relaxed max-w-2xl">
              Configures the maximum number of educator accounts permitted on ReadBuddy to prevent student impersonation and unauthorized faculty accounts. Adjust this limit anytime below.
            </p>

            {/* Utilization Progress Bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden max-w-md">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (teachers.length / Math.max(1, teacherQuotaLimit)) * 100)}%`,
                    background:
                      teachers.length >= teacherQuotaLimit
                        ? '#B4602E'
                        : teachers.length / teacherQuotaLimit >= 0.8
                        ? '#E8873A'
                        : '#2E7D4F',
                  }}
                />
              </div>
              <span className="text-xs font-mono font-bold shrink-0 text-gray-700">
                {Math.round((teachers.length / Math.max(1, teacherQuotaLimit)) * 100)}% Quota Used
              </span>
            </div>
          </div>

          {/* Limiter Adjuster Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 bg-[#FBF6EB] p-2.5 rounded-xl border border-[#E5DAC4]">
            <span className="text-xs font-bold font-sans text-[#1F4D3A] mr-1">Max Teacher Limit:</span>
            
            <button
              type="button"
              onClick={() => handleUpdateTeacherQuota(Math.max(1, teacherQuotaLimit - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-[#DED2B4] font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors shadow-sm text-sm"
              title="Decrease Quota by 1"
            >
              -
            </button>

            <input
              type="number"
              min={1}
              max={500}
              value={customQuotaInput}
              onChange={(e) => {
                setCustomQuotaInput(e.target.value);
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  handleUpdateTeacherQuota(val);
                }
              }}
              className="w-16 h-8 text-center text-xs font-mono font-bold bg-white border border-[#DED2B4] rounded-lg"
            />

            <button
              type="button"
              onClick={() => handleUpdateTeacherQuota(teacherQuotaLimit + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-[#DED2B4] font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors shadow-sm text-sm"
              title="Increase Quota by 1"
            >
              +
            </button>

            <div className="flex gap-1 ml-1">
              {[5, 10, 20, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleUpdateTeacherQuota(preset)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                    teacherQuotaLimit === preset
                      ? 'bg-[#7A4A6B] text-white border-[#7A4A6B]'
                      : 'bg-white text-gray-600 border-[#DED2B4] hover:bg-gray-50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-[#DED2B444]">
        <div className="flex items-center gap-2 flex-wrap">
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
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilter('approved')}
            className="px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer"
            style={{
              background: filter === 'approved' ? '#2E7D4F' : 'transparent',
              color: filter === 'approved' ? '#FFFFFF' : MUTED,
            }}
          >
            Active ({approvedCount})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-input text-xs w-full"
          />
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <EmptyState
          message={
            filter === 'pending'
              ? 'No pending teacher registration requests.'
              : filter === 'approved'
              ? 'No approved teacher accounts yet.'
              : 'No teacher accounts found in the registry.'
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTeachers.map((t) => {
            const isApproved = t.admin_approved;
            return (
              <Card key={t.id} hoverable className="flex flex-col md:flex-row md:items-center justify-between gap-4 rb-fade-in-up">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <Avatar name={t.display_name} accent={isApproved ? '#2E7D4F' : '#B4602E'} src={(t as any).avatar_url || (t as any).avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap" style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>
                      <span className="text-base truncate">{t.display_name}</span>
                      {!isApproved ? (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FDF2E9] text-[#B4602E] font-sans font-bold border border-[#F0C99A] shrink-0 flex items-center gap-1">
                          <span>Pending Approval</span>
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
                      {(t as any).phone_number && (
                        <>
                          <span>•</span>
                          <span><strong>Mobile:</strong> {(t as any).phone_number}</span>
                        </>
                      )}
                      {t.created_at && (
                        <>
                          <span>•</span>
                          <span><strong>Registered:</strong> {t.created_at}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 w-full md:w-auto justify-end">
                  {!isApproved ? (
                    <button
                      onClick={() => handleApproveTeacher(t.school_id || t.email)}
                      className="px-3 py-1.5 rounded-lg text-xs font-sans font-bold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center gap-1"
                      style={{ background: 'linear-gradient(135deg, #2E7D4F, #1F4D3A)' }}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      <span>Approve</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRevokeTeacher(t.school_id || t.email)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium text-amber-700 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteTeacher(t.school_id || t.email, t.display_name)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── ADD / EDIT TEACHER MODAL ─── */}
      {isAddModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md bg-[#FFFDF8] border border-[#DED2B4] rounded-2xl p-4 sm:p-7 shadow-2xl relative font-sans my-auto max-h-[90vh] overflow-y-auto flex flex-col rb-fade-in-up">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={2.25} />
            </button>

            <h3 className="text-lg font-serif font-bold text-[#1F4D3A] mb-1">
              {editingTeacher ? 'Edit Educator Record' : 'Add New Teacher Account'}
            </h3>
            <p className="text-xs text-gray-500 font-sans mb-4">
              {editingTeacher ? 'Update credentials and authorization.' : 'Create an authenticated educator account directly.'}
            </p>

            <form onSubmit={handleSaveTeacher} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 font-sans">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="rb-input text-xs w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 font-sans">School ID Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024001"
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  className="rb-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 font-sans">Institutional Email *</label>
                <input
                  type="email"
                  required
                  placeholder="msantos@smccnasipit.edu.ph"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rb-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 font-sans">
                  {editingTeacher ? 'Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingTeacher}
                  placeholder={editingTeacher ? '••••••••' : 'Min. 8 characters'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="rb-input text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF6ED] border border-[#E5DAC4]">
                <input
                  type="checkbox"
                  id="adminApprovedToggle"
                  checked={formData.adminApproved}
                  onChange={(e) => setFormData({ ...formData, adminApproved: e.target.checked })}
                  className="w-4 h-4 rounded text-[#1F4D3A]"
                />
                <label htmlFor="adminApprovedToggle" className="text-xs font-sans font-semibold text-[#1F4D3A] cursor-pointer">
                  Approve and grant immediate dashboard login access
                </label>
              </div>

              <div className="flex gap-2.5 mt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-sans font-bold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #7A4A6B, #5C3650)' }}
                >
                  {editingTeacher ? 'Save Changes' : 'Create Teacher Account'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminTeachers;
