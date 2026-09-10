'use client';

import React, { useState, useEffect } from 'react';
import { ReadBuddyMascot } from '../brand';
import { ReadBuddyLogo } from '../brand';

interface LoginLoadingScreenProps {
  role?: 'student' | 'teacher' | 'admin' | 'principal';
  userName?: string;
  onComplete?: () => void;
}

const STAGES = [
  { progress: 28, text: 'Authenticating Institutional Credentials...' },
  { progress: 65, text: 'Verifying SMCC Academic Records & Section...' },
  { progress: 92, text: 'Calibrating Speech AI & Speech Diagnostics...' },
  { progress: 100, text: 'Welcome! Opening Reading Studio...' },
];

export function LoginLoadingScreen({
  role = 'student',
  userName = 'Scholar',
  onComplete,
}: LoginLoadingScreenProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(15);

  useEffect(() => {
    // Progress increment timer
    const t1 = setTimeout(() => {
      setStageIndex(0);
      setCurrentProgress(28);
    }, 200);

    const t2 = setTimeout(() => {
      setStageIndex(1);
      setCurrentProgress(65);
    }, 650);

    const t3 = setTimeout(() => {
      setStageIndex(2);
      setCurrentProgress(92);
    }, 1150);

    const t4 = setTimeout(() => {
      setStageIndex(3);
      setCurrentProgress(100);
    }, 1600);

    const t5 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1950);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  const activeStage = STAGES[stageIndex] || STAGES[0];

  const roleLabel =
    role === 'principal'
      ? 'PRINCIPAL ACCESS'
      : role === 'teacher'
      ? 'FACULTY ACCESS'
      : role === 'admin'
      ? 'ADMINISTRATOR ACCESS'
      : 'STUDENT ACCESS';

  const roleBadgeBg =
    role === 'principal'
      ? '#EBE7F5'
      : role === 'teacher'
      ? '#E8F0F8'
      : role === 'admin'
      ? '#F3EAF0'
      : '#FCEDDE';

  const roleBadgeFg =
    role === 'principal'
      ? '#4A3D6B'
      : role === 'teacher'
      ? '#2C4E66'
      : role === 'admin'
      ? '#5C3650'
      : '#B4602E';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#FBF7EE] rb-notebook-bg animate-fadeIn">
      {/* ─── Academic Soft-Neobrutalism Loading Frame ─── */}
      <div className="w-full max-w-md p-7 sm:p-8 rounded-3xl bg-[#FFFDF8] border-3 border-[#1F4D3A] shadow-[7px_7px_0px_#1F4D3A] flex flex-col items-center text-center relative overflow-hidden rb-fade-in-up">
        {/* Subtle Institutional Seal Watermark */}
        <div className="mb-4">
          <ReadBuddyLogo variant="icon" size="md" />
        </div>

        {/* Animated Scholar Mascot Turning Pages */}
        <div className="my-2 p-3 rounded-2xl bg-[#F5EFE0] border-2 border-[#1F4D3A] shadow-[3px_3px_0px_#1F4D3A] flex items-center justify-center">
          <ReadBuddyMascot mood="reading" size={96} soundEnabled={false} />
        </div>

        {/* User Greeting & Access Role */}
        <div className="mt-3 mb-4">
          <div className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider mb-1 border border-black/15 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.1)]"
            style={{ background: roleBadgeBg, color: roleBadgeFg }}
          >
            {roleLabel}
          </div>
          <h2
            className="font-serif font-bold text-xl text-[#1F4D3A] tracking-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Welcome, {userName}!
          </h2>
        </div>

        {/* Dynamic Status Text */}
        <p
          className="text-xs font-mono font-semibold text-[#8A5A1E] h-5 mb-3 animate-pulse"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {activeStage.text}
        </p>

        {/* Tactile Progress Bar */}
        <div className="w-full h-3.5 rounded-full bg-[#EFE9D8] border-2 border-[#1F4D3A] shadow-[2px_2px_0px_#1F4D3A] overflow-hidden p-0.5 mb-2">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${currentProgress}%`,
              background: 'linear-gradient(90deg, #E8873A, #F0A35C)',
            }}
          />
        </div>

        {/* Progress Percentage */}
        <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-gray-400">
          <span>SMCC Nasipit</span>
          <span>{currentProgress}%</span>
        </div>
      </div>
    </div>
  );
}
export default LoginLoadingScreen;
