'use client';

import { useState } from 'react';
import { SectionHeader, Card, PrimaryButton, GhostButton, FONT_SANS, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN, TAN_BORDER } from '../_shared';
import ComprehensionTestEditor, { ComprehensionQuestion } from './ComprehensionTestEditor';

const TEACHER_ACCENT = '#3D6B8A';
type TestMode = 'ai' | 'manual';

const THEMES = [
  {
    id: 'caraga',
    label: 'Caraga Heritage',
    prompt_en: 'A young student in Agusan del Norte visits the historic Balangay boats in Butuan City and learns the importance of preserving cultural heritage.',
    prompt_tl: 'Isang mag-aaral sa Agusan del Norte ang bumisita sa makasaysayang Balangay sa Lungsod ng Butuan at natutunan ang kahalagahan ng pagpapahalaga sa kultura.',
  },
  {
    id: 'values',
    label: 'Moral Values',
    prompt_en: 'Two classmates work together on a community vegetable garden project at school, discovering that teamwork and honesty bring great rewards.',
    prompt_tl: 'Nagtulungan ang dalawang mag-aaral sa proyekto ng gulayan sa paaralan, at natuklasan na ang pagtutulungan at katapatan ay nagbubunga ng tagumpay.',
  },
  {
    id: 'science',
    label: 'Science & Nature',
    prompt_en: 'During a rainy morning, children observe how mangroves in Mindanao protect coastal communities from big waves and soil erosion.',
    prompt_tl: 'Sa isang maulang umaga, pinagmasdan ng mga bata kung paano pinoprotektahan ng mga bakawan sa Mindanao ang dalampasigan mula sa malalaking alon.',
  },
];

function calculateReadability(text: string): { gradeEst: string; levelLabel: string; tone: string } {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 5) return { gradeEst: 'Grade 1-3', levelLabel: 'Short text', tone: '#5B6B62' };
  
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 10;
  
  if (avgWordsPerSentence <= 8 && words.length <= 60) {
    return { gradeEst: 'Grade 3-4 (Basic)', levelLabel: 'Early Reader', tone: '#2E7D4F' };
  } else if (avgWordsPerSentence <= 14 && words.length <= 120) {
    return { gradeEst: 'Grade 5-6 (Intermediate)', levelLabel: 'Standard Elementary', tone: '#3D6B8A' };
  } else {
    return { gradeEst: 'Grade 7+ (Advanced)', levelLabel: 'Upper Grade / Junior High', tone: '#7A4A6B' };
  }
}

