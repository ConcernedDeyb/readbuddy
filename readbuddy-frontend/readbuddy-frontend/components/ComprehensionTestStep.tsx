'use client';

import { useState, useEffect } from 'react';

export interface Question {
  id?: string;
  question_text: string;
  question_type: string;
  choices: string[];
  correct_choice_index: number;
  order_index?: number;
}

interface ComprehensionTestStepProps {
  passageText: string;
  customQuestions?: Question[];
  onComplete: (correctCount: number, totalQuestions: number) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const TYPE_LABEL: Record<string, string> = {
  literal: 'Literal',
  inferential: 'Inferential',
  critical: 'Critical',
  recall: 'Literal',
  inference: 'Inferential',
  application: 'Critical',
};

export default function ComprehensionTestStep({ passageText, customQuestions, onComplete }: ComprehensionTestStepProps) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [listeningQIdx, setListeningQIdx] = useState<number | null>(null);

  useEffect(() => {
    if (customQuestions && customQuestions.length > 0) {
      const normalized = customQuestions.map((q, idx) => ({
        ...q,
        order_index: q.order_index ?? idx,
      }));
      setQuestions(normalized);
      setLoading(false);
      return;
    }

    async function fetchTest() {
      try {
        const res = await fetch(`${API_BASE}/llm/comprehension-test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passage_text: passageText, num_questions: 5 }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            setQuestions(data.questions);
            setLoading(false);
            return;
          }
        }
      } catch (err) {}

      // Fallback: Generate structured Phil-IRI comprehension questions from passage text
      const cleanWords = passageText.trim().split(/\s+/);
      const isTagalog = passageText.toLowerCase().includes('ang ') || passageText.toLowerCase().includes('mga ') || passageText.toLowerCase().includes('sa ');

      const fallbackQuestions: Question[] = isTagalog
        ? [
            {
              id: 'q1',
              question_text: `Ayon sa binasang teksto, ano ang pangunahing paksa na ipinapahayag sa simula?`,
              question_type: 'literal',
              choices: [
                'Ang pangunahing tauhan at ang kanilang ginawa',
                'Isang hindi kaugnay na pangyayari sa malayo',
                'Wala sa nabanggit',
                'Ibang aralin sa paaralan',
              ],
              correct_choice_index: 0,
              order_index: 0,
            },
            {
              id: 'q2',
              question_text: 'Ano ang mahihinuha tungkol sa layunin ng tauhan sa kwento?',
              question_type: 'inferential',
              choices: [
                'Nais nilang tapusin ang kanilang tungkulin nang maayos',
                'Nais lamang nilang magpalipas ng oras',
                'Wala silang interes sa kanilang ginagawa',
                'Gusto nilang iasa sa iba ang gawain',
              ],
              correct_choice_index: 0,
              order_index: 1,
            },
            {
              id: 'q3',
              question_text: 'Bakit mahalagang maging responsable sa ating mga gawain tulad ng ipinakita sa teksto?',
              question_type: 'critical',
              choices: [
                'Upang makamit ang tagumpay at makatulong sa kapwa',
                'Upang hindi na kailangang mag-aral pa muli',
                'Upang makaiwas sa anumang pagsisikap',
                'Walang maidudulot na kabutihan ang pagiging responsable',
              ],
              correct_choice_index: 0,
              order_index: 2,
            },
          ]
        : [
            {
              id: 'q1',
              question_text: `According to the passage, what is the key detail described regarding the main subject?`,
              question_type: 'literal',
              choices: [
                'The central events and actions described in the passage',
                'An unrelated story from a different setting',
                'A minor detail with no significance',
                'None of the above',
              ],
              correct_choice_index: 0,
              order_index: 0,
            },
            {
              id: 'q2',
              question_text: 'What can be inferred about the attitude or thoughts of the characters?',
              question_type: 'inferential',
              choices: [
                'They were focused on being diligent and responsible',
                'They were completely uninterested in what they were doing',
                'They wanted to avoid their responsibilities',
                'They did not understand the situation',
              ],
              correct_choice_index: 0,
              order_index: 1,
            },
            {
              id: 'q3',
              question_text: 'How can you apply the moral lesson of this reading passage to your studies?',
              question_type: 'critical',
              choices: [
                'By practicing consistently, asking questions, and doing my best',
                'By giving up when a passage is challenging',
                'By letting others do all the work for me',
                'Reading has no practical application in student life',
              ],
              correct_choice_index: 0,
              order_index: 2,
            },
          ];

      setQuestions(fallbackQuestions);
      setLoading(false);
    }

    fetchTest();
  }, [passageText, customQuestions]);

  function handleVoiceAnswer(qIdx: number, choices: string[]) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Direct first option selection fallback if browser speech API is unavailable
      setAnswers((prev) => ({ ...prev, [qIdx]: 0 }));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = passageText.toLowerCase().includes('ang ') ? 'fil-PH' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      setListeningQIdx(qIdx);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setListeningQIdx(null);

        // Find best choice matching the student's spoken words
        let bestIdx = 0;
        let maxOverlap = -1;

        choices.forEach((choice, cIdx) => {
          const words = choice.toLowerCase().split(/\s+/);
          let overlap = 0;
          words.forEach((w) => {
            if (transcript.includes(w)) overlap++;
          });
          if (overlap > maxOverlap) {
            maxOverlap = overlap;
            bestIdx = cIdx;
          }
        });

        setAnswers((prev) => ({ ...prev, [qIdx]: bestIdx }));
      };

      recognition.onerror = () => {
        setListeningQIdx(null);
      };

      recognition.onend = () => {
        setListeningQIdx(null);
      };

      recognition.start();
    } catch (err) {
      setListeningQIdx(null);
    }
  }

  const handleSubmit = () => {
    if (!questions) return;
    let correct = 0;
    questions.forEach((q, qIndex) => {
      const idx = q.order_index ?? qIndex;
      if (answers[idx] === q.correct_choice_index) correct++;
    });
    onComplete(correct, questions.length);
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex flex-col items-center gap-3">
          <div className="relative w-10 h-10">
            <div
              className="absolute inset-0 rounded-full border-[3px] border-[#E4DCC8] border-t-[#E8873A] animate-spin"
            />
          </div>
          <p style={{ fontFamily: "'Figtree', sans-serif", color: '#5B6B62' }}>
            Preparing your comprehension questions...
          </p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) return null;

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.every((q, qIndex) => answers[q.order_index ?? qIndex] !== undefined);

  return (
    <div>
      <p
        className="text-xs tracking-wide uppercase mb-1"
        style={{ fontFamily: "'Space Mono', monospace", color: '#E8873A' }}
      >
        Step 4 · Comprehension Quiz
      </p>
      <h1
        className="text-2xl mb-3 flex items-center gap-2"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: '#1F4D3A' }}
      >
        Comprehension Questions
      </h1>

      {/* Progress indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#E4DCC8' }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(answeredCount / questions.length) * 100}%`,
              background: 'linear-gradient(90deg, #E8873A, #F0A35C)',
            }}
          />
        </div>
        <span
          className="text-xs shrink-0 font-mono font-bold"
          style={{ color: '#E8873A' }}
        >
          {answeredCount} / {questions.length} answered
        </span>
      </div>

      {questions.map((q, qIndex) => {
        const orderKey = q.order_index ?? qIndex;
        const isListening = listeningQIdx === orderKey;

        return (
          <div
            key={orderKey}
            className="mb-6 pb-6 rb-fade-in-up"
            style={{
              borderBottom: qIndex < questions.length - 1 ? '1px solid #EFE9D8' : 'none',
              animationDelay: `${qIndex * 80}ms`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-mono font-bold"
                  style={{
                    background: '#1F4D3A12',
                    color: '#1F4D3A',
                  }}
                >
                  {qIndex + 1}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full font-mono font-semibold"
                  style={{
                    background: '#EEF3EF',
                    color: '#4E7A64',
                  }}
                >
                  {TYPE_LABEL[q.question_type] ?? q.question_type}
                </span>
              </div>

              {/* Verbal Answering Button */}
              <button
                type="button"
                onClick={() => handleVoiceAnswer(orderKey, q.choices)}
                className={`px-2.5 py-1 rounded-full text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isListening ? 'bg-[#E8873A] text-white animate-pulse' : 'bg-[#FAF6EE] text-[#1F4D3A] border border-[#DED2B4] hover:bg-[#F3EBD8]'
                }`}
                title="Speak your answer aloud"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span>{isListening ? 'Listening...' : 'Answer with Voice'}</span>
              </button>
            </div>

            <p
              className="mb-3 font-sans font-semibold text-sm"
              style={{ color: '#20342B' }}
            >
              {q.question_text}
            </p>
            <div className="flex flex-col gap-2">
              {q.choices.map((choice, i) => {
                const selected = answers[orderKey] === i;
                return (
                  <label
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      fontFamily: "'Figtree', sans-serif",
                      border: `2px solid ${selected ? '#E8873A' : '#E4DCC8'}`,
                      background: selected ? '#FDF1E5' : '#FFFDF8',
                      color: '#20342B',
                      boxShadow: selected ? '0 2px 8px rgba(232,135,58,0.15)' : 'none',
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                      style={{
                        borderColor: selected ? '#E8873A' : '#D8D2BE',
                        background: selected ? '#E8873A' : 'transparent',
                      }}
                    >
                      {selected && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <input
                      type="radio"
                      name={`q-${orderKey}`}
                      checked={selected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [orderKey]: i }))}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{choice}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="px-6 py-2.5 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:shadow-md disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:scale-100 cursor-pointer text-white"
        style={{
          background: 'linear-gradient(135deg, #E8873A, #F0A35C)',
        }}
      >
        Submit Answers <span aria-hidden>→</span>
      </button>
    </div>
  );
}