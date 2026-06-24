import Image from "next/image";
import IndustryCard from "@/components/IndustryCard";
import { getSiteSection } from "@/lib/db/site";
import { PARTNERS_LAYOUT } from "@/lib/partnersLayout";
import type { Industry } from "@/data/industries";

export default async function IndustriesSection() {
  const industries = await getSiteSection<Industry>("industries");

  return (
    <section
      aria-labelledby="industries-heading"
      className="industries-section w-full min-w-0"
    >
      <div className={PARTNERS_LAYOUT.industries.panel}>
        <Image
          src="/industries-bg.png"
          alt=""
          fill
          sizes="100vw"
          className="industries-panel-bg object-cover object-[68%_50%]"
          priority
          unoptimized
        />
        <div className="industries-panel-overlay absolute inset-0" aria-hidden="true" />

        <div className={PARTNERS_LAYOUT.industries.inner}>
          <h2 id="industries-heading" className={PARTNERS_LAYOUT.industries.title}>
            Industries
          </h2>

          <div className={PARTNERS_LAYOUT.industries.cardsRow}>
            {industries.map((industry) => (
              <IndustryCard key={industry.id} industry={industry} />
            ))}
          </div>

          <div className={PARTNERS_LAYOUT.industries.moreButtonWrap}>
            <button
              type="button"
              className={`box-border flex items-center justify-center ${PARTNERS_LAYOUT.moreButton.size} ${PARTNERS_LAYOUT.moreButton.style}`}
            >
              More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
