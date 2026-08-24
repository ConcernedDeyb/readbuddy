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
  teacher_id?: string;
  teacher_name?: string;
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

/* ─── Notebook Types ─── */

export interface NotebookFile {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'image' | 'text';
  size: number;
  data_url: string;
}

export interface NotebookEntry {
  id: string;
  title: string;
  description: string;
  content_text: string;
  files: NotebookFile[];
  source_language: 'en' | 'tl';
  teacher_name: string;
  teacher_id: string;
  assigned_student_ids: string[];
  assigned_student_names: string[];
  target_grades?: number[];
  target_classes?: string[];
  created_at: string;
}

export interface StudentPersonalNote {
  id: string;
  student_id?: string;
  title: string;
  content: string;
  tags?: string[];
  files?: NotebookFile[];
  created_at: string;
  updated_at: string;
}

export interface StudyHistoryItem {
  id: string;
  student_id?: string;
  activity_type: 'reviewed_material' | 'created_note' | 'ai_study_session' | 'reading_practice';
  title: string;
  details?: string;
  timestamp: string;
  date: string;
}


