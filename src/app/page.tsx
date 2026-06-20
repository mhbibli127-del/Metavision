import dynamic from "next/dynamic";
import Hero from "@/components/Hero";
import LandingBackground from "@/components/LandingBackground";
import Navbar from "@/components/Navbar";

const About = dynamic(() => import("@/components/About"));
const SolutionsBlock = dynamic(() => import("@/components/SolutionsBlock"));
const PartnersIndustries = dynamic(() => import("@/components/PartnersIndustries"));
const ContactFooter = dynamic(() => import("@/components/ContactFooter"));

export default function Home() {
  return (
    <div className="page-shell">
      <section className="landing-frame" aria-label="Hero">
        <LandingBackground />

        <Navbar />
        <Hero />
      </section>

      <About />
      <SolutionsBlock />
      <PartnersIndustries />
      <ContactFooter />
    </div>
  );
}
