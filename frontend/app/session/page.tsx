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
      const teacherTests = JSON.parse(localStorage.getItem('readbuddy_teacher_tests') || '[]');
      let foundTest = teacherTests.find((t: any) => t.id === testId);
      
      if (!foundTest) {
         for (const t of teacherTests) {
            const assignment = (t.assignments || []).find((a: any) => a.id === testId);
            if (assignment) {
               foundTest = { ...t, ...assignment };
               break;
            }
         }
      }

      if (foundTest) {
        const testData: AssignedTestData = {
          id: testId,
          teacherName: 'Teacher',
          passagePreview: foundTest.passageText ? foundTest.passageText.substring(0, 100) + '...' : '',
          passageText: foundTest.passageText || '',
          sourceLanguage: foundTest.language || 'en',
          wordCount: foundTest.passageText ? foundTest.passageText.split(/\s+/).length : 0,
          instructions: foundTest.instructions || 'Please complete this reading assessment.',
          assignedAt: new Date().toLocaleDateString(),
          customQuestions: foundTest.customQuestions || []
        };
        setAssignedTestData(testData);
        setPassageText(testData.passageText);
        setLanguage(testData.sourceLanguage);
        setStep('briefing');
      }
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

    // 1. Save reading session to student's history in localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('readbuddy_student_sessions') || '[]');
      const newSession = {
        id: `ses-${Date.now()}`,
        passage_preview: passageText.slice(0, 65) + (passageText.length > 65 ? '...' : ''),
        source_language: language,
        word_recognition_score: finalWordPct,
        comprehension_score: calculatedCompPct,
        phil_iri_level: overallLevel,
        date: new Date().toISOString().split('T')[0],
      };
      localStorage.setItem('readbuddy_student_sessions', JSON.stringify([newSession, ...existing]));
    } catch (e) {}

    // 2. If assigned test, update teacher's test assignment tracking in localStorage
    if (isAssignedTest && testId) {
      try {
        const savedUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
        const studentName = savedUser.display_name || 'Maria Garcia';
        const teacherTests = JSON.parse(localStorage.getItem('readbuddy_teacher_tests') || '[]');
        
        const updatedTests = teacherTests.map((t: any) => {
          return {
            ...t,
            assignments: (t.assignments || []).map((a: any) => {
              if (a.id === testId || t.id === testId || a.student_name === studentName) {
                return {
                  ...a,
                  word_recognition_score: finalWordPct,
                  comprehension_score: calculatedCompPct,
                  phil_iri_level: overallLevel,
                  status: 'completed',
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