// app/(marketing)/how-it-works/page.jsx
import { Check } from 'lucide-react';
import JobScene from '@/components/Frontend/HowItWorks/JobScene';
import HeroActions from '@/components/Frontend/HowItWorks/HeroActions';
import FAQSection from '@/components/Frontend/common/Faq';
import FinalCTASection from '@/components/Frontend/common/FinalCTASection';
import GlobalScrollObserver from '@/components/Frontend/common/GlobalScrollObserver';

const TITLE = 'How it works | Food Arca';
const DESCRIPTION = 'How Food Arca works for a food pantry: set up your team, scan food in, give it out in seconds, and always know what you have and what is about to expire.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/how-it-works' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/how-it-works' },
  twitter: { title: TITLE, description: DESCRIPTION },
};

const reveal = 'stagger-animate opacity-0';
const willChange = { willChange: 'transform, opacity, filter' };

// Everything here describes what the app does today (onboarding, add flow, distribution, dashboard, export).
// Plan limits come from lib/plans.js. If a step changes in the app, change it here.
const SETUP = [
  {
    title: 'Create your pantry',
    body: 'Give it a name, add your location and your own name. You start on the free plan.',
  },
  {
    title: 'Invite your team',
    body: 'Send an email invite and choose whether each person is a volunteer or an admin. Someone with an invite code can join your team in one step.',
  },
  {
    title: 'Add what you have',
    body: 'Scan the food already on your shelves, or type it in. Your stock is ready to use as soon as it is in.',
  },
];

const JOBS = [
  {
    id: 'bring-in',
    title: 'Bring food in',
    body: 'When a delivery or donation arrives, scan each item with the camera on any phone or tablet. Food Arca fills in what it can, and you confirm the rest.',
    points: [
      { lead: 'Scan or type.', text: 'No barcode, or one it does not know? Enter the item by hand.' },
      { lead: 'Add several at once.', text: 'Put items in your cart, then confirm the whole delivery together.' },
      { lead: 'Know where it came from.', text: 'Record a donation, a food bank, USDA TEFAP, food rescue or a purchase, with expiration date and storage spot.' },
    ],
    scene: 'scan',
    color: '#F2D5C6',
  },
  {
    id: 'give-out',
    title: 'Give it out',
    body: 'On the distribution line, scan what goes in the bag and check out. Stock comes down as you go, with no clipboard and no counting at the end of the day.',
    points: [
      { lead: 'Scan to check out.', text: 'Keep scanning as people move through the line.' },
      { lead: 'No barcode?', text: 'Pick the item from a grid of pictures instead.' },
      { lead: 'No names needed.', text: 'Fast mode checks food out without asking who it is for.' },
    ],
    scene: 'giveout',
    color: '#BFD1C8',
  },
  {
    id: 'stay-in-step',
    title: 'Everyone sees the same stock',
    body: 'Food Arca is a website, so there is nothing to install. When one person adds or gives out food, the count changes on every phone, tablet and laptop right away.',
    points: [
      { lead: 'No stale numbers.', text: 'Two volunteers on two phones are never working from different counts.' },
      { lead: 'Use what you have.', text: 'Any device with a camera and an internet connection works.' },
      { lead: 'Hand a device off.', text: 'A new volunteer can pick it up mid-shift.' },
    ],
    scene: 'devices',
    color: '#D3D1E0',
  },
  {
    id: 'see',
    title: 'See where you stand',
    body: 'The dashboard shows what is in stock and what is close to expiring, so food goes out while it is still good. Every change is logged with who made it and when.',
    points: [
      { lead: 'Catch waste early.', text: 'See what expires in the next seven days, and what already has.' },
      { lead: 'A clear history.', text: 'Look back at everything received, given out or thrown out.' },
      { lead: 'Reports on demand.', text: 'Export your inventory and history as spreadsheets for funders, partners or your board, on plans that include export.' },
    ],
    scene: 'report',
    color: '#F2D5C6',
  },
];

