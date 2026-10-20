//press hero
import Link from 'next/link';
import RevealAnimation from '../animation/RevealAnimation';

const Hero = () => {
  return (
    <section className="pt-[100px] pb-16 lg:pt-[140px] lg:pb-20 xl:pt-[170px] xl:pb-28">
      <div className="main-container">
        <div className="text-center">
          <RevealAnimation delay={0.1}>
            <span className="badge badge-green-v2 mb-5"> Press </span>
          </RevealAnimation>
          <div className="mt-5 mb-14 space-y-4 text-center">
            <RevealAnimation delay={0.2}>
              <h1 className="font-normal">
                Stay <span className="text-primary-500">updated</span> with the latest <br />
                from NextSaaS
              </h1>
            </RevealAnimation>
            <RevealAnimation delay={0.3}>
              <p>
                Explore official press releases, product announcements,
                <br />
                and media coverage all in one place.
              </p>
            </RevealAnimation>
          </div>
          <div className="flex flex-col items-center justify-center gap-x-4 gap-y-3 md:flex-row md:gap-y-0">
            <RevealAnimation delay={0.4} direction="left" offset={50} instant>
              <div>
                <Link
                  href="/brandkit"
                  className="btn btn-secondary hover:btn-primary dark:hover:btn-primary dark:btn-accent btn-lg md:btn-xl mx-auto w-full md:mx-0 md:w-auto">
                  <span>Download press kit</span>
                </Link>
              </div>
            </RevealAnimation>
            <RevealAnimation delay={0.5} direction="left" offset={50} instant>
              <div>
                <Link
                  href="/pricing"
                  className="btn btn-white hover:btn-secondary dark:hover:btn-primary dark:btn-accent btn-lg md:btn-xl mx-auto w-full md:mx-0 md:w-auto">
                  <span>Build Ai</span>
                </Link>
              </div>
            </RevealAnimation>
          </div>
        </div>
      </div>
    </section>
  );
};

Hero.displayName = 'Hero';
export default Hero;
