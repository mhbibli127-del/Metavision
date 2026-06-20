import type { CSSProperties } from "react";
import type { TimelineStepData } from "@/data/solutions";
import { LAYOUT } from "@/lib/solutionsLayout";

type TimelineStepProps = {
  step: TimelineStepData;
  left?: number;
};

export default function TimelineStep({ step, left }: TimelineStepProps) {
  const positionStyle: CSSProperties | undefined =
    left !== undefined ? { left: `${left}px` } : undefined;

  return (
    <div
      className="flex flex-col items-center min-[1440px]:absolute min-[1440px]:top-0 min-[1440px]:-translate-x-1/2"
      style={{
        ...positionStyle,
        width: LAYOUT.circleSize,
      }}
    >
      <div
        className="relative z-10 box-border flex shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#04163C] text-[28px] font-medium leading-none text-white"
        style={{
          width: LAYOUT.circleSize,
          height: LAYOUT.circleSize,
        }}
      >
        {step.num}
      </div>
      <p
        className="m-0 text-center text-[18px] font-normal leading-[28px] text-white"
        style={{
          marginTop: LAYOUT.labelGap,
          width: 280,
          maxWidth: 280,
        }}
      >
        {step.label}
      </p>
    </div>
  );
}
