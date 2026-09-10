'use client';

import React, { useState, useEffect } from 'react';
import { ReadBuddyMascot, MascotMood } from '../brand';
import { Sparkles, Lightbulb, Check, X, ArrowRight, ArrowLeft } from 'lucide-react';

export type TourRole = 'student' | 'teacher' | 'admin' | 'principal';

interface TourSlide {
  title: string;
  subtitle: string;
  description: string;
  mood: MascotMood;
  badges?: string[];
  tips?: string;
  icon?: string;
}

const STUDENT_SLIDES: TourSlide[] = [
  {
    title: "Welcome to ReadBuddy!",
    subtitle: "Your AI-Powered Reading & Comprehension Companion",
    description:
      "Hi there! I'm Buddy, your scholar bookworm guide. ReadBuddy is designed to help SMCC students build reading confidence, improve pronunciation, and master comprehension.",
    mood: 'happy',
    badges: ['SMCC Basic Education', 'Grades 7–10', 'Phil-IRI Aligned'],
    tips: "Tip: You can tap or poke me anytime on your dashboard for fun scholar reactions!",
  },
  {
    title: "Practice Stories & Assigned Tests",
    subtitle: "Two Ways to Read and Grow",
    description:
      "Explore self-paced reading practice with your favorite stories, or complete official reading assessments assigned by your English teacher.",
    mood: 'reading',
    badges: ['Self-Paced Reading', 'Teacher Assessments', 'Vocabulary Hub'],
    tips: "Assigned tests show up right on your dashboard with instructions from your teacher.",
  },
  {
    title: "Read Aloud with Speech AI",
    subtitle: "Real-Time Pronunciation Guidance",
    description:
      "When you read aloud, our private on-device speech engine listens and highlights words in real-time, helping you catch mispronounced words without pressure.",
    mood: 'listening',
    badges: ['Speech Recognition', 'Offline Safe', 'No Judgment Zone'],
    tips: "Ensure your microphone is connected and speak clearly at your natural pace.",
  },
  {
    title: "Comprehension & Phil-IRI Levels",
    subtitle: "Instant Understanding Diagnostics",
    description:
      "After reading, answer comprehension questions to calculate your official Phil-IRI Reading Profile: Independent, Instructional, or Needs Practice.",
    mood: 'thinking',
    badges: ['Phil-IRI Standards', 'Literal & Inferential', 'Instant Feedback'],
    tips: "Aim for 90%+ word accuracy and 80%+ comprehension to reach Independent level!",
  },
  {
    title: "My Notebook & Study History",
    subtitle: "Personal Study Sanctuary",
    description:
      "Take notes, review vocabulary words, access teacher course packets, and monitor your reading improvements across every single session.",
    mood: 'cheering',
    badges: ['Personal Notes', 'Study History', 'Ready to Read!'],
    tips: "You're all set! Let's embark on your first reading adventure together.",
  },
];

const TEACHER_SLIDES: TourSlide[] = [
  {
    title: "Welcome, Educator!",
    subtitle: "SMCC Reading Studio Management",
    description:
      "Welcome to ReadBuddy Educator Portal. Oversee your assigned class sections, monitor student reading diagnostics, and guide students toward reading independence.",
    mood: 'happy',
    badges: ['Teacher Portal', 'Class Management', 'Phil-IRI Diagnostics'],
  },
  {
    title: "Authoring Custom Passages",
    subtitle: "Grade-Level Tailored Content",
    description:
      "Create and format English or Filipino reading passages, set target word counts, and author custom multiple-choice comprehension questions with ease.",
    mood: 'reading',
    badges: ['English & Filipino', 'Custom Quizzes', 'Vocabulary Bank'],
  },
  {
    title: "Assigning Phil-IRI Assessments",
    subtitle: "Targeted Classroom Dispatches",
    description:
      "Dispatch reading tests to entire sections or individual students needing remedial practice. Tests are graded automatically by the AI system.",
    mood: 'thinking',
    badges: ['Instant AI Grading', 'Automated Rubrics', 'Section Dispatch'],
  },
  {
    title: "Real-Time Reading Telemetry",
    subtitle: "Comprehensive Student Insights",
    description:
      "Review Word Recognition Accuracy, Comprehension Scores, Oral Reading Rates, and track Phil-IRI tier distribution across your entire class.",
    mood: 'cheering',
    badges: ['Phil-IRI Analytics', 'CSV Export', 'Audit Trail'],
  },
];

const ADMIN_SLIDES: TourSlide[] = [
  {
    title: "Institutional Command Center",
    subtitle: "Platform Administration & Governance",
    description:
      "Oversee school-wide accounts, manage teacher verification requests, configure security rate limiters, and inspect institutional system telemetry.",
    mood: 'happy',
    badges: ['Administrator Hub', 'RBAC Security', 'SMCC Nasipit'],
  },
  {
    title: "Faculty Verification & Account Limiting",
    subtitle: "Prevent Impersonation & Secure Portals",
    description:
      "Approve new teacher registration requests with institutional verification codes and adjust account creation limits to safeguard the school ecosystem.",
    mood: 'thinking',
    badges: ['Teacher Verification', 'Account Limiter', 'Access Control'],
  },
  {
    title: "Audit Streams & SSO Telemetry",
    subtitle: "Complete Institutional Transparency",
    description:
      "Inspect real-time authentication logs, track user activity streams, verify IP addresses, and manage single sign-on configurations.",
    mood: 'reading',
    badges: ['Tamper-Evident Logs', 'SSO Security', 'Audit Trail'],
  },
  {
    title: "Server & Speech AI Engine Health",
    subtitle: "Zero-Downtime Infrastructure",
    description:
      "Monitor speech-to-text engine latency, GPU memory allocation, and database connectivity to ensure seamless reading sessions for all students.",
    mood: 'cheering',
    badges: ['GPU Telemetry', 'Speech-to-Text Monitor', 'System Ready'],
  },
];