const ROLES = [
  {
    title: 'Volunteers',
    body: 'Do the work on the floor: add food, scan, and check out. The screens are built for a phone in one hand, so a new volunteer can start on their first shift.',
  },
  {
    title: 'Admins',
    body: 'Do all of that, and also run the pantry: invite people to your team, choose who is a volunteer and who is an admin, and manage the plan. The owner handles billing.',
  },
];

const FAQS = [
  {
    question: 'How long does setup take?',
    answer:
      'Creating your pantry takes a few minutes. After that, you can start adding food right away, by scanning it or typing it in.',
  },
  {
    question: 'Do we need special equipment?',
    answer:
      'No. Food Arca runs in a web browser and uses the camera on any smartphone, tablet or laptop. There is nothing to install and no scanner to buy.',
  },
  {
    question: 'What if an item has no barcode?',
    answer:
      'You can add it by hand when food comes in, and pick it from a grid of pictures when you give it out.',
  },
  {
    question: 'Do we have to collect names when we give food out?',
    answer:
      'No. Fast mode checks food out without asking who it is for, so the line keeps moving and you collect nothing you do not need.',
  },
  {
    question: 'Can more than one person use it at the same time?',
    answer:
      'Yes. Everyone on your team sees the same stock as it changes. The free plan is for one person, and paid plans let you invite your team. See the pricing page for the limits.',
  },
  {
    question: 'Can we get our data out?',
    answer:
      'Yes. On plans that include export, you can download your inventory and your full history as spreadsheets (CSV).',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-[#FAFAF9] text-[#1C1917] selection:bg-[#D97757] selection:text-white overflow-x-clip">
      <main>
        {/* Hero: the pitch on the left, one delivery playing out on the right. Cream, like the intro under it. */}
        <section className="bg-[#FCFAF7] pt-28 sm:pt-32 lg:pt-36">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div className="order-1">
                <h1
                  className={`${reveal} text-balance font-serif text-[2.25rem] leading-[1.1] text-hero-main sm:text-5xl lg:text-[3.5rem]`}
                  style={willChange}
                >
                  Your whole pantry, in one place
                </h1>
                <p
                  className={`${reveal} mt-6 max-w-xl text-[16px] font-light leading-[1.6] text-hero-muted sm:text-lg sm:leading-relaxed`}
                  style={{ animationDelay: '0.15s', ...willChange }}
                >
                  Food Arca replaces the clipboard and the spreadsheet. Scan food in, give it out in seconds, and see the same stock on every phone, tablet and laptop.
                </p>
                <div className={`${reveal} mt-9`} style={{ animationDelay: '0.3s', ...willChange }}>
                  <HeroActions />
                </div>
                <p
                  className={`${reveal} mt-5 text-[13px] text-[#78716C]`}
                  style={{ animationDelay: '0.4s', ...willChange }}
                >
                  Free for up to 150 items. Nothing to install.
                </p>
              </div>

              <div className="order-2">
                <JobScene scene="hero" color="#F5F5F4" label="One delivery, from scan to stock" tall />
              </div>
            </div>
          </div>
        </section>

        {/* Intro: setting up, on the same cream */}
        <section id="setup" className="scroll-mt-20 bg-[#FCFAF7] pt-28 pb-28 sm:pt-36 sm:pb-36 lg:pt-44 lg:pb-44">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                className={`${reveal} text-balance font-serif text-[1.75rem] leading-[1.18] text-hero-main sm:text-4xl md:text-5xl`}
                style={willChange}
              >
                Set up once, then it runs
              </h2>
              <p
                className={`${reveal} mx-auto mt-5 max-w-2xl text-[15.5px] font-light leading-[1.6] text-hero-muted sm:text-lg sm:leading-relaxed`}
                style={{ animationDelay: '0.15s', ...willChange }}
              >
                Three quick steps and your team is working from the same stock. After that, it comes down to a few simple jobs: bring food in, give it out, and see where you stand.
              </p>
            </div>

            <ol className="mt-14 grid gap-10 sm:mt-20 md:grid-cols-3 md:gap-8">
              {SETUP.map((step, i) => (
                <li
                  key={step.title}
                  className={`${reveal} border-t border-[#E7E5E4] pt-6`}
                  style={{ animationDelay: `${0.3 + i * 0.12}s` }}
                >
                  <span className="text-xs tabular-nums text-hero-muted">{String(i + 1).padStart(2, '0')}</span>
                  <h2 className="mt-8 font-serif text-xl text-hero-main">{step.title}</h2>
                  <p className="mt-4 text-base font-light leading-relaxed text-hero-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* The everyday jobs, on warm grey */}
        <section className="bg-[#F5F5F4] py-24 sm:py-28 lg:py-32">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16 lg:mb-20">
              <h2
                className={`${reveal} text-balance font-serif text-[1.75rem] leading-[1.18] text-hero-main sm:text-4xl md:text-5xl`}
                style={willChange}
              >
                The everyday jobs
              </h2>
              <p
                className={`${reveal} mx-auto mt-5 max-w-2xl text-[15.5px] font-light leading-[1.6] text-hero-muted sm:text-lg sm:leading-relaxed`}
                style={{ animationDelay: '0.15s', ...willChange }}
              >
                This is what a shift looks like, from the first delivery to the end of the line.
              </p>
            </div>

            <div className="space-y-20 sm:space-y-24 lg:space-y-32">
              {JOBS.map((job, i) => (
                <div key={job.id} id={job.id} className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-2 lg:gap-20">
                  <div className={`${reveal} order-1 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <h3 className="font-serif text-[1.65rem] leading-[1.15] tracking-tight text-hero-main sm:text-[1.9rem]">
                      {job.title}
                    </h3>
                    <p className="mt-4 text-base font-light leading-relaxed text-hero-muted sm:text-[17px]">{job.body}</p>
                    <ul className="mt-6 space-y-4">
                      {job.points.map((point) => (
                        <li key={point.lead} className="flex gap-3 text-[15px]">
                          <Check size={16} strokeWidth={2.25} className="mt-[3px] shrink-0 text-[#B95B3E]" />
                          <span className="text-[#57534E]">
                            <span className="font-semibold text-[#1C1917]">{point.lead}</span> {point.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`order-2 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <JobScene scene={job.scene} color={job.color} label={job.title} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who does what, on cream, flowing into the questions */}
        <section className="bg-[#FCFAF7] pt-24 pb-12 sm:pt-28 lg:pt-32">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16 lg:mb-20">
              <h2
                className={`${reveal} text-balance font-serif text-[1.75rem] leading-[1.18] text-hero-main sm:text-4xl md:text-5xl`}
                style={willChange}
              >
                Simple for volunteers, clear for admins
              </h2>
              <p
                className={`${reveal} mx-auto mt-5 max-w-2xl text-[15.5px] font-light leading-[1.6] text-hero-muted sm:text-lg sm:leading-relaxed`}
                style={{ animationDelay: '0.15s', ...willChange }}
              >
                Everyone works from the same stock, but each person sees what they need.
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-2 md:gap-8">
              {ROLES.map((role, i) => (
                <div
                  key={role.title}
                  className={`${reveal} border-t border-[#E7E5E4] pt-6`}
                  style={{ animationDelay: `${0.3 + i * 0.12}s` }}
                >
                  <h3 className="font-serif text-xl text-hero-main">{role.title}</h3>
                  <p className="mt-4 text-base font-light leading-relaxed text-hero-muted">{role.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQSection items={FAQS} heading="Common questions" className="pt-28 sm:pt-36 lg:pt-44" />
        <FinalCTASection />
      </main>

      <GlobalScrollObserver />
    </div>
  );
}
