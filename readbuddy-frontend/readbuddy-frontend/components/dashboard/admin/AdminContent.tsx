'use client';

import { useState, useEffect } from 'react';
import { Card, SectionHeader, Badge, EmptyState, CHALK_GREEN, FONT_SERIF, FONT_MONO, FONT_SANS, MUTED } from '../_shared';

const ADMIN_ACCENT = '#7A4A6B';

export function AdminContent({ passages: initialPassages = [], onUnpublish }: { passages?: any[]; onUnpublish?: (id: string) => void }) {
  const [passages, setPassages] = useState<any[]>(initialPassages || []);

  useEffect(() => {
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
  }, [initialPassages]);

  function handleTogglePublish(id: string) {
    const updated = passages.map((p) => (p.id === id ? { ...p, is_published: !p.is_published } : p));
    setPassages(updated);
    try {
      localStorage.setItem('readbuddy_teacher_passages', JSON.stringify(updated));
    } catch (e) {}
    if (onUnpublish) onUnpublish(id);
  }

  function handleDelete(id: string) {
    if (!window.confirm('Delete this passage from system pool?')) return;
    const updated = passages.filter((p) => p.id !== id);
    setPassages(updated);
    try {
      localStorage.setItem('readbuddy_teacher_passages', JSON.stringify(updated));
    } catch (e) {}
  }

  return (
    <div>
      <SectionHeader title="System Content" subtitle="Manage global passage pool, language tags, and publication status." accent={ADMIN_ACCENT} />
      
      {passages.length === 0 ? (
        <EmptyState message="No system reading passages available." />
      ) : (
        <div className="flex flex-col gap-3">
          {passages.map((p) => (
            <Card key={p.id} hoverable className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rb-fade-in-up">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                    {p.source_language === 'tl' ? 'Tagalog' : 'English'}
                  </span>
                  <Badge tone={p.is_published ? 'success' : 'neutral'}>
                    {p.is_published ? 'Published' : 'Unpublished'}
                  </Badge>
                  {p.word_count && (
                    <span className="text-xs text-gray-400 font-mono">{p.word_count} words</span>
                  )}
                </div>
                <p className="text-xs line-clamp-2" style={{ fontFamily: FONT_SANS, color: '#20342B', lineHeight: 1.6 }}>
                  {p.confirmed_text}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePublish(p.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-sans text-gray-700 cursor-pointer"
                >
                  {p.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-sans cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
export default AdminContent;
