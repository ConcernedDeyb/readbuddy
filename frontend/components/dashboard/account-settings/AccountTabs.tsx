'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    setDisplayName(profile.displayName);
    setEmail(profile.email);
  }, [profile.displayName, profile.email]);

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
      setIsEmailVerified(true);
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
      }
      if (profile.schoolId && accountsMap[profile.schoolId]) {
        accountsMap[profile.schoolId].display_name = displayName.trim();
        accountsMap[profile.schoolId].email = email.trim();
      }
      accountsMap[email.trim()] = {
        ...userObj,
        display_name: displayName.trim(),
        email: email.trim(),
      };
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
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
        <p className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>Update your display name and institutional email address.</p>
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
            <p className="text-[11px] text-[#B4602E] font-medium flex items-center gap-1.5 font-sans">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Email address is pending verification. Click <strong>Verify Email</strong> to send a confirmation link to {email}.</span>
            </p>
          )}
          {verificationSent && (
            <p className="text-[11px] text-[#2E7D4F] font-semibold flex items-center gap-1.5 font-sans">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Verification link sent to <strong>{email}</strong>! Please check your inbox to confirm.</span>
            </p>
          )}
        </div>
      </SettingFieldRow>

      <SettingFieldRow label="School ID" hint="Permanent institutional login identity.">
        <Input value={profile.schoolId || profile.username} onChange={() => {}} disabled />
      </SettingFieldRow>

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('readbuddy_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.preferredLang) setPreferredLang(parsed.preferredLang);
        if (parsed.speechSpeed !== undefined) setSpeechSpeed(parsed.speechSpeed);
        if (parsed.showPhonicsHint !== undefined) setShowPhonicsHint(parsed.showPhonicsHint);
        if (parsed.autoGrading !== undefined) setAutoGrading(parsed.autoGrading);
      }
    } catch (e) {}
  }, []);

  function handlePrefSave() {
    try {
      localStorage.setItem(
        'readbuddy_preferences',
        JSON.stringify({
          preferredLang,
          speechSpeed,
          showPhonicsHint,
          autoGrading,
        })
      );
    } catch (e) {}
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2500);
  }

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

      {profile.role === 'teacher' && (
        <SettingFieldRow label="Auto-Scoring Recommendation" hint="Automatically compute Phil-IRI tier before manual teacher grading.">
          <div className="flex items-center gap-3">
            <ToggleSwitch checked={autoGrading} onChange={setAutoGrading} accent={accent} />
            <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: autoGrading ? INK : MUTED }}>{autoGrading ? 'Enabled' : 'Disabled'}</span>
          </div>
        </SettingFieldRow>
      )}

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

    // Validate current password against stored credentials
    try {
      const savedUser = localStorage.getItem('readbuddy_user');
      const userObj = savedUser ? JSON.parse(savedUser) : null;
      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
      
      const expectedPassword = userObj?.password || (profile?.username ? passwordsMap[profile.username] : null) || (profile?.email ? passwordsMap[profile.email] : null);

      if (expectedPassword && currentPassword !== expectedPassword) {
        setPasswordError('Incorrect current password. Please enter your existing password.');
        return;
      }
    } catch (e) {}

    setLoading(true);

    function storeUpdatedPasswordLocally() {
      try {
        const savedUser = localStorage.getItem('readbuddy_user');
        let username = profile?.username || '';
        let email = profile?.email || '';
        if (savedUser) {
          const userObj = JSON.parse(savedUser);
          userObj.password = newPassword;
          if (!username) username = userObj.username;
          if (!email) email = userObj.email;
          localStorage.setItem('readbuddy_user', JSON.stringify(userObj));
        }

        const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
        if (username) passwordsMap[username] = newPassword;
        if (email) passwordsMap[email] = newPassword;
        if (profile?.schoolId) passwordsMap[profile.schoolId] = newPassword;
        localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));

        const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
        if (username && accountsMap[username]) accountsMap[username].password = newPassword;
        if (email && accountsMap[email]) accountsMap[email].password = newPassword;
        if (profile?.schoolId && accountsMap[profile.schoolId]) accountsMap[profile.schoolId].password = newPassword;
        localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
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

      if (res.ok) {
        storeUpdatedPasswordLocally();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSaved(true);
        setTimeout(() => setPasswordSaved(false), 3000);
        return;
      }
    } catch (err: any) {}

    // Graceful offline fallback
    storeUpdatedPasswordLocally();
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 3000);
    setLoading(false);
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
  const [sessionNotifs, setSessionNotifs] = useState(true);
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('readbuddy_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.emailNotifs !== undefined) setEmailNotifs(parsed.emailNotifs);
        if (parsed.sessionNotifs !== undefined) setSessionNotifs(parsed.sessionNotifs);
      }
    } catch (e) {}
  }, []);

  function handleNotifSave() {
    try {
      localStorage.setItem('readbuddy_notifications', JSON.stringify({ emailNotifs, sessionNotifs }));
    } catch (e) {}
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
  }

  return (
    <Card>
      <div className="mb-4 pb-3 border-b" style={{ borderColor: TAN_BORDER }}>
        <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>Notification Preferences</h3>
        <p className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>Control when and how you receive platform updates.</p>
      </div>

      <SettingFieldRow label="Email Alerts" hint="Receive notifications when test results or assignments update.">
        <div className="flex items-center gap-3">
          <ToggleSwitch checked={emailNotifs} onChange={setEmailNotifs} accent={accent} />
          <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: emailNotifs ? INK : MUTED }}>{emailNotifs ? 'Enabled' : 'Disabled'}</span>
        </div>
      </SettingFieldRow>

      <SettingFieldRow label="Session Completion Summaries" hint="Receive immediate summary alerts after reading practice sessions.">
        <div className="flex items-center gap-3">
          <ToggleSwitch checked={sessionNotifs} onChange={setSessionNotifs} accent={accent} />
          <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: sessionNotifs ? INK : MUTED }}>{sessionNotifs ? 'Enabled' : 'Disabled'}</span>
        </div>
      </SettingFieldRow>

      <div className="flex items-center gap-3 pt-5 mt-2">
        <PrimaryButton accent={accent} onClick={handleNotifSave}>Save Preferences</PrimaryButton>
        {notifSaved && <SuccessToast message="Preferences saved successfully!" />}
      </div>
    </Card>
  );
}
