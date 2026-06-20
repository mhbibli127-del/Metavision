import SectionInner from "@/components/ContentContainer";
import IndustriesSection from "@/components/IndustriesSection";
import PartnersSection from "@/components/PartnersSection";
import { PARTNERS_LAYOUT } from "@/lib/partnersLayout";

export default function PartnersIndustries() {
  return (
    <section
      id="industries"
      className={PARTNERS_LAYOUT.shell}
      aria-label="Partners and industries"
    >
      <SectionInner className="partners-industries-inner">
        <PartnersSection />
        <IndustriesSection />
      </SectionInner>
    </section>
  );
}
