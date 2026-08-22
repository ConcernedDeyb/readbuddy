'use client';

import { useState, useEffect } from 'react';
import { Passage, Student, Card, PrimaryButton, GhostButton, FONT_SERIF, FONT_SANS, FONT_MONO, CHALK_GREEN, TAN_BORDER, CREAM, INK, MUTED } from '../_shared';

const TEACHER_ACCENT = '#3D6B8A';
const LANG_LABEL: Record<string, string> = { en: 'English', tl: 'Tagalog' };

export function TestCreateModal({
  publishedPassages,
  students,
  selectedPassageId,
  setSelectedPassageId,
  selectedStudentIds,
  setSelectedStudentIds,
  handleCreateTest,
  onCancel,
}: {
  publishedPassages: Passage[];
  students: Student[];
  selectedPassageId: string;
  setSelectedPassageId: (id: string) => void;
  selectedStudentIds: Set<string>;
  setSelectedStudentIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleCreateTest: () => void;
  onCancel: () => void;
}) {
  const [sections, setSections] = useState<string[]>([]);
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('all');

  useEffect(() => {
    try {
      const savedClasses = localStorage.getItem('readbuddy_teacher_classes');
      if (savedClasses) {
        const parsed = JSON.parse(savedClasses);
        if (Array.isArray(parsed)) {
          const names = parsed.map((c: any) => c.name).filter(Boolean);
          setSections(names);
        }
      }
    } catch (e) {}
  }, []);

  function toggleStudent(sid: string) {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  }

  function handleSelectSectionStudents(sectionName: string) {
    setActiveSectionFilter(sectionName);
    if (sectionName === 'all') {
      setSelectedStudentIds(new Set(students.map((s) => s.id)));
    } else {
      const sectionStudents = students.filter(
        (s) => (s.section_name || s.class_name || '').toLowerCase() === sectionName.toLowerCase()
      );
      setSelectedStudentIds(new Set(sectionStudents.map((s) => s.id)));
    }
  }

  const filteredStudents = activeSectionFilter === 'all'
    ? students
    : students.filter((s) => (s.section_name || s.class_name || '').toLowerCase() === activeSectionFilter.toLowerCase());

  return (
    <Card className="mb-6 rb-fade-in-up">
      <h3
        className="text-sm mb-4"
        style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}
      >
        New Reading Test Assignment
      </h3>

      {/* Select Passage */}
      <div className="mb-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED, fontWeight: 500 }}>
            Select a Reading Passage
          </span>
          <select
            value={selectedPassageId}
            onChange={(e) => setSelectedPassageId(e.target.value)}
            className="rb-input w-full"
          >
            <option value="">Choose a passage from your library...</option>
            {publishedPassages.map((p) => (
              <option key={p.id} value={p.id}>
                [{LANG_LABEL[p.source_language]}] {p.confirmed_text.slice(0, 55)}... ({p.word_count} words)
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Select Students & Section Filter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED, fontWeight: 500 }}>
            Assign to Students ({selectedStudentIds.size} selected)
          </span>

          {/* Quick Section Filter / Select All Pills */}
          {sections.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500 font-sans">Quick Select:</span>
              <button
                type="button"
                onClick={() => handleSelectSectionStudents('all')}
                className="px-2 py-0.5 rounded text-[11px] font-sans font-semibold border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                All
              </button>
              {sections.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleSelectSectionStudents(sec)}
                  className="px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-[#3D6B8A15] text-[#3D6B8A] border border-[#3D6B8A44] hover:bg-[#3D6B8A25] cursor-pointer"
                >
                  {sec}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto rounded-xl p-3"
          style={{ background: CREAM, border: `1px solid ${TAN_BORDER}` }}
        >
          {students.map((s) => {
            const isSelected = selectedStudentIds.has(s.id);
            const idLabel = s.school_id || s.username;
            return (
              <label
                key={s.id}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 hover:bg-[#1F4D3A06]"
                style={{
                  background: isSelected ? `${TEACHER_ACCENT}0D` : 'transparent',
                  border: `1.5px solid ${isSelected ? TEACHER_ACCENT : 'transparent'}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleStudent(s.id)}
                  style={{ accentColor: TEACHER_ACCENT }}
                  className="w-4 h-4 rounded shrink-0"
                />
                <div className="min-w-0 flex-1 text-xs">
                  <div className="font-semibold truncate" style={{ fontFamily: FONT_SANS, color: INK }}>
                    {s.display_name}
                  </div>
                  {idLabel && (
                    <div className="text-[10px] text-gray-500 font-mono truncate">
                      ID: {idLabel}
                      {s.section_name || s.class_name ? ` · ${s.section_name || s.class_name}` : ''}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {students.length > 2 && (
          <div className="flex items-center justify-between mt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                if (selectedStudentIds.size === students.length) setSelectedStudentIds(new Set());
                else setSelectedStudentIds(new Set(students.map((s) => s.id)));
              }}
              className="font-sans font-semibold transition-colors hover:underline cursor-pointer"
              style={{ color: TEACHER_ACCENT }}
            >
              {selectedStudentIds.size === students.length ? 'Deselect all students' : 'Select all students'}
            </button>
            <span className="text-gray-400 font-mono text-[11px]">
              {selectedStudentIds.size} of {students.length} students selected
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <PrimaryButton
          accent={TEACHER_ACCENT}
          onClick={handleCreateTest}
          disabled={!selectedPassageId || selectedStudentIds.size === 0}
        >
          Assign Test ({selectedStudentIds.size} Student{selectedStudentIds.size !== 1 ? 's' : ''})
        </PrimaryButton>
        <GhostButton onClick={onCancel}>
          Cancel
        </GhostButton>
      </div>
    </Card>
  );
}

export default TestCreateModal;
