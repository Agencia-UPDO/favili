import userActivityChart from '@public/images/ns-img-120.png';
import aboutBg from '@public/images/ns-img-14.png';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';
import LinkButton from '../ui/button/LinkButton';
import Progress from './Progress';

const Feature = () => {
  return (
    <section className="bg-background-2 dark:bg-background-5 py-16 md:py-20 lg:py-[100px] xl:py-[200px]">
      <div className="main-container">
        <div className="mb-10 space-y-5 text-center md:mb-[70px]">
          <RevealAnimation delay={0.2}>
            <span className="badge badge-cyan">Turn clicks into customers</span>
          </RevealAnimation>
          <div className="space-y-3">
            <RevealAnimation delay={0.3}>
              <h2>
                Data-driven insights that
                <span className="text-primary-500"> fuel growth</span>
              </h2>
            </RevealAnimation>
            <RevealAnimation delay={0.4}>
              <p>
                Until recently, the prevailing view assumed lorem ipsum was born as a nonsense text nothing Before &amp;
                After magazine.
              </p>
            </RevealAnimation>
          </div>
        </div>
        <div>
          <div className="mx-auto grid max-w-[800px] grid-cols-12 gap-y-8 xl:mx-0 xl:max-w-full xl:gap-8">
            <RevealAnimation delay={0.5}>
              <div className="col-span-12 xl:col-span-6">
                <div className="bg-secondary dark:bg-background-8 rounded-[20px] p-6 sm:p-8 md:p-[42px]">
                  <div className="mb-[53px] flex items-center justify-between">
                    <p className="text-lg leading-[27px] font-semibold text-white">User activity</p>
                    <div>
                      <svg xmlns="http://www.w3.org/2000/svg" width={6} height={30} viewBox="0 0 6 30" fill="none">
                        <path
                          d="M3 6C1.34315 6 1.24614e-06 4.65685 1.31174e-06 3C1.37734e-06 1.34315 1.34315 -2.24746e-07 3 -1.44784e-07C4.65685 -6.48221e-08 6 1.34315 6 3C6 4.65685 4.65685 6 3 6Z"
                          fill="#CED1C7"
                        />
                        <path
                          d="M3 18C1.34315 18 7.71061e-07 16.6569 8.36656e-07 15C9.02252e-07 13.3431 1.34315 12 3 12C4.65685 12 6 13.3431 6 15C6 16.6569 4.65685 18 3 18Z"
                          fill="#CED1C7"
                        />
                        <path
                          d="M3 30C1.34315 30 2.95976e-07 28.6569 3.61572e-07 27C4.27167e-07 25.3431 1.34315 24 3 24C4.65685 24 6 25.3431 6 27C6 28.6569 4.65685 30 3 30Z"
                          fill="#CED1C7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <figure className="w-full max-w-[545px]">
                      <Image src={userActivityChart} alt="user-activity" className="w-full" />
                    </figure>
                  </div>
                </div>
              </div>
            </RevealAnimation>
            <RevealAnimation delay={0.6}>
              <div className="col-span-12 xl:col-span-6">
                <div className="dark:bg-background-8 space-y-3 rounded-[20px] bg-white p-6 sm:p-8 md:p-[42px]">
                  <Progress />
                </div>
              </div>
            </RevealAnimation>
            <RevealAnimation delay={0.7} duration={0.9} offset={90}>
              <div className="col-span-12">
                <div className="bg-secondary dark:bg-linear-[0deg,rgba(0, 0, 0, 0.20)_0%,rgba(0, 0, 0, 0.20)_100%] relative z-10 grid grid-cols-12 items-center gap-y-8 overflow-hidden rounded-[20px] px-6 py-6 sm:px-8 sm:py-8 md:px-11 md:py-14 xl:gap-0">
                  <div className="absolute top-0 right-0 bottom-0 left-0 -z-10 overflow-hidden rounded-[20px]">
                    <Image src={aboutBg} alt=" about bg" className="h-full w-full object-cover" />
                  </div>
                  <div className="col-span-12 space-y-8 xl:col-span-6">
                    <p className="text-heading-5 text-accent">Custom reports forinformed decision-making</p>
                    <LinkButton
                      href="/login"
                      className="btn btn-white btn-md dark:btn-transparent hover:btn-primary mx-auto w-[90%] md:mx-0 md:w-auto">
                      Get started
                    </LinkButton>
                  </div>
                  <div className="col-span-12 xl:col-span-6">
                    <ul className="space-y-5">
                      <li className="flex items-center gap-3">
                        <span className="bg-accent/15 flex size-5 shrink-0 items-center justify-center rounded-full backdrop-blur-[15px]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={10}
                            height={8}
                            viewBox="0 0 10 8"
                            fill="none"
                            className="shrink-0">
                            <path
                              d="M9.125 1.375L3.875 6.62477L1.25 4"
                              stroke="#FCFCFC"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <p className="text-accent">Seamless crm &amp; ad platform integration</p>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="bg-accent/15 flex size-5 shrink-0 items-center justify-center rounded-full backdrop-blur-[15px]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={10}
                            height={8}
                            viewBox="0 0 10 8"
                            fill="none"
                            className="shrink-0">
                            <path
                              d="M9.125 1.375L3.875 6.62477L1.25 4"
                              stroke="#FCFCFC"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <p className="text-accent">Comprehensive analytics dashboard</p>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="bg-accent/15 flex size-5 shrink-0 items-center justify-center rounded-full backdrop-blur-[15px]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={10}
                            height={8}
                            viewBox="0 0 10 8"
                            fill="none"
                            className="shrink-0">
                            <path
                              d="M9.125 1.375L3.875 6.62477L1.25 4"
                              stroke="#FCFCFC"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <p className="text-accent">Real-time campaign monitoring</p>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="bg-accent/15 flex size-5 shrink-0 items-center justify-center rounded-full backdrop-blur-[15px]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={10}
                            height={8}
                            viewBox="0 0 10 8"
                            fill="none"
                            className="shrink-0">
                            <path
                              d="M9.125 1.375L3.875 6.62477L1.25 4"
                              stroke="#FCFCFC"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <p className="text-accent">We grasp the unique requirements of your business.</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </RevealAnimation>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feature;
