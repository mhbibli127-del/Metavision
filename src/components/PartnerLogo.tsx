import Image from "next/image";
import type { Partner } from "@/data/partners";
import { PARTNERS_LAYOUT } from "@/lib/partnersLayout";

type PartnerLogoProps = {
  partner: Partner;
};

export default function PartnerLogo({ partner }: PartnerLogoProps) {
  return (
    <div
      role="listitem"
      className={`logo ${PARTNERS_LAYOUT.partners.logoSlot}`}
      aria-label={partner.name}
    >
      <Image
        src={partner.src}
        alt={partner.name}
        width={partner.width}
        height={partner.height}
        className={`${PARTNERS_LAYOUT.partners.logoImage} ${partner.imageHeightClass} ${partner.imageScaleClass}`}
        unoptimized
      />
    </div>
  );
}
