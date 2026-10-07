// app/(marketing)/terms/page.jsx
import LegalDocument, { B, H3, P, UL } from '@/components/Frontend/Legal/LegalDocument';
import GlobalScrollObserver from '@/components/Frontend/common/GlobalScrollObserver';
import { SITE } from '@/lib/site';

const TITLE = 'Terms of Service | Food Arca';
const DESCRIPTION = 'The terms that apply when you use Food Arca: your account, your data, subscriptions, acceptable use, and the limits of our responsibility.';
const UPDATED = 'October 7, 2026';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/terms' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/terms' },
  twitter: { title: TITLE, description: DESCRIPTION },
};

const link = 'text-[#B95B3E] hover:text-[#9A4A30]';

// Keep this consistent with the Privacy Policy. If plans, billing or the services we rely on change,
// update sections 4, 5 and 8 here and bump UPDATED.
const SUMMARY = [
  'By creating an account or using Food Arca, you agree to these terms and to our Privacy Policy.',
  'Your data stays yours. We use it only to run the service for you, and we never sell it.',
  'You are responsible for your account, your team, and what you enter into Food Arca.',
  'Paid plans renew monthly through Stripe and you can cancel at any time.',
  'Food Arca helps you keep track of stock. It does not replace your own food safety checks.',
  'The service is provided as is, and our liability is limited as described below.',
];

