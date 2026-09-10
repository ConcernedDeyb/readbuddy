'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReadBuddyMascot, MascotMood } from '../brand';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  MousePointerClick,
  Compass,
  Zap,
} from 'lucide-react';

export type TourRole = 'student' | 'teacher' | 'admin' | 'principal';

export interface TourStep {
  id: string;
  section: string;
  targetId: string;
  title: string;
  subtitle: string;
  description: string;
  interactionPrompt: string;
  actionButtonLabel: string;
  badgeLabel?: string;
  mood: MascotMood;
}

const STUDENT_STEPS: TourStep[] = [
  {
    id: 'welcome',
    section: 'overview',
    targetId: 'tour-student-welcome',
    title: 'Reading Practice Studio',
    subtitle: 'Welcome to ReadBuddy Basic Education',
    description:
      'Welcome! ReadBuddy is your AI reading companion. Start self-paced oral reading anytime with private on-device speech recognition and real-time pronunciation guidance.',
    interactionPrompt: 'Click "+ Start Practice Session" to practice reading aloud!',
    actionButtonLabel: 'Next: Reading Tier Diagnostics →',
    badgeLabel: 'Welcome Studio',
    mood: 'happy',
  },
  {
    id: 'stats',
    section: 'overview',
    targetId: 'tour-student-stats',
    title: 'Phil-IRI Reading Tier',
    subtitle: 'Real-Time Progress & Accuracy Tracking',
    description:
      'Here is your official Phil-IRI reading tier. As you read, your Word Recognition accuracy and comprehension metrics automatically update to Independent, Instructional, or Frustration tier.',
    interactionPrompt: 'Inspect your word recognition score and current reading level!',
    actionButtonLabel: 'Next: Assigned Reading Tests →',
    badgeLabel: 'Phil-IRI Tier',
    mood: 'reading',
  },
  {
    id: 'tests',
    section: 'tests',
    targetId: 'tour-student-tests-header',
    title: 'Assigned Reading Tests',
    subtitle: 'Teacher-Dispatched Assessments',
    description:
      'When your teacher assigns an official Phil-IRI assessment, it appears here. You can record your reading session and answer comprehension questions for grading.',
    interactionPrompt: 'Review your pending reading assessments and instructions!',
    actionButtonLabel: 'Next: Reading History →',
    badgeLabel: 'Assigned Tests',
    mood: 'thinking',
  },
  {
    id: 'history',
    section: 'history',
    targetId: 'tour-student-history-header',
    title: 'Reading History & Diagnostics',
    subtitle: 'Word-by-Word Analytics & Oral Reading Rates',
    description:
      'Inspect past reading sessions, word recognition percentages, oral reading rates (Words Per Minute), and qualitative teacher remarks.',
    interactionPrompt: 'Review your past session performance and accuracy metrics!',
    actionButtonLabel: 'Next: Scholar Notebook →',
    badgeLabel: 'Reading History',
    mood: 'cheering',
  },
  {
    id: 'notebook',
    section: 'notebook',
    targetId: 'tour-student-notebook-tabs',
    title: 'Scholar Notebook & AI Assistant',
    subtitle: 'Course Materials, Personal Notes & AI Chat',
    description:
      'Access teacher-provided course packets, write personal study notes, and chat with Buddy AI to summarize stories or quiz yourself on tricky vocabulary words.',
    interactionPrompt: 'Explore course materials, personal notes, and your AI assistant!',
    actionButtonLabel: 'Finish Tour & Start Reading!',
    badgeLabel: 'Study Sanctuary',
    mood: 'happy',
  },
];

