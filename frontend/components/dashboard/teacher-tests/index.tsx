'use client';

import { useState, useEffect } from 'react';
import {
  SectionHeader,
  Card,
  Badge,
  EmptyState,
  PrimaryButton,
  Avatar,
  PhilIRIBadge,
  MiniProgressBar,
  FONT_SANS,
  FONT_MONO,
  MUTED,
  INK,
  TAN_BORDER,
  PhilIRILevel,
  Passage,
  Student,
  ReadingTest,
  TestAssignment,
  ErrorBoundary,
} from '../_shared';

import { TestFilterBar } from './TestFilterBar';
import { TestCreateModal } from './TestCreateModal';
import { TestGradingModal } from './TestGradingModal';

const TEACHER_ACCENT = '#3D6B8A';
const LANG_LABEL: Record<string, string> = { en: 'English', tl: 'Tagalog' };

function scoreColor(pct: number): string {
  if (pct >= 90) return '#2E7D4F';
  if (pct >= 70) return '#8A5A1E';
  return '#B4602E';
}

export default function TeacherTests({
  tests: initialTests = [],
  passages = [],
  students = [],
}: {
  tests?: ReadingTest[];
  passages?: Passage[];
  students?: Student[];
}) {
  const [tests, setTests] = useState<ReadingTest[]>(initialTests || []);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPassageId, setSelectedPassageId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [gradingAssignment, setGradingAssignment] = useState<{ test: ReadingTest; assignment: TestAssignment } | null>(null);
  const [gradeOverride, setGradeOverride] = useState<PhilIRILevel | ''>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'graded'>('all');

  // Load from localStorage & listen to cross-session updates
  useEffect(() => {
    function loadTests() {
      try {
        const saved = localStorage.getItem('readbuddy_teacher_tests');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setTests(parsed);
            return;
          }
        }
        setTests(initialTests || []);
      } catch (e) {}
    }
    loadTests();
    window.addEventListener('readbuddy_tests_updated', loadTests);
    return () => window.removeEventListener('readbuddy_tests_updated', loadTests);
  }, [initialTests]);

  const publishedPassages = passages.filter((p) => p.word_count > 0);

  function handleCreateTest() {
    if (!selectedPassageId || selectedStudentIds.size === 0) return;
    const passage = publishedPassages.find((p) => p.id === selectedPassageId);
    if (!passage) return;

    const newTest: ReadingTest = {
      id: `test-${Date.now()}`,
      passage_id: passage.id,
      passage_preview: passage.confirmed_text.slice(0, 60) + (passage.confirmed_text.length > 60 ? '...' : ''),
      source_language: passage.source_language,
      created_at: new Date().toISOString().split('T')[0],
      assignments: Array.from(selectedStudentIds).map((sid) => {
        const student = students.find((s) => s.id === sid);
        return {
          id: `asn-${Date.now()}-${sid}`,
          student_id: sid,
          student_name: student?.display_name || 'Unknown',
          status: 'pending' as const,
        };
      }),
    };

    const updated = [newTest, ...tests];
    setTests(updated);
    try {
      localStorage.setItem('readbuddy_teacher_tests', JSON.stringify(updated));
      window.dispatchEvent(new Event('readbuddy_tests_updated'));
    } catch (e) {}

    setShowCreate(false);
    setSelectedPassageId('');
    setSelectedStudentIds(new Set());
  }

  function handleSaveGrade() {
    if (!gradingAssignment) return;
    const grade = gradeOverride || gradingAssignment.assignment.phil_iri_level;
    if (!grade) return;

    const updated = tests.map((t) =>
      t.id === gradingAssignment.test.id
        ? {
            ...t,
            assignments: t.assignments.map((a) =>
              a.id === gradingAssignment.assignment.id
                ? { ...a, status: 'graded' as const, teacher_grade: grade as PhilIRILevel }
                : a
            ),
          }
        : t
    );

    setTests(updated);
    try {
      localStorage.setItem('readbuddy_teacher_tests', JSON.stringify(updated));
      window.dispatchEvent(new Event('readbuddy_tests_updated'));
    } catch (e) {}

    setGradingAssignment(null);
    setGradeOverride('');
  }

  const allAssignments = tests.flatMap((t) =>
    t.assignments.map((a) => ({ ...a, test: t }))
  );
  const filteredAssignments =
    filter === 'all' ? allAssignments : allAssignments.filter((a) => a.status === filter);

  const pendingCount = allAssignments.filter((a) => a.status === 'pending').length;
  const completedCount = allAssignments.filter((a) => a.status === 'completed').length;
  const gradedCount = allAssignments.filter((a) => a.status === 'graded').length;

  return (
    <ErrorBoundary fallbackTitle="Teacher Tests Module Encountered an Error">
      <div>
        <div className="flex items-start justify-between gap-4 mb-6">
          <SectionHeader
            title="Reading Tests"
            subtitle="Create tests from your passages, assign to students, and grade with Phil-IRI."
            accent={TEACHER_ACCENT}
          />
          {!showCreate && (
            <PrimaryButton accent={TEACHER_ACCENT} onClick={() => setShowCreate(true)}>
              + Create Test
            </PrimaryButton>
          )}
        </div>

        {/* Create Test Form */}
        {showCreate && (
          <TestCreateModal
            publishedPassages={publishedPassages}
            students={students}
            selectedPassageId={selectedPassageId}
            setSelectedPassageId={setSelectedPassageId}
            selectedStudentIds={selectedStudentIds}
            setSelectedStudentIds={setSelectedStudentIds}
            handleCreateTest={handleCreateTest}
            onCancel={() => { setShowCreate(false); setSelectedPassageId(''); setSelectedStudentIds(new Set()); }}
          />
        )}

        {/* Filter tabs */}
        {tests.length > 0 && (
          <TestFilterBar
            filter={filter}
            setFilter={setFilter}
            totalCount={allAssignments.length}
            pendingCount={pendingCount}
            completedCount={completedCount}
            gradedCount={gradedCount}
          />
        )}

        {/* Assignment Table */}
        {tests.length === 0 ? (
          <EmptyState
            message="No reading tests created yet. Create one from your published passages."
            actionLabel="Create your first test"
            onAction={() => setShowCreate(true)}
          />
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ fontFamily: FONT_SANS, color: MUTED }}>
              No {filter} assignments found.
            </p>
          </div>
        ) : (
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="rb-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Passage</th>
                    <th>Word Recognition</th>
                    <th>Comprehension</th>
                    <th>Phil-IRI Level</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((a, i) => (
                    <tr key={a.id} className="rb-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={a.student_name} accent={TEACHER_ACCENT} size={30} />
                          <span style={{ fontFamily: FONT_SANS, fontWeight: 500, color: INK }}>
                            {a.student_name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-700" style={{ fontFamily: FONT_MONO }}>
                            {LANG_LABEL[a.test.source_language]}
                          </span>
                          <span
                            className="text-xs max-w-[120px] truncate"
                            style={{ fontFamily: FONT_SANS, color: MUTED }}
                            title={a.test.passage_preview}
                          >
                            {a.test.passage_preview}
                          </span>
                        </div>
                      </td>
                      <td>
                        {a.word_recognition_score != null ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm"
                              style={{ fontFamily: FONT_MONO, fontWeight: 700, color: scoreColor(a.word_recognition_score) }}
                            >
                              {Math.round(a.word_recognition_score)}%
                            </span>
                            <MiniProgressBar value={a.word_recognition_score} color={scoreColor(a.word_recognition_score)} />
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: MUTED }}>—</span>
                        )}
                      </td>
                      <td>
                        {a.comprehension_score != null ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm"
                              style={{ fontFamily: FONT_MONO, fontWeight: 700, color: scoreColor(a.comprehension_score) }}
                            >
                              {Math.round(a.comprehension_score)}%
                            </span>
                            <MiniProgressBar value={a.comprehension_score} color={scoreColor(a.comprehension_score)} />
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: MUTED }}>—</span>
                        )}
                      </td>
                      <td>
                        {a.phil_iri_level ? (
                          <PhilIRIBadge level={a.teacher_grade || a.phil_iri_level} />
                        ) : (
                          <span className="text-xs" style={{ color: MUTED }}>—</span>
                        )}
                      </td>
                      <td>
                        <Badge
                          tone={a.status === 'graded' ? 'success' : a.status === 'completed' ? 'accent' : 'neutral'}
                        >
                          {a.status === 'graded' ? 'Graded' : a.status === 'completed' ? 'Completed' : 'Pending'}
                        </Badge>
                      </td>
                      <td>
                        {a.status === 'completed' && (
                          <button
                            onClick={() => {
                              const test = tests.find((t) => t.id === a.test.id);
                              const assignment = test?.assignments.find((x) => x.id === a.id);
                              if (test && assignment) {
                                setGradingAssignment({ test, assignment });
                                setGradeOverride('');
                              }
                            }}
                            className="text-xs px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
                            style={{
                              fontFamily: FONT_SANS,
                              fontWeight: 600,
                              color: '#FFFDF8',
                              background: TEACHER_ACCENT,
                            }}
                          >
                            Grade
                          </button>
                        )}
                        {a.status === 'graded' && (
                          <button
                            onClick={() => {
                              const test = tests.find((t) => t.id === a.test.id);
                              const assignment = test?.assignments.find((x) => x.id === a.id);
                              if (test && assignment) {
                                setGradingAssignment({ test, assignment });
                                setGradeOverride(assignment.teacher_grade || '');
                              }
                            }}
                            className="text-xs px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-[#1F4D3A08] cursor-pointer"
                            style={{
                              fontFamily: FONT_SANS,
                              fontWeight: 500,
                              color: TEACHER_ACCENT,
                              border: `1px solid ${TAN_BORDER}`,
                            }}
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Grading Detail Panel */}
        <TestGradingModal
          gradingAssignment={gradingAssignment}
          gradeOverride={gradeOverride}
          setGradeOverride={setGradeOverride}
          handleSaveGrade={handleSaveGrade}
          onClose={() => { setGradingAssignment(null); setGradeOverride(''); }}
        />
      </div>
    </ErrorBoundary>
  );
}
