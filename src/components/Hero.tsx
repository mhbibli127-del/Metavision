import Link from "next/link";
import CheckIcon from "@/components/CheckIcon";

const features = [
  "Seamlessly integrate AI into your existing business workflow",
  "Set up and manage your database with professional expertise",
  "Fully automate your sales, marketing and customer analytics",
  "Get complete technical support throughout your entire service period",
];

export default function Hero() {
  return (
    <section className="hero-content" aria-label="Hero">
      <h1 className="hero-logo">METAVISION</h1>

      <p className="hero-headline">
        &ldquo;AI THAT WORKS FOR YOUR BUSINESS&rdquo;
      </p>

      <ul className="hero-features">
        {features.map((feature) => (
          <li key={feature} className="hero-feature-item">
            <CheckIcon />
            <span className="hero-feature-text">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="hero-actions">
        <Link href="/login" className="btn-login">
          Login
        </Link>
        <a href="#contact" className="btn-contact">
          Contact us
        </a>
      </div>
    </section>
  );
}
