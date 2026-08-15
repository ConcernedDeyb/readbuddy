'use client';

import { useState } from 'react';

interface InputMethodStepProps {
  language: 'en' | 'tl';
  onLanguageChange: (language: 'en' | 'tl') => void;
  onPassageReady: (
    text: string,
    sourceType: 'typed' | 'photo_ocr',
    needsReview: boolean
  ) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function InputMethodStep({
  language,
  onLanguageChange,
  onPassageReady,
}: InputMethodStepProps) {
  const [typedText, setTypedText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypedSubmit = () => {
    if (!typedText.trim()) return;
    onPassageReady(typedText.trim(), 'typed', false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/ocr/extract`, { method: 'POST', body: formData });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail || 'Could not read text from that photo.');
      }
      const data = await res.json();
      // photo_ocr ALWAYS routes to review - Rules.md R-7, never trust extraction silently.
      onPassageReady(data.raw_extracted_text, 'photo_ocr', true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <p
        className="text-xs tracking-wide uppercase mb-1"
        style={{ fontFamily: "'Space Mono', monospace", color: '#E8873A' }}
      >
        Step 1
      </p>
      <h1
        className="text-2xl mb-2 flex items-center gap-2"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: '#1F4D3A' }}
      >
        <span aria-hidden>✏️</span> How do you have your passage?
      </h1>
      <p className="mb-6" style={{ fontFamily: "'Figtree', sans-serif", color: '#5B6B62' }}>
        Pick whichever is easiest for you.
      </p>

      {/* Language picker */}
      <div className="mb-7">
        <span
          className="block text-sm mb-2"
          style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 600, color: '#1F4D3A' }}
        >
          What language will you read in?
        </span>
        <div className="inline-flex p-1 rounded-full gap-1" style={{ background: '#DED2B444' }}>
          {(['en', 'tl'] as const).map((lang) => {
            const active = language === lang;
            return (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className="px-4 py-2 rounded-full text-sm transition-all duration-200"
                style={{
                  fontFamily: "'Figtree', sans-serif",
                  fontWeight: 600,
                  background: active ? '#1F4D3A' : 'transparent',
                  color: active ? '#FBF7EE' : '#1F4D3A',
                  boxShadow: active ? '0 2px 8px rgba(31,77,58,0.3)' : 'none',
                }}
              >
                {lang === 'en' ? 'English' : 'Tagalog'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type or paste */}
      <div className="mb-5">
        <h2
          className="text-sm mb-2 flex items-center gap-1.5"
          style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 600, color: '#1F4D3A' }}
        >
          Type or paste text
        </h2>
        <textarea
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          rows={5}
          className="rb-input w-full !rounded-xl resize-none"
          style={{ lineHeight: 1.7 }}
          placeholder="Paste or type your reading passage here..."
        />
        <button
          onClick={handleTypedSubmit}
          disabled={!typedText.trim()}
          className="mt-3 px-5 py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:shadow-md disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:scale-100"
          style={{
            fontFamily: "'Figtree', sans-serif",
            fontWeight: 600,
            background: 'linear-gradient(135deg, #E8873A, #E8873ADD)',
            color: '#FFFDF8',
          }}
        >
          Use this text →
        </button>
      </div>

      {/* Photo */}
      <label
        className="block cursor-pointer mb-3 rounded-xl border-2 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 group"
        style={{ borderColor: '#E4DCC8', background: '#FFFDF8' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-sm mb-0.5 flex items-center gap-1.5"
              style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 600, color: '#1F4D3A' }}
            >
              <span aria-hidden>📷</span> Take or upload a photo
            </h2>
            <p className="text-xs" style={{ fontFamily: "'Figtree', sans-serif", color: '#8A9089' }}>
              {isUploading ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full border-2 border-[#E8873A] border-t-transparent animate-spin" />
                  Reading the photo...
                </span>
              ) : (
                'A page from a book or worksheet'
              )}
            </p>
          </div>
          <span
            className="text-2xl group-hover:scale-110 transition-transform"
            aria-hidden
          >
            📷
          </span>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          disabled={isUploading}
          className="hidden"
        />
      </label>

      {/* Document upload — not yet available */}
      <div
        className="rounded-xl border-2 p-4 relative overflow-hidden"
        style={{ borderColor: '#E4DCC8', opacity: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-sm mb-0.5 flex items-center gap-1.5"
              style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 600, color: '#1F4D3A' }}
            >
              <span aria-hidden>📄</span> Upload a document
            </h2>
            <p className="text-xs" style={{ fontFamily: "'Figtree', sans-serif", color: '#8A9089' }}>
              PDF or Word — coming soon
            </p>
          </div>
          <span className="text-2xl" aria-hidden>🔒</span>
        </div>
      </div>

      {error && (
        <div
          className="mt-4 rounded-xl p-3.5 text-sm flex items-start gap-2 rb-fade-in-up"
          style={{
            fontFamily: "'Figtree', sans-serif",
            color: '#8A5A1E',
            background: '#FCF1DD',
            border: '1px solid #EFD9AC',
          }}
        >
          <span aria-hidden>⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
}