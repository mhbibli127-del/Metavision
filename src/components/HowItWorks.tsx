import { timelineSteps } from "@/data/solutions";
import TimelineStep from "@/components/TimelineStep";
import { LAYOUT, lineTop, timelineStepLeft } from "@/lib/solutionsLayout";

export default function HowItWorks() {
  return (
    <div id="how-it-works" className="solutions-section-2 scroll-mt-40" aria-label="How it works">
      <div className="how-it-works-block">
        <h2 className="how-it-works-title">How it works?</h2>

        <div className="how-it-works-timeline">
          <div
            className="relative mx-auto w-full min-w-0"
            style={{
              maxWidth: LAYOUT.timelineWidth,
              width: "100%",
              height: LAYOUT.timelineHeight,
            }}
          >
            <div
              className="absolute left-1/2 hidden -translate-x-1/2 bg-white min-[1440px]:block"
              style={{
                top: lineTop,
                width: LAYOUT.lineWidth,
                height: LAYOUT.lineHeight,
              }}
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 gap-10 min-[768px]:grid-cols-2 min-[1440px]:contents">
              {timelineSteps.map((step, index) => (
                <TimelineStep
                  key={step.num}
                  step={step}
                  left={timelineStepLeft(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
