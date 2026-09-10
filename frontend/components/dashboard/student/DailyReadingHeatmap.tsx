'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  PhilIRIBadge,
  PhilIRILevel,
  FONT_SANS,
  FONT_MONO,
  FONT_SERIF,
  MUTED,
  CHALK_GREEN,
  TAN_BORDER,
} from '../_shared';
import {
  Flame,
  Calendar,
  TrendingUp,
  Award,
  Activity,
  CheckCircle2,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface HeatmapSessionItem {
  id?: string;
  date: string;
  passage_title?: string;
  passage_preview?: string;
  source_language?: string;
  word_recognition_score?: number;
  comprehension_score?: number;
  phil_iri_level?: PhilIRILevel;
}

export interface DailyReadingHeatmapProps {
  sessions: HeatmapSessionItem[];
  title?: string;
  subtitle?: string;
  studentName?: string;
  accentColor?: string;
  compact?: boolean;
}

type RangeOption = 'year' | '6m' | '90d';

interface DayCellData {
  date: Date;
  dateStr: string;
  formattedDate: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture: boolean;
  sessions: HeatmapSessionItem[];
  avgWordScore?: number;
  avgCompScore?: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

// Color tokens for heat levels (soft-neobrutalism palette)
const LEVEL_COLORS: Record<number, { bg: string; border: string }> = {
  0: { bg: '#EFE9DA', border: '#E2D8C3' }, // Inactive / Rest Day
  1: { bg: '#A3D9B1', border: '#84C996' }, // 1 Session (Light Mint)
  2: { bg: '#52A46C', border: '#3E8E56' }, // 2 Sessions (Medium Emerald)
  3: { bg: '#2E7D4F', border: '#1F633B' }, // 3 Sessions (Vibrant Emerald)
  4: { bg: '#1F4D3A', border: '#143829' }, // 4+ Sessions (Signature Forest Green)
};

export function DailyReadingHeatmap({
  sessions = [],
  title = 'Daily Reading Activity & Consistency',
  subtitle = 'Longitudinal practice frequency, reading streaks, and inactivity telemetry',
  studentName,
  accentColor = '#1F4D3A',
  compact = false,
}: DailyReadingHeatmapProps) {
  const [range, setRange] = useState<RangeOption>('year');
  const [hoveredDay, setHoveredDay] = useState<DayCellData | null>(null);
  const [pinnedDay, setPinnedDay] = useState<DayCellData | null>(null);

  // Group sessions by standardized YYYY-MM-DD date key
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, HeatmapSessionItem[]>();
    if (!Array.isArray(sessions)) return map;

    sessions.forEach((s) => {
      if (!s.date) return;
      // Handle YYYY-MM-DD or ISO strings
      const key = s.date.length > 10 ? s.date.slice(0, 10) : s.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(s);
    });

    return map;
  }, [sessions]);

  // Determine current simulated or real system date
  const systemDate = useMemo(() => {
    // If sessions exist in 2026, anchor around the latest session date or current real date
    const now = new Date();
    // Default to today
    return now;
  }, []);

  // Compute number of weeks to display
  const weekCount = useMemo(() => {
    switch (range) {
      case '90d':
        return 14;
      case '6m':
        return 26;
      case 'year':
      default:
        return 52;
    }
  }, [range]);

  // Generate calendar weeks matrix (7 rows: Sun..Sat, W columns)
  const { weeksMatrix, monthLabels, stats } = useMemo(() => {
    const now = new Date(systemDate);
    // Normalize to midnight
    now.setHours(23, 59, 59, 999);
    const todayStr = now.toISOString().split('T')[0];

    // Find the coming Saturday (end of current week)
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat
    const daysUntilSaturday = 6 - currentDayOfWeek;
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + daysUntilSaturday);
    endDate.setHours(23, 59, 59, 999);

    // Start date is (weekCount * 7 - 1) days before endDate
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (weekCount * 7 - 1));
    startDate.setHours(0, 0, 0, 0);

    const weeks: DayCellData[][] = [];
    const months: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;

    let totalSessionsInRange = 0;
    let activeDaysInRange = 0;
    let elapsedDaysInRange = 0;

    for (let w = 0; w < weekCount; w++) {
      const weekDays: DayCellData[] = [];

      for (let d = 0; d < 7; d++) {
        const currentCellDate = new Date(startDate);
        currentCellDate.setDate(startDate.getDate() + (w * 7 + d));
        const dateStr = currentCellDate.toISOString().split('T')[0];
        const isFuture = currentCellDate.getTime() > now.getTime();

        const daySessions = sessionsByDate.get(dateStr) || [];
        const count = daySessions.length;

        if (!isFuture) {
          elapsedDaysInRange++;
          if (count > 0) {
            totalSessionsInRange += count;
            activeDaysInRange++;
          }
        }

        // Determine contribution level
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count === 1) level = 1;
        else if (count === 2) level = 2;
        else if (count === 3) level = 3;
        else if (count >= 4) level = 4;

        // Average scores for the day
        let avgWordScore: number | undefined = undefined;
        let avgCompScore: number | undefined = undefined;
        if (count > 0) {
          const validWords = daySessions.filter((s) => s.word_recognition_score !== undefined);
          if (validWords.length > 0) {
            avgWordScore = Math.round(
              validWords.reduce((sum, s) => sum + (s.word_recognition_score || 0), 0) / validWords.length
            );
          }
          const validComps = daySessions.filter((s) => s.comprehension_score !== undefined);
          if (validComps.length > 0) {
            avgCompScore = Math.round(
              validComps.reduce((sum, s) => sum + (s.comprehension_score || 0), 0) / validComps.length
            );
          }
        }

        const formattedDate = currentCellDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        weekDays.push({
          date: currentCellDate,
          dateStr,
          formattedDate,
          count,
          level,
          isFuture,
          sessions: daySessions,
          avgWordScore,
          avgCompScore,
        });

        // Track month label on the first row of each week
        if (d === 0) {
          const m = currentCellDate.getMonth();
          if (m !== lastMonth) {
            months.push({ label: MONTH_NAMES[m], colIndex: w });
            lastMonth = m;
          }
        }
      }

      weeks.push(weekDays);
    }

    // ─── STREAK CALCULATIONS ───
    // Extract unique active dates sorted descending
    const activeDates = Array.from(sessionsByDate.keys())
      .filter((d) => (sessionsByDate.get(d) || []).length > 0)
      .sort((a, b) => b.localeCompare(a));

    let currentStreak = 0;
    let longestStreak = 0;

    if (activeDates.length > 0) {
      // Calculate current streak
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let streakPointer = new Date(now);
      // If student read today, check backwards from today; if not today, check from yesterday
      if (sessionsByDate.has(todayStr)) {
        streakPointer = new Date(now);
      } else if (sessionsByDate.has(yesterdayStr)) {
        streakPointer = new Date(yesterday);
      } else {
        streakPointer = null as any;
      }

      if (streakPointer) {
        let checkDate = new Date(streakPointer);
        while (true) {
          const ds = checkDate.toISOString().split('T')[0];
          if (sessionsByDate.has(ds) && (sessionsByDate.get(ds) || []).length > 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Calculate longest streak across history
      const sortedAsc = [...activeDates].sort((a, b) => a.localeCompare(b));
      let tempStreak = 0;
      let prevDate: Date | null = null;

      sortedAsc.forEach((ds) => {
        const d = new Date(ds);
        d.setHours(0, 0, 0, 0);

        if (!prevDate) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
        }
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        prevDate = d;
      });
    }

    // Longest streak should be at least current streak
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    const consistencyRate = elapsedDaysInRange > 0 ? Math.round((activeDaysInRange / elapsedDaysInRange) * 100) : 0;

    return {
      weeksMatrix: weeks,
      monthLabels: months,
      stats: {
        totalSessions: totalSessionsInRange,
        activeDays: activeDaysInRange,
        currentStreak,
        longestStreak,
        consistencyRate,
      },
    };
  }, [systemDate, weekCount, sessionsByDate]);

  // Active day for the inspector card
  const activeDay = hoveredDay || pinnedDay;

  return (
    <Card className="mb-6 border-2 border-[#1F4D3A] shadow-[4px_4px_0px_#1F4D3A] bg-[#FFFDF8]">
      {/* ─── Header: Title, Subtitle, & Range Selector ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DED2B4]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
              <Calendar className="w-4 h-4 text-[#1F4D3A]" strokeWidth={2.25} />
              <span>{title}</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EBF7EE] text-[#2E7D4F] border border-[#A3D9B1]">
              {stats.totalSessions} sessions logged
            </span>
          </div>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            {subtitle} {studentName ? `for ${studentName}` : ''}
          </p>
        </div>

        {/* Range Selection Pills */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-[#FAF7F2] p-1 rounded-xl border border-[#DED2B4]">
          <button
            type="button"
            onClick={() => setRange('year')}
            className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
              range === 'year'
                ? 'bg-[#1F4D3A] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
            }`}
          >
            Full Year
          </button>
          <button
            type="button"
            onClick={() => setRange('6m')}
            className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
              range === '6m'
                ? 'bg-[#1F4D3A] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
            }`}
          >
            Last 6 Months
          </button>
          <button
            type="button"
            onClick={() => setRange('90d')}
            className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
              range === '90d'
                ? 'bg-[#1F4D3A] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
            }`}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* ─── KPI Telemetry Metrics Row ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
        <div className="p-2.5 rounded-xl bg-white border border-[#DED2B4] shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FCEDDE] text-[#E8873A] border border-[#F0C99A] flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block">Current Streak</span>
            <span className="text-sm font-bold font-mono text-gray-900">
              {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-[#DED2B4] shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FAF2E9] text-[#8A5A1E] border border-[#EADBCE] flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block">Longest Streak</span>
            <span className="text-sm font-bold font-mono text-gray-900">
              {stats.longestStreak} {stats.longestStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-[#DED2B4] shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EBF7EE] text-[#2E7D4F] border border-[#A3D9B1] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block">Active Days</span>
            <span className="text-sm font-bold font-mono text-gray-900">{stats.activeDays} days</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-[#DED2B4] shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EBF3F8] text-[#3D6B8A] border border-[#A8C5DA] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block">Consistency Rate</span>
            <span className="text-sm font-bold font-mono text-gray-900">{stats.consistencyRate}%</span>
          </div>
        </div>
      </div>

      {/* ─── GitHub-Style Heatmap Grid Container (Horizontally Scrollable on Mobile) ─── */}
      <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#DED2B4] overflow-x-auto select-none">
        <div className="inline-block min-w-full">
          {/* Month Header Labels */}
          <div className="flex text-[10px] font-mono text-gray-500 mb-1.5 pl-6 h-4 relative">
            {monthLabels.map((m, idx) => (
              <span
                key={`m-${idx}`}
                className="absolute font-semibold text-gray-600"
                style={{
                  left: `${26 + m.colIndex * 15}px`,
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid Rows: 7 Days (Sun..Sat) */}
          <div className="flex gap-1">
            {/* Day of Week Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col gap-1 pr-1.5 text-[9px] font-mono text-gray-400 select-none">
              {DAY_LABELS.map((dayLabel, dayIdx) => (
                <div key={`label-${dayIdx}`} className="h-3 sm:h-3.5 flex items-center justify-end w-5">
                  {dayLabel}
                </div>
              ))}
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-1">
              {weeksMatrix.map((week, wIdx) => (
                <div key={`w-${wIdx}`} className="flex flex-col gap-1">
                  {week.map((cell, dIdx) => {
                    const isSelected = activeDay?.dateStr === cell.dateStr;
                    const style = LEVEL_COLORS[cell.level];

                    return (
                      <div
                        key={`cell-${wIdx}-${dIdx}`}
                        onMouseEnter={() => setHoveredDay(cell)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => setPinnedDay(pinnedDay?.dateStr === cell.dateStr ? null : cell)}
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2.5px] transition-all cursor-pointer relative ${
                          cell.isFuture
                            ? 'bg-transparent border border-dashed border-[#EADBCE] opacity-35 cursor-not-allowed'
                            : isSelected
                            ? 'ring-2 ring-[#1F4D3A] ring-offset-1 scale-125 z-10'
                            : 'hover:ring-1 hover:ring-[#1F4D3A] hover:scale-110'
                        }`}
                        style={{
                          backgroundColor: cell.isFuture ? 'transparent' : style.bg,
                          borderColor: cell.isFuture ? '#EADBCE' : style.border,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                        title={
                          cell.isFuture
                            ? `${cell.formattedDate} (Future day)`
                            : cell.count > 0
                            ? `${cell.count} session${cell.count === 1 ? '' : 's'} on ${cell.formattedDate}`
                            : `No reading activity on ${cell.formattedDate}`
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Active Day Inspection Card (Hover or Click) ─── */}
      <div className="mt-3 p-3 rounded-xl bg-white border border-[#DED2B4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all shadow-2xs">
        {activeDay ? (
          <>
            <div className="flex items-center gap-2.5">
              <div
                className="w-4 h-4 rounded-[3px] shrink-0 border"
                style={{
                  backgroundColor: LEVEL_COLORS[activeDay.level].bg,
                  borderColor: LEVEL_COLORS[activeDay.level].border,
                }}
              />
              <div>
                <span className="text-xs font-bold text-gray-900 font-sans">
                  {activeDay.formattedDate}
                </span>
                <span className="text-xs text-gray-500 font-mono ml-2">
                  {activeDay.count === 0
                    ? 'No reading activity recorded'
                    : `${activeDay.count} reading session${activeDay.count === 1 ? '' : 's'} completed`}
                </span>
              </div>
            </div>

            {activeDay.count > 0 && (
              <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-1.5 sm:pt-0 border-gray-100 text-xs font-mono">
                {activeDay.avgWordScore !== undefined && (
                  <span className="text-[#E8873A] font-bold">
                    Word: {activeDay.avgWordScore}%
                  </span>
                )}
                {activeDay.avgCompScore !== undefined && (
                  <span className="text-[#3D6B8A] font-bold">
                    Comp: {activeDay.avgCompScore}%
                  </span>
                )}
                {activeDay.sessions[0]?.phil_iri_level && (
                  <PhilIRIBadge level={activeDay.sessions[0].phil_iri_level} />
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-gray-500 font-sans flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#3D6B8A] shrink-0" />
            <span>Hover or tap any square in the heatmap to inspect daily reading sessions and diagnostic scores.</span>
          </div>
        )}
      </div>

      {/* ─── Footer: Explanatory Notice & GitHub Legend ─── */}
      <div className="mt-3 pt-2.5 border-t border-[#DED2B4] flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 font-sans">
        <span className="text-[10px] text-gray-500 font-mono">
          Logs both oral reading practice and assigned teacher Phil-IRI assessments.
        </span>

        {/* GitHub Heatmap Legend: Less [■ ■ ■ ■ ■] More */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-600">
          <span>Less</span>
          <span
            className="w-2.5 h-2.5 rounded-[2px] border inline-block"
            style={{ backgroundColor: LEVEL_COLORS[0].bg, borderColor: LEVEL_COLORS[0].border }}
            title="0 sessions (Rest day)"
          />
          <span
            className="w-2.5 h-2.5 rounded-[2px] border inline-block"
            style={{ backgroundColor: LEVEL_COLORS[1].bg, borderColor: LEVEL_COLORS[1].border }}
            title="1 session"
          />
          <span
            className="w-2.5 h-2.5 rounded-[2px] border inline-block"
            style={{ backgroundColor: LEVEL_COLORS[2].bg, borderColor: LEVEL_COLORS[2].border }}
            title="2 sessions"
          />
          <span
            className="w-2.5 h-2.5 rounded-[2px] border inline-block"
            style={{ backgroundColor: LEVEL_COLORS[3].bg, borderColor: LEVEL_COLORS[3].border }}
            title="3 sessions"
          />
          <span
            className="w-2.5 h-2.5 rounded-[2px] border inline-block"
            style={{ backgroundColor: LEVEL_COLORS[4].bg, borderColor: LEVEL_COLORS[4].border }}
            title="4+ sessions"
          />
          <span>More</span>
        </div>
      </div>
    </Card>
  );
}

export default DailyReadingHeatmap;
