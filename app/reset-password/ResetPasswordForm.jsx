'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.replace('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-dvh bg-[#f9fafb] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
        <h1 className="text-[clamp(19px,3.4dvh,23px)] font-semibold leading-[1.3] tracking-[-0.01em] text-[#1a1f36]">
          Choose a new password
        </h1>
        <p className="mt-1 text-[13.5px] leading-[1.6] text-gray-500">Use at least 8 characters.</p>

        <form onSubmit={handleSubmit} className="mt-6">
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="New password"
            aria-label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1a1f36] placeholder:text-gray-400 outline-none transition-colors focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/20 disabled:opacity-60"
          />
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-[#fef2f2] px-4 py-3 text-[13.5px] text-[#dc2626]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 h-[clamp(46px,6.5dvh,52px)] w-full rounded-full bg-[#d97757] px-6 text-[15px] font-semibold text-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#c6654a] active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? 'One moment…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
