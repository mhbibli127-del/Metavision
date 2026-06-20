import Image from "next/image";

export default function About() {
  return (
    <section
      id="about"
      className="about-section relative z-20 box-border w-full max-w-[100vw] overflow-x-hidden scroll-mt-40 bg-white text-[#04163c]"
    >
      <div className="about-inner box-border grid w-full min-w-0 grid-cols-1 items-center gap-10 px-4 sm:gap-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-[87px] lg:px-24 min-[1440px]:gap-[87px]">
        <Image
          src="/about-us.png"
          alt="MetaVision team collaborating in a modern workspace"
          className="about-image mx-auto block w-full max-w-[516px] shrink-0 rounded-3xl object-cover lg:mx-0"
          width={516}
          height={503}
          unoptimized
        />

        <div className="about-copy box-border flex min-w-0 flex-col gap-[22px] lg:max-w-[688px] lg:-mt-[76px]">
          <h2 className="about-title">About us</h2>
          <p className="about-text">
            MetaVision AI helps restaurants grow smarter through AI-powered
            automation. We integrate intelligent AI agents into restaurant
            operations to manage customer communication, reservations, orders,
            and support across channels — 24/7 and in multiple languages
          </p>
          <p className="about-text about-mission">
            Our mission is to simplify operations, improve guest experience, and
            help restaurants focus on delivering exceptional service
          </p>
        </div>
      </div>
    </section>
  );
}
