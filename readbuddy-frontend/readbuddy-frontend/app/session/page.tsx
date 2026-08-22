'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StepShell, { SessionStep } from '@/components/StepShell';
import InputMethodStep from '@/components/InputMethodStep';
import ReviewTextStep from '@/components/ReviewTextStep';
import GuidedReading from '@/components/GuidedReading';
import ComprehensionTestStep from '@/components/ComprehensionTestStep';
import ResultStep from '@/components/ResultStep';
import AssignedTestBriefingStep, { AssignedTestData } from '@/components/AssignedTestBriefingStep';
import AssignedTestSubmissionStep from '@/components/AssignedTestSubmissionStep';
import { overallTier } from '@/lib/scoring';

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const testId = searchParams.get('testId');

  const isAssignedTest = Boolean(testId);
  const [assignedTestData, setAssignedTestData] = useState<AssignedTestData | null>(null);

  const [step, setStep] = useState<SessionStep>(isAssignedTest ? 'briefing' : 'input');
  const [passageText, setPassageText] = useState('');
  const [pendingText, setPendingText] = useState('');
  const [wordPct, setWordPct] = useState(92);
  const [compPct, setCompPct] = useState(80);
  const [language, setLanguage] = useState<'en' | 'tl'>('en');

  useEffect(() => {
    if (testId) {
      try {
        const teacherTests = JSON.parse(localStorage.getItem('readbuddy_teacher_tests') || '[]');
        const teacherPassages = JSON.parse(localStorage.getItem('readbuddy_teacher_passages') || '[]');

        for (const t of teacherTests) {
          const assignment = (t.assignments || []).find((a: any) => a.id === testId || t.id === testId);
          if (assignment || t.id === testId) {
            const passage = teacherPassages.find((p: any) => p.id === t.passage_id);
            const fullText = passage?.confirmed_text || t.passage_preview || 'Assigned reading passage';
            const lang = (passage?.source_language || t.source_language || 'en') as 'en' | 'tl';
            const questions = passage?.questions || [];

            const dynamicData: AssignedTestData = {
              id: testId,
              teacherName: t.teacher_name || 'Assigned Educator',
              passagePreview: t.passage_preview || fullText.slice(0, 60),
              passageText: fullText,
              sourceLanguage: lang,
              wordCount: fullText.split(/\s+/).length,
              instructions: 'Read slowly and pronounce each word clearly. Answer all questions after reading.',
              assignedAt: t.created_at || 'Today',
              customQuestions: questions.length > 0 ? questions : undefined,
            };

            setAssignedTestData(dynamicData);
            setPassageText(dynamicData.passageText);
            setLanguage(dynamicData.sourceLanguage);
            setStep('briefing');
            return;
          }
        }
      } catch (e) {}

      // Generic dynamic fallback
      const dynamicFallback: AssignedTestData = {
        id: testId,
        teacherName: 'Assigned Educator',
        passagePreview: 'Assigned Reading Assessment',
        passageText: 'Reading is an essential skill that empowers learning, critical thinking, and communication across all basic education subjects.',
        sourceLanguage: 'en',
        wordCount: 18,
        instructions: 'Read slowly and pronounce each word clearly. Answer all questions after reading.',
        assignedAt: 'Today',
      };
      setAssignedTestData(dynamicFallback);
      setPassageText(dynamicFallback.passageText);
      setLanguage(dynamicFallback.sourceLanguage);
      setStep('briefing');
    }
  }, [testId]);

  /* Handlers for Self-Directed Practice */
  const handlePassageReady = (
    text: string,
    _sourceType: 'typed' | 'photo_ocr',
    needsReview: boolean
  ) => {
    if (needsReview) {
      setPendingText(text);
      setStep('review');
    } else {
      setPassageText(text);
      setStep('reading');
    }
  };

  const handleReviewConfirm = (confirmedText: string) => {
    setPassageText(confirmedText);
    setStep('reading');
  };

  /* Handlers for Reading & Comprehension */
  const handleReadingComplete = (correct: number, total: number) => {
    const calculatedWordPct = total > 0 ? Math.round((correct / total) * 100) : 92;
    setWordPct(calculatedWordPct);
    setStep('comprehension');
  };

  const handleComprehensionComplete = (correct: number, total: number) => {
    const calculatedCompPct = total > 0 ? Math.round((correct / total) * 100) : 80;
    const finalWordPct = wordPct || 92;
    setCompPct(calculatedCompPct);

    const overallLevel = overallTier(finalWordPct, calculatedCompPct);

    // 1. Save reading session to student's history in localStorage with full attribution
    try {
      const savedUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
      const currentStudentName = savedUser.display_name || 'Student';
      const currentStudentId = savedUser.school_id || savedUser.username || '';
      const currentTeacherName = assignedTestData?.teacherName || 'Self-Paced Practice';

      const existing = JSON.parse(localStorage.getItem('readbuddy_student_sessions') || '[]');
      const newSession = {
        id: `ses-${Date.now()}`,
        student_name: currentStudentName,
        student_id: currentStudentId,
        teacher_name: currentTeacherName,
        passage_preview: passageText.slice(0, 65) + (passageText.length > 65 ? '...' : ''),
        source_language: language,
        word_recognition_score: finalWordPct,
        comprehension_score: calculatedCompPct,
        phil_iri_level: overallLevel,
        date: new Date().toISOString().split('T')[0],
      };
      localStorage.setItem('readbuddy_student_sessions', JSON.stringify([newSession, ...existing]));
      window.dispatchEvent(new Event('readbuddy_student_sessions_updated'));
    } catch (e) {}

    // 2. If assigned test, update teacher's test assignment tracking in localStorage
    if (isAssignedTest && testId) {
      try {
        const savedUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
        const studentName = (savedUser.display_name || '').toLowerCase();
        const studentId = (savedUser.school_id || savedUser.username || '').toLowerCase();
        const teacherTests = JSON.parse(localStorage.getItem('readbuddy_teacher_tests') || '[]');

        const updatedTests = teacherTests.map((t: any) => {
          return {
            ...t,
            assignments: (t.assignments || []).map((a: any) => {
              const isMatch =
                a.id === testId ||
                (a.student_id && a.student_id.toLowerCase() === studentId) ||
                (a.student_name && a.student_name.toLowerCase() === studentName);

              if (isMatch) {
                return {
                  ...a,
                  word_recognition_score: finalWordPct,
                  comprehension_score: calculatedCompPct,
                  phil_iri_level: overallLevel,
                  status: 'completed',
                  completed_at: new Date().toISOString(),
                };
              }
              return a;
            }),
          };
        });
        localStorage.setItem('readbuddy_teacher_tests', JSON.stringify(updatedTests));
        window.dispatchEvent(new Event('readbuddy_tests_updated'));
      } catch (e) {}
    }

    setStep(isAssignedTest ? 'submission' : 'result');
  };

  const handleRestartPractice = () => {
    setPassageText('');
    setPendingText('');
    setWordPct(92);
    setCompPct(80);
    setStep('input');
  };

  const handleReturnDashboard = () => {
    router.push('/student');
  };

  return (
    <StepShell activeStep={step} mode={isAssignedTest ? 'test' : 'practice'}>
      {/* Assigned Test Step 1: Briefing */}
      {step === 'briefing' && assignedTestData && (
        <AssignedTestBriefingStep
          testData={assignedTestData}
          onStart={() => setStep('reading')}
        />
      )}

      {/* Practice Step 1: Input */}
      {step === 'input' && !isAssignedTest && (
        <InputMethodStep
          language={language}
          onLanguageChange={setLanguage}
          onPassageReady={handlePassageReady}
        />
      )}

      {/* Practice Step 2: Review Text */}
      {step === 'review' && !isAssignedTest && (
        <ReviewTextStep initialText={pendingText} onConfirm={handleReviewConfirm} />
      )}

      {/* Common Step: Guided Reading */}
      {step === 'reading' && (
        <GuidedReading
          passageText={passageText}
          language={language}
          onComplete={handleReadingComplete}
        />
      )}

      {/* Common Step: Comprehension Test */}
      {step === 'comprehension' && (
        <ComprehensionTestStep
          passageText={passageText}
          customQuestions={assignedTestData?.customQuestions}
          onComplete={handleComprehensionComplete}
        />
      )}

      {/* Practice Step 5: Self-Directed Result */}
      {step === 'result' && !isAssignedTest && (
        <ResultStep
          wordPct={wordPct}
          compPct={compPct}
          onRestart={handleRestartPractice}
          onReturnHome={handleReturnDashboard}
        />
      )}

      {/* Assigned Test Step 4: Submission Confirmation */}
      {step === 'submission' && isAssignedTest && (
        <AssignedTestSubmissionStep
          wordPct={wordPct}
          compPct={compPct}
          teacherName={assignedTestData?.teacherName || 'your teacher'}
          onReturnHome={handleReturnDashboard}
        />
      )}
    </StepShell>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={null}>
      <SessionContent />
    </Suspense>
  );
}