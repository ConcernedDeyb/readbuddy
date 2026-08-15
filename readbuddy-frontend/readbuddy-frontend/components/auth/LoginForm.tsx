'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export type UserRole = 'student' | 'teacher' | 'admin';

interface LoginFormProps {
  onOpenTeacherRegister: () => void;
  onOpenStudentRegister: () => void;
}

export function detectRoleFromIdentifier(identifier: string): UserRole {
  const input = identifier.trim().toLowerCase();
  if (!input) return 'student';

  if (input.includes('admin') || input.startsWith('sys_') || input.includes('super')) {
    return 'admin';
  }

  if (
    input.includes('@smcc.edu.ph') ||
    input.startsWith('smcc-') ||
    input.includes('teacher') ||
    input.includes('santos') ||
    input.includes('cruz') ||
    input.includes('reyes')
  ) {
    return 'teacher';
  }

  return 'student';
}

const ROLE_DETAILS: Record<UserRole, {
  name: string;
  badgeBg: string;
  badgeFg: string;
  btnGradient: string;
  redirectUrl: string;
  icon: string;
}> = {
  student: {
    name: 'Student Portal',
    badgeBg: '#FBEBD3',
    badgeFg: '#8A5A16',
    btnGradient: 'linear-gradient(135deg, #E8873A, #F0A35C)',
    redirectUrl: '/student',
    icon: '📖',
  },
  teacher: {
    name: 'Teacher Portal',
    badgeBg: '#EBF3F8',
    badgeFg: '#3D6B8A',
    btnGradient: 'linear-gradient(135deg, #3D6B8A, #2C4E66)',
    redirectUrl: '/teacher',
    icon: '🧑‍🏫',
  },
  admin: {
    name: 'Administrator',
    badgeBg: '#F3EAF0',
    badgeFg: '#7A4A6B',
    btnGradient: 'linear-gradient(135deg, #7A4A6B, #5C3650)',
    redirectUrl: '/admin',
    icon: '⚙️',
  },
};

