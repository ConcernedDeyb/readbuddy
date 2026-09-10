'use client';

import { ReactNode, useState, useEffect } from 'react';
import { FONT_SERIF, FONT_SANS, FONT_MONO, CREAM, MUTED, TAN_BORDER, CHALK_GREEN, Avatar } from './_shared';
import { ReadBuddyLogo } from '../brand';
import { InteractiveFeatureTour } from '../guide';
import { BookOpen } from 'lucide-react';
import { NotificationNav, loadNotifications } from './notifications';

export type DashboardRole = 'teacher' | 'admin' | 'student' | 'principal';

interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

const ROLE_THEME: Record<
  DashboardRole,
  { accent: string; accentDark: string; badge: string; badgeFg: string; label: string }
> = {
  teacher: { accent: '#3D6B8A', accentDark: '#2C4E66', badge: '#E8F0F8', badgeFg: '#2C4E66', label: 'Teacher' },
  admin: { accent: '#7A4A6B', accentDark: '#5C3650', badge: '#F3EAF0', badgeFg: '#5C3650', label: 'Admin' },
  student: { accent: '#E8873A', accentDark: '#C97C1F', badge: '#FCEDDE', badgeFg: '#B4602E', label: 'Student' },
  principal: { accent: '#4A3D6B', accentDark: '#362A50', badge: '#EBE7F5', badgeFg: '#362A50', label: 'Principal' },
};

/* ─── SVG Icons ─── */

const IconHome = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconUsers = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconUser = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconBook = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IconSettings = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconFileText = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconClipboard = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="15" y2="16" />
  </svg>
);
const IconNotebook = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6s1.5-2 5-2 5 2 5 2v14s-1.5-1-5-1-5 1-5 1V6z" />
    <path d="M12 6s1.5-2 5-2 5 2 5 2v14s-1.5-1-5-1-5 1-5 1V6z" />
  </svg>
);
const IconLogout = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconShield = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconBell = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const TEACHER_NAV: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: IconHome },
  { key: 'classes', label: 'Classes & Sections', icon: IconUsers },
  { key: 'students', label: 'My Students', icon: IconUser },
  { key: 'passages', label: 'My Passages', icon: IconBook },
  { key: 'tests', label: 'Reading Tests', icon: IconClipboard },
  { key: 'notebook', label: 'Notebook', icon: IconNotebook },
  { key: 'notifications', label: 'Notifications', icon: IconBell },
  { key: 'settings', label: 'Settings', icon: IconSettings },
];

const IconSchool = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
    <path d="M18 10h4l-10-7L2 10h4v12h12V10z" />
  </svg>
);

const ADMIN_NAV: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: IconHome },
  { key: 'sections', label: 'Class Sections', icon: IconSchool },
  { key: 'teachers', label: 'Teachers', icon: IconUsers },
  { key: 'students', label: 'Students', icon: IconUser },
  { key: 'content', label: 'Content', icon: IconFileText },
  { key: 'logs', label: 'Activity & SSO Logs', icon: IconShield },
  { key: 'notifications', label: 'Notifications', icon: IconBell },
  { key: 'settings', label: 'System Settings', icon: IconSettings },
  { key: 'account', label: 'My Account', icon: IconUser },
];

const PRINCIPAL_NAV: NavItem[] = [
  { key: 'overview', label: 'Executive Overview', icon: IconHome },
  { key: 'sections', label: 'Academic Sections', icon: IconSchool },
  { key: 'teachers', label: 'Faculty Management', icon: IconUsers },
  { key: 'students', label: 'Student Reading Progress', icon: IconUser },
  { key: 'logs', label: 'School Activity Logs', icon: IconShield },
  { key: 'notifications', label: 'Notifications', icon: IconBell },
  { key: 'account', label: 'My Account', icon: IconUser },
];

const STUDENT_NAV: NavItem[] = [
  { key: 'overview', label: 'My Progress', icon: IconHome },
  { key: 'tests', label: 'Assigned Tests', icon: IconClipboard },
  { key: 'history', label: 'Reading History', icon: IconBook },
  { key: 'notebook', label: 'Notebook', icon: IconNotebook },
  { key: 'notifications', label: 'Notifications', icon: IconBell },
  { key: 'settings', label: 'Settings', icon: IconSettings },
];

