import type { ReactNode } from "react";

type SectionHeadingProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export default function SectionHeading({
  children,
  className = "",
  id,
}: SectionHeadingProps) {
  return (
    <h2
      id={id}
      className={`m-0 text-center font-sans text-[28px] font-semibold leading-none tracking-normal text-[#04163C] sm:text-[32px] lg:text-[40px] ${className}`}
    >
      {children}
    </h2>
  );
}
