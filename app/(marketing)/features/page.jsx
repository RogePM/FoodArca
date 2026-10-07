// app/(marketing)/features/page.jsx
import SubpageHero from '@/components/Frontend/common/SubpageHero';
import PersonaSection from './PersonaSection';
import DesktopPowerhouseSection from './DesktopPowerhouseSection';
import BenefitsSection from './BenefitsSection';
import FinalCTASection from '@/components/Frontend/common/FinalCTASection';
import GlobalScrollObserver from '@/components/Frontend/common/GlobalScrollObserver';

const TITLE = 'Features | Food Arca';
const DESCRIPTION = 'Track every item that enters and leaves your pantry, from barcodes to expiration dates, in one live inventory for your whole team.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/features' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/features' },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function InventoryPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF9] text-[#1C1917] selection:bg-[#D97757] selection:text-white overflow-x-hidden">
      <SubpageHero
        titleBase="Complete control over"
        titleHighlight="your inventory."
        subtitle="Track every single item that enters your facility. From barcodes to expiration dates, never lose sight of your stock."
        primaryBtnText="Start organizing"
        secondaryBtnText="See features"
        mainImageSrc="/mock/feat.png"
      />
      
      <PersonaSection />
      <DesktopPowerhouseSection />
      <BenefitsSection />
      
      <FinalCTASection />
      <GlobalScrollObserver />
    </main>
  );
}