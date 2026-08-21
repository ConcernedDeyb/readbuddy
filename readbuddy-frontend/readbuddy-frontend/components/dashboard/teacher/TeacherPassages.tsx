'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, Badge, EmptyState, PrimaryButton, GhostButton, FONT_SANS, FONT_MONO, MUTED, INK } from '../_shared';

const TEACHER_ACCENT = '#3D6B8A';
const LANG_LABEL: Record<string, string> = { en: 'English', tl: 'Tagalog' };

interface Passage {
  id: string;
  confirmed_text: string;
  source_language: 'en' | 'tl';
  is_published: boolean;
  word_count: number;
  created_at: string;
}

export function TeacherPassages({
  passages: initialPassages = [],
  onAuthorNew,
  onEdit,
}: {
  passages?: Passage[];
  onAuthorNew: () => void;
  onEdit: (id: string) => void;
}) {
  const [passages, setPassages] = useState<Passage[]>(initialPassages || []);

  useEffect(() => {
    function loadPassages() {
      try {
        const saved = localStorage.getItem('readbuddy_teacher_passages');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setPassages(parsed);
            return;
          }
        }
        setPassages(initialPassages || []);
      } catch (e) {}
    }
    loadPassages();
    window.addEventListener('readbuddy_passages_updated', loadPassages);
    return () => window.removeEventListener('readbuddy_passages_updated', loadPassages);
  }, [initialPassages]);

  function handleTogglePublish(passageId: string) {
    const updated = passages.map((p) =>
      p.id === passageId ? { ...p, is_published: !p.is_published } : p
    );
    setPassages(updated);
    try {
      localStorage.setItem('readbuddy_teacher_passages', JSON.stringify(updated));
    } catch (e) {}
  }

  function handleDelete(passageId: string) {
    if (!window.confirm('Are you sure you want to delete this passage?')) return;
    const updated = passages.filter((p) => p.id !== passageId);
    setPassages(updated);
    try {
      localStorage.setItem('readbuddy_teacher_passages', JSON.stringify(updated));
    } catch (e) {}
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <SectionHeader title="My Passages" subtitle="Reading passages you've authored for your class." accent={TEACHER_ACCENT} />
        <PrimaryButton accent={TEACHER_ACCENT} onClick={onAuthorNew}>+ Author New Passage</PrimaryButton>
      </div>

      {passages.length === 0 ? (
        <EmptyState message="You haven't authored any passages yet." actionLabel="Author your first passage" onAction={onAuthorNew} />
      ) : (
        <div className="flex flex-col gap-3">
          {passages.map((p) => (
            <Card key={p.id} hoverable className="rb-fade-in-up">
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="text-sm flex-1 line-clamp-2" style={{ fontFamily: FONT_SANS, color: INK, lineHeight: 1.6 }}>
                  {p.confirmed_text}
                </p>
                <div className="flex items-center gap-2">
                  <Badge tone={p.is_published ? 'success' : 'neutral'}>
                    {p.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs flex items-center gap-3" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                  <span>{LANG_LABEL[p.source_language]}</span>
                  <span>{p.word_count} words</span>
                  <span>{p.created_at}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePublish(p.id)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-sans text-gray-700 cursor-pointer"
                  >
                    {p.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs px-2.5 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Delete
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
export default TeacherPassages;
