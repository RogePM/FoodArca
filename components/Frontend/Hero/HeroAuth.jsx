'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import PhotoSlider from './PhotoSlider';

const MIN_PASSWORD = 8;

// One page, four steps. The email step decides which of the other three
// comes next, based on whether the email already has an account.
const COPY = {
  email: {
    title: 'Feed more people, with less waste',
    body: 'Sign in or create an account to get started.',
  },
  password: { title: 'Welcome back', body: 'Enter your password to continue.' },
  create: { title: 'Create your account', body: 'Choose a password to get started.' },
  google: { title: 'Continue with Google', body: 'This email signs in with Google.' },
};

const URL_ERRORS = {
  auth_code_error: 'That link has expired or was already used. Please try again.',
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.6-5.9c-2.1 1.4-4.8 2.3-8 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

const inputClass =
  'block h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1a1f36] outline-none transition-colors placeholder:text-gray-500 hover:border-gray-300 focus:border-[#d97757] focus:ring-2 focus:ring-[#d97757]/15 disabled:opacity-60';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97757]/40 focus-visible:ring-offset-2';

const textLink = 'font-medium text-[#d97757] hover:text-[#c6654a] hover:underline underline-offset-2';

const primaryBtn = `flex h-11 w-full items-center justify-center rounded-xl bg-[#d97757] px-6 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#c6654a] active:scale-[0.99] disabled:opacity-60 ${focusRing}`;

const googleBtn = `flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-[14px] font-medium text-[#1a1f36] transition-colors hover:bg-gray-50 disabled:opacity-60 ${focusRing}`;

function ErrorText({ children, className = '' }) {
  return (
    <p role="alert" className={`rounded-xl bg-[#fef2f2] px-4 py-3 text-[13.5px] text-[#dc2626] ${className}`}>
      {children}
    </p>
  );
}

