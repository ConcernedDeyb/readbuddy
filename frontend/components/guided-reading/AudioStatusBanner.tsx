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
          <span className="animate-spin text-base">⏳</span>
          {statusMessage}
        </div>
      )}
      {error && (
        <div className="bg-[#FBEAE3] text-[#A4432A] border border-[#F0A35C] px-4 py-2.5 rounded-xl text-sm font-sans flex items-center gap-2 rb-fade-in-up">
          <span className="text-base">⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
}
