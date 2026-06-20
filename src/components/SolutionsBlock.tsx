import SolutionPanel from "@/components/SolutionPanel";
import HowItWorks from "@/components/HowItWorks";

export default function SolutionsBlock() {
  return (
    <section
      id="solutions"
      className="solutions-block box-border w-full max-w-[100vw] min-w-0 overflow-x-hidden scroll-mt-40"
      aria-label="Solutions and process"
    >
      <div className="solutions-block-inner box-border w-full min-w-0 px-4 sm:px-6 lg:px-24">
        <SolutionPanel />
        <HowItWorks />
      </div>
    </section>
  );
}
