'use client';

import React from 'react';

/**
 * Base Shimmer Element
 */
export function SkeletonBlock({
  className = '',
  style = {},
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[#ECE4D0] rounded-lg animate-pulse ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(90deg, #EDE4D0 0%, #FAF6ED 50%, #EDE4D0 100%)',
        backgroundSize: '200% 100%',
        ...style,
      }}
    />
  );
}

/**
 * Tactile Soft-Neobrutalist Stat Card Skeleton
 */
export function SkeletonStatCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`p-4 rounded-2xl bg-[#FFFDF8] border-2 border-[#DED2B4] shadow-[3px_3px_0px_rgba(31,77,58,0.08)] flex-1 min-w-[130px] ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <SkeletonBlock className="w-8 h-8 rounded-xl" />
        <SkeletonBlock className="w-12 h-4 rounded-md" />
      </div>
      <SkeletonBlock className="w-16 h-7 rounded-md mb-2" />
      <SkeletonBlock className="w-24 h-3 rounded-md" />
    </div>
  );
}

/**
 * Dashboard Stat Bar Skeleton (5 cards)
 */
export function SkeletonStatBar({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}

/**
 * Card Skeleton with Header, Content lines, and Footer
 */
export function SkeletonCard({
  lines = 3,
  hasButton = true,
  className = '',
}: {
  lines?: number;
  hasButton?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`p-6 rounded-2xl bg-[#FFFDF8] border-2 border-[#DED2B4] shadow-[4px_4px_0px_rgba(31,77,58,0.08)] mb-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-10 h-10 rounded-xl" />
          <div>
            <SkeletonBlock className="w-36 h-5 rounded-md mb-1.5" />
            <SkeletonBlock className="w-24 h-3 rounded-md" />
          </div>
        </div>
        <SkeletonBlock className="w-16 h-6 rounded-full" />
      </div>

      <div className="space-y-2.5 my-4">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className={`h-3.5 rounded-md ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        ))}
      </div>

      {hasButton && (
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#DED2B4]/60">
          <SkeletonBlock className="w-28 h-3.5 rounded-md" />
          <SkeletonBlock className="w-24 h-8 rounded-xl" />
        </div>
      )}
    </div>
  );
}

/**
 * Reading Passage Card Skeleton
 */
export function SkeletonPassageCard() {
  return (
    <div className="p-5 rounded-2xl bg-[#FFFDF8] border-2 border-[#DED2B4] shadow-[3px_3px_0px_rgba(31,77,58,0.08)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <SkeletonBlock className="w-20 h-5 rounded-full" />
          <SkeletonBlock className="w-16 h-4 rounded-md" />
        </div>
        <SkeletonBlock className="w-4/5 h-6 rounded-md mb-2" />
        <SkeletonBlock className="w-full h-3.5 rounded-md mb-1.5" />
        <SkeletonBlock className="w-3/4 h-3.5 rounded-md mb-4" />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#DED2B4]/60">
        <SkeletonBlock className="w-20 h-4 rounded-md" />
        <SkeletonBlock className="w-28 h-8 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Table Skeleton Loader
 */
export function SkeletonTable({
  rows = 4,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="rounded-2xl bg-[#FFFDF8] border-2 border-[#DED2B4] shadow-[4px_4px_0px_rgba(31,77,58,0.08)] overflow-hidden">
      {/* Table Header */}
      <div className="bg-[#FAF6ED] p-4 border-b-2 border-[#DED2B4] flex items-center justify-between gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBlock key={i} className="h-4 rounded-md flex-1" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-[#DED2B4]/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex items-center justify-between gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <SkeletonBlock
                key={c}
                className={`h-4 rounded-md flex-1 ${
                  c === 0 ? 'w-1/3' : 'w-1/4'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full Dashboard View Skeleton Loader
 */
export function DashboardSkeleton({
  role = 'student',
}: {
  role?: 'student' | 'teacher' | 'admin';
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Greeting Card Skeleton */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFDF8] border-3 border-[#1F4D3A] shadow-[6px_6px_0px_#1F4D3A] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex-1 space-y-3">
          <SkeletonBlock className="w-28 h-6 rounded-full" />
          <SkeletonBlock className="w-64 h-8 rounded-xl" />
          <SkeletonBlock className="w-full max-w-md h-4 rounded-md" />
        </div>
        <div className="w-24 h-24 rounded-2xl bg-[#F5EFE0] border-2 border-[#1F4D3A] flex items-center justify-center">
          <SkeletonBlock className="w-16 h-16 rounded-xl" />
        </div>
      </div>

      {/* Stat Bar */}
      <SkeletonStatBar count={role === 'admin' ? 4 : 4} />

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>

      {/* Table or Passages Section */}
      <SkeletonTable rows={4} columns={role === 'admin' ? 5 : 4} />
    </div>
  );
}

export default DashboardSkeleton;
