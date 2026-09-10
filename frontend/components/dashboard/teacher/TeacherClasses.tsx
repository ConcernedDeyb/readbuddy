'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  SectionHeader,
  Card,
  Badge,
  EmptyState,
  PrimaryButton,
  GhostButton,
  FONT_SANS,
  FONT_MONO,
  FONT_SERIF,
  MUTED,
  CHALK_GREEN,
  TAN_BORDER,
  PhilIRILevel,
} from '../_shared';
import {
  Check,
  Trash2,
  Users,
  Lock,
  Unlock,
  AlertTriangle,
  FileText,
  Plus,
} from 'lucide-react';
import {
  getSectionsByGrade,
  getMasterSections,
  MasterSection,
} from '@/utils/sectionCatalog';
import SectionFinalizeModal, { SectionStudentAudit } from './SectionFinalizeModal';

const TEACHER_ACCENT = '#3D6B8A';

export interface SchoolClass {
  id: string;
  name: string;
  grade_level: number;
  class_code?: string;
  student_count: number;
  teacher_id?: string;
  teacher_name?: string;
  teacher_email?: string;
  created_at?: string;
  status?: 'active' | 'finalized';
  finalized_at?: string;
  finalized_by?: string;
}

export function normalizeSectionKey(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^section\s+/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function TeacherClasses({
  initialClasses = [],
  onSelectClass,
}: {
  initialClasses?: SchoolClass[];
  onSelectClass?: (classId: string) => void;
}) {
  const [classes, setClasses] = useState<SchoolClass[]>(initialClasses);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState({
    name: '',
    grade_level: '7',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Diagnostics & Intervention Mapping per section
  const [sectionAudits, setSectionAudits] = useState<Record<string, SectionStudentAudit[]>>({});

  // Modal State for Finalization / Report
  const [selectedClassForReport, setSelectedClassForReport] = useState<SchoolClass | null>(null);

  // Available official master sections for currently chosen draft grade
  const availableOfficialSections = useMemo(() => {
    return getSectionsByGrade(Number(draft.grade_level));
  }, [draft.grade_level]);

  // Set default section name when grade changes or form opens
  useEffect(() => {
    if (availableOfficialSections.length > 0) {
      // Pick first section not yet added by teacher if possible
      const unadded = availableOfficialSections.find(
        (sec) => !classes.some((c) => c.grade_level === Number(draft.grade_level) && c.name.toLowerCase() === sec.name.toLowerCase())
      );
      setDraft((d) => ({
        ...d,
        name: unadded ? unadded.name : availableOfficialSections[0].name,
      }));
    }
  }, [draft.grade_level, availableOfficialSections, classes]);

  function load() {
    try {
      const savedUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
      const teacherId = (savedUser.school_id || savedUser.username || '').toLowerCase();
      const teacherName = (savedUser.display_name || '').toLowerCase();
      const teacherEmail = (savedUser.email || '').toLowerCase();

      const saved = localStorage.getItem('readbuddy_teacher_classes');
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const teacherStudents = JSON.parse(localStorage.getItem('readbuddy_teacher_students') || '[]');
      const savedSessions = JSON.parse(localStorage.getItem('readbuddy_student_sessions') || '[]');
      const teacherTests = JSON.parse(localStorage.getItem('readbuddy_teacher_tests') || '[]');

      // 1. Build student audit items per section
      const auditMap: Record<string, SectionStudentAudit[]> = {};
      const studentCountsBySection = new Map<string, number>();

      const seenStudents = new Set<string>();

      function processStudent(studentObj: any, sectionRaw: string) {
        if (!sectionRaw || sectionRaw.toLowerCase() === 'unassigned') return;
        const normKey = normalizeSectionKey(sectionRaw);
        if (!normKey) return;
        const sid = (studentObj.school_id || studentObj.username || studentObj.id || '').trim();
        if (!sid || seenStudents.has(sid.toLowerCase())) return;
        seenStudents.add(sid.toLowerCase());

        const keysToRecord = new Set<string>();
        keysToRecord.add(normKey);
        if (studentObj.class_name) keysToRecord.add(normalizeSectionKey(studentObj.class_name));
        if (studentObj.section_name) keysToRecord.add(normalizeSectionKey(studentObj.section_name));

        keysToRecord.forEach((k) => {
          studentCountsBySection.set(k, (studentCountsBySection.get(k) || 0) + 1);
        });

        // Compute reading statistics
        const sLower = sid.toLowerCase();
        const dLower = (studentObj.display_name || '').toLowerCase();

        // Check sessions
        const studentSessions = savedSessions.filter((ses: any) => {
          const sesId = (ses.student_id || '').toLowerCase();
          const sesName = (ses.student_name || '').toLowerCase();
          return sesId === sLower || sesName === sLower || (dLower && (sesName === dLower || sesId === dLower));
        });

        // Check assigned tests
        let testWord = 0;
        let testComp = 0;
        let testLevel: PhilIRILevel | undefined;
        let testCount = 0;

        teacherTests.forEach((t: any) => {
          (t.assignments || []).forEach((a: any) => {
            const aId = (a.student_id || '').toLowerCase();
            const aName = (a.student_name || '').toLowerCase();
            if (aId === sLower || aName === sLower || (dLower && (aName === dLower || aId === dLower))) {
              if (a.word_recognition_score !== undefined) {
                testWord += Number(a.word_recognition_score);
                testComp += Number(a.comprehension_score || 80);
                testCount++;
                if (a.phil_iri_level) testLevel = a.phil_iri_level;
              }
            }
          });
        });

        let finalWord: number | undefined;
        let finalComp: number | undefined;
        let finalLevel: PhilIRILevel | undefined;

        if (testCount > 0) {
          finalWord = Math.round(testWord / testCount);
          finalComp = Math.round(testComp / testCount);
          finalLevel = testLevel || (finalWord >= 97 && finalComp >= 80 ? 'independent' : finalWord >= 90 && finalComp >= 59 ? 'instructional' : 'frustration');
        } else if (studentSessions.length > 0) {
          const latest = studentSessions[studentSessions.length - 1];
          finalWord = Number(latest.word_recognition_score) || 90;
          finalComp = Number(latest.comprehension_score) || 80;
          finalLevel = latest.phil_iri_level || (finalWord >= 97 && finalComp >= 80 ? 'independent' : finalWord >= 90 && finalComp >= 59 ? 'instructional' : 'frustration');
        }

        const isFrustration = finalLevel === 'frustration' || (finalWord !== undefined && (finalWord < 90 || (finalComp !== undefined && finalComp < 58)));
        const totalSessions = studentSessions.length + testCount;

        const auditItem: SectionStudentAudit = {
          id: studentObj.id || `st-${sid}`,
          display_name: studentObj.display_name || 'Student',
          school_id: studentObj.school_id || studentObj.username || sid,
          word_recognition_score: finalWord,
          comprehension_score: finalComp,
          phil_iri_level: finalLevel,
          sessions_completed: totalSessions,
          intervention_required: Boolean(isFrustration),
          intervention_completed: Boolean(isFrustration && totalSessions >= 3),
        };

        keysToRecord.forEach((k) => {
          if (!auditMap[k]) auditMap[k] = [];
          auditMap[k].push(auditItem);
        });
      }

      teacherStudents.forEach((st: any) => {
        processStudent(st, st.section_name || st.class_name);
      });

      Object.values(accountsMap).forEach((acc: any) => {
        if (acc.role === 'student') {
          processStudent(acc, acc.section_name || acc.class_name);
        }
      });

      setSectionAudits(auditMap);

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter strictly to classes belonging to this teacher
          const myClasses = parsed.filter((c: any) => {
            if (c.teacher_id && c.teacher_id.toLowerCase() === teacherId) return true;
            if (c.teacher_school_id && c.teacher_school_id.toLowerCase() === teacherId) return true;
            if (c.teacher_email && c.teacher_email.toLowerCase() === teacherEmail) return true;
            if (c.teacher_name && c.teacher_name.toLowerCase() === teacherName) return true;
            return false;
          });

          const classesWithLiveCounts = myClasses.map((c: SchoolClass) => ({
            ...c,
            status: c.status || 'active',
            student_count: studentCountsBySection.get(normalizeSectionKey(c.name)) || 0,
          }));
          setClasses(classesWithLiveCounts);
          return;
        }
      }
      setClasses([]);
    } catch (e) {}
  }

  useEffect(() => {
    load();
    window.addEventListener('readbuddy_classes_updated', load);
    window.addEventListener('readbuddy_students_updated', load);
    window.addEventListener('readbuddy_accounts_updated', load);
    window.addEventListener('readbuddy_student_sessions_updated', load);
    window.addEventListener('readbuddy_master_sections_updated', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('readbuddy_classes_updated', load);
      window.removeEventListener('readbuddy_students_updated', load);
      window.removeEventListener('readbuddy_accounts_updated', load);
      window.removeEventListener('readbuddy_student_sessions_updated', load);
      window.removeEventListener('readbuddy_master_sections_updated', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const cleanName = draft.name.trim();
    if (!cleanName) {
      setError('Please select an official section.');
      return;
    }

    // Check if teacher already has this class section
    const alreadyExists = classes.some(
      (c) => c.grade_level === Number(draft.grade_level) && c.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (alreadyExists) {
      setError(`You already have Grade ${draft.grade_level} - Section "${cleanName}" in your classes list.`);
      return;
    }

    setLoading(true);

    const savedUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
    const teacherSchoolId = savedUser.school_id || savedUser.username || 'teacher';
    const teacherDisplayName = savedUser.display_name || 'Teacher';
    const teacherEmailAddress = savedUser.email || '';

    const autoCode = `SMCC-G${draft.grade_level}-${cleanName.toUpperCase().replace(/\s+/g, '')}`;

    const newClass: SchoolClass = {
      id: `cls-${Date.now()}`,
      name: cleanName,
      grade_level: Number(draft.grade_level),
      class_code: autoCode,
      student_count: 0,
      teacher_id: teacherSchoolId,
      teacher_name: teacherDisplayName,
      teacher_email: teacherEmailAddress,
      created_at: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    try {
      const allSaved: SchoolClass[] = JSON.parse(localStorage.getItem('readbuddy_teacher_classes') || '[]');
      const updatedAll = [newClass, ...allSaved.filter((c) => c.id !== newClass.id)];
      localStorage.setItem('readbuddy_teacher_classes', JSON.stringify(updatedAll));
      window.dispatchEvent(new Event('readbuddy_classes_updated'));
    } catch (e) {}

    setDraft({ name: '', grade_level: '7' });
    setShowForm(false);
    setLoading(false);
  }

  function handleDeleteClass(classId: string, className: string) {
    if (!window.confirm(`Are you sure you want to delete Section "${className}"? Students in this section will become Unassigned.`)) return;
    try {
      const allSaved: SchoolClass[] = JSON.parse(localStorage.getItem('readbuddy_teacher_classes') || '[]');
      const updatedAll = allSaved.filter((c) => c.id !== classId);
      localStorage.setItem('readbuddy_teacher_classes', JSON.stringify(updatedAll));
      
      // Update any students who were in this section to Unassigned
      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      let accountsUpdated = false;
      Object.keys(accountsMap).forEach((key) => {
        const acc = accountsMap[key];
        if (acc && acc.role === 'student' && (acc.section_name === className || acc.class_name === className)) {
          acc.section_name = 'Unassigned';
          acc.class_name = 'Unassigned';
          accountsUpdated = true;
        }
      });
      if (accountsUpdated) {
        localStorage.setItem('readbuddy_accounts', JSON.stringify(accountsMap));
      }

      window.dispatchEvent(new Event('readbuddy_classes_updated'));
      window.dispatchEvent(new Event('readbuddy_accounts_updated'));
      window.dispatchEvent(new Event('readbuddy_students_updated'));
    } catch (e) {}
  }

  function handleFinalizeSection(targetClass: SchoolClass) {
    const savedUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
    const teacherDisplayName = savedUser.display_name || 'Teacher';

    try {
      const allSaved: SchoolClass[] = JSON.parse(localStorage.getItem('readbuddy_teacher_classes') || '[]');
      const updated = allSaved.map((c) => {
        if (c.id === targetClass.id) {
          return {
            ...c,
            status: 'finalized' as const,
            finalized_at: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            finalized_by: teacherDisplayName,
          };
        }
        return c;
      });

      localStorage.setItem('readbuddy_teacher_classes', JSON.stringify(updated));
      window.dispatchEvent(new Event('readbuddy_classes_updated'));

      // Update current selected class in modal
      setSelectedClassForReport((prev) => prev ? {
        ...prev,
        status: 'finalized',
        finalized_at: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        finalized_by: teacherDisplayName,
      } : null);
    } catch (e) {}
  }

  function handleReopenSection(targetClass: SchoolClass) {
    try {
      const allSaved: SchoolClass[] = JSON.parse(localStorage.getItem('readbuddy_teacher_classes') || '[]');
      const updated = allSaved.map((c) => {
        if (c.id === targetClass.id) {
          return {
            ...c,
            status: 'active' as const,
            finalized_at: undefined,
            finalized_by: undefined,
          };
        }
        return c;
      });

      localStorage.setItem('readbuddy_teacher_classes', JSON.stringify(updated));
      window.dispatchEvent(new Event('readbuddy_classes_updated'));

      // Update current selected class in modal
      setSelectedClassForReport((prev) => prev ? {
        ...prev,
        status: 'active',
        finalized_at: undefined,
        finalized_by: undefined,
      } : null);
    } catch (e) {}
  }

  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      `grade ${c.grade_level}`.includes(search.toLowerCase())
  );

  return (
    <div className="rb-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <SectionHeader
          title="Classes &amp; Sections"
          subtitle="Manage your advisory classes, Phil-IRI reading intervention status, and official term finalization."
          accent={TEACHER_ACCENT}
        />
        {!showForm && (
          <PrimaryButton
            accent={TEACHER_ACCENT}
            onClick={() => {
              setError('');
              setShowForm(true);
            }}
            className="w-full sm:w-auto"
          >
            <span className="flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>Add Class Section</span>
            </span>
          </PrimaryButton>
        )}
      </div>

      {/* Add Class Form (Strictly from Official School Catalog) */}
      {showForm && (
        <Card className="mb-6 rb-fade-in-up border-2 border-[#DED2B4] shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#3D6B8A]" />
            <h3 className="text-sm font-serif font-bold text-gray-900">
              Add Verified Official Class Section
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-sans mb-4">
            Select a verified curriculum section from the permanent SMCC school catalog to eliminate duplicate rosters.
          </p>

          <form onSubmit={handleCreateClass} className="grid sm:grid-cols-2 gap-4 items-end">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold font-sans text-gray-700">
                Grade Level <span className="text-red-500">*</span>
              </span>
              <select
                value={draft.grade_level}
                onChange={(e) => setDraft((d) => ({ ...d, grade_level: e.target.value }))}
                className="rb-input text-xs font-bold font-sans"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={String(g)}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold font-sans text-gray-700">
                Official Section (Patron Saint) <span className="text-red-500">*</span>
              </span>
              <select
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="rb-input text-xs font-medium font-sans"
                required
              >
                {availableOfficialSections.length === 0 ? (
                  <option value="">No sections registered for Grade {draft.grade_level}</option>
                ) : (
                  availableOfficialSections.map((sec) => {
                    const isClaimedByMe = classes.some(
                      (c) => c.grade_level === Number(draft.grade_level) && c.name.toLowerCase() === sec.name.toLowerCase()
                    );
                    return (
                      <option key={sec.id} value={sec.name} disabled={isClaimedByMe}>
                        Section {sec.name} {isClaimedByMe ? '(Already in your classes)' : ''}
                      </option>
                    );
                  })
                )}
              </select>
            </label>

            {error && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E] text-xs font-sans font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#DED2B4] mt-1">
              <PrimaryButton type="submit" accent={TEACHER_ACCENT} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Creating...' : 'Enroll Section to Your Classes'}
              </PrimaryButton>
              <GhostButton onClick={() => setShowForm(false)} className="w-full sm:w-auto">
                Cancel
              </GhostButton>
            </div>
          </form>
        </Card>
      )}

      {/* Search & Filter Bar */}
      {classes.length > 0 && (
        <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search class sections by name or grade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-input w-full sm:max-w-xs text-xs"
          />
          <span className="text-xs font-mono font-bold text-gray-500 px-3 py-1.5 rounded-lg bg-white border border-[#DED2B4]">
            {classes.length} Active Class{classes.length === 1 ? '' : 'es'}
          </span>
        </div>
      )}

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <EmptyState
          message="No class sections created yet."
          actionLabel="Add your first verified section"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const normKey = normalizeSectionKey(c.name);
            const studentAudits = sectionAudits[normKey] || [];
            const frustrationCount = studentAudits.filter((s) => s.intervention_required).length;
            const isFinalized = c.status === 'finalized';

            return (
              <Card
                key={c.id}
                hoverable
                className={`flex flex-col justify-between rb-fade-in-up border-2 ${
                  isFinalized ? 'border-[#BFE0CC] bg-[#FCFDFB]' : 'border-[#DED2B4] bg-[#FFFDF8]'
                } shadow-2xs rounded-2xl`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-bold bg-[#EBF3F8] text-[#3D6B8A] border border-[#BBD5E8] shadow-2xs">
                      <Users className="w-3.5 h-3.5 shrink-0 text-[#3D6B8A]" strokeWidth={2.25} />
                      <span>{c.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#EBF3F8] text-[#1E3A5F] border border-[#A8C5DA] text-xs font-mono font-bold">
                        Grade {c.grade_level}
                      </span>
                      {isFinalized ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-sans font-bold bg-[#EBF7EE] text-[#2E7D4F] border border-[#A3D9B1]">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Finalized</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-sans font-bold bg-[#FFF9E6] text-[#B4602E] border border-[#F0D59A]">
                          <Unlock className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Intervention Notification Banner */}
                  {frustrationCount > 0 && (
                    <div className="mt-3 p-2.5 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E] text-[11px] font-sans flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#B4602E]" />
                      <span>
                        <strong>{frustrationCount} student{frustrationCount === 1 ? '' : 's'}</strong> in Frustration tier &bull; Targeted Intervention recommended.
                      </span>
                    </div>
                  )}

                  {isFinalized && c.finalized_at && (
                    <div className="mt-3 p-2 rounded-xl bg-[#E6F4EA] border border-[#BFE0CC] text-[#2E7D4F] text-[11px] font-sans flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#2E7D4F]" />
                      <span>Finalized on {c.finalized_at} &bull; Form 1 logged.</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex flex-col gap-2 pt-3.5 mt-3.5 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-sans">
                    <span className="font-mono font-bold text-gray-700">
                      {c.student_count} student{c.student_count === 1 ? '' : 's'} enrolled
                    </span>
                    <div className="flex items-center gap-2">
                      {onSelectClass && (
                        <button
                          onClick={() => onSelectClass(c.id)}
                          className="text-xs font-bold text-[#3D6B8A] hover:underline cursor-pointer"
                        >
                          View Roster →
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setSelectedClassForReport(c)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#EBF3F8] hover:bg-[#D9EAF5] text-[#3D6B8A] text-xs font-sans font-bold flex items-center gap-1.5 border border-[#A8C5DA] cursor-pointer transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isFinalized ? 'Final Summary & Form 1' : 'Finalize & Report'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteClass(c.id, c.name)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                      title="Delete Class Section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Section Finalization & Phil-IRI Summary Modal */}
      {selectedClassForReport && (
        <SectionFinalizeModal
          sectionName={selectedClassForReport.name}
          gradeLevel={selectedClassForReport.grade_level}
          isFinalized={selectedClassForReport.status === 'finalized'}
          finalizedAt={selectedClassForReport.finalized_at}
          finalizedBy={selectedClassForReport.finalized_by}
          students={sectionAudits[normalizeSectionKey(selectedClassForReport.name)] || []}
          onFinalize={() => handleFinalizeSection(selectedClassForReport)}
          onReopen={() => handleReopenSection(selectedClassForReport)}
          onClose={() => setSelectedClassForReport(null)}
          accent={TEACHER_ACCENT}
        />
      )}
    </div>
  );
}

export default TeacherClasses;
