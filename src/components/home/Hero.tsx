import Avatar1 from '@public/images/ns-avatar-1.png';
import Avatar2 from '@public/images/ns-avatar-2.png';
import Avatar3 from '@public/images/ns-avatar-3.png';
import hero1 from '@public/images/ns-img-121.png';
import hero2 from '@public/images/ns-img-122.png';
import hero1Dark from '@public/images/ns-img-dark-90.png';
import hero2Dark from '@public/images/ns-img-dark-91.png';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';
import LinkButton from '../ui/button/LinkButton';

const Hero = () => {
  return (
    <section className="overflow-hidden pt-[140px] pb-[100px] lg:pt-[180px] lg:pb-[160px]">
      <div className="lp:gap-[42px] mx-auto flex max-w-[1920px] flex-col items-center gap-y-14 lg:flex-row lg:gap-8">
        <div className="lp:pl-[150px] space-y-8 lg:space-y-10 lg:pl-[80px] xl:space-y-14 xl:pl-[120px] 2xl:pl-[320px]">
          <div className="space-y-5 text-center lg:text-left">
            <RevealAnimation delay={0.2}>
              <span className="badge badge-cyan">Turn clicks into customers</span>
            </RevealAnimation>
            <div className="space-y-4">
              <RevealAnimation delay={0.3}>
                <h1 className="mx-auto max-sm:mx-5 md:mx-0 md:max-w-[500px] lg:max-w-[645px]">
                  Automate how you collect and
                  <br />
                  <span className="text-primary-500">qualify leads</span>
                </h1>
              </RevealAnimation>
              <RevealAnimation delay={0.4}>
                <p className="mx-auto max-w-[350px] sm:max-w-[400px] lg:mx-0 lg:max-w-[595px]">
                  Collect leads from multiple channels—websites, ads, social media, events, calls, and more—without
                  missing a single opportunity.
                </p>
              </RevealAnimation>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 lg:justify-start">
            <div className="flex -space-x-3.5">
              <RevealAnimation delay={0.2} direction="right" offset={50}>
                <figure>
                  <Image
                    className="bg-ns-yellow inline-block size-9 rounded-full ring-2 ring-white"
                    src={Avatar1}
                    alt="Avatar 1"
                  />
                </figure>
              </RevealAnimation>
              <RevealAnimation delay={0.3} direction="right" offset={50}>
                <figure>
                  <Image
                    className="bg-ns-red inline-block size-9 rounded-full ring-2 ring-white"
                    src={Avatar2}
                    alt="Avatar 2"
                  />
                </figure>
              </RevealAnimation>
              <RevealAnimation delay={0.4} direction="right" offset={50}>
                <figure>
                  <Image
                    className="bg-ns-green inline-block size-9 rounded-full ring-2 ring-white"
                    src={Avatar3}
                    alt="Avatar 3"
                  />
                </figure>
              </RevealAnimation>
              <RevealAnimation delay={0.5} direction="right" offset={50}>
                <div className="text-secondary/80 bg-ns-cyan text-tagline-3 inline-flex size-9 cursor-pointer items-center justify-center rounded-full font-medium ring-2 ring-white">
                  99+
                </div>
              </RevealAnimation>
            </div>
            <RevealAnimation delay={0.6}>
              <div>
                <p className="text-tagline-2 text-secondary dark:text-accent font-medium">Trusted by 20k+</p>
                <p className="text-tagline-3">Customers Across the globe</p>
              </div>
            </RevealAnimation>
          </div>
          <RevealAnimation delay={0.7} instant direction="right">
            <div className="text-center lg:text-left">
              <LinkButton
                href="/login"
                className="btn hover:btn-primary dark:btn-accent btn-lg sm:btn-xl btn-secondary w-[90%] sm:w-auto">
                Book a demo
              </LinkButton>
            </div>
          </RevealAnimation>
        </div>
        <div>
          <div className="relative mx-auto w-full max-w-[300px] min-[425px]:max-w-[350px] sm:max-w-[500px] md:max-w-[700px] lg:mx-0 lg:ml-[40px] lg:max-w-[900px] xl:ml-[70px] 2xl:ml-[120px] 2xl:max-w-[1024px]">
            <RevealAnimation delay={0.8} duration={1} direction="right" offset={80}>
              <figure className="relative z-10">
                <Image src={hero1} className="relative z-10 h-full w-full rounded-2xl dark:hidden" alt="hero" />
                <Image
                  src={hero1Dark}
                  className="relative z-10 hidden h-full w-full rounded-2xl dark:block"
                  alt="hero"
                />
              </figure>
            </RevealAnimation>
            <RevealAnimation delay={0.4} direction="right">
              <figure className="absolute top-[5%] left-[5%] -z-0 h-full w-full">
                <Image src={hero2} className="h-full w-full rounded-2xl dark:hidden" alt="hero" />
                <Image src={hero2Dark} className="hidden h-full w-full rounded-2xl dark:block" alt="hero" />
              </figure>
            </RevealAnimation>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
