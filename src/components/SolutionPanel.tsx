import { getSiteSection } from "@/lib/db/site";
import SolutionCard from "@/components/SolutionCard";
import type { Solution } from "@/data/solutions";

export default async function SolutionPanel() {
  const solutions = await getSiteSection<Solution>("solutions");

  return (
    <div className="solution-panel">
      {solutions.map((solution) => (
        <SolutionCard key={solution.num} solution={solution} />
      ))}
    </div>
  );
}