export function LoginForm({ onOpenTeacherRegister, onOpenStudentRegister }: LoginFormProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const detectedRole = useMemo(() => detectRoleFromIdentifier(identifier), [identifier]);
  const roleConfig = ROLE_DETAILS[detectedRole];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identifier.trim() || !password) {
      setError('Please enter your login credentials.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = detectedRole === 'teacher' ? '/api/auth/teacher/login' : '/api/auth/student/login';
      const bodyPayload = detectedRole === 'teacher'
        ? { school_id: identifier.trim(), password }
        : { username: identifier.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bodyPayload),
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (res.ok) {
        const cleanIdent = identifier.trim().replace(/_\d+$/, '').replace(/\d+$/, '');
        const displayName = data.display_name || cleanIdent.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const sessionData = {
          display_name: displayName,
          username: identifier.trim(),
          role: detectedRole,
          password: password,
        };
        localStorage.setItem('readbuddy_user', JSON.stringify(sessionData));

        setTimeout(() => {
          setLoading(false);
          router.push(roleConfig.redirectUrl);
        }, 400);
        return;
      }
    } catch (err) {}

    // Check local accounts registry fallback
    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');

      const trimmedId = identifier.trim();
      const lowerId = trimmedId.toLowerCase();

      // Search registered account by username or email
      let matchedAccount = accountsMap[trimmedId] || accountsMap[lowerId];
      if (!matchedAccount) {
        // Search values in accountsMap
        const allAccounts = Object.values(accountsMap) as any[];
        matchedAccount = allAccounts.find(
          (acc) =>
            acc.username?.toLowerCase() === lowerId ||
            acc.email?.toLowerCase() === lowerId ||
            acc.display_name?.toLowerCase() === lowerId
        );
      }

      const registeredPassword = passwordsMap[trimmedId] || passwordsMap[lowerId] || (matchedAccount ? matchedAccount.password : null);

      if (registeredPassword && password !== registeredPassword) {
        setError('Incorrect password. Please enter the correct password for your account.');
        setLoading(false);
        return;
      }

      // Format clean display name (e.g. darrieldave_abad@smccnasipit.edu.ph -> Darriel Dave Abad)
      let nameSeed = matchedAccount?.display_name;
      if (!nameSeed) {
        const rawName = trimmedId.split('@')[0];
        const cleanName = rawName.replace(/_\d+$/, '').replace(/\d+$/, '').replace(/[._]/g, ' ');
        nameSeed = cleanName.replace(/\b\w/g, (c) => c.toUpperCase());
      }

      const sessionData = {
        display_name: nameSeed,
        username: matchedAccount?.username || trimmedId.split('@')[0],
        email: trimmedId.includes('@') ? trimmedId : (matchedAccount?.email || ''),
        role: matchedAccount?.role || detectedRole,
        password: password,
      };

      localStorage.setItem('readbuddy_user', JSON.stringify(sessionData));
      
      // Update local registries with active credentials
      passwordsMap[trimmedId] = password;
      passwordsMap[sessionData.username] = password;
      if (sessionData.email) passwordsMap[sessionData.email] = password;
      localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));

      accountsMap[trimmedId] = sessionData;
      accountsMap[sessionData.username] = sessionData;
      if (sessionData.email) accountsMap[sessionData.email] = sessionData;
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      setTimeout(() => {
        setLoading(false);
        router.push(roleConfig.redirectUrl);
      }, 400);
      return;
    } catch (e) {}

    // Fallback login
    const rawName = identifier.trim().split('@')[0];
    const cleanName = rawName.replace(/_\d+$/, '').replace(/\d+$/, '').replace(/[._]/g, ' ');
    const displayName = cleanName.replace(/\b\w/g, (c) => c.toUpperCase());

    const sessionData = {
      display_name: displayName,
      username: identifier.trim().split('@')[0],
      email: identifier.trim().includes('@') ? identifier.trim() : '',
      role: detectedRole,
      password: password,
    };
    localStorage.setItem('readbuddy_user', JSON.stringify(sessionData));

    setTimeout(() => {
      setLoading(false);
      router.push(roleConfig.redirectUrl);
    }, 400);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="rb-fade-in-up">
        {/* RBAC Role Auto-Recognition Indicator */}
        <div className={styles.roleDetectorBadge}>
          <span className="text-xs font-sans text-gray-600 flex items-center gap-1.5">
            <span>{roleConfig.icon}</span>
            <span>Accessing Portal:</span>
          </span>
          <span
            className={styles.roleTag}
            style={{ background: roleConfig.badgeBg, color: roleConfig.badgeFg }}
          >
            {roleConfig.name}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E] text-xs font-sans">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#EBF3F8] border border-[#A8C5DA] text-[#3D6B8A] text-xs font-sans">
            {successMsg}
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label}>Account Identifier</label>
          <input
            type="text"
            placeholder="Username, Email, or School ID..."
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={styles.input}
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className={styles.formGroup}>
          <div className="flex justify-between items-center mb-1">
            <label className={styles.label} style={{ marginBottom: 0 }}>
              Password
            </label>
            <div className="flex items-center gap-2 text-xs font-sans font-semibold">
              <button
                type="button"
                onClick={onOpenStudentRegister}
                className="text-[#E8873A] hover:underline cursor-pointer"
              >
                New Student?
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={onOpenTeacherRegister}
                className="text-[#3D6B8A] hover:underline cursor-pointer"
              >
                New Teacher?
              </button>
            </div>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            autoComplete="current-password"
          />
          <div className="flex justify-end mt-1.5">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              className="text-xs font-sans font-semibold text-[#3D6B8A] hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
          style={{ background: roleConfig.btnGradient }}
        >
          {loading ? 'Authenticating Credentials...' : `Sign In to ${roleConfig.name}`}
        </button>
      </form>

      <ForgotPasswordModal
        open={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onSuccess={(msg) => setSuccessMsg(msg)}
      />
    </>
  );
}