const SECTION_TITLES: Record<string, string> = {
  overview: 'Overview',
  classes: 'Classes & Sections',
  students: 'Students',
  teachers: 'Teachers',
  passages: 'Passages',
  content: 'Content',
  logs: 'Activity, Auth Logs & SSO',
  notifications: 'Notifications & Alerts',
  settings: 'Settings',
  account: 'My Account',
  author: 'Author Passage',
  tests: 'Reading Tests',
  grading: 'Grading',
  history: 'Reading History',
  progress: 'My Progress',
  notebook: 'Notebook',
};

export default function DashboardShell({
  role,
  activeSection,
  onSectionChange,
  userName,
  userId,
  onLogout,
  children,
}: {
  role: DashboardRole;
  activeSection: string;
  onSectionChange: (section: string) => void;
  userName: string;
  userId?: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  const theme = ROLE_THEME[role];
  const nav =
    role === 'teacher'
      ? TEACHER_NAV
      : role === 'admin'
      ? ADMIN_NAV
      : role === 'principal'
      ? PRINCIPAL_NAV
      : STUDENT_NAV;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Sync unread notification count
  useEffect(() => {
    function checkUnread() {
      try {
        const notifs = loadNotifications(role, userId);
        setUnreadNotifsCount(notifs.filter((n) => !n.read).length);
      } catch (e) {}
    }
    checkUnread();
    window.addEventListener('readbuddy_notifications_updated', checkUnread);
    return () => window.removeEventListener('readbuddy_notifications_updated', checkUnread);
  }, [role, userId]);

  // Load avatar from localStorage and keep updated on profile changes
  useEffect(() => {
    function loadAvatar() {
      try {
        const saved = localStorage.getItem('readbuddy_user');
        if (saved) {
          const u = JSON.parse(saved);
          setUserAvatarUrl(u.avatar_url || null);
        }
      } catch (e) {}
    }
    loadAvatar();
    window.addEventListener('readbuddy_user_updated', loadAvatar);
    return () => window.removeEventListener('readbuddy_user_updated', loadAvatar);
  }, []);

  // Auto-prompt onboarding tour on first login for new users
  useEffect(() => {
    try {
      const tourKey = `readbuddy_tour_${role}`;
      const completed = localStorage.getItem(tourKey);
      if (!completed) {
        const timer = setTimeout(() => setShowTourModal(true), 600);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, [role]);

  // Scroll to top on section change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  return (
    <div className="min-h-screen flex rb-notebook-bg">
      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed sm:sticky sm:top-0 sm:h-screen inset-y-0 left-0 z-30 w-64 shrink-0 flex flex-col justify-between transition-transform duration-300 ease-out rb-sidebar ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Brand Header — Clicking Logo returns to Dashboard Overview */}
          <div className="px-5 py-5 flex items-center justify-between shrink-0">
            <div
              onClick={() => {
                onSectionChange('overview');
                setMobileNavOpen(false);
              }}
              className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
              title="Return to Dashboard Overview"
            >
              <ReadBuddyLogo variant="header" size="md" />
            </div>
            <button
              className="sm:hidden text-[#FBF7EE] hover:text-white transition-colors p-1 cursor-pointer"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Role badge */}
          <div className="px-5 mb-4 shrink-0">
            <span
              className="inline-block px-3 py-1 rounded-full text-[11px] border border-black/15 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.12)]"
              style={{
                fontFamily: FONT_MONO,
                background: theme.badge,
                color: theme.badgeFg,
                fontWeight: 700,
              }}
            >
              {theme.label.toUpperCase()} PORTAL
            </span>
          </div>

          {/* Navigation Items (Soft-Neobrutalism) */}
          <nav className="px-3 flex-1 space-y-1">
            {nav.map((item) => {
              const active = item.key === activeSection;
              return (
                <button
                  key={item.key}
                  id={`tour-nav-${item.key}`}
                  data-tour={`nav-${item.key}`}
                  onClick={() => {
                    onSectionChange(item.key);
                    setMobileNavOpen(false);
                  }}
                  data-active={active}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150 cursor-pointer"
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: active ? 700 : 500,
                    color: active ? '#1F4D3A' : 'rgba(251,247,238,0.78)',
                    background: active ? '#FFFDF8' : 'transparent',
                    border: active ? '2px solid #1F4D3A' : '2px solid transparent',
                    boxShadow: active ? '3px 3px 0px rgba(23,61,46,0.35)' : 'none',
                  }}
                >
                  <span className="opacity-90">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                  {item.key === 'notifications' && unreadNotifsCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#E8873A] text-white border border-[#1F4D3A] shadow-[1px_1px_0px_#1F4D3A] font-mono leading-tight">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User section (Locked at bottom) */}
        <div
          className="p-4 m-3 rounded-2xl shrink-0 bg-black/20 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-2.5">
            <Avatar name={userName} accent={theme.accent} size={34} src={userAvatarUrl} />
            <div className="min-w-0 flex-1">
              <div
                className="text-xs font-bold truncate"
                style={{ fontFamily: FONT_SANS, color: CREAM }}
              >
                {userName}
              </div>
              <span className="text-[10px] text-white/50 font-mono">SMCC Nasipit</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-red-900/30 text-white/70 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer border border-white/10"
            style={{ fontFamily: FONT_SANS }}
          >
            {IconLogout}
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-20 sm:hidden transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ─── Main Content Canvas ─── */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <header
          className="sm:hidden flex items-center justify-between px-3 py-2.5 rb-sidebar gap-2"
        >
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="text-[#FBF7EE] p-1.5 cursor-pointer"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div
              onClick={() => {
                onSectionChange('overview');
                setMobileNavOpen(false);
              }}
              className="cursor-pointer"
              title="Return to Dashboard Overview"
            >
              <ReadBuddyLogo variant="header" size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationNav
              role={role}
              onSectionChange={onSectionChange}
              variant="mobile"
              userId={userId}
            />
            <span className="text-[11px] px-2 py-1 rounded-md font-mono font-bold bg-white/15 text-white shrink-0">
              {theme.label}
            </span>
          </div>
        </header>

        {/* Breadcrumb Header Bar, Notification Nav & Quick Guide Button */}
        <div className="hidden sm:flex items-center justify-between px-8 pt-6 pb-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#FFFDF8] border border-[#DED2B4] shadow-[2px_2px_0px_rgba(31,77,58,0.06)] text-xs" style={{ fontFamily: FONT_SANS }}>
            <button
              onClick={() => onSectionChange('overview')}
              className="text-gray-500 font-medium hover:text-[#1F4D3A] hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors"
            >
              {theme.label} Dashboard
            </button>
            <span style={{ color: TAN_BORDER }}>›</span>
            <span style={{ fontWeight: 700, color: CHALK_GREEN }}>
              {SECTION_TITLES[activeSection] || activeSection}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <NotificationNav
              role={role}
              onSectionChange={onSectionChange}
              variant="desktop"
              userId={userId}
            />
            <button
              id="tour-quick-guide"
              data-tour="quick-guide"
              onClick={() => setShowTourModal(true)}
              className="px-3 py-1 rounded-xl bg-[#FFFDF8] hover:bg-[#FCEDDE] text-[#1F4D3A] font-bold text-xs font-sans border-2 border-[#1F4D3A] shadow-[2px_2px_0px_#1F4D3A] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1F4D3A] transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open interactive mascot guide"
            >
              <BookOpen className="w-3.5 h-3.5" strokeWidth={2.25} />
              <span>Quick Guide</span>
            </button>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-5 sm:px-8 py-6 sm:py-8">
          <div key={activeSection} className="rb-fade-in-up">
            {children}
          </div>
        </main>
      </div>

      {/* ─── Interactive Live-Spotlight Feature Tour ─── */}
      <InteractiveFeatureTour
        open={showTourModal}
        role={role}
        userName={userName}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onClose={() => {
          setShowTourModal(false);
          try {
            localStorage.setItem(`readbuddy_tour_${role}`, 'completed');
          } catch (e) {}
        }}
      />
    </div>
  );
}
