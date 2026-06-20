/**
 * Full-bleed layout — matches About & Solutions (`px-4 sm:px-6 lg:px-24`).
 * Vertical rhythm: 72px between all major blocks.
 */
export const GAP_72 = "gap-[72px]";

export const PARTNERS_LAYOUT = {
  shell:
    "box-border w-full max-w-[100vw] min-w-0 bg-white",
  inner: `box-border flex w-full min-w-0 flex-col ${GAP_72} px-4 py-[72px] sm:px-6 lg:px-24`,

  partners: {
    block: "flex w-full min-w-0 flex-col items-center",
    title:
      "m-0 w-full text-center font-sans text-[36px] font-semibold leading-none tracking-normal text-[#04163C] sm:text-[44px] lg:text-[56px]",
    logosRow:
      "mt-[72px] flex w-full max-w-full flex-wrap items-center justify-center gap-x-8 gap-y-10 sm:gap-x-10 lg:flex-nowrap lg:justify-between lg:gap-x-0 lg:gap-y-0",
    logoSlot:
      "flex h-[100px] min-w-0 flex-[1_1_42%] items-center justify-center px-[15px] sm:flex-[1_1_46%] lg:h-[100px] lg:flex-1 lg:basis-0 lg:max-w-[344px]",
    logoImage:
      "block w-auto max-w-[280px] object-contain object-center sm:max-w-[300px] lg:max-w-[344px] transition-transform duration-300 ease-in-out hover:scale-105",
  },

  industries: {
    panel:
      "industries-panel relative w-full min-h-[520px] overflow-hidden rounded-[24px] sm:min-h-[580px] lg:min-h-[680px]",
    inner:
      "industries-panel-inner relative z-10 flex w-full flex-col items-center px-6 sm:px-8 lg:px-10 py-[72px]",
    title:
      "m-0 w-full text-center font-sans text-[36px] font-semibold leading-none tracking-normal text-[#04163C] sm:text-[44px] lg:text-[56px]",
    cardsRow:
      "industries-cards-row mt-[72px] flex w-full flex-wrap items-stretch justify-center gap-4 sm:gap-5 lg:flex-nowrap lg:gap-6",
    moreButtonWrap: "industries-more-wrap mt-[72px] flex w-full justify-center",
  },

  card: {
    size:
      "h-[88px] min-w-0 flex-[1_1_42%] sm:h-[96px] sm:flex-[1_1_46%] lg:h-[108px] lg:flex-1 lg:basis-0",
    border: "rounded-[24px] border-2 border-[#04163C]",
    padding: "px-6 py-4 sm:px-8 lg:px-10 lg:py-6",
    label:
      "text-center font-sans text-[17px] font-medium leading-tight text-[#04163C] sm:text-[19px] lg:text-[22px]",
  },

  moreButton: {
    size: "h-[52px] w-[180px] sm:h-[58px] sm:w-[200px] lg:h-[64px] lg:w-[220px]",
    style:
      "rounded-[14px] border-0 bg-[#1D6CD3] px-8 font-sans text-base font-semibold leading-none text-white shadow-[0_4px_14px_rgba(29,108,211,0.35)] transition-colors duration-200 hover:bg-[#1A5FB8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D6CD3] sm:text-lg lg:text-xl",
  },
} as const;
