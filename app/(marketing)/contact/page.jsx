// app/(marketing)/contact/page.jsx
import ContactSection from '@/components/Frontend/Contact/ContactSection';
import FAQSection from '@/components/Frontend/common/Faq';
import JsonLd from '@/components/Frontend/common/JsonLd';
import GlobalScrollObserver from '@/components/Frontend/common/GlobalScrollObserver';
import { SITE_URL } from '@/lib/site';

const TITLE = 'Contact | Food Arca';
const DESCRIPTION = 'Questions about plans, setup, or whether Food Arca fits your pantry? Send us a message and we will reply by email.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/contact' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/contact' },
  twitter: { title: TITLE, description: DESCRIPTION },
};

// Plain answers, each one true of the product today. Plan limits come from lib/plans.js.
const CONTACT_FAQS = [
  {
    question: 'Do we have to be a food bank to use Food Arca?',
    answer:
      'Food Arca is built for food banks and food pantries, including small single-site pantries and multi-location networks. If you track donated or distributed food, write to us and we will tell you honestly whether it fits.',
  },
  {
    question: 'Can we try it before talking to anyone?',
    answer:
      'Yes. The free plan lets you track up to 150 items for one user, with no need to contact us first. Use "Try for free" to set up your inventory and see how it works.',
  },
  {
    question: 'What happens after I send a message?',
    answer:
      'Your message goes to our team inbox and we reply by email to the address you gave. If you ask about Enterprise or several locations, we will ask a few questions about your setup so we can point you to the right plan.',
  },
  {
    question: 'Something is not working in my account. Where should I write?',
    answer:
      'Use the form above and choose "Something isn\'t working". Tell us what you were doing and what you saw, and include your organization name so we can find your account.',
  },
];

const TOPICS = ['plans', 'enterprise', 'setup', 'problem', 'other'];

// /contact?topic=enterprise opens the form with that topic already chosen (the pricing page uses it).
export default async function ContactPage({ searchParams }) {
  const params = await searchParams;
  const topic = TOPICS.includes(params?.topic) ? params.topic : 'plans';

  const contactPage = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: TITLE,
    url: `${SITE_URL}/contact`,
    description: DESCRIPTION,
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: CONTACT_FAQS.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  return (
    <div className="bg-[#FCFAF7] text-[#1C1917] selection:bg-[#D97757] selection:text-white overflow-x-clip">
      <JsonLd data={contactPage} />
      <JsonLd data={faqPage} />
      <ContactSection initialTopic={topic} />
      <FAQSection items={CONTACT_FAQS} heading="Before you write" className="pt-12 sm:pt-16 lg:pt-20" />
      <GlobalScrollObserver />
    </div>
  );
}
