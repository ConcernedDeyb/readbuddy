'use client';

import { useState } from 'react';
import GuidedReading from '@/components/GuidedReading'; // adjust path if your import differs

type Language = 'en' | 'tl';

interface TestPassage {
  label: string;
  language: Language;
  text: string;
}

// Same two passages used throughout manual testing (English "Maria/tomato"
// passage, Tagalog "Ana/Puti" passage) - centralized here instead of
// hardcoded inline, so switching between them (or adding a third later,
// e.g. a genuinely code-switched passage) doesn't require editing this
// component's JSX directly.
const TEST_PASSAGES: TestPassage[] = [
  {
    label: 'English (Maria / tomato plants)',
    language: 'en',
    text:
      "The sun was setting over the quiet village. Maria walked home from " +
      "school, thinking about the science project due tomorrow. She had " +
      "learned that plants need sunlight, water, and soil to grow. As she " +
      "passed the garden, she noticed her mother's tomato plants were " +
      "taller than last week.",
  },
  {
    label: 'Tagalog (Ana / Puti the cat)',
    language: 'tl',
    text:
      'Si Ana ay may alagang pusa na nagngangalang Puti. Tuwing hapon, ' +
      'pinapakain niya ito ng gatas at tuyong pagkain. Isang araw, nawala ' +
      'si Puti sa loob ng tatlong oras. Nag-alala si Ana at hinanap ito sa ' +
      'buong bahay. Natagpuan niya si Puti na natutulog sa ilalim ng kama.',
  },
];

export default function ReadingPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  // key forces GuidedReading to fully remount when the passage changes,
  // rather than reusing a stale WebSocket/audio session from the previous
  // passage - GuidedReading has no internal handling for its passageText
  // or language prop changing out from under an in-progress session.
  const selected = TEST_PASSAGES[selectedIndex];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex gap-2 mb-6">
        {TEST_PASSAGES.map((passage, i) => (
          <button
            key={passage.label}
            onClick={() => setSelectedIndex(i)}
            className={`px-3 py-1.5 rounded text-sm border transition-colors ${
              i === selectedIndex
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {passage.label}
          </button>
        ))}
      </div>

      <GuidedReading
        key={selected.language}
        passageText={selected.text}
        language={selected.language}
      />
    </div>
  );
}