'use client';

import { Card, FONT_SANS, FONT_MONO, FONT_SERIF, MUTED, CHALK_GREEN, TAN_BORDER, ReadingSession } from '../_shared';

const STUDENT_ACCENT = '#E8873A';

export function StudentProgressChart({ sessions }: { sessions: ReadingSession[] }) {
  if (sessions.length === 0) return null;
  const reversed = [...sessions].reverse();

  return (
    <Card className="mb-6">
      <h2 className="text-base font-semibold mb-3" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
        Reading Score Trend
      </h2>
      <div className="h-32 flex items-end gap-3 pt-4 border-b pb-2" style={{ borderColor: TAN_BORDER }}>
        {reversed.map((s, idx) => (
          <div key={s.id || idx} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[10px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: STUDENT_ACCENT }}>
              {s.word_recognition_score}%
            </span>
            <div className="w-full rounded-t-md transition-all duration-300" style={{ height: `${s.word_recognition_score}%`, background: `linear-gradient(180deg, ${STUDENT_ACCENT}, ${STUDENT_ACCENT}BB)` }} />
            <span className="text-[10px] truncate max-w-full" style={{ fontFamily: FONT_SANS, color: MUTED }}>
              {s.date ? s.date.slice(5) : `S${idx + 1}`}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
export default StudentProgressChart;
