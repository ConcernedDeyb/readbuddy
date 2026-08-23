'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  SectionHeader,
  Card,
  Badge,
  EmptyState,
  PrimaryButton,
  GhostButton,
  DetailPanel,
  Avatar,
  FONT_SANS,
  FONT_MONO,
  FONT_SERIF,
  MUTED,
  INK,
  TAN_BORDER,
  CREAM,
  CHALK_GREEN,
  ErrorBoundary,
  NotebookEntry,
  NotebookFile,
  Student,
} from '../_shared';

const TEACHER_ACCENT = '#3D6B8A';
const LANG_LABEL: Record<string, string> = { en: 'English', tl: 'Tagalog' };

export interface SchoolClass {
  id: string;
  name: string;
  grade_level: number;
  class_code: string;
  student_count?: number;
}

/* ─── File type detection ─── */

function detectFileType(file: File): NotebookFile['type'] {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'docx';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'image';
  return 'text';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const FILE_TYPE_ICONS: Record<NotebookFile['type'], string> = {
  pdf: 'PDF',
  docx: 'DOC',
  image: 'IMG',
  text: 'TXT',
};

const FILE_TYPE_COLORS: Record<NotebookFile['type'], { bg: string; fg: string }> = {
  pdf: { bg: '#FBEAE3', fg: '#A4432A' },
  docx: { bg: '#E8F0F8', fg: '#3D6B8A' },
  image: { bg: '#E6F4EA', fg: '#2E7D4F' },
  text: { bg: '#FCF1DD', fg: '#8A5A1E' },
};

/* ─── Create Entry Form ─── */

function NotebookCreateForm({
  students,
  classes,
  onSubmit,
  onCancel,
}: {
  students: Student[];
  classes: SchoolClass[];
  onSubmit: (entry: Omit<NotebookEntry, 'id' | 'created_at' | 'teacher_name' | 'teacher_id'>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentText, setContentText] = useState('');
  const [language, setLanguage] = useState<'en' | 'tl'>('en');
  const [files, setFiles] = useState<NotebookFile[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [activeClassFilter, setActiveClassFilter] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group classes assigned to the teacher
  const classList = useMemo(() => {
    if (classes.length > 0) return classes;
    // Derive from students if classes prop is empty
    const map = new Map<string, SchoolClass>();
    students.forEach((s) => {
      const sec = s.section_name || s.class_name || s.section;
      if (sec && !map.has(sec.toLowerCase())) {
        map.set(sec.toLowerCase(), {
          id: `cls-${sec}`,
          name: sec,
          grade_level: s.grade_level || 7,
          class_code: `SMCC-${sec.toUpperCase()}`,
        });
      }
    });
    return Array.from(map.values());
  }, [classes, students]);

  function handleFiles(fileList: FileList) {
    Array.from(fileList).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" is too large (max 5MB per file).`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const nbFile: NotebookFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          type: detectFileType(file),
          size: file.size,
          data_url: reader.result as string,
        };
        setFiles((prev) => [...prev, nbFile]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeFile(fileId: string) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  function toggleStudent(sid: string) {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  }

  function selectAllInClass(className: string) {
    const classStudents = students.filter(
      (s) => (s.section_name || s.class_name || s.section || '').toLowerCase() === className.toLowerCase()
    );
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      const allSelected = classStudents.every((s) => next.has(s.id));
      if (allSelected) {
        classStudents.forEach((s) => next.delete(s.id));
      } else {
        classStudents.forEach((s) => next.add(s.id));
      }
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s.id)));
    }
  }

  function handleSubmit() {
    if (!title.trim()) return;
    if (selectedStudentIds.size === 0) return;
    if (!contentText.trim() && files.length === 0) return;

    const selectedStudents = students.filter((s) => selectedStudentIds.has(s.id));
    const targetGrades = Array.from(new Set(selectedStudents.map((s) => s.grade_level || 7)));
    const targetClasses = Array.from(
      new Set(selectedStudents.map((s) => s.section_name || s.class_name || s.section).filter(Boolean))
    ) as string[];

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      content_text: contentText.trim(),
      files,
      source_language: language,
      assigned_student_ids: Array.from(selectedStudentIds),
      assigned_student_names: selectedStudents.map((s) => s.display_name),
      target_grades: targetGrades,
      target_classes: targetClasses,
    });
  }

  // Filter students by selected class pill
  const displayedStudents = students.filter((s) => {
    if (activeClassFilter === 'all') return true;
    return (s.section_name || s.class_name || s.section || '').toLowerCase() === activeClassFilter.toLowerCase();
  });

  const canSubmit = title.trim() && selectedStudentIds.size > 0 && (contentText.trim() || files.length > 0);

  return (
    <Card className="mb-6 rb-fade-in-up">
      <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: TAN_BORDER }}>
        <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
          Share New Study Material
        </h3>
        <span className="text-xs font-mono text-gray-500">
          PDF, Word, Images, Text
        </span>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ fontFamily: FONT_SANS, color: MUTED }}>
            Material Title *
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 5: Photosynthesis Review Handout & Study Guide"
            className="rb-input w-full"
          />
        </label>
      </div>

      {/* Instructions */}
      <div className="mb-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ fontFamily: FONT_SANS, color: MUTED }}>
            Instructions / Overview for Students
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Please read this summary and review the diagrams before tomorrow's comprehension test."
            className="rb-input w-full"
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </label>
      </div>

      {/* Language */}
      <div className="mb-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ fontFamily: FONT_SANS, color: MUTED }}>
            Language
          </span>
          <div className="flex gap-2">
            {(['en', 'tl'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer"
                style={{
                  fontFamily: FONT_SANS,
                  background: language === lang ? `${TEACHER_ACCENT}18` : 'transparent',
                  color: language === lang ? TEACHER_ACCENT : MUTED,
                  border: `1.5px solid ${language === lang ? TEACHER_ACCENT : TAN_BORDER}`,
                }}
              >
                {LANG_LABEL[lang]}
              </button>
            ))}
          </div>
        </label>
      </div>

      {/* File Upload Area */}
      <div className="mb-4">
        <span className="text-xs font-semibold block mb-1.5" style={{ fontFamily: FONT_SANS, color: MUTED }}>
          Attach Files (PDF, Word, Pictures, Screenshots)
        </span>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border-2 border-dashed p-5 text-center transition-all duration-200 cursor-pointer"
          style={{
            borderColor: isDragging ? TEACHER_ACCENT : TAN_BORDER,
            background: isDragging ? `${TEACHER_ACCENT}08` : CREAM,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1.5 opacity-60">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: INK }}>
            Drag & drop files here, or <span style={{ color: TEACHER_ACCENT, textDecoration: 'underline' }}>browse</span>
          </p>
          <p className="text-[10px]" style={{ fontFamily: FONT_MONO, color: MUTED }}>
            PDF, DOCX, PNG, JPG, Screenshots, Text (max 5MB each)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.txt"
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; }}
          />
        </div>

        {/* File preview chips */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {files.map((f) => {
              const colors = FILE_TYPE_COLORS[f.type];
              return (
                <div
                  key={f.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs rb-fade-in-up"
                  style={{ background: colors.bg, color: colors.fg, fontFamily: FONT_SANS, fontWeight: 600 }}
                >
                  <span className="text-[10px] font-bold" style={{ fontFamily: FONT_MONO }}>{FILE_TYPE_ICONS[f.type]}</span>
                  <span className="max-w-[140px] truncate">{f.name}</span>
                  <span className="text-[10px] opacity-70" style={{ fontFamily: FONT_MONO }}>{formatFileSize(f.size)}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer ml-0.5"
                    aria-label={`Remove ${f.name}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Text content area */}
      <div className="mb-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ fontFamily: FONT_SANS, color: MUTED }}>
            Reading Material / Passage Text (For in-app reading & AI assistance)
          </span>
          <textarea
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            placeholder="Paste or type study text, passage excerpt, or chapter summary here..."
            className="rb-input w-full"
            rows={5}
            style={{ resize: 'vertical', lineHeight: '1.6' }}
          />
        </label>
      </div>

      {/* ─── Clean Student & Class Assignment Section ─── */}
      <div className="mb-5 p-4 rounded-xl border" style={{ background: `${CREAM}88`, borderColor: TAN_BORDER }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-semibold block" style={{ fontFamily: FONT_SANS, color: CHALK_GREEN }}>
              Assign to Students ({selectedStudentIds.size} of {students.length} selected)
            </span>
          </div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border hover:bg-white transition-colors cursor-pointer"
            style={{ fontFamily: FONT_SANS, color: TEACHER_ACCENT, borderColor: `${TEACHER_ACCENT}44` }}
          >
            {selectedStudentIds.size === students.length ? 'Deselect All' : 'Select All Students'}
          </button>
        </div>

        {/* Class Selection Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setActiveClassFilter('all')}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border"
            style={{
              fontFamily: FONT_SANS,
              background: activeClassFilter === 'all' ? TEACHER_ACCENT : CREAM,
              color: activeClassFilter === 'all' ? '#FFFDF8' : MUTED,
              borderColor: activeClassFilter === 'all' ? TEACHER_ACCENT : TAN_BORDER,
            }}
          >
            All Classes ({students.length})
          </button>

          {classList.map((cls) => {
            const classStudents = students.filter(
              (s) => (s.section_name || s.class_name || s.section || '').toLowerCase() === cls.name.toLowerCase()
            );
            const countSelected = classStudents.filter((s) => selectedStudentIds.has(s.id)).length;
            const isFilterActive = activeClassFilter.toLowerCase() === cls.name.toLowerCase();

            return (
              <div key={cls.id} className="inline-flex items-center rounded-full border overflow-hidden" style={{ borderColor: isFilterActive ? TEACHER_ACCENT : TAN_BORDER }}>
                <button
                  type="button"
                  onClick={() => setActiveClassFilter(cls.name)}
                  className="px-3 py-1 text-xs font-semibold transition-colors cursor-pointer"
                  style={{
                    fontFamily: FONT_SANS,
                    background: isFilterActive ? `${TEACHER_ACCENT}18` : CREAM,
                    color: isFilterActive ? TEACHER_ACCENT : INK,
                  }}
                >
                  Grade {cls.grade_level || 7} · {cls.name}
                </button>
                <button
                  type="button"
                  onClick={() => selectAllInClass(cls.name)}
                  className="px-2 py-1 text-[11px] font-mono font-bold transition-colors cursor-pointer border-l hover:bg-black/5"
                  style={{
                    borderColor: isFilterActive ? TEACHER_ACCENT : TAN_BORDER,
                    background: countSelected === classStudents.length && classStudents.length > 0 ? TEACHER_ACCENT : CREAM,
                    color: countSelected === classStudents.length && classStudents.length > 0 ? '#FFFDF8' : TEACHER_ACCENT,
                  }}
                  title="Toggle all students in this class"
                >
                  {countSelected}/{classStudents.length}
                </button>
              </div>
            );
          })}
        </div>

        {/* Student Checklist */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto rounded-xl p-3"
          style={{ background: CREAM, border: `1px solid ${TAN_BORDER}` }}
        >
          {displayedStudents.map((s) => {
            const isSelected = selectedStudentIds.has(s.id);
            const idLabel = s.school_id || s.username;
            const secLabel = s.section_name || s.class_name || s.section;
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
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono truncate">
                    <span className="font-bold text-[#3D6B8A]">G{s.grade_level || 7}</span>
                    {secLabel && <span>· {secLabel}</span>}
                    {idLabel && <span className="opacity-60">· {idLabel}</span>}
                  </div>
                </div>
              </label>
            );
          })}
          {displayedStudents.length === 0 && (
            <div className="col-span-full text-center py-4 text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>
              No students found for the selected class filter.
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <PrimaryButton
          accent={TEACHER_ACCENT}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          Share Material ({selectedStudentIds.size} Student{selectedStudentIds.size !== 1 ? 's' : ''})
        </PrimaryButton>
        <GhostButton onClick={onCancel}>Cancel</GhostButton>
      </div>
    </Card>
  );
}

/* ─── Entry Detail Panel ─── */

function NotebookEntryDetail({
  entry,
  onClose,
}: {
  entry: NotebookEntry;
  onClose: () => void;
}) {
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('readbuddy_student_notebook_status');
      if (saved) {
        setStatuses(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  function getStudentStatus(entryId: string, studentName: string): string {
    const key = `${entryId}::${studentName.toLowerCase()}`;
    return statuses[key] || 'new';
  }

  const statusCounts = {
    new: 0,
    reviewed: 0,
    studied: 0,
  };
  entry.assigned_student_names.forEach((name) => {
    const s = getStudentStatus(entry.id, name) as keyof typeof statusCounts;
    if (statusCounts[s] !== undefined) statusCounts[s]++;
    else statusCounts.new++;
  });

  return (
    <DetailPanel open title={entry.title} onClose={onClose}>
      {/* Target Grade & Classes */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge tone="info">{LANG_LABEL[entry.source_language]}</Badge>
        {entry.target_grades && entry.target_grades.map((g) => (
          <span key={g} className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-gray-100 text-gray-700">
            Grade {g}
          </span>
        ))}
        {entry.target_classes && entry.target_classes.map((cls) => (
          <span key={cls} className="text-xs px-2 py-0.5 rounded-full font-sans font-medium bg-[#3D6B8A12] text-[#3D6B8A]">
            {cls}
          </span>
        ))}
        <span className="text-xs ml-auto" style={{ fontFamily: FONT_MONO, color: MUTED }}>
          Shared {entry.created_at}
        </span>
      </div>

      {entry.description && (
        <div className="mb-4 p-3.5 rounded-xl" style={{ background: `${TEACHER_ACCENT}08`, border: `1px solid ${TEACHER_ACCENT}22` }}>
          <h4 className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ fontFamily: FONT_SANS, color: TEACHER_ACCENT }}>
            Teacher Instructions
          </h4>
          <p className="text-sm" style={{ fontFamily: FONT_SANS, color: INK, lineHeight: '1.6' }}>{entry.description}</p>
        </div>
      )}

      {/* Files */}
      {entry.files.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs mb-2 uppercase tracking-wide" style={{ fontFamily: FONT_SANS, fontWeight: 600, color: MUTED }}>
            Attached Files ({entry.files.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {entry.files.map((f) => {
              const colors = FILE_TYPE_COLORS[f.type];
              return (
                <span
                  key={f.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                  style={{ background: colors.bg, color: colors.fg, fontFamily: FONT_SANS, fontWeight: 600 }}
                >
                  <span className="text-[10px] font-bold" style={{ fontFamily: FONT_MONO }}>{FILE_TYPE_ICONS[f.type]}</span>
                  {f.name}
                  <span className="text-[10px] opacity-70" style={{ fontFamily: FONT_MONO }}>{formatFileSize(f.size)}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Text Content Preview */}
      {entry.content_text && (
        <div className="mb-4">
          <h4 className="text-xs mb-2 uppercase tracking-wide" style={{ fontFamily: FONT_SANS, fontWeight: 600, color: MUTED }}>
            Reading Material / Passage Text
          </h4>
          <div
            className="p-4 rounded-xl max-h-52 overflow-y-auto text-sm"
            style={{ fontFamily: FONT_SANS, color: INK, background: CREAM, border: `1px solid ${TAN_BORDER}`, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}
          >
            {entry.content_text}
          </div>
        </div>
      )}

      {/* Student Status */}
      <div className="mb-4">
        <h4 className="text-xs mb-3 uppercase tracking-wide" style={{ fontFamily: FONT_SANS, fontWeight: 600, color: MUTED }}>
          Student Study Progress ({entry.assigned_student_names.length} Students)
        </h4>

        <div className="flex gap-3 mb-3">
          <div className="flex-1 p-2.5 rounded-xl text-center" style={{ background: '#FCF1DD', border: '1px solid #EFD9AC' }}>
            <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: '#8A5A1E' }}>{statusCounts.new}</div>
            <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ fontFamily: FONT_SANS, color: '#8A5A1E' }}>Not Started</div>
          </div>
          <div className="flex-1 p-2.5 rounded-xl text-center" style={{ background: '#E8F0F8', border: '1px solid #BDD4E8' }}>
            <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: '#3D6B8A' }}>{statusCounts.reviewed}</div>
            <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ fontFamily: FONT_SANS, color: '#3D6B8A' }}>Reviewed</div>
          </div>
          <div className="flex-1 p-2.5 rounded-xl text-center" style={{ background: '#E6F4EA', border: '1px solid #BFE0CC' }}>
            <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: '#2E7D4F' }}>{statusCounts.studied}</div>
            <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ fontFamily: FONT_SANS, color: '#2E7D4F' }}>Studied / Ready</div>
          </div>
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {entry.assigned_student_names.map((name, i) => {
            const status = getStudentStatus(entry.id, name);
            const statusConfig: Record<string, { tone: 'neutral' | 'info' | 'success'; label: string }> = {
              new: { tone: 'neutral', label: 'Not Started' },
              reviewed: { tone: 'info', label: 'Reviewed' },
              studied: { tone: 'success', label: 'Studied' },
            };
            const cfg = statusConfig[status] || statusConfig.new;
            return (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: i % 2 === 0 ? 'transparent' : `${CREAM}88` }}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={name} accent={TEACHER_ACCENT} size={28} />
                  <span className="text-sm font-medium" style={{ fontFamily: FONT_SANS, color: INK }}>{name}</span>
                </div>
                <Badge tone={cfg.tone}>{cfg.label}</Badge>
              </div>
            );
          })}
        </div>
      </div>
    </DetailPanel>
  );
}

/* ─── Main Teacher Notebook Component ─── */

export default function TeacherNotebook({
  students = [],
  classes: initialClasses = [],
}: {
  students?: Student[];
  classes?: SchoolClass[];
}) {
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>(initialClasses);
  const [showCreate, setShowCreate] = useState(false);
  const [detailEntry, setDetailEntry] = useState<NotebookEntry | null>(null);

  // Load entries & classes
  useEffect(() => {
    function loadData() {
      try {
        const savedEntries = localStorage.getItem('readbuddy_teacher_notebook');
        if (savedEntries) {
          const parsed = JSON.parse(savedEntries);
          if (Array.isArray(parsed)) setEntries(parsed);
        } else {
          setEntries([]);
        }

        const savedClasses = localStorage.getItem('readbuddy_teacher_classes');
        if (savedClasses) {
          const parsed = JSON.parse(savedClasses);
          if (Array.isArray(parsed)) setClasses(parsed);
        }
      } catch (e) {}
    }
    loadData();
    window.addEventListener('readbuddy_notebook_updated', loadData);
    window.addEventListener('readbuddy_classes_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('readbuddy_notebook_updated', loadData);
      window.removeEventListener('readbuddy_classes_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  function handleCreateEntry(data: Omit<NotebookEntry, 'id' | 'created_at' | 'teacher_name' | 'teacher_id'>) {
    let teacherName = 'Teacher';
    let teacherId = '';
    try {
      const user = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
      if (user.display_name) teacherName = user.display_name;
      if (user.school_id) teacherId = user.school_id;
    } catch (e) {}

    const newEntry: NotebookEntry = {
      id: `nb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...data,
      teacher_name: teacherName,
      teacher_id: teacherId,
      created_at: new Date().toISOString().split('T')[0],
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);

    try {
      localStorage.setItem('readbuddy_teacher_notebook', JSON.stringify(updated));
      window.dispatchEvent(new Event('readbuddy_notebook_updated'));
    } catch (e) {
      alert('Could not save. LocalStorage may be full.');
    }

    setShowCreate(false);
  }

  function handleDeleteEntry(entryId: string) {
    const updated = entries.filter((e) => e.id !== entryId);
    setEntries(updated);
    try {
      localStorage.setItem('readbuddy_teacher_notebook', JSON.stringify(updated));
      window.dispatchEvent(new Event('readbuddy_notebook_updated'));
    } catch (e) {}
  }

  return (
    <ErrorBoundary fallbackTitle="Notebook Module Encountered an Error">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <SectionHeader
            title="Notebook"
            subtitle="Share reading materials, documents, and notes with your classes for upcoming test review."
            accent={TEACHER_ACCENT}
          />
          {!showCreate && (
            <PrimaryButton accent={TEACHER_ACCENT} onClick={() => setShowCreate(true)}>
              + Share Material
            </PrimaryButton>
          )}
        </div>

        {/* Create form */}
        {showCreate && (
          <NotebookCreateForm
            students={students}
            classes={classes}
            onSubmit={handleCreateEntry}
            onCancel={() => setShowCreate(false)}
          />
        )}

        {/* Entries list — only show when not creating or when entries exist */}
        {!showCreate && entries.length === 0 ? (
          <EmptyState
            message="No materials shared yet. Share reading passages, notes, or files with your students to help them study."
            actionLabel="Share your first material"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map((entry, i) => (
              <Card
                key={entry.id}
                hoverable
                className="rb-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Title & Target row */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
                        {entry.title}
                      </h3>
                      <Badge tone="info">{LANG_LABEL[entry.source_language]}</Badge>
                      {entry.target_grades && entry.target_grades.map((g) => (
                        <span key={g} className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#3D6B8A18] text-[#3D6B8A]">
                          Grade {g}
                        </span>
                      ))}
                      {entry.target_classes && entry.target_classes.map((cls) => (
                        <span key={cls} className="text-[11px] px-2 py-0.5 rounded-full font-sans font-semibold bg-gray-100 text-gray-700">
                          {cls}
                        </span>
                      ))}
                    </div>

                    {/* Description preview */}
                    {entry.description && (
                      <p className="text-xs mb-2 line-clamp-2" style={{ fontFamily: FONT_SANS, color: MUTED, lineHeight: '1.5' }}>
                        {entry.description}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                      <span>Shared {entry.created_at}</span>
                      {entry.files.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                          </svg>
                          {entry.files.length} file{entry.files.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {entry.content_text && (
                        <span className="flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          {entry.content_text.split(/\s+/).length} words
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        {entry.assigned_student_names.length} student{entry.assigned_student_names.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* File chips */}
                    {entry.files.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {entry.files.map((f) => {
                          const colors = FILE_TYPE_COLORS[f.type];
                          return (
                            <span
                              key={f.id}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                              style={{ background: colors.bg, color: colors.fg, fontFamily: FONT_MONO, fontWeight: 700 }}
                            >
                              {FILE_TYPE_ICONS[f.type]} {f.name.length > 20 ? f.name.slice(0, 18) + '...' : f.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setDetailEntry(entry)}
                      className="text-xs px-3.5 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
                      style={{
                        fontFamily: FONT_SANS,
                        fontWeight: 600,
                        color: '#FFFDF8',
                        background: TEACHER_ACCENT,
                      }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this notebook entry? This cannot be undone.')) {
                          handleDeleteEntry(entry.id);
                        }
                      }}
                      className="text-xs px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-red-50 cursor-pointer"
                      style={{
                        fontFamily: FONT_SANS,
                        fontWeight: 500,
                        color: '#A4432A',
                        border: `1px solid ${TAN_BORDER}`,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Detail panel */}
        {detailEntry && (
          <NotebookEntryDetail
            entry={detailEntry}
            onClose={() => setDetailEntry(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
