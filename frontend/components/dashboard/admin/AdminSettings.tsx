'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, PrimaryButton, FONT_SANS, FONT_MONO, FONT_SERIF, MUTED, INK, CHALK_GREEN, TAN_BORDER, CREAM } from '../_shared';

const ADMIN_ACCENT = '#7A4A6B';

interface AdapterBenchmark {
  fleursWer: number;
  realAudioWerStock: number;
  realAudioWerFinetuned: number;
  sampleCount: number;
}

type AdminSettingsTab = 'models' | 'vram' | 'maintenance';

function wer(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function AdminSettings({
  finetunedAdapterEnabled,
  finetunedAdapterBenchmark,
}: {
  finetunedAdapterEnabled: boolean;
  finetunedAdapterBenchmark: AdapterBenchmark;
}) {
  const [activeSubTab, setActiveSubTab] = useState<AdminSettingsTab>('models');
  const [enabled, setEnabled] = useState(finetunedAdapterEnabled);
  const [saved, setSaved] = useState(false);
  const [maxVramMb, setMaxVramMb] = useState(8192);
  const [ollamaModel, setOllamaModel] = useState('gemma3:4b');
  const [cachePurged, setCachePurged] = useState(false);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('readbuddy_admin_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.enabled !== undefined) setEnabled(parsed.enabled);
        if (parsed.maxVramMb !== undefined) setMaxVramMb(parsed.maxVramMb);
        if (parsed.ollamaModel) setOllamaModel(parsed.ollamaModel);
      }
    } catch (e) {}
  }, []);

  const b = finetunedAdapterBenchmark;
  const maxWer = Math.max(b.fleursWer, b.realAudioWerStock, b.realAudioWerFinetuned);
  const barScale = (v: number) => `${Math.round((v / (maxWer * 1.2)) * 100)}%`;

  function handleSave() {
    try {
      localStorage.setItem(
        'readbuddy_admin_settings',
        JSON.stringify({
          enabled,
          maxVramMb,
          ollamaModel,
        })
      );
    } catch (e) {}

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handlePurgeCache() {
    try {
      // Clear temporary session caches without deleting user profiles
      sessionStorage.clear();
    } catch (e) {}
    setCachePurged(true);
    setTimeout(() => setCachePurged(false), 2500);
  }

  const TABS: { id: AdminSettingsTab; label: string }[] = [
    { id: 'models', label: 'AI & ASR Models' },
    { id: 'vram', label: 'GPU & VRAM Limits' },
    { id: 'maintenance', label: 'System Maintenance' },
  ];

  return (
    <div>
      <SectionHeader title="System Settings" subtitle="Platform-wide ASR model parameters, GPU budget, and system configuration." accent={ADMIN_ACCENT} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start min-h-[480px]">
        <div className="md:col-span-1 shrink-0">
          <div className="flex flex-col gap-1 p-2 rounded-2xl border" style={{ background: CREAM, borderColor: TAN_BORDER }}>
            <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500" style={{ fontFamily: FONT_MONO }}>
              System Settings
            </span>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className="px-3.5 h-10 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer border"
                style={{
                  fontFamily: FONT_SANS,
                  background: activeSubTab === tab.id ? '#FFFFFF' : 'transparent',
                  color: activeSubTab === tab.id ? CHALK_GREEN : MUTED,
                  borderColor: activeSubTab === tab.id ? TAN_BORDER : 'transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 min-h-[480px]">
          {activeSubTab === 'models' && (
            <Card className="rb-fade-in-up">
              <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b" style={{ borderColor: TAN_BORDER }}>
                <div>
                  <h2 className="text-base font-semibold mb-1" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
                    Fine-tuned Tagalog Adapter
                  </h2>
                  <p className="text-xs max-w-md" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                    Use the BLOOM Speech + FLEURS fine-tuned tgl adapter instead of stock MMS-1B-All for Tagalog reading sessions.
                  </p>
                </div>

                <button
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => setEnabled((v) => !v)}
                  className="shrink-0 w-12 h-6 rounded-full relative transition-all duration-300 cursor-pointer"
                  style={{
                    background: enabled ? `linear-gradient(135deg, ${ADMIN_ACCENT}, ${ADMIN_ACCENT}CC)` : TAN_BORDER,
                  }}
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-[10px]" style={{ left: enabled ? '24px' : '2px' }}>
                    {enabled ? '✓' : ''}
                  </span>
                </button>
              </div>

              <div className="rounded-xl px-5 py-4 mb-5" style={{ background: CREAM, border: `1px solid ${TAN_BORDER}` }}>
                <div className="text-xs mb-3 font-bold uppercase tracking-wider" style={{ fontFamily: FONT_SANS, color: MUTED }}>
                  Benchmark — Word Error Rate (lower is better)
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'FLEURS eval set', value: b.fleursWer },
                    { label: 'Real audio, stock adapter', value: b.realAudioWerStock },
                    { label: 'Real audio, fine-tuned', value: b.realAudioWerFinetuned },
                  ].map((row, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ fontFamily: FONT_SANS, color: MUTED }}>{row.label}</span>
                        <span className="text-xs font-bold" style={{ fontFamily: FONT_MONO, color: CHALK_GREEN }}>{wer(row.value)}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: TAN_BORDER + '55' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: barScale(row.value), background: i === 2 ? ADMIN_ACCENT : CHALK_GREEN + '88' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <PrimaryButton accent={ADMIN_ACCENT} onClick={handleSave}>
                {saved ? '✓ Settings Saved' : 'Save ASR & LLM Settings'}
              </PrimaryButton>
            </Card>
          )}

          {activeSubTab === 'vram' && (
            <Card className="rb-fade-in-up">
              <h3 className="text-base font-semibold mb-2" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>GPU Memory & VRAM Limits</h3>
              <p className="text-xs mb-4" style={{ fontFamily: FONT_SANS, color: MUTED }}>ReadBuddy is constrained to run on RTX 4070 (8GB VRAM) target GPUs (Rule R-5).</p>
              
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1 text-gray-700 font-sans">Max VRAM Budget (MB)</label>
                <input
                  type="number"
                  value={maxVramMb}
                  onChange={(e) => setMaxVramMb(Number(e.target.value))}
                  className="rb-input max-w-xs text-xs"
                />
              </div>

              <PrimaryButton accent={ADMIN_ACCENT} onClick={handleSave}>
                {saved ? '✓ VRAM Limits Saved' : 'Update VRAM Limits'}
              </PrimaryButton>
            </Card>
          )}

          {activeSubTab === 'maintenance' && (
            <Card className="rb-fade-in-up">
              <h3 className="text-base font-semibold mb-2" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>System Maintenance</h3>
              <p className="text-xs mb-4" style={{ fontFamily: FONT_SANS, color: MUTED }}>Perform cache operations and review database status.</p>
              <button
                onClick={handlePurgeCache}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-300 hover:bg-gray-50 transition-all cursor-pointer font-sans"
              >
                {cachePurged ? '✓ Session Cache Purged' : 'Purge Session Cache'}
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
export default AdminSettings;
