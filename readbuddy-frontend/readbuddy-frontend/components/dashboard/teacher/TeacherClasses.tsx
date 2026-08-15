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
    fetchClasses();
  }, []);

  async function fetchClasses() {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setClasses(data);
        }
      }
    } catch (e) {
      // Keep default state for local client demo
    }
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!draft.name.trim()) {
      setError('Please enter a section or class name.');
      return;
    }

    setLoading(true);

    const newClassData = {
      name: draft.name.trim(),
      grade_level: Number(draft.grade_level),
      class_code: draft.class_code.trim() || undefined,
    };

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClassData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to create class.');

      setClasses((prev) => [data, ...prev]);
      setDraft({ name: '', grade_level: '7', class_code: '' });
      setShowForm(false);
    } catch (err: any) {
      // Local fallback for frontend demo
      const autoCode = draft.class_code.trim()
        ? draft.class_code.trim().toUpperCase()
        : `SMCC-G${draft.grade_level}-${draft.name.trim().toUpperCase().replace(/\s+/g, '')}`;

      const localClass: SchoolClass = {
        id: `local-cls-${Date.now()}`,
        name: draft.name.trim(),
        grade_level: Number(draft.grade_level),
        class_code: autoCode,
        student_count: 0,
      };
      setClasses((prev) => [localClass, ...prev]);
      setDraft({ name: '', grade_level: '7', class_code: '' });
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const filtered = classes.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.class_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rb-fade-in-up">
      <div className="flex items-start justify-between gap-4 mb-6">
        <SectionHeader
          title="Classes & Sections"
          subtitle="Manage your school sections and dedicated grade levels."
          accent={TEACHER_ACCENT}
        />
        {!showForm && (
          <PrimaryButton accent={TEACHER_ACCENT} onClick={() => setShowForm(true)}>
            + Create New Section
          </PrimaryButton>
        )}
      </div>

      {showForm && (
        <Card className="mb-6 rb-fade-in-up">
          <h3 className="text-sm mb-3 font-semibold font-serif" style={{ color: CHALK_GREEN }}>
            Create New Class / Section
          </h3>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E] text-xs font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateClass} className="grid sm:grid-cols-3 gap-3 items-end">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                Section / Class Name
              </span>
              <input
                autoFocus
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="rb-input"
                placeholder="e.g. St. Jude or Faith"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                Dedicated Grade Level
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
                className="rb-input uppercase font-mono"
                placeholder="e.g. SMCC-G7-STJUDE"
              />
            </label>

            <div className="sm:col-span-3 flex gap-2 pt-2">
              <PrimaryButton type="submit" accent={TEACHER_ACCENT} disabled={loading}>
                {loading ? 'Creating...' : 'Create Class Section'}
              </PrimaryButton>
              <GhostButton onClick={() => setShowForm(false)}>Cancel</GhostButton>
            </div>
          </form>
        </Card>
      )}

      {/* Class list search filter */}
      {classes.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search class sections or codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-input max-w-sm text-xs"
          />
        </div>
      )}

      {classes.length === 0 ? (
        <EmptyState
          message="No class sections created yet."
          actionLabel="Create your first class section"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} hoverable className="rb-fade-in-up flex flex-col justify-between p-5 border">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-base font-bold font-serif" style={{ color: CHALK_GREEN }}>
                    {c.name}
                  </span>
                  <Badge tone="info">Grade {c.grade_level}</Badge>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-[#FFFDF8] border border-dashed border-[#DED2B4] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Class Passcode Code
                    </div>
                    <div className="text-xs font-mono font-bold text-[#3D6B8A] mt-0.5">
                      {c.class_code}
                    </div>
                  </div>
                  <button
                    onClick={() => copyCode(c.class_code)}
                    className="text-xs px-2.5 py-1 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600 font-sans cursor-pointer"
                  >
                    {copiedCode === c.class_code ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-5 pt-3 border-t border-gray-100 text-xs">
                <span className="font-sans text-gray-500 font-medium">
                  👨‍🎓 <strong>{c.student_count}</strong> Enrolled Students
                </span>
                {onSelectClass && (
                  <GhostButton onClick={() => onSelectClass(c.id)}>View Roster →</GhostButton>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeacherClasses;
