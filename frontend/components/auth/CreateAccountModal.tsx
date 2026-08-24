'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './auth.module.css';
import { recordAuthLog, recordActivity } from '@/utils/auditLogger';

export type RegistrationRole = 'student' | 'teacher';

interface CreateAccountModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (schoolId?: string) => void;
}

export function CreateAccountModal({ open, onClose, onSuccess }: CreateAccountModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RegistrationRole>('student');

  // Student State
  const [studentName, setStudentName] = useState('');
  const [studentSchoolId, setStudentSchoolId] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [gradeLevel, setGradeLevel] = useState('7');
  const [preferredLang, setPreferredLang] = useState<'en' | 'tl'>('en');

  // Teacher State
  const [teacherName, setTeacherName] = useState('');
  const [teacherSchoolId, setTeacherSchoolId] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherConfirmPassword, setTeacherConfirmPassword] = useState('');

  // General State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdStudentCredentials, setCreatedStudentCredentials] = useState<{
    schoolId: string;
    username: string;
    email: string;
    password: string;
  } | null>(null);
  const [teacherSuccess, setTeacherSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted || typeof document === 'undefined') return null;

  function handleReset() {
    setSelectedRole('student');
    setStudentName('');
    setStudentSchoolId('');
    setStudentEmail('');
    setStudentPassword('');
    setGradeLevel('7');
    setPreferredLang('en');

    setTeacherName('');
    setTeacherSchoolId('');
    setTeacherEmail('');
    setTeacherPassword('');
    setTeacherConfirmPassword('');

    setError('');
    setLoading(false);
    setCreatedStudentCredentials(null);
    setTeacherSuccess(false);
    onClose();
  }

  async function handleStudentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const cleanName = studentName.trim();
    const cleanId = studentSchoolId.trim();
    const cleanEmail = studentEmail.trim();
    const pwd = studentPassword.trim();

    if (!cleanName) {
      setError('Please enter the student full name.');
      return;
    }
    if (!cleanId) {
      setError('Please enter the student School ID Number.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid student email address.');
      return;
    }
    if (!pwd || pwd.length < 6) {
      setError('Student password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const lowerId = cleanId.toLowerCase();
    const formalUsername = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    // 1. Check local uniqueness
    try {
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const teacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');

      const existingAcc = accountsMap[cleanId] || accountsMap[lowerId];
      const existingStudent = teacherStudents.find((s: any) => s.school_id?.toLowerCase() === lowerId);

      if (existingAcc || existingStudent) {
        const existingName = existingStudent?.display_name || existingAcc?.display_name || 'an existing user';
        setError(`School ID "${cleanId}" is already registered to ${existingName}. Each student must have a unique School ID.`);
        setLoading(false);
        return;
      }
    } catch (e) {}

    // 2. Post to backend
    try {
      const res = await fetch('/api/auth/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: cleanName,
          school_id: cleanId,
          username: formalUsername,
          email: cleanEmail,
          password: pwd,
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
          setLoading(false);
          return;
        }
      }
    } catch (err) {}

    // 3. Persist locally
    const accountData = {
      display_name: cleanName,
      username: formalUsername,
      school_id: cleanId,
      email: cleanEmail,
      password: pwd,
      role: 'student',
      grade_level: Number(gradeLevel),
      created_at: new Date().toISOString().split('T')[0],
    };

    try {
      const passwordsMap = JSON.parse(localStorage.getItem('readbuddy_passwords') || '{}');
      passwordsMap[cleanId] = pwd;
      passwordsMap[lowerId] = pwd;
      passwordsMap[formalUsername] = pwd;
      passwordsMap[cleanEmail] = pwd;
      localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));

      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      accountsMap[cleanId] = accountData;
      accountsMap[lowerId] = accountData;
      accountsMap[formalUsername] = accountData;
      accountsMap[cleanEmail] = accountData;
      localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));

      const deletedIds = (JSON.parse(localStorage.getItem('readbuddy_deleted_student_ids') || '[]') as string[])
        .filter((x) => x.toLowerCase() !== lowerId && x.toLowerCase() !== formalUsername.toLowerCase());
      localStorage.setItem('readbuddy_deleted_student_ids', JSON.stringify(deletedIds));

      window.dispatchEvent(new Event('readbuddy_accounts_updated'));
      window.dispatchEvent(new Event('readbuddy_students_updated'));

      recordAuthLog({
        identifier: cleanId,
        display_name: cleanName,
        role: 'student',
        method: 'Local Password',
        status: 'CREATED',
        details: `Student registered (Grade ${gradeLevel}, ${cleanEmail})`,
      });

      recordActivity({
        user_name: cleanName,
        role: 'student',
        action: 'Account Registered',
        details: `New student account created for ${cleanName} (ID: ${cleanId})`,
      });
    } catch (e) {}

    setLoading(false);
    setCreatedStudentCredentials({
      schoolId: cleanId,
      username: formalUsername,
      email: cleanEmail,
      password: pwd,
    });
  }

  async function handleTeacherSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const cleanName = teacherName.trim();
    const cleanId = teacherSchoolId.trim();
    const cleanEmail = teacherEmail.trim();

    if (!cleanName || !cleanId || !cleanEmail || !teacherPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (teacherPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (teacherPassword !== teacherConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    // 1. Backend register
    try {
      const res = await fetch('/api/auth/teacher/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: cleanName,
          school_id: cleanId,
          email: cleanEmail,
          password: teacherPassword,
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
          setLoading(false);
          return;
        }
      }
    } catch (err) {}

    // 2. Persist teacher locally
    const username = cleanId;
    const accountData = {
      display_name: cleanName,
      username: username,
      school_id: cleanId,
      email: cleanEmail,
      password: teacherPassword,
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
      passwordsMap[cleanId] = teacherPassword;
      passwordsMap[cleanId.toLowerCase()] = teacherPassword;
      passwordsMap[username] = teacherPassword;
      passwordsMap[cleanEmail] = teacherPassword;
      passwordsMap[cleanEmail.toLowerCase()] = teacherPassword;
      localStorage.setItem('readbuddy_passwords', JSON.stringify(passwordsMap));

      window.dispatchEvent(new Event('readbuddy_accounts_updated'));

      recordAuthLog({
        identifier: cleanId,
        display_name: cleanName,
        role: 'teacher',
        method: 'Local Password',
        status: 'CREATED',
        details: `Faculty account registered: ${cleanName} (${cleanEmail})`,
      });

      recordActivity({
        user_name: cleanName,
        role: 'teacher',
        action: 'Faculty Registered',
        details: `New teacher account registered for ${cleanName}`,
      });
    } catch (e) {}

    setLoading(false);
    setTeacherSuccess(true);
  }

  const isSuccess = createdStudentCredentials !== null || teacherSuccess;

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
          ✕
        </button>

        {!isSuccess ? (
          <>
            {/* Modal Header */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-full bg-[#1F4D3A15] text-[#1F4D3A] flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F4D3A]">
                  Create ReadBuddy Account
                </h2>
              </div>
            </div>
            <p className="text-xs text-gray-500 font-sans mb-4">
              Select your role below to complete institutional registration.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E] text-xs font-sans">
                {error}
              </div>
            )}

            {/* ─── Role Selection Dropdown Box ─── */}
            <div className="mb-4 p-3.5 rounded-xl bg-[#FBF6EB] border border-[#E5DAC4]">
              <label className={styles.label} style={{ marginBottom: '0.35rem', color: '#1F4D3A' }}>
                Account Type / Role <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as RegistrationRole);
                  setError('');
                }}
                className={styles.input}
                style={{ background: '#FFFFFF', fontWeight: 600 }}
              >
                <option value="student">🎓 Student Account (Basic Education Learner)</option>
                <option value="teacher">👨‍🏫 Teacher / Educator Account (SMCC Faculty)</option>
              </select>
              <p className="text-[11px] text-[#7C6E5C] mt-1.5 font-sans">
                {selectedRole === 'student'
                  ? 'For students practicing reading comprehension and taking auto-graded tests.'
                  : 'For faculty and instructors managing student rosters and publishing passages.'}
              </p>
            </div>

            {/* ─── Role Registration Form ─── */}
            {selectedRole === 'student' ? (
              <form onSubmit={handleStudentSubmit} className="flex flex-col gap-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={styles.label}>
                      Student Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juan dela Cruz"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className={styles.input}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className={styles.label}>
                      School ID Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 202612345"
                      value={studentSchoolId}
                      onChange={(e) => setStudentSchoolId(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <label className={styles.label}>
                    Student Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jdelacruz@student.smccnasipit.edu.ph"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div>
                  <label className={styles.label}>
                    Account Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 6 characters..."
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                    style={{ background: 'linear-gradient(135deg, #E8873A, #F0A35C)', marginTop: 0 }}
                  >
                    {loading ? 'Generating Account...' : 'Register Student Account'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleTeacherSubmit} className="flex flex-col gap-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={styles.label}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Santos"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
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
                      value={teacherSchoolId}
                      onChange={(e) => setTeacherSchoolId(e.target.value)}
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
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={styles.label}>
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min. 8 characters..."
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter password..."
                      value={teacherConfirmPassword}
                      onChange={(e) => setTeacherConfirmPassword(e.target.value)}
                      className={styles.input}
                    />
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
            )}
          </>
        ) : createdStudentCredentials ? (
          /* Student Success Screen */
          <div className="text-center py-3 rb-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-[#FCEDDE] text-[#E8873A] flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              ✓
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1F4D3A] mb-1">
              Student Account Created!
            </h3>
            <p className="text-xs text-gray-600 font-sans mb-4">
              Your account has been saved. Please record your credentials for <strong>{studentName}</strong>:
            </p>

            <div className="p-4 rounded-xl bg-[#FFFDF8] border-2 border-dashed border-[#E8873A] mb-5 text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-gray-500 font-medium">School ID:</span>
                <span className="text-sm font-mono font-bold text-[#1F4D3A]">{createdStudentCredentials.schoolId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-gray-500 font-medium">Email:</span>
                <span className="text-xs font-mono font-semibold text-gray-700">{createdStudentCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-gray-500 font-medium">Password:</span>
                <span className="text-sm font-mono font-bold text-[#E8873A]">{createdStudentCredentials.password}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2 border-gray-200">
                <span className="text-xs font-sans text-gray-500 font-medium">Grade Level:</span>
                <span className="text-xs font-sans font-semibold text-gray-700">Grade {gradeLevel}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const sId = createdStudentCredentials.schoolId;
                handleReset();
                onSuccess(sId);
              }}
              className={`w-full ${styles.submitBtn}`}
              style={{ background: 'linear-gradient(135deg, #E8873A, #F0A35C)', marginTop: 0 }}
            >
              Sign In with School ID
            </button>
          </div>
        ) : (
          /* Teacher Success Screen */
          <div className="text-center py-3 flex flex-col items-center gap-3 rb-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-[#EBF3F8] text-[#3D6B8A] flex items-center justify-center text-xl font-bold border border-[#A8C5DA]">
              ✓
            </div>
            <h3 className="text-lg font-serif font-bold text-[#3D6B8A]">
              Teacher Account Registered!
            </h3>
            <p className="text-xs text-gray-600 font-sans max-w-sm leading-relaxed">
              Your educator account has been saved. You can now sign in immediately using your School ID (<strong>{teacherSchoolId}</strong>).
            </p>
            <div className="mt-3 w-full">
              <button
                type="button"
                onClick={() => {
                  const tId = teacherSchoolId;
                  handleReset();
                  onSuccess(tId);
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
