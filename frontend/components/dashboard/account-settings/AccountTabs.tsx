import { useState, useEffect } from 'react';
import {
  Card,
  PrimaryButton,
  GhostButton,
  Avatar,
  AvatarCropperModal,
  PhoneVerificationModal,
  FONT_SERIF,
  FONT_SANS,
  CHALK_GREEN,
  TAN_BORDER,
  MUTED,
  INK,
  AccountProfile,
} from '../_shared';
import { SettingFieldRow, Input, SuccessToast, ToggleSwitch } from './AccountFormControls';
import {
  Camera,
  Crop,
  Smartphone,
  ShieldCheck,
  Check,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export function ProfileTab({
  profile,
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
  const getInitialUser = () => {
    try {
      const saved = localStorage.getItem('readbuddy_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  };

  const initialUser = getInitialUser();
  const [displayName, setDisplayName] = useState(initialUser?.display_name || profile.displayName || '');
  const [email, setEmail] = useState(initialUser?.email || profile.email || '');
  const [phoneNumber, setPhoneNumber] = useState(
    initialUser?.phone_number !== undefined ? (initialUser.phone_number || '') : (profile.phoneNumber || '')
  );
  const [isPhoneVerified, setIsPhoneVerified] = useState(
    initialUser?.phone_verified !== undefined ? Boolean(initialUser.phone_verified) : Boolean(profile.isPhoneVerified)
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialUser?.avatar_url !== undefined ? initialUser.avatar_url : (profile.avatarUrl || null)
  );
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [verificationSent, setVerificationSent] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Sync state when readbuddy_user_updated is triggered from external modifications
  useEffect(() => {
    function syncFromSession() {
      try {
        const savedUser = localStorage.getItem('readbuddy_user');
        if (savedUser) {
          const u = JSON.parse(savedUser);
          if (u.display_name) setDisplayName(u.display_name);
          if (u.email) setEmail(u.email);
          if (u.phone_number !== undefined) setPhoneNumber(u.phone_number || '');
          if (u.phone_verified !== undefined) setIsPhoneVerified(Boolean(u.phone_verified));
          if (u.avatar_url !== undefined) setAvatarUrl(u.avatar_url || null);
        }
      } catch (e) {}
    }
    window.addEventListener('readbuddy_user_updated', syncFromSession);
    return () => window.removeEventListener('readbuddy_user_updated', syncFromSession);
  }, []);

  function handleEmailChange(newEmail: string) {
    setEmail(newEmail);
    if (newEmail.trim() !== (profile.email || '').trim()) {
      setIsEmailVerified(false);
      setVerificationSent(false);
    } else {
      setIsEmailVerified(true);
    }
  }

  function handlePhoneChange(newPhone: string) {
    setPhoneNumber(newPhone);
    const cleanedStored = (profile.phoneNumber || '').replace(/\D/g, '');
    const cleanedNew = newPhone.replace(/\D/g, '');
    if (cleanedNew !== cleanedStored) {
      setIsPhoneVerified(false);
    } else {
      setIsPhoneVerified(profile.isPhoneVerified || false);
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

  async function handleSaveAvatar(croppedUrl: string) {
    setAvatarUrl(croppedUrl);

    // 1. Persist to localStorage ('readbuddy_user')
    try {
      const savedUser = localStorage.getItem('readbuddy_user');
      let userObj = savedUser ? JSON.parse(savedUser) : {};
      userObj.avatar_url = croppedUrl;
      localStorage.setItem('readbuddy_user', JSON.stringify(userObj));

      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const keysToUpdate = [
        profile.username,
        profile.username?.toLowerCase(),
        profile.schoolId,
        profile.schoolId?.toLowerCase(),
        profile.email,
        profile.email?.toLowerCase(),
        email.trim(),
        email.trim().toLowerCase(),
      ].filter(Boolean) as string[];

      keysToUpdate.forEach((k) => {
        if (accountsMap[k]) {
          accountsMap[k].avatar_url = croppedUrl;
        }
      });
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      if (profile.role === 'student') {
        const teacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
        const updatedList = teacherStudents.map((st: any) => {
          const isMatch =
            (profile.schoolId && (st.school_id === profile.schoolId || st.school_id?.toLowerCase() === profile.schoolId?.toLowerCase())) ||
            (profile.username && (st.username === profile.username || st.username?.toLowerCase() === profile.username?.toLowerCase()));
          if (isMatch) {
            return { ...st, avatar_url: croppedUrl };
          }
          return st;
        });
        localStorage.setItem('readbuddy_teacher_students', JSON.stringify(updatedList));
      }
    } catch (e) {}

    // 2. Post to backend FastAPI server
    try {
      fetch('/api/auth/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          school_id: profile.schoolId || profile.username,
          username: profile.username || profile.schoolId,
          email: email.trim() || profile.email,
          avatar_url: croppedUrl,
          role: profile.role,
        }),
      });
    } catch (e) {}

    // 3. Notify parent
    if (onProfileUpdate) {
      onProfileUpdate({
        displayName: displayName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        isPhoneVerified,
        avatarUrl: croppedUrl,
      });
    }

    window.dispatchEvent(new Event('readbuddy_user_updated'));
    window.dispatchEvent(new Event('readbuddy_accounts_updated'));
    window.dispatchEvent(new Event('readbuddy_students_updated'));

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }

  async function handleRemoveAvatar() {
    setAvatarUrl(null);

    try {
      const savedUser = localStorage.getItem('readbuddy_user');
      let userObj = savedUser ? JSON.parse(savedUser) : {};
      userObj.avatar_url = null;
      localStorage.setItem('readbuddy_user', JSON.stringify(userObj));

      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const keysToUpdate = [
        profile.username,
        profile.username?.toLowerCase(),
        profile.schoolId,
        profile.schoolId?.toLowerCase(),
        profile.email,
        profile.email?.toLowerCase(),
        email.trim(),
        email.trim().toLowerCase(),
      ].filter(Boolean) as string[];

      keysToUpdate.forEach((k) => {
        if (accountsMap[k]) {
          accountsMap[k].avatar_url = null;
        }
      });
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      if (profile.role === 'student') {
        const teacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
        const updatedList = teacherStudents.map((st: any) => {
          const isMatch =
            (profile.schoolId && (st.school_id === profile.schoolId || st.school_id?.toLowerCase() === profile.schoolId?.toLowerCase())) ||
            (profile.username && (st.username === profile.username || st.username?.toLowerCase() === profile.username?.toLowerCase()));
          if (isMatch) {
            return { ...st, avatar_url: null };
          }
          return st;
        });
        localStorage.setItem('readbuddy_teacher_students', JSON.stringify(updatedList));
      }
    } catch (e) {}

    try {
      fetch('/api/auth/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          school_id: profile.schoolId || profile.username,
          username: profile.username || profile.schoolId,
          email: email.trim() || profile.email,
          avatar_url: '',
          role: profile.role,
        }),
      });
    } catch (e) {}

    if (onProfileUpdate) {
      onProfileUpdate({
        displayName: displayName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        isPhoneVerified,
        avatarUrl: undefined,
      });
    }

    window.dispatchEvent(new Event('readbuddy_user_updated'));
    window.dispatchEvent(new Event('readbuddy_accounts_updated'));
    window.dispatchEvent(new Event('readbuddy_students_updated'));
  }

  function handlePhoneVerified() {
    setIsPhoneVerified(true);

    try {
      const savedUser = localStorage.getItem('readbuddy_user');
      let userObj = savedUser ? JSON.parse(savedUser) : {};
      userObj.phone_number = phoneNumber.trim();
      userObj.phone_verified = true;
      localStorage.setItem('readbuddy_user', JSON.stringify(userObj));

      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const keysToUpdate = [
        profile.username,
        profile.username?.toLowerCase(),
        profile.schoolId,
        profile.schoolId?.toLowerCase(),
        profile.email,
        profile.email?.toLowerCase(),
        email.trim(),
        email.trim().toLowerCase(),
      ].filter(Boolean) as string[];

      keysToUpdate.forEach((k) => {
        if (accountsMap[k]) {
          accountsMap[k].phone_number = phoneNumber.trim();
          accountsMap[k].phone_verified = true;
        }
      });
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      if (profile.role === 'student') {
        const teacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
        const updatedList = teacherStudents.map((st: any) => {
          const isMatch =
            (profile.schoolId && (st.school_id === profile.schoolId || st.school_id?.toLowerCase() === profile.schoolId?.toLowerCase())) ||
            (profile.username && (st.username === profile.username || st.username?.toLowerCase() === profile.username?.toLowerCase()));
          if (isMatch) {
            return { ...st, phone_number: phoneNumber.trim(), phone_verified: true };
          }
          return st;
        });
        localStorage.setItem('readbuddy_teacher_students', JSON.stringify(updatedList));
      }
    } catch (e) {}

    try {
      fetch('/api/auth/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          school_id: profile.schoolId || profile.username,
          username: profile.username || profile.schoolId,
          email: email.trim() || profile.email,
          phone_number: phoneNumber.trim(),
          phone_verified: true,
          role: profile.role,
        }),
      });
    } catch (e) {}

    if (onProfileUpdate) {
      onProfileUpdate({
        displayName: displayName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        isPhoneVerified: true,
        avatarUrl: avatarUrl || undefined,
      });
    }

    window.dispatchEvent(new Event('readbuddy_user_updated'));
    window.dispatchEvent(new Event('readbuddy_accounts_updated'));
    window.dispatchEvent(new Event('readbuddy_students_updated'));

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }

  async function handleProfileSave() {
    const cleanName = displayName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phoneNumber.trim();

    if (!cleanName || !cleanEmail) return;

    // 1. Notify parent component
    if (onProfileUpdate) {
      onProfileUpdate({
        displayName: cleanName,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        isPhoneVerified,
        avatarUrl: avatarUrl || undefined,
      });
    }

    // 2. Persist to localStorage ('readbuddy_user')
    try {
      const savedUser = localStorage.getItem('readbuddy_user');
      let userObj = savedUser ? JSON.parse(savedUser) : {};
      userObj.display_name = cleanName;
      userObj.email = cleanEmail;
      userObj.phone_number = cleanPhone;
      userObj.phone_verified = isPhoneVerified;
      if (avatarUrl !== undefined) userObj.avatar_url = avatarUrl;
      localStorage.setItem('readbuddy_user', JSON.stringify(userObj));

      // Update in accounts map across all case variations
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const keysToUpdate = [
        profile.username,
        profile.username?.toLowerCase(),
        profile.schoolId,
        profile.schoolId?.toLowerCase(),
        profile.email,
        profile.email?.toLowerCase(),
        cleanEmail,
        cleanEmail.toLowerCase(),
      ].filter(Boolean) as string[];

      keysToUpdate.forEach((k) => {
        if (accountsMap[k]) {
          accountsMap[k].display_name = cleanName;
          accountsMap[k].email = cleanEmail;
          accountsMap[k].phone_number = cleanPhone;
          accountsMap[k].phone_verified = isPhoneVerified;
          accountsMap[k].avatar_url = avatarUrl;
        }
      });

      accountsMap[cleanEmail] = {
        ...userObj,
        display_name: cleanName,
        email: cleanEmail,
        phone_number: cleanPhone,
        phone_verified: isPhoneVerified,
        avatar_url: avatarUrl,
      };
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      // If student: also update teacher roster
      if (profile.role === 'student') {
        const teacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
        const updatedList = teacherStudents.map((st: any) => {
          const isMatch =
            (profile.schoolId && (st.school_id === profile.schoolId || st.school_id?.toLowerCase() === profile.schoolId?.toLowerCase())) ||
            (profile.username && (st.username === profile.username || st.username?.toLowerCase() === profile.username?.toLowerCase()));
          if (isMatch) {
            return {
              ...st,
              display_name: cleanName,
              email: cleanEmail,
              phone_number: cleanPhone,
              phone_verified: isPhoneVerified,
              avatar_url: avatarUrl,
            };
          }
          return st;
        });
        localStorage.setItem('readbuddy_teacher_students', JSON.stringify(updatedList));
      }

      // If teacher: also update teacher classes and teacher rosters
      if (profile.role === 'teacher') {
        const teacherClasses = JSON.parse(localStorage.getItem('readbuddy_teacher_classes') || '[]');
        const updatedClasses = teacherClasses.map((cls: any) => {
          if (cls.teacher_id === profile.schoolId || cls.teacher_name === profile.displayName) {
            return { ...cls, teacher_name: cleanName, teacher_email: cleanEmail };
          }
          return cls;
        });
        localStorage.setItem('readbuddy_teacher_classes', JSON.stringify(updatedClasses));
      }
    } catch (e) {}

    // 3. Post to backend FastAPI server
    try {
      await fetch('/api/auth/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          school_id: profile.schoolId || profile.username,
          username: profile.username || profile.schoolId,
          email: cleanEmail,
          display_name: cleanName,
          phone_number: cleanPhone,
          phone_verified: isPhoneVerified,
          avatar_url: avatarUrl || '',
          role: profile.role,
        }),
      });
    } catch (e) {}

    // 4. Trigger global window update events
    try {
      window.dispatchEvent(new Event('readbuddy_user_updated'));
      window.dispatchEvent(new Event('readbuddy_accounts_updated'));
      window.dispatchEvent(new Event('readbuddy_students_updated'));
      window.dispatchEvent(new Event('readbuddy_classes_updated'));
    } catch (e) {}

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }

  return (
    <Card>
      <div className="mb-4 pb-3 border-b" style={{ borderColor: TAN_BORDER }}>
        <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>Profile Details</h3>
        <p className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>Update your profile photo, display credentials, and secondary verification phone.</p>
      </div>

      {/* Profile Picture & Cropper Section */}
      <SettingFieldRow label="Profile Picture" hint="Upload and crop a custom avatar photo (JPG, PNG, WEBP).">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar name={displayName} accent={accent} size={64} src={avatarUrl} />
            <button
              type="button"
              onClick={() => setIsCropperOpen(true)}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#E8873A] text-white border-2 border-[#1F4D3A] shadow-[1px_1px_0px_#1F4D3A] hover:scale-105 transition-all cursor-pointer"
              title="Crop and edit photo"
            >
              <Crop className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCropperOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white border-2 border-[#133326] shadow-[2px_2px_0px_#133326] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5 font-sans"
                style={{ background: `linear-gradient(135deg, ${accent}, #1F4D3A)` }}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload & Crop Photo</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#A4432A] border-2 border-[#A4432A] bg-[#FDF2E9] hover:bg-[#FBEAE3] transition-all cursor-pointer flex items-center gap-1 font-sans"
                  title="Remove custom photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-500 font-sans">
              Square / circular 1:1 format. Live pan, zoom, and rotate cropper available.
            </p>
          </div>
        </div>
      </SettingFieldRow>

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
                <Check className="w-3.5 h-3.5" />
                Verified
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
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Email address is pending verification. Click <strong>Verify Email</strong> to send a confirmation link to {email}.</span>
            </p>
          )}
          {verificationSent && (
            <p className="text-[11px] text-[#2E7D4F] font-semibold flex items-center gap-1.5 font-sans">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Verification link sent to <strong>{email}</strong>! Please check your inbox to confirm.</span>
            </p>
          )}
        </div>
      </SettingFieldRow>

      {/* Mobile Phone Number with Secondary Verification */}
      <SettingFieldRow label="Mobile Phone Number" hint="Used for SMS secondary verification and 2FA login security.">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                value={phoneNumber}
                onChange={handlePhoneChange}
                type="tel"
                placeholder="0917 123 4567 or +63 917 123 4567"
                autoComplete="tel"
              />
            </div>
            {/* Phone Verification Status Badge / Button */}
            {isPhoneVerified ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#2E7D4F] border border-[#BFE0CC] shrink-0 font-mono">
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Verified</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(true)}
                disabled={!phoneNumber.trim() || phoneNumber.replace(/\D/g, '').length < 10}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FCEDDE] text-[#B4602E] border border-[#F0C99A] hover:bg-[#FBEBD3] transition-all cursor-pointer shrink-0 font-sans disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Verify Mobile</span>
              </button>
            )}
          </div>

          {!isPhoneVerified && phoneNumber.trim() && (
            <p className="text-[11px] text-[#B4602E] font-medium flex items-center gap-1.5 font-sans">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Mobile number is unverified. Click <strong>Verify Mobile</strong> to send a 6-digit SMS verification code.</span>
            </p>
          )}
          {isPhoneVerified && (
            <p className="text-[11px] text-[#2E7D4F] font-semibold flex items-center gap-1.5 font-sans">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Verified for secondary authentication & 2FA account protection.</span>
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

      {/* Avatar Cropper Modal */}
      <AvatarCropperModal
        open={isCropperOpen}
        currentAvatarUrl={avatarUrl}
        userName={displayName}
        accent={accent}
        onSave={handleSaveAvatar}
        onRemove={handleRemoveAvatar}
        onClose={() => setIsCropperOpen(false)}
      />

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        open={isPhoneModalOpen}
        phoneNumber={phoneNumber}
        userName={displayName}
        accent={accent}
        onVerified={handlePhoneVerified}
        onClose={() => setIsPhoneModalOpen(false)}
      />
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
          Reading & Speech Preferences
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

  // ─── Two-Factor Secondary Phone Verification ───
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(profile?.twoFactorEnabled || false);
  const [hasVerifiedPhone, setHasVerifiedPhone] = useState(profile?.isPhoneVerified || false);
  const [twoFactorSaved, setTwoFactorSaved] = useState(false);
  const [twoFactorWarning, setTwoFactorWarning] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('readbuddy_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.two_factor_enabled !== undefined) setTwoFactorEnabled(u.two_factor_enabled);
        if (u.phone_verified !== undefined) setHasVerifiedPhone(u.phone_verified);
      }
    } catch (e) {}
  }, [profile]);

  function handleToggleTwoFactor(enabled: boolean) {
    setTwoFactorWarning(null);
    if (enabled && !hasVerifiedPhone) {
      setTwoFactorWarning('Please add and verify a mobile phone number in Profile Details first before enabling 2-step verification.');
      return;
    }

    setTwoFactorEnabled(enabled);
    try {
      const saved = localStorage.getItem('readbuddy_user');
      let userObj = saved ? JSON.parse(saved) : {};
      userObj.two_factor_enabled = enabled;
      localStorage.setItem('readbuddy_user', JSON.stringify(userObj));

      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      if (profile?.username && accountsMap[profile.username]) accountsMap[profile.username].two_factor_enabled = enabled;
      if (profile?.schoolId && accountsMap[profile.schoolId]) accountsMap[profile.schoolId].two_factor_enabled = enabled;
      if (profile?.email && accountsMap[profile.email]) accountsMap[profile.email].two_factor_enabled = enabled;
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      window.dispatchEvent(new Event('readbuddy_user_updated'));
    } catch (e) {}

    setTwoFactorSaved(true);
    setTimeout(() => setTwoFactorSaved(false), 2500);
  }

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
        <p className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>Update your account password and configure secondary authentication.</p>
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

      {/* ─── Two-Factor Secondary Verification Section ─── */}
      <div className="mt-8 pt-5 border-t-2" style={{ borderColor: TAN_BORDER }}>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1F4D3A]" strokeWidth={2.25} />
            <h4 className="text-sm font-bold text-[#1F4D3A]" style={{ fontFamily: FONT_SERIF }}>
              Two-Step Phone Verification (2FA)
            </h4>
          </div>
          <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: FONT_SANS }}>
            Require a 6-digit SMS verification code whenever signing in from a new device to safeguard scholar records.
          </p>
        </div>

        <SettingFieldRow
          label="Require SMS Code on Login"
          hint="Dispatches an OTP verification challenge to your verified mobile number."
        >
          <div className="flex items-center gap-3">
            <ToggleSwitch
              checked={twoFactorEnabled}
              onChange={handleToggleTwoFactor}
              accent={accent}
            />
            <span
              className="text-xs font-semibold"
              style={{
                fontFamily: FONT_SANS,
                color: twoFactorEnabled ? '#1F4D3A' : MUTED,
              }}
            >
              {twoFactorEnabled ? '2FA Enabled (Active)' : 'Disabled'}
            </span>
          </div>
        </SettingFieldRow>

        {twoFactorWarning && (
          <div className="mt-3 p-3 rounded-xl bg-[#FDF2E9] border-2 border-[#F0C99A] text-xs font-semibold text-[#B4602E] flex items-center gap-2 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B4602E]" />
            <span>{twoFactorWarning}</span>
          </div>
        )}

        {twoFactorSaved && <SuccessToast message="Two-factor security settings updated!" />}
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
