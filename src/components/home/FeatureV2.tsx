import mainFeature from '@public/images/ns-img-123.png';
import mainFeatureDark from '@public/images/ns-img-dark-92.png';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';
import LinkButton from '../ui/button/LinkButton';

const data = [
  {
    id: 1,
    title: 'Sales CRM',
  },
  {
    id: 2,
    title: 'Marketing automation',
  },
  {
    id: 3,
    title: 'Mobile CRM app',
  },
  {
    id: 4,
    title: 'Customer portal',
  },
  {
    id: 5,
    title: 'Lead management system',
  },
  {
    id: 6,
    title: 'API & developer platform',
  },
  {
    id: 7,
    title: 'Real estate',
  },
  {
    id: 8,
    title: 'Finance & banking',
  },
  {
    id: 9,
    title: 'E-commerce',
  },
  {
    id: 10,
    title: 'Travel & hospitality',
  },
  {
    id: 11,
    title: 'B2B SaaS',
  },
  {
    id: 12,
    title: 'And more!',
  },
];

const FeatureV2 = () => {
  return (
    <section className="py-16 md:py-20 lg:py-[100px] xl:py-[200px]">
      <div className="main-container">
        <div className="mb-10 space-y-5 text-center md:mb-[70px]">
          <RevealAnimation delay={0.2}>
            <span className="badge badge-cyan">Features</span>
          </RevealAnimation>
          <div className="space-y-3">
            <RevealAnimation delay={0.3}>
              <h2>
                A<span className="text-primary-500"> one-stop </span>solution
              </h2>
            </RevealAnimation>
            <RevealAnimation delay={0.4}>
              <p className="mx-auto max-w-[500px] lg:max-w-[674px]">
                With our lead capture automation software, you can effortlessly collect, manage, and nurture leads from
                various online and offline sources in real-time.
              </p>
            </RevealAnimation>
          </div>
        </div>
        <div className="space-y-10 md:space-y-20 lg:space-y-[100px]">
          <div className="flex flex-col items-center gap-y-6 lg:flex-row lg:gap-8 xl:gap-12">
            <RevealAnimation delay={0.5} offset={70} start="top 88%">
              <div className="bg-background-1 dark:bg-background-6 w-full max-w-[500px] space-y-6 rounded-[20px] p-8 lg:max-w-[300px] xl:max-w-[360px] xl:p-[42px]">
                <h3 className="xl:text-heading-4 text-heading-5">Our products</h3>
                <ul>
                  {data.slice(0, 6).map((item) => (
                    <li key={item.id} className="flex items-center gap-2 py-1.5 xl:py-2.5">
                      <span className="bg-background-3 dark:bg-accent flex size-5 shrink-0 items-center justify-center rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={10}
                          height={7}
                          viewBox="0 0 10 7"
                          fill="none"
                          className="shrink-0">
                          <path
                            d="M9.125 1.02734L3.875 6.27711L1.25 3.65234"
                            className="stroke-secondary"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <p className="text-secondary dark:text-accent">{item.title}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealAnimation>
            <RevealAnimation delay={0.6} offset={70} start="top 88%">
              <div>
                <figure className="mx-auto w-full max-w-[350px] lg:max-w-[485px]">
                  <Image src={mainFeature} className="h-full w-full object-cover dark:hidden" alt="Features" />
                  <Image
                    src={mainFeatureDark}
                    className="hidden h-full w-full object-cover dark:block"
                    alt="Features"
                  />
                </figure>
              </div>
            </RevealAnimation>
            <RevealAnimation delay={0.7} offset={70} start="top 88%">
              <div className="bg-background-1 dark:bg-background-6 w-full max-w-[500px] space-y-6 rounded-[20px] p-8 lg:max-w-[300px] xl:max-w-[360px] xl:p-[42px]">
                <h3 className="xl:text-heading-4 text-heading-5">Industries we serve</h3>
                <ul>
                  {data.slice(6).map((item) => (
                    <li key={item.id} className="flex items-center gap-2 py-1.5 xl:py-2.5">
                      <span className="bg-background-3 dark:bg-accent flex size-5 shrink-0 items-center justify-center rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={10}
                          height={7}
                          viewBox="0 0 10 7"
                          fill="none"
                          className="shrink-0">
                          <path
                            d="M9.125 1.02734L3.875 6.27711L1.25 3.65234"
                            className="stroke-secondary"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <p className="text-secondary dark:text-accent">{item.title}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealAnimation>
          </div>
          <RevealAnimation delay={0.8}>
            <div className="text-center">
              <LinkButton
                href="/features"
                className="btn hover:btn-primary dark:btn-accent btn-secondary btn-lg md:btn-xl w-[85%] md:w-auto">
                Explore all features
              </LinkButton>
            </div>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

export default FeatureV2;
