'use client';

import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { TeacherRegisterModal } from './TeacherRegisterModal';
import { StudentRegisterModal } from './StudentRegisterModal';
import styles from './auth.module.css';

export default function UnifiedAuthLanding() {
  const [teacherRegisterOpen, setTeacherRegisterOpen] = useState(false);
  const [studentRegisterOpen, setStudentRegisterOpen] = useState(false);
  const [resetToast, setResetToast] = useState(false);

  function handleResetAllAccounts() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('readbuddy_accounts');
        localStorage.removeItem('readbuddy_passwords');
        localStorage.removeItem('readbuddy_user');
        localStorage.removeItem('readbuddy_teacher_students');
        localStorage.removeItem('readbuddy_admin_teachers');
        localStorage.removeItem('readbuddy_admin_students');
        localStorage.removeItem('readbuddy_teacher_passages');
        localStorage.removeItem('readbuddy_teacher_tests');
        localStorage.removeItem('readbuddy_teacher_classes');
        localStorage.removeItem('readbuddy_student_assigned_tests');
        localStorage.removeItem('readbuddy_student_submissions');
        
        setResetToast(true);
        setTimeout(() => {
          setResetToast(false);
          window.location.reload();
        }, 800);
      } catch (e) {}
    }
  }

  return (
    <div className={styles.authWrapper}>
      {/* Brand Header */}
      <div className={styles.brandHeader}>
        <div className={styles.logoBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B2621" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="4" width="14" height="16" rx="2" />
            <line x1="9" y1="4" x2="9" y2="20" />
          </svg>
          <span className={styles.logoBadgeText}>
            SMCC BASIC EDUCATION
          </span>
        </div>

        <h1 className={styles.title}>ReadBuddy</h1>
        <p className={styles.subtitle}>
          AI-Powered Reading Comprehension Assistant for Basic Education Students
        </p>
      </div>

      {resetToast && (
        <div className="mb-4 px-4 py-2.5 rounded-full bg-[#1F4D3A] text-white text-xs font-sans font-semibold shadow-lg flex items-center gap-2 animate-bounce">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>All local accounts & storage have been reset! Reloading...</span>
        </div>
      )}

      {/* Unified RBAC Auth Card Container */}
      <div className={styles.authCard}>
        <LoginForm
          onOpenTeacherRegister={() => setTeacherRegisterOpen(true)}
          onOpenStudentRegister={() => setStudentRegisterOpen(true)}
        />
      </div>

      {/* Teacher Registration Modal */}
      <TeacherRegisterModal
        open={teacherRegisterOpen}
        onClose={() => setTeacherRegisterOpen(false)}
        onSuccess={() => setTeacherRegisterOpen(false)}
      />

      {/* Student Registration Modal */}
      <StudentRegisterModal
        open={studentRegisterOpen}
        onClose={() => setStudentRegisterOpen(false)}
        onSuccess={() => setStudentRegisterOpen(false)}
      />

      {/* Footer Security Note & Quick Storage Reset Button */}
      <footer className={styles.footerNote}>
        <div>Saint Michael College of Caraga · Local AI Inference · Private & Secure for Minors</div>
        <div className="mt-2.5">
          <button
            type="button"
            onClick={handleResetAllAccounts}
            className="text-[11px] font-sans font-medium text-gray-500 hover:text-red-700 hover:underline cursor-pointer transition-colors inline-flex items-center gap-1 opacity-75 hover:opacity-100"
            title="Clear all student and teacher accounts saved in localStorage"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            <span>Reset Local Accounts Data</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
