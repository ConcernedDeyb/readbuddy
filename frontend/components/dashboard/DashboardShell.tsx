'use client';

import { ReactNode, useState, useEffect } from 'react';
import { FONT_SERIF, FONT_SANS, FONT_MONO, CREAM, MUTED, TAN_BORDER, CHALK_GREEN } from './_shared';

export type DashboardRole = 'teacher' | 'admin' | 'student';

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
};

/* ─── SVG Icons (inline, zero dependencies) ─── */

const IconHome = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconUsers = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconUser = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconBook = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IconSettings = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconFileText = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconClipboard = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="15" y2="16" />
  </svg>
);
const IconLogout = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const TEACHER_NAV: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: IconHome },
  { key: 'classes', label: 'Classes & Sections', icon: IconUsers },
  { key: 'students', label: 'My Students', icon: IconUser },
  { key: 'passages', label: 'My Passages', icon: IconBook },
  { key: 'tests', label: 'Reading Tests', icon: IconClipboard },
  { key: 'settings', label: 'Settings', icon: IconSettings },
];

const ADMIN_NAV: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: IconHome },
  { key: 'teachers', label: 'Teachers', icon: IconUsers },
  { key: 'students', label: 'Students', icon: IconUser },
  { key: 'content', label: 'Content', icon: IconFileText },
  { key: 'settings', label: 'System Settings', icon: IconSettings },
  { key: 'account', label: 'My Account', icon: IconUser },
];

const STUDENT_NAV: NavItem[] = [
  { key: 'overview', label: 'My Progress', icon: IconHome },
  { key: 'tests', label: 'Assigned Tests', icon: IconClipboard },
  { key: 'history', label: 'Reading History', icon: IconBook },
  { key: 'settings', label: 'Settings', icon: IconSettings },
];

const SECTION_TITLES: Record<string, string> = {
  overview: 'Overview',
  classes: 'Classes & Sections',
  students: 'Students',
  teachers: 'Teachers',
  passages: 'Passages',
  content: 'Content',
  settings: 'Settings',
  account: 'My Account',
  author: 'Author Passage',
  tests: 'Reading Tests',
  grading: 'Grading',
  history: 'Reading History',
  progress: 'My Progress',
};

/**
 * Shared dashboard shell for Teacher, Admin, and Student roles - distinct from
 * StepShell (the student's linear 5-step carousel), since dashboard work
 * is multi-section and persistent rather than a single guided sequence.
 */
export default function DashboardShell({
  role,
  activeSection,
  onSectionChange,
  userName,
  onLogout,
  children,
}: {
  role: DashboardRole;
  activeSection: string;
  onSectionChange: (section: string) => void;
  userName: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  const theme = ROLE_THEME[role];
  const nav = role === 'teacher' ? TEACHER_NAV : role === 'admin' ? ADMIN_NAV : STUDENT_NAV;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
          {/* Logo */}
          <div className="px-5 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBF7EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span
                className="text-lg tracking-tight"
                style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CREAM }}
              >
                ReadBuddy
              </span>
            </div>
            <button
              className="sm:hidden text-[#FBF7EE] hover:text-white transition-colors p-1"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Role badge */}
          <div className="px-5 mb-4 shrink-0">
            <span
              className="inline-block px-3 py-1 rounded-full text-[11px]"
              style={{
                fontFamily: FONT_MONO,
                background: theme.badge,
                color: theme.badgeFg,
                fontWeight: 700,
              }}
            >
              {theme.label.toUpperCase()}
            </span>
          </div>

          {/* Navigation */}
          <nav className="px-3 flex-1">
            {nav.map((item) => {
              const active = item.key === activeSection;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onSectionChange(item.key);
                    setMobileNavOpen(false);
                  }}
                  data-active={active}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl mb-1 flex items-center gap-3 transition-all duration-200 cursor-pointer hover:bg-white/10"
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#FFFDF8' : 'rgba(251,247,238,0.7)',
                    background: active ? 'rgba(251,247,238,0.14)' : 'transparent',
                  }}
                >
                  <span className="opacity-90">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User section - locked at bottom */}
        <div
          className="px-5 py-4 shrink-0"
          style={{ borderTop: '1px solid rgba(251,247,238,0.1)' }}
        >
          <div className="flex items-center gap-3 mb-2.5">
            <span
              className="rb-avatar"
              style={{
                width: 32,
                height: 32,
                fontSize: 12,
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}BB)`,
              }}
            >
              {userName
                .split(/\s+/)
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
            <div
              className="text-sm truncate"
              style={{ fontFamily: FONT_SANS, color: CREAM }}
            >
              {userName}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs transition-colors hover:text-white cursor-pointer"
            style={{
              fontFamily: FONT_SANS,
              color: 'rgba(251,247,238,0.5)',
            }}
          >
            {IconLogout}
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-20 sm:hidden transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ─── Main content ─── */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <header
          className="sm:hidden flex items-center gap-3 px-4 py-3 rb-sidebar"
        >
          <button
            onClick={() => setMobileNavOpen(true)}
            className="text-[#FBF7EE] p-1"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>📖</span>
            <span style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CREAM }}>
              ReadBuddy
            </span>
          </div>
        </header>

        {/* Breadcrumb bar */}
        <div className="hidden sm:block px-8 pt-6 pb-0">
          <div className="flex items-center gap-2 text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>
            <span>{theme.label} Dashboard</span>
            <span style={{ color: TAN_BORDER }}>›</span>
            <span style={{ fontWeight: 600, color: CHALK_GREEN }}>
              {SECTION_TITLES[activeSection] || activeSection}
            </span>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-5 sm:px-8 py-6 sm:py-8">
          <div key={activeSection} className="rb-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
