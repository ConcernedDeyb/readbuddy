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
  TrendingUp,
  BarChart2,
  Activity,
  Award,
  CheckCircle2,
  BookOpen,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';

export interface ProgressSessionItem {
  id?: string;
  date?: string;
  passage_title?: string;
  passage_preview?: string;
  source_language?: string;
  word_recognition_score: number;
  comprehension_score: number;
  phil_iri_level?: PhilIRILevel;
}

export interface StudentProgressChartProps {
  sessions: ProgressSessionItem[];
  title?: string;
  subtitle?: string;
  accentColor?: string;
  compact?: boolean;
  showControls?: boolean;
}

const COLOR_WORD = '#E8873A'; // Coral Orange for Oral Accuracy / Word Recognition
const COLOR_COMP = '#3D6B8A'; // Slate Blue for Comprehension
const COLOR_INDEPENDENT = '#2E7D4F'; // Emerald for 97% threshold
const COLOR_INSTRUCTIONAL = '#8A5A1E'; // Amber for 90% threshold

export function StudentProgressChart({
  sessions = [],
  title = 'Reading Score Trend & Trajectory',
  subtitle = 'Phil-IRI oral reading accuracy and comprehension progress over time',
  accentColor = COLOR_WORD,
  compact = false,
  showControls = true,
}: StudentProgressChartProps) {
  const [metricFilter, setMetricFilter] = useState<'both' | 'word' | 'comp'>('both');
  const [rangeFilter, setRangeFilter] = useState<'all' | '10' | '20'>('all');
  const [activeSessionIndex, setActiveSessionIndex] = useState<number | null>(null);

  // Normalize and sort sessions chronologically (oldest to newest along X-axis)
  const sortedSessions = useMemo(() => {
    if (!Array.isArray(sessions) || sessions.length === 0) return [];
    return [...sessions].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateA.localeCompare(dateB);
    });
  }, [sessions]);

  // Filter sessions by active view range (zoom in on recent sessions if requested)
  const displaySessions = useMemo(() => {
    if (rangeFilter === '10') return sortedSessions.slice(-10);
    if (rangeFilter === '20') return sortedSessions.slice(-20);
    return sortedSessions;
  }, [sortedSessions, rangeFilter]);

  // Selected or latest session for inspector preview
  const selectedSession = useMemo(() => {
    if (displaySessions.length === 0) return null;
    if (activeSessionIndex !== null && displaySessions[activeSessionIndex]) {
      return displaySessions[activeSessionIndex];
    }
    return displaySessions[displaySessions.length - 1]; // Default to most recent session
  }, [displaySessions, activeSessionIndex]);

  // Aggregate diagnostic KPIs
  const stats = useMemo(() => {
    if (sortedSessions.length === 0) {
      return { count: 0, avgWord: 0, avgComp: 0, isImproving: false, latestTier: null };
    }
    const count = sortedSessions.length;
    const avgWord = Math.round(
      sortedSessions.reduce((acc, s) => acc + (Number(s.word_recognition_score) || 0), 0) / count
    );
    const avgComp = Math.round(
      sortedSessions.reduce((acc, s) => acc + (Number(s.comprehension_score) || 0), 0) / count
    );
    const latest = sortedSessions[sortedSessions.length - 1];
    const previous = sortedSessions.length > 1 ? sortedSessions[sortedSessions.length - 2] : null;

    const isImproving = previous
      ? latest.word_recognition_score >= previous.word_recognition_score &&
        latest.comprehension_score >= previous.comprehension_score
      : latest.word_recognition_score >= 90;

    return {
      count,
      avgWord,
      avgComp,
      isImproving,
      latestTier: latest.phil_iri_level || (latest.word_recognition_score >= 97 ? 'independent' : latest.word_recognition_score >= 90 ? 'instructional' : 'frustration'),
      latestWord: latest.word_recognition_score,
      latestComp: latest.comprehension_score,
    };
  }, [sortedSessions]);

  // ─── 0 SESSIONS: Clean Educational Empty State ───
  if (sortedSessions.length === 0) {
    return (
      <Card className="mb-6 border-2 border-[#DED2B4] shadow-[3px_3px_0px_#1F4D3A]">
        <div className="flex items-center justify-between pb-3 border-b border-[#DED2B4]">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
              <BarChart2 className="w-4 h-4 text-[#1F4D3A]" strokeWidth={2.25} />
              <span>{title}</span>
            </h2>
            <p className="text-xs text-gray-500 font-sans mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="py-8 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#DED2B4] flex items-center justify-center mx-auto mb-3 text-[#1F4D3A]">
            <BookOpen className="w-6 h-6" strokeWidth={2} />
          </div>
          <h3 className="text-sm font-bold text-gray-800 font-sans">No reading sessions recorded yet</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed font-sans">
            Once oral reading practice or assigned teacher assessments are completed, your Phil-IRI word accuracy and comprehension trends will appear here.
          </p>
        </div>
      </Card>
    );
  }

  // ─── 1 SESSION: Single Baseline Metric Card ───
  if (sortedSessions.length === 1) {
    const single = sortedSessions[0];
    return (
      <Card className="mb-6 border-2 border-[#1F4D3A] shadow-[4px_4px_0px_#1F4D3A]">
        <div className="flex items-center justify-between pb-3 border-b border-[#DED2B4]">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
              <BarChart2 className="w-4 h-4 text-[#1F4D3A]" strokeWidth={2.25} />
              <span>{title}</span>
            </h2>
            <p className="text-xs text-gray-500 font-sans mt-0.5">{subtitle}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#FAF7F2] text-[#1F4D3A] border border-[#DED2B4]">
            Baseline Session
          </span>
        </div>

        <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#DED2B4] mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 font-sans">
                  {single.passage_title || single.passage_preview || 'Reading Passage Assessment'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-white text-gray-600 border border-gray-200">
                  {single.source_language === 'tl' ? 'Tagalog' : 'English'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">Assessed on {single.date || 'Recent'}</p>
            </div>
            {single.phil_iri_level && <PhilIRIBadge level={single.phil_iri_level} />}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EADBCE]">
            <div className="bg-white p-3 rounded-lg border border-[#EADBCE]">
              <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block">Oral Accuracy</span>
              <span className="text-xl font-bold font-mono text-[#E8873A]">{single.word_recognition_score}%</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                {single.word_recognition_score >= 97 ? 'Independent level' : single.word_recognition_score >= 90 ? 'Instructional level' : 'Frustration level'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[#EADBCE]">
              <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block">Comprehension</span>
              <span className="text-xl font-bold font-mono text-[#3D6B8A]">{single.comprehension_score}%</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                {single.comprehension_score >= 80 ? 'Independent level' : single.comprehension_score >= 59 ? 'Instructional level' : 'Frustration level'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-gray-500 flex items-center gap-1.5 font-sans">
          <Info className="w-3.5 h-3.5 text-[#3D6B8A] shrink-0" />
          <span>Complete 2 or more reading sessions to generate your full interactive longitudinal trend graph.</span>
        </div>
      </Card>
    );
  }

  // ─── 2+ SESSIONS: Full SVG Dual-Series Longitudinal Trend Chart ───
  // Chart dimensions & scaling in SVG coordinate space
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 92; // Expanded right padding ensures 0 collision with threshold benchmark badges
  const padTop = 25;
  const padBottom = 35;

  const usableWidth = svgWidth - padLeft - padRight;
  const usableHeight = svgHeight - padTop - padBottom;

  const count = displaySessions.length;
  const isDense = count > 10;
  const isVeryDense = count > 16;

  // Stride decimation for X-axis date labels: prevents overlapping text when session count is high
  const dateStride = Math.max(2, Math.ceil(count / 6));

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        return `${parts[1]}-${parts[2]}`; // MM-DD
      }
      return dateStr.slice(5);
    }
    return dateStr;
  };

  // Scale functions
  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return padTop + ((100 - clamped) / 100) * usableHeight;
  };

  const getX = (index: number) => {
    if (count <= 1) return padLeft + usableWidth / 2;
    return padLeft + (index / (count - 1)) * usableWidth;
  };

  // Build SVG paths for Word Recognition & Comprehension
  const wordPoints = displaySessions.map((s, i) => ({
    x: getX(i),
    y: getY(s.word_recognition_score),
    val: s.word_recognition_score,
  }));

  const compPoints = displaySessions.map((s, i) => ({
    x: getX(i),
    y: getY(s.comprehension_score),
    val: s.comprehension_score,
  }));

  const wordPathD = wordPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`),
    ''
  );

  const wordAreaD = wordPoints.length > 0
    ? `${wordPathD} L ${wordPoints[wordPoints.length - 1].x},${getY(0)} L ${wordPoints[0].x},${getY(0)} Z`
    : '';

  const compPathD = compPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`),
    ''
  );

  const compAreaD = compPoints.length > 0
    ? `${compPathD} L ${compPoints[compPoints.length - 1].x},${getY(0)} L ${compPoints[0].x},${getY(0)} Z`
    : '';

  // Y-axis threshold reference lines
  const y97 = getY(97);
  const y90 = getY(90);

  return (
    <Card className="mb-6 border-2 border-[#1F4D3A] shadow-[4px_4px_0px_#1F4D3A] bg-[#FFFDF8]">
      {/* ─── Header: Title, Trajectory Pill, Range Filters & Metric Chips ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#DED2B4]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
              <BarChart2 className="w-4 h-4 text-[#1F4D3A]" strokeWidth={2.25} />
              <span>{title}</span>
            </h2>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                stats.isImproving
                  ? 'bg-[#EBF7EE] text-[#2E7D4F] border-[#A3D9B1]'
                  : 'bg-[#FCEDDE] text-[#8A5A1E] border-[#F0C99A]'
              }`}
            >
              {stats.isImproving ? (
                <>
                  <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                  <span>Mastery Trajectory</span>
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3" strokeWidth={2.5} />
                  <span>Active Progress</span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-sans mt-0.5">{subtitle}</p>
        </div>

        {/* Controls: Range Filter and Metric Selection Pills */}
        {showControls && (
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            {/* Range Zoom Filter (Shown when sessions exceed 10) */}
            {sortedSessions.length > 10 && (
              <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#DED2B4]">
                <span className="text-[10px] font-mono font-bold text-gray-400 px-1.5 uppercase hidden sm:inline">View:</span>
                <button
                  type="button"
                  onClick={() => { setRangeFilter('10'); setActiveSessionIndex(null); }}
                  className={`px-2 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                    rangeFilter === '10'
                      ? 'bg-[#1F4D3A] text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                  }`}
                  title="View last 10 reading sessions"
                >
                  Last 10
                </button>
                {sortedSessions.length > 20 && (
                  <button
                    type="button"
                    onClick={() => { setRangeFilter('20'); setActiveSessionIndex(null); }}
                    className={`px-2 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                      rangeFilter === '20'
                        ? 'bg-[#1F4D3A] text-white shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                    }`}
                    title="View last 20 reading sessions"
                  >
                    Last 20
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setRangeFilter('all'); setActiveSessionIndex(null); }}
                  className={`px-2 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                    rangeFilter === 'all'
                      ? 'bg-[#1F4D3A] text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                  }`}
                  title="View all recorded sessions"
                >
                  All ({sortedSessions.length})
                </button>
              </div>
            )}

            {/* Metric Selection Pills */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#DED2B4]">
              <button
                type="button"
                onClick={() => setMetricFilter('both')}
                className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                  metricFilter === 'both'
                    ? 'bg-[#1F4D3A] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                }`}
              >
                Both Metrics
              </button>
              <button
                type="button"
                onClick={() => setMetricFilter('word')}
                className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  metricFilter === 'word'
                    ? 'bg-[#E8873A] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#E8873A] inline-block" />
                Oral Accuracy
              </button>
              <button
                type="button"
                onClick={() => setMetricFilter('comp')}
                className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  metricFilter === 'comp'
                    ? 'bg-[#3D6B8A] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#3D6B8A] inline-block" />
                Comprehension
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Top KPI Metric Bar ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
        <div className="p-2.5 rounded-xl bg-white border border-[#DED2B4] shadow-2xs">
          <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block truncate">Total Sessions</span>
          <span className="text-base font-bold font-mono text-gray-900">{stats.count} recorded</span>
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-[#DED2B4] shadow-2xs">
          <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block truncate">Avg Oral Accuracy</span>
          <span className="text-base font-bold font-mono text-[#E8873A]">{stats.avgWord}%</span>
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-[#DED2B4] shadow-2xs">
          <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block truncate">Avg Comprehension</span>
          <span className="text-base font-bold font-mono text-[#3D6B8A]">{stats.avgComp}%</span>
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-[#DED2B4] shadow-2xs">
          <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block truncate">Latest Status</span>
          <div className="mt-0.5">
            {stats.latestTier ? (
              <PhilIRIBadge level={stats.latestTier} />
            ) : (
              <span className="text-xs font-mono text-gray-500">—</span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Responsive SVG Coordinate Chart Canvas ─── */}
      <div className="relative w-full overflow-hidden rounded-xl bg-white border border-[#DED2B4] p-2 sm:p-3 shadow-inner">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
          style={{ minHeight: compact ? '160px' : '200px', maxHeight: '280px' }}
        >
          <defs>
            {/* Coral gradient for Word Recognition */}
            <linearGradient id="wordGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR_WORD} stopOpacity="0.28" />
              <stop offset="100%" stopColor={COLOR_WORD} stopOpacity="0.02" />
            </linearGradient>

            {/* Slate blue gradient for Comprehension */}
            <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR_COMP} stopOpacity="0.24" />
              <stop offset="100%" stopColor={COLOR_COMP} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis benchmark ticks */}
          {[100, 80, 60, 40, 20].map((score) => {
            const y = getY(score);
            return (
              <g key={`grid-${score}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight + 80}
                  y2={y}
                  stroke="#F0EAE1"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[9px] font-mono fill-gray-400 font-medium"
                >
                  {score}%
                </text>
              </g>
            );
          })}

          {/* Phil-IRI 97% Benchmark: Independent Standard (Positioned in dedicated right margin with 0 data collision) */}
          <g>
            <line
              x1={padLeft}
              y1={y97}
              x2={svgWidth - 10}
              y2={y97}
              stroke={COLOR_INDEPENDENT}
              strokeWidth="1.25"
              strokeDasharray="4 3"
            />
            <rect
              x={svgWidth - padRight + 6}
              y={y97 - 7}
              width="80"
              height="14"
              rx="3"
              fill="#EBF7EE"
              stroke="#A3D9B1"
              strokeWidth="0.75"
            />
            <text
              x={svgWidth - padRight + 46}
              y={y97 + 3}
              textAnchor="middle"
              className="text-[8px] font-mono fill-[#2E7D4F] font-bold select-none pointer-events-none"
            >
              97% Independent
            </text>
          </g>

          {/* Phil-IRI 90% Benchmark: Instructional Standard */}
          <g>
            <line
              x1={padLeft}
              y1={y90}
              x2={svgWidth - 10}
              y2={y90}
              stroke={COLOR_INSTRUCTIONAL}
              strokeWidth="1.25"
              strokeDasharray="4 3"
            />
            <rect
              x={svgWidth - padRight + 6}
              y={y90 - 7}
              width="80"
              height="14"
              rx="3"
              fill="#FAF2E9"
              stroke="#EADBCE"
              strokeWidth="0.75"
            />
            <text
              x={svgWidth - padRight + 46}
              y={y90 + 3}
              textAnchor="middle"
              className="text-[8px] font-mono fill-[#8A5A1E] font-bold select-none pointer-events-none"
            >
              90% Instructional
            </text>
          </g>

          {/* Area under Comprehension curve */}
          {(metricFilter === 'both' || metricFilter === 'comp') && compAreaD && (
            <path d={compAreaD} fill="url(#compGrad)" />
          )}

          {/* Area under Word Recognition curve */}
          {(metricFilter === 'both' || metricFilter === 'word') && wordAreaD && (
            <path d={wordAreaD} fill="url(#wordGrad)" />
          )}

          {/* Polyline: Comprehension curve */}
          {(metricFilter === 'both' || metricFilter === 'comp') && compPathD && (
            <path
              d={compPathD}
              fill="none"
              stroke={COLOR_COMP}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Polyline: Word Recognition curve */}
          {(metricFilter === 'both' || metricFilter === 'word') && wordPathD && (
            <path
              d={wordPathD}
              fill="none"
              stroke={COLOR_WORD}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Data Points & Hover Hit Areas */}
          {displaySessions.map((session, idx) => {
            const x = getX(idx);
            const wordY = getY(session.word_recognition_score);
            const compY = getY(session.comprehension_score);
            const isSelected = activeSessionIndex === idx || (activeSessionIndex === null && idx === count - 1);
            const isFirst = idx === 0;
            const isLast = idx === count - 1;

            // Smart X-axis date decimation logic
            let shouldShowDate = false;
            if (count <= 8) {
              shouldShowDate = true;
            } else {
              if (isFirst || isLast) {
                shouldShowDate = true;
              } else if (idx % dateStride === 0) {
                if (count - 1 - idx >= dateStride * 0.65) {
                  shouldShowDate = true;
                }
              }
            }

            const isHoverActive = activeSessionIndex !== null;
            const isCurrentActive = isHoverActive ? activeSessionIndex === idx : isLast;

            // Vertical collision prevention for score pills on active node
            const yDiff = Math.abs(wordY - compY);
            const isVeryClose = yDiff < 24;
            let wordLabelY = wordY - (isSelected ? 11 : 7);
            let compLabelY = compY - (isSelected ? 11 : 7);

            if (isSelected && isVeryClose) {
              if (wordY <= compY) {
                wordLabelY = wordY - 14;
                compLabelY = compY + 16;
              } else {
                compLabelY = compY - 14;
                wordLabelY = wordY + 16;
              }
            }

            return (
              <g
                key={session.id || `node-${idx}`}
                className="cursor-pointer group"
                onMouseEnter={() => setActiveSessionIndex(idx)}
                onClick={() => setActiveSessionIndex(idx)}
              >
                {/* Vertical session guide line on active */}
                {isSelected && (
                  <line
                    x1={x}
                    y1={padTop}
                    x2={x}
                    y2={svgHeight - padBottom}
                    stroke="#1F4D3A"
                    strokeWidth="1.25"
                    strokeDasharray="2 2"
                    opacity="0.4"
                  />
                )}

                {/* Comprehension Node */}
                {(metricFilter === 'both' || metricFilter === 'comp') && (
                  <g>
                    <circle
                      cx={x}
                      cy={compY}
                      r={isSelected ? (isVeryDense ? 5.5 : 6) : (isVeryDense ? 3 : 4)}
                      fill="#FFFFFF"
                      stroke={COLOR_COMP}
                      strokeWidth={isSelected ? 3 : (isVeryDense ? 1.5 : 2)}
                      className="transition-all duration-150"
                    />

                    {/* Score value indicator: Only on selected, or on all if not dense */}
                    {isSelected && (
                      <g className="pointer-events-none">
                        <rect
                          x={x - 17}
                          y={compLabelY - 9}
                          width="34"
                          height="14"
                          rx="3.5"
                          fill="#3D6B8A"
                          stroke="#FFFFFF"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={compLabelY + 1.5}
                          textAnchor="middle"
                          className="text-[8.5px] font-mono font-bold fill-white"
                        >
                          {session.comprehension_score}%
                        </text>
                      </g>
                    )}

                    {!isSelected && !isDense && (
                      <text
                        x={x}
                        y={compLabelY}
                        textAnchor="middle"
                        className="text-[8px] font-mono font-bold fill-gray-500 opacity-75 pointer-events-none"
                      >
                        {session.comprehension_score}%
                      </text>
                    )}
                  </g>
                )}

                {/* Word Recognition Node */}
                {(metricFilter === 'both' || metricFilter === 'word') && (
                  <g>
                    <circle
                      cx={x}
                      cy={wordY}
                      r={isSelected ? (isVeryDense ? 5.5 : 6) : (isVeryDense ? 3 : 4)}
                      fill="#FFFFFF"
                      stroke={COLOR_WORD}
                      strokeWidth={isSelected ? 3 : (isVeryDense ? 1.5 : 2)}
                      className="transition-all duration-150"
                    />

                    {/* Score value indicator: Only on selected, or on all if not dense */}
                    {isSelected && (
                      <g className="pointer-events-none">
                        <rect
                          x={x - 17}
                          y={wordLabelY - 9}
                          width="34"
                          height="14"
                          rx="3.5"
                          fill="#E8873A"
                          stroke="#FFFFFF"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={wordLabelY + 1.5}
                          textAnchor="middle"
                          className="text-[8.5px] font-mono font-bold fill-white"
                        >
                          {session.word_recognition_score}%
                        </text>
                      </g>
                    )}

                    {!isSelected && !isDense && (
                      <text
                        x={x}
                        y={wordLabelY}
                        textAnchor="middle"
                        className="text-[8px] font-mono font-bold fill-gray-500 opacity-75 pointer-events-none"
                      >
                        {session.word_recognition_score}%
                      </text>
                    )}
                  </g>
                )}

                {/* Date Label on X-axis */}
                {isCurrentActive ? (
                  <g className="pointer-events-none">
                    <rect
                      x={x - 18}
                      y={svgHeight - padBottom + 6}
                      width="36"
                      height="15"
                      rx="3.5"
                      fill="#1F4D3A"
                      className="transition-all duration-150"
                    />
                    <text
                      x={x}
                      y={svgHeight - padBottom + 17}
                      textAnchor="middle"
                      className="text-[9px] font-mono font-bold fill-white"
                    >
                      {formatDateLabel(session.date) || `S${idx + 1}`}
                    </text>
                  </g>
                ) : shouldShowDate ? (
                  <text
                    x={x}
                    y={svgHeight - padBottom + 16}
                    textAnchor="middle"
                    className="text-[9px] font-mono fill-gray-400 font-medium select-none pointer-events-none"
                  >
                    {formatDateLabel(session.date) || `S${idx + 1}`}
                  </text>
                ) : (
                  <line
                    x1={x}
                    y1={svgHeight - padBottom}
                    x2={x}
                    y2={svgHeight - padBottom + 4}
                    stroke="#DED2B4"
                    strokeWidth="1"
                    className="pointer-events-none"
                  />
                )}

                {/* Transparent enlarged tap/hover target hit area */}
                <rect
                  x={x - Math.max(12, (usableWidth / count) / 2)}
                  y={padTop}
                  width={Math.max(24, usableWidth / count)}
                  height={usableHeight}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* ─── Interactive Session Inspector Detail Banner ─── */}
      {selectedSession && (
        <div className="mt-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#DED2B4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#DED2B4] flex items-center justify-center text-[#1F4D3A] shrink-0 shadow-2xs">
              <Calendar className="w-4 h-4" strokeWidth={2.25} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-900 font-sans">
                  {selectedSession.passage_title || selectedSession.passage_preview || 'Oral Reading Practice'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-white text-gray-600 border border-gray-200">
                  {selectedSession.source_language === 'tl' ? 'Tagalog' : 'English'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                Session recorded on {selectedSession.date || 'Recent'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#EADBCE]">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[9px] uppercase font-mono font-bold text-gray-400 block">Oral Accuracy</span>
                <span className="text-sm font-bold font-mono text-[#E8873A]">
                  {selectedSession.word_recognition_score}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-mono font-bold text-gray-400 block">Comprehension</span>
                <span className="text-sm font-bold font-mono text-[#3D6B8A]">
                  {selectedSession.comprehension_score}%
                </span>
              </div>
            </div>

            {selectedSession.phil_iri_level && (
              <div className="shrink-0 pl-2 border-l border-[#EADBCE]">
                <PhilIRIBadge level={selectedSession.phil_iri_level} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Legend & Phil-IRI Rubric Quick Reference ─── */}
      <div className="mt-3 pt-2.5 border-t border-[#DED2B4] flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 font-sans">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-[#E8873A]" />
            <span className="font-semibold text-gray-700">Oral Accuracy (Word Recognition)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-[#3D6B8A]" />
            <span className="font-semibold text-gray-700">Comprehension</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500">
          <span className="text-[#2E7D4F] font-bold">&bull; Independent: &ge;97% Word / &ge;80% Comp</span>
          <span className="text-[#8A5A1E] font-bold">&bull; Instructional: 90&ndash;96% Word / 59&ndash;79% Comp</span>
        </div>
      </div>
    </Card>
  );
}

export default StudentProgressChart;

