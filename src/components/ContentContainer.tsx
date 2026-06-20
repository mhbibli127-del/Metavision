import type { ReactNode } from "react";
import { PARTNERS_LAYOUT } from "@/lib/partnersLayout";

type SectionInnerProps = {
  children: ReactNode;
  className?: string;
};

/** Shared full-width inner shell — same padding as About / Solutions. */
export default function SectionInner({
  children,
  className = "",
}: SectionInnerProps) {
  return (
    <div className={`${PARTNERS_LAYOUT.inner} ${className}`.trim()}>
      {children}
    </div>
  );
}
