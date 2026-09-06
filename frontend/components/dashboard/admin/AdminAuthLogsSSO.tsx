'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, Badge, EmptyState, Avatar, FONT_MONO, FONT_SERIF, FONT_SANS, MUTED, CHALK_GREEN, TAN_BORDER, CREAM } from '../_shared';
import { recordAuthLog, recordActivity } from '@/utils/auditLogger';
import { Check, X } from 'lucide-react';

const ADMIN_ACCENT = '#7A4A6B';

export interface AuthLog {
  id: string;
  timestamp: string;
  identifier: string;
  display_name: string;
  role: 'student' | 'teacher' | 'admin';
  method: 'Local Password' | 'SMCC Google SSO' | 'Microsoft 365 SAML' | 'Session Token';
  status: 'SUCCESS' | 'FAILED' | 'PASSWORD_RESET' | 'APPROVED' | 'REVOKED' | 'CREATED' | 'UPDATED' | 'DELETED';
  ip_address: string;
  details: string;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  user_name: string;
  role: 'student' | 'teacher' | 'admin';
  action: string;
  details: string;
  badge?: string;
}

export function AdminAuthLogsSSO() {
  const [activeTab, setActiveTab] = useState<'logs' | 'activity' | 'sso'>('logs');
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  // SSO Configuration State
  const [googleSsoEnabled, setGoogleSsoEnabled] = useState(true);
  const [microsoftSsoEnabled, setMicrosoftSsoEnabled] = useState(false);
  const [enforceDomain, setEnforceDomain] = useState(true);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(24);
  const [ssoClientId, setSsoClientId] = useState('smcc-readbuddy-auth.apps.googleusercontent.com');

  function loadLogsAndActivity() {
    try {
      // 1. Generate / retrieve auth logs
      const savedLogs = localStorage.getItem('readbuddy_auth_logs');
      if (savedLogs) {
        setAuthLogs(JSON.parse(savedLogs));
      } else {
        const initialLogs: AuthLog[] = [
          {
            id: 'log-1',
            timestamp: new Date().toISOString(),
            identifier: 'readbuddyadmin',
            display_name: 'SMCC System Administrator',
            role: 'admin',
            method: 'Local Password',
            status: 'SUCCESS',
            ip_address: '192.168.1.100 (SMCC LAN)',
            details: 'Admin dashboard login session initiated',
          },
        ];
        setAuthLogs(initialLogs);
        localStorage.setItem('readbuddy_auth_logs', JSON.stringify(initialLogs));
      }

      // 2. Generate activity timeline from live recorded events, accounts, sessions, and passages
      const explicitActivities: ActivityItem[] = JSON.parse(localStorage.getItem('readbuddy_activities') || '[]');
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const sessions = JSON.parse(localStorage.getItem('readbuddy_student_sessions') || '[]');
      const passages = JSON.parse(localStorage.getItem('readbuddy_teacher_passages') || '[]');

      const actList: ActivityItem[] = [...explicitActivities];

      // Add session activities if not present
      sessions.forEach((s: any, idx: number) => {
        const id = `act-s-${idx}-${s.date || ''}`;
        if (!actList.some((a) => a.id === id)) {
          actList.push({
            id,
            timestamp: s.date || new Date().toISOString(),
            user_name: s.student_name || 'Student',
            role: 'student',
            action: 'Completed Reading Assessment',
            details: `Phil-IRI: ${s.phil_iri_level || 'Instructional'} · Word Recognition: ${s.word_recognition_score || 92}% · Comp: ${s.comprehension_score || 85}%`,
            badge: s.phil_iri_level || 'Instructional',
          });
        }
      });

      // Add passage activities if not present
      passages.forEach((p: any, idx: number) => {
        const id = `act-p-${idx}-${p.title || ''}`;
        if (!actList.some((a) => a.id === id)) {
          actList.push({
            id,
            timestamp: p.created_at || new Date().toISOString(),
            user_name: p.teacher_name || 'Teacher / Faculty',
            role: 'teacher',
            action: 'Published Reading Passage',
            details: `Title: "${p.title || 'Untitled Passage'}" (${p.word_count || 120} words, ${p.source_language === 'tl' ? 'Tagalog' : 'English'})`,
            badge: 'Passage',
          });
        }
      });

      // Add account registrations if not present
      Object.values(accountsMap).forEach((acc: any, idx: number) => {
        if (acc && acc.display_name) {
          const id = `act-acc-${acc.school_id || acc.username || idx}`;
          if (!actList.some((a) => a.id === id || a.details.includes(acc.school_id || ''))) {
            actList.push({
              id,
              timestamp: acc.created_at || new Date().toISOString(),
              user_name: acc.display_name,
              role: acc.role || 'student',
              action: acc.role === 'teacher' ? 'Registered Faculty Account' : 'Registered Student Account',
              details: `ID: ${acc.school_id || acc.username} · Email: ${acc.email || 'None'} · ${acc.role === 'student' ? `Grade ${acc.grade_level || 7}` : 'Verified Educator'}`,
              badge: acc.role === 'teacher' ? 'Faculty' : 'Learner',
            });
          }
        }
      });

      // Sort by timestamp descending
      actList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(actList);

      // 3. Load SSO config
      const savedSso = localStorage.getItem('readbuddy_sso_config');
      if (savedSso) {
        const parsed = JSON.parse(savedSso);
        if (parsed.googleSsoEnabled !== undefined) setGoogleSsoEnabled(parsed.googleSsoEnabled);
        if (parsed.microsoftSsoEnabled !== undefined) setMicrosoftSsoEnabled(parsed.microsoftSsoEnabled);
        if (parsed.enforceDomain !== undefined) setEnforceDomain(parsed.enforceDomain);
        if (parsed.sessionTimeoutHours !== undefined) setSessionTimeoutHours(parsed.sessionTimeoutHours);
        if (parsed.ssoClientId) setSsoClientId(parsed.ssoClientId);
      }
    } catch (e) {}
  }

  useEffect(() => {
    loadLogsAndActivity();
    window.addEventListener('readbuddy_auth_logs_updated', loadLogsAndActivity);
    window.addEventListener('readbuddy_activity_updated', loadLogsAndActivity);
    window.addEventListener('readbuddy_accounts_updated', loadLogsAndActivity);
    window.addEventListener('readbuddy_student_sessions_updated', loadLogsAndActivity);
    window.addEventListener('readbuddy_passages_updated', loadLogsAndActivity);
    return () => {
      window.removeEventListener('readbuddy_auth_logs_updated', loadLogsAndActivity);
      window.removeEventListener('readbuddy_activity_updated', loadLogsAndActivity);
      window.removeEventListener('readbuddy_accounts_updated', loadLogsAndActivity);
      window.removeEventListener('readbuddy_student_sessions_updated', loadLogsAndActivity);
      window.removeEventListener('readbuddy_passages_updated', loadLogsAndActivity);
    };
  }, []);

  function handleSaveSso() {
    try {
      localStorage.setItem(
        'readbuddy_sso_config',
        JSON.stringify({
          googleSsoEnabled,
          microsoftSsoEnabled,
          enforceDomain,
          sessionTimeoutHours,
          ssoClientId,
        })
      );

      recordAuthLog({
        identifier: 'readbuddyadmin',
        display_name: 'SMCC System Administrator',
        role: 'admin',
        method: 'Session Token',
        status: 'UPDATED',
        details: `Institutional SSO settings updated (Google: ${googleSsoEnabled ? 'Enabled' : 'Disabled'}, M365: ${microsoftSsoEnabled ? 'Enabled' : 'Disabled'}, Domain: @smccnasipit.edu.ph)`,
      });

      recordActivity({
        user_name: 'System Admin',
        role: 'admin',
        action: 'Updated SSO Security Config',
        details: 'Configured institutional authentication providers and domain restrictions',
      });

      setFeedback('✓ Institutional SSO configuration saved and active for @smccnasipit.edu.ph.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (e) {}
  }

  function handleExportLogsCsv() {
    if (authLogs.length === 0) {
      alert('No authentication logs to export.');
      return;
    }

    const headers = ['Timestamp', 'Identifier', 'Display Name', 'Role', 'Auth Method', 'Status', 'IP Address', 'Details'];
    const rows = authLogs.map((log) => [
      `"${log.timestamp}"`,
      `"${log.identifier}"`,
      `"${log.display_name}"`,
      `"${log.role}"`,
      `"${log.method}"`,
      `"${log.status}"`,
      `"${log.ip_address}"`,
      `"${log.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smcc_auth_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback('✓ Authentication logs exported to CSV.');
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleClearLogs() {
    if (!window.confirm('Are you sure you want to clear old authentication audit logs?')) return;
    setAuthLogs([]);
    localStorage.removeItem('readbuddy_auth_logs');
    setFeedback('Authentication logs cleared.');
    setTimeout(() => setFeedback(null), 3000);
  }

  const filteredLogs = authLogs.filter((log) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      log.identifier.toLowerCase().includes(q) ||
      log.display_name.toLowerCase().includes(q) ||
      log.ip_address.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);

    const matchesRole = filterRole === 'all' || log.role === filterRole;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div>
      <div id="tour-admin-logs-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <SectionHeader
          title="Activity, Auth Logs & SSO"
          subtitle="Audit authentication attempts, user activity timestamps, and manage institutional Single Sign-On (SSO)."
          accent={ADMIN_ACCENT}
        />

        <div className="flex items-center gap-2">
          {activeTab === 'logs' && (
            <>
              <button
                type="button"
                onClick={handleExportLogsCsv}
                className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #1F4D3A, #2C4E66)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Export Logs CSV</span>
              </button>

              <button
                type="button"
                onClick={handleClearLogs}
                className="px-3 py-2 rounded-xl text-xs font-sans font-medium text-gray-500 hover:text-red-700 hover:bg-red-50 border border-gray-200 transition-colors cursor-pointer"
                title="Clear Logs"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div className="mb-4 p-3.5 rounded-xl bg-[#E6F4EA] border border-[#BFE0CC] text-[#2E7D4F] text-xs font-sans font-semibold flex items-center justify-between shadow-sm rb-fade-in-up">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer flex items-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sub Tabs (Soft-Neobrutalism Tactile Pill Buttons) */}
      <div className="flex items-center gap-2.5 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('logs')}
          className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 border-2 select-none"
          style={{
            background: activeTab === 'logs' ? ADMIN_ACCENT : '#FFFDF8',
            color: activeTab === 'logs' ? '#FFFFFF' : '#2B2621',
            borderColor: activeTab === 'logs' ? '#1F4D3A' : '#DED2B4',
            boxShadow: activeTab === 'logs' ? '3px 3px 0px #1F4D3A' : '2px 2px 0px rgba(31,77,58,0.06)',
            transform: activeTab === 'logs' ? 'translate(-1px, -1px)' : 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Authentication Logs ({authLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 border-2 select-none"
          style={{
            background: activeTab === 'activity' ? ADMIN_ACCENT : '#FFFDF8',
            color: activeTab === 'activity' ? '#FFFFFF' : '#2B2621',
            borderColor: activeTab === 'activity' ? '#1F4D3A' : '#DED2B4',
            boxShadow: activeTab === 'activity' ? '3px 3px 0px #1F4D3A' : '2px 2px 0px rgba(31,77,58,0.06)',
            transform: activeTab === 'activity' ? 'translate(-1px, -1px)' : 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>User Activity Stream ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sso')}
          className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 border-2 select-none"
          style={{
            background: activeTab === 'sso' ? ADMIN_ACCENT : '#FFFDF8',
            color: activeTab === 'sso' ? '#FFFFFF' : '#2B2621',
            borderColor: activeTab === 'sso' ? '#1F4D3A' : '#DED2B4',
            boxShadow: activeTab === 'sso' ? '3px 3px 0px #1F4D3A' : '2px 2px 0px rgba(31,77,58,0.06)',
            transform: activeTab === 'sso' ? 'translate(-1px, -1px)' : 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Institutional SSO Configuration</span>
        </button>
      </div>

      {/* ─── TAB 1: AUTHENTICATION LOGS ─── */}
      {activeTab === 'logs' && (
        <div className="flex flex-col gap-4 rb-fade-in-up">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#DED2B4]">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search by ID, name, IP, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rb-input text-xs w-full"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="rb-input text-xs py-1 px-2.5"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="rb-input text-xs py-1 px-2.5"
              >
                <option value="all">All Statuses</option>
                <option value="SUCCESS">Success Logins</option>
                <option value="FAILED">Failed Attempts</option>
                <option value="CREATED">Account Created</option>
                <option value="UPDATED">Account Updated</option>
                <option value="APPROVED">Account Approved</option>
                <option value="REVOKED">Access Revoked</option>
                <option value="DELETED">Account Deleted</option>
              </select>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <EmptyState message="No authentication logs match the current search filters." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#DED2B4] bg-[#FFFDF8] shadow-sm">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-[#DED2B4] bg-[#FAF6ED] text-[#2B2621]">
                    <th className="py-3 px-4 font-bold font-serif">Timestamp</th>
                    <th className="py-3 px-4 font-bold font-serif">User / Identifier</th>
                    <th className="py-3 px-4 font-bold font-serif">Role</th>
                    <th className="py-3 px-4 font-bold font-serif">Method</th>
                    <th className="py-3 px-4 font-bold font-serif">Status</th>
                    <th className="py-3 px-4 font-bold font-serif">IP / Origin</th>
                    <th className="py-3 px-4 font-bold font-serif">Action Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6D5]">
                  {filteredLogs.map((log) => {
                    const isSuccess = log.status === 'SUCCESS' || log.status === 'APPROVED';
                    return (
                      <tr key={log.id} className="hover:bg-[#FAF6ED]/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1F4D3A]">{log.display_name}</div>
                          <div className="font-mono text-[10px] text-gray-500">{log.identifier}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono"
                            style={{
                              background:
                                log.role === 'admin'
                                  ? '#F3EAF0'
                                  : log.role === 'teacher'
                                  ? '#EBF3F8'
                                  : '#FCEDDE',
                              color:
                                log.role === 'admin'
                                  ? '#7A4A6B'
                                  : log.role === 'teacher'
                                  ? '#3D6B8A'
                                  : '#E8873A',
                            }}
                          >
                            {log.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-700">
                          {log.method}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono inline-flex items-center gap-1 ${
                              isSuccess
                                ? 'bg-[#E6F4EA] text-[#2E7D4F] border border-[#BFE0CC]'
                                : 'bg-[#FDF2E9] text-[#B4602E] border border-[#F0C99A]'
                            }`}
                          >
                            <span>{isSuccess ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <X className="w-3 h-3" strokeWidth={2.5} />}</span>
                            <span>{log.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                          {log.ip_address}
                        </td>
                        <td className="py-3 px-4 text-gray-700 max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: USER ACTIVITY STREAM ─── */}
      {activeTab === 'activity' && (
        <div className="flex flex-col gap-3 rb-fade-in-up">
          {activities.length === 0 ? (
            <EmptyState message="No user activity events recorded yet." />
          ) : (
            activities.map((act) => (
              <Card key={act.id} hoverable className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <Avatar
                    name={act.user_name}
                    accent={act.role === 'teacher' ? '#3D6B8A' : act.role === 'admin' ? '#7A4A6B' : '#E8873A'}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold font-serif text-[#1F4D3A]">{act.user_name}</span>
                      <span className="text-xs font-semibold text-gray-800 font-sans">• {act.action}</span>
                      {act.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#FAF5EA] border border-[#DED2B4] text-[#6E5334]">
                          {act.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 font-sans">{act.details}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-mono font-medium text-gray-500">
                    {new Date(act.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-[10px] font-mono text-gray-400">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ─── TAB 3: INSTITUTIONAL SSO CONFIGURATION ─── */}
      {activeTab === 'sso' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rb-fade-in-up">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DED2B4]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FCEDDE] text-[#E8873A] flex items-center justify-center font-bold font-mono">
                  G
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#1F4D3A]">Google Workspace SSO</h3>
                  <p className="text-xs text-gray-500 font-sans">Institutional OAuth 2.0 Integration</p>
                </div>
              </div>

              <button
                role="switch"
                aria-checked={googleSsoEnabled}
                onClick={() => setGoogleSsoEnabled(!googleSsoEnabled)}
                className="w-11 h-6 rounded-full relative transition-all duration-300 cursor-pointer"
                style={{ background: googleSsoEnabled ? '#2E7D4F' : '#DED2B4' }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all"
                  style={{ left: googleSsoEnabled ? '22px' : '2px' }}
                />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 font-sans mb-1">
                  Institutional Client ID
                </label>
                <input
                  type="text"
                  value={ssoClientId}
                  onChange={(e) => setSsoClientId(e.target.value)}
                  className="rb-input text-xs w-full font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#E5DAC4] text-xs text-gray-700 space-y-1 font-sans">
                <div className="flex items-center gap-1.5 font-bold text-[#1F4D3A]">
                  <span>✓ Allowed Domain:</span>
                  <span className="font-mono text-[#E8873A]">@smccnasipit.edu.ph</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Only accounts under the official SMCC domain will be permitted to authenticate via Google SSO.
                </p>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DED2B4]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF3F8] text-[#3D6B8A] flex items-center justify-center font-bold font-mono">
                  MS
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#1F4D3A]">Microsoft 365 / Entra SAML</h3>
                  <p className="text-xs text-gray-500 font-sans">SAML 2.0 Enterprise Identity</p>
                </div>
              </div>

              <button
                role="switch"
                aria-checked={microsoftSsoEnabled}
                onClick={() => setMicrosoftSsoEnabled(!microsoftSsoEnabled)}
                className="w-11 h-6 rounded-full relative transition-all duration-300 cursor-pointer"
                style={{ background: microsoftSsoEnabled ? '#3D6B8A' : '#DED2B4' }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all"
                  style={{ left: microsoftSsoEnabled ? '22px' : '2px' }}
                />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 font-sans mb-1">
                  Session Token Lifetime (Hours)
                </label>
                <input
                  type="number"
                  value={sessionTimeoutHours}
                  onChange={(e) => setSessionTimeoutHours(Number(e.target.value))}
                  className="rb-input text-xs w-full font-mono max-w-[120px]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6ED] border border-[#E5DAC4] text-xs">
                <div>
                  <div className="font-bold text-[#1F4D3A]">Strict Domain Enforcement</div>
                  <div className="text-[11px] text-gray-500">Block public email addresses (gmail.com, etc.)</div>
                </div>
                <input
                  type="checkbox"
                  checked={enforceDomain}
                  onChange={(e) => setEnforceDomain(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1F4D3A]"
                />
              </div>
            </div>

            <div className="mt-auto pt-2">
              <button
                type="button"
                onClick={handleSaveSso}
                className="w-full py-2.5 rounded-xl text-xs font-sans font-bold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #7A4A6B, #5C3650)' }}
              >
                Save SSO & Security Settings
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdminAuthLogsSSO;
