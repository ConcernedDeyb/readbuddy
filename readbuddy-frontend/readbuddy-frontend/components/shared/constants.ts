import { Student, ReadingSession, Passage, ReadingTest } from './types';

export const INK = '#2B2621';
export const MUTED = 'rgba(43,38,33,0.62)';
export const CREAM = '#FBF7EE';
export const CREAM_WARM = '#FFFDF8';
export const TAN_BORDER = '#DED2B4';
export const TAN_LIGHT = '#EFE9D8';
export const MARIGOLD = '#E8873A';
export const MARIGOLD_LIGHT = '#F0A35C';
export const MARIGOLD_BG = '#FBEBD3';
export const CHALK_GREEN = '#1F4D3A';
export const CHALK_GREEN_LIGHT = '#2A6B4F';

export const FONT_SERIF = "'Fraunces', serif";
export const FONT_SANS = "'Figtree', sans-serif";
export const FONT_MONO = "'Space Mono', monospace";

export const MOCK_STUDENTS: Student[] = [
  { id: 'std-1', display_name: 'Juan Dela Cruz', username: 'juan_d', grade_level: 3, section: 'Mabangis', preferred_language: 'en' },
  { id: 'std-2', display_name: 'Maria Santos', username: 'maria_s', grade_level: 3, section: 'Mabangis', preferred_language: 'tl' },
  { id: 'std-3', display_name: 'Pedro Penduko', username: 'pedro_p', grade_level: 4, section: 'Masipag', preferred_language: 'en' },
];

export const MOCK_SESSIONS: ReadingSession[] = [
  {
    id: 'ses-1',
    student_id: 'std-1',
    passage_title: 'The Brave Little Turtle',
    source_language: 'en',
    word_recognition_score: 95,
    comprehension_score: 85,
    phil_iri_level: 'instructional',
    date: '2026-08-10',
  },
  {
    id: 'ses-2',
    student_id: 'std-1',
    passage_title: 'Ang Matalinong Matsing',
    source_language: 'tl',
    word_recognition_score: 98,
    comprehension_score: 90,
    phil_iri_level: 'independent',
    date: '2026-08-08',
  },
];

export const MOCK_PASSAGES: Passage[] = [
  {
    id: 'pas-1',
    title: 'The Brave Little Turtle',
    confirmed_text: 'Once upon a time in a sunny pond, there lived a small turtle who dreamed of exploring the vast river beyond.',
    source_language: 'en',
    word_count: 22,
    source_type: 'custom',
  },
  {
    id: 'pas-2',
    title: 'Ang Matalinong Matsing',
    confirmed_text: 'Sa isang kagubatan ay may nakatirang matalinong matsing na laging tumutulong sa kanyang mga kaibigang hayop.',
    source_language: 'tl',
    word_count: 18,
    source_type: 'custom',
  },
];

export const MOCK_TESTS: ReadingTest[] = [
  {
    id: 'test-1',
    passage_id: 'pas-1',
    passage_preview: 'Once upon a time in a sunny pond...',
    source_language: 'en',
    created_at: '2026-08-09',
    assignments: [
      {
        id: 'asg-1',
        student_id: 'std-1',
        student_name: 'Juan Dela Cruz',
        status: 'completed',
        word_recognition_score: 95,
        comprehension_score: 85,
        phil_iri_level: 'instructional',
        completed_at: '2026-08-10',
      },
      {
        id: 'asg-2',
        student_id: 'std-2',
        student_name: 'Maria Santos',
        status: 'pending',
      },
    ],
  },
];
