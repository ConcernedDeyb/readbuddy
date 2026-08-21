'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please enter your admin credentials.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: identifier.trim(), password }),
      });

      if (data && data.role) {
        localStorage.setItem(
          'readbuddy_user',
          JSON.stringify({
            display_name: data.display_name || data.username,
            role: data.role,
          })
        );
      }

      setTimeout(() => {
        setLoading(false);
        router.push('/admin');
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Incorrect credentials or unauthorized access.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4 font-sans relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#7A4A6B] rounded-full blur-[120px] opacity-[0.07] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#1F4D3A] rounded-full blur-[100px] opacity-[0.05] pointer-events-none" />

      <div className="w-full max-w-md bg-[#FFFDF8] border border-[#DED2B4] rounded-2xl shadow-xl p-8 relative z-10 rb-fade-in-up">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#7A4A6B]/10 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A4A6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1F4D3A] tracking-tight">Admin Gateway</h1>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Restricted access for SMCC ReadBuddy administrators.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-[#FDF2E9] border border-[#F0C99A] text-[#B4602E] text-sm font-sans text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1F4D3A] uppercase tracking-wider">
              Admin Username
            </label>
            <input
              type="text"
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#DED2B4] bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7A4A6B]/40 focus:border-[#7A4A6B] transition-all text-sm font-medium"
              placeholder="e.g. admin"
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1F4D3A] uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#DED2B4] bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7A4A6B]/40 focus:border-[#7A4A6B] transition-all text-sm font-medium"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 rounded-xl text-white font-sans font-semibold text-sm shadow-md transition-all hover:opacity-95 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #7A4A6B, #5a364e)' }}
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400 font-sans border-t border-gray-100 pt-4">
          Unauthorised access is strictly prohibited.
        </div>
      </div>
    </div>
  );
}
