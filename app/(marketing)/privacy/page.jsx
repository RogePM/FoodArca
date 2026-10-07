// app/(marketing)/privacy/page.jsx
import LegalDocument, { B, H3, P, UL } from '@/components/Frontend/Legal/LegalDocument';
import GlobalScrollObserver from '@/components/Frontend/common/GlobalScrollObserver';
import { SITE } from '@/lib/site';

const TITLE = 'Privacy Policy | Food Arca';
const DESCRIPTION = 'What information Food Arca collects, how we use and protect it, who we share it with, and the choices you have. We never sell personal information.';
const UPDATED = 'October 6, 2026';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/privacy' },
  twitter: { title: TITLE, description: DESCRIPTION },
};

// Written against what the app does today. If you add a new service that touches personal data
// (a new analytics tool, a new email or payment provider), add it to sections 3 and 6 and bump UPDATED.
const SUMMARY = [
  'We collect the account details you give us (or that Google provides), the information you enter about your organization and inventory, and basic usage data.',
  'We never sell personal information, and we do not use it for advertising or to make a profit.',
  'We use your information to run Food Arca, keep it secure, support you, and make it better.',
  'We use trusted service providers (for sign-in, storage, payments, email and analytics) only to operate the service.',
  'We use Google Analytics to measure how the site performs. It is not used for advertising.',
  'You can ask us to access, correct, export or delete your information at any time.',
];

