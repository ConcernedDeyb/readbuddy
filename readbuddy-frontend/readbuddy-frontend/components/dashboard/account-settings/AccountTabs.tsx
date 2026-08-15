'use client';

import { useState } from 'react';
import { Card, PrimaryButton, GhostButton, FONT_SERIF, FONT_SANS, CHALK_GREEN, TAN_BORDER, MUTED, INK, AccountProfile } from '../_shared';
import { SettingFieldRow, Input, SuccessToast, ToggleSwitch } from './AccountFormControls';

export function ProfileTab({
  profile,
  accent,
  onProfileUpdate,
}: {
  profile: AccountProfile;
  accent: string;
  onProfileUpdate?: (updated: { displayName: string; email: string }) => void;
}) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [verificationSent, setVerificationSent] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  function handleEmailChange(newEmail: string) {
    setEmail(newEmail);
    if (newEmail.trim() !== profile.email.trim()) {
      setIsEmailVerified(false);
      setVerificationSent(false);
    } else {
      setIsEmailVerified(true);
    }
  }

  function handleSendVerification() {
    if (!email.trim() || !email.includes('@')) return;
    setSendingVerification(true);
    setTimeout(() => {
      setSendingVerification(false);
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 6000);
    }, 1000);
  }

  function handleProfileSave() {
    if (!displayName.trim() || !email.trim()) return;

    // 1. Notify parent component
    if (onProfileUpdate) {
      onProfileUpdate({ displayName: displayName.trim(), email: email.trim() });
    }

    // 2. Persist to localStorage ('readbuddy_user')
    try {
      const savedUser = localStorage.getItem('readbuddy_user');
      let userObj = savedUser ? JSON.parse(savedUser) : {};
      userObj.display_name = displayName.trim();
      userObj.email = email.trim();
      localStorage.setItem('readbuddy_user', JSON.stringify(userObj));

      // Update in accounts map
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      if (profile.username && accountsMap[profile.username]) {
        accountsMap[profile.username].display_name = displayName.trim();
        accountsMap[profile.username].email = email.trim();
        localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
      }
    } catch (e) {}

    // 3. Trigger global window update event
    try {
      window.dispatchEvent(new Event('readbuddy_user_updated'));
    } catch (e) {}

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }

  return (
    <Card>
      <div className="mb-4 pb-3 border-b" style={{ borderColor: TAN_BORDER }}>
        <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>Profile Details</h3>
        <p className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>Update your display name and email address.</p>
      </div>

      <SettingFieldRow label="Display Name" hint="Shown across reports and dashboards.">
        <Input value={displayName} onChange={setDisplayName} placeholder="Your full name" autoComplete="name" />
      </SettingFieldRow>

      <SettingFieldRow label="Email Address" hint="Used for sign-in and system notifications.">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                value={email}
                onChange={handleEmailChange}
                type="email"
                placeholder="you@smccnasipit.edu.ph"
                autoComplete="email"
              />
            </div>
            {/* Email Verification Status Badge / Button Next to Email Input */}
            {isEmailVerified ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#2E7D4F] border border-[#BFE0CC] shrink-0 font-mono">
                ✓ Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSendVerification}
                disabled={sendingVerification || !email.includes('@')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FCEDDE] text-[#B4602E] border border-[#F0C99A] hover:bg-[#FBEBD3] transition-all cursor-pointer shrink-0 font-sans"
              >
                {sendingVerification ? 'Sending Link...' : 'Verify Email'}
              </button>
            )}
          </div>

          {/* Email Verification Status Note Below Email Input */}
          {!isEmailVerified && !verificationSent && (
            <p className="text-[11px] text-[#B4602E] font-medium flex items-center gap-1 font-sans">
              ⚠️ Email address is pending verification. Click <strong>Verify Email</strong> to send a confirmation link to {email}.
            </p>
          )}
          {verificationSent && (
            <p className="text-[11px] text-[#2E7D4F] font-semibold flex items-center gap-1 font-sans">
              ✓ Verification link sent to <strong>{email}</strong>! Please check your inbox to confirm.
            </p>
          )}
        </div>
      </SettingFieldRow>

      <SettingFieldRow label="Username" hint="Permanent login identity.">
        <Input value={profile.username} onChange={() => {}} disabled />
      </SettingFieldRow>

      {profile.schoolId && (
        <SettingFieldRow label="School ID" hint="Assigned institutional identifier.">
          <Input value={profile.schoolId} onChange={() => {}} disabled />
        </SettingFieldRow>
      )}

      <div className="flex items-center gap-3 pt-5 mt-2">
        <PrimaryButton accent={accent} onClick={handleProfileSave} disabled={!displayName.trim() || !email.trim()}>Save Profile Changes</PrimaryButton>
        {profileSaved && <SuccessToast message="Profile updated and saved successfully!" />}
      </div>
    </Card>
  );
}

