export type Partner = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  /** Tuned per asset so every mark reads at the same visual weight. */
  imageHeightClass: string;
  imageScaleClass: string;
};

export const partners: Partner[] = [
  {
    id: "amazon",
    name: "Amazon",
    src: "/partners/amazon.png",
    width: 326,
    height: 135,
    imageHeightClass: "h-[48px] sm:h-[56px] lg:h-[66px]",
    imageScaleClass: "origin-center scale-[1.08] sm:scale-[1.06] lg:scale-[1.06]",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    src: "/partners/google-analytics.png",
    width: 340,
    height: 135,
    imageHeightClass: "h-[48px] sm:h-[56px] lg:h-[66px]",
    imageScaleClass: "origin-center scale-[1.02] sm:scale-[1.02] lg:scale-[1.02]",
  },
  {
    id: "make",
    name: "Make",
    src: "/partners/make.png",
    width: 324,
    height: 135,
    imageHeightClass: "h-[48px] sm:h-[56px] lg:h-[66px]",
    imageScaleClass: "origin-center scale-[1.03] sm:scale-[1.03] lg:scale-[1.03]",
  },
  {
    id: "google",
    name: "Google",
    src: "/partners/google.png",
    width: 399,
    height: 135,
    imageHeightClass: "h-[48px] sm:h-[56px] lg:h-[66px]",
    imageScaleClass: "origin-center scale-[1] sm:scale-[1] lg:scale-[1]",
  },
];
