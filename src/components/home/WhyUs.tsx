import whyUsPattern from '@public/images/ns-img-119.png';
import selectUsImg02 from '@public/images/ns-img-96.png';
import selectUsImg03 from '@public/images/ns-img-97.png';
import selectUsImg02Dark from '@public/images/ns-img-dark-69.png';
import selectUsImg03Dark from '@public/images/ns-img-dark-70.png';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';

const WhyUs = () => {
  return (
    <section
      className="bg-background-2 dark:bg-background-6 overflow-hidden pt-16 pb-[100px] lg:pt-[100px] lg:pb-[200px]"
      aria-label="Reasons to select us">
      <div className="main-container">
        <div className="flex flex-col items-center gap-y-14 lg:flex-row lg:gap-20 xl:gap-[100px]">
          <div className="space-y-9 xl:space-y-[42px]">
            <div className="mb-8 max-w-[536px] space-y-5 md:w-full lg:mb-14">
              <RevealAnimation delay={0.2}>
                <span className="badge badge-cyan">Reasons to select us</span>
              </RevealAnimation>
              <div className="space-y-3">
                <RevealAnimation delay={0.3}>
                  <h2 className="xl:max-w-[446px]">
                    A highly effective
                    <span className="text-primary-500"> unified platform</span>
                  </h2>
                </RevealAnimation>
                <RevealAnimation delay={0.4}>
                  <p className="max-w-[433px]">
                    Until recently, the prevailing view assumed lorem ipsum was born as a nonsense text nothing Before
                    &amp; After magazine.
                  </p>
                </RevealAnimation>
              </div>
            </div>
            <ul className="md:space-y-2" aria-label="Our key features">
              <RevealAnimation delay={0.5}>
                <li className="flex items-center gap-3 px-3 py-2">
                  <span className="ns-shape-1 text-secondary dark:text-accent text-[36px]" />
                  <p className="text-secondary dark:text-accent font-medium">Analyze Your Data</p>
                </li>
              </RevealAnimation>
              <RevealAnimation delay={0.6}>
                <li className="flex items-center gap-3 px-3 py-2">
                  <span className="ns-shape-47 text-secondary dark:text-accent text-[36px]" />
                  <p className="text-secondary dark:text-accent font-medium">Collaborate Securely</p>
                </li>
              </RevealAnimation>
              <RevealAnimation delay={0.7} start="top 85%">
                <li className="flex items-center gap-3 px-3 py-2">
                  <span className="ns-shape-34 text-secondary dark:text-accent text-[36px]" />
                  <p className="text-secondary dark:text-accent font-medium">Embedded Analytics</p>
                </li>
              </RevealAnimation>
              <RevealAnimation delay={0.8} start="top 85%">
                <li className="flex items-center gap-3 px-3 py-2">
                  <span className="ns-shape-28 text-secondary dark:text-accent text-[36px]" />
                  <p className="text-secondary dark:text-accent font-medium">Easy &amp; Intuitive</p>
                </li>
              </RevealAnimation>
            </ul>
          </div>
          <div>
            <div className="relative">
              <RevealAnimation delay={0.5} direction="up">
                <figure className="max-w-[370px] overflow-hidden md:max-w-[382px] lg:max-w-[574px] xl:max-w-[802px]">
                  <Image
                    src={whyUsPattern}
                    alt="Dashboard interface showing cash flow management"
                    className="size-full object-cover"
                    loading="lazy"
                  />
                </figure>
              </RevealAnimation>
              <RevealAnimation delay={0.6} direction="right">
                <figure className="shadow-5 absolute top-[68px] left-[190px] w-full max-w-[150px] overflow-hidden rounded-[10px] md:top-[73px] md:left-[210px] lg:top-[130px] lg:left-[350px] lg:max-w-[200px] xl:top-[170px] xl:left-[459px] xl:max-w-[253px]">
                  <Image
                    src={selectUsImg03}
                    alt="Financial analytics chart"
                    className="size-full object-cover dark:hidden"
                    loading="lazy"
                  />
                  <Image
                    src={selectUsImg03Dark}
                    alt="Financial analytics chart"
                    className="hidden size-full object-cover dark:inline-block"
                    loading="lazy"
                  />
                </figure>
              </RevealAnimation>
              <RevealAnimation delay={0.8} direction="right">
                <figure className="absolute right-[25px] bottom-[57px] w-full max-w-[200px] overflow-hidden rounded-[10px] md:right-[37px] lg:right-[42px] lg:bottom-[87px] lg:max-w-[300px] xl:right-[68px] xl:bottom-[124px] xl:max-w-[395px]">
                  <Image
                    src={selectUsImg02}
                    alt="Mobile app interface for cash management"
                    className="size-full object-cover dark:hidden"
                    loading="lazy"
                  />
                  <Image
                    src={selectUsImg02Dark}
                    alt="Mobile app interface for cash management"
                    className="hidden size-full object-cover dark:inline-block"
                    loading="lazy"
                  />
                </figure>
              </RevealAnimation>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