const SECTIONS = [
  {
    id: 'agreement',
    title: 'Agreement to these terms',
    body: (
      <>
        <P>
          These Terms of Service (&ldquo;Terms&rdquo;) are an agreement between you and {SITE.legalName}, which operates Food Arca (&ldquo;Food Arca,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). They apply to our website at foodarca.com and to the Food Arca app and related services (together, the &ldquo;Service&rdquo;).
        </P>
        <P>
          By creating an account, signing in, or using the Service, you agree to these Terms and to our <a href="/privacy" className={link}>Privacy Policy</a>. If you are using Food Arca on behalf of an organization, you confirm that you have authority to accept these Terms for it, and &ldquo;you&rdquo; includes that organization. If you do not agree, please do not use the Service.
        </P>
      </>
    ),
  },
  {
    id: 'service',
    title: 'What Food Arca is',
    body: (
      <>
        <P>
          Food Arca is inventory software for food banks, food pantries and similar organizations. It lets you track stock, scan barcodes, log donations and distributions, and work with your team.
        </P>
        <P>
          We are always improving the Service. We may add, change or remove features, and we will try to give notice of changes that significantly affect you. Some features may be limited to certain plans.
        </P>
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'Accounts and eligibility',
    body: (
      <>
        <UL>
          <li>You must be at least 18 years old to create an account.</li>
          <li>Give us accurate information and keep it up to date.</li>
          <li>You can sign in with Google or with an email address. Keep your sign-in credentials secure and do not share them.</li>
          <li>You are responsible for activity under your account, including activity by team members you invite. Tell us promptly if you think your account has been accessed without permission.</li>
        </UL>
        <P>
          The person who creates an organization is its administrator and decides who joins it and what role each person has. Administrators are responsible for removing people who should no longer have access.
        </P>
      </>
    ),
  },
  {
    id: 'your-data',
    title: 'Your data',
    body: (
      <>
        <P>
          <B>It belongs to you.</B> You keep all rights to the inventory, records and other content you enter into Food Arca (&ldquo;Your Data&rdquo;). We do not claim ownership of it.
        </P>
        <P>
          <B>What we may do with it.</B> You give us permission to host, process, back up and display Your Data only as needed to run, secure, support and improve the Service for you, as described in our Privacy Policy. We do not sell Your Data or use it for advertising.
        </P>
        <P>
          <B>What you are responsible for.</B> You are responsible for what you enter, and for having the right to enter it. If you record information about the people your organization serves, you must do so lawfully and only as your work requires. Please do not enter highly sensitive information such as Social Security numbers, financial account numbers, health information or immigration status.
        </P>
        <P>
          <B>Exporting and deleting.</B> You can ask us to export or delete Your Data at any time. See the Privacy Policy for details on how long we keep information after you close your account.
        </P>
      </>
    ),
  },
  {
    id: 'plans',
    title: 'Plans, billing and cancellation',
    body: (
      <>
        <P>
          Food Arca offers a free plan and paid plans, with limits on items, team members and features that are shown on our <a href="/pricing" className={link}>pricing page</a>. Larger organizations can ask us about custom plans.
        </P>
        <UL>
          <li><B>Payment.</B> Paid plans are billed monthly in advance through Stripe, our payment processor. We do not see or store your full card number.</li>
          <li><B>Renewal.</B> Paid plans renew automatically each month at the then-current price until you cancel.</li>
          <li><B>Cancelling.</B> You can cancel at any time. Your plan stays active until the end of the period you have already paid for, and then moves to the free plan or closes. We do not charge a cancellation fee.</li>
          <li><B>Refunds.</B> Payments are generally non-refundable, except where the law requires otherwise or where we decide a refund is appropriate. If something looks wrong with a charge, contact us and we will look into it.</li>
          <li><B>Price changes.</B> If we change the price of a plan, we will give you notice before the new price applies to you.</li>
          <li><B>Plan limits.</B> If you go over the limits of your plan, we may ask you to upgrade before you can add more.</li>
          <li><B>Taxes.</B> Prices do not include any taxes that may apply. You are responsible for them.</li>
        </UL>
      </>
    ),
  },
  {
    id: 'use',
    title: 'Acceptable use',
    body: (
      <>
        <P>You agree not to:</P>
        <UL>
          <li>use the Service for anything unlawful, or to harm, harass or defraud anyone;</li>
          <li>try to access another organization&apos;s data, or any part of the Service you have not been given access to;</li>
          <li>probe, scan or test the Service for weaknesses, or bypass its security, without our written permission;</li>
          <li>interfere with or overload the Service, or introduce malware;</li>
          <li>copy, resell, reverse engineer or build a competing product from the Service, except where the law allows;</li>
          <li>use automated tools such as bots or scrapers to access the Service, except through interfaces we provide; or</li>
          <li>upload content that you do not have the right to share, or that infringes someone else&apos;s rights.</li>
        </UL>
        <P>
          If you find a security problem, please tell us at <a href={`mailto:${SITE.email}`} className={link}>{SITE.email}</a> so we can fix it.
        </P>
      </>
    ),
  },
  {
    id: 'safety',
    title: 'Food safety and your decisions',
    body: (
      <>
        <P>
          Food Arca is a record-keeping tool. It does not inspect food and it is not a food safety system. Food information in the app, such as product names, barcodes, ingredients, allergens or dates, may come from you, from your team, or from public databases such as Open Food Facts, and it may be incomplete or out of date.
        </P>
        <P>
          You remain responsible for checking expiration dates, recalls, storage conditions, labeling and allergens, and for following the food safety rules that apply to your organization. Please do not rely on Food Arca alone for those decisions.
        </P>
      </>
    ),
  },
  {
    id: 'ours',
    title: 'Our property',
    body: (
      <>
        <P>
          The Service, including its software, design, text, graphics and the Food Arca name and logo, belongs to Food Arca and is protected by law. While you follow these Terms, we give you a limited, non-exclusive, non-transferable right to use the Service for your organization&apos;s own internal purposes. We keep all other rights.
        </P>
        <P>
          If you send us feedback or ideas, we may use them to improve the Service without owing you anything. We will not use them to identify you or your organization without your permission.
        </P>
      </>
    ),
  },
  {
    id: 'third-parties',
    title: 'Third-party services',
    body: (
      <>
        <P>
          The Service works with services from other companies, such as Google for sign-in and analytics, Stripe for payments, and others listed in our <a href="/privacy" className={link}>Privacy Policy</a>. Your use of those services may be subject to their own terms. We are not responsible for services we do not control. The Service may also link to other websites, which we do not control either.
        </P>
      </>
    ),
  },
  {
    id: 'availability',
    title: 'Availability and changes',
    body: (
      <>
        <P>
          We work to keep Food Arca available and your data safe, but we cannot promise the Service will always be uninterrupted or error-free. It may be unavailable from time to time for maintenance, updates, or reasons outside our control. We recommend that you keep your own copy of anything critical, for example with the data export where your plan includes it.
        </P>
      </>
    ),
  },
  {
    id: 'termination',
    title: 'Ending your use',
    body: (
      <>
        <P>
          You can stop using Food Arca and close your account at any time. Ending your account does not erase amounts you already owe.
        </P>
        <P>
          We may suspend or close an account if you break these Terms, if your use puts the Service or other people at risk, if you do not pay, or if the law requires it. Where we reasonably can, we will tell you why and give you a chance to fix the problem first. If we close your account, you can ask for an export of Your Data for a reasonable time afterward, unless the law prevents us from providing it.
        </P>
        <P>
          Sections that by their nature should continue after your account ends, such as those on ownership, disclaimers, liability and disputes, continue to apply.
        </P>
      </>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    body: (
      <>
        <P>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE.&rdquo; TO THE FULLEST EXTENT THE LAW ALLOWS, FOOD ARCA DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE, UNINTERRUPTED OR COMPLETELY SECURE, OR THAT INFORMATION IN IT IS ACCURATE OR COMPLETE.
        </P>
        <P>
          Some places do not allow certain disclaimers, so some of the above may not apply to you.
        </P>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Limit of liability',
    body: (
      <>
        <P>
          TO THE FULLEST EXTENT THE LAW ALLOWS, FOOD ARCA AND ITS OWNERS, OFFICERS, EMPLOYEES AND CONTRACTORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA OR GOODWILL, ARISING OUT OF OR RELATED TO THE SERVICE OR THESE TERMS, EVEN IF WE HAVE BEEN TOLD THEY ARE POSSIBLE.
        </P>
        <P>
          OUR TOTAL LIABILITY FOR ANY CLAIM RELATED TO THE SERVICE OR THESE TERMS IS LIMITED TO THE GREATER OF (A) THE AMOUNT YOU PAID US FOR THE SERVICE IN THE 12 MONTHS BEFORE THE CLAIM AROSE, OR (B) ONE HUNDRED U.S. DOLLARS ($100).
        </P>
        <P>
          Nothing in these Terms limits liability that cannot be limited by law, such as liability for fraud or willful misconduct.
        </P>
      </>
    ),
  },
  {
    id: 'indemnity',
    title: 'Your responsibility for your use',
    body: (
      <>
        <P>
          To the extent the law allows, you agree to defend and reimburse Food Arca for claims, losses and reasonable costs that come from your breach of these Terms, from Your Data, or from your violation of the law or another person&apos;s rights in using the Service. We will tell you promptly about any such claim and cooperate reasonably in the defense.
        </P>
      </>
    ),
  },
  {
    id: 'law',
    title: 'Governing law and disputes',
    body: (
      <>
        <P>
          These Terms are governed by the laws of the State of North Carolina, USA, without regard to its conflict-of-law rules. Before starting any formal action, please contact us so we can try to resolve the issue informally. If that does not work, any dispute will be brought in the state or federal courts located in North Carolina, and you and we agree to their jurisdiction.
        </P>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <>
        <P>
          We may update these Terms from time to time. When we make a material change, we will update the date at the top of this page and, where appropriate, notify you by email or in the app. If you keep using the Service after a change takes effect, you accept the updated Terms. If you do not agree to a change, you can close your account.
        </P>
      </>
    ),
  },
  {
    id: 'general',
    title: 'General',
    body: (
      <>
        <UL>
          <li>These Terms and the Privacy Policy are the whole agreement between you and Food Arca about the Service.</li>
          <li>If a part of these Terms cannot be enforced, the rest still applies.</li>
          <li>If we do not enforce something right away, that does not mean we give up the right to do so later.</li>
          <li>You may not transfer your rights under these Terms without our consent. We may transfer ours as part of a merger, sale or reorganization.</li>
        </UL>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <>
        <P>Questions about these Terms? Write to us and we will reply.</P>
        <div className="mt-5 rounded-2xl border border-[#E7E5E4] bg-white p-6 text-[15px] leading-relaxed">
          <p className="font-semibold text-[#1C1917]">{SITE.legalName}</p>
          <p>Operating Food Arca</p>
          <p>
            Email:{' '}
            <a href={`mailto:${SITE.email}`} className={link}>{SITE.email}</a>
          </p>
          <p>Location: Greensboro, North Carolina, USA</p>
          <p className="mt-3">
            Or use the <a href="/contact" className={link}>contact page</a>.
          </p>
        </div>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="bg-[#FCFAF7] text-[#1C1917] selection:bg-[#D97757] selection:text-white overflow-x-clip">
      <LegalDocument
        title="Terms of Service"
        subtitle="The agreement between you and Food Arca. In plain language."
        updated={UPDATED}
        summary={SUMMARY}
        sections={SECTIONS}
      />
      <GlobalScrollObserver />
    </div>
  );
}