// The hero doubles as the sign-in / sign-up screen. Signed-in visitors see a
// single button to the dashboard instead of the form.
export default function HeroAuth({ next, urlError, signedIn = false }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    urlError ? URL_ERRORS[urlError] ?? 'Something went wrong. Please try again.' : ''
  );
  const [notice, setNotice] = useState('');

  const copy = signedIn
    ? { title: 'Welcome back', body: 'Your pantry is ready when you are.' }
    : COPY[step];
  // OAuth uses the PKCE callback; email links use /auth/confirm (token_hash),
  // which works even when opened in a different browser or device.
  const callbackUrl = (path) =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`;
  const confirmUrl = (path) =>
    `${window.location.origin}/auth/confirm?next=${encodeURIComponent(path)}`;

  const goToEmailStep = () => {
    setStep('email');
    setPassword('');
    setShowPassword(false);
    setError('');
    setNotice('');
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl(next) },
    });
    if (error) {
      setError('Google sign-in is unavailable right now. Try email instead.');
      setLoading(false);
    }
  };

  // Step 1: ask the server what this email needs.
  const handleEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/email-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        setError('Too many attempts. Please wait a minute and try again.');
        return;
      }
      if (!res.ok) {
        setError(
          res.status === 400
            ? 'Enter a valid email address.'
            : 'Something went wrong. Please try again.'
        );
        return;
      }
      const { status } = await res.json();
      setEmail((v) => v.trim());
      setStep(status);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: sign in, or create the account.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 'create' && password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setLoading(true);
    try {
      if (step === 'password') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(
            error.code === 'email_not_confirmed'
              ? 'Please confirm your email first. Check your inbox for the link.'
              : 'Incorrect password. Try again or reset it below.'
          );
          return;
        }
        router.replace(next);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: confirmUrl(next) },
        });
        if (error) {
          setError(error.message);
          return;
        }
        if (data.session) {
          // Email confirmation is off: already signed in.
          router.replace(next);
          router.refresh();
        } else {
          setNotice(`Check ${email} for a confirmation link to finish creating your account.`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setError('');
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: confirmUrl('/reset-password') });
    setLoading(false);
    setNotice(`If an account exists for ${email}, a reset link is on its way.`);
  };

  const emailChip = (
    <div className="mb-2.5 flex h-11 items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 text-[14px] text-[#1a1f36]">
      <span className="truncate">{email}</span>
      <button
        type="button"
        onClick={goToEmailStep}
        className={`shrink-0 rounded text-[13px] ${textLink} ${focusRing}`}
      >
        Change
      </button>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-[85rem] flex-1 flex-col lg:grid lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-1 flex-col justify-center pb-24 pt-6 lg:py-6">
          <div className="mx-auto w-full max-w-[560px]">
            <div className="auth-rise text-center">
              <h1 id="hero-title" className="text-balance font-serif text-[clamp(32px,9.8vw,44px)] sm:text-[clamp(36px,7dvh,58px)] font-normal leading-[1.05] tracking-[-0.035em] text-[#1C1917]">
                {copy.title}
              </h1>
              <p className="mt-3 font-serif text-[16px] sm:mt-4 leading-[1.5] text-[#57534E] sm:text-[19px]">
                {copy.body}
              </p>
            </div>

            <div style={{ '--d': '120ms' }} className="auth-rise mx-auto mt-6 w-[calc(100%-1.5rem)] max-w-[400px] sm:w-full rounded-[28px] border border-gray-200/70 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05),0_16px_40px_-24px_rgba(0,0,0,0.12)] sm:mt-10 sm:p-6">
              <div key={signedIn ? 'in' : notice ? 'notice' : step} className="auth-step">
              {signedIn ? (
                <Link href="/dashboard" className={primaryBtn + ' gap-2'}>
                  Open your dashboard
                  <ArrowRight size={16} />
                </Link>
              ) : notice ? (
                <>
                  <div
                    role="status"
                    className="flex items-start gap-3 rounded-xl bg-[#fff0eb] p-4 text-[13.5px] leading-[1.6] text-[#1a1f36]"
                  >
                    <Mail size={18} className="mt-0.5 shrink-0 text-[#d97757]" />
                    <span>{notice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={goToEmailStep}
                    className={`mt-5 block w-full rounded-lg text-center text-[13.5px] ${textLink} ${focusRing}`}
                  >
                    Use a different email
                  </button>
                </>
              ) : step === 'email' ? (
                <>
                  <button type="button" onClick={handleGoogle} disabled={loading} className={googleBtn}>
                    <GoogleIcon />
                    Continue with Google
                  </button>

                  <div className="my-4 flex items-center gap-4 text-[12px] text-gray-500">
                    <span className="h-px flex-1 bg-gray-200" />
                    OR
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>

                  <form onSubmit={handleEmail}>
                    <input
                      type="email"
                      id="hero-email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      placeholder="Enter your email"
                      aria-label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className={inputClass}
                    />
                    {error && <ErrorText className="mt-3">{error}</ErrorText>}
                    <button type="submit" disabled={loading} className={`mt-3 ${primaryBtn}`}>
                      {loading ? <Loader2 aria-label="Loading" className="h-5 w-5 animate-spin" /> : 'Continue with email'}
                    </button>
                  </form>
                </>
              ) : step === 'google' ? (
                <>
                  {emailChip}
                  {error && <ErrorText className="mb-3">{error}</ErrorText>}
                  <button type="button" onClick={handleGoogle} disabled={loading} className={googleBtn}>
                    <GoogleIcon />
                    Continue with Google
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  {emailChip}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      autoComplete={step === 'create' ? 'new-password' : 'current-password'}
                      placeholder={step === 'create' ? 'Choose a password' : 'Enter your password'}
                      aria-label="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className={`absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-gray-700 ${focusRing}`}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {step === 'create' && (
                    <p className="mt-2 text-[12px] leading-[1.375] text-gray-500">
                      Use at least {MIN_PASSWORD} characters.
                    </p>
                  )}

                  {error && <ErrorText className="mt-3">{error}</ErrorText>}

                  <button type="submit" disabled={loading} className={`mt-4 ${primaryBtn}`}>
                    {loading ? <Loader2 aria-label="Loading" className="h-5 w-5 animate-spin" /> : step === 'create' ? 'Create account' : 'Sign in'}
                  </button>

                  {step === 'password' && (
                    <button
                      type="button"
                      onClick={handleForgot}
                      disabled={loading}
                      className={`mt-4 block w-full rounded-lg text-center text-[13px] text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline disabled:opacity-60 ${focusRing}`}
                    >
                      Forgot password?
                    </button>
                  )}
                </form>
              )}
              </div>

              {!signedIn && (
              <p className="mt-5 text-center text-[12px] leading-[1.5] text-gray-500">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="underline underline-offset-2 hover:text-gray-700">
                  Terms
                </Link>
                .
              </p>
              )}
            </div>
          </div>
        </div>

        {/* Photo: desktop and laptop only, so phones never download it */}
        <aside className="relative hidden min-h-[460px] overflow-hidden rounded-2xl bg-[#e9e2d8] lg:my-8 lg:block lg:w-[92%] lg:justify-self-end">
          <div className="auth-photo absolute inset-0">
            <PhotoSlider />
          </div>
        </aside>
    </div>
  );
}
