'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export type UserRole = 'student' | 'teacher';

interface LoginFormProps {
  onOpenTeacherRegister: () => void;
  onOpenStudentRegister: () => void;
}

export function LoginForm({ onOpenTeacherRegister, onOpenStudentRegister }: LoginFormProps) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<UserRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const isStudent = activeRole === 'student';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedId = identifier.trim();
    if (!trimmedId || !password) {
      setError(`Please enter your School ID and password.`);
      return;
    }

    setLoading(true);
    const lowerId = trimmedId.toLowerCase();

    // 1. Try backend authentication if available
    try {
      const endpoint = activeRole === 'teacher' ? '/api/auth/teacher/login' : '/api/auth/student/login';
      const bodyPayload = activeRole === 'teacher'
        ? { school_id: trimmedId, password }
        : { username: trimmedId, password };

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
        const cleanIdent = trimmedId.replace(/_\d+$/, '').replace(/\d+$/, '');
        const displayName = data.display_name || cleanIdent.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const emailFromResponse = data.email || (trimmedId.includes('@') ? trimmedId : `${trimmedId}@smccnasipit.edu.ph`);
        const sessionData = {
          display_name: displayName,
          username: data.username || data.school_id || trimmedId.split('@')[0],
          school_id: data.school_id || trimmedId,
          email: emailFromResponse,
          role: activeRole,
          password: password,
        };
        localStorage.setItem('readbuddy_user', JSON.stringify(sessionData));

        setTimeout(() => {
          setLoading(false);
          router.push(activeRole === 'teacher' ? '/teacher' : '/student');
        }, 300);
        return;
      } else if (data && data.detail) {
        setError(data.detail);
        setLoading(false);
        return;
      }
    } catch (err) {}

    // 2. Check local accounts and roster registry
    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
      const teacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');

      // Search registered account by school_id, username, or email
      let matchedAccount = accountsMap[trimmedId] || accountsMap[lowerId];
      if (!matchedAccount) {
        const allAccounts = Object.values(accountsMap) as any[];
        matchedAccount = allAccounts.find(
          (acc) =>
            (acc.school_id && acc.school_id.toLowerCase() === lowerId) ||
            (acc.username && acc.username.toLowerCase() === lowerId) ||
            (acc.email && acc.email.toLowerCase() === lowerId)
        );
      }

      // If not found in accountsMap, check teacher roster
      if (!matchedAccount) {
        const foundOnRoster = teacherStudents.find(
          (s: any) =>
            (s.school_id && s.school_id.toLowerCase() === lowerId) ||
            (s.username && s.username.toLowerCase() === lowerId) ||
            (s.email && s.email.toLowerCase() === lowerId)
        );
        if (foundOnRoster) {
          matchedAccount = {
            ...foundOnRoster,
            role: 'student',
            password: foundOnRoster.password || 'smcc2026',
          };
        }
      }

      // If account does NOT exist anywhere, reject immediately
      if (!matchedAccount) {
        setError(
          activeRole === 'student'
            ? `No student account found with School ID "${trimmedId}". Please check your credentials or register a new student account.`
            : `No educator account found with School ID "${trimmedId}". Please check your credentials or submit a teacher registration request.`
        );
        setLoading(false);
        return;
      }

      // ─── STRICT REVERSED LOGIN PREVENTION ───
      if (activeRole === 'student' && matchedAccount.role === 'teacher') {
        setError('Role Mismatch: This School ID is registered as an Educator / Teacher. Please switch to the "TEACHER" tab above to sign in.');
        setLoading(false);
        return;
      }

      if (activeRole === 'student' && matchedAccount.role === 'admin') {
        setError('Role Mismatch: This account is registered as an Administrator. Please navigate to the Admin portal to sign in.');
        setLoading(false);
        return;
      }

      if (activeRole === 'teacher' && matchedAccount.role === 'student') {
        setError('Role Mismatch: This School ID is registered as a Student. Please switch to the "STUDENT" tab above to sign in.');
        setLoading(false);
        return;
      }

      if (activeRole === 'teacher' && matchedAccount.role === 'admin') {
        setError('Role Mismatch: This account is registered as an Administrator. Please navigate to the Admin portal to sign in.');
        setLoading(false);
        return;
      }

      // ─── PASSWORD VERIFICATION ───
      const registeredPassword =
        passwordsMap[trimmedId] ||
        passwordsMap[lowerId] ||
        passwordsMap[matchedAccount.school_id || ''] ||
        passwordsMap[matchedAccount.username || ''] ||
        matchedAccount.password;

      if (registeredPassword && password !== registeredPassword) {
        setError('Incorrect password. Please verify your credentials or click "Forgot Password?".');
        setLoading(false);
        return;
      }

      // ─── TEACHER ADMIN APPROVAL CHECK ───
      if (matchedAccount.role === 'teacher') {
        if (matchedAccount.admin_approved === false) {
          setError('Pending Admin Approval: Your teacher registration is awaiting review by an SMCC Administrator.');
          setLoading(false);
          return;
        }
      }

      // Validated successfully
      const sessionData = {
        display_name: matchedAccount.display_name,
        username: matchedAccount.username || trimmedId.split('@')[0],
        school_id: matchedAccount.school_id || trimmedId,
        email: matchedAccount.email || (trimmedId.includes('@') ? trimmedId : ''),
        role: matchedAccount.role,
        grade_level: matchedAccount.grade_level,
        password: password,
      };

      localStorage.setItem('readbuddy_user', JSON.stringify(sessionData));

      setTimeout(() => {
        setLoading(false);
        router.push(activeRole === 'teacher' ? '/teacher' : '/student');
      }, 300);
      return;
    } catch (e) {
      setError('An error occurred during authentication. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="rb-fade-in-up">
        {/* ─── Segmented Pill Switcher (STUDENT / TEACHER) ─── */}
        <div className={styles.pillToggleContainer} role="tablist" aria-label="Portal Selector">
          {/* Animated Background Slider */}
          <div className={`${styles.sliderIndicator} ${!isStudent ? styles.sliderTeacher : ''}`} />

          {/* Student Toggle Button */}
          <button
            type="button"
            role="tab"
            aria-selected={isStudent}
            onClick={() => {
              setActiveRole('student');
              setError('');
            }}
            className={`${styles.pillToggleBtn} ${isStudent ? styles.activePillText : ''}`}
          >
            STUDENT
          </button>

          {/* Teacher Toggle Button */}
          <button
            type="button"
            role="tab"
            aria-selected={!isStudent}
            onClick={() => {
              setActiveRole('teacher');
              setError('');
            }}
            className={`${styles.pillToggleBtn} ${!isStudent ? styles.activePillText : ''}`}
          >
            TEACHER
          </button>
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

        {/* ─── School ID Input (Both Student and Teacher) ─── */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            {isStudent ? 'Student School ID Number' : 'Teacher School ID / Email'}
          </label>
          <input
            type="text"
            placeholder={isStudent ? 'e.g. 202612345' : 'e.g. 202612345 or email'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={`${styles.input} ${!isStudent ? styles.inputTeacherFocus : ''}`}
            autoComplete="username"
            autoFocus
          />
        </div>

        {/* ─── Password Input & Text Links ─── */}
        <div className={styles.formGroup}>
          <div className={styles.labelRow}>
            <label className={styles.label} style={{ marginBottom: 0 }}>
              Password
            </label>
            <div className="flex items-center gap-1.5 text-xs font-sans font-semibold">
              <button
                type="button"
                onClick={onOpenStudentRegister}
                className={`${styles.textLink} ${styles.studentLink}`}
              >
                New Student?
              </button>
              <span className={styles.dotSeparator}>•</span>
              <button
                type="button"
                onClick={onOpenTeacherRegister}
                className={`${styles.textLink} ${styles.teacherLink}`}
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
            className={`${styles.input} ${!isStudent ? styles.inputTeacherFocus : ''}`}
            autoComplete="current-password"
          />
          <div className="flex justify-end mt-1.5">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              className={`${styles.textLink} ${styles.forgotLink}`}
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* ─── Submit Button ─── */}
        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
          style={{
            background: isStudent
              ? 'linear-gradient(135deg, #E8873A, #F0A35C)'
              : 'linear-gradient(135deg, #3D6B8A, #2C4E66)',
          }}
        >
          {loading
            ? 'Authenticating Credentials...'
            : isStudent
            ? 'Sign In to Student Portal'
            : 'Sign In to Teacher Portal'}
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