interface ReadBuddyTourModalProps {
  open: boolean;
  role?: TourRole;
  userName?: string;
  onClose: () => void;
}

export function ReadBuddyTourModal({
  open,
  role = 'student',
  userName = 'Scholar',
  onClose,
}: ReadBuddyTourModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const slides =
    role === 'teacher'
      ? TEACHER_SLIDES
      : role === 'admin' || role === 'principal'
      ? ADMIN_SLIDES
      : STUDENT_SLIDES;

  const currentSlide = slides[currentIndex] || slides[0];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === slides.length - 1;

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setShowConfetti(false);
    }
  }, [open]);

  if (!open) return null;

  function handleNext() {
    if (isLast) {
      setShowConfetti(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function handlePrev() {
    if (!isFirst) {
      setCurrentIndex((prev) => prev - 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* ─── Tour Dialog Container (Soft-Neobrutalism Design) ─── */}
      <div className="w-full max-w-xl bg-[#FFFDF8] border-3 border-[#1F4D3A] rounded-3xl shadow-[7px_7px_0px_#1F4D3A] p-6 sm:p-7 relative overflow-hidden rb-fade-in-up">
        {/* Floating Confetti Elements */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
            <div className="flex items-center gap-3 animate-ping text-[#E8873A]">
              <Sparkles className="w-8 h-8" />
              <Sparkles className="w-10 h-10 text-amber-400" />
              <Sparkles className="w-8 h-8" />
            </div>
          </div>
        )}

        {/* ─── Header Bar: Step Counter & Skip ─── */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-[#DED2B4]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E8873A] bg-[#FCEDDE] px-2.5 py-0.5 rounded-lg border border-[#F0C99A]">
              Interactive Guide
            </span>
            <span className="text-xs font-mono font-bold text-gray-500">
              Step {currentIndex + 1} of {slides.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-xs font-bold font-sans text-gray-400 hover:text-[#1F4D3A] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Skip Guide</span>
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>

        {/* ─── Mascot Hero Presentation ─── */}
        <div className="flex flex-col sm:flex-row items-center gap-5 my-2">
          {/* Animated Mascot Frame */}
          <div className="shrink-0 p-3 rounded-2xl bg-[#F5EFE0] border-2 border-[#1F4D3A] shadow-[3px_3px_0px_#1F4D3A] flex items-center justify-center">
            <ReadBuddyMascot
              mood={currentSlide.mood}
              size={92}
              soundEnabled={false}
            />
          </div>

          {/* Slide Text Content */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2
              className="font-serif font-bold text-xl sm:text-2xl text-[#1F4D3A] leading-tight mb-1"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {currentSlide.title}
            </h2>
            <p
              className="text-xs font-bold text-[#E8873A] mb-2 font-mono"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {currentSlide.subtitle}
            </p>
            <p
              className="text-xs text-[#2B2621]/80 font-sans leading-relaxed"
              style={{ fontFamily: "'Figtree', sans-serif" }}
            >
              {currentSlide.description}
            </p>
          </div>
        </div>

        {/* ─── Badges & Highlight Tips ─── */}
        {currentSlide.badges && currentSlide.badges.length > 0 && (
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-4 pt-3 border-t border-[#DED2B4]/60">
            {currentSlide.badges.map((b, i) => (
              <span
                key={i}
                className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-md bg-[#FFFDF8] border border-[#1F4D3A] text-[#1F4D3A] shadow-[1.5px_1.5px_0px_#1F4D3A] flex items-center gap-1"
              >
                <Check className="w-3 h-3 text-[#1F4D3A]" strokeWidth={2.5} />
                <span>{b}</span>
              </span>
            ))}
          </div>
        )}

        {currentSlide.tips && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#FCEDDE]/60 border border-[#F0C99A] text-[11px] font-sans text-[#8A481E] flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#8A481E] shrink-0" strokeWidth={2.25} />
            <span>{currentSlide.tips}</span>
          </div>
        )}

        {/* ─── Footer: Stepper Dots & Navigation Buttons ─── */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-[#DED2B4]">
          {/* Progress Stepper Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  i === currentIndex
                    ? 'w-7 bg-[#E8873A] border border-[#9C4B0E]'
                    : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                }`}
                title={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Tactile Navigation Buttons */}
          <div className="flex items-center gap-2.5">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-1.5 rounded-xl bg-[#FFFDF8] text-[#1F4D3A] font-bold text-xs font-sans border-2 border-[#1F4D3A] shadow-[2px_2px_0px_#1F4D3A] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1F4D3A] transition-all cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-[#1F4D3A] text-white font-bold text-xs font-sans border-2 border-[#133326] shadow-[3px_3px_0px_#133326] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#133326] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{isLast ? "Let's Get Started!" : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ReadBuddyTourModal;
