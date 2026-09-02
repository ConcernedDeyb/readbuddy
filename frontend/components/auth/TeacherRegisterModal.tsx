'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './auth.module.css';
import { Eye, EyeOff, X, Check, XCircle, CheckCircle2 } from 'lucide-react';

interface TeacherRegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TeacherRegisterModal({ open, onClose, onSuccess }: TeacherRegisterModalProps) {
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted || typeof document === 'undefined') return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const cleanName = displayName.trim();
    const cleanId = schoolId.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanId || !cleanEmail || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    // 1. Post to PostgreSQL Backend Database
    try {
      const res = await fetch('/api/auth/teacher/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: cleanName,
          school_id: cleanId,
          email: cleanEmail,
          password: password,
        }),
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok && data.detail) {
        // If already registered in DB
        if (data.detail.toLowerCase().includes('already')) {
          setError(data.detail);
          setLoading(false);
          return;
        }
      }
    } catch (err) {}

    // 2. Persist teacher account locally
    const username = cleanId;
    const accountData = {
      display_name: cleanName,
      username: username,
      school_id: cleanId,
      email: cleanEmail,
      password: password,
      role: 'teacher',
      admin_approved: true,
      email_verified: true,
      created_at: new Date().toISOString().split('T')[0],
    };

    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      accountsMap[cleanId] = accountData;
      accountsMap[cleanId.toLowerCase()] = accountData;
      accountsMap[username] = accountData;
      accountsMap[cleanEmail] = accountData;
      accountsMap[cleanEmail.toLowerCase()] = accountData;
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
      passwordsMap[cleanId] = password;
      passwordsMap[cleanId.toLowerCase()] = password;
      passwordsMap[username] = password;
      passwordsMap[cleanEmail] = password;
      passwordsMap[cleanEmail.toLowerCase()] = password;
      localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));

      window.dispatchEvent(new Event('readbuddy_accounts_updated'));
    } catch (e) {}

    setLoading(false);
    setSubmitted(true);
  }

  function handleReset() {
    setDisplayName('');
    setSchoolId('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSubmitted(false);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto rb-fade-in-up">
      <div className="w-full max-w-lg bg-[#FFFDF8] border border-[#DED2B4] rounded-2xl p-6 sm:p-8 shadow-2xl relative font-sans my-auto max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleReset}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-black/5 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer font-sans transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" strokeWidth={2.25} />
        </button>

        {!submitted ? (
          <>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#3D6B8A15] text-[#3D6B8A] flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#3D6B8A]">
                Teacher Account Registration
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-sans mb-5">
              Register your SMCC Educator Account. Your record is saved directly to the database.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E] text-xs font-sans">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={styles.label}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={styles.input}
                    autoFocus
                  />
                </div>

                <div>
                  <label className={styles.label}>
                    Teacher School ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024001"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div>
                <label className={styles.label}>
                  Institutional Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. msantos@smccnasipit.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={styles.label} style={{ marginBottom: 0 }}>
                      Password <span className="text-red-500">*</span>
                    </label>
                    {password.length > 0 && (
                      <span
                        className="text-[10px] font-mono font-bold"
                        style={{ color: password.length < 8 ? '#E53E3E' : '#2E7D4F' }}
                      >
                        {password.length < 8 ? `${password.length}/8 chars` : '✓ 8+ chars'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min. 8 characters..."
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error && error.toLowerCase().includes('password')) setError('');
                      }}
                      className={styles.input}
                      style={{
                        paddingRight: '40px',
                        borderColor:
                          confirmPassword.length > 0 && password !== confirmPassword
                            ? '#E53E3E'
                            : confirmPassword.length > 0 && password === confirmPassword
                            ? '#2E7D4F'
                            : undefined,
                        backgroundColor:
                          confirmPassword.length > 0 && password !== confirmPassword
                            ? '#FFF5F5'
                            : confirmPassword.length > 0 && password === confirmPassword
                            ? '#F4FAF6'
                            : undefined,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer flex items-center justify-center"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={styles.label} style={{ marginBottom: 0 }}>
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    {confirmPassword.length > 0 && (
                      <span
                        className="text-[10px] font-mono font-bold flex items-center gap-0.5"
                        style={{ color: password !== confirmPassword ? '#E53E3E' : '#2E7D4F' }}
                      >
                        {password !== confirmPassword ? <><X className="w-3 h-3" /> Mismatch</> : <><Check className="w-3 h-3" /> Matches</>}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password..."
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error && error.toLowerCase().includes('password')) setError('');
                      }}
                      className={styles.input}
                      style={{
                        paddingRight: '40px',
                        borderColor:
                          confirmPassword.length > 0 && password !== confirmPassword
                            ? '#E53E3E'
                            : confirmPassword.length > 0 && password === confirmPassword
                            ? '#2E7D4F'
                            : undefined,
                        backgroundColor:
                          confirmPassword.length > 0 && password !== confirmPassword
                            ? '#FFF5F5'
                            : confirmPassword.length > 0 && password === confirmPassword
                            ? '#F4FAF6'
                            : undefined,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer flex items-center justify-center"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword ? (
                    <div className="flex items-start gap-1 text-[11px] text-red-600 font-sans mt-1 font-semibold leading-tight">
                      <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Passwords do not match. Please re-enter the exact password.</span>
                    </div>
                  ) : confirmPassword.length > 0 && password === confirmPassword ? (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-sans mt-1 font-semibold leading-tight">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Passwords match!</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 ${styles.submitBtn}`}
                  style={{ background: 'linear-gradient(135deg, #3D6B8A, #2C4E66)', marginTop: 0 }}
                >
                  {loading ? 'Recording to Database...' : 'Register Teacher Account'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-4 flex flex-col items-center gap-3 rb-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-[#EBF3F8] text-[#3D6B8A] flex items-center justify-center border border-[#A8C5DA]">
              <Check className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#3D6B8A]">
              Account Registered in Database!
            </h3>
            <p className="text-xs text-gray-600 font-sans max-w-sm leading-relaxed">
              Your educator account has been saved to the PostgreSQL database. You can now sign in immediately using your School ID (<strong>{schoolId}</strong>).
            </p>
            <div className="mt-4 flex gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onSuccess();
                }}
                className={`w-full ${styles.submitBtn}`}
                style={{ background: 'linear-gradient(135deg, #3D6B8A, #2C4E66)', marginTop: 0 }}
              >
                Proceed to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
