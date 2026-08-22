export type PhilIRILevel = 'independent' | 'instructional' | 'frustration';

export interface Student {
  id: string;
  display_name: string;
  username?: string;
  school_id?: string;
  email?: string;
  grade_level?: number;
  section?: string;
  section_name?: string;
  class_name?: string;
  preferred_language?: 'en' | 'tl';
  sessions_completed?: number;
  latest_level?: PhilIRILevel;
}

export interface ReadingSession {
  id: string;
  student_id: string;
  passage_title: string;
  source_language: 'en' | 'tl';
  word_recognition_score: number;
  comprehension_score: number;
  phil_iri_level: PhilIRILevel;
  date: string;
}

export interface Passage {
  id: string;
  title?: string;
  confirmed_text: string;
  source_language: 'en' | 'tl';
  word_count: number;
  source_type?: string;
}

export interface TestAssignment {
  id: string;
  student_id: string;
  student_name: string;
  status: 'pending' | 'completed' | 'graded';
  word_recognition_score?: number;
  comprehension_score?: number;
  phil_iri_level?: PhilIRILevel;
  teacher_grade?: PhilIRILevel;
  completed_at?: string;
}

export interface ReadingTest {
  id: string;
  passage_id: string;
  passage_preview: string;
  source_language: 'en' | 'tl';
  created_at: string;
  assignments: TestAssignment[];
}

export interface AccountProfile {
  displayName: string;
  email: string;
  username: string;
  role: 'teacher' | 'admin' | 'student';
  schoolId?: string;
  gradeLevel?: number;
  teacherName?: string;
}
