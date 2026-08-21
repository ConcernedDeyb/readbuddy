'use client';

import styles from './guided-reading.module.css';

export type WordStatus = 'pending' | 'correct' | 'incorrect';

export function WordDisplay({
  words,
  wordStatuses,
  justResolved,
}: {
  words: string[];
  wordStatuses: WordStatus[];
  justResolved: Set<number>;
}) {
  return (
    <div className={styles.passageContainer}>
      {words.map((word, idx) => {
        const status = wordStatuses[idx];
        const isPop = justResolved.has(idx);

        let bg = 'transparent';
        let color = '#2B2621';
        let border = 'transparent';

        if (status === 'correct') {
          bg = '#E6F4EA';
          color = '#2E7D4F';
          border = '#A5D6A7';
        } else if (status === 'incorrect') {
          bg = '#FBEAE3';
          color = '#A4432A';
          border = '#F0A35C';
        }

        return (
          <span
            key={idx}
            className={`${styles.wordToken} ${isPop ? styles.wordPop : ''}`}
            style={{
              backgroundColor: bg,
              color: color,
              borderColor: border,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}
