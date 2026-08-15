export type PhilIRILevel = 'independent' | 'instructional' | 'frustration';

export function wordRecognitionTier(pct: number): PhilIRILevel {
  if (pct >= 97) return 'independent';
  if (pct >= 90) return 'instructional';
  return 'frustration';
}

export function comprehensionTier(pct: number): PhilIRILevel {
  if (pct >= 80) return 'independent';
  if (pct >= 59) return 'instructional';
  return 'frustration';
}

const TIER_RANK: Record<PhilIRILevel, number> = {
  frustration: 0,
  instructional: 1,
  independent: 2,
};

/** Overall level = the LOWER of the two tiers, per PRD.md §8 (standard Phil-IRI practice). */
export function overallTier(wordPct: number, compPct: number): PhilIRILevel {
  const a = wordRecognitionTier(wordPct);
  const b = comprehensionTier(compPct);
  return TIER_RANK[a] <= TIER_RANK[b] ? a : b;
}

/** Growth-oriented guidance per design.md §4 tone rules - never "failed"/"remedial", always ends with a next action. */
export function guidanceMessage(level: PhilIRILevel, wordPct: number, compPct: number): string {
  if (level === 'independent') {
    return "You're reading at an Independent level \u2014 great work! Try another passage to keep building your skills.";
  }
  if (level === 'instructional') {
    if (wordPct < compPct) {
      return "You're close! A little more practice with pronunciation will help you reach the next level. Review the words you missed, then try again.";
    }
    return "You're close! Try reading the passage again and think carefully about each question \u2014 a bit more comprehension practice will help.";
  }
  return "This passage was tricky \u2014 that's okay! Let's try an easier passage, or check in with your teacher for some extra support.";
}