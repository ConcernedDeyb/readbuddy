'use client';

import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { TeacherRegisterModal } from './TeacherRegisterModal';
import { StudentRegisterModal } from './StudentRegisterModal';
import styles from './auth.module.css';

export default function UnifiedAuthLanding() {
  const [teacherRegisterOpen, setTeacherRegisterOpen] = useState(false);
  const [studentRegisterOpen, setStudentRegisterOpen] = useState(false);

  return (
    <div className={styles.authWrapper}>
      {/* Brand Header */}
      <div className={styles.brandHeader}>
        <div className={styles.logoBadge}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span className="text-xs font-mono font-bold text-[#1F4D3A] tracking-wider uppercase">
            SMCC Basic Education
          </span>
        </div>

        <h1 className={styles.title}>ReadBuddy</h1>
        <p className={styles.subtitle}>
          AI-Powered Reading Comprehension Assistant for Basic Education Students
        </p>
      </div>

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

      {/* Footer Security Note */}
      <footer className={styles.footerNote}>
        Saint Michael College of Caraga · Local AI Inference · Private & Secure for Minors
      </footer>
    </div>
  );
}
