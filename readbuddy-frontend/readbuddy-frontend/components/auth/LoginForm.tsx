'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export type UserRole = 'student' | 'teacher' | 'admin';
type LoginPortal = 'student' | 'teacher';

interface LoginFormProps {
  onOpenTeacherRegister: () => void;
  onOpenStudentRegister: () => void;
}

const PORTAL_DETAILS: Record<LoginPortal, {
  name: string;
  redirectUrl: string;
}> = {
  student: {
    name: 'Student Portal',
    redirectUrl: '/student',
  },
  teacher: {
    name: 'Teacher Portal',
    redirectUrl: '/teacher',
  },
};

const PORTAL_MISMATCH: Record<LoginPortal, string> = {
  student: 'Teacher accounts cannot sign in through the Student portal. Switch to the Teacher tab.',
  teacher: 'Student accounts cannot sign in through the Teacher portal. Switch to the Student tab.',
};

function portalMismatchMessage(accountRole: string, selectedPortal: LoginPortal): string {
  if (accountRole === 'teacher' && selectedPortal === 'student') {
    return PORTAL_MISMATCH.student;
  }
  if (accountRole === 'student' && selectedPortal === 'teacher') {
    return PORTAL_MISMATCH.teacher;
  }
  return `This account cannot sign in through the ${PORTAL_DETAILS[selectedPortal].name}.`;
}

function findRegisteredAccount(identifier: string): any | null {
  try {
    const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
    const trimmedId = identifier.trim();
    const lowerId = trimmedId.toLowerCase();

    const direct = accountsMap[trimmedId] || accountsMap[lowerId];
    if (direct) return direct;

    const allAccounts = Object.values(accountsMap) as any[];
    return allAccounts.find(
      (acc) =>
        acc.username?.toLowerCase() === lowerId ||
        acc.email?.toLowerCase() === lowerId ||
        acc.school_id?.toLowerCase() === lowerId ||
        acc.display_name?.toLowerCase() === lowerId
    ) || null;
  } catch {
    return null;
  }
}

export function LoginForm({ onOpenTeacherRegister, onOpenStudentRegister }: LoginFormProps) {
  const router = useRouter();
  const [selectedPortal, setSelectedPortal] = useState<LoginPortal>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const portalConfig = PORTAL_DETAILS[selectedPortal];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identifier.trim() || !password) {
      setError('Please enter your login credentials.');
      return;
    }

    setLoading(true);

    const localAccount = findRegisteredAccount(identifier);
    if (localAccount?.role && localAccount.role !== selectedPortal) {
      setError(portalMismatchMessage(localAccount.role, selectedPortal));
      setLoading(false);
      return;
    }

    try {
      const endpoint = selectedPortal === 'teacher' ? '/api/auth/teacher/login' : '/api/auth/student/login';
      const bodyPayload = selectedPortal === 'teacher'
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

      const apiDetail = typeof data.detail === 'string' ? data.detail : '';

      if (res.status === 403 && apiDetail) {
        setError(apiDetail);
        setLoading(false);
        return;
      }

      if (res.ok) {
        const apiRole = data.role || selectedPortal;
        if (apiRole !== selectedPortal) {
          setError(portalMismatchMessage(apiRole, selectedPortal));
          setLoading(false);
          return;
        }

        const cleanIdent = identifier.trim().replace(/_\d+$/, '').replace(/\d+$/, '');
        const displayName = data.display_name || cleanIdent.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const trimmedIdent = identifier.trim();
        const emailFromResponse = data.email || (trimmedIdent.includes('@') ? trimmedIdent : `${trimmedIdent}@smccnasipit.edu.ph`);
        const sessionData = {
          display_name: displayName,
          username: data.username || trimmedIdent.split('@')[0],
          email: emailFromResponse,
          role: selectedPortal,
          password: password,
        };
        localStorage.setItem('readbuddy_user', JSON.stringify(sessionData));

        setTimeout(() => {
          setLoading(false);
          router.push(portalConfig.redirectUrl);
        }, 400);
        return;
      }
    } catch (err) {}

    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');

      const trimmedId = identifier.trim();
      const lowerId = trimmedId.toLowerCase();
      const matchedAccount = localAccount;

      if (!matchedAccount) {
        setError(
          selectedPortal === 'teacher'
            ? 'Incorrect school ID, email, or password.'
            : 'Incorrect username, email, or password.'
        );
        setLoading(false);
        return;
      }

      if (matchedAccount.role && matchedAccount.role !== selectedPortal) {
        setError(portalMismatchMessage(matchedAccount.role, selectedPortal));
        setLoading(false);
        return;
      }

      const registeredPassword = passwordsMap[trimmedId] || passwordsMap[lowerId] || matchedAccount.password || null;

      if (registeredPassword && password !== registeredPassword) {
        setError('Incorrect password. Please enter the correct password for your account.');
        setLoading(false);
        return;
      }

      let nameSeed = matchedAccount.display_name;
      if (!nameSeed) {
        const rawName = trimmedId.split('@')[0];
        const cleanName = rawName.replace(/_\d+$/, '').replace(/\d+$/, '').replace(/[._]/g, ' ');
        nameSeed = cleanName.replace(/\b\w/g, (c) => c.toUpperCase());
      }

      if (matchedAccount.role === 'teacher') {
        const isApproved = matchedAccount.admin_approved === true;
        if (!isApproved) {
          setError('Pending Admin Approval: Your teacher registration request is awaiting review by an SMCC Administrator. An administrator must approve your educator account before login.');
          setLoading(false);
          return;
        }
      }

      const sessionData = {
        display_name: nameSeed,
        username: matchedAccount.username || trimmedId.split('@')[0],
        email: trimmedId.includes('@') ? trimmedId : (matchedAccount.email || ''),
        school_id: matchedAccount.school_id || undefined,
        role: selectedPortal,
        password: password,
      };

      localStorage.setItem('readbuddy_user', JSON.stringify(sessionData));

      passwordsMap[trimmedId] = password;
      passwordsMap[sessionData.username] = password;
      if (sessionData.email) passwordsMap[sessionData.email] = password;
      localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));

      accountsMap[trimmedId] = { ...matchedAccount, ...sessionData };
      accountsMap[sessionData.username] = { ...matchedAccount, ...sessionData };
      if (sessionData.email) accountsMap[sessionData.email] = { ...matchedAccount, ...sessionData };
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      setTimeout(() => {
        setLoading(false);
        router.push(portalConfig.redirectUrl);
      }, 400);
      return;
    } catch (e) {}

    setError(
      selectedPortal === 'teacher'
        ? 'Incorrect school ID, email, or password.'
        : 'Incorrect username, email, or password.'
    );
    setLoading(false);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="rb-fade-in-up">
        <div className={styles.roleTabs} role="tablist" aria-label="Sign in as">
          <button
            type="button"
            role="tab"
            aria-selected={selectedPortal === 'student'}
            className={`${styles.roleTab} ${selectedPortal === 'student' ? styles.roleTabActive : ''}`}
            onClick={() => setSelectedPortal('student')}
          >
            Student
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedPortal === 'teacher'}
            className={`${styles.roleTab} ${selectedPortal === 'teacher' ? styles.roleTabActive : ''}`}
            onClick={() => setSelectedPortal('teacher')}
          >
            Teacher
          </button>
        </div>

        <p className={styles.portalHint}>Accessing {portalConfig.name}</p>

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
        >
          {loading ? 'Signing in...' : `Sign In to ${portalConfig.name}`}
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
