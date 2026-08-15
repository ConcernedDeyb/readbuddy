'use client';

import { Passage, Student, Card, PrimaryButton, GhostButton, FONT_SERIF, FONT_SANS, CHALK_GREEN, TAN_BORDER, CREAM, INK, MUTED } from '../_shared';

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
  function toggleStudent(sid: string) {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  }

  return (
    <Card className="mb-6 rb-fade-in-up">
      <h3
        className="text-sm mb-4"
        style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}
      >
        New Reading Test
      </h3>

      {/* Select Passage */}
      <div className="mb-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED, fontWeight: 500 }}>
            Select a passage
          </span>
          <select
            value={selectedPassageId}
            onChange={(e) => setSelectedPassageId(e.target.value)}
            className="rb-input w-full"
          >
            <option value="">Choose a passage...</option>
            {publishedPassages.map((p) => (
              <option key={p.id} value={p.id}>
                [{LANG_LABEL[p.source_language]}] {p.confirmed_text.slice(0, 50)}... ({p.word_count} words)
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Select Students */}
      <div className="mb-4">
        <span className="text-xs block mb-2" style={{ fontFamily: FONT_SANS, color: MUTED, fontWeight: 500 }}>
          Assign to students
        </span>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto rounded-xl p-3"
          style={{ background: CREAM, border: `1px solid ${TAN_BORDER}` }}
        >
          {students.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 hover:bg-[#1F4D3A06]"
              style={{
                background: selectedStudentIds.has(s.id) ? `${TEACHER_ACCENT}0D` : 'transparent',
                border: `1.5px solid ${selectedStudentIds.has(s.id) ? TEACHER_ACCENT : 'transparent'}`,
              }}
            >
              <input
                type="checkbox"
                checked={selectedStudentIds.has(s.id)}
                onChange={() => toggleStudent(s.id)}
                style={{ accentColor: TEACHER_ACCENT }}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm" style={{ fontFamily: FONT_SANS, color: INK }}>
                {s.display_name}
              </span>
            </label>
          ))}
        </div>
        {students.length > 2 && (
          <button
            onClick={() => {
              if (selectedStudentIds.size === students.length) setSelectedStudentIds(new Set());
              else setSelectedStudentIds(new Set(students.map((s) => s.id)));
            }}
            className="text-xs mt-1.5 transition-colors hover:underline"
            style={{ fontFamily: FONT_SANS, color: TEACHER_ACCENT, fontWeight: 600 }}
          >
            {selectedStudentIds.size === students.length ? 'Deselect all' : 'Select all students'}
          </button>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <PrimaryButton
          accent={TEACHER_ACCENT}
          onClick={handleCreateTest}
          disabled={!selectedPassageId || selectedStudentIds.size === 0}
        >
          Assign Test ({selectedStudentIds.size} student{selectedStudentIds.size !== 1 ? 's' : ''})
        </PrimaryButton>
        <GhostButton onClick={onCancel}>
          Cancel
        </GhostButton>
      </div>
    </Card>
  );
}
