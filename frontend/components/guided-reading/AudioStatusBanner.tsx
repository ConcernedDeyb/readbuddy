'use client';

export function AudioStatusBanner({
  statusMessage,
  error,
}: {
  statusMessage: string | null;
  error: string | null;
}) {
  if (!statusMessage && !error) return null;

  return (
    <div className="space-y-2 mb-4">
      {statusMessage && (
        <div className="bg-[#FFF8E7] text-[#8A5A16] border border-[#F0A35C] px-4 py-2.5 rounded-xl text-sm font-sans flex items-center gap-2 rb-fade-in-up">
          <svg className="animate-spin shrink-0" aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-3-6.7" />
          </svg>
          {statusMessage}
        </div>
      )}
      {error && (
        <div className="bg-[#FBEAE3] text-[#A4432A] border border-[#F0A35C] px-4 py-2.5 rounded-xl text-sm font-sans flex items-center gap-2 rb-fade-in-up">
          <svg className="shrink-0" aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.3 3.2 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
