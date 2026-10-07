import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Public contact form. It emails the message to the team inbox, with the visitor's address as
// the reply-to, so answering from the inbox goes straight back to them.
const TO = 'sales@foodarca.com';
// Sent from the same verified domain as the invite emails.
const FROM = 'Food Arca <invites@foodarca.com>';

const TOPICS = {
  plans: 'Plans and pricing',
  enterprise: 'Enterprise or multiple locations',
  setup: 'Help getting set up',
  problem: "Something isn't working",
  other: 'Something else',
};

const MAX = { name: 100, organization: 150, email: 200, message: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A small per-address limit so the form can't be used to flood the inbox. It lives in memory, so
// it resets on a restart and is per server instance: a speed bump, not a guarantee.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function tooMany(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) {
    for (const [key, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  }
  return recent.length > MAX_PER_WINDOW;
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Please fill in the form and try again.' }, { status: 400 });

    // Hidden field that real visitors never fill in. Pretend it worked so bots move on.
    if (clean(body.website, 200)) return NextResponse.json({ success: true });

    const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    if (tooMany(ip)) {
      return NextResponse.json({ error: 'You have sent a few messages already. Please try again in a little while.' }, { status: 429 });
    }

    const name = clean(body.name, MAX.name);
    const organization = clean(body.organization, MAX.organization);
    const email = clean(body.email, MAX.email);
    const message = clean(body.message, MAX.message);
    const topic = TOPICS[body.topic] ? body.topic : 'other';

    if (!name) return NextResponse.json({ error: 'Please add your name.' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Please enter a valid email so we can reply.' }, { status: 400 });
    if (message.length < 10) return NextResponse.json({ error: 'Please tell us a little more in your message.' }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('MISSING ENV: RESEND_API_KEY');
      return NextResponse.json({ error: `We could not send that just now. Please email ${TO} instead.` }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `[Contact] ${TOPICS[topic]}: ${name}${organization ? `, ${organization}` : ''}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917;">
          <h2 style="margin: 0 0 16px;">New message from the website</h2>
          <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
            <tr><td style="padding: 4px 12px 4px 0; color: #78716c;">Name</td><td>${esc(name)}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #78716c;">Organization</td><td>${esc(organization) || '-'}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #78716c;">Email</td><td>${esc(email)}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #78716c;">Topic</td><td>${esc(TOPICS[topic])}</td></tr>
          </table>
          <p style="margin: 20px 0 6px; color: #78716c; font-size: 13px;">Message</p>
          <div style="white-space: pre-wrap; background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 14px; font-size: 14px; line-height: 1.5;">${esc(message)}</div>
        </div>
      `,
    });

    if (error) {
      console.error('Contact form: Resend error', error);
      return NextResponse.json({ error: `We could not send that just now. Please email ${TO} instead.` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact form crash:', err);
    return NextResponse.json({ error: `Something went wrong. Please email ${TO} instead.` }, { status: 500 });
  }
}
