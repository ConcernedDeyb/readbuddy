'use client';

import { useState } from 'react';
import { SectionHeader, Card, Avatar, FONT_SANS, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN, TAN_BORDER, CREAM, AccountProfile, ErrorBoundary } from '../_shared';
import { ProfileTab, PreferencesTab, SecurityTab, NotificationsTab } from './AccountTabs';

type SettingsTab = 'profile' | 'preferences' | 'security' | 'notifications';

export default function AccountSettings({
  profile: initialProfile,
  accent,
  onProfileUpdate,
}: {
  profile: AccountProfile;
  accent: string;
  onProfileUpdate?: (updated: { displayName: string; email: string }) => void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profile, setProfile] = useState<AccountProfile>(initialProfile);

  function handleProfileUpdated(updated: { displayName: string; email: string }) {
    setProfile((prev) => ({
      ...prev,
      displayName: updated.displayName,
      email: updated.email,
    }));
    if (onProfileUpdate) {
      onProfileUpdate(updated);
    }
  }

  const TABS: { id: SettingsTab; label: string }[] = [
    { id: 'profile', label: 'Profile Details' },
    { id: 'preferences', label: profile.role === 'student' ? 'Reading & Speech' : 'Class & Test Options' },
    { id: 'security', label: 'Security & Password' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <ErrorBoundary fallbackTitle="Account Settings Error">
      <div>
        <SectionHeader title="Account & Settings" subtitle="Manage your profile credentials, preferences, security, and notifications." accent={accent} />

        <Card className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={profile.displayName} accent={accent} size={52} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>{profile.displayName}</h2>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold" style={{ background: `${accent}15`, color: accent, fontFamily: FONT_MONO }}>{profile.role}</span>
              </div>
              <p className="text-xs mt-0.5" style={{ fontFamily: FONT_MONO, color: MUTED }}>School ID: {profile.schoolId || profile.username} · {profile.email}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-1 shrink-0">
            <div className="flex flex-col gap-1 p-2 rounded-2xl border" style={{ background: CREAM, borderColor: TAN_BORDER }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-3.5 h-10 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer border"
                  style={{
                    fontFamily: FONT_SANS,
                    background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
                    color: activeTab === tab.id ? CHALK_GREEN : MUTED,
                    borderColor: activeTab === tab.id ? TAN_BORDER : 'transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            {activeTab === 'profile' && <ProfileTab profile={profile} accent={accent} onProfileUpdate={handleProfileUpdated} />}
            {activeTab === 'preferences' && <PreferencesTab profile={profile} accent={accent} />}
            {activeTab === 'security' && <SecurityTab profile={profile} accent={accent} />}
            {activeTab === 'notifications' && <NotificationsTab accent={accent} />}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
