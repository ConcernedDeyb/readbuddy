'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './auth.module.css';

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
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!displayName.trim() || !schoolId.trim() || !email.trim() || !password) {
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

  const modalJSX = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto rb-fade-in-up">
      <div className="w-full max-w-lg bg-[#FFFDF8] border border-[#DED2B4] rounded-2xl p-6 sm:p-7 shadow-2xl relative font-sans my-auto max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header with non-overlapping close button */}
        <div className="flex items-start justify-between gap-3 mb-1 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl shrink-0">🧑‍🏫</span>
            <h3 className="text-xl font-serif font-semibold text-[#1F4D3A] leading-snug">
              Teacher Registration Request
            </h3>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-gray-400 hover:text-gray-600 hover:bg-black/5 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer font-sans transition-colors shrink-0 -mr-2 -mt-1 text-base"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500 font-sans mb-4 shrink-0">
          Submit your SMCC educator credentials. To prevent unauthorized student access, an SMCC Administrator must review and approve your account before login.
        </p>

        {submitted ? (
          <div className="text-center py-2 rb-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-[#EBF3F8] text-[#3D6B8A] flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              ⏳
            </div>
            <h4 className="text-base font-semibold text-[#1F4D3A] mb-1 font-serif">
              Registration Request Submitted
            </h4>
            <div className="p-3.5 rounded-xl bg-[#FFFDF8] border border-[#DED2B4] mb-4 text-xs font-sans text-left space-y-2 text-gray-600">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-500">Applicant:</span>
                <span className="font-semibold text-gray-800">{displayName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-500">School ID:</span>
                <span className="font-mono font-semibold text-[#3D6B8A]">{schoolId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-500">Email:</span>
                <span className="font-mono text-gray-700">{email}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2 border-gray-200">
                <span className="font-medium text-gray-500">Status:</span>
                <span className="font-bold text-[#8A5A1E]">Pending Admin Approval</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 font-sans mb-5 leading-relaxed">
              We sent a verification link to <strong className="text-[#1F4D3A]">{email}</strong>. Once verified by you and approved by an SMCC System Administrator, your account will be activated.
            </p>
            <button
              type="button"
              onClick={() => {
                onSuccess();
                handleReset();
              }}
              className="w-full py-2.5 rounded-full bg-[#3D6B8A] text-white font-sans text-sm font-semibold hover:opacity-90 transition-all cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && (
              <div className="p-3 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E] text-xs font-sans">
                {error}
              </div>
            )}

            <div>
              <label className={styles.label}>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ms. Maria Santos"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={styles.input}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={styles.label}>School ID Number</label>
                <input
                  type="text"
                  placeholder="202612345"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div>
                <label className={styles.label}>Institutional Email</label>
                <input
                  type="email"
                  placeholder="teacher@smccnasipit.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={styles.label}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div>
                <label className={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            <div className="p-3 my-1 rounded-xl bg-[#EBF3F8] border border-[#BDE0FE] text-[11px] font-sans text-[#2C4E66] flex items-start gap-2.5">
              <span className="text-sm shrink-0">🛡️</span>
              <span className="leading-relaxed">
                <strong>RBAC Security Policy:</strong> All teacher account creations require SMCC Administrator approval prior to account activation to prevent student impersonation.
              </span>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              style={{ background: 'linear-gradient(135deg, #3D6B8A, #2C4E66)', marginTop: '0.5rem' }}
            >
              Submit Teacher Registration Request
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}
