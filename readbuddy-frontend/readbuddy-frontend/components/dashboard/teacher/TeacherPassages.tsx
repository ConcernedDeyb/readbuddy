'use client';

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
  passages,
  onAuthorNew,
  onEdit,
}: {
  passages: Passage[];
  onAuthorNew: () => void;
  onEdit: (id: string) => void;
}) {
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
                <Badge tone={p.is_published ? 'success' : 'neutral'}>
                  {p.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs flex items-center gap-3" style={{ fontFamily: FONT_MONO, color: MUTED }}>
                  <span>{LANG_LABEL[p.source_language]}</span>
                  <span>{p.word_count} words</span>
                </div>
                <GhostButton onClick={() => onEdit(p.id)}>Edit</GhostButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
export default TeacherPassages;
