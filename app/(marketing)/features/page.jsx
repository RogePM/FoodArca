// app/inventory/page.jsx
import SubpageHero from '@/components/Frontend/common/SubpageHero';
import FeatureLedger from './FeatureLedger';

export default function InventoryPage() {
  return (
    <main>
      <SubpageHero
        titleBase="Complete control over"
        titleHighlight="your inventory."
        subtitle="Track every single item that enters your facility. From barcodes to expiration dates, never lose sight of your stock."
        primaryBtnText="Start organizing"
        secondaryBtnText="See features"
        mainImageSrc="/mock/feat.png"

      />
      <FeatureLedger />
      {/* Then you can add your TrustPricingSection or other components below! */}

    </main>
  );
}