const SECTIONS = [
  {
    id: 'about',
    title: 'Who we are and what this covers',
    body: (
      <>
        <P>
          Food Arca is a product of {SITE.legalName} (&ldquo;Food Arca,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), which makes inventory software for food banks and food pantries. This policy explains what personal information we collect when you visit foodarca.com or use the Food Arca app, how we use it, and the choices you have.
        </P>
        <P>
          It applies to our website, the app, and anything you send us by email or through our contact form. It is part of our <a href="/terms" className="text-[#B95B3E] hover:text-[#9A4A30]">Terms of Service</a>. By creating an account or using Food Arca, you agree to this policy. If you do not agree, please do not use the service.
        </P>
      </>
    ),
  },
  {
    id: 'roles',
    title: 'Your organization and your records',
    body: (
      <>
        <P>
          The inventory and records you enter belong to your organization. We handle them only to run the service for you and follow your instructions. Your organization decides what to enter and who on your team can see it.
        </P>
        <P>
          If you are someone a pantry has served, and your name is in a pantry&apos;s records, that pantry (not Food Arca) decides what is recorded about you. Contact the pantry to see or correct your information. If you write to us, we will pass your request to the pantry and help where we can.
        </P>
      </>
    ),
  },
  {
    id: 'collect',
    title: 'Information we collect',
    body: (
      <>
        <H3>Account information</H3>
        <P>
          When you sign in with Google, Google shares your name, email address and profile picture with us. When you sign up with an email address, we collect your email and any name you add. Passwords are handled by our authentication provider. We never see or store your password in readable form.
        </P>

        <H3>Organization information</H3>
        <P>
          Your organization&apos;s name, the names and addresses of your locations, your time zone, and optional details such as a logo, brand color and tax ID (EIN) if you choose to add them.
        </P>

        <H3>Inventory and activity</H3>
        <P>
          Items, barcodes, quantities, expiration dates, storage locations, weights, notes, and a history of changes with who made them and when. If you record donations, this can include the donor&apos;s name, unless you mark the donation anonymous.
        </P>

        <H3>Distribution records</H3>
        <P>
          If you log visits or distributions, the records can include the names of people served and notes you add. Only enter what your work needs. Please do not enter highly sensitive information such as Social Security numbers, financial account numbers, health information or immigration status.
        </P>

        <H3>Team invitations</H3>
        <P>When you invite someone, we store their email address and the role you give them, and we send them the invitation email.</P>

        <H3>Messages to us</H3>
        <P>When you use the contact form or email us, we collect your name, organization, email address and message so we can reply.</P>

        <H3>Payments</H3>
        <P>
          Paid plans are processed by Stripe. Your card details go directly to Stripe. We do not see or store full card numbers. We keep your plan, billing status and Stripe customer identifiers.
        </P>

        <H3>Technical and usage information</H3>
        <P>
          When you use the site or app, we and our analytics provider receive information such as your IP address, browser and device type, the pages you view, and when. This is collected through cookies and similar technologies (see section 7), and in server logs used to keep the service running and secure.
        </P>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use information',
    body: (
      <>
        <P>We use the information we collect to:</P>
        <UL>
          <li>Provide the app: create your account, keep your inventory, and show your team the same live stock.</li>
          <li>Keep Food Arca secure, prevent abuse and fraud, and verify who is signing in.</li>
          <li>Send service messages, such as team invitations, account and billing notices, and replies to your questions.</li>
          <li>Give you support and fix bugs.</li>
          <li>Understand how the site and app perform, and improve them for the people who use them.</li>
          <li>Meet our legal obligations and enforce our terms.</li>
        </UL>
        <P>
          We do <B>not</B> use your information for advertising, we do not build advertising profiles, and we do not use the records of people your organization serves for anything other than providing the service to you.
        </P>
      </>
    ),
  },
  {
    id: 'sell',
    title: 'We do not sell your information',
    body: (
      <>
        <P>
          We do not sell personal information, and we do not share it with data brokers, advertisers or marketing companies. We do not rent it or trade it. We do not earn money from your data. We earn money only from paid plans.
        </P>
        <P>
          Your organization&apos;s data is kept separate from every other organization&apos;s data. Other Food Arca customers cannot see it.
        </P>
        <P>
          The only times information leaves our control are the limited cases in section 6, such as the service providers that help us run the app, or when the law requires it.
        </P>
      </>
    ),
  },
  {
    id: 'share',
    title: 'Who we share information with',
    body: (
      <>
        <H3>Service providers</H3>
        <P>
          We use a small number of companies to run Food Arca. They may handle personal information only to do their job for us, and they are not allowed to use it for their own purposes.
        </P>
        <UL>
          <li><B>Supabase</B> hosts our database and handles sign-in and file storage.</li>
          <li><B>Google</B> provides Google sign-in and, through Google Analytics, site and app analytics.</li>
          <li><B>Stripe</B> processes payments for paid plans.</li>
          <li><B>Resend</B> delivers the emails we send, such as invitations and replies.</li>
          <li><B>Open Food Facts</B> is an open product database. When you scan a barcode we may look it up there. Only the barcode number is sent, never your account or organization details.</li>
          <li>Our <B>hosting provider</B> serves the website and app.</li>
        </UL>

        <H3>Other people in your organization</H3>
        <P>
          People you invite to your organization can see the information their role allows. Account owners and administrators control who is invited and what each role can do.
        </P>

        <H3>When the law requires it</H3>
        <P>
          We may disclose information if we are legally required to, for example in response to a valid court order or subpoena, or when we believe it is necessary to protect someone&apos;s safety, prevent fraud, or protect our rights. Where the law allows, we will tell you first and share no more than is required.
        </P>

        <H3>If our business changes</H3>
        <P>
          If Food Arca is merged with or acquired by another company, or sold, your information may transfer as part of that. We would tell you beforehand, and this policy&apos;s protections would continue to apply unless you agreed to something different.
        </P>

        <H3>With your permission</H3>
        <P>We will share information in other ways only if you ask us to or clearly agree to it.</P>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Analytics and cookies',
    body: (
      <>
        <P>
          We use a small number of cookies and similar technologies:
        </P>
        <UL>
          <li><B>Essential cookies</B> keep you signed in and keep your session secure. The app does not work without them.</li>
          <li><B>Analytics cookies</B> come from Google Analytics (GA4). They tell us how many people visit, which pages they use, and how the site performs, so we can improve quality. We use this information in aggregate. It is not used for advertising.</li>
        </UL>
        <P>
          You can block or delete cookies in your browser settings. You can also opt out of Google Analytics with Google&apos;s{' '}
          <a href="https://tools.google.com/dlpage/gaoptout" className="text-[#B95B3E] hover:text-[#9A4A30]" rel="noopener noreferrer" target="_blank">browser add-on</a>.
          Blocking essential cookies will stop sign-in from working.
        </P>
        <P>
          Because we do not sell personal information or use it for targeted advertising, there is nothing for a &ldquo;Do Not Track&rdquo; or Global Privacy Control signal to switch off.
        </P>
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we protect your information',
    body: (
      <>
        <P>Security is our top concern. We protect your information in layers:</P>
        <UL>
          <li>Information is encrypted in transit (HTTPS) and encrypted at rest by our infrastructure providers.</li>
          <li>Each organization&apos;s data is separated from others by access rules in the database, so one organization cannot read another&apos;s.</li>
          <li>Roles inside your organization limit what each team member can see and do.</li>
          <li>Sign-in is handled by established providers (Google and Supabase Authentication), and we do not store readable passwords.</li>
          <li>Only a small number of authorized people at Food Arca can access production systems.</li>
        </UL>
        <P>
          No system is completely secure, and we cannot guarantee absolute security. If a breach affects your information, we will notify you and the authorities as the law requires.
        </P>
      </>
    ),
  },
  {
    id: 'staff',
    title: 'When our team can see your data',
    body: (
      <>
        <P>
          Our team can see administrator account details (such as name and email) to manage accounts. We do not look through your inventory or the records of people you serve as a matter of course.
        </P>
        <P>
          We will access your records only when you ask us to in a support request, or when it is strictly necessary to find and fix a serious bug, keep the service secure, or meet a legal obligation. When we do, we look at no more than we need.
        </P>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep information',
    body: (
      <>
        <P>
          We keep your information for as long as your account is active, and as long as we need it to provide the service. When you close your account or ask us to delete your information, we delete or de-identify it within a reasonable time. Copies in routine backups are removed as the backups expire.
        </P>
        <P>
          We may keep limited information longer if the law requires it (for example, billing records), or to resolve disputes and enforce our terms.
        </P>
      </>
    ),
  },
  {
    id: 'rights',
    title: 'Your choices and rights',
    body: (
      <>
        <P>You can ask us to:</P>
        <UL>
          <li>Tell you what personal information we hold about you, and give you a copy.</li>
          <li>Correct information that is wrong.</li>
          <li>Delete your information or close your account.</li>
          <li>Export your inventory data (available in the app on plans that include export).</li>
          <li>Stop using your information for a purpose you object to.</li>
        </UL>
        <P>
          To make a request, email <a href={`mailto:${SITE.email}`} className="text-[#B95B3E] hover:text-[#9A4A30]">{SITE.email}</a> from the address on your account. We may ask you to confirm who you are before we act, and we will respond within the time the law allows (generally within 45 days). You will not be treated differently for using these rights.
        </P>
        <P>
          Depending on where you live, such as California, Colorado, Virginia, Connecticut and other states with privacy laws, you may have additional rights, including the right to appeal if we decline a request. We do not sell personal information or share it for targeted advertising, so there is nothing to opt out of in that respect.
        </P>
        <P>
          Food Arca is run from the United States for organizations here. If you use it from elsewhere, your information will be processed in the United States.
        </P>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: (
      <P>
        Food Arca is built for staff and volunteers at food organizations and is not directed to children under 16. We do not knowingly collect personal information from children. If you believe a child has given us information, contact us and we will delete it.
      </P>
    ),
  },
  {
    id: 'links',
    title: 'Other websites',
    body: (
      <P>
        Our site may link to websites we do not run. We are not responsible for their privacy practices, so please read their policies.
      </P>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <P>
        We may update this policy as Food Arca changes. When we do, we will change the date at the top. If a change is significant, we will also tell account owners by email or in the app before it takes effect. If you keep using Food Arca after a change, you accept the updated policy.
      </P>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <>
        <P>Questions or requests about privacy? Write to us and we will reply.</P>
        <div className="mt-5 rounded-2xl border border-[#E7E5E4] bg-white p-6 text-[15px] leading-relaxed">
          <p className="font-semibold text-[#1C1917]">{SITE.legalName}</p>
          <p>Operating Food Arca</p>
          <p>
            Email:{' '}
            <a href={`mailto:${SITE.email}`} className="text-[#B95B3E] hover:text-[#9A4A30]">{SITE.email}</a>
          </p>
          <p>Location: Greensboro, North Carolina, USA</p>
          <p className="mt-3">
            Or use the <a href="/contact" className="text-[#B95B3E] hover:text-[#9A4A30]">contact page</a>.
          </p>
        </div>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-[#FCFAF7] text-[#1C1917] selection:bg-[#D97757] selection:text-white overflow-x-clip">
      <LegalDocument
        title="Privacy Policy"
        subtitle="What we collect, why, how we protect it, and the choices you have. In plain language."
        updated={UPDATED}
        summary={SUMMARY}
        sections={SECTIONS}
      />
      <GlobalScrollObserver />
    </div>
  );
}
