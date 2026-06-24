import PartnerLogo from "@/components/PartnerLogo";
import { getSiteSection } from "@/lib/db/site";
import { PARTNERS_LAYOUT } from "@/lib/partnersLayout";
import type { Partner } from "@/data/partners";

export default async function PartnersSection() {
  const partners = await getSiteSection<Partner>("partners");

  return (
    <section aria-labelledby="partners-heading" className={PARTNERS_LAYOUT.partners.block}>
      <h2 id="partners-heading" className={`partners-title ${PARTNERS_LAYOUT.partners.title}`}>
        Our partners
      </h2>

      <div
        className={`container logos ${PARTNERS_LAYOUT.partners.logosRow}`}
        role="list"
        aria-label="Partner logos"
      >
        {partners.map((partner) => (
          <PartnerLogo key={partner.id} partner={partner} />
        ))}
      </div>
    </section>
  );
}
