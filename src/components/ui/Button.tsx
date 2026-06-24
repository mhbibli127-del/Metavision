import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm" | "icon";

const variantClass: Record<Variant, string> = {
  primary: "ds-btn--primary",
  secondary: "ds-btn--secondary",
  ghost: "ds-btn--ghost",
};

const sizeClass: Record<Size, string> = {
  md: "",
  sm: "ds-btn--sm",
  icon: "ds-btn--icon",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export function Button({ variant = "secondary", size = "md", className = "", children, ...props }: ButtonProps) {
  const cls = `ds-btn ${variantClass[variant]} ${sizeClass[size]} ${className}`.trim();
  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({ variant = "secondary", size = "md", className = "", href, children, ...props }: LinkProps) {
  const cls = `ds-btn ${variantClass[variant]} ${sizeClass[size]} ${className}`.trim();
  return (
    <Link href={href} className={cls} {...props}>
      {children}
    </Link>
  );
}
