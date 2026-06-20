import type { Industry } from "@/data/industries";
import { PARTNERS_LAYOUT } from "@/lib/partnersLayout";

type IndustryCardProps = {
  industry: Industry;
};

export default function IndustryCard({ industry }: IndustryCardProps) {
  return (
    <article
      className={`box-border flex items-center justify-center bg-[#F5F7FA] ${PARTNERS_LAYOUT.card.size} ${PARTNERS_LAYOUT.card.border} ${PARTNERS_LAYOUT.card.padding}`}
    >
      <span
        className={`text-center font-sans ${PARTNERS_LAYOUT.card.label}`}
      >
        {industry.label}
      </span>
    </article>
  );
}
