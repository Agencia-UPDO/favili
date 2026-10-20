import RevealAnimation from '../animation/RevealAnimation';

const data = [
  {
    id: 1,
    title: 'Phone calls & voicemails',
  },
  {
    id: 2,
    title: 'Events & tradeshows',
  },
  {
    id: 3,
    title: 'Website forms & pop-ups',
  },
  {
    id: 4,
    title: 'TV, radio & print Ads',
  },
  {
    id: 5,
    title: 'Pay-per-click (PPC) Ads',
  },
  {
    id: 6,
    title: 'Chatbots & live chats',
  },
  {
    id: 7,
    title: 'Online portals & marketplaces',
  },
  {
    id: 8,
    title: 'Social media',
  },
];

const Benefits = () => {
  return (
    <section className="bg-secondary relative z-0 bg-[url('/images/ns-img-527.png')] bg-cover bg-center bg-no-repeat py-16 md:py-20 lg:py-[90px] xl:py-[100px]">
      <div className="main-container relative z-30">
        <div className="mb-10 space-y-5 text-center md:mb-[70px]">
          <RevealAnimation delay={0.2}>
            <span className="badge badge-blur text-ns-green">Benefits</span>
          </RevealAnimation>
          <div className="space-y-3">
            <RevealAnimation delay={0.3}>
              <h2 className="text-background-4 mx-auto max-w-[450px] md:max-w-full">
                Capture leads from multiple sources
              </h2>
            </RevealAnimation>
            <RevealAnimation delay={0.4}>
              <p className="text-accent/60 mx-auto max-w-[450px] lg:max-w-[598px]">
                Import lead lists in one click, distribute leads instantly, and track interactions to boost conversion
                rates—all from a single platform.
              </p>
            </RevealAnimation>
          </div>
        </div>
        <div className="grid grid-cols-12 items-center justify-center gap-y-6 md:gap-6 lg:gap-8">
          <div className="col-span-12 md:col-span-6">
            <RevealAnimation delay={0.5}>
              <div className="space-y-4 rounded-[20px] bg-black/35 p-6 sm:space-y-6 md:space-y-8 md:p-8 lg:p-[42px]">
                <h3 className="lg:text-heading-4 text-heading-5 text-accent">Our products</h3>
                <ul className="space-y-1">
                  {data.slice(0, 4).map((item) => (
                    <li key={item.id} className="flex items-center gap-2 py-2">
                      <span className="bg-accent flex size-5 shrink-0 items-center justify-center rounded-full backdrop-blur-[15px]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={10}
                          height={8}
                          viewBox="0 0 10 7"
                          fill="none"
                          className="shrink-0">
                          <path
                            d="M9.125 0.679688L3.875 5.92945L1.25 3.30469"
                            className="stroke-secondary"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <p className="text-accent">{item.title}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealAnimation>
          </div>
          <div className="col-span-12 md:col-span-6">
            <RevealAnimation delay={0.6}>
              <div className="space-y-4 rounded-[20px] bg-black/35 p-6 sm:space-y-6 md:space-y-8 md:p-8 lg:p-[42px]">
                <h3 className="lg:text-heading-4 text-heading-5 text-accent">Industries we serve</h3>
                <ul className="space-y-1">
                  {data.slice(4).map((item) => (
                    <li key={item.id} className="flex items-center gap-2 py-2">
                      <span className="bg-accent flex size-5 shrink-0 items-center justify-center rounded-full backdrop-blur-[15px]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={10}
                          height={8}
                          viewBox="0 0 10 7"
                          fill="none"
                          className="shrink-0">
                          <path
                            d="M9.125 0.679688L3.875 5.92945L1.25 3.30469"
                            className="stroke-secondary"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <p className="text-accent">{item.title}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealAnimation>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
