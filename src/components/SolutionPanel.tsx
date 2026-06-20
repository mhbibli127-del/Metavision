import { solutions } from "@/data/solutions";
import SolutionCard from "@/components/SolutionCard";
import { LAYOUT } from "@/lib/solutionsLayout";

export default function SolutionPanel() {
  const [featured, ...rest] = solutions;

  return (
    <div className="solutions-section-1" aria-label="Our solution panel">
      <div className="solutions-panel-layout relative box-border w-full pt-12 min-[1440px]:pt-[96px]">
        <h2 className="solutions-panel-title solutions-panel-title-mobile m-0 w-full text-center text-[32px] font-bold leading-none text-white min-[1440px]:hidden min-[1440px]:text-[34px]">
          Our solution panel
        </h2>

        <div className="solutions-panel-feature">
          <h2 className="solutions-panel-title solutions-panel-title-over-rsm m-0 hidden w-full text-center text-[32px] font-bold leading-none text-white min-[1440px]:block min-[1440px]:text-[34px]">
            Our solution panel
          </h2>
          <SolutionCard solution={featured} />
        </div>

        <div
          className="solutions-panel-rest mt-14 grid w-full grid-cols-1 min-[768px]:grid-cols-2 min-[1440px]:mt-0 min-[1440px]:contents"
          style={{ gap: LAYOUT.cardGap }}
        >
          {rest.map((solution) => (
            <SolutionCard key={solution.num} solution={solution} />
          ))}
        </div>
      </div>
    </div>
  );
}
