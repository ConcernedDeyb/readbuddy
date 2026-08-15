import difflib
import re

_PUNCT_RE = re.compile(r"[^\w\s'-]")


def normalize_word(word: str) -> str:
    """
    Lowercase and strip punctuation for comparison purposes only. This is
    NOT used to alter what gets stored/displayed - Schema.md's
    `asr_transcribed_word` should still reflect what the model actually
    output, not this normalized form.
    """
    return _PUNCT_RE.sub("", word).lower().strip()


def _match_uneven_replace_block(
    expected_indices: list[int],
    expected_norm_words: list[str],
    transcribed_indices: list[int],
    transcribed_words: list[str],
    transcribed_norm_words: list[str],
) -> dict[int, str | None]:
    """
    Handles a difflib "replace" opcode where the expected-word count and
    transcribed-word count in the block differ (e.g. 2 expected words vs 1
    transcribed word, because the ASR merged them into a single token with
    no space - a routine occurrence, not an edge case, with this ASR model).

    The naive approach (zip expected/transcribed positionally, dump any
    leftover expected words as None) silently misassigns merged/split
    tokens to the WRONG expected word - e.g. a merged token that actually
    resembles the passage's second word gets handed to the first word
    instead, because it happened to come first in iteration order. That
    corrupts is_correct for both words involved, not just the one that
    "ran out" of a transcribed counterpart.

    Instead: score every (expected, transcribed) pair in this block by
    normalized-string similarity (difflib.ratio on the words themselves,
    not the full passage), then greedily assign the highest-similarity
    pairs first, without reusing an expected or transcribed word once
    assigned. Any expected word left unassigned (block had more expected
    words than transcribed words) gets None, same as before - that part
    of the contract doesn't change, only which word gets picked as the
    best match.
    """
    scored_pairs = []
    for ei, e_norm in zip(expected_indices, expected_norm_words):
        for tj, t_norm in zip(transcribed_indices, transcribed_norm_words):
            score = difflib.SequenceMatcher(None, e_norm, t_norm).ratio()
            scored_pairs.append((score, ei, tj))

    # Highest similarity first; ties broken by original expected order so
    # behavior is deterministic rather than dependent on dict/set iteration.
    scored_pairs.sort(key=lambda p: (-p[0], expected_indices.index(p[1])))

    assigned_expected: set[int] = set()
    assigned_transcribed: set[int] = set()
    result: dict[int, str | None] = {}

    for score, ei, tj in scored_pairs:
        if ei in assigned_expected or tj in assigned_transcribed:
            continue
        assigned_expected.add(ei)
        assigned_transcribed.add(tj)
        # tj is an index into the transcribed_indices list's corresponding
        # position - map back to the original transcribed word text.
        original_word = transcribed_words[transcribed_indices.index(tj)]
        result[ei] = original_word

    for ei in expected_indices:
        if ei not in result:
            result[ei] = None

    return result


