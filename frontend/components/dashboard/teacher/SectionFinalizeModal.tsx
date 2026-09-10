'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  PrimaryButton,
  GhostButton,
  PhilIRIBadge,
  PhilIRILevel,
} from '../_shared';
import {
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Users,
  BookOpen,
  Award,
  BarChart3,
} from 'lucide-react';

export interface SectionStudentAudit {
  id: string;
  display_name: string;
  school_id: string;
  word_recognition_score?: number;
  comprehension_score?: number;
  phil_iri_level?: PhilIRILevel;
  sessions_completed: number;
  intervention_required: boolean;
  intervention_completed: boolean;
}

export interface SectionFinalizeModalProps {
  sectionName: string;
  gradeLevel: number;
  isFinalized: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
  students: SectionStudentAudit[];
  onFinalize: () => void;
  onReopen: () => void;
  onClose: () => void;
  accent?: string;
}

export function SectionFinalizeModal({
  sectionName,
  gradeLevel,
  isFinalized,
  finalizedAt,
  finalizedBy,
  students,
  onFinalize,
  onReopen,
  onClose,
  accent = '#3D6B8A',
}: SectionFinalizeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Compute Diagnostics
  const totalStudents = students.length;
  const assessedStudents = students.filter((s) => s.phil_iri_level !== undefined);

  let independentCount = 0;
  let instructionalCount = 0;
  let frustrationCount = 0;
  let totalWord = 0;
  let totalComp = 0;

  assessedStudents.forEach((s) => {
    if (s.phil_iri_level === 'independent') independentCount++;
    else if (s.phil_iri_level === 'instructional') instructionalCount++;
    else if (s.phil_iri_level === 'frustration') frustrationCount++;

    if (s.word_recognition_score !== undefined) totalWord += s.word_recognition_score;
    if (s.comprehension_score !== undefined) totalComp += s.comprehension_score;
  });

  const avgWord = assessedStudents.length > 0 ? Math.round(totalWord / assessedStudents.length) : 0;
  const avgComp = assessedStudents.length > 0 ? Math.round(totalComp / assessedStudents.length) : 0;

  const interventionNeededCount = students.filter((s) => s.intervention_required).length;
  const interventionCompletedCount = students.filter((s) => s.intervention_completed).length;

  function handlePrint() {
    window.print();
  }

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md rb-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#FFFDF8] border-2 border-[#DED2B4] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[88vh] min-h-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#DED2B4] shrink-0 bg-[#FFFDF8] flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-[#EBF3F8] text-[#1E3A5F] border border-[#A8C5DA]">
                Grade {gradeLevel}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-sans font-bold bg-[#EBF3F8] text-[#3D6B8A] border border-[#BBD5E8]">
                <Users className="w-3.5 h-3.5" />
                <span>Section {sectionName}</span>
              </span>
              {isFinalized ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-bold bg-[#EBF7EE] text-[#2E7D4F] border border-[#A3D9B1]">
                  <Lock className="w-3 h-3" />
                  <span>Finalized for Term</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-bold bg-[#FFF9E6] text-[#B4602E] border border-[#F0D59A]">
                  <Unlock className="w-3 h-3" />
                  <span>Active / In Assessment</span>
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900 leading-snug">
              DepEd Phil-IRI Section Finalization &amp; Summary Report
            </h2>
            <p className="text-xs text-gray-600 font-sans mt-0.5">
              Saint Michael College of Caraga &bull; Basic Education Reading Inventory Summary
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-black/5 rounded-full cursor-pointer shrink-0 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Report Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {/* Summary Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white border border-[#DED2B4] shadow-2xs">
              <div className="text-[11px] font-sans font-bold text-gray-500 uppercase tracking-wider">
                Total Students
              </div>
              <div className="text-xl font-mono font-bold text-gray-900 mt-1">
                {totalStudents}
              </div>
              <div className="text-[10px] font-sans text-gray-400 mt-0.5">
                {assessedStudents.length} Assessed ({totalStudents > 0 ? Math.round((assessedStudents.length / totalStudents) * 100) : 0}%)
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#EBF7EE] border border-[#A3D9B1] shadow-2xs">
              <div className="text-[11px] font-sans font-bold text-[#2E7D4F] uppercase tracking-wider">
                Independent Tier
              </div>
              <div className="text-xl font-mono font-bold text-[#2E7D4F] mt-1">
                {independentCount}
              </div>
              <div className="text-[10px] font-sans text-[#2E7D4F] mt-0.5">
                {assessedStudents.length > 0 ? Math.round((independentCount / assessedStudents.length) * 100) : 0}% of cohort
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#EBF3F8] border border-[#BBD5E8] shadow-2xs">
              <div className="text-[11px] font-sans font-bold text-[#3D6B8A] uppercase tracking-wider">
                Instructional Tier
              </div>
              <div className="text-xl font-mono font-bold text-[#3D6B8A] mt-1">
                {instructionalCount}
              </div>
              <div className="text-[10px] font-sans text-[#3D6B8A] mt-0.5">
                {assessedStudents.length > 0 ? Math.round((instructionalCount / assessedStudents.length) * 100) : 0}% of cohort
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] shadow-2xs">
              <div className="text-[11px] font-sans font-bold text-[#B4602E] uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Frustration Tier</span>
              </div>
              <div className="text-xl font-mono font-bold text-[#B4602E] mt-1">
                {frustrationCount}
              </div>
              <div className="text-[10px] font-sans text-[#B4602E] mt-0.5">
                Targeted Intervention
              </div>
            </div>
          </div>

          {/* Remedial Intervention Callout */}
          <div className="p-3.5 rounded-xl bg-white border border-[#DED2B4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#3D6B8A15] text-[#3D6B8A] flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-sans text-gray-900">
                  Student Reading Intervention Audit
                </h4>
                <p className="text-[11px] text-gray-600 font-sans mt-0.5">
                  {interventionNeededCount === 0
                    ? 'All assessed students in this section meet or exceed instructional grade thresholds.'
                    : `${interventionNeededCount} student${interventionNeededCount === 1 ? '' : 's'} identified for targeted phonics & oral accuracy intervention (${interventionCompletedCount} completed remedial cycle).`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#FAF7F2] border border-[#DED2B4] text-gray-700">
                Avg Word: {avgWord}%
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#FAF7F2] border border-[#DED2B4] text-gray-700">
                Avg Comp: {avgComp}%
              </span>
            </div>
          </div>

          {/* Section Roster Table */}
          <div className="border border-[#DED2B4] rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="px-3.5 py-2.5 bg-[#FAF7F2] border-b border-[#DED2B4] flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-gray-800">
                Student Phil-IRI Performance Breakdown ({students.length})
              </span>
              <span className="text-[11px] font-mono text-gray-500">
                Form 1 Official Summary
              </span>
            </div>

            {students.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 font-sans">
                No students are currently enrolled in Section {sectionName}.
              </div>
            ) : (
              <div className="overflow-x-auto divide-y divide-gray-100">
                <table className="w-full min-w-[520px] text-left text-xs border-collapse">
                  <thead className="bg-gray-50/70 text-gray-600 font-mono text-[11px] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">School ID</th>
                      <th className="py-2 px-3 text-center">Word Acc.</th>
                      <th className="py-2 px-3 text-center">Comp.</th>
                      <th className="py-2 px-3 text-center">Phil-IRI Tier</th>
                      <th className="py-2 px-3 text-right">Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 font-bold text-gray-900 whitespace-nowrap">
                          {st.display_name}
                        </td>
                        <td className="py-2 px-3 font-mono text-gray-500 whitespace-nowrap">
                          {st.school_id}
                        </td>
                        <td className="py-2 px-3 font-mono text-center whitespace-nowrap">
                          {st.word_recognition_score !== undefined ? `${st.word_recognition_score}%` : '—'}
                        </td>
                        <td className="py-2 px-3 font-mono text-center whitespace-nowrap">
                          {st.comprehension_score !== undefined ? `${st.comprehension_score}%` : '—'}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {st.phil_iri_level ? (
                            <PhilIRIBadge level={st.phil_iri_level} />
                          ) : (
                            <span className="text-[10px] font-mono text-gray-400 italic">
                              Unassessed
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          {st.intervention_required ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>Intervention</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Cleared</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {isFinalized && finalizedAt && (
            <div className="p-3 rounded-xl bg-[#E6F4EA] border border-[#BFE0CC] text-[#2E7D4F] text-xs font-sans flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Section finalized on <strong>{finalizedAt}</strong>
                  {finalizedBy ? ` by ${finalizedBy}` : ''}. Official Phil-IRI Form 1 records are logged.
                </span>
              </div>
              <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-[#BFE0CC]">
                Soft-Finalized
              </span>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-[#DED2B4] bg-[#FAF7F2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg border border-[#DED2B4] bg-white text-xs font-sans font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print DepEd Form 1 Summary</span>
          </button>

          <div className="flex items-center justify-end gap-2">
            <GhostButton onClick={onClose}>Close</GhostButton>

            {isFinalized ? (
              <button
                type="button"
                onClick={onReopen}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-sans font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Reopen / Unlock Section</span>
              </button>
            ) : (
              <PrimaryButton
                accent={accent}
                onClick={() => {
                  onFinalize();
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Finalize Section for Term</span>
                </span>
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default SectionFinalizeModal;
