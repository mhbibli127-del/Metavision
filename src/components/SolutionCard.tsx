import type { Solution } from "@/data/solutions";
import { LAYOUT } from "@/lib/solutionsLayout";

type SolutionCardProps = {
  solution: Solution;
};

export default function SolutionCard({ solution }: SolutionCardProps) {
  return (
    <article
      className="box-border w-full rounded-l-[12px] border-l border-[#0F69FF] pl-4 pt-5 min-[1440px]:max-w-none"
      style={{ height: LAYOUT.cardHeight }}
    >
      <h3 className="m-0 flex flex-wrap items-baseline gap-2">
        <span className="shrink-0 text-[54px] font-bold leading-none text-white">
          {solution.num}
        </span>
        <span className="text-[22px] font-semibold leading-[130%] text-white">
          {solution.title}
        </span>
      </h3>

      <div
        className="mt-4 h-px w-full max-w-[236px] bg-[#0F69FF]"
        aria-hidden="true"
      />

      <p className="m-0 mt-4 text-[14px] font-normal leading-[22px] text-[#94A3B8]">
        {solution.text}
      </p>
    </article>
  );
}
