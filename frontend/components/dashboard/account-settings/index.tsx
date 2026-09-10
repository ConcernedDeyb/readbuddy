'use client';

import { useState, useEffect } from 'react';
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
  onProfileUpdate?: (updated: {
    displayName: string;
    email: string;
    phoneNumber?: string;
    isPhoneVerified?: boolean;
    twoFactorEnabled?: boolean;
    avatarUrl?: string;
  }) => void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profile, setProfile] = useState<AccountProfile>(initialProfile);

  // Keep profile synchronized when parent updates or initialProfile changes
  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  // Keep synchronized with localStorage updates
  useEffect(() => {
    function reloadFromStorage() {
      try {
        const saved = localStorage.getItem('readbuddy_user');
        if (saved) {
          const u = JSON.parse(saved);
          setProfile((prev) => ({
            ...prev,
            displayName: u.display_name || prev.displayName,
            email: u.email || prev.email,
            phoneNumber: u.phone_number !== undefined ? (u.phone_number || '') : prev.phoneNumber,
            isPhoneVerified: u.phone_verified !== undefined ? Boolean(u.phone_verified) : prev.isPhoneVerified,
            twoFactorEnabled: u.two_factor_enabled !== undefined ? Boolean(u.two_factor_enabled) : prev.twoFactorEnabled,
            avatarUrl: u.avatar_url !== undefined ? (u.avatar_url || '') : prev.avatarUrl,
          }));
        }
      } catch (e) {}
    }
    window.addEventListener('readbuddy_user_updated', reloadFromStorage);
    return () => window.removeEventListener('readbuddy_user_updated', reloadFromStorage);
  }, []);

  function handleProfileUpdated(updated: {
    displayName: string;
    email: string;
    phoneNumber?: string;
    isPhoneVerified?: boolean;
    twoFactorEnabled?: boolean;
    avatarUrl?: string;
  }) {
    setProfile((prev) => ({
      ...prev,
      ...updated,
    }));
    if (onProfileUpdate) {
      onProfileUpdate(updated);
    }
  }

  useEffect(() => {
    if (activeTab === 'preferences' && profile.role !== 'student') {
      setActiveTab('profile');
    }
  }, [activeTab, profile.role]);

  const TABS: { id: SettingsTab; label: string }[] = [
    { id: 'profile', label: 'Profile Details' },
    ...(profile.role === 'student'
      ? [{ id: 'preferences' as SettingsTab, label: 'Reading & Speech' }]
      : []),
    { id: 'security', label: 'Security & Password' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <ErrorBoundary fallbackTitle="Account Settings Error">
      <div>
        <SectionHeader title="Account & Settings" subtitle="Manage your profile credentials, preferences, security, and notifications." accent={accent} />

        <Card className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={profile.displayName} accent={accent} size={54} src={profile.avatarUrl} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>{profile.displayName}</h2>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold" style={{ background: `${accent}15`, color: accent, fontFamily: FONT_MONO }}>{profile.role}</span>
              </div>
              <p className="text-xs mt-0.5" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                School ID: {profile.schoolId || profile.username} · {profile.email}
                {profile.phoneNumber && ` · ${profile.phoneNumber}`}
              </p>
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
            {activeTab === 'preferences' && profile.role === 'student' && (
              <PreferencesTab profile={profile} accent={accent} />
            )}
            {activeTab === 'security' && <SecurityTab profile={profile} accent={accent} />}
            {activeTab === 'notifications' && <NotificationsTab accent={accent} />}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
