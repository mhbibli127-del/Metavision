export const LAYOUT = {
  frame: 1440,
  content: 1310,
  sideInset: 65,
  blockMinHeight: 1276,
  section1Height: 629,
  section2Height: 647,
  panelTop: 80,
  headingGap: 48,
  cardGap: 46,
  cardWidth: 255,
  cardHeight: 392,
  howTitleTop: 72,
  howTitleWidth: 220,
  howTitleHeight: 38,
  howTitleSize: 32,
  howTitleTimelineGap: 128,
  sectionGap: 48,
  section2Vertical: 48,
  timelineWidth: 1140,
  timelineHeight: 200,
  circleSpacing: 330,
  lineWidth: 920,
  lineHeight: 3,
  circleSize: 88,
  labelGap: 14,
} as const;

export const timelineStepLeft = (index: number) => {
  const firstCenter =
    (LAYOUT.timelineWidth - LAYOUT.circleSpacing * 3) / 2;
  return firstCenter + index * LAYOUT.circleSpacing;
};

export const lineTop =
  LAYOUT.circleSize / 2 - LAYOUT.lineHeight / 2;
