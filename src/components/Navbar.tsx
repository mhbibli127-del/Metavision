import Link from "next/link";

function GlobeIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="nav-globe-icon"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Login", href: "/login" },
];

export default function Navbar() {
  return (
    <nav className="site-nav">
      <Link href="/" className="nav-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/nav-logo.png" alt="" className="nav-logo-icon" width={52} height={52} />
        <span className="nav-brand-text">METAVISION</span>
      </Link>

      <div className="nav-links">
        {navLinks.map((link) => (
          <Link key={link.label} href={link.href} className="nav-link">
            {link.label}
          </Link>
        ))}
        <button type="button" aria-label="Change language" className="nav-globe-btn">
          <GlobeIcon />
        </button>
      </div>
    </nav>
  );
}
