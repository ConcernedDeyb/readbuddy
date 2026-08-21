'use client';

import { useState, useEffect } from 'react';
import { Card, SectionHeader, Badge, EmptyState, CHALK_GREEN, FONT_SERIF, FONT_MONO, FONT_SANS, MUTED } from '../_shared';
import { apiFetch } from '@/lib/api';

const ADMIN_ACCENT = '#7A4A6B';

interface Passage {
  id: string;
  source_language: string;
  confirmed_text: string;
  word_count: number;
  is_published: boolean;
  is_archived: boolean;
}

export function AdminContent() {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPassages() {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/passages');
      if (Array.isArray(data)) {
        setPassages(data);
      }
    } catch (e) {
      console.error('Failed to load passages', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPassages();
  }, []);

  async function handleTogglePublish(passage: Passage) {
    try {
      await apiFetch(`/admin/passages/${passage.id}/publish`, {
        method: 'PATCH',
      });
      loadPassages();
    } catch (e) {
      alert(`Failed to update passage: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  async function handleToggleArchive(passage: Passage) {
    if (!window.confirm(`Are you sure you want to ${passage.is_archived ? 'restore' : 'archive'} this passage?`)) return;
    try {
      await apiFetch(`/admin/passages/${passage.id}/${passage.is_archived ? 'restore' : 'archive'}`, {
        method: 'PATCH',
      });
      loadPassages();
    } catch (e) {
      alert(`Failed to update passage: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  return (
    <div>
      <SectionHeader title="System Content" subtitle="Manage global passage pool, language tags, and publication status." accent={ADMIN_ACCENT} />
      
      {loading ? (
        <div style={{ color: MUTED, fontFamily: FONT_MONO, textAlign: 'center', padding: '2rem' }}>
          Loading passages...
        </div>
      ) : passages.length === 0 ? (
        <EmptyState message="No system reading passages available." />
      ) : (
        <div className="flex flex-col gap-3">
          {passages.map((p) => (
            <Card key={p.id} hoverable className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rb-fade-in-up ${p.is_archived ? 'opacity-50 grayscale' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                    {p.source_language === 'tl' ? 'Tagalog' : 'English'}
                  </span>
                  <Badge tone={p.is_published ? 'success' : 'neutral'}>
                    {p.is_published ? 'Published' : 'Unpublished'}
                  </Badge>
                  {p.is_archived && (
                    <Badge tone="neutral">Archived</Badge>
                  )}
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
                  onClick={() => handleTogglePublish(p)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-sans text-gray-700 cursor-pointer"
                  disabled={p.is_archived}
                >
                  {p.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => handleToggleArchive(p)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors font-sans cursor-pointer"
                  style={{
                    color: p.is_archived ? MUTED : '#EF4444',
                    border: `1px solid ${p.is_archived ? MUTED : 'transparent'}`,
                    backgroundColor: p.is_archived ? 'transparent' : 'rgba(239,68,68,0.1)'
                  }}
                >
                  {p.is_archived ? 'Restore' : 'Archive'}
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
