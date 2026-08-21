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

const MOCK_ASSIGNED_TESTS: Record<string, AssignedTestData> = {
  'asn-1': {
    id: 'asn-1',
    teacherName: 'Ms. Santos',
    passagePreview: 'The sun was setting over the quiet village. Maria walked home from school...',
    passageText: 'The sun was setting over the quiet village. Maria walked home from school, thinking about the science project due tomorrow.',
    sourceLanguage: 'en',
    wordCount: 42,
    instructions: 'Read slowly and pronounce each word clearly. Answer all questions after reading.',
    assignedAt: 'Today',
    customQuestions: [
      {
        id: 'q1',
        question_text: 'Where was Maria walking home from?',
        question_type: 'literal',
        choices: ['From the market', 'From school', 'From her friend’s house', 'From the library'],
        correct_choice_index: 1,
        order_index: 0,
      },
      {
        id: 'q2',
        question_text: 'Why was Maria thinking deeply on her walk home?',
        question_type: 'inferential',
        choices: ['She lost her homework', 'She was worried about her science project due tomorrow', 'She forgot her lunchbox', 'She was excited for a party'],
        correct_choice_index: 1,
        order_index: 1,
      },
      {
        id: 'q3',
        question_text: 'What should Maria do first when she arrives home to be responsible?',
        question_type: 'critical',
        choices: ['Watch television', 'Start working on her science project', 'Go out to play', 'Take a long nap'],
        correct_choice_index: 1,
        order_index: 2,
      },
    ],
  },
  'pt-1': {
    id: 'pt-1',
    teacherName: 'Ms. Santos',
    passagePreview: 'Si Ana ay may alagang pusa na nagngangalang Puti...',
    passageText: 'Si Ana ay may alagang pusa na nagngangalang Puti. Tuwing hapon, pinapakain niya ito ng gatas at tuyong pagkain.',
    sourceLanguage: 'tl',
    wordCount: 38,
    instructions: 'Basahin nang malinaw at sagutan ang mga tanong sa pag-unawa.',
    assignedAt: 'Yesterday',
    customQuestions: [
      {
        id: 'q1',
        question_text: 'Ano ang pangalan ng alagang pusa ni Ana?',
        question_type: 'literal',
        choices: ['Muning', 'Puti', 'Buntot', 'Kuting'],
        correct_choice_index: 1,
        order_index: 0,
      },
      {
        id: 'q2',
        question_text: 'Kailan pinapakain ni Ana ang kaniyang alaga?',
        question_type: 'inferential',
        choices: ['Tuwing umaga', 'Tuwing tanghali', 'Tuwing hapon', 'Tuwing gabi'],
        correct_choice_index: 2,
        order_index: 1,
      },
      {
        id: 'q3',
        question_text: 'Bakit mahalagang pakainin at alagaan nang maayos ang ating mga alagang hayop?',
        question_type: 'critical',
        choices: ['Upang sila ay manatiling malusog at masaya', 'Upang sila ay makapagtago', 'Upang hindi sila maingay', 'Upang makatrabaho sila'],
        correct_choice_index: 0,
        order_index: 2,
      },
    ],
  },
};

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const testId = searchParams.get('testId');

  const isAssignedTest = Boolean(testId);
  const assignedTestData = testId ? MOCK_ASSIGNED_TESTS[testId] || MOCK_ASSIGNED_TESTS['asn-1'] : null;

  const [step, setStep] = useState<SessionStep>(isAssignedTest ? 'briefing' : 'input');
  const [passageText, setPassageText] = useState(assignedTestData ? assignedTestData.passageText : '');
  const [pendingText, setPendingText] = useState('');
  const [wordPct, setWordPct] = useState(92);
  const [compPct, setCompPct] = useState(80);
  const [language, setLanguage] = useState<'en' | 'tl'>(assignedTestData ? assignedTestData.sourceLanguage : 'en');

  useEffect(() => {
    if (assignedTestData) {
      setPassageText(assignedTestData.passageText);
      setLanguage(assignedTestData.sourceLanguage);
      setStep('briefing');
    }
  }, [testId, assignedTestData]);

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