const TEACHER_STEPS: TourStep[] = [
  {
    id: 'metrics',
    section: 'overview',
    targetId: 'tour-teacher-metrics',
    title: 'Educator Overview & Telemetry',
    subtitle: 'Class Roster & Reading Performance at a Glance',
    description:
      'Welcome, Professor! Track your enrolled students, authored passages, scheduled assessments, and tests awaiting qualitative teacher feedback.',
    interactionPrompt: 'Review your studio metrics and pending evaluation count!',
    actionButtonLabel: 'Next: Fast Actions →',
    badgeLabel: 'Studio Metrics',
    mood: 'happy',
  },
  {
    id: 'fast-actions',
    section: 'overview',
    targetId: 'tour-teacher-fast-actions',
    title: 'Educator Fast Actions',
    subtitle: 'One-Click Classroom Operations',
    description:
      'Quickly jump into action: create grade sections, author custom English or Filipino reading passages, or dispatch Phil-IRI reading tests.',
    interactionPrompt: 'Use these tactile cards for rapid classroom workflows!',
    actionButtonLabel: 'Next: Classes & Sections →',
    badgeLabel: 'Fast Actions',
    mood: 'reading',
  },
  {
    id: 'classes',
    section: 'classes',
    targetId: 'tour-teacher-classes-header',
    title: 'Classes & Section Management',
    subtitle: 'Class Codes & Enrollment Rosters',
    description:
      'Create and oversee your class sections (e.g., St. John, St. Mark). Generate unique 6-character class codes for student self-enrollment and manage student rosters.',
    interactionPrompt: 'Review class codes, section capacities, and student rosters!',
    actionButtonLabel: 'Next: Student Diagnostics →',
    badgeLabel: 'Class Sections',
    mood: 'thinking',
  },
  {
    id: 'students',
    section: 'students',
    targetId: 'tour-teacher-students-header',
    title: 'Student Reading Profiles',
    subtitle: 'Phil-IRI Tier Distribution & Assessment Sheets',
    description:
      'Monitor student performance across Independent, Instructional, and Frustration tiers. Filter by section, review oral reading rates, and print official diagnostic assessment sheets.',
    interactionPrompt: 'Inspect student reading tiers and printable diagnostic sheets!',
    actionButtonLabel: 'Next: Passage Studio →',
    badgeLabel: 'Student Profiles',
    mood: 'reading',
  },
  {
    id: 'passages',
    section: 'passages',
    targetId: 'tour-teacher-passages-header',
    title: 'Passage Authoring Studio',
    subtitle: 'Custom English & Tagalog Reading Passages',
    description:
      'Author custom reading texts, set target word counts, and configure multiple-choice comprehension questions with automated rubric scoring.',
    interactionPrompt: 'Explore authored curriculum or create new reading passages!',
    actionButtonLabel: 'Next: Reading Tests →',
    badgeLabel: 'Passage Studio',
    mood: 'thinking',
  },
  {
    id: 'tests',
    section: 'tests',
    targetId: 'tour-teacher-tests-header',
    title: 'Reading Tests & Instant Grading',
    subtitle: 'Section Dispatch & Submission Review',
    description:
      'Dispatch official Phil-IRI tests to specific sections or remedial students. Review auto-graded student submissions with qualitative teacher remarks.',
    interactionPrompt: 'Review scheduled assessments and student submissions!',
    actionButtonLabel: 'Complete Tour & Start Teaching!',
    badgeLabel: 'Assessment Hub',
    mood: 'cheering',
  },
];

