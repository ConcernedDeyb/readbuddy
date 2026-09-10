'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  SectionHeader,
  Card,
  StatCard,
  Badge,
  EmptyState,
  PrimaryButton,
  GhostButton,
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
  StudentPersonalNote,
  StudyHistoryItem,
} from '../_shared';
import { PenLine, FileText, Bot, Mic, X } from 'lucide-react';

const STUDENT_ACCENT = '#E8873A';
const LANG_LABEL: Record<string, string> = { en: 'English', tl: 'Tagalog' };

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

type MaterialStatus = 'new' | 'reviewed' | 'studied';

const STATUS_CONFIG: Record<MaterialStatus, { tone: 'accent' | 'info' | 'success'; label: string; color: string }> = {
  new: { tone: 'accent', label: 'New Material', color: '#E8873A' },
  reviewed: { tone: 'info', label: 'Reviewed', color: '#3D6B8A' },
  studied: { tone: 'success', label: 'Mastered', color: '#2E7D4F' },
};

export default function StudentNotebook({
  studentName,
  studentId,
}: {
  studentName: string;
  studentId?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'materials' | 'notes' | 'history'>('materials');
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [personalNotes, setPersonalNotes] = useState<StudentPersonalNote[]>([]);
  const [studyHistory, setStudyHistory] = useState<StudyHistoryItem[]>([]);
  const [statuses, setStatuses] = useState<Record<string, MaterialStatus>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MaterialStatus>('all');

  // Personal Note creation draft with file attachments
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteDraft, setNoteDraft] = useState<{ title: string; content: string; tags: string }>({
    title: '',
    content: '',
    tags: '',
  });
  const [noteFiles, setNoteFiles] = useState<NotebookFile[]>([]);
  const [isNoteDragging, setIsNoteDragging] = useState(false);
  const noteFileInputRef = useRef<HTMLInputElement>(null);

  // Helper to log persistent study activity
  const logStudyActivity = (type: StudyHistoryItem['activity_type'], title: string, details?: string) => {
    try {
      const now = new Date();
      const newItem: StudyHistoryItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        student_id: studentId || studentName,
        activity_type: type,
        title,
        details,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toISOString().split('T')[0],
      };
      setStudyHistory((prev) => {
        const updated = [newItem, ...prev.slice(0, 49)];
        localStorage.setItem('readbuddy_study_history', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {}
  };

  // Load notebook entries, personal notes, and study history
  useEffect(() => {
    function loadData() {
      try {
        const saved = localStorage.getItem('readbuddy_teacher_notebook');
        const currentUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
        const currentName = (currentUser.display_name || studentName || '').toLowerCase();
        const currentUsername = (currentUser.username || '').toLowerCase();
        const currentSchoolId = (currentUser.school_id || studentId || '').toLowerCase();

        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const myEntries = parsed.filter((entry: NotebookEntry) => {
              return (
                entry.assigned_student_names?.some((name) => name.toLowerCase() === currentName) ||
                entry.assigned_student_ids?.some(
                  (id) => id.toLowerCase() === currentUsername || id.toLowerCase() === currentSchoolId || id === currentUser.id
                )
              );
            });
            setEntries(myEntries);
          }
        } else {
          setEntries([]);
        }

        // Load statuses
        const savedStatuses = localStorage.getItem('readbuddy_student_notebook_status');
        if (savedStatuses) setStatuses(JSON.parse(savedStatuses));

        // Load personal notes
        const savedNotes = localStorage.getItem('readbuddy_student_personal_notes');
        if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes);
          if (Array.isArray(parsedNotes)) setPersonalNotes(parsedNotes);
        }

        // Load study history
        const savedHistory = localStorage.getItem('readbuddy_study_history');
        if (savedHistory) {
          const parsedHist = JSON.parse(savedHistory);
          if (Array.isArray(parsedHist)) setStudyHistory(parsedHist);
        }
      } catch (e) {}
    }

    loadData();
    window.addEventListener('readbuddy_notebook_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('readbuddy_notebook_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, [studentName, studentId]);

  function getStatus(entryId: string): MaterialStatus {
    const currentUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
    const currentName = (currentUser.display_name || studentName || '').toLowerCase();
    const key = `${entryId}::${currentName}`;
    return statuses[key] || 'new';
  }

  function updateStatus(entryId: string, newStatus: MaterialStatus, entryTitle?: string) {
    const currentUser = JSON.parse(localStorage.getItem('readbuddy_user') || '{}');
    const currentName = (currentUser.display_name || studentName || '').toLowerCase();
    const key = `${entryId}::${currentName}`;
    const updated = { ...statuses, [key]: newStatus };
    setStatuses(updated);
    try {
      localStorage.setItem('readbuddy_student_notebook_status', JSON.stringify(updated));
      window.dispatchEvent(new Event('readbuddy_notebook_updated'));
    } catch (e) {}

    if (newStatus === 'studied') {
      logStudyActivity('reviewed_material', `Mastered: ${entryTitle || 'Study Material'}`, 'Completed full review');
    } else if (newStatus === 'reviewed') {
      logStudyActivity('reviewed_material', `Reviewed: ${entryTitle || 'Study Material'}`, 'Read through handout');
    }
  }

  function handleExpand(entry: NotebookEntry) {
    const wasExpanded = expandedId === entry.id;
    setExpandedId(wasExpanded ? null : entry.id);

    if (!wasExpanded && getStatus(entry.id) === 'new') {
      updateStatus(entry.id, 'reviewed', entry.title);
    }
  }

  function handleFilePreview(file: NotebookFile) {
    if (file.type === 'image') {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head><title>${file.name}</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a1a;">
              <img src="${file.data_url}" style="max-width:100%;max-height:100vh;object-fit:contain;" alt="${file.name}" />
            </body>
          </html>
        `);
      }
    } else {
      const link = document.createElement('a');
      link.href = file.data_url;
      link.download = file.name;
      link.click();
    }
  }

  function handleNoteFiles(fileList: FileList) {
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
        setNoteFiles((prev) => [...prev, nbFile]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeNoteFile(fileId: string) {
    setNoteFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  function handleSavePersonalNote() {
    if (!noteDraft.title.trim()) return;
    if (!noteDraft.content.trim() && noteFiles.length === 0) return;

    const newNote: StudentPersonalNote = {
      id: `note-${Date.now()}`,
      title: noteDraft.title.trim(),
      content: noteDraft.content.trim(),
      tags: noteDraft.tags.split(',').map((t) => t.trim()).filter(Boolean),
      files: noteFiles,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    };

    const updated = [newNote, ...personalNotes];
    setPersonalNotes(updated);
    try {
      localStorage.setItem('readbuddy_student_personal_notes', JSON.stringify(updated));
    } catch (e) {}

    logStudyActivity('created_note', `Created Study Note: ${newNote.title}`, `${newNote.content.slice(0, 40)}...`);

    setNoteDraft({ title: '', content: '', tags: '' });
    setNoteFiles([]);
    setShowNoteEditor(false);
  }

  function handleDeletePersonalNote(id: string) {
    if (!confirm('Are you sure you want to delete this study note?')) return;
    const updated = personalNotes.filter((n) => n.id !== id);
    setPersonalNotes(updated);
    try {
      localStorage.setItem('readbuddy_student_personal_notes', JSON.stringify(updated));
    } catch (e) {}
  }

  // Seamless learning bridge: start note from teacher handout
  function handleTakeNoteFromMaterial(entry: NotebookEntry) {
    setNoteDraft({
      title: `Summary of ${entry.title}`,
      content: `Key points from "${entry.title}":\n\nReference text:\n"${entry.content_text.slice(0, 150)}..."\n\nMy Summary:\n- `,
      tags: `Review, ${LANG_LABEL[entry.source_language] || 'Study'}`,
    });
    setActiveTab('notes');
    setShowNoteEditor(true);
  }

  // Filtered teacher entries
  const filteredTeacherEntries = entries.filter((entry) => {
    const status = getStatus(entry.id);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content_text?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered personal notes
  const filteredPersonalNotes = personalNotes.filter((note) => {
    return (
      !searchQuery.trim() ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Compute stats
  const totalEntries = entries.length;
  const newCount = entries.filter((e) => getStatus(e.id) === 'new').length;
  const reviewedCount = entries.filter((e) => getStatus(e.id) === 'reviewed').length;
  const studiedCount = entries.filter((e) => getStatus(e.id) === 'studied').length;

  return (
    <ErrorBoundary fallbackTitle="Notebook Module Encountered an Error">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <SectionHeader
            title="My Notebook"
            subtitle="Your personalized study hub for reading materials, notes, and study preparation."
            accent={STUDENT_ACCENT}
          />
          {activeTab === 'notes' && !showNoteEditor && (
            <PrimaryButton accent={STUDENT_ACCENT} onClick={() => setShowNoteEditor(true)} className="w-full sm:w-auto shrink-0">
              + New Study Note
            </PrimaryButton>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-4 mb-6">
          <StatCard label="Course Materials" value={totalEntries} accent={STUDENT_ACCENT} />
          <StatCard label="Unread / New" value={newCount} accent="#8A5A1E" />
          <StatCard label="Mastered" value={studiedCount} accent="#2E7D4F" />
          <StatCard label="My Notes" value={personalNotes.length} accent="#1F4D3A" />
          <StatCard label="Study Sessions" value={studyHistory.length} accent="#3D6B8A" />
        </div>

        {/* Navigation Tabs (Soft-Neobrutalism Tactile Pill Buttons) */}
        <div id="tour-student-notebook-tabs" className="flex items-center gap-3 overflow-x-auto pt-1 pb-2 mb-6">
          {/* Tab 1: Materials */}
          <button
            type="button"
            onClick={() => { setActiveTab('materials'); setShowNoteEditor(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-150 border-2 select-none"
            style={{
              fontFamily: FONT_SANS,
              background: activeTab === 'materials' ? '#E8873A' : '#FFFDF8',
              color: activeTab === 'materials' ? '#FFFDF8' : '#2B2621',
              borderColor: activeTab === 'materials' ? '#1F4D3A' : TAN_BORDER,
              boxShadow: activeTab === 'materials' ? '3px 3px 0px #1F4D3A' : '2px 2px 0px rgba(31, 77, 58, 0.08)',
              transform: activeTab === 'materials' ? 'translate(-1px, -1px)' : 'none',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6s1.5-2 5-2 5 2 5 2v14s-1.5-1-5-1-5 1-5 1V6z" />
              <path d="M12 6s1.5-2 5-2 5 2 5 2v14s-1.5-1-5-1-5 1-5 1V6z" />
            </svg>
            <span>Course Materials & Readings ({entries.length})</span>
          </button>

          {/* Tab 2: Notes */}
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-150 border-2 select-none"
            style={{
              fontFamily: FONT_SANS,
              background: activeTab === 'notes' ? '#E8873A' : '#FFFDF8',
              color: activeTab === 'notes' ? '#FFFDF8' : '#2B2621',
              borderColor: activeTab === 'notes' ? '#1F4D3A' : TAN_BORDER,
              boxShadow: activeTab === 'notes' ? '3px 3px 0px #1F4D3A' : '2px 2px 0px rgba(31, 77, 58, 0.08)',
              transform: activeTab === 'notes' ? 'translate(-1px, -1px)' : 'none',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>My Personal Notes ({personalNotes.length})</span>
          </button>

          {/* Tab 3: History */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-150 border-2 select-none"
            style={{
              fontFamily: FONT_SANS,
              background: activeTab === 'history' ? '#3D6B8A' : '#FFFDF8',
              color: activeTab === 'history' ? '#FFFDF8' : '#2B2621',
              borderColor: activeTab === 'history' ? '#1F4D3A' : TAN_BORDER,
              boxShadow: activeTab === 'history' ? '3px 3px 0px #1F4D3A' : '2px 2px 0px rgba(31, 77, 58, 0.08)',
              transform: activeTab === 'history' ? 'translate(-1px, -1px)' : 'none',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Study History & Activity ({studyHistory.length})</span>
          </button>
        </div>

        {/* ─── TAB 1: COURSE MATERIALS ─── */}
        {activeTab === 'materials' && (
          <div>
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
              <div className="relative flex-1 flex items-center">
                <span className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search course materials, passages, vocabulary..."
                  className="rb-input w-full text-xs !pl-10 !pr-3"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer border"
                  style={{
                    fontFamily: FONT_SANS,
                    background: statusFilter === 'all' ? STUDENT_ACCENT : 'transparent',
                    color: statusFilter === 'all' ? '#FFFDF8' : MUTED,
                    borderColor: statusFilter === 'all' ? STUDENT_ACCENT : TAN_BORDER,
                  }}
                >
                  All Status
                </button>
                {(['new', 'reviewed', 'studied'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer border capitalize"
                    style={{
                      fontFamily: FONT_SANS,
                      background: statusFilter === st ? STUDENT_ACCENT : 'transparent',
                      color: statusFilter === st ? '#FFFDF8' : MUTED,
                      borderColor: statusFilter === st ? STUDENT_ACCENT : TAN_BORDER,
                    }}
                  >
                    {st === 'new' ? 'New' : st === 'reviewed' ? 'Reviewed' : 'Mastered'}
                  </button>
                ))}
              </div>
            </div>

            {filteredTeacherEntries.length === 0 ? (
              <EmptyState
                message={entries.length === 0 ? "No course materials assigned yet. Your teacher's review packets and readings will appear here." : "No materials match your search."}
              />
            ) : (
              <div className="flex flex-col gap-4">
                {filteredTeacherEntries.map((entry, i) => {
                  const status = getStatus(entry.id);
                  const isExpanded = expandedId === entry.id;
                  const statusCfg = STATUS_CONFIG[status];

                  return (
                    <Card key={entry.id} className="rb-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                      {/* Header */}
                      <div
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer"
                        onClick={() => handleExpand(entry)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
                              {entry.title}
                            </h3>
                            <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
                            <Badge tone="info">{LANG_LABEL[entry.source_language]}</Badge>
                          </div>

                          {entry.description && (
                            <p className="text-xs mb-1.5 line-clamp-2" style={{ fontFamily: FONT_SANS, color: MUTED, lineHeight: '1.5' }}>
                              {entry.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                            <span>Assigned by {entry.teacher_name}</span>
                            <span>Shared {entry.created_at}</span>
                            {entry.files.length > 0 && (
                              <span className="font-semibold text-[#3D6B8A]">
                                {entry.files.length} attachment{entry.files.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <span className="text-xs font-medium text-[#E8873A]">
                            {isExpanded ? 'Collapse' : 'Open Material'}
                          </span>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={MUTED}
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="transition-transform duration-300"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 rb-fade-in-up" style={{ borderTop: `1px solid ${TAN_BORDER}` }}>
                          {/* File Attachments */}
                          {entry.files.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs mb-2 uppercase tracking-wide font-semibold" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                                Attachments ({entry.files.length})
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {entry.files.map((f) => {
                                  const colors = FILE_TYPE_COLORS[f.type];
                                  return (
                                    <button
                                      key={f.id}
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleFilePreview(f); }}
                                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border hover:-translate-y-0.5 transition-all"
                                      style={{ background: colors.bg, color: colors.fg, borderColor: `${colors.fg}22` }}
                                    >
                                      <span className="text-[10px] font-bold font-mono">{FILE_TYPE_ICONS[f.type]}</span>
                                      <span className="max-w-[140px] truncate">{f.name}</span>
                                      <span className="text-[10px] opacity-60 font-mono">{formatFileSize(f.size)}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Reading Material Text */}
                          {entry.content_text && (
                            <div className="mb-4">
                              <h4 className="text-xs uppercase tracking-wide font-semibold mb-2" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                                Reading Passage & Notes
                              </h4>
                              <div
                                className="p-4 rounded-xl text-sm"
                                style={{
                                  fontFamily: FONT_SANS,
                                  color: INK,
                                  background: CREAM,
                                  border: `1px solid ${TAN_BORDER}`,
                                  lineHeight: '1.8',
                                  whiteSpace: 'pre-wrap',
                                  maxHeight: '300px',
                                  overflowY: 'auto',
                                }}
                              >
                                {entry.content_text}
                              </div>
                            </div>
                          )}

                          {/* Learning Workflow Action Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Status button */}
                              {status !== 'studied' ? (
                                <PrimaryButton
                                  accent="#2E7D4F"
                                  onClick={() => updateStatus(entry.id, 'studied', entry.title)}
                                >
                                  Mark as Mastered
                                </PrimaryButton>
                              ) : (
                                <GhostButton onClick={() => updateStatus(entry.id, 'reviewed', entry.title)}>
                                  Mark In-Review
                                </GhostButton>
                              )}

                              {/* Note Taking Bridge */}
                              <button
                                type="button"
                                onClick={() => handleTakeNoteFromMaterial(entry)}
                                className="text-xs px-3 py-1.5 rounded-full font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-white"
                                style={{ color: INK, borderColor: TAN_BORDER, fontFamily: FONT_SANS }}
                              >
                                <PenLine className="w-3.5 h-3.5 text-[#1F4D3A]" strokeWidth={2.25} />
                                <span>Take Personal Note</span>
                              </button>
                            </div>

                            {/* Practice Reading Aloud Bridge */}
                            {entry.content_text && (
                              <button
                                type="button"
                                onClick={() => {
                                  try {
                                    localStorage.setItem('readbuddy_confirmed_text', entry.content_text);
                                    localStorage.setItem('readbuddy_source_language', entry.source_language || 'en');
                                    logStudyActivity('reading_practice', `Guided Reading: ${entry.title}`, 'Launched practice session');
                                    router.push('/session');
                                  } catch (e) {}
                                }}
                                className="text-xs font-semibold flex items-center gap-1 text-[#1F4D3A] hover:underline cursor-pointer"
                              >
                                <span>Practice Reading Aloud ›</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: PERSONAL NOTES & FILES ─── */}
        {activeTab === 'notes' && (
          <div>
            {/* Note Editor */}
            {showNoteEditor && (
              <Card className="mb-6 rb-fade-in-up">
                <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: TAN_BORDER }}>
                  <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
                    Create Personal Study Note
                  </h3>
                  <span className="text-xs font-mono text-gray-500">Attach PDF, Word, Images, Notes</span>
                </div>

                <div className="mb-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold" style={{ fontFamily: FONT_SANS, color: MUTED }}>Note Title *</span>
                    <input
                      type="text"
                      value={noteDraft.title}
                      onChange={(e) => setNoteDraft((d) => ({ ...d, title: e.target.value }))}
                      placeholder="e.g. Unit 2 Key Vocabulary, Summary & Diagrams"
                      className="rb-input w-full"
                    />
                  </label>
                </div>

                <div className="mb-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold" style={{ fontFamily: FONT_SANS, color: MUTED }}>Study Notes / Lesson Summary</span>
                    <textarea
                      value={noteDraft.content}
                      onChange={(e) => setNoteDraft((d) => ({ ...d, content: e.target.value }))}
                      placeholder="Write your study notes, reflections, definitions, or summarize what you learned..."
                      className="rb-input w-full"
                      rows={5}
                      style={{ resize: 'vertical', lineHeight: '1.6' }}
                    />
                  </label>
                </div>

                {/* File Attachment Area */}
                <div className="mb-3">
                  <span className="text-xs font-semibold block mb-1" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                    Attach Documents, Photos, Screenshots (PDF, DOCX, PNG, JPG)
                  </span>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsNoteDragging(true); }}
                    onDragLeave={() => setIsNoteDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsNoteDragging(false); if (e.dataTransfer.files.length) handleNoteFiles(e.dataTransfer.files); }}
                    onClick={() => noteFileInputRef.current?.click()}
                    className="rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all"
                    style={{
                      borderColor: isNoteDragging ? STUDENT_ACCENT : TAN_BORDER,
                      background: isNoteDragging ? `${STUDENT_ACCENT}08` : CREAM,
                    }}
                  >
                    <p className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: INK }}>
                      Drag files or <span style={{ color: STUDENT_ACCENT, textDecoration: 'underline' }}>click to attach</span>
                    </p>
                    <p className="text-[10px]" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                      PDF, DOCX, PNG, JPG, Screenshots (max 5MB)
                    </p>
                    <input
                      ref={noteFileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.txt"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) handleNoteFiles(e.target.files); e.target.value = ''; }}
                    />
                  </div>

                  {noteFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {noteFiles.map((f) => {
                        const colors = FILE_TYPE_COLORS[f.type];
                        return (
                          <div
                            key={f.id}
                            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ background: colors.bg, color: colors.fg }}
                          >
                            <span className="text-[10px] font-mono font-bold">{FILE_TYPE_ICONS[f.type]}</span>
                            <span className="max-w-[130px] truncate">{f.name}</span>
                            <button
                              type="button"
                              onClick={() => removeNoteFile(f.id)}
                              className="hover:opacity-70 cursor-pointer ml-1 flex items-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold" style={{ fontFamily: FONT_SANS, color: MUTED }}>Tags / Subject (comma separated)</span>
                    <input
                      type="text"
                      value={noteDraft.tags}
                      onChange={(e) => setNoteDraft((d) => ({ ...d, tags: e.target.value }))}
                      placeholder="e.g. Science, Review, Exam Prep"
                      className="rb-input w-full"
                    />
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <PrimaryButton
                    accent={STUDENT_ACCENT}
                    onClick={handleSavePersonalNote}
                    disabled={!noteDraft.title.trim() || (!noteDraft.content.trim() && noteFiles.length === 0)}
                    className="w-full sm:w-auto"
                  >
                    Save Note
                  </PrimaryButton>
                  <GhostButton onClick={() => { setShowNoteEditor(false); setNoteFiles([]); }} className="w-full sm:w-auto">
                    Cancel
                  </GhostButton>
                </div>
              </Card>
            )}

            {/* Note list */}
            {!showNoteEditor && filteredPersonalNotes.length === 0 ? (
              <EmptyState
                message={personalNotes.length === 0 ? "You haven't created any study notes yet. Click '+ New Study Note' to summarize lessons, attach study photos, and prepare for upcoming tests." : "No notes match your search."}
                actionLabel={personalNotes.length === 0 ? "+ Create First Note" : undefined}
                onAction={personalNotes.length === 0 ? () => setShowNoteEditor(true) : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPersonalNotes.map((note) => (
                  <Card key={note.id} hoverable className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
                          {note.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleDeletePersonalNote(note.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer flex items-center"
                          title="Delete note"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {note.content && (
                        <p className="text-xs mb-3 line-clamp-4 whitespace-pre-wrap" style={{ fontFamily: FONT_SANS, color: INK, lineHeight: '1.6' }}>
                          {note.content}
                        </p>
                      )}

                      {/* File attachment chips */}
                      {note.files && note.files.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {note.files.map((f) => {
                            const colors = FILE_TYPE_COLORS[f.type];
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => handleFilePreview(f)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer"
                                style={{ background: colors.bg, color: colors.fg }}
                              >
                                <span>{FILE_TYPE_ICONS[f.type]}</span>
                                <span className="max-w-[110px] truncate">{f.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {note.tags.map((t) => (
                            <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-[11px]" style={{ borderColor: `${TAN_BORDER}66` }}>
                      <span className="font-mono text-gray-400">Created {note.created_at}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: PERSISTENT STUDY HISTORY & ACTIVITY ─── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: TAN_BORDER }}>
                <div>
                  <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
                    Study Session Timeline & Progress
                  </h3>
                  <p className="text-xs text-gray-500 font-sans">
                    Keep track of your study sessions, reviewed handouts, and notes across all your devices.
                  </p>
                </div>
                {studyHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Clear study session history?')) {
                        setStudyHistory([]);
                        localStorage.removeItem('readbuddy_study_history');
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 font-sans cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {studyHistory.length === 0 ? (
                <EmptyState
                  message="No study sessions logged yet. Review your course materials and write study notes to build your study history!"
                />
              ) : (
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DED2B4]">
                  {studyHistory.map((item) => {
                    const iconConfig: Record<StudyHistoryItem['activity_type'], { icon: typeof FileText; bg: string; color: string }> = {
                      reviewed_material: { icon: FileText, bg: '#E8F0F8', color: '#3D6B8A' },
                      created_note: { icon: PenLine, bg: '#FCF1DD', color: '#8A5A1E' },
                      ai_study_session: { icon: Bot, bg: '#E6F4EA', color: '#2E7D4F' },
                      reading_practice: { icon: Mic, bg: '#FBEAE3', color: '#A4432A' },
                    };
                    const cfg = iconConfig[item.activity_type] || iconConfig.reviewed_material;
                    const IconComp = cfg.icon;

                    return (
                      <div key={item.id} className="relative rb-fade-in-up">
                        <span
                          className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                          style={{ background: cfg.color }}
                        >
                          <IconComp className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                        </span>
                        <div className="p-3.5 rounded-xl border bg-white" style={{ borderColor: `${TAN_BORDER}88` }}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold" style={{ fontFamily: FONT_SANS, color: INK }}>
                              {item.title}
                            </span>
                            <span className="text-[11px] font-mono text-gray-400">
                              {item.date} · {item.timestamp}
                            </span>
                          </div>
                          {item.details && (
                            <p className="text-xs text-gray-500 font-sans">{item.details}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
