// app/(marketing)/pricing/page.jsx
import PricingSection from '@/components/Frontend/Pricing/PricingSection';
import FAQSection from '@/components/Frontend/common/Faq';
import FinalCTASection from '@/components/Frontend/common/FinalCTASection';
import GlobalScrollObserver from '@/components/Frontend/common/GlobalScrollObserver';

const TITLE = 'Pricing | Food Arca';
const DESCRIPTION = 'Start free with up to 150 items. Move to a paid plan when your pantry needs more items or more team members.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/pricing' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/pricing' },
  twitter: { title: TITLE, description: DESCRIPTION },
};

// Plain questions about plans. Every answer is something the app really does: limits come from
// lib/plans.js, and plan changes happen in Settings, Billing, by the account owner.
const PRICING_FAQS = [
  {
    question: 'Can we start without paying?',
    answer: 'Yes. The free plan lets you track up to 150 items for one user, so you can set up your inventory and see if it fits before you spend anything.',
  },
  {
    question: 'What counts as an item?',
    answer: 'An item is a distinct product you keep in your inventory, such as black beans or brown rice. Each plan sets how many you can track.',
  },
  {
    question: 'How do we change plans?',
    answer: 'Sign in, open Settings, then Billing, and pick a plan. Only the account owner can change the plan for your organization.',
  },
  {
    question: 'We run more than one location. What should we choose?',
    answer: 'The Enterprise plan supports multiple locations and unlimited team members. Contact us and we will talk through your setup.',
  },
];

export default function PricingPage() {
  return (
    <div className="bg-[#FCFAF7] text-[#1C1917] selection:bg-[#D97757] selection:text-white overflow-x-clip">
      <PricingSection />
      <FAQSection items={PRICING_FAQS} heading="Pricing questions" className="pt-8 sm:pt-12 lg:pt-16" />
      <FinalCTASection />
      <GlobalScrollObserver />
    </div>
  );
}