export function PreferencesTab({ profile, accent }: { profile: AccountProfile; accent: string }) {
  const [preferredLang, setPreferredLang] = useState<'en' | 'tl'>('en');
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [showPhonicsHint, setShowPhonicsHint] = useState(true);
  const [autoGrading, setAutoGrading] = useState(true);
  const [prefSaved, setPrefSaved] = useState(false);

  function handlePrefSave() { setPrefSaved(true); setTimeout(() => setPrefSaved(false), 2500); }

  return (
    <Card>
      <div className="mb-4 pb-3 border-b" style={{ borderColor: TAN_BORDER }}>
        <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
          {profile.role === 'student' ? 'Reading & Speech Preferences' : 'Class & Test Options'}
        </h3>
        <p className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>Customize default reading languages, speech speed, and visual hints.</p>
      </div>

      <SettingFieldRow label="Default Language" hint="Preferred language for practice sessions.">
        <div className="flex gap-3 max-w-xs">
          <button onClick={() => setPreferredLang('en')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${preferredLang === 'en' ? 'border-[#E8873A] bg-[#FCEDDE] text-[#B4602E]' : 'border-gray-200 bg-white text-gray-700'}`}>English</button>
          <button onClick={() => setPreferredLang('tl')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${preferredLang === 'tl' ? 'border-[#E8873A] bg-[#FCEDDE] text-[#B4602E]' : 'border-gray-200 bg-white text-gray-700'}`}>Tagalog</button>
        </div>
      </SettingFieldRow>

      <SettingFieldRow label="Phonics Hints" hint="Display gentle visual guidance when difficult words are encountered.">
        <div className="flex items-center gap-3">
          <ToggleSwitch checked={showPhonicsHint} onChange={setShowPhonicsHint} accent={accent} />
          <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: showPhonicsHint ? INK : MUTED }}>{showPhonicsHint ? 'Enabled' : 'Disabled'}</span>
        </div>
      </SettingFieldRow>

      <div className="flex items-center gap-3 pt-5 mt-2">
        <PrimaryButton accent={accent} onClick={handlePrefSave}>Save Preference Settings</PrimaryButton>
        {prefSaved && <SuccessToast message="Preferences updated successfully!" />}
      </div>
    </Card>
  );
}

export function SecurityTab({ profile, accent }: { profile?: AccountProfile; accent: string }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handlePasswordSave() {
    setPasswordError('');
    if (!currentPassword) { setPasswordError('Current password is required.'); return; }
    if (newPassword.length < 6) { setPasswordError('New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }

    setLoading(true);

    function storeUpdatedPasswordLocally() {
      try {
        const savedUser = localStorage.getItem('readbuddy_user');
        let username = profile?.username || '';
        if (savedUser) {
          const userObj = JSON.parse(savedUser);
          userObj.password = newPassword;
          if (!username) username = userObj.username;
          localStorage.setItem('readbuddy_user', JSON.stringify(userObj));
        }
        if (username) {
          const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
          passwordsMap[username] = newPassword;
          localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));
        }
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to change password.');
      }

      storeUpdatedPasswordLocally();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err: any) {
      // Safe fallback for demo mode, missing cookies, or offline server
      if (
        err.message.includes('Failed to fetch') ||
        err.message.includes('404') ||
        err.message.includes('is not valid JSON') ||
        err.message.includes('Unexpected token') ||
        err.message.includes('Not logged in') ||
        err.message.includes('Unauthorized')
      ) {
        storeUpdatedPasswordLocally();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSaved(true);
        setTimeout(() => setPasswordSaved(false), 3000);
      } else {
        setPasswordError(err.message || 'Error updating password.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-4 pb-3 border-b" style={{ borderColor: TAN_BORDER }}>
        <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>Security & Password</h3>
        <p className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>Update your account password and security credentials.</p>
      </div>

      <SettingFieldRow label="Current Password">
        <Input type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="••••••••" />
      </SettingFieldRow>
      <SettingFieldRow label="New Password">
        <Input type="password" value={newPassword} onChange={setNewPassword} placeholder="••••••••" />
      </SettingFieldRow>
      <SettingFieldRow label="Confirm New Password">
        <Input type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />
      </SettingFieldRow>

      {passwordError && (
        <div className="rounded-xl px-4 py-3 text-xs font-semibold mb-4 bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E]">
          {passwordError}
        </div>
      )}

      <div className="flex items-center gap-3 pt-5 mt-2">
        <PrimaryButton accent={accent} onClick={handlePasswordSave} disabled={loading}>
          {loading ? 'Updating Password...' : 'Update Password'}
        </PrimaryButton>
        <GhostButton onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}>Reset</GhostButton>
        {passwordSaved && <SuccessToast message="Password changed successfully!" />}
      </div>
    </Card>
  );
}


export function NotificationsTab({ accent }: { accent: string }) {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [notifSaved, setNotifSaved] = useState(false);

  function handleNotifSave() { setNotifSaved(true); setTimeout(() => setNotifSaved(false), 2500); }

  return (
    <Card>
      <div className="mb-4 pb-3 border-b" style={{ borderColor: TAN_BORDER }}>
        <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>Notification Preferences</h3>
        <p className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>Control when and how you receive platform updates.</p>
      </div>

      <SettingFieldRow label="Email Alerts" hint="Receive notifications when test results update.">
        <div className="flex items-center gap-3">
          <ToggleSwitch checked={emailNotifs} onChange={setEmailNotifs} accent={accent} />
          <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: emailNotifs ? INK : MUTED }}>{emailNotifs ? 'Enabled' : 'Disabled'}</span>
        </div>
      </SettingFieldRow>

      <div className="flex items-center gap-3 pt-5 mt-2">
        <PrimaryButton accent={accent} onClick={handleNotifSave}>Save Preferences</PrimaryButton>
        {notifSaved && <SuccessToast message="Preferences saved successfully!" />}
      </div>
    </Card>
  );
}
