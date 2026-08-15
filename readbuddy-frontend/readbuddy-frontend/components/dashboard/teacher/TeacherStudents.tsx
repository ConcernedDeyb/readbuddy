'use client';

import { useState } from 'react';
import { SectionHeader, Card, Badge, EmptyState, PrimaryButton, GhostButton, Avatar, FONT_SANS, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN, TAN_BORDER } from '../_shared';

const TEACHER_ACCENT = '#3D6B8A';

interface Student {
  id: string;
  display_name: string;
  username: string;
  grade_level: number;
  class_id?: string;
  class_name?: string;
  preferred_language: 'en' | 'tl';
}

export function TeacherStudents({ initialStudents }: { initialStudents: Student[] }) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [draft, setDraft] = useState({
    display_name: '',
    school_id: '',
    email: '',
    password: '',
    grade_level: '7',
    section_name: 'St. Jude',
    preferred_language: 'en' as 'en' | 'tl',
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.display_name.trim()) return;
    if (!draft.password.trim()) return;
    const newStudent: Student = {
      id: `local-${Date.now()}`,
      display_name: draft.display_name.trim(),
      username: draft.display_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
      grade_level: Number(draft.grade_level),
      class_name: draft.section_name,
      preferred_language: draft.preferred_language,
    };
    setStudents((prev) => [...prev, newStudent]);
    setDraft({ display_name: '', school_id: '', email: '', password: '', grade_level: '7', section_name: 'St. Jude', preferred_language: 'en' });
    setShowForm(false);
  }

  const filtered = students.filter(
    (s) =>
      (!search ||
        s.display_name.toLowerCase().includes(search.toLowerCase()) ||
        s.username.toLowerCase().includes(search.toLowerCase())) &&
      (selectedClassFilter === 'all' || s.class_name === selectedClassFilter)
  );

  return (
    <div className="rb-fade-in-up">
      <div className="flex items-start justify-between gap-4 mb-6">
        <SectionHeader title="My Students" subtitle="Everyone on your class roster." accent={TEACHER_ACCENT} />
        {!showForm && (
          <PrimaryButton accent={TEACHER_ACCENT} onClick={() => setShowForm(true)}>
            + Add Student
          </PrimaryButton>
        )}
      </div>

      {showForm && (
        <Card className="mb-6 rb-fade-in-up">
          <h3 className="text-sm mb-3 font-serif font-semibold" style={{ color: CHALK_GREEN }}>
            Register New Student
          </h3>
          <form onSubmit={handleAdd} className="grid sm:grid-cols-3 gap-3 items-end">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                Student Full Name
              </span>
              <input
                autoFocus
                required
                value={draft.display_name}
                onChange={(e) => setDraft((d) => ({ ...d, display_name: e.target.value }))}
                className="rb-input"
                placeholder="e.g. Juan dela Cruz"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                Student School ID Number
              </span>
              <input
                value={draft.school_id}
                onChange={(e) => setDraft((d) => ({ ...d, school_id: e.target.value }))}
                className="rb-input"
                placeholder="202612345"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                Student Email Address
              </span>
              <input
                type="email"
                required
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                className="rb-input"
                placeholder="student@smccnasipit.edu.ph"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                Password (1 Field for Student)
              </span>
              <input
                type="password"
                required
                value={draft.password}
                onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                className="rb-input"
                placeholder="Create student password"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                Class / Section Name
              </span>
              <input
                value={draft.section_name}
                onChange={(e) => setDraft((d) => ({ ...d, section_name: e.target.value }))}
                className="rb-input"
                placeholder="e.g. St. Jude"
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
            <div className="sm:col-span-3 flex gap-2 pt-2">
              <PrimaryButton type="submit" accent={TEACHER_ACCENT}>
                Add Student to Class
              </PrimaryButton>
              <GhostButton onClick={() => setShowForm(false)}>Cancel</GhostButton>
            </div>
          </form>
        </Card>
      )}

      {/* Roster Search and Filter Bar */}
      {students.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-input max-w-xs text-xs"
          />
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-sans">Filter by Section:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="rb-input text-xs"
            >
              <option value="all">All Sections</option>
              <option value="St. Jude">St. Jude</option>
              <option value="St. Mark">St. Mark</option>
              <option value="St. Luke">St. Luke</option>
            </select>
          </div>
        </div>
      )}

      {students.length === 0 ? (
        <EmptyState
          message="No students on your roster yet."
          actionLabel="Add your first student"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((s) => (
            <Card key={s.id} hoverable className="flex items-center gap-4 flex-wrap rb-fade-in-up">
              <Avatar name={s.display_name} accent={TEACHER_ACCENT} />
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>
                  {s.display_name}
                </div>
                <div className="text-xs mt-0.5 truncate" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                  @{s.username} {s.class_name ? `• Section ${s.class_name}` : ''}
                </div>
              </div>
              <Badge tone="info">Grade {s.grade_level}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
export default TeacherStudents;


