'use client';

import styles from './teacher-tests.module.css';

export function TestFilterBar({
  filter,
  setFilter,
  totalCount,
  pendingCount,
  completedCount,
  gradedCount,
}: {
  filter: 'all' | 'pending' | 'completed' | 'graded';
  setFilter: (f: 'all' | 'pending' | 'completed' | 'graded') => void;
  totalCount: number;
  pendingCount: number;
  completedCount: number;
  gradedCount: number;
}) {
  const items = [
    { key: 'all' as const, label: 'All', count: totalCount },
    { key: 'pending' as const, label: 'Pending', count: pendingCount },
    { key: 'completed' as const, label: 'Completed', count: completedCount },
    { key: 'graded' as const, label: 'Graded', count: gradedCount },
  ];

  return (
    <div className={styles.filterContainer}>
      {items.map(({ key, label, count }) => (
        <button
          key={key}
          onClick={() => setFilter(key)}
          className={`${styles.filterBtn} ${filter === key ? styles.filterBtnActive : styles.filterBtnInactive}`}
        >
          {label} ({count})
        </button>
      ))}
    </div>
  );
}