const ADMIN_STEPS: TourStep[] = [
  {
    id: 'admin-vram',
    section: 'overview',
    targetId: 'tour-admin-vram',
    title: 'GPU VRAM & Telemetry',
    subtitle: 'On-Device Speech & LLM Telemetry',
    description:
      'Monitor speech recognition (Wav2Vec2 / MMS) memory allocation, LLM comprehension inference states, and hardware cache performance in real time.',
    interactionPrompt: 'Inspect live GPU VRAM telemetry and dual-pipeline cache health!',
    actionButtonLabel: 'Next: Admin Fast Actions →',
    badgeLabel: 'Hardware Telemetry',
    mood: 'happy',
  },
  {
    id: 'admin-fast-actions',
    section: 'overview',
    targetId: 'tour-admin-fast-actions',
    title: 'Admin Command Bar',
    subtitle: 'Fast Provisioning & System Audit',
    description:
      'Quickly provision teacher accounts, register students, inspect single sign-on logs, or modify system parameters with one click.',
    interactionPrompt: 'Review administrative shortcuts for rapid school management!',
    actionButtonLabel: 'Next: Faculty Verification →',
    badgeLabel: 'Command Bar',
    mood: 'thinking',
  },
  {
    id: 'teachers',
    section: 'teachers',
    targetId: 'tour-admin-teachers-header',
    title: 'Faculty Security & Quotas',
    subtitle: 'Anti-Impersonation & Verification',
    description:
      'Review pending educator registration requests, verify institutional GSuite codes, and adjust account creation limits to safeguard the portal.',
    interactionPrompt: 'Inspect pending educator verifications and creation quotas!',
    actionButtonLabel: 'Next: Learner Accounts →',
    badgeLabel: 'Faculty Control',
    mood: 'reading',
  },
  {
    id: 'students',
    section: 'students',
    targetId: 'tour-admin-students-header',
    title: 'School-Wide Learner Accounts',
    subtitle: 'Institutional Student Directory',
    description:
      'Manage school-wide student accounts across all grade levels and sections. Audit credentials and export official enrollment rosters.',
    interactionPrompt: 'Review school-wide student learner accounts and grade levels!',
    actionButtonLabel: 'Next: Audit & SSO Logs →',
    badgeLabel: 'Student Directory',
    mood: 'thinking',
  },
  {
    id: 'logs',
    section: 'logs',
    targetId: 'tour-admin-logs-header',
    title: 'Activity, Auth Logs & SSO',
    subtitle: 'Tamper-Evident Institutional Audit',
    description:
      'Inspect real-time authentication events, verify student and educator logins, monitor IP addresses, and configure SMCC Google SSO.',
    interactionPrompt: 'Audit authentication events and SSO identity integrations!',
    actionButtonLabel: 'Next: System Settings →',
    badgeLabel: 'Security Audit',
    mood: 'reading',
  },
  {
    id: 'settings',
    section: 'settings',
    targetId: 'tour-admin-settings-header',
    title: 'System & Model Settings',
    subtitle: 'Engine Configuration & Cache Purge',
    description:
      'Fine-tune speech recognition parameters, configure institutional quotas, and purge session caches. You have full command of ReadBuddy!',
    interactionPrompt: 'Review system configuration, ASR thresholds, and model cache!',
    actionButtonLabel: 'Finish Tour & Enter Command!',
    badgeLabel: 'System Settings',
    mood: 'cheering',
  },
];

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

interface InteractiveFeatureTourProps {
  open: boolean;
  role?: TourRole;
  userName?: string;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  onClose: () => void;
}