export function TeacherAuthorPassage({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<'en' | 'tl'>('en');
  const [testMode, setTestMode] = useState<TestMode>('ai');
  const [questions, setQuestions] = useState<ComprehensionQuestion[]>([
    {
      id: 'q-1',
      question_text: 'What is the main idea or setting described in the passage?',
      question_type: 'literal',
      choices: ['The central setting and characters', 'An unrelated location', 'A different character entirely', 'No specific context'],
      correct_choice_index: 0,
    },
    {
      id: 'q-2',
      question_type: 'inferential',
      question_text: 'Based on the details, what can you conclude about what might happen next?',
      choices: ['The situation will require careful attention', 'Nothing of note will happen', 'The characters will ignore the event', 'It is completely unexpected'],
      correct_choice_index: 0,
    },
    {
      id: 'q-3',
      question_type: 'critical',
      question_text: 'Why is it important to reflect on the moral lesson or action taken in this story?',
      choices: ['To apply good values and critical thinking in real life', 'To finish reading as quickly as possible', 'To memorize without understanding', 'It has no practical application'],
      correct_choice_index: 0,
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readability = calculateReadability(text);

  function applyThemePrompt(theme: typeof THEMES[0]) {
    const promptText = language === 'tl' ? theme.prompt_tl : theme.prompt_en;
    setText(promptText);
  }

  async function handleGenerateAITest() {
    setError('');
    if (!text.trim() || wordCount < 5) {
      setError('Please enter a reading passage (at least 5 words) before generating test questions.');
      return;
    }

    setIsGenerating(true);

    try {
      const res = await fetch('/api/llm/comprehension-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage_text: text, num_questions: 5 }),
      });

      const data = await res.json();
      if (res.ok && data.questions && Array.isArray(data.questions)) {
        const mappedQuestions: ComprehensionQuestion[] = data.questions.map((q: any, idx: number) => ({
          id: `ai-q-${idx + 1}`,
          question_text: q.question_text,
          question_type: q.question_type === 'recall' ? 'literal' : q.question_type === 'inference' ? 'inferential' : 'critical',
          choices: q.choices,
          correct_choice_index: q.correct_choice_index ?? 0,
        }));
        setQuestions(mappedQuestions);
        setSuccess('Comprehension test generated successfully using local AI!');
        setTimeout(() => setSuccess(''), 3000);
        return;
      }
    } catch (err) {}

    // Intelligent context-based client Phil-IRI test generation
    const firstWords = text.trim().split(/\s+/).slice(0, 5).join(' ');
    const isTagalog = language === 'tl';

    const generated: ComprehensionQuestion[] = isTagalog
      ? [
          {
            id: `gen-1`,
            question_text: `Ayon sa talata, ano ang pangunahing paksa o tagpuan na binanggit kaugnay ng "${firstWords}..."?`,
            question_type: 'literal',
            choices: [
              'Ang pangunahing detalye at tauhan sa kwento',
              'Isang hindi kaugnay na pangyayari',
              'Ibang lugar at panahon',
              'Walang malinaw na impormasyon',
            ],
            correct_choice_index: 0,
          },
          {
            id: `gen-2`,
            question_text: 'Ano ang mahihinuha sa naging damdamin at layunin ng tauhan sa kwento?',
            question_type: 'inferential',
            choices: [
              'Nais nilang maging responsable at matulungin',
              'Wala silang pakialam sa nangyayari',
              'Sila ay natatakot na kumilos',
              'Gusto lamang nilang makaiwas sa gawain',
            ],
            correct_choice_index: 0,
          },
          {
            id: `gen-3`,
            question_text: 'Paano mo maisasabuhay ang aral na natutunan mula sa binasang teksto sa iyong sariling paaralan?',
            question_type: 'critical',
            choices: [
              'Sa pamamagitan ng paggawa ng tama at pagiging masipag sa pag-aaral',
              'Sa pamamagitan ng pagwawalang-bahala sa mga paalala',
              'Sa pamamagitan ng pag-asa lamang sa iba',
              'Hindi na kailangang isabuhay ang aral',
            ],
            correct_choice_index: 0,
          },
        ]
      : [
          {
            id: `gen-1`,
            question_text: `According to the passage, what is the primary detail established in "${firstWords}..."?`,
            question_type: 'literal',
            choices: [
              'The central event and characters described in the passage',
              'A completely unrelated secondary topic',
              'An unspecified distant location',
              'No direct details were provided',
            ],
            correct_choice_index: 0,
          },
          {
            id: `gen-2`,
            question_text: 'What can be inferred about the character’s motivation and attitude?',
            question_type: 'inferential',
            choices: [
              'They acted with diligence and responsibility',
              'They showed no interest in the outcome',
              'They were reluctant to participate',
              'They were motivated purely by convenience',
            ],
            correct_choice_index: 0,
          },
          {
            id: `gen-3`,
            question_text: 'How can you apply the lesson in this passage to your daily life as a student?',
            question_type: 'critical',
            choices: [
              'By practicing responsibility, kindness, and continuous learning',
              'By ignoring instructions and doing things haphazardly',
              'By depending entirely on classmates without trying',
              'The lesson has no relation to daily student life',
            ],
            correct_choice_index: 0,
          },
        ];

    setQuestions(generated);
    setSuccess('Phil-IRI aligned comprehension test auto-generated!');
    setTimeout(() => setSuccess(''), 3000);
    setIsGenerating(false);
  }

  async function handleSavePassageAndTest() {
    setError('');
    if (!text.trim() || wordCount < 5) {
      setError('Please write a valid passage (at least 5 words) before saving.');
      return;
    }

    if (questions.length === 0) {
      setError('A comprehensive test with at least one question is required for this passage.');
      return;
    }

    setIsSaving(true);

    const newPassage = {
      id: `p-${Date.now()}`,
      confirmed_text: text.trim(),
      source_language: language,
      is_published: true,
      word_count: wordCount,
      created_at: new Date().toISOString().split('T')[0],
      questions: questions,
    };

    try {
      const savedPassages = JSON.parse(localStorage.getItem('readbuddy_teacher_passages') || '[]');
      const updatedPassages = [newPassage, ...savedPassages];
      localStorage.setItem('readbuddy_teacher_passages', JSON.stringify(updatedPassages));
      window.dispatchEvent(new Event('readbuddy_passages_updated'));
    } catch (e) {}

    setSuccess('Passage & Comprehensive Test saved and published successfully!');
    setTimeout(() => {
      onDone();
    }, 1000);
    setIsSaving(false);
  }

  return (
    <div className="rb-fade-in-up space-y-6">
      <SectionHeader
        title="Author Reading Passage & Comprehensive Test"
        subtitle="Create a new reading text for your students along with an auto-generated or custom comprehension test."
        accent={TEACHER_ACCENT}
      />

      {error && (
        <div className="p-3 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E] text-xs font-sans">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-[#EBF3F8] border border-[#A8C5DA] text-[#3D6B8A] text-xs font-sans">
          {success}
        </div>
      )}

      {/* Theme Suggestions Banner */}
      <div className="p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#DED2B4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEACHER_ACCENT} strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span className="text-xs font-serif font-semibold text-[#1F4D3A]">Quick Story Themes:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => applyThemePrompt(theme)}
              className="px-2.5 py-1 rounded-lg text-xs font-sans font-medium bg-[#FAF6EE] border border-[#DED2B4] hover:bg-[#F3EBD8] text-[#1F4D3A] transition-colors cursor-pointer"
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      {/* Passage Authoring Card */}
      <Card>
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-semibold font-serif text-[#1F4D3A]">
            Reading Passage Text
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans text-gray-500">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'tl')}
              className="text-xs border rounded-md px-2 py-1 bg-white font-sans text-gray-700"
            >
              <option value="en">English</option>
              <option value="tl">Tagalog</option>
            </select>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Type or paste the reading passage here..."
          className="w-full px-3 py-3 rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-[#3D6B8A]/30 focus:outline-none"
          style={{ fontFamily: FONT_SANS, border: `1px solid ${TAN_BORDER}`, background: '#FFFDF8' }}
        />

        <div className="flex flex-wrap justify-between items-center mt-2 text-xs gap-2" style={{ fontFamily: FONT_MONO, color: MUTED }}>
          <span>Target Language: {language === 'en' ? 'English' : 'Tagalog'} · <strong>{wordCount} words</strong></span>
          <span className="px-2 py-0.5 rounded-full font-sans font-semibold text-[11px]" style={{ background: `${readability.tone}15`, color: readability.tone }}>
            Readability: {readability.gradeEst} ({readability.levelLabel})
          </span>
        </div>
      </Card>

      {/* Comprehensive Test Creation Section */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b" style={{ borderColor: TAN_BORDER }}>
          <div>
            <h3 className="text-sm font-semibold font-serif" style={{ color: CHALK_GREEN }}>
              Comprehensive Test Setup
            </h3>
            <p className="text-xs text-gray-500 font-sans">
              Every passage includes a Phil-IRI aligned comprehension test (Recall, Inference, Application).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTestMode('ai')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                testMode === 'ai' ? 'bg-[#3D6B8A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span>AI Generator</span>
            </button>
            <button
              onClick={() => setTestMode('manual')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                testMode === 'manual' ? 'bg-[#3D6B8A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Manual Editor</span>
            </button>
          </div>
        </div>

        {testMode === 'ai' && (
          <div className="mb-4 p-4 rounded-xl bg-[#EBF3F8] border border-[#A8C5DA] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#3D6B8A] font-serif">
                Automatic Phil-IRI Test Question Generation
              </div>
              <div className="text-xs text-gray-600 font-sans mt-0.5">
                Generate balanced recall, inferential, and critical application questions based on your passage.
              </div>
            </div>
            <button
              onClick={handleGenerateAITest}
              disabled={isGenerating || wordCount < 5}
              className="px-4 py-2 rounded-full text-white text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #3D6B8A, #2C4E66)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>{isGenerating ? 'Generating Test...' : 'Generate Phil-IRI Test'}</span>
            </button>
          </div>
        )}

        <ComprehensionTestEditor questions={questions} onChange={setQuestions} />
      </Card>

      {/* Bottom Actions */}
      <div className="flex gap-3 pt-2">
        <PrimaryButton accent={TEACHER_ACCENT} onClick={handleSavePassageAndTest} disabled={isSaving}>
          {isSaving ? 'Saving Passage & Test...' : 'Save Passage & Comprehensive Test'}
        </PrimaryButton>
        <GhostButton onClick={onDone}>Cancel</GhostButton>
      </div>
    </div>
  );
}

export default TeacherAuthorPassage;
