'use client';

import { useState, useEffect } from 'react';
import { SectionHeader, Card, PrimaryButton, FONT_SANS, FONT_MONO, FONT_SERIF, MUTED, INK, CHALK_GREEN, TAN_BORDER, CREAM } from '../_shared';
import { recordActivity } from '@/utils/auditLogger';
import { ShieldCheck } from 'lucide-react';

const ADMIN_ACCENT = '#7A4A6B';

interface AdapterBenchmark {
  fleursWer: number;
  realAudioWerStock: number;
  realAudioWerFinetuned: number;
  sampleCount: number;
}

type AdminSettingsTab = 'models' | 'vram' | 'security' | 'maintenance';

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

  // Security & Account Limiter state
  const [teacherQuotaLimit, setTeacherQuotaLimit] = useState(10);
  const [enforceVerificationCode, setEnforceVerificationCode] = useState(true);
  const [teacherCount, setTeacherCount] = useState(0);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('readbuddy_admin_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.enabled !== undefined) setEnabled(parsed.enabled);
        if (parsed.maxVramMb !== undefined) setMaxVramMb(parsed.maxVramMb);
        if (parsed.ollamaModel) setOllamaModel(parsed.ollamaModel);
      }

      const savedLimit = localStorage.getItem('readbuddy_teacher_creation_limit');
      if (savedLimit) {
        const val = Number(savedLimit);
        if (!isNaN(val) && val > 0) setTeacherQuotaLimit(val);
      }

      const accountsMap = JSON.parse(localStorage.getItem('readbuddy_accounts') || '{}');
      const teachers = Object.values(accountsMap).filter((acc: any) => acc.role === 'teacher');
      setTeacherCount(teachers.length);
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
          enforceVerificationCode,
        })
      );
      localStorage.setItem('readbuddy_teacher_creation_limit', String(teacherQuotaLimit));
      window.dispatchEvent(new Event('readbuddy_settings_updated'));
      window.dispatchEvent(new Event('readbuddy_accounts_updated'));

      recordActivity({
        user_name: 'System Admin',
        role: 'admin',
        action: 'System Settings Saved',
        details: `Platform settings and teacher quota (${teacherQuotaLimit} accounts) saved`,
      });
    } catch (e) {}

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handlePurgeCache() {
    try {
      sessionStorage.clear();
    } catch (e) {}
    setCachePurged(true);
    setTimeout(() => setCachePurged(false), 2500);
  }

  const TABS: { id: AdminSettingsTab; label: string }[] = [
    { id: 'models', label: 'AI & ASR Models' },
    { id: 'vram', label: 'GPU & VRAM Limits' },
    { id: 'security', label: 'Anti-Impersonation & Quotas' },
    { id: 'maintenance', label: 'System Maintenance' },
  ];

  return (
    <div>
      <SectionHeader title="System Settings" subtitle="Platform-wide ASR model parameters, account creation limits, and security configuration." accent={ADMIN_ACCENT} />

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
                <div className="space-y-3">
                  {[
                    { label: 'FLEURS Tagalog Test Set', value: b.fleursWer },
                    { label: 'Real Audio (Stock MMS-1B-All)', value: b.realAudioWerStock },
                    { label: 'Real Audio (Fine-tuned Adapter)', value: b.realAudioWerFinetuned },
                  ].map((row, i) => (
                    <div key={row.label}>
                      <div className="flex justify-between mb-1">
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
              <p className="text-xs mb-4" style={{ fontFamily: FONT_SANS, color: MUTED }}>ReadBuddy is constrained to run on RTX 2070 (8GB VRAM) target GPUs (Rule R-5).</p>
              
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

          {/* ─── TAB: ANTI-IMPERSONATION & TEACHER ACCOUNT LIMITER ─── */}
          {activeSubTab === 'security' && (
            <Card className="rb-fade-in-up">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-[#1F4D3A]" strokeWidth={2.25} />
                <h3 className="text-base font-semibold" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
                  Teacher Account Limiter & Anti-Impersonation
                </h3>
              </div>
              <p className="text-xs mb-5 text-gray-600 font-sans leading-relaxed">
                Prevents students from registering fake teacher accounts using known faculty emails by enforcing institutional 6-digit GSuite verification codes and strict account allocation quotas.
              </p>

              {/* Quota Setting Box */}
              <div className="p-4 rounded-xl mb-4 border" style={{ background: CREAM, borderColor: TAN_BORDER }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 font-sans uppercase tracking-wide">
                      Teacher Account Creation Limiter (Max Quota)
                    </h4>
                    <p className="text-xs text-gray-500 font-sans">
                      Currently {teacherCount} of {teacherQuotaLimit} teacher accounts allocated.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTeacherQuotaLimit((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-[#DED2B4] font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer shadow-sm text-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={teacherQuotaLimit}
                      onChange={(e) => setTeacherQuotaLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 h-8 text-center text-xs font-mono font-bold bg-white border border-[#DED2B4] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setTeacherQuotaLimit((prev) => prev + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-[#DED2B4] font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer shadow-sm text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (teacherCount / Math.max(1, teacherQuotaLimit)) * 100)}%`,
                        background: teacherCount >= teacherQuotaLimit ? '#B4602E' : '#2E7D4F',
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-700 shrink-0">
                    {Math.round((teacherCount / Math.max(1, teacherQuotaLimit)) * 100)}% Used
                  </span>
                </div>
              </div>

              {/* Verification Code Toggle */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl mb-5 border" style={{ background: '#FFFDF8', borderColor: TAN_BORDER }}>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 font-sans mb-1">
                    Enforce 6-Digit GSuite Email Verification Code
                  </h4>
                  <p className="text-xs text-gray-500 font-sans max-w-md">
                    Requires anyone creating a Teacher account to verify a 6-digit one-time passcode sent directly to their official institutional email before the account is generated.
                  </p>
                </div>

                <button
                  role="switch"
                  aria-checked={enforceVerificationCode}
                  onClick={() => setEnforceVerificationCode((v) => !v)}
                  className="shrink-0 w-12 h-6 rounded-full relative transition-all duration-300 cursor-pointer"
                  style={{
                    background: enforceVerificationCode ? `linear-gradient(135deg, ${ADMIN_ACCENT}, ${ADMIN_ACCENT}CC)` : TAN_BORDER,
                  }}
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-[10px]" style={{ left: enforceVerificationCode ? '24px' : '2px' }}>
                    {enforceVerificationCode ? '✓' : ''}
                  </span>
                </button>
              </div>

              <PrimaryButton accent={ADMIN_ACCENT} onClick={handleSave}>
                {saved ? '✓ Security Limits Saved' : 'Save Quota & Security Settings'}
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