export function InteractiveFeatureTour({
  open,
  role = 'student',
  userName = 'User',
  activeSection = 'overview',
  onSectionChange,
  onClose,
}: InteractiveFeatureTourProps) {
  const steps = role === 'teacher' ? TEACHER_STEPS : (role === 'admin' || role === 'principal') ? ADMIN_STEPS : STUDENT_STEPS;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [targetFound, setTargetFound] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const currentStep = steps[currentStepIndex] || steps[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  // Reset to step 0 whenever tour opens
  useEffect(() => {
    if (open) {
      setCurrentStepIndex(0);
    }
  }, [open]);

  // Keep dashboard section in sync with current tour step
  useEffect(() => {
    if (!open) return;
    if (currentStep.section && activeSection !== currentStep.section && onSectionChange) {
      onSectionChange(currentStep.section);
    }
  }, [open, currentStepIndex, currentStep.section, activeSection, onSectionChange]);

  // Measure and locate target element
  const updateTargetRect = useCallback(() => {
    if (!open) return;

    const el = document.getElementById(currentStep.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });
      setTargetFound(true);

      // Scroll smoothly so top of target is around 70px from window top
      if (rect.top < 50 || rect.bottom > window.innerHeight - 80) {
        const targetScrollTop = window.scrollY + rect.top - 70;
        window.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth',
        });
      }
    } else {
      setTargetFound(false);
      setTargetRect(null);
    }
  }, [open, currentStep.targetId]);

  // Repeatedly attempt to locate target element as section loads/renders
  useEffect(() => {
    if (!open) return;

    let attempts = 0;
    const maxAttempts = 15;

    const interval = setInterval(() => {
      attempts++;
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        updateTargetRect();
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setTargetFound(false);
        setTargetRect(null);
      }
    }, 60);

    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [open, currentStepIndex, activeSection, updateTargetRect, currentStep.targetId]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft' && !isFirst) {
        handlePrev();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isFirst, isLast]);

  function handleNext() {
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 500);

    if (isLast) {
      handleClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }

  function handlePrev() {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }

  function handleClose() {
    if (onSectionChange && activeSection !== 'overview') {
      onSectionChange('overview');
    }
    onClose();
  }

  if (!open) return null;

  const roleAccent = role === 'teacher' ? '#3D6B8A' : role === 'admin' ? '#7A4A6B' : '#E8873A';

  // Compute Popover Position with strict viewport bounds
  const CARD_WIDTH = Math.min(360, typeof window !== 'undefined' ? window.innerWidth - 32 : 360);
  const MARGIN = 16;

  let popoverTop = MARGIN;
  let popoverLeft = MARGIN;

  if (typeof window !== 'undefined') {
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const actualCardHeight = cardRef.current ? cardRef.current.offsetHeight : 280;

    if (targetRect && targetFound) {
      const spaceBelow = vpH - targetRect.bottom - MARGIN;
      const spaceAbove = targetRect.top - MARGIN;

      if (spaceBelow >= actualCardHeight + 14) {
        // Place comfortably below target
        popoverTop = targetRect.bottom + 14;
        popoverLeft = Math.max(MARGIN, Math.min(targetRect.left, vpW - CARD_WIDTH - MARGIN));
      } else if (spaceAbove >= actualCardHeight + 14) {
        // Place comfortably above target
        popoverTop = targetRect.top - actualCardHeight - 14;
        popoverLeft = Math.max(MARGIN, Math.min(targetRect.left, vpW - CARD_WIDTH - MARGIN));
      } else {
        // Fallback: dock at bottom center or bottom right with guaranteed margin
        popoverTop = Math.max(MARGIN, vpH - actualCardHeight - MARGIN);
        popoverLeft = Math.max(MARGIN, Math.min(targetRect.left, vpW - CARD_WIDTH - MARGIN));
      }
    } else {
      // Screen center fallback
      popoverTop = Math.max(MARGIN, (vpH - 280) / 2);
      popoverLeft = Math.max(MARGIN, (vpW - CARD_WIDTH) / 2);
    }

    // Final boundary safety clamp
    popoverTop = Math.max(MARGIN, Math.min(popoverTop, vpH - actualCardHeight - MARGIN));
    popoverLeft = Math.max(MARGIN, Math.min(popoverLeft, vpW - CARD_WIDTH - MARGIN));
  }

  const badgeBelow = targetRect ? targetRect.top < 50 : false;

  return (
    <div className="fixed inset-0 z-[9990] select-none">
      {/* ─── Backdrop Scrim with Crystal-Clear Spotlight Hole ─── */}
      {targetRect && targetFound ? (
        /* The spotlight box uses box-shadow: 0 0 0 9999px rgba(...) to create a 100% crystal-clear cutout! */
        <div
          className="fixed pointer-events-none transition-all duration-300 z-[9991]"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: 14,
            boxShadow: '0 0 0 9999px rgba(15, 33, 25, 0.78)',
            border: `3px solid ${roleAccent}`,
          }}
        >
          {/* Animated Pulsing Beacon */}
          <div
            className="absolute -inset-1.5 rounded-2xl border-2 animate-ping opacity-40 pointer-events-none"
            style={{ borderColor: roleAccent }}
          />

          {/* Smart Badge: Placed below target if near top of window, else above */}
          <div
            className={`absolute px-2.5 py-1 rounded-md bg-[#FFFDF8] border-2 font-mono font-bold text-[10px] shadow-[2px_2px_0px_#1F4D3A] flex items-center gap-1.5 animate-bounce pointer-events-none whitespace-nowrap z-10 ${
              badgeBelow ? 'top-full mt-2 left-2' : '-top-8 left-2'
            }`}
            style={{ borderColor: '#1F4D3A', color: '#1F4D3A' }}
          >
            <MousePointerClick className="w-3 h-3 text-[#E8873A]" strokeWidth={2.5} />
            <span>{currentStep.badgeLabel || 'Featured Section'}</span>
          </div>
        </div>
      ) : (
        /* Fallback dark overlay when transitioning between sections */
        <div
          className="fixed inset-0 bg-[#0F2119]/75 backdrop-blur-[2px] transition-opacity duration-300 z-[9991]"
          onClick={handleClose}
        />
      )}

      {/* ─── Floating Soft-Neobrutalism Interactive Guide Card ─── */}
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          top: `${popoverTop}px`,
          left: `${popoverLeft}px`,
          width: `${CARD_WIDTH}px`,
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          zIndex: 9999,
        }}
        className="bg-[#FFFDF8] border-3 border-[#1F4D3A] rounded-2xl shadow-[6px_6px_0px_#1F4D3A] p-4 sm:p-4.5 font-sans rb-fade-in-up transition-all duration-200"
      >
        {/* Celebration Sparks */}
        {celebrating && (
          <div className="absolute -top-3 -right-3 p-1.5 rounded-full bg-[#FCEDDE] border-2 border-[#1F4D3A] shadow-[2px_2px_0px_#1F4D3A] animate-ping flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#E8873A]" />
          </div>
        )}

        {/* Header: Step Counter, Mode Badge & Skip Button */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b-2 border-[#DED2B4]">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
              style={{
                background: `${roleAccent}15`,
                color: roleAccent,
                borderColor: `${roleAccent}44`,
              }}
            >
              Interactive Tour
            </span>
            <span className="text-[11px] font-mono font-bold text-gray-500">
              {currentStepIndex + 1} / {steps.length}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-[#1F4D3A] p-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-bold"
            title="Exit tour"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Mascot + Title & Subtitle */}
        <div className="flex items-start gap-3 mb-2.5">
          <div className="shrink-0 p-1 rounded-xl bg-[#F5EFE0] border-2 border-[#1F4D3A] shadow-[2px_2px_0px_#1F4D3A] flex items-center justify-center">
            <ReadBuddyMascot
              mood={currentStep.mood}
              size={46}
              soundEnabled={false}
              animated={true}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="font-serif font-bold text-sm text-[#1F4D3A] leading-snug mb-0.5"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {currentStep.title}
            </h3>
            <p
              className="text-[10px] font-mono font-bold text-[#E8873A] mb-1 leading-tight"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {currentStep.subtitle}
            </p>
            <p className="text-[11px] text-[#2B2621]/90 font-sans leading-relaxed">
              {currentStep.description}
            </p>
          </div>
        </div>

        {/* Interactive Prompt Callout */}
        <div className="p-2 rounded-xl bg-[#FCEDDE]/80 border-2 border-[#F0C99A] mb-2.5 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#E8873A] shrink-0" strokeWidth={2.25} />
          <span className="text-[10px] font-sans font-bold text-[#8A481E] leading-tight">
            {currentStep.interactionPrompt}
          </span>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleNext}
          className="w-full py-2 px-3.5 rounded-xl text-white font-bold text-xs font-sans border-2 border-[#133326] shadow-[2.5px_2.5px_0px_#133326] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#133326] transition-all cursor-pointer flex items-center justify-center gap-2 mb-2.5"
          style={{
            background: `linear-gradient(135deg, ${roleAccent}, #1F4D3A)`,
          }}
        >
          <span>{currentStep.actionButtonLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* Footer Stepper Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#DED2B4]">
          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStepIndex(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === currentStepIndex
                    ? 'w-5 bg-[#E8873A] border border-[#9C4B0E]'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                title={`Jump to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Back & Next/Done Buttons */}
          <div className="flex items-center gap-1.5">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="px-2.5 py-1 rounded-lg bg-[#FFFDF8] text-[#1F4D3A] font-bold text-[10px] font-sans border-2 border-[#1F4D3A] shadow-[1.5px_1.5px_0px_#1F4D3A] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1F4D3A] transition-all cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-3 py-1 rounded-lg bg-[#1F4D3A] text-white font-bold text-[10px] font-sans border-2 border-[#133326] shadow-[2px_2px_0px_#133326] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#133326] transition-all cursor-pointer flex items-center gap-1"
            >
              <span>{isLast ? 'Done' : 'Next'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveFeatureTour;
