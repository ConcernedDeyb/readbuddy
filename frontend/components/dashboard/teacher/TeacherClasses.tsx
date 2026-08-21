'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, Badge, EmptyState, PrimaryButton, GhostButton, FONT_SANS, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN, TAN_BORDER } from '../_shared';

const TEACHER_ACCENT = '#3D6B8A';

export interface SchoolClass {
  id: string;
  name: string;
  grade_level: number;
  class_code: string;
  student_count: number;
  created_at?: string;
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
    class_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('readbuddy_teacher_classes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setClasses(parsed);
          return;
        }
      }
      setClasses(initialClasses || []);
    } catch (e) {}
  }, [initialClasses]);

  function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!draft.name.trim()) {
      setError('Please enter a section or class name.');
      return;
    }

    setLoading(true);

    const autoCode = draft.class_code.trim()
      ? draft.class_code.trim().toUpperCase()
      : `SMCC-G${draft.grade_level}-${draft.name.trim().toUpperCase().replace(/\s+/g, '')}`;

    const newClass: SchoolClass = {
      id: `cls-${Date.now()}`,
      name: draft.name.trim(),
      grade_level: Number(draft.grade_level),
      class_code: autoCode,
      student_count: 0,
      created_at: new Date().toISOString().split('T')[0],
    };

    const updated = [newClass, ...classes];
    setClasses(updated);
    try {
      localStorage.setItem('readbuddy_teacher_classes', JSON.stringify(updated));
    } catch (e) {}

    setDraft({ name: '', grade_level: '7', class_code: '' });
    setShowForm(false);
    setLoading(false);
  }

  function handleDeleteClass(classId: string, className: string) {
    if (!window.confirm(`Are you sure you want to delete "${className}"?`)) return;
    const updated = classes.filter((c) => c.id !== classId);
    setClasses(updated);
    try {
      localStorage.setItem('readbuddy_teacher_classes', JSON.stringify(updated));
    } catch (e) {}
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  }

  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.class_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rb-fade-in-up">
      <div className="flex items-start justify-between gap-4 mb-6">
        <SectionHeader
          title="Class Sections"
          subtitle="Manage your grade sections and invite codes."
          accent={TEACHER_ACCENT}
        />
        {!showForm && (
          <PrimaryButton accent={TEACHER_ACCENT} onClick={() => setShowForm(true)}>
            + Add New Class
          </PrimaryButton>
        )}
      </div>

      {showForm && (
        <Card className="mb-6 rb-fade-in-up">
          <h3 className="text-sm mb-3 font-serif font-semibold" style={{ color: CHALK_GREEN }}>
            Create New Class Section
          </h3>
          <form onSubmit={handleCreateClass} className="grid sm:grid-cols-3 gap-3 items-end">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                Section / Class Name
              </span>
              <input
                autoFocus
                required
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="rb-input"
                placeholder="e.g. Section St. Jude"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                Grade Level
              </span>
              <select
                value={draft.grade_level}
                onChange={(e) => setDraft((d) => ({ ...d, grade_level: e.target.value }))}
                className="rb-input"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                Custom Class Code (Optional)
              </span>
              <input
                value={draft.class_code}
                onChange={(e) => setDraft((d) => ({ ...d, class_code: e.target.value }))}
                className="rb-input"
                placeholder="e.g. SMCC-G7-STJUDE"
              />
            </label>
            {error && (
              <div className="sm:col-span-3 text-xs text-red-600 font-sans">
                {error}
              </div>
            )}
            <div className="sm:col-span-3 flex gap-2 pt-2">
              <PrimaryButton type="submit" accent={TEACHER_ACCENT} disabled={loading}>
                {loading ? 'Creating...' : 'Create Class Section'}
              </PrimaryButton>
              <GhostButton onClick={() => setShowForm(false)}>Cancel</GhostButton>
            </div>
          </form>
        </Card>
      )}

      {/* Search Bar */}
      {classes.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search class sections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-input max-w-xs text-xs"
          />
        </div>
      )}

      {classes.length === 0 ? (
        <EmptyState
          message="No class sections created yet."
          actionLabel="Create your first section"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} hoverable className="flex flex-col justify-between rb-fade-in-up">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>
                    {c.name}
                  </h4>
                  <Badge tone="info">Grade {c.grade_level}</Badge>
                </div>
                <div className="text-xs flex items-center justify-between mt-3 p-2.5 rounded-lg bg-[#FAF6EE] border border-[#E8DFC8]">
                  <span className="font-mono font-bold text-[#1F4D3A]">{c.class_code}</span>
                  <button
                    onClick={() => copyCode(c.class_code)}
                    className="text-[11px] font-sans font-semibold text-[#3D6B8A] hover:underline cursor-pointer"
                  >
                    {copiedCode === c.class_code ? '✓ Copied' : 'Copy Code'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-sans">
                  {c.student_count} student{c.student_count === 1 ? '' : 's'} enrolled
                </span>
                <div className="flex items-center gap-2">
                  {onSelectClass && (
                    <button
                      onClick={() => onSelectClass(c.id)}
                      className="text-xs font-semibold text-[#3D6B8A] hover:underline cursor-pointer"
                    >
                      View Students →
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteClass(c.id, c.name)}
                    className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                    title="Delete Class"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
export default TeacherClasses;
