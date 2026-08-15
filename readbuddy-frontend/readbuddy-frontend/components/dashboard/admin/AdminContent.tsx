'use client';

import { Card, SectionHeader, CHALK_GREEN } from '../_shared';

export function AdminContent({ passages, onUnpublish }: { passages?: any[]; onUnpublish?: (id: string) => void }) {
  return (
    <div>
      <SectionHeader title="System Content" subtitle="Manage global passage pool and system-wide reading resources." accent={CHALK_GREEN} />
      <Card>
        <p className="text-sm mb-3">Passage library management & global content controls.</p>
        {passages && passages.map((p) => (
          <div key={p.id} className="flex justify-between items-center py-2 border-b last:border-0">
            <span className="text-xs font-medium">{p.confirmed_text}</span>
            {onUnpublish && (
              <button onClick={() => onUnpublish(p.id)} className="text-xs text-red-600 font-semibold cursor-pointer">
                Unpublish
              </button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
export default AdminContent;
