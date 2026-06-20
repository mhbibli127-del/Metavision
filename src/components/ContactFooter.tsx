import Link from "next/link";
import type { ReactNode } from "react";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "#about" },
  { label: "Our Solutions", href: "#solutions" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Industries", href: "#industries" },
  { label: "Contact", href: "#contact" },
];

function SocialIcon({ label, children }: { label: string; children: ReactNode }) {
  return (
    <a href="#" className="contact-social-link" aria-label={label}>
      {children}
    </a>
  );
}

export default function ContactFooter() {
  return (
    <section
      id="contact"
      className="contact-footer scroll-mt-40"
      aria-labelledby="contact-heading"
    >
      <div className="contact-footer-inner">
        <div className="contact-form-block">
          <h2 id="contact-heading" className="contact-form-heading">
            Just
            <br />
            write us
          </h2>

          <form className="contact-form" action="#">
            {(["Name", "Surname", "Mail", "Mobile"] as const).map((label) => (
              <label key={label} className="contact-field">
                <span className="contact-field-label">{label}</span>
                <input
                  type={label === "Mail" ? "email" : label === "Mobile" ? "tel" : "text"}
                  name={label.toLowerCase()}
                  className="contact-field-input"
                  autoComplete={label === "Mail" ? "email" : label === "Mobile" ? "tel" : "name"}
                />
              </label>
            ))}

            <div className="contact-form-actions">
              <button type="submit" className="contact-submit-btn">
                Submit
              </button>
            </div>
          </form>
        </div>

        <div className="contact-footer-divider" role="separator" aria-hidden="true" />

        <footer className="site-footer">
          <div className="site-footer-main">
            <div className="site-footer-brand">
              <Link href="/" className="site-footer-logo-link">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nav-logo.png"
                  alt=""
                  className="site-footer-logo-icon"
                  width={52}
                  height={52}
                />
                <span className="site-footer-logo-text">METAVISION</span>
              </Link>
              <p className="site-footer-tagline">&ldquo;AI THAT WORKS FOR YOUR BUSINESS&rdquo;</p>
              <p className="site-footer-about-text">
                MetaVision AI is a leading technology company delivering innovative
                AI-powered solutions for businesses. We help companies automate their
                sales, support customers 24/7, and grow faster — across every channel,
                in any language, without limits.
              </p>
            </div>

            <div className="site-footer-columns">
              <div className="site-footer-column">
                <h3 className="site-footer-column-title">About</h3>
                <p className="site-footer-column-text">
                  We build intelligent AI agents that represent, sell, and support your
                  business around the clock. From startups to established companies, we
                  turn technology into your most reliable team member.
                </p>
              </div>

              <div className="site-footer-column site-footer-column-divider">
                <h3 className="site-footer-column-title">Site map</h3>
                <ul className="site-footer-links">
                  {footerLinks.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="site-footer-link">
                        <span aria-hidden="true">→</span> {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="site-footer-column site-footer-column-divider">
                <h3 className="site-footer-column-title">Contact</h3>
                <p className="site-footer-column-text">
                  Mail: metavisionco.info@gmail.com
                  <br />
                  Mobil: +994 (55) 555 55 55
                </p>

                <div className="contact-social-row">
                  <SocialIcon label="WhatsApp">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.3A10 10 0 1 0 12 2Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M8.5 9.5c.3 1.6 1.7 3.8 3.8 4.8 1 .5 1.8.7 2.4.7.4 0 .7-.1 1-.3.3-.2.6-.5.8-.8.1-.2.1-.4 0-.6l-.6-1.4c-.1-.2-.3-.3-.5-.3h-1.4c-.2 0-.4.1-.5.3l-.3.6c-.1.1-.2.2-.4.2-.6-.2-2.2-1-3-2.6-.1-.2 0-.3.1-.4l.6-.7c.1-.2.2-.4.1-.6l-.7-1.6c-.1-.2-.3-.4-.6-.4H7.8c-.2 0-.4.1-.5.3-.8 1.2-1.2 2.4-1 3.7Z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />
                    </svg>
                  </SocialIcon>
                  <SocialIcon label="Facebook">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </SocialIcon>
                  <SocialIcon label="Instagram">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="17" cy="7" r="1" fill="currentColor" />
                    </svg>
                  </SocialIcon>
                  <SocialIcon label="LinkedIn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path
                        d="M8 10v7M8 7v.01M12 17v-4c0-1.1.9-2 2-2s2 .9 2 2v4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </SocialIcon>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