class WordMatcher:
    """
    Aligns a growing ASR transcription against a fixed expected passage
    using real sequence alignment (architecture.md §1b explicitly calls this
    a "word-level CTC diff", not a positional match - naive index-for-index
    comparison breaks the moment the model's word count doesn't match the
    passage's, e.g. when two spoken words get transcribed as one merged
    token with no space between them).

    Within a difflib "replace" block, equal-length substitutions (1
    expected word swapped for 1 transcribed word, in order) are assigned
    positionally - that ordering is already correct for straightforward
    word-for-word substitution and is left alone. Uneven-length blocks
    (merges/splits) are resolved by _match_uneven_replace_block() using
    word-similarity scoring instead of blind positional zipping - see that
    function's docstring for why naive zipping was misassigning merged
    tokens to the wrong expected word.

    Why a "reserve tail": each time the (ungrown, full-session) audio buffer
    is re-transcribed, difflib re-aligns the ENTIRE transcript against the
    ENTIRE expected passage from scratch. The alignment for words near the
    end of the current transcript is the least trustworthy - more audio
    arriving next window could still change how those words resolve (e.g. a
    merge like "tomorrow.She" might later split back into two recognizable
    words once more context/silence is available). Words further back are
    stable and safe to lock in. `reserve_tail` is how many of the most
    recently aligned words are held back as still-tentative each pass.
    Confirmed words are never revisited once emitted.
    """

    def __init__(self, expected_words: list[str], reserve_tail: int = 2):
        self.expected_words = expected_words
        self.expected_norm = [normalize_word(w) for w in expected_words]
        self.confirmed_count = 0
        self.reserve_tail = reserve_tail

    # How many words beyond (transcript length + reserve_tail) mid-session
    # matching is allowed to consider. Exists because difflib.SequenceMatcher
    # does a GLOBAL optimization over the full expected passage on every
    # pass, including early passes when the transcript is still short. With
    # repeated common words in a passage ("the", "she", "plants"), it can
    # occasionally match a word the student just said to a much LATER
    # occurrence of a similar word in the expected passage - not because
    # that's remotely plausible (the student can't have said word 40 when
    # they've only spoken ~15 words), but because it happens to produce a
    # longer matching run in difflib's global alignment. Once that
    # spurious far-index gets picked up by real_indices, safe_upto jumps
    # forward with it, and every expected word between the true reading
    # position and that false match gets permanently confirmed as omitted
    # - confirmed_count never moves backward, so nothing downstream
    # (including the final flush) ever revisits or corrects it, even once
    # the model genuinely transcribes those words later in the session.
    # Capping the search window removes distant words from consideration
    # entirely during incremental passes, so there's nothing far away for
    # a repeated word to falsely latch onto.
    _MID_SESSION_WINDOW_MARGIN = 10

    def process_transcription(self, transcribed_text: str, hold_last_word: bool = True) -> list[dict]:
        """
        Re-aligns the FULL transcription (of the whole session so far)
        against the full expected passage, then confirms and returns any
        newly-resolved word results (Schema.md `miscue_tokens` shape).

        hold_last_word=True applies the reserve_tail buffer described above,
        AND bounds the expected-word search window (see
        _MID_SESSION_WINDOW_MARGIN) - both exist for the same underlying
        reason: an in-progress transcript is not yet trustworthy evidence
        about words far ahead of where the student has actually read.

        Pass hold_last_word=False on `finish` to flush everything using the
        FULL expected-word list with no window cap - at that point no more
        audio is coming, the transcript is final, and there's nothing left
        to accidentally match too far ahead of.
        """
        transcribed_words = transcribed_text.split()
        if not transcribed_words:
            return []
        transcribed_norm = [normalize_word(w) for w in transcribed_words]

        if hold_last_word:
            window_end = min(
                len(self.expected_norm),
                len(transcribed_norm) + self.reserve_tail + self._MID_SESSION_WINDOW_MARGIN,
            )
        else:
            window_end = len(self.expected_norm)

        search_expected_norm = self.expected_norm[:window_end]

        matcher = difflib.SequenceMatcher(
            None, search_expected_norm, transcribed_norm, autojunk=False
        )

        alignment: dict[int, str | None] = {}
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                ei, ti = i1, j1
                while ei < i2 and ti < j2:
                    alignment[ei] = transcribed_words[ti]
                    ei += 1
                    ti += 1
            elif tag == "replace":
                expected_count = i2 - i1
                transcribed_count = j2 - j1
                if expected_count == transcribed_count:
                    # Equal-length substitution: positional pairing is
                    # already correct here (e.g. one mispronounced word
                    # swapped for one transcribed word, same order).
                    ei, ti = i1, j1
                    while ei < i2 and ti < j2:
                        alignment[ei] = transcribed_words[ti]
                        ei += 1
                        ti += 1
                else:
                    # Uneven counts: a merge ("na"+"natutulog" -> one
                    # token) or a split - resolve by similarity instead of
                    # naive positional zip. See
                    # _match_uneven_replace_block()'s docstring.
                    expected_indices = list(range(i1, i2))
                    transcribed_indices = list(range(j1, j2))
                    block_result = _match_uneven_replace_block(
                        expected_indices,
                        self.expected_norm[i1:i2],
                        transcribed_indices,
                        transcribed_words[j1:j2],
                        transcribed_norm[j1:j2],
                    )
                    alignment.update(block_result)
            elif tag == "delete":
                for ei in range(i1, i2):
                    alignment[ei] = None

        if not alignment:
            return []

        if hold_last_word:
            # Only trust indices backed by an actual transcribed word as the
            # "we have real evidence up to here" boundary - a trailing run
            # of None entries just means "not reached by the transcript
            # yet", not "the student skipped these words".
            real_indices = [ei for ei, w in alignment.items() if w is not None]
            if not real_indices:
                return []  # nothing solid yet, still streaming
            safe_upto = max(real_indices) - self.reserve_tail
        else:
            # Final flush: no more audio coming, trailing gaps are genuine
            # omissions now, not "not yet reached".
            safe_upto = max(alignment.keys())

        results = []
        i = self.confirmed_count
        while i <= safe_upto and i < len(self.expected_words):
            transcribed_word = alignment.get(i)
            expected_word = self.expected_words[i]
            if transcribed_word is None:
                results.append(
                    {
                        "word_index": i,
                        "expected_word": expected_word,
                        "transcribed_word": "",
                        "is_correct": False,
                    }
                )
            else:
                is_correct = normalize_word(transcribed_word) == self.expected_norm[i]
                results.append(
                    {
                        "word_index": i,
                        "expected_word": expected_word,
                        "transcribed_word": transcribed_word,
                        "is_correct": is_correct,
                    }
                )
            i += 1

        self.confirmed_count = i
        return results

    @property
    def is_complete(self) -> bool:
        return self.confirmed_count >= len(self.expected_words)