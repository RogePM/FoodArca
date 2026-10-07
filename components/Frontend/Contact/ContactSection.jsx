'use client';

import React, { useState } from 'react';
import { ArrowRight, Check, Loader2, Mail, MapPin } from 'lucide-react';

const TOPICS = [
  { value: 'plans', label: 'Plans and pricing' },
  { value: 'enterprise', label: 'Enterprise or multiple locations' },
  { value: 'setup', label: 'Help getting set up' },
  { value: 'problem', label: "Something isn't working" },
  { value: 'other', label: 'Something else' },
];

// What makes the first reply useful. Written for someone who is not sure what to say.
const INCLUDE = [
  'Your organization and where you are.',
  'How many locations and volunteers you have.',
  'What you use today: paper, spreadsheets, or something else.',
];

const field =
  'block w-full rounded-xl border border-[#E7E5E4] bg-white px-4 py-3 text-[15px] text-[#1C1917] outline-none transition-colors placeholder:text-[#A8A29E] hover:border-[#D6D3D1] focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/15';
const label = 'mb-1.5 block text-[13px] font-medium text-[#1C1917]';

export default function ContactSection({ initialTopic = 'plans' }) {
  const [form, setForm] = useState({ name: '', organization: '', email: '', topic: initialTopic, message: '', website: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setStatus('sent');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  return (
    <section className="bg-[#FCFAF7] pt-36 pb-12 sm:pt-40 sm:pb-16 lg:pt-48 lg:pb-20 overflow-x-clip">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">

        <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16 lg:mb-20">
          <h1
            className="stagger-animate opacity-0 text-balance font-serif text-[1.75rem] leading-[1.18] text-hero-main sm:text-4xl md:text-5xl"
            style={{ willChange: 'transform, opacity, filter' }}
          >
            Talk to us
          </h1>
          <p
            className="stagger-animate opacity-0 mx-auto mt-5 max-w-2xl text-[15.5px] font-light leading-[1.6] text-hero-muted sm:text-lg sm:leading-relaxed"
            style={{ animationDelay: '0.15s', willChange: 'transform, opacity, filter' }}
          >
            Questions about plans, your setup, or whether Food Arca fits your pantry? Send us a note and we will reply by email.
          </p>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">

          {/* --- What to know --- */}
          <div
            className="stagger-animate opacity-0 order-2 space-y-10 lg:order-1"
            style={{ animationDelay: '0.2s', willChange: 'transform, opacity, filter' }}
          >
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B95B3E]/10 text-[#B95B3E]">
                  <Mail size={18} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-[#1C1917]">Email</p>
                  <a href="mailto:sales@foodarca.com" className="text-[15px] text-[#B95B3E] hover:text-[#9A4A30]">
                    sales@foodarca.com
                  </a>
                  <p className="mt-1 text-[14px] font-light leading-relaxed text-hero-muted">
                    Plans, setup and anything else. The form sends to the same inbox.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B95B3E]/10 text-[#B95B3E]">
                  <MapPin size={18} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-[#1C1917]">Based in</p>
                  <p className="text-[15px] text-hero-muted">Greensboro, North Carolina, USA</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-[1.35rem] text-hero-main">What helps us answer well</h2>
              <ul className="mt-4 space-y-3">
                {INCLUDE.map((line) => (
                  <li key={line} className="flex items-start gap-3 text-[15px] leading-snug text-[#57534E]">
                    <Check size={16} strokeWidth={2.25} className="mt-[2px] shrink-0 text-[#B95B3E]" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[#E7E5E4] pt-8">
              <h2 className="font-serif text-[1.35rem] text-hero-main">Looking for something else?</h2>
              <ul className="mt-4 space-y-2.5 text-[15px]">
                <li><a href="/pricing" className="font-semibold text-[#B95B3E] hover:text-[#9A4A30]">See plans and pricing</a></li>
                <li><a href="/how-it-works" className="font-semibold text-[#B95B3E] hover:text-[#9A4A30]">See how Food Arca works</a></li>
                <li><a href="/terms" className="font-semibold text-[#B95B3E] hover:text-[#9A4A30]">Read the terms</a></li>
              </ul>
            </div>
          </div>

          {/* --- Form --- */}
          <div
            className="stagger-animate opacity-0 order-1 rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] sm:p-9 lg:order-2"
            style={{ animationDelay: '0.3s', willChange: 'transform, opacity, filter' }}
          >
            {status === 'sent' ? (
              <div className="py-10 text-center" role="status">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#B95B3E]/10 text-[#B95B3E]">
                  <Check size={22} strokeWidth={2.5} />
                </span>
                <h2 className="mt-5 font-serif text-2xl text-hero-main">Thanks, we got your message</h2>
                <p className="mx-auto mt-3 max-w-sm text-[15px] font-light leading-relaxed text-hero-muted">
                  We will reply to {form.email}. If you do not see it, check your spam folder.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className={label}>Your name</label>
                    <input id="contact-name" type="text" autoComplete="name" required maxLength={100} value={form.name} onChange={set('name')} className={field} />
                  </div>
                  <div>
                    <label htmlFor="contact-org" className={label}>Organization <span className="font-normal text-[#A8A29E]">(optional)</span></label>
                    <input id="contact-org" type="text" autoComplete="organization" maxLength={150} value={form.organization} onChange={set('organization')} className={field} />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-email" className={label}>Email</label>
                  <input id="contact-email" type="email" autoComplete="email" required maxLength={200} value={form.email} onChange={set('email')} className={field} />
                </div>

                <div>
                  <label htmlFor="contact-topic" className={label}>What is this about?</label>
                  <select id="contact-topic" value={form.topic} onChange={set('topic')} className={field}>
                    {TOPICS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className={label}>Message</label>
                  <textarea id="contact-message" rows={6} required maxLength={4000} value={form.message} onChange={set('message')} className={`${field} resize-y`} />
                </div>

                {/* Real visitors never see or fill this; bots often do. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="contact-website">Website</label>
                  <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
                </div>

                {error && (
                  <p role="alert" className="rounded-xl bg-[#fef2f2] px-4 py-3 text-[13.5px] text-[#dc2626]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-3 font-inter text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(217,119,87,0.6)] disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 size={17} className="animate-spin" /> Sending
                    </>
                  ) : (
                    <>
                      Send message
                      <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
