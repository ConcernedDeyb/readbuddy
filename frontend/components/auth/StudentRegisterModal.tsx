'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './auth.module.css';
import { X, Check } from 'lucide-react';

interface StudentRegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (schoolId: string) => void;
}

export function StudentRegisterModal({ open, onClose, onSuccess }: StudentRegisterModalProps) {
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [gradeLevel, setGradeLevel] = useState('7');
  const [preferredLang, setPreferredLang] = useState<'en' | 'tl'>('en');
  const [error, setError] = useState('');
  
  // Created credentials state
  const [createdCredentials, setCreatedCredentials] = useState<{
    schoolId: string;
    username: string;
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted || typeof document === 'undefined') return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter the student full name.');
      return;
    }
    if (!schoolId.trim()) {
      setError('Please enter the student School ID Number.');
      return;
    }
    if (!studentEmail.trim() || !studentEmail.includes('@')) {
      setError('Please enter a valid student email address.');
      return;
    }
    if (!passwordInput || passwordInput.trim().length < 6) {
      setError('Student password is required and must be at least 6 characters.');
      return;
    }

    const trimmedSchoolId = schoolId.trim();
    const lowerSchoolId = trimmedSchoolId.toLowerCase();
    const formalUsername = fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const studentPassword = passwordInput.trim();

    // ─── UNIQUE SCHOOL ID CHECK ───
    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const teacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');

      const existingAcc = accountsMap[trimmedSchoolId] || accountsMap[lowerSchoolId];
      const existingStudent = teacherStudents.find((s: any) => s.school_id?.toLowerCase() === lowerSchoolId);

      if (existingAcc || existingStudent) {
        const existingName = existingStudent?.display_name || existingAcc?.display_name || 'an existing user';
        setError(`The School ID "${trimmedSchoolId}" is already registered to ${existingName}. Each student must have a unique School ID Number.`);
        return;
      }
    } catch (e) {}

    try {
      const res = await fetch('/api/auth/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: fullName.trim(),
          school_id: trimmedSchoolId,
          username: formalUsername,
          email: studentEmail.trim(),
          password: studentPassword,
          grade_level: Number(gradeLevel),
          preferred_language: preferredLang,
        }),
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok && data.detail) {
        if (data.detail.toLowerCase().includes('already')) {
          setError(data.detail);
          return;
        }
      }
    } catch (err) {}

    const accountData = {
      display_name: fullName.trim(),
      username: formalUsername,
      school_id: trimmedSchoolId,
      email: studentEmail.trim(),
      password: studentPassword,
      role: 'student',
      grade_level: Number(gradeLevel),
      created_at: new Date().toISOString().split('T')[0],
    };

    try {
      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
      passwordsMap[trimmedSchoolId] = studentPassword;
      passwordsMap[lowerSchoolId] = studentPassword;
      passwordsMap[formalUsername] = studentPassword;
      passwordsMap[studentEmail.trim()] = studentPassword;
      localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));

      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      accountsMap[trimmedSchoolId] = accountData;
      accountsMap[lowerSchoolId] = accountData;
      accountsMap[formalUsername] = accountData;
      accountsMap[studentEmail.trim()] = accountData;
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      // Remove from deleted IDs if previously deleted
      const deletedIds = (JSON.parse(localStorage.getItem('readbuddy_deleted_student_ids') || '[]') as string[])
        .filter((x) => x.toLowerCase() !== lowerSchoolId && x.toLowerCase() !== formalUsername.toLowerCase());
      localStorage.setItem('readbuddy_deleted_student_ids', JSON.stringify(deletedIds));

      window.dispatchEvent(new Event('readbuddy_accounts_updated'));
      window.dispatchEvent(new Event('readbuddy_students_updated'));
    } catch (e) {}

    setCreatedCredentials({
      schoolId: trimmedSchoolId,
      username: formalUsername,
      email: studentEmail.trim(),
      password: studentPassword,
    });
  }

  function handleReset() {
    setFullName('');
    setSchoolId('');
    setStudentEmail('');
    setPasswordInput('');
    setGradeLevel('7');
    setPreferredLang('en');
    setError('');
    setCreatedCredentials(null);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto rb-fade-in-up">
      <div className="w-full max-w-md bg-[#FFFDF8] border border-[#DED2B4] rounded-2xl p-6 sm:p-7 shadow-2xl relative font-sans my-auto max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-1 shrink-0">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <h3 className="text-xl font-serif font-semibold text-[#1F4D3A] leading-snug">
              Student Registration
            </h3>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-gray-400 hover:text-gray-600 hover:bg-black/5 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer font-sans transition-colors shrink-0 -mr-2 -mt-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </div>

        <p className="text-xs text-gray-500 font-sans mb-4 shrink-0">
          Create a student practice account with your assigned School ID Number.
        </p>

        {createdCredentials ? (
          <div className="text-center py-2 rb-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-[#FCEDDE] text-[#E8873A] flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h4 className="text-base font-semibold text-[#1F4D3A] mb-1 font-serif">
              Student Account Created!
            </h4>
            <p className="text-xs text-gray-600 font-sans mb-4">
              Save or write down your login credentials for <strong>{fullName}</strong>:
            </p>

            <div className="p-4 rounded-xl bg-[#FFFDF8] border-2 border-dashed border-[#E8873A] mb-5 text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-gray-500 font-medium">School ID:</span>
                <span className="text-sm font-mono font-bold text-[#1F4D3A]">{createdCredentials.schoolId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-gray-500 font-medium">Email:</span>
                <span className="text-xs font-mono font-semibold text-gray-700">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-gray-500 font-medium">Password:</span>
                <span className="text-sm font-mono font-bold text-[#E8873A]">{createdCredentials.password}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2 border-gray-200">
                <span className="text-xs font-sans text-gray-500 font-medium">Grade Level:</span>
                <span className="text-xs font-sans font-semibold text-gray-700">Grade {gradeLevel}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onSuccess(createdCredentials.schoolId);
                handleReset();
              }}
              className="w-full py-2.5 rounded-full text-white font-sans text-sm font-semibold hover:opacity-90 transition-all cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #E8873A, #F0A35C)' }}
            >
              Sign In with School ID
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
              <label className={styles.label}>Student Full Name</label>
              <input
                type="text"
                placeholder="e.g. Juan dela Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={styles.input}
                autoFocus
              />
            </div>

            <div>
              <label className={styles.label}>School ID Number</label>
              <input
                type="text"
                placeholder="e.g. 202612345"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.label}>Student Email Address</label>
              <input
                type="email"
                placeholder="e.g. jdelacruz@student.smccnasipit.edu.ph"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.label}>Student Password</label>
              <input
                type="password"
                placeholder="Create account password (min 6 characters)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-1">
              <div>
                <label className={styles.label}>Grade Level</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className={styles.input}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={styles.label}>Preferred Language</label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value as 'en' | 'tl')}
                  className={styles.input}
                >
                  <option value="en">English</option>
                  <option value="tl">Tagalog</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              style={{ background: 'linear-gradient(135deg, #E8873A, #F0A35C)', marginTop: '0.5rem' }}
            >
              Generate Student Account
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
