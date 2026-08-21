'use client';

import { FONT_SANS, FONT_MONO, MUTED, TAN_BORDER, INK, Badge, CHALK_GREEN } from '../_shared';

const TEACHER_ACCENT = '#3D6B8A';

export type QuestionType = 'literal' | 'inferential' | 'critical';

export interface ComprehensionQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  choices: string[];
  correct_choice_index: number;
}

const TYPE_LABEL: Record<QuestionType, string> = {
  literal: 'Literal',
  inferential: 'Inferential',
  critical: 'Critical',
};

export function blankQuestion(id: string): ComprehensionQuestion {
  return {
    id,
    question_text: '',
    question_type: 'literal',
    choices: ['', '', '', ''],
    correct_choice_index: 0,
  };
}

export function typeCoverage(questions: ComprehensionQuestion[]): Record<QuestionType, boolean> {
  return {
    literal: questions.some((q) => q.question_type === 'literal'),
    inferential: questions.some((q) => q.question_type === 'inferential'),
    critical: questions.some((q) => q.question_type === 'critical'),
  };
}

export default function ComprehensionTestEditor({
  questions,
  onChange,
}: {
  questions: ComprehensionQuestion[];
  onChange: (questions: ComprehensionQuestion[]) => void;
}) {
  const coverage = typeCoverage(questions);

  function updateQuestion(index: number, patch: Partial<ComprehensionQuestion>) {
    const next = [...questions];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function updateChoice(qIndex: number, cIndex: number, val: string) {
    const next = [...questions];
    const choices = [...next[qIndex].choices];
    choices[cIndex] = val;
    next[qIndex] = { ...next[qIndex], choices };
    onChange(next);
  }

  function addQuestion() {
    onChange([...questions, blankQuestion(`q-${Date.now()}`)]);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    onChange(questions.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs" style={{ fontFamily: FONT_MONO }}>
        <Badge tone={coverage.literal ? 'success' : 'warning'}>Literal</Badge>
        <Badge tone={coverage.inferential ? 'success' : 'warning'}>Inferential</Badge>
        <Badge tone={coverage.critical ? 'success' : 'warning'}>Critical</Badge>
      </div>

      {questions.map((q, qIdx) => (
        <div key={q.id} className="p-4 rounded-xl border relative" style={{ background: '#FFFDF8', borderColor: TAN_BORDER }}>
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-xs font-bold" style={{ fontFamily: FONT_MONO, color: TEACHER_ACCENT }}>
              Question {qIdx + 1}
            </span>
            <select
              value={q.question_type}
              onChange={(e) => updateQuestion(qIdx, { question_type: e.target.value as QuestionType })}
              className="rb-input text-xs"
            >
              <option value="literal">Literal</option>
              <option value="inferential">Inferential</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <textarea
            value={q.question_text}
            onChange={(e) => updateQuestion(qIdx, { question_text: e.target.value })}
            placeholder="Question text..."
            className="w-full p-2.5 rounded-lg text-sm mb-3"
            style={{ fontFamily: FONT_SANS, border: `1px solid ${TAN_BORDER}` }}
            rows={2}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            {q.choices.map((choice, cIdx) => (
              <div key={cIdx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${q.id}`}
                  checked={q.correct_choice_index === cIdx}
                  onChange={() => updateQuestion(qIdx, { correct_choice_index: cIdx })}
                  className="accent-[#3D6B8A]"
                />
                <input
                  type="text"
                  value={choice}
                  onChange={(e) => updateChoice(qIdx, cIdx, e.target.value)}
                  placeholder={`Choice ${cIdx + 1}`}
                  className="rb-input flex-1 text-xs"
                />
              </div>
            ))}
          </div>

          {questions.length > 1 && (
            <button onClick={() => removeQuestion(qIdx)} className="text-xs text-red-600 mt-2 cursor-pointer font-sans">
              Remove Question
            </button>
          )}
        </div>
      ))}

      <button onClick={addQuestion} className="text-xs font-semibold px-4 py-2 rounded-full border cursor-pointer" style={{ color: TEACHER_ACCENT, borderColor: TAN_BORDER }}>
        + Add Question
      </button>
    </div>
  );
}
