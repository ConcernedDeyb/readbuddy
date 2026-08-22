'use client';

import { useState } from 'react';
import styles from './guided-reading.module.css';

export type WordStatus = 'pending' | 'correct' | 'incorrect';

function getSyllables(word: string): string {
  const clean = word.toLowerCase().replace(/[^a-zñáéíóú]/g, '');
  if (clean.length <= 3) return word;
  
  // Basic syllable hyphenation for Tagalog & English
  return clean
    .replace(/([aeiouáéíóú])([bcdfghjklmnpqrstvwxyzñ])([aeiouáéíóú])/gi, '$1-$2$3')
    .replace(/([bcdfghjklmnpqrstvwxyzñ]{2})([aeiouáéíóú])/gi, '-$1$2')
    .replace(/^-|-$/g, '') || word;
}

export function WordDisplay({
  words,
  wordStatuses,
  justResolved,
  language = 'en',
}: {
  words: string[];
  wordStatuses: WordStatus[];
  justResolved: Set<number>;
  language?: 'en' | 'tl';
}) {
  const [activeWordIdx, setActiveWordIdx] = useState<number | null>(null);

  function handleWordClick(word: string, idx: number) {
    setActiveWordIdx(idx);

    // Audio replay via SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = word.replace(/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 0.85; // slightly slower for instructional clarity
      utterance.lang = language === 'tl' ? 'fil-PH' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }

    setTimeout(() => {
      setActiveWordIdx(null);
    }, 2500);
  }

  return (
    <div className={styles.passageContainer}>
      {words.map((word, idx) => {
        const status = wordStatuses[idx];
        const isPop = justResolved.has(idx);
        const isActive = activeWordIdx === idx;

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
          <span key={idx} className="relative inline-block my-1">
            <span
              onClick={() => handleWordClick(word, idx)}
              className={`${styles.wordToken} ${isPop ? styles.wordPop : ''} cursor-pointer hover:shadow-sm transition-all`}
              style={{
                backgroundColor: bg,
                color: color,
                borderColor: border,
              }}
              title="Click to hear pronunciation and syllable coaching"
            >
              {word}
            </span>

            {/* Phonics & Syllable Coaching Tooltip */}
            {isActive && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 rounded-lg bg-[#1F4D3A] text-white text-[11px] font-mono whitespace-nowrap shadow-lg z-30 rb-fade-in-up flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                <span>{getSyllables(word)}</span>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
