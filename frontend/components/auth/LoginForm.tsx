'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';
import { ForgotPasswordModal } from './ForgotPasswordModal';

import { apiFetch } from '@/lib/api';

export type UserRole = 'student' | 'teacher' | 'admin';
type LoginPortal = 'student' | 'teacher';

interface LoginFormProps {
  onOpenTeacherRegister: () => void;
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
  student: 'Teacher and Admin accounts cannot sign in through the Student portal.',
  teacher: 'Student and Admin accounts cannot sign in through the Teacher portal.',
};

function portalMismatchMessage(accountRole: string, selectedPortal: LoginPortal): string {
  if (accountRole !== selectedPortal) {
    return PORTAL_MISMATCH[selectedPortal];
  }
  return `This account cannot sign in through the ${PORTAL_DETAILS[selectedPortal].name}.`;
}


export function LoginForm({ onOpenTeacherRegister }: LoginFormProps) {
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

    try {
      let endpoint = '';
      let bodyPayload: any = {};
      
      if (selectedPortal === 'teacher') {
        endpoint = '/auth/teacher/login';
        bodyPayload = { school_id: identifier.trim(), password };
      } else if (selectedPortal === 'student') {
        endpoint = '/auth/student/login';
        bodyPayload = { username: identifier.trim(), password };
      }

      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(bodyPayload),
      });

      // If successful, save basic info to localStorage for UI state (name/role) 
      // actual auth is handled by HttpOnly cookie
      if (data && data.role) {
         localStorage.setItem('readbuddy_user', JSON.stringify({
            display_name: data.display_name || data.username,
            role: data.role
         }));
      }

      setTimeout(() => {
        setLoading(false);
        router.push(portalConfig.redirectUrl);
      }, 400);

    } catch (err: any) {
      setError(err.message || 'Incorrect credentials or unauthorized access.');
      setLoading(false);
    }
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
