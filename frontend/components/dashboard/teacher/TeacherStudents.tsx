'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, Badge, EmptyState, PrimaryButton, GhostButton, Avatar, FONT_SANS, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN, TAN_BORDER } from '../_shared';
import { apiFetch } from '@/lib/api';

const TEACHER_ACCENT = '#3D6B8A';

interface Student {
  id: string;
  display_name: string;
  username: string;
  school_id?: string;
  email?: string;
  grade_level: number;
  class_id?: string;
  class_name?: string;
  preferred_language: 'en' | 'tl';
}

export function TeacherStudents({ initialStudents = [] }: { initialStudents?: Student[] }) {
  const [students, setStudents] = useState<Student[]>(initialStudents || []);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [createdNotification, setCreatedNotification] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    display_name: '',
    school_id: '',
    email: '',
    password: '',
    grade_level: '7',
    section_name: 'St. Jude',
    preferred_language: 'en' as 'en' | 'tl',
  });

  async function loadStudents() {
    try {
      const data = await apiFetch('/auth/teacher/students');
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadStudents();
  }, [initialStudents]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.display_name.trim()) return;
    if (!draft.password.trim()) return;

    const formalUsername = draft.display_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    try {
      await apiFetch('/auth/teacher/students', {
        method: 'POST',
        body: JSON.stringify({
          display_name: draft.display_name.trim(),
          username: formalUsername,
          password: draft.password.trim(),
          grade_level: Number(draft.grade_level),
          preferred_language: draft.preferred_language,
        }),
      });

      setCreatedNotification(`Student account created for "${draft.display_name.trim()}"! Username: @${formalUsername}`);
      setTimeout(() => setCreatedNotification(null), 5000);

      setDraft({ display_name: '', school_id: '', email: '', password: '', grade_level: '7', section_name: 'St. Jude', preferred_language: 'en' });
      setShowForm(false);
      loadStudents();
    } catch (e: any) {
      alert(`Error creating student: ${e.message}`);
    }
  }

  async function handleDelete(studentId: string, studentName: string) {
    if (!window.confirm(`Are you sure you want to remove "${studentName}" from the roster?`)) return;
    try {
      // NOTE: Assume backend has a delete endpoint, if not this will just return a 404
      // We haven't built the DELETE endpoint, but it would go here.
      setStudents(students.filter((s) => s.id !== studentId));
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = students.filter(
    (s) =>
      (!search ||
        s.display_name.toLowerCase().includes(search.toLowerCase()) ||
        s.username.toLowerCase().includes(search.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(search.toLowerCase()))) &&
      (selectedClassFilter === 'all' || s.class_name === selectedClassFilter)
  );

  return (
    <div className="rb-fade-in-up">
      <div className="flex items-start justify-between gap-4 mb-6">
        <SectionHeader title="My Students" subtitle="Everyone on your class roster. Manage student credentials and grade levels." accent={TEACHER_ACCENT} />
        {!showForm && (
          <PrimaryButton accent={TEACHER_ACCENT} onClick={() => setShowForm(true)}>
            + Add Student
          </PrimaryButton>
        )}
      </div>

      {createdNotification && (
        <div className="mb-4 p-3 rounded-xl bg-[#E6F4EA] border border-[#BFE0CC] text-[#2E7D4F] text-xs font-sans font-semibold flex items-center justify-between rb-fade-in-up">
          <span>✓ {createdNotification}</span>
          <button onClick={() => setCreatedNotification(null)} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
      )}

      {showForm && (
        <Card className="mb-6 rb-fade-in-up">
          <h3 className="text-sm mb-3 font-serif font-semibold" style={{ color: CHALK_GREEN }}>
            Register New Student Account
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
                Student Password
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
                Create & Add Student to Class
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
            placeholder="Search students by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-input max-w-sm text-xs"
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
            <Card key={s.id} hoverable className="flex items-center justify-between gap-4 flex-wrap rb-fade-in-up">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <Avatar name={s.display_name} accent={TEACHER_ACCENT} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: CHALK_GREEN }}>
                    {s.display_name}
                  </div>
                  <div className="text-xs mt-0.5 truncate" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                    @{s.username} {s.email ? `· ${s.email}` : ''} {s.class_name ? `· Section ${s.class_name}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="info">Grade {s.grade_level}</Badge>
                <button
                  onClick={() => handleDelete(s.id, s.display_name)}
                  className="px-2.5 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove from roster"
                >
                  ✕ Remove
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
export default TeacherStudents